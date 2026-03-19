/**
 * Worker Pool Implementation
 * 
 * Manages a pool of worker threads for parallel task execution.
 * Supports different worker types and provides performance monitoring.
 */

import { Worker } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import type {
  WorkerTask,
  WorkerTaskResult,
  WorkerMetrics,
  WorkerPoolConfig,
  WorkerMessage,
  WorkerStatus,
  WorkerError,
  WorkerPoolResource,
  PerformanceSnapshot
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

export class WorkerPool {
  private workers: Worker[] = [];
  private workerStatuses: Map<number, WorkerStatus> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, { task: WorkerTask; startTime: number; workerId: number }> = new Map();
  private metrics: Map<number, WorkerMetrics> = new Map();
  private config: WorkerPoolConfig;
  private taskIdCounter = 0;
  private isShuttingDown = false;
  private performanceSnapshots: PerformanceSnapshot[] = [];

  constructor(config: WorkerPoolConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  /**
   * Initialize the worker pool with the configured number of workers
   */
  private async initializeWorkers(): Promise<void> {
    BrowserLogger.info("WorkerPool", "Initializing worker pool", { 
      maxWorkers: this.config.maxWorkers,
      minWorkers: this.config.minWorkers 
    });

    for (let i = 0; i < this.config.minWorkers; i++) {
      await this.createWorker(i);
    }

    // Start performance monitoring if enabled
    if (this.config.enablePerformanceMonitoring) {
      this.startPerformanceMonitoring();
    }
  }

  /**
   * Create a new worker thread
   */
  private async createWorker(workerId: number): Promise<void> {
    try {
      const worker = new Worker(`
        const { parentPort } = require('worker_threads');
        let currentTask = null;
        let taskStartTime = 0;

        parentPort.on('message', (message) => {
          switch (message.type) {
            case 'task':
              this.executeTask(message.data);
              break;
            case 'status':
              parentPort.postMessage({
                type: 'status',
                data: {
                  workerId: ${workerId},
                  status: currentTask ? 'busy' : 'idle',
                  currentTask: currentTask?.id,
                  lastHeartbeat: Date.now()
                },
                timestamp: Date.now()
              });
              break;
          }
        });

        async function executeTask(task) {
          currentTask = task;
          taskStartTime = performance.now();
          
          try {
            let result;
            switch (task.type) {
              case 'physics-update':
                result = await executePhysicsTask(task.data);
                break;
              case 'particle-update':
                result = await executeParticleTask(task.data);
                break;
              case 'render-batch':
                result = await executeRenderTask(task.data);
                break;
              default:
                throw new Error(\`Unknown task type: \${task.type}\`);
            }

            const executionTime = performance.now() - taskStartTime;
            parentPort.postMessage({
              type: 'result',
              data: {
                taskId: task.id,
                success: true,
                data: result,
                executionTime,
                workerId: ${workerId}
              },
              timestamp: Date.now()
            });
          } catch (error) {
            const executionTime = performance.now() - taskStartTime;
            parentPort.postMessage({
              type: 'error',
              data: {
                taskId: task.id,
                success: false,
                error: error.message,
                executionTime,
                workerId: ${workerId}
              },
              timestamp: Date.now()
            });
          } finally {
            currentTask = null;
          }
        }

        // Task execution functions (simplified for demonstration)
        async function executePhysicsTask(data) {
          // Parallel physics simulation
          const { entities, deltaTime, substeps } = data;
          const dt = deltaTime / substeps;
          
          for (let step = 0; step < substeps; step++) {
            for (const entity of entities) {
              if (entity.velocity && entity.position) {
                entity.position.x += entity.velocity.x * dt;
                entity.position.y += entity.velocity.y * dt;
              }
            }
          }
          
          return { entities, updated: true };
        }

        async function executeParticleTask(data) {
          // Parallel particle system update
          const { particles, deltaTime, forces } = data;
          
          for (const particle of particles) {
            if (particle.position && particle.velocity) {
              // Apply forces
              for (const force of forces) {
                particle.velocity.x += force.x * deltaTime;
                particle.velocity.y += force.y * deltaTime;
              }
              
              // Update position
              particle.position.x += particle.velocity.x * deltaTime;
              particle.position.y += particle.velocity.y * deltaTime;
              
              // Update lifetime
              if (particle.lifetime !== undefined) {
                particle.lifetime -= deltaTime;
              }
            }
          }
          
          return { particles, updated: true };
        }

        async function executeRenderTask(data) {
          // Parallel render batch preparation
          const { renderables, viewport, camera } = data;
          
          // Sort renderables by depth
          renderables.sort((a, b) => (a.depth || 0) - (b.depth || 0));
          
          // Cull objects outside viewport
          const visible = renderables.filter(obj => {
            if (!obj.position) return true;
            return obj.position.x >= viewport.x && 
                   obj.position.x <= viewport.x + viewport.width &&
                   obj.position.y >= viewport.y && 
                   obj.position.y <= viewport.y + viewport.height;
          });
          
          return { renderables: visible, culled: renderables.length - visible.length };
        }
      `, {
        eval: true,
        resourceLimits: {
          maxOldGenerationSizeMb: this.config.maxMemoryUsage,
        }
      });

      worker.on('message', (message: WorkerMessage) => {
        this.handleWorkerMessage(workerId, message);
      });

      worker.on('error', (error: Error) => {
        BrowserLogger.error("WorkerPool", `Worker ${workerId} error`, error);
        this.handleWorkerError(workerId, error);
      });

      worker.on('exit', (code) => {
        BrowserLogger.warn("WorkerPool", `Worker ${workerId} exited`, { code });
        this.handleWorkerExit(workerId, code);
      });

      this.workers.push(worker);
      this.workerStatuses.set(workerId, {
        workerId,
        status: 'idle',
        lastHeartbeat: Date.now()
      });

      this.metrics.set(workerId, {
        workerId,
        tasksCompleted: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastActivity: Date.now()
      });

      BrowserLogger.debug("WorkerPool", `Worker ${workerId} created successfully`);

    } catch (error) {
      BrowserLogger.error("WorkerPool", `Failed to create worker ${workerId}`, error);
      throw error;
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(workerId: number, message: WorkerMessage): void {
    switch (message.type) {
      case 'result':
        this.handleTaskResult(message.data as WorkerTaskResult);
        break;
      case 'error':
        this.handleTaskError(message.data);
        break;
      case 'status':
        this.workerStatuses.set(workerId, message.data);
        break;
      case 'metrics':
        this.updateWorkerMetrics(workerId, message.data);
        break;
    }
  }

  /**
   * Handle successful task completion
   */
  private handleTaskResult(result: WorkerTaskResult): void {
    const activeTask = this.activeTasks.get(result.taskId);
    if (!activeTask) {
      BrowserLogger.warn("WorkerPool", `Received result for unknown task: ${result.taskId}`);
      return;
    }

    // Update metrics
    const metrics = this.metrics.get(result.workerId);
    if (metrics) {
      metrics.tasksCompleted++;
      metrics.totalExecutionTime += result.executionTime;
      metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.tasksCompleted;
      metrics.lastActivity = Date.now();
      metrics.currentTask = undefined;
    }

    // Update worker status
    const status = this.workerStatuses.get(result.workerId);
    if (status) {
      status.status = 'idle';
      status.currentTask = undefined;
    }

    // Remove from active tasks
    this.activeTasks.delete(result.taskId);

    // Process next task in queue
    this.processTaskQueue();

    BrowserLogger.debug("WorkerPool", `Task ${result.taskId} completed`, {
      workerId: result.workerId,
      executionTime: result.executionTime
    });
  }

  /**
   * Handle task execution errors
   */
  private handleTaskError(error: WorkerError): void {
    const activeTask = this.activeTasks.get(error.taskId);
    if (!activeTask) {
      BrowserLogger.warn("WorkerPool", `Received error for unknown task: ${error.taskId}`);
      return;
    }

    // Update worker status
    const status = this.workerStatuses.get(error.workerId);
    if (status) {
      status.status = 'error';
    }

    // Remove from active tasks
    this.activeTasks.delete(error.taskId);

    BrowserLogger.error("WorkerPool", `Task ${error.taskId} failed`, error);

    // Process next task
    this.processTaskQueue();
  }

  /**
   * Submit a task to the worker pool
   */
  public submitTask(task: WorkerTask): Promise<WorkerTaskResult> {
    return new Promise((resolve, reject) => {
      // Add unique ID if not provided
      if (!task.id) {
        task.id = `task-${++this.taskIdCounter}`;
      }

      // Set creation time if not provided
      if (!task.createdAt) {
        task.createdAt = Date.now();
      }

      // Store promise resolve/reject for later
      (task as any).resolve = resolve;
      (task as any).reject = reject;

      // Add to queue
      this.taskQueue.push(task);

      // Process queue immediately
      this.processTaskQueue();

      // Set timeout if specified
      if (task.timeout) {
        setTimeout(() => {
          if (this.activeTasks.has(task.id)) {
            const workerError: WorkerError = new Error(`Task ${task.id} timed out`) as WorkerError;
            workerError.workerId = -1;
            workerError.taskId = task.id;
            workerError.errorType = 'timeout';
            workerError.recoverable = true;
            this.handleTaskError(workerError);
            reject(workerError);
          }
        }, task.timeout);
      }
    });
  }

  /**
   * Process the task queue and assign tasks to available workers
   */
  private processTaskQueue(): void {
    if (this.isShuttingDown || this.taskQueue.length === 0) {
      return;
    }

    // Find available workers
    const availableWorkers = this.workers.filter((_, index) => {
      const status = this.workerStatuses.get(index);
      return status?.status === 'idle';
    });

    if (availableWorkers.length === 0) {
      // Consider scaling up if needed
      this.scaleWorkers();
      return;
    }

    // Assign tasks to available workers
    while (this.taskQueue.length > 0 && availableWorkers.length > 0) {
      const worker = availableWorkers.pop();
      if (!worker) break;

      const task = this.taskQueue.shift();
      if (!task) break;

      this.assignTaskToWorker(worker, task);
    }
  }

  /**
   * Assign a task to a specific worker
   */
  private assignTaskToWorker(worker: Worker, task: WorkerTask): void {
    const workerId = this.workers.indexOf(worker);
    
    // Update worker status
    const status = this.workerStatuses.get(workerId);
    if (status) {
      status.status = 'busy';
      status.currentTask = task.id;
    }

    // Track active task
    this.activeTasks.set(task.id, {
      task,
      startTime: performance.now(),
      workerId
    });

    // Send task to worker
    worker.postMessage({
      type: 'task',
      data: task,
      timestamp: Date.now()
    });

    BrowserLogger.debug("WorkerPool", `Task ${task.id} assigned to worker ${workerId}`);
  }

  /**
   * Scale workers up or down based on load
   */
  private scaleWorkers(): void {
    const currentWorkerCount = this.workers.length;
    const queueLength = this.taskQueue.length;
    const busyWorkers = Array.from(this.workerStatuses.values())
      .filter(status => status.status === 'busy').length;

    // Scale up if queue is backing up and we have capacity
    if (queueLength > 2 && currentWorkerCount < this.config.maxWorkers) {
      const newWorkerId = currentWorkerCount;
      this.createWorker(newWorkerId);
      BrowserLogger.info("WorkerPool", `Scaling up workers`, { 
        from: currentWorkerCount, 
        to: currentWorkerCount + 1 
      });
    }

    // Scale down if workers are idle and we have more than minimum
    if (queueLength === 0 && busyWorkers === 0 && currentWorkerCount > this.config.minWorkers) {
      const workerToRemove = this.workers.pop();
      if (workerToRemove) {
        workerToRemove.terminate();
        const removedId = this.workers.length;
        this.workerStatuses.delete(removedId);
        this.metrics.delete(removedId);
        BrowserLogger.info("WorkerPool", `Scaling down workers`, { 
          from: currentWorkerCount, 
          to: currentWorkerCount - 1 
        });
      }
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        workerMetrics: Array.from(this.metrics.values()),
        memoryUsage: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
        },
        taskQueue: {
          pending: this.taskQueue.length,
          processing: this.activeTasks.size,
          completed: Array.from(this.metrics.values())
            .reduce((sum, metric) => sum + metric.tasksCompleted, 0),
          failed: 0 // TODO: Track failed tasks
        }
      };

      this.performanceSnapshots.push(snapshot);

      // Keep only last 100 snapshots
      if (this.performanceSnapshots.length > 100) {
        this.performanceSnapshots = this.performanceSnapshots.slice(-100);
      }
    }, 1000); // Update every second
  }

  /**
   * Get current worker pool status
   */
  public getResource(): WorkerPoolResource {
    return {
      availableWorkers: this.workers.length - this.activeTasks.size,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      completedTasks: Array.from(this.metrics.values())
        .reduce((sum, metric) => sum + metric.tasksCompleted, 0),
      performanceMetrics: Array.from(this.metrics.values()),
      config: this.config
    };
  }

  /**
   * Get performance snapshots
   */
  public getPerformanceSnapshots(): PerformanceSnapshot[] {
    return this.performanceSnapshots;
  }

  /**
   * Gracefully shutdown the worker pool
   */
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    BrowserLogger.info("WorkerPool", "Shutting down worker pool");

    // Wait for active tasks to complete or timeout
    const shutdownTimeout = 5000; // 5 seconds
    const startTime = Date.now();

    while (this.activeTasks.size > 0 && Date.now() - startTime < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Terminate all workers
    const terminationPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.terminate();
        resolve();
      });
    });

    await Promise.all(terminationPromises);

    BrowserLogger.info("WorkerPool", "Worker pool shutdown complete");
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(workerId: number, error: Error): void {
    const status = this.workerStatuses.get(workerId);
    if (status) {
      status.status = 'error';
    }

    BrowserLogger.error("WorkerPool", `Worker ${workerId} encountered error`, error);
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: number, code: number): void {
    this.workerStatuses.delete(workerId);
    this.metrics.delete(workerId);
    
    // Remove from workers array
    const workerIndex = this.workers.findIndex((_, index) => index === workerId);
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1);
    }

    BrowserLogger.warn("WorkerPool", `Worker ${workerId} exited with code ${code}`);
  }

  /**
   * Update worker metrics
   */
  private updateWorkerMetrics(workerId: number, metrics: Partial<WorkerMetrics>): void {
    const existing = this.metrics.get(workerId);
    if (existing) {
      Object.assign(existing, metrics);
    }
  }
}

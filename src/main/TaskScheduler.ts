/**
 * Task Scheduler
 * 
 * Coordinates and prioritizes tasks across multiple worker pools
 * for optimal resource utilization and performance.
 */

import type { 
  WorkerTask, 
  WorkerTaskResult,
  WorkerPoolConfig,
  TaskPriority
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface ScheduledTask extends WorkerTask {
  scheduledAt: number;
  retryCount: number;
  maxRetries: number;
  dependencies: string[];
}

interface TaskQueue {
  high: ScheduledTask[];
  medium: ScheduledTask[];
  low: ScheduledTask[];
}

interface SchedulerMetrics {
  totalTasksScheduled: number;
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  queueLength: number;
}

/**
 * Task Scheduler
 * 
 * Manages task distribution across multiple worker pools with priority
 * queuing, dependency resolution, and load balancing.
 */
export class TaskScheduler {
  private taskQueue: TaskQueue = {
    high: [],
    medium: [],
    low: []
  };
  private runningTasks: Map<string, ScheduledTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private workerPools: Map<string, any> = new Map();
  private metrics: SchedulerMetrics = {
    totalTasksScheduled: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    averageExecutionTime: 0,
    queueLength: 0
  };
  private isRunning = false;

  constructor() {
    BrowserLogger.info("TaskScheduler", "Task scheduler initialized");
  }

  /**
   * Register a worker pool with the scheduler
   */
  public registerWorkerPool(name: string, workerPool: any): void {
    this.workerPools.set(name, workerPool);
    BrowserLogger.info("TaskScheduler", `Worker pool registered: ${name}`);
  }

  /**
   * Schedule a task for execution
   */
  public scheduleTask(task: ScheduledTask): void {
    // Validate task
    if (!task.id) {
      throw new Error("Task must have an ID");
    }

    if (this.completedTasks.has(task.id)) {
      BrowserLogger.warn("TaskScheduler", `Task ${task.id} already completed`);
      return;
    }

    // Set defaults
    task.scheduledAt = Date.now();
    task.retryCount = task.retryCount || 0;
    task.maxRetries = task.maxRetries || 3;
    task.dependencies = task.dependencies || [];

    // Check dependencies
    if (!this.areDependenciesMet(task)) {
      BrowserLogger.debug("TaskScheduler", `Task ${task.id} dependencies not met, queuing`);
    }

    // Add to appropriate priority queue
    this.addToQueue(task);
    this.metrics.totalTasksScheduled++;
    this.updateMetrics();

    BrowserLogger.debug("TaskScheduler", `Task scheduled: ${task.id} (${task.priority})`);
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) {
      BrowserLogger.warn("TaskScheduler", "Scheduler already running");
      return;
    }

    this.isRunning = true;
    BrowserLogger.info("TaskScheduler", "Task scheduler started");
    
    this.processQueue();
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      BrowserLogger.warn("TaskScheduler", "Scheduler not running");
      return;
    }

    this.isRunning = false;
    BrowserLogger.info("TaskScheduler", "Task scheduler stopped");
  }

  /**
   * Get current scheduler metrics
   */
  public getMetrics(): SchedulerMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    high: number;
    medium: number;
    low: number;
    running: number;
  } {
    return {
      high: this.taskQueue.high.length,
      medium: this.taskQueue.medium.length,
      low: this.taskQueue.low.length,
      running: this.runningTasks.size
    };
  }

  /**
   * Cancel a task
   */
  public cancelTask(taskId: string): boolean {
    // Remove from queues
    for (const priority of ['high', 'medium', 'low'] as const) {
      const index = this.taskQueue[priority].findIndex(task => task.id === taskId);
      if (index !== -1) {
        const task = this.taskQueue[priority].splice(index, 1)[0];
        BrowserLogger.info("TaskScheduler", `Task cancelled: ${task.id}`);
        return true;
      }
    }

    // Check if currently running
    if (this.runningTasks.has(taskId)) {
      BrowserLogger.warn("TaskScheduler", `Cannot cancel running task: ${taskId}`);
      return false;
    }

    return false;
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get next task
        const task = this.getNextTask();
        if (!task) {
          // No tasks available, wait a bit
          await this.sleep(10);
          continue;
        }

        // Execute task
        await this.executeTask(task);
        
      } catch (error) {
        BrowserLogger.error("TaskScheduler", "Error processing queue", error);
        await this.sleep(100); // Wait longer on error
      }
    }
  }

  /**
   * Get the next task to execute
   */
  private getNextTask(): ScheduledTask | null {
    // Check high priority first
    for (const task of this.taskQueue.high) {
      if (this.areDependenciesMet(task) && this.canExecuteTask(task)) {
        this.taskQueue.high.shift();
        return task;
      }
    }

    // Then medium priority
    for (const task of this.taskQueue.medium) {
      if (this.areDependenciesMet(task) && this.canExecuteTask(task)) {
        this.taskQueue.medium.shift();
        return task;
      }
    }

    // Finally low priority
    for (const task of this.taskQueue.low) {
      if (this.areDependenciesMet(task) && this.canExecuteTask(task)) {
        this.taskQueue.low.shift();
        return task;
      }
    }

    return null;
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: ScheduledTask): boolean {
    return task.dependencies.every(depId => this.completedTasks.has(depId));
  }

  /**
   * Check if task can be executed (resource availability)
   */
  private canExecuteTask(task: ScheduledTask): boolean {
    // For now, just check if we have available worker pools
    // In a real implementation, this would check resource constraints
    return this.workerPools.size > 0;
  }

  /**
   * Execute a task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    const startTime = performance.now();
    this.runningTasks.set(task.id, task);

    try {
      // Select appropriate worker pool
      const workerPool = this.selectWorkerPool(task);
      if (!workerPool) {
        throw new Error(`No suitable worker pool for task: ${task.id}`);
      }

      BrowserLogger.debug("TaskScheduler", `Executing task: ${task.id} on ${task.type}`);

      // Submit task to worker pool
      const result = await workerPool.submitTask(task);

      // Handle result
      if (result.success) {
        this.completedTasks.add(task.id);
        this.metrics.tasksCompleted++;
        BrowserLogger.debug("TaskScheduler", `Task completed: ${task.id}`);
      } else {
        await this.handleTaskFailure(task, result.error);
      }

    } catch (error) {
      await this.handleTaskFailure(task, error);
    } finally {
      this.runningTasks.delete(task.id);
      
      // Update metrics
      const executionTime = performance.now() - startTime;
      this.updateAverageExecutionTime(executionTime);
    }
  }

  /**
   * Select appropriate worker pool for a task
   */
  private selectWorkerPool(task: ScheduledTask): any {
    // Simple selection logic - in a real implementation this would be more sophisticated
    switch (task.type) {
      case 'physics-update':
        return this.workerPools.get('physics');
      case 'particle-update':
        return this.workerPools.get('particles');
      case 'render-batch':
        return this.workerPools.get('rendering');
      default:
        // Return first available pool
        return this.workerPools.values().next().value;
    }
  }

  /**
   * Handle task failure
   */
  private async handleTaskFailure(task: ScheduledTask, error: any): Promise<void> {
    task.retryCount++;
    
    if (task.retryCount < task.maxRetries) {
      BrowserLogger.warn("TaskScheduler", `Task failed, retrying: ${task.id} (${task.retryCount}/${task.maxRetries})`);
      
      // Exponential backoff
      const delay = Math.pow(2, task.retryCount) * 100;
      await this.sleep(delay);
      
      // Reschedule task
      this.addToQueue(task);
    } else {
      BrowserLogger.error("TaskScheduler", `Task failed permanently: ${task.id}`, error);
      this.metrics.tasksFailed++;
    }
  }

  /**
   * Add task to appropriate queue
   */
  private addToQueue(task: ScheduledTask): void {
    switch (task.priority) {
      case 'high':
        this.taskQueue.high.push(task);
        break;
      case 'medium':
        this.taskQueue.medium.push(task);
        break;
      case 'low':
        this.taskQueue.low.push(task);
        break;
      default:
        this.taskQueue.medium.push(task); // Default to medium
    }
  }

  /**
   * Update scheduler metrics
   */
  private updateMetrics(): void {
    this.metrics.queueLength = 
      this.taskQueue.high.length + 
      this.taskQueue.medium.length + 
      this.taskQueue.low.length;
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(executionTime: number): void {
    const totalTasks = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    if (totalTasks === 0) {
      this.metrics.averageExecutionTime = executionTime;
    } else {
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime * (totalTasks - 1) + executionTime) / totalTasks;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear completed tasks (for memory management)
   */
  public clearCompletedTasks(): void {
    const oldSize = this.completedTasks.size;
    this.completedTasks.clear();
    BrowserLogger.info("TaskScheduler", `Cleared ${oldSize} completed tasks`);
  }

  /**
   * Get task statistics
   */
  public getTaskStatistics(): {
    total: number;
    completed: number;
    failed: number;
    running: number;
    queued: number;
    successRate: number;
  } {
    const total = this.metrics.totalTasksScheduled;
    const completed = this.metrics.tasksCompleted;
    const failed = this.metrics.tasksFailed;
    const running = this.runningTasks.size;
    const queued = this.metrics.queueLength;
    const successRate = total > 0 ? (completed / (completed + failed)) * 100 : 0;

    return {
      total,
      completed,
      failed,
      running,
      queued,
      successRate
    };
  }
}

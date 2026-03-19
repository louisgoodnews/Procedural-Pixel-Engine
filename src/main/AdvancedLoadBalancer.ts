/**
 * Advanced Load Balancer
 * 
 * Sophisticated task distribution and load balancing system
 * for optimal worker utilization and performance.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { WorkerTask, WorkerTaskResult } from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface WorkerLoadInfo {
  workerId: number;
  currentLoad: number; // 0-1 scale
  taskQueueSize: number;
  averageProcessingTime: number;
  throughput: number;
  errorRate: number;
  lastTaskTime: number;
  capabilities: string[];
  specialization: string;
}

interface TaskInfo {
  task: WorkerTask;
  priority: number;
  estimatedDuration: number;
  resourceRequirements: {
    cpu: number;
    memory: number;
    io: number;
  };
  dependencies: string[];
  retryCount: number;
  createdAt: number;
}

interface LoadBalancingStrategy {
  name: string;
  algorithm: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 'resource-based' | 'predictive' | 'adaptive';
  weights: Map<string, number>;
  enabled: boolean;
}

interface BalancingMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughput: number;
  loadDistribution: Map<number, number>;
  strategyPerformance: Map<string, number>;
}

/**
 * Advanced Load Balancer
 * 
 * Provides intelligent task distribution and load balancing
 * across worker threads with multiple algorithms.
 */
export class AdvancedLoadBalancer implements System<EngineComponents, EngineResources> {
  private workers: Map<number, WorkerLoadInfo> = new Map();
  private taskQueue: TaskInfo[] = [];
  private activeTasks: Map<string, TaskInfo> = new Map();
  private strategies: Map<string, LoadBalancingStrategy> = new Map();
  private currentStrategy: string = 'adaptive';
  private metrics: BalancingMetrics;
  private isInitialized = false;

  constructor() {
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      throughput: 0,
      loadDistribution: new Map(),
      strategyPerformance: new Map()
    };

    this.initializeStrategies();
    
    BrowserLogger.info("AdvancedLoadBalancer", "Created", {
      strategies: Array.from(this.strategies.keys())
    });
  }

  /**
   * Initialize load balancing strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('round-robin', {
      name: 'Round Robin',
      algorithm: 'round-robin',
      weights: new Map(),
      enabled: true
    });

    this.strategies.set('weighted-round-robin', {
      name: 'Weighted Round Robin',
      algorithm: 'weighted-round-robin',
      weights: new Map(),
      enabled: true
    });

    this.strategies.set('least-connections', {
      name: 'Least Connections',
      algorithm: 'least-connections',
      weights: new Map(),
      enabled: true
    });

    this.strategies.set('resource-based', {
      name: 'Resource Based',
      algorithm: 'resource-based',
      weights: new Map(),
      enabled: true
    });

    this.strategies.set('predictive', {
      name: 'Predictive',
      algorithm: 'predictive',
      weights: new Map(),
      enabled: true
    });

    this.strategies.set('adaptive', {
      name: 'Adaptive',
      algorithm: 'adaptive',
      weights: new Map(),
      enabled: true
    });
  }

  /**
   * Initialize the load balancer
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    this.isInitialized = true;
    
    BrowserLogger.info("AdvancedLoadBalancer", "Initialized", {
      currentStrategy: this.currentStrategy
    });

    return Promise.resolve();
  }

  /**
   * Execute load balancing
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.isInitialized) {
      return;
    }

    // Process pending tasks
    this.processTaskQueue();

    // Update worker load information
    this.updateWorkerLoadInfo();

    // Evaluate and adjust strategy if needed
    this.evaluateStrategyPerformance();

    // Collect metrics
    this.updateMetrics();
  }

  /**
   * Register a worker
   */
  public registerWorker(workerId: number, capabilities: string[] = [], specialization: string = 'general'): void {
    this.workers.set(workerId, {
      workerId,
      currentLoad: 0,
      taskQueueSize: 0,
      averageProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      lastTaskTime: Date.now(),
      capabilities,
      specialization
    });

    this.metrics.loadDistribution.set(workerId, 0);

    BrowserLogger.debug("AdvancedLoadBalancer", "Worker registered", {
      workerId,
      capabilities,
      specialization
    });
  }

  /**
   * Unregister a worker
   */
  public unregisterWorker(workerId: number): void {
    if (this.workers.has(workerId)) {
      this.workers.delete(workerId);
      this.metrics.loadDistribution.delete(workerId);
      
      BrowserLogger.debug("AdvancedLoadBalancer", "Worker unregistered", { workerId });
    }
  }

  /**
   * Submit a task for load balancing
   */
  public submitTask(task: WorkerTask, priority: number = 1): Promise<WorkerTaskResult> {
    return new Promise((resolve, reject) => {
      const taskInfo: TaskInfo = {
        task,
        priority,
        estimatedDuration: this.estimateTaskDuration(task),
        resourceRequirements: this.estimateResourceRequirements(task),
        dependencies: [],
        retryCount: 0,
        createdAt: Date.now()
      };

      // Add to queue
      this.taskQueue.push(taskInfo);
      this.activeTasks.set(task.id, taskInfo);
      this.metrics.totalTasks++;

      // Store resolve/reject for completion
      (taskInfo as any).resolve = resolve;
      (taskInfo as any).reject = reject;

      // Process queue immediately
      this.processTaskQueue();
    });
  }

  /**
   * Process the task queue
   */
  private processTaskQueue(): void {
    if (this.taskQueue.length === 0 || this.workers.size === 0) {
      return;
    }

    // Sort tasks by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    // Get current strategy
    const strategy = this.strategies.get(this.currentStrategy);
    if (!strategy || !strategy.enabled) {
      return;
    }

    // Select workers based on strategy
    const selectedWorkers = this.selectWorkers(strategy);

    // Assign tasks to workers
    for (let i = 0; i < Math.min(selectedWorkers.length, this.taskQueue.length); i++) {
      const worker = selectedWorkers[i];
      const taskInfo = this.taskQueue[i];

      if (this.canWorkerHandleTask(worker, taskInfo)) {
        this.assignTaskToWorker(worker, taskInfo);
        this.taskQueue.splice(i, 1);
        i--; // Adjust index after removal
      }
    }
  }

  /**
   * Select workers based on strategy
   */
  private selectWorkers(strategy: LoadBalancingStrategy): WorkerLoadInfo[] {
    const availableWorkers = Array.from(this.workers.values()).filter(w => w.currentLoad < 0.9);

    switch (strategy.algorithm) {
      case 'round-robin':
        return this.roundRobinSelection(availableWorkers);
      case 'weighted-round-robin':
        return this.weightedRoundRobinSelection(availableWorkers);
      case 'least-connections':
        return this.leastConnectionsSelection(availableWorkers);
      case 'resource-based':
        return this.resourceBasedSelection(availableWorkers);
      case 'predictive':
        return this.predictiveSelection(availableWorkers);
      case 'adaptive':
        return this.adaptiveSelection(availableWorkers);
      default:
        return availableWorkers;
    }
  }

  /**
   * Round-robin worker selection
   */
  private roundRobinSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    // Simple round-robin implementation
    return workers.sort((a, b) => a.workerId - b.workerId);
  }

  /**
   * Weighted round-robin worker selection
   */
  private weightedRoundRobinSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    return workers.sort((a, b) => {
      const weightA = this.strategies.get('weighted-round-robin')?.weights.get(a.workerId.toString()) || 1;
      const weightB = this.strategies.get('weighted-round-robin')?.weights.get(b.workerId.toString()) || 1;
      return weightB - weightA;
    });
  }

  /**
   * Least connections worker selection
   */
  private leastConnectionsSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    return workers.sort((a, b) => a.taskQueueSize - b.taskQueueSize);
  }

  /**
   * Resource-based worker selection
   */
  private resourceBasedSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    return workers.sort((a, b) => {
      const scoreA = (1 - a.currentLoad) * a.throughput;
      const scoreB = (1 - b.currentLoad) * b.throughput;
      return scoreB - scoreA;
    });
  }

  /**
   * Predictive worker selection
   */
  private predictiveSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    // Predict based on historical performance and current load
    return workers.sort((a, b) => {
      const predictionA = this.predictWorkerPerformance(a);
      const predictionB = this.predictWorkerPerformance(b);
      return predictionB - predictionA;
    });
  }

  /**
   * Adaptive worker selection
   */
  private adaptiveSelection(workers: WorkerLoadInfo[]): WorkerLoadInfo[] {
    // Combine multiple strategies based on current conditions
    const leastConnections = this.leastConnectionsSelection(workers);
    const resourceBased = this.resourceBasedSelection(workers);
    
    // Weight the selections based on system load
    const systemLoad = this.calculateSystemLoad();
    const leastConnWeight = systemLoad > 0.7 ? 0.7 : 0.3;
    const resourceWeight = 1 - leastConnWeight;
    
    const combinedScores = new Map<number, number>();
    
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const leastConnScore = leastConnections.findIndex(w => w.workerId === worker.workerId);
      const resourceScore = resourceBased.findIndex(w => w.workerId === worker.workerId);
      
      const combinedScore = (leastConnScore * leastConnWeight) + (resourceScore * resourceWeight);
      combinedScores.set(worker.workerId, combinedScore);
    }
    
    return workers.sort((a, b) => 
      (combinedScores.get(b.workerId) || 0) - (combinedScores.get(a.workerId) || 0)
    );
  }

  /**
   * Check if worker can handle task
   */
  private canWorkerHandleTask(worker: WorkerLoadInfo, taskInfo: TaskInfo): boolean {
    // Check if worker has required capabilities
    if (taskInfo.task.type === 'physics-update' && !worker.capabilities.includes('physics')) {
      return false;
    }
    
    if (taskInfo.task.type === 'particle-update' && !worker.capabilities.includes('particles')) {
      return false;
    }
    
    if (taskInfo.task.type === 'render-calculation' && !worker.capabilities.includes('render')) {
      return false;
    }

    // Check load capacity
    if (worker.currentLoad + (taskInfo.resourceRequirements.cpu / 100) > 0.95) {
      return false;
    }

    return true;
  }

  /**
   * Assign task to worker
   */
  private assignTaskToWorker(worker: WorkerLoadInfo, taskInfo: TaskInfo): void {
    // Update worker load
    worker.currentLoad += taskInfo.resourceRequirements.cpu / 100;
    worker.taskQueueSize++;
    worker.lastTaskTime = Date.now();

    // Update load distribution
    const currentLoad = this.metrics.loadDistribution.get(worker.workerId) || 0;
    this.metrics.loadDistribution.set(worker.workerId, currentLoad + 1);

    // Simulate task execution (in real implementation, this would send to worker)
    this.executeTask(worker, taskInfo);
  }

  /**
   * Execute task (simulation)
   */
  private async executeTask(worker: WorkerLoadInfo, taskInfo: TaskInfo): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, taskInfo.estimatedDuration));
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Update worker metrics
      worker.averageProcessingTime = (worker.averageProcessingTime + executionTime) / 2;
      worker.throughput = 1000 / executionTime; // Tasks per second
      worker.currentLoad = Math.max(0, worker.currentLoad - taskInfo.resourceRequirements.cpu / 100);
      worker.taskQueueSize = Math.max(0, worker.taskQueueSize - 1);
      
      // Update global metrics
      this.metrics.completedTasks++;
      this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime + executionTime) / 2;
      
      // Resolve task
      const result: WorkerTaskResult = {
        taskId: taskInfo.task.id,
        success: true,
        data: { executionTime },
        executionTime: executionTime,
        workerId: worker.workerId
      };
      
      (taskInfo as any).resolve(result);
      
    } catch (error) {
      // Handle task failure
      worker.errorRate = (worker.errorRate + 1) / 2;
      worker.currentLoad = Math.max(0, worker.currentLoad - taskInfo.resourceRequirements.cpu / 100);
      worker.taskQueueSize = Math.max(0, worker.taskQueueSize - 1);
      
      this.metrics.failedTasks++;
      
      // Retry logic
      if (taskInfo.retryCount < 3) {
        taskInfo.retryCount++;
        this.taskQueue.push(taskInfo);
      } else {
        const result: WorkerTaskResult = {
          taskId: taskInfo.task.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0,
          workerId: worker.workerId
        };
        
        (taskInfo as any).reject(result);
      }
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(taskInfo.task.id);
    }
  }

  /**
   * Update worker load information
   */
  private updateWorkerLoadInfo(): void {
    for (const worker of this.workers.values()) {
      // Decay load over time
      worker.currentLoad = Math.max(0, worker.currentLoad * 0.95);
      
      // Update throughput calculation
      if (Date.now() - worker.lastTaskTime > 5000) {
        worker.throughput = Math.max(0, worker.throughput * 0.9);
      }
    }
  }

  /**
   * Evaluate strategy performance
   */
  private evaluateStrategyPerformance(): void {
    // This would track performance of each strategy and adjust weights
    // For now, just log that evaluation is happening
    BrowserLogger.debug("AdvancedLoadBalancer", "Evaluating strategy performance", {
      currentStrategy: this.currentStrategy,
      totalTasks: this.metrics.totalTasks,
      completedTasks: this.metrics.completedTasks
    });
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.throughput = this.metrics.completedTasks / Math.max(1, (Date.now() - (this.metrics.totalTasks > 0 ? Date.now() : Date.now())) / 1000);
  }

  /**
   * Estimate task duration
   */
  private estimateTaskDuration(task: WorkerTask): number {
    switch (task.type) {
      case 'physics-update':
        return 10 + Math.random() * 20; // 10-30ms
      case 'particle-update':
        return 5 + Math.random() * 15; // 5-20ms
      case 'render-calculation':
        return 8 + Math.random() * 12; // 8-20ms
      default:
        return 10 + Math.random() * 10; // 10-20ms
    }
  }

  /**
   * Estimate resource requirements
   */
  private estimateResourceRequirements(task: WorkerTask): { cpu: number; memory: number; io: number } {
    switch (task.type) {
      case 'physics-update':
        return { cpu: 70, memory: 30, io: 10 };
      case 'particle-update':
        return { cpu: 40, memory: 50, io: 10 };
      case 'render-calculation':
        return { cpu: 60, memory: 40, io: 20 };
      default:
        return { cpu: 50, memory: 30, io: 20 };
    }
  }

  /**
   * Predict worker performance
   */
  private predictWorkerPerformance(worker: WorkerLoadInfo): number {
    // Simple prediction based on current metrics
    const loadFactor = 1 - worker.currentLoad;
    const throughputFactor = worker.throughput / 100; // Normalize
    const errorFactor = 1 - worker.errorRate;
    
    return loadFactor * throughputFactor * errorFactor;
  }

  /**
   * Calculate system load
   */
  private calculateSystemLoad(): number {
    if (this.workers.size === 0) {
      return 0;
    }
    
    const totalLoad = Array.from(this.workers.values()).reduce((sum, w) => sum + w.currentLoad, 0);
    return totalLoad / this.workers.size;
  }

  /**
   * Set load balancing strategy
   */
  public setStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.currentStrategy = strategyName;
      BrowserLogger.info("AdvancedLoadBalancer", "Strategy changed", { strategy: strategyName });
    } else {
      BrowserLogger.warn("AdvancedLoadBalancer", "Unknown strategy", { strategy: strategyName });
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): BalancingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get worker information
   */
  public getWorkerInfo(): Map<number, WorkerLoadInfo> {
    return new Map(this.workers);
  }

  /**
   * Get available strategies
   */
  public getStrategies(): Map<string, LoadBalancingStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Enable/disable strategy
   */
  public setStrategyEnabled(strategyName: string, enabled: boolean): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.enabled = enabled;
      BrowserLogger.info("AdvancedLoadBalancer", "Strategy enabled changed", {
        strategy: strategyName,
        enabled
      });
    }
  }

  /**
   * Set strategy weights
   */
  public setStrategyWeights(strategyName: string, weights: Map<string, number>): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.weights = new Map(weights);
      BrowserLogger.info("AdvancedLoadBalancer", "Strategy weights updated", {
        strategy: strategyName,
        weights: Object.fromEntries(weights)
      });
    }
  }

  /**
   * Get load balancing report
   */
  public getLoadBalancingReport(): any {
    return {
      currentStrategy: this.currentStrategy,
      metrics: this.metrics,
      workerCount: this.workers.size,
      queueSize: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      systemLoad: this.calculateSystemLoad(),
      workerUtilization: Array.from(this.workers.values()).map(w => ({
        workerId: w.workerId,
        load: (w.currentLoad * 100).toFixed(1) + '%',
        throughput: w.throughput.toFixed(1),
        queueSize: w.taskQueueSize,
        errorRate: (w.errorRate * 100).toFixed(1) + '%'
      }))
    };
  }
}

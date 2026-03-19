/**
 * Multithreading Performance Profiler
 * 
 * Provides real-time performance monitoring for worker threads and parallel systems.
 * Tracks CPU usage, memory consumption, task distribution, and system efficiency.
 */

import { performance } from "node:perf_hooks";
import type { 
  WorkerMetrics, 
  WorkerPoolResource, 
  SharedMemoryResource,
  PerformanceSnapshot,
  WorkerStatus
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  averageTaskTime: number;
  throughput: number;
  errorRate: number;
}

interface WorkerPerformanceData {
  workerId: number;
  status: WorkerStatus;
  metrics: WorkerMetrics;
  recentTasks: Array<{
    id: string;
    type: string;
    executionTime: number;
    timestamp: number;
    success: boolean;
  }>;
  performanceHistory: Array<{
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    taskCount: number;
  }>;
}

/**
 * Multithreading Performance Profiler
 */
export class MultithreadingProfiler {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateInterval = 1000; // 1 second
  private maxHistorySize = 300; // 5 minutes at 1-second intervals
  
  private workerData = new Map<number, WorkerPerformanceData>();
  private systemMetrics: SystemMetrics[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  
  private lastUpdateTime = 0;
  private totalTasksProcessed = 0;
  private totalErrors = 0;
  
  constructor() {
    BrowserLogger.info("MultithreadingProfiler", "Initialized");
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring(updateInterval: number = 1000): void {
    if (this.isMonitoring) {
      BrowserLogger.warn("MultithreadingProfiler", "Already monitoring");
      return;
    }
    
    this.updateInterval = updateInterval;
    this.isMonitoring = true;
    this.lastUpdateTime = performance.now();
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.updateInterval);
    
    BrowserLogger.info("MultithreadingProfiler", "Started monitoring", { updateInterval });
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      BrowserLogger.warn("MultithreadingProfiler", "Not monitoring");
      return;
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    BrowserLogger.info("MultithreadingProfiler", "Stopped monitoring");
  }
  
  /**
   * Register a worker for monitoring
   */
  registerWorker(workerId: number, initialStatus: WorkerStatus): void {
    const workerData: WorkerPerformanceData = {
      workerId,
      status: initialStatus,
      metrics: {
        workerId,
        tasksCompleted: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastActivity: Date.now(),
        memoryUsage: 0,
        cpuUsage: 0
      },
      recentTasks: [],
      performanceHistory: []
    };
    
    this.workerData.set(workerId, workerData);
    BrowserLogger.debug("MultithreadingProfiler", "Registered worker", { workerId });
  }
  
  /**
   * Unregister a worker
   */
  unregisterWorker(workerId: number): void {
    if (this.workerData.has(workerId)) {
      this.workerData.delete(workerId);
      BrowserLogger.debug("MultithreadingProfiler", "Unregistered worker", { workerId });
    }
  }
  
  /**
   * Update worker status
   */
  updateWorkerStatus(workerId: number, status: WorkerStatus): void {
    const workerData = this.workerData.get(workerId);
    if (workerData) {
      workerData.status = status;
      workerData.metrics.lastActivity = Date.now();
    }
  }
  
  /**
   * Record task completion
   */
  recordTaskCompletion(
    workerId: number, 
    taskId: string, 
    taskType: string, 
    executionTime: number, 
    success: boolean
  ): void {
    const workerData = this.workerData.get(workerId);
    if (!workerData) return;
    
    // Update worker metrics
    workerData.metrics.tasksCompleted++;
    workerData.metrics.totalExecutionTime += executionTime;
    workerData.metrics.averageExecutionTime = 
      workerData.metrics.totalExecutionTime / workerData.metrics.tasksCompleted;
    
    // Record recent task
    const task = {
      id: taskId,
      type: taskType,
      executionTime,
      timestamp: Date.now(),
      success
    };
    
    workerData.recentTasks.push(task);
    
    // Keep only recent tasks (last 100)
    if (workerData.recentTasks.length > 100) {
      workerData.recentTasks.shift();
    }
    
    // Update global counters
    this.totalTasksProcessed++;
    if (!success) {
      this.totalErrors++;
    }
    
    BrowserLogger.debug("MultithreadingProfiler", "Task completed", {
      workerId,
      taskId,
      taskType,
      executionTime,
      success
    });
  }
  
  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    const timestamp = Date.now();
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    
    // Calculate system metrics
    const activeWorkers = Array.from(this.workerData.values()).filter(
      w => w.status.status === 'busy'
    ).length;
    
    const queuedTasks = Array.from(this.workerData.values()).reduce(
      (sum, w) => sum + (w.status.currentTask ? 1 : 0), 0
    );
    
    const completedTasks = Array.from(this.workerData.values()).reduce(
      (sum, w) => sum + w.metrics.tasksCompleted, 0
    );
    
    const averageTaskTime = Array.from(this.workerData.values()).reduce(
      (sum, w) => sum + w.metrics.averageExecutionTime, 0
    ) / Math.max(1, this.workerData.size);
    
    const throughput = this.totalTasksProcessed / Math.max(1, deltaTime);
    const errorRate = this.totalErrors / Math.max(1, this.totalTasksProcessed);
    
    // Estimate system-wide CPU and memory usage
    const cpuUsage = this.calculateCPUUsage();
    const memoryUsage = this.calculateMemoryUsage();
    
    const systemMetrics: SystemMetrics = {
      cpuUsage,
      memoryUsage,
      activeWorkers,
      queuedTasks,
      completedTasks,
      averageTaskTime,
      throughput,
      errorRate
    };
    
    this.systemMetrics.push(systemMetrics);
    
    // Keep only recent history
    if (this.systemMetrics.length > this.maxHistorySize) {
      this.systemMetrics.shift();
    }
    
    // Update worker performance history
    for (const [workerId, workerData] of this.workerData) {
      const workerMetrics = {
        timestamp,
        cpuUsage: workerData.metrics.cpuUsage || 0,
        memoryUsage: workerData.metrics.memoryUsage || 0,
        taskCount: workerData.recentTasks.length
      };
      
      workerData.performanceHistory.push(workerMetrics);
      
      if (workerData.performanceHistory.length > this.maxHistorySize) {
        workerData.performanceHistory.shift();
      }
    }
    
    this.lastUpdateTime = now;
  }
  
  /**
   * Calculate estimated CPU usage
   */
  private calculateCPUUsage(): number {
    const activeWorkers = Array.from(this.workerData.values()).filter(
      w => w.status.status === 'busy'
    );
    
    // Simple estimation based on active workers
    return (activeWorkers.length / Math.max(1, this.workerData.size)) * 100;
  }
  
  /**
   * Calculate estimated memory usage
   */
  private calculateMemoryUsage(): number {
    const totalMemory = Array.from(this.workerData.values()).reduce(
      (sum, w) => sum + (w.metrics.memoryUsage || 0), 0
    );
    
    return totalMemory;
  }
  
  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.systemMetrics.length > 0 
      ? this.systemMetrics[this.systemMetrics.length - 1]
      : null;
  }
  
  /**
   * Get worker pool resource
   */
  getWorkerPoolResource(): WorkerPoolResource {
    const currentMetrics = this.getCurrentMetrics();
    
    return {
      availableWorkers: this.workerData.size,
      activeTasks: currentMetrics?.activeWorkers || 0,
      queuedTasks: currentMetrics?.queuedTasks || 0,
      completedTasks: currentMetrics?.completedTasks || 0,
      performanceMetrics: Array.from(this.workerData.values()).map(w => w.metrics),
      config: {
        maxWorkers: this.workerData.size,
        minWorkers: Math.floor(this.workerData.size * 0.5),
        taskTimeout: 5000,
        maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
        enablePerformanceMonitoring: true
      }
    };
  }
  
  /**
   * Get shared memory resource
   */
  getSharedMemoryResource(): SharedMemoryResource {
    // This would be populated by the SharedMemoryManager
    return {
      buffers: new Map(),
      allocatedSize: 0,
      maxCapacity: 1024 * 1024 * 1024, // 1GB
      bufferCount: 0
    };
  }
  
  /**
   * Create performance snapshot
   */
  createSnapshot(): PerformanceSnapshot {
    const timestamp = Date.now();
    const currentMetrics = this.getCurrentMetrics();
    
    return {
      timestamp,
      workerMetrics: Array.from(this.workerData.values()).map(w => w.metrics),
      memoryUsage: {
        rss: currentMetrics?.memoryUsage || 0,
        heapTotal: currentMetrics?.memoryUsage || 0,
        heapUsed: currentMetrics?.memoryUsage || 0,
        external: 0
      },
      taskQueue: {
        pending: currentMetrics?.queuedTasks || 0,
        processing: currentMetrics?.activeWorkers || 0,
        completed: currentMetrics?.completedTasks || 0,
        failed: Math.floor((currentMetrics?.errorRate || 0) * (currentMetrics?.completedTasks || 0))
      }
    };
  }
  
  /**
   * Get performance report
   */
  getPerformanceReport(): any {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      return { error: "No metrics available" };
    }
    
    // Calculate averages over time
    const avgCPU = this.systemMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.systemMetrics.length;
    const avgMemory = this.systemMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.systemMetrics.length;
    const avgThroughput = this.systemMetrics.reduce((sum, m) => sum + m.throughput, 0) / this.systemMetrics.length;
    
    // Find best and worst performing workers
    const workerPerformances = Array.from(this.workerData.values()).map(w => ({
      workerId: w.workerId,
      tasksCompleted: w.metrics.tasksCompleted,
      avgTime: w.metrics.averageExecutionTime,
      errorRate: w.recentTasks.filter(t => !t.success).length / Math.max(1, w.recentTasks.length)
    }));
    
    const bestWorker = workerPerformances.reduce((best, current) => 
      current.tasksCompleted > best.tasksCompleted ? current : best
    , workerPerformances[0]);
    
    const worstWorker = workerPerformances.reduce((worst, current) => 
      current.avgTime > worst.avgTime ? current : worst
    , workerPerformances[0]);
    
    return {
      summary: {
        totalWorkers: this.workerData.size,
        activeWorkers: currentMetrics.activeWorkers,
        totalTasksProcessed: this.totalTasksProcessed,
        totalErrors: this.totalErrors,
        overallErrorRate: currentMetrics.errorRate,
        currentThroughput: currentMetrics.throughput,
        averageTaskTime: currentMetrics.averageTaskTime
      },
      averages: {
        cpuUsage: avgCPU,
        memoryUsage: avgMemory,
        throughput: avgThroughput
      },
      workers: {
        best: bestWorker,
        worst: worstWorker,
        all: workerPerformances
      },
      trends: {
        cpuTrend: this.calculateTrend(this.systemMetrics.map(m => m.cpuUsage)),
        memoryTrend: this.calculateTrend(this.systemMetrics.map(m => m.memoryUsage)),
        throughputTrend: this.calculateTrend(this.systemMetrics.map(m => m.throughput))
      }
    };
  }
  
  /**
   * Calculate trend for a series of values
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10); // Last 10 values
    const older = values.slice(-20, -10); // Previous 10 values
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.workerData.clear();
    this.systemMetrics = [];
    this.snapshots = [];
    this.totalTasksProcessed = 0;
    this.totalErrors = 0;
    this.lastUpdateTime = performance.now();
    
    BrowserLogger.info("MultithreadingProfiler", "Reset all metrics");
  }
}

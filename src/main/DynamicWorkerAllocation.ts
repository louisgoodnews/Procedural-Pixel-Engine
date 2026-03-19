/**
 * Dynamic Worker Allocation System
 * 
 * Dynamically adjusts worker allocation based on real-time workload
 * and performance metrics to optimize resource utilization.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { WorkerPool } from "./WorkerPool";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface WorkloadMetrics {
  systemType: 'physics' | 'particles' | 'render';
  currentLoad: number; // 0-1 scale
  averageLoad: number; // Rolling average
  taskQueueSize: number;
  processingTime: number; // Average processing time in ms
  throughput: number; // Tasks per second
  lastUpdate: number;
}

interface WorkerAllocation {
  systemType: 'physics' | 'particles' | 'render';
  currentWorkers: number;
  minWorkers: number;
  maxWorkers: number;
  targetWorkers: number;
  efficiency: number; // 0-1 scale
  cost: number; // CPU cost per worker
  priority: number; // System priority for allocation
}

interface AllocationStrategy {
  totalWorkers: number;
  allocations: WorkerAllocation[];
  reallocationHistory: Array<{
    timestamp: number;
    from: string;
    to: string;
    workers: number;
    reason: string;
    performanceImpact: number;
  }>;
}

interface DynamicAllocationState {
  strategy: AllocationStrategy;
  metrics: Map<string, WorkloadMetrics>;
  autoAllocation: boolean;
  allocationInterval: number;
  lastAllocation: number;
  performanceThreshold: number;
  loadBalancingEnabled: boolean;
}

/**
 * Dynamic Worker Allocation System
 * 
 * Provides intelligent worker allocation based on workload
 * and performance requirements.
 */
export class DynamicWorkerAllocationSystem implements System<EngineComponents, EngineResources> {
  private state: DynamicAllocationState;
  private workerPools: Map<string, WorkerPool> = new Map();
  private isInitialized = false;

  constructor() {
    this.state = {
      strategy: this.createInitialStrategy(),
      metrics: new Map(),
      autoAllocation: true,
      allocationInterval: 5000, // 5 seconds
      lastAllocation: Date.now(),
      performanceThreshold: 0.8, // 80% efficiency threshold
      loadBalancingEnabled: true
    };

    BrowserLogger.info("DynamicWorkerAllocationSystem", "Created", {
      totalWorkers: this.state.strategy.totalWorkers,
      autoAllocation: this.state.autoAllocation
    });
  }

  /**
   * Initialize the dynamic allocation system
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    // Initialize metrics for each system
    this.initializeMetrics();

    // Register worker pools (would be done by the actual systems)
    this.registerWorkerPools(world);

    this.isInitialized = true;
    
    BrowserLogger.info("DynamicWorkerAllocationSystem", "Initialized", {
      allocationInterval: this.state.allocationInterval,
      loadBalancingEnabled: this.state.loadBalancingEnabled
    });
  }

  /**
   * Execute dynamic allocation
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.isInitialized || !this.state.autoAllocation) {
      return;
    }

    const now = Date.now();
    
    // Check if it's time for reallocation
    if (now - this.state.lastAllocation < this.state.allocationInterval) {
      return;
    }

    this.state.lastAllocation = now;

    // Update workload metrics
    this.updateWorkloadMetrics(world);

    // Check if reallocation is needed
    if (this.shouldReallocate()) {
      this.reallocateWorkers(world);
    }

    // Perform load balancing if enabled
    if (this.state.loadBalancingEnabled) {
      this.performLoadBalancing(world);
    }
  }

  /**
   * Create initial allocation strategy
   */
  private createInitialStrategy(): AllocationStrategy {
    const totalWorkers = Math.max(2, require('os').cpus().length - 1);
    
    const allocations: WorkerAllocation[] = [
      {
        systemType: 'physics',
        currentWorkers: Math.max(1, Math.floor(totalWorkers * 0.4)),
        minWorkers: 1,
        maxWorkers: Math.max(2, Math.floor(totalWorkers * 0.6)),
        targetWorkers: Math.max(1, Math.floor(totalWorkers * 0.4)),
        efficiency: 1.0,
        cost: 1.0,
        priority: 2 // High priority for physics
      },
      {
        systemType: 'particles',
        currentWorkers: Math.max(1, Math.floor(totalWorkers * 0.3)),
        minWorkers: 1,
        maxWorkers: Math.max(2, Math.floor(totalWorkers * 0.5)),
        targetWorkers: Math.max(1, Math.floor(totalWorkers * 0.3)),
        efficiency: 1.0,
        cost: 0.8,
        priority: 1 // Medium priority for particles
      },
      {
        systemType: 'render',
        currentWorkers: Math.max(1, Math.floor(totalWorkers * 0.3)),
        minWorkers: 1,
        maxWorkers: Math.max(2, Math.floor(totalWorkers * 0.4)),
        targetWorkers: Math.max(1, Math.floor(totalWorkers * 0.3)),
        efficiency: 1.0,
        cost: 1.2,
        priority: 3 // Highest priority for rendering
      }
    ];

    return {
      totalWorkers,
      allocations,
      reallocationHistory: []
    };
  }

  /**
   * Initialize workload metrics
   */
  private initializeMetrics(): void {
    const systemTypes: Array<'physics' | 'particles' | 'render'> = ['physics', 'particles', 'render'];
    
    for (const systemType of systemTypes) {
      this.state.metrics.set(systemType, {
        systemType,
        currentLoad: 0,
        averageLoad: 0,
        taskQueueSize: 0,
        processingTime: 0,
        throughput: 0,
        lastUpdate: Date.now()
      });
    }
  }

  /**
   * Register worker pools (placeholder - would be done by actual systems)
   */
  private registerWorkerPools(world: World<EngineComponents, EngineResources>): void {
    // This would register the actual worker pools from the integrated systems
    BrowserLogger.debug("DynamicWorkerAllocationSystem", "Worker pools registration placeholder");
  }

  /**
   * Update workload metrics from actual systems
   */
  private updateWorkloadMetrics(world: World<EngineComponents, EngineResources>): void {
    // Get runtime metrics
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (!runtimeMetrics) {
      return;
    }

    // Update metrics for each system
    for (const [systemType, metrics] of this.state.metrics) {
      const newMetrics = this.collectSystemMetrics(systemType as 'physics' | 'particles' | 'render', world, runtimeMetrics);
      
      // Update with exponential smoothing
      const alpha = 0.3; // Smoothing factor
      metrics.averageLoad = alpha * newMetrics.currentLoad + (1 - alpha) * metrics.averageLoad;
      metrics.currentLoad = newMetrics.currentLoad;
      metrics.taskQueueSize = newMetrics.taskQueueSize;
      metrics.processingTime = newMetrics.processingTime;
      metrics.throughput = newMetrics.throughput;
      metrics.lastUpdate = Date.now();
    }
  }

  /**
   * Collect metrics for a specific system
   */
  private collectSystemMetrics(
    systemType: 'physics' | 'particles' | 'render',
    world: World<EngineComponents, EngineResources>,
    runtimeMetrics: any
  ): WorkloadMetrics {
    const baseMetrics = {
      systemType,
      currentLoad: 0,
      averageLoad: 0,
      taskQueueSize: 0,
      processingTime: 0,
      throughput: 0,
      lastUpdate: Date.now()
    };

    switch (systemType) {
      case 'physics':
        return {
          ...baseMetrics,
          currentLoad: Math.min(1, runtimeMetrics.namedBenchmarks.physicsSystemMs / 10),
          processingTime: runtimeMetrics.namedBenchmarks.physicsSystemMs,
          taskQueueSize: this.estimateTaskQueueSize('physics')
        };
        
      case 'particles':
        const particleRuntime = world.getResource("particleRuntime");
        const particleCount = particleRuntime?.allParticles.length || 0;
        return {
          ...baseMetrics,
          currentLoad: Math.min(1, particleCount / 1000),
          processingTime: particleCount > 0 ? 5 : 0, // Estimate
          taskQueueSize: this.estimateTaskQueueSize('particles')
        };
        
      case 'render':
        const renderStats = world.getResource("renderStats");
        const entityCount = renderStats?.visibleEntities || 0;
        return {
          ...baseMetrics,
          currentLoad: Math.min(1, runtimeMetrics.namedBenchmarks.renderSystemMs / 16),
          processingTime: runtimeMetrics.namedBenchmarks.renderSystemMs,
          taskQueueSize: this.estimateTaskQueueSize('render')
        };
        
      default:
        return baseMetrics;
    }
  }

  /**
   * Estimate task queue size for a system
   */
  private estimateTaskQueueSize(systemType: 'physics' | 'particles' | 'render'): number {
    // This would query the actual worker pools for queue sizes
    // For now, return estimated values
    switch (systemType) {
      case 'physics':
        return Math.floor(Math.random() * 5);
      case 'particles':
        return Math.floor(Math.random() * 10);
      case 'render':
        return Math.floor(Math.random() * 3);
      default:
        return 0;
    }
  }

  /**
   * Determine if reallocation is needed
   */
  private shouldReallocate(): boolean {
    // Check if any system is underperforming
    for (const allocation of this.state.strategy.allocations) {
      const metrics = this.state.metrics.get(allocation.systemType);
      if (!metrics) continue;

      // Check if system is overloaded
      if (metrics.currentLoad > 0.8 && allocation.currentWorkers < allocation.maxWorkers) {
        return true;
      }

      // Check if system is underutilized
      if (metrics.currentLoad < 0.3 && allocation.currentWorkers > allocation.minWorkers) {
        return true;
      }

      // Check if efficiency is below threshold
      if (allocation.efficiency < this.state.performanceThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reallocate workers based on current workload
   */
  private reallocateWorkers(world: World<EngineComponents, EngineResources>): void {
    const beforePerformance = this.calculateOverallPerformance();
    
    BrowserLogger.info("DynamicWorkerAllocationSystem", "Starting worker reallocation", {
      beforePerformance: beforePerformance.toFixed(2)
    });

    // Calculate new target allocations
    const newAllocations = this.calculateOptimalAllocations();
    
    // Apply reallocations
    const reallocations = this.applyReallocation(newAllocations);
    
    // Record reallocation
    const afterPerformance = this.calculateOverallPerformance();
    const performanceImpact = afterPerformance - beforePerformance;
    
    for (const reallocation of reallocations) {
      this.state.strategy.reallocationHistory.push({
        timestamp: Date.now(),
        ...reallocation,
        performanceImpact
      });
    }

    BrowserLogger.info("DynamicWorkerAllocationSystem", "Worker reallocation completed", {
      afterPerformance: afterPerformance.toFixed(2),
      performanceImpact: performanceImpact.toFixed(2),
      reallocations: reallocations.length
    });
  }

  /**
   * Calculate optimal worker allocations
   */
  private calculateOptimalAllocations(): Map<string, number> {
    const optimalAllocations = new Map<string, number>();
    const totalWorkers = this.state.strategy.totalWorkers;
    
    // Calculate weighted demand for each system
    const demands = new Map<string, number>();
    let totalDemand = 0;
    
    for (const allocation of this.state.strategy.allocations) {
      const metrics = this.state.metrics.get(allocation.systemType);
      if (!metrics) continue;
      
      // Calculate demand based on load, priority, and efficiency
      const load = metrics.currentLoad;
      const priority = allocation.priority;
      const efficiency = allocation.efficiency;
      
      // Higher load and priority increase demand, lower efficiency increases demand
      const demand = (load * priority * (2 - efficiency)) / allocation.cost;
      demands.set(allocation.systemType, demand);
      totalDemand += demand;
    }
    
    // Allocate workers based on demand
    let allocatedWorkers = 0;
    
    for (const allocation of this.state.strategy.allocations) {
      const demand = demands.get(allocation.systemType) || 0;
      
      if (totalDemand > 0) {
        const proportion = demand / totalDemand;
        let targetWorkers = Math.floor(totalWorkers * proportion);
        
        // Ensure within bounds
        targetWorkers = Math.max(allocation.minWorkers, Math.min(allocation.maxWorkers, targetWorkers));
        
        optimalAllocations.set(allocation.systemType, targetWorkers);
        allocatedWorkers += targetWorkers;
      } else {
        // Even distribution if no demand
        const evenWorkers = Math.floor(totalWorkers / this.state.strategy.allocations.length);
        optimalAllocations.set(allocation.systemType, evenWorkers);
        allocatedWorkers += evenWorkers;
      }
    }
    
    // Distribute any remaining workers
    const remainingWorkers = totalWorkers - allocatedWorkers;
    if (remainingWorkers > 0) {
      // Give to highest priority systems
      const sortedAllocations = [...this.state.strategy.allocations].sort((a, b) => b.priority - a.priority);
      for (let i = 0; i < remainingWorkers && i < sortedAllocations.length; i++) {
        const systemType = sortedAllocations[i].systemType;
        const current = optimalAllocations.get(systemType) || 0;
        const allocation = this.state.strategy.allocations.find(a => a.systemType === systemType);
        if (allocation && current < allocation.maxWorkers) {
          optimalAllocations.set(systemType, current + 1);
        }
      }
    }
    
    return optimalAllocations;
  }

  /**
   * Apply reallocation to worker pools
   */
  private applyReallocation(newAllocations: Map<string, number>): Array<{
    from: string;
    to: string;
    workers: number;
    reason: string;
  }> {
    const reallocations: Array<{ from: string; to: string; workers: number; reason: string }> = [];
    
    for (const allocation of this.state.strategy.allocations) {
      const newWorkerCount = newAllocations.get(allocation.systemType) || allocation.currentWorkers;
      const difference = newWorkerCount - allocation.currentWorkers;
      
      if (difference !== 0) {
        const reason = difference > 0 ? 'increased_load' : 'decreased_load';
        
        reallocations.push({
          from: allocation.systemType,
          to: allocation.systemType,
          workers: Math.abs(difference),
          reason
        });
        
        // Update allocation
        allocation.currentWorkers = newWorkerCount;
        allocation.targetWorkers = newWorkerCount;
        
        // This would actually resize the worker pools
        BrowserLogger.debug("DynamicWorkerAllocationSystem", "Resizing worker pool", {
          systemType: allocation.systemType,
          from: allocation.currentWorkers - difference,
          to: newWorkerCount,
          reason
        });
      }
    }
    
    return reallocations;
  }

  /**
   * Perform load balancing between workers
   */
  private performLoadBalancing(world: World<EngineComponents, EngineResources>): void {
    // This would implement task redistribution between workers
    // For now, just log that load balancing is being performed
    BrowserLogger.debug("DynamicWorkerAllocationSystem", "Performing load balancing");
  }

  /**
   * Calculate overall system performance
   */
  private calculateOverallPerformance(): number {
    let totalPerformance = 0;
    let totalWeight = 0;
    
    for (const allocation of this.state.strategy.allocations) {
      const metrics = this.state.metrics.get(allocation.systemType);
      if (!metrics) continue;
      
      // Weight by priority
      const weight = allocation.priority;
      const performance = (1 - metrics.currentLoad) * allocation.efficiency;
      
      totalPerformance += performance * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalPerformance / totalWeight : 0;
  }

  /**
   * Get current allocation strategy
   */
  public getAllocationStrategy(): AllocationStrategy {
    return { ...this.state.strategy };
  }

  /**
   * Get workload metrics
   */
  public getWorkloadMetrics(): Map<string, WorkloadMetrics> {
    return new Map(this.state.metrics);
  }

  /**
   * Enable/disable auto allocation
   */
  public setAutoAllocation(enabled: boolean): void {
    this.state.autoAllocation = enabled;
    BrowserLogger.info("DynamicWorkerAllocationSystem", "Auto allocation changed", { enabled });
  }

  /**
   * Set allocation interval
   */
  public setAllocationInterval(intervalMs: number): void {
    this.state.allocationInterval = intervalMs;
    BrowserLogger.info("DynamicWorkerAllocationSystem", "Allocation interval changed", { intervalMs });
  }

  /**
   * Force reallocation
   */
  public forceReallocation(world: World<EngineComponents, EngineResources>): void {
    this.state.lastAllocation = 0; // Reset timer to force reallocation
    this.execute(world, 0);
  }

  /**
   * Get allocation report
   */
  public getAllocationReport(): any {
    const recentReallocations = this.state.strategy.reallocationHistory.slice(-10);
    const avgPerformanceImpact = recentReallocations.length > 0
      ? recentReallocations.reduce((sum, r) => sum + r.performanceImpact, 0) / recentReallocations.length
      : 0;

    return {
      totalWorkers: this.state.strategy.totalWorkers,
      currentAllocations: this.state.strategy.allocations.map(a => ({
        systemType: a.systemType,
        workers: a.currentWorkers,
        efficiency: (a.efficiency * 100).toFixed(1) + '%',
        load: (this.state.metrics.get(a.systemType)?.currentLoad || 0 * 100).toFixed(1) + '%'
      })),
      autoAllocation: this.state.autoAllocation,
      recentReallocations: recentReallocations.length,
      averagePerformanceImpact: avgPerformanceImpact.toFixed(2),
      overallPerformance: (this.calculateOverallPerformance() * 100).toFixed(1) + '%'
    };
  }

  /**
   * Register a worker pool for a system
   */
  public registerWorkerPool(systemType: string, workerPool: WorkerPool): void {
    this.workerPools.set(systemType, workerPool);
    BrowserLogger.debug("DynamicWorkerAllocationSystem", "Worker pool registered", { systemType });
  }

  /**
   * Unregister a worker pool
   */
  public unregisterWorkerPool(systemType: string): void {
    this.workerPools.delete(systemType);
    BrowserLogger.debug("DynamicWorkerAllocationSystem", "Worker pool unregistered", { systemType });
  }
}

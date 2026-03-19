/**
 * Multithreading System
 * 
 * Integrates the multithreading infrastructure with the ECS engine.
 * Manages worker pools, shared memory, and parallel system coordination.
 */

import type { World, System } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { 
  WorkerPoolResource, 
  SharedMemoryResource, 
  ParallelProcessingResource,
  WorkerPoolConfig,
  ParallelPhysicsConfig,
  ParallelParticleConfig,
  ParallelRenderConfig
} from "../shared/types/multithreading";
import { WorkerPool } from "./WorkerPool";
import { SharedMemoryManager } from "./SharedMemoryManager";
import { MultithreadingProfiler } from "./MultithreadingProfiler";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface MultithreadingState {
  workerPool?: WorkerPool;
  sharedMemoryManager?: SharedMemoryManager;
  profiler?: MultithreadingProfiler;
  isInitialized: boolean;
  lastUpdateTime: number;
}

/**
 * Multithreading System
 * 
 * Coordinates all multithreading components and provides a unified interface
 * for the ECS engine to use parallel processing capabilities.
 */
export class MultithreadingSystem implements System<EngineComponents, EngineResources> {
  private state: MultithreadingState;
  private config: {
    workerPool: WorkerPoolConfig;
    enableProfiling: boolean;
    autoScaling: boolean;
    maxMemoryUsage: number;
  };

  constructor(config?: Partial<typeof MultithreadingSystem.prototype.config>) {
    this.config = {
      workerPool: {
        maxWorkers: Math.max(2, require('os').cpus().length - 1),
        minWorkers: 2,
        taskTimeout: 5000,
        maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
        enablePerformanceMonitoring: true
      },
      enableProfiling: true,
      autoScaling: true,
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      ...config
    };

    this.state = {
      isInitialized: false,
      lastUpdateTime: 0
    };

    BrowserLogger.info("MultithreadingSystem", "Created", {
      maxWorkers: this.config.workerPool.maxWorkers,
      enableProfiling: this.config.enableProfiling
    });
  }

  /**
   * Initialize the multithreading system
   */
  async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    if (this.state.isInitialized) {
      BrowserLogger.warn("MultithreadingSystem", "Already initialized");
      return;
    }

    try {
      // Create shared memory manager
      this.state.sharedMemoryManager = new SharedMemoryManager(this.config.maxMemoryUsage);

      // Create worker pool
      this.state.workerPool = new WorkerPool(this.config.workerPool);

      // Create profiler if enabled
      if (this.config.enableProfiling) {
        this.state.profiler = new MultithreadingProfiler();
        this.state.profiler.startMonitoring(1000);
      }

      this.state.isInitialized = true;
      this.state.lastUpdateTime = performance.now();

      BrowserLogger.info("MultithreadingSystem", "Initialized successfully", {
        workerCount: this.config.workerPool.maxWorkers,
        sharedMemoryCapacity: this.config.maxMemoryUsage,
        profilingEnabled: this.config.enableProfiling
      });

    } catch (error) {
      BrowserLogger.error("MultithreadingSystem", "Initialization failed", error);
      throw error;
    }
  }

  /**
   * Execute the multithreading system
   */
  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.state.isInitialized) {
      return;
    }

    this.state.lastUpdateTime = performance.now();

    try {
      // Update profiler
      if (this.state.profiler) {
        this.updateProfiler(world);
      }

      // Auto-scaling if enabled
      if (this.config.autoScaling) {
        // Note: Auto-scaling logic would be implemented here
        // For now, just log that it's enabled
        BrowserLogger.debug("MultithreadingSystem", "Auto-scaling enabled");
      }

    } catch (error) {
      BrowserLogger.error("MultithreadingSystem", "Execute failed", error);
    }
  }

  /**
   * Update profiler with current metrics
   */
  private updateProfiler(world: World<EngineComponents, EngineResources>): void {
    if (!this.state.profiler || !this.state.workerPool) {
      return;
    }

    const workerPoolResource = this.state.workerPool.getResource();
    
    // Update worker statuses
    for (let i = 0; i < workerPoolResource.availableWorkers; i++) {
      const status = {
        workerId: i,
        status: 'idle' as const,
        currentTask: undefined,
        lastHeartbeat: Date.now()
      };
      
      this.state.profiler.updateWorkerStatus(i, status);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    if (!this.state.profiler) {
      return { error: "Profiling not enabled" };
    }

    return this.state.profiler.getPerformanceReport();
  }

  /**
   * Create performance snapshot
   */
  createSnapshot(): any {
    if (!this.state.profiler) {
      return { error: "Profiling not enabled" };
    }

    return this.state.profiler.createSnapshot();
  }

  /**
   * Shutdown the multithreading system
   */
  async shutdown(): Promise<void> {
    if (!this.state.isInitialized) {
      return;
    }

    try {
      // Stop profiler
      if (this.state.profiler) {
        this.state.profiler.stopMonitoring();
      }

      // Shutdown worker pool
      if (this.state.workerPool) {
        await this.state.workerPool.shutdown();
      }

      // Cleanup shared memory
      if (this.state.sharedMemoryManager) {
        // Note: SharedMemoryManager would need a cleanup method
      }

      this.state.isInitialized = false;

      BrowserLogger.info("MultithreadingSystem", "Shutdown complete");

    } catch (error) {
      BrowserLogger.error("MultithreadingSystem", "Shutdown failed", error);
      throw error;
    }
  }

  /**
   * Check if the system is initialized
   */
  isReady(): boolean {
    return this.state.isInitialized;
  }

  /**
   * Get worker pool instance
   */
  getWorkerPool(): WorkerPool | undefined {
    return this.state.workerPool;
  }

  /**
   * Get shared memory manager instance
   */
  getSharedMemoryManager(): SharedMemoryManager | undefined {
    return this.state.sharedMemoryManager;
  }

  /**
   * Get profiler instance
   */
  getProfiler(): MultithreadingProfiler | undefined {
    return this.state.profiler;
  }
}

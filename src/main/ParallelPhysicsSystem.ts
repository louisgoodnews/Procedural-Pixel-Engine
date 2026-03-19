/**
 * Parallel Physics System
 * 
 * Distributes physics calculations across worker threads for improved performance
 * with large numbers of entities.
 */

import type { 
  World, 
  System
} from "../engine/World";
import type { 
  EngineComponents
} from "../engine/types";
import type { 
  PhysicsTask, 
  ParallelPhysicsConfig,
  WorkerPool,
  WorkerTaskResult
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

// Import WorkerPool dynamically to avoid circular dependencies
let WorkerPoolClass: any = null;
async function getWorkerPool() {
  if (!WorkerPoolClass) {
    const module = await import('./WorkerPool');
    WorkerPoolClass = module.WorkerPool;
  }
  return WorkerPoolClass;
}

/**
 * Query for entities that need physics processing
 */
const physicsQuery = {
  all: ["position", "velocity", "physicsBody"],
  has: [],
  exclude: []
} as const;

interface ParallelPhysicsState {
  config: ParallelPhysicsConfig;
  workerPool?: WorkerPool;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
}

/**
 * Parallel Physics System
 * 
 * Distributes physics calculations across worker threads for improved performance
 * with large numbers of entities.
 */
export class ParallelPhysicsSystem implements System<any, any> {
  private state: ParallelPhysicsState;
  private lastUpdateTime = 0;

  constructor(config: ParallelPhysicsConfig) {
    this.state = {
      config,
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize the parallel physics system
   */
  public async initialize(world: World<any, any>): Promise<void> {
    if (!this.state.config.enableParallel) {
      BrowserLogger.info("ParallelPhysicsSystem", "Parallel processing disabled, using single-threaded physics");
      return;
    }

    try {
      const WorkerPool = await getWorkerPool();
      
      this.state.workerPool = new WorkerPool({
        maxWorkers: this.state.config.workerCount,
        minWorkers: Math.max(1, Math.floor(this.state.config.workerCount / 2)),
        taskTimeout: 5000, // 5 seconds
        maxMemoryUsage: 512, // 512MB per worker
        enablePerformanceMonitoring: true
      });

      BrowserLogger.info("ParallelPhysicsSystem", "Initialized with worker pool", {
        workerCount: this.state.config.workerCount,
        maxConcurrentSimulations: this.state.config.maxConcurrentSimulations
      });
    } catch (error) {
      BrowserLogger.error("ParallelPhysicsSystem", "Failed to initialize worker pool", error);
      throw error;
    }
  }

  /**
   * Main physics update loop
   */
  public async execute(world: World<any, any>, deltaTime: number): Promise<void> {
    if (!this.state.config.enableParallel) {
      this.updateSingleThreaded(world, deltaTime);
      return;
    }

    if (this.state.isProcessing) {
      BrowserLogger.warn("ParallelPhysicsSystem", "Skipping update - previous frame still processing");
      return;
    }

    const startTime = performance.now();
    this.state.isProcessing = true;

    try {
      await this.updateParallel(world, deltaTime);
    } catch (error) {
      BrowserLogger.error("ParallelPhysicsSystem", "Parallel update failed", error);
      // Fallback to single-threaded
      this.updateSingleThreaded(world, deltaTime);
    } finally {
      this.state.isProcessing = false;
      this.state.frameCount++;
      this.state.totalProcessingTime += performance.now() - startTime;
      this.lastUpdateTime = Date.now();
    }
  }

  /**
   * Single-threaded physics update (fallback)
   */
  private updateSingleThreaded(world: World<any, any>, deltaTime: number): void {
    // Get entities with required components
    const entities = world.getEntitiesWith("position", "velocity", "physicsBody");
    
    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const velocity = world.getComponent(entity, "velocity");
      const physics = world.getComponent(entity, "physicsBody");
      
      if (position && velocity && physics) {
        // Apply gravity
        if (physics.affectedByGravity) {
          velocity.y += (physics.gravity || 9.81) * deltaTime;
        }

        // Apply friction
        if (physics.friction && Math.abs(velocity.x) > 0.01) {
          velocity.x *= Math.pow(1 - physics.friction, deltaTime);
        }

        // Update position
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        
        // Update components
        world.addComponents(entity, { position, velocity });
      }
    }
  }

  /**
   * Parallel physics update using worker threads
   */
  private async updateParallel(world: World<any, any>, deltaTime: number): Promise<void> {
    // Get entities that need physics processing
    const entities = world.getEntitiesWith("position", "velocity", "physicsBody");
    
    if (entities.length === 0) {
      return; // No entities to process
    }

    // Split entities into chunks for parallel processing
    const chunkSize = Math.ceil(entities.length / this.state.config.maxConcurrentSimulations);
    const chunks: any[][] = [];

    for (let i = 0; i < entities.length; i += chunkSize) {
      const chunk = [];
      for (let j = i; j < Math.min(i + chunkSize, entities.length); j++) {
        const entity = entities[j];
        chunk.push({
          id: entity.id,
          position: world.getComponent(entity, "position"),
          velocity: world.getComponent(entity, "velocity"),
          physicsBody: world.getComponent(entity, "physicsBody"),
          collider: world.getComponent(entity, "collider")
        });
      }
      chunks.push(chunk);
    }

    // Submit tasks to worker pool
    const tasks = chunks.map((chunk, index) => ({
      id: `physics-chunk-${index}`,
      type: 'physics-update',
      data: {
        entities: chunk,
        deltaTime,
        substeps: this.state.config.substeps,
        worldBounds: this.getWorldBounds(world)
      },
      priority: 'high',
      createdAt: Date.now()
    } as PhysicsTask));

    if (!this.state.workerPool) {
      throw new Error("Worker pool not initialized");
    }

    // Execute tasks in parallel
    const results = await Promise.all(
      tasks.map(task => this.state.workerPool!.submitTask(task))
    );

    // Apply results back to entities
    this.applyResults(world, results, [...entities]);
  }

  /**
   * Apply worker results back to the world entities
   */
  private applyResults(
    world: World<any, any>, 
    results: WorkerTaskResult[], 
    originalEntities: any[]
  ): void {
    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("ParallelPhysicsSystem", `Physics task failed`, result.error);
        continue;
      }

      const chunkIndex = parseInt(result.taskId.split('-')[2]);
      const chunkStart = chunkIndex * Math.ceil(originalEntities.length / this.state.config.maxConcurrentSimulations);
      const chunkEnd = Math.min(chunkStart + Math.ceil(originalEntities.length / this.state.config.maxConcurrentSimulations), originalEntities.length);

      for (let i = chunkStart; i < chunkEnd; i++) {
        const originalEntity = originalEntities[i];
        const updatedEntity = result.data.entities.find((e: any) => e.id === originalEntity.id);
        
        if (updatedEntity) {
          // Update entity components with results
          if (updatedEntity.position) {
            world.addComponents(originalEntity, { position: updatedEntity.position });
          }
          if (updatedEntity.velocity) {
            world.addComponents(originalEntity, { velocity: updatedEntity.velocity });
          }
          if (updatedEntity.physicsBody) {
            world.addComponents(originalEntity, { physicsBody: updatedEntity.physicsBody });
          }
          if (updatedEntity.collider) {
            world.addComponents(originalEntity, { collider: updatedEntity.collider });
          }
        }
      }
    }
  }

  /**
   * Get world bounds for physics calculations
   */
  private getWorldBounds(world: World<any, any>): { x: number; y: number; width: number; height: number } {
    // This would typically come from a world component or resource
    // For now, return reasonable defaults
    return {
      x: -1000,
      y: -1000,
      width: 2000,
      height: 2000
    };
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): {
    frameCount: number;
    totalProcessingTime: number;
    averageFrameTime: number;
    isParallel: boolean;
    workerCount: number;
  } {
    return {
      frameCount: this.state.frameCount,
      totalProcessingTime: this.state.totalProcessingTime,
      averageFrameTime: this.state.frameCount > 0 ? this.state.totalProcessingTime / this.state.frameCount : 0,
      isParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount
    };
  }

  /**
   * Reconfigure the parallel physics system
   */
  public reconfigure(config: Partial<ParallelPhysicsConfig>): void {
    const oldConfig = this.state.config;
    this.state.config = { ...this.state.config, ...config };

    BrowserLogger.info("ParallelPhysicsSystem", "Configuration updated", {
      old: oldConfig,
      new: this.state.config
    });

    // If worker count changed, reinitialize worker pool
    if (config.workerCount && config.workerCount !== oldConfig.workerCount) {
      BrowserLogger.info("ParallelPhysicsSystem", "Worker count changed, reinitializing");
      this.initialize({} as any).catch(error => {
        BrowserLogger.error("ParallelPhysicsSystem", "Failed to reinitialize", error);
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.state.workerPool) {
      await this.state.workerPool.shutdown();
      this.state.workerPool = undefined;
    }

    BrowserLogger.info("ParallelPhysicsSystem", "Cleanup complete", this.getStatistics());
  }

  /**
   * Get current system state
   */
  public getState(): ParallelPhysicsState {
    return { ...this.state };
  }

  /**
   * Check if system is ready
   */
  public isReady(): boolean {
    return !this.state.config.enableParallel || (this.state.workerPool !== undefined);
  }

  /**
   * Get estimated performance improvement
   */
  public getPerformanceEstimate(entityCount: number): {
    estimatedSpeedup: number;
    efficiency: number;
    recommendation: string;
  } {
    if (!this.state.config.enableParallel) {
      return {
        estimatedSpeedup: 1.0,
        efficiency: 1.0,
        recommendation: "Enable parallel processing for better performance"
      };
    }

    const workerCount = this.state.config.workerCount;
    const optimalWorkers = Math.min(workerCount, entityCount / 10); // 10 entities per worker minimum
    
    let speedup = Math.min(workerCount, optimalWorkers);
    let efficiency = speedup / workerCount;
    
    let recommendation = "Optimal configuration";
    if (entityCount < workerCount * 10) {
      recommendation = "Consider reducing worker count for current entity load";
      efficiency = entityCount / (workerCount * 10);
    } else if (optimalWorkers < workerCount) {
      recommendation = "Consider increasing worker count for better performance";
    }

    return {
      estimatedSpeedup: speedup,
      efficiency: Math.max(0.1, efficiency),
      recommendation
    };
  }
}

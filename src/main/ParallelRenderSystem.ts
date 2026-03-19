/**
 * Parallel Render System
 * 
 * Distributes rendering calculations across worker threads for improved performance
 * with large numbers of renderable entities.
 */

import type { 
  World, 
  System
} from "../engine/World";
import type { 
  EngineComponents
} from "../engine/types";
import type { 
  RenderTask, 
  ParallelRenderConfig,
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

interface ParallelRenderState {
  config: ParallelRenderConfig;
  workerPool?: WorkerPool;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
}

/**
 * Parallel Render System
 * 
 * Distributes rendering calculations across worker threads while maintaining
 * proper integration with the ECS and render pipeline.
 */
export class ParallelRenderSystem implements System<any, any> {
  private state: ParallelRenderState;
  private lastUpdateTime = 0;

  constructor(config: ParallelRenderConfig) {
    this.state = {
      config,
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize parallel render system
   */
  public async initialize(world: World<any, any>): Promise<void> {
    if (!this.state.config.enableParallel) {
      BrowserLogger.info("ParallelRenderSystem", "Parallel processing disabled, using single-threaded rendering");
      return;
    }

    try {
      const WorkerPool = await getWorkerPool();
      
      this.state.workerPool = new WorkerPool({
        maxWorkers: this.state.config.workerCount,
        minWorkers: Math.max(1, Math.floor(this.state.config.workerCount / 2)),
        taskTimeout: 5000, // 5 seconds
        maxMemoryUsage: 512, // 512MB per worker for rendering
        enablePerformanceMonitoring: true
      });

      BrowserLogger.info("ParallelRenderSystem", "Initialized with worker pool", {
        workerCount: this.state.config.workerCount,
        maxEntitiesPerWorker: this.state.config.maxEntitiesPerWorker
      });
    } catch (error) {
      BrowserLogger.error("ParallelRenderSystem", "Failed to initialize worker pool", error);
      throw error;
    }
  }

  /**
   * Main render update loop
   */
  public async execute(world: World<any, any>, deltaTime: number): Promise<void> {
    if (!this.state.config.enableParallel) {
      this.renderSingleThreaded(world, deltaTime);
      return;
    }

    if (this.state.isProcessing) {
      BrowserLogger.warn("ParallelRenderSystem", "Skipping update - previous frame still processing");
      return;
    }

    const startTime = performance.now();
    this.state.isProcessing = true;

    try {
      await this.renderParallel(world, deltaTime);
    } catch (error) {
      BrowserLogger.error("ParallelRenderSystem", "Parallel render failed", error);
      // Fallback to single-threaded
      this.renderSingleThreaded(world, deltaTime);
    } finally {
      this.state.isProcessing = false;
      this.state.frameCount++;
      this.state.totalProcessingTime += performance.now() - startTime;
      this.lastUpdateTime = Date.now();
    }
  }

  /**
   * Single-threaded render update (fallback)
   */
  private renderSingleThreaded(world: World<any, any>, deltaTime: number): void {
    // Get renderable entities
    const entities = world.getEntitiesWith("position", "pixelArt", "renderLayer");
    
    // Sort by render layer
    const sortedEntities = [...entities].sort((a: any, b: any) => {
      const layerA = world.getComponent(a, "renderLayer")?.order || 0;
      const layerB = world.getComponent(b, "renderLayer")?.order || 0;
      return layerA - layerB;
    });

    // Process each entity
    for (const entity of sortedEntities) {
      this.processEntity(entity, world, deltaTime);
    }
  }

  /**
   * Parallel render update using worker threads
   */
  private async renderParallel(world: World<any, any>, deltaTime: number): Promise<void> {
    // Get renderable entities
    const entities = world.getEntitiesWith("position", "pixelArt", "renderLayer");
    
    if (entities.length === 0) {
      return; // No entities to render
    }

    // Split entities into chunks for parallel processing
    const chunkSize = Math.min(this.state.config.maxEntitiesPerWorker, 
      Math.ceil(entities.length / this.state.config.workerCount));
    const chunks: any[][] = [];

    for (let i = 0; i < entities.length; i += chunkSize) {
      const chunk = [];
      for (let j = i; j < Math.min(i + chunkSize, entities.length); j++) {
        const entity = entities[j];
        chunk.push({
          id: entity.id,
          position: world.getComponent(entity, "position"),
          pixelArt: world.getComponent(entity, "pixelArt"),
          renderLayer: world.getComponent(entity, "renderLayer"),
          velocity: world.getComponent(entity, "velocity")
        });
      }
      chunks.push(chunk);
    }

    // Get viewport and camera
    const viewport = world.getResource("viewport");
    const camera = world.getResource("camera");

    // Submit tasks to worker pool
    const tasks = chunks.map((chunk, index) => ({
      id: `render-chunk-${index}`,
      type: 'render-batch',
      data: {
        entities: chunk,
        deltaTime,
        viewport,
        camera,
        renderBounds: this.getRenderBounds(viewport, camera)
      },
      priority: 'high',
      createdAt: Date.now()
    } as RenderTask));

    if (!this.state.workerPool) {
      throw new Error("Worker pool not initialized");
    }

    // Execute tasks in parallel
    const results = await Promise.all(
      tasks.map(task => this.state.workerPool!.submitTask(task))
    );

    // Apply results back to render pipeline
    this.applyResults(world, results);
  }

  /**
   * Process a single entity for rendering
   */
  private processEntity(entity: any, world: World<any, any>, deltaTime: number): void {
    const position = world.getComponent(entity, "position");
    const pixelArt = world.getComponent(entity, "pixelArt");
    const renderLayer = world.getComponent(entity, "renderLayer");
    
    if (!position || !pixelArt || !renderLayer) {
      return;
    }

    // Calculate screen position
    const screenPos = this.calculateScreenPosition(position, world);
    
    // Cull if outside viewport
    if (!this.isInViewport(screenPos, pixelArt, world)) {
      return;
    }

    // Update entity with calculated values
    world.addComponents(entity, {
      renderData: {
        screenPosition: screenPos,
        visible: true,
        lastRenderTime: Date.now()
      }
    });
  }

  /**
   * Calculate screen position for an entity
   */
  private calculateScreenPosition(position: any, world: World<any, any>): { x: number; y: number } {
    const camera = world.getResource("camera");
    const viewport = world.getResource("viewport");
    
    if (!camera || !viewport) {
      return { x: position.x, y: position.y };
    }

    // Apply camera transform
    const screenX = (position.x - camera.x) * camera.zoom + viewport.width / 2;
    const screenY = (position.y - camera.y) * camera.zoom + viewport.height / 2;

    return { x: screenX, y: screenY };
  }

  /**
   * Check if entity is in viewport
   */
  private isInViewport(screenPos: { x: number; y: number }, pixelArt: any, world: World<any, any>): boolean {
    const viewport = world.getResource("viewport");
    if (!viewport) return true;

    const padding = 100; // Extra padding for smooth transitions
    const bounds = {
      left: -padding,
      right: viewport.width + padding,
      top: -padding,
      bottom: viewport.height + padding
    };

    return screenPos.x >= bounds.left && 
           screenPos.x <= bounds.right && 
           screenPos.y >= bounds.top && 
           screenPos.y <= bounds.bottom;
  }

  /**
   * Get render bounds for culling
   */
  private getRenderBounds(viewport: any, camera: any): any {
    if (!viewport || !camera) {
      return { x: -1000, y: -1000, width: 2000, height: 2000 };
    }

    return {
      x: camera.x - viewport.width / (2 * camera.zoom),
      y: camera.y - viewport.height / (2 * camera.zoom),
      width: viewport.width / camera.zoom,
      height: viewport.height / camera.zoom
    };
  }

  /**
   * Apply worker results back to render pipeline
   */
  private applyResults(world: World<any, any>, results: WorkerTaskResult[]): void {
    const renderStats = world.getResource("renderStats");
    
    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("ParallelRenderSystem", `Render task failed`, result.error);
        continue;
      }

      // Update render statistics
      if (renderStats && result.data.stats) {
        renderStats.drawCalls += result.data.stats.drawCalls || 0;
        renderStats.visibleEntities += result.data.stats.visibleEntities || 0;
      }

      // Apply render data to entities
      if (result.data.entities) {
        for (const entityData of result.data.entities) {
          // Note: In a real implementation, we'd need a way to find entities by ID
          // For now, this is a placeholder for the concept
          BrowserLogger.debug("ParallelRenderSystem", `Processing render data for entity ${entityData.id}`);
        }
      }
    }
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
    entitiesRendered: number;
  } {
    const world = { getResource: (key: string) => ({}) } as World<any, any>;
    const renderStats = world.getResource("renderStats");
    const entitiesRendered = renderStats?.visibleEntities || 0;

    return {
      frameCount: this.state.frameCount,
      totalProcessingTime: this.state.totalProcessingTime,
      averageFrameTime: this.state.frameCount > 0 ? this.state.totalProcessingTime / this.state.frameCount : 0,
      isParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount,
      entitiesRendered
    };
  }

  /**
   * Reconfigure parallel render system
   */
  public reconfigure(config: Partial<ParallelRenderConfig>): void {
    const oldConfig = this.state.config;
    this.state.config = { ...this.state.config, ...config };

    BrowserLogger.info("ParallelRenderSystem", "Configuration updated", {
      old: oldConfig,
      new: this.state.config
    });

    // If worker count changed, reinitialize worker pool
    if (config.workerCount && config.workerCount !== oldConfig.workerCount) {
      BrowserLogger.info("ParallelRenderSystem", "Worker count changed, reinitializing");
      this.initialize({} as any).catch(error => {
        BrowserLogger.error("ParallelRenderSystem", "Failed to reinitialize", error);
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

    BrowserLogger.info("ParallelRenderSystem", "Cleanup complete", this.getStatistics());
  }

  /**
   * Get current system state
   */
  public getState(): ParallelRenderState {
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
    const optimalWorkers = Math.min(workerCount, Math.ceil(entityCount / this.state.config.maxEntitiesPerWorker));
    
    let speedup = Math.min(workerCount, optimalWorkers);
    let efficiency = speedup / workerCount;
    
    let recommendation = "Optimal configuration";
    if (entityCount < workerCount * this.state.config.maxEntitiesPerWorker) {
      recommendation = "Consider reducing worker count for current entity load";
      efficiency = entityCount / (workerCount * this.state.config.maxEntitiesPerWorker);
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

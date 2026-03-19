/**
 * Integrated Render System
 * 
 * Seamlessly integrates parallel rendering with the existing engine.
 * Automatically switches between single-threaded and parallel processing based on entity count.
 */

import type { PositionComponent } from "../shared/types";
import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { 
  ParallelRenderConfig,
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

interface RenderableEntity {
  id: number;
  position: PositionComponent;
  pixelArt: EngineComponents["pixelArt"];
  layer: number;
  screenX: number;
  screenY: number;
  width: number;
  height: number;
  visible: boolean;
}

interface IntegratedRenderState {
  config: ParallelRenderConfig;
  workerPool?: any;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
  lastPerformanceCheck: number;
  entityCountThreshold: number;
  parallelMode: boolean;
  performanceHistory: number[];
  staticSpriteCache: Map<string, HTMLCanvasElement | OffscreenCanvas>;
}

/**
 * Integrated Render System
 * 
 * Provides seamless integration between single-threaded and parallel rendering.
 * Automatically switches modes based on entity count and performance metrics.
 */
export class IntegratedRenderSystem implements System<EngineComponents, EngineResources> {
  private state: IntegratedRenderState;
  private lastUpdateTime = 0;

  constructor(config?: Partial<ParallelRenderConfig>) {
    const defaultConfig: ParallelRenderConfig = {
      enableParallel: true,
      maxEntitiesPerWorker: 1250,
      batchSize: 100,
      workerCount: Math.max(2, require('os').cpus().length - 1),
      enableFrustumCulling: true
    };

    this.state = {
      config: { ...defaultConfig, ...config },
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0,
      lastPerformanceCheck: Date.now(),
      entityCountThreshold: 200, // Switch to parallel at 200 entities
      parallelMode: false,
      performanceHistory: [],
      staticSpriteCache: new Map()
    };

    BrowserLogger.info("IntegratedRenderSystem", "Created", {
      enableParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount,
      entityThreshold: this.state.entityCountThreshold
    });
  }

  /**
   * Initialize the integrated render system
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    // Initialize worker pool if parallel processing is enabled
    if (this.state.config.enableParallel) {
      try {
        const WorkerPool = await getWorkerPool();
        
        this.state.workerPool = new WorkerPool({
          maxWorkers: this.state.config.workerCount,
          minWorkers: Math.max(1, Math.floor(this.state.config.workerCount / 2)),
          taskTimeout: 5000,
          maxMemoryUsage: 256,
          enablePerformanceMonitoring: true
        });

        BrowserLogger.info("IntegratedRenderSystem", "Worker pool initialized", {
          workerCount: this.state.config.workerCount
        });
      } catch (error) {
        BrowserLogger.error("IntegratedRenderSystem", "Failed to initialize worker pool", error);
        this.state.config.enableParallel = false;
      }
    }

    BrowserLogger.info("IntegratedRenderSystem", "Initialized", {
      parallelMode: this.state.config.enableParallel
    });
  }

  /**
   * Main render loop with automatic mode switching
   */
  public execute(world: World<EngineComponents, EngineResources>): void {
    const startTime = performance.now();
    
    // Get required resources
    const canvas = world.getResource("canvas");
    const context = world.getResource("context");
    const viewport = world.getResource("viewport");
    const camera = world.getResource("camera");
    const blueprintLibrary = world.getResource("blueprintLibrary");
    const renderStats = world.getResource("renderStats");
    const runtimeMetrics = world.getResource("runtimeMetrics");

    if (!canvas || !context || !viewport || !camera || !renderStats || !blueprintLibrary || !runtimeMetrics) {
      return;
    }

    // Get renderable entities
    const entities = this.getRenderableEntities(world, camera, viewport);
    const entityCount = entities.length;

    // Check if we should switch processing modes
    this.updateProcessingMode(entityCount);

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = viewport.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Reset render stats
    renderStats.drawCalls = 0;
    renderStats.visibleEntities = 0;

    try {
      if (this.state.parallelMode && this.state.config.enableParallel) {
        this.executeParallel(world, context, entities, camera, blueprintLibrary, renderStats);
      } else {
        this.executeSingleThreaded(world, context, entities, camera, blueprintLibrary, renderStats);
      }
    } catch (error) {
      BrowserLogger.error("IntegratedRenderSystem", "Render update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, context, entities, camera, blueprintLibrary, renderStats);
    }

    // Update performance metrics
    const executionTime = performance.now() - startTime;
    this.updatePerformanceMetrics(executionTime, entityCount);
  }

  /**
   * Decide whether to use parallel or single-threaded processing
   */
  private updateProcessingMode(entityCount: number): void {
    const now = Date.now();
    
    // Check performance every 5 seconds
    if (now - this.state.lastPerformanceCheck > 5000) {
      this.state.lastPerformanceCheck = now;
      
      const avgPerformance = this.state.performanceHistory.length > 0
        ? this.state.performanceHistory.reduce((sum, time) => sum + time, 0) / this.state.performanceHistory.length
        : 0;

      // Switch to parallel if we have enough entities and performance is acceptable
      const shouldUseParallel = entityCount >= this.state.entityCountThreshold && 
                              this.state.config.enableParallel &&
                              avgPerformance < 16.67; // Less than 60fps worth of work

      if (shouldUseParallel !== this.state.parallelMode) {
        this.state.parallelMode = shouldUseParallel;
        BrowserLogger.info("IntegratedRenderSystem", "Switched processing mode", {
          mode: this.state.parallelMode ? "parallel" : "single-threaded",
          entityCount,
          avgPerformance: avgPerformance.toFixed(2)
        });
      }
    }
  }

  /**
   * Get renderable entities with frustum culling
   */
  private getRenderableEntities(world: World<EngineComponents, EngineResources>, camera: EngineResources["camera"], viewport: EngineResources["viewport"]): RenderableEntity[] {
    const entities = [...world.getEntitiesWith("position", "pixelArt", "renderLayer")];
    const renderableEntities: RenderableEntity[] = [];

    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const pixelArt = world.getComponent(entity, "pixelArt");
      const renderLayer = world.getComponent(entity, "renderLayer");

      if (!position || !pixelArt || !renderLayer) {
        continue;
      }

      // Calculate screen position and dimensions
      const matrix = this.getRenderableFrame(pixelArt).matrix;
      const width = (matrix[0]?.length ?? 0) * pixelArt.pixelSize;
      const height = matrix.length * pixelArt.pixelSize;
      const screenX = position.x - camera.x;
      const screenY = position.y - camera.y;

      // Frustum culling
      const visible = this.state.config.enableFrustumCulling 
        ? (screenX + width >= 0 && screenY + height >= 0 && screenX <= viewport.width && screenY <= viewport.height)
        : true;

      renderableEntities.push({
        id: entity.id,
        position,
        pixelArt,
        layer: renderLayer.order ?? 0,
        screenX,
        screenY,
        width,
        height,
        visible
      });
    }

    // Sort by layer and Y position for proper rendering order
    return renderableEntities.sort((a, b) => {
      if (a.layer !== b.layer) {
        return a.layer - b.layer;
      }
      return a.position.y - b.position.y;
    });
  }

  /**
   * Single-threaded render update
   */
  private executeSingleThreaded(
    world: World<EngineComponents, EngineResources>,
    context: CanvasRenderingContext2D,
    entities: RenderableEntity[],
    camera: EngineResources["camera"],
    blueprintLibrary: EngineResources["blueprintLibrary"],
    renderStats: EngineResources["renderStats"]
  ): void {
    for (const entity of entities) {
      if (!entity.visible) {
        continue;
      }

      renderStats.visibleEntities += 1;
      renderStats.drawCalls += this.drawPixelArt(
        context,
        world,
        entity,
        camera,
        blueprintLibrary
      );
    }
  }

  /**
   * Parallel render update using worker threads
   */
  private async executeParallel(
    world: World<EngineComponents, EngineResources>,
    context: CanvasRenderingContext2D,
    entities: RenderableEntity[],
    camera: EngineResources["camera"],
    blueprintLibrary: EngineResources["blueprintLibrary"],
    renderStats: EngineResources["renderStats"]
  ): Promise<void> {
    if (this.state.isProcessing || !this.state.workerPool) {
      // Fallback to single-threaded if busy or no worker pool
      this.executeSingleThreaded(world, context, entities, camera, blueprintLibrary, renderStats);
      return;
    }

    this.state.isProcessing = true;

    try {
      // Filter visible entities
      const visibleEntities = entities.filter(e => e.visible);
      
      if (visibleEntities.length === 0) {
        return;
      }

      // Split entities into chunks for parallel processing
      const chunkSize = Math.ceil(visibleEntities.length / this.state.config.workerCount);
      const chunks: RenderableEntity[][] = [];

      for (let i = 0; i < visibleEntities.length; i += chunkSize) {
        chunks.push(visibleEntities.slice(i, i + chunkSize));
      }

      // Create render tasks
      const tasks = chunks.map((chunk, index) => ({
        id: `render-chunk-${index}`,
        type: 'render-calculation',
        data: {
          entities: chunk.map(e => ({
            id: e.id,
            position: e.position,
            size: { width: e.width, height: e.height },
            rotation: 0,
            color: '#ffffff',
            visible: true,
            renderLayer: { order: e.layer },
            pixelArt: e.pixelArt
          })),
          camera: {
            position: { x: camera.x, y: camera.y },
            zoom: 1,
            viewport: { x: 0, y: 0, width: 800, height: 600 }
          },
          enableLOD: true
        },
        priority: 'high',
        createdAt: Date.now()
      }));

      // Execute tasks in parallel
      const results = await Promise.all(
        tasks.map(task => this.state.workerPool.submitTask(task))
      );

      // Apply results - render the prepared data
      this.applyParallelResults(context, results, renderStats);

    } catch (error) {
      BrowserLogger.error("IntegratedRenderSystem", "Parallel update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, context, entities, camera, blueprintLibrary, renderStats);
    } finally {
      this.state.isProcessing = false;
      this.state.frameCount++;
    }
  }

  /**
   * Apply parallel worker results to canvas
   */
  private applyParallelResults(
    context: CanvasRenderingContext2D,
    results: WorkerTaskResult[],
    renderStats: EngineResources["renderStats"]
  ): void {
    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("IntegratedRenderSystem", `Render task failed`, result.error);
        continue;
      }

      const renderData = result.data.renderData;
      for (const batch of renderData) {
        for (const entity of batch.entities) {
          // Simple rectangle rendering for parallel results
          // In a real implementation, this would use the full pixel art rendering
          context.fillStyle = entity.color || '#ffffff';
          context.fillRect(entity.x, entity.y, entity.width, entity.height);
          renderStats.drawCalls++;
          renderStats.visibleEntities++;
        }
      }
    }
  }

  /**
   * Draw pixel art (from original RenderSystem)
   */
  private drawPixelArt(
    context: CanvasRenderingContext2D,
    world: World<EngineComponents, EngineResources>,
    entity: RenderableEntity,
    camera: EngineResources["camera"],
    blueprintLibrary: EngineResources["blueprintLibrary"],
    depth = 0,
  ): number {
    if (depth > 4) {
      return 0;
    }

    let drawCalls = 0;
    let activeColor = "";
    const frame = this.getRenderableFrame(entity.pixelArt);
    const matrix = frame.matrix;
    const height = matrix.length;
    const width = matrix[0]?.length ?? 0;
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const velocity = world.getComponent({ id: entity.id } as any, "velocity");

    // Use cached static sprite if available and entity is static
    if (
      depth === 0 &&
      runtimeMetrics?.lowPerformanceMode &&
      velocity &&
      velocity.x === 0 &&
      velocity.y === 0
    ) {
      const cached = this.getCachedStaticSprite(entity.pixelArt, frame.frameIndex);
      context.drawImage(
        cached,
        Math.round(entity.screenX),
        Math.round(entity.screenY),
      );
      return 1;
    }

    // Render pixels
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const sourceColumn = entity.pixelArt.flipX ? width - column - 1 : column;
        const sourceRow = entity.pixelArt.flipY ? height - row - 1 : row;
        const colorKey = matrix[sourceRow]?.[sourceColumn];
        if (!colorKey) {
          continue;
        }

        const color = entity.pixelArt.colorMap[colorKey];
        if (!color) {
          continue;
        }

        if (activeColor !== color) {
          context.fillStyle = color;
          activeColor = color;
        }

        context.fillRect(
          Math.round(entity.screenX) + column * entity.pixelArt.pixelSize,
          Math.round(entity.screenY) + row * entity.pixelArt.pixelSize,
          entity.pixelArt.pixelSize,
          entity.pixelArt.pixelSize,
        );
        drawCalls += 1;
      }
    }

    // Render child blueprints
    for (const child of entity.pixelArt.childBlueprints ?? []) {
      const blueprint = blueprintLibrary.get(child.blueprintName);
      if (!blueprint) {
        continue;
      }

      drawCalls += this.drawPixelArt(
        context,
        world,
        {
          id: entity.id,
          position: {
            x: entity.position.x + child.offsetX,
            y: entity.position.y + child.offsetY,
          },
          pixelArt: {
            ...blueprint,
            flipX: child.flipX ?? blueprint.flipX,
            flipY: child.flipY ?? blueprint.flipY,
          },
          layer: entity.layer,
          screenX: entity.screenX + child.offsetX,
          screenY: entity.screenY + child.offsetY,
          width: 0, // Will be calculated
          height: 0, // Will be calculated
          visible: true
        },
        camera,
        blueprintLibrary,
        depth + 1,
      );
    }

    return drawCalls;
  }

  /**
   * Get renderable frame from pixel art
   */
  private getRenderableFrame(pixelArt: EngineComponents["pixelArt"]): {
    frameIndex: number;
    matrix: string[][];
  } {
    if (pixelArt.spriteFrames && pixelArt.spriteFrames.length > 0) {
      const frameIndex = Math.floor(performance.now() / 220) % pixelArt.spriteFrames.length;
      return {
        frameIndex,
        matrix: pixelArt.spriteFrames[frameIndex],
      };
    }
    return {
      frameIndex: 0,
      matrix: pixelArt.matrix,
    };
  }

  /**
   * Get cached static sprite
   */
  private getCachedStaticSprite(pixelArt: EngineComponents["pixelArt"], frameIndex: number): HTMLCanvasElement | OffscreenCanvas {
    const cacheKey = `pixelart-${frameIndex}`;
    let cached = this.state.staticSpriteCache.get(cacheKey);

    if (!cached) {
      const frame = pixelArt.spriteFrames?.[frameIndex] ?? pixelArt.matrix;
      const height = frame.length;
      const width = frame[0]?.length ?? 0;

      cached = document.createElement("canvas");
      cached.width = width * pixelArt.pixelSize;
      cached.height = height * pixelArt.pixelSize;
      const ctx = cached.getContext("2d");

      if (ctx) {
        for (let row = 0; row < height; row++) {
          for (let column = 0; column < width; column++) {
            const colorKey = frame[row][column];
            if (!colorKey) continue;

            const color = pixelArt.colorMap[colorKey];
            if (!color) continue;

            ctx.fillStyle = color;
            ctx.fillRect(
              column * pixelArt.pixelSize,
              row * pixelArt.pixelSize,
              pixelArt.pixelSize,
              pixelArt.pixelSize,
            );
          }
        }
      }

      this.state.staticSpriteCache.set(cacheKey, cached);
    }

    return cached;
  }

  /**
   * Update performance metrics for mode switching
   */
  private updatePerformanceMetrics(executionTime: number, entityCount: number): void {
    this.state.performanceHistory.push(executionTime);
    
    // Keep only last 60 samples (1 minute at 60fps)
    if (this.state.performanceHistory.length > 60) {
      this.state.performanceHistory.shift();
    }
    
    this.state.totalProcessingTime += executionTime;
    this.lastUpdateTime = Date.now();

    // Log performance warnings
    if (executionTime > 16.67) { // More than 60fps worth of work
      BrowserLogger.warn("IntegratedRenderSystem", "Render update taking too long", {
        executionTime: executionTime.toFixed(2),
        entityCount,
        mode: this.state.parallelMode ? "parallel" : "single-threaded"
      });
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): any {
    const avgExecutionTime = this.state.performanceHistory.length > 0
      ? this.state.performanceHistory.reduce((sum, time) => sum + time, 0) / this.state.performanceHistory.length
      : 0;

    return {
      parallelMode: this.state.parallelMode,
      frameCount: this.state.frameCount,
      averageExecutionTime: avgExecutionTime,
      totalProcessingTime: this.state.totalProcessingTime,
      entityCountThreshold: this.state.entityCountThreshold,
      workerCount: this.state.config.workerCount,
      maxEntitiesPerWorker: this.state.config.maxEntitiesPerWorker,
      cachedSprites: this.state.staticSpriteCache.size
    };
  }

  /**
   * Configure the system
   */
  configure(config: Partial<ParallelRenderConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    BrowserLogger.info("IntegratedRenderSystem", "Configuration updated", this.state.config);
  }

  /**
   * Force enable/disable parallel mode
   */
  setParallelMode(enabled: boolean): void {
    this.state.parallelMode = enabled && this.state.config.enableParallel;
    BrowserLogger.info("IntegratedRenderSystem", "Parallel mode changed", {
      enabled: this.state.parallelMode
    });
  }

  /**
   * Clear static sprite cache
   */
  clearCache(): void {
    this.state.staticSpriteCache.clear();
    BrowserLogger.info("IntegratedRenderSystem", "Static sprite cache cleared");
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    if (this.state.workerPool) {
      await this.state.workerPool.shutdown();
      this.state.workerPool = undefined;
    }
    
    this.state.staticSpriteCache.clear();
    BrowserLogger.info("IntegratedRenderSystem", "Shutdown complete");
  }
}

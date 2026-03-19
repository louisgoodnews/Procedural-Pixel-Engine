/**
 * Integrated Physics System
 * 
 * Seamlessly integrates parallel physics processing with the existing engine.
 * Automatically switches between single-threaded and parallel processing based on load.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources, PhysicsDebugContact } from "../engine/types";
import type { 
  ParallelPhysicsConfig,
  PhysicsTask,
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

interface ResolvedCollider {
  height: number;
  isTrigger: boolean;
  layer: string;
  left: number;
  mask: string[];
  radius?: number;
  shape: "circle" | "rect";
  top: number;
  width: number;
}

interface IntegratedPhysicsState {
  config: ParallelPhysicsConfig;
  workerPool?: any;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
  lastPerformanceCheck: number;
  entityCountThreshold: number;
  parallelMode: boolean;
  performanceHistory: number[];
}

/**
 * Integrated Physics System
 * 
 * Provides seamless integration between single-threaded and parallel physics processing.
 * Automatically switches modes based on entity count and performance metrics.
 */
export class IntegratedPhysicsSystem implements System<EngineComponents, EngineResources> {
  private state: IntegratedPhysicsState;
  private lastUpdateTime = 0;

  constructor(config?: Partial<ParallelPhysicsConfig>) {
    const defaultConfig: ParallelPhysicsConfig = {
      enableParallel: true,
      maxConcurrentSimulations: 4,
      timestepMs: 16.67,
      substeps: 2,
      workerCount: Math.max(2, require('os').cpus().length - 1)
    };

    this.state = {
      config: { ...defaultConfig, ...config },
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0,
      lastPerformanceCheck: Date.now(),
      entityCountThreshold: 100, // Switch to parallel at 100 entities
      parallelMode: false,
      performanceHistory: []
    };

    BrowserLogger.info("IntegratedPhysicsSystem", "Created", {
      enableParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount,
      entityThreshold: this.state.entityCountThreshold
    });
  }

  /**
   * Initialize the integrated physics system
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    // Initialize physics runtime resource
    world.setResource("physicsRuntime", {
      contacts: [],
      fixedDeltaMs: this.state.config.timestepMs,
      gravity: { x: 0, y: 240 },
    });

    // Initialize worker pool if parallel processing is enabled
    if (this.state.config.enableParallel) {
      try {
        const WorkerPool = await getWorkerPool();
        
        this.state.workerPool = new WorkerPool({
          maxWorkers: this.state.config.workerCount,
          minWorkers: Math.max(1, Math.floor(this.state.config.workerCount / 2)),
          taskTimeout: 5000,
          maxMemoryUsage: 512,
          enablePerformanceMonitoring: true
        });

        BrowserLogger.info("IntegratedPhysicsSystem", "Worker pool initialized", {
          workerCount: this.state.config.workerCount
        });
      } catch (error) {
        BrowserLogger.error("IntegratedPhysicsSystem", "Failed to initialize worker pool", error);
        this.state.config.enableParallel = false;
      }
    }

    BrowserLogger.info("IntegratedPhysicsSystem", "Initialized", {
      parallelMode: this.state.config.enableParallel
    });
  }

  /**
   * Main physics update loop with automatic mode switching
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    const startTime = performance.now();
    
    // Get entities that need physics processing
    const entities = [...world.getEntitiesWith("position", "velocity")];
    const entityCount = entities.length;

    // Check if we should switch processing modes
    this.updateProcessingMode(entityCount);

    try {
      if (this.state.parallelMode && this.state.config.enableParallel) {
        this.executeParallel(world, deltaTime, entities);
      } else {
        this.executeSingleThreaded(world, deltaTime, entities);
      }
    } catch (error) {
      BrowserLogger.error("IntegratedPhysicsSystem", "Physics update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, deltaTime, entities);
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
        BrowserLogger.info("IntegratedPhysicsSystem", "Switched processing mode", {
          mode: this.state.parallelMode ? "parallel" : "single-threaded",
          entityCount,
          avgPerformance: avgPerformance.toFixed(2)
        });
      }
    }
  }

  /**
   * Single-threaded physics update
   */
  private executeSingleThreaded(world: World<EngineComponents, EngineResources>, deltaTime: number, entities: any[]): void {
    const viewport = world.getResource("viewport");
    const physicsRuntime = world.getResource("physicsRuntime");
    const contacts: PhysicsDebugContact[] = [];
    const fixedDeltaSeconds = (physicsRuntime?.fixedDeltaMs ?? 16) / 1000;
    const stepSeconds = fixedDeltaSeconds > 0 ? fixedDeltaSeconds : deltaTime;

    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const velocity = world.getComponent(entity, "velocity");
      const body = world.getComponent(entity, "physicsBody");
      const pixelArt = world.getComponent(entity, "pixelArt");

      if (!position || !velocity) {
        continue;
      }

      if (body?.bodyType !== "static") {
        // Apply gravity
        velocity.x += (physicsRuntime?.gravity.x ?? 0) * (body?.gravityScale ?? 0) * stepSeconds;
        velocity.y += (physicsRuntime?.gravity.y ?? 0) * (body?.gravityScale ?? 0) * stepSeconds;

        // Apply friction
        const friction = Math.min(1, Math.max(0, body?.friction ?? 0));
        const damping = Math.max(0, 1 - friction * stepSeconds);
        velocity.x *= damping;
        velocity.y *= damping;

        // Update position
        position.x += velocity.x * stepSeconds;
        position.y += velocity.y * stepSeconds;
      }

      // Update components
      world.addComponents(entity, { position, velocity });
    }

    // Handle collisions
    this.handleCollisions(world, entities, contacts);
    
    // Update physics runtime
    if (physicsRuntime) {
      physicsRuntime.contacts = contacts;
    }
  }

  /**
   * Parallel physics update using worker threads
   */
  private async executeParallel(world: World<EngineComponents, EngineResources>, deltaTime: number, entities: any[]): Promise<void> {
    if (this.state.isProcessing || !this.state.workerPool) {
      // Fallback to single-threaded if busy or no worker pool
      this.executeSingleThreaded(world, deltaTime, entities);
      return;
    }

    this.state.isProcessing = true;

    try {
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

      // Create physics tasks
      const tasks = chunks.map((chunk, index) => ({
        id: `physics-chunk-${index}`,
        type: 'physics-update',
        data: {
          entities: chunk,
          deltaTime: deltaTime / 1000,
          substeps: this.state.config.substeps,
          worldBounds: this.getWorldBounds(world)
        },
        priority: 'high',
        createdAt: Date.now()
      } as PhysicsTask));

      // Execute tasks in parallel
      const results = await Promise.all(
        tasks.map(task => this.state.workerPool.submitTask(task))
      );

      // Apply results back to entities
      this.applyParallelResults(world, results, entities);
      
      // Handle collisions in main thread (for now)
      const contacts: PhysicsDebugContact[] = [];
      this.handleCollisions(world, entities, contacts);
      
      // Update physics runtime
      const physicsRuntime = world.getResource("physicsRuntime");
      if (physicsRuntime) {
        physicsRuntime.contacts = contacts;
      }

    } catch (error) {
      BrowserLogger.error("IntegratedPhysicsSystem", "Parallel update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, deltaTime, entities);
    } finally {
      this.state.isProcessing = false;
      this.state.frameCount++;
    }
  }

  /**
   * Apply parallel worker results back to world entities
   */
  private applyParallelResults(world: World<EngineComponents, EngineResources>, results: WorkerTaskResult[], originalEntities: any[]): void {
    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("IntegratedPhysicsSystem", `Physics task failed`, result.error);
        continue;
      }

      const chunkIndex = parseInt(result.taskId.split('-')[2]);
      const chunkSize = Math.ceil(originalEntities.length / this.state.config.maxConcurrentSimulations);
      const chunkStart = chunkIndex * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, originalEntities.length);

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
        }
      }
    }
  }

  /**
   * Handle collision detection and response
   */
  private handleCollisions(world: World<EngineComponents, EngineResources>, entities: any[], contacts: PhysicsDebugContact[]): void {
    const physicsEntities = entities.filter(entity => 
      world.getComponent(entity, "collider")
    );

    for (let i = 0; i < physicsEntities.length; i++) {
      for (let j = i + 1; j < physicsEntities.length; j++) {
        const entityA = physicsEntities[i];
        const entityB = physicsEntities[j];
        
        const positionA = world.getComponent(entityA, "position");
        const colliderA = world.getComponent(entityA, "collider");
        const positionB = world.getComponent(entityB, "position");
        const colliderB = world.getComponent(entityB, "collider");

        if (!positionA || !colliderA || !positionB || !colliderB) {
          continue;
        }

        const resolvedA = this.resolveCollider(positionA, colliderA);
        const resolvedB = this.resolveCollider(positionB, colliderB);

        if (this.collidersOverlap(resolvedA, resolvedB)) {
          // Add debug contact
          contacts.push({
            entityA: entityA.id,
            entityB: entityB.id,
            isTrigger: resolvedA.isTrigger || resolvedB.isTrigger,
            layerA: resolvedA.layer,
            layerB: resolvedB.layer
          });

          // Simple collision response
          this.resolveCollision(world, entityA, entityB, resolvedA, resolvedB);
        }
      }
    }
  }

  /**
   * Resolve collision between two entities
   */
  private resolveCollision(world: World<EngineComponents, EngineResources>, entityA: any, entityB: any, colliderA: ResolvedCollider, colliderB: ResolvedCollider): void {
    const velocityA = world.getComponent(entityA, "velocity");
    const velocityB = world.getComponent(entityB, "velocity");
    const bodyA = world.getComponent(entityA, "physicsBody");
    const bodyB = world.getComponent(entityB, "physicsBody");

    if (!velocityA || !velocityB) {
      return;
    }

    // Skip if both are static
    if (bodyA?.bodyType === "static" && bodyB?.bodyType === "static") {
      return;
    }

    // Simple separation
    const overlapX = Math.min(colliderA.left + colliderA.width - colliderB.left, colliderB.left + colliderB.width - colliderA.left);
    const overlapY = Math.min(colliderA.top + colliderA.height - colliderB.top, colliderB.top + colliderB.height - colliderA.top);
    
    const separationX = overlapX < overlapY ? overlapX * 0.5 : 0;
    const separationY = overlapX >= overlapY ? overlapY * 0.5 : 0;

    const positionA = world.getComponent(entityA, "position");
    const positionB = world.getComponent(entityB, "position");

    if (positionA && positionB) {
      if (bodyA?.bodyType !== "static") {
        positionA.x -= separationX;
        positionA.y -= separationY;
      }
      if (bodyB?.bodyType !== "static") {
        positionB.x += separationX;
        positionB.y += separationY;
      }
    }
  }

  /**
   * Helper methods from original PhysicsSystem
   */
  private resolveCollider(position: any, collider: any): ResolvedCollider {
    const width = collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.width ?? 16);
    const height = collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.height ?? 16);

    return {
      height,
      isTrigger: collider?.isTrigger ?? false,
      layer: collider?.layer ?? "default",
      left: position.x + (collider?.offsetX ?? 0),
      mask: collider?.mask ? [...collider.mask] : ["default"],
      radius: collider?.radius,
      shape: collider?.shape ?? "rect",
      top: position.y + (collider?.offsetY ?? 0),
      width,
    };
  }

  private collidersOverlap(left: ResolvedCollider, right: ResolvedCollider): boolean {
    if (!left.mask.includes(right.layer) && !right.mask.includes(left.layer)) {
      return false;
    }

    if (left.shape === "circle" && right.shape === "circle") {
      const centerAX = left.left + (left.radius ?? left.width / 2);
      const centerAY = left.top + (left.radius ?? left.height / 2);
      const centerBX = right.left + (right.radius ?? right.width / 2);
      const centerBY = right.top + (right.radius ?? right.height / 2);
      const dx = centerAX - centerBX;
      const dy = centerAY - centerBY;
      const radius = (left.radius ?? left.width / 2) + (right.radius ?? right.width / 2);
      return dx * dx + dy * dy <= radius * radius;
    }

    return !(
      left.left + left.width < right.left ||
      right.left + right.width < left.left ||
      left.top + left.height < right.top ||
      right.top + right.height < left.top
    );
  }

  /**
   * Get world bounds for physics simulation
   */
  private getWorldBounds(world: World<EngineComponents, EngineResources>): any {
    const viewport = world.getResource("viewport");
    return {
      x: 0,
      y: 0,
      width: viewport?.width || 1920,
      height: viewport?.height || 1080
    };
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
      BrowserLogger.warn("IntegratedPhysicsSystem", "Physics update taking too long", {
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
      maxConcurrentSimulations: this.state.config.maxConcurrentSimulations
    };
  }

  /**
   * Configure the system
   */
  configure(config: Partial<ParallelPhysicsConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    BrowserLogger.info("IntegratedPhysicsSystem", "Configuration updated", this.state.config);
  }

  /**
   * Force enable/disable parallel mode
   */
  setParallelMode(enabled: boolean): void {
    this.state.parallelMode = enabled && this.state.config.enableParallel;
    BrowserLogger.info("IntegratedPhysicsSystem", "Parallel mode changed", {
      enabled: this.state.parallelMode
    });
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    if (this.state.workerPool) {
      await this.state.workerPool.shutdown();
      this.state.workerPool = undefined;
    }
    
    BrowserLogger.info("IntegratedPhysicsSystem", "Shutdown complete");
  }
}

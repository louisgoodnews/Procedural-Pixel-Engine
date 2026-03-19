/**
 * Integrated Particle System
 * 
 * Seamlessly integrates parallel particle processing with the existing engine.
 * Automatically switches between single-threaded and parallel processing based on particle count.
 */

import type {
  ParticleComponent,
  ParticleEmitter,
  ParticleInstance,
  ParticleSystem as ParticleSystemType,
  VFXPreset,
} from "../shared/types/particles";
import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { 
  ParallelParticleConfig,
  ParticleTask,
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

interface ActiveParticle extends ParticleInstance {
  age: number; // actual age in seconds
  maxAge: number; // lifetime in seconds
}

interface EmitterState {
  emitter: ParticleEmitter;
  emitAccumulator: number;
  particles: ActiveParticle[];
  lastBurstTime: number;
}

interface IntegratedParticleState {
  config: ParallelParticleConfig;
  workerPool?: any;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
  lastPerformanceCheck: number;
  particleCountThreshold: number;
  parallelMode: boolean;
  performanceHistory: number[];
  emitters: Map<string, EmitterState>;
  presets: Map<string, VFXPreset>;
  globalSettings: ParticleSystemType["globalSettings"];
}

/**
 * Integrated Particle System
 * 
 * Provides seamless integration between single-threaded and parallel particle processing.
 * Automatically switches modes based on particle count and performance metrics.
 */
export class IntegratedParticleSystem implements System<EngineComponents, EngineResources> {
  private state: IntegratedParticleState;
  private lastUpdateTime = 0;

  constructor(config?: Partial<ParallelParticleConfig>) {
    const defaultConfig: ParallelParticleConfig = {
      enableParallel: true,
      maxParticlesPerWorker: 2500,
      updateInterval: 16.67,
      workerCount: Math.max(2, require('os').cpus().length - 1),
      sharedMemory: true
    };

    this.state = {
      config: { ...defaultConfig, ...config },
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0,
      lastPerformanceCheck: Date.now(),
      particleCountThreshold: 500, // Switch to parallel at 500 particles
      parallelMode: false,
      performanceHistory: [],
      emitters: new Map(),
      presets: new Map(),
      globalSettings: {
        maxTotalParticles: 1000,
        performanceMode: false,
        debugMode: false,
      }
    };

    this.initializePresets();
    
    BrowserLogger.info("IntegratedParticleSystem", "Created", {
      enableParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount,
      particleThreshold: this.state.particleCountThreshold
    });
  }

  /**
   * Initialize the integrated particle system
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    // Initialize particle runtime resource
    world.setResource("particleRuntime", {
      allParticles: [],
      activeEmitters: 0,
      totalEmitted: 0,
      performanceMode: false,
    });

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

        BrowserLogger.info("IntegratedParticleSystem", "Worker pool initialized", {
          workerCount: this.state.config.workerCount
        });
      } catch (error) {
        BrowserLogger.error("IntegratedParticleSystem", "Failed to initialize worker pool", error);
        this.state.config.enableParallel = false;
      }
    }

    BrowserLogger.info("IntegratedParticleSystem", "Initialized", {
      parallelMode: this.state.config.enableParallel
    });
  }

  /**
   * Main particle update loop with automatic mode switching
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    const startTime = performance.now();
    
    // Get runtime metrics for performance monitoring
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const camera = world.getResource("camera");

    if (!runtimeMetrics || !camera) {
      return;
    }

    // Update performance mode based on frame rate
    this.state.globalSettings.performanceMode = runtimeMetrics.currentFps < 60;

    // Count total particles across all emitters
    const totalParticles = this.getTotalParticleCount();
    
    // Check if we should switch processing modes
    this.updateProcessingMode(totalParticles);

    try {
      if (this.state.parallelMode && this.state.config.enableParallel) {
        this.executeParallel(world, deltaTime, camera);
      } else {
        this.executeSingleThreaded(world, deltaTime, camera);
      }
    } catch (error) {
      BrowserLogger.error("IntegratedParticleSystem", "Particle update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, deltaTime, camera);
    }

    // Update performance metrics
    const executionTime = performance.now() - startTime;
    this.updatePerformanceMetrics(executionTime, totalParticles);

    // Clean up dead emitters
    this.cleanupDeadEmitters(world);

    // Update particle runtime resource
    this.updateParticleRuntimeResource(world);

    // Update debug info if enabled
    if (this.state.globalSettings.debugMode) {
      this.updateDebugInfo(world);
    }
  }

  /**
   * Decide whether to use parallel or single-threaded processing
   */
  private updateProcessingMode(particleCount: number): void {
    const now = Date.now();
    
    // Check performance every 5 seconds
    if (now - this.state.lastPerformanceCheck > 5000) {
      this.state.lastPerformanceCheck = now;
      
      const avgPerformance = this.state.performanceHistory.length > 0
        ? this.state.performanceHistory.reduce((sum, time) => sum + time, 0) / this.state.performanceHistory.length
        : 0;

      // Switch to parallel if we have enough particles and performance is acceptable
      const shouldUseParallel = particleCount >= this.state.particleCountThreshold && 
                              this.state.config.enableParallel &&
                              avgPerformance < 16.67; // Less than 60fps worth of work

      if (shouldUseParallel !== this.state.parallelMode) {
        this.state.parallelMode = shouldUseParallel;
        BrowserLogger.info("IntegratedParticleSystem", "Switched processing mode", {
          mode: this.state.parallelMode ? "parallel" : "single-threaded",
          particleCount,
          avgPerformance: avgPerformance.toFixed(2)
        });
      }
    }
  }

  /**
   * Single-threaded particle update
   */
  private executeSingleThreaded(world: World<EngineComponents, EngineResources>, deltaTime: number, camera: EngineResources["camera"]): void {
    // Update all active emitters
    for (const emitterState of this.state.emitters.values()) {
      this.updateEmitter(emitterState, deltaTime, world, camera);
    }
  }

  /**
   * Parallel particle update using worker threads
   */
  private async executeParallel(world: World<EngineComponents, EngineResources>, deltaTime: number, camera: EngineResources["camera"]): Promise<void> {
    if (this.state.isProcessing || !this.state.workerPool) {
      // Fallback to single-threaded if busy or no worker pool
      this.executeSingleThreaded(world, deltaTime, camera);
      return;
    }

    this.state.isProcessing = true;

    try {
      // Collect all particles from all emitters
      const allParticles: ActiveParticle[] = [];
      const emitterStates: Array<{ state: EmitterState; startIndex: number; count: number }> = [];

      for (const emitterState of this.state.emitters.values()) {
        const startIndex = allParticles.length;
        allParticles.push(...emitterState.particles);
        emitterStates.push({
          state: emitterState,
          startIndex,
          count: emitterState.particles.length
        });
      }

      if (allParticles.length === 0) {
        return; // No particles to process
      }

      // Split particles into chunks for parallel processing
      const chunkSize = Math.ceil(allParticles.length / this.state.config.workerCount);
      const chunks: ActiveParticle[][] = [];

      for (let i = 0; i < allParticles.length; i += chunkSize) {
        chunks.push(allParticles.slice(i, i + chunkSize));
      }

      // Create particle tasks
      const tasks = chunks.map((chunk, index) => ({
        id: `particle-chunk-${index}`,
        type: 'particle-update',
        data: {
          particles: chunk.map(p => ({
            id: p.id,
            position: { ...p.position },
            velocity: { ...p.velocity },
            acceleration: { x: 0, y: 0 },
            mass: 1,
            radius: p.size,
            color: p.color,
            life: p.life,
            maxLife: p.maxAge,
            isActive: p.life > 0
          })),
          deltaTime: deltaTime / 1000,
          forces: this.createGlobalForces(),
          constraints: []
        },
        priority: 'medium',
        createdAt: Date.now()
      } as ParticleTask));

      // Execute tasks in parallel
      const results = await Promise.all(
        tasks.map(task => this.state.workerPool.submitTask(task))
      );

      // Apply results back to particles
      this.applyParallelResults(results, allParticles);

      // Update emitter states with processed particles
      this.updateEmitterStates(emitterStates, allParticles);

      // Handle emission for all emitters
      for (const emitterState of this.state.emitters.values()) {
        this.handleEmission(emitterState, deltaTime, world, camera);
      }

    } catch (error) {
      BrowserLogger.error("IntegratedParticleSystem", "Parallel update failed", error);
      // Fallback to single-threaded
      this.executeSingleThreaded(world, deltaTime, camera);
    } finally {
      this.state.isProcessing = false;
      this.state.frameCount++;
    }
  }

  /**
   * Apply parallel worker results back to particles
   */
  private applyParallelResults(results: WorkerTaskResult[], allParticles: ActiveParticle[]): void {
    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("IntegratedParticleSystem", `Particle task failed`, result.error);
        continue;
      }

      const chunkIndex = parseInt(result.taskId.split('-')[2]);
      const chunkSize = Math.ceil(allParticles.length / this.state.config.workerCount);
      const chunkStart = chunkIndex * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, allParticles.length);

      for (let i = chunkStart; i < chunkEnd; i++) {
        const originalParticle = allParticles[i];
        const updatedParticle = result.data.particles.find((p: any) => p.id === originalParticle.id);
        
        if (updatedParticle) {
          // Update particle with results
          originalParticle.position = { ...updatedParticle.position };
          originalParticle.velocity = { ...updatedParticle.velocity };
          originalParticle.life = updatedParticle.life;
        }
      }
    }
  }

  /**
   * Update emitter states with processed particles
   */
  private updateEmitterStates(emitterStates: Array<{ state: EmitterState; startIndex: number; count: number }>, allParticles: ActiveParticle[]): void {
    for (const { state, startIndex, count } of emitterStates) {
      state.particles = allParticles.slice(startIndex, startIndex + count).filter(p => p.life > 0);
    }
  }

  /**
   * Handle emission for all emitters (done after parallel processing)
   */
  private handleEmission(emitterState: EmitterState, deltaTime: number, world: World<EngineComponents, EngineResources>, camera: EngineResources["camera"]): void {
    const { emitter } = emitterState;
    const now = performance.now() / 1000;

    // Handle burst emission
    if (emitter.burstCount && emitter.burstDelay) {
      if (now - emitterState.lastBurstTime >= emitter.burstDelay) {
        this.emitBurst(emitterState, world);
        emitterState.lastBurstTime = now;
      }
    }

    // Handle continuous emission
    if (emitter.emissionRate > 0) {
      emitterState.emitAccumulator += deltaTime * emitter.emissionRate;

      while (
        emitterState.emitAccumulator >= 1 &&
        emitterState.particles.length < emitter.maxParticles
      ) {
        this.emitParticle(emitterState, world, camera);
        emitterState.emitAccumulator -= 1;
      }
    }
  }

  /**
   * Create global forces for particle simulation
   */
  private createGlobalForces(): any[] {
    const forces = [];
    
    // Add gravity force
    forces.push({
      type: 'gravity',
      strength: 9.81 * 100,
      direction: { x: 0, y: 1 }
    });
    
    return forces;
  }

  /**
   * Get total particle count across all emitters
   */
  private getTotalParticleCount(): number {
    let total = 0;
    for (const emitterState of this.state.emitters.values()) {
      total += emitterState.particles.length;
    }
    return total;
  }

  /**
   * Methods from original ParticleSystem (adapted for integration)
   */
  private updateEmitter(
    emitterState: EmitterState,
    deltaTime: number,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const { emitter } = emitterState;
    const now = performance.now() / 1000;

    // Update existing particles
    this.updateParticles(emitterState, deltaTime, world, camera);

    // Handle burst emission
    if (emitter.burstCount && emitter.burstDelay) {
      if (now - emitterState.lastBurstTime >= emitter.burstDelay) {
        this.emitBurst(emitterState, world);
        emitterState.lastBurstTime = now;
      }
    }

    // Handle continuous emission
    if (emitter.emissionRate > 0) {
      emitterState.emitAccumulator += deltaTime * emitter.emissionRate;

      while (
        emitterState.emitAccumulator >= 1 &&
        emitterState.particles.length < emitter.maxParticles
      ) {
        this.emitParticle(emitterState, world, camera);
        emitterState.emitAccumulator -= 1;
      }
    }

    // Update particle count for debugging
    emitterState.particles = emitterState.particles.filter((p) => p.life > 0);
  }

  private updateParticles(
    emitterState: EmitterState,
    deltaTime: number,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const { emitter } = emitterState;

    for (const particle of emitterState.particles) {
      // Update age and life
      particle.age += deltaTime;
      particle.life = Math.max(0, 1 - particle.age / particle.maxAge);

      if (particle.life <= 0) {
        continue; // Particle will be removed in cleanup
      }

      // Apply physics
      this.applyParticlePhysics(particle, emitter, deltaTime);

      // Update visual properties
      this.updateParticleVisuals(particle, emitter, deltaTime);

      // Culling check
      if (emitter.cullingDistance) {
        const dx = particle.position.x - camera.x;
        const dy = particle.position.y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > emitter.cullingDistance) {
          particle.life = 0; // Kill particle if too far
        }
      }
    }
  }

  private applyParticlePhysics(
    particle: ActiveParticle,
    emitter: ParticleEmitter,
    deltaTime: number,
  ): void {
    // Apply gravity
    let gravityX = 0;
    let gravityY = 0;

    switch (emitter.gravityMode) {
      case "world":
        gravityX = emitter.gravityX;
        gravityY = emitter.gravityY;
        break;
      case "local":
        // Local gravity relative to particle's initial direction
        const angle = Math.atan2(particle.velocity.y, particle.velocity.x);
        gravityX = Math.cos(angle) * emitter.gravityX - Math.sin(angle) * emitter.gravityY;
        gravityY = Math.sin(angle) * emitter.gravityX + Math.cos(angle) * emitter.gravityY;
        break;
    }

    // Apply acceleration and gravity
    particle.velocity.x += (emitter.accelerationX + gravityX) * deltaTime;
    particle.velocity.y += (emitter.accelerationY + gravityY) * deltaTime;

    // Apply damping
    particle.velocity.x *= Math.pow(emitter.damping, deltaTime);
    particle.velocity.y *= Math.pow(emitter.damping, deltaTime);

    // Update position
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;
  }

  private updateParticleVisuals(particle: ActiveParticle, emitter: ParticleEmitter, deltaTime: number): void {
    // Update size
    switch (emitter.sizeMode) {
      case "constant":
        particle.size = emitter.sizeStart;
        break;
      case "curve":
        particle.size =
          emitter.sizeStart + (emitter.sizeEnd || emitter.sizeStart) * (1 - particle.life);
        break;
      case "random":
        const randomSize = emitter.sizeRandomness ? Math.random() * emitter.sizeRandomness : 0;
        particle.size = emitter.sizeStart + randomSize;
        break;
    }

    // Update color
    switch (emitter.colorMode) {
      case "constant":
        particle.color = emitter.colorStart;
        break;
      case "gradient":
        particle.color = this.interpolateColor(
          emitter.colorStart,
          emitter.colorEnd || emitter.colorStart,
          1 - particle.life,
        );
        break;
      case "random":
        particle.color = emitter.colorStart;
        break;
    }

    // Update opacity
    switch (emitter.opacityMode) {
      case "constant":
        particle.opacity = emitter.opacityStart;
        break;
      case "fade":
        particle.opacity = particle.life * emitter.opacityStart;
        break;
      case "curve":
        const curve = emitter.opacityCurve || 1;
        particle.opacity = Math.pow(particle.life, curve) * emitter.opacityStart;
        break;
    }

    // Update rotation
    if (emitter.rotationSpeed) {
      particle.rotation += emitter.rotationSpeed * deltaTime;
    }
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    // Simple color interpolation (would need proper implementation)
    return t < 0.5 ? color1 : color2;
  }

  private emitParticle(emitterState: EmitterState, world: World<EngineComponents, EngineResources>, camera: EngineResources["camera"]): void {
    const { emitter } = emitterState;
    
    const particle: ActiveParticle = {
      id: `particle-${Date.now()}-${Math.random()}`,
      emitterId: emitter.id,
      position: { x: 0, y: 0 }, // Will be set by spawn shape
      velocity: { x: 0, y: 0 }, // Will be set by velocity mode
      size: emitter.sizeStart,
      color: emitter.colorStart,
      opacity: emitter.opacityStart,
      rotation: 0,
      life: 1,
      age: 0,
      maxAge: emitter.lifetime,
      createdAt: Date.now(),
    };

    // Apply spawn shape and velocity
    this.applySpawnProperties(particle, emitter);
    
    // Apply random variations
    if (emitter.sizeRandomness) {
      particle.size += (Math.random() - 0.5) * emitter.sizeRandomness;
    }

    emitterState.particles.push(particle);
  }

  private applySpawnProperties(particle: ActiveParticle, emitter: ParticleEmitter): void {
    // Apply spawn shape
    switch (emitter.spawnShape) {
      case "point":
        particle.position = { x: 0, y: 0 };
        break;
      case "circle":
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (emitter.spawnRadius || 10);
        particle.position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        };
        break;
      case "rectangle":
        particle.position = {
          x: (Math.random() - 0.5) * (emitter.spawnWidth || 20),
          y: (Math.random() - 0.5) * (emitter.spawnHeight || 20)
        };
        break;
      case "cone":
        const coneAngle = (emitter.spawnAngle || 0) + (Math.random() - 0.5) * (emitter.directionSpread || Math.PI / 4);
        const coneRadius = Math.random() * (emitter.spawnRadius || 10);
        particle.position = {
          x: Math.cos(coneAngle) * coneRadius,
          y: Math.sin(coneAngle) * coneRadius
        };
        break;
    }

    // Apply velocity mode
    switch (emitter.velocityMode) {
      case "directional":
        const dirAngle = emitter.directionAngle || 0;
        const dirSpread = emitter.directionSpread || 0;
        const finalAngle = dirAngle + (Math.random() - 0.5) * dirSpread;
        const speed = emitter.velocityMin + Math.random() * (emitter.velocityMax - emitter.velocityMin);
        particle.velocity = {
          x: Math.cos(finalAngle) * speed,
          y: Math.sin(finalAngle) * speed
        };
        break;
      case "radial":
        const radialAngle = Math.atan2(particle.position.y, particle.position.x);
        const radialSpeed = emitter.velocityMin + Math.random() * (emitter.velocityMax - emitter.velocityMin);
        particle.velocity = {
          x: Math.cos(radialAngle) * radialSpeed,
          y: Math.sin(radialAngle) * radialSpeed
        };
        break;
      case "random":
        const randomAngle = Math.random() * Math.PI * 2;
        const randomSpeed = emitter.velocityMin + Math.random() * (emitter.velocityMax - emitter.velocityMin);
        particle.velocity = {
          x: Math.cos(randomAngle) * randomSpeed,
          y: Math.sin(randomAngle) * randomSpeed
        };
        break;
    }
  }

  private emitBurst(emitterState: EmitterState, world: World<EngineComponents, EngineResources>): void {
    const { emitter } = emitterState;
    const burstCount = emitter.burstCount || 10;

    for (let i = 0; i < burstCount; i++) {
      this.emitParticle(emitterState, world, {} as EngineResources["camera"]);
    }
  }

  private cleanupDeadEmitters(world: World<EngineComponents, EngineResources>): void {
    // Remove emitters that have no particles and are not continuous
    for (const [id, emitterState] of this.state.emitters.entries()) {
      if (emitterState.particles.length === 0 && emitterState.emitter.emissionRate === 0) {
        this.state.emitters.delete(id);
      }
    }
  }

  private updateParticleRuntimeResource(world: World<EngineComponents, EngineResources>): void {
    const allParticles: any[] = [];
    let totalEmitted = 0;

    for (const emitterState of this.state.emitters.values()) {
      allParticles.push(...emitterState.particles.map(p => ({
        id: p.id,
        emitterId: p.emitterId,
        position: { ...p.position },
        velocity: { ...p.velocity },
        life: p.life,
        size: p.size,
        color: p.color,
        opacity: p.opacity,
        rotation: p.rotation,
        createdAt: p.createdAt,
        age: p.age,
        maxAge: p.maxAge
      })));
    }

    const particleRuntime = world.getResource("particleRuntime");
    if (particleRuntime) {
      particleRuntime.allParticles = allParticles;
      particleRuntime.activeEmitters = this.state.emitters.size;
      particleRuntime.totalEmitted += totalEmitted;
    }
  }

  private updateDebugInfo(world: World<EngineComponents, EngineResources>): void {
    // Debug info could be logged or stored in a custom resource
    // For now, we'll just log the particle count
    const particleCount = this.getTotalParticleCount();
    const activeEmitters = this.state.emitters.size;
    
    if (this.state.globalSettings.debugMode) {
      BrowserLogger.debug("IntegratedParticleSystem", "Debug info", {
        particleCount,
        activeEmitters,
        parallelMode: this.state.parallelMode
      });
    }
  }

  private initializePresets(): void {
    // Initialize default particle presets
    this.state.presets.set("explosion", {
      id: "explosion",
      name: "Explosion",
      category: "explosion",
      description: "Basic explosion effect",
      emitterTemplate: {
        emissionRate: 0,
        maxParticles: 100,
        lifetime: 2,
        gravityMode: "world",
        gravityX: 0,
        gravityY: 100,
        accelerationX: 0,
        accelerationY: 0,
        damping: 0.98,
        sizeMode: "curve",
        sizeStart: 8,
        sizeEnd: 2,
        colorMode: "gradient",
        colorStart: "#ff6600",
        colorEnd: "#ffaa00",
        opacityMode: "fade",
        opacityStart: 1,
        rotationMode: "none",
        rotationSpeed: 0,
        burstCount: 50,
        cullingDistance: 1000,
        spawnShape: "circle",
        spawnRadius: 20,
        velocityMode: "random",
        velocityMin: 50,
        velocityMax: 200,
        blendMode: "normal"
      }
    });
  }

  /**
   * Update performance metrics for mode switching
   */
  private updatePerformanceMetrics(executionTime: number, particleCount: number): void {
    this.state.performanceHistory.push(executionTime);
    
    // Keep only last 60 samples (1 minute at 60fps)
    if (this.state.performanceHistory.length > 60) {
      this.state.performanceHistory.shift();
    }
    
    this.state.totalProcessingTime += executionTime;
    this.lastUpdateTime = Date.now();

    // Log performance warnings
    if (executionTime > 16.67) { // More than 60fps worth of work
      BrowserLogger.warn("IntegratedParticleSystem", "Particle update taking too long", {
        executionTime: executionTime.toFixed(2),
        particleCount,
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
      particleCountThreshold: this.state.particleCountThreshold,
      workerCount: this.state.config.workerCount,
      maxParticlesPerWorker: this.state.config.maxParticlesPerWorker,
      totalParticles: this.getTotalParticleCount(),
      activeEmitters: this.state.emitters.size
    };
  }

  /**
   * Configure the system
   */
  configure(config: Partial<ParallelParticleConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    BrowserLogger.info("IntegratedParticleSystem", "Configuration updated", this.state.config);
  }

  /**
   * Force enable/disable parallel mode
   */
  setParallelMode(enabled: boolean): void {
    this.state.parallelMode = enabled && this.state.config.enableParallel;
    BrowserLogger.info("IntegratedParticleSystem", "Parallel mode changed", {
      enabled: this.state.parallelMode
    });
  }

  /**
   * Add an emitter to the system
   */
  addEmitter(emitter: ParticleEmitter): void {
    const emitterState: EmitterState = {
      emitter,
      emitAccumulator: 0,
      particles: [],
      lastBurstTime: 0,
    };
    
    this.state.emitters.set(emitter.id, emitterState);
    BrowserLogger.debug("IntegratedParticleSystem", "Added emitter", { emitterId: emitter.id });
  }

  /**
   * Remove an emitter from the system
   */
  removeEmitter(emitterId: string): void {
    if (this.state.emitters.has(emitterId)) {
      this.state.emitters.delete(emitterId);
      BrowserLogger.debug("IntegratedParticleSystem", "Removed emitter", { emitterId });
    }
  }

  /**
   * Get an emitter by ID
   */
  getEmitter(emitterId: string): EmitterState | undefined {
    return this.state.emitters.get(emitterId);
  }

  /**
   * Get all active emitters
   */
  getAllEmitters(): Map<string, EmitterState> {
    return new Map(this.state.emitters);
  }

  /**
   * Get a preset by name
   */
  getPreset(name: string): VFXPreset | undefined {
    return this.state.presets.get(name);
  }

  /**
   * Add a preset
   */
  addPreset(preset: VFXPreset): void {
    this.state.presets.set(preset.id, preset);
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    if (this.state.workerPool) {
      await this.state.workerPool.shutdown();
      this.state.workerPool = undefined;
    }
    
    this.state.emitters.clear();
    BrowserLogger.info("IntegratedParticleSystem", "Shutdown complete");
  }
}

/**
 * Parallel Particle System
 * 
 * Distributes particle calculations across worker threads for improved performance
 * with large numbers of particles.
 */

import type { 
  World, 
  System
} from "../engine/World";
import type { 
  EngineComponents
} from "../engine/types";
import type { 
  ParticleTask, 
  ParallelParticleConfig,
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

interface ParallelParticleState {
  config: ParallelParticleConfig;
  workerPool?: WorkerPool;
  isProcessing: boolean;
  frameCount: number;
  totalProcessingTime: number;
}

/**
 * Parallel Particle System
 * 
 * Distributes particle calculations across worker threads while maintaining
 * deterministic results and proper integration with ECS.
 */
export class ParallelParticleSystem implements System<any, any> {
  private state: ParallelParticleState;
  private lastUpdateTime = 0;

  constructor(config: ParallelParticleConfig) {
    this.state = {
      config,
      isProcessing: false,
      frameCount: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize parallel particle system
   */
  public async initialize(world: World<any, any>): Promise<void> {
    if (!this.state.config.enableParallel) {
      BrowserLogger.info("ParallelParticleSystem", "Parallel processing disabled, using single-threaded particles");
      return;
    }

    try {
      const WorkerPool = await getWorkerPool();
      
      this.state.workerPool = new WorkerPool({
        maxWorkers: this.state.config.workerCount,
        minWorkers: Math.max(1, Math.floor(this.state.config.workerCount / 2)),
        taskTimeout: 5000, // 5 seconds
        maxMemoryUsage: 256, // 256MB per worker for particles
        enablePerformanceMonitoring: true
      });

      BrowserLogger.info("ParallelParticleSystem", "Initialized with worker pool", {
        workerCount: this.state.config.workerCount,
        maxParticlesPerWorker: this.state.config.maxParticlesPerWorker
      });
    } catch (error) {
      BrowserLogger.error("ParallelParticleSystem", "Failed to initialize worker pool", error);
      throw error;
    }
  }

  /**
   * Main particle update loop
   */
  public async execute(world: World<any, any>, deltaTime: number): Promise<void> {
    if (!this.state.config.enableParallel) {
      this.updateSingleThreaded(world, deltaTime);
      return;
    }

    if (this.state.isProcessing) {
      BrowserLogger.warn("ParallelParticleSystem", "Skipping update - previous frame still processing");
      return;
    }

    const startTime = performance.now();
    this.state.isProcessing = true;

    try {
      await this.updateParallel(world, deltaTime);
    } catch (error) {
      BrowserLogger.error("ParallelParticleSystem", "Parallel update failed", error);
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
   * Single-threaded particle update (fallback)
   */
  private updateSingleThreaded(world: World<any, any>, deltaTime: number): void {
    // Get particle runtime resource
    const particleRuntime = world.getResource("particleRuntime");
    if (!particleRuntime) {
      return;
    }

    this.updateAllParticles(deltaTime, particleRuntime);
  }

  /**
   * Parallel particle update using worker threads
   */
  private async updateParallel(world: World<any, any>, deltaTime: number): Promise<void> {
    // Get particle runtime resource
    const particleRuntime = world.getResource("particleRuntime");
    if (!particleRuntime) {
      return;
    }

    const particles = particleRuntime.allParticles;
    
    if (particles.length === 0) {
      return; // No particles to process
    }

    // Split particles into chunks for parallel processing
    const chunkSize = Math.min(this.state.config.maxParticlesPerWorker, 
      Math.ceil(particles.length / this.state.config.workerCount));
    const chunks: any[][] = [];

    for (let i = 0; i < particles.length; i += chunkSize) {
      const chunk = [];
      for (let j = i; j < Math.min(i + chunkSize, particles.length); j++) {
        chunk.push(particles[j]);
      }
      chunks.push(chunk);
    }

    // Submit tasks to worker pool
    const tasks = chunks.map((chunk, index) => ({
      id: `particle-chunk-${index}`,
      type: 'particle-update',
      data: {
        particles: chunk,
        deltaTime,
        forces: particleRuntime.forces || [],
        constraints: particleRuntime.constraints || []
      },
      priority: 'high',
      createdAt: Date.now()
    } as ParticleTask));

    if (!this.state.workerPool) {
      throw new Error("Worker pool not initialized");
    }

    // Execute tasks in parallel
    const results = await Promise.all(
      tasks.map(task => this.state.workerPool!.submitTask(task))
    );

    // Apply results back to particles
    this.applyResults(world, results, particles, deltaTime);
  }

  /**
   * Update all particles
   */
  private updateAllParticles(deltaTime: number, particleRuntime: any): void {
    for (const particle of particleRuntime.allParticles) {
      this.updateParticle(particle, deltaTime, particleRuntime);
    }

    // Remove dead particles
    particleRuntime.allParticles = particleRuntime.allParticles.filter((particle: any) => {
      particle.life -= deltaTime;
      return particle.life > 0;
    });
  }

  /**
   * Update a single particle
   */
  private updateParticle(particle: any, deltaTime: number, particleRuntime: any): void {
    // Apply forces
    if (particleRuntime.forces) {
      for (const force of particleRuntime.forces) {
        particle.velocity.x += force.x * deltaTime;
        particle.velocity.y += force.y * deltaTime;
      }
    }

    // Apply gravity if enabled
    if (particleRuntime.gravity) {
      particle.velocity.y += particleRuntime.gravity * deltaTime;
    }

    // Apply drag
    if (particleRuntime.drag) {
      particle.velocity.x *= Math.pow(1 - particleRuntime.drag, deltaTime);
      particle.velocity.y *= Math.pow(1 - particleRuntime.drag, deltaTime);
    }

    // Update position
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;

    // Update age
    particle.age += deltaTime;
  }

  /**
   * Apply worker results back to particles
   */
  private applyResults(
    world: World<any, any>, 
    results: WorkerTaskResult[], 
    originalParticles: any[],
    deltaTime: number
  ): void {
    const particleRuntime = world.getResource("particleRuntime");
    if (!particleRuntime) return;

    for (const result of results) {
      if (!result.success || !result.data) {
        BrowserLogger.error("ParallelParticleSystem", `Particle task failed`, result.error);
        continue;
      }

      const chunkIndex = parseInt(result.taskId.split('-')[2]);
      const chunkStart = chunkIndex * Math.ceil(originalParticles.length / this.state.config.workerCount);
      const chunkEnd = Math.min(chunkStart + Math.ceil(originalParticles.length / this.state.config.workerCount), originalParticles.length);

      for (let i = chunkStart; i < chunkEnd; i++) {
        const originalParticle = originalParticles[i];
        const updatedParticle = result.data.particles.find((p: any) => p.id === originalParticle.id);
        
        if (updatedParticle) {
          // Update particle with results
          Object.assign(originalParticle, updatedParticle);
        }
      }
    }

    // Remove dead particles
    particleRuntime.allParticles = particleRuntime.allParticles.filter((particle: any) => {
      particle.life -= deltaTime;
      return particle.life > 0;
    });
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
    particleCount: number;
  } {
    const world = { getResource: (key: string) => ({}) } as World<any, any>;
    const particleRuntime = world.getResource("particleRuntime");
    const particleCount = particleRuntime?.allParticles?.length || 0;

    return {
      frameCount: this.state.frameCount,
      totalProcessingTime: this.state.totalProcessingTime,
      averageFrameTime: this.state.frameCount > 0 ? this.state.totalProcessingTime / this.state.frameCount : 0,
      isParallel: this.state.config.enableParallel,
      workerCount: this.state.config.workerCount,
      particleCount
    };
  }

  /**
   * Reconfigure parallel particle system
   */
  public reconfigure(config: Partial<ParallelParticleConfig>): void {
    const oldConfig = this.state.config;
    this.state.config = { ...this.state.config, ...config };

    BrowserLogger.info("ParallelParticleSystem", "Configuration updated", {
      old: oldConfig,
      new: this.state.config
    });

    // If worker count changed, reinitialize worker pool
    if (config.workerCount && config.workerCount !== oldConfig.workerCount) {
      BrowserLogger.info("ParallelParticleSystem", "Worker count changed, reinitializing");
      this.initialize({} as any).catch(error => {
        BrowserLogger.error("ParallelParticleSystem", "Failed to reinitialize", error);
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

    BrowserLogger.info("ParallelParticleSystem", "Cleanup complete", this.getStatistics());
  }

  /**
   * Get current system state
   */
  public getState(): ParallelParticleState {
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
  public getPerformanceEstimate(particleCount: number): {
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
    const optimalWorkers = Math.min(workerCount, Math.ceil(particleCount / this.state.config.maxParticlesPerWorker));
    
    let speedup = Math.min(workerCount, optimalWorkers);
    let efficiency = speedup / workerCount;
    
    let recommendation = "Optimal configuration";
    if (particleCount < workerCount * this.state.config.maxParticlesPerWorker) {
      recommendation = "Consider reducing worker count for current particle load";
      efficiency = particleCount / (workerCount * this.state.config.maxParticlesPerWorker);
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

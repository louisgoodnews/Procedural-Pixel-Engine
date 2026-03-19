/**
 * Core Optimization System
 * 
 * Automatically detects CPU cores and optimizes worker allocation
 * for maximum performance across different hardware configurations.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { 
  WorkerPoolConfig,
  ParallelPhysicsConfig,
  ParallelParticleConfig,
  ParallelRenderConfig
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface SystemInfo {
  cpuCores: number;
  architecture: string;
  platform: string;
  memory: number;
  isHighPerformance: boolean;
  recommendedWorkers: {
    physics: number;
    particles: number;
    render: number;
    total: number;
  };
}

interface OptimizationMetrics {
  currentPerformance: number;
  targetFPS: number;
  efficiency: number; // 0-1 scale
  lastOptimization: number;
  optimizationHistory: Array<{
    timestamp: number;
    type: string;
    before: number;
    after: number;
    improvement: number;
  }>;
}

interface CoreOptimizationState {
  systemInfo: SystemInfo;
  metrics: OptimizationMetrics;
  autoOptimization: boolean;
  optimizationInterval: number;
  lastCheck: number;
  performanceThreshold: number;
}

/**
 * Core Optimization System
 * 
 * Provides automatic core detection and worker optimization
 * for multithreaded systems.
 */
export class CoreOptimizationSystem implements System<EngineComponents, EngineResources> {
  private state: CoreOptimizationState;
  private isInitialized = false;

  constructor() {
    this.state = {
      systemInfo: this.detectSystemInfo(),
      metrics: {
        currentPerformance: 60,
        targetFPS: 60,
        efficiency: 1.0,
        lastOptimization: Date.now(),
        optimizationHistory: []
      },
      autoOptimization: true,
      optimizationInterval: 30000, // 30 seconds
      lastCheck: Date.now(),
      performanceThreshold: 0.85 // 85% of target FPS
    };

    BrowserLogger.info("CoreOptimizationSystem", "Created", {
      cpuCores: this.state.systemInfo.cpuCores,
      recommendedWorkers: this.state.systemInfo.recommendedWorkers
    });
  }

  /**
   * Initialize the core optimization system
   */
  public initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    // System info and metrics are stored internally
    // Could be added to EngineResources interface if needed
    
    this.isInitialized = true;
    
    BrowserLogger.info("CoreOptimizationSystem", "Initialized", {
      autoOptimization: this.state.autoOptimization,
      optimizationInterval: this.state.optimizationInterval
    });

    return Promise.resolve();
  }

  /**
   * Execute core optimization
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.isInitialized || !this.state.autoOptimization) {
      return;
    }

    const now = Date.now();
    
    // Check if it's time for optimization
    if (now - this.state.lastCheck < this.state.optimizationInterval) {
      return;
    }

    this.state.lastCheck = now;

    // Get current performance metrics
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (!runtimeMetrics) {
      return;
    }

    // Update current performance
    this.state.metrics.currentPerformance = runtimeMetrics.currentFps;
    this.state.metrics.efficiency = runtimeMetrics.currentFps / this.state.metrics.targetFPS;

    // Check if optimization is needed
    if (this.state.metrics.efficiency < this.state.performanceThreshold) {
      this.optimizeWorkers(world);
    }

    // Log optimization status
    BrowserLogger.debug("CoreOptimizationSystem", "Performance check", {
      currentFPS: runtimeMetrics.currentFps,
      efficiency: (this.state.metrics.efficiency * 100).toFixed(1) + '%',
      threshold: (this.state.performanceThreshold * 100).toFixed(1) + '%'
    });
  }

  /**
   * Detect system information
   */
  private detectSystemInfo(): SystemInfo {
    const cpuCores = this.detectCPUCores();
    const memory = this.detectMemory();
    const architecture = this.detectArchitecture();
    const platform = this.detectPlatform();
    
    const isHighPerformance = this.isHighPerformanceHardware(cpuCores, memory);
    const recommendedWorkers = this.calculateRecommendedWorkers(cpuCores, isHighPerformance);

    return {
      cpuCores,
      architecture,
      platform,
      memory,
      isHighPerformance,
      recommendedWorkers
    };
  }

  /**
   * Detect CPU cores
   */
  private detectCPUCores(): number {
    try {
      // Node.js environment
      if (typeof require !== 'undefined' && require('os')) {
        return require('os').cpus().length;
      }
    } catch (error) {
      BrowserLogger.warn("CoreOptimizationSystem", "Failed to detect CPU cores via Node.js", error);
    }

    try {
      // Browser environment
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency;
      }
    } catch (error) {
      BrowserLogger.warn("CoreOptimizationSystem", "Failed to detect CPU cores via browser", error);
    }

    // Fallback
    BrowserLogger.warn("CoreOptimizationSystem", "Using fallback CPU core detection");
    return 4; // Reasonable default
  }

  /**
   * Detect available memory
   */
  private detectMemory(): number {
    try {
      // Node.js environment
      if (typeof require !== 'undefined' && require('os')) {
        const totalMemory = require('os').totalmem();
        return Math.round(totalMemory / (1024 * 1024 * 1024)); // Convert to GB
      }
    } catch (error) {
      BrowserLogger.warn("CoreOptimizationSystem", "Failed to detect memory via Node.js", error);
    }

    // Browser environment - limited memory detection
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      const estimatedTotal = memoryInfo.jsHeapSizeLimit * 4; // Rough estimate
      return Math.round(estimatedTotal / (1024 * 1024 * 1024));
    }

    // Fallback
    return 8; // 8GB default
  }

  /**
   * Detect system architecture
   */
  private detectArchitecture(): string {
    try {
      if (typeof require !== 'undefined' && require('os')) {
        return require('os').arch();
      }
    } catch (error) {
      // Ignore
    }

    // Browser environment
    if (typeof navigator !== 'undefined' && (navigator as any).userAgentData) {
      return (navigator as any).userAgentData.architecture || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Detect platform
   */
  private detectPlatform(): string {
    try {
      if (typeof require !== 'undefined' && require('os')) {
        return require('os').platform();
      }
    } catch (error) {
      // Ignore
    }

    // Browser environment
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }

    return 'unknown';
  }

  /**
   * Determine if hardware is high performance
   */
  private isHighPerformanceHardware(cores: number, memoryGB: number): boolean {
    return cores >= 8 && memoryGB >= 16;
  }

  /**
   * Calculate recommended worker counts
   */
  private calculateRecommendedWorkers(totalCores: number, isHighPerformance: boolean): SystemInfo['recommendedWorkers'] {
    // Reserve 1-2 cores for main thread and system
    const availableCores = Math.max(1, totalCores - (isHighPerformance ? 2 : 1));
    
    // Distribute workers based on system demands
    const physicsWorkers = Math.max(1, Math.floor(availableCores * 0.4)); // 40% for physics
    const particleWorkers = Math.max(1, Math.floor(availableCores * 0.3)); // 30% for particles
    const renderWorkers = Math.max(1, Math.floor(availableCores * 0.3)); // 30% for rendering
    
    return {
      physics: physicsWorkers,
      particles: particleWorkers,
      render: renderWorkers,
      total: physicsWorkers + particleWorkers + renderWorkers
    };
  }

  /**
   * Optimize worker allocation based on performance
   */
  private optimizeWorkers(world: World<EngineComponents, EngineResources>): void {
    const beforePerformance = this.state.metrics.currentPerformance;
    
    BrowserLogger.info("CoreOptimizationSystem", "Starting worker optimization", {
      currentFPS: beforePerformance,
      targetFPS: this.state.metrics.targetFPS
    });

    // Get current system configurations
    const multithreadingSystem = this.getMultithreadingSystem(world);
    if (!multithreadingSystem) {
      BrowserLogger.warn("CoreOptimizationSystem", "Multithreading system not available");
      return;
    }

    // Analyze performance bottlenecks
    const bottlenecks = this.analyzeBottlenecks(world);
    
    // Apply optimizations
    const optimizations = this.generateOptimizations(bottlenecks);
    
    // Apply optimizations to systems
    for (const optimization of optimizations) {
      this.applyOptimization(world, optimization);
    }

    // Record optimization
    const afterPerformance = this.state.metrics.currentPerformance;
    const improvement = ((afterPerformance - beforePerformance) / beforePerformance) * 100;
    
    this.state.metrics.lastOptimization = Date.now();
    this.state.metrics.optimizationHistory.push({
      timestamp: Date.now(),
      type: 'automatic',
      before: beforePerformance,
      after: afterPerformance,
      improvement
    });

    BrowserLogger.info("CoreOptimizationSystem", "Worker optimization completed", {
      beforeFPS: beforePerformance,
      afterFPS: afterPerformance,
      improvement: improvement.toFixed(1) + '%',
      optimizationsApplied: optimizations.length
    });
  }

  /**
   * Get multithreading system instance
   */
  private getMultithreadingSystem(world: World<EngineComponents, EngineResources>): any {
    // This would need to be implemented based on how the multithreading system is stored
    // For now, return null as placeholder
    return null;
  }

  /**
   * Analyze performance bottlenecks
   */
  private analyzeBottlenecks(world: World<EngineComponents, EngineResources>): string[] {
    const bottlenecks: string[] = [];
    const runtimeMetrics = world.getResource("runtimeMetrics");
    
    if (!runtimeMetrics) {
      return bottlenecks;
    }

    // Check system benchmarks
    const physicsBenchmark = runtimeMetrics.namedBenchmarks.physicsSystemMs;
    const renderBenchmark = runtimeMetrics.namedBenchmarks.renderSystemMs;
    
    if (physicsBenchmark > 10) {
      bottlenecks.push('physics');
    }
    
    if (renderBenchmark > 16) {
      bottlenecks.push('render');
    }

    // Check particle system if available
    const particleRuntime = world.getResource("particleRuntime");
    if (particleRuntime && particleRuntime.allParticles.length > 1000) {
      bottlenecks.push('particles');
    }

    return bottlenecks;
  }

  /**
   * Generate optimization strategies
   */
  private generateOptimizations(bottlenecks: string[]): Array<{
    system: string;
    action: string;
    value: any;
  }> {
    const optimizations: Array<{ system: string; action: string; value: any }> = [];
    const systemInfo = this.state.systemInfo;

    for (const bottleneck of bottlenecks) {
      switch (bottleneck) {
        case 'physics':
          optimizations.push({
            system: 'physics',
            action: 'increaseWorkers',
            value: Math.min(systemInfo.recommendedWorkers.physics + 1, systemInfo.cpuCores - 1)
          });
          break;
          
        case 'particles':
          optimizations.push({
            system: 'particles',
            action: 'increaseWorkers',
            value: Math.min(systemInfo.recommendedWorkers.particles + 1, systemInfo.cpuCores - 2)
          });
          break;
          
        case 'render':
          optimizations.push({
            system: 'render',
            action: 'enableBatching',
            value: true
          });
          break;
      }
    }

    return optimizations;
  }

  /**
   * Apply optimization to a specific system
   */
  private applyOptimization(world: World<EngineComponents, EngineResources>, optimization: { system: string; action: string; value: any }): void {
    BrowserLogger.info("CoreOptimizationSystem", "Applying optimization", optimization);
    
    // This would need to be implemented based on how systems are configured
    // For now, just log the optimization that would be applied
  }

  /**
   * Get optimal configuration for a system
   */
  public getOptimalConfig(systemType: 'physics' | 'particles' | 'render'): any {
    const recommended = this.state.systemInfo.recommendedWorkers;
    
    switch (systemType) {
      case 'physics':
        return {
          enableParallel: true,
          maxConcurrentSimulations: Math.min(4, recommended.physics),
          workerCount: recommended.physics,
          timestepMs: 16.67,
          substeps: 2
        } as ParallelPhysicsConfig;
        
      case 'particles':
        return {
          enableParallel: true,
          maxParticlesPerWorker: 2500,
          updateInterval: 16.67,
          workerCount: recommended.particles,
          sharedMemory: true
        } as ParallelParticleConfig;
        
      case 'render':
        return {
          enableParallel: true,
          maxEntitiesPerWorker: 1250,
          batchSize: 100,
          workerCount: recommended.render,
          enableFrustumCulling: true
        } as ParallelRenderConfig;
        
      default:
        return null;
    }
  }

  /**
   * Get current system information
   */
  public getSystemInfo(): SystemInfo {
    return { ...this.state.systemInfo };
  }

  /**
   * Get current optimization metrics
   */
  public getOptimizationMetrics(): OptimizationMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Enable/disable auto optimization
   */
  public setAutoOptimization(enabled: boolean): void {
    this.state.autoOptimization = enabled;
    BrowserLogger.info("CoreOptimizationSystem", "Auto optimization changed", { enabled });
  }

  /**
   * Set optimization interval
   */
  public setOptimizationInterval(intervalMs: number): void {
    this.state.optimizationInterval = intervalMs;
    BrowserLogger.info("CoreOptimizationSystem", "Optimization interval changed", { intervalMs });
  }

  /**
   * Force optimization run
   */
  public forceOptimization(world: World<EngineComponents, EngineResources>): void {
    this.state.lastCheck = 0; // Reset timer to force optimization
    this.execute(world, 0);
  }

  /**
   * Reset optimization history
   */
  public resetOptimizationHistory(): void {
    this.state.metrics.optimizationHistory = [];
    BrowserLogger.info("CoreOptimizationSystem", "Optimization history reset");
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): any {
    const recentOptimizations = this.state.metrics.optimizationHistory.slice(-10);
    const avgImprovement = recentOptimizations.length > 0
      ? recentOptimizations.reduce((sum, opt) => sum + opt.improvement, 0) / recentOptimizations.length
      : 0;

    return {
      systemInfo: this.state.systemInfo,
      currentPerformance: this.state.metrics.currentPerformance,
      targetFPS: this.state.metrics.targetFPS,
      efficiency: this.state.metrics.efficiency,
      autoOptimization: this.state.autoOptimization,
      recentOptimizations: recentOptimizations.length,
      averageImprovement: avgImprovement,
      lastOptimization: this.state.metrics.lastOptimization
    };
  }
}

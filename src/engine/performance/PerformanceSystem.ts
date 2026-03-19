/**
 * Integrated performance optimization system
 * Coordinates all performance-related systems for optimal engine performance
 */

import { globalPoolManager, ObjectPool, ParticlePool } from './ObjectPool';
import { globalMemoryMonitor, MemoryMonitor } from './MemoryMonitor';
import { globalAssetManager, AssetManager } from './AssetManager';
import { globalFrustumCulling, FrustumCulling } from './FrustumCulling';
import { globalBatchRenderer, BatchRenderer } from './BatchRenderer';
import { globalFrameRateManager, FrameRateManager } from './FrameRateManager';
import type { System, World } from '../World';
import type { EngineComponents, EngineResources } from '../types';

export interface PerformanceSystemConfig {
  enableObjectPooling: boolean;
  enableMemoryMonitoring: boolean;
  enableAssetUnloading: boolean;
  enableFrustumCulling: boolean;
  enableBatchRendering: boolean;
  enableFrameRateManagement: boolean;
  adaptiveQuality: boolean;
  performanceMonitoring: boolean;
}

export interface PerformanceMetrics {
  frameRate: {
    current: number;
    average: number;
    target: number;
    quality: string;
  };
  memory: {
    used: number;
    total: number;
    pressure: string;
    leaks: number;
  };
  rendering: {
    drawCalls: number;
    visibleObjects: number;
    culledObjects: number;
    batchCount: number;
  };
  assets: {
    total: number;
    loaded: number;
    unloaded: number;
    memoryUsage: number;
  };
  pools: {
    totalObjects: number;
    efficiency: number;
    details: Record<string, any>;
  };
}

export class PerformanceOptimizationSystem implements System<EngineComponents, EngineResources> {
  private config: PerformanceSystemConfig;
  private frameCount = 0;
  private lastUpdateTime = 0;
  private metrics: PerformanceMetrics;

  // Individual performance systems
  private poolManager = globalPoolManager;
  private memoryMonitor = globalMemoryMonitor;
  private assetManager = globalAssetManager;
  private frustumCulling = globalFrustumCulling;
  private batchRenderer = globalBatchRenderer;
  private frameRateManager = globalFrameRateManager;

  constructor(config: Partial<PerformanceSystemConfig> = {}) {
    this.config = {
      enableObjectPooling: true,
      enableMemoryMonitoring: true,
      enableAssetUnloading: true,
      enableFrustumCulling: true,
      enableBatchRendering: true,
      enableFrameRateManagement: true,
      adaptiveQuality: true,
      performanceMonitoring: true,
      ...config,
    };

    this.metrics = this.initializeMetrics();
    this.initializeSystems();
  }

  /**
   * Initialize all performance systems
   */
  private initializeSystems(): void {
    // Initialize object pools
    if (this.config.enableObjectPooling) {
      this.initializeObjectPools();
    }

    // Initialize memory monitoring
    if (this.config.enableMemoryMonitoring) {
      this.memoryMonitor.setCallbacks({
        onAlert: (alert) => {
          console.warn('Memory leak detected:', alert);
          this.handleMemoryAlert(alert);
        },
      });
      this.memoryMonitor.start();
    }

    // Initialize frame rate management
    if (this.config.enableFrameRateManagement) {
      this.frameRateManager.setCallbacks({
        onQualityChange: (quality) => {
          this.applyQualityChanges(quality);
        },
        onFPSChange: (fps) => {
          this.handleFPSChange(fps);
        },
        onFrameDrop: () => {
          this.handleFrameDrop();
        },
      });
    }
  }

  /**
   * Initialize object pools for common engine objects
   */
  private initializeObjectPools(): void {
    // Pool for particle objects
    this.poolManager.registerPool('particles', () => ({
      id: '',
      emitterId: '',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      life: 0,
      age: 0,
      maxAge: 1,
      size: 1,
      color: '#ffffff',
      opacity: 1,
      rotation: 0,
      createdAt: 0,
    }), {
      maxPoolSize: 2000,
      minPoolSize: 100,
    });

    // Pool for vector objects
    this.poolManager.registerPool('vectors', () => ({ x: 0, y: 0 }), {
      maxPoolSize: 500,
      minPoolSize: 50,
    });

    // Pool for rectangle objects
    this.poolManager.registerPool('rectangles', () => ({ x: 0, y: 0, width: 0, height: 0 }), {
      maxPoolSize: 500,
      minPoolSize: 50,
    });

    // Pre-allocate pools
    this.poolManager.preAllocateAll();
  }

  /**
   * Main system execution
   */
  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    const now = performance.now();
    
    // Update frame rate manager
    if (this.config.enableFrameRateManagement) {
      this.frameRateManager.update();
    }

    // Perform frustum culling
    if (this.config.enableFrustumCulling) {
      this.performFrustumCulling(world);
    }

    // Optimize rendering batches
    if (this.config.enableBatchRendering) {
      this.optimizeBatches(world);
    }

    // Update performance metrics
    if (this.config.performanceMonitoring) {
      this.updateMetrics(world);
    }

    // Periodic maintenance tasks
    this.frameCount++;
    if (now - this.lastUpdateTime > 5000) { // Every 5 seconds
      this.performMaintenance(world);
      this.lastUpdateTime = now;
    }
  }

  /**
   * Perform frustum culling on renderable entities
   */
  private performFrustumCulling(world: World<EngineComponents, EngineResources>): void {
    const camera = world.getResource('camera');
    const viewport = world.getResource('viewport');
    const runtimeMetrics = world.getResource('runtimeMetrics');

    if (!camera || !viewport) {
      return;
    }

    // Update frustum
    this.frustumCulling.updateFrustum(camera.x, camera.y, viewport.width, viewport.height);

    // Get current FPS for adaptive culling
    const currentFPS = runtimeMetrics?.currentFps || 60;

    // Perform culling
    const cullingStats = this.frustumCulling.cullObjects(
      camera.x + viewport.width / 2,
      camera.y + viewport.height / 2,
      currentFPS
    );

    // Update culling stats in world resource
    const renderStats = world.getResource('renderStats');
    if (renderStats) {
      renderStats.culledObjects = cullingStats.culledObjects;
      renderStats.visibleObjects = cullingStats.visibleObjects;
    }
  }

  /**
   * Optimize rendering batches
   */
  private optimizeBatches(world: World<EngineComponents, EngineResources>): void {
    // Optimize existing batches
    this.batchRenderer.optimizeBatches();

    // Generate render commands
    const commands = this.batchRenderer.generateRenderCommands();

    // Store commands for render system
    world.setResource('renderCommands', commands);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(world: World<EngineComponents, EngineResources>): void {
    // Frame rate metrics
    const frameRateStats = this.frameRateManager.getStats();
    this.metrics.frameRate = {
      current: frameRateStats.currentFPS,
      average: frameRateStats.averageFPS,
      target: frameRateStats.targetFPS,
      quality: frameRateStats.qualityLevel,
    };

    // Memory metrics
    const memoryStats = this.memoryMonitor.getSummary();
    this.metrics.memory = {
      used: memoryStats.current?.usedJSHeapSize || 0,
      total: memoryStats.current?.totalJSHeapSize || 0,
      pressure: memoryStats.trend,
      leaks: memoryStats.leakAlerts.length,
    };

    // Rendering metrics
    const renderStats = world.getResource('renderStats');
    const cullingStats = this.frustumCulling.getStats();
    const batchStats = this.batchRenderer.getStats();
    
    this.metrics.rendering = {
      drawCalls: renderStats?.drawCalls || 0,
      visibleObjects: cullingStats.visibleObjects,
      culledObjects: cullingStats.culledObjects,
      batchCount: batchStats.activeBatches,
    };

    // Asset metrics
    const assetStats = this.assetManager.getStats();
    this.metrics.assets = {
      total: assetStats.totalAssets,
      loaded: assetStats.totalAssets - assetStats.unloadedAssets,
      unloaded: assetStats.unloadedAssets,
      memoryUsage: assetStats.totalSize,
    };

    // Pool metrics
    const poolStats = this.poolManager.getAllStats();
    this.metrics.pools = {
      totalObjects: this.poolManager.getTotalMemoryUsage(),
      efficiency: this.calculatePoolEfficiency(poolStats),
      details: poolStats,
    };

    // Store metrics in world resource
    world.setResource('performanceMetrics', this.metrics);
  }

  /**
   * Calculate average pool efficiency
   */
  private calculatePoolEfficiency(poolStats: Record<string, any>): number {
    const efficiencies = Object.values(poolStats).map((stats: any) => stats.efficiency || 0);
    return efficiencies.length > 0 
      ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length 
      : 0;
  }

  /**
   * Perform periodic maintenance tasks
   */
  private performMaintenance(world: World<EngineComponents, EngineResources>): void {
    // Force garbage collection if needed
    if (this.metrics.memory.pressure === 'increasing') {
      this.memoryMonitor.forceGC();
    }

    // Force asset cleanup if memory pressure is high
    if (this.metrics.assets.memoryUsage > 400 * 1024 * 1024) { // 400MB
      const freedMemory = this.assetManager.forceCleanup();
      console.log(`Asset cleanup freed ${freedMemory} bytes`);
    }

    // Reset batch renderer statistics
    this.batchRenderer.clear();

    // Log performance summary
    if (this.config.performanceMonitoring) {
      this.logPerformanceSummary();
    }
  }

  /**
   * Handle memory leak alerts
   */
  private handleMemoryAlert(alert: any): void {
    // Force aggressive cleanup
    this.assetManager.forceCleanup();
    
    // Reduce quality if memory pressure is high
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.frameRateManager.setQualityLevel('low');
    }
  }

  /**
   * Handle FPS changes
   */
  private handleFPSChange(fps: number): void {
    // Adjust culling aggressiveness based on FPS
    const cullingConfig = this.frustumCulling.getConfig();
    const newMargin = fps < 30 ? 100 : fps < 45 ? 75 : 50;
    
    if (cullingConfig.margin !== newMargin) {
      this.frustumCulling.updateConfig({ margin: newMargin });
    }
  }

  /**
   * Handle frame drops
   */
  private handleFrameDrop(): void {
    // Immediate quality reduction on frame drops
    const currentQuality = this.frameRateManager.getCurrentQuality();
    if (currentQuality.level !== 'potato') {
      this.frameRateManager.reduceQuality();
    }
  }

  /**
   * Apply quality changes to rendering systems
   */
  private applyQualityChanges(quality: any): void {
    // Update asset manager based on quality
    const maxMemory = quality.level === 'potato' ? 128 * 1024 * 1024 : 
                     quality.level === 'low' ? 256 * 1024 * 1024 :
                     512 * 1024 * 1024;
    
    this.assetManager.updateConfig({ maxMemoryUsage: maxMemory });

    // Update batch renderer based on quality
    const maxBatches = quality.level === 'potato' ? 100 :
                      quality.level === 'low' ? 250 :
                      quality.level === 'medium' ? 500 : 1000;
    
    this.batchRenderer.updateConfig({ maxBatchSize: maxBatches });

    console.log(`Quality changed to: ${quality.level}`);
  }

  /**
   * Log performance summary
   */
  private logPerformanceSummary(): void {
    console.log('Performance Summary:', {
      fps: `${this.metrics.frameRate.average.toFixed(1)} / ${this.metrics.frameRate.target}`,
      memory: `${(this.metrics.memory.used / 1024 / 1024).toFixed(1)} MB`,
      rendering: `${this.metrics.rendering.visibleObjects} visible, ${this.metrics.rendering.culledObjects} culled`,
      assets: `${this.metrics.assets.loaded} loaded, ${(this.metrics.assets.memoryUsage / 1024 / 1024).toFixed(1)} MB`,
      pools: `${this.metrics.pools.totalObjects} objects, ${this.metrics.pools.efficiency.toFixed(1)}% efficiency`,
    });
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      frameRate: { current: 60, average: 60, target: 60, quality: 'high' },
      memory: { used: 0, total: 0, pressure: 'stable', leaks: 0 },
      rendering: { drawCalls: 0, visibleObjects: 0, culledObjects: 0, batchCount: 0 },
      assets: { total: 0, loaded: 0, unloaded: 0, memoryUsage: 0 },
      pools: { totalObjects: 0, efficiency: 0, details: {} },
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get individual performance systems
   */
  getSystems() {
    return {
      poolManager: this.poolManager,
      memoryMonitor: this.memoryMonitor,
      assetManager: this.assetManager,
      frustumCulling: this.frustumCulling,
      batchRenderer: this.batchRenderer,
      frameRateManager: this.frameRateManager,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update individual system configurations
    if (!this.config.enableMemoryMonitoring) {
      this.memoryMonitor.stop();
    } else {
      this.memoryMonitor.start();
    }

    if (!this.config.enableFrameRateManagement) {
      this.frameRateManager.setAdaptiveQuality(false);
    } else {
      this.frameRateManager.setAdaptiveQuality(this.config.adaptiveQuality);
    }
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const frameRateScore = this.frameRateManager.getPerformanceScore();
    const memoryScore = this.metrics.memory.pressure === 'stable' ? 100 : 
                       this.metrics.memory.pressure === 'increasing' ? 50 : 0;
    const renderingScore = this.metrics.rendering.culledObjects > 0 ? 100 : 50;
    const poolScore = this.metrics.pools.efficiency;

    return (frameRateScore * 0.4 + memoryScore * 0.3 + renderingScore * 0.2 + poolScore * 0.1);
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    return this.getPerformanceScore() >= 70;
  }

  /**
   * Force optimization pass
   */
  forceOptimization(): void {
    // Force garbage collection
    this.memoryMonitor.forceGC();
    
    // Force asset cleanup
    this.assetManager.forceCleanup();
    
    // Optimize batches
    this.batchRenderer.optimizeBatches();
    
    // Reset quality to optimal level
    const recommendedQuality = this.frameRateManager.getRecommendedQuality();
    this.frameRateManager.setQualityLevel(recommendedQuality);
  }

  /**
   * Destroy the performance system
   */
  destroy(): void {
    this.memoryMonitor.stop();
    this.assetManager.destroy();
    this.frustumCulling.clear();
    this.batchRenderer.clear();
    this.poolManager.clearAll();
  }
}

// Global performance system instance
export const globalPerformanceSystem = new PerformanceOptimizationSystem();

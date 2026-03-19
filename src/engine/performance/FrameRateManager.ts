/**
 * Frame rate management system with adaptive quality settings
 * Automatically adjusts rendering quality to maintain target frame rates
 */

export interface QualitySettings {
  level: 'ultra' | 'high' | 'medium' | 'low' | 'potato';
  resolutionScale: number; // 0.25 to 1.0
  particleQuality: number; // 0.25 to 1.0
  shadowQuality: number; // 0.25 to 1.0
  textureQuality: number; // 0.25 to 1.0
  effectsQuality: number; // 0.25 to 1.0
  maxParticles: number;
  maxDrawCalls: number;
  enableVSync: boolean;
  enableMotionBlur: boolean;
  enableBloom: boolean;
  enableAntiAliasing: boolean;
}

export interface FrameRateStats {
  currentFPS: number;
  targetFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameTime: number;
  frameTimeVariance: number;
  droppedFrames: number;
  totalFrames: number;
  qualityLevel: QualitySettings['level'];
  adaptiveQualityActive: boolean;
}

export interface FrameRateConfig {
  targetFPS: number;
  minFPS: number;
  maxFPS: number;
  adaptiveQuality: boolean;
  qualityAdjustmentThreshold: number; // FPS threshold for quality changes
  qualityAdjustmentDelay: number; // milliseconds to wait between adjustments
  enableVSync: boolean;
  frameTimeHistorySize: number;
  smoothingFactor: number; // for FPS averaging
}

export class FrameRateManager {
  private config: FrameRateConfig;
  private currentQuality: QualitySettings;
  private frameTimeHistory: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private droppedFrames = 0;
  private lastQualityAdjustment = 0;
  private stats: FrameRateStats;
  private callbacks: {
    onQualityChange?: (quality: QualitySettings) => void;
    onFPSChange?: (fps: number) => void;
    onFrameDrop?: () => void;
  } = {};

  constructor(config: Partial<FrameRateConfig> = {}) {
    this.config = {
      targetFPS: 60,
      minFPS: 30,
      maxFPS: 120,
      adaptiveQuality: true,
      qualityAdjustmentThreshold: 5, // 5 FPS difference
      qualityAdjustmentDelay: 2000, // 2 seconds
      enableVSync: true,
      frameTimeHistorySize: 60, // 1 second at 60 FPS
      smoothingFactor: 0.1,
      ...config,
    };

    this.currentQuality = this.getDefaultQuality('high');
    this.stats = {
      currentFPS: 60,
      targetFPS: this.config.targetFPS,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTime: 16.67,
      frameTimeVariance: 0,
      droppedFrames: 0,
      totalFrames: 0,
      qualityLevel: 'high',
      adaptiveQualityActive: this.config.adaptiveQuality,
    };
  }

  /**
   * Update frame rate statistics (call once per frame)
   */
  update(): void {
    const now = performance.now();
    const frameTime = this.lastFrameTime > 0 ? now - this.lastFrameTime : 16.67;
    this.lastFrameTime = now;

    // Update frame time history
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.config.frameTimeHistorySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate FPS
    const currentFPS = frameTime > 0 ? 1000 / frameTime : 60;
    this.updateFPSStats(currentFPS, frameTime);

    // Check for dropped frames
    if (frameTime > (1000 / this.config.minFPS) * 1.5) {
      this.droppedFrames++;
      this.callbacks.onFrameDrop?.();
    }

    // Adaptive quality adjustment
    if (this.config.adaptiveQuality) {
      this.checkAdaptiveQuality();
    }

    this.frameCount++;
  }

  /**
   * Update FPS statistics
   */
  private updateFPSStats(currentFPS: number, frameTime: number): void {
    this.stats.currentFPS = currentFPS;
    this.stats.frameTime = frameTime;
    this.stats.totalFrames = this.frameCount;
    this.stats.droppedFrames = this.droppedFrames;

    // Update min/max FPS
    this.stats.minFPS = Math.min(this.stats.minFPS, currentFPS);
    this.stats.maxFPS = Math.max(this.stats.maxFPS, currentFPS);

    // Calculate average FPS with smoothing
    const alpha = this.config.smoothingFactor;
    this.stats.averageFPS = this.stats.averageFPS * (1 - alpha) + currentFPS * alpha;

    // Calculate frame time variance
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    const variance = this.frameTimeHistory.reduce((sum, time) => sum + Math.pow(time - avgFrameTime, 2), 0) / this.frameTimeHistory.length;
    this.stats.frameTimeVariance = Math.sqrt(variance);

    // Notify FPS change callback
    if (Math.abs(currentFPS - this.stats.targetFPS) > this.config.qualityAdjustmentThreshold) {
      this.callbacks.onFPSChange?.(currentFPS);
    }
  }

  /**
   * Check and perform adaptive quality adjustments
   */
  private checkAdaptiveQuality(): void {
    const now = Date.now();
    
    // Don't adjust too frequently
    if (now - this.lastQualityAdjustment < this.config.qualityAdjustmentDelay) {
      return;
    }

    const fps = this.stats.averageFPS;
    const targetFPS = this.config.targetFPS;
    const threshold = this.config.qualityAdjustmentThreshold;

    // Check if we need to adjust quality
    if (fps < targetFPS - threshold) {
      // FPS too low, reduce quality
      this.reduceQuality();
      this.lastQualityAdjustment = now;
    } else if (fps > targetFPS + threshold && this.currentQuality.level !== 'ultra') {
      // FPS high enough, increase quality
      this.increaseQuality();
      this.lastQualityAdjustment = now;
    }
  }

  /**
   * Reduce quality to improve performance
   */
  private reduceQuality(): void {
    const currentLevel = this.currentQuality.level;
    const levels: QualitySettings['level'][] = ['ultra', 'high', 'medium', 'low', 'potato'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      this.setQualityLevel(newLevel);
    }
  }

  /**
   * Increase quality if performance allows
   */
  private increaseQuality(): void {
    const currentLevel = this.currentQuality.level;
    const levels: QualitySettings['level'][] = ['ultra', 'high', 'medium', 'low', 'potato'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex > 0) {
      const newLevel = levels[currentIndex - 1];
      this.setQualityLevel(newLevel);
    }
  }

  /**
   * Set quality level manually
   */
  setQualityLevel(level: QualitySettings['level']): void {
    const newQuality = this.getDefaultQuality(level);
    const oldLevel = this.currentQuality.level;
    
    this.currentQuality = newQuality;
    this.stats.qualityLevel = level;
    this.stats.adaptiveQualityActive = this.config.adaptiveQuality;

    if (oldLevel !== level) {
      this.callbacks.onQualityChange?.(newQuality);
    }
  }

  /**
   * Get default quality settings for a level
   */
  private getDefaultQuality(level: QualitySettings['level']): QualitySettings {
    switch (level) {
      case 'ultra':
        return {
          level: 'ultra',
          resolutionScale: 1.0,
          particleQuality: 1.0,
          shadowQuality: 1.0,
          textureQuality: 1.0,
          effectsQuality: 1.0,
          maxParticles: 10000,
          maxDrawCalls: 1000,
          enableVSync: this.config.enableVSync,
          enableMotionBlur: true,
          enableBloom: true,
          enableAntiAliasing: true,
        };

      case 'high':
        return {
          level: 'high',
          resolutionScale: 1.0,
          particleQuality: 0.8,
          shadowQuality: 0.8,
          textureQuality: 0.9,
          effectsQuality: 0.8,
          maxParticles: 5000,
          maxDrawCalls: 500,
          enableVSync: this.config.enableVSync,
          enableMotionBlur: true,
          enableBloom: true,
          enableAntiAliasing: true,
        };

      case 'medium':
        return {
          level: 'medium',
          resolutionScale: 0.75,
          particleQuality: 0.6,
          shadowQuality: 0.6,
          textureQuality: 0.7,
          effectsQuality: 0.6,
          maxParticles: 2000,
          maxDrawCalls: 250,
          enableVSync: this.config.enableVSync,
          enableMotionBlur: false,
          enableBloom: false,
          enableAntiAliasing: false,
        };

      case 'low':
        return {
          level: 'low',
          resolutionScale: 0.5,
          particleQuality: 0.4,
          shadowQuality: 0.3,
          textureQuality: 0.5,
          effectsQuality: 0.3,
          maxParticles: 1000,
          maxDrawCalls: 100,
          enableVSync: false,
          enableMotionBlur: false,
          enableBloom: false,
          enableAntiAliasing: false,
        };

      case 'potato':
        return {
          level: 'potato',
          resolutionScale: 0.25,
          particleQuality: 0.2,
          shadowQuality: 0.0,
          textureQuality: 0.3,
          effectsQuality: 0.1,
          maxParticles: 500,
          maxDrawCalls: 50,
          enableVSync: false,
          enableMotionBlur: false,
          enableBloom: false,
          enableAntiAliasing: false,
        };

      default:
        return this.getDefaultQuality('high');
    }
  }

  /**
   * Get current quality settings
   */
  getCurrentQuality(): QualitySettings {
    return { ...this.currentQuality };
  }

  /**
   * Get frame rate statistics
   */
  getStats(): FrameRateStats {
    return { ...this.stats };
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.config.targetFPS = Math.max(1, Math.min(fps, this.config.maxFPS));
    this.stats.targetFPS = this.config.targetFPS;
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled: boolean): void {
    this.config.adaptiveQuality = enabled;
    this.stats.adaptiveQualityActive = enabled;
  }

  /**
   * Register callbacks for events
   */
  setCallbacks(callbacks: {
    onQualityChange?: (quality: QualitySettings) => void;
    onFPSChange?: (fps: number) => void;
    onFrameDrop?: () => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.frameTimeHistory = [];
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = 0;
    
    this.stats = {
      currentFPS: 60,
      targetFPS: this.config.targetFPS,
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTime: 16.67,
      frameTimeVariance: 0,
      droppedFrames: 0,
      totalFrames: 0,
      qualityLevel: this.currentQuality.level,
      adaptiveQualityActive: this.config.adaptiveQuality,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FrameRateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.stats.targetFPS = this.config.targetFPS;
    this.stats.adaptiveQualityActive = this.config.adaptiveQuality;
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const targetFPS = this.config.targetFPS;
    const currentFPS = this.stats.averageFPS;
    const minFPS = this.config.minFPS;
    
    if (currentFPS >= targetFPS) {
      return 100;
    } else if (currentFPS <= minFPS) {
      return 0;
    } else {
      // Linear interpolation between min and target FPS
      return ((currentFPS - minFPS) / (targetFPS - minFPS)) * 100;
    }
  }

  /**
   * Check if the system is running at acceptable performance
   */
  isPerformanceAcceptable(): boolean {
    return this.stats.averageFPS >= this.config.minFPS;
  }

  /**
   * Get recommended quality level based on current performance
   */
  getRecommendedQuality(): QualitySettings['level'] {
    const fps = this.stats.averageFPS;
    const targetFPS = this.config.targetFPS;
    
    if (fps >= targetFPS * 0.9) return 'ultra';
    if (fps >= targetFPS * 0.8) return 'high';
    if (fps >= targetFPS * 0.6) return 'medium';
    if (fps >= targetFPS * 0.4) return 'low';
    return 'potato';
  }

  /**
   * Apply quality settings to rendering systems
   */
  applyQualitySettings(): void {
    // This would be implemented to actually apply the quality settings
    // to the various rendering systems (particles, shadows, etc.)
    console.log('Applying quality settings:', this.currentQuality.level);
  }
}

// Global frame rate manager instance
export const globalFrameRateManager = new FrameRateManager();

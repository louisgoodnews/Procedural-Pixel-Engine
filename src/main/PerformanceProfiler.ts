/**
 * Performance Profiler
 * 
 * Real-time performance monitoring and analysis for engine systems.
 * Provides detailed metrics for optimization and debugging.
 */

import type { SystemBenchmark, RuntimeMetricsResource } from "../engine/types";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface PerformanceSnapshot {
  timestamp: number;
  frameTime: number;
  systemTimes: Map<string, number>;
  memoryUsage: NodeJS.MemoryUsage;
  fps: number;
}

interface SystemMetrics {
  name: string;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  callCount: number;
  lastFrameTime: number;
}

export class PerformanceProfiler {
  private snapshots: PerformanceSnapshot[] = [];
  private systemMetrics: Map<string, SystemMetrics> = new Map();
  private frameStartTime = 0;
  private frameCount = 0;
  private maxSnapshots = 100; // Keep last 100 snapshots
  private enabled = true;

  constructor() {
    BrowserLogger.info("PerformanceProfiler", "Performance profiler initialized");
  }

  /**
   * Start profiling a new frame
   */
  public startFrame(): void {
    if (!this.enabled) return;
    
    this.frameStartTime = performance.now();
  }

  /**
   * End profiling a frame and record metrics
   */
  public endFrame(systemBenchmarks: SystemBenchmark[]): void {
    if (!this.enabled) return;

    const frameTime = performance.now() - this.frameStartTime;
    this.frameCount++;

    // Process system benchmarks
    const systemTimes = new Map<string, number>();
    for (const benchmark of systemBenchmarks) {
      systemTimes.set(benchmark.systemName, benchmark.durationMs);
      
      // Update system metrics
      this.updateSystemMetrics(benchmark.systemName, benchmark.durationMs);
    }

    // Create snapshot
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      frameTime,
      systemTimes,
      memoryUsage: process.memoryUsage(),
      fps: 1000 / frameTime // Convert to FPS
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Log performance warnings
    this.checkPerformanceThresholds(snapshot);
  }

  /**
   * Update system metrics
   */
  private updateSystemMetrics(systemName: string, frameTime: number): void {
    const existing = this.systemMetrics.get(systemName);
    
    if (!existing) {
      this.systemMetrics.set(systemName, {
        name: systemName,
        totalTime: frameTime,
        averageTime: frameTime,
        maxTime: frameTime,
        minTime: frameTime,
        callCount: 1,
        lastFrameTime: frameTime
      });
    } else {
      existing.totalTime += frameTime;
      existing.callCount++;
      existing.averageTime = existing.totalTime / existing.callCount;
      existing.maxTime = Math.max(existing.maxTime, frameTime);
      existing.minTime = Math.min(existing.minTime, frameTime);
      existing.lastFrameTime = frameTime;
    }
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(snapshot: PerformanceSnapshot): void {
    // Frame time warnings
    if (snapshot.frameTime > 16.67) { // Below 60 FPS
      BrowserLogger.warn("PerformanceProfiler", `Low frame rate detected`, {
        frameTime: snapshot.frameTime.toFixed(2),
        fps: snapshot.fps.toFixed(1)
      });
    }

    if (snapshot.frameTime > 33.33) { // Below 30 FPS
      BrowserLogger.error("PerformanceProfiler", `Very low frame rate detected`, {
        frameTime: snapshot.frameTime.toFixed(2),
        fps: snapshot.fps.toFixed(1)
      });
    }

    // Memory usage warnings
    const heapUsedMB = snapshot.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 512) { // More than 512MB
      BrowserLogger.warn("PerformanceProfiler", `High memory usage detected`, {
        heapUsed: `${heapUsedMB.toFixed(1)}MB`
      });
    }

    // System-specific warnings
    for (const [systemName, systemTime] of snapshot.systemTimes) {
      if (systemTime > 10) { // System taking more than 10ms
        BrowserLogger.warn("PerformanceProfiler", `Slow system detected`, {
          system: systemName,
          time: systemTime.toFixed(2)
        });
      }
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): {
    frameTime: number;
    fps: number;
    memoryUsage: NodeJS.MemoryUsage;
    systemMetrics: Map<string, SystemMetrics>;
  } {
    if (this.snapshots.length === 0) {
      return {
        frameTime: 0,
        fps: 0,
        memoryUsage: process.memoryUsage(),
        systemMetrics: new Map(this.systemMetrics)
      };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    return {
      frameTime: latest.frameTime,
      fps: latest.fps,
      memoryUsage: latest.memoryUsage,
      systemMetrics: new Map(this.systemMetrics)
    };
  }

  /**
   * Get performance summary over time period
   */
  public getSummary(timeWindowMs: number = 5000): {
    averageFrameTime: number;
    averageFps: number;
    minFrameTime: number;
    maxFrameTime: number;
    frameCount: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentSnapshots = this.snapshots.filter(s => s.timestamp >= cutoff);

    if (recentSnapshots.length === 0) {
      return {
        averageFrameTime: 0,
        averageFps: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        frameCount: 0,
        memoryTrend: 'stable'
      };
    }

    const frameTimes = recentSnapshots.map(s => s.frameTime);
    const memoryUsages = recentSnapshots.map(s => s.memoryUsage.heapUsed);

    return {
      averageFrameTime: frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length,
      averageFps: frameTimes.reduce((sum, time) => sum + (1000 / time), 0) / frameTimes.length,
      minFrameTime: Math.min(...frameTimes),
      maxFrameTime: Math.max(...frameTimes),
      frameCount: recentSnapshots.length,
      memoryTrend: this.calculateMemoryTrend(memoryUsages)
    };
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(memoryUsages: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (memoryUsages.length < 2) return 'stable';

    const first = memoryUsages[0];
    const last = memoryUsages[memoryUsages.length - 1];
    const threshold = first * 0.1; // 10% threshold

    if (last > first + threshold) {
      return 'increasing';
    } else if (last < first - threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Get system performance breakdown
   */
  public getSystemBreakdown(): Array<{
    name: string;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
    callCount: number;
    percentageOfFrameTime: number;
  }> {
    const breakdown = [];
    const totalSystemTime = Array.from(this.systemMetrics.values())
      .reduce((sum, metrics) => sum + metrics.totalTime, 0);

    for (const metrics of this.systemMetrics.values()) {
      breakdown.push({
        name: metrics.name,
        totalTime: metrics.totalTime,
        averageTime: metrics.averageTime,
        maxTime: metrics.maxTime,
        minTime: metrics.minTime,
        callCount: metrics.callCount,
        percentageOfFrameTime: totalSystemTime > 0 ? (metrics.totalTime / totalSystemTime) * 100 : 0
      });
    }

    // Sort by total time (descending)
    return breakdown.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Get performance recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const current = this.getCurrentMetrics();

    // Frame rate recommendations
    if (current.fps < 30) {
      recommendations.push("Consider optimizing systems to achieve 30+ FPS");
    } else if (current.fps < 60) {
      recommendations.push("Consider further optimization for 60+ FPS");
    }

    // Memory recommendations
    const heapUsedMB = current.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 256) {
      recommendations.push("High memory usage detected - consider memory optimization");
    }

    // System-specific recommendations
    const slowSystems = Array.from(this.systemMetrics.values())
      .filter(metrics => metrics.averageTime > 5)
      .sort((a, b) => b.averageTime - a.averageTime);

    for (const system of slowSystems.slice(0, 3)) {
      recommendations.push(`Optimize ${system.name} system (avg: ${system.averageTime.toFixed(2)}ms)`);
    }

    return recommendations;
  }

  /**
   * Enable or disable profiling
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    BrowserLogger.info("PerformanceProfiler", `Profiler ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if profiler is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.snapshots = [];
    this.systemMetrics.clear();
    this.frameCount = 0;
    this.frameStartTime = 0;
    BrowserLogger.info("PerformanceProfiler", "Profiler metrics reset");
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    snapshots: PerformanceSnapshot[];
    systemMetrics: Record<string, SystemMetrics>;
    summary: ReturnType<PerformanceProfiler['getSummary']>;
  } {
    return {
      snapshots: [...this.snapshots],
      systemMetrics: Object.fromEntries(this.systemMetrics),
      summary: this.getSummary()
    };
  }

  /**
   * Create runtime metrics resource for engine
   */
  public createRuntimeMetrics(): RuntimeMetricsResource {
    const current = this.getCurrentMetrics();
    
    return {
      currentFps: current.fps,
      heapUsedMb: current.memoryUsage.heapUsed / 1024 / 1024,
      lowPerformanceMode: current.fps < 30,
      namedBenchmarks: {
        logicGraphSystemMs: this.systemMetrics.get('LogicGraphSystem')?.averageTime || 0,
        physicsSystemMs: this.systemMetrics.get('PhysicsSystem')?.averageTime || 0,
        renderSystemMs: this.systemMetrics.get('RenderSystem')?.averageTime || 0,
      },
      selectedSnapshotOffsetMs: 0,
      stressTestActive: false,
      systemBenchmarks: [],
      tracedNodesByAsset: {}
    };
  }
}

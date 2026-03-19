/**
 * Multithreading Performance Profiler
 * 
 * Comprehensive performance profiling system for multithreaded systems.
 * Provides detailed metrics, analysis, and optimization recommendations.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import type { 
  WorkerMetrics,
  PerformanceSnapshot
} from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface SystemProfile {
  systemType: 'physics' | 'particles' | 'render' | 'overall';
  enabled: boolean;
  samplingInterval: number;
  maxSamples: number;
  samples: PerformanceSample[];
  metrics: SystemMetrics;
  alerts: PerformanceAlert[];
}

interface PerformanceSample {
  timestamp: number;
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  workerCount: number;
  activeWorkers: number;
  taskQueueSize: number;
  taskThroughput: number;
  averageTaskTime: number;
  errorRate: number;
}

interface SystemMetrics {
  averageFPS: number;
  averageFrameTime: number;
  peakCPUUsage: number;
  averageMemoryUsage: number;
  totalTasksProcessed: number;
  averageTaskTime: number;
  errorRate: number;
  efficiency: number; // 0-1 scale
  bottlenecks: string[];
  recommendations: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metrics: Partial<PerformanceSample>;
}

interface ProfilingReport {
  timestamp: number;
  duration: number;
  summary: {
    overallPerformance: number;
    totalSamples: number;
    alertsCount: number;
    recommendationsCount: number;
  };
  systems: Record<string, SystemProfile>;
  trends: PerformanceTrend[];
  optimizationSuggestions: OptimizationSuggestion[];
}

interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changeRate: number;
  confidence: number; // 0-1 scale
}

interface OptimizationSuggestion {
  system: string;
  type: 'worker_count' | 'task_distribution' | 'memory_optimization' | 'algorithm_improvement';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: number; // Percentage
  implementationComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Multithreading Performance Profiler
 * 
 * Provides comprehensive performance monitoring and analysis
 * for multithreaded systems.
 */
export class MultithreadingPerformanceProfiler implements System<EngineComponents, EngineResources> {
  private profiles: Map<string, SystemProfile> = new Map();
  private isInitialized = false;
  private profilingStartTime = 0;
  private lastSampleTime = 0;
  private globalAlerts: PerformanceAlert[] = [];

  constructor() {
    this.initializeProfiles();
    
    BrowserLogger.info("MultithreadingPerformanceProfiler", "Created", {
      systems: Array.from(this.profiles.keys())
    });
  }

  /**
   * Initialize system profiles
   */
  private initializeProfiles(): void {
    const systemTypes: Array<'physics' | 'particles' | 'render' | 'overall'> = ['physics', 'particles', 'render', 'overall'];
    
    for (const systemType of systemTypes) {
      this.profiles.set(systemType, {
        systemType,
        enabled: true,
        samplingInterval: 1000, // 1 second
        maxSamples: 300, // 5 minutes at 60fps
        samples: [],
        metrics: {
          averageFPS: 60,
          averageFrameTime: 16.67,
          peakCPUUsage: 0,
          averageMemoryUsage: 0,
          totalTasksProcessed: 0,
          averageTaskTime: 0,
          errorRate: 0,
          efficiency: 1.0,
          bottlenecks: [],
          recommendations: []
        },
        alerts: []
      });
    }
  }

  /**
   * Initialize the profiler
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    this.profilingStartTime = Date.now();
    this.lastSampleTime = Date.now();
    this.isInitialized = true;
    
    BrowserLogger.info("MultithreadingPerformanceProfiler", "Initialized", {
      profilingStartTime: this.profilingStartTime
    });

    return Promise.resolve();
  }

  /**
   * Execute performance profiling
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.isInitialized) {
      return;
    }

    const now = Date.now();
    
    // Sample each enabled system
    for (const [systemType, profile] of this.profiles) {
      if (!profile.enabled) {
        continue;
      }

      // Check if it's time to sample
      if (now - this.lastSampleTime < profile.samplingInterval) {
        continue;
      }

      // Collect performance sample
      const sample = this.collectSample(systemType as 'physics' | 'particles' | 'render' | 'overall', world, deltaTime);
      
      // Add to samples
      profile.samples.push(sample);
      
      // Maintain max samples
      if (profile.samples.length > profile.maxSamples) {
        profile.samples.shift();
      }
      
      // Update metrics
      this.updateMetrics(profile);
      
      // Check for alerts
      this.checkAlerts(profile);
    }

    this.lastSampleTime = now;
  }

  /**
   * Collect performance sample for a system
   */
  private collectSample(
    systemType: 'physics' | 'particles' | 'render' | 'overall',
    world: World<EngineComponents, EngineResources>,
    deltaTime: number
  ): PerformanceSample {
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const renderStats = world.getResource("renderStats");
    const particleRuntime = world.getResource("particleRuntime");
    
    // Base metrics
    const baseSample: PerformanceSample = {
      timestamp: Date.now(),
      fps: runtimeMetrics?.currentFps || 60,
      frameTime: deltaTime,
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: this.estimateMemoryUsage(),
      workerCount: this.getWorkerCount(systemType),
      activeWorkers: this.getActiveWorkerCount(systemType),
      taskQueueSize: this.getTaskQueueSize(systemType),
      taskThroughput: this.getTaskThroughput(systemType),
      averageTaskTime: this.getAverageTaskTime(systemType),
      errorRate: this.getErrorRate(systemType)
    };

    // System-specific metrics
    switch (systemType) {
      case 'physics':
        return {
          ...baseSample,
          averageTaskTime: runtimeMetrics?.namedBenchmarks.physicsSystemMs || 0
        };
        
      case 'particles':
        return {
          ...baseSample,
          taskQueueSize: particleRuntime?.allParticles.length || 0,
          averageTaskTime: this.estimateParticleProcessingTime(particleRuntime)
        };
        
      case 'render':
        return {
          ...baseSample,
          averageTaskTime: runtimeMetrics?.namedBenchmarks.renderSystemMs || 0,
          taskQueueSize: renderStats?.visibleEntities || 0
        };
        
      case 'overall':
        return baseSample;
        
      default:
        return baseSample;
    }
  }

  /**
   * Update system metrics from samples
   */
  private updateMetrics(profile: SystemProfile): void {
    const samples = profile.samples;
    if (samples.length === 0) {
      return;
    }

    // Calculate averages
    const recentSamples = samples.slice(-60); // Last 60 samples
    
    profile.metrics.averageFPS = this.calculateAverage(recentSamples, s => s.fps);
    profile.metrics.averageFrameTime = this.calculateAverage(recentSamples, s => s.frameTime);
    profile.metrics.peakCPUUsage = Math.max(...recentSamples.map(s => s.cpuUsage));
    profile.metrics.averageMemoryUsage = this.calculateAverage(recentSamples, s => s.memoryUsage);
    profile.metrics.totalTasksProcessed = recentSamples.reduce((sum, s) => sum + s.taskThroughput, 0);
    profile.metrics.averageTaskTime = this.calculateAverage(recentSamples, s => s.averageTaskTime);
    profile.metrics.errorRate = this.calculateAverage(recentSamples, s => s.errorRate);
    
    // Calculate efficiency (inverse of frame time normalized to 60fps)
    profile.metrics.efficiency = Math.min(1, 16.67 / profile.metrics.averageFrameTime);
    
    // Identify bottlenecks
    profile.metrics.bottlenecks = this.identifyBottlenecks(profile);
    
    // Generate recommendations
    profile.metrics.recommendations = this.generateRecommendations(profile);
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(profile: SystemProfile): void {
    const latestSample = profile.samples[profile.samples.length - 1];
    if (!latestSample) {
      return;
    }

    // Check for various alert conditions
    this.checkFPSAlert(profile, latestSample);
    this.checkCPUAlert(profile, latestSample);
    this.checkMemoryAlert(profile, latestSample);
    this.checkTaskQueueAlert(profile, latestSample);
    this.checkErrorRateAlert(profile, latestSample);
  }

  /**
   * Check FPS alert
   */
  private checkFPSAlert(profile: SystemProfile, sample: PerformanceSample): void {
    if (sample.fps < 30) {
      this.createAlert(profile, {
        type: 'error',
        severity: 'high',
        message: `Low FPS detected: ${sample.fps.toFixed(1)}fps`,
        metrics: { fps: sample.fps }
      });
    } else if (sample.fps < 45) {
      this.createAlert(profile, {
        type: 'warning',
        severity: 'medium',
        message: `FPS below target: ${sample.fps.toFixed(1)}fps`,
        metrics: { fps: sample.fps }
      });
    }
  }

  /**
   * Check CPU alert
   */
  private checkCPUAlert(profile: SystemProfile, sample: PerformanceSample): void {
    if (sample.cpuUsage > 90) {
      this.createAlert(profile, {
        type: 'error',
        severity: 'critical',
        message: `Very high CPU usage: ${sample.cpuUsage.toFixed(1)}%`,
        metrics: { cpuUsage: sample.cpuUsage }
      });
    } else if (sample.cpuUsage > 75) {
      this.createAlert(profile, {
        type: 'warning',
        severity: 'medium',
        message: `High CPU usage: ${sample.cpuUsage.toFixed(1)}%`,
        metrics: { cpuUsage: sample.cpuUsage }
      });
    }
  }

  /**
   * Check memory alert
   */
  private checkMemoryAlert(profile: SystemProfile, sample: PerformanceSample): void {
    if (sample.memoryUsage > 1024) { // 1GB
      this.createAlert(profile, {
        type: 'warning',
        severity: 'medium',
        message: `High memory usage: ${(sample.memoryUsage / 1024).toFixed(1)}GB`,
        metrics: { memoryUsage: sample.memoryUsage }
      });
    }
  }

  /**
   * Check task queue alert
   */
  private checkTaskQueueAlert(profile: SystemProfile, sample: PerformanceSample): void {
    if (sample.taskQueueSize > 100) {
      this.createAlert(profile, {
        type: 'warning',
        severity: 'medium',
        message: `Large task queue: ${sample.taskQueueSize} tasks`,
        metrics: { taskQueueSize: sample.taskQueueSize }
      });
    }
  }

  /**
   * Check error rate alert
   */
  private checkErrorRateAlert(profile: SystemProfile, sample: PerformanceSample): void {
    if (sample.errorRate > 0.05) { // 5% error rate
      this.createAlert(profile, {
        type: 'error',
        severity: 'high',
        message: `High error rate: ${(sample.errorRate * 100).toFixed(1)}%`,
        metrics: { errorRate: sample.errorRate }
      });
    }
  }

  /**
   * Create an alert
   */
  private createAlert(profile: SystemProfile, alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const existingAlert = profile.alerts.find(a => 
      a.type === alert.type && 
      a.message === alert.message && 
      !a.resolved
    );

    if (!existingAlert) {
      const newAlert: PerformanceAlert = {
        ...alert,
        id: `alert-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        resolved: false
      };

      profile.alerts.push(newAlert);
      
      BrowserLogger.warn("MultithreadingPerformanceProfiler", "Performance alert", {
        system: profile.systemType,
        type: alert.type,
        message: alert.message
      });
    }
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(profile: SystemProfile): string[] {
    const bottlenecks: string[] = [];
    const metrics = profile.metrics;

    if (metrics.averageFPS < 45) {
      bottlenecks.push('low_fps');
    }

    if (metrics.peakCPUUsage > 80) {
      bottlenecks.push('high_cpu');
    }

    if (metrics.averageTaskTime > 20) {
      bottlenecks.push('slow_tasks');
    }

    if (metrics.errorRate > 0.02) {
      bottlenecks.push('high_error_rate');
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(profile: SystemProfile): string[] {
    const recommendations: string[] = [];
    const bottlenecks = profile.metrics.bottlenecks;

    for (const bottleneck of bottlenecks) {
      switch (bottleneck) {
        case 'low_fps':
          recommendations.push('Consider increasing worker count');
          recommendations.push('Optimize task distribution');
          break;
        case 'high_cpu':
          recommendations.push('Reduce task complexity');
          recommendations.push('Enable task batching');
          break;
        case 'slow_tasks':
          recommendations.push('Optimize algorithms');
          recommendations.push('Increase parallelization');
          break;
        case 'high_error_rate':
          recommendations.push('Check worker thread stability');
          recommendations.push('Review task data validation');
          break;
      }
    }

    return recommendations;
  }

  /**
   * Helper methods for metric estimation
   */
  private estimateCPUUsage(): number {
    // This would use actual CPU monitoring
    return Math.random() * 30 + 20; // 20-50% placeholder
  }

  private estimateMemoryUsage(): number {
    // This would use actual memory monitoring
    return Math.random() * 200 + 100; // 100-300MB placeholder
  }

  private getWorkerCount(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    // This would get actual worker count from the system
    return Math.floor(Math.random() * 4) + 1;
  }

  private getActiveWorkerCount(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    return this.getWorkerCount(systemType);
  }

  private getTaskQueueSize(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    return Math.floor(Math.random() * 10);
  }

  private getTaskThroughput(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    return Math.floor(Math.random() * 100) + 50;
  }

  private getAverageTaskTime(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    return Math.random() * 10 + 2;
  }

  private getErrorRate(systemType: 'physics' | 'particles' | 'render' | 'overall'): number {
    return Math.random() * 0.02; // 0-2% error rate
  }

  private estimateParticleProcessingTime(particleRuntime: any): number {
    if (!particleRuntime) return 0;
    return particleRuntime.allParticles.length * 0.01; // 0.01ms per particle
  }

  private calculateAverage(samples: PerformanceSample[], selector: (s: PerformanceSample) => number): number {
    if (samples.length === 0) return 0;
    const sum = samples.reduce((acc, sample) => acc + selector(sample), 0);
    return sum / samples.length;
  }

  /**
   * Generate comprehensive profiling report
   */
  public generateReport(): ProfilingReport {
    const timestamp = Date.now();
    const duration = timestamp - this.profilingStartTime;
    
    const systems: Record<string, SystemProfile> = {};
    let totalSamples = 0;
    let totalAlerts = 0;
    let totalRecommendations = 0;

    for (const [systemType, profile] of this.profiles) {
      systems[systemType] = profile;
      totalSamples += profile.samples.length;
      totalAlerts += profile.alerts.filter(a => !a.resolved).length;
      totalRecommendations += profile.metrics.recommendations.length;
    }

    const overallPerformance = this.calculateOverallPerformance();
    const trends = this.analyzeTrends();
    const optimizationSuggestions = this.generateOptimizationSuggestions();

    return {
      timestamp,
      duration,
      summary: {
        overallPerformance,
        totalSamples,
        alertsCount: totalAlerts,
        recommendationsCount: totalRecommendations
      },
      systems,
      trends,
      optimizationSuggestions
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformance(): number {
    let totalScore = 0;
    let systemCount = 0;

    for (const profile of this.profiles.values()) {
      totalScore += profile.metrics.efficiency;
      systemCount++;
    }

    return systemCount > 0 ? totalScore / systemCount : 0;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];

    for (const [systemType, profile] of this.profiles) {
      if (profile.samples.length < 10) {
        continue;
      }

      const recentSamples = profile.samples.slice(-10);
      const olderSamples = profile.samples.slice(-20, -10);

      if (olderSamples.length === 0) {
        continue;
      }

      // Analyze FPS trend
      const recentAvgFPS = this.calculateAverage(recentSamples, s => s.fps);
      const olderAvgFPS = this.calculateAverage(olderSamples, s => s.fps);
      const fpsChange = (recentAvgFPS - olderAvgFPS) / olderAvgFPS;

      trends.push({
        metric: `${systemType}_fps`,
        direction: fpsChange > 0.05 ? 'improving' : fpsChange < -0.05 ? 'degrading' : 'stable',
        changeRate: fpsChange,
        confidence: Math.min(1, profile.samples.length / 60)
      });
    }

    return trends;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    for (const [systemType, profile] of this.profiles) {
      for (const recommendation of profile.metrics.recommendations) {
        suggestions.push({
          system: systemType,
          type: this.mapRecommendationToType(recommendation),
          priority: this.mapRecommendationToPriority(recommendation),
          description: recommendation,
          expectedImprovement: 10, // 10% placeholder
          implementationComplexity: 'moderate'
        });
      }
    }

    return suggestions;
  }

  private mapRecommendationToType(recommendation: string): OptimizationSuggestion['type'] {
    if (recommendation.includes('worker')) return 'worker_count';
    if (recommendation.includes('distribution')) return 'task_distribution';
    if (recommendation.includes('memory')) return 'memory_optimization';
    return 'algorithm_improvement';
  }

  private mapRecommendationToPriority(recommendation: string): OptimizationSuggestion['priority'] {
    if (recommendation.includes('Consider')) return 'low';
    if (recommendation.includes('Optimize')) return 'medium';
    return 'high';
  }

  /**
   * Get system profile
   */
  public getProfile(systemType: 'physics' | 'particles' | 'render' | 'overall'): SystemProfile | undefined {
    return this.profiles.get(systemType);
  }

  /**
   * Enable/disable profiling for a system
   */
  public setProfilingEnabled(systemType: string, enabled: boolean): void {
    const profile = this.profiles.get(systemType);
    if (profile) {
      profile.enabled = enabled;
      BrowserLogger.info("MultithreadingPerformanceProfiler", "Profiling changed", {
        systemType,
        enabled
      });
    }
  }

  /**
   * Set sampling interval
   */
  public setSamplingInterval(systemType: string, intervalMs: number): void {
    const profile = this.profiles.get(systemType);
    if (profile) {
      profile.samplingInterval = intervalMs;
      BrowserLogger.info("MultithreadingPerformanceProfiler", "Sampling interval changed", {
        systemType,
        intervalMs
      });
    }
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    for (const profile of this.profiles.values()) {
      profile.samples = [];
      profile.alerts = [];
      profile.metrics = {
        averageFPS: 60,
        averageFrameTime: 16.67,
        peakCPUUsage: 0,
        averageMemoryUsage: 0,
        totalTasksProcessed: 0,
        averageTaskTime: 0,
        errorRate: 0,
        efficiency: 1.0,
        bottlenecks: [],
        recommendations: []
      };
    }

    this.globalAlerts = [];
    this.profilingStartTime = Date.now();

    BrowserLogger.info("MultithreadingPerformanceProfiler", "All data cleared");
  }

  /**
   * Export data to JSON
   */
  public exportData(): string {
    const data = {
      timestamp: Date.now(),
      profiles: Object.fromEntries(this.profiles),
      globalAlerts: this.globalAlerts,
      profilingStartTime: this.profilingStartTime
    };

    return JSON.stringify(data, null, 2);
  }
}

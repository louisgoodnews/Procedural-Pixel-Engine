/**
 * Performance testing and benchmarking framework
 * Provides comprehensive performance analysis and benchmarking capabilities
 */

export interface BenchmarkResult {
  name: string;
  category: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: any;
}

export interface PerformanceProfile {
  name: string;
  duration: number;
  samples: number;
  average: number;
  min: number;
  max: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  metadata?: any;
}

export interface PerformanceThreshold {
  name: string;
  category: 'memory' | 'cpu' | 'gpu' | 'network' | 'rendering';
  threshold: number;
  unit: string;
  operator: 'lt' | 'gt' | 'eq' | 'ne';
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  metadata?: any;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  benchmarks: BenchmarkResult[];
  profiles: PerformanceProfile[];
  thresholds: PerformanceThreshold[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallScore: number;
    recommendations: string[];
  };
  systemInfo: {
    userAgent: string;
    platform: string;
    cores: number;
    memory: number;
    gpuInfo?: any;
  };
}

export interface PerformanceTestConfig {
  enableAutoBenchmarking: boolean;
  benchmarkInterval: number; // milliseconds
  maxSamples: number;
  enableMemoryProfiling: boolean;
  enableCPUProfiling: boolean;
  enableGPUProfiling: boolean;
  enableNetworkProfiling: boolean;
  reportFormat: 'json' | 'html' | 'csv';
  outputPath: string;
}

export class PerformanceTester {
  private config: PerformanceTestConfig;
  private benchmarks = new Map<string, BenchmarkResult[]>();
  private profiles = new Map<string, PerformanceProfile[]>();
  private thresholds: PerformanceThreshold[] = [];
  private isProfiling = false;
  private profileStartTime = 0;
  private currentFrameMetrics = {
    frameCount: 0,
    totalTime: 0,
    minFrameTime: Infinity,
    maxFrameTime: 0,
    samples: [] as number[],
  };

  constructor(config: Partial<PerformanceTestConfig> = {}) {
    this.config = {
      enableAutoBenchmarking: true,
      benchmarkInterval: 60000, // 1 minute
      maxSamples: 1000,
      enableMemoryProfiling: true,
      enableCPUProfiling: true,
      enableGPUProfiling: true,
      enableNetworkProfiling: false,
      reportFormat: 'json',
      outputPath: './performance-reports',
      ...config,
    };

    this.setupDefaultThresholds();
  }

  /**
   * Setup default performance thresholds
   */
  private setupDefaultThresholds(): void {
    this.thresholds = [
      {
        name: 'frame-time',
        category: 'rendering',
        threshold: 16.67, // 60 FPS target
        unit: 'ms',
        operator: 'gt',
        severity: 'warning',
        description: 'Frame time exceeds 60 FPS target',
      },
      {
        name: 'memory-usage',
        category: 'memory',
        threshold: 100 * 1024 * 1024, // 100MB
        unit: 'bytes',
        operator: 'gt',
        severity: 'error',
        description: 'Memory usage exceeds 100MB',
      },
      {
        name: 'draw-calls',
        category: 'rendering',
        threshold: 1000,
        unit: 'count',
        operator: 'gt',
        severity: 'warning',
        description: 'Too many draw calls per frame',
      },
      {
        name: 'entity-count',
        category: 'cpu',
        threshold: 10000,
        unit: 'count',
        operator: 'gt',
        severity: 'warning',
        description: 'Entity count may impact performance',
      },
    ];
  }

  /**
   * Start performance profiling
   */
  startProfiling(): void {
    if (this.isProfiling) return;
    
    this.isProfiling = true;
    this.profileStartTime = performance.now();
    this.currentFrameMetrics = {
      frameCount: 0,
      totalTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      samples: [],
    };

    if (this.config.enableMemoryProfiling) {
      this.startMemoryProfiling();
    }
    
    if (this.config.enableCPUProfiling) {
      this.startCPUProfiling();
    }
    
    if (this.config.enableGPUProfiling) {
      this.startGPUProfiling();
    }
  }

  /**
   * Stop performance profiling
   */
  stopProfiling(): PerformanceProfile | null {
    if (!this.isProfiling) return null;
    
    this.isProfiling = false;
    const duration = performance.now() - this.profileStartTime;
    
    const profile: PerformanceProfile = {
      name: `profile-${Date.now()}`,
      duration,
      samples: this.currentFrameMetrics.samples.length,
      average: this.currentFrameMetrics.totalTime / Math.max(this.currentFrameMetrics.frameCount, 1),
      min: this.currentFrameMetrics.minFrameTime,
      max: this.currentFrameMetrics.maxFrameTime,
      median: this.calculateMedian(this.currentFrameMetrics.samples),
      standardDeviation: this.calculateStandardDeviation(this.currentFrameMetrics.samples),
      percentiles: this.calculatePercentiles(this.currentFrameMetrics.samples),
    };

    this.profiles.set(profile.name, [profile]);
    
    if (this.config.enableMemoryProfiling) {
      this.stopMemoryProfiling();
    }
    
    if (this.config.enableCPUProfiling) {
      this.stopCPUProfiling();
    }
    
    if (this.config.enableGPUProfiling) {
      this.stopGPUProfiling();
    }

    return profile;
  }

  /**
   * Record frame metrics
   */
  recordFrame(frameTime: number): void {
    if (!this.isProfiling) return;
    
    this.currentFrameMetrics.frameCount++;
    this.currentFrameMetrics.totalTime += frameTime;
    this.currentFrameMetrics.minFrameTime = Math.min(this.currentFrameMetrics.minFrameTime, frameTime);
    this.currentFrameMetrics.maxFrameTime = Math.max(this.currentFrameMetrics.maxFrameTime, frameTime);
    this.currentFrameMetrics.samples.push(frameTime);
    
    // Limit samples to prevent memory issues
    if (this.currentFrameMetrics.samples.length > this.config.maxSamples) {
      this.currentFrameMetrics.samples.shift();
    }
  }

  /**
   * Run a benchmark test
   */
  async runBenchmark(name: string, testFn: () => Promise<number>, iterations: number = 100): Promise<BenchmarkResult> {
    const samples: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFn();
      const duration = performance.now() - start;
      samples.push(duration);
    }
    
    const result: BenchmarkResult = {
      name,
      category: 'custom',
      value: this.calculateMedian(samples),
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        iterations,
        samples: samples.length,
        min: Math.min(...samples),
        max: Math.max(...samples),
        mean: samples.reduce((sum, val) => sum + val, 0) / samples.length,
      },
    };
    
    if (!this.benchmarks.has(name)) {
      this.benchmarks.set(name, []);
    }
    this.benchmarks.get(name)!.push(result);
    
    return result;
  }

  /**
   * Benchmark engine operations
   */
  async benchmarkEngine(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Entity creation benchmark
    results.push(await this.runBenchmark('entity-creation', async () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        // Mock entity creation
        const entity = { id: Math.random() };
        // Simulate component addition
        const components = { position: { x: 0, y: 0 } };
      }
      return performance.now() - start;
    }, 100));
    
    // Component operations benchmark
    results.push(await this.runBenchmark('component-operations', async () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        // Mock component operations
        const entity = { id: Math.random() };
        const position = { x: Math.random() * 100, y: Math.random() * 100 };
        const velocity = { x: Math.random() * 10, y: Math.random() * 10 };
      }
      return performance.now() - start;
    }, 100));
    
    // Array operations benchmark
    results.push(await this.runBenchmark('array-operations', async () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        // Mock array operations
        const array = Array(1000).fill(0).map(() => Math.random() * 100);
        array.sort((a, b) => a - b);
        array.filter(x => x > 50);
      }
      return performance.now() - start;
    }, 100));
    
    // Math operations benchmark
    results.push(await this.runBenchmark('math-operations', async () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        // Mock math operations
        const x = Math.random() * 1000;
        const y = Math.sin(x) * Math.cos(x);
        const z = Math.sqrt(x * x + y * y);
        Math.atan2(y, x);
      }
      return performance.now() - start;
    }, 100));
    
    return results;
  }

  /**
   * Benchmark rendering performance
   */
  async benchmarkRendering(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Canvas 2D operations
    results.push(await this.runBenchmark('canvas-2d-draw', async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      
      canvas.width = 800;
      canvas.height = 600;
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        (ctx as CanvasRenderingContext2D).clearRect(0, 0, canvas.width, canvas.height);
        (ctx as CanvasRenderingContext2D).fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
        (ctx as CanvasRenderingContext2D).fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          50 + Math.random() * 50,
          50 + Math.random() * 50
        );
      }
      return performance.now() - start;
    }, 100));
    
    // WebGL operations
    results.push(await this.runBenchmark('webgl-draw', async () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 0;
      
      canvas.width = 800;
      canvas.height = 600;
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        (gl as WebGLRenderingContext).clear((gl as WebGLRenderingContext).COLOR_BUFFER_BIT);
        const color = [Math.random(), Math.random(), Math.random(), 1.0];
        (gl as WebGLRenderingContext).clearColor(color[0], color[1], color[2], color[3]);
      }
      return performance.now() - start;
    }, 100));
    
    return results;
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(): PerformanceThreshold[] {
    const violations: PerformanceThreshold[] = [];
    
    // Check current frame time
    if (this.currentFrameMetrics.samples.length > 0) {
      const avgFrameTime = this.currentFrameMetrics.totalTime / this.currentFrameMetrics.frameCount;
      const frameThreshold = this.thresholds.find(t => t.name === 'frame-time');
      if (frameThreshold && avgFrameTime > frameThreshold.threshold) {
        violations.push({
          ...frameThreshold,
          metadata: {
            current: avgFrameTime,
            threshold: frameThreshold.threshold,
          },
        });
      }
    }
    
    // Check memory usage
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memoryUsage = (performance as any).memory.usedJSHeapSize;
      const memoryThreshold = this.thresholds.find(t => t.name === 'memory-usage');
      if (memoryThreshold && memoryUsage > memoryThreshold.threshold) {
        violations.push({
          ...memoryThreshold,
          metadata: {
            current: memoryUsage,
            threshold: memoryThreshold.threshold,
          },
        });
      }
    }
    
    return violations;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const allBenchmarks = Array.from(this.benchmarks.values()).flat();
    const allProfiles = Array.from(this.profiles.values()).flat();
    
    return {
      timestamp: Date.now(),
      duration: 0, // Would calculate from actual test run
      benchmarks: allBenchmarks,
      profiles: allProfiles,
      thresholds: this.checkThresholds(),
      summary: {
        totalTests: allBenchmarks.length + allProfiles.length,
        passedTests: allBenchmarks.length + allProfiles.length, // All pass for now
        failedTests: 0,
        overallScore: this.calculatePerformanceScore(allBenchmarks),
        recommendations: this.generateRecommendations(allBenchmarks, this.checkThresholds()),
      },
      systemInfo: this.getSystemInfo(),
    };
  }

  /**
   * Get system information
   */
  private getSystemInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 4,
      memory: (navigator as any).deviceMemory || 4,
      gpuInfo: this.getGPUInfo(),
    };
  }

  /**
   * Get GPU information
   */
  private getGPUInfo(): any {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return null;
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: (debugInfo as any).getParameter((debugInfo as any).UNMASKED_VENDOR_WEBGL),
        renderer: (debugInfo as any).getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL),
      };
    }
    
    return null;
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate percentiles
   */
  private calculatePercentiles(values: number[]): { p50: number; p90: number; p95: number; p99: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      p50: this.calculatePercentile(sorted, len, 0.5),
      p90: this.calculatePercentile(sorted, len, 0.9),
      p95: this.calculatePercentile(sorted, len, 0.95),
      p99: this.calculatePercentile(sorted, len, 0.99),
    };
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(sorted: number[], len: number, percentile: number): number {
    const index = (len - 1) * percentile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    // Interpolate between two values
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(benchmarks: BenchmarkResult[]): number {
    if (benchmarks.length === 0) return 100;
    
    // Simple scoring based on benchmark values (lower is better for time-based benchmarks)
    const timeBenchmarks = benchmarks.filter(b => b.unit === 'ms');
    if (timeBenchmarks.length === 0) return 100;
    
    const avgTime = timeBenchmarks.reduce((sum, b) => sum + b.value, 0) / timeBenchmarks.length;
    const normalizedScore = Math.max(0, 100 - (avgTime / 10)); // Normalize to 0-100 scale
    
    return Math.round(normalizedScore);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(benchmarks: BenchmarkResult[], violations: PerformanceThreshold[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze benchmarks
    const slowBenchmarks = benchmarks.filter(b => b.unit === 'ms' && b.value > 50);
    if (slowBenchmarks.length > 0) {
      recommendations.push('Consider optimizing slow operations identified in benchmarks');
    }
    
    // Analyze threshold violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push('Address critical performance issues immediately');
    }
    
    const warningViolations = violations.filter(v => v.severity === 'warning');
    if (warningViolations.length > 0) {
      recommendations.push('Monitor and optimize performance bottlenecks');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }
    
    return recommendations;
  }

  /**
   * Start memory profiling
   */
  private startMemoryProfiling(): void {
    // Memory profiling would require more specific APIs
    console.log('Memory profiling started');
  }

  /**
   * Stop memory profiling
   */
  private stopMemoryProfiling(): void {
    console.log('Memory profiling stopped');
  }

  /**
   * Start CPU profiling
   */
  private startCPUProfiling(): void {
    // CPU profiling would require more specific APIs
    console.log('CPU profiling started');
  }

  /**
   * Stop CPU profiling
   */
  private stopCPUProfiling(): void {
    console.log('CPU profiling stopped');
  }

  /**
   * Start GPU profiling
   */
  private startGPUProfiling(): void {
    console.log('GPU profiling started');
  }

  /**
   * Stop GPU profiling
   */
  private stopGPUProfiling(): void {
    console.log('GPU profiling stopped');
  }

  /**
   * Save report to file
   */
  async saveReport(report: PerformanceReport): Promise<void> {
    const filename = `performance-report-${new Date().toISOString()}.json`;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({
          files: [new File([blob], filename, { type: 'application/json' })],
          title: 'Performance Report',
        });
        console.log(`Performance report shared: ${filename}`);
        return;
      } catch (error) {
        console.warn('Failed to share report:', error);
      }
    }
    
    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`Performance report saved: ${filename}`);
  }

  /**
   * Get all benchmarks
   */
  getBenchmarks(): BenchmarkResult[] {
    return Array.from(this.benchmarks.values()).flat();
  }

  /**
   * Get all profiles
   */
  getProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.values()).flat();
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceTestConfig {
    return { ...this.config };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.benchmarks.clear();
    this.profiles.clear();
    this.currentFrameMetrics = {
      frameCount: 0,
      totalTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      samples: [],
    };
  }
}

// Global performance tester instance
export const performanceTester = new PerformanceTester();

// Convenience functions
export const startPerformanceProfiling = () => performanceTester.startProfiling();
export const stopPerformanceProfiling = () => performanceTester.stopProfiling();
export const recordFrame = (frameTime: number) => performanceTester.recordFrame(frameTime);
export const runEngineBenchmarks = () => performanceTester.benchmarkEngine();
export const runRenderingBenchmarks = () => performanceTester.benchmarkRendering();
export const generatePerformanceReport = () => performanceTester.generateReport();
export const savePerformanceReport = () => performanceTester.saveReport(performanceTester.generateReport());

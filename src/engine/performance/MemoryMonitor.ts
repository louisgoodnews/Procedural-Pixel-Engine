/**
 * Memory monitoring and leak detection system
 * Tracks memory usage patterns and detects potential memory leaks
 */

// Extend the Performance interface to include memory API
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  interface Window {
    gc?: () => void;
  }
}

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryLeakDetection {
  isActive: boolean;
  threshold: number; // MB per second
  windowSize: number; // seconds
  samples: MemoryStats[];
  alerts: MemoryLeakAlert[];
}

export interface MemoryLeakAlert {
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  growthRate: number; // MB per second
  currentUsage: number; // MB
}

export interface MemoryMonitorConfig {
  enabled: boolean;
  updateInterval: number; // milliseconds
  leakDetectionEnabled: boolean;
  leakThreshold: number; // MB per second
  leakWindowSize: number; // seconds
  maxHistorySize: number;
  alertCallback?: (alert: MemoryLeakAlert) => void;
}

export class MemoryMonitor {
  private config: MemoryMonitorConfig;
  private history: MemoryStats[] = [];
  private leakDetection: MemoryLeakDetection;
  private intervalId: number | null = null;
  private isMonitoring = false;

  constructor(config: Partial<MemoryMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      updateInterval: 1000, // 1 second
      leakDetectionEnabled: true,
      leakThreshold: 10, // 10 MB per second
      leakWindowSize: 60, // 1 minute window
      maxHistorySize: 300, // 5 minutes at 1 second intervals
      ...config,
    };

    this.leakDetection = {
      isActive: this.config.leakDetectionEnabled,
      threshold: this.config.leakThreshold,
      windowSize: this.config.leakWindowSize,
      samples: [],
      alerts: [],
    };
  }

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (this.isMonitoring || !this.config.enabled) {
      return;
    }

    this.isMonitoring = true;
    this.intervalId = window.setInterval(() => {
      this.collectMemoryStats();
    }, this.config.updateInterval);
  }

  /**
   * Stop monitoring memory usage
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Collect current memory statistics
   */
  private collectMemoryStats(): void {
    if (!performance.memory) {
      return;
    }

    const stats: MemoryStats = {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    };

    this.history.push(stats);

    // Limit history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    // Check for memory leaks
    if (this.leakDetection.isActive) {
      this.checkForLeaks(stats);
    }
  }

  /**
   * Check for potential memory leaks based on growth patterns
   */
  private checkForLeaks(currentStats: MemoryStats): void {
    const samples = this.leakDetection.samples;
    samples.push(currentStats);

    // Keep only samples within the window size
    const cutoffTime = currentStats.timestamp - (this.leakDetection.windowSize * 1000);
    while (samples.length > 0 && samples[0]!.timestamp < cutoffTime) {
      samples.shift();
    }

    // Need at least 2 samples to calculate growth rate
    if (samples.length < 2) {
      return;
    }

    const oldestSample = samples[0]!;
    const timeDiff = (currentStats.timestamp - oldestSample.timestamp) / 1000; // seconds
    const memoryDiff = (currentStats.usedJSHeapSize - oldestSample.usedJSHeapSize) / (1024 * 1024); // MB
    const growthRate = memoryDiff / timeDiff; // MB per second

    // Check if growth rate exceeds threshold
    if (growthRate > this.leakDetection.threshold) {
      const severity = this.calculateSeverity(growthRate);
      const alert: MemoryLeakAlert = {
        timestamp: currentStats.timestamp,
        severity,
        message: `Memory growing at ${growthRate.toFixed(2)} MB/s (threshold: ${this.leakDetection.threshold} MB/s)`,
        growthRate,
        currentUsage: currentStats.usedJSHeapSize / (1024 * 1024),
      };

      this.leakDetection.alerts.push(alert);
      this.config.alertCallback?.(alert);
    }
  }

  /**
   * Calculate alert severity based on growth rate
   */
  private calculateSeverity(growthRate: number): MemoryLeakAlert['severity'] {
    const threshold = this.leakDetection.threshold;
    if (growthRate > threshold * 5) return 'critical';
    if (growthRate > threshold * 3) return 'high';
    if (growthRate > threshold * 2) return 'medium';
    return 'low';
  }

  /**
   * Get current memory statistics
   */
  getCurrentStats(): MemoryStats | null {
    if (!performance.memory) {
      return null;
    }

    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    };
  }

  /**
   * Get memory usage history
   */
  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  /**
   * Get memory leak detection results
   */
  getLeakDetection(): MemoryLeakDetection {
    return {
      ...this.leakDetection,
      samples: [...this.leakDetection.samples],
      alerts: [...this.leakDetection.alerts],
    };
  }

  /**
   * Get memory usage summary statistics
   */
  getSummary(): {
    current: MemoryStats | null;
    average: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    leakAlerts: MemoryLeakAlert[];
  } {
    const current = this.getCurrentStats();
    const history = this.history;

    if (history.length === 0) {
      return {
        current: null,
        average: 0,
        peak: 0,
        trend: 'stable',
        leakAlerts: [],
      };
    }

    const usages = history.map(s => s.usedJSHeapSize / (1024 * 1024)); // Convert to MB
    const average = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;
    const peak = Math.max(...usages);

    // Calculate trend (compare first half with second half)
    const halfPoint = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, halfPoint);
    const secondHalf = history.slice(halfPoint);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / secondHalf.length;
      const diff = (secondAvg - firstAvg) / firstAvg;

      if (diff > 0.1) trend = 'increasing';
      else if (diff < -0.1) trend = 'decreasing';
    }

    return {
      current,
      average,
      peak,
      trend,
      leakAlerts: [...this.leakDetection.alerts],
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): boolean {
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
      return true;
    }
    return false;
  }

  /**
   * Clear history and alerts
   */
  clearHistory(): void {
    this.history = [];
    this.leakDetection.samples = [];
    this.leakDetection.alerts = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MemoryMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.leakDetection.isActive = this.config.leakDetectionEnabled;
    this.leakDetection.threshold = this.config.leakThreshold;
    this.leakDetection.windowSize = this.config.leakWindowSize;

    // Restart monitoring if settings changed
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  /**
   * Check if monitoring is active
   */
  get isActive(): boolean {
    return this.isMonitoring;
  }
}

// Global memory monitor instance
export const globalMemoryMonitor = new MemoryMonitor();

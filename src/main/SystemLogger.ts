/**
 * System Logger
 * 
 * Specialized logging wrapper for engine systems with performance tracking
 * and structured logging capabilities.
 */

import { BrowserLogger } from "../renderer/BrowserLogger";

export interface SystemConfig {
  name: string;
  version: string;
  enabled: boolean;
}

export interface SystemMetrics {
  updateCount: number;
  totalUpdateTime: number;
  averageUpdateTime: number;
  lastUpdateTime: number;
  errorCount: number;
  lastError?: string;
}

/**
 * System Logger Class
 * 
 * Provides logging and performance tracking for individual engine systems
 */
export class SystemLogger {
  private metrics: SystemMetrics;
  private config: SystemConfig;
  private timers: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();

  constructor(config: SystemConfig) {
    this.config = config;
    this.metrics = {
      updateCount: 0,
      totalUpdateTime: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0,
      errorCount: 0,
      lastError: undefined
    };

    BrowserLogger.info(config.name, `System initialized`, {
      version: config.version,
      enabled: config.enabled
    });
  }

  /**
   * Log system start
   */
  public start(): void {
    BrowserLogger.info(this.config.name, "System starting");
    this.startTimer("initialization");
  }

  /**
   * Log system started
   */
  public started(): void {
    const initTime = this.endTimer("initialization");
    BrowserLogger.info(this.config.name, `System started in ${initTime.toFixed(2)}ms`);
  }

  /**
   * Begin timing an update
   */
  public startUpdate(deltaTime: number): void {
    this.startTimer("update");
    this.metrics.lastUpdateTime = Date.now();
  }

  /**
   * End timing an update and record metrics
   */
  public endUpdate(): void {
    const updateTime = this.endTimer("update");
    
    this.metrics.updateCount++;
    this.metrics.totalUpdateTime += updateTime;
    this.metrics.averageUpdateTime = this.metrics.totalUpdateTime / this.metrics.updateCount;
    
    // Log performance warnings
    if (updateTime > 16.67) { // Below 60 FPS
      BrowserLogger.warn(this.config.name, `Slow update detected`, {
        updateTime: `${updateTime.toFixed(2)}ms`,
        averageUpdateTime: `${this.metrics.averageUpdateTime.toFixed(2)}ms`,
        updateCount: this.metrics.updateCount
      });
    }
  }

  /**
   * Log an error
   */
  public error(message: string, error?: any): void {
    this.metrics.errorCount++;
    this.metrics.lastError = message;
    
    BrowserLogger.error(this.config.name, message, error);
  }

  /**
   * Log a warning
   */
  public warn(message: string, data?: any): void {
    BrowserLogger.warn(this.config.name, message, data);
  }

  /**
   * Log info
   */
  public info(message: string, data?: any): void {
    BrowserLogger.info(this.config.name, message, data);
  }

  /**
   * Log debug
   */
  public debug(message: string, data?: any): void {
    BrowserLogger.debug(this.config.name, message, data);
  }

  /**
   * Start timing an operation
   */
  private startTimer(operation: string): void {
    const key = `${this.config.name}.${operation}`;
    this.timers.set(key, performance.now());
  }

  /**
   * End timing an operation
   */
  private endTimer(operation: string): number {
    const key = `${this.config.name}.${operation}`;
    const startTime = this.timers.get(key);
    
    if (!startTime) {
      BrowserLogger.warn(this.config.name, `Timer ended without start: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(key);

    // Store measurement
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    
    const measurements = this.measurements.get(operation)!;
    measurements.push(duration);
    
    // Keep only last 50 measurements
    if (measurements.length > 50) {
      measurements.shift();
    }

    BrowserLogger.debug(this.config.name, `${operation}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  }> {
    const stats: Record<string, any> = {};
    
    for (const [operation, measurements] of this.measurements) {
      if (measurements.length === 0) continue;
      
      const total = measurements.reduce((sum, time) => sum + time, 0);
      stats[operation] = {
        count: measurements.length,
        average: total / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        total
      };
    }
    
    return stats;
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      updateCount: 0,
      totalUpdateTime: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0,
      errorCount: this.metrics.errorCount,
      lastError: undefined
    };
    this.timers.clear();
    this.measurements.clear();
    
    BrowserLogger.info(this.config.name, "Metrics reset");
  }

  /**
   * Log system shutdown
   */
  public shutdown(): void {
    BrowserLogger.info(this.config.name, "System shutting down", {
      totalUpdates: this.metrics.updateCount,
      averageUpdateTime: `${this.metrics.averageUpdateTime.toFixed(2)}ms`,
      errorCount: this.metrics.errorCount,
      performanceStats: this.getPerformanceStats()
    });
  }

  /**
   * Create performance monitor for a specific operation
   */
  public createMonitor(operation: string) {
    return {
      start: () => this.startTimer(operation),
      end: () => this.endTimer(operation),
      getStats: () => {
        const stats = this.getPerformanceStats();
        return stats[operation] || { count: 0, average: 0, min: 0, max: 0, total: 0 };
      }
    };
  }
}

/**
 * Asset management and unloading system for memory optimization
 * Tracks asset usage and automatically unloads unused assets
 */

export interface AssetMetadata {
  id: string;
  type: 'image' | 'audio' | 'blueprint' | 'shader' | 'texture' | 'other';
  size: number; // bytes
  lastAccessed: number;
  accessCount: number;
  loadTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent: boolean; // Never unload
  dependencies: string[]; // Other assets this depends on
}

export interface AssetUnloadingConfig {
  enabled: boolean;
  maxMemoryUsage: number; // bytes
  checkInterval: number; // milliseconds
  assetTimeout: number; // milliseconds of inactivity before unloading
  lowMemoryThreshold: number; // bytes - when to start aggressive unloading
  priorityWeights: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface AssetUnloadingStats {
  totalAssets: number;
  totalSize: number;
  unloadedAssets: number;
  freedMemory: number;
  lastCheck: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
}

export class AssetManager {
  private assets = new Map<string, AssetMetadata>();
  private assetData = new Map<string, any>();
  private config: AssetUnloadingConfig;
  private intervalId: number | null = null;
  private stats: AssetUnloadingStats;
  private unloadCallbacks = new Map<string, () => void>();

  constructor(config: Partial<AssetUnloadingConfig> = {}) {
    this.config = {
      enabled: true,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      checkInterval: 30000, // 30 seconds
      assetTimeout: 300000, // 5 minutes
      lowMemoryThreshold: 256 * 1024 * 1024, // 256MB
      priorityWeights: {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      },
      ...config,
    };

    this.stats = {
      totalAssets: 0,
      totalSize: 0,
      unloadedAssets: 0,
      freedMemory: 0,
      lastCheck: 0,
      memoryPressure: 'low',
    };

    this.startMonitoring();
  }

  /**
   * Register an asset with the manager
   */
  registerAsset(
    id: string,
    data: any,
    metadata: Omit<AssetMetadata, 'lastAccessed' | 'accessCount'>
  ): void {
    const now = Date.now();
    const assetMeta: AssetMetadata = {
      ...metadata,
      lastAccessed: now,
      accessCount: 1,
    };

    this.assets.set(id, assetMeta);
    this.assetData.set(id, data);
    this.updateStats();
  }

  /**
   * Get an asset by ID, updating access statistics
   */
  getAsset<T = any>(id: string): T | null {
    const data = this.assetData.get(id);
    const metadata = this.assets.get(id);

    if (data && metadata) {
      // Update access statistics
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
      return data as T;
    }

    return null;
  }

  /**
   * Check if an asset exists
   */
  hasAsset(id: string): boolean {
    return this.assetData.has(id);
  }

  /**
   * Unregister and unload an asset
   */
  unloadAsset(id: string): boolean {
    const metadata = this.assets.get(id);
    const data = this.assetData.get(id);

    if (!metadata || !data) {
      return false;
    }

    // Don't unload persistent assets
    if (metadata.persistent) {
      return false;
    }

    // Call unload callback if registered
    const callback = this.unloadCallbacks.get(id);
    if (callback) {
      callback();
      this.unloadCallbacks.delete(id);
    }

    this.assets.delete(id);
    this.assetData.delete(id);
    
    this.stats.unloadedAssets++;
    this.stats.freedMemory += metadata.size;
    this.updateStats();

    return true;
  }

  /**
   * Register an unload callback for an asset
   */
  setUnloadCallback(id: string, callback: () => void): void {
    this.unloadCallbacks.set(id, callback);
  }

  /**
   * Start automatic asset monitoring and unloading
   */
  private startMonitoring(): void {
    if (!this.config.enabled || this.intervalId) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.checkAndUnloadAssets();
    }, this.config.checkInterval);
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check memory usage and unload assets if necessary
   */
  private checkAndUnloadAssets(): void {
    this.stats.lastCheck = Date.now();
    this.updateMemoryPressure();

    if (this.stats.memoryPressure === 'low') {
      return; // No need to unload
    }

    const candidates = this.getUnloadCandidates();
    const memoryToFree = this.calculateMemoryToFree();

    let freedMemory = 0;
    for (const candidate of candidates) {
      if (freedMemory >= memoryToFree) {
        break;
      }

      if (this.unloadAsset(candidate.id)) {
        freedMemory += candidate.size;
      }
    }

    // Force garbage collection if we freed significant memory
    if (freedMemory > 0 && window.gc) {
      window.gc();
    }
  }

  /**
   * Update memory pressure assessment
   */
  private updateMemoryPressure(): void {
    const usage = this.stats.totalSize;
    const maxUsage = this.config.maxMemoryUsage;
    const lowThreshold = this.config.lowMemoryThreshold;

    if (usage > maxUsage * 0.9) {
      this.stats.memoryPressure = 'critical';
    } else if (usage > maxUsage * 0.7) {
      this.stats.memoryPressure = 'high';
    } else if (usage > lowThreshold) {
      this.stats.memoryPressure = 'medium';
    } else {
      this.stats.memoryPressure = 'low';
    }
  }

  /**
   * Get list of assets that can be unloaded, sorted by priority
   */
  private getUnloadCandidates(): AssetMetadata[] {
    const now = Date.now();
    const candidates: AssetMetadata[] = [];

    for (const [id, metadata] of this.assets) {
      // Skip persistent assets
      if (metadata.persistent) {
        continue;
      }

      // Check if asset has timed out
      const inactiveTime = now - metadata.lastAccessed;
      if (inactiveTime < this.config.assetTimeout) {
        continue;
      }

      // Check dependencies - don't unload if other active assets depend on this
      const hasActiveDependents = this.hasActiveDependents(id);
      if (hasActiveDependents) {
        continue;
      }

      candidates.push(metadata);
    }

    // Sort by priority score (lower score = more likely to unload)
    return candidates.sort((a, b) => {
      const scoreA = this.calculateUnloadScore(a, now);
      const scoreB = this.calculateUnloadScore(b, now);
      return scoreA - scoreB;
    });
  }

  /**
   * Check if any active assets depend on the given asset
   */
  private hasActiveDependents(assetId: string): boolean {
    const now = Date.now();
    for (const [id, metadata] of this.assets) {
      if (id === assetId) continue;
      
      const inactiveTime = now - metadata.lastAccessed;
      if (inactiveTime >= this.config.assetTimeout) continue; // Inactive asset
      
      if (metadata.dependencies.includes(assetId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate unload score for an asset (lower = more likely to unload)
   */
  private calculateUnloadScore(metadata: AssetMetadata, now: number): number {
    const inactiveTime = now - metadata.lastAccessed;
    const priorityWeight = this.config.priorityWeights[metadata.priority];
    const accessFrequency = metadata.accessCount / ((now - metadata.loadTime) / 1000); // accesses per second

    // Lower score for:
    // - Higher inactive time
    // - Lower priority
    // - Lower access frequency
    return (priorityWeight * 100) - (inactiveTime / 1000) - (accessFrequency * 10);
  }

  /**
   * Calculate how much memory needs to be freed
   */
  private calculateMemoryToFree(): number {
    const usage = this.stats.totalSize;
    const maxUsage = this.config.maxMemoryUsage;
    const lowThreshold = this.config.lowMemoryThreshold;

    switch (this.stats.memoryPressure) {
      case 'critical':
        return usage - (maxUsage * 0.6); // Free down to 60%
      case 'high':
        return usage - (maxUsage * 0.7); // Free down to 70%
      case 'medium':
        return usage - lowThreshold; // Free down to low threshold
      default:
        return 0;
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.totalAssets = this.assets.size;
    this.stats.totalSize = 0;
    
    for (const metadata of this.assets.values()) {
      this.stats.totalSize += metadata.size;
    }
  }

  /**
   * Get current statistics
   */
  getStats(): AssetUnloadingStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get metadata for all assets
   */
  getAllAssets(): AssetMetadata[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type: AssetMetadata['type']): AssetMetadata[] {
    return Array.from(this.assets.values()).filter(asset => asset.type === type);
  }

  /**
   * Manually trigger asset cleanup
   */
  forceCleanup(): number {
    const beforeSize = this.stats.totalSize;
    this.checkAndUnloadAssets();
    return beforeSize - this.stats.totalSize;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AssetUnloadingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if settings changed
    if (this.intervalId) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Clear all non-persistent assets
   */
  clearAll(): void {
    const persistentAssets = new Map<string, AssetMetadata>();
    
    for (const [id, metadata] of this.assets) {
      if (metadata.persistent) {
        persistentAssets.set(id, metadata);
      } else {
        this.unloadAsset(id);
      }
    }

    // Keep only persistent assets
    this.assets.clear();
    for (const [id, metadata] of persistentAssets) {
      this.assets.set(id, metadata);
    }

    this.updateStats();
  }

  /**
   * Destroy the asset manager and clean up all resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.clearAll();
    this.assets.clear();
    this.assetData.clear();
    this.unloadCallbacks.clear();
  }
}

// Global asset manager instance
export const globalAssetManager = new AssetManager();

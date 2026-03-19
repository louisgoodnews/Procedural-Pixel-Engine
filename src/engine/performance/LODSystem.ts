/**
 * Level of Detail (LOD) system for performance optimization
 * Reduces rendering complexity for distant or less important objects
 */

export interface LODLevel {
  level: number; // 0 = highest quality, higher numbers = lower quality
  distance: number; // Distance at which this LOD level becomes active
  quality: number; // 0.0 to 1.0 quality multiplier
  scale: number; // Scale factor for the object
  detailReduction: number; // 0.0 to 1.0, how much detail to reduce
  enabled: boolean;
}

export interface LODObject {
  id: string;
  position: { x: number; y: number };
  currentLOD: number;
  baseLOD: LODLevel[];
  type: 'sprite' | 'particle' | 'geometry' | 'text';
  priority: number; // Higher priority objects maintain quality longer
  lastUpdate: number;
  transitionTime: number; // Time to transition between LOD levels
  currentTransition: number; // Current transition progress (0-1)
}

export interface LODConfig {
  enabled: boolean;
  maxLODLevels: number;
  updateInterval: number; // milliseconds
  transitionSpeed: number; // How fast to transition between LOD levels
  distanceMultiplier: number; // Multiplier for distance calculations
  enablePriorityLOD: boolean; // Consider object priority in LOD calculations
  enableSmoothTransitions: boolean;
}

export interface LODStats {
  totalObjects: number;
  lodDistribution: Record<number, number>; // Count of objects at each LOD level
  averageLOD: number;
  updateCount: number;
  transitionCount: number;
  lastUpdate: number;
}

export class LODSystem {
  private config: LODConfig;
  private objects = new Map<string, LODObject>();
  private stats: LODStats;
  private lastUpdateTime = 0;

  constructor(config: Partial<LODConfig> = {}) {
    this.config = {
      enabled: true,
      maxLODLevels: 4,
      updateInterval: 100, // 10 times per second
      transitionSpeed: 0.1, // 10% per update
      distanceMultiplier: 1.0,
      enablePriorityLOD: true,
      enableSmoothTransitions: true,
      ...config,
    };

    this.stats = {
      totalObjects: 0,
      lodDistribution: {},
      averageLOD: 0,
      updateCount: 0,
      transitionCount: 0,
      lastUpdate: 0,
    };
  }

  /**
   * Register an object for LOD management
   */
  registerObject(
    id: string,
    position: { x: number; y: number },
    type: LODObject['type'],
    priority: number = 1,
    lodLevels?: LODLevel[]
  ): void {
    const baseLOD = lodLevels || this.generateDefaultLODLevels(type);
    
    const lodObject: LODObject = {
      id,
      position,
      currentLOD: 0,
      baseLOD,
      type,
      priority,
      lastUpdate: Date.now(),
      transitionTime: 0,
      currentTransition: 0,
    };

    this.objects.set(id, lodObject);
    this.updateStats();
  }

  /**
   * Unregister an object from LOD management
   */
  unregisterObject(id: string): boolean {
    const removed = this.objects.delete(id);
    if (removed) {
      this.updateStats();
    }
    return removed;
  }

  /**
   * Update object position
   */
  updateObjectPosition(id: string, position: { x: number; y: number }): boolean {
    const obj = this.objects.get(id);
    if (!obj) {
      return false;
    }

    obj.position = position;
    obj.lastUpdate = Date.now();
    return true;
  }

  /**
   * Update object priority
   */
  updateObjectPriority(id: string, priority: number): boolean {
    const obj = this.objects.get(id);
    if (!obj) {
      return false;
    }

    obj.priority = priority;
    return true;
  }

  /**
   * Generate default LOD levels for different object types
   */
  private generateDefaultLODLevels(type: LODObject['type']): LODLevel[] {
    switch (type) {
      case 'sprite':
        return [
          { level: 0, distance: 0, quality: 1.0, scale: 1.0, detailReduction: 0.0, enabled: true },
          { level: 1, distance: 200, quality: 0.8, scale: 0.9, detailReduction: 0.2, enabled: true },
          { level: 2, distance: 400, quality: 0.6, scale: 0.8, detailReduction: 0.4, enabled: true },
          { level: 3, distance: 600, quality: 0.4, scale: 0.7, detailReduction: 0.6, enabled: true },
        ];

      case 'particle':
        return [
          { level: 0, distance: 0, quality: 1.0, scale: 1.0, detailReduction: 0.0, enabled: true },
          { level: 1, distance: 150, quality: 0.7, scale: 0.8, detailReduction: 0.3, enabled: true },
          { level: 2, distance: 300, quality: 0.5, scale: 0.6, detailReduction: 0.5, enabled: true },
          { level: 3, distance: 450, quality: 0.3, scale: 0.5, detailReduction: 0.7, enabled: true },
        ];

      case 'geometry':
        return [
          { level: 0, distance: 0, quality: 1.0, scale: 1.0, detailReduction: 0.0, enabled: true },
          { level: 1, distance: 250, quality: 0.85, scale: 0.95, detailReduction: 0.15, enabled: true },
          { level: 2, distance: 500, quality: 0.7, scale: 0.9, detailReduction: 0.3, enabled: true },
          { level: 3, distance: 750, quality: 0.5, scale: 0.8, detailReduction: 0.5, enabled: true },
        ];

      case 'text':
        return [
          { level: 0, distance: 0, quality: 1.0, scale: 1.0, detailReduction: 0.0, enabled: true },
          { level: 1, distance: 300, quality: 0.8, scale: 0.9, detailReduction: 0.2, enabled: true },
          { level: 2, distance: 600, quality: 0.6, scale: 0.8, detailReduction: 0.4, enabled: true },
          { level: 3, distance: 900, quality: 0.4, scale: 0.7, detailReduction: 0.6, enabled: true },
        ];

      default:
        return this.generateDefaultLODLevels('sprite');
    }
  }

  /**
   * Update LOD levels for all objects based on camera position
   */
  updateLOD(cameraX: number, cameraY: number): LODStats {
    if (!this.config.enabled) {
      return this.stats;
    }

    const now = Date.now();
    
    // Throttle updates
    if (now - this.lastUpdateTime < this.config.updateInterval) {
      return this.stats;
    }

    this.stats.updateCount++;
    this.stats.lastUpdate = now;
    this.stats.lodDistribution = {};

    let totalLOD = 0;

    for (const obj of this.objects.values()) {
      const distance = this.calculateDistance(obj.position, { x: cameraX, y: cameraY });
      const targetLOD = this.calculateTargetLOD(obj, distance);
      
      // Smooth transitions if enabled
      if (this.config.enableSmoothTransitions && obj.currentLOD !== targetLOD) {
        obj.currentTransition += this.config.transitionSpeed;
        
        if (obj.currentTransition >= 1.0) {
          obj.currentLOD = targetLOD;
          obj.currentTransition = 0;
          this.stats.transitionCount++;
        }
      } else {
        obj.currentLOD = targetLOD;
        obj.currentTransition = 0;
      }

      // Update statistics
      this.stats.lodDistribution[obj.currentLOD] = (this.stats.lodDistribution[obj.currentLOD] || 0) + 1;
      totalLOD += obj.currentLOD;
    }

    this.stats.averageLOD = this.objects.size > 0 ? totalLOD / this.objects.size : 0;
    this.lastUpdateTime = now;

    return { ...this.stats };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy) * this.config.distanceMultiplier;
  }

  /**
   * Calculate target LOD level based on distance and priority
   */
  private calculateTargetLOD(obj: LODObject, distance: number): number {
    // Find the appropriate LOD level based on distance
    let targetLOD = 0;
    
    for (const lod of obj.baseLOD) {
      if (lod.enabled && distance >= lod.distance) {
        targetLOD = lod.level;
      } else {
        break;
      }
    }

    // Adjust for priority if enabled
    if (this.config.enablePriorityLOD) {
      const priorityAdjustment = Math.floor(obj.priority / 3); // Reduce LOD level for high priority objects
      targetLOD = Math.max(0, targetLOD - priorityAdjustment);
    }

    // Clamp to available LOD levels
    return Math.min(targetLOD, obj.baseLOD.length - 1);
  }

  /**
   * Get LOD settings for an object
   */
  getObjectLOD(id: string): LODLevel | null {
    const obj = this.objects.get(id);
    if (!obj) {
      return null;
    }

    const lodLevel = obj.baseLOD[obj.currentLOD];
    if (!lodLevel) {
      return null;
    }

    // Apply transition interpolation if in transition
    if (obj.currentTransition > 0 && obj.currentLOD < obj.baseLOD.length - 1) {
      const currentLOD = lodLevel;
      const nextLOD = obj.baseLOD[obj.currentLOD + 1];
      
      if (nextLOD) {
        const t = obj.currentTransition;
        return {
          ...currentLOD,
          quality: currentLOD.quality * (1 - t) + nextLOD.quality * t,
          scale: currentLOD.scale * (1 - t) + nextLOD.scale * t,
          detailReduction: currentLOD.detailReduction * (1 - t) + nextLOD.detailReduction * t,
        };
      }
    }

    return lodLevel;
  }

  /**
   * Get all objects at a specific LOD level
   */
  getObjectsAtLOD(level: number): LODObject[] {
    return Array.from(this.objects.values()).filter(obj => obj.currentLOD === level);
  }

  /**
   * Get objects within a certain distance range
   */
  getObjectsInDistanceRange(minDistance: number, maxDistance: number, cameraX: number, cameraY: number): LODObject[] {
    return Array.from(this.objects.values()).filter(obj => {
      const distance = this.calculateDistance(obj.position, { x: cameraX, y: cameraY });
      return distance >= minDistance && distance <= maxDistance;
    });
  }

  /**
   * Force all objects to a specific LOD level
   */
  forceLODLevel(level: number): void {
    for (const obj of this.objects.values()) {
      obj.currentLOD = Math.min(level, obj.baseLOD.length - 1);
      obj.currentTransition = 0;
    }
  }

  /**
   * Reset all objects to highest quality LOD
   */
  resetToHighestQuality(): void {
    this.forceLODLevel(0);
  }

  /**
   * Update LOD configuration for an object
   */
  updateObjectLODLevels(id: string, lodLevels: LODLevel[]): boolean {
    const obj = this.objects.get(id);
    if (!obj) {
      return false;
    }

    obj.baseLOD = lodLevels;
    return true;
  }

  /**
   * Get LOD statistics
   */
  getStats(): LODStats {
    return { ...this.stats };
  }

  /**
   * Get LOD efficiency (how well the system is reducing detail)
   */
  getLODEfficiency(): number {
    if (this.stats.totalObjects === 0) return 0;
    
    const maxPossibleLOD = this.config.maxLODLevels - 1;
    const currentAverageLOD = this.stats.averageLOD;
    
    return (currentAverageLOD / maxPossibleLOD) * 100;
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.totalObjects = this.objects.size;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LODConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): LODConfig {
    return { ...this.config };
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
    this.updateStats();
  }

  /**
   * Get performance recommendations based on current LOD stats
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const efficiency = this.getLODEfficiency();

    if (efficiency < 20) {
      recommendations.push('LOD system is not effectively reducing detail. Consider increasing distance thresholds.');
    }

    if (this.stats.averageLOD < 0.5) {
      recommendations.push('Most objects are at highest quality. Consider adding more LOD levels or reducing distances.');
    }

    if (this.stats.transitionCount > this.stats.updateCount * 0.1) {
      recommendations.push('High LOD transition rate. Consider reducing transition speed or increasing update interval.');
    }

    const highQualityObjects = this.stats.lodDistribution[0] || 0;
    if (highQualityObjects > this.stats.totalObjects * 0.7) {
      recommendations.push('Too many objects at highest quality. Consider adjusting distance thresholds or priority system.');
    }

    return recommendations;
  }

  /**
   * Export LOD configuration for debugging
   */
  exportConfiguration(): {
    config: LODConfig;
    stats: LODStats;
    objects: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      currentLOD: number;
      priority: number;
      lodLevels: LODLevel[];
    }>;
  } {
    return {
      config: this.config,
      stats: this.stats,
      objects: Array.from(this.objects.values()).map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position,
        currentLOD: obj.currentLOD,
        priority: obj.priority,
        lodLevels: obj.baseLOD,
      })),
    };
  }
}

// Global LOD system instance
export const globalLODSystem = new LODSystem();

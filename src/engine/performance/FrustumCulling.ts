/**
 * Frustum culling system for efficient off-screen object culling
 * Reduces rendering overhead by skipping objects outside the visible area
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Frustum {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CullableObject {
  id: string;
  bounds: BoundingBox | Circle;
  visible: boolean;
  lastCulled: number;
  cullCount: number;
  priority: number; // Higher priority objects are less likely to be culled
}

export interface CullingStats {
  totalObjects: number;
  visibleObjects: number;
  culledObjects: number;
  cullingTime: number;
  lastUpdate: number;
}

export interface CullingConfig {
  enabled: boolean;
  margin: number; // Extra margin around viewport to catch objects just outside view
  enableDistanceCulling: boolean;
  maxCullingDistance: number;
  enablePriorityCulling: boolean;
  adaptiveCulling: boolean; // Adjust culling based on performance
}

export class FrustumCulling {
  private config: CullingConfig;
  private objects = new Map<string, CullableObject>();
  private currentFrustum: Frustum;
  private stats: CullingStats;
  private adaptiveThreshold = 60; // FPS threshold for adaptive culling

  constructor(config: Partial<CullingConfig> = {}) {
    this.config = {
      enabled: true,
      margin: 50,
      enableDistanceCulling: true,
      maxCullingDistance: 2000,
      enablePriorityCulling: true,
      adaptiveCulling: true,
      ...config,
    };

    this.currentFrustum = {
      left: 0,
      right: 800,
      top: 0,
      bottom: 600,
    };

    this.stats = {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      cullingTime: 0,
      lastUpdate: 0,
    };
  }

  /**
   * Register an object for culling
   */
  registerObject(
    id: string,
    bounds: BoundingBox | Circle,
    priority: number = 1
  ): void {
    this.objects.set(id, {
      id,
      bounds,
      visible: true,
      lastCulled: 0,
      cullCount: 0,
      priority,
    });
  }

  /**
   * Unregister an object from culling
   */
  unregisterObject(id: string): void {
    this.objects.delete(id);
  }

  /**
   * Update object bounds
   */
  updateObjectBounds(id: string, bounds: BoundingBox | Circle): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.bounds = bounds;
    }
  }

  /**
   * Update object priority
   */
  updateObjectPriority(id: string, priority: number): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.priority = priority;
    }
  }

  /**
   * Update the frustum based on camera and viewport
   */
  updateFrustum(
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    const margin = this.config.margin;
    
    this.currentFrustum = {
      left: cameraX - margin,
      right: cameraX + viewportWidth + margin,
      top: cameraY - margin,
      bottom: cameraY + viewportHeight + margin,
    };
  }

  /**
   * Perform culling on all registered objects
   */
  cullObjects(centerX?: number, centerY?: number, currentFPS?: number): CullingStats {
    const startTime = performance.now();
    
    this.stats.totalObjects = this.objects.size;
    this.stats.visibleObjects = 0;
    this.stats.culledObjects = 0;

    // Adjust culling aggressiveness based on performance if adaptive culling is enabled
    let effectiveMargin = this.config.margin;
    if (this.config.adaptiveCulling && currentFPS) {
      effectiveMargin = this.calculateAdaptiveMargin(currentFPS);
    }

    // Update frustum with adaptive margin
    const adaptiveFrustum = {
      left: this.currentFrustum.left - effectiveMargin,
      right: this.currentFrustum.right + effectiveMargin,
      top: this.currentFrustum.top - effectiveMargin,
      bottom: this.currentFrustum.bottom + effectiveMargin,
    };

    for (const obj of this.objects.values()) {
      const wasVisible = obj.visible;
      obj.visible = this.isObjectVisibleInternal(obj, adaptiveFrustum, centerX, centerY);

      if (obj.visible) {
        this.stats.visibleObjects++;
      } else {
        this.stats.culledObjects++;
        if (!wasVisible) {
          obj.cullCount++;
          obj.lastCulled = Date.now();
        }
      }
    }

    this.stats.cullingTime = performance.now() - startTime;
    this.stats.lastUpdate = Date.now();

    return { ...this.stats };
  }

  /**
   * Calculate adaptive margin based on current FPS
   */
  private calculateAdaptiveMargin(currentFPS: number): number {
    const baseMargin = this.config.margin;
    
    if (currentFPS >= this.adaptiveThreshold) {
      // Good performance, use normal margin
      return baseMargin;
    } else if (currentFPS >= this.adaptiveThreshold * 0.7) {
      // Slightly degraded performance, increase margin slightly
      return baseMargin * 1.2;
    } else if (currentFPS >= this.adaptiveThreshold * 0.5) {
      // Poor performance, increase margin significantly
      return baseMargin * 1.5;
    } else {
      // Very poor performance, aggressive culling
      return baseMargin * 2;
    }
  }

  /**
   * Check if an object is visible within the frustum
   */
  private isObjectVisibleInternal(
    obj: CullableObject,
    frustum: Frustum,
    centerX?: number,
    centerY?: number
  ): boolean {
    // Priority culling - always show high priority objects when performance is poor
    if (this.config.enablePriorityCulling && obj.priority >= 5) {
      return true;
    }

    // Frustum culling
    const inFrustum = this.isInFrustum(obj.bounds, frustum);
    if (!inFrustum) {
      return false;
    }

    // Distance culling
    if (this.config.enableDistanceCulling && centerX !== undefined && centerY !== undefined) {
      return this.isWithinDistance(obj.bounds, centerX, centerY);
    }

    return true;
  }

  /**
   * Check if bounds are within the frustum
   */
  private isInFrustum(bounds: BoundingBox | Circle, frustum: Frustum): boolean {
    if ('radius' in bounds) {
      // Circle bounds
      return (
        bounds.x + bounds.radius >= frustum.left &&
        bounds.x - bounds.radius <= frustum.right &&
        bounds.y + bounds.radius >= frustum.top &&
        bounds.y - bounds.radius <= frustum.bottom
      );
    } else {
      // Rectangle bounds
      return (
        bounds.x + bounds.width >= frustum.left &&
        bounds.x <= frustum.right &&
        bounds.y + bounds.height >= frustum.top &&
        bounds.y <= frustum.bottom
      );
    }
  }

  /**
   * Check if bounds are within maximum culling distance
   */
  private isWithinDistance(bounds: BoundingBox | Circle, centerX: number, centerY: number): boolean {
    let distance: number;

    if ('radius' in bounds) {
      // Circle bounds - use center point
      const dx = bounds.x - centerX;
      const dy = bounds.y - centerY;
      distance = Math.sqrt(dx * dx + dy * dy);
    } else {
      // Rectangle bounds - use closest point
      const closestX = Math.max(bounds.x, Math.min(centerX, bounds.x + bounds.width));
      const closestY = Math.max(bounds.y, Math.min(centerY, bounds.y + bounds.height));
      const dx = closestX - centerX;
      const dy = closestY - centerY;
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    return distance <= this.config.maxCullingDistance;
  }

  /**
   * Get visible objects
   */
  getVisibleObjects(): CullableObject[] {
    return Array.from(this.objects.values()).filter(obj => obj.visible);
  }

  /**
   * Get culled objects
   */
  getCulledObjects(): CullableObject[] {
    return Array.from(this.objects.values()).filter(obj => !obj.visible);
  }

  /**
   * Check if a specific object is visible
   */
  isObjectVisible(id: string): boolean {
    const obj = this.objects.get(id);
    return obj?.visible ?? false;
  }

  /**
   * Get culling statistics
   */
  getStats(): CullingStats {
    return { ...this.stats };
  }

  /**
   * Get culling efficiency (percentage of objects culled)
   */
  getCullingEfficiency(): number {
    if (this.stats.totalObjects === 0) return 0;
    return (this.stats.culledObjects / this.stats.totalObjects) * 100;
  }

  /**
   * Force all objects to be visible (disable culling temporarily)
   */
  showAllObjects(): void {
    for (const obj of this.objects.values()) {
      obj.visible = true;
    }
  }

  /**
   * Reset culling statistics
   */
  resetStats(): void {
    this.stats = {
      totalObjects: this.objects.size,
      visibleObjects: 0,
      culledObjects: 0,
      cullingTime: 0,
      lastUpdate: 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CullingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CullingConfig {
    return { ...this.config };
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
    this.resetStats();
  }

  /**
   * Get objects that have been culled for a long time (potential optimization targets)
   */
  getLongCulledObjects(thresholdMs: number = 5000): CullableObject[] {
    const now = Date.now();
    return Array.from(this.objects.values()).filter(
      obj => !obj.visible && (now - obj.lastCulled) > thresholdMs
    );
  }

  /**
   * Get objects by priority level
   */
  getObjectsByPriority(minPriority: number, maxPriority: number): CullableObject[] {
    return Array.from(this.objects.values()).filter(
      obj => obj.priority >= minPriority && obj.priority <= maxPriority
    );
  }
}

// Global frustum culling instance
export const globalFrustumCulling = new FrustumCulling();

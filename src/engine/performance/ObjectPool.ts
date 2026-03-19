/**
 * Generic Object Pool for memory-efficient object reuse
 * Reduces garbage collection overhead by recycling objects instead of creating new ones
 */

export interface PoolableObject {
  reset?(): void;
  initialize?(...args: any[]): void;
}

export class ObjectPool<T extends PoolableObject> {
  private readonly pool: T[] = [];
  private readonly createFn: () => T;
  private readonly resetFn?: (obj: T) => void;
  private readonly maxPoolSize: number;
  private readonly minPoolSize: number;
  private stats = {
    created: 0,
    reused: 0,
    discarded: 0,
    totalRequests: 0,
  };

  constructor(
    createFn: () => T,
    options: {
      maxPoolSize?: number;
      minPoolSize?: number;
      resetFn?: (obj: T) => void;
    } = {}
  ) {
    this.createFn = createFn;
    this.resetFn = options.resetFn;
    this.maxPoolSize = options.maxPoolSize || 1000;
    this.minPoolSize = options.minPoolSize || 10;
  }

  /**
   * Acquire an object from the pool, creating a new one if necessary
   */
  acquire(...args: any[]): T {
    this.stats.totalRequests++;

    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.stats.reused++;
    } else {
      obj = this.createFn();
      this.stats.created++;
    }

    // Initialize the object if it has an initialize method
    if (obj.initialize && args.length > 0) {
      obj.initialize(...args);
    }

    return obj;
  }

  /**
   * Release an object back to the pool for reuse
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxPoolSize) {
      this.stats.discarded++;
      return;
    }

    // Reset the object if it has a reset method or custom reset function
    if (this.resetFn) {
      this.resetFn(obj);
    } else if (obj.reset) {
      obj.reset();
    }

    this.pool.push(obj);
  }

  /**
   * Pre-allocate a minimum number of objects in the pool
   */
  preAllocate(count: number = 10): void {
    const targetSize = Math.max(count, this.minPoolSize);
    while (this.pool.length < targetSize && this.pool.length < this.maxPoolSize) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Clear the pool, discarding all objects
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      efficiency: this.stats.totalRequests > 0 
        ? (this.stats.reused / this.stats.totalRequests) * 100 
        : 0,
    };
  }

  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length;
  }
}

/**
 * Specialized pool for particle objects
 */
export class ParticlePool {
  private pool: any[] = [];
  private maxPoolSize: number;
  private stats = {
    created: 0,
    reused: 0,
    discarded: 0,
  };

  constructor(maxPoolSize: number = 1000) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): any {
    if (this.pool.length > 0) {
      this.stats.reused++;
      return this.pool.pop()!;
    } else {
      this.stats.created++;
      return this.createParticle();
    }
  }

  release(particle: any): void {
    if (this.pool.length >= this.maxPoolSize) {
      this.stats.discarded++;
      return;
    }

    // Reset particle properties
    particle.life = 0;
    particle.age = 0;
    particle.position = { x: 0, y: 0 };
    particle.velocity = { x: 0, y: 0 };
    particle.size = 1;
    particle.color = '#ffffff';
    particle.opacity = 1;
    particle.rotation = 0;

    this.pool.push(particle);
  }

  private createParticle(): any {
    return {
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
    };
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      efficiency: this.stats.created + this.stats.reused > 0 
        ? (this.stats.reused / (this.stats.created + this.stats.reused)) * 100 
        : 0,
    };
  }
}

/**
 * Pool manager for managing multiple object pools
 */
export class PoolManager {
  private pools = new Map<string, ObjectPool<any>>();

  /**
   * Register a new pool with a unique name
   */
  registerPool<T extends PoolableObject>(
    name: string,
    createFn: () => T,
    options?: {
      maxPoolSize?: number;
      minPoolSize?: number;
      resetFn?: (obj: T) => void;
    }
  ): ObjectPool<T> {
    const pool = new ObjectPool<T>(createFn, options);
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Get a registered pool by name
   */
  getPool<T extends PoolableObject>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * Pre-allocate all registered pools
   */
  preAllocateAll(): void {
    for (const pool of this.pools.values()) {
      pool.preAllocate();
    }
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * Get statistics for all pools
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * Get total memory usage estimate
   */
  getTotalMemoryUsage(): number {
    let total = 0;
    for (const pool of this.pools.values()) {
      total += pool.size;
    }
    return total;
  }
}

// Global pool manager instance
export const globalPoolManager = new PoolManager();

/**
 * Shared Memory Manager
 * 
 * Manages SharedArrayBuffer instances for high-performance data sharing
 * between worker threads and the main thread.
 */

import type { SharedMemoryBuffer, SharedMemoryResource } from "../shared/types/multithreading";
import { BrowserLogger } from "../renderer/BrowserLogger";

export class SharedMemoryManager {
  private buffers: Map<string, SharedMemoryBuffer> = new Map();
  private allocatedSize = 0;
  private maxCapacity: number;
  private accessLog: Map<string, number[]> = new Map();

  constructor(maxCapacity: number = 1024 * 1024 * 1024) { // 1GB default
    this.maxCapacity = maxCapacity;
    BrowserLogger.info("SharedMemoryManager", "Initialized", { maxCapacity });
  }

  /**
   * Create a new shared memory buffer
   */
  public createBuffer(
    id: string,
    size: number,
    type: SharedMemoryBuffer['type'] = 'general'
  ): SharedMemoryBuffer {
    if (this.allocatedSize + size > this.maxCapacity) {
      throw new Error(`Cannot allocate ${size} bytes: would exceed max capacity of ${this.maxCapacity} bytes`);
    }

    if (this.buffers.has(id)) {
      throw new Error(`Buffer with id '${id}' already exists`);
    }

    try {
      const buffer = new SharedArrayBuffer(size);
      const sharedBuffer: SharedMemoryBuffer = {
        id,
        buffer,
        size,
        type,
        locked: false,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      this.buffers.set(id, sharedBuffer);
      this.allocatedSize += size;
      this.recordAccess(id);

      BrowserLogger.debug("SharedMemoryManager", `Created buffer`, { id, size, type });
      return sharedBuffer;
    } catch (error) {
      BrowserLogger.error("SharedMemoryManager", `Failed to create buffer ${id}`, error);
      throw error;
    }
  }

  /**
   * Get an existing shared memory buffer
   */
  public getBuffer(id: string): SharedMemoryBuffer | undefined {
    const buffer = this.buffers.get(id);
    if (buffer) {
      buffer.lastAccessed = Date.now();
      this.recordAccess(id);
    }
    return buffer;
  }

  /**
   * Lock a buffer for exclusive access
   */
  public lockBuffer(id: string, owner?: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) {
      BrowserLogger.warn("SharedMemoryManager", `Attempted to lock non-existent buffer: ${id}`);
      return false;
    }

    if (buffer.locked) {
      BrowserLogger.debug("SharedMemoryManager", `Buffer ${id} already locked by ${buffer.owner}`);
      return false;
    }

    buffer.locked = true;
    buffer.owner = owner || 'unknown';
    buffer.lastAccessed = Date.now();

    BrowserLogger.debug("SharedMemoryManager", `Locked buffer`, { id, owner: buffer.owner });
    return true;
  }

  /**
   * Unlock a buffer
   */
  public unlockBuffer(id: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) {
      BrowserLogger.warn("SharedMemoryManager", `Attempted to unlock non-existent buffer: ${id}`);
      return false;
    }

    if (!buffer.locked) {
      BrowserLogger.warn("SharedMemoryManager", `Attempted to unlock already unlocked buffer: ${id}`);
      return false;
    }

    buffer.locked = false;
    buffer.owner = undefined;
    buffer.lastAccessed = Date.now();

    BrowserLogger.debug("SharedMemoryManager", `Unlocked buffer`, { id });
    return true;
  }

  /**
   * Delete a shared memory buffer
   */
  public deleteBuffer(id: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) {
      BrowserLogger.warn("SharedMemoryManager", `Attempted to delete non-existent buffer: ${id}`);
      return false;
    }

    if (buffer.locked) {
      BrowserLogger.warn("SharedMemoryManager", `Attempted to delete locked buffer: ${id}`);
      return false;
    }

    this.buffers.delete(id);
    this.allocatedSize -= buffer.size;
    this.accessLog.delete(id);

    BrowserLogger.debug("SharedMemoryManager", `Deleted buffer`, { id, size: buffer.size });
    return true;
  }

  /**
   * Get resource status for monitoring
   */
  public getResource(): SharedMemoryResource {
    return {
      buffers: new Map(this.buffers),
      allocatedSize: this.allocatedSize,
      maxCapacity: this.maxCapacity,
      bufferCount: this.buffers.size
    };
  }

  /**
   * Get statistics about memory usage
   */
  public getStatistics(): {
    totalBuffers: number;
    allocatedSize: number;
    maxCapacity: number;
    utilizationPercent: number;
    lockedBuffers: number;
    oldestBuffer: { id: string; age: number } | null;
    mostAccessed: { id: string; accessCount: number } | null;
  } {
    const now = Date.now();
    const buffers = Array.from(this.buffers.values());
    const lockedBuffers = buffers.filter(b => b.locked).length;
    
    let oldestBuffer = null;
    let mostAccessed = null;

    for (const [id, accessTimes] of this.accessLog) {
      const buffer = this.buffers.get(id);
      if (buffer) {
        const age = now - buffer.createdAt;
        if (!oldestBuffer || age > oldestBuffer.age) {
          oldestBuffer = { id, age };
        }

        const accessCount = accessTimes.length;
        if (!mostAccessed || accessCount > mostAccessed.accessCount) {
          mostAccessed = { id, accessCount };
        }
      }
    }

    return {
      totalBuffers: this.buffers.size,
      allocatedSize: this.allocatedSize,
      maxCapacity: this.maxCapacity,
      utilizationPercent: (this.allocatedSize / this.maxCapacity) * 100,
      lockedBuffers,
      oldestBuffer,
      mostAccessed
    };
  }

  /**
   * Clean up old unused buffers
   */
  public cleanup(maxAge: number = 30 * 60 * 1000): number { // 30 minutes default
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, buffer] of this.buffers) {
      const age = now - buffer.lastAccessed;
      if (age > maxAge && !buffer.locked) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.deleteBuffer(id);
    }

    if (toDelete.length > 0) {
      BrowserLogger.info("SharedMemoryManager", `Cleaned up old buffers`, { count: toDelete.length });
    }

    return toDelete.length;
  }

  /**
   * Optimize memory layout
   */
  public optimize(): void {
    const stats = this.getStatistics();
    
    if (stats.utilizationPercent > 80) {
      BrowserLogger.warn("SharedMemoryManager", "High memory utilization detected", {
        utilization: stats.utilizationPercent
      });
    }

    // Clean up old buffers
    this.cleanup();

    // Log optimization results
    BrowserLogger.info("SharedMemoryManager", "Memory optimization completed", stats);
  }

  /**
   * Record buffer access for statistics
   */
  private recordAccess(id: string): void {
    if (!this.accessLog.has(id)) {
      this.accessLog.set(id, []);
    }

    const accessTimes = this.accessLog.get(id)!;
    accessTimes.push(Date.now());

    // Keep only last 100 access times
    if (accessTimes.length > 100) {
      accessTimes.splice(0, accessTimes.length - 100);
    }
  }

  /**
   * Create typed views for shared buffers
   */
  public createInt8View(buffer: SharedMemoryBuffer): Int8Array {
    return new Int8Array(buffer.buffer);
  }

  public createUint8View(buffer: SharedMemoryBuffer): Uint8Array {
    return new Uint8Array(buffer.buffer);
  }

  public createInt16View(buffer: SharedMemoryBuffer): Int16Array {
    return new Int16Array(buffer.buffer);
  }

  public createUint16View(buffer: SharedMemoryBuffer): Uint16Array {
    return new Uint16Array(buffer.buffer);
  }

  public createInt32View(buffer: SharedMemoryBuffer): Int32Array {
    return new Int32Array(buffer.buffer);
  }

  public createUint32View(buffer: SharedMemoryBuffer): Uint32Array {
    return new Uint32Array(buffer.buffer);
  }

  public createFloat32View(buffer: SharedMemoryBuffer): Float32Array {
    return new Float32Array(buffer.buffer);
  }

  public createFloat64View(buffer: SharedMemoryBuffer): Float64Array {
    return new Float64Array(buffer.buffer);
  }

  /**
   * Create structured data views for complex objects
   */
  public createStructView<T extends Record<string, any>>(
    buffer: SharedMemoryBuffer,
    structDefinition: T
  ): { [K in keyof T]: T[K] extends number ? number[] : any[] } {
    const views: any = {};
    
    for (const [key, type] of Object.entries(structDefinition)) {
      switch (type) {
        case 'int8':
          views[key] = this.createInt8View(buffer);
          break;
        case 'uint8':
          views[key] = this.createUint8View(buffer);
          break;
        case 'int16':
          views[key] = this.createInt16View(buffer);
          break;
        case 'uint16':
          views[key] = this.createUint16View(buffer);
          break;
        case 'int32':
          views[key] = this.createInt32View(buffer);
          break;
        case 'uint32':
          views[key] = this.createUint32View(buffer);
          break;
        case 'float32':
          views[key] = this.createFloat32View(buffer);
          break;
        case 'float64':
          views[key] = this.createFloat64View(buffer);
          break;
        default:
          throw new Error(`Unsupported struct field type: ${type}`);
      }
    }

    return views;
  }

  /**
   * Shutdown and cleanup all resources
   */
  public shutdown(): void {
    BrowserLogger.info("SharedMemoryManager", "Shutting down");

    // Force unlock all buffers
    for (const [id, buffer] of this.buffers) {
      if (buffer.locked) {
        BrowserLogger.warn("SharedMemoryManager", `Force unlocking buffer during shutdown: ${id}`);
        buffer.locked = false;
        buffer.owner = undefined;
      }
    }

    // Clear all resources
    this.buffers.clear();
    this.allocatedSize = 0;
    this.accessLog.clear();

    BrowserLogger.info("SharedMemoryManager", "Shutdown complete");
  }
}

export interface MemoryBuffer {
    id: number;
    size: number;
    type: 'shared' | 'regular';
    created: number;
    lastAccessed: number;
}

export interface MemoryStats {
    totalBuffers: number;
    totalSize: number;
    sharedBuffers: number;
    regularBuffers: number;
    oldestBuffer: number;
    newestBuffer: number;
}

export class MemoryManager {
    private buffers: Map<number, MemoryBuffer> = new Map();
    private nextBufferId = 1;
    private maxSize = 100 * 1024 * 1024; // 100MB limit
    private currentSize = 0;
    private cleanupThreshold = 0.8; // Clean up when 80% of max size is reached

    allocateBuffer(size: number, type: 'shared' | 'regular' = 'regular'): number {
        const now = Date.now();
        
        // Check if we need to clean up
        if (this.currentSize + size > this.maxSize * this.cleanupThreshold) {
            this.cleanup();
        }
        
        const bufferId = this.nextBufferId++;
        const buffer: MemoryBuffer = {
            id: bufferId,
            size,
            type,
            created: now,
            lastAccessed: now,
        };
        
        this.buffers.set(bufferId, buffer);
        this.currentSize += size;
        
        console.log(`📦 Allocated buffer ${bufferId} (${type}): ${size} bytes`);
        
        // In a real implementation, this would create an actual buffer
        // For now, we'll just track the allocation
        
        return bufferId;
    }

    deallocateBuffer(bufferId: number): boolean {
        const buffer = this.buffers.get(bufferId);
        if (!buffer) {
            console.warn(`⚠️ Buffer ${bufferId} not found for deallocation`);
            return false;
        }
        
        this.currentSize -= buffer.size;
        this.buffers.delete(bufferId);
        
        console.log(`🗑️ Deallocated buffer ${bufferId}: freed ${buffer.size} bytes`);
        
        return true;
    }

    accessBuffer(bufferId: number): boolean {
        const buffer = this.buffers.get(bufferId);
        if (!buffer) {
            console.warn(`⚠️ Buffer ${bufferId} not found for access`);
            return false;
        }
        
        buffer.lastAccessed = Date.now();
        return true;
    }

    getBufferInfo(bufferId: number): MemoryBuffer | null {
        const buffer = this.buffers.get(bufferId);
        if (!buffer) return null;
        
        return { ...buffer };
    }

    getMemoryStats(): MemoryStats {
        const buffers = Array.from(this.buffers.values());
        const sharedBuffers = buffers.filter(b => b.type === 'shared');
        const regularBuffers = buffers.filter(b => b.type === 'regular');
        
        const timestamps = buffers.map(b => b.created);
        const oldestBuffer = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        const newestBuffer = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        
        return {
            totalBuffers: buffers.length,
            totalSize: this.currentSize,
            sharedBuffers: sharedBuffers.length,
            regularBuffers: regularBuffers.length,
            oldestBuffer,
            newestBuffer,
        };
    }

    cleanup(): void {
        console.log('🧹 Starting memory cleanup...');
        
        const buffers = Array.from(this.buffers.values());
        
        // Sort by last accessed time (oldest first)
        buffers.sort((a, b) => a.lastAccessed - b.lastAccessed);
        
        let freedSize = 0;
        let freedCount = 0;
        
        // Remove oldest buffers until we're under the threshold
        for (const buffer of buffers) {
            if (this.currentSize <= this.maxSize * 0.6) break; // Clean up to 60%
            
            this.buffers.delete(buffer.id);
            this.currentSize -= buffer.size;
            freedSize += buffer.size;
            freedCount++;
        }
        
        console.log(`🧹 Cleanup completed: freed ${freedCount} buffers (${freedSize} bytes)`);
    }

    setMaxSize(maxSize: number): void {
        this.maxSize = maxSize;
        console.log(`📏 Memory limit set to ${maxSize} bytes`);
        
        // Clean up if we're over the new limit
        if (this.currentSize > maxSize * this.cleanupThreshold) {
            this.cleanup();
        }
    }

    reset(): void {
        this.buffers.clear();
        this.nextBufferId = 1;
        this.currentSize = 0;
        console.log('🔄 Memory manager reset');
    }

    // Performance testing
    benchmarkAllocation(count: number, size: number): number {
        const start = performance.now();
        const allocatedIds: number[] = [];
        
        for (let i = 0; i < count; i++) {
            const id = this.allocateBuffer(size);
            allocatedIds.push(id);
        }
        
        for (const id of allocatedIds) {
            this.deallocateBuffer(id);
        }
        
        const end = performance.now();
        return end - start;
    }

    benchmarkAccess(count: number): number {
        // First allocate some buffers
        const bufferIds: number[] = [];
        for (let i = 0; i < count; i++) {
            bufferIds.push(this.allocateBuffer(1024));
        }
        
        const start = performance.now();
        
        // Access each buffer multiple times
        for (let round = 0; round < 10; round++) {
            for (const id of bufferIds) {
                this.accessBuffer(id);
            }
        }
        
        const end = performance.now();
        
        // Clean up
        for (const id of bufferIds) {
            this.deallocateBuffer(id);
        }
        
        return end - start;
    }

    // Exported utility functions
    static create(): MemoryManager {
        return new MemoryManager();
    }

    static formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

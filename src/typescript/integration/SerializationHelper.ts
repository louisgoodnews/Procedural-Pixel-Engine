export interface Vec2 {
    x: number;
    y: number;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface EntityData {
    id: number;
    position: Vec2;
    velocity: Vec2;
    acceleration: Vec2;
    mass: number;
    radius: number;
    color: Color;
}

export interface ParticleData {
    id: number;
    position: Vec3;
    velocity: Vec3;
    acceleration: Vec3;
    life: number;
    maxLife: number;
    size: number;
    color: Color;
}

export interface AudioData {
    id: number;
    position: Vec3;
    volume: number;
    frequency: number;
    duration: number;
    loop: boolean;
}

export class SerializationHelper {
    // Vector serialization
    static serializeVec2(vec: Vec2): ArrayBuffer {
        const buffer = new ArrayBuffer(8); // 2 * 4 bytes (float32)
        const view = new Float32Array(buffer);
        view[0] = vec.x;
        view[1] = vec.y;
        return buffer;
    }

    static deserializeVec2(buffer: ArrayBuffer): Vec2 {
        const view = new Float32Array(buffer);
        return {
            x: view[0],
            y: view[1],
        };
    }

    static serializeVec3(vec: Vec3): ArrayBuffer {
        const buffer = new ArrayBuffer(12); // 3 * 4 bytes (float32)
        const view = new Float32Array(buffer);
        view[0] = vec.x;
        view[1] = vec.y;
        view[2] = vec.z;
        return buffer;
    }

    static deserializeVec3(buffer: ArrayBuffer): Vec3 {
        const view = new Float32Array(buffer);
        return {
            x: view[0],
            y: view[1],
            z: view[2],
        };
    }

    // Color serialization
    static serializeColor(color: Color): ArrayBuffer {
        const buffer = new ArrayBuffer(4); // 4 * 1 byte (uint8)
        const view = new Uint8Array(buffer);
        view[0] = color.r;
        view[1] = color.g;
        view[2] = color.b;
        view[3] = color.a;
        return buffer;
    }

    static deserializeColor(buffer: ArrayBuffer): Color {
        const view = new Uint8Array(buffer);
        return {
            r: view[0],
            g: view[1],
            b: view[2],
            a: view[3],
        };
    }

    // Entity serialization
    static serializeEntity(entity: EntityData): ArrayBuffer {
        const buffers = [
            this.serializeVec2(entity.position),
            this.serializeVec2(entity.velocity),
            this.serializeVec2(entity.acceleration),
            this.serializeColor(entity.color),
        ];
        
        // Calculate total size
        const totalSize = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0) + 16; // +16 for id, mass, radius
        
        const combinedBuffer = new ArrayBuffer(totalSize);
        const view = new DataView(combinedBuffer);
        let offset = 0;
        
        // Write entity metadata
        view.setUint32(offset, entity.id, true); offset += 4;
        view.setFloat32(offset, entity.mass, true); offset += 4;
        view.setFloat32(offset, entity.radius, true); offset += 4;
        
        // Write vector and color data
        for (const buffer of buffers) {
            const sourceView = new Uint8Array(buffer);
            const targetView = new Uint8Array(combinedBuffer, offset, buffer.byteLength);
            targetView.set(sourceView);
            offset += buffer.byteLength;
        }
        
        return combinedBuffer;
    }

    static deserializeEntity(buffer: ArrayBuffer): EntityData {
        const view = new DataView(buffer);
        let offset = 0;
        
        const id = view.getUint32(offset, true); offset += 4;
        const mass = view.getFloat32(offset, true); offset += 4;
        const radius = view.getFloat32(offset, true); offset += 4;
        
        const position = this.deserializeVec2(buffer.slice(offset, offset + 8)); offset += 8;
        const velocity = this.deserializeVec2(buffer.slice(offset, offset + 8)); offset += 8;
        const acceleration = this.deserializeVec2(buffer.slice(offset, offset + 8)); offset += 8;
        const color = this.deserializeColor(buffer.slice(offset, offset + 4));
        
        return {
            id,
            position,
            velocity,
            acceleration,
            mass,
            radius,
            color,
        };
    }

    // Array serialization
    static serializeEntityArray(entities: EntityData[]): ArrayBuffer {
        const entityBuffers = entities.map(entity => this.serializeEntity(entity));
        const totalSize = entityBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0) + 4; // +4 for count
        
        const combinedBuffer = new ArrayBuffer(totalSize);
        const view = new DataView(combinedBuffer);
        view.setUint32(0, entities.length, true);
        
        let offset = 4;
        for (const buffer of entityBuffers) {
            const sourceView = new Uint8Array(buffer);
            const targetView = new Uint8Array(combinedBuffer, offset, buffer.byteLength);
            targetView.set(sourceView);
            offset += buffer.byteLength;
        }
        
        return combinedBuffer;
    }

    static deserializeEntityArray(buffer: ArrayBuffer): EntityData[] {
        const view = new DataView(buffer);
        const count = view.getUint32(0, true);
        const entities: EntityData[] = [];
        
        let offset = 4;
        for (let i = 0; i < count; i++) {
            // Find the end of this entity by reading the size
            // For simplicity, we'll assume all entities are the same size
            const entitySize = 36; // 4 + 4 + 4 + 8 + 8 + 8 + 4 = 36 bytes
            const entityBuffer = buffer.slice(offset, offset + entitySize);
            entities.push(this.deserializeEntity(entityBuffer));
            offset += entitySize;
        }
        
        return entities;
    }

    // Performance testing
    static benchmarkSerialization(count: number): { serializeTime: number; deserializeTime: number; } {
        // Create test data
        const entities: EntityData[] = [];
        for (let i = 0; i < count; i++) {
            entities.push({
                id: i,
                position: { x: Math.random() * 100, y: Math.random() * 100 },
                velocity: { x: Math.random() * 10, y: Math.random() * 10 },
                acceleration: { x: 0, y: 0 },
                mass: 1 + Math.random() * 9,
                radius: 5 + Math.random() * 15,
                color: {
                    r: Math.floor(Math.random() * 256),
                    g: Math.floor(Math.random() * 256),
                    b: Math.floor(Math.random() * 256),
                    a: 255,
                },
            });
        }

        // Benchmark serialization
        const serializeStart = performance.now();
        const buffer = this.serializeEntityArray(entities);
        const serializeTime = performance.now() - serializeStart;

        // Benchmark deserialization
        const deserializeStart = performance.now();
        const deserializedEntities = this.deserializeEntityArray(buffer);
        const deserializeTime = performance.now() - deserializeStart;

        // Verify correctness
        if (deserializedEntities.length !== entities.length) {
            console.error('Serialization test failed: length mismatch');
        }

        return { serializeTime, deserializeTime };
    }

    // Utility functions
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

    static validateEntity(entity: EntityData): boolean {
        return (
            typeof entity.id === 'number' &&
            typeof entity.position.x === 'number' &&
            typeof entity.position.y === 'number' &&
            typeof entity.velocity.x === 'number' &&
            typeof entity.velocity.y === 'number' &&
            typeof entity.acceleration.x === 'number' &&
            typeof entity.acceleration.y === 'number' &&
            typeof entity.mass === 'number' &&
            typeof entity.radius === 'number' &&
            typeof entity.color.r === 'number' &&
            typeof entity.color.g === 'number' &&
            typeof entity.color.b === 'number' &&
            typeof entity.color.a === 'number' &&
            entity.color.r >= 0 && entity.color.r <= 255 &&
            entity.color.g >= 0 && entity.color.g <= 255 &&
            entity.color.b >= 0 && entity.color.b <= 255 &&
            entity.color.a >= 0 && entity.color.a <= 255
        );
    }
}

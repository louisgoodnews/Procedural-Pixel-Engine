import init, { RustPhysicsSystem } from '../../../pkg/procedural_pixel_engine_core.js';

export interface PhysicsBody {
    id: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
    mass: number;
    radius: number;
    restitution: number;
    friction: number;
    isStatic: boolean;
    layer: number;
}

export interface CollisionInfo {
    entityA: number;
    entityB: number;
    normal: { x: number; y: number };
    penetration: number;
    contactPoint: { x: number; y: number };
}

export interface PhysicsWorld {
    gravity: { x: number; y: number };
    timeStep: number;
    velocityIterations: number;
    positionIterations: number;
    boundsMin: { x: number; y: number };
    boundsMax: { x: number; y: number };
}

export interface PhysicsStats {
    entityCount: number;
    collisionCount: number;
    updateTime: number;
    broadphaseTime: number;
    narrowphaseTime: number;
    constraintTime: number;
}

export interface RaycastResult {
    entityId: number;
    hitPoint: { x: number; y: number };
}

export interface BenchmarkResult {
    entityCount: number;
    iterations: number;
    totalTime: number;
    avgTimePerFrame: number;
    estimatedFPS: number;
    stats: PhysicsStats;
}

export class RustPhysics {
    private wasmModule: RustPhysicsSystem | null = null;
    private initialized = false;

    async initialize(): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustPhysicsSystem();
            this.initialized = true;
            console.log('🦀 Rust Physics System initialized');
        }
    }

    addBody(body: PhysicsBody): void {
        this.ensureInitialized();
        this.wasmModule!.add_body(body);
    }

    removeBody(id: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.remove_body(id);
    }

    update(deltaTime: number): PhysicsStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.update(deltaTime);
        return {
            entityCount: stats.entity_count,
            collisionCount: stats.collision_count,
            updateTime: stats.update_time,
            broadphaseTime: stats.broadphase_time,
            narrowphaseTime: stats.narrowphase_time,
            constraintTime: stats.constraint_time,
        };
    }

    getStats(): PhysicsStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.get_stats();
        return {
            entityCount: stats.entity_count,
            collisionCount: stats.collision_count,
            updateTime: stats.update_time,
            broadphaseTime: stats.broadphase_time,
            narrowphaseTime: stats.narrowphase_time,
            constraintTime: stats.constraint_time,
        };
    }

    getBodies(): PhysicsBody[] {
        this.ensureInitialized();
        const bodies = this.wasmModule!.get_bodies();
        return bodies.map((body: any) => ({
            id: body.id,
            position: { x: body.position.x, y: body.position.y },
            velocity: { x: body.velocity.x, y: body.velocity.y },
            acceleration: { x: body.acceleration.x, y: body.acceleration.y },
            mass: body.mass,
            radius: body.radius,
            restitution: body.restitution,
            friction: body.friction,
            isStatic: body.is_static,
            layer: body.layer,
        }));
    }

    updateBodies(bodies: PhysicsBody[]): void {
        this.ensureInitialized();
        this.wasmModule!.update_bodies(bodies);
    }

    raycast(originX: number, originY: number, dirX: number, dirY: number, maxDistance: number): RaycastResult | null {
        this.ensureInitialized();
        const result = this.wasmModule!.raycast(originX, originY, dirX, dirY, maxDistance);
        
        if (result) {
            const parsed = JSON.parse(result);
            return {
                entityId: parsed.entityId,
                hitPoint: { x: parsed.hitPoint.x, y: parsed.hitPoint.y },
            };
        }
        return null;
    }

    queryArea(centerX: number, centerY: number, radius: number): number[] {
        this.ensureInitialized();
        const result = this.wasmModule!.query_area(centerX, centerY, radius);
        return Array.from(result);
    }

    setWorldConfig(world: PhysicsWorld): void {
        this.ensureInitialized();
        this.wasmModule!.set_world_config(world);
    }

    getWorldConfig(): PhysicsWorld {
        this.ensureInitialized();
        const world = this.wasmModule!.get_world_config();
        return {
            gravity: { x: world.gravity.x, y: world.gravity.y },
            timeStep: world.time_step,
            velocityIterations: world.velocity_iterations,
            positionIterations: world.position_iterations,
            boundsMin: { x: world.bounds_min.x, y: world.bounds_min.y },
            boundsMax: { x: world.bounds_max.x, y: world.bounds_max.y },
        };
    }

    clearBodies(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_bodies();
    }

    benchmarkPhysics(entityCount: number, iterations: number): BenchmarkResult {
        this.ensureInitialized();
        const result = this.wasmModule!.benchmark_physics(entityCount, iterations);
        const parsed = JSON.parse(result);
        
        return {
            entityCount: parsed.entityCount,
            iterations: parsed.iterations,
            totalTime: parsed.totalTime,
            avgTimePerFrame: parsed.avgTimePerFrame,
            estimatedFPS: parsed.estimatedFPS,
            stats: {
                entityCount: parsed.stats.entity_count,
                collisionCount: parsed.stats.collision_count,
                updateTime: parsed.stats.update_time,
                broadphaseTime: parsed.stats.broadphase_time,
                narrowphaseTime: parsed.stats.narrowphase_time,
                constraintTime: parsed.stats.constraint_time,
            },
        };
    }

    // Utility methods for creating physics bodies
    static createBody(config: Partial<PhysicsBody>): PhysicsBody {
        return {
            id: config.id || 0,
            position: config.position || { x: 0, y: 0 },
            velocity: config.velocity || { x: 0, y: 0 },
            acceleration: config.acceleration || { x: 0, y: 0 },
            mass: config.mass || 1.0,
            radius: config.radius || 10.0,
            restitution: config.restitution || 0.5,
            friction: config.friction || 0.01,
            isStatic: config.isStatic || false,
            layer: config.layer || 0,
        };
    }

    static createWorld(config: Partial<PhysicsWorld>): PhysicsWorld {
        return {
            gravity: config.gravity || { x: 0, y: 9.81 },
            timeStep: config.timeStep || 1.0 / 60.0,
            velocityIterations: config.velocityIterations || 8,
            positionIterations: config.positionIterations || 3,
            boundsMin: config.boundsMin || { x: -1000, y: -1000 },
            boundsMax: config.boundsMax || { x: 1000, y: 1000 },
        };
    }

    // Performance comparison with TypeScript physics
    async runPerformanceComparison(entityCount: number, iterations: number): Promise<{
        rust: BenchmarkResult;
        typescript: BenchmarkResult;
        improvement: number;
    }> {
        console.log('🧪 Running Rust vs TypeScript physics performance comparison...');
        
        // Run Rust benchmark
        const rustResult = this.benchmarkPhysics(entityCount, iterations);
        
        // Run TypeScript benchmark (simplified version)
        const typescriptResult = this.runTypeScriptBenchmark(entityCount, iterations);
        
        const improvement = ((typescriptResult.avgTimePerFrame - rustResult.avgTimePerFrame) / typescriptResult.avgTimePerFrame) * 100;
        
        console.log('📊 Performance Comparison Results:');
        console.log(`  Rust: ${rustResult.avgTimePerFrame.toFixed(2)}ms/frame (${rustResult.estimatedFPS.toFixed(1)} FPS)`);
        console.log(`  TypeScript: ${typescriptResult.avgTimePerFrame.toFixed(2)}ms/frame (${typescriptResult.estimatedFPS.toFixed(1)} FPS)`);
        console.log(`  Improvement: ${improvement.toFixed(1)}%`);
        
        return {
            rust: rustResult,
            typescript: typescriptResult,
            improvement,
        };
    }

    private runTypeScriptBenchmark(entityCount: number, iterations: number): BenchmarkResult {
        const bodies: PhysicsBody[] = [];
        
        // Create test bodies
        for (let i = 0; i < entityCount; i++) {
            bodies.push(RustPhysics.createBody({
                id: i,
                position: {
                    x: (i * 10) % 200 - 100,
                    y: (i * 15) % 200 - 100,
                },
                velocity: {
                    x: Math.sin(i * 0.1) * 50,
                    y: Math.cos(i * 0.1) * 50,
                },
                mass: 1 + (i % 5),
                radius: 5 + (i % 10),
                restitution: 0.5 + (i % 5) * 0.1,
                friction: 0.01 + (i % 3) * 0.01,
                isStatic: i % 10 === 0,
                layer: i % 4,
            }));
        }

        const startTime = performance.now();
        
        // Simple TypeScript physics simulation
        for (let frame = 0; frame < iterations; frame++) {
            const deltaTime = 1.0 / 60.0;
            const gravity = { x: 0, y: 9.81 };
            
            // Update bodies
            for (const body of bodies) {
                if (!body.isStatic) {
                    // Apply gravity
                    body.acceleration.x += gravity.x;
                    body.acceleration.y += gravity.y;
                    
                    // Update velocity
                    body.velocity.x += body.acceleration.x * deltaTime;
                    body.velocity.y += body.acceleration.y * deltaTime;
                    
                    // Apply friction
                    body.velocity.x *= (1 - body.friction * deltaTime);
                    body.velocity.y *= (1 - body.friction * deltaTime);
                    
                    // Update position
                    body.position.x += body.velocity.x * deltaTime;
                    body.position.y += body.velocity.y * deltaTime;
                    
                    // Simple bounds checking
                    if (body.position.x - body.radius < -1000) {
                        body.position.x = -1000 + body.radius;
                        body.velocity.x = -body.velocity.x * body.restitution;
                    }
                    if (body.position.x + body.radius > 1000) {
                        body.position.x = 1000 - body.radius;
                        body.velocity.x = -body.velocity.x * body.restitution;
                    }
                    if (body.position.y - body.radius < -1000) {
                        body.position.y = -1000 + body.radius;
                        body.velocity.y = -body.velocity.y * body.restitution;
                    }
                    if (body.position.y + body.radius > 1000) {
                        body.position.y = 1000 - body.radius;
                        body.velocity.y = -body.velocity.y * body.restitution;
                    }
                    
                    // Reset acceleration
                    body.acceleration.x = 0;
                    body.acceleration.y = 0;
                }
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTimePerFrame = totalTime / iterations;
        const fps = 1000 / avgTimePerFrame;
        
        return {
            entityCount,
            iterations,
            totalTime,
            avgTimePerFrame,
            estimatedFPS: fps,
            stats: {
                entityCount,
                collisionCount: 0,
                updateTime: totalTime,
                broadphaseTime: 0,
                narrowphaseTime: 0,
                constraintTime: 0,
            },
        };
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Physics System not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

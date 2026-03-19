import init, { RustParticleSystem, create_particle_config, create_emitter_config } from '../../../pkg/procedural_pixel_engine_core.js';

export interface Particle {
    id: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
    color: { r: number; g: number; b: number; a: number };
    size: number;
    life: number;
    maxLife: number;
    mass: number;
    active: boolean;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface EmitterConfig {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    velocityVariance: { x: number; y: number };
    acceleration: { x: number; y: number };
    colorStart: Color;
    colorEnd: Color;
    sizeStart: number;
    sizeEnd: number;
    lifeMin: number;
    lifeMax: number;
    massMin: number;
    massMax: number;
    emissionRate: number;
    emissionAngle: number;
    emissionAngleVariance: number;
    burstCount: number;
    loopEmission: boolean;
    active: boolean;
}

export interface ParticleSystemConfig {
    maxParticles: number;
    gravity: { x: number; y: number };
    damping: number;
    windForce: { x: number; y: number };
    timeStep: number;
    enableCollisions: boolean;
    enableSorting: boolean;
    blendingMode: number; // 0: Alpha, 1: Additive, 2: Multiply
}

export interface ParticleStats {
    activeParticles: number;
    totalEmitted: number;
    updateTime: number;
    emissionTime: number;
    physicsTime: number;
    sortingTime: number;
    renderingTime: number;
}

export interface BenchmarkResult {
    particleCount: number;
    emitterCount: number;
    iterations: number;
    totalTime: number;
    avgTimePerFrame: number;
    estimatedFPS: number;
    stats: ParticleStats;
}

export class RustParticles {
    private wasmModule: RustParticleSystem | null = null;
    private initialized = false;

    async initialize(config: ParticleSystemConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustParticleSystem(config);
            this.initialized = true;
            console.log('🦀 Rust Particle System initialized');
        }
    }

    addEmitter(emitter: EmitterConfig): void {
        this.ensureInitialized();
        this.wasmModule!.add_emitter(emitter);
    }

    removeEmitter(index: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.remove_emitter(index);
    }

    clearEmitters(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_emitters();
    }

    clearParticles(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_particles();
    }

    update(deltaTime: number): ParticleStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.update(deltaTime);
        return {
            activeParticles: stats.active_particles,
            totalEmitted: stats.total_emitted,
            updateTime: stats.update_time,
            emissionTime: stats.emission_time,
            physicsTime: stats.physics_time,
            sortingTime: stats.sorting_time,
            renderingTime: stats.rendering_time,
        };
    }

    getStats(): ParticleStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.get_stats();
        return {
            activeParticles: stats.active_particles,
            totalEmitted: stats.total_emitted,
            updateTime: stats.update_time,
            emissionTime: stats.emission_time,
            physicsTime: stats.physics_time,
            sortingTime: stats.sorting_time,
            renderingTime: stats.rendering_time,
        };
    }

    getActiveParticles(): Particle[] {
        this.ensureInitialized();
        const particles = this.wasmModule!.get_active_particles();
        return particles.map((particle: any) => ({
            id: particle.id,
            position: { x: particle.position.x, y: particle.position.y },
            velocity: { x: particle.velocity.x, y: particle.velocity.y },
            acceleration: { x: particle.acceleration.x, y: particle.acceleration.y },
            color: {
                r: particle.color.r,
                g: particle.color.g,
                b: particle.color.b,
                a: particle.color.a,
            },
            size: particle.size,
            life: particle.life,
            maxLife: particle.max_life,
            mass: particle.mass,
            active: particle.active,
        }));
    }

    getConfig(): ParticleSystemConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            maxParticles: config.max_particles,
            gravity: { x: config.gravity.x, y: config.gravity.y },
            damping: config.damping,
            windForce: { x: config.wind_force.x, y: config.wind_force.y },
            timeStep: config.time_step,
            enableCollisions: config.enable_collisions,
            enableSorting: config.enable_sorting,
            blendingMode: config.blending_mode,
        };
    }

    setConfig(config: ParticleSystemConfig): void {
        this.ensureInitialized();
        this.wasmModule!.set_config(config);
    }

    applyForce(forceX: number, forceY: number): void {
        this.ensureInitialized();
        this.wasmModule!.apply_force(forceX, forceY);
    }

    applyForceInArea(forceX: number, forceY: number, centerX: number, centerY: number, radius: number): void {
        this.ensureInitialized();
        this.wasmModule!.apply_force_in_area(forceX, forceY, centerX, centerY, radius);
    }

    createExplosion(centerX: number, centerY: number, force: number, particleCount: number, color: Color): void {
        this.ensureInitialized();
        this.wasmModule!.create_explosion(centerX, centerY, force, particleCount, color.r, color.g, color.b, color.a);
    }

    benchmarkParticles(particleCount: number, emitterCount: number, iterations: number): BenchmarkResult {
        this.ensureInitialized();
        const result = this.wasmModule!.benchmark_particles(particleCount, emitterCount, iterations);
        const parsed = JSON.parse(result);
        
        return {
            particleCount: parsed.particleCount,
            emitterCount: parsed.emitterCount,
            iterations: parsed.iterations,
            totalTime: parsed.totalTime,
            avgTimePerFrame: parsed.avgTimePerFrame,
            estimatedFPS: parsed.estimatedFPS,
            stats: {
                activeParticles: parsed.stats.active_particles,
                totalEmitted: parsed.stats.total_emitted,
                updateTime: parsed.stats.update_time,
                emissionTime: parsed.stats.emission_time,
                physicsTime: parsed.stats.physics_time,
                sortingTime: parsed.stats.sorting_time,
                renderingTime: parsed.stats.rendering_time,
            },
        };
    }

    // Utility methods for creating configurations
    static createParticleSystemConfig(config: Partial<ParticleSystemConfig>): ParticleSystemConfig {
        return {
            maxParticles: config.maxParticles || 10000,
            gravity: config.gravity || { x: 0, y: 9.81 },
            damping: config.damping || 0.01,
            windForce: config.windForce || { x: 0, y: 0 },
            timeStep: config.timeStep || 1.0 / 60.0,
            enableCollisions: config.enableCollisions || false,
            enableSorting: config.enableSorting || true,
            blendingMode: config.blendingMode || 0,
        };
    }

    static createEmitterConfig(config: Partial<EmitterConfig>): EmitterConfig {
        return {
            position: config.position || { x: 0, y: 0 },
            velocity: config.velocity || { x: 0, y: 1 },
            velocityVariance: config.velocityVariance || { x: 0.5, y: 0.5 },
            acceleration: config.acceleration || { x: 0, y: 0 },
            colorStart: config.colorStart || { r: 255, g: 255, b: 255, a: 255 },
            colorEnd: config.colorEnd || { r: 255, g: 255, b: 255, a: 0 },
            sizeStart: config.sizeStart || 5.0,
            sizeEnd: config.sizeEnd || 1.0,
            lifeMin: config.lifeMin || 1.0,
            lifeMax: config.lifeMax || 3.0,
            massMin: config.massMin || 0.1,
            massMax: config.massMax || 0.5,
            emissionRate: config.emissionRate || 60.0,
            emissionAngle: config.emissionAngle || 0.0,
            emissionAngleVariance: config.emissionAngleVariance || Math.PI * 2,
            burstCount: config.burstCount || 0,
            loopEmission: config.loopEmission !== undefined ? config.loopEmission : true,
            active: config.active !== undefined ? config.active : true,
        };
    }

    static createColor(r: number, g: number, b: number, a: number = 255): Color {
        return { r, g, b, a };
    }

    // Performance comparison with TypeScript particles
    async runPerformanceComparison(particleCount: number, emitterCount: number, iterations: number): Promise<{
        rust: BenchmarkResult;
        typescript: BenchmarkResult;
        improvement: number;
    }> {
        console.log('🧪 Running Rust vs TypeScript particle performance comparison...');
        
        // Run Rust benchmark
        const rustResult = this.benchmarkParticles(particleCount, emitterCount, iterations);
        
        // Run TypeScript benchmark (simplified version)
        const typescriptResult = this.runTypeScriptBenchmark(particleCount, emitterCount, iterations);
        
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

    private runTypeScriptBenchmark(particleCount: number, emitterCount: number, iterations: number): BenchmarkResult {
        const particles: any[] = [];
        
        // Create test particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                id: i,
                position: { x: (i * 10) % 200 - 100, y: (i * 15) % 200 - 100 },
                velocity: { x: Math.sin(i * 0.1) * 20, y: Math.cos(i * 0.1) * 20 },
                acceleration: { x: 0, y: 0 },
                color: { r: 255, g: 100, b: 50, a: 255 },
                size: 5.0,
                life: 1.0 + Math.random() * 2.0,
                maxLife: 3.0,
                mass: 0.1 + Math.random() * 0.4,
                active: true,
            });
        }

        const startTime = performance.now();
        
        // Simple TypeScript particle simulation
        for (let frame = 0; frame < iterations; frame++) {
            const deltaTime = 1.0 / 60.0;
            const gravity = { x: 0, y: 9.81 };
            const damping = 0.01;
            
            // Update particles
            for (const particle of particles) {
                if (!particle.active) continue;
                
                // Update life
                particle.life -= deltaTime;
                if (particle.life <= 0) {
                    particle.active = false;
                    continue;
                }
                
                // Apply forces
                particle.acceleration.x += gravity.x;
                particle.acceleration.y += gravity.y;
                
                // Update velocity
                particle.velocity.x += particle.acceleration.x * deltaTime;
                particle.velocity.y += particle.acceleration.y * deltaTime;
                
                // Apply damping
                particle.velocity.x *= (1 - damping * deltaTime);
                particle.velocity.y *= (1 - damping * deltaTime);
                
                // Update position
                particle.position.x += particle.velocity.x * deltaTime;
                particle.position.y += particle.velocity.y * deltaTime;
                
                // Reset acceleration
                particle.acceleration.x = 0;
                particle.acceleration.y = 0;
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTimePerFrame = totalTime / iterations;
        const fps = 1000 / avgTimePerFrame;
        
        return {
            particleCount,
            emitterCount,
            iterations,
            totalTime,
            avgTimePerFrame,
            estimatedFPS: fps,
            stats: {
                activeParticles: particles.filter(p => p.active).length,
                totalEmitted: particleCount,
                updateTime: totalTime,
                emissionTime: 0,
                physicsTime: totalTime,
                sortingTime: 0,
                renderingTime: 0,
            },
        };
    }

    // Create common particle effects
    static createFireEffect(position: { x: number; y: number }, intensity: number = 1.0): EmitterConfig {
        return RustParticles.createEmitterConfig({
            position,
            velocity: { x: 0, y: -2 },
            velocityVariance: { x: 1, y: 0.5 },
            acceleration: { x: 0, y: -5 },
            colorStart: RustParticles.createColor(255, 200, 50, 255),
            colorEnd: RustParticles.createColor(255, 50, 0, 100),
            sizeStart: 8 * intensity,
            sizeEnd: 2 * intensity,
            lifeMin: 0.5,
            lifeMax: 2.0,
            massMin: 0.05,
            massMax: 0.1,
            emissionRate: 60 * intensity,
            emissionAngle: -Math.PI / 2,
            emissionAngleVariance: Math.PI / 4,
        });
    }

    static createSmokeEffect(position: { x: number; y: number }, intensity: number = 1.0): EmitterConfig {
        return RustParticles.createEmitterConfig({
            position,
            velocity: { x: 0, y: -1 },
            velocityVariance: { x: 0.5, y: 0.3 },
            acceleration: { x: 0, y: -0.5 },
            colorStart: RustParticles.createColor(150, 150, 150, 180),
            colorEnd: RustParticles.createColor(100, 100, 100, 50),
            sizeStart: 10 * intensity,
            sizeEnd: 20 * intensity,
            lifeMin: 2.0,
            lifeMax: 5.0,
            massMin: 0.01,
            massMax: 0.05,
            emissionRate: 30 * intensity,
            emissionAngle: -Math.PI / 2,
            emissionAngleVariance: Math.PI / 6,
        });
    }

    static createExplosionEffect(position: { x: number; y: number }, intensity: number = 1.0): EmitterConfig {
        return RustParticles.createEmitterConfig({
            position,
            velocity: { x: 0, y: 0 },
            velocityVariance: { x: 15, y: 15 },
            acceleration: { x: 0, y: 0 },
            colorStart: RustParticles.createColor(255, 255, 100, 255),
            colorEnd: RustParticles.createColor(255, 50, 0, 100),
            sizeStart: 6 * intensity,
            sizeEnd: 1 * intensity,
            lifeMin: 0.3,
            lifeMax: 1.0,
            massMin: 0.1,
            massMax: 0.3,
            emissionRate: 100 * intensity,
            emissionAngle: 0,
            emissionAngleVariance: Math.PI * 2,
            burstCount: 50 * intensity,
            loopEmission: false,
        });
    }

    static createRainEffect(area: { x: number; y: number; width: number; height: number }, intensity: number = 1.0): EmitterConfig {
        return RustParticles.createEmitterConfig({
            position: { x: area.x + area.width / 2, y: area.y },
            velocity: { x: 0, y: 10 },
            velocityVariance: { x: 0.5, y: 1 },
            acceleration: { x: 0, y: 15 },
            colorStart: RustParticles.createColor(100, 150, 255, 150),
            colorEnd: RustParticles.createColor(100, 150, 255, 50),
            sizeStart: 2,
            sizeEnd: 2,
            lifeMin: 3.0,
            lifeMax: 5.0,
            massMin: 0.1,
            massMax: 0.2,
            emissionRate: 100 * intensity,
            emissionAngle: Math.PI / 2,
            emissionAngleVariance: Math.PI / 12,
        });
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Particle System not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

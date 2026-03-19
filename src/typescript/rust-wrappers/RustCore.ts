import init, { EngineCore, performance_test, greet, log_message, get_current_time, run_benchmark } from '../../../pkg/procedural_pixel_engine_core.js';

export interface PerformanceInfo {
    physicsEntities: number;
    particleCount: number;
    audioChannels: number;
}

export class RustCore {
    private wasmModule: EngineCore | null = null;
    private initialized = false;

    async initialize(): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new EngineCore();
            this.initialized = true;
            console.log('🦀 Rust Core initialized');
        }
    }

    greet(name: string): void {
        this.ensureInitialized();
        greet(name);
    }

    performanceTest(iterations: number): number {
        this.ensureInitialized();
        return performance_test(iterations);
    }

    logMessage(message: string): void {
        this.ensureInitialized();
        log_message(message);
    }

    getCurrentTime(): number {
        this.ensureInitialized();
        return get_current_time();
    }

    runBenchmark(name: string, iterations: number): number {
        this.ensureInitialized();
        return run_benchmark(name, iterations);
    }

    getPerformanceInfo(): PerformanceInfo {
        this.ensureInitialized();
        const info = this.wasmModule!.get_performance_info();
        return {
            physicsEntities: info.physics_entities,
            particleCount: info.particle_count,
            audioChannels: info.audio_channels,
        };
    }

    updateMetrics(physics: number, particles: number, audio: number): void {
        this.ensureInitialized();
        this.wasmModule!.update_metrics(physics, particles, audio);
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Core not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

import init, { RustAudioSystem, create_audio_config, create_audio_source, create_audio_effect, create_audio_listener } from '../../../pkg/procedural_pixel_engine_core.js';

export interface AudioBuffer {
    data: Float32Array;
    sampleRate: number;
    channels: number;
    length: number;
}

export interface AudioSource {
    id: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    volume: number;
    pitch: number;
    pan: number;
    loopEnabled: boolean;
    isPlaying: boolean;
    is3D: boolean;
    maxDistance: number;
    referenceDistance: number;
    rolloffFactor: number;
    coneInnerAngle: number;
    coneOuterAngle: number;
    coneOuterGain: number;
    direction: { x: number; y: number };
}

export interface AudioListener {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    direction: { x: number; y: number };
    up: { x: number; y: number };
    gain: number;
}

export interface AudioEffect {
    id: number;
    effectType: number; // 0: Reverb, 1: Delay, 2: Distortion, 3: Filter, 4: Compressor
    wetLevel: number;
    dryLevel: number;
    parameters: number[];
    enabled: boolean;
}

export interface AudioConfig {
    sampleRate: number;
    bufferSize: number;
    maxSources: number;
    maxEffects: number;
    distanceModel: number; // 0: Inverse, 1: Inverse Clamped, 2: Exponential, 3: Exponential Clamped
    dopplerFactor: number;
    speedOfSound: number;
    masterVolume: number;
}

export interface AudioStats {
    activeSources: number;
    activeEffects: number;
    processingTime: number;
    mixingTime: number;
    effectsTime: number;
    cpuUsage: number;
    memoryUsage: number;
}

export interface BenchmarkResult {
    sourceCount: number;
    effectCount: number;
    iterations: number;
    totalTime: number;
    avgTimePerFrame: number;
    estimatedFPS: number;
    stats: AudioStats;
}

export class RustAudio {
    private wasmModule: RustAudioSystem | null = null;
    private initialized = false;

    async initialize(config: AudioConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustAudioSystem(config);
            this.initialized = true;
            console.log('🦀 Rust Audio System initialized');
        }
    }

    addSource(source: AudioSource): number {
        this.ensureInitialized();
        return this.wasmModule!.add_source(source);
    }

    removeSource(id: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.remove_source(id);
    }

    addEffect(effect: AudioEffect): number {
        this.ensureInitialized();
        return this.wasmModule!.add_effect(effect);
    }

    removeEffect(id: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.remove_effect(id);
    }

    setListener(listener: AudioListener): void {
        this.ensureInitialized();
        this.wasmModule!.set_listener(listener);
    }

    getListener(): AudioListener {
        this.ensureInitialized();
        const listener = this.wasmModule!.get_listener();
        return {
            position: { x: listener.position.x, y: listener.position.y },
            velocity: { x: listener.velocity.x, y: listener.velocity.y },
            direction: { x: listener.direction.x, y: listener.direction.y },
            up: { x: listener.up.x, y: listener.up.y },
            gain: listener.gain,
        };
    }

    getConfig(): AudioConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            sampleRate: config.sample_rate,
            bufferSize: config.buffer_size,
            maxSources: config.max_sources,
            maxEffects: config.max_effects,
            distanceModel: config.distance_model,
            dopplerFactor: config.doppler_factor,
            speedOfSound: config.speed_of_sound,
            masterVolume: config.master_volume,
        };
    }

    setConfig(config: AudioConfig): void {
        this.ensureInitialized();
        this.wasmModule!.set_config(config);
    }

    processAudio(): AudioStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.process_audio();
        return {
            activeSources: stats.active_sources,
            activeEffects: stats.active_effects,
            processingTime: stats.processing_time,
            mixingTime: stats.mixing_time,
            effectsTime: stats.effects_time,
            cpuUsage: stats.cpu_usage,
            memoryUsage: stats.memory_usage,
        };
    }

    getStats(): AudioStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.get_stats();
        return {
            activeSources: stats.active_sources,
            activeEffects: stats.active_effects,
            processingTime: stats.processing_time,
            mixingTime: stats.mixing_time,
            effectsTime: stats.effects_time,
            cpuUsage: stats.cpu_usage,
            memoryUsage: stats.memory_usage,
        };
    }

    getAudioBuffer(): Float32Array {
        this.ensureInitialized();
        const buffer = this.wasmModule!.get_audio_buffer();
        return new Float32Array(buffer);
    }

    playSource(id: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.play_source(id);
    }

    pauseSource(id: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.pause_source(id);
    }

    updateSourcePosition(id: number, x: number, y: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.update_source_position(id, x, y);
    }

    updateSourceVelocity(id: number, vx: number, vy: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.update_source_velocity(id, vx, vy);
    }

    updateSourceVolume(id: number, volume: number): boolean {
        this.ensureInitialized();
        return this.wasmModule!.update_source_volume(id, volume);
    }

    enableEffect(id: number, enabled: boolean): boolean {
        this.ensureInitialized();
        return this.wasmModule!.enable_effect(id, enabled);
    }

    setEffectParameters(id: number, parameters: number[]): boolean {
        this.ensureInitialized();
        return this.wasmModule!.set_effect_parameters(id, parameters);
    }

    benchmarkAudio(sourceCount: number, effectCount: number, iterations: number): BenchmarkResult {
        this.ensureInitialized();
        const result = this.wasmModule!.benchmark_audio(sourceCount, effectCount, iterations);
        const parsed = JSON.parse(result);
        
        return {
            sourceCount: parsed.sourceCount,
            effectCount: parsed.effectCount,
            iterations: parsed.iterations,
            totalTime: parsed.totalTime,
            avgTimePerFrame: parsed.avgTimePerFrame,
            estimatedFPS: parsed.estimatedFPS,
            stats: {
                activeSources: parsed.stats.active_sources,
                activeEffects: parsed.stats.active_effects,
                processingTime: parsed.stats.processing_time,
                mixingTime: parsed.stats.mixing_time,
                effectsTime: parsed.stats.effects_time,
                cpuUsage: parsed.stats.cpu_usage,
                memoryUsage: parsed.stats.memory_usage,
            },
        };
    }

    // Utility methods for creating configurations
    static createAudioConfig(config: Partial<AudioConfig>): AudioConfig {
        return {
            sampleRate: config.sampleRate || 44100,
            bufferSize: config.bufferSize || 512,
            maxSources: config.maxSources || 32,
            maxEffects: config.maxEffects || 8,
            distanceModel: config.distanceModel || 2, // Exponential
            dopplerFactor: config.dopplerFactor || 1.0,
            speedOfSound: config.speedOfSound || 343.0,
            masterVolume: config.masterVolume || 1.0,
        };
    }

    static createAudioSource(config: Partial<AudioSource>): AudioSource {
        return {
            id: config.id || 0,
            position: config.position || { x: 0, y: 0 },
            velocity: config.velocity || { x: 0, y: 0 },
            volume: config.volume || 1.0,
            pitch: config.pitch || 1.0,
            pan: config.pan || 0.0,
            loopEnabled: config.loopEnabled || false,
            isPlaying: config.isPlaying || false,
            is3D: config.is3D !== undefined ? config.is3D : true,
            maxDistance: config.maxDistance || 100.0,
            referenceDistance: config.referenceDistance || 10.0,
            rolloffFactor: config.rolloffFactor || 1.0,
            coneInnerAngle: config.coneInnerAngle || Math.PI / 4,
            coneOuterAngle: config.coneOuterAngle || Math.PI / 2,
            coneOuterGain: config.coneOuterGain || 0.5,
            direction: config.direction || { x: 0, y: 1 },
        };
    }

    static createAudioEffect(config: Partial<AudioEffect>): AudioEffect {
        return {
            id: config.id || 0,
            effectType: config.effectType || 0, // Reverb
            wetLevel: config.wetLevel !== undefined ? config.wetLevel : 0.3,
            dryLevel: config.dryLevel !== undefined ? config.dryLevel : 0.7,
            parameters: config.parameters || [0.5, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
            enabled: config.enabled !== undefined ? config.enabled : false,
        };
    }

    static createAudioListener(config: Partial<AudioListener>): AudioListener {
        return {
            position: config.position || { x: 0, y: 0 },
            velocity: config.velocity || { x: 0, y: 0 },
            direction: config.direction || { x: 0, y: 1 },
            up: config.up || { x: 0, y: 0 },
            gain: config.gain || 1.0,
        };
    }

    // Performance comparison with TypeScript audio
    async runPerformanceComparison(sourceCount: number, effectCount: number, iterations: number): Promise<{
        rust: BenchmarkResult;
        typescript: BenchmarkResult;
        improvement: number;
    }> {
        console.log('🧪 Running Rust vs TypeScript audio performance comparison...');
        
        // Run Rust benchmark
        const rustResult = this.benchmarkAudio(sourceCount, effectCount, iterations);
        
        // Run TypeScript benchmark (simplified version)
        const typescriptResult = this.runTypeScriptBenchmark(sourceCount, effectCount, iterations);
        
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

    private runTypeScriptBenchmark(sourceCount: number, effectCount: number, iterations: number): BenchmarkResult {
        const sources: any[] = [];
        const effects: any[] = [];
        
        // Create test sources
        for (let i = 0; i < sourceCount; i++) {
            sources.push({
                id: i,
                position: { x: (i * 10) % 200 - 100, y: (i * 15) % 200 - 100 },
                velocity: { x: Math.sin(i * 0.1) * 5, y: Math.cos(i * 0.1) * 5 },
                volume: 0.5,
                pitch: 1.0,
                pan: ((i % 10) - 5) * 0.1,
                loopEnabled: true,
                isPlaying: true,
                is3D: i % 2 === 0,
            });
        }

        // Create test effects
        for (let i = 0; i < effectCount; i++) {
            effects.push({
                id: i,
                effectType: i % 5,
                wetLevel: 0.3,
                dryLevel: 0.7,
                parameters: [
                    0.5 + (i % 10) * 0.1,
                    0.5 + (i % 5) * 0.1,
                    0.1, 0.1, 0.1, 0.1, 0.1, 0.1
                ],
                enabled: true,
            });
        }

        const startTime = performance.now();
        
        // Simple TypeScript audio simulation
        for (let frame = 0; frame < iterations; frame++) {
            // Mix sources
            let mixedBuffer = new Float32Array(512 * 2); // Stereo
            
            for (const source of sources) {
                if (!source.isPlaying) continue;
                
                // Generate simple sine wave
                for (let i = 0; i < 512; i++) {
                    const phase = (i / 44100) * 440 * source.pitch;
                    const sample = Math.sin(phase * 2 * Math.PI) * source.volume;
                    
                    // Apply panning
                    const leftGain = 1 - source.pan;
                    const rightGain = 1 + source.pan;
                    
                    mixedBuffer[i * 2] += sample * leftGain;
                    mixedBuffer[i * 2 + 1] += sample * rightGain;
                }
            }
            
            // Apply effects (simplified)
            for (const effect of effects) {
                if (!effect.enabled) continue;
                
                // Simple effect processing
                for (let i = 0; i < mixedBuffer.length; i++) {
                    mixedBuffer[i] = mixedBuffer[i] * effect.dryLevel + mixedBuffer[i] * effect.wetLevel * 0.5;
                }
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTimePerFrame = totalTime / iterations;
        const fps = 1000 / avgTimePerFrame;
        
        return {
            sourceCount,
            effectCount,
            iterations,
            totalTime,
            avgTimePerFrame,
            estimatedFPS: fps,
            stats: {
                activeSources: sources.filter(s => s.isPlaying).length,
                activeEffects: effects.filter(e => e.enabled).length,
                processingTime: totalTime,
                mixingTime: totalTime * 0.7,
                effectsTime: totalTime * 0.3,
                cpuUsage: avgTimePerFrame / 16.67 * 100,
                memoryUsage: (sources.length + effects.length) * 64,
            },
        };
    }

    // Create common audio effects
    static createReverbEffect(roomSize: number = 0.5, damping: number = 0.5, wetLevel: number = 0.3, dryLevel: number = 0.7): AudioEffect {
        return RustAudio.createAudioEffect({
            effectType: 0, // Reverb
            wetLevel,
            dryLevel,
            parameters: [roomSize, damping, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
            enabled: false,
        });
    }

    static createDelayEffect(delayTime: number = 0.3, feedback: number = 0.3, wetLevel: number = 0.3, dryLevel: number = 0.7): AudioEffect {
        return RustAudio.createAudioEffect({
            effectType: 1, // Delay
            wetLevel,
            dryLevel,
            parameters: [delayTime, feedback, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
            enabled: false,
        });
    }

    static createDistortionEffect(gain: number = 5.0, level: number = 0.5, wetLevel: number = 1.0, dryLevel: number = 0.0): AudioEffect {
        return RustAudio.createAudioEffect({
            effectType: 2, // Distortion
            wetLevel,
            dryLevel,
            parameters: [gain, level, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
            enabled: false,
        });
    }

    static createLowPassFilter(cutoff: number = 1000, resonance: number = 1.0, wetLevel: number = 1.0, dryLevel: number = 0.0): AudioEffect {
        return RustAudio.createAudioEffect({
            effectType: 3, // Filter
            wetLevel,
            dryLevel,
            parameters: [cutoff, resonance, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
            enabled: false,
        });
    }

    static createCompressorEffect(threshold: number = -12, ratio: number = 4, attack: number = 0.003, release: number = 0.1, wetLevel: number = 1.0, dryLevel: number = 0.0): AudioEffect {
        return RustAudio.createAudioEffect({
            effectType: 4, // Compressor
            wetLevel,
            dryLevel,
            parameters: [threshold, ratio, attack, release, 0.1, 0.1, 0.1, 0.1],
            enabled: false,
        });
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Audio System not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

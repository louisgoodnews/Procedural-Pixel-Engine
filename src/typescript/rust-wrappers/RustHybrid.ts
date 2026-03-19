import init, { RustHybridEngine, create_hybrid_config } from '../../../pkg/procedural_pixel_engine_core.js';

export interface SystemPerformance {
    processingTime: number;
    memoryUsage: number;
    cpuUsage: number;
    throughput: number;
    latency: number;
}

export interface HybridConfig {
    autoSwitching: boolean;
    performanceThreshold: number;
    memoryThreshold: number;
    latencyThreshold: number;
    benchmarkInterval: number;
    adaptiveQuality: boolean;
    preferRust: boolean;
    fallbackEnabled: boolean;
}

export interface SystemMetrics {
    physicsPerformance: SystemPerformance;
    particlesPerformance: SystemPerformance;
    audioPerformance: SystemPerformance;
    totalPerformance: SystemPerformance;
    rustUsage: number;
    typescriptUsage: number;
    switchCount: number;
    lastSwitchTime: number;
}

export enum SystemType {
    Rust = 0,
    TypeScript = 1,
    Hybrid = 2,
}

export interface BenchmarkResult {
    iterations: number;
    totalTime: number;
    avgTimePerIteration: number;
    finalMetrics: SystemMetrics;
    systemStates: {
        physics: SystemType;
        particles: SystemType;
        audio: SystemType;
    };
    adaptiveQuality: number;
    switchCount: number;
}

export class RustHybrid {
    private wasmModule: RustHybridEngine | null = null;
    private initialized = false;

    async initialize(config: HybridConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustHybridEngine(config);
            this.initialized = true;
            console.log('🦀 Rust Hybrid Engine initialized');
        }
    }

    initializeRustSystems(): void {
        this.ensureInitialized();
        this.wasmModule!.initialize_rust_systems();
    }

    updateConfig(config: HybridConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): HybridConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            autoSwitching: config.auto_switching,
            performanceThreshold: config.performance_threshold,
            memoryThreshold: config.memory_threshold,
            latencyThreshold: config.latency_threshold,
            benchmarkInterval: config.benchmark_interval,
            adaptiveQuality: config.adaptive_quality,
            preferRust: config.prefer_rust,
            fallbackEnabled: config.fallback_enabled,
        };
    }

    benchmarkSystems(): SystemMetrics {
        this.ensureInitialized();
        const metrics = this.wasmModule!.benchmark_systems();
        return {
            physicsPerformance: {
                processingTime: metrics.physics_performance.processing_time,
                memoryUsage: metrics.physics_performance.memory_usage,
                cpuUsage: metrics.physics_performance.cpu_usage,
                throughput: metrics.physics_performance.throughput,
                latency: metrics.physics_performance.latency,
            },
            particlesPerformance: {
                processingTime: metrics.particles_performance.processing_time,
                memoryUsage: metrics.particles_performance.memory_usage,
                cpuUsage: metrics.particles_performance.cpu_usage,
                throughput: metrics.particles_performance.throughput,
                latency: metrics.particles_performance.latency,
            },
            audioPerformance: {
                processingTime: metrics.audio_performance.processing_time,
                memoryUsage: metrics.audio_performance.memory_usage,
                cpuUsage: metrics.audio_performance.cpu_usage,
                throughput: metrics.audio_performance.throughput,
                latency: metrics.audio_performance.latency,
            },
            totalPerformance: {
                processingTime: metrics.total_performance.processing_time,
                memoryUsage: metrics.total_performance.memory_usage,
                cpuUsage: metrics.total_performance.cpu_usage,
                throughput: metrics.total_performance.throughput,
                latency: metrics.total_performance.latency,
            },
            rustUsage: metrics.rust_usage,
            typescriptUsage: metrics.typescript_usage,
            switchCount: metrics.switch_count,
            lastSwitchTime: metrics.last_switch_time,
        };
    }

    getMetrics(): SystemMetrics {
        this.ensureInitialized();
        const metrics = this.wasmModule!.get_metrics();
        return {
            physicsPerformance: {
                processingTime: metrics.physics_performance.processing_time,
                memoryUsage: metrics.physics_performance.memory_usage,
                cpuUsage: metrics.physics_performance.cpu_usage,
                throughput: metrics.physics_performance.throughput,
                latency: metrics.physics_performance.latency,
            },
            particlesPerformance: {
                processingTime: metrics.particles_performance.processing_time,
                memoryUsage: metrics.particles_performance.memory_usage,
                cpuUsage: metrics.particles_performance.cpu_usage,
                throughput: metrics.particles_performance.throughput,
                latency: metrics.particles_performance.latency,
            },
            audioPerformance: {
                processingTime: metrics.audio_performance.processing_time,
                memoryUsage: metrics.audio_performance.memory_usage,
                cpuUsage: metrics.audio_performance.cpu_usage,
                throughput: metrics.audio_performance.throughput,
                latency: metrics.audio_performance.latency,
            },
            totalPerformance: {
                processingTime: metrics.total_performance.processing_time,
                memoryUsage: metrics.total_performance.memory_usage,
                cpuUsage: metrics.total_performance.cpu_usage,
                throughput: metrics.total_performance.throughput,
                latency: metrics.total_performance.latency,
            },
            rustUsage: metrics.rust_usage,
            typescriptUsage: metrics.typescript_usage,
            switchCount: metrics.switch_count,
            lastSwitchTime: metrics.last_switch_time,
        };
    }

    optimizeForPerformance(): void {
        this.ensureInitialized();
        this.wasmModule!.optimize_for_performance();
    }

    optimizeForMemory(): void {
        this.ensureInitialized();
        this.wasmModule!.optimize_for_memory();
    }

    optimizeForLatency(): void {
        this.ensureInitialized();
        this.wasmModule!.optimize_for_latency();
    }

    getSystemStates(): { physics: SystemType; particles: SystemType; audio: SystemType } {
        this.ensureInitialized();
        const states = this.wasmModule!.get_system_states();
        return {
            physics: states.physics,
            particles: states.particles,
            audio: states.audio,
        };
    }

    getAdaptiveQuality(): number {
        this.ensureInitialized();
        return this.wasmModule!.get_adaptive_quality();
    }

    setAdaptiveQuality(quality: number): void {
        this.ensureInitialized();
        this.wasmModule!.set_adaptive_quality(quality);
    }

    forceSystemSwitch(system: 'physics' | 'particles' | 'audio', systemType: SystemType): boolean {
        this.ensureInitialized();
        return this.wasmModule!.force_system_switch(system, systemType);
    }

    getPerformanceHistory(): SystemMetrics[] {
        this.ensureInitialized();
        const history = this.wasmModule!.get_performance_history();
        return history.map((metrics: any) => ({
            physicsPerformance: {
                processingTime: metrics.physics_performance.processing_time,
                memoryUsage: metrics.physics_performance.memory_usage,
                cpuUsage: metrics.physics_performance.cpu_usage,
                throughput: metrics.physics_performance.throughput,
                latency: metrics.physics_performance.latency,
            },
            particlesPerformance: {
                processingTime: metrics.particles_performance.processing_time,
                memoryUsage: metrics.particles_performance.memory_usage,
                cpuUsage: metrics.particles_performance.cpu_usage,
                throughput: metrics.particles_performance.throughput,
                latency: metrics.particles_performance.latency,
            },
            audioPerformance: {
                processingTime: metrics.audio_performance.processing_time,
                memoryUsage: metrics.audio_performance.memory_usage,
                cpuUsage: metrics.audio_performance.cpu_usage,
                throughput: metrics.audio_performance.throughput,
                latency: metrics.audio_performance.latency,
            },
            totalPerformance: {
                processingTime: metrics.total_performance.processing_time,
                memoryUsage: metrics.total_performance.memory_usage,
                cpuUsage: metrics.total_performance.cpu_usage,
                throughput: metrics.total_performance.throughput,
                latency: metrics.total_performance.latency,
            },
            rustUsage: metrics.rust_usage,
            typescriptUsage: metrics.typescript_usage,
            switchCount: metrics.switch_count,
            lastSwitchTime: metrics.last_switch_time,
        }));
    }

    clearPerformanceHistory(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_performance_history();
    }

    benchmarkHybridPerformance(iterations: number): BenchmarkResult {
        this.ensureInitialized();
        const result = this.wasmModule!.benchmark_hybrid_performance(iterations);
        const parsed = JSON.parse(result);
        
        return {
            iterations: parsed.iterations,
            totalTime: parsed.totalTime,
            avgTimePerIteration: parsed.avgTimePerIteration,
            finalMetrics: {
                physicsPerformance: {
                    processingTime: parsed.finalMetrics.physics_performance.processing_time,
                    memoryUsage: parsed.finalMetrics.physics_performance.memory_usage,
                    cpuUsage: parsed.finalMetrics.physics_performance.cpu_usage,
                    throughput: parsed.finalMetrics.physics_performance.throughput,
                    latency: parsed.finalMetrics.physics_performance.latency,
                },
                particlesPerformance: {
                    processingTime: parsed.finalMetrics.particles_performance.processing_time,
                    memoryUsage: parsed.finalMetrics.particles_performance.memory_usage,
                    cpuUsage: parsed.finalMetrics.particles_performance.cpu_usage,
                    throughput: parsed.finalMetrics.particles_performance.throughput,
                    latency: parsed.finalMetrics.particles_performance.latency,
                },
                audioPerformance: {
                    processingTime: parsed.finalMetrics.audio_performance.processing_time,
                    memoryUsage: parsed.finalMetrics.audio_performance.memory_usage,
                    cpuUsage: parsed.finalMetrics.audio_performance.cpu_usage,
                    throughput: parsed.finalMetrics.audio_performance.throughput,
                    latency: parsed.finalMetrics.audio_performance.latency,
                },
                totalPerformance: {
                    processingTime: parsed.finalMetrics.total_performance.processing_time,
                    memoryUsage: parsed.finalMetrics.total_performance.memory_usage,
                    cpuUsage: parsed.finalMetrics.total_performance.cpu_usage,
                    throughput: parsed.finalMetrics.total_performance.throughput,
                    latency: parsed.finalMetrics.total_performance.latency,
                },
                rustUsage: parsed.finalMetrics.rust_usage,
                typescriptUsage: parsed.finalMetrics.typescript_usage,
                switchCount: parsed.finalMetrics.switch_count,
                lastSwitchTime: parsed.finalMetrics.last_switch_time,
            },
            systemStates: {
                physics: parsed.systemStates.physics,
                particles: parsed.systemStates.particles,
                audio: parsed.systemStates.audio,
            },
            adaptiveQuality: parsed.adaptiveQuality,
            switchCount: parsed.switchCount,
        };
    }

    // Utility methods for creating configurations
    static createHybridConfig(config: Partial<HybridConfig>): HybridConfig {
        return {
            autoSwitching: config.autoSwitching !== undefined ? config.autoSwitching : true,
            performanceThreshold: config.performanceThreshold || 0.8,
            memoryThreshold: config.memoryThreshold || 4096,
            latencyThreshold: config.latencyThreshold || 16.0,
            benchmarkInterval: config.benchmarkInterval || 1000.0,
            adaptiveQuality: config.adaptiveQuality !== undefined ? config.adaptiveQuality : true,
            preferRust: config.preferRust !== undefined ? config.preferRust : true,
            fallbackEnabled: config.fallbackEnabled !== undefined ? config.fallbackEnabled : true,
        };
    }

    // Performance optimization presets
    static createPerformancePreset(): HybridConfig {
        return RustHybrid.createHybridConfig({
            autoSwitching: true,
            performanceThreshold: 0.6, // Lower threshold for aggressive switching
            memoryThreshold: 8192, // Higher memory threshold
            latencyThreshold: 10.0, // Lower latency threshold
            adaptiveQuality: true,
            preferRust: true,
            fallbackEnabled: true,
        });
    }

    static createMemoryPreset(): HybridConfig {
        return RustHybrid.createHybridConfig({
            autoSwitching: true,
            performanceThreshold: 0.9, // Higher threshold to avoid switching
            memoryThreshold: 2048, // Lower memory threshold
            latencyThreshold: 20.0, // Higher latency tolerance
            adaptiveQuality: true,
            preferRust: false, // Prefer TypeScript for memory efficiency
            fallbackEnabled: true,
        });
    }

    static createLatencyPreset(): HybridConfig {
        return RustHybrid.createHybridConfig({
            autoSwitching: true,
            performanceThreshold: 0.7,
            memoryThreshold: 6144,
            latencyThreshold: 8.0, // Very low latency threshold
            adaptiveQuality: false, // Disable adaptive quality for consistent latency
            preferRust: true,
            fallbackEnabled: true,
        });
    }

    static createBalancedPreset(): HybridConfig {
        return RustHybrid.createHybridConfig({
            autoSwitching: true,
            performanceThreshold: 0.8,
            memoryThreshold: 4096,
            latencyThreshold: 16.0,
            benchmarkInterval: 2000.0, // Less frequent benchmarking
            adaptiveQuality: true,
            preferRust: true,
            fallbackEnabled: true,
        });
    }

    // Performance analysis methods
    analyzePerformanceTrends(): {
        physicsTrend: 'improving' | 'stable' | 'degrading';
        particlesTrend: 'improving' | 'stable' | 'degrading';
        audioTrend: 'improving' | 'stable' | 'degrading';
        overallTrend: 'improving' | 'stable' | 'degrading';
        recommendations: string[];
    } {
        const history = this.getPerformanceHistory();
        if (history.length < 3) {
            return {
                physicsTrend: 'stable',
                particlesTrend: 'stable',
                audioTrend: 'stable',
                overallTrend: 'stable',
                recommendations: ['Need more performance data for analysis'],
            };
        }

        const analyzeTrend = (getMetric: (m: SystemMetrics) => number): 'improving' | 'stable' | 'degrading' => {
            const recent = history.slice(-3).map(getMetric);
            const trend = recent[2] - recent[0];
            
            if (Math.abs(trend) < 0.05) return 'stable';
            return trend < 0 ? 'improving' : 'degrading';
        };

        const physicsTrend = analyzeTrend(m => m.physicsPerformance.processingTime);
        const particlesTrend = analyzeTrend(m => m.particlesPerformance.processingTime);
        const audioTrend = analyzeTrend(m => m.audioPerformance.processingTime);
        const overallTrend = analyzeTrend(m => m.totalPerformance.processingTime);

        const recommendations: string[] = [];
        
        if (physicsTrend === 'degrading') recommendations.push('Consider switching physics to Rust for better performance');
        if (particlesTrend === 'degrading') recommendations.push('Particle system may need optimization or system switch');
        if (audioTrend === 'degrading') recommendations.push('Audio latency increasing, check system configuration');
        if (overallTrend === 'degrading') recommendations.push('Overall performance degrading, consider optimization preset');
        
        const currentMetrics = this.getMetrics();
        if (currentMetrics.switchCount > 10) recommendations.push('High system switching detected, consider adjusting thresholds');
        if (currentMetrics.rustUsage < 30) recommendations.push('Low Rust usage, consider enabling preferRust option');

        return {
            physicsTrend,
            particlesTrend,
            audioTrend,
            overallTrend,
            recommendations,
        };
    }

    // System health check
    performHealthCheck(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        suggestions: string[];
    } {
        const metrics = this.getMetrics();
        const issues: string[] = [];
        const suggestions: string[] = [];

        // Check CPU usage
        if (metrics.totalPerformance.cpuUsage > 90) {
            issues.push('High CPU usage detected');
            suggestions.push('Consider optimizing for performance or reducing quality');
        } else if (metrics.totalPerformance.cpuUsage > 75) {
            issues.push('Elevated CPU usage');
            suggestions.push('Monitor performance trends');
        }

        // Check memory usage
        if (metrics.totalPerformance.memoryUsage > 8192) {
            issues.push('High memory usage detected');
            suggestions.push('Consider optimizing for memory or reducing particle count');
        }

        // Check latency
        if (metrics.totalPerformance.latency > 20) {
            issues.push('High latency detected');
            suggestions.push('Consider optimizing for latency or switching systems');
        }

        // Check system switching
        if (metrics.switchCount > 20) {
            issues.push('Excessive system switching');
            suggestions.push('Adjust performance thresholds or disable auto-switching');
        }

        // Check Rust vs TypeScript balance
        if (metrics.rustUsage < 20 && this.getConfig().preferRust) {
            issues.push('Low Rust usage despite preference');
            suggestions.push('Check system configurations or thresholds');
        }

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (issues.length > 0) {
            status = issues.length > 2 ? 'critical' : 'warning';
        }

        return { status, issues, suggestions };
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Hybrid Engine not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

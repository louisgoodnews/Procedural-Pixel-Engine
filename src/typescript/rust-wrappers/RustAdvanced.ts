import init, { AdvancedRustEngineExport, create_advanced_config } from '../../../pkg/procedural_pixel_engine_core.js';

export interface SimdConfig {
    enableSimd: boolean;
    vectorSize: number;
    alignment: number;
    optimizationLevel: number;
}

export interface GpuConfig {
    enableGpu: boolean;
    computeShader: boolean;
    parallelThreads: number;
    memoryBandwidth: number;
    maxTextureSize: number;
}

export interface EdgeConfig {
    enableEdge: boolean;
    latencyOptimization: boolean;
    bandwidthOptimization: boolean;
    cacheStrategy: number;
    compressionLevel: number;
}

export interface AdvancedConfig {
    simd: SimdConfig;
    gpu: GpuConfig;
    edge: EdgeConfig;
    enableAiOptimization: boolean;
    enableAdaptiveTuning: boolean;
    enablePrediction: boolean;
}

export interface PerformanceMetrics {
    simdSpeedup: number;
    gpuUtilization: number;
    edgeLatency: number;
    aiOptimizationGain: number;
    adaptiveTuningEfficiency: number;
    predictionAccuracy: number;
}

export interface OptimizationResult {
    technique: string;
    performanceGain: number;
    memorySavings: number;
    latencyReduction: number;
    successRate: number;
}

export class RustAdvanced {
    private wasmModule: AdvancedRustEngineExport | null = null;
    private initialized = false;

    async initialize(config: AdvancedConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new AdvancedRustEngineExport(config);
            this.initialized = true;
            console.log('🚀 Advanced Rust Engine initialized');
        }
    }

    updateConfig(config: AdvancedConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): AdvancedConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            simd: {
                enableSimd: config.simd.enable_simd,
                vectorSize: config.simd.vector_size,
                alignment: config.simd.alignment,
                optimizationLevel: config.simd.optimization_level,
            },
            gpu: {
                enableGpu: config.gpu.enable_gpu,
                computeShader: config.gpu.compute_shader,
                parallelThreads: config.gpu.parallel_threads,
                memoryBandwidth: config.gpu.memory_bandwidth,
                maxTextureSize: config.gpu.max_texture_size,
            },
            edge: {
                enableEdge: config.edge.enable_edge,
                latencyOptimization: config.edge.latency_optimization,
                bandwidthOptimization: config.edge.bandwidth_optimization,
                cacheStrategy: config.edge.cache_strategy,
                compressionLevel: config.edge.compression_level,
            },
            enableAiOptimization: config.enable_ai_optimization,
            enableAdaptiveTuning: config.enable_adaptive_tuning,
            enablePrediction: config.enable_prediction,
        };
    }

    getMetrics(): PerformanceMetrics {
        this.ensureInitialized();
        const metrics = this.wasmModule!.get_metrics();
        return {
            simdSpeedup: metrics.simd_speedup,
            gpuUtilization: metrics.gpu_utilization,
            edgeLatency: metrics.edge_latency,
            aiOptimizationGain: metrics.ai_optimization_gain,
            adaptiveTuningEfficiency: metrics.adaptive_tuning_efficiency,
            predictionAccuracy: metrics.prediction_accuracy,
        };
    }

    optimizeAll(): OptimizationResult[] {
        this.ensureInitialized();
        const results = this.wasmModule!.optimize_all();
        return results.map((result: any) => ({
            technique: result.technique,
            performanceGain: result.performance_gain,
            memorySavings: result.memory_savings,
            latencyReduction: result.latency_reduction,
            successRate: result.success_rate,
        }));
    }

    analyzePerformance(): string {
        this.ensureInitialized();
        return this.wasmModule!.analyze_performance();
    }

    predictSystemPerformance(workload: number): number {
        this.ensureInitialized();
        return this.wasmModule!.predict_system_performance(workload);
    }

    getOptimizationHistory(): OptimizationResult[] {
        this.ensureInitialized();
        const history = this.wasmModule!.get_optimization_history();
        return history.map((result: any) => ({
            technique: result.technique,
            performanceGain: result.performance_gain,
            memorySavings: result.memory_savings,
            latencyReduction: result.latency_reduction,
            successRate: result.success_rate,
        }));
    }

    clearOptimizationHistory(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_optimization_history();
    }

    // Utility methods for creating configurations
    static createAdvancedConfig(config: Partial<AdvancedConfig>): AdvancedConfig {
        return {
            simd: {
                enableSimd: config.simd?.enableSimd !== undefined ? config.simd.enableSimd : true,
                vectorSize: config.simd?.vectorSize || 128,
                alignment: config.simd?.alignment || 16,
                optimizationLevel: config.simd?.optimizationLevel || 2,
            },
            gpu: {
                enableGpu: config.gpu?.enableGpu !== undefined ? config.gpu.enableGpu : true,
                computeShader: config.gpu?.computeShader !== undefined ? config.gpu.computeShader : true,
                parallelThreads: config.gpu?.parallelThreads || 4,
                memoryBandwidth: config.gpu?.memoryBandwidth || 1000.0,
                maxTextureSize: config.gpu?.maxTextureSize || 4096,
            },
            edge: {
                enableEdge: config.edge?.enableEdge !== undefined ? config.edge.enableEdge : true,
                latencyOptimization: config.edge?.latencyOptimization !== undefined ? config.edge.latencyOptimization : true,
                bandwidthOptimization: config.edge?.bandwidthOptimization !== undefined ? config.edge.bandwidthOptimization : true,
                cacheStrategy: config.edge?.cacheStrategy || 1,
                compressionLevel: config.edge?.compressionLevel || 2,
            },
            enableAiOptimization: config.enableAiOptimization !== undefined ? config.enableAiOptimization : true,
            enableAdaptiveTuning: config.enableAdaptiveTuning !== undefined ? config.enableAdaptiveTuning : true,
            enablePrediction: config.enablePrediction !== undefined ? config.enablePrediction : true,
        };
    }

    // Configuration presets
    static createHighPerformanceConfig(): AdvancedConfig {
        return RustAdvanced.createAdvancedConfig({
            simd: {
                enableSimd: true,
                vectorSize: 256,
                alignment: 32,
                optimizationLevel: 3,
            },
            gpu: {
                enableGpu: true,
                computeShader: true,
                parallelThreads: 8,
                memoryBandwidth: 2000.0,
                maxTextureSize: 8192,
            },
            edge: {
                enableEdge: true,
                latencyOptimization: true,
                bandwidthOptimization: true,
                cacheStrategy: 2,
                compressionLevel: 3,
            },
            enableAiOptimization: true,
            enableAdaptiveTuning: true,
            enablePrediction: true,
        });
    }

    static createBalancedConfig(): AdvancedConfig {
        return RustAdvanced.createAdvancedConfig({
            simd: {
                enableSimd: true,
                vectorSize: 128,
                alignment: 16,
                optimizationLevel: 2,
            },
            gpu: {
                enableGpu: true,
                computeShader: true,
                parallelThreads: 4,
                memoryBandwidth: 1000.0,
                maxTextureSize: 4096,
            },
            edge: {
                enableEdge: true,
                latencyOptimization: true,
                bandwidthOptimization: false,
                cacheStrategy: 1,
                compressionLevel: 1,
            },
            enableAiOptimization: true,
            enableAdaptiveTuning: true,
            enablePrediction: false,
        });
    }

    static createLowPowerConfig(): AdvancedConfig {
        return RustAdvanced.createAdvancedConfig({
            simd: {
                enableSimd: false,
                vectorSize: 64,
                alignment: 8,
                optimizationLevel: 1,
            },
            gpu: {
                enableGpu: false,
                computeShader: false,
                parallelThreads: 2,
                memoryBandwidth: 500.0,
                maxTextureSize: 2048,
            },
            edge: {
                enableEdge: true,
                latencyOptimization: false,
                bandwidthOptimization: true,
                cacheStrategy: 0,
                compressionLevel: 2,
            },
            enableAiOptimization: false,
            enableAdaptiveTuning: false,
            enablePrediction: false,
        });
    }

    static createEdgeOptimizedConfig(): AdvancedConfig {
        return RustAdvanced.createAdvancedConfig({
            simd: {
                enableSimd: true,
                vectorSize: 128,
                alignment: 16,
                optimizationLevel: 2,
            },
            gpu: {
                enableGpu: false,
                computeShader: false,
                parallelThreads: 2,
                memoryBandwidth: 800.0,
                maxTextureSize: 2048,
            },
            edge: {
                enableEdge: true,
                latencyOptimization: true,
                bandwidthOptimization: true,
                cacheStrategy: 2,
                compressionLevel: 3,
            },
            enableAiOptimization: false,
            enableAdaptiveTuning: true,
            enablePrediction: true,
        });
    }

    // Performance analysis methods
    analyzeOptimizationResults(results: OptimizationResult[]): {
        summary: {
            totalTechniques: number;
            averagePerformanceGain: number;
            averageMemorySavings: number;
            averageLatencyReduction: number;
            averageSuccessRate: number;
        };
        bestPerformers: OptimizationResult[];
        recommendations: string[];
    } {
        if (results.length === 0) {
            return {
                summary: {
                    totalTechniques: 0,
                    averagePerformanceGain: 0,
                    averageMemorySavings: 0,
                    averageLatencyReduction: 0,
                    averageSuccessRate: 0,
                },
                bestPerformers: [],
                recommendations: [],
            };
        }

        const summary = {
            totalTechniques: results.length,
            averagePerformanceGain: results.reduce((sum, r) => sum + r.performanceGain, 0) / results.length,
            averageMemorySavings: results.reduce((sum, r) => sum + r.memorySavings, 0) / results.length,
            averageLatencyReduction: results.reduce((sum, r) => sum + r.latencyReduction, 0) / results.length,
            averageSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
        };

        const bestPerformers = results
            .sort((a, b) => b.performanceGain - a.performanceGain)
            .slice(0, 3);

        const recommendations: string[] = [];
        
        if (summary.averagePerformanceGain < 20) {
            recommendations.push('Consider enabling more optimization techniques for better performance');
        }
        
        if (summary.averageMemorySavings < 15) {
            recommendations.push('Memory optimization could be improved with better algorithms');
        }
        
        if (summary.averageLatencyReduction < 25) {
            recommendations.push('Latency optimization should be prioritized for better responsiveness');
        }
        
        if (summary.averageSuccessRate < 90) {
            recommendations.push('Some optimization techniques have low success rates, review implementation');
        }

        return {
            summary,
            bestPerformers,
            recommendations,
        };
    }

    // Performance prediction methods
    predictOptimizationImpact(workload: number, enabledTechniques: string[]): {
        estimatedPerformanceGain: number;
        estimatedMemorySavings: number;
        estimatedLatencyReduction: number;
        confidence: number;
    } {
        const basePerformance = workload;
        let estimatedGain = 0;
        let estimatedMemorySavings = 0;
        let estimatedLatencyReduction = 0;
        let confidence = 0.8;

        // Estimate impact based on enabled techniques
        if (enabledTechniques.includes('SIMD Vectorization')) {
            estimatedGain += 25;
            estimatedMemorySavings += 5;
            estimatedLatencyReduction += 10;
            confidence += 0.05;
        }

        if (enabledTechniques.includes('GPU Computing')) {
            estimatedGain += 40;
            estimatedMemorySavings += 20;
            estimatedLatencyReduction += 25;
            confidence += 0.1;
        }

        if (enabledTechniques.includes('Edge Computing')) {
            estimatedGain += 15;
            estimatedMemorySavings += 30;
            estimatedLatencyReduction += 40;
            confidence += 0.05;
        }

        if (enabledTechniques.includes('AI Optimization')) {
            estimatedGain += 25;
            estimatedMemorySavings += 15;
            estimatedLatencyReduction += 20;
            confidence += 0.05;
        }

        if (enabledTechniques.includes('Adaptive Tuning')) {
            estimatedGain += 20;
            estimatedMemorySavings += 10;
            estimatedLatencyReduction += 15;
            confidence += 0.05;
        }

        // Cap confidence at 95%
        confidence = Math.min(confidence, 0.95);

        return {
            estimatedPerformanceGain: estimatedGain,
            estimatedMemorySavings: estimatedMemorySavings,
            estimatedLatencyReduction: estimatedLatencyReduction,
            confidence: confidence * 100,
        };
    }

    // Optimization execution methods
    async runComprehensiveOptimization(): Promise<OptimizationResult[]> {
        const config = RustAdvanced.createHighPerformanceConfig();
        await this.initialize(config);
        return this.optimizeAll();
    }

    async runBalancedOptimization(): Promise<OptimizationResult[]> {
        const config = RustAdvanced.createBalancedConfig();
        await this.initialize(config);
        return this.optimizeAll();
    }

    async runLowPowerOptimization(): Promise<OptimizationResult[]> {
        const config = RustAdvanced.createLowPowerConfig();
        await this.initialize(config);
        return this.optimizeAll();
    }

    async runEdgeOptimization(): Promise<OptimizationResult[]> {
        const config = RustAdvanced.createEdgeOptimizedConfig();
        await this.initialize(config);
        return this.optimizeAll();
    }

    // Performance monitoring methods
    startPerformanceMonitoring(): () => PerformanceMetrics {
        const initialMetrics = this.getMetrics();
        
        return () => {
            const currentMetrics = this.getMetrics();
            return currentMetrics;
        };
    }

    generatePerformanceReport(): string {
        const metrics = this.getMetrics();
        const history = this.getOptimizationHistory();
        const analysis = this.analyzeOptimizationResults(history);
        
        let report = `🚀 Advanced Rust Performance Report
Generated: ${new Date().toISOString()}

📊 Current Metrics:
- SIMD Speedup: ${metrics.simdSpeedup.toFixed(2)}x
- GPU Utilization: ${(metrics.gpuUtilization * 100).toFixed(1)}%
- Edge Latency Reduction: ${(metrics.edgeLatency * 100).toFixed(1)}%
- AI Optimization Gain: ${(metrics.aiOptimizationGain * 100).toFixed(1)}%
- Adaptive Tuning Efficiency: ${(metrics.adaptiveTuningEfficiency * 100).toFixed(1)}%
- Prediction Accuracy: ${metrics.predictionAccuracy.toFixed(1)}%

🔧 Optimization History:
${history.map((result, i) => `${i + 1}. ${result.technique}: ${result.performanceGain.toFixed(1)}% gain`).join('\n')}

📈 Analysis Summary:
- Total Techniques: ${analysis.summary.totalTechniques}
- Average Performance Gain: ${analysis.summary.averagePerformanceGain.toFixed(1)}%
- Average Memory Savings: ${analysis.summary.averageMemorySavings.toFixed(1)}%
- Average Latency Reduction: ${analysis.summary.averageLatencyReduction.toFixed(1)}%
- Average Success Rate: ${analysis.summary.averageSuccessRate.toFixed(1)}%

🏆 Best Performers:
${analysis.bestPerformers.map((result, i) => `${i + 1}. ${result.technique}: ${result.performanceGain.toFixed(1)}%`).join('\n')}

💡 Recommendations:
${analysis.recommendations.map(rec => `- ${rec}`).join('\n') || 'No recommendations at this time'}
`;

        return report;
    }

    exportOptimizationData(format: 'json' | 'csv' = 'json'): string {
        const history = this.getOptimizationHistory();
        const metrics = this.getMetrics();
        
        const data = {
            timestamp: new Date().toISOString(),
            metrics,
            optimizationHistory: history,
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            const headers = ['Technique', 'Performance Gain', 'Memory Savings', 'Latency Reduction', 'Success Rate'];
            const rows = history.map(result => [
                result.technique,
                result.performanceGain.toString(),
                result.memorySavings.toString(),
                result.latencyReduction.toString(),
                result.successRate.toString(),
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        
        return JSON.stringify(data, null, 2);
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Advanced Rust Engine not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

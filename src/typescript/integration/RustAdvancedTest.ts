import { RustAdvanced, AdvancedConfig, PerformanceMetrics, OptimizationResult } from '../rust-wrappers/RustAdvanced';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustAdvancedTest {
    private rustAdvanced: RustAdvanced;
    private results: TestResult[] = [];

    constructor() {
        this.rustAdvanced = new RustAdvanced();
    }

    async runAllTests(): Promise<void> {
        console.log('🚀 Starting Advanced Rust Features Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testSimdOperations();
            await this.testGpuComputing();
            await this.testEdgeComputing();
            await this.testAiOptimization();
            await this.testAdaptiveTuning();
            await this.testPerformancePrediction();
            await this.testComprehensiveOptimization();
            await this.testConfigurationPresets();
            await this.testPerformanceAnalysis();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Advanced Rust test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Advanced Rust Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Advanced Rust Initialization';
        const start = performance.now();
        
        try {
            const config = RustAdvanced.createHighPerformanceConfig();
            await this.rustAdvanced.initialize(config);
            
            if (!this.rustAdvanced.isInitialized()) {
                throw new Error('Advanced Rust not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.rustAdvanced.getConfig();
            if (!retrievedConfig.simd.enableSimd || !retrievedConfig.gpu.enableGpu) {
                throw new Error('Config not set correctly');
            }
            
            // Test metrics retrieval
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.simdSpeedup === undefined || metrics.gpuUtilization === undefined) {
                throw new Error('Metrics not available');
            }
            
            this.addResult(testName, 'pass', 'Advanced Rust initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSimdOperations(): Promise<void> {
        const testName = 'SIMD Operations';
        const start = performance.now();
        
        try {
            // Enable SIMD only
            const config = RustAdvanced.createAdvancedConfig({
                simd: {
                    enableSimd: true,
                    vectorSize: 128,
                    alignment: 16,
                    optimizationLevel: 2,
                },
                gpu: {
                    enableGpu: false,
                    computeShader: false,
                    parallelThreads: 1,
                    memoryBandwidth: 100,
                    maxTextureSize: 1024,
                },
                edge: {
                    enableEdge: false,
                    latencyOptimization: false,
                    bandwidthOptimization: false,
                    cacheStrategy: 0,
                    compressionLevel: 0,
                },
                enableAiOptimization: false,
                enableAdaptiveTuning: false,
                enablePrediction: false,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Run optimization
            const results = this.rustAdvanced.optimizeAll();
            
            // Check if SIMD optimization was applied
            const simdResult = results.find(r => r.technique.includes('SIMD'));
            if (!simdResult) {
                throw new Error('SIMD optimization not found in results');
            }
            
            if (simdResult.performanceGain <= 0) {
                throw new Error('SIMD optimization should provide performance gain');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.simdSpeedup <= 1.0) {
                throw new Error('SIMD speedup should be greater than 1.0');
            }
            
            this.addResult(testName, 'pass', 'SIMD operations work correctly', performance.now() - start, {
                simdSpeedup: metrics.simdSpeedup,
                performanceGain: simdResult.performanceGain,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `SIMD operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testGpuComputing(): Promise<void> {
        const testName = 'GPU Computing';
        const start = performance.now();
        
        try {
            // Enable GPU only
            const config = RustAdvanced.createAdvancedConfig({
                simd: {
                    enableSimd: false,
                    vectorSize: 64,
                    alignment: 8,
                    optimizationLevel: 1,
                },
                gpu: {
                    enableGpu: true,
                    computeShader: true,
                    parallelThreads: 4,
                    memoryBandwidth: 1000,
                    maxTextureSize: 4096,
                },
                edge: {
                    enableEdge: false,
                    latencyOptimization: false,
                    bandwidthOptimization: false,
                    cacheStrategy: 0,
                    compressionLevel: 0,
                },
                enableAiOptimization: false,
                enableAdaptiveTuning: false,
                enablePrediction: false,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Run optimization
            const results = this.rustAdvanced.optimizeAll();
            
            // Check if GPU optimization was applied
            const gpuResult = results.find(r => r.technique.includes('GPU'));
            if (!gpuResult) {
                throw new Error('GPU optimization not found in results');
            }
            
            if (gpuResult.performanceGain <= 0) {
                throw new Error('GPU optimization should provide performance gain');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.gpuUtilization <= 0) {
                throw new Error('GPU utilization should be greater than 0');
            }
            
            this.addResult(testName, 'pass', 'GPU computing works correctly', performance.now() - start, {
                gpuUtilization: metrics.gpuUtilization,
                performanceGain: gpuResult.performanceGain,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `GPU computing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEdgeComputing(): Promise<void> {
        const testName = 'Edge Computing';
        const start = performance.now();
        
        try {
            // Enable Edge only
            const config = RustAdvanced.createAdvancedConfig({
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
                    memoryBandwidth: 500,
                    maxTextureSize: 2048,
                },
                edge: {
                    enableEdge: true,
                    latencyOptimization: true,
                    bandwidthOptimization: true,
                    cacheStrategy: 1,
                    compressionLevel: 2,
                },
                enableAiOptimization: false,
                enableAdaptiveTuning: false,
                enablePrediction: false,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Run optimization
            const results = this.rustAdvanced.optimizeAll();
            
            // Check if Edge optimization was applied
            const edgeResult = results.find(r => r.technique.includes('Edge'));
            if (!edgeResult) {
                throw new Error('Edge optimization not found in results');
            }
            
            if (edgeResult.latencyReduction <= 0) {
                throw new Error('Edge optimization should reduce latency');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.edgeLatency <= 0) {
                throw new Error('Edge latency reduction should be greater than 0');
            }
            
            this.addResult(testName, 'pass', 'Edge computing works correctly', performance.now() - start, {
                edgeLatency: metrics.edgeLatency,
                latencyReduction: edgeResult.latencyReduction,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Edge computing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAiOptimization(): Promise<void> {
        const testName = 'AI Optimization';
        const start = performance.now();
        
        try {
            // Enable AI optimization
            const config = RustAdvanced.createAdvancedConfig({
                simd: {
                    enableSimd: false,
                    vectorSize: 64,
                    alignment: 8,
                    optimizationLevel: 1,
                },
                gpu: {
                    enableGpu: false,
                    computeShader: false,
                    parallelThreads: 1,
                    memoryBandwidth: 100,
                    maxTextureSize: 1024,
                },
                edge: {
                    enableEdge: false,
                    latencyOptimization: false,
                    bandwidthOptimization: false,
                    cacheStrategy: 0,
                    compressionLevel: 0,
                },
                enableAiOptimization: true,
                enableAdaptiveTuning: false,
                enablePrediction: false,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Run optimization
            const results = this.rustAdvanced.optimizeAll();
            
            // Check if AI optimization was applied
            const aiResult = results.find(r => r.technique.includes('AI'));
            if (!aiResult) {
                throw new Error('AI optimization not found in results');
            }
            
            if (aiResult.performanceGain <= 0) {
                throw new Error('AI optimization should provide performance gain');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.aiOptimizationGain <= 1.0) {
                throw new Error('AI optimization gain should be greater than 1.0');
            }
            
            this.addResult(testName, 'pass', 'AI optimization works correctly', performance.now() - start, {
                aiOptimizationGain: metrics.aiOptimizationGain,
                performanceGain: aiResult.performanceGain,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `AI optimization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAdaptiveTuning(): Promise<void> {
        const testName = 'Adaptive Tuning';
        const start = performance.now();
        
        try {
            // Enable adaptive tuning
            const config = RustAdvanced.createAdvancedConfig({
                simd: {
                    enableSimd: false,
                    vectorSize: 64,
                    alignment: 8,
                    optimizationLevel: 1,
                },
                gpu: {
                    enableGpu: false,
                    computeShader: false,
                    parallelThreads: 1,
                    memoryBandwidth: 100,
                    maxTextureSize: 1024,
                },
                edge: {
                    enableEdge: false,
                    latencyOptimization: false,
                    bandwidthOptimization: false,
                    cacheStrategy: 0,
                    compressionLevel: 0,
                },
                enableAiOptimization: false,
                enableAdaptiveTuning: true,
                enablePrediction: false,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Run optimization
            const results = this.rustAdvanced.optimizeAll();
            
            // Check if adaptive tuning was applied
            const adaptiveResult = results.find(r => r.technique.includes('Adaptive'));
            if (!adaptiveResult) {
                throw new Error('Adaptive tuning not found in results');
            }
            
            if (adaptiveResult.performanceGain <= 0) {
                throw new Error('Adaptive tuning should provide performance gain');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.adaptiveTuningEfficiency <= 0) {
                throw new Error('Adaptive tuning efficiency should be greater than 0');
            }
            
            this.addResult(testName, 'pass', 'Adaptive tuning works correctly', performance.now() - start, {
                adaptiveTuningEfficiency: metrics.adaptiveTuningEfficiency,
                performanceGain: adaptiveResult.performanceGain,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Adaptive tuning failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformancePrediction(): Promise<void> {
        const testName = 'Performance Prediction';
        const start = performance.now();
        
        try {
            // Enable prediction
            const config = RustAdvanced.createAdvancedConfig({
                simd: {
                    enableSimd: false,
                    vectorSize: 64,
                    alignment: 8,
                    optimizationLevel: 1,
                },
                gpu: {
                    enableGpu: false,
                    computeShader: false,
                    parallelThreads: 1,
                    memoryBandwidth: 100,
                    maxTextureSize: 1024,
                },
                edge: {
                    enableEdge: false,
                    latencyOptimization: false,
                    bandwidthOptimization: false,
                    cacheStrategy: 0,
                    compressionLevel: 0,
                },
                enableAiOptimization: false,
                enableAdaptiveTuning: false,
                enablePrediction: true,
            });
            
            await this.rustAdvanced.initialize(config);
            
            // Test performance prediction
            const workload = 1000.0;
            const predictedPerformance = this.rustAdvanced.predictSystemPerformance(workload);
            
            if (predictedPerformance <= workload) {
                throw new Error('Predicted performance should be better than baseline');
            }
            
            // Check metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.predictionAccuracy <= 0) {
                throw new Error('Prediction accuracy should be greater than 0');
            }
            
            // Test optimization impact prediction
            const enabledTechniques = ['SIMD Vectorization', 'GPU Computing'];
            const impact = this.rustAdvanced.predictOptimizationImpact(workload, enabledTechniques);
            
            if (impact.estimatedPerformanceGain <= 0) {
                throw new Error('Estimated performance gain should be greater than 0');
            }
            
            if (impact.confidence <= 0) {
                throw new Error('Confidence should be greater than 0');
            }
            
            this.addResult(testName, 'pass', 'Performance prediction works correctly', performance.now() - start, {
                predictionAccuracy: metrics.predictionAccuracy,
                predictedPerformance,
                estimatedGain: impact.estimatedPerformanceGain,
                confidence: impact.confidence,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance prediction failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testComprehensiveOptimization(): Promise<void> {
        const testName = 'Comprehensive Optimization';
        const start = performance.now();
        
        try {
            // Use high performance configuration
            const config = RustAdvanced.createHighPerformanceConfig();
            await this.rustAdvanced.initialize(config);
            
            // Run comprehensive optimization
            const results = this.rustAdvanced.optimizeAll();
            
            if (results.length === 0) {
                throw new Error('No optimization results returned');
            }
            
            // Check if all expected optimizations are present
            const expectedTechniques = ['SIMD', 'GPU', 'Edge', 'AI', 'Adaptive'];
            const foundTechniques = results.map(r => r.technique);
            
            for (const expected of expectedTechniques) {
                if (!foundTechniques.some(technique => technique.includes(expected))) {
                    throw new Error(`Expected optimization technique "${expected}" not found`);
                }
            }
            
            // Check optimization results
            for (const result of results) {
                if (result.performanceGain <= 0) {
                    console.warn(`Optimization technique "${result.technique}" has no performance gain`);
                }
                
                if (result.successRate <= 0) {
                    throw new Error(`Optimization technique "${result.technique}" has zero success rate`);
                }
            }
            
            // Check overall metrics
            const metrics = this.rustAdvanced.getMetrics();
            if (metrics.simdSpeedup <= 1.0 || metrics.gpuUtilization <= 0) {
                console.warn('Some performance metrics may not be optimal');
            }
            
            this.addResult(testName, 'pass', 'Comprehensive optimization works correctly', performance.now() - start, {
                techniqueCount: results.length,
                totalGain: results.reduce((sum, r) => sum + r.performanceGain, 0),
                averageSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Comprehensive optimization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test high performance preset
            const highPerfConfig = RustAdvanced.createHighPerformanceConfig();
            await this.rustAdvanced.initialize(highPerfConfig);
            
            const highPerfResults = this.rustAdvanced.optimizeAll();
            if (highPerfResults.length < 3) {
                throw new Error('High performance preset should enable multiple optimizations');
            }
            
            // Test balanced preset
            const balancedConfig = RustAdvanced.createBalancedConfig();
            await this.rustAdvanced.initialize(balancedConfig);
            
            const balancedResults = this.rustAdvanced.optimizeAll();
            if (balancedResults.length < 2) {
                throw new Error('Balanced preset should enable some optimizations');
            }
            
            // Test low power preset
            const lowPowerConfig = RustAdvanced.createLowPowerConfig();
            await this.rustAdvanced.initialize(lowPowerConfig);
            
            const lowPowerResults = this.rustAdvanced.optimizeAll();
            // Low power should have fewer optimizations
            if (lowPowerResults.length > balancedResults.length) {
                console.warn('Low power preset may have too many optimizations enabled');
            }
            
            // Test edge optimized preset
            const edgeConfig = RustAdvanced.createEdgeOptimizedConfig();
            await this.rustAdvanced.initialize(edgeConfig);
            
            const edgeResults = this.rustAdvanced.optimizeAll();
            const edgeOptimization = edgeResults.find(r => r.technique.includes('Edge'));
            if (!edgeOptimization) {
                throw new Error('Edge optimized preset should include edge optimization');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                highPerfTechniques: highPerfResults.length,
                balancedTechniques: balancedResults.length,
                lowPowerTechniques: lowPowerResults.length,
                edgeTechniques: edgeResults.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceAnalysis(): Promise<void> {
        const testName = 'Performance Analysis';
        const start = performance.now();
        
        try {
            // Run optimization to get data
            await this.rustAdvanced.initialize(RustAdvanced.createHighPerformanceConfig());
            const results = this.rustAdvanced.optimizeAll();
            
            // Test optimization results analysis
            const analysis = this.rustAdvanced.analyzeOptimizationResults(results);
            
            if (!analysis.summary || !analysis.bestPerformers || !analysis.recommendations) {
                throw new Error('Analysis structure invalid');
            }
            
            // Check summary calculations
            if (analysis.summary.totalTechniques !== results.length) {
                throw new Error('Total techniques count incorrect');
            }
            
            const expectedAvgGain = results.reduce((sum, r) => sum + r.performanceGain, 0) / results.length;
            if (Math.abs(analysis.summary.averagePerformanceGain - expectedAvgGain) > 0.1) {
                throw new Error('Average performance gain calculation incorrect');
            }
            
            // Check best performers sorting
            if (analysis.bestPerformers.length > 1) {
                for (let i = 0; i < analysis.bestPerformers.length - 1; i++) {
                    if (analysis.bestPerformers[i].performanceGain < analysis.bestPerformers[i + 1].performanceGain) {
                        throw new Error('Best performers not sorted correctly');
                    }
                }
            }
            
            // Test performance report generation
            const report = this.rustAdvanced.generatePerformanceReport();
            if (!report || report.length === 0) {
                throw new Error('Performance report generation failed');
            }
            
            // Test export functionality
            const jsonExport = this.rustAdvanced.exportOptimizationData('json');
            const csvExport = this.rustAdvanced.exportOptimizationData('csv');
            
            if (!jsonExport || !csvExport) {
                throw new Error('Export functionality failed');
            }
            
            // Parse JSON export to verify structure
            const parsedExport = JSON.parse(jsonExport);
            if (!parsedExport.metrics || !parsedExport.optimizationHistory) {
                throw new Error('JSON export structure invalid');
            }
            
            this.addResult(testName, 'pass', 'Performance analysis works correctly', performance.now() - start, {
                totalTechniques: analysis.summary.totalTechniques,
                averageGain: analysis.summary.averagePerformanceGain,
                bestPerformer: analysis.bestPerformers[0]?.technique,
                recommendationsCount: analysis.recommendations.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🚀 Advanced Rust Test Report');
        console.log('==============================');
        
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const skipped = this.results.filter(r => r.status === 'skip').length;
        const total = this.results.length;
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
        
        if (failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => r.status === 'fail').forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
        }
        
        // Performance summary
        const simdTest = this.results.find(r => r.name === 'SIMD Operations');
        const gpuTest = this.results.find(r => r.name === 'GPU Computing');
        const edgeTest = this.results.find(r => r.name === 'Edge Computing');
        
        if (simdTest?.details || gpuTest?.details || edgeTest?.details) {
            console.log(`\n🚀 Performance Summary:`);
            if (simdTest?.details) {
                console.log(`   SIMD Speedup: ${simdTest.details.simdSpeedup.toFixed(2)}x`);
            }
            if (gpuTest?.details) {
                console.log(`   GPU Utilization: ${(gpuTest.details.gpuUtilization * 100).toFixed(1)}%`);
            }
            if (edgeTest?.details) {
                console.log(`   Edge Latency Reduction: ${(edgeTest.details.edgeLatency * 100).toFixed(1)}%`);
            }
        }
        
        // Save detailed results
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total,
                passed,
                failed,
                skipped,
                successRate: (passed / total) * 100,
                totalDuration,
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency,
            },
        };
        
        console.log('\n📄 Detailed test report:', JSON.stringify(report, null, 2));
    }

    getResults(): TestResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}

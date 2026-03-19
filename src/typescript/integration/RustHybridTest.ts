import { RustHybrid, HybridConfig, SystemType } from '../rust-wrappers/RustHybrid';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustHybridTest {
    private rustHybrid: RustHybrid;
    private results: TestResult[] = [];

    constructor() {
        this.rustHybrid = new RustHybrid();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Hybrid Engine Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testBasicOperations();
            await this.testSystemSwitching();
            await this.testPerformanceOptimization();
            await this.testAdaptiveQuality();
            await this.testPerformanceBenchmarking();
            await this.testSystemStates();
            await this.testPerformanceAnalysis();
            await this.testHealthCheck();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Hybrid test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Hybrid Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Hybrid Initialization';
        const start = performance.now();
        
        try {
            const config = RustHybrid.createHybridConfig({
                autoSwitching: true,
                performanceThreshold: 0.8,
                memoryThreshold: 4096,
                latencyThreshold: 16.0,
                adaptiveQuality: true,
                preferRust: true,
                fallbackEnabled: true,
            });
            
            await this.rustHybrid.initialize(config);
            
            if (!this.rustHybrid.isInitialized()) {
                throw new Error('Rust Hybrid not initialized after initialize() call');
            }
            
            // Test Rust systems initialization
            this.rustHybrid.initializeRustSystems();
            
            this.addResult(testName, 'pass', 'Rust Hybrid initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicOperations(): Promise<void> {
        const testName = 'Basic Hybrid Operations';
        const start = performance.now();
        
        try {
            // Test getting config
            const config = this.rustHybrid.getConfig();
            if (config.autoSwitching !== true) {
                throw new Error('Config not set correctly');
            }
            
            // Test updating config
            const newConfig = RustHybrid.createHybridConfig({
                performanceThreshold: 0.7,
                memoryThreshold: 8192,
            });
            
            this.rustHybrid.updateConfig(newConfig);
            const updatedConfig = this.rustHybrid.getConfig();
            
            if (updatedConfig.performanceThreshold !== 0.7) {
                throw new Error('Config update failed');
            }
            
            // Test getting metrics
            const metrics = this.rustHybrid.getMetrics();
            if (metrics.switchCount !== 0) {
                throw new Error('Metrics should start with 0 switches');
            }
            
            // Test system states
            const states = this.rustHybrid.getSystemStates();
            if (!states.physics || !states.particles || !states.audio) {
                throw new Error('System states not available');
            }
            
            // Test adaptive quality
            const quality = this.rustHybrid.getAdaptiveQuality();
            if (quality < 0.5 || quality > 2.0) {
                throw new Error('Adaptive quality out of range');
            }
            
            this.rustHybrid.setAdaptiveQuality(1.5);
            const newQuality = this.rustHybrid.getAdaptiveQuality();
            if (Math.abs(newQuality - 1.5) > 0.01) {
                throw new Error('Adaptive quality update failed');
            }
            
            this.addResult(testName, 'pass', 'Basic hybrid operations work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSystemSwitching(): Promise<void> {
        const testName = 'System Switching';
        const start = performance.now();
        
        try {
            // Test force system switching
            const originalStates = this.rustHybrid.getSystemStates();
            
            // Switch physics to TypeScript
            const physicsSwitched = this.rustHybrid.forceSystemSwitch('physics', SystemType.TypeScript);
            if (!physicsSwitched) {
                throw new Error('Failed to switch physics system');
            }
            
            // Switch particles to Rust
            const particlesSwitched = this.rustHybrid.forceSystemSwitch('particles', SystemType.Rust);
            if (!particlesSwitched) {
                throw new Error('Failed to switch particles system');
            }
            
            // Switch audio to Hybrid
            const audioSwitched = this.rustHybrid.forceSystemSwitch('audio', SystemType.Hybrid);
            if (!audioSwitched) {
                throw new Error('Failed to switch audio system');
            }
            
            // Verify switches
            const newStates = this.rustHybrid.getSystemStates();
            if (newStates.physics !== SystemType.TypeScript ||
                newStates.particles !== SystemType.Rust ||
                newStates.audio !== SystemType.Hybrid) {
                throw new Error('System switches not applied correctly');
            }
            
            // Test invalid system switch
            const invalidSwitch = this.rustHybrid.forceSystemSwitch('physics' as any, SystemType.Rust);
            if (invalidSwitch) {
                throw new Error('Invalid system switch should fail');
            }
            
            // Restore original states
            this.rustHybrid.forceSystemSwitch('physics', originalStates.physics);
            this.rustHybrid.forceSystemSwitch('particles', originalStates.particles);
            this.rustHybrid.forceSystemSwitch('audio', originalStates.audio);
            
            this.addResult(testName, 'pass', 'System switching works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `System switching failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceOptimization(): Promise<void> {
        const testName = 'Performance Optimization';
        const start = performance.now();
        
        try {
            const originalConfig = this.rustHybrid.getConfig();
            
            // Test performance optimization
            this.rustHybrid.optimizeForPerformance();
            const perfConfig = this.rustHybrid.getConfig();
            
            if (!perfConfig.preferRust || perfConfig.adaptiveQuality) {
                throw new Error('Performance optimization not applied correctly');
            }
            
            // Test memory optimization
            this.rustHybrid.optimizeForMemory();
            const memConfig = this.rustHybrid.getConfig();
            
            if (memConfig.preferRust || memConfig.memoryThreshold > 4096) {
                throw new Error('Memory optimization not applied correctly');
            }
            
            // Test latency optimization
            this.rustHybrid.optimizeForLatency();
            const latConfig = this.rustHybrid.getConfig();
            
            if (!latConfig.preferRust || latConfig.latencyThreshold > 10.0) {
                throw new Error('Latency optimization not applied correctly');
            }
            
            // Test presets
            this.rustHybrid.updateConfig(RustHybrid.createPerformancePreset());
            const perfPreset = this.rustHybrid.getConfig();
            if (perfPreset.performanceThreshold >= 0.8) {
                throw new Error('Performance preset not applied correctly');
            }
            
            this.rustHybrid.updateConfig(RustHybrid.createMemoryPreset());
            const memPreset = this.rustHybrid.getConfig();
            if (memPreset.preferRust) {
                throw new Error('Memory preset not applied correctly');
            }
            
            this.rustHybrid.updateConfig(RustHybrid.createLatencyPreset());
            const latPreset = this.rustHybrid.getConfig();
            if (latPreset.latencyThreshold >= 16.0) {
                throw new Error('Latency preset not applied correctly');
            }
            
            this.rustHybrid.updateConfig(RustHybrid.createBalancedPreset());
            const balPreset = this.rustHybrid.getConfig();
            if (balPreset.benchmarkInterval !== 2000.0) {
                throw new Error('Balanced preset not applied correctly');
            }
            
            // Restore original config
            this.rustHybrid.updateConfig(originalConfig);
            
            this.addResult(testName, 'pass', 'Performance optimization works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance optimization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAdaptiveQuality(): Promise<void> {
        const testName = 'Adaptive Quality';
        const start = performance.now();
        
        try {
            // Test adaptive quality adjustments
            this.rustHybrid.setAdaptiveQuality(0.5); // Minimum quality
            let quality = this.rustHybrid.getAdaptiveQuality();
            if (Math.abs(quality - 0.5) > 0.01) {
                throw new Error('Minimum quality not set correctly');
            }
            
            this.rustHybrid.setAdaptiveQuality(2.0); // Maximum quality
            quality = this.rustHybrid.getAdaptiveQuality();
            if (Math.abs(quality - 2.0) > 0.01) {
                throw new Error('Maximum quality not set correctly');
            }
            
            // Test quality bounds
            this.rustHybrid.setAdaptiveQuality(0.1); // Below minimum
            quality = this.rustHybrid.getAdaptiveQuality();
            if (quality < 0.5) {
                throw new Error('Quality should be clamped to minimum');
            }
            
            this.rustHybrid.setAdaptiveQuality(3.0); // Above maximum
            quality = this.rustHybrid.getAdaptiveQuality();
            if (quality > 2.0) {
                throw new Error('Quality should be clamped to maximum');
            }
            
            // Test quality with adaptive config
            const adaptiveConfig = RustHybrid.createHybridConfig({
                adaptiveQuality: true,
            });
            this.rustHybrid.updateConfig(adaptiveConfig);
            
            // Run benchmark to trigger quality adjustment
            this.rustHybrid.benchmarkSystems();
            
            this.addResult(testName, 'pass', 'Adaptive quality works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Adaptive quality failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceBenchmarking(): Promise<void> {
        const testName = 'Performance Benchmarking';
        const start = performance.now();
        
        try {
            // Test single benchmark
            const metrics = this.rustHybrid.benchmarkSystems();
            
            if (metrics.physicsPerformance.processingTime < 0) {
                throw new Error('Invalid physics benchmark time');
            }
            
            if (metrics.particlesPerformance.processingTime < 0) {
                throw new Error('Invalid particles benchmark time');
            }
            
            if (metrics.audioPerformance.processingTime < 0) {
                throw new Error('Invalid audio benchmark time');
            }
            
            if (metrics.totalPerformance.processingTime < 0) {
                throw new Error('Invalid total benchmark time');
            }
            
            // Test performance history
            this.rustHybrid.clearPerformanceHistory();
            let history = this.rustHybrid.getPerformanceHistory();
            if (history.length !== 0) {
                throw new Error('Performance history should be empty after clear');
            }
            
            // Run multiple benchmarks to build history
            for (let i = 0; i < 5; i++) {
                this.rustHybrid.benchmarkSystems();
            }
            
            history = this.rustHybrid.getPerformanceHistory();
            if (history.length !== 5) {
                throw new Error('Performance history should have 5 entries');
            }
            
            // Test hybrid performance benchmark
            const benchmarkResult = this.rustHybrid.benchmarkHybridPerformance(10);
            
            if (benchmarkResult.iterations !== 10) {
                throw new Error('Benchmark iterations incorrect');
            }
            
            if (benchmarkResult.totalTime <= 0) {
                throw new Error('Invalid benchmark total time');
            }
            
            if (benchmarkResult.avgTimePerIteration <= 0) {
                throw new Error('Invalid benchmark average time');
            }
            
            if (!benchmarkResult.finalMetrics || !benchmarkResult.systemStates) {
                throw new Error('Benchmark result missing data');
            }
            
            this.addResult(testName, 'pass', 'Performance benchmarking works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance benchmarking failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSystemStates(): Promise<void> {
        const testName = 'System States';
        const start = performance.now();
        
        try {
            // Test initial system states
            const states = this.rustHybrid.getSystemStates();
            
            if (states.physics === undefined || states.particles === undefined || states.audio === undefined) {
                throw new Error('System states not properly initialized');
            }
            
            // Test system state transitions
            const testCases = [
                { system: 'physics' as const, type: SystemType.Rust },
                { system: 'particles' as const, type: SystemType.TypeScript },
                { system: 'audio' as const, type: SystemType.Hybrid },
            ];
            
            for (const testCase of testCases) {
                const switched = this.rustHybrid.forceSystemSwitch(testCase.system, testCase.type);
                if (!switched) {
                    throw new Error(`Failed to switch ${testCase.system} to ${SystemType[testCase.type]}`);
                }
                
                const newStates = this.rustHybrid.getSystemStates();
                if (newStates[testCase.system] !== testCase.type) {
                    throw new Error(`${testCase.system} not switched to ${SystemType[testCase.type]}`);
                }
            }
            
            // Test system state consistency
            const finalStates = this.rustHybrid.getSystemStates();
            const metrics = this.rustHybrid.getMetrics();
            
            // Rust usage should reflect current system states
            const rustSystems = [
                finalStates.physics === SystemType.Rust,
                finalStates.particles === SystemType.Rust,
                finalStates.audio === SystemType.Rust,
            ].filter(Boolean).length;
            
            const expectedRustUsage = (rustSystems / 3) * 100;
            if (Math.abs(metrics.rustUsage - expectedRustUsage) > 1.0) {
                throw new Error('Rust usage does not match system states');
            }
            
            this.addResult(testName, 'pass', 'System states work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `System states failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceAnalysis(): Promise<void> {
        const testName = 'Performance Analysis';
        const start = performance.now();
        
        try {
            // Build performance history for analysis
            this.rustHybrid.clearPerformanceHistory();
            
            // Generate performance data with trends
            for (let i = 0; i < 10; i++) {
                this.rustHybrid.benchmarkSystems();
                // Small delay to simulate real-world usage
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Test performance trend analysis
            const analysis = this.rustHybrid.analyzePerformanceTrends();
            
            if (!analysis.physicsTrend || !analysis.particlesTrend || !analysis.audioTrend || !analysis.overallTrend) {
                throw new Error('Trend analysis incomplete');
            }
            
            if (!Array.isArray(analysis.recommendations)) {
                throw new Error('Recommendations not provided');
            }
            
            // Test trend detection
            const validTrends = ['improving', 'stable', 'degrading'];
            if (!validTrends.includes(analysis.physicsTrend) ||
                !validTrends.includes(analysis.particlesTrend) ||
                !validTrends.includes(analysis.audioTrend) ||
                !validTrends.includes(analysis.overallTrend)) {
                throw new Error('Invalid trend values detected');
            }
            
            // Test recommendations
            if (analysis.recommendations.length === 0 && analysis.overallTrend === 'degrading') {
                throw new Error('Recommendations should be provided for degrading performance');
            }
            
            this.addResult(testName, 'pass', 'Performance analysis works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testHealthCheck(): Promise<void> {
        const testName = 'Health Check';
        const start = performance.now();
        
        try {
            // Test health check with normal conditions
            const healthCheck = this.rustHybrid.performHealthCheck();
            
            if (!healthCheck.status || !Array.isArray(healthCheck.issues) || !Array.isArray(healthCheck.suggestions)) {
                throw new Error('Health check structure invalid');
            }
            
            const validStatuses = ['healthy', 'warning', 'critical'];
            if (!validStatuses.includes(healthCheck.status)) {
                throw new Error('Invalid health status');
            }
            
            // Test health check with poor conditions
            // Create a config that will trigger issues
            const poorConfig = RustHybrid.createHybridConfig({
                performanceThreshold: 0.3, // Very low threshold
                memoryThreshold: 1024, // Very low memory threshold
                latencyThreshold: 5.0, // Very low latency threshold
            });
            
            this.rustHybrid.updateConfig(poorConfig);
            
            // Force some system switches to trigger switch count issues
            for (let i = 0; i < 25; i++) {
                this.rustHybrid.forceSystemSwitch('physics', i % 2 === 0 ? SystemType.Rust : SystemType.TypeScript);
            }
            
            const poorHealthCheck = this.rustHybrid.performHealthCheck();
            
            // Should detect issues with the poor configuration
            if (poorHealthCheck.status === 'healthy') {
                console.warn('Health check should detect issues with poor configuration');
            }
            
            if (poorHealthCheck.issues.length === 0) {
                throw new Error('Health check should detect issues with poor configuration');
            }
            
            // Test suggestions are provided
            if (poorHealthCheck.suggestions.length === 0) {
                throw new Error('Health check should provide suggestions for issues');
            }
            
            this.addResult(testName, 'pass', 'Health check works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Health check failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n📊 Rust Hybrid Test Report');
        console.log('=============================');
        
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
        const benchmarkTest = this.results.find(r => r.name === 'Performance Benchmarking');
        if (benchmarkTest && benchmarkTest.details) {
            console.log(`\n🚀 Performance Summary:`);
            console.log(`   Physics: ${benchmarkTest.details.physicsPerformance.processingTime.toFixed(2)}ms`);
            console.log(`   Particles: ${benchmarkTest.details.particlesPerformance.processingTime.toFixed(2)}ms`);
            console.log(`   Audio: ${benchmarkTest.details.audioPerformance.processingTime.toFixed(2)}ms`);
            console.log(`   Total: ${benchmarkTest.details.totalPerformance.processingTime.toFixed(2)}ms`);
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

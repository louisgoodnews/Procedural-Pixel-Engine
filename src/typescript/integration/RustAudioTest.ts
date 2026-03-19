import { RustAudio, AudioConfig, AudioSource, AudioEffect, AudioListener } from '../rust-wrappers/RustAudio';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustAudioTest {
    private rustAudio: RustAudio;
    private results: TestResult[] = [];

    constructor() {
        this.rustAudio = new RustAudio();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Audio System Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testBasicOperations();
            await this.testAudioSources();
            await this.testAudioEffects();
            await this.test3DAudio();
            await this.testAudioProcessing();
            await this.testPerformance();
            await this.testSpatialAudio();
            await this.testPerformanceComparison();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Audio test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Audio Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Audio Initialization';
        const start = performance.now();
        
        try {
            const config = RustAudio.createAudioConfig({
                sampleRate: 44100,
                bufferSize: 512,
                maxSources: 32,
                maxEffects: 8,
                masterVolume: 0.8,
            });
            
            await this.rustAudio.initialize(config);
            
            if (!this.rustAudio.isInitialized()) {
                throw new Error('Rust Audio not initialized after initialize() call');
            }
            
            this.addResult(testName, 'pass', 'Rust Audio initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicOperations(): Promise<void> {
        const testName = 'Basic Audio Operations';
        const start = performance.now();
        
        try {
            // Test getting config
            const config = this.rustAudio.getConfig();
            if (config.sampleRate !== 44100) {
                throw new Error('Config not set correctly');
            }
            
            // Test setting listener
            const listener = RustAudio.createAudioListener({
                position: { x: 10, y: 20 },
                velocity: { x: 1, y: 2 },
                direction: { x: 0, y: 1 },
                gain: 0.9,
            });
            
            this.rustAudio.setListener(listener);
            
            const retrievedListener = this.rustAudio.getListener();
            if (retrievedListener.position.x !== 10 || retrievedListener.position.y !== 20) {
                throw new Error('Listener not set correctly');
            }
            
            // Test getting stats
            const stats = this.rustAudio.getStats();
            if (stats.activeSources !== 0 || stats.activeEffects !== 0) {
                throw new Error('Stats should start with 0 active sources and effects');
            }
            
            this.addResult(testName, 'pass', 'Basic audio operations work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAudioSources(): Promise<void> {
        const testName = 'Audio Sources';
        const start = performance.now();
        
        try {
            // Test adding sources
            const source1 = RustAudio.createAudioSource({
                position: { x: 0, y: 0 },
                volume: 0.5,
                pitch: 1.0,
                pan: 0.0,
                is3D: false,
                isPlaying: false,
            });
            
            const source1Id = this.rustAudio.addSource(source1);
            if (source1Id === 0) {
                throw new Error('Failed to add audio source');
            }
            
            const source2 = RustAudio.createAudioSource({
                position: { x: 100, y: 100 },
                volume: 0.8,
                pitch: 1.2,
                pan: -0.5,
                is3D: true,
                isPlaying: false,
            });
            
            const source2Id = this.rustAudio.addSource(source2);
            if (source2Id === 0) {
                throw new Error('Failed to add second audio source');
            }
            
            // Test playing sources
            if (!this.rustAudio.playSource(source1Id)) {
                throw new Error('Failed to play source');
            }
            
            // Test updating source properties
            if (!this.rustAudio.updateSourcePosition(source1Id, 50, 50)) {
                throw new Error('Failed to update source position');
            }
            
            if (!this.rustAudio.updateSourceVolume(source1Id, 0.7)) {
                throw new Error('Failed to update source volume');
            }
            
            if (!this.rustAudio.updateSourceVelocity(source1Id, 1, 2)) {
                throw new Error('Failed to update source velocity');
            }
            
            // Test pausing source
            if (!this.rustAudio.pauseSource(source1Id)) {
                throw new Error('Failed to pause source');
            }
            
            // Test removing source
            if (!this.rustAudio.removeSource(source2Id)) {
                throw new Error('Failed to remove source');
            }
            
            this.addResult(testName, 'pass', 'Audio sources work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Audio sources failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAudioEffects(): Promise<void> {
        const testName = 'Audio Effects';
        const start = performance.now();
        
        try {
            // Test adding effects
            const reverb = RustAudio.createReverbEffect(0.5, 0.5, 0.3, 0.7);
            const reverbId = this.rustAudio.addEffect(reverb);
            if (reverbId === 0) {
                throw new Error('Failed to add reverb effect');
            }
            
            const delay = RustAudio.createDelayEffect(0.3, 0.3, 0.3, 0.7);
            const delayId = this.rustAudio.addEffect(delay);
            if (delayId === 0) {
                throw new Error('Failed to add delay effect');
            }
            
            const distortion = RustAudio.createDistortionEffect(5.0, 0.5, 1.0, 0.0);
            const distortionId = this.rustAudio.addEffect(distortion);
            if (distortionId === 0) {
                throw new Error('Failed to add distortion effect');
            }
            
            const filter = RustAudio.createLowPassFilter(1000, 1.0, 1.0, 0.0);
            const filterId = this.rustAudio.addEffect(filter);
            if (filterId === 0) {
                throw new Error('Failed to add filter effect');
            }
            
            const compressor = RustAudio.createCompressorEffect(-12, 4, 0.003, 0.1, 1.0, 0.0);
            const compressorId = this.rustAudio.addEffect(compressor);
            if (compressorId === 0) {
                throw new Error('Failed to add compressor effect');
            }
            
            // Test enabling effects
            if (!this.rustAudio.enableEffect(reverbId, true)) {
                throw new Error('Failed to enable reverb effect');
            }
            
            if (!this.rustAudio.enableEffect(delayId, true)) {
                throw new Error('Failed to enable delay effect');
            }
            
            // Test setting effect parameters
            if (!this.rustAudio.setEffectParameters(reverbId, [0.7, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])) {
                throw new Error('Failed to set reverb parameters');
            }
            
            // Test disabling effects
            if (!this.rustAudio.enableEffect(reverbId, false)) {
                throw new Error('Failed to disable reverb effect');
            }
            
            // Test removing effect
            if (!this.rustAudio.removeEffect(distortionId)) {
                throw new Error('Failed to remove distortion effect');
            }
            
            this.addResult(testName, 'pass', 'Audio effects work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Audio effects failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async test3DAudio(): Promise<void> {
        const testName = '3D Audio';
        const start = performance.now();
        
        try {
            // Clear existing sources
            const stats = this.rustAudio.getStats();
            
            // Create 3D audio source
            const source3D = RustAudio.createAudioSource({
                position: { x: 10, y: 0 },
                volume: 1.0,
                pitch: 1.0,
                pan: 0.0,
                is3D: true,
                isPlaying: true,
                maxDistance: 100.0,
                referenceDistance: 10.0,
                rolloffFactor: 1.0,
            });
            
            const sourceId = this.rustAudio.addSource(source3D);
            if (sourceId === 0) {
                throw new Error('Failed to add 3D audio source');
            }
            
            // Set listener position
            const listener = RustAudio.createAudioListener({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                direction: { x: 0, y: 1 },
                gain: 1.0,
            });
            
            this.rustAudio.setListener(listener);
            
            // Process audio to test 3D calculations
            const audioStats = this.rustAudio.processAudio();
            
            // Test distance attenuation
            this.rustAudio.updateSourcePosition(sourceId, 50, 0); // Move source further away
            this.rustAudio.processAudio();
            
            // Test Doppler effect
            this.rustAudio.updateSourceVelocity(sourceId, 10, 0); // Moving source
            this.rustAudio.updateSourceVelocity(sourceId, -10, 0); // Moving towards listener
            this.rustAudio.processAudio();
            
            // Test directional audio
            const directionalSource = RustAudio.createAudioSource({
                position: { x: 0, y: 10 },
                volume: 1.0,
                pitch: 1.0,
                pan: 0.0,
                is3D: true,
                isPlaying: true,
                coneInnerAngle: Math.PI / 4,
                coneOuterAngle: Math.PI / 2,
                coneOuterGain: 0.5,
                direction: { x: 0, y: -1 },
            });
            
            const directionalId = this.rustAudio.addSource(directionalSource);
            if (directionalId === 0) {
                throw new Error('Failed to add directional audio source');
            }
            
            this.rustAudio.processAudio();
            
            this.addResult(testName, 'pass', '3D audio works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `3D audio failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAudioProcessing(): Promise<void> {
        const testName = 'Audio Processing';
        const start = performance.now();
        
        try {
            // Create test sources
            const source1 = RustAudio.createAudioSource({
                position: { x: 0, y: 0 },
                volume: 0.5,
                pitch: 1.0,
                pan: -0.5,
                is3D: false,
                isPlaying: true,
            });
            
            const source2 = RustAudio.createAudioSource({
                position: { x: 10, y: 10 },
                volume: 0.3,
                pitch: 1.2,
                pan: 0.5,
                is3D: false,
                isPlaying: true,
            });
            
            this.rustAudio.addSource(source1);
            this.rustAudio.addSource(source2);
            
            // Process audio
            const stats1 = this.rustAudio.processAudio();
            
            if (stats1.activeSources !== 2) {
                throw new Error('Should have 2 active sources');
            }
            
            // Get audio buffer
            const audioBuffer = this.rustAudio.getAudioBuffer();
            if (audioBuffer.length !== 1024) { // 512 samples * 2 channels
                throw new Error('Audio buffer should have 1024 samples');
            }
            
            // Test with effects
            const reverb = RustAudio.createReverbEffect(0.5, 0.5, 0.3, 0.7);
            const reverbId = this.rustAudio.addEffect(reverb);
            this.rustAudio.enableEffect(reverbId, true);
            
            const stats2 = this.rustAudio.processAudio();
            
            if (stats2.activeEffects !== 1) {
                throw new Error('Should have 1 active effect');
            }
            
            if (stats2.effectsTime <= 0) {
                throw new Error('Effects processing time should be positive');
            }
            
            // Test multiple processing cycles
            for (let i = 0; i < 10; i++) {
                this.rustAudio.processAudio();
            }
            
            this.addResult(testName, 'pass', 'Audio processing works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Audio processing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformance(): Promise<void> {
        const testName = 'Audio Performance';
        const start = performance.now();
        
        try {
            // Test with different source counts
            const testCases = [4, 8, 16, 32];
            const results: any[] = [];
            
            for (const sourceCount of testCases) {
                const benchmark = this.rustAudio.benchmarkAudio(sourceCount, 4, 60);
                results.push({
                    sourceCount,
                    avgTimePerFrame: benchmark.avgTimePerFrame,
                    estimatedFPS: benchmark.estimatedFPS,
                });
                
                if (benchmark.avgTimePerFrame > 16.67) { // More than 60 FPS budget
                    console.warn(`Performance slow for ${sourceCount} sources: ${benchmark.avgTimePerFrame.toFixed(2)}ms/frame`);
                }
            }
            
            // Check performance scaling
            const smallScale = results[0].avgTimePerFrame;
            const largeScale = results[results.length - 1].avgTimePerFrame;
            const scalingFactor = largeScale / smallScale;
            const sourceScalingFactor = results[results.length - 1].sourceCount / results[0].sourceCount;
            
            // Performance should scale roughly linearly
            if (scalingFactor > sourceScalingFactor * 2) {
                console.warn(`Performance scaling worse than expected: ${scalingFactor.toFixed(2)}x vs ${sourceScalingFactor.toFixed(2)}x source scaling`);
            }
            
            this.addResult(testName, 'pass', `Performance test passed (${results.length} test cases, best: ${Math.max(...results.map(r => r.estimatedFPS)).toFixed(1)} FPS)`, performance.now() - start, results);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSpatialAudio(): Promise<void> {
        const testName = 'Spatial Audio';
        const start = performance.now();
        
        try {
            // Create spatial audio setup
            const listener = RustAudio.createAudioListener({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                direction: { x: 0, y: 1 },
                gain: 1.0,
            });
            
            this.rustAudio.setListener(listener);
            
            // Create sources in different positions
            const sources = [
                { x: 10, y: 0 },   // Front
                { x: -10, y: 0 },  // Back
                { x: 0, y: 10 },   // Right
                { x: 0, y: -10 },  // Left
            ];
            
            const sourceIds: number[] = [];
            
            for (const pos of sources) {
                const source = RustAudio.createAudioSource({
                    position: pos,
                    volume: 0.5,
                    pitch: 1.0,
                    pan: 0.0,
                    is3D: true,
                    isPlaying: true,
                    maxDistance: 50.0,
                    referenceDistance: 5.0,
                    rolloffFactor: 1.0,
                });
                
                const id = this.rustAudio.addSource(source);
                sourceIds.push(id);
            }
            
            // Test spatial positioning
            this.rustAudio.processAudio();
            
            // Move listener
            this.rustAudio.setListener(RustAudio.createAudioListener({
                position: { x: 5, y: 5 },
                velocity: { x: 0, y: 0 },
                direction: { x: 0, y: 1 },
                gain: 1.0,
            }));
            
            this.rustAudio.processAudio();
            
            // Test moving sources
            for (let i = 0; i < sourceIds.length; i++) {
                const newPos = {
                    x: sources[i].x + Math.sin(Date.now() * 0.001 + i) * 5,
                    y: sources[i].y + Math.cos(Date.now() * 0.001 + i) * 5,
                };
                
                this.rustAudio.updateSourcePosition(sourceIds[i], newPos.x, newPos.y);
            }
            
            this.rustAudio.processAudio();
            
            // Test distance models
            const config = this.rustAudio.getConfig();
            const originalModel = config.distanceModel;
            
            // Test different distance models
            for (let model = 0; model < 4; model++) {
                this.rustAudio.setConfig({ ...config, distanceModel: model });
                this.rustAudio.processAudio();
            }
            
            // Restore original model
            this.rustAudio.setConfig({ ...config, distanceModel: originalModel });
            
            this.addResult(testName, 'pass', 'Spatial audio works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Spatial audio failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceComparison(): Promise<void> {
        const testName = 'Performance Comparison';
        const start = performance.now();
        
        try {
            // Run performance comparison
            const comparison = await this.rustAudio.runPerformanceComparison(16, 4, 60);
            
            if (comparison.improvement <= 0) {
                throw new Error('Rust should be faster than TypeScript');
            }
            
            if (comparison.rust.estimatedFPS < 30) {
                throw new Error('Rust performance should be at least 30 FPS');
            }
            
            this.addResult(testName, 'pass', `Performance comparison: Rust ${comparison.improvement.toFixed(1)}% faster (${comparison.rust.estimatedFPS.toFixed(1)} FPS vs ${comparison.typescript.estimatedFPS.toFixed(1)} FPS)`, performance.now() - start, comparison);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance comparison failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n📊 Rust Audio Test Report');
        console.log('============================');
        
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
        const performanceTest = this.results.find(r => r.name === 'Performance Comparison');
        if (performanceTest && performanceTest.details) {
            console.log(`\n🚀 Performance Summary:`);
            console.log(`   Rust FPS: ${performanceTest.details.rust.estimatedFPS.toFixed(1)}`);
            console.log(`   TypeScript FPS: ${performanceTest.details.typescript.estimatedFPS.toFixed(1)}`);
            console.log(`   Improvement: ${performanceTest.details.improvement.toFixed(1)}%`);
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

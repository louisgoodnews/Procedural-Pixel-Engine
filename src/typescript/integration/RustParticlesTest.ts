import { RustParticles, ParticleSystemConfig, EmitterConfig } from '../rust-wrappers/RustParticles';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustParticlesTest {
    private rustParticles: RustParticles;
    private results: TestResult[] = [];

    constructor() {
        this.rustParticles = new RustParticles();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Particle System Tests...');
        console.log('============================================');
        
        try {
            await this.testInitialization();
            await this.testBasicOperations();
            await this.testEmission();
            await this.testPhysics();
            await this.testAppearance();
            await this.testEffects();
            await this.testPerformance();
            await this.testForceApplication();
            await this.testExplosion();
            await this.testPerformanceComparison();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Particle test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Particle Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Particles Initialization';
        const start = performance.now();
        
        try {
            const config = RustParticles.createParticleSystemConfig({
                maxParticles: 1000,
                gravity: { x: 0, y: 9.81 },
                damping: 0.01,
            });
            
            await this.rustParticles.initialize(config);
            
            if (!this.rustParticles.isInitialized()) {
                throw new Error('Rust Particles not initialized after initialize() call');
            }
            
            this.addResult(testName, 'pass', 'Rust Particles initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicOperations(): Promise<void> {
        const testName = 'Basic Particle Operations';
        const start = performance.now();
        
        try {
            // Test adding emitters
            const emitter = RustParticles.createEmitterConfig({
                position: { x: 100, y: 100 },
                velocity: { x: 0, y: 1 },
                emissionRate: 60,
            });
            
            this.rustParticles.addEmitter(emitter);
            
            // Test getting stats
            const stats = this.rustParticles.getStats();
            if (stats.totalEmitted !== 0) {
                throw new Error('Stats should start with 0 total emitted');
            }
            
            // Test config
            const config = this.rustParticles.getConfig();
            if (config.maxParticles !== 1000) {
                throw new Error('Config not set correctly');
            }
            
            // Test clearing emitters
            this.rustParticles.clearEmitters();
            
            // Test clearing particles
            this.rustParticles.clearParticles();
            
            this.addResult(testName, 'pass', 'Basic particle operations work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEmission(): Promise<void> {
        const testName = 'Particle Emission';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Add emitter
            const emitter = RustParticles.createEmitterConfig({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 1 },
                emissionRate: 120, // 2 particles per frame at 60fps
                lifeMin: 2.0,
                lifeMax: 2.0,
                sizeStart: 5.0,
                sizeEnd: 5.0,
            });
            
            this.rustParticles.addEmitter(emitter);
            
            // Update for a few frames
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Check if particles were emitted
            const stats = this.rustParticles.getStats();
            if (stats.activeParticles === 0) {
                throw new Error('No particles were emitted');
            }
            
            // Check if particles have correct properties
            const particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('No active particles found');
            }
            
            const firstParticle = particles[0];
            if (firstParticle.position.x !== 0 || firstParticle.position.y <= 0) {
                throw new Error('Particle position not updated correctly');
            }
            
            this.addResult(testName, 'pass', `Particle emission works (${stats.activeParticles} particles emitted)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Emission failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPhysics(): Promise<void> {
        const testName = 'Particle Physics';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Create emitter with gravity
            const emitter = RustParticles.createEmitterConfig({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: -5 }, // Upward velocity
                emissionRate: 60,
                lifeMin: 2.0,
                lifeMax: 2.0,
                sizeStart: 5.0,
                sizeEnd: 5.0,
            });
            
            this.rustParticles.addEmitter(emitter);
            
            // Update for a few frames
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Check if gravity affected particles
            const particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('No particles found for physics test');
            }
            
            // Particles should be falling down due to gravity
            const firstParticle = particles[0];
            if (firstParticle.velocity.y <= 0) {
                throw new Error('Gravity not applied correctly');
            }
            
            // Test with different gravity
            const config = RustParticles.createParticleSystemConfig({
                maxParticles: 1000,
                gravity: { x: 0, y: -9.81 }, // Inverted gravity
            });
            
            this.rustParticles.setConfig(config);
            this.rustParticles.clearParticles();
            
            // Emit new particles with inverted gravity
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            const invertedParticles = this.rustParticles.getActiveParticles();
            if (invertedParticles.length > 0 && invertedParticles[0].velocity.y >= 0) {
                throw new Error('Inverted gravity not working');
            }
            
            this.addResult(testName, 'pass', 'Particle physics works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Physics failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAppearance(): Promise<void> {
        const testName = 'Particle Appearance';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Create emitter with color interpolation
            const emitter = RustParticles.createEmitterConfig({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                emissionRate: 60,
                colorStart: RustParticles.createColor(255, 0, 0, 255), // Red
                colorEnd: RustParticles.createColor(0, 0, 255, 100), // Blue with alpha
                sizeStart: 10.0,
                sizeEnd: 2.0,
                lifeMin: 1.0,
                lifeMax: 1.0,
            });
            
            this.rustParticles.addEmitter(emitter);
            
            // Update for half the particle lifetime
            for (let i = 0; i < 30; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Check if appearance changed
            const particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('No particles found for appearance test');
            }
            
            const firstParticle = particles[0];
            
            // Color should be interpolated between red and blue
            if (firstParticle.color.r === 255 && firstParticle.color.b === 0) {
                throw new Error('Color interpolation not working');
            }
            
            // Size should be interpolated
            if (firstParticle.size === 10.0) {
                throw new Error('Size interpolation not working');
            }
            
            this.addResult(testName, 'pass', 'Particle appearance interpolation works', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Appearance failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEffects(): Promise<void> {
        const testName = 'Particle Effects';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Test fire effect
            const fireEmitter = RustParticles.createFireEffect({ x: 0, y: 0 }, 1.0);
            this.rustParticles.addEmitter(fireEmitter);
            
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            let particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('Fire effect not working');
            }
            
            // Test smoke effect
            this.rustParticles.clearEmitters();
            const smokeEmitter = RustParticles.createSmokeEffect({ x: 0, y: 0 }, 1.0);
            this.rustParticles.addEmitter(smokeEmitter);
            
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('Smoke effect not working');
            }
            
            // Test explosion effect
            this.rustParticles.clearEmitters();
            const explosionEmitter = RustParticles.createExplosionEffect({ x: 0, y: 0 }, 1.0);
            this.rustParticles.addEmitter(explosionEmitter);
            
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('Explosion effect not working');
            }
            
            // Test rain effect
            this.rustParticles.clearEmitters();
            const rainEmitter = RustParticles.createRainEffect({ x: 0, y: 0, width: 100, height: 100 }, 1.0);
            this.rustParticles.addEmitter(rainEmitter);
            
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('Rain effect not working');
            }
            
            this.addResult(testName, 'pass', 'All particle effects work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Effects failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformance(): Promise<void> {
        const testName = 'Particle Performance';
        const start = performance.now();
        
        try {
            // Test with different particle counts
            const testCases = [100, 500, 1000, 5000];
            const results: any[] = [];
            
            for (const particleCount of testCases) {
                const benchmark = this.rustParticles.benchmarkParticles(particleCount, 5, 60);
                results.push({
                    particleCount,
                    avgTimePerFrame: benchmark.avgTimePerFrame,
                    estimatedFPS: benchmark.estimatedFPS,
                });
                
                if (benchmark.avgTimePerFrame > 16.67) { // More than 60 FPS budget
                    console.warn(`Performance slow for ${particleCount} particles: ${benchmark.avgTimePerFrame.toFixed(2)}ms/frame`);
                }
            }
            
            // Check performance scaling
            const smallScale = results[0].avgTimePerFrame;
            const largeScale = results[results.length - 1].avgTimePerFrame;
            const scalingFactor = largeScale / smallScale;
            const particleScalingFactor = results[results.length - 1].particleCount / results[0].particleCount;
            
            // Performance should scale roughly linearly
            if (scalingFactor > particleScalingFactor * 3) {
                console.warn(`Performance scaling worse than expected: ${scalingFactor.toFixed(2)}x vs ${particleScalingFactor.toFixed(2)}x particle scaling`);
            }
            
            this.addResult(testName, 'pass', `Performance test passed (${results.length} test cases, best: ${Math.max(...results.map(r => r.estimatedFPS)).toFixed(1)} FPS)`, performance.now() - start, results);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testForceApplication(): Promise<void> {
        const testName = 'Force Application';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Create emitter
            const emitter = RustParticles.createEmitterConfig({
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                emissionRate: 60,
                lifeMin: 5.0,
                lifeMax: 5.0,
            });
            
            this.rustParticles.addEmitter(emitter);
            
            // Emit some particles
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Apply force
            this.rustParticles.applyForce(10, 5);
            
            // Update a few frames
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Check if force was applied
            const particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('No particles found for force test');
            }
            
            const firstParticle = particles[0];
            if (firstParticle.velocity.x <= 0 || firstParticle.velocity.y <= 0) {
                throw new Error('Force not applied correctly');
            }
            
            // Test area force
            this.rustParticles.clearParticles();
            
            // Emit particles at different positions
            for (let i = 0; i < 10; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Apply force in area
            this.rustParticles.applyForceInArea(0, 10, 0, 0, 50);
            
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            const areaParticles = this.rustParticles.getActiveParticles();
            const affectedParticles = areaParticles.filter(p => 
                Math.sqrt(p.position.x * p.position.x + p.position.y * p.position.y) <= 50
            );
            
            if (affectedParticles.length === 0) {
                throw new Error('Area force not applied correctly');
            }
            
            this.addResult(testName, 'pass', 'Force application works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Force application failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testExplosion(): Promise<void> {
        const testName = 'Explosion Effect';
        const start = performance.now();
        
        try {
            // Clear everything
            this.rustParticles.clearEmitters();
            this.rustParticles.clearParticles();
            
            // Create explosion
            this.rustParticles.createExplosion(0, 0, 100, 50, RustParticles.createColor(255, 100, 0, 255));
            
            // Update a few frames
            for (let i = 0; i < 5; i++) {
                this.rustParticles.update(1.0 / 60.0);
            }
            
            // Check if explosion particles were created
            const particles = this.rustParticles.getActiveParticles();
            if (particles.length === 0) {
                throw new Error('No explosion particles found');
            }
            
            // Check if particles are moving outward from center
            const firstParticle = particles[0];
            const distance = Math.sqrt(firstParticle.position.x * firstParticle.position.x + firstParticle.position.y * firstParticle.position.y);
            
            if (distance < 10) {
                throw new Error('Explosion particles not moving outward');
            }
            
            // Check particle colors
            const hasCorrectColor = particles.some(p => p.color.r > 200 && p.color.g > 50);
            if (!hasCorrectColor) {
                throw new Error('Explosion particles don\'t have correct color');
            }
            
            this.addResult(testName, 'pass', `Explosion effect works correctly (${particles.length} particles created)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Explosion failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceComparison(): Promise<void> {
        const testName = 'Performance Comparison';
        const start = performance.now();
        
        try {
            // Run performance comparison
            const comparison = await this.rustParticles.runPerformanceComparison(1000, 5, 60);
            
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
        console.log('\n📊 Rust Particle Test Report');
        console.log('===============================');
        
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

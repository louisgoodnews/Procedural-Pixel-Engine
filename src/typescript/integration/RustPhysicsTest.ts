import { RustPhysics, PhysicsBody, PhysicsWorld } from '../rust-wrappers/RustPhysics';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustPhysicsTest {
    private rustPhysics: RustPhysics;
    private results: TestResult[] = [];

    constructor() {
        this.rustPhysics = new RustPhysics();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Physics System Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testBasicOperations();
            await this.testCollisionDetection();
            await this.testPerformance();
            await this.testRaycasting();
            await this.testAreaQueries();
            await this.testWorldConfiguration();
            await this.testSerialization();
            await this.testPerformanceComparison();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Physics test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Physics Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Physics Initialization';
        const start = performance.now();
        
        try {
            await this.rustPhysics.initialize();
            
            if (!this.rustPhysics.isInitialized()) {
                throw new Error('Rust Physics not initialized after initialize() call');
            }
            
            this.addResult(testName, 'pass', 'Rust Physics initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicOperations(): Promise<void> {
        const testName = 'Basic Physics Operations';
        const start = performance.now();
        
        try {
            // Test adding bodies
            const testBody = RustPhysics.createBody({
                id: 1,
                position: { x: 100, y: 100 },
                velocity: { x: 10, y: 5 },
                mass: 2.0,
                radius: 15.0,
            });
            
            this.rustPhysics.addBody(testBody);
            
            // Test getting bodies
            const bodies = this.rustPhysics.getBodies();
            if (bodies.length !== 1 || bodies[0].id !== 1) {
                throw new Error('Body not added correctly');
            }
            
            // Test updating bodies
            const updatedBody = RustPhysics.createBody({
                id: 1,
                position: { x: 200, y: 200 },
                velocity: { x: -5, y: -10 },
                mass: 2.0,
                radius: 15.0,
            });
            
            this.rustPhysics.updateBodies([updatedBody]);
            
            const updatedBodies = this.rustPhysics.getBodies();
            if (updatedBodies[0].position.x !== 200 || updatedBodies[0].position.y !== 200) {
                throw new Error('Body not updated correctly');
            }
            
            // Test removing bodies
            const removed = this.rustPhysics.removeBody(1);
            if (!removed) {
                throw new Error('Body not removed correctly');
            }
            
            const finalBodies = this.rustPhysics.getBodies();
            if (finalBodies.length !== 0) {
                throw new Error('Body not removed from system');
            }
            
            this.addResult(testName, 'pass', 'Basic physics operations work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCollisionDetection(): Promise<void> {
        const testName = 'Collision Detection';
        const start = performance.now();
        
        try {
            // Create two colliding bodies
            const body1 = RustPhysics.createBody({
                id: 1,
                position: { x: 0, y: 0 },
                velocity: { x: 10, y: 0 },
                mass: 1.0,
                radius: 20.0,
            });
            
            const body2 = RustPhysics.createBody({
                id: 2,
                position: { x: 15, y: 0 },
                velocity: { x: -10, y: 0 },
                mass: 1.0,
                radius: 20.0,
            });
            
            this.rustPhysics.addBody(body1);
            this.rustPhysics.addBody(body2);
            
            // Run physics update
            const stats = this.rustPhysics.update(1.0 / 60.0);
            
            // Check if collision was detected
            if (stats.collisionCount === 0) {
                throw new Error('No collision detected');
            }
            
            // Check if bodies are still in the system
            const bodies = this.rustPhysics.getBodies();
            if (bodies.length !== 2) {
                throw new Error('Bodies lost during collision');
            }
            
            // Test with non-colliding bodies
            this.rustPhysics.clearBodies();
            
            const body3 = RustPhysics.createBody({
                id: 3,
                position: { x: -100, y: 0 },
                velocity: { x: 10, y: 0 },
                mass: 1.0,
                radius: 20.0,
            });
            
            const body4 = RustPhysics.createBody({
                id: 4,
                position: { x: 100, y: 0 },
                velocity: { x: -10, y: 0 },
                mass: 1.0,
                radius: 20.0,
            });
            
            this.rustPhysics.addBody(body3);
            this.rustPhysics.addBody(body4);
            
            const noCollisionStats = this.rustPhysics.update(1.0 / 60.0);
            
            if (noCollisionStats.collisionCount > 0) {
                throw new Error('False positive collision detected');
            }
            
            this.addResult(testName, 'pass', `Collision detection works (${stats.collisionCount} collisions detected)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Collision detection failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformance(): Promise<void> {
        const testName = 'Physics Performance';
        const start = performance.now();
        
        try {
            // Test with different entity counts
            const testCases = [10, 50, 100, 500, 1000];
            const results: any[] = [];
            
            for (const entityCount of testCases) {
                const benchmark = this.rustPhysics.benchmarkPhysics(entityCount, 60);
                results.push({
                    entityCount,
                    avgTimePerFrame: benchmark.avgTimePerFrame,
                    estimatedFPS: benchmark.estimatedFPS,
                });
                
                if (benchmark.avgTimePerFrame > 16.67) { // More than 60 FPS budget
                    throw new Error(`Performance too slow for ${entityCount} entities: ${benchmark.avgTimePerFrame.toFixed(2)}ms/frame`);
                }
            }
            
            // Check performance scaling
            const smallScale = results[0].avgTimePerFrame;
            const largeScale = results[results.length - 1].avgTimePerFrame;
            const scalingFactor = largeScale / smallScale;
            const entityScalingFactor = results[results.length - 1].entityCount / results[0].entityCount;
            
            // Performance should scale roughly linearly (O(n log n) with spatial hashing)
            if (scalingFactor > entityScalingFactor * 2) {
                console.warn(`Performance scaling worse than expected: ${scalingFactor.toFixed(2)}x vs ${entityScalingFactor.toFixed(2)}x entity scaling`);
            }
            
            this.addResult(testName, 'pass', `Performance test passed (${results.length} test cases, best: ${Math.max(...results.map(r => r.estimatedFPS)).toFixed(1)} FPS)`, performance.now() - start, results);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRaycasting(): Promise<void> {
        const testName = 'Raycasting';
        const start = performance.now();
        
        try {
            // Create test bodies
            const body1 = RustPhysics.createBody({
                id: 1,
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                mass: 1.0,
                radius: 20.0,
            });
            
            const body2 = RustPhysics.createBody({
                id: 2,
                position: { x: 100, y: 0 },
                velocity: { x: 0, y: 0 },
                mass: 1.0,
                radius: 30.0,
            });
            
            this.rustPhysics.addBody(body1);
            this.rustPhysics.addBody(body2);
            
            // Test raycast that should hit body1
            const hit1 = this.rustPhysics.raycast(-50, 0, 1, 0, 100);
            if (!hit1 || hit1.entityId !== 1) {
                throw new Error('Raycast should hit body1');
            }
            
            // Test raycast that should hit body2
            const hit2 = this.rustPhysics.raycast(50, 0, 1, 0, 100);
            if (!hit2 || hit2.entityId !== 2) {
                throw new Error('Raycast should hit body2');
            }
            
            // Test raycast that should miss
            const miss = this.rustPhysics.raycast(-50, 50, 1, 0, 100);
            if (miss !== null) {
                throw new Error('Raycast should miss all bodies');
            }
            
            // Test raycast with limited range
            const shortHit = this.rustPhysics.raycast(-50, 0, 1, 0, 30);
            if (!shortHit || shortHit.entityId !== 1) {
                throw new Error('Short range raycast should hit body1');
            }
            
            const shortMiss = this.rustPhysics.raycast(-50, 0, 1, 0, 20);
            if (shortMiss !== null) {
                throw new Error('Short range raycast should miss body1');
            }
            
            this.addResult(testName, 'pass', 'Raycasting works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Raycasting failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAreaQueries(): Promise<void> {
        const testName = 'Area Queries';
        const start = performance.now();
        
        try {
            // Create test bodies in different positions
            const bodies = [
                RustPhysics.createBody({ id: 1, position: { x: 0, y: 0 }, mass: 1.0, radius: 10.0 }),
                RustPhysics.createBody({ id: 2, position: { x: 50, y: 0 }, mass: 1.0, radius: 10.0 }),
                RustPhysics.createBody({ id: 3, position: { x: 0, y: 50 }, mass: 1.0, radius: 10.0 }),
                RustPhysics.createBody({ id: 4, position: { x: 100, y: 100 }, mass: 1.0, radius: 10.0 }),
            ];
            
            bodies.forEach(body => this.rustPhysics.addBody(body));
            
            // Query area around origin
            const nearOrigin = this.rustPhysics.queryArea(0, 0, 30);
            if (!nearOrigin.includes(1) || !nearOrigin.includes(2) || !nearOrigin.includes(3) || nearOrigin.includes(4)) {
                throw new Error('Area query around origin should find bodies 1, 2, 3 but not 4');
            }
            
            // Query area around far point
            const farPoint = this.rustPhysics.queryArea(100, 100, 30);
            if (!farPoint.includes(4) || farPoint.includes(1) || farPoint.includes(2) || farPoint.includes(3)) {
                throw new Error('Area query around (100, 100) should find body 4 but not 1, 2, 3');
            }
            
            // Query empty area
            const emptyArea = this.rustPhysics.queryArea(-100, -100, 10);
            if (emptyArea.length !== 0) {
                throw new Error('Area query should find no bodies');
            }
            
            this.addResult(testName, 'pass', `Area queries work correctly (found ${nearOrigin.length} bodies near origin)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Area queries failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testWorldConfiguration(): Promise<void> {
        const testName = 'World Configuration';
        const start = performance.now();
        
        try {
            // Get default world config
            const defaultConfig = this.rustPhysics.getWorldConfig();
            
            // Create custom world config
            const customConfig = RustPhysics.createWorld({
                gravity: { x: 0, y: -9.81 }, // Inverted gravity
                timeStep: 1.0 / 120.0, // 120 FPS
                velocityIterations: 16,
                positionIterations: 6,
                boundsMin: { x: -500, y: -500 },
                boundsMax: { x: 500, y: 500 },
            });
            
            this.rustPhysics.setWorldConfig(customConfig);
            
            // Verify config was set
            const currentConfig = this.rustPhysics.getWorldConfig();
            if (currentConfig.gravity.y !== -9.81 || currentConfig.timeStep !== 1.0 / 120.0) {
                throw new Error('World configuration not set correctly');
            }
            
            // Test physics with new config
            const testBody = RustPhysics.createBody({
                id: 1,
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                mass: 1.0,
                radius: 10.0,
            });
            
            this.rustPhysics.addBody(testBody);
            this.rustPhysics.update(1.0 / 120.0);
            
            const bodies = this.rustPhysics.getBodies();
            // With inverted gravity, body should move up
            if (bodies[0].position.y >= 0) {
                throw new Error('Body should move up with inverted gravity');
            }
            
            // Restore default config
            this.rustPhysics.setWorldConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'World configuration works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `World configuration failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSerialization(): Promise<void> {
        const testName = 'Serialization';
        const start = performance.now();
        
        try {
            // Create test bodies
            const bodies = [
                RustPhysics.createBody({
                    id: 1,
                    position: { x: 10.5, y: -20.3 },
                    velocity: { x: 5.7, y: -3.2 },
                    acceleration: { x: 0.1, y: 0.2 },
                    mass: 2.5,
                    radius: 15.7,
                    restitution: 0.75,
                    friction: 0.025,
                    isStatic: false,
                    layer: 3,
                }),
                RustPhysics.createBody({
                    id: 2,
                    position: { x: -50, y: 100 },
                    velocity: { x: -10, y: 20 },
                    acceleration: { x: -0.5, y: -0.5 },
                    mass: 5.0,
                    radius: 25.0,
                    restitution: 0.9,
                    friction: 0.05,
                    isStatic: true,
                    layer: 1,
                }),
            ];
            
            bodies.forEach(body => this.rustPhysics.addBody(body));
            
            // Get bodies back
            const retrievedBodies = this.rustPhysics.getBodies();
            
            // Verify serialization accuracy
            if (retrievedBodies.length !== 2) {
                throw new Error('Wrong number of bodies retrieved');
            }
            
            for (let i = 0; i < bodies.length; i++) {
                const original = bodies[i];
                const retrieved = retrievedBodies[i];
                
                if (original.id !== retrieved.id ||
                    Math.abs(original.position.x - retrieved.position.x) > 0.001 ||
                    Math.abs(original.position.y - retrieved.position.y) > 0.001 ||
                    Math.abs(original.velocity.x - retrieved.velocity.x) > 0.001 ||
                    Math.abs(original.velocity.y - retrieved.velocity.y) > 0.001 ||
                    Math.abs(original.mass - retrieved.mass) > 0.001 ||
                    Math.abs(original.radius - retrieved.radius) > 0.001 ||
                    original.isStatic !== retrieved.isStatic ||
                    original.layer !== retrieved.layer) {
                    throw new Error(`Body ${i} serialization mismatch`);
                }
            }
            
            this.addResult(testName, 'pass', 'Serialization works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Serialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceComparison(): Promise<void> {
        const testName = 'Performance Comparison';
        const start = performance.now();
        
        try {
            // Run performance comparison
            const comparison = await this.rustPhysics.runPerformanceComparison(500, 60);
            
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
        console.log('\n📊 Rust Physics Test Report');
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

import { RustCore } from '../rust-wrappers/RustCore';
import { RustPerformanceTest } from './RustPerformanceTest';
import { MemoryManager } from './MemoryManager';
import { SerializationHelper } from './SerializationHelper';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
}

export class RustIntegrationTest {
    private rustCore: RustCore;
    private performanceTest: RustPerformanceTest;
    private memoryManager: MemoryManager;
    private results: TestResult[] = [];

    constructor() {
        this.rustCore = new RustCore();
        this.performanceTest = new RustPerformanceTest();
        this.memoryManager = new MemoryManager();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Integration Tests...');
        console.log('=====================================');
        
        try {
            await this.testRustCoreInitialization();
            await this.testRustCoreCommunication();
            await this.testPerformanceTesting();
            await this.testMemoryManagement();
            await this.testSerialization();
            await this.testErrorHandling();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Integration test failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Integration Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testRustCoreInitialization(): Promise<void> {
        const testName = 'Rust Core Initialization';
        const start = performance.now();
        
        try {
            await this.rustCore.initialize();
            
            if (!this.rustCore.isInitialized()) {
                throw new Error('Rust Core not initialized after initialize() call');
            }
            
            this.addResult(testName, 'pass', 'Rust Core initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRustCoreCommunication(): Promise<void> {
        const testName = 'Rust Core Communication';
        const start = performance.now();
        
        try {
            // Test basic communication
            this.rustCore.logMessage('Test message from TypeScript');
            
            // Test performance info
            const perfInfo = this.rustCore.getPerformanceInfo();
            if (typeof perfInfo.physicsEntities !== 'number') {
                throw new Error('Invalid performance info structure');
            }
            
            // Test metrics update
            this.rustCore.updateMetrics(100, 500, 8);
            
            // Test time functions
            const rustTime = this.rustCore.getCurrentTime();
            if (typeof rustTime !== 'number' || rustTime <= 0) {
                throw new Error('Invalid time value from Rust');
            }
            
            this.addResult(testName, 'pass', 'All communication methods work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Communication test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceTesting(): Promise<void> {
        const testName = 'Performance Testing Framework';
        const start = performance.now();
        
        try {
            // Run a quick performance test
            const rustTime = this.rustCore.runBenchmark('quick_test', 1000);
            
            if (typeof rustTime !== 'number' || rustTime < 0) {
                throw new Error('Invalid benchmark result');
            }
            
            // Test the full performance test suite
            await this.performanceTest.runAllTests();
            
            const results = this.performanceTest.getResults();
            if (results.length === 0) {
                throw new Error('No performance test results');
            }
            
            this.addResult(testName, 'pass', `Performance testing framework works (${results.length} tests)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance testing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testMemoryManagement(): Promise<void> {
        const testName = 'Memory Management';
        const start = performance.now();
        
        try {
            // Test buffer allocation
            const bufferId = this.memoryManager.allocateBuffer(1024, 'shared');
            if (bufferId <= 0) {
                throw new Error('Invalid buffer ID returned');
            }
            
            // Test buffer access
            const accessed = this.memoryManager.accessBuffer(bufferId);
            if (!accessed) {
                throw new Error('Failed to access allocated buffer');
            }
            
            // Test buffer info
            const info = this.memoryManager.getBufferInfo(bufferId);
            if (!info || info.size !== 1024) {
                throw new Error('Invalid buffer info returned');
            }
            
            // Test memory stats
            const stats = this.memoryManager.getMemoryStats();
            if (stats.totalBuffers !== 1 || stats.totalSize !== 1024) {
                throw new Error('Invalid memory stats');
            }
            
            // Test buffer deallocation
            const deallocated = this.memoryManager.deallocateBuffer(bufferId);
            if (!deallocated) {
                throw new Error('Failed to deallocate buffer');
            }
            
            // Test performance benchmarks
            const allocTime = this.memoryManager.benchmarkAllocation(100, 1024);
            const accessTime = this.memoryManager.benchmarkAccess(50);
            
            if (allocTime < 0 || accessTime < 0) {
                throw new Error('Invalid benchmark results');
            }
            
            this.addResult(testName, 'pass', `Memory management works (alloc: ${allocTime.toFixed(2)}ms, access: ${accessTime.toFixed(2)}ms)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Memory management test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSerialization(): Promise<void> {
        const testName = 'Serialization Helper';
        const start = performance.now();
        
        try {
            // Test vector serialization
            const vec2 = { x: 1.5, y: 2.5 };
            const vec2Buffer = SerializationHelper.serializeVec2(vec2);
            const deserializedVec2 = SerializationHelper.deserializeVec2(vec2Buffer);
            
            if (deserializedVec2.x !== vec2.x || deserializedVec2.y !== vec2.y) {
                throw new Error('Vec2 serialization/deserialization failed');
            }
            
            // Test entity serialization
            const entity = {
                id: 123,
                position: { x: 10, y: 20 },
                velocity: { x: 1, y: 2 },
                acceleration: { x: 0, y: 0 },
                mass: 5.5,
                radius: 10,
                color: { r: 255, g: 0, b: 0, a: 255 },
            };
            
            const entityBuffer = SerializationHelper.serializeEntity(entity);
            const deserializedEntity = SerializationHelper.deserializeEntity(entityBuffer);
            
            if (!SerializationHelper.validateEntity(deserializedEntity)) {
                throw new Error('Entity validation failed');
            }
            
            // Test array serialization
            const entities = [entity, { ...entity, id: 456 }];
            const arrayBuffer = SerializationHelper.serializeEntityArray(entities);
            const deserializedArray = SerializationHelper.deserializeEntityArray(arrayBuffer);
            
            if (deserializedArray.length !== entities.length) {
                throw new Error('Array serialization failed');
            }
            
            // Test serialization performance
            const perfResult = SerializationHelper.benchmarkSerialization(1000);
            
            if (perfResult.serializeTime < 0 || perfResult.deserializeTime < 0) {
                throw new Error('Invalid serialization benchmark results');
            }
            
            this.addResult(testName, 'pass', `Serialization works (serialize: ${perfResult.serializeTime.toFixed(2)}ms, deserialize: ${perfResult.deserializeTime.toFixed(2)}ms)`, performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Serialization test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testErrorHandling(): Promise<void> {
        const testName = 'Error Handling';
        const start = performance.now();
        
        try {
            // Test error when not initialized
            const uninitializedCore = new RustCore();
            try {
                uninitializedCore.logMessage('test');
                throw new Error('Should have thrown error for uninitialized core');
            } catch (error) {
                if (!(error instanceof Error) || !error.message.includes('not initialized')) {
                    throw new Error('Wrong error message for uninitialized core');
                }
            }
            
            // Test memory manager error handling
            const invalidBufferId = this.memoryManager.deallocateBuffer(99999);
            if (invalidBufferId) {
                throw new Error('Should have returned false for invalid buffer ID');
            }
            
            // Test serialization error handling
            const invalidBuffer = new ArrayBuffer(0);
            try {
                SerializationHelper.deserializeVec2(invalidBuffer);
                throw new Error('Should have thrown error for invalid buffer');
            } catch (error) {
                // Expected to fail - check if it's the expected error type
                if (!(error instanceof Error)) {
                    throw new Error('Unexpected error type');
                }
            }
            
            this.addResult(testName, 'pass', 'Error handling works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Error handling test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number): void {
        this.results.push({ name, status, message, duration });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n📊 Integration Test Report');
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

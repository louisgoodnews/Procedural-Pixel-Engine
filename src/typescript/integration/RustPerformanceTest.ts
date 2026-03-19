import { RustCore } from '../rust-wrappers/RustCore';

export interface BenchmarkResult {
    name: string;
    iterations: number;
    rustTime: number;
    jsTime: number;
    improvement: number;
    success: boolean;
}

export class RustPerformanceTest {
    private rustCore: RustCore;
    private results: BenchmarkResult[] = [];

    constructor() {
        this.rustCore = new RustCore();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Performance Tests...');
        
        await this.rustCore.initialize();
        
        await this.testBasicOperations();
        await this.testMathOperations();
        await this.testStringOperations();
        await this.testArrayOperations();
        
        this.generateReport();
    }

    private async testBasicOperations(): Promise<void> {
        console.log('Testing Basic Operations...');
        
        const iterations = 1000000;
        
        // Rust test
        const rustTime = this.rustCore.runBenchmark('basic_operations', iterations);
        
        // JavaScript equivalent
        const jsStart = performance.now();
        let result = 0.0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sin(i) * Math.cos(i);
        }
        const jsTime = performance.now() - jsStart;
        
        // Prevent optimization
        if (result === 0) console.log('Unexpected JS result');
        
        const improvement = ((jsTime - rustTime) / jsTime) * 100;
        
        this.results.push({
            name: 'Basic Operations',
            iterations,
            rustTime,
            jsTime,
            improvement,
            success: rustTime < jsTime
        });
    }

    private async testMathOperations(): Promise<void> {
        console.log('Testing Math Operations...');
        
        const iterations = 100000;
        
        // Rust test
        const rustTime = this.rustCore.runBenchmark('math_operations', iterations);
        
        // JavaScript equivalent
        const jsStart = performance.now();
        let result = 0.0;
        for (let i = 0; i < iterations; i++) {
            const angle = (i * 0.01);
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            const mag = Math.sqrt(x * x + y * y);
            result += x + y + mag;
        }
        const jsTime = performance.now() - jsStart;
        
        // Prevent optimization
        if (result === 0) console.log('Unexpected JS math result');
        
        const improvement = ((jsTime - rustTime) / jsTime) * 100;
        
        this.results.push({
            name: 'Math Operations',
            iterations,
            rustTime,
            jsTime,
            improvement,
            success: rustTime < jsTime
        });
    }

    private async testStringOperations(): Promise<void> {
        console.log('Testing String Operations...');
        
        const iterations = 10000;
        const testString = 'Hello, World! This is a test string for performance testing.';
        
        // Rust test (simulated - would need actual Rust string operations)
        const rustTime = this.rustCore.runBenchmark('string_operations', iterations);
        
        // JavaScript equivalent
        const jsStart = performance.now();
        let result = '';
        for (let i = 0; i < iterations; i++) {
            result = testString.repeat(2);
            result = result.toUpperCase();
            result = result.toLowerCase();
        }
        const jsTime = performance.now() - jsStart;
        
        // Prevent optimization
        if (result.length === 0) console.log('Unexpected JS string result');
        
        const improvement = ((jsTime - rustTime) / jsTime) * 100;
        
        this.results.push({
            name: 'String Operations',
            iterations,
            rustTime,
            jsTime,
            improvement,
            success: rustTime < jsTime
        });
    }

    private async testArrayOperations(): Promise<void> {
        console.log('Testing Array Operations...');
        
        const iterations = 1000;
        const arraySize = 1000;
        
        // Rust test (simulated - would need actual Rust array operations)
        const rustTime = this.rustCore.runBenchmark('array_operations', iterations);
        
        // JavaScript equivalent
        const jsStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const array = new Array(arraySize);
            for (let j = 0; j < arraySize; j++) {
                array[j] = Math.random() * 100;
            }
            
            // Sort array
            array.sort((a, b) => a - b);
            
            // Filter and map
            const filtered = array.filter(x => x > 50);
            const mapped = filtered.map(x => x * 2);
            
            // Reduce
            const sum = mapped.reduce((acc, val) => acc + val, 0);
            
            // Prevent optimization
            if (sum === 0) console.log('Unexpected JS array result');
        }
        const jsTime = performance.now() - jsStart;
        
        const improvement = ((jsTime - rustTime) / jsTime) * 100;
        
        this.results.push({
            name: 'Array Operations',
            iterations,
            rustTime,
            jsTime,
            improvement,
            success: rustTime < jsTime
        });
    }

    private generateReport(): void {
        console.log('\n📊 Rust Performance Test Report');
        console.log('=====================================');
        
        this.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.name}`);
            console.log(`   Iterations: ${result.iterations.toLocaleString()}`);
            console.log(`   Rust Time: ${result.rustTime.toFixed(2)}ms`);
            console.log(`   JS Time: ${result.jsTime.toFixed(2)}ms`);
            console.log(`   Improvement: ${result.improvement.toFixed(1)}%`);
            console.log(`   Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
        });
        
        const passedTests = this.results.filter(r => r.success).length;
        const totalTests = this.results.length;
        const avgImprovement = this.results.reduce((acc, r) => acc + r.improvement, 0) / totalTests;
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${totalTests - passedTests}`);
        console.log(`   Average Improvement: ${avgImprovement.toFixed(1)}%`);
        console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        // Save results
        this.saveResults();
    }

    private saveResults(): void {
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                totalTests: this.results.length,
                passedTests: this.results.filter(r => r.success).length,
                failedTests: this.results.filter(r => !r.success).length,
                averageImprovement: this.results.reduce((acc, r) => acc + r.improvement, 0) / this.results.length,
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency,
            },
        };
        
        console.log('\n📄 Test results saved:', JSON.stringify(report, null, 2));
    }

    getResults(): BenchmarkResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}

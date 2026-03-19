import { RustTesting, TestConfig, TestStatus } from '../rust-wrappers/RustTesting';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustTestingTest {
    private rustTesting: RustTesting;
    private results: TestResult[] = [];

    constructor() {
        this.rustTesting = new RustTesting();
    }

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting Rust Testing Framework Tests...');
        console.log('===========================================');
        
        try {
            await this.testInitialization();
            await this.testBasicOperations();
            await this.testBasicTests();
            await this.testIntegrationTests();
            await this.testPerformanceTests();
            await this.testTestSuites();
            await this.testTestReporting();
            await this.testTestAnalysis();
            await this.testTestPresets();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Testing test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Testing Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Testing Initialization';
        const start = performance.now();
        
        try {
            const config = RustTesting.createTestConfig({
                enablePerformanceTests: true,
                enableIntegrationTests: true,
                verboseLogging: true,
            });
            
            await this.rustTesting.initialize(config);
            
            if (!this.rustTesting.isInitialized()) {
                throw new Error('Rust Testing not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.rustTesting.getConfig();
            if (!retrievedConfig.enablePerformanceTests || !retrievedConfig.enableIntegrationTests) {
                throw new Error('Config not set correctly');
            }
            
            this.addResult(testName, 'pass', 'Rust Testing initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicOperations(): Promise<void> {
        const testName = 'Basic Testing Operations';
        const start = performance.now();
        
        try {
            // Test config update
            const newConfig = RustTesting.createTestConfig({
                enablePerformanceTests: false,
                enableIntegrationTests: false,
                verboseLogging: false,
            });
            
            this.rustTesting.updateConfig(newConfig);
            const updatedConfig = this.rustTesting.getConfig();
            
            if (updatedConfig.enablePerformanceTests || updatedConfig.enableIntegrationTests) {
                throw new Error('Config update failed');
            }
            
            // Test result clearing
            this.rustTesting.clearResults();
            
            // Test report generation
            const report = this.rustTesting.generateReport();
            if (!report.suites || report.totalTests === undefined) {
                throw new Error('Report generation failed');
            }
            
            this.addResult(testName, 'pass', 'Basic testing operations work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBasicTests(): Promise<void> {
        const testName = 'Basic Test Execution';
        const start = performance.now();
        
        try {
            // Enable basic tests
            const config = RustTesting.createTestConfig({
                enablePerformanceTests: false,
                enableIntegrationTests: false,
                verboseLogging: true,
            });
            
            this.rustTesting.updateConfig(config);
            
            // Run basic tests
            const suite = this.rustTesting.runBasicTests();
            
            if (!suite.name || suite.tests.length === 0) {
                throw new Error('Basic tests not executed');
            }
            
            // Check if basic tests contain expected tests
            const testNames = suite.tests.map(test => test.name);
            const expectedTests = ['WebAssembly Performance', 'Memory Allocation', 'Mathematical Operations'];
            
            for (const expectedTest of expectedTests) {
                if (!testNames.includes(expectedTest)) {
                    throw new Error(`Expected test "${expectedTest}" not found`);
                }
            }
            
            // Check test results structure
            for (const test of suite.tests) {
                if (!test.name || test.status === undefined || !test.message) {
                    throw new Error('Test result structure invalid');
                }
            }
            
            this.addResult(testName, 'pass', 'Basic test execution works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Basic test execution failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testIntegrationTests(): Promise<void> {
        const testName = 'Integration Test Execution';
        const start = performance.now();
        
        try {
            // Enable integration tests
            const config = RustTesting.createTestConfig({
                enablePerformanceTests: false,
                enableIntegrationTests: true,
                verboseLogging: true,
            });
            
            this.rustTesting.updateConfig(config);
            
            // Run integration tests
            const suite = this.rustTesting.runIntegrationTests();
            
            if (!suite.name || suite.tests.length === 0) {
                throw new Error('Integration tests not executed');
            }
            
            // Check if integration tests contain expected tests
            const testNames = suite.tests.map(test => test.name);
            const expectedTests = ['TypeScript Integration', 'WebAssembly Bindings', 'Console Logging'];
            
            for (const expectedTest of expectedTests) {
                if (!testNames.includes(expectedTest)) {
                    throw new Error(`Expected integration test "${expectedTest}" not found`);
                }
            }
            
            // Check test results
            for (const test of suite.tests) {
                if (test.status === TestStatus.Failed) {
                    console.warn(`Integration test failed: ${test.name} - ${test.message}`);
                }
            }
            
            this.addResult(testName, 'pass', 'Integration test execution works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Integration test execution failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceTests(): Promise<void> {
        const testName = 'Performance Test Execution';
        const start = performance.now();
        
        try {
            // Enable performance tests
            const config = RustTesting.createTestConfig({
                enablePerformanceTests: true,
                enableIntegrationTests: false,
                verboseLogging: true,
            });
            
            this.rustTesting.updateConfig(config);
            
            // Run performance tests
            const suite = this.rustTesting.runPerformanceTests();
            
            if (!suite.name || suite.tests.length === 0) {
                throw new Error('Performance tests not executed');
            }
            
            // Check if performance tests contain expected tests
            const testNames = suite.tests.map(test => test.name);
            const expectedTests = ['CPU Performance', 'Memory Performance'];
            
            for (const expectedTest of expectedTests) {
                if (!testNames.includes(expectedTest)) {
                    throw new Error(`Expected performance test "${expectedTest}" not found`);
                }
            }
            
            // Check performance test results
            for (const test of suite.tests) {
                if (test.duration <= 0) {
                    throw new Error(`Performance test "${test.name}" has invalid duration: ${test.duration}`);
                }
                
                if (test.status === TestStatus.Failed) {
                    console.warn(`Performance test failed: ${test.name} - ${test.message}`);
                }
            }
            
            this.addResult(testName, 'pass', 'Performance test execution works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Performance test execution failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTestSuites(): Promise<void> {
        const testName = 'Test Suite Management';
        const start = performance.now();
        
        try {
            // Enable all tests
            const config = RustTesting.createTestConfig({
                enablePerformanceTests: true,
                enableIntegrationTests: true,
                verboseLogging: false, // Reduce noise for this test
            });
            
            this.rustTesting.updateConfig(config);
            
            // Run all tests
            const report = this.rustTesting.runAllTests();
            
            if (!report.suites || report.suites.length === 0) {
                throw new Error('No test suites found in report');
            }
            
            // Check if all expected suites are present
            const suiteNames = report.suites.map(suite => suite.name);
            const expectedSuites = ['Basic System Tests', 'Integration Tests', 'Performance Tests'];
            
            for (const expectedSuite of expectedSuites) {
                if (!suiteNames.includes(expectedSuite)) {
                    throw new Error(`Expected test suite "${expectedSuite}" not found`);
                }
            }
            
            // Check suite structure
            for (const suite of report.suites) {
                if (!suite.name || suite.tests === undefined || suite.passedCount === undefined) {
                    throw new Error('Test suite structure invalid');
                }
                
                // Check test counts consistency
                const totalTests = suite.passedCount + suite.failedCount + suite.skippedCount + suite.warningCount;
                if (totalTests !== suite.tests.length) {
                    throw new Error(`Test count mismatch in suite "${suite.name}"`);
                }
            }
            
            this.addResult(testName, 'pass', 'Test suite management works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Test suite management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTestReporting(): Promise<void> {
        const testName = 'Test Reporting';
        const start = performance.now();
        
        try {
            // Run tests to get a report
            const report = this.rustTesting.runAllTests();
            
            // Check report structure
            if (report.timestamp === undefined || report.totalTests === undefined) {
                throw new Error('Report structure invalid');
            }
            
            // Check report calculations
            const calculatedTotal = report.suites.reduce((sum, suite) => sum + suite.tests.length, 0);
            if (calculatedTotal !== report.totalTests) {
                throw new Error('Total test count calculation incorrect');
            }
            
            const calculatedPassed = report.suites.reduce((sum, suite) => sum + suite.passedCount, 0);
            if (calculatedPassed !== report.totalPassed) {
                throw new Error('Total passed count calculation incorrect');
            }
            
            // Check success rate calculation
            const expectedSuccessRate = report.totalTests > 0 ? (report.totalPassed / report.totalTests) * 100 : 0;
            if (Math.abs(report.overallSuccessRate - expectedSuccessRate) > 0.1) {
                throw new Error('Success rate calculation incorrect');
            }
            
            // Test detailed report generation
            const detailedReport = this.rustTesting.generateDetailedReport(report);
            if (!detailedReport || detailedReport.length === 0) {
                throw new Error('Detailed report generation failed');
            }
            
            // Test export functionality
            const jsonExport = this.rustTesting.exportTestResults(report, 'json');
            const csvExport = this.rustTesting.exportTestResults(report, 'csv');
            
            if (!jsonExport || !csvExport) {
                throw new Error('Export functionality failed');
            }
            
            // Parse JSON export to verify structure
            const parsedExport = JSON.parse(jsonExport);
            if (!parsedExport.suites || !parsedExport.totalTests) {
                throw new Error('JSON export structure invalid');
            }
            
            this.addResult(testName, 'pass', 'Test reporting works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Test reporting failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTestAnalysis(): Promise<void> {
        const testName = 'Test Analysis';
        const start = performance.now();
        
        try {
            // Run tests to get a report
            const report = this.rustTesting.runAllTests();
            
            // Analyze test results
            const analysis = this.rustTesting.analyzeTestResults(report);
            
            // Check analysis structure
            if (!analysis.summary || !analysis.slowestTests || !analysis.recommendations) {
                throw new Error('Analysis structure invalid');
            }
            
            // Check summary calculations
            if (analysis.summary.totalTests !== report.totalTests) {
                throw new Error('Analysis summary total tests incorrect');
            }
            
            if (analysis.summary.passedTests !== report.totalPassed) {
                throw new Error('Analysis summary passed tests incorrect');
            }
            
            // Check slowest tests sorting
            if (analysis.slowestTests.length > 1) {
                for (let i = 0; i < analysis.slowestTests.length - 1; i++) {
                    if (analysis.slowestTests[i].duration < analysis.slowestTests[i + 1].duration) {
                        throw new Error('Slowest tests not sorted correctly');
                    }
                }
            }
            
            // Check fastest tests sorting
            if (analysis.fastestTests.length > 1) {
                for (let i = 0; i < analysis.fastestTests.length - 1; i++) {
                    if (analysis.fastestTests[i].duration > analysis.fastestTests[i + 1].duration) {
                        throw new Error('Fastest tests not sorted correctly');
                    }
                }
            }
            
            // Check failed tests filtering
            const failedTests = analysis.failedTests;
            for (const test of failedTests) {
                if (test.status !== TestStatus.Failed) {
                    throw new Error('Failed tests analysis includes non-failed test');
                }
            }
            
            // Check recommendations generation
            if (analysis.recommendations.length === 0 && analysis.summary.successRate < 100) {
                console.warn('No recommendations generated for imperfect test results');
            }
            
            this.addResult(testName, 'pass', 'Test analysis works correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Test analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTestPresets(): Promise<void> {
        const testName = 'Test Configuration Presets';
        const start = performance.now();
        
        try {
            // Test quick test preset
            const quickConfig = RustTesting.createQuickTestConfig();
            if (quickConfig.enablePerformanceTests || quickConfig.enableIntegrationTests === false) {
                throw new Error('Quick test preset incorrect');
            }
            
            await this.rustTesting.initialize(quickConfig);
            const quickReport = this.rustTesting.runAllTests();
            
            // Quick test should have fewer tests
            if (quickReport.totalTests > 10) {
                console.warn('Quick test may have too many tests');
            }
            
            // Test comprehensive test preset
            const comprehensiveConfig = RustTesting.createComprehensiveTestConfig();
            if (!comprehensiveConfig.enablePerformanceTests || comprehensiveConfig.enableIntegrationTests === false) {
                throw new Error('Comprehensive test preset incorrect');
            }
            
            await this.rustTesting.initialize(comprehensiveConfig);
            const comprehensiveReport = this.rustTesting.runAllTests();
            
            // Comprehensive test should have more tests than quick test
            if (comprehensiveReport.totalTests <= quickReport.totalTests) {
                throw new Error('Comprehensive test should have more tests than quick test');
            }
            
            // Test performance test preset
            const performanceConfig = RustTesting.createPerformanceTestConfig();
            if (!performanceConfig.enablePerformanceTests || performanceConfig.enableIntegrationTests) {
                throw new Error('Performance test preset incorrect');
            }
            
            await this.rustTesting.initialize(performanceConfig);
            const performanceReport = this.rustTesting.runAllTests();
            
            // Performance test should have performance tests
            const hasPerformanceTests = performanceReport.suites.some(suite => 
                suite.name.includes('Performance')
            );
            if (!hasPerformanceTests) {
                throw new Error('Performance test preset should include performance tests');
            }
            
            // Test integration test preset
            const integrationConfig = RustTesting.createIntegrationTestConfig();
            if (integrationConfig.enablePerformanceTests || !integrationConfig.enableIntegrationTests) {
                throw new Error('Integration test preset incorrect');
            }
            
            await this.rustTesting.initialize(integrationConfig);
            const integrationReport = this.rustTesting.runAllTests();
            
            // Integration test should have integration tests
            const hasIntegrationTests = integrationReport.suites.some(suite => 
                suite.name.includes('Integration')
            );
            if (!hasIntegrationTests) {
                throw new Error('Integration test preset should include integration tests');
            }
            
            this.addResult(testName, 'pass', 'Test configuration presets work correctly', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Test configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n📊 Rust Testing Test Report');
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
        const basicTest = this.results.find(r => r.name === 'Basic Test Execution');
        if (basicTest && basicTest.details) {
            console.log(`\n🚀 Performance Summary:`);
            console.log(`   Basic Tests: ${basicTest.details.duration || 'N/A'}ms`);
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

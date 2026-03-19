import init, { RustTestFrameworkExport, create_test_config } from '../../../pkg/procedural_pixel_engine_core.js';

export interface TestResult {
    name: string;
    status: TestStatus;
    message: string;
    duration: number;
    details?: string;
}

export enum TestStatus {
    Passed = 0,
    Failed = 1,
    Skipped = 2,
    Warning = 3,
}

export interface TestSuite {
    name: string;
    tests: TestResult[];
    totalDuration: number;
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    warningCount: number;
    successRate: number;
}

export interface TestReport {
    timestamp: number;
    suites: TestSuite[];
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    totalWarnings: number;
    overallSuccessRate: number;
    totalDuration: number;
}

export interface TestConfig {
    enablePerformanceTests: boolean;
    enableStressTests: boolean;
    enableIntegrationTests: boolean;
    testTimeout: number;
    maxTestDuration: number;
    parallelExecution: boolean;
    verboseLogging: boolean;
    generateReports: boolean;
}

export class RustTesting {
    private wasmModule: RustTestFrameworkExport | null = null;
    private initialized = false;

    async initialize(config: TestConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustTestFrameworkExport(config);
            this.initialized = true;
            console.log('🦀 Rust Testing Framework initialized');
        }
    }

    updateConfig(config: TestConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): TestConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            enablePerformanceTests: config.enable_performance_tests,
            enableStressTests: config.enable_stress_tests,
            enableIntegrationTests: config.enable_integration_tests,
            testTimeout: config.test_timeout,
            maxTestDuration: config.max_test_duration,
            parallelExecution: config.parallel_execution,
            verboseLogging: config.verbose_logging,
            generateReports: config.generate_reports,
        };
    }

    runAllTests(): TestReport {
        this.ensureInitialized();
        const report = this.wasmModule!.run_all_tests();
        return {
            timestamp: report.timestamp,
            suites: report.suites.map((suite: any) => ({
                name: suite.name,
                tests: suite.tests.map((test: any) => ({
                    name: test.name,
                    status: test.status,
                    message: test.message,
                    duration: test.duration,
                    details: test.details,
                })),
                totalDuration: suite.total_duration,
                passedCount: suite.passed_count,
                failedCount: suite.failed_count,
                skippedCount: suite.skipped_count,
                warningCount: suite.warning_count,
                successRate: suite.success_rate,
            })),
            totalTests: report.total_tests,
            totalPassed: report.total_passed,
            totalFailed: report.total_failed,
            totalSkipped: report.total_skipped,
            totalWarnings: report.total_warnings,
            overallSuccessRate: report.overall_success_rate,
            totalDuration: report.total_duration,
        };
    }

    runBasicTests(): TestSuite {
        this.ensureInitialized();
        const suite = this.wasmModule!.run_basic_tests();
        return {
            name: suite.name,
            tests: suite.tests.map((test: any) => ({
                name: test.name,
                status: test.status,
                message: test.message,
                duration: test.duration,
                details: test.details,
            })),
            totalDuration: suite.total_duration,
            passedCount: suite.passed_count,
            failedCount: suite.failed_count,
            skippedCount: suite.skipped_count,
            warningCount: suite.warning_count,
            successRate: suite.success_rate,
        };
    }

    runIntegrationTests(): TestSuite {
        this.ensureInitialized();
        const suite = this.wasmModule!.run_integration_tests();
        return {
            name: suite.name,
            tests: suite.tests.map((test: any) => ({
                name: test.name,
                status: test.status,
                message: test.message,
                duration: test.duration,
                details: test.details,
            })),
            totalDuration: suite.total_duration,
            passedCount: suite.passed_count,
            failedCount: suite.failed_count,
            skippedCount: suite.skipped_count,
            warningCount: suite.warning_count,
            successRate: suite.success_rate,
        };
    }

    runPerformanceTests(): TestSuite {
        this.ensureInitialized();
        const suite = this.wasmModule!.run_performance_tests();
        return {
            name: suite.name,
            tests: suite.tests.map((test: any) => ({
                name: test.name,
                status: test.status,
                message: test.message,
                duration: test.duration,
                details: test.details,
            })),
            totalDuration: suite.total_duration,
            passedCount: suite.passed_count,
            failedCount: suite.failed_count,
            skippedCount: suite.skipped_count,
            warningCount: suite.warning_count,
            successRate: suite.success_rate,
        };
    }

    clearResults(): void {
        this.ensureInitialized();
        this.wasmModule!.clear_results();
    }

    generateReport(): TestReport {
        this.ensureInitialized();
        const report = this.wasmModule!.generate_report();
        return {
            timestamp: report.timestamp,
            suites: report.suites.map((suite: any) => ({
                name: suite.name,
                tests: suite.tests.map((test: any) => ({
                    name: test.name,
                    status: test.status,
                    message: test.message,
                    duration: test.duration,
                    details: test.details,
                })),
                totalDuration: suite.total_duration,
                passedCount: suite.passed_count,
                failedCount: suite.failed_count,
                skippedCount: suite.skipped_count,
                warningCount: suite.warning_count,
                successRate: suite.success_rate,
            })),
            totalTests: report.total_tests,
            totalPassed: report.total_passed,
            totalFailed: report.total_failed,
            totalSkipped: report.total_skipped,
            totalWarnings: report.total_warnings,
            overallSuccessRate: report.overall_success_rate,
            totalDuration: report.total_duration,
        };
    }

    // Utility methods for creating configurations
    static createTestConfig(config: Partial<TestConfig>): TestConfig {
        return {
            enablePerformanceTests: config.enablePerformanceTests !== undefined ? config.enablePerformanceTests : true,
            enableStressTests: config.enableStressTests !== undefined ? config.enableStressTests : false,
            enableIntegrationTests: config.enableIntegrationTests !== undefined ? config.enableIntegrationTests : true,
            testTimeout: config.testTimeout || 5000.0,
            maxTestDuration: config.maxTestDuration || 30000.0,
            parallelExecution: config.parallelExecution !== undefined ? config.parallelExecution : false,
            verboseLogging: config.verboseLogging !== undefined ? config.verboseLogging : true,
            generateReports: config.generateReports !== undefined ? config.generateReports : true,
        };
    }

    // Test configuration presets
    static createQuickTestConfig(): TestConfig {
        return RustTesting.createTestConfig({
            enablePerformanceTests: false,
            enableStressTests: false,
            enableIntegrationTests: true,
            testTimeout: 1000.0,
            maxTestDuration: 5000.0,
            parallelExecution: false,
            verboseLogging: false,
            generateReports: false,
        });
    }

    static createComprehensiveTestConfig(): TestConfig {
        return RustTesting.createTestConfig({
            enablePerformanceTests: true,
            enableStressTests: false,
            enableIntegrationTests: true,
            testTimeout: 10000.0,
            maxTestDuration: 60000.0,
            parallelExecution: false,
            verboseLogging: true,
            generateReports: true,
        });
    }

    static createPerformanceTestConfig(): TestConfig {
        return RustTesting.createTestConfig({
            enablePerformanceTests: true,
            enableStressTests: false,
            enableIntegrationTests: false,
            testTimeout: 30000.0,
            maxTestDuration: 120000.0,
            parallelExecution: false,
            verboseLogging: true,
            generateReports: true,
        });
    }

    static createIntegrationTestConfig(): TestConfig {
        return RustTesting.createTestConfig({
            enablePerformanceTests: false,
            enableStressTests: false,
            enableIntegrationTests: true,
            testTimeout: 5000.0,
            maxTestDuration: 15000.0,
            parallelExecution: false,
            verboseLogging: true,
            generateReports: true,
        });
    }

    // Test analysis methods
    analyzeTestResults(report: TestReport): {
        summary: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
            skippedTests: number;
            warningTests: number;
            successRate: number;
            totalDuration: number;
            averageTestDuration: number;
        };
        slowestTests: TestResult[];
        fastestTests: TestResult[];
        failedTests: TestResult[];
        performanceAnalysis: {
            cpuTests: TestResult[];
            memoryTests: TestResult[];
            integrationTests: TestResult[];
        };
        recommendations: string[];
    } {
        const allTests = report.suites.flatMap(suite => suite.tests);
        
        const summary = {
            totalTests: report.totalTests,
            passedTests: report.totalPassed,
            failedTests: report.totalFailed,
            skippedTests: report.totalSkipped,
            warningTests: report.totalWarnings,
            successRate: report.overallSuccessRate,
            totalDuration: report.totalDuration,
            averageTestDuration: report.totalTests > 0 ? report.totalDuration / report.totalTests : 0,
        };

        const sortedTests = allTests.sort((a, b) => b.duration - a.duration);
        const slowestTests = sortedTests.slice(0, 5);
        const fastestTests = sortedTests.slice(-5).reverse();
        const failedTests = allTests.filter(test => test.status === TestStatus.Failed);

        const performanceAnalysis = {
            cpuTests: allTests.filter(test => test.name.includes('CPU')),
            memoryTests: allTests.filter(test => test.name.includes('Memory')),
            integrationTests: allTests.filter(test => test.name.includes('Integration')),
        };

        const recommendations: string[] = [];
        
        if (summary.successRate < 90) {
            recommendations.push('Success rate is below 90%, review failed tests');
        }
        
        if (summary.averageTestDuration > 1000) {
            recommendations.push('Average test duration is high, consider optimizing test performance');
        }
        
        if (failedTests.length > 0) {
            recommendations.push(`${failedTests.length} tests failed, review error messages`);
        }
        
        const slowTests = allTests.filter(test => test.duration > 5000);
        if (slowTests.length > 0) {
            recommendations.push(`${slowTests.length} tests are slow (>5s), consider optimization`);
        }

        return {
            summary,
            slowestTests,
            fastestTests,
            failedTests,
            performanceAnalysis,
            recommendations,
        };
    }

    // Test execution methods
    async runQuickTest(): Promise<TestReport> {
        const config = RustTesting.createQuickTestConfig();
        await this.initialize(config);
        return this.runAllTests();
    }

    async runComprehensiveTest(): Promise<TestReport> {
        const config = RustTesting.createComprehensiveTestConfig();
        await this.initialize(config);
        return this.runAllTests();
    }

    async runPerformanceTest(): Promise<TestReport> {
        const config = RustTesting.createPerformanceTestConfig();
        await this.initialize(config);
        return this.runAllTests();
    }

    async runIntegrationTest(): Promise<TestReport> {
        const config = RustTesting.createIntegrationTestConfig();
        await this.initialize(config);
        return this.runAllTests();
    }

    // Test reporting methods
    generateDetailedReport(report: TestReport): string {
        const analysis = this.analyzeTestResults(report);
        
        let reportText = `🧪 Rust Testing Framework Report
Generated: ${new Date(report.timestamp).toISOString()}

📊 Summary:
- Total Tests: ${analysis.summary.totalTests}
- Passed: ${analysis.summary.passedTests}
- Failed: ${analysis.summary.failedTests}
- Skipped: ${analysis.summary.skippedTests}
- Warnings: ${analysis.summary.warningTests}
- Success Rate: ${analysis.summary.successRate.toFixed(1)}%
- Total Duration: ${analysis.summary.totalDuration.toFixed(2)}ms
- Average Duration: ${analysis.summary.averageTestDuration.toFixed(2)}ms

🐌 Slowest Tests:
${analysis.slowestTests.map((test, i) => `${i + 1}. ${test.name}: ${test.duration.toFixed(2)}ms`).join('\n')}

⚡ Fastest Tests:
${analysis.fastestTests.map((test, i) => `${i + 1}. ${test.name}: ${test.duration.toFixed(2)}ms`).join('\n')}

❌ Failed Tests:
${analysis.failedTests.map((test, i) => `${i + 1}. ${test.name}: ${test.message}`).join('\n') || 'No failed tests'}

💡 Recommendations:
${analysis.recommendations.map(rec => `- ${rec}`).join('\n') || 'No recommendations'}

📋 Test Suites:
${report.suites.map(suite => `
${suite.name}:
- Tests: ${suite.tests.length}
- Passed: ${suite.passedCount}
- Failed: ${suite.failedCount}
- Success Rate: ${suite.successRate.toFixed(1)}%
- Duration: ${suite.totalDuration.toFixed(2)}ms
`).join('\n')}
`;

        return reportText;
    }

    exportTestResults(report: TestReport, format: 'json' | 'csv' = 'json'): string {
        if (format === 'json') {
            return JSON.stringify(report, null, 2);
        } else if (format === 'csv') {
            const headers = ['Test Name', 'Status', 'Message', 'Duration (ms)', 'Suite'];
            const rows = report.suites.flatMap(suite => 
                suite.tests.map(test => [
                    test.name,
                    TestStatus[test.status],
                    test.message,
                    test.duration.toString(),
                    suite.name
                ])
            );
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        
        return JSON.stringify(report, null, 2);
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Testing Framework not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

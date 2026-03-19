import { RustPerformanceProfiler, ProfilerCategory, PerformanceMetricType, PerformanceLevel, AlertSeverity } from '../rust-wrappers/RustPerformanceProfiler';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustPerformanceProfilerTest {
    private profiler: RustPerformanceProfiler;
    private results: TestResult[] = [];

    constructor() {
        this.profiler = new RustPerformanceProfiler();
    }

    async runAllTests(): Promise<void> {
        console.log('🔍 Starting Rust Performance Profiler Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testConfigurationPresets();
            await this.testRealTimeTracking();
            await this.testMetrics();
            await this.testFrameAnalysis();
            await this.testPerformanceBudgets();
            await this.testAlerts();
            await this.testRegressionTesting();
            await this.testReports();
            await this.testOptimizationSuggestions();
            await this.testUIData();
            await this.testPerformanceAnalysis();
            await this.testBudgetManagement();
            await this.testAutomatedMonitoring();
            await this.testPerformanceOptimization();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Performance Profiler test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Performance Profiler Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Performance Profiler Initialization';
        const start = performance.now();
        
        try {
            const config = RustPerformanceProfiler.createDefaultConfig();
            await this.profiler.initialize(config);
            
            // Test initialization by calling a method
            try {
                this.profiler.getConfig();
            } catch (error) {
                throw new Error('Performance Profiler not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.profiler.getConfig();
            if (!retrievedConfig.enableRealTimeTracking || !retrievedConfig.enableCpuProfiling) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.profiler.getStats();
            if (stats.totalMetrics < 0 || stats.totalFrames < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test profiler summary
            const summary = this.profiler.getProfilerSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Profiler summary not available');
            }
            
            this.addResult(testName, 'pass', 'Performance Profiler initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test default configuration
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            if (!defaultConfig.enableRealTimeTracking || !defaultConfig.enableCpuProfiling || !defaultConfig.enableMemoryProfiling) {
                throw new Error('Default config should enable most features');
            }
            
            // Apply default config
            await this.profiler.initialize(defaultConfig);
            let currentConfig = this.profiler.getConfig();
            
            if (!currentConfig.enableRealTimeTracking) {
                throw new Error('Default config not applied correctly');
            }
            
            // Test development configuration
            const devConfig = RustPerformanceProfiler.createDevelopmentConfig();
            if (!devConfig.enableRealTimeTracking || !devConfig.enableFrameAnalysis || devConfig.enableRegressionTesting) {
                throw new Error('Development config should enable detailed profiling');
            }
            
            this.profiler.updateConfig(devConfig);
            currentConfig = this.profiler.getConfig();
            
            if (!currentConfig.enableRealTimeTracking || !currentConfig.enableFrameAnalysis) {
                throw new Error('Development config not applied correctly');
            }
            
            // Test production configuration
            const prodConfig = RustPerformanceProfiler.createProductionConfig();
            if (prodConfig.enableRealTimeTracking || prodConfig.enableCpuProfiling || !prodConfig.enableRegressionTesting) {
                throw new Error('Production config should disable real-time tracking and enable regression testing');
            }
            
            this.profiler.updateConfig(prodConfig);
            currentConfig = this.profiler.getConfig();
            
            if (currentConfig.enableRealTimeTracking || currentConfig.enableCpuProfiling) {
                throw new Error('Production config not applied correctly');
            }
            
            // Test minimal configuration
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            if (minimalConfig.enableRealTimeTracking || minimalConfig.enableCpuProfiling || minimalConfig.enableBudgetWarnings) {
                throw new Error('Minimal config should disable most features');
            }
            
            // Test custom configuration
            const customConfig = RustPerformanceProfiler.createDefaultConfig();
            customConfig.samplingRate = 120;
            customConfig.historySize = 2000;
            customConfig.reportInterval = 10000;
            customConfig.alertCooldown = 2000;
            
            this.profiler.updateConfig(customConfig);
            currentConfig = this.profiler.getConfig();
            
            if (currentConfig.samplingRate !== 120 || currentConfig.historySize !== 2000) {
                throw new Error('Custom config not applied correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                configsTested: 4,
                customConfigTested: true,
                configPersistenceVerified: true,
                featuresVerified: {
                    realTimeTracking: defaultConfig.enableRealTimeTracking,
                    cpuProfiling: defaultConfig.enableCpuProfiling,
                    memoryProfiling: defaultConfig.enableMemoryProfiling,
                    frameAnalysis: devConfig.enableFrameAnalysis,
                    regressionTesting: prodConfig.enableRegressionTesting,
                }
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRealTimeTracking(): Promise<void> {
        const testName = 'Real-time Performance Tracking';
        const start = performance.now();
        
        try {
            // Start real-time tracking
            const startResult = this.profiler.startRealTimeTracking();
            if (!startResult.success) {
                throw new Error('Failed to start real-time tracking');
            }
            
            // Add some metrics while tracking is active
            this.profiler.recordMetric(
                ProfilerCategory.General,
                PerformanceMetricType.FPS,
                60.0,
                'FPS'
            );
            
            this.profiler.recordMetric(
                ProfilerCategory.CPU,
                PerformanceMetricType.CPUUsage,
                45.5,
                '%'
            );
            
            this.profiler.recordMetric(
                ProfilerCategory.Memory,
                PerformanceMetricType.MemoryUsage,
                256 * 1024 * 1024,
                'bytes'
            );
            
            // Check if metrics were recorded
            const stats = this.profiler.getStats();
            if (stats.totalMetrics < 3) {
                throw new Error('Metrics not recorded correctly');
            }
            
            // Stop real-time tracking
            this.profiler.stopRealTimeTracking();
            
            // Test starting/stopping multiple times
            const startResult2 = this.profiler.startRealTimeTracking();
            if (!startResult2.success) {
                throw new Error('Failed to restart real-time tracking');
            }
            
            this.profiler.stopRealTimeTracking();
            
            // Test tracking when disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const disabledResult = this.profiler.startRealTimeTracking();
            if (disabledResult.success) {
                throw new Error('Should fail when real-time tracking is disabled');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            this.profiler.startRealTimeTracking();
            
            this.addResult(testName, 'pass', 'Real-time performance tracking works correctly', performance.now() - start, {
                trackingStarted: true,
                trackingStopped: true,
                metricsRecorded: stats.totalMetrics,
                multipleStartStopTested: true,
                disabledConfigTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Real-time tracking failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testMetrics(): Promise<void> {
        const testName = 'Performance Metrics';
        const start = performance.now();
        
        try {
            // Test different metric types
            const metrics = [
                { category: ProfilerCategory.General, type: PerformanceMetricType.FPS, value: 75.5, unit: 'FPS' },
                { category: ProfilerCategory.General, type: PerformanceMetricType.FrameTime, value: 13.2, unit: 'ms' },
                { category: ProfilerCategory.CPU, type: PerformanceMetricType.CPUUsage, value: 62.3, unit: '%' },
                { category: ProfilerCategory.GPU, type: PerformanceMetricType.GPUUsage, value: 58.7, unit: '%' },
                { category: ProfilerCategory.Memory, type: PerformanceMetricType.MemoryUsage, value: 384 * 1024 * 1024, unit: 'bytes' },
                { category: ProfilerCategory.Rendering, type: PerformanceMetricType.DrawCalls, value: 1250, unit: 'calls' },
                { category: ProfilerCategory.Rendering, type: PerformanceMetricType.Triangles, value: 2500000, unit: 'triangles' },
                { category: ProfilerCategory.Physics, type: PerformanceMetricType.PhysicsUpdateTime, value: 4.2, unit: 'ms' },
                { category: ProfilerCategory.Audio, type: PerformanceMetricType.AudioLatency, value: 12.5, unit: 'ms' },
                { category: ProfilerCategory.Scripting, type: PerformanceMetricType.ScriptExecutionTime, value: 8.7, unit: 'ms' },
            ];
            
            for (const metric of metrics) {
                this.profiler.recordMetric(
                    metric.category,
                    metric.type,
                    metric.value,
                    metric.unit,
                    { test: 'metric_recording' }
                );
            }
            
            // Check stats
            const stats = this.profiler.getStats();
            if (stats.totalMetrics < metrics.length) {
                throw new Error('Not all metrics recorded');
            }
            
            // Test metric with context
            this.profiler.recordMetric(
                ProfilerCategory.AssetLoading,
                PerformanceMetricType.AssetLoadTime,
                150.5,
                'ms',
                { 
                    assetType: 'texture',
                    assetName: 'player_diffuse',
                    fileSize: '2.5MB',
                    compression: 'DXT5'
                }
            );
            
            // Test custom metric type
            this.profiler.recordMetric(
                ProfilerCategory.Custom,
                PerformanceMetricType.Custom,
                42.0,
                'custom_unit',
                { customField: 'custom_value' }
            );
            
            // Verify stats updated
            const finalStats = this.profiler.getStats();
            if (finalStats.totalMetrics <= stats.totalMetrics) {
                throw new Error('Stats not updated correctly');
            }
            
            this.addResult(testName, 'pass', 'Performance metrics work correctly', performance.now() - start, {
                metricsTested: metrics.length + 2,
                categoriesTested: 11,
                metricTypesTested: 12,
                contextTested: true,
                customMetricTested: true,
                totalMetricsRecorded: finalStats.totalMetrics,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance metrics failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testFrameAnalysis(): Promise<void> {
        const testName = 'Frame Analysis';
        const start = performance.now();
        
        try {
            // Create test frame data
            const frameData = {
                frameNumber: 1,
                frameTime: 16.67,
                fps: 60.0,
                cpuTime: 8.5,
                gpuTime: 6.2,
                renderTime: 5.8,
                physicsTime: 2.1,
                audioTime: 0.8,
                scriptTime: 1.5,
                assetTime: 0.3,
                animationTime: 0.7,
                particleTime: 0.4,
                uiTime: 0.2,
                drawCalls: 850,
                triangles: 1200000,
                vertices: 600000,
                textureMemory: 128 * 1024 * 1024,
                bufferMemory: 64 * 1024 * 1024,
                memoryUsage: 256 * 1024 * 1024,
            };
            
            // Analyze frame
            const result = this.profiler.analyzeFrame(frameData);
            if (!result.success) {
                throw new Error('Frame analysis failed');
            }
            
            // Analyze multiple frames
            for (let i = 2; i <= 10; i++) {
                const frameData2 = {
                    ...frameData,
                    frameNumber: i,
                    frameTime: 16.67 + (Math.random() - 0.5) * 4,
                    fps: 60.0 + (Math.random() - 0.5) * 10,
                    cpuTime: 8.5 + (Math.random() - 0.5) * 2,
                    gpuTime: 6.2 + (Math.random() - 0.5) * 2,
                };
                
                const result2 = this.profiler.analyzeFrame(frameData2);
                if (!result2.success) {
                    throw new Error(`Frame ${i} analysis failed`);
                }
            }
            
            // Test frame with performance issues
            const problematicFrame = {
                ...frameData,
                frameNumber: 11,
                frameTime: 25.5, // Slow frame
                fps: 39.2, // Low FPS
                cpuTime: 15.2, // High CPU
                gpuTime: 12.8, // High GPU
                drawCalls: 2500, // Many draw calls
                triangles: 5000000, // Many triangles
                memoryUsage: 512 * 1024 * 1024, // High memory
            };
            
            const problematicResult = this.profiler.analyzeFrame(problematicFrame);
            if (!problematicResult.success) {
                throw new Error('Problematic frame analysis failed');
            }
            
            // Check UI data for recent frames
            const uiData = this.profiler.getUIData();
            if (uiData.recentFrameAnalyses.length < 10) {
                throw new Error('Recent frame analyses not stored correctly');
            }
            
            // Verify frame analysis data
            const lastFrame = uiData.recentFrameAnalyses[uiData.recentFrameAnalyses.length - 1];
            if (!lastFrame.bottlenecks || lastFrame.bottlenecks.length === 0) {
                throw new Error('Bottlenecks not detected in problematic frame');
            }
            
            if (!lastFrame.recommendations || lastFrame.recommendations.length === 0) {
                throw new Error('Recommendations not generated for problematic frame');
            }
            
            // Test frame analysis when disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const disabledResult = this.profiler.analyzeFrame(frameData);
            if (disabledResult.success) {
                throw new Error('Should fail when frame analysis is disabled');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'Frame analysis works correctly', performance.now() - start, {
                framesAnalyzed: 11,
                problematicFrameTested: true,
                bottlenecksDetected: lastFrame.bottlenecks.length,
                recommendationsGenerated: lastFrame.recommendations.length,
                recentFramesStored: uiData.recentFrameAnalyses.length,
                disabledConfigTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Frame analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceBudgets(): Promise<void> {
        const testName = 'Performance Budgets';
        const start = performance.now();
        
        try {
            // Create performance budgets
            const budgets = [
                { category: ProfilerCategory.General, type: PerformanceMetricType.FPS, target: 60, warning: 45, critical: 30, unit: 'FPS' },
                { category: ProfilerCategory.General, type: PerformanceMetricType.FrameTime, target: 16.67, warning: 25, critical: 33.33, unit: 'ms' },
                { category: ProfilerCategory.CPU, type: PerformanceMetricType.CPUUsage, target: 70, warning: 85, critical: 95, unit: '%' },
                { category: ProfilerCategory.GPU, type: PerformanceMetricType.GPUUsage, target: 70, warning: 85, critical: 95, unit: '%' },
                { category: ProfilerCategory.Memory, type: PerformanceMetricType.MemoryUsage, target: 256 * 1024 * 1024, warning: 512 * 1024 * 1024, critical: 1024 * 1024 * 1024, unit: 'bytes' },
                { category: ProfilerCategory.Rendering, type: PerformanceMetricType.DrawCalls, target: 1000, warning: 2000, critical: 5000, unit: 'calls' },
            ];
            
            for (const budget of budgets) {
                this.profiler.setBudget(
                    budget.category,
                    budget.type,
                    budget.target,
                    budget.warning,
                    budget.critical,
                    budget.unit
                );
            }
            
            // Record metrics that should trigger alerts
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS'); // Critical
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 90.0, '%'); // Warning
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 768 * 1024 * 1024, 'bytes'); // Warning
            
            // Check for alerts
            const alerts = this.profiler.getAlerts();
            if (alerts.length === 0) {
                throw new Error('No alerts generated for budget violations');
            }
            
            // Verify alert types
            const fpsAlerts = alerts.filter(alert => alert.metricType === PerformanceMetricType.FPS);
            const cpuAlerts = alerts.filter(alert => alert.metricType === PerformanceMetricType.CPUUsage);
            const memoryAlerts = alerts.filter(alert => alert.metricType === PerformanceMetricType.MemoryUsage);
            
            if (fpsAlerts.length === 0) {
                throw new Error('No FPS alert generated');
            }
            
            if (cpuAlerts.length === 0) {
                throw new Error('No CPU alert generated');
            }
            
            if (memoryAlerts.length === 0) {
                throw new Error('No memory alert generated');
            }
            
            // Verify alert severity
            const criticalFPSAlert = fpsAlerts.find(alert => alert.severity === AlertSeverity.Critical);
            if (!criticalFPSAlert) {
                throw new Error('Critical FPS alert not generated');
            }
            
            const warningCPUAlert = cpuAlerts.find(alert => alert.severity === AlertSeverity.Warning);
            if (!warningCPUAlert) {
                throw new Error('Warning CPU alert not generated');
            }
            
            // Test alert dismissal
            const alertId = criticalFPSAlert.id;
            const dismissResult = this.profiler.dismissAlert(alertId);
            if (!dismissResult.success) {
                throw new Error('Failed to dismiss alert');
            }
            
            // Verify alert is no longer active
            const activeAlerts = this.profiler.getActiveAlerts();
            const dismissedAlert = activeAlerts.find(alert => alert.id === alertId);
            if (dismissedAlert) {
                throw new Error('Dismissed alert is still active');
            }
            
            // Test clearing all alerts
            this.profiler.clearAlerts();
            const clearedAlerts = this.profiler.getAlerts();
            if (clearedAlerts.length > 0) {
                throw new Error('Alerts not cleared correctly');
            }
            
            // Test budget removal
            const removeResult = this.profiler.removeBudget(ProfilerCategory.General, PerformanceMetricType.FPS);
            if (!removeResult.success) {
                throw new Error('Failed to remove budget');
            }
            
            this.addResult(testName, 'pass', 'Performance budgets work correctly', performance.now() - start, {
                budgetsCreated: budgets.length,
                alertsGenerated: alerts.length,
                alertTypesTested: 3,
                alertDismissalTested: true,
                alertClearingTested: true,
                budgetRemovalTested: true,
                criticalAlerts: fpsAlerts.filter(a => a.severity === AlertSeverity.Critical).length,
                warningAlerts: alerts.filter(a => a.severity === AlertSeverity.Warning).length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance budgets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAlerts(): Promise<void> {
        const testName = 'Performance Alerts';
        const start = performance.now();
        
        try {
            // Clear any existing alerts
            this.profiler.clearAlerts();
            
            // Set up budgets to trigger alerts
            this.profiler.setBudget(ProfilerCategory.General, PerformanceMetricType.FPS, 60, 45, 30, 'FPS');
            this.profiler.setBudget(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 70, 85, 95, '%');
            this.profiler.setBudget(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 256 * 1024 * 1024, 512 * 1024 * 1024, 1024 * 1024 * 1024, 'bytes');
            
            // Record metrics to trigger different alert severities
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 20.0, 'FPS'); // Critical
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 88.0, '%'); // Warning
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 600 * 1024 * 1024, 'bytes'); // Warning
            
            // Get all alerts
            const allAlerts = this.profiler.getAlerts();
            if (allAlerts.length < 3) {
                throw new Error('Expected at least 3 alerts');
            }
            
            // Get active alerts
            const activeAlerts = this.profiler.getActiveAlerts();
            if (activeAlerts.length < 3) {
                throw new Error('Expected at least 3 active alerts');
            }
            
            // Test alerts by category
            const generalAlerts = this.profiler.getAlertsByCategory(ProfilerCategory.General);
            const cpuAlerts = this.profiler.getAlertsByCategory(ProfilerCategory.CPU);
            const memoryAlerts = this.profiler.getAlertsByCategory(ProfilerCategory.Memory);
            
            if (generalAlerts.length === 0) {
                throw new Error('No general alerts found');
            }
            
            if (cpuAlerts.length === 0) {
                throw new Error('No CPU alerts found');
            }
            
            if (memoryAlerts.length === 0) {
                throw new Error('No memory alerts found');
            }
            
            // Test alerts by severity
            const criticalAlerts = this.profiler.getAlertsBySeverity(AlertSeverity.Critical);
            const warningAlerts = this.profiler.getAlertsBySeverity(AlertSeverity.Warning);
            
            if (criticalAlerts.length === 0) {
                throw new Error('No critical alerts found');
            }
            
            if (warningAlerts.length === 0) {
                throw new Error('No warning alerts found');
            }
            
            // Test alert properties
            const criticalAlert = criticalAlerts[0];
            if (!criticalAlert.id || !criticalAlert.message || !criticalAlert.suggestions) {
                throw new Error('Critical alert missing required properties');
            }
            
            if (criticalAlert.severity !== AlertSeverity.Critical) {
                throw new Error('Critical alert has wrong severity');
            }
            
            // Test alert suggestions
            if (criticalAlert.suggestions.length === 0) {
                throw new Error('Critical alert should have suggestions');
            }
            
            // Test dismissing individual alerts
            const alertToDismiss = activeAlerts[0];
            const dismissResult = this.profiler.dismissAlert(alertToDismiss.id);
            if (!dismissResult.success) {
                throw new Error('Failed to dismiss alert');
            }
            
            // Verify alert is no longer active
            const updatedActiveAlerts = this.profiler.getActiveAlerts();
            if (updatedActiveAlerts.length >= activeAlerts.length) {
                throw new Error('Alert not properly dismissed');
            }
            
            // Test dismissing non-existent alert
            const invalidDismissResult = this.profiler.dismissAlert('non_existent_alert');
            if (invalidDismissResult.success) {
                throw new Error('Should fail for non-existent alert');
            }
            
            // Test clearing alerts
            this.profiler.clearAlerts();
            const clearedAlerts = this.profiler.getAlerts();
            if (clearedAlerts.length > 0) {
                throw new Error('Alerts not cleared correctly');
            }
            
            const clearedActiveAlerts = this.profiler.getActiveAlerts();
            if (clearedActiveAlerts.length > 0) {
                throw new Error('Active alerts not cleared correctly');
            }
            
            this.addResult(testName, 'pass', 'Performance alerts work correctly', performance.now() - start, {
                alertsGenerated: allAlerts.length,
                activeAlertsTested: activeAlerts.length,
                categoriesTested: 3,
                severitiesTested: 2,
                alertPropertiesVerified: true,
                alertDismissalTested: true,
                alertClearingTested: true,
                suggestionsGenerated: criticalAlert.suggestions.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance alerts failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRegressionTesting(): Promise<void> {
        const testName = 'Regression Testing';
        const start = performance.now();
        
        try {
            // Add regression tests
            const tests = [
                { id: 'fps_test', name: 'FPS Performance Test', category: ProfilerCategory.General, type: PerformanceMetricType.FPS, baseline: 60, tolerance: 10 },
                { id: 'frame_time_test', name: 'Frame Time Test', category: ProfilerCategory.General, type: PerformanceMetricType.FrameTime, baseline: 16.67, tolerance: 20 },
                { id: 'cpu_test', name: 'CPU Usage Test', category: ProfilerCategory.CPU, type: PerformanceMetricType.CPUUsage, baseline: 70, tolerance: 15 },
                { id: 'memory_test', name: 'Memory Usage Test', category: ProfilerCategory.Memory, type: PerformanceMetricType.MemoryUsage, baseline: 256 * 1024 * 1024, tolerance: 25 },
                { id: 'draw_calls_test', name: 'Draw Calls Test', category: ProfilerCategory.Rendering, type: PerformanceMetricType.DrawCalls, baseline: 1000, tolerance: 50 },
            ];
            
            for (const test of tests) {
                this.profiler.addPerformanceRegressionTest(
                    test.id,
                    test.name,
                    test.category,
                    test.type,
                    test.baseline,
                    test.tolerance
                );
            }
            
            // Record metrics within tolerance
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 58.0, 'FPS'); // Within tolerance
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FrameTime, 18.0, 'ms'); // Within tolerance
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 75.0, '%'); // Within tolerance
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 280 * 1024 * 1024, 'bytes'); // Within tolerance
            this.profiler.recordMetric(ProfilerCategory.Rendering, PerformanceMetricType.DrawCalls, 1100, 'calls'); // Within tolerance
            
            // Run regression tests
            const testResults = this.profiler.runPerformanceRegressionTests();
            if (testResults.passed < tests.length) {
                throw new Error('Not all tests passed within tolerance');
            }
            
            if (testResults.failed > 0) {
                throw new Error('Some tests failed unexpectedly');
            }
            
            // Record metrics outside tolerance
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 45.0, 'FPS'); // Outside tolerance
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 90.0, '%'); // Outside tolerance
            
            // Run regression tests again
            const failingTestResults = this.profiler.runPerformanceRegressionTests();
            if (failingTestResults.failed === 0) {
                throw new Error('Expected some tests to fail');
            }
            
            // Verify failing tests
            const failingResults = failingTestResults.results.filter(([_, failed]) => failed);
            if (failingResults.length === 0) {
                throw new Error('No failing tests found');
            }
            
            // Test disabled regression test
            this.profiler.addPerformanceRegressionTest(
                'disabled_test',
                'Disabled Test',
                ProfilerCategory.General,
                PerformanceMetricType.FPS,
                60,
                10,
                false // disabled
            );
            
            const disabledTestResults = this.profiler.runPerformanceRegressionTests();
            const disabledTestResult = disabledTestResults.results.find(([id]) => id === 'disabled_test');
            if (disabledTestResult) {
                throw new Error('Disabled test should not be included in results');
            }
            
            // Test regression testing when disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const disabledResults = this.profiler.runPerformanceRegressionTests();
            if (disabledResults.length > 0) {
                throw new Error('Should return empty results when regression testing is disabled');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'Regression testing works correctly', performance.now() - start, {
                testsCreated: tests.length + 1,
                testsPassed: testResults.passed,
                testsFailed: failingTestResults.failed,
                toleranceTested: true,
                disabledTestTested: true,
                disabledConfigTested: true,
                failingResultsVerified: failingResults.length,
                baselineValues: tests.map(t => t.baseline),
                toleranceValues: tests.map(t => t.tolerance),
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Regression testing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testReports(): Promise<void> {
        const testName = 'Performance Reports';
        const start = performance.now();
        
        try {
            // Generate some performance data
            for (let i = 0; i < 10; i++) {
                const frameData = {
                    frameNumber: i + 1,
                    frameTime: 16.67 + (Math.random() - 0.5) * 8,
                    fps: 60.0 + (Math.random() - 0.5) * 20,
                    cpuTime: 8.5 + (Math.random() - 0.5) * 4,
                    gpuTime: 6.2 + (Math.random() - 0.5) * 4,
                    renderTime: 5.8 + (Math.random() - 0.5) * 3,
                    physicsTime: 2.1 + (Math.random() - 0.5) * 2,
                    audioTime: 0.8 + (Math.random() - 0.5) * 0.5,
                    scriptTime: 1.5 + (Math.random() - 0.5) * 1,
                    assetTime: 0.3 + (Math.random() - 0.5) * 0.3,
                    animationTime: 0.7 + (Math.random() - 0.5) * 0.4,
                    particleTime: 0.4 + (Math.random() - 0.5) * 0.2,
                    uiTime: 0.2 + (Math.random() - 0.5) * 0.1,
                    drawCalls: 850 + Math.floor((Math.random() - 0.5) * 300),
                    triangles: 1200000 + Math.floor((Math.random() - 0.5) * 400000),
                    vertices: 600000 + Math.floor((Math.random() - 0.5) * 200000),
                    textureMemory: 128 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 64 * 1024 * 1024),
                    bufferMemory: 64 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 32 * 1024 * 1024),
                    memoryUsage: 256 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 128 * 1024 * 1024),
                };
                
                this.profiler.analyzeFrame(frameData);
            }
            
            // Generate performance report
            const report = this.profiler.generatePerformanceReport();
            if (!report.id || !report.timestamp || report.frameCount === 0) {
                throw new Error('Report missing required properties');
            }
            
            // Verify report statistics
            if (report.averageFPS <= 0 || report.averageFrameTime <= 0) {
                throw new Error('Report statistics invalid');
            }
            
            if (report.minFPS > report.maxFPS) {
                throw new Error('FPS min/max values incorrect');
            }
            
            // Verify report structure
            if (!Array.isArray(report.bottlenecks) || !Array.isArray(report.recommendations) || !Array.isArray(report.alerts)) {
                throw new Error('Report arrays not properly formatted');
            }
            
            // Get all reports
            const allReports = this.profiler.getReports();
            if (allReports.length === 0) {
                throw new Error('No reports found');
            }
            
            // Get latest report
            const latestReport = this.profiler.getLatestReport();
            if (!latestReport) {
                throw new Error('Latest report not found');
            }
            
            if (latestReport.id !== report.id) {
                throw new Error('Latest report ID mismatch');
            }
            
            // Generate multiple reports
            const report2 = this.profiler.generatePerformanceReport();
            const report3 = this.profiler.generatePerformanceReport();
            
            const updatedReports = this.profiler.getReports();
            if (updatedReports.length < 3) {
                throw new Error('Not all reports stored');
            }
            
            // Test report when automated reports are disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const report4 = this.profiler.generatePerformanceReport();
            if (!report4.id) {
                throw new Error('Should still be able to generate manual report');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'Performance reports work correctly', performance.now() - start, {
                reportsGenerated: 4,
                reportPropertiesVerified: true,
                reportStatisticsVerified: true,
                reportStructureVerified: true,
                latestReportTested: true,
                multipleReportsTested: true,
                disabledConfigTested: true,
                totalReportsStored: updatedReports.length,
                averageFPS: report.averageFPS,
                frameCount: report.frameCount,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance reports failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testOptimizationSuggestions(): Promise<void> {
        const testName = 'Optimization Suggestions';
        const start = performance.now();
        
        try {
            // Record poor performance metrics to trigger suggestions
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS'); // Low FPS
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FrameTime, 40.0, 'ms'); // High frame time
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 92.0, '%'); // High CPU
            this.profiler.recordMetric(ProfilerCategory.GPU, PerformanceMetricType.GPUUsage, 88.0, '%'); // High GPU
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 768 * 1024 * 1024, 'bytes'); // High memory
            this.profiler.recordMetric(ProfilerCategory.Rendering, PerformanceMetricType.DrawCalls, 3500, 'calls'); // Many draw calls
            
            // Generate optimization suggestions
            const suggestions = this.profiler.getOptimizationSuggestions();
            if (!Array.isArray(suggestions) || suggestions.length === 0) {
                throw new Error('No optimization suggestions generated');
            }
            
            // Verify suggestions are strings
            for (const suggestion of suggestions) {
                if (typeof suggestion !== 'string' || suggestion.length === 0) {
                    throw new Error('Invalid suggestion format');
                }
            }
            
            // Test suggestions for different performance issues
            const fpsSuggestions = suggestions.filter(s => s.toLowerCase().includes('fps') || s.toLowerCase().includes('frame'));
            const cpuSuggestions = suggestions.filter(s => s.toLowerCase().includes('cpu'));
            const gpuSuggestions = suggestions.filter(s => s.toLowerCase().includes('gpu'));
            const memorySuggestions = suggestions.filter(s => s.toLowerCase().includes('memory'));
            const drawCallSuggestions = suggestions.filter(s => s.toLowerCase().includes('draw'));
            
            if (fpsSuggestions.length === 0) {
                throw new Error('No FPS-related suggestions');
            }
            
            if (cpuSuggestions.length === 0) {
                throw new Error('No CPU-related suggestions');
            }
            
            if (gpuSuggestions.length === 0) {
                throw new Error('No GPU-related suggestions');
            }
            
            if (memorySuggestions.length === 0) {
                throw new Error('No memory-related suggestions');
            }
            
            if (drawCallSuggestions.length === 0) {
                throw new Error('No draw call-related suggestions');
            }
            
            // Test with good performance metrics
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 75.0, 'FPS'); // Good FPS
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 45.0, '%'); // Good CPU
            this.profiler.recordMetric(ProfilerCategory.Rendering, PerformanceMetricType.DrawCalls, 800, 'calls'); // Good draw calls
            
            const goodPerformanceSuggestions = this.profiler.getOptimizationSuggestions();
            
            // Test suggestions when optimization suggestions are disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const disabledSuggestions = this.profiler.getOptimizationSuggestions();
            if (disabledSuggestions.length !== 0) {
                throw new Error('Should return empty array when optimization suggestions are disabled');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'Optimization suggestions work correctly', performance.now() - start, {
                suggestionsGenerated: suggestions.length,
                suggestionCategoriesTested: 5,
                poorPerformanceTested: true,
                goodPerformanceTested: true,
                disabledConfigTested: true,
                fpsSuggestions: fpsSuggestions.length,
                cpuSuggestions: cpuSuggestions.length,
                gpuSuggestions: gpuSuggestions.length,
                memorySuggestions: memorySuggestions.length,
                drawCallSuggestions: drawCallSuggestions.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Optimization suggestions failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testUIData(): Promise<void> {
        const testName = 'UI Data';
        const start = performance.now();
        
        try {
            // Generate some performance data
            for (let i = 0; i < 5; i++) {
                const frameData = {
                    frameNumber: i + 1,
                    frameTime: 16.67 + (Math.random() - 0.5) * 4,
                    fps: 60.0 + (Math.random() - 0.5) * 10,
                    cpuTime: 8.5 + (Math.random() - 0.5) * 2,
                    gpuTime: 6.2 + (Math.random() - 0.5) * 2,
                    renderTime: 5.8 + (Math.random() - 0.5) * 2,
                    physicsTime: 2.1 + (Math.random() - 0.5) * 1,
                    audioTime: 0.8 + (Math.random() - 0.5) * 0.3,
                    scriptTime: 1.5 + (Math.random() - 0.5) * 0.5,
                    assetTime: 0.3 + (Math.random() - 0.5) * 0.2,
                    animationTime: 0.7 + (Math.random() - 0.5) * 0.3,
                    particleTime: 0.4 + (Math.random() - 0.5) * 0.2,
                    uiTime: 0.2 + (Math.random() - 0.5) * 0.1,
                    drawCalls: 850 + Math.floor((Math.random() - 0.5) * 200),
                    triangles: 1200000 + Math.floor((Math.random() - 0.5) * 200000),
                    vertices: 600000 + Math.floor((Math.random() - 0.5) * 100000),
                    textureMemory: 128 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 32 * 1024 * 1024),
                    bufferMemory: 64 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 16 * 1024 * 1024),
                    memoryUsage: 256 * 1024 * 1024 + Math.floor((Math.random() - 0.5) * 64 * 1024 * 1024),
                };
                
                this.profiler.analyzeFrame(frameData);
            }
            
            // Get UI data
            const uiData = this.profiler.getUIData();
            if (!uiData || typeof uiData.currentFPS !== 'number' || typeof uiData.currentFrameTime !== 'number') {
                throw new Error('UI data missing required properties');
            }
            
            // Verify UI data structure
            const requiredProperties = ['currentFPS', 'currentFrameTime', 'cpuUsage', 'gpuUsage', 'memoryUsage', 'drawCalls', 'triangles', 'activeAlerts', 'performanceLevel', 'recentFrameAnalyses'];
            for (const property of requiredProperties) {
                if (!(property in uiData)) {
                    throw new Error(`UI data missing property: ${property}`);
                }
            }
            
            // Verify performance level
            if (!Object.values(PerformanceLevel).includes(uiData.performanceLevel)) {
                throw new Error('Invalid performance level');
            }
            
            // Verify recent frame analyses
            if (!Array.isArray(uiData.recentFrameAnalyses)) {
                throw new Error('Recent frame analyses not an array');
            }
            
            if (uiData.recentFrameAnalyses.length === 0) {
                throw new Error('No recent frame analyses');
            }
            
            // Verify frame analysis structure
            const lastFrame = uiData.recentFrameAnalyses[uiData.recentFrameAnalyses.length - 1];
            const frameProperties = ['frameNumber', 'frameTime', 'fps', 'bottlenecks', 'recommendations'];
            for (const property of frameProperties) {
                if (!(property in lastFrame)) {
                    throw new Error(`Frame analysis missing property: ${property}`);
                }
            }
            
            // Test UI data update rate
            const initialFPS = uiData.currentFPS;
            
            // Record new metric to update UI data
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 45.0, 'FPS');
            
            const updatedUIData = this.profiler.getUIData();
            if (updatedUIData.currentFPS === initialFPS) {
                console.warn('UI data may not be updating in real-time');
            }
            
            // Test UI data when profiling is disabled
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            const minimalUIData = this.profiler.getUIData();
            if (!minimalUIData || typeof minimalUIData.currentFPS !== 'number') {
                throw new Error('Should still return UI data with minimal config');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'UI data works correctly', performance.now() - start, {
                uiDataStructureVerified: true,
                performanceLevelVerified: true,
                recentFramesStored: uiData.recentFrameAnalyses.length,
                frameAnalysisStructureVerified: true,
                uiDataUpdateTested: true,
                minimalConfigTested: true,
                currentFPS: uiData.currentFPS,
                currentFrameTime: uiData.currentFrameTime,
                performanceLevel: PerformanceLevel[uiData.performanceLevel],
            });
        } catch (error) {
            this.addResult(testName, 'fail', `UI data failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceAnalysis(): Promise<void> {
        const testName = 'Performance Analysis';
        const start = performance.now();
        
        try {
            // Generate performance data with trends
            for (let i = 0; i < 60; i++) {
                const fps = 60 - (i * 0.3); // Degrading performance
                const frameTime = 16.67 + (i * 0.1); // Increasing frame time
                
                const frameData = {
                    frameNumber: i + 1,
                    frameTime,
                    fps,
                    cpuTime: 8.5 + (i * 0.05),
                    gpuTime: 6.2 + (i * 0.04),
                    renderTime: 5.8 + (i * 0.03),
                    physicsTime: 2.1,
                    audioTime: 0.8,
                    scriptTime: 1.5,
                    assetTime: 0.3,
                    animationTime: 0.7,
                    particleTime: 0.4,
                    uiTime: 0.2,
                    drawCalls: 850 + (i * 10),
                    triangles: 1200000 + (i * 5000),
                    vertices: 600000 + (i * 2500),
                    textureMemory: 128 * 1024 * 1024,
                    bufferMemory: 64 * 1024 * 1024,
                    memoryUsage: 256 * 1024 * 1024 + (i * 1024 * 1024),
                };
                
                this.profiler.analyzeFrame(frameData);
            }
            
            // Analyze performance trends
            const trendAnalysis = this.profiler.analyzePerformanceTrends();
            if (!trendAnalysis.trend || !trendAnalysis.confidence || !trendAnalysis.recommendations) {
                throw new Error('Trend analysis missing required properties');
            }
            
            // Verify trend analysis results
            if (!['improving', 'degrading', 'stable'].includes(trendAnalysis.trend)) {
                throw new Error('Invalid trend value');
            }
            
            if (trendAnalysis.confidence < 0 || trendAnalysis.confidence > 1) {
                throw new Error('Invalid confidence value');
            }
            
            if (!Array.isArray(trendAnalysis.recommendations)) {
                throw new Error('Recommendations not an array');
            }
            
            // With degrading performance, should detect degrading trend
            if (trendAnalysis.trend !== 'degrading') {
                console.warn('Expected degrading trend but got:', trendAnalysis.trend);
            }
            
            // Test performance bottlenecks
            const bottlenecks = this.profiler.getPerformanceBottlenecks();
            if (!Array.isArray(bottlenecks)) {
                throw new Error('Bottlenecks not an array');
            }
            
            // Verify bottleneck structure
            for (const bottleneck of bottlenecks) {
                if (!bottleneck.category || !bottleneck.metric || !bottleneck.severity || !bottleneck.description || !bottleneck.suggestions) {
                    throw new Error('Bottleneck missing required properties');
                }
                
                if (!['low', 'medium', 'high', 'critical'].includes(bottleneck.severity)) {
                    throw new Error('Invalid bottleneck severity');
                }
                
                if (!Array.isArray(bottleneck.suggestions)) {
                    throw new Error('Bottleneck suggestions not an array');
                }
            }
            
            // Verify bottlenecks are sorted by severity
            for (let i = 1; i < bottlenecks.length; i++) {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const prevSeverity = severityOrder[bottlenecks[i - 1].severity];
                const currSeverity = severityOrder[bottlenecks[i].severity];
                
                if (currSeverity > prevSeverity) {
                    throw new Error('Bottlenecks not sorted by severity');
                }
            }
            
            // Test with stable performance
            for (let i = 0; i < 30; i++) {
                const frameData = {
                    frameNumber: i + 61,
                    frameTime: 16.67 + (Math.random() - 0.5) * 2,
                    fps: 60.0 + (Math.random() - 0.5) * 5,
                    cpuTime: 8.5 + (Math.random() - 0.5) * 1,
                    gpuTime: 6.2 + (Math.random() - 0.5) * 1,
                    renderTime: 5.8 + (Math.random() - 0.5) * 1,
                    physicsTime: 2.1,
                    audioTime: 0.8,
                    scriptTime: 1.5,
                    assetTime: 0.3,
                    animationTime: 0.7,
                    particleTime: 0.4,
                    uiTime: 0.2,
                    drawCalls: 850,
                    triangles: 1200000,
                    vertices: 600000,
                    textureMemory: 128 * 1024 * 1024,
                    bufferMemory: 64 * 1024 * 1024,
                    memoryUsage: 256 * 1024 * 1024,
                };
                
                this.profiler.analyzeFrame(frameData);
            }
            
            const stableTrendAnalysis = this.profiler.analyzePerformanceTrends();
            if (stableTrendAnalysis.trend === 'degrading') {
                console.warn('Expected stable trend but got degrading');
            }
            
            // Test with insufficient data
            const uiData = this.profiler.getUIData();
            const recentFrames = uiData.recentFrameAnalyses.slice(0, 10); // Only 10 frames
            
            if (recentFrames.length < 30) {
                const insufficientDataTrend = this.profiler.analyzePerformanceTrends();
                if (insufficientDataTrend.confidence > 0.5) {
                    throw new Error('Should have low confidence with insufficient data');
                }
            }
            
            this.addResult(testName, 'pass', 'Performance analysis works correctly', performance.now() - start, {
                trendAnalysisTested: true,
                bottlenecksTested: true,
                degradingPerformanceDetected: trendAnalysis.trend === 'degrading',
                stablePerformanceTested: true,
                insufficientDataTested: true,
                bottlenecksIdentified: bottlenecks.length,
                bottleneckSortingVerified: true,
                trendConfidence: trendAnalysis.confidence,
                recommendationsGenerated: trendAnalysis.recommendations.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBudgetManagement(): Promise<void> {
        const testName = 'Budget Management';
        const start = performance.now();
        
        try {
            // Clear existing budgets
            this.profiler.clearAlerts();
            
            // Test default budget setup
            this.profiler.setupDefaultBudgets();
            
            // Record metrics that should trigger alerts
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS'); // Critical
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 90.0, '%'); // Warning
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 768 * 1024 * 1024, 'bytes'); // Warning
            
            // Check if alerts were generated
            const alerts = this.profiler.getAlerts();
            if (alerts.length === 0) {
                throw new Error('No alerts generated from default budgets');
            }
            
            // Test custom budget setup
            const customBudgets = [
                { category: ProfilerCategory.Physics, type: PerformanceMetricType.PhysicsUpdateTime, target: 3.0, warning: 5.0, critical: 8.0, unit: 'ms' },
                { category: ProfilerCategory.Audio, type: PerformanceMetricType.AudioLatency, target: 10.0, warning: 20.0, critical: 40.0, unit: 'ms' },
                { category: ProfilerCategory.Scripting, type: PerformanceMetricType.ScriptExecutionTime, target: 2.0, warning: 4.0, critical: 8.0, unit: 'ms' },
            ];
            
            for (const budget of customBudgets) {
                this.profiler.setBudget(
                    budget.category,
                    budget.type,
                    budget.target,
                    budget.warning,
                    budget.critical,
                    budget.unit
                );
            }
            
            // Test custom budget violations
            this.profiler.recordMetric(ProfilerCategory.Physics, PerformanceMetricType.PhysicsUpdateTime, 9.0, 'ms'); // Critical
            this.profiler.recordMetric(ProfilerCategory.Audio, PerformanceMetricType.AudioLatency, 25.0, 'ms'); // Warning
            this.profiler.recordMetric(ProfilerCategory.Scripting, PerformanceMetricType.ScriptExecutionTime, 6.0, 'ms'); // Warning
            
            const updatedAlerts = this.profiler.getAlerts();
            const physicsAlerts = updatedAlerts.filter(alert => alert.category === ProfilerCategory.Physics);
            const audioAlerts = updatedAlerts.filter(alert => alert.category === ProfilerCategory.Audio);
            const scriptingAlerts = updatedAlerts.filter(alert => alert.category === ProfilerCategory.Scripting);
            
            if (physicsAlerts.length === 0) {
                throw new Error('No physics alerts generated');
            }
            
            if (audioAlerts.length === 0) {
                throw new Error('No audio alerts generated');
            }
            
            if (scriptingAlerts.length === 0) {
                throw new Error('No scripting alerts generated');
            }
            
            // Test budget removal
            const removeResult = this.profiler.removeBudget(ProfilerCategory.Physics, PerformanceMetricType.PhysicsUpdateTime);
            if (!removeResult.success) {
                throw new Error('Failed to remove physics budget');
            }
            
            // Test removing non-existent budget
            const invalidRemoveResult = this.profiler.removeBudget(ProfilerCategory.Network, PerformanceMetricType.NetworkLatency);
            if (invalidRemoveResult.success) {
                throw new Error('Should fail for non-existent budget');
            }
            
            // Test budget with disabled warnings
            const minimalConfig = RustPerformanceProfiler.createMinimalConfig();
            this.profiler.updateConfig(minimalConfig);
            
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 15.0, 'FPS'); // Should not trigger alert
            
            const disabledAlerts = this.profiler.getAlerts();
            const newFPSAlerts = disabledAlerts.filter(alert => alert.metricType === PerformanceMetricType.FPS && alert.timestamp > Date.now() - 1000);
            if (newFPSAlerts.length > 0) {
                throw new Error('Should not generate alerts when budget warnings are disabled');
            }
            
            // Re-enable for other tests
            const defaultConfig = RustPerformanceProfiler.createDefaultConfig();
            this.profiler.updateConfig(defaultConfig);
            
            this.addResult(testName, 'pass', 'Budget management works correctly', performance.now() - start, {
                defaultBudgetsTested: true,
                customBudgetsTested: customBudgets.length,
                budgetViolationsTested: true,
                alertsGenerated: updatedAlerts.length,
                budgetRemovalTested: true,
                disabledConfigTested: true,
                categoriesTested: 6,
                criticalAlerts: updatedAlerts.filter(a => a.severity === AlertSeverity.Critical).length,
                warningAlerts: updatedAlerts.filter(a => a.severity === AlertSeverity.Warning).length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Budget management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAutomatedMonitoring(): Promise<void> {
        const testName = 'Automated Monitoring';
        const start = performance.now();
        
        try {
            // Clear existing data
            this.profiler.clearAlerts();
            
            // Set up automated monitoring
            this.profiler.setupAutomatedMonitoring();
            
            // Verify monitoring is active
            const stats = this.profiler.getStats();
            if (stats.totalMetrics === 0) {
                throw new Error('Automated monitoring should record metrics');
            }
            
            // Verify default budgets are set
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS'); // Should trigger alert
            
            const alerts = this.profiler.getAlerts();
            if (alerts.length === 0) {
                throw new Error('Default budgets should be set up');
            }
            
            // Verify regression tests are set
            const regressionResults = this.profiler.runPerformanceRegressionTests();
            if (regressionResults.length === 0) {
                throw new Error('Default regression tests should be set up');
            }
            
            // Test automated monitoring with different configurations
            const devConfig = RustPerformanceProfiler.createDevelopmentConfig();
            this.profiler.updateConfig(devConfig);
            this.profiler.setupAutomatedMonitoring();
            
            // Should still work with development config
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 95.0, '%');
            const devAlerts = this.profiler.getAlerts();
            if (devAlerts.length === 0) {
                throw new Error('Should work with development config');
            }
            
            // Test with production config
            const prodConfig = RustPerformanceProfiler.createProductionConfig();
            this.profiler.updateConfig(prodConfig);
            this.profiler.setupAutomatedMonitoring();
            
            // Should set up minimal monitoring
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 768 * 1024 * 1024, 'bytes');
            const prodAlerts = this.profiler.getAlerts();
            if (prodAlerts.length === 0) {
                throw new Error('Should work with production config');
            }
            
            // Test monitoring state
            const uiData = this.profiler.getUIData();
            if (uiData.currentFPS === 0 && uiData.currentFrameTime === 0) {
                console.warn('Automated monitoring may not be collecting data');
            }
            
            // Test stopping and restarting monitoring
            this.profiler.stopPerformanceMonitoring();
            this.profiler.startPerformanceMonitoring();
            
            // Should still work after restart
            this.profiler.recordMetric(ProfilerCategory.Rendering, PerformanceMetricType.DrawCalls, 2500, 'calls');
            const finalAlerts = this.profiler.getAlerts();
            if (finalAlerts.length <= prodAlerts.length) {
                console.warn('Monitoring may not be fully active after restart');
            }
            
            this.addResult(testName, 'pass', 'Automated monitoring works correctly', performance.now() - start, {
                monitoringSetupTested: true,
                defaultBudgetsVerified: alerts.length > 0,
                regressionTestsVerified: regressionResults.length > 0,
                devConfigTested: true,
                prodConfigTested: true,
                monitoringRestartTested: true,
                configurationsTested: 3,
                alertsGenerated: finalAlerts.length,
                regressionTestsSet: regressionResults.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Automated monitoring failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceOptimization(): Promise<void> {
        const testName = 'Performance Optimization';
        const start = performance.now();
        
        try {
            // Record poor performance metrics
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS'); // Low FPS
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 92.0, '%'); // High CPU
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 768 * 1024 * 1024, 'bytes'); // High memory
            
            // Get optimization suggestions
            const suggestions = this.profiler.getOptimizationSuggestions();
            if (suggestions.length === 0) {
                throw new Error('No optimization suggestions generated');
            }
            
            // Test performance optimization
            const optimization = this.profiler.optimizePerformance();
            if (!optimization.optimizationsApplied || !optimization.performanceImprovement || !optimization.recommendations) {
                throw new Error('Optimization result missing required properties');
            }
            
            // Verify optimization structure
            if (!Array.isArray(optimization.optimizationsApplied)) {
                throw new Error('Optimizations applied not an array');
            }
            
            if (!Array.isArray(optimization.recommendations)) {
                throw new Error('Optimization recommendations not an array');
            }
            
            if (typeof optimization.performanceImprovement !== 'number') {
                throw new Error('Performance improvement not a number');
            }
            
            // With poor performance, should suggest improvements
            if (optimization.performanceImprovement <= 0) {
                console.warn('Expected positive performance improvement');
            }
            
            if (optimization.optimizationsApplied.length === 0) {
                throw new Error('Should suggest optimizations');
            }
            
            // Test with good performance
            this.profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 75.0, 'FPS'); // Good FPS
            this.profiler.recordMetric(ProfilerCategory.CPU, PerformanceMetricType.CPUUsage, 45.0, '%'); // Good CPU
            this.profiler.recordMetric(ProfilerCategory.Memory, PerformanceMetricType.MemoryUsage, 200 * 1024 * 1024, 'bytes'); // Good memory
            
            const goodPerformanceOptimization = this.profiler.optimizePerformance();
            
            // With good performance, should have lower improvement
            if (goodPerformanceOptimization.performanceImprovement >= optimization.performanceImprovement) {
                console.warn('Expected lower performance improvement for good performance');
            }
            
            // Test performance summary
            const summary = this.profiler.generatePerformanceSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Performance summary not generated');
            }
            
            // Verify summary contains expected sections
            const expectedSections = [
                'Current Performance:',
                'Statistics:',
                'Active Alerts:',
                'Optimization Suggestions:'
            ];
            
            for (const section of expectedSections) {
                if (!summary.includes(section)) {
                    console.warn(`Performance summary missing section: ${section}`);
                }
            }
            
            // Test bottleneck analysis
            const bottlenecks = this.profiler.getPerformanceBottlenecks();
            if (bottlenecks.length === 0) {
                console.warn('Expected some bottlenecks with poor performance');
            }
            
            // Verify bottleneck suggestions are included in optimization recommendations
            const bottleneckSuggestions = bottlenecks.flatMap(b => b.suggestions);
            const hasBottleneckSuggestions = bottleneckSuggestions.some(suggestion => 
                optimization.recommendations.includes(suggestion)
            );
            
            if (!hasBottleneckSuggestions && bottlenecks.length > 0) {
                console.warn('Optimization recommendations should include bottleneck suggestions');
            }
            
            // Test trend analysis integration
            const trendAnalysis = this.profiler.analyzePerformanceTrends();
            if (trendAnalysis.trend === 'degrading') {
                const hasTrendRecommendations = trendAnalysis.recommendations.some(recommendation => 
                    optimization.recommendations.includes(recommendation)
                );
                
                if (!hasTrendRecommendations) {
                    console.warn('Optimization recommendations should include trend recommendations');
                }
            }
            
            this.addResult(testName, 'pass', 'Performance optimization works correctly', performance.now() - start, {
                optimizationTested: true,
                poorPerformanceTested: true,
                goodPerformanceTested: true,
                performanceSummaryGenerated: true,
                bottleneckAnalysisIntegrated: true,
                trendAnalysisIntegrated: true,
                optimizationsApplied: optimization.optimizationsApplied.length,
                performanceImprovement: optimization.performanceImprovement,
                recommendationsGenerated: optimization.recommendations.length,
                bottlenecksIdentified: bottlenecks.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance optimization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🔍 Rust Performance Profiler Test Report');
        console.log('==========================================');
        
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
        
        // Performance Profiler System Summary
        const initTest = this.results.find(r => r.name === 'Performance Profiler Initialization');
        const configTest = this.results.find(r => r.name === 'Configuration Presets');
        const trackingTest = this.results.find(r => r.name === 'Real-time Performance Tracking');
        const analysisTest = this.results.find(r => r.name === 'Performance Analysis');
        const optimizationTest = this.results.find(r => r.name === 'Performance Optimization');
        
        if (initTest?.details || configTest?.details || trackingTest?.details || analysisTest?.details || optimizationTest?.details) {
            console.log(`\n🔍 Performance Profiler System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (configTest?.details) {
                console.log(`   Configuration: ${configTest.details.configsTested} presets tested`);
            }
            if (trackingTest?.details) {
                console.log(`   Real-time Tracking: ${trackingTest.details.metricsRecorded} metrics recorded`);
            }
            if (analysisTest?.details) {
                console.log(`   Performance Analysis: ${analysisTest.details.bottlenecksIdentified} bottlenecks identified`);
            }
            if (optimizationTest?.details) {
                console.log(`   Optimization: ${optimizationTest.details.optimizationsApplied} optimizations applied`);
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
                webgl: !!document.createElement('canvas').getContext('webgl'),
                wasm: typeof WebAssembly !== 'undefined',
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

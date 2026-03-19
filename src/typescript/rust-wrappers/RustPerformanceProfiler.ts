// Enums
export enum ProfilerCategory {
    CPU = 0,
    GPU = 1,
    Memory = 2,
    Rendering = 3,
    Physics = 4,
    Audio = 5,
    Network = 6,
    Input = 7,
    Scripting = 8,
    AssetLoading = 9,
    Animation = 10,
    Particles = 11,
    UI = 12,
    General = 13,
}

export enum PerformanceMetricType {
    FrameTime = 0,
    FPS = 1,
    CPUUsage = 2,
    GPUUsage = 3,
    MemoryUsage = 4,
    DrawCalls = 5,
    Triangles = 6,
    Vertices = 7,
    TextureMemory = 8,
    BufferMemory = 9,
    AudioLatency = 10,
    NetworkLatency = 11,
    ScriptExecutionTime = 12,
    AssetLoadTime = 13,
    PhysicsUpdateTime = 14,
    AnimationTime = 15,
    ParticleCount = 16,
    UITime = 17,
    Custom = 18,
}

export enum PerformanceLevel {
    Excellent = 0,
    Good = 1,
    Average = 2,
    Poor = 3,
    Critical = 4,
}

export enum AlertSeverity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3,
}

// Interfaces
export interface PerformanceMetric {
    timestamp: number;
    category: ProfilerCategory;
    metricType: PerformanceMetricType;
    value: number;
    unit: string;
    frameNumber: number;
    context: Record<string, string>;
}

export interface FrameAnalysis {
    frameNumber: number;
    frameTime: number;
    fps: number;
    cpuTime: number;
    gpuTime: number;
    renderTime: number;
    physicsTime: number;
    audioTime: number;
    scriptTime: number;
    assetTime: number;
    animationTime: number;
    particleTime: number;
    uiTime: number;
    drawCalls: number;
    triangles: number;
    vertices: number;
    textureMemory: number;
    bufferMemory: number;
    memoryUsage: number;
    bottlenecks: string[];
    recommendations: string[];
}

export interface PerformanceBudget {
    category: ProfilerCategory;
    metricType: PerformanceMetricType;
    targetValue: number;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    enabled: boolean;
}

export interface PerformanceAlert {
    id: string;
    timestamp: number;
    severity: AlertSeverity;
    category: ProfilerCategory;
    metricType: PerformanceMetricType;
    currentValue: number;
    thresholdValue: number;
    message: string;
    suggestions: string[];
    isActive: boolean;
}

export interface PerformanceReport {
    id: string;
    timestamp: number;
    duration: number;
    frameCount: number;
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    averageFrameTime: number;
    cpuUsage: number;
    gpuUsage: number;
    memoryUsage: number;
    drawCalls: number;
    triangles: number;
    vertices: number;
    bottlenecks: string[];
    recommendations: string[];
    alerts: PerformanceAlert[];
    performanceLevel: PerformanceLevel;
}

export interface RegressionTest {
    id: string;
    name: string;
    category: ProfilerCategory;
    metricType: PerformanceMetricType;
    baselineValue: number;
    tolerancePercent: number;
    enabled: boolean;
    lastResult?: number;
    lastTestTime?: number;
    failing: boolean;
}

export interface ProfilerConfig {
    enableRealTimeTracking: boolean;
    enableCpuProfiling: boolean;
    enableGpuProfiling: boolean;
    enableMemoryProfiling: boolean;
    enableFrameAnalysis: boolean;
    enableBudgetWarnings: boolean;
    enableRegressionTesting: boolean;
    enableAutomatedReports: boolean;
    enableOptimizationSuggestions: boolean;
    samplingRate: number;
    historySize: number;
    reportInterval: number;
    alertCooldown: number;
    uiUpdateRate: number;
}

export interface ProfilerStats {
    totalMetrics: number;
    totalFrames: number;
    totalAlerts: number;
    activeAlerts: number;
    averageFPS: number;
    averageFrameTime: number;
    peakMemoryUsage: number;
    totalDrawCalls: number;
    totalTriangles: number;
    regressionTestsRun: number;
    regressionTestsFailed: number;
    reportsGenerated: number;
    optimizationSuggestions: number;
    uptime: number;
}

export interface ProfilerUIData {
    currentFPS: number;
    currentFrameTime: number;
    cpuUsage: number;
    gpuUsage: number;
    memoryUsage: number;
    drawCalls: number;
    triangles: number;
    activeAlerts: PerformanceAlert[];
    performanceLevel: PerformanceLevel;
    recentFrameAnalyses: FrameAnalysis[];
}

// Main class
export class RustPerformanceProfiler {
    private profiler: any;
    private initialized: boolean = false;

    constructor() {
        this.profiler = null;
    }

    async initialize(config: ProfilerConfig): Promise<void> {
        try {
            // Import the WASM module
            const wasmModule = await import('../../pkg/procedural_pixel_engine_core');
            
            // Create the performance profiler
            this.profiler = new wasmModule.PerformanceProfilerExport(config);
            this.initialized = true;
            
            console.log('🔍 Rust Performance Profiler initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Rust Performance Profiler:', error);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    // Configuration
    updateConfig(config: ProfilerConfig): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        this.profiler.update_config(config);
    }

    getConfig(): ProfilerConfig {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_config();
    }

    // Statistics
    getStats(): ProfilerStats {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_stats();
    }

    getProfilerSummary(): string {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_profiler_summary();
    }

    // Real-time performance tracking
    startRealTimeTracking(): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.start_real_time_tracking();
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    stopRealTimeTracking(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        this.profiler.stop_real_time_tracking();
    }

    // Metrics
    addMetric(metric: PerformanceMetric): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        this.profiler.add_metric(metric);
    }

    // Frame analysis
    analyzeFrame(frameData: FrameAnalysis): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.analyze_frame(frameData);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Performance budgets
    addBudget(budget: PerformanceBudget): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.add_budget(budget);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    removeBudget(category: ProfilerCategory, metricType: PerformanceMetricType): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.remove_budget(category, metricType);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Alerts
    getAlerts(): PerformanceAlert[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_alerts();
    }

    getActiveAlerts(): PerformanceAlert[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_active_alerts();
    }

    dismissAlert(alertId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.dismiss_alert(alertId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    clearAlerts(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        this.profiler.clear_alerts();
    }

    // Regression testing
    addRegressionTest(test: RegressionTest): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Performance Profiler not initialized' };
        }
        try {
            this.profiler.add_regression_test(test);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    runRegressionTests(): Array<[string, boolean, number]> {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.run_regression_tests();
    }

    // Reports
    generateReport(): PerformanceReport {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.generate_report();
    }

    getReports(): PerformanceReport[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_reports();
    }

    getLatestReport(): PerformanceReport | null {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_latest_report();
    }

    // Optimization suggestions
    getOptimizationSuggestions(): string[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_optimization_suggestions();
    }

    // UI data
    getUIData(): ProfilerUIData {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }
        return this.profiler.get_ui_data();
    }

    // Utility methods
    static createDefaultConfig(): ProfilerConfig {
        return {
            enableRealTimeTracking: true,
            enableCpuProfiling: true,
            enableGpuProfiling: true,
            enableMemoryProfiling: true,
            enableFrameAnalysis: true,
            enableBudgetWarnings: true,
            enableRegressionTesting: true,
            enableAutomatedReports: true,
            enableOptimizationSuggestions: true,
            samplingRate: 60,
            historySize: 1000,
            reportInterval: 5000,
            alertCooldown: 1000,
            uiUpdateRate: 30,
        };
    }

    static createDevelopmentConfig(): ProfilerConfig {
        return {
            enableRealTimeTracking: true,
            enableCpuProfiling: true,
            enableGpuProfiling: true,
            enableMemoryProfiling: true,
            enableFrameAnalysis: true,
            enableBudgetWarnings: true,
            enableRegressionTesting: false,
            enableAutomatedReports: false,
            enableOptimizationSuggestions: true,
            samplingRate: 60,
            historySize: 2000,
            reportInterval: 10000,
            alertCooldown: 500,
            uiUpdateRate: 60,
        };
    }

    static createProductionConfig(): ProfilerConfig {
        return {
            enableRealTimeTracking: false,
            enableCpuProfiling: false,
            enableGpuProfiling: false,
            enableMemoryProfiling: true,
            enableFrameAnalysis: false,
            enableBudgetWarnings: true,
            enableRegressionTesting: true,
            enableAutomatedReports: true,
            enableOptimizationSuggestions: false,
            samplingRate: 30,
            historySize: 500,
            reportInterval: 30000,
            alertCooldown: 5000,
            uiUpdateRate: 10,
        };
    }

    static createMinimalConfig(): ProfilerConfig {
        return {
            enableRealTimeTracking: false,
            enableCpuProfiling: false,
            enableGpuProfiling: false,
            enableMemoryProfiling: true,
            enableFrameAnalysis: false,
            enableBudgetWarnings: false,
            enableRegressionTesting: false,
            enableAutomatedReports: false,
            enableOptimizationSuggestions: false,
            samplingRate: 10,
            historySize: 100,
            reportInterval: 60000,
            alertCooldown: 10000,
            uiUpdateRate: 5,
        };
    }

    // Factory methods
    static createPerformanceMetric(
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        value: number,
        unit: string,
        frameNumber: number,
        context: Record<string, string> = {}
    ): PerformanceMetric {
        return {
            timestamp: Date.now(),
            category,
            metricType,
            value,
            unit,
            frameNumber,
            context,
        };
    }

    static createFrameAnalysis(
        frameNumber: number,
        frameTime: number,
        fps: number,
        cpuTime: number,
        gpuTime: number,
        renderTime: number,
        physicsTime: number,
        audioTime: number,
        scriptTime: number,
        assetTime: number,
        animationTime: number,
        particleTime: number,
        uiTime: number,
        drawCalls: number,
        triangles: number,
        vertices: number,
        textureMemory: number,
        bufferMemory: number,
        memoryUsage: number
    ): FrameAnalysis {
        return {
            frameNumber,
            frameTime,
            fps,
            cpuTime,
            gpuTime,
            renderTime,
            physicsTime,
            audioTime,
            scriptTime,
            assetTime,
            animationTime,
            particleTime,
            uiTime,
            drawCalls,
            triangles,
            vertices,
            textureMemory,
            bufferMemory,
            memoryUsage,
            bottlenecks: [],
            recommendations: [],
        };
    }

    static createPerformanceBudget(
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        targetValue: number,
        warningThreshold: number,
        criticalThreshold: number,
        unit: string,
        enabled: boolean = true
    ): PerformanceBudget {
        return {
            category,
            metricType,
            targetValue,
            warningThreshold,
            criticalThreshold,
            unit,
            enabled,
        };
    }

    static createRegressionTest(
        id: string,
        name: string,
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        baselineValue: number,
        tolerancePercent: number,
        enabled: boolean = true
    ): RegressionTest {
        return {
            id,
            name,
            category,
            metricType,
            baselineValue,
            tolerancePercent,
            enabled,
            lastResult: undefined,
            lastTestTime: undefined,
            failing: false,
        };
    }

    // Performance monitoring
    startPerformanceMonitoring(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const result = this.startRealTimeTracking();
        if (!result.success) {
            throw new Error(`Failed to start performance monitoring: ${result.error}`);
        }

        console.log('🔍 Performance monitoring started');
    }

    stopPerformanceMonitoring(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        this.stopRealTimeTracking();
        console.log('⏹️ Performance monitoring stopped');
    }

    // Frame monitoring
    recordFrame(frameData: Partial<FrameAnalysis>): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const completeFrameData = RustPerformanceProfiler.createFrameAnalysis(
            frameData.frameNumber || 0,
            frameData.frameTime || 0,
            frameData.fps || 0,
            frameData.cpuTime || 0,
            frameData.gpuTime || 0,
            frameData.renderTime || 0,
            frameData.physicsTime || 0,
            frameData.audioTime || 0,
            frameData.scriptTime || 0,
            frameData.assetTime || 0,
            frameData.animationTime || 0,
            frameData.particleTime || 0,
            frameData.uiTime || 0,
            frameData.drawCalls || 0,
            frameData.triangles || 0,
            frameData.vertices || 0,
            frameData.textureMemory || 0,
            frameData.bufferMemory || 0,
            frameData.memoryUsage || 0
        );

        const result = this.analyzeFrame(completeFrameData);
        if (!result.success) {
            console.warn(`Failed to analyze frame: ${result.error}`);
        }
    }

    // Metric recording
    recordMetric(
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        value: number,
        unit: string,
        context: Record<string, string> = {}
    ): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const metric = RustPerformanceProfiler.createPerformanceMetric(
            category,
            metricType,
            value,
            unit,
            0, // Will be updated by the profiler
            context
        );

        this.addMetric(metric);
    }

    // Budget management
    setBudget(
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        targetValue: number,
        warningThreshold: number,
        criticalThreshold: number,
        unit: string
    ): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const budget = RustPerformanceProfiler.createPerformanceBudget(
            category,
            metricType,
            targetValue,
            warningThreshold,
            criticalThreshold,
            unit
        );

        const result = this.addBudget(budget);
        if (!result.success) {
            throw new Error(`Failed to set budget: ${result.error}`);
        }
    }

    // Alert management
    getAlertsByCategory(category: ProfilerCategory): PerformanceAlert[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const allAlerts = this.getAlerts();
        return allAlerts.filter(alert => alert.category === category);
    }

    getAlertsBySeverity(severity: AlertSeverity): PerformanceAlert[] {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const allAlerts = this.getAlerts();
        return allAlerts.filter(alert => alert.severity === severity);
    }

    // Regression testing
    addPerformanceRegressionTest(
        id: string,
        name: string,
        category: ProfilerCategory,
        metricType: PerformanceMetricType,
        baselineValue: number,
        tolerancePercent: number = 10
    ): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const test = RustPerformanceProfiler.createRegressionTest(
            id,
            name,
            category,
            metricType,
            baselineValue,
            tolerancePercent
        );

        const result = this.addRegressionTest(test);
        if (!result.success) {
            throw new Error(`Failed to add regression test: ${result.error}`);
        }
    }

    runPerformanceRegressionTests(): {
        passed: number;
        failed: number;
        results: Array<[string, boolean, number]>;
    } {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const results = this.runRegressionTests();
        const passed = results.filter(([_, passed]) => passed).length;
        const failed = results.length - passed;

        return {
            passed,
            failed,
            results,
        };
    }

    // Report generation
    generatePerformanceReport(): PerformanceReport {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        return this.generateReport();
    }

    generatePerformanceSummary(): string {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const stats = this.getStats();
        const uiData = this.getUIData();
        const alerts = this.getActiveAlerts();
        const suggestions = this.getOptimizationSuggestions();

        return `
🔍 Performance Summary
====================

Current Performance:
- FPS: ${uiData.currentFPS.toFixed(1)}
- Frame Time: ${uiData.currentFrameTime.toFixed(2)}ms
- CPU Usage: ${uiData.cpuUsage.toFixed(1)}%
- GPU Usage: ${uiData.gpuUsage.toFixed(1)}%
- Memory Usage: ${this.formatBytes(uiData.memoryUsage)}
- Draw Calls: ${uiData.drawCalls}
- Triangles: ${uiData.triangles.toLocaleString()}
- Performance Level: ${PerformanceLevel[uiData.performanceLevel]}

Statistics:
- Total Metrics: ${stats.totalMetrics.toLocaleString()}
- Total Frames: ${stats.totalFrames.toLocaleString()}
- Total Alerts: ${stats.totalAlerts.toLocaleString()}
- Active Alerts: ${stats.activeAlerts.toLocaleString()}
- Average FPS: ${stats.averageFPS.toFixed(1)}
- Average Frame Time: ${stats.averageFrameTime.toFixed(2)}ms
- Peak Memory Usage: ${this.formatBytes(stats.peakMemoryUsage)}
- Total Draw Calls: ${stats.totalDrawCalls.toLocaleString()}
- Total Triangles: ${stats.totalTriangles.toLocaleString()}
- Regression Tests Run: ${stats.regressionTestsRun.toLocaleString()}
- Regression Tests Failed: ${stats.regressionTestsFailed.toLocaleString()}
- Reports Generated: ${stats.reportsGenerated.toLocaleString()}
- Optimization Suggestions: ${stats.optimizationSuggestions.toLocaleString()}
- Uptime: ${stats.uptime}s

Active Alerts: ${alerts.length}
${alerts.map(alert => `  - [${AlertSeverity[alert.severity]}] ${alert.message}`).join('\n')}

Optimization Suggestions: ${suggestions.length}
${suggestions.map(suggestion => `  - ${suggestion}`).join('\n')}
        `.trim();
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Analysis methods
    analyzePerformanceTrends(): {
        trend: 'improving' | 'degrading' | 'stable';
        confidence: number;
        recommendations: string[];
    } {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const uiData = this.getUIData();
        const recentFrames = uiData.recentFrameAnalyses.slice(-60); // Last 60 frames
        
        if (recentFrames.length < 30) {
            return {
                trend: 'stable',
                confidence: 0,
                recommendations: ['Insufficient data for trend analysis']
            };
        }

        // Calculate FPS trend
        const fpsValues = recentFrames.map(f => f.fps);
        const firstHalf = fpsValues.slice(0, fpsValues.length / 2);
        const secondHalf = fpsValues.slice(fpsValues.length / 2);
        
        const firstAvg = firstHalf.reduce((sum, fps) => sum + fps, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, fps) => sum + fps, 0) / secondHalf.length;
        
        const difference = secondAvg - firstAvg;
        const trend = difference > 2 ? 'improving' : difference < -2 ? 'degrading' : 'stable';
        const confidence = Math.min(Math.abs(difference) / 10, 1);
        
        const recommendations: string[] = [];
        
        if (trend === 'degrading') {
            recommendations.push('Performance is degrading, investigate recent changes');
            recommendations.push('Consider optimizing recent code changes');
            recommendations.push('Check for memory leaks or resource issues');
        } else if (trend === 'improving') {
            recommendations.push('Performance is improving, continue current optimizations');
        } else {
            recommendations.push('Performance is stable, monitor for changes');
        }

        if (uiData.currentFPS < 30) {
            recommendations.push('Current FPS is low, prioritize performance optimizations');
        }

        if (uiData.cpuUsage > 80) {
            recommendations.push('High CPU usage detected, optimize CPU-intensive operations');
        }

        if (uiData.memoryUsage > 512 * 1024 * 1024) { // > 512MB
            recommendations.push('High memory usage, implement memory optimization');
        }

        return {
            trend,
            confidence,
            recommendations
        };
    }

    getPerformanceBottlenecks(): Array<{
        category: ProfilerCategory;
        metric: PerformanceMetricType;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        suggestions: string[];
    }> {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const uiData = this.getUIData();
        const bottlenecks: Array<{
            category: ProfilerCategory;
            metric: PerformanceMetricType;
            severity: 'low' | 'medium' | 'high' | 'critical';
            description: string;
            suggestions: string[];
        }> = [];

        // Frame time bottleneck
        if (uiData.currentFrameTime > 16.67) {
            bottlenecks.push({
                category: ProfilerCategory.General,
                metric: PerformanceMetricType.FrameTime,
                severity: uiData.currentFrameTime > 33.33 ? 'critical' : uiData.currentFrameTime > 25 ? 'high' : 'medium',
                description: `Frame time is ${uiData.currentFrameTime.toFixed(2)}ms (target: 16.67ms for 60 FPS)`,
                suggestions: [
                    'Optimize rendering pipeline',
                    'Reduce scene complexity',
                    'Implement culling techniques',
                    'Use LOD systems'
                ]
            });
        }

        // CPU bottleneck
        if (uiData.cpuUsage > 70) {
            bottlenecks.push({
                category: ProfilerCategory.CPU,
                metric: PerformanceMetricType.CPUUsage,
                severity: uiData.cpuUsage > 90 ? 'critical' : uiData.cpuUsage > 80 ? 'high' : 'medium',
                description: `CPU usage is ${uiData.cpuUsage.toFixed(1)}%`,
                suggestions: [
                    'Optimize algorithms and data structures',
                    'Use multithreading where possible',
                    'Profile CPU bottlenecks',
                    'Reduce computational complexity'
                ]
            });
        }

        // GPU bottleneck
        if (uiData.gpuUsage > 70) {
            bottlenecks.push({
                category: ProfilerCategory.GPU,
                metric: PerformanceMetricType.GPUUsage,
                severity: uiData.gpuUsage > 90 ? 'critical' : uiData.gpuUsage > 80 ? 'high' : 'medium',
                description: `GPU usage is ${uiData.gpuUsage.toFixed(1)}%`,
                suggestions: [
                    'Reduce shader complexity',
                    'Optimize texture usage',
                    'Implement culling techniques',
                    'Reduce overdraw'
                ]
            });
        }

        // Memory bottleneck
        if (uiData.memoryUsage > 256 * 1024 * 1024) { // > 256MB
            bottlenecks.push({
                category: ProfilerCategory.Memory,
                metric: PerformanceMetricType.MemoryUsage,
                severity: uiData.memoryUsage > 512 * 1024 * 1024 ? 'critical' : uiData.memoryUsage > 384 * 1024 * 1024 ? 'high' : 'medium',
                description: `Memory usage is ${this.formatBytes(uiData.memoryUsage)}`,
                suggestions: [
                    'Implement memory pooling',
                    'Use texture compression',
                    'Optimize asset loading',
                    'Implement texture streaming'
                ]
            });
        }

        // Draw calls bottleneck
        if (uiData.drawCalls > 1000) {
            bottlenecks.push({
                category: ProfilerCategory.Rendering,
                metric: PerformanceMetricType.DrawCalls,
                severity: uiData.drawCalls > 5000 ? 'critical' : uiData.drawCalls > 2000 ? 'high' : 'medium',
                description: `Draw calls are ${uiData.drawCalls.toLocaleString()}`,
                suggestions: [
                    'Batch draw calls together',
                    'Use instanced rendering',
                    'Reduce state changes',
                    'Implement static batching'
                ]
            });
        }

        // Triangles bottleneck
        if (uiData.triangles > 1000000) {
            bottlenecks.push({
                category: ProfilerCategory.Rendering,
                metric: PerformanceMetricType.Triangles,
                severity: uiData.triangles > 5000000 ? 'critical' : uiData.triangles > 2000000 ? 'high' : 'medium',
                description: `Triangles are ${uiData.triangles.toLocaleString()}`,
                suggestions: [
                    'Use LOD (Level of Detail) systems',
                    'Implement occlusion culling',
                    'Reduce polygon count',
                    'Use mesh optimization'
                ]
            });
        }

        return bottlenecks.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    // Performance budget management
    setupDefaultBudgets(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        // FPS budget
        this.setBudget(
            ProfilerCategory.General,
            PerformanceMetricType.FPS,
            60, // target 60 FPS
            45, // warning at 45 FPS
            30, // critical at 30 FPS
            'FPS'
        );

        // Frame time budget
        this.setBudget(
            ProfilerCategory.General,
            PerformanceMetricType.FrameTime,
            16.67, // target 16.67ms (60 FPS)
            25, // warning at 25ms
            33.33, // critical at 33.33ms (30 FPS)
            'ms'
        );

        // CPU usage budget
        this.setBudget(
            ProfilerCategory.CPU,
            PerformanceMetricType.CPUUsage,
            70, // target 70%
            85, // warning at 85%
            95, // critical at 95%
            '%'
        );

        // GPU usage budget
        this.setBudget(
            ProfilerCategory.GPU,
            PerformanceMetricType.GPUUsage,
            70, // target 70%
            85, // warning at 85%
            95, // critical at 95%
            '%'
        );

        // Memory usage budget
        this.setBudget(
            ProfilerCategory.Memory,
            PerformanceMetricType.MemoryUsage,
            256 * 1024 * 1024, // target 256MB
            512 * 1024 * 1024, // warning at 512MB
            1024 * 1024 * 1024, // critical at 1GB
            'bytes'
        );

        // Draw calls budget
        this.setBudget(
            ProfilerCategory.Rendering,
            PerformanceMetricType.DrawCalls,
            1000, // target 1000
            2000, // warning at 2000
            5000, // critical at 5000
            'calls'
        );

        console.log('💰 Default performance budgets set up');
    }

    // Automated performance monitoring
    setupAutomatedMonitoring(): void {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        // Start real-time tracking
        this.startPerformanceMonitoring();

        // Set up default budgets
        this.setupDefaultBudgets();

        // Set up common regression tests
        this.addPerformanceRegressionTest(
            'fps_regression',
            'FPS Performance Regression',
            ProfilerCategory.General,
            PerformanceMetricType.FPS,
            60, // baseline 60 FPS
            10  // 10% tolerance
        );

        this.addPerformanceRegressionTest(
            'frame_time_regression',
            'Frame Time Regression',
            ProfilerCategory.General,
            PerformanceMetricType.FrameTime,
            16.67, // baseline 16.67ms
            20  // 20% tolerance
        );

        this.addPerformanceRegressionTest(
            'memory_usage_regression',
            'Memory Usage Regression',
            ProfilerCategory.Memory,
            PerformanceMetricType.MemoryUsage,
            256 * 1024 * 1024, // baseline 256MB
            25  // 25% tolerance
        );

        console.log('🤖 Automated performance monitoring set up');
    }

    // Performance optimization
    optimizePerformance(): {
        optimizationsApplied: string[];
        performanceImprovement: number;
        recommendations: string[];
    } {
        if (!this.initialized) {
            throw new Error('Performance Profiler not initialized');
        }

        const optimizationsApplied: string[] = [];
        const suggestions = this.getOptimizationSuggestions();
        
        let performanceImprovement = 0;
        const uiData = this.getUIData();

        // Calculate potential improvement based on current performance
        if (uiData.currentFPS < 60) {
            const potentialImprovement = (60 - uiData.currentFPS) / 60 * 100;
            performanceImprovement += potentialImprovement;
            optimizationsApplied.push('Target: Achieve 60 FPS');
        }

        if (uiData.cpuUsage > 70) {
            const potentialImprovement = (uiData.cpuUsage - 70) / 70 * 100;
            performanceImprovement += potentialImprovement / 2; // Weight CPU less heavily
            optimizationsApplied.push('Target: Reduce CPU usage to 70%');
        }

        if (uiData.memoryUsage > 256 * 1024 * 1024) {
            const potentialImprovement = (uiData.memoryUsage - 256 * 1024 * 1024) / (256 * 1024 * 1024) * 100;
            performanceImprovement += potentialImprovement / 3; // Weight memory least heavily
            optimizationsApplied.push('Target: Reduce memory usage to 256MB');
        }

        return {
            optimizationsApplied,
            performanceImprovement,
            recommendations: suggestions
        };
    }
}

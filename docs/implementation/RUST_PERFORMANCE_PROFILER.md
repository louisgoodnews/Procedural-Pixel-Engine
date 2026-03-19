# Rust Performance Profiler System

## Overview

The Rust Performance Profiler System is a comprehensive performance monitoring and analysis solution designed for high-performance game development and interactive applications. Built with Rust and WebAssembly, it provides real-time performance tracking, frame-by-frame analysis, automated regression testing, and intelligent optimization suggestions with TypeScript integration for seamless web development.

## Features

### 🔍 Real-time Performance Monitoring
- **Multi-metric Tracking**: CPU, GPU, memory, rendering, physics, audio, network, input, scripting, asset loading, animation, particles, and UI performance
- **High-frequency Sampling**: Configurable sampling rates up to 120Hz for detailed performance capture
- **Low Overhead**: Optimized for minimal performance impact during monitoring
- **Continuous Monitoring**: Automated performance tracking with configurable intervals

### 📊 Frame-by-Frame Analysis
- **Detailed Breakdown**: Per-frame analysis of all performance components
- **Bottleneck Detection**: Automatic identification of performance bottlenecks
- **Trend Analysis**: Performance trend detection and analysis
- **Recommendation Engine**: Intelligent optimization suggestions based on performance data

### ⚠️ Performance Budgets and Alerts
- **Configurable Budgets**: Set performance targets for different metrics and categories
- **Multi-level Alerts**: Info, warning, error, and critical alert severities
- **Smart Cooldowns**: Configurable alert cooldowns to prevent spam
- **Contextual Suggestions**: Actionable suggestions for resolving performance issues

### 🧪 Automated Regression Testing
- **Baseline Tracking**: Establish performance baselines for regression detection
- **Tolerance-based Testing**: Configurable tolerance levels for performance variations
- **Automated Reporting**: Automatic regression test execution and reporting
- **Historical Analysis**: Track performance changes over time

### 📈 Performance Reports
- **Comprehensive Reports**: Detailed performance reports with statistics and trends
- **Automated Generation**: Configurable automatic report generation
- **Export Capabilities**: Export reports for analysis and documentation
- **Historical Tracking**: Maintain performance history for trend analysis

### 🎯 Performance Optimization
- **Intelligent Suggestions**: AI-powered optimization recommendations
- **Bottleneck Prioritization**: Prioritize optimizations based on impact
- **Performance Level Assessment**: Overall performance level evaluation
- **Optimization Tracking**: Track optimization effectiveness over time

## Quick Start

### Installation

```typescript
import { RustPerformanceProfiler } from './rust-wrappers/RustPerformanceProfiler';
```

### Basic Setup

```typescript
// Create performance profiler
const profiler = new RustPerformanceProfiler();

// Initialize with configuration
const config = RustPerformanceProfiler.createDefaultConfig();
await profiler.initialize(config);

// Start performance monitoring
profiler.startPerformanceMonitoring();

// Record frame data
profiler.recordFrame({
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
});

// Get performance data
const uiData = profiler.getUIData();
console.log(`Current FPS: ${uiData.currentFPS}`);
console.log(`CPU Usage: ${uiData.cpuUsage}%`);
console.log(`Memory Usage: ${profiler.formatBytes(uiData.memoryUsage)}`);
```

## API Reference

### RustPerformanceProfiler Class

#### Constructor
```typescript
constructor()
```
Creates a new performance profiler instance.

#### Initialization
```typescript
async initialize(config: ProfilerConfig): Promise<void>
```
Initializes the performance profiler with the specified configuration.

#### Configuration
```typescript
updateConfig(config: ProfilerConfig): void
getConfig(): ProfilerConfig
```
Updates or retrieves the current profiler configuration.

#### Statistics
```typescript
getStats(): ProfilerStats
getProfilerSummary(): string
```
Retrieves profiler statistics and generates a comprehensive summary.

### Real-time Performance Tracking

#### Start/Stop Tracking
```typescript
startRealTimeTracking(): { success: boolean; error?: string }
stopRealTimeTracking(): void
```
Starts or stops real-time performance tracking.

#### Performance Monitoring
```typescript
startPerformanceMonitoring(): void
stopPerformanceMonitoring(): void
```
High-level performance monitoring control.

### Metrics

#### Record Metrics
```typescript
recordMetric(category: ProfilerCategory, metricType: PerformanceMetricType, value: number, unit: string, context?: Record<string, string>): void
addMetric(metric: PerformanceMetric): void
```
Records individual performance metrics.

#### Frame Analysis
```typescript
recordFrame(frameData: Partial<FrameAnalysis>): void
analyzeFrame(frameData: FrameAnalysis): { success: boolean; error?: string }
```
Records and analyzes frame performance data.

### Performance Budgets

#### Budget Management
```typescript
setBudget(category: ProfilerCategory, metricType: PerformanceMetricType, targetValue: number, warningThreshold: number, criticalThreshold: number, unit: string): void
addBudget(budget: PerformanceBudget): { success: boolean; error?: string }
removeBudget(category: ProfilerCategory, metricType: PerformanceMetricType): { success: boolean; error?: string }
```
Manages performance budgets and thresholds.

#### Default Budgets
```typescript
setupDefaultBudgets(): void
```
Sets up default performance budgets for common metrics.

### Alerts

#### Alert Management
```typescript
getAlerts(): PerformanceAlert[]
getActiveAlerts(): PerformanceAlert[]
getAlertsByCategory(category: ProfilerCategory): PerformanceAlert[]
getAlertsBySeverity(severity: AlertSeverity): PerformanceAlert[]
dismissAlert(alertId: string): { success: boolean; error?: string }
clearAlerts(): void
```
Manages performance alerts and notifications.

### Regression Testing

#### Test Management
```typescript
addPerformanceRegressionTest(id: string, name: string, category: ProfilerCategory, metricType: PerformanceMetricType, baselineValue: number, tolerancePercent?: number): void
addRegressionTest(test: RegressionTest): { success: boolean; error?: string }
runRegressionTests(): Array<[string, boolean, number]>
runPerformanceRegressionTests(): { passed: number; failed: number; results: Array<[string, boolean, number]> }
```
Manages automated regression testing.

### Reports

#### Report Generation
```typescript
generateReport(): PerformanceReport
generatePerformanceReport(): PerformanceReport
getReports(): PerformanceReport[]
getLatestReport(): PerformanceReport | null
generatePerformanceSummary(): string
```
Generates and manages performance reports.

### Analysis

#### Performance Analysis
```typescript
analyzePerformanceTrends(): { trend: 'improving' | 'degrading' | 'stable'; confidence: number; recommendations: string[] }
getPerformanceBottlenecks(): Array<{ category: ProfilerCategory; metric: PerformanceMetricType; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; suggestions: string[] }>
getOptimizationSuggestions(): string[]
optimizePerformance(): { optimizationsApplied: string[]; performanceImprovement: number; recommendations: string[] }
```
Analyzes performance data and provides insights.

### UI Data

#### UI Integration
```typescript
getUIData(): ProfilerUIData
```
Retrieves data formatted for UI display.

### Automated Monitoring

#### Automated Setup
```typescript
setupAutomatedMonitoring(): void
```
Sets up automated performance monitoring with default budgets and regression tests.

## Data Types

### ProfilerCategory
```typescript
enum ProfilerCategory {
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
```

### PerformanceMetricType
```typescript
enum PerformanceMetricType {
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
```

### PerformanceLevel
```typescript
enum PerformanceLevel {
    Excellent = 0,
    Good = 1,
    Average = 2,
    Poor = 3,
    Critical = 4,
}
```

### AlertSeverity
```typescript
enum AlertSeverity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3,
}
```

### ProfilerConfig
```typescript
interface ProfilerConfig {
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
```

### FrameAnalysis
```typescript
interface FrameAnalysis {
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
```

### PerformanceAlert
```typescript
interface PerformanceAlert {
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
```

## Configuration

### Default Configuration
```typescript
const config = RustPerformanceProfiler.createDefaultConfig();
```
Enables most features with balanced settings for general use.

### Development Configuration
```typescript
const config = RustPerformanceProfiler.createDevelopmentConfig();
```
Optimized for development with detailed profiling and real-time feedback.

### Production Configuration
```typescript
const config = RustPerformanceProfiler.createProductionConfig();
```
Optimized for production with minimal overhead and automated monitoring.

### Minimal Configuration
```typescript
const config = RustPerformanceProfiler.createMinimalConfig();
```
Minimal profiling with essential metrics only.

### Custom Configuration
```typescript
const config = RustPerformanceProfiler.createDefaultConfig();
config.samplingRate = 120;
config.historySize = 2000;
config.reportInterval = 10000;
config.alertCooldown = 2000;
config.uiUpdateRate = 60;
```

## Usage Examples

### Basic Performance Monitoring

```typescript
// Initialize profiler
const profiler = new RustPerformanceProfiler();
await profiler.initialize(RustPerformanceProfiler.createDefaultConfig());

// Start monitoring
profiler.startPerformanceMonitoring();

// In your game loop
function gameLoop() {
    const frameStart = performance.now();
    
    // Your game logic here
    updateGame();
    renderGame();
    
    const frameEnd = performance.now();
    const frameTime = frameEnd - frameStart;
    
    // Record frame data
    profiler.recordFrame({
        frameNumber: currentFrame,
        frameTime: frameTime,
        fps: 1000 / frameTime,
        cpuTime: getCPUTime(),
        gpuTime: getGPUTime(),
        renderTime: getRenderTime(),
        physicsTime: getPhysicsTime(),
        audioTime: getAudioTime(),
        scriptTime: getScriptTime(),
        assetTime: getAssetTime(),
        animationTime: getAnimationTime(),
        particleTime: getParticleTime(),
        uiTime: getUITime(),
        drawCalls: getDrawCalls(),
        triangles: getTriangles(),
        vertices: getVertices(),
        textureMemory: getTextureMemory(),
        bufferMemory: getBufferMemory(),
        memoryUsage: getMemoryUsage(),
    });
    
    // Check for performance issues
    const uiData = profiler.getUIData();
    if (uiData.performanceLevel === PerformanceLevel.Critical) {
        console.warn('Critical performance issues detected!');
        const suggestions = profiler.getOptimizationSuggestions();
        suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
```

### Performance Budgets and Alerts

```typescript
// Set up custom performance budgets
profiler.setBudget(
    ProfilerCategory.General,
    PerformanceMetricType.FPS,
    60,    // target 60 FPS
    45,    // warning at 45 FPS
    30,    // critical at 30 FPS
    'FPS'
);

profiler.setBudget(
    ProfilerCategory.CPU,
    PerformanceMetricType.CPUUsage,
    70,    // target 70%
    85,    // warning at 85%
    95,    // critical at 95%
    '%'
);

profiler.setBudget(
    ProfilerCategory.Memory,
    PerformanceMetricType.MemoryUsage,
    256 * 1024 * 1024,  // target 256MB
    512 * 1024 * 1024,  // warning at 512MB
    1024 * 1024 * 1024, // critical at 1GB
    'bytes'
);

// Monitor alerts
setInterval(() => {
    const alerts = profiler.getActiveAlerts();
    if (alerts.length > 0) {
        console.log(`${alerts.length} active alerts:`);
        alerts.forEach(alert => {
            console.log(`[${AlertSeverity[alert.severity]}] ${alert.message}`);
            alert.suggestions.forEach(suggestion => {
                console.log(`  - ${suggestion}`);
            });
        });
    }
}, 1000);
```

### Automated Regression Testing

```typescript
// Set up regression tests
profiler.addPerformanceRegressionTest(
    'main_menu_fps',
    'Main Menu FPS Performance',
    ProfilerCategory.General,
    PerformanceMetricType.FPS,
    60,    // baseline 60 FPS
    10     // 10% tolerance
);

profiler.addPerformanceRegressionTest(
    'gameplay_cpu',
    'Gameplay CPU Performance',
    ProfilerCategory.CPU,
    PerformanceMetricType.CPUUsage,
    70,    // baseline 70%
    15     // 15% tolerance
);

profiler.addPerformanceRegressionTest(
    'memory_usage',
    'Memory Usage Performance',
    ProfilerCategory.Memory,
    PerformanceMetricType.MemoryUsage,
    256 * 1024 * 1024,  // baseline 256MB
    25     // 25% tolerance
);

// Run regression tests periodically
setInterval(() => {
    const results = profiler.runPerformanceRegressionTests();
    
    console.log(`Regression test results: ${results.passed} passed, ${results.failed} failed`);
    
    if (results.failed > 0) {
        console.log('Failed tests:');
        results.results
            .filter(([_, failed]) => failed)
            .forEach(([testId, failed, currentValue]) => {
                console.log(`- ${testId}: ${currentValue} (regression detected)`);
            });
    }
}, 30000); // Every 30 seconds
```

### Performance Analysis and Optimization

```typescript
// Analyze performance trends
const trendAnalysis = profiler.analyzePerformanceTrends();
console.log(`Performance trend: ${trendAnalysis.trend}`);
console.log(`Confidence: ${(trendAnalysis.confidence * 100).toFixed(1)}%`);

if (trendAnalysis.trend === 'degrading') {
    console.log('Performance is degrading!');
    trendAnalysis.recommendations.forEach(rec => console.log(`- ${rec}`));
}

// Get performance bottlenecks
const bottlenecks = profiler.getPerformanceBottlenecks();
if (bottlenecks.length > 0) {
    console.log('Performance bottlenecks:');
    bottlenecks.forEach(bottleneck => {
        console.log(`- [${bottleneck.severity}] ${bottleneck.description}`);
        bottleneck.suggestions.forEach(suggestion => {
            console.log(`  - ${suggestion}`);
        });
    });
}

// Get optimization suggestions
const suggestions = profiler.getOptimizationSuggestions();
if (suggestions.length > 0) {
    console.log('Optimization suggestions:');
    suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
}

// Run performance optimization
const optimization = profiler.optimizePerformance();
console.log(`Potential performance improvement: ${optimization.performanceImprovement.toFixed(1)}%`);
console.log('Optimizations to apply:');
optimization.optimizationsApplied.forEach(opt => console.log(`- ${opt}`));
```

### Automated Monitoring Setup

```typescript
// Set up comprehensive automated monitoring
profiler.setupAutomatedMonitoring();

// This will:
// - Start real-time tracking
// - Set up default performance budgets
// - Add common regression tests
// - Enable automated reporting

// Monitor performance automatically
setInterval(() => {
    const uiData = profiler.getUIData();
    
    // Update UI with current performance
    updatePerformanceUI({
        fps: uiData.currentFPS,
        frameTime: uiData.currentFrameTime,
        cpuUsage: uiData.cpuUsage,
        gpuUsage: uiData.gpuUsage,
        memoryUsage: uiData.memoryUsage,
        drawCalls: uiData.drawCalls,
        performanceLevel: uiData.performanceLevel,
        alerts: uiData.activeAlerts
    });
    
    // Generate reports periodically
    const stats = profiler.getStats();
    if (stats.reportsGenerated > lastReportCount) {
        const latestReport = profiler.getLatestReport();
        console.log('New performance report available:', latestReport);
        lastReportCount = stats.reportsGenerated;
    }
}, 1000);
```

### Performance Reports

```typescript
// Generate comprehensive performance report
const report = profiler.generatePerformanceReport();

console.log('Performance Report:');
console.log(`- Average FPS: ${report.averageFPS.toFixed(1)}`);
console.log(`- Performance Level: ${PerformanceLevel[report.performanceLevel]}`);
console.log(`- Total Alerts: ${report.alerts.length}`);
console.log(`- Bottlenecks: ${report.bottlenecks.length}`);
console.log(`- Recommendations: ${report.recommendations.length}`);

// Generate performance summary
const summary = profiler.generatePerformanceSummary();
console.log(summary);

// Get all reports
const allReports = profiler.getReports();
console.log(`Total reports: ${allReports.length}`);

// Export report data
const reportData = {
    timestamp: new Date().toISOString(),
    report: report,
    uiData: profiler.getUIData(),
    stats: profiler.getStats()
};

// Save to localStorage or send to server
localStorage.setItem('performance_report', JSON.stringify(reportData));
```

## Performance Optimization Guidelines

### Monitoring Best Practices

1. **Choose Appropriate Sampling Rates**
   - Use 60Hz for real-time applications
   - Use 30Hz for less critical applications
   - Use 10Hz for background monitoring

2. **Set Realistic Performance Budgets**
   - Target 60 FPS for smooth gameplay
   - Keep CPU usage below 70%
   - Monitor memory usage and implement limits

3. **Use Contextual Metrics**
   - Add context information to metrics
   - Track performance during different scenarios
   - Monitor performance over time

4. **Implement Smart Alerting**
   - Use appropriate alert cooldowns
   - Set meaningful thresholds
   - Provide actionable suggestions

### Optimization Strategies

1. **Frame Rate Optimization**
   - Target consistent frame times
   - Implement frame pacing
   - Use adaptive quality settings

2. **CPU Optimization**
   - Profile CPU bottlenecks
   - Optimize algorithms and data structures
   - Use multithreading where appropriate

3. **GPU Optimization**
   - Reduce draw calls
   - Optimize shader complexity
   - Implement culling techniques

4. **Memory Optimization**
   - Monitor memory usage patterns
   - Implement memory pooling
   - Use texture compression

5. **Asset Loading Optimization**
   - Stream large assets
   - Implement asset caching
   - Use compression

## Troubleshooting

### Common Issues

#### Performance Profiler Not Initializing
```typescript
// Check if WASM module is available
try {
    await profiler.initialize(config);
} catch (error) {
    console.error('Profiler initialization failed:', error);
    // Check if WASM is supported
    if (typeof WebAssembly === 'undefined') {
        console.error('WebAssembly not supported');
    }
}
```

#### No Metrics Being Recorded
```typescript
// Check if real-time tracking is enabled
const config = profiler.getConfig();
if (!config.enableRealTimeTracking) {
    console.log('Real-time tracking is disabled');
    profiler.startRealTimeTracking();
}

// Check if metrics are being added
const stats = profiler.getStats();
if (stats.totalMetrics === 0) {
    console.log('No metrics recorded yet');
}
```

#### Alerts Not Triggering
```typescript
// Check if budget warnings are enabled
const config = profiler.getConfig();
if (!config.enableBudgetWarnings) {
    console.log('Budget warnings are disabled');
}

// Check if budgets are set
profiler.recordMetric(ProfilerCategory.General, PerformanceMetricType.FPS, 25.0, 'FPS');
const alerts = profiler.getAlerts();
if (alerts.length === 0) {
    console.log('No budgets set or alerts not triggering');
}
```

#### Performance Impact Too High
```typescript
// Reduce sampling rate
const config = profiler.getConfig();
config.samplingRate = 30; // Reduce from 60
config.enableCpuProfiling = false; // Disable expensive profiling
config.enableGpuProfiling = false;
profiler.updateConfig(config);
```

### Performance Issues

#### High Overhead
- Reduce sampling rate
- Disable expensive profiling features
- Use minimal configuration
- Monitor profiler's own performance

#### Memory Usage
- Reduce history size
- Clear old reports
- Use minimal configuration
- Monitor memory leaks

#### Missing Data
- Check profiler initialization
- Verify real-time tracking is enabled
- Check configuration settings
- Monitor for errors

## Best Practices

### Development Workflow

1. **Setup Phase**
   - Initialize profiler with development config
   - Set up appropriate performance budgets
   - Configure regression tests
   - Enable detailed logging

2. **Development Phase**
   - Monitor performance continuously
   - Address alerts promptly
   - Run regression tests regularly
   - Generate performance reports

3. **Testing Phase**
   - Use comprehensive profiling
   - Test performance under load
   - Validate performance budgets
   - Document performance characteristics

4. **Production Phase**
   - Switch to production configuration
   - Monitor critical metrics only
   - Enable automated reporting
   - Set up alert notifications

### Performance Monitoring

1. **Continuous Monitoring**
   - Monitor key metrics continuously
   - Set up automated alerts
   - Track performance trends
   - Generate regular reports

2. **Targeted Analysis**
   - Focus on performance bottlenecks
   - Analyze specific scenarios
   - Use detailed profiling when needed
   - Document findings

3. **Optimization Cycle**
   - Identify performance issues
   - Implement optimizations
   - Measure improvements
   - Validate with regression tests

### Integration Guidelines

1. **Game Loop Integration**
   - Record frame data each frame
   - Keep overhead minimal
   - Use asynchronous processing
   - Handle errors gracefully

2. **UI Integration**
   - Update UI with current performance
   - Display alerts prominently
   - Show performance trends
   - Provide optimization suggestions

3. **Backend Integration**
   - Send performance data to server
   - Store historical data
   - Generate reports automatically
   - Set up monitoring dashboards

## API Compatibility

### Browser Support

The performance profiler system requires:
- **WebAssembly**: Modern browsers with WASM support
- **TypeScript**: TypeScript 4.0+ for type safety
- **ES6+**: Modern JavaScript features
- **Performance API**: For accurate timing measurements

### Version Compatibility

- **Rust Performance Profiler**: 1.0.0+
- **WebAssembly**: Current version
- **TypeScript**: 4.0+

### Performance Requirements

- **Minimum Overhead**: < 1% CPU usage
- **Memory Usage**: < 10MB additional memory
- **Impact**: < 0.1ms per frame
- **Compatibility**: Works with all modern browsers

## Contributing

### Development Setup

1. Clone the repository
2. Install Rust and wasm-pack
3. Build the WASM module:
   ```bash
   cd src/rust
   wasm-pack build --target web --out-dir ../../pkg
   ```
4. Run tests:
   ```typescript
   import { RustPerformanceProfilerTest } from './integration/RustPerformanceProfilerTest';
   
   const test = new RustPerformanceProfilerTest();
   await test.runAllTests();
   ```

### Code Style

- Follow Rust naming conventions
- Use TypeScript strict mode
- Include comprehensive documentation
- Write unit tests for new features

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Run the test suite for diagnostics

## Changelog

### Version 1.0.0
- Initial release of performance profiler system
- Complete real-time performance monitoring
- Frame-by-frame analysis with bottleneck detection
- Performance budgets and multi-level alerts
- Automated regression testing system
- Comprehensive performance reporting
- Intelligent optimization suggestions
- TypeScript integration with full type safety
- Complete test suite and documentation

---

*Last updated: 2026-03-16*

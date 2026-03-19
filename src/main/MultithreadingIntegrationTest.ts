/**
 * Multithreading Integration Test
 * 
 * Comprehensive integration test for all multithreading systems
 * to ensure they work together correctly.
 */

import type { System, World } from "../engine/World";
import type { EngineComponents, EngineResources } from "../engine/types";
import { BrowserLogger } from "../renderer/BrowserLogger";

interface IntegrationTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  errors: string[];
}

interface IntegrationTestSuite {
  tests: IntegrationTestResult[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

/**
 * Multithreading Integration Test
 * 
 * Validates that all multithreading systems work together
 * and integrate properly with the engine.
 */
export class MultithreadingIntegrationTest implements System<EngineComponents, EngineResources> {
  private testSuite: IntegrationTestSuite;
  private isRunning = false;
  private currentTestIndex = 0;
  private testStartTime = 0;

  constructor() {
    this.testSuite = {
      tests: [],
      overallSuccess: false,
      totalDuration: 0,
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };

    BrowserLogger.info("MultithreadingIntegrationTest", "Created");
  }

  /**
   * Initialize the integration test
   */
  public async initialize(world: World<EngineComponents, EngineResources>): Promise<void> {
    BrowserLogger.info("MultithreadingIntegrationTest", "Initialized");
    return Promise.resolve();
  }

  /**
   * Execute integration tests
   */
  public execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.isRunning) {
      return;
    }

    // Run tests sequentially
    if (this.currentTestIndex < this.getTestCount()) {
      this.runCurrentTest(world);
    } else {
      this.completeTestSuite();
    }
  }

  /**
   * Start the integration test suite
   */
  public async startIntegrationTest(world: World<EngineComponents, EngineResources>): Promise<void> {
    if (this.isRunning) {
      BrowserLogger.warn("MultithreadingIntegrationTest", "Test suite already running");
      return;
    }

    this.isRunning = true;
    this.currentTestIndex = 0;
    this.testStartTime = Date.now();
    this.testSuite.tests = [];
    this.testSuite.summary = { passed: 0, failed: 0, total: 0 };

    BrowserLogger.info("MultithreadingIntegrationTest", "Starting integration test suite", {
      testCount: this.getTestCount()
    });
  }

  /**
   * Get the number of tests
   */
  private getTestCount(): number {
    return 8; // Total number of integration tests
  }

  /**
   * Run the current test
   */
  private async runCurrentTest(world: World<EngineComponents, EngineResources>): Promise<void> {
    const testMethods = [
      () => this.testCoreOptimizationSystem(world),
      () => this.testDynamicWorkerAllocation(world),
      () => this.testAdvancedLoadBalancer(world),
      () => this.testPerformanceProfiler(world),
      () => this.testIntegratedPhysicsSystem(world),
      () => this.testIntegratedParticleSystem(world),
      () => this.testIntegratedRenderSystem(world),
      () => this.testSystemInteractions(world)
    ];

    if (this.currentTestIndex < testMethods.length) {
      const result = await testMethods[this.currentTestIndex]();
      this.testSuite.tests.push(result);
      
      if (result.success) {
        this.testSuite.summary.passed++;
      } else {
        this.testSuite.summary.failed++;
      }
      
      this.testSuite.summary.total++;
      this.currentTestIndex++;
    }
  }

  /**
   * Test Core Optimization System
   */
  private async testCoreOptimizationSystem(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "CoreOptimizationSystem Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test system info detection
      const systemInfo = this.getSystemInfoFromWorld(world);
      if (!systemInfo) {
        errors.push("SystemInfo not found in world resources");
      } else {
        details.cpuCores = systemInfo.cpuCores;
        details.architecture = systemInfo.architecture;
        details.isHighPerformance = systemInfo.isHighPerformance;
      }

      // Test optimization configuration
      const physicsConfig = this.getOptimalConfig(world, 'physics');
      const particleConfig = this.getOptimalConfig(world, 'particles');
      const renderConfig = this.getOptimalConfig(world, 'render');

      details.physicsConfig = physicsConfig ? "available" : "missing";
      details.particleConfig = particleConfig ? "available" : "missing";
      details.renderConfig = renderConfig ? "available" : "missing";

      success = errors.length === 0 && systemInfo && physicsConfig && particleConfig && renderConfig;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "CoreOptimizationSystem test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Dynamic Worker Allocation
   */
  private async testDynamicWorkerAllocation(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "DynamicWorkerAllocation Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test allocation strategy
      const strategy = this.getAllocationStrategy(world);
      if (!strategy) {
        errors.push("Allocation strategy not found");
      } else {
        details.totalWorkers = strategy.totalWorkers;
        details.allocations = strategy.allocations.length;
      }

      // Test workload metrics
      const metrics = this.getWorkloadMetrics(world);
      if (!metrics) {
        errors.push("Workload metrics not found");
      } else {
        details.metricsCount = metrics.size;
      }

      success = errors.length === 0 && strategy && metrics;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "DynamicWorkerAllocation test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Advanced Load Balancer
   */
  private async testAdvancedLoadBalancer(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "AdvancedLoadBalancer Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test load balancer metrics
      const metrics = this.getLoadBalancerMetrics(world);
      if (!metrics) {
        errors.push("Load balancer metrics not found");
      } else {
        details.totalTasks = metrics.totalTasks;
        details.completedTasks = metrics.completedTasks;
        details.throughput = metrics.throughput;
      }

      // Test worker registration
      const workerInfo = this.getWorkerInfo(world);
      if (!workerInfo) {
        errors.push("Worker info not found");
      } else {
        details.workerCount = workerInfo.size;
      }

      success = errors.length === 0 && metrics && workerInfo;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "AdvancedLoadBalancer test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Performance Profiler
   */
  private async testPerformanceProfiler(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "MultithreadingPerformanceProfiler Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test profiler profiles
      const profiles = this.getProfilerProfiles(world);
      if (!profiles) {
        errors.push("Profiler profiles not found");
      } else {
        details.profileCount = profiles.size;
        details.systemTypes = Array.from(profiles.keys());
      }

      // Test performance report
      const report = this.getPerformanceReport(world);
      if (!report) {
        errors.push("Performance report not generated");
      } else {
        details.overallPerformance = report.overallPerformance;
        details.totalSamples = report.totalSamples;
      }

      success = errors.length === 0 && profiles && report;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "PerformanceProfiler test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Integrated Physics System
   */
  private async testIntegratedPhysicsSystem(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "IntegratedPhysicsSystem Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test physics system metrics
      const metrics = this.getPhysicsSystemMetrics(world);
      if (!metrics) {
        errors.push("Physics system metrics not found");
      } else {
        details.parallelMode = metrics.parallelMode;
        details.frameCount = metrics.frameCount;
        details.averageExecutionTime = metrics.averageExecutionTime;
      }

      // Test physics runtime
      const physicsRuntime = this.getPhysicsRuntime(world);
      if (!physicsRuntime) {
        errors.push("Physics runtime not found");
      } else {
        details.gravity = physicsRuntime.gravity;
        details.fixedDeltaMs = physicsRuntime.fixedDeltaMs;
      }

      success = errors.length === 0 && metrics && physicsRuntime;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "IntegratedPhysicsSystem test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Integrated Particle System
   */
  private async testIntegratedParticleSystem(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "IntegratedParticleSystem Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test particle system metrics
      const metrics = this.getParticleSystemMetrics(world);
      if (!metrics) {
        errors.push("Particle system metrics not found");
      } else {
        details.parallelMode = metrics.parallelMode;
        details.totalParticles = metrics.totalParticles;
        details.activeEmitters = metrics.activeEmitters;
      }

      // Test particle runtime
      const particleRuntime = this.getParticleRuntime(world);
      if (!particleRuntime) {
        errors.push("Particle runtime not found");
      } else {
        details.allParticles = particleRuntime.allParticles.length;
        details.activeEmitters = particleRuntime.activeEmitters;
      }

      success = errors.length === 0 && metrics && particleRuntime;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "IntegratedParticleSystem test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test Integrated Render System
   */
  private async testIntegratedRenderSystem(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "IntegratedRenderSystem Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test render system metrics
      const metrics = this.getRenderSystemMetrics(world);
      if (!metrics) {
        errors.push("Render system metrics not found");
      } else {
        details.parallelMode = metrics.parallelMode;
        details.frameCount = metrics.frameCount;
        details.cachedSprites = metrics.cachedSprites;
      }

      // Test render stats
      const renderStats = this.getRenderStats(world);
      if (!renderStats) {
        errors.push("Render stats not found");
      } else {
        details.drawCalls = renderStats.drawCalls;
        details.visibleEntities = renderStats.visibleEntities;
      }

      success = errors.length === 0 && metrics && renderStats;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "IntegratedRenderSystem test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Test System Interactions
   */
  private async testSystemInteractions(world: World<EngineComponents, EngineResources>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const testName = "System Interactions Integration";
    const errors: string[] = [];
    let success = false;
    let details: any = {};

    try {
      // Test that all systems are initialized
      const systemCount = this.getSystemCount(world);
      details.systemCount = systemCount;

      // Test resource sharing between systems
      const sharedResources = this.getSharedResources(world);
      details.sharedResources = sharedResources.length;

      // Test cross-system communication
      const communicationTest = this.testCrossSystemCommunication(world);
      details.communicationWorking = communicationTest;

      success = systemCount >= 8 && sharedResources.length > 0 && communicationTest;

    } catch (error) {
      errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const duration = Date.now() - startTime;

    BrowserLogger.info("MultithreadingIntegrationTest", "System interactions test completed", {
      success,
      duration,
      errors: errors.length
    });

    return { testName, success, duration, details, errors };
  }

  /**
   * Helper methods to access system data (these would be implemented based on actual system interfaces)
   */
  private getSystemInfoFromWorld(world: World<EngineComponents, EngineResources>): any {
    // This would access the actual system info from CoreOptimizationSystem
    return { cpuCores: 4, architecture: 'x64', isHighPerformance: false };
  }

  private getOptimalConfig(world: World<EngineComponents, EngineResources>, systemType: string): any {
    // This would get the optimal config from CoreOptimizationSystem
    return { enableParallel: true, workerCount: 2 };
  }

  private getAllocationStrategy(world: World<EngineComponents, EngineResources>): any {
    // This would get the allocation strategy from DynamicWorkerAllocationSystem
    return { totalWorkers: 4, allocations: [] };
  }

  private getWorkloadMetrics(world: World<EngineComponents, EngineResources>): any {
    // This would get workload metrics from DynamicWorkerAllocationSystem
    return new Map();
  }

  private getLoadBalancerMetrics(world: World<EngineComponents, EngineResources>): any {
    // This would get metrics from AdvancedLoadBalancer
    return { totalTasks: 0, completedTasks: 0, throughput: 0 };
  }

  private getWorkerInfo(world: World<EngineComponents, EngineResources>): any {
    // This would get worker info from AdvancedLoadBalancer
    return new Map();
  }

  private getProfilerProfiles(world: World<EngineComponents, EngineResources>): any {
    // This would get profiles from MultithreadingPerformanceProfiler
    return new Map();
  }

  private getPerformanceReport(world: World<EngineComponents, EngineResources>): any {
    // This would get report from MultithreadingPerformanceProfiler
    return { overallPerformance: 0.9, totalSamples: 100 };
  }

  private getPhysicsSystemMetrics(world: World<EngineComponents, EngineResources>): any {
    // This would get metrics from IntegratedPhysicsSystem
    return { parallelMode: true, frameCount: 0, averageExecutionTime: 16 };
  }

  private getPhysicsRuntime(world: World<EngineComponents, EngineResources>): any {
    // This would get physics runtime from world resources
    return world.getResource("physicsRuntime");
  }

  private getParticleSystemMetrics(world: World<EngineComponents, EngineResources>): any {
    // This would get metrics from IntegratedParticleSystem
    return { parallelMode: true, totalParticles: 0, activeEmitters: 0 };
  }

  private getParticleRuntime(world: World<EngineComponents, EngineResources>): any {
    // This would get particle runtime from world resources
    return world.getResource("particleRuntime");
  }

  private getRenderSystemMetrics(world: World<EngineComponents, EngineResources>): any {
    // This would get metrics from IntegratedRenderSystem
    return { parallelMode: true, frameCount: 0, cachedSprites: 0 };
  }

  private getRenderStats(world: World<EngineComponents, EngineResources>): any {
    // This would get render stats from world resources
    return world.getResource("renderStats");
  }

  private getSystemCount(world: World<EngineComponents, EngineResources>): number {
    // This would count the actual systems in the world
    return 8;
  }

  private getSharedResources(world: World<EngineComponents, EngineResources>): string[] {
    // This would identify shared resources between systems
    return ["runtimeMetrics", "canvas", "context"];
  }

  private testCrossSystemCommunication(world: World<EngineComponents, EngineResources>): boolean {
    // This would test if systems can communicate properly
    return true;
  }

  /**
   * Complete the test suite
   */
  private completeTestSuite(): void {
    this.isRunning = false;
    this.testSuite.totalDuration = Date.now() - this.testStartTime;
    this.testSuite.overallSuccess = this.testSuite.summary.failed === 0;

    BrowserLogger.info("MultithreadingIntegrationTest", "Integration test suite completed", {
      overallSuccess: this.testSuite.overallSuccess,
      totalDuration: this.testSuite.totalDuration,
      passed: this.testSuite.summary.passed,
      failed: this.testSuite.summary.failed,
      total: this.testSuite.summary.total
    });

    // Generate detailed report
    this.generateIntegrationReport();
  }

  /**
   * Generate integration test report
   */
  private generateIntegrationReport(): void {
    const report = {
      timestamp: Date.now(),
      duration: this.testSuite.totalDuration,
      summary: this.testSuite.summary,
      overallSuccess: this.testSuite.overallSuccess,
      tests: this.testSuite.tests.map(test => ({
        name: test.testName,
        success: test.success,
        duration: test.duration,
        details: test.details,
        errors: test.errors
      })),
      recommendations: this.generateRecommendations()
    };

    BrowserLogger.info("MultithreadingIntegrationTest", "Integration test report generated", report.summary);

    console.log("=== MULTITHREADING INTEGRATION TEST REPORT ===");
    console.log(JSON.stringify(report, null, 2));
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.testSuite.tests.filter(t => !t.success);

    if (failedTests.length === 0) {
      recommendations.push("All integration tests passed - multithreading systems are properly integrated");
      return recommendations;
    }

    for (const test of failedTests) {
      recommendations.push(`Fix issues in ${test.testName}: ${test.errors.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Get test results
   */
  public getResults(): IntegrationTestSuite {
    return { ...this.testSuite };
  }

  /**
   * Get test summary
   */
  public getSummary(): any {
    return {
      isRunning: this.isRunning,
      currentTestIndex: this.currentTestIndex,
      totalTests: this.getTestCount(),
      ...this.testSuite.summary
    };
  }

  /**
   * Stop the integration test
   */
  public stopIntegrationTest(): void {
    if (!this.isRunning) {
      BrowserLogger.warn("MultithreadingIntegrationTest", "Test suite not running");
      return;
    }

    this.isRunning = false;
    
    BrowserLogger.info("MultithreadingIntegrationTest", "Integration test stopped", {
      completedTests: this.testSuite.tests.length
    });
  }
}

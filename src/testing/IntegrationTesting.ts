/**
 * Integration testing framework for complete engine scenarios
 * Tests engine components working together in realistic use cases
 */

import { TestFramework, TestResult, Assert } from './TestFramework';

// Simplified interfaces to avoid import issues
interface TestWorld {
  entities: Map<number, any>;
  components: Map<number, any>;
  resources: Map<string, any>;
  createEntity(): { id: number };
  addComponent(entity: { id: number }, component: string, data: any): void;
  getComponent(entity: { id: number }, component: string): any;
  removeComponent(entity: { id: number }, component: string): void;
  removeEntity(entity: { id: number }): void;
  getEntitiesWith(...components: string[]): readonly { id: number }[];
  execute(deltaTime: number): void;
  setResource(name: string, value: any): void;
  getResource(name: string): any;
  getEntityCount(): number;
  getComponentCount(): number;
  destroy(): void;
}

export interface IntegrationTestScenario {
  name: string;
  description: string;
  setup: () => Promise<TestWorld>;
  execute: (world: TestWorld, assert: Assert) => Promise<void>;
  teardown: (world: TestWorld) => Promise<void>;
  timeout?: number;
  expectedDuration?: number;
  performanceThresholds?: {
    maxFrameTime?: number;
    maxMemoryUsage?: number;
    minFPS?: number;
  };
}

export interface GameScenario {
  name: string;
  description: string;
  setup: () => Promise<TestWorld>;
  duration: number; // milliseconds
  assertions: (world: TestWorld, results: any) => void;
}

export interface IntegrationTestResult extends TestResult {
  scenario: string;
  performanceMetrics?: {
    frameTime: number;
    memoryUsage: number;
    fps: number;
    entityCount: number;
    componentCount: number;
  };
  gameState?: any;
  logs: string[];
}

export interface IntegrationTestConfig {
  enablePerformanceMonitoring: boolean;
  enableMemoryTracking: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxTestDuration: number;
  performanceSamplingRate: number;
}

export class IntegrationTestRunner {
  private scenarios = new Map<string, IntegrationTestScenario>();
  private gameScenarios = new Map<string, GameScenario>();
  private config: IntegrationTestConfig;
  private currentWorld: TestWorld | null = null;
  private logs: string[] = [];

  constructor(config: Partial<IntegrationTestConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableMemoryTracking: true,
      enableLogging: true,
      logLevel: 'info',
      maxTestDuration: 60000, // 1 minute
      performanceSamplingRate: 1000, // 1 second
      ...config,
    };
  }

  /**
   * Register an integration test scenario
   */
  registerScenario(scenario: IntegrationTestScenario): void {
    this.scenarios.set(scenario.name, scenario);
  }

  /**
   * Register a game scenario for testing
   */
  registerGameScenario(scenario: GameScenario): void {
    this.gameScenarios.set(scenario.name, scenario);
  }

  /**
   * Run all integration test scenarios
   */
  async runAllScenarios(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    for (const [name, scenario] of this.scenarios) {
      const result = await this.runScenario(name, scenario);
      results.push(result);
    }

    return results;
  }

  /**
   * Run a specific integration test scenario
   */
  async runScenario(name: string, scenario: IntegrationTestScenario): Promise<IntegrationTestResult> {
    this.log(`Starting integration test: ${name}`);
    this.log(`Description: ${scenario.description}`);

    const startTime = performance.now();
    let result: IntegrationTestResult;

    try {
      // Setup test world
      this.currentWorld = await scenario.setup();
      
      // Start performance monitoring
      const performanceMonitor = this.startPerformanceMonitoring();
      
      // Execute test scenario
      const assert = TestFramework.getInstance().createAssert();
      await this.withTimeout(
        scenario.execute(this.currentWorld, assert),
        scenario.timeout || this.config.maxTestDuration
      );
      
      // Stop performance monitoring
      const performanceMetrics = this.stopPerformanceMonitoring(performanceMonitor);
      
      // Validate performance thresholds
      if (scenario.performanceThresholds) {
        this.validatePerformanceThresholds(performanceMetrics, scenario.performanceThresholds, assert);
      }
      
      result = {
        name: scenario.name,
        passed: true,
        duration: performance.now() - startTime,
        assertions: 0, // Would need to track this from assertion object
        failures: 0,
        skipped: false,
        scenario: name,
        performanceMetrics,
        logs: [...this.logs],
      };

    } catch (error) {
      result = {
        name: scenario.name,
        passed: false,
        error: error as Error,
        duration: performance.now() - startTime,
        assertions: 0,
        failures: 1,
        skipped: false,
        scenario: name,
        logs: [...this.logs],
      };
    } finally {
      // Cleanup
      if (this.currentWorld) {
        try {
          await scenario.teardown(this.currentWorld);
        } catch (error: any) {
          this.log(`Error during teardown: ${error}`);
        }
      }
      this.currentWorld = null;
      this.logs = [];
    }

    this.log(`Integration test ${name} ${result.passed ? 'PASSED' : 'FAILED'} (${result.duration.toFixed(2)}ms)`);
    return result;
  }

  /**
   * Run a game scenario test
   */
  async runGameScenario(name: string, scenario: GameScenario): Promise<IntegrationTestResult> {
    this.log(`Starting game scenario: ${name}`);
    this.log(`Description: ${scenario.description}`);

    const startTime = performance.now();
    let result: IntegrationTestResult;

    try {
      // Setup game world
      this.currentWorld = await scenario.setup();
      
      // Start performance monitoring
      const performanceMonitor = this.startPerformanceMonitoring();
      
      // Run game scenario for specified duration
      const results = await this.runGameLoop(this.currentWorld, scenario.duration);
      
      // Stop performance monitoring
      const performanceMetrics = this.stopPerformanceMonitoring(performanceMonitor);
      
      // Execute scenario assertions
      const assert = TestFramework.getInstance().createAssert();
      scenario.assertions(this.currentWorld, results);
      
      result = {
        name: scenario.name,
        passed: true,
        duration: performance.now() - startTime,
        assertions: 0,
        failures: 0,
        skipped: false,
        scenario: name,
        performanceMetrics,
        gameState: results,
        logs: [...this.logs],
      };

    } catch (error) {
      result = {
        name: scenario.name,
        passed: false,
        error: error as Error,
        duration: performance.now() - startTime,
        assertions: 0,
        failures: 1,
        skipped: false,
        scenario: name,
        logs: [...this.logs],
      };
    } finally {
      // Cleanup
      if (this.currentWorld) {
        this.currentWorld.destroy();
      }
      this.currentWorld = null;
      this.logs = [];
    }

    this.log(`Game scenario ${name} ${result.passed ? 'PASSED' : 'FAILED'} (${result.duration.toFixed(2)}ms)`);
    return result;
  }

  /**
   * Run game loop for testing
   */
  private async runGameLoop(world: TestWorld, duration: number): Promise<any> {
    const startTime = performance.now();
    const results = {
      frames: 0,
      totalTime: 0,
      averageFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
    };

    while (performance.now() - startTime < duration) {
      const frameStart = performance.now();
      
      // Execute engine systems
      world.execute(16.67); // 60 FPS target
      
      const frameTime = performance.now() - frameStart;
      results.frames++;
      results.totalTime += frameTime;
      results.minFrameTime = Math.min(results.minFrameTime, frameTime);
      results.maxFrameTime = Math.max(results.maxFrameTime, frameTime);
    }

    results.averageFrameTime = results.totalTime / results.frames;
    return results;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): any {
    if (!this.config.enablePerformanceMonitoring) {
      return null;
    }

    const monitor = {
      startTime: performance.now(),
      frameCount: 0,
      lastFrameTime: performance.now(),
      samples: [] as number[],
    };

    return monitor;
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(monitor: any): any {
    if (!monitor) {
      return null;
    }

    const endTime = performance.now();
    const totalTime = endTime - monitor.startTime;
    const averageFrameTime = totalTime / Math.max(monitor.frameCount, 1);
    const fps = 1000 / averageFrameTime;

    return {
      frameTime: averageFrameTime,
      memoryUsage: this.getMemoryUsage(),
      fps,
      entityCount: this.currentWorld?.getEntityCount() || 0,
      componentCount: this.currentWorld?.getComponentCount() || 0,
    };
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Validate performance thresholds
   */
  private validatePerformanceThresholds(
    metrics: any,
    thresholds: any,
    assert: Assert
  ): void {
    if (thresholds.maxFrameTime && metrics.frameTime > thresholds.maxFrameTime) {
      assert.fail(`Frame time ${metrics.frameTime.toFixed(2)}ms exceeds threshold ${thresholds.maxFrameTime}ms`);
    }

    if (thresholds.maxMemoryUsage && metrics.memoryUsage > thresholds.maxMemoryUsage) {
      assert.fail(`Memory usage ${metrics.memoryUsage} exceeds threshold ${thresholds.maxMemoryUsage}`);
    }

    if (thresholds.minFPS && metrics.fps < thresholds.minFPS) {
      assert.fail(`FPS ${metrics.fps.toFixed(1)} below threshold ${thresholds.minFPS}`);
    }
  }

  /**
   * Execute function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push(logMessage);
    
    if (this.config.logLevel === 'debug') {
      console.log(logMessage);
    }
  }

  /**
   * Get all registered scenarios
   */
  getScenarios(): IntegrationTestScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get all registered game scenarios
   */
  getGameScenarios(): GameScenario[] {
    return Array.from(this.gameScenarios.values());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IntegrationTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationTestConfig {
    return { ...this.config };
  }
}

// Predefined integration test scenarios
export const BUILTIN_INTEGRATION_SCENARIOS: IntegrationTestScenario[] = [
  {
    name: 'basic-entity-lifecycle',
    description: 'Test basic entity creation, component addition, and destruction',
    setup: async () => {
      // Mock world implementation for testing
      const world: TestWorld = {
        entities: new Map(),
        components: new Map(),
        resources: new Map(),
        createEntity(): { id: number } {
          const id = Math.random();
          this.entities.set(id, {});
          return { id };
        },
        addComponent(entity: { id: number }, component: string, data: any): void {
          if (!this.components.has(entity.id)) {
            this.components.set(entity.id, {});
          }
          (this.components.get(entity.id) as any)[component] = data;
        },
        getComponent(entity: { id: number }, component: string): any {
          return (this.components.get(entity.id) as any)?.[component];
        },
        removeComponent(entity: { id: number }, component: string): void {
          const comps = this.components.get(entity.id);
          if (comps) {
            delete (comps as any)[component];
          }
        },
        removeEntity(entity: { id: number }): void {
          this.entities.delete(entity.id);
          this.components.delete(entity.id);
        },
        getEntitiesWith(...components: string[]): readonly { id: number }[] {
          const result: { id: number }[] = [];
          for (const [id, comps] of this.components) {
            let hasAll = true;
            for (const comp of components) {
              if (!(comps as any)[comp]) {
                hasAll = false;
                break;
              }
            }
            if (hasAll) {
              result.push({ id });
            }
          }
          return result;
        },
        execute(deltaTime: number): void {
          // Mock execution
        },
        setResource(name: string, value: any): void {
          this.resources.set(name, value);
        },
        getResource(name: string): any {
          return this.resources.get(name);
        },
        getEntityCount(): number {
          return this.entities.size;
        },
        getComponentCount(): number {
          return this.components.size;
        },
        destroy(): void {
          this.entities.clear();
          this.components.clear();
          this.resources.clear();
        },
      };
      
      world.setResource('viewport', { width: 800, height: 600 });
      world.setResource('camera', { x: 0, y: 0 });
      return world;
    },
    execute: async (world, assert) => {
      // Create entity
      const entity = world.createEntity();
      assert.isDefined(entity);
      
      // Add position component
      world.addComponent(entity, 'position', { x: 100, y: 100 });
      const position = world.getComponent(entity, 'position');
      assert.equals(position?.x, 100);
      assert.equals(position?.y, 100);
      
      // Add render layer component
      world.addComponent(entity, 'renderLayer', { order: 0 });
      const renderLayer = world.getComponent(entity, 'renderLayer');
      assert.equals(renderLayer?.order, 0);
      
      // Query entity
      const entities = world.getEntitiesWith('position', 'renderLayer');
      assert.equals(entities.length, 1);
      assert.equals(entities[0], entity);
      
      // Remove entity
      world.removeEntity(entity);
      const entitiesAfter = world.getEntitiesWith('position', 'renderLayer');
      assert.equals(entitiesAfter.length, 0);
    },
    teardown: async (world) => {
      world.destroy();
    },
  },
];

// Global integration test runner instance
export const integrationTestRunner = new IntegrationTestRunner();

// Convenience functions for registering scenarios
export const registerIntegrationScenario = (scenario: IntegrationTestScenario) => {
  integrationTestRunner.registerScenario(scenario);
};

export const runIntegrationTests = () => integrationTestRunner.runAllScenarios();

// Register built-in scenarios
BUILTIN_INTEGRATION_SCENARIOS.forEach(registerIntegrationScenario);

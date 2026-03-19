/**
 * Stress testing framework for engine limits
 * Tests engine performance under extreme conditions and identifies breaking points
 */

export interface StressTestConfig {
  maxEntities: number;
  maxParticles: number;
  maxDrawCalls: number;
  maxMemoryUsage: number; // bytes
  testDuration: number; // milliseconds
  enableMemoryMonitoring: boolean;
  enablePerformanceMonitoring: boolean;
  enableCrashDetection: boolean;
  autoStopOnFailure: boolean;
}

export interface StressTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  maxValues: {
    entities: number;
    particles: number;
    drawCalls: number;
    memoryUsage: number;
    frameTime: number;
  };
  failurePoint: {
    metric: string;
    value: number;
    threshold: number;
    reason: string;
  } | null;
  performanceData: {
    samples: Array<{
      timestamp: number;
      entities: number;
      particles: number;
      drawCalls: number;
      memoryUsage: number;
      frameTime: number;
      fps: number;
    }>;
    average: {
      entities: number;
      particles: number;
      drawCalls: number;
      memoryUsage: number;
      frameTime: number;
      fps: number;
    };
    degradation: {
      initialPerformance: number;
      finalPerformance: number;
      degradationPercent: number;
    };
  };
  systemState: {
    crashed: boolean;
    outOfMemory: boolean;
    frameRateDropped: boolean;
    responsive: boolean;
  };
  recommendations: string[];
}

export interface StressTestScenario {
  name: string;
  description: string;
  config: Partial<StressTestConfig>;
  testFn: (config: StressTestConfig, progressCallback: (progress: number) => void) => Promise<StressTestResult>;
}

export class StressTester {
  private static readonly DEFAULT_CONFIG: StressTestConfig = {
    maxEntities: 100000,
    maxParticles: 50000,
    maxDrawCalls: 10000,
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    testDuration: 60000, // 1 minute
    enableMemoryMonitoring: true,
    enablePerformanceMonitoring: true,
    enableCrashDetection: true,
    autoStopOnFailure: true,
  };

  private scenarios = new Map<string, StressTestScenario>();
  private currentTest: StressTestResult | null = null;
  private isRunning = false;
  private abortController: AbortController | null = null;

  /**
   * Register a stress test scenario
   */
  registerScenario(scenario: StressTestScenario): void {
    this.scenarios.set(scenario.name, scenario);
  }

  /**
   * Run a specific stress test
   */
  async runStressTest(scenarioName: string): Promise<StressTestResult> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Stress test scenario '${scenarioName}' not found`);
    }

    const config = { ...StressTester.DEFAULT_CONFIG, ...scenario.config };
    
    this.isRunning = true;
    this.abortController = new AbortController();
    this.currentTest = null;

    try {
      console.log(`Starting stress test: ${scenarioName}`);
      console.log(`Description: ${scenario.description}`);
      console.log(`Config:`, config);

      const result = await scenario.testFn(config, (progress) => {
        console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
      });

      this.currentTest = result;
      console.log(`Stress test ${scenarioName} ${result.passed ? 'PASSED' : 'FAILED'}`);
      
      return result;

    } catch (error) {
      const errorResult: StressTestResult = {
        testName: scenarioName,
        passed: false,
        duration: 0,
        maxValues: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
        },
        failurePoint: {
          metric: 'system',
          value: 0,
          threshold: 0,
          reason: (error as Error).message,
        },
        performanceData: {
          samples: [],
          average: {
            entities: 0,
            particles: 0,
            drawCalls: 0,
            memoryUsage: 0,
            frameTime: 0,
            fps: 0,
          },
          degradation: {
            initialPerformance: 0,
            finalPerformance: 0,
            degradationPercent: 0,
          },
        },
        systemState: {
          crashed: true,
          outOfMemory: false,
          frameRateDropped: false,
          responsive: false,
        },
        recommendations: [`Test failed with error: ${(error as Error).message}`],
      };

      this.currentTest = errorResult;
      return errorResult;

    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * Stop current stress test
   */
  stopTest(): void {
    if (this.isRunning && this.abortController) {
      this.abortController.abort();
      console.log('Stress test stopped by user');
    }
  }

  /**
   * Get current test result
   */
  getCurrentTest(): StressTestResult | null {
    return this.currentTest;
  }

  /**
   * Check if test is running
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get all registered scenarios
   */
  getScenarios(): StressTestScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Built-in stress test scenarios
   */
  static getBuiltinScenarios(): StressTestScenario[] {
    return [
      {
        name: 'entity-stress',
        description: 'Test maximum entity count and system stability',
        config: {
          testDuration: 30000,
          maxEntities: 50000,
        },
        testFn: async (config, progressCallback) => {
          return await this.testEntityStress(config, progressCallback);
        },
      },

      {
        name: 'particle-stress',
        description: 'Test maximum particle count and rendering performance',
        config: {
          testDuration: 30000,
          maxParticles: 25000,
        },
        testFn: async (config, progressCallback) => {
          return await this.testParticleStress(config, progressCallback);
        },
      },

      {
        name: 'memory-stress',
        description: 'Test memory allocation limits and garbage collection',
        config: {
          testDuration: 45000,
          maxMemoryUsage: 512 * 1024 * 1024, // 512MB
        },
        testFn: async (config, progressCallback) => {
          return await this.testMemoryStress(config, progressCallback);
        },
      },

      {
        name: 'rendering-stress',
        description: 'Test rendering pipeline with maximum draw calls',
        config: {
          testDuration: 30000,
          maxDrawCalls: 5000,
        },
        testFn: async (config, progressCallback) => {
          return await this.testRenderingStress(config, progressCallback);
        },
      },

      {
        name: 'combined-stress',
        description: 'Test all systems simultaneously under extreme load',
        config: {
          testDuration: 60000,
          maxEntities: 25000,
          maxParticles: 10000,
          maxDrawCalls: 2000,
        },
        testFn: async (config, progressCallback) => {
          return await this.testCombinedStress(config, progressCallback);
        },
      },
    ];
  }

  /**
   * Entity stress test
   */
  private static async testEntityStress(
    config: StressTestConfig,
    progressCallback: (progress: number) => void
  ): Promise<StressTestResult> {
    const result: StressTestResult = {
      testName: 'entity-stress',
      passed: true,
      duration: 0,
      maxValues: {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
      },
      failurePoint: null,
      performanceData: {
        samples: [],
        average: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
          fps: 0,
        },
        degradation: {
          initialPerformance: 0,
          finalPerformance: 0,
          degradationPercent: 0,
        },
      },
      systemState: {
        crashed: false,
        outOfMemory: false,
        frameRateDropped: false,
        responsive: true,
      },
      recommendations: [],
    };

    const startTime = performance.now();
    const entities: any[] = [];
    let frameCount = 0;
    let lastProgressUpdate = 0;

    try {
      while (performance.now() - startTime < config.testDuration) {
        const frameStart = performance.now();

        // Create entities until max reached
        while (entities.length < config.maxEntities) {
          entities.push({
            id: Math.random(),
            position: { x: Math.random() * 800, y: Math.random() * 600 },
            velocity: { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 },
            components: {
              position: { x: 0, y: 0 },
              velocity: { x: 0, y: 0 },
              renderLayer: { order: 0 },
            },
          });

          // Check memory usage
          if (config.enableMemoryMonitoring && this.getMemoryUsage() > config.maxMemoryUsage) {
            result.failurePoint = {
              metric: 'memory',
              value: this.getMemoryUsage(),
              threshold: config.maxMemoryUsage,
              reason: 'Memory usage exceeded limit during entity creation',
            };
            result.passed = false;
            break;
          }
        }

        // Simulate entity updates
        for (const entity of entities) {
          entity.position.x += entity.velocity.x * 0.016;
          entity.position.y += entity.velocity.y * 0.016;

          // Boundary check
          if (entity.position.x < 0 || entity.position.x > 800) {
            entity.velocity.x *= -1;
          }
          if (entity.position.y < 0 || entity.position.y > 600) {
            entity.velocity.y *= -1;
          }
        }

        const frameTime = performance.now() - frameStart;
        frameCount++;

        // Record performance data
        if (frameCount % 60 === 0) { // Every second at 60 FPS
          result.performanceData.samples.push({
            timestamp: performance.now() - startTime,
            entities: entities.length,
            particles: 0,
            drawCalls: entities.length,
            memoryUsage: this.getMemoryUsage(),
            frameTime,
            fps: 1000 / frameTime,
          });

          // Update progress
          const progress = (performance.now() - startTime) / config.testDuration;
          if (progress - lastProgressUpdate > 0.1) {
            progressCallback(progress);
            lastProgressUpdate = progress;
          }
        }

        // Check for critical performance issues
        if (frameTime > 100) { // More than 10 FPS
          result.systemState.frameRateDropped = true;
          result.systemState.responsive = false;
        }

        if (result.failurePoint) break;
      }

    } catch (error) {
      result.systemState.crashed = true;
      result.passed = false;
      result.recommendations.push(`System crashed: ${(error as Error).message}`);
    }

    result.duration = performance.now() - startTime;
    result.maxValues.entities = entities.length;
    result.maxValues.memoryUsage = this.getMemoryUsage();

    // Calculate averages
    if (result.performanceData.samples.length > 0) {
      result.performanceData.average = this.calculateAverages(result.performanceData.samples);
      result.performanceData.degradation = this.calculateDegradation(result.performanceData.samples);
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);

    return result;
  }

  /**
   * Particle stress test
   */
  private static async testParticleStress(
    config: StressTestConfig,
    progressCallback: (progress: number) => void
  ): Promise<StressTestResult> {
    const result: StressTestResult = {
      testName: 'particle-stress',
      passed: true,
      duration: 0,
      maxValues: {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
      },
      failurePoint: null,
      performanceData: {
        samples: [],
        average: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
          fps: 0,
        },
        degradation: {
          initialPerformance: 0,
          finalPerformance: 0,
          degradationPercent: 0,
        },
      },
      systemState: {
        crashed: false,
        outOfMemory: false,
        frameRateDropped: false,
        responsive: true,
      },
      recommendations: [],
    };

    const startTime = performance.now();
    const particles: any[] = [];
    let frameCount = 0;

    try {
      while (performance.now() - startTime < config.testDuration) {
        const frameStart = performance.now();

        // Create particles
        while (particles.length < config.maxParticles) {
          particles.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1.0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            size: 2 + Math.random() * 4,
          });

          if (config.enableMemoryMonitoring && this.getMemoryUsage() > config.maxMemoryUsage) {
            result.failurePoint = {
              metric: 'memory',
              value: this.getMemoryUsage(),
              threshold: config.maxMemoryUsage,
              reason: 'Memory usage exceeded limit during particle creation',
            };
            result.passed = false;
            break;
          }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const particle = particles[i];
          particle.x += particle.vx * 0.016;
          particle.y += particle.vy * 0.016;
          particle.life -= 0.01;

          if (particle.life <= 0 || particle.x < 0 || particle.x > 800 || 
              particle.y < 0 || particle.y > 600) {
            particles.splice(i, 1);
          }
        }

        const frameTime = performance.now() - frameStart;
        frameCount++;

        // Record performance data
        if (frameCount % 60 === 0) {
          result.performanceData.samples.push({
            timestamp: performance.now() - startTime,
            entities: 0,
            particles: particles.length,
            drawCalls: particles.length,
            memoryUsage: this.getMemoryUsage(),
            frameTime,
            fps: 1000 / frameTime,
          });

          const progress = (performance.now() - startTime) / config.testDuration;
          progressCallback(progress);
        }

        if (frameTime > 100) {
          result.systemState.frameRateDropped = true;
          result.systemState.responsive = false;
        }

        if (result.failurePoint) break;
      }

    } catch (error) {
      result.systemState.crashed = true;
      result.passed = false;
      result.recommendations.push(`System crashed: ${(error as Error).message}`);
    }

    result.duration = performance.now() - startTime;
    result.maxValues.particles = particles.length;
    result.maxValues.memoryUsage = this.getMemoryUsage();

    if (result.performanceData.samples.length > 0) {
      result.performanceData.average = this.calculateAverages(result.performanceData.samples);
      result.performanceData.degradation = this.calculateDegradation(result.performanceData.samples);
    }

    result.recommendations = this.generateRecommendations(result);
    return result;
  }

  /**
   * Memory stress test
   */
  private static async testMemoryStress(
    config: StressTestConfig,
    progressCallback: (progress: number) => void
  ): Promise<StressTestResult> {
    const result: StressTestResult = {
      testName: 'memory-stress',
      passed: true,
      duration: 0,
      maxValues: {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
      },
      failurePoint: null,
      performanceData: {
        samples: [],
        average: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
          fps: 0,
        },
        degradation: {
          initialPerformance: 0,
          finalPerformance: 0,
          degradationPercent: 0,
        },
      },
      systemState: {
        crashed: false,
        outOfMemory: false,
        frameRateDropped: false,
        responsive: true,
      },
      recommendations: [],
    };

    const startTime = performance.now();
    const memoryBlocks: any[] = [];
    let allocationCount = 0;

    try {
      while (performance.now() - startTime < config.testDuration) {
        const frameStart = performance.now();

        // Allocate memory blocks
        while (this.getMemoryUsage() < config.maxMemoryUsage && allocationCount < 1000) {
          const blockSize = 1024 * 1024; // 1MB blocks
          const block = new ArrayBuffer(blockSize);
          const view = new Uint8Array(blockSize);
          
          // Fill with random data to ensure allocation
          for (let i = 0; i < blockSize; i++) {
            view[i] = Math.random() * 255;
          }
          
          memoryBlocks.push({ block, view, size: blockSize });
          allocationCount++;
        }

        // Randomly free some blocks to test garbage collection
        if (memoryBlocks.length > 100 && Math.random() < 0.1) {
          const freedCount = Math.floor(memoryBlocks.length * 0.2);
          memoryBlocks.splice(0, freedCount);
        }

        const frameTime = performance.now() - frameStart;

        // Record performance data
        if (allocationCount % 10 === 0) {
          result.performanceData.samples.push({
            timestamp: performance.now() - startTime,
            entities: 0,
            particles: 0,
            drawCalls: 0,
            memoryUsage: this.getMemoryUsage(),
            frameTime,
            fps: 1000 / frameTime,
          });

          const progress = (performance.now() - startTime) / config.testDuration;
          progressCallback(progress);
        }

        // Check for out of memory
        if (this.getMemoryUsage() > config.maxMemoryUsage) {
          result.systemState.outOfMemory = true;
          result.failurePoint = {
            metric: 'memory',
            value: this.getMemoryUsage(),
            threshold: config.maxMemoryUsage,
            reason: 'Memory usage exceeded limit',
          };
          result.passed = false;
          break;
        }
      }

    } catch (error) {
      result.systemState.crashed = true;
      result.passed = false;
      result.recommendations.push(`System crashed: ${(error as Error).message}`);
    }

    result.duration = performance.now() - startTime;
    result.maxValues.memoryUsage = this.getMemoryUsage();
    result.maxValues.entities = allocationCount;

    if (result.performanceData.samples.length > 0) {
      result.performanceData.average = this.calculateAverages(result.performanceData.samples);
      result.performanceData.degradation = this.calculateDegradation(result.performanceData.samples);
    }

    result.recommendations = this.generateRecommendations(result);
    return result;
  }

  /**
   * Rendering stress test
   */
  private static async testRenderingStress(
    config: StressTestConfig,
    progressCallback: (progress: number) => void
  ): Promise<StressTestResult> {
    const result: StressTestResult = {
      testName: 'rendering-stress',
      passed: true,
      duration: 0,
      maxValues: {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
      },
      failurePoint: null,
      performanceData: {
        samples: [],
        average: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
          fps: 0,
        },
        degradation: {
          initialPerformance: 0,
          finalPerformance: 0,
          degradationPercent: 0,
        },
      },
      systemState: {
        crashed: false,
        outOfMemory: false,
        frameRateDropped: false,
        responsive: true,
      },
      recommendations: [],
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      result.passed = false;
      result.recommendations.push('Could not create 2D rendering context');
      return result;
    }

    canvas.width = 800;
    canvas.height = 600;

    const startTime = performance.now();
    let drawCallCount = 0;
    let frameCount = 0;

    try {
      while (performance.now() - startTime < config.testDuration) {
        const frameStart = performance.now();

        // Clear canvas
        (ctx as CanvasRenderingContext2D).clearRect(0, 0, canvas.width, canvas.height);

        // Draw shapes until limit reached
        let currentDrawCalls = 0;
        while (currentDrawCalls < config.maxDrawCalls) {
          (ctx as CanvasRenderingContext2D).fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
          (ctx as CanvasRenderingContext2D).fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            5 + Math.random() * 20,
            5 + Math.random() * 20
          );
          currentDrawCalls++;
          drawCallCount++;
        }

        const frameTime = performance.now() - frameStart;
        frameCount++;

        // Record performance data
        if (frameCount % 60 === 0) {
          result.performanceData.samples.push({
            timestamp: performance.now() - startTime,
            entities: 0,
            particles: 0,
            drawCalls: currentDrawCalls,
            memoryUsage: this.getMemoryUsage(),
            frameTime,
            fps: 1000 / frameTime,
          });

          const progress = (performance.now() - startTime) / config.testDuration;
          progressCallback(progress);
        }

        if (frameTime > 100) {
          result.systemState.frameRateDropped = true;
          result.systemState.responsive = false;
        }
      }

    } catch (error) {
      result.systemState.crashed = true;
      result.passed = false;
      result.recommendations.push(`Rendering system crashed: ${(error as Error).message}`);
    }

    result.duration = performance.now() - startTime;
    result.maxValues.drawCalls = drawCallCount;
    result.maxValues.memoryUsage = this.getMemoryUsage();

    if (result.performanceData.samples.length > 0) {
      result.performanceData.average = this.calculateAverages(result.performanceData.samples);
      result.performanceData.degradation = this.calculateDegradation(result.performanceData.samples);
    }

    result.recommendations = this.generateRecommendations(result);
    return result;
  }

  /**
   * Combined stress test
   */
  private static async testCombinedStress(
    config: StressTestConfig,
    progressCallback: (progress: number) => void
  ): Promise<StressTestResult> {
    const result: StressTestResult = {
      testName: 'combined-stress',
      passed: true,
      duration: 0,
      maxValues: {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
      },
      failurePoint: null,
      performanceData: {
        samples: [],
        average: {
          entities: 0,
          particles: 0,
          drawCalls: 0,
          memoryUsage: 0,
          frameTime: 0,
          fps: 0,
        },
        degradation: {
          initialPerformance: 0,
          finalPerformance: 0,
          degradationPercent: 0,
        },
      },
      systemState: {
        crashed: false,
        outOfMemory: false,
        frameRateDropped: false,
        responsive: true,
      },
      recommendations: [],
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      result.passed = false;
      result.recommendations.push('Could not create 2D rendering context');
      return result;
    }

    canvas.width = 800;
    canvas.height = 600;

    const startTime = performance.now();
    const entities: any[] = [];
    const particles: any[] = [];
    let frameCount = 0;
    let totalDrawCalls = 0;

    try {
      while (performance.now() - startTime < config.testDuration) {
        const frameStart = performance.now();

        // Create entities and particles
        while (entities.length < config.maxEntities) {
          entities.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
          });
        }

        while (particles.length < config.maxParticles) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1.0,
            size: 2 + Math.random() * 4,
          });
        }

        // Clear and draw
        (ctx as CanvasRenderingContext2D).clearRect(0, 0, canvas.width, canvas.height);

        // Draw entities
        let frameDrawCalls = 0;
        for (const entity of entities) {
          (ctx as CanvasRenderingContext2D).fillStyle = '#ff0000';
          (ctx as CanvasRenderingContext2D).fillRect(entity.x, entity.y, 10, 10);
          frameDrawCalls++;
        }

        // Draw particles
        for (const particle of particles) {
          (ctx as CanvasRenderingContext2D).fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
          (ctx as CanvasRenderingContext2D).fillRect(particle.x, particle.y, particle.size, particle.size);
          frameDrawCalls++;
        }

        totalDrawCalls += frameDrawCalls;

        // Update positions
        for (const entity of entities) {
          entity.x += entity.vx * 0.016;
          entity.y += entity.vy * 0.016;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const particle = particles[i];
          particle.x += particle.vx * 0.016;
          particle.y += particle.vy * 0.016;
          particle.life -= 0.01;

          if (particle.life <= 0) {
            particles.splice(i, 1);
          }
        }

        const frameTime = performance.now() - frameStart;
        frameCount++;

        // Record performance data
        if (frameCount % 60 === 0) {
          result.performanceData.samples.push({
            timestamp: performance.now() - startTime,
            entities: entities.length,
            particles: particles.length,
            drawCalls: frameDrawCalls,
            memoryUsage: this.getMemoryUsage(),
            frameTime,
            fps: 1000 / frameTime,
          });

          const progress = (performance.now() - startTime) / config.testDuration;
          progressCallback(progress);
        }

        if (frameTime > 100) {
          result.systemState.frameRateDropped = true;
          result.systemState.responsive = false;
        }

        if (config.enableMemoryMonitoring && this.getMemoryUsage() > config.maxMemoryUsage) {
          result.systemState.outOfMemory = true;
          result.failurePoint = {
            metric: 'memory',
            value: this.getMemoryUsage(),
            threshold: config.maxMemoryUsage,
            reason: 'Memory usage exceeded limit',
          };
          result.passed = false;
          break;
        }
      }

    } catch (error) {
      result.systemState.crashed = true;
      result.passed = false;
      result.recommendations.push(`Combined test crashed: ${(error as Error).message}`);
    }

    result.duration = performance.now() - startTime;
    result.maxValues.entities = entities.length;
    result.maxValues.particles = particles.length;
    result.maxValues.drawCalls = totalDrawCalls;
    result.maxValues.memoryUsage = this.getMemoryUsage();

    if (result.performanceData.samples.length > 0) {
      result.performanceData.average = this.calculateAverages(result.performanceData.samples);
      result.performanceData.degradation = this.calculateDegradation(result.performanceData.samples);
    }

    result.recommendations = this.generateRecommendations(result);
    return result;
  }

  /**
   * Get current memory usage
   */
  private static getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Calculate averages from performance samples
   */
  private static calculateAverages(samples: any[]): any {
    if (samples.length === 0) {
      return {
        entities: 0,
        particles: 0,
        drawCalls: 0,
        memoryUsage: 0,
        frameTime: 0,
        fps: 0,
      };
    }

    const sums = samples.reduce((acc, sample) => ({
      entities: acc.entities + sample.entities,
      particles: acc.particles + sample.particles,
      drawCalls: acc.drawCalls + sample.drawCalls,
      memoryUsage: acc.memoryUsage + sample.memoryUsage,
      frameTime: acc.frameTime + sample.frameTime,
      fps: acc.fps + sample.fps,
    }), {
      entities: 0,
      particles: 0,
      drawCalls: 0,
      memoryUsage: 0,
      frameTime: 0,
      fps: 0,
    });

    return {
      entities: sums.entities / samples.length,
      particles: sums.particles / samples.length,
      drawCalls: sums.drawCalls / samples.length,
      memoryUsage: sums.memoryUsage / samples.length,
      frameTime: sums.frameTime / samples.length,
      fps: sums.fps / samples.length,
    };
  }

  /**
   * Calculate performance degradation
   */
  private static calculateDegradation(samples: any[]): any {
    if (samples.length < 2) {
      return {
        initialPerformance: 0,
        finalPerformance: 0,
        degradationPercent: 0,
      };
    }

    const initial = samples[0].fps;
    const final = samples[samples.length - 1].fps;
    const degradation = ((initial - final) / initial) * 100;

    return {
      initialPerformance: initial,
      finalPerformance: final,
      degradationPercent: Math.max(0, degradation),
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private static generateRecommendations(result: StressTestResult): string[] {
    const recommendations: string[] = [];

    if (result.systemState.crashed) {
      recommendations.push('System crashed during stress test - investigate stability issues');
    }

    if (result.systemState.outOfMemory) {
      recommendations.push('Memory limit exceeded - consider optimizing memory usage');
    }

    if (result.systemState.frameRateDropped) {
      recommendations.push('Frame rate dropped significantly - optimize rendering pipeline');
    }

    if (!result.systemState.responsive) {
      recommendations.push('System became unresponsive - reduce computational load');
    }

    if (result.performanceData.degradation.degradationPercent > 20) {
      recommendations.push('Performance degraded by more than 20% - investigate bottlenecks');
    }

    if (result.maxValues.memoryUsage > 512 * 1024 * 1024) {
      recommendations.push('High memory usage detected - implement memory pooling');
    }

    if (result.maxValues.entities > 10000) {
      recommendations.push('High entity count - consider entity culling or LOD systems');
    }

    if (result.maxValues.particles > 5000) {
      recommendations.push('High particle count - optimize particle system or use GPU acceleration');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performed well under stress test conditions');
    }

    return recommendations;
  }
}

// Global stress tester instance
export const stressTester = new StressTester();

// Register built-in scenarios
StressTester.getBuiltinScenarios().forEach(scenario => {
  stressTester.registerScenario(scenario);
});

// Convenience functions
export const runStressTest = (scenarioName: string) => stressTester.runStressTest(scenarioName);
export const stopStressTest = () => stressTester.stopTest();
export const getStressTestScenarios = () => stressTester.getScenarios();

/**
 * Comprehensive built-in unit testing framework for engine validation
 * Provides assertion, mocking, and test runner capabilities
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
  assertions: number;
  failures: number;
  skipped: boolean;
  skipReason?: string;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => void;
  teardown?: () => void;
  beforeAll?: () => void;
  afterAll?: () => void;
}

export interface TestCase {
  name: string;
  fn: (assert: Assert) => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  skipReason?: string;
  only?: boolean;
}

export interface Assert {
  isTrue: (value: boolean, message?: string) => void;
  isFalse: (value: boolean, message?: string) => void;
  equals: <T>(actual: T, expected: T, message?: string) => void;
  notEquals: <T>(actual: T, expected: T, message?: string) => void;
  deepEquals: <T>(actual: T, expected: T, message?: string) => void;
  notDeepEquals: <T>(actual: T, expected: T, message?: string) => void;
  throws: (fn: () => void, expectedError?: string | RegExp, message?: string) => void;
  doesNotThrow: (fn: () => void, message?: string) => void;
  isNull: (value: any, message?: string) => void;
  isNotNull: (value: any, message?: string) => void;
  isUndefined: (value: any, message?: string) => void;
  isDefined: (value: any, message?: string) => void;
  isArray: (value: any, message?: string) => void;
  isObject: (value: any, message?: string) => void;
  isFunction: (value: any, message?: string) => void;
  isString: (value: any, message?: string) => void;
  isNumber: (value: any, message?: string) => void;
  isBoolean: (value: any, message?: string) => void;
  contains: <T>(array: T[], item: T, message?: string) => void;
  doesNotContain: <T>(array: T[], item: T, message?: string) => void;
  greaterThan: (actual: number, expected: number, message?: string) => void;
  lessThan: (actual: number, expected: number, message?: string) => void;
  greaterThanOrEqual: (actual: number, expected: number, message?: string) => void;
  lessThanOrEqual: (actual: number, expected: number, message?: string) => void;
  between: (actual: number, min: number, max: number, message?: string) => void;
  matches: (actual: string, pattern: RegExp, message?: string) => void;
  doesNotMatch: (actual: string, pattern: RegExp, message?: string) => void;
  fail: (message?: string) => void;
  pass: (message?: string) => void;
}

export interface TestRunnerConfig {
  timeout: number;
  bailOnFirstFailure: boolean;
  verbose: boolean;
  reporter: TestReporter;
  parallel: boolean;
  maxConcurrency: number;
  retries: number;
}

export interface TestReporter {
  onSuiteStart: (suite: TestSuite) => void;
  onSuiteEnd: (suite: TestSuite, results: TestResult[]) => void;
  onTestStart: (test: TestCase) => void;
  onTestEnd: (result: TestResult) => void;
  onRunnerEnd: (results: TestResult[]) => void;
}

export interface MockConfig {
  name: string;
  methods: string[];
  returnValue?: any;
  implementation?: (methodName: string, ...args: any[]) => any;
  callTracking?: boolean;
}

export class AssertionError extends Error {
  constructor(message: string, public actual?: any, public expected?: any) {
    super(message);
    this.name = 'AssertionError';
  }
}

export class TestTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Test timed out after ${timeout}ms`);
    this.name = 'TestTimeoutError';
  }
}

export class TestFramework {
  private static instance: TestFramework;
  private suites: TestSuite[] = [];
  private config: TestRunnerConfig;
  private currentTest: TestCase | null = null;
  private assertionCount = 0;
  private failureCount = 0;

  private constructor() {
    this.config = {
      timeout: 5000,
      bailOnFirstFailure: false,
      verbose: false,
      reporter: new ConsoleReporter(),
      parallel: false,
      maxConcurrency: 4,
      retries: 0,
    };
  }

  static getInstance(): TestFramework {
    if (!TestFramework.instance) {
      TestFramework.instance = new TestFramework();
    }
    return TestFramework.instance;
  }

  /**
   * Configure the test runner
   */
  configure(config: Partial<TestRunnerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register a test suite
   */
  suite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Run all registered test suites
   */
  async run(): Promise<TestResult[]> {
    const allResults: TestResult[] = [];

    this.config.reporter.onRunnerEnd?.(allResults);

    for (const testSuite of this.suites) {
      this.config.reporter.onSuiteStart?.(testSuite);
      
      const results = await this.runSuite(testSuite);
      allResults.push(...results);

      this.config.reporter.onSuiteEnd?.(testSuite, results);

      if (this.config.bailOnFirstFailure && results.some(r => !r.passed)) {
        break;
      }
    }

    this.config.reporter.onRunnerEnd?.(allResults);
    return allResults;
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      suite.beforeAll?.();
    } catch (error) {
      console.error(`Error in beforeAll for suite ${suite.name}:`, error);
    }

    for (const testCase of suite.tests) {
      const result = await this.runTest(testCase, suite);
      results.push(result);

      if (this.config.bailOnFirstFailure && !result.passed) {
        break;
      }
    }

    try {
      suite.afterAll?.();
    } catch (error) {
      console.error(`Error in afterAll for suite ${suite.name}:`, error);
    }

    return results;
  }

  /**
   * Run a single test case
   */
  private async runTest(test: TestCase, suite: TestSuite): Promise<TestResult> {
    if (test.skip) {
      return {
        name: test.name,
        passed: true,
        duration: 0,
        assertions: 0,
        failures: 0,
        skipped: true,
        skipReason: test.skipReason,
      };
    }

    this.currentTest = test;
    this.assertionCount = 0;
    this.failureCount = 0;

    const startTime = performance.now();
    this.config.reporter.onTestStart?.(test);

    let result: TestResult;

    try {
      suite.setup?.();
      
      const assert = this.createAssert();
      const timeout = test.timeout || this.config.timeout;
      
      await this.withTimeout(Promise.resolve(test.fn(assert)), timeout);
      
      result = {
        name: test.name,
        passed: this.failureCount === 0,
        duration: performance.now() - startTime,
        assertions: this.assertionCount,
        failures: this.failureCount,
        skipped: false,
      };

    } catch (error) {
      result = {
        name: test.name,
        passed: false,
        error: error as Error,
        duration: performance.now() - startTime,
        assertions: this.assertionCount,
        failures: this.failureCount + 1,
        skipped: false,
      };
    } finally {
      try {
        suite.teardown?.();
      } catch (error) {
        console.error(`Error in teardown for test ${test.name}:`, error);
      }
    }

    this.config.reporter.onTestEnd?.(result);
    this.currentTest = null;
    
    return result;
  }

  /**
   * Create assertion object
   */
  public createAssert(): Assert {
    const framework = this;
    
    return {
      isTrue: (value: boolean, message?: string) => {
        framework.assertionCount++;
        if (value !== true) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected true, but got ${value}`, value, true);
        }
      },
      
      isFalse: (value: boolean, message?: string) => {
        framework.assertionCount++;
        if (value !== false) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected false, but got ${value}`, value, false);
        }
      },
      
      equals: <T>(actual: T, expected: T, message?: string) => {
        framework.assertionCount++;
        if (actual !== expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${expected}, but got ${actual}`,
            actual,
            expected
          );
        }
      },
      
      notEquals: <T>(actual: T, expected: T, message?: string) => {
        framework.assertionCount++;
        if (actual === expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected not to equal ${expected}, but got ${actual}`,
            actual,
            expected
          );
        }
      },
      
      deepEquals: <T>(actual: T, expected: T, message?: string) => {
        framework.assertionCount++;
        if (!framework.deepEqual(actual, expected)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
            actual,
            expected
          );
        }
      },
      
      notDeepEquals: <T>(actual: T, expected: T, message?: string) => {
        framework.assertionCount++;
        if (framework.deepEqual(actual, expected)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected not to deeply equal ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
            actual,
            expected
          );
        }
      },
      
      throws: (fn: () => void, expectedError?: string | RegExp, message?: string) => {
        framework.assertionCount++;
        try {
          fn();
          framework.failureCount++;
          throw new AssertionError(message || 'Expected function to throw an error', undefined, 'Error');
        } catch (error) {
          if (expectedError) {
            if (typeof expectedError === 'string') {
              if (!(error as Error).message.includes(expectedError)) {
                framework.failureCount++;
                throw new AssertionError(
                  message || `Expected error message to contain "${expectedError}", but got "${(error as Error).message}"`,
                  (error as Error).message,
                  expectedError
                );
              }
            } else if (expectedError instanceof RegExp) {
              if (!expectedError.test((error as Error).message)) {
                framework.failureCount++;
                throw new AssertionError(
                  message || `Expected error message to match ${expectedError}, but got "${(error as Error).message}"`,
                  (error as Error).message,
                  expectedError
                );
              }
            }
          }
        }
      },
      
      doesNotThrow: (fn: () => void, message?: string) => {
        framework.assertionCount++;
        try {
          fn();
        } catch (error) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected function not to throw, but got ${(error as Error).message}`,
            error,
            undefined
          );
        }
      },
      
      isNull: (value: any, message?: string) => {
        framework.assertionCount++;
        if (value !== null) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected null, but got ${value}`, value, null);
        }
      },
      
      isNotNull: (value: any, message?: string) => {
        framework.assertionCount++;
        if (value === null) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected not null, but got null`, value, null);
        }
      },
      
      isUndefined: (value: any, message?: string) => {
        framework.assertionCount++;
        if (value !== undefined) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected undefined, but got ${value}`, value, undefined);
        }
      },
      
      isDefined: (value: any, message?: string) => {
        framework.assertionCount++;
        if (value === undefined) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected defined, but got undefined`, value, undefined);
        }
      },
      
      isArray: (value: any, message?: string) => {
        framework.assertionCount++;
        if (!Array.isArray(value)) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected array, but got ${typeof value}`, value, 'Array');
        }
      },
      
      isObject: (value: any, message?: string) => {
        framework.assertionCount++;
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected object, but got ${typeof value}`, value, 'Object');
        }
      },
      
      isFunction: (value: any, message?: string) => {
        framework.assertionCount++;
        if (typeof value !== 'function') {
          framework.failureCount++;
          throw new AssertionError(message || `Expected function, but got ${typeof value}`, value, 'Function');
        }
      },
      
      isString: (value: any, message?: string) => {
        framework.assertionCount++;
        if (typeof value !== 'string') {
          framework.failureCount++;
          throw new AssertionError(message || `Expected string, but got ${typeof value}`, value, 'String');
        }
      },
      
      isNumber: (value: any, message?: string) => {
        framework.assertionCount++;
        if (typeof value !== 'number' || isNaN(value)) {
          framework.failureCount++;
          throw new AssertionError(message || `Expected number, but got ${typeof value}`, value, 'Number');
        }
      },
      
      isBoolean: (value: any, message?: string) => {
        framework.assertionCount++;
        if (typeof value !== 'boolean') {
          framework.failureCount++;
          throw new AssertionError(message || `Expected boolean, but got ${typeof value}`, value, 'Boolean');
        }
      },
      
      contains: <T>(array: T[], item: T, message?: string) => {
        framework.assertionCount++;
        if (!array.includes(item)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected array to contain ${item}, but it doesn't`,
            array,
            item
          );
        }
      },
      
      doesNotContain: <T>(array: T[], item: T, message?: string) => {
        framework.assertionCount++;
        if (array.includes(item)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected array not to contain ${item}, but it does`,
            array,
            item
          );
        }
      },
      
      greaterThan: (actual: number, expected: number, message?: string) => {
        framework.assertionCount++;
        if (actual <= expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${actual} to be greater than ${expected}`,
            actual,
            expected
          );
        }
      },
      
      lessThan: (actual: number, expected: number, message?: string) => {
        framework.assertionCount++;
        if (actual >= expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${actual} to be less than ${expected}`,
            actual,
            expected
          );
        }
      },
      
      greaterThanOrEqual: (actual: number, expected: number, message?: string) => {
        framework.assertionCount++;
        if (actual < expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${actual} to be greater than or equal to ${expected}`,
            actual,
            expected
          );
        }
      },
      
      lessThanOrEqual: (actual: number, expected: number, message?: string) => {
        framework.assertionCount++;
        if (actual > expected) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${actual} to be less than or equal to ${expected}`,
            actual,
            expected
          );
        }
      },
      
      between: (actual: number, min: number, max: number, message?: string) => {
        framework.assertionCount++;
        if (actual < min || actual > max) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected ${actual} to be between ${min} and ${max}`,
            actual,
            [min, max]
          );
        }
      },
      
      matches: (actual: string, pattern: RegExp, message?: string) => {
        framework.assertionCount++;
        if (!pattern.test(actual)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected "${actual}" to match ${pattern}`,
            actual,
            pattern
          );
        }
      },
      
      doesNotMatch: (actual: string, pattern: RegExp, message?: string) => {
        framework.assertionCount++;
        if (pattern.test(actual)) {
          framework.failureCount++;
          throw new AssertionError(
            message || `Expected "${actual}" not to match ${pattern}`,
            actual,
            pattern
          );
        }
      },
      
      fail: (message?: string) => {
        framework.assertionCount++;
        framework.failureCount++;
        throw new AssertionError(message || 'Test failed');
      },
      
      pass: (message?: string) => {
        // Test passes - no action needed
        if (message && framework.config.verbose) {
          console.log(`✓ ${message}`);
        }
      },
    };
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Execute function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new TestTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  }

  /**
   * Create a mock object
   */
  static createMock<T>(config: MockConfig): T {
    const mock: any = {};
    
    for (const method of config.methods) {
      mock[method] = (...args: any[]) => {
        if (config.callTracking) {
          if (!mock._calls) mock._calls = [];
          mock._calls.push({ method, args });
        }
        
        if (config.implementation) {
          return config.implementation(method, ...args);
        }
        
        return config.returnValue;
      };
    }
    
    if (config.callTracking) {
      mock._calls = [];
      mock.getCallCount = (method: string) => {
        return mock._calls?.filter((call: any) => call.method === method).length || 0;
      };
      mock.getCalledWith = (method: string) => {
        return mock._calls?.find((call: any) => call.method === method)?.args || [];
      };
      mock.wasCalledWith = (method: string, ...args: any[]) => {
        const callArgs = mock.getCalledWith(method);
        return JSON.stringify(callArgs) === JSON.stringify(args);
      };
    }
    
    return mock as T;
  }

  /**
   * Create a spy on an existing object
   */
  static createSpy<T extends object, K extends keyof T>(obj: T, method: K): T[K] & { _calls: Array<{ args: any[] }> } {
    const original = obj[method] as any;
    const spy: any = (...args: any[]) => {
      if (!spy._calls) spy._calls = [];
      spy._calls.push({ args });
      return original.apply(obj, args);
    };
    
    spy._calls = [];
    spy.restore = () => {
      (obj[method] as any) = original;
    };
    
    return spy;
  }
}

/**
 * Console test reporter
 */
export class ConsoleReporter implements TestReporter {
  onSuiteStart(suite: TestSuite): void {
    console.log(`\n📋 Running suite: ${suite.name}`);
  }

  onSuiteEnd(suite: TestSuite, results: TestResult[]): void {
    const passed = results.filter(r => r.passed && !r.skipped).length;
    const failed = results.filter(r => !r.passed && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const total = results.length;
    
    console.log(`\n📊 Suite ${suite.name} results:`);
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Failed: ${failed}/${total}`);
    console.log(`   Skipped: ${skipped}/${total}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results.filter(r => !r.passed && !r.skipped).forEach(result => {
        console.log(`   - ${result.name}: ${result.error?.message}`);
      });
    }
  }

  onTestStart(test: TestCase): void {
    console.log(`   🧪 ${test.name}`);
  }

  onTestEnd(result: TestResult): void {
    const status = result.skipped ? '⏭️' : result.passed ? '✅' : '❌';
    const duration = result.duration.toFixed(2);
    console.log(`     ${status} ${result.name} (${duration}ms)`);
  }

  onRunnerEnd(results: TestResult[]): void {
    const total = results.length;
    const passed = results.filter(r => r.passed && !r.skipped).length;
    const failed = results.filter(r => !r.passed && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\n🎯 Final Results:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`   Skipped: ${skipped} (${((skipped/total)*100).toFixed(1)}%)`);
    console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n💥 ${failed} test(s) failed!`);
    }
  }
}

// Global test framework instance
export const testFramework = TestFramework.getInstance();

// Global test functions for convenience
export const describe = (name: string, fn: () => void) => {
  const tests: TestCase[] = [];
  const suite: TestSuite = { name, tests };
  
  // Create a test context
  const testContext = {
    it: (name: string, fn: (assert: Assert) => void | Promise<void>, options?: { timeout?: number; skip?: boolean; skipReason?: string; only?: boolean }) => {
      tests.push({
        name,
        fn,
        timeout: options?.timeout,
        skip: options?.skip,
        skipReason: options?.skipReason,
        only: options?.only,
      });
    },
    
    describe: (name: string, fn: () => void) => {
      // Nested describes - for now just execute
      fn();
    },
    
    beforeAll: (fn: () => void) => {
      suite.beforeAll = fn;
    },
    
    afterAll: (fn: () => void) => {
      suite.afterAll = fn;
    },
    
    beforeEach: (fn: () => void) => {
      suite.setup = fn;
    },
    
    afterEach: (fn: () => void) => {
      suite.teardown = fn;
    },
  };
  
  fn.call(testContext);
  testFramework.suite(suite);
};

export const it = (name: string, fn: (assert: Assert) => void | Promise<void>, options?: { timeout?: number; skip?: boolean; skipReason?: string; only?: boolean }) => {
  // This will be called within a describe context
  console.warn('it() should be called within a describe() block');
};

export const test = it;

// Global assertion functions
export const expect = (value: any) => ({
  toBe: (expected: any, message?: string) => {
    if (value !== expected) {
      throw new AssertionError(message || `Expected ${expected}, but got ${value}`, value, expected);
    }
  },
  
  toEqual: (expected: any, message?: string) => {
    if (!TestFramework.getInstance()['deepEqual'](value, expected)) {
      throw new AssertionError(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(value)}`, value, expected);
    }
  },
  
  toBeNull: (message?: string) => {
    if (value !== null) {
      throw new AssertionError(message || `Expected null, but got ${value}`, value, null);
    }
  },
  
  toBeUndefined: (message?: string) => {
    if (value !== undefined) {
      throw new AssertionError(message || `Expected undefined, but got ${value}`, value, undefined);
    }
  },
  
  toBeDefined: (message?: string) => {
    if (value === undefined) {
      throw new AssertionError(message || `Expected defined, but got undefined`, value, undefined);
    }
  },
  
  toBeTrue: (message?: string) => {
    if (value !== true) {
      throw new AssertionError(message || `Expected true, but got ${value}`, value, true);
    }
  },
  
  toBeFalse: (message?: string) => {
    if (value !== false) {
      throw new AssertionError(message || `Expected false, but got ${value}`, value, false);
    }
  },
  
  toThrow: (expectedError?: string | RegExp, message?: string) => {
    try {
      if (typeof value === 'function') {
        value();
      }
      throw new AssertionError(message || 'Expected function to throw', undefined, 'Error');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (!(error as Error).message.includes(expectedError)) {
            throw new AssertionError(
              message || `Expected error message to contain "${expectedError}", but got "${(error as Error).message}"`,
              (error as Error).message,
              expectedError
            );
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test((error as Error).message)) {
            throw new AssertionError(
              message || `Expected error message to match ${expectedError}, but got "${(error as Error).message}"`,
              (error as Error).message,
              expectedError
            );
          }
        }
      }
    }
  },
});

// Global mock and spy functions
export const mock = TestFramework.createMock;
export const spy = TestFramework.createSpy;

// Global test runner
export const runTests = () => testFramework.run();

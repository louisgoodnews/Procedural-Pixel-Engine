/**
 * Testing framework index
 * Exports all testing systems for comprehensive engine validation
 */

// Core testing frameworks
export * from './TestFramework';
export * from './IntegrationTesting';
export * from './PerformanceTesting';
export * from './StressTesting';

// Advanced testing exports (selective to avoid conflicts)
export {
  AdvancedTestingSystem,
  createAdvancedTestingSystem,
  TestType as AdvancedTestType,
  TestStatus as AdvancedTestStatus,
  TestPriority as AdvancedTestPriority,
  CIConfiguration,
  DocumentationConfiguration,
  TutorialConfiguration,
  CommentingSystem,
  DocumentationFormat,
  SectionType,
  NotificationType
} from './AdvancedTesting';

// Global instances
export {
  testFramework,
} from './TestFramework';

export {
  integrationTestRunner,
} from './IntegrationTesting';

export {
  performanceTester,
} from './PerformanceTesting';

export {
  stressTester,
} from './StressTesting';

// Convenience functions
export {
  describe,
  it,
  test,
  expect,
  mock,
  spy,
  runTests,
} from './TestFramework';

export {
  registerIntegrationScenario,
  runIntegrationTests,
} from './IntegrationTesting';

export {
  startPerformanceProfiling,
  stopPerformanceProfiling,
  recordFrame,
  runEngineBenchmarks,
  runRenderingBenchmarks,
  generatePerformanceReport,
  savePerformanceReport,
} from './PerformanceTesting';

export {
  runStressTest,
  stopStressTest,
  getStressTestScenarios,
} from './StressTesting';

// Built-in scenarios
export {
  BUILTIN_INTEGRATION_SCENARIOS,
} from './IntegrationTesting';

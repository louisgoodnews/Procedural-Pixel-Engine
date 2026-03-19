use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct TestResult {
    pub name: String,
    pub status: TestStatus,
    pub message: String,
    pub duration: f64,
    pub details: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum TestStatus {
    Passed,
    Failed,
    Skipped,
    Warning,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct TestSuite {
    pub name: String,
    pub tests: Vec<TestResult>,
    pub total_duration: f64,
    pub passed_count: u32,
    pub failed_count: u32,
    pub skipped_count: u32,
    pub warning_count: u32,
    pub success_rate: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct TestReport {
    pub timestamp: f64,
    pub suites: Vec<TestSuite>,
    pub total_tests: u32,
    pub total_passed: u32,
    pub total_failed: u32,
    pub total_skipped: u32,
    pub total_warnings: u32,
    pub overall_success_rate: f32,
    pub total_duration: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct TestConfig {
    pub enable_performance_tests: bool,
    enable_stress_tests: bool,
    pub enable_integration_tests: bool,
    pub test_timeout: f64,
    pub max_test_duration: f64,
    pub parallel_execution: bool,
    pub verbose_logging: bool,
    pub generate_reports: bool,
}

pub struct RustTestFramework {
    config: TestConfig,
    test_suites: Vec<TestSuite>,
    current_suite: Option<String>,
}

impl RustTestFramework {
    pub fn new(config: TestConfig) -> RustTestFramework {
        RustTestFramework {
            config,
            test_suites: Vec::new(),
            current_suite: None,
        }
    }

    pub fn update_config(&mut self, config: TestConfig) {
        self.config = config;
    }

    pub fn get_config(&self) -> TestConfig {
        self.config.clone()
    }

    pub fn start_test_suite(&mut self, name: String) {
        self.current_suite = Some(name.clone());
        console_log(&format!("🧪 Starting test suite: {}", name));
    }

    pub fn end_test_suite(&mut self) -> Option<TestSuite> {
        if let Some(suite_name) = self.current_suite.take() {
            let suite = TestSuite {
                name: suite_name,
                tests: Vec::new(),
                total_duration: 0.0,
                passed_count: 0,
                failed_count: 0,
                skipped_count: 0,
                warning_count: 0,
                success_rate: 0.0,
            };
            self.test_suites.push(suite);
            Some(self.test_suites.last().cloned().unwrap())
        } else {
            None
        }
    }

    pub fn run_test<F>(&mut self, name: String, test_fn: F) -> TestResult 
    where 
        F: FnOnce() -> Result<(), String>
    {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let mut result = TestResult {
            name: name.clone(),
            status: TestStatus::Failed,
            message: "Test not executed".to_string(),
            duration: 0.0,
            details: None,
        };

        // Execute test
        match test_fn() {
            Ok(()) => {
                result.status = TestStatus::Passed;
                result.message = "Test passed successfully".to_string();
            }
            Err(error) => {
                result.status = TestStatus::Failed;
                result.message = error;
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        result.duration = end_time - start_time;

        // Log result if verbose
        if self.config.verbose_logging {
            let status_icon = match result.status {
                TestStatus::Passed => "✅",
                TestStatus::Failed => "❌",
                TestStatus::Skipped => "⏭️",
                TestStatus::Warning => "⚠️",
            };
            console_log(&format!("{} {}: {} ({:.2}ms)", status_icon, name, result.message, result.duration));
        }

        // Add to current suite
        if let Some(suite_name) = &self.current_suite {
            if let Some(suite) = self.test_suites.iter_mut().find(|s| &s.name == suite_name) {
                suite.tests.push(result.clone());
                suite.total_duration += result.duration;
                
                match result.status {
                    TestStatus::Passed => suite.passed_count += 1,
                    TestStatus::Failed => suite.failed_count += 1,
                    TestStatus::Skipped => suite.skipped_count += 1,
                    TestStatus::Warning => suite.warning_count += 1,
                }
                
                let total_tests = suite.passed_count + suite.failed_count + suite.skipped_count + suite.warning_count;
                if total_tests > 0 {
                    suite.success_rate = (suite.passed_count as f32 / total_tests as f32) * 100.0;
                }
            }
        }

        result
    }

    pub fn generate_report(&self) -> TestReport {
        let total_tests = self.test_suites.iter().map(|s| s.tests.len() as u32).sum();
        let total_passed = self.test_suites.iter().map(|s| s.passed_count).sum();
        let total_failed = self.test_suites.iter().map(|s| s.failed_count).sum();
        let total_skipped = self.test_suites.iter().map(|s| s.skipped_count).sum();
        let total_warnings = self.test_suites.iter().map(|s| s.warning_count).sum();
        let total_duration = self.test_suites.iter().map(|s| s.total_duration).sum();
        
        let overall_success_rate = if total_tests > 0 {
            (total_passed as f32 / total_tests as f32) * 100.0
        } else {
            0.0
        };

        TestReport {
            timestamp: web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now(),
            suites: self.test_suites.clone(),
            total_tests,
            total_passed,
            total_failed,
            total_skipped,
            total_warnings,
            overall_success_rate,
            total_duration,
        }
    }

    pub fn clear_results(&mut self) {
        self.test_suites.clear();
        self.current_suite = None;
    }

    // Basic system tests
    pub fn run_basic_tests(&mut self) -> TestSuite {
        self.start_test_suite("Basic System Tests".to_string());

        // Test WebAssembly performance
        self.run_test("WebAssembly Performance".to_string(), || {
            let start_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            // Simple computation test
            let mut _result = 0.0;
            for i in 0..10000 {
                _result += (i as f64).sin().cos();
            }
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let duration = end_time - start_time;
            if duration < 100.0 { // Should complete in less than 100ms
                Ok(())
            } else {
                Err(format!("WebAssembly performance test too slow: {:.2}ms", duration))
            }
        });

        // Test memory allocation
        self.run_test("Memory Allocation".to_string(), || {
            let start_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            // Allocate and deallocate memory
            let mut vectors = Vec::new();
            for i in 0..1000 {
                let vec = vec![i; 100];
                vectors.push(vec);
            }
            
            // Clear vectors
            vectors.clear();
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let duration = end_time - start_time;
            if duration < 50.0 { // Should complete in less than 50ms
                Ok(())
            } else {
                Err(format!("Memory allocation test too slow: {:.2}ms", duration))
            }
        });

        // Test mathematical operations
        self.run_test("Mathematical Operations".to_string(), || {
            let start_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            // Test various mathematical operations
            let mut _result = 0.0;
            for i in 0..10000 {
                _result += (i as f64).sin();
                _result += (i as f64).cos();
                _result += (i as f64).tan();
                _result += (i as f64).sqrt();
                _result += (i as f64).ln();
            }
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let duration = end_time - start_time;
            if duration < 200.0 { // Should complete in less than 200ms
                Ok(())
            } else {
                Err(format!("Mathematical operations test too slow: {:.2}ms", duration))
            }
        });

        self.end_test_suite().unwrap()
    }

    // Integration tests
    pub fn run_integration_tests(&mut self) -> TestSuite {
        self.start_test_suite("Integration Tests".to_string());

        // Test TypeScript integration
        self.run_test("TypeScript Integration".to_string(), || {
            // Test if we can call JavaScript functions from Rust
            let window = web_sys::window().unwrap();
            let performance = window.performance().unwrap();
            let now = performance.now();
            
            if now > 0.0 {
                Ok(())
            } else {
                Err("Failed to get performance time from JavaScript".to_string())
            }
        });

        // Test WebAssembly bindings
        self.run_test("WebAssembly Bindings".to_string(), || {
            // Test if wasm-bindgen is working correctly
            let test_string = "Hello from Rust!";
            let js_string = JsValue::from_str(test_string);
            
            if js_string.as_string().unwrap_or_default() == test_string {
                Ok(())
            } else {
                Err("WebAssembly bindings not working correctly".to_string())
            }
        });

        // Test console logging
        self.run_test("Console Logging".to_string(), || {
            // Test if console logging works
            console_log("Test console message from Rust");
            Ok(())
        });

        self.end_test_suite().unwrap()
    }

    // Performance tests
    pub fn run_performance_tests(&mut self) -> TestSuite {
        self.start_test_suite("Performance Tests".to_string());

        // Test CPU performance
        self.run_test("CPU Performance".to_string(), || {
            let start_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            // CPU-intensive computation
            let mut _result = 0.0;
            for i in 0..100000 {
                _result += (i as f64).sin().cos().tan().sqrt().ln();
            }
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let duration = end_time - start_time;
            let ops_per_second = 100000.0 / (duration / 1000.0);
            
            if ops_per_second > 1000000.0 { // Should handle >1M ops/sec
                Ok(())
            } else {
                Err(format!("CPU performance too low: {:.0} ops/sec", ops_per_second))
            }
        });

        // Test memory performance
        self.run_test("Memory Performance".to_string(), || {
            let start_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            // Memory-intensive operations
            let mut vectors = Vec::new();
            for i in 0..10000 {
                let vec: Vec<f64> = (0..1000).map(|j| (i + j) as f64).collect();
                vectors.push(vec);
            }
            
            // Process vectors
            let mut _total = 0.0;
            for vec in &vectors {
                _total += vec.iter().sum::<f64>();
            }
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let duration = end_time - start_time;
            if duration < 1000.0 { // Should complete in less than 1 second
                Ok(())
            } else {
                Err(format!("Memory performance too slow: {:.2}ms", duration))
            }
        });

        self.end_test_suite().unwrap()
    }

    // Run all tests
    pub fn run_all_tests(&mut self) -> TestReport {
        console_log("🧪 Starting comprehensive Rust test suite...");
        
        self.clear_results();
        
        // Run basic tests
        self.run_basic_tests();
        
        // Run integration tests if enabled
        if self.config.enable_integration_tests {
            self.run_integration_tests();
        }
        
        // Run performance tests if enabled
        if self.config.enable_performance_tests {
            self.run_performance_tests();
        }
        
        let report = self.generate_report();
        
        console_log(&format!("📊 Test suite completed: {}/{} tests passed ({:.1}% success rate)", 
            report.total_passed, 
            report.total_tests, 
            report.overall_success_rate));
        
        report
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustTestFrameworkExport {
    inner: RustTestFramework,
}

#[wasm_bindgen]
impl RustTestFrameworkExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> RustTestFrameworkExport {
        let config = serde_wasm_bindgen::from_value::<TestConfig>(config).unwrap();
        console_log("🦀 Rust Test Framework initialized");
        RustTestFrameworkExport {
            inner: RustTestFramework::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(test_config) = serde_wasm_bindgen::from_value::<TestConfig>(config) {
            self.inner.update_config(test_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn run_all_tests(&mut self) -> JsValue {
        let report = self.inner.run_all_tests();
        serde_wasm_bindgen::to_value(&report).unwrap()
    }

    #[wasm_bindgen]
    pub fn run_basic_tests(&mut self) -> JsValue {
        let suite = self.inner.run_basic_tests();
        serde_wasm_bindgen::to_value(&suite).unwrap()
    }

    #[wasm_bindgen]
    pub fn run_integration_tests(&mut self) -> JsValue {
        let suite = self.inner.run_integration_tests();
        serde_wasm_bindgen::to_value(&suite).unwrap()
    }

    #[wasm_bindgen]
    pub fn run_performance_tests(&mut self) -> JsValue {
        let suite = self.inner.run_performance_tests();
        serde_wasm_bindgen::to_value(&suite).unwrap()
    }

    #[wasm_bindgen]
    pub fn clear_results(&mut self) {
        self.inner.clear_results();
    }

    #[wasm_bindgen]
    pub fn generate_report(&self) -> JsValue {
        let report = self.inner.generate_report();
        serde_wasm_bindgen::to_value(&report).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_test_config(
    enable_performance_tests: bool,
    enable_stress_tests: bool,
    enable_integration_tests: bool,
    test_timeout: f64,
    max_test_duration: f64,
    parallel_execution: bool,
    verbose_logging: bool,
    generate_reports: bool
) -> JsValue {
    let config = TestConfig {
        enable_performance_tests,
        enable_stress_tests,
        enable_integration_tests,
        test_timeout,
        max_test_duration,
        parallel_execution,
        verbose_logging,
        generate_reports,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

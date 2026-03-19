use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::networking::{NetworkMessage, NetworkMessageType, MessagePriority, NetworkPeer};

// Testing types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTestConfig {
    pub test_type: TestType,
    pub message_count: u32,
    pub message_size: usize,
    pub concurrent_connections: u32,
    pub test_duration_seconds: u32,
    pub latency_simulation_ms: u32,
    pub packet_loss_rate: f32,
    pub bandwidth_limit_bps: u32,
    pub enable_compression: bool,
    pub enable_batching: bool,
    pub enable_optimization: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestType {
    Latency,
    Throughput,
    Reliability,
    Scalability,
    Stress,
    Endurance,
    Security,
    Optimization,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub test_id: String,
    pub test_type: TestType,
    pub started_at: u64,
    pub completed_at: u64,
    pub duration_ms: u64,
    pub success: bool,
    pub error_message: Option<String>,
    pub metrics: TestMetrics,
    pub detailed_results: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestMetrics {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub messages_failed: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub average_latency_ms: f32,
    pub min_latency_ms: f32,
    pub max_latency_ms: f32,
    pub packet_loss_rate: f32,
    pub throughput_mbps: f32,
    pub cpu_usage_percent: f32,
    pub memory_usage_mb: f32,
    pub connection_count: u32,
    pub error_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestScenario {
    pub name: String,
    pub description: String,
    pub config: NetworkTestConfig,
    pub expected_results: TestMetrics,
    pub pass_criteria: PassCriteria,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PassCriteria {
    pub max_latency_ms: f32,
    pub min_throughput_mbps: f32,
    pub max_packet_loss_rate: f32,
    pub max_error_rate: f32,
    pub max_cpu_usage_percent: f32,
    pub max_memory_usage_mb: f32,
}

// Network test framework
pub struct NetworkTestFramework {
    test_scenarios: Vec<TestScenario>,
    test_results: Vec<TestResult>,
    active_tests: HashMap<String, NetworkTest>,
    test_id_counter: u64,
}

#[derive(Debug)]
struct NetworkTest {
    id: String,
    config: NetworkTestConfig,
    start_time: u64,
    metrics: TestMetrics,
    latencies: Vec<f32>,
    message_tracker: HashMap<String, u64>, // message_id -> send_time
    running: bool,
    error_count: u64,
}

impl NetworkTestFramework {
    pub fn new() -> Self {
        console_log!("🧪 Initializing network test framework");

        Self {
            test_scenarios: Self::create_default_scenarios(),
            test_results: Vec::new(),
            active_tests: HashMap::new(),
            test_id_counter: 0,
        }
    }

    fn create_default_scenarios() -> Vec<TestScenario> {
        vec![
            TestScenario {
                name: "Basic Latency Test".to_string(),
                description: "Tests basic message latency with small messages".to_string(),
                config: NetworkTestConfig {
                    test_type: TestType::Latency,
                    message_count: 1000,
                    message_size: 64,
                    concurrent_connections: 1,
                    test_duration_seconds: 30,
                    latency_simulation_ms: 0,
                    packet_loss_rate: 0.0,
                    bandwidth_limit_bps: 1000000,
                    enable_compression: false,
                    enable_batching: false,
                    enable_optimization: false,
                },
                expected_results: TestMetrics {
                    messages_sent: 1000,
                    messages_received: 1000,
                    messages_failed: 0,
                    bytes_sent: 64000,
                    bytes_received: 64000,
                    average_latency_ms: 50.0,
                    min_latency_ms: 10.0,
                    max_latency_ms: 100.0,
                    packet_loss_rate: 0.0,
                    throughput_mbps: 0.001,
                    cpu_usage_percent: 10.0,
                    memory_usage_mb: 50.0,
                    connection_count: 1,
                    error_count: 0,
                },
                pass_criteria: PassCriteria {
                    max_latency_ms: 100.0,
                    min_throughput_mbps: 0.001,
                    max_packet_loss_rate: 0.01,
                    max_error_rate: 0.01,
                    max_cpu_usage_percent: 50.0,
                    max_memory_usage_mb: 100.0,
                },
            },
            TestScenario {
                name: "High Throughput Test".to_string(),
                description: "Tests maximum throughput with large messages".to_string(),
                config: NetworkTestConfig {
                    test_type: TestType::Throughput,
                    message_count: 10000,
                    message_size: 1024,
                    concurrent_connections: 5,
                    test_duration_seconds: 60,
                    latency_simulation_ms: 10,
                    packet_loss_rate: 0.01,
                    bandwidth_limit_bps: 10000000,
                    enable_compression: true,
                    enable_batching: true,
                    enable_optimization: true,
                },
                expected_results: TestMetrics {
                    messages_sent: 10000,
                    messages_received: 9900,
                    messages_failed: 100,
                    bytes_sent: 10240000,
                    bytes_received: 10098000,
                    average_latency_ms: 100.0,
                    min_latency_ms: 20.0,
                    max_latency_ms: 500.0,
                    packet_loss_rate: 0.01,
                    throughput_mbps: 1.36,
                    cpu_usage_percent: 30.0,
                    memory_usage_mb: 100.0,
                    connection_count: 5,
                    error_count: 100,
                },
                pass_criteria: PassCriteria {
                    max_latency_ms: 200.0,
                    min_throughput_mbps: 1.0,
                    max_packet_loss_rate: 0.02,
                    max_error_rate: 0.02,
                    max_cpu_usage_percent: 70.0,
                    max_memory_usage_mb: 200.0,
                },
            },
            TestScenario {
                name: "Reliability Test".to_string(),
                description: "Tests message reliability under packet loss".to_string(),
                config: NetworkTestConfig {
                    test_type: TestType::Reliability,
                    message_count: 5000,
                    message_size: 256,
                    concurrent_connections: 3,
                    test_duration_seconds: 45,
                    latency_simulation_ms: 50,
                    packet_loss_rate: 0.05,
                    bandwidth_limit_bps: 5000000,
                    enable_compression: true,
                    enable_batching: false,
                    enable_optimization: true,
                },
                expected_results: TestMetrics {
                    messages_sent: 5000,
                    messages_received: 4750,
                    messages_failed: 250,
                    bytes_sent: 1280000,
                    bytes_received: 1216000,
                    average_latency_ms: 150.0,
                    min_latency_ms: 30.0,
                    max_latency_ms: 800.0,
                    packet_loss_rate: 0.05,
                    throughput_mbps: 0.22,
                    cpu_usage_percent: 25.0,
                    memory_usage_mb: 75.0,
                    connection_count: 3,
                    error_count: 250,
                },
                pass_criteria: PassCriteria {
                    max_latency_ms: 300.0,
                    min_throughput_mbps: 0.2,
                    max_packet_loss_rate: 0.1,
                    max_error_rate: 0.1,
                    max_cpu_usage_percent: 60.0,
                    max_memory_usage_mb: 150.0,
                },
            },
            TestScenario {
                name: "Scalability Test".to_string(),
                description: "Tests system scalability with many connections".to_string(),
                config: NetworkTestConfig {
                    test_type: TestType::Scalability,
                    message_count: 20000,
                    message_size: 128,
                    concurrent_connections: 50,
                    test_duration_seconds: 120,
                    latency_simulation_ms: 25,
                    packet_loss_rate: 0.02,
                    bandwidth_limit_bps: 50000000,
                    enable_compression: true,
                    enable_batching: true,
                    enable_optimization: true,
                },
                expected_results: TestMetrics {
                    messages_sent: 20000,
                    messages_received: 19600,
                    messages_failed: 400,
                    bytes_sent: 2560000,
                    bytes_received: 2508800,
                    average_latency_ms: 200.0,
                    min_latency_ms: 40.0,
                    max_latency_ms: 1000.0,
                    packet_loss_rate: 0.02,
                    throughput_mbps: 0.17,
                    cpu_usage_percent: 60.0,
                    memory_usage_mb: 200.0,
                    connection_count: 50,
                    error_count: 400,
                },
                pass_criteria: PassCriteria {
                    max_latency_ms: 500.0,
                    min_throughput_mbps: 0.15,
                    max_packet_loss_rate: 0.05,
                    max_error_rate: 0.05,
                    max_cpu_usage_percent: 80.0,
                    max_memory_usage_mb: 300.0,
                },
            },
        ]
    }

    // Test execution
    pub fn run_test(&mut self, scenario_name: &str) -> Result<String, String> {
        let scenario = self.test_scenarios.iter()
            .find(|s| s.name == scenario_name)
            .ok_or_else(|| format!("Test scenario not found: {}", scenario_name))?;

        let test_id = self.generate_test_id();
        let test = NetworkTest {
            id: test_id.clone(),
            config: scenario.config.clone(),
            start_time: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            metrics: TestMetrics {
                messages_sent: 0,
                messages_received: 0,
                messages_failed: 0,
                bytes_sent: 0,
                bytes_received: 0,
                average_latency_ms: 0.0,
                min_latency_ms: f32::MAX,
                max_latency_ms: 0.0,
                packet_loss_rate: 0.0,
                throughput_mbps: 0.0,
                cpu_usage_percent: 0.0,
                memory_usage_mb: 0.0,
                connection_count: scenario.config.concurrent_connections,
                error_count: 0,
            },
            latencies: Vec::new(),
            message_tracker: HashMap::new(),
            running: true,
            error_count: 0,
        };

        self.active_tests.insert(test_id.clone(), test);
        console_log!("🧪 Started test: {} (ID: {})", scenario_name, test_id);

        // Execute test asynchronously (in a real implementation, this would be async)
        self.execute_test(&test_id);

        Ok(test_id)
    }

    fn execute_test(&mut self, test_id: &str) {
        let test = self.active_tests.get_mut(test_id).unwrap();
        let scenario = self.test_scenarios.iter()
            .find(|s| s.config.test_type == test.config.test_type)
            .unwrap();

        match test.config.test_type {
            TestType::Latency => self.execute_latency_test(test),
            TestType::Throughput => self.execute_throughput_test(test),
            TestType::Reliability => self.execute_reliability_test(test),
            TestType::Scalability => self.execute_scalability_test(test),
            TestType::Stress => self.execute_stress_test(test),
            TestType::Endurance => self.execute_endurance_test(test),
            TestType::Security => self.execute_security_test(test),
            TestType::Optimization => self.execute_optimization_test(test),
        }

        // Complete test
        self.complete_test(test_id, scenario);
    }

    fn execute_latency_test(&mut self, test: &mut NetworkTest) {
        console_log!("⏱️ Executing latency test");

        for i in 0..test.config.message_count {
            let message = self.create_test_message(i, test.config.message_size);
            let send_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();

            // Simulate network latency
            if test.config.latency_simulation_ms > 0 {
                std::thread::sleep(std::time::Duration::from_millis(test.config.latency_simulation_ms as u64));
            }

            // Simulate packet loss
            if self.simulate_packet_loss(test.config.packet_loss_rate) {
                test.metrics.messages_failed += 1;
                test.error_count += 1;
                continue;
            }

            let receive_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
            let latency = (receive_time - send_time) as f32;

            test.metrics.messages_sent += 1;
            test.metrics.messages_received += 1;
            test.metrics.bytes_sent += test.config.message_size as u64;
            test.metrics.bytes_received += test.config.message_size as u64;
            test.latencies.push(latency);

            // Update min/max latency
            test.metrics.min_latency_ms = test.metrics.min_latency_ms.min(latency);
            test.metrics.max_latency_ms = test.metrics.max_latency_ms.max(latency);
        }

        // Calculate average latency
        if !test.latencies.is_empty() {
            test.metrics.average_latency_ms = test.latencies.iter().sum::<f32>() / test.latencies.len() as f32;
        }
    }

    fn execute_throughput_test(&mut self, test: &mut NetworkTest) {
        console_log!("📈 Executing throughput test");

        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let end_time = start_time + test.config.test_duration_seconds as u64;

        while SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() < end_time {
            for i in 0..test.config.message_count {
                if SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() >= end_time {
                    break;
                }

                let message = self.create_test_message(i, test.config.message_size);

                // Simulate bandwidth limiting
                if test.config.bandwidth_limit_bps > 0 {
                    let message_time = (test.config.message_size as u32 * 8) * 1000 / test.config.bandwidth_limit_bps;
                    std::thread::sleep(std::time::Duration::from_millis(message_time as u64));
                }

                // Simulate packet loss
                if self.simulate_packet_loss(test.config.packet_loss_rate) {
                    test.metrics.messages_failed += 1;
                    test.error_count += 1;
                    continue;
                }

                test.metrics.messages_sent += 1;
                test.metrics.messages_received += 1;
                test.metrics.bytes_sent += test.config.message_size as u64;
                test.metrics.bytes_received += test.config.message_size as u64;
            }
        }

        // Calculate throughput
        let duration = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() - start_time;
        if duration > 0 {
            test.metrics.throughput_mbps = (test.metrics.bytes_received as f32 * 8.0) / (duration as f32 * 1_000_000.0);
        }
    }

    fn execute_reliability_test(&mut self, test: &mut NetworkTest) {
        console_log!("🔒 Executing reliability test");

        for i in 0..test.config.message_count {
            let message = self.create_test_message(i, test.config.message_size);

            // Simulate packet loss
            if self.simulate_packet_loss(test.config.packet_loss_rate) {
                test.metrics.messages_failed += 1;
                test.error_count += 1;
            } else {
                test.metrics.messages_sent += 1;
                test.metrics.messages_received += 1;
                test.metrics.bytes_sent += test.config.message_size as u64;
                test.metrics.bytes_received += test.config.message_size as u64;
            }

            // Simulate latency
            if test.config.latency_simulation_ms > 0 {
                std::thread::sleep(std::time::Duration::from_millis(test.config.latency_simulation_ms as u64));
            }
        }

        // Calculate packet loss rate
        if test.metrics.messages_sent > 0 {
            test.metrics.packet_loss_rate = test.metrics.messages_failed as f32 / test.metrics.messages_sent as f32;
        }
    }

    fn execute_scalability_test(&mut self, test: &mut NetworkTest) {
        console_log!("📊 Executing scalability test");

        // Simulate multiple concurrent connections
        for connection in 0..test.config.concurrent_connections {
            for i in 0..(test.config.message_count / test.config.concurrent_connections) {
                let message = self.create_test_message(i + connection * 1000, test.config.message_size);

                // Simulate packet loss
                if self.simulate_packet_loss(test.config.packet_loss_rate) {
                    test.metrics.messages_failed += 1;
                    test.error_count += 1;
                } else {
                    test.metrics.messages_sent += 1;
                    test.metrics.messages_received += 1;
                    test.metrics.bytes_sent += test.config.message_size as u64;
                    test.metrics.bytes_received += test.config.message_size as u64;
                }

                // Simulate latency
                if test.config.latency_simulation_ms > 0 {
                    std::thread::sleep(std::time::Duration::from_millis(test.config.latency_simulation_ms as u64));
                }
            }
        }

        // Simulate resource usage
        test.metrics.cpu_usage_percent = (test.config.concurrent_connections as f32 * 1.2).min(80.0);
        test.metrics.memory_usage_mb = (test.config.concurrent_connections as f32 * 4.0).min(300.0);
    }

    fn execute_stress_test(&mut self, test: &mut NetworkTest) {
        console_log!("💪 Executing stress test");

        // High-intensity message sending
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let end_time = start_time + test.config.test_duration_seconds as u64;

        while SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() < end_time {
            for i in 0..test.config.message_count {
                if SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() >= end_time {
                    break;
                }

                let message = self.create_test_message(i, test.config.message_size);

                // Simulate high packet loss under stress
                let stress_packet_loss = test.config.packet_loss_rate * 2.0;
                if self.simulate_packet_loss(stress_packet_loss) {
                    test.metrics.messages_failed += 1;
                    test.error_count += 1;
                } else {
                    test.metrics.messages_sent += 1;
                    test.metrics.messages_received += 1;
                    test.metrics.bytes_sent += test.config.message_size as u64;
                    test.metrics.bytes_received += test.config.message_size as u64;
                }
            }

            // Simulate resource stress
            test.metrics.cpu_usage_percent = (test.metrics.messages_sent as f32 / 1000.0).min(95.0);
            test.metrics.memory_usage_mb = (test.metrics.messages_sent as f32 / 100.0).min(500.0);
        }
    }

    fn execute_endurance_test(&mut self, test: &mut NetworkTest) {
        console_log!("🏃 Executing endurance test");

        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let end_time = start_time + test.config.test_duration_seconds as u64;

        while SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() < end_time {
            for i in 0..100 { // Send 100 messages per cycle
                let message = self.create_test_message(i, test.config.message_size);

                if self.simulate_packet_loss(test.config.packet_loss_rate) {
                    test.metrics.messages_failed += 1;
                    test.error_count += 1;
                } else {
                    test.metrics.messages_sent += 1;
                    test.metrics.messages_received += 1;
                    test.metrics.bytes_sent += test.config.message_size as u64;
                    test.metrics.bytes_received += test.config.message_size as u64;
                }
            }

            // Small delay between cycles
            std::thread::sleep(std::time::Duration::from_millis(100));
        }
    }

    fn execute_security_test(&mut self, test: &mut NetworkTest) {
        console_log!("🔐 Executing security test");

        // Test various security scenarios
        for i in 0..test.config.message_count {
            let message = self.create_test_message(i, test.config.message_size);

            // Simulate security violations
            if i % 10 == 0 {
                // Simulate malformed message
                test.metrics.messages_failed += 1;
                test.error_count += 1;
                continue;
            }

            if i % 20 == 0 {
                // Simulate unauthorized message
                test.metrics.messages_failed += 1;
                test.error_count += 1;
                continue;
            }

            test.metrics.messages_sent += 1;
            test.metrics.messages_received += 1;
            test.metrics.bytes_sent += test.config.message_size as u64;
            test.metrics.bytes_received += test.config.message_size as u64;
        }
    }

    fn execute_optimization_test(&mut self, test: &mut NetworkTest) {
        console_log!("⚡ Executing optimization test");

        for i in 0..test.config.message_count {
            let message = self.create_test_message(i, test.config.message_size);

            // Test compression
            if test.config.enable_compression {
                // Simulate compression overhead
                std::thread::sleep(std::time::Duration::from_millis(1));
            }

            // Test batching
            if test.config.enable_batching && i % 10 == 0 {
                // Simulate batch processing
                std::thread::sleep(std::time::Duration::from_millis(5));
            }

            test.metrics.messages_sent += 1;
            test.metrics.messages_received += 1;
            test.metrics.bytes_sent += test.config.message_size as u64;
            test.metrics.bytes_received += test.config.message_size as u64;
        }

        // Simulate optimization benefits
        if test.config.enable_compression {
            test.metrics.bytes_received = (test.metrics.bytes_received as f32 * 0.7) as u64; // 30% compression
        }

        if test.config.enable_batching {
            test.metrics.average_latency_ms *= 0.8; // 20% latency improvement
        }
    }

    fn complete_test(&mut self, test_id: &str, scenario: &TestScenario) {
        let test = self.active_tests.remove(test_id).unwrap();
        let completed_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let duration_ms = (completed_at - test.start_time) * 1000;

        // Calculate final metrics
        let mut final_metrics = test.metrics;
        final_metrics.error_count = test.error_count;

        // Determine if test passed
        let success = self.evaluate_test_results(&final_metrics, &scenario.pass_criteria);

        let result = TestResult {
            test_id: test.id.clone(),
            test_type: test.config.test_type.clone(),
            started_at: test.start_time,
            completed_at,
            duration_ms,
            success,
            error_message: if success { None } else { Some("Test criteria not met".to_string()) },
            metrics: final_metrics,
            detailed_results: self.generate_detailed_results(&test),
        };

        self.test_results.push(result);
        console_log!("✅ Test completed: {} (Success: {})", test.id, success);
    }

    fn evaluate_test_results(&self, metrics: &TestMetrics, criteria: &PassCriteria) -> bool {
        metrics.average_latency_ms <= criteria.max_latency_ms &&
        metrics.throughput_mbps >= criteria.min_throughput_mbps &&
        metrics.packet_loss_rate <= criteria.max_packet_loss_rate &&
        (metrics.messages_failed as f32 / metrics.messages_sent as f32) <= criteria.max_error_rate &&
        metrics.cpu_usage_percent <= criteria.max_cpu_usage_percent &&
        metrics.memory_usage_mb <= criteria.max_memory_usage_mb
    }

    fn generate_detailed_results(&self, test: &NetworkTest) -> HashMap<String, serde_json::Value> {
        let mut results = HashMap::new();

        results.insert("config".to_string(), serde_json::to_value(&test.config).unwrap());
        results.insert("latency_distribution".to_string(), serde_json::to_value(&test.latencies).unwrap());
        
        // Calculate percentiles
        if !test.latencies.is_empty() {
            let mut sorted_latencies = test.latencies.clone();
            sorted_latencies.sort_by(|a, b| a.partial_cmp(b).unwrap());
            
            let p50 = sorted_latencies[sorted_latencies.len() / 2];
            let p95 = sorted_latencies[(sorted_latencies.len() as f32 * 0.95) as usize];
            let p99 = sorted_latencies[(sorted_latencies.len() as f32 * 0.99) as usize];
            
            results.insert("latency_p50".to_string(), serde_json::to_value(p50).unwrap());
            results.insert("latency_p95".to_string(), serde_json::to_value(p95).unwrap());
            results.insert("latency_p99".to_string(), serde_json::to_value(p99).unwrap());
        }

        results
    }

    // Utility methods
    fn create_test_message(&self, index: u32, size: usize) -> NetworkMessage {
        let data = "x".repeat(size);
        
        NetworkMessage {
            id: format!("test_msg_{}", index),
            message_type: NetworkMessageType::Custom("TEST".to_string()),
            sender_id: "test_sender".to_string(),
            recipient_id: Some("test_recipient".to_string()),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            data: serde_json::json!({"data": data, "index": index}),
            priority: MessagePriority::Normal,
            reliable: true,
            sequence_number: Some(index),
        }
    }

    fn simulate_packet_loss(&self, loss_rate: f32) -> bool {
        if loss_rate <= 0.0 {
            return false;
        }

        // Simple pseudo-random number generator using timestamp
        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let random_value = (timestamp % 1000) as f32 / 1000.0;
        random_value < loss_rate
    }

    fn generate_test_id(&mut self) -> String {
        self.test_id_counter += 1;
        format!("test_{}", self.test_id_counter)
    }

    // Public API methods
    pub fn get_test_scenarios(&self) -> &Vec<TestScenario> {
        &self.test_scenarios
    }

    pub fn get_test_results(&self) -> &Vec<TestResult> {
        &self.test_results
    }

    pub fn get_active_tests(&self) -> Vec<String> {
        self.active_tests.keys().cloned().collect()
    }

    pub fn get_test_result(&self, test_id: &str) -> Option<&TestResult> {
        self.test_results.iter().find(|r| r.test_id == test_id)
    }

    pub fn add_custom_scenario(&mut self, scenario: TestScenario) {
        self.test_scenarios.push(scenario);
        console_log!("➕ Added custom test scenario: {}", scenario.name);
    }

    pub fn clear_results(&mut self) {
        self.test_results.clear();
        console_log!("🧹 Test results cleared");
    }

    pub fn generate_test_report(&self) -> String {
        if self.test_results.is_empty() {
            return "No test results available".to_string();
        }

        let mut report = String::new();
        report.push_str("Network Test Report\n");
        report.push_str("==================\n\n");

        for result in &self.test_results {
            report.push_str(&format!(
                "Test: {}\n\
                Type: {:?}\n\
                Duration: {}ms\n\
                Success: {}\n\
                Messages Sent: {}\n\
                Messages Received: {}\n\
                Messages Failed: {}\n\
                Average Latency: {:.2}ms\n\
                Throughput: {:.2}Mbps\n\
                Packet Loss: {:.2}%\n\
                CPU Usage: {:.2}%\n\
                Memory Usage: {:.2}MB\n\
                ==================\n\n",
                result.test_id,
                result.test_type,
                result.duration_ms,
                result.success,
                result.metrics.messages_sent,
                result.metrics.messages_received,
                result.metrics.messages_failed,
                result.metrics.average_latency_ms,
                result.metrics.throughput_mbps,
                result.metrics.packet_loss_rate * 100.0,
                result.metrics.cpu_usage_percent,
                result.metrics.memory_usage_mb
            ));
        }

        report
    }
}

// WASM exports
#[wasm_bindgen]
pub struct NetworkTestFrameworkWrapper {
    inner: std::sync::Mutex<NetworkTestFramework>,
}

#[wasm_bindgen]
impl NetworkTestFrameworkWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> NetworkTestFrameworkWrapper {
        NetworkTestFrameworkWrapper {
            inner: std::sync::Mutex::new(NetworkTestFramework::new()),
        }
    }

    #[wasm_bindgen]
    pub fn run_test(&self, scenario_name: &str) -> Result<String, JsValue> {
        let mut framework = self.inner.lock().unwrap();
        match framework.run_test(scenario_name) {
            Ok(test_id) => Ok(test_id),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_test_scenarios(&self) -> JsValue {
        let framework = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&framework.get_test_scenarios()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_test_results(&self) -> JsValue {
        let framework = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&framework.get_test_results()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_active_tests(&self) -> JsValue {
        let framework = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&framework.get_active_tests()).unwrap()
    }

    #[wasm_bindgen]
    pub fn generate_test_report(&self) -> String {
        let framework = self.inner.lock().unwrap();
        framework.generate_test_report()
    }
}

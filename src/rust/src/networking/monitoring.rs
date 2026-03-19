use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::networking::{NetworkMessage, NetworkPeer, NetworkStats};

// Monitoring types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetrics {
    pub timestamp: u64,
    pub messages_per_second: f32,
    pub bytes_per_second: f32,
    pub latency_ms: f32,
    pub packet_loss_rate: f32,
    pub connection_count: u32,
    pub active_peers: u32,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub bandwidth_utilization: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionMetrics {
    pub peer_id: String,
    pub connection_time: u64,
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub average_latency: f32,
    pub packet_loss: f32,
    pub retransmissions: u64,
    pub last_activity: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetrics {
    pub message_id: String,
    pub message_type: String,
    pub size_bytes: usize,
    pub send_time: u64,
    pub receive_time: Option<u64>,
    pub delivery_time: Option<u64>,
    pub retries: u32,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub alert_id: String,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub message: String,
    pub timestamp: u64,
    pub metrics: NetworkMetrics,
    pub resolved: bool,
    pub resolved_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    HighLatency,
    PacketLoss,
    ConnectionDrop,
    BandwidthSaturation,
    MemoryUsage,
    CPUUsage,
    MessageQueueOverflow,
    SecurityViolation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub metrics_retention_period: u64, // seconds
    pub alert_thresholds: AlertThresholds,
    pub enable_real_time_monitoring: bool,
    pub enable_performance_profiling: bool,
    pub enable_network_capture: bool,
    pub max_captured_messages: usize,
    pub metrics_update_interval: u32, // milliseconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThresholds {
    pub high_latency_ms: f32,
    pub packet_loss_rate: f32,
    pub bandwidth_utilization: f32,
    pub memory_usage_mb: u64,
    pub cpu_usage_percent: f32,
    pub connection_drop_rate: f32,
}

impl Default for MonitoringConfig {
    fn default() -> Self {
        Self {
            metrics_retention_period: 3600, // 1 hour
            alert_thresholds: AlertThresholds {
                high_latency_ms: 200.0,
                packet_loss_rate: 0.05, // 5%
                bandwidth_utilization: 0.8, // 80%
                memory_usage_mb: 512, // 512MB
                cpu_usage_percent: 80.0, // 80%
                connection_drop_rate: 0.1, // 10%
            },
            enable_real_time_monitoring: true,
            enable_performance_profiling: true,
            enable_network_capture: false,
            max_captured_messages: 1000,
            metrics_update_interval: 1000, // 1 second
        }
    }
}

// Network monitor
pub struct NetworkMonitor {
    config: MonitoringConfig,
    metrics_history: VecDeque<NetworkMetrics>,
    connection_metrics: HashMap<String, ConnectionMetrics>,
    message_metrics: HashMap<String, MessageMetrics>,
    alerts: Vec<PerformanceAlert>,
    captured_messages: VecDeque<NetworkMessage>,
    performance_counters: HashMap<String, u64>,
    last_metrics_update: u64,
    start_time: u64,
}

impl NetworkMonitor {
    pub fn new(config: MonitoringConfig) -> Self {
        console_log!("📊 Initializing network monitor");

        Self {
            config,
            metrics_history: VecDeque::new(),
            connection_metrics: HashMap::new(),
            message_metrics: HashMap::new(),
            alerts: Vec::new(),
            captured_messages: VecDeque::new(),
            performance_counters: HashMap::new(),
            last_metrics_update: 0,
            start_time: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        }
    }

    // Metrics collection
    pub fn update_metrics(&mut self, network_stats: &NetworkStats, peers: &[&NetworkPeer]) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        // Check if it's time to update metrics
        if now - self.last_metrics_update < (self.config.metrics_update_interval / 1000) as u64 {
            return;
        }

        // Calculate current metrics
        let metrics = self.calculate_current_metrics(network_stats, peers);
        
        // Store metrics
        self.metrics_history.push_back(metrics.clone());
        
        // Limit history size
        while self.metrics_history.len() > (self.config.metrics_retention_period / (self.config.metrics_update_interval / 1000)) as usize {
            self.metrics_history.pop_front();
        }

        // Update connection metrics
        self.update_connection_metrics(peers);
        
        // Check for alerts
        self.check_alerts(&metrics);
        
        // Clean up old data
        self.cleanup_old_data(now);

        self.last_metrics_update = now;
    }

    fn calculate_current_metrics(&self, network_stats: &NetworkStats, peers: &[&NetworkPeer]) -> NetworkMetrics {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let uptime = now - self.start_time;

        // Calculate messages per second
        let messages_per_second = if uptime > 0 {
            network_stats.messages_sent as f32 / uptime as f32
        } else {
            0.0
        };

        // Calculate bytes per second
        let bytes_per_second = if uptime > 0 {
            network_stats.bytes_sent as f32 / uptime as f32
        } else {
            0.0
        };

        // Calculate average latency
        let latency_ms = network_stats.average_latency;

        // Calculate packet loss rate
        let packet_loss_rate = if network_stats.messages_sent > 0 {
            network_stats.packets_dropped as f32 / network_stats.messages_sent as f32
        } else {
            0.0
        };

        // Calculate bandwidth utilization (simplified)
        let bandwidth_utilization = if peers.len() > 0 {
            let total_bandwidth: u32 = peers.iter().map(|p| p.bandwidth).sum();
            let used_bandwidth = bytes_per_second * 8.0; // Convert to bits
            (used_bandwidth / total_bandwidth as f32).min(1.0)
        } else {
            0.0
        };

        // Simulate CPU and memory usage
        let cpu_usage = self.simulate_cpu_usage();
        let memory_usage = self.simulate_memory_usage();

        NetworkMetrics {
            timestamp: now,
            messages_per_second,
            bytes_per_second,
            latency_ms,
            packet_loss_rate,
            connection_count: network_stats.active_connections,
            active_peers: peers.len() as u32,
            cpu_usage,
            memory_usage,
            bandwidth_utilization,
        }
    }

    fn update_connection_metrics(&mut self, peers: &[&NetworkPeer]) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

        for peer in peers {
            let metrics = self.connection_metrics.entry(peer.id.clone()).or_insert(ConnectionMetrics {
                peer_id: peer.id.clone(),
                connection_time: now,
                messages_sent: 0,
                messages_received: 0,
                bytes_sent: 0,
                bytes_received: 0,
                average_latency: peer.latency as f32,
                packet_loss: peer.packet_loss,
                retransmissions: 0,
                last_activity: now,
            });

            // Update metrics
            metrics.average_latency = peer.latency as f32;
            metrics.packet_loss = peer.packet_loss;
            metrics.last_activity = now;
        }

        // Remove disconnected peers
        let connected_peer_ids: std::collections::HashSet<_> = peers.iter().map(|p| &p.id).collect();
        self.connection_metrics.retain(|peer_id, _| connected_peer_ids.contains(peer_id));
    }

    fn check_alerts(&mut self, metrics: &NetworkMetrics) {
        // High latency alert
        if metrics.latency_ms > self.config.alert_thresholds.high_latency_ms {
            self.create_alert(
                AlertType::HighLatency,
                AlertSeverity::Warning,
                format!("High latency detected: {:.2}ms", metrics.latency_ms),
                metrics.clone()
            );
        }

        // Packet loss alert
        if metrics.packet_loss_rate > self.config.alert_thresholds.packet_loss_rate {
            self.create_alert(
                AlertType::PacketLoss,
                AlertSeverity::Error,
                format!("High packet loss rate: {:.2}%", metrics.packet_loss_rate * 100.0),
                metrics.clone()
            );
        }

        // Bandwidth saturation alert
        if metrics.bandwidth_utilization > self.config.alert_thresholds.bandwidth_utilization {
            self.create_alert(
                AlertType::BandwidthSaturation,
                AlertSeverity::Warning,
                format!("High bandwidth utilization: {:.2}%", metrics.bandwidth_utilization * 100.0),
                metrics.clone()
            );
        }

        // Memory usage alert
        if metrics.memory_usage > self.config.alert_thresholds.memory_usage_mb * 1024 * 1024 {
            self.create_alert(
                AlertType::MemoryUsage,
                AlertSeverity::Error,
                format!("High memory usage: {}MB", metrics.memory_usage / (1024 * 1024)),
                metrics.clone()
            );
        }

        // CPU usage alert
        if metrics.cpu_usage > self.config.alert_thresholds.cpu_usage_percent {
            self.create_alert(
                AlertType::CPUUsage,
                AlertSeverity::Warning,
                format!("High CPU usage: {:.2}%", metrics.cpu_usage),
                metrics.clone()
            );
        }
    }

    fn create_alert(&mut self, alert_type: AlertType, severity: AlertSeverity, message: String, metrics: NetworkMetrics) {
        let alert_id = format!("alert_{}_{}", 
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis(),
            self.alerts.len()
        );

        let alert = PerformanceAlert {
            alert_id,
            alert_type,
            severity,
            message,
            timestamp: metrics.timestamp,
            metrics,
            resolved: false,
            resolved_at: None,
        };

        self.alerts.push(alert);
        console_log!("🚨 Network Alert: {} - {}", severity, message);
    }

    // Message tracking
    pub fn track_message(&mut self, message: &NetworkMessage, direction: &str) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

        // Create message metrics
        let metrics = MessageMetrics {
            message_id: message.id.clone(),
            message_type: format!("{:?}", message.message_type),
            size_bytes: self.estimate_message_size(message),
            send_time: now,
            receive_time: None,
            delivery_time: None,
            retries: 0,
            success: true,
            error: None,
        };

        self.message_metrics.insert(message.id.clone(), metrics);

        // Capture message if enabled
        if self.config.enable_network_capture {
            self.captured_messages.push_back(message.clone());
            
            // Limit captured messages
            while self.captured_messages.len() > self.config.max_captured_messages {
                self.captured_messages.pop_front();
            }
        }

        // Update performance counters
        let counter_key = format!("{}_{}", direction, format!("{:?}", message.message_type));
        *self.performance_counters.entry(counter_key).or_insert(0) += 1;
    }

    pub fn mark_message_delivered(&mut self, message_id: &str) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

        if let Some(metrics) = self.message_metrics.get_mut(message_id) {
            metrics.receive_time = Some(now);
            metrics.delivery_time = Some(now);
        }
    }

    pub fn mark_message_failed(&mut self, message_id: &str, error: &str) {
        if let Some(metrics) = self.message_metrics.get_mut(message_id) {
            metrics.success = false;
            metrics.error = Some(error.to_string());
        }
    }

    // Performance analysis
    pub fn get_performance_summary(&self) -> PerformanceSummary {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let uptime = now - self.start_time;

        let total_messages = self.performance_counters.values().sum();
        let total_alerts = self.alerts.len();
        let active_alerts = self.alerts.iter().filter(|a| !a.resolved).count();

        // Calculate average metrics over the retention period
        let avg_metrics = if !self.metrics_history.is_empty() {
            let count = self.metrics_history.len();
            let total_latency: f32 = self.metrics_history.iter().map(|m| m.latency_ms).sum();
            let total_packet_loss: f32 = self.metrics_history.iter().map(|m| m.packet_loss_rate).sum();
            let total_bandwidth: f32 = self.metrics_history.iter().map(|m| m.bandwidth_utilization).sum();

            Some(AverageMetrics {
                latency_ms: total_latency / count as f32,
                packet_loss_rate: total_packet_loss / count as f32,
                bandwidth_utilization: total_bandwidth / count as f32,
            })
        } else {
            None
        };

        PerformanceSummary {
            uptime,
            total_messages,
            total_alerts,
            active_alerts,
            captured_messages: self.captured_messages.len(),
            tracked_connections: self.connection_metrics.len(),
            average_metrics,
        }
    }

    // Debugging utilities
    pub fn export_metrics(&self, format: ExportFormat) -> Result<String, String> {
        match format {
            ExportFormat::JSON => {
                serde_json::to_string_pretty(&self.metrics_history)
                    .map_err(|e| format!("JSON export failed: {}", e))
            }
            ExportFormat::CSV => {
                self.export_csv()
            }
            ExportFormat::Binary => {
                Err("Binary export not implemented".to_string())
            }
        }
    }

    fn export_csv(&self) -> Result<String, String> {
        let mut csv = String::new();
        csv.push_str("timestamp,messages_per_second,bytes_per_second,latency_ms,packet_loss_rate,connection_count,active_peers,cpu_usage,memory_usage,bandwidth_utilization\n");

        for metrics in &self.metrics_history {
            csv.push_str(&format!(
                "{},{},{},{},{},{},{},{},{},{}\n",
                metrics.timestamp,
                metrics.messages_per_second,
                metrics.bytes_per_second,
                metrics.latency_ms,
                metrics.packet_loss_rate,
                metrics.connection_count,
                metrics.active_peers,
                metrics.cpu_usage,
                metrics.memory_usage,
                metrics.bandwidth_utilization
            ));
        }

        Ok(csv)
    }

    // Utility methods
    fn estimate_message_size(&self, message: &NetworkMessage) -> usize {
        // Rough estimation
        let base_size = 100; // Base metadata
        let data_size = message.data.to_string().len();
        base_size + data_size
    }

    fn simulate_cpu_usage(&self) -> f32 {
        // Simulate CPU usage based on current activity
        let base_usage = 10.0; // Base CPU usage
        let message_factor = self.metrics_history.len() as f32 * 0.1;
        let connection_factor = self.connection_metrics.len() as f32 * 0.5;
        
        (base_usage + message_factor + connection_factor).min(100.0)
    }

    fn simulate_memory_usage(&self) -> u64 {
        // Simulate memory usage
        let base_memory = 50 * 1024 * 1024; // 50MB base
        let metrics_memory = self.metrics_history.len() * 1024; // 1KB per metric
        let message_memory = self.message_metrics.len() * 512; // 512B per message
        let capture_memory = self.captured_messages.len() * 2048; // 2KB per captured message

        base_memory + metrics_memory as u64 + message_memory as u64 + capture_memory as u64
    }

    fn cleanup_old_data(&mut self, now: u64) {
        // Clean up old message metrics
        self.message_metrics.retain(|_, metrics| {
            now - metrics.send_time < self.config.metrics_retention_period
        });

        // Clean up old alerts
        self.alerts.retain(|alert| {
            now - alert.timestamp < self.config.metrics_retention_period * 24 // Keep alerts for 24 hours
        });
    }

    // Public API methods
    pub fn get_current_metrics(&self) -> Option<&NetworkMetrics> {
        self.metrics_history.back()
    }

    pub fn get_metrics_history(&self) -> &VecDeque<NetworkMetrics> {
        &self.metrics_history
    }

    pub fn get_connection_metrics(&self) -> &HashMap<String, ConnectionMetrics> {
        &self.connection_metrics
    }

    pub fn get_alerts(&self) -> &Vec<PerformanceAlert> {
        &self.alerts
    }

    pub fn get_active_alerts(&self) -> Vec<&PerformanceAlert> {
        self.alerts.iter().filter(|a| !a.resolved).collect()
    }

    pub fn resolve_alert(&mut self, alert_id: &str) {
        if let Some(alert) = self.alerts.iter_mut().find(|a| a.alert_id == alert_id) {
            alert.resolved = true;
            alert.resolved_at = Some(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
            console_log!("✅ Alert resolved: {}", alert_id);
        }
    }

    pub fn get_captured_messages(&self) -> &VecDeque<NetworkMessage> {
        &self.captured_messages
    }

    pub fn get_performance_counters(&self) -> &HashMap<String, u64> {
        &self.performance_counters
    }

    pub fn reset_counters(&mut self) {
        self.performance_counters.clear();
        console_log!("🧹 Performance counters reset");
    }

    pub fn update_config(&mut self, new_config: MonitoringConfig) {
        self.config = new_config;
        console_log!("📊 Monitoring config updated");
    }
}

// Supporting types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub uptime: u64,
    pub total_messages: u64,
    pub total_alerts: usize,
    pub active_alerts: usize,
    pub captured_messages: usize,
    pub tracked_connections: usize,
    pub average_metrics: Option<AverageMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AverageMetrics {
    pub latency_ms: f32,
    pub packet_loss_rate: f32,
    pub bandwidth_utilization: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    JSON,
    CSV,
    Binary,
}

// WASM exports
#[wasm_bindgen]
pub struct NetworkMonitorWrapper {
    inner: std::sync::Mutex<NetworkMonitor>,
}

#[wasm_bindgen]
impl NetworkMonitorWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> NetworkMonitorWrapper {
        let config = MonitoringConfig::default();
        NetworkMonitorWrapper {
            inner: std::sync::Mutex::new(NetworkMonitor::new(config)),
        }
    }

    #[wasm_bindgen]
    pub fn update_metrics(&self, network_stats_json: &str, peers_json: &str) -> Result<(), JsValue> {
        let network_stats: NetworkStats = serde_json::from_str(network_stats_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid network stats: {}", e)))?;

        let peers: Vec<NetworkPeer> = serde_json::from_str(peers_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid peers: {}", e)))?;

        let peer_refs: Vec<&NetworkPeer> = peers.iter().collect();

        let mut monitor = self.inner.lock().unwrap();
        monitor.update_metrics(&network_stats, &peer_refs);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn track_message(&self, message_json: &str, direction: &str) {
        let message: NetworkMessage = serde_json::from_str(message_json).unwrap();
        let mut monitor = self.inner.lock().unwrap();
        monitor.track_message(&message, direction);
    }

    #[wasm_bindgen]
    pub fn get_current_metrics(&self) -> JsValue {
        let monitor = self.inner.lock().unwrap();
        match monitor.get_current_metrics() {
            Some(metrics) => serde_wasm_bindgen::to_value(metrics).unwrap(),
            None => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn get_alerts(&self) -> JsValue {
        let monitor = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&monitor.get_alerts()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_active_alerts(&self) -> JsValue {
        let monitor = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&monitor.get_active_alerts()).unwrap()
    }

    #[wasm_bindgen]
    pub fn resolve_alert(&self, alert_id: &str) {
        let mut monitor = self.inner.lock().unwrap();
        monitor.resolve_alert(alert_id);
    }

    #[wasm_bindgen]
    pub fn get_performance_summary(&self) -> JsValue {
        let monitor = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&monitor.get_performance_summary()).unwrap()
    }

    #[wasm_bindgen]
    pub fn export_metrics(&self, format: &str) -> Result<String, JsValue> {
        let format = match format {
            "json" => ExportFormat::JSON,
            "csv" => ExportFormat::CSV,
            "binary" => ExportFormat::Binary,
            _ => return Err(JsValue::from_str("Invalid export format")),
        };

        let monitor = self.inner.lock().unwrap();
        match monitor.export_metrics(format) {
            Ok(data) => Ok(data),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }
}

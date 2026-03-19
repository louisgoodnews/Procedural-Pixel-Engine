use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::networking::{NetworkMessage, MessagePriority};

// Optimization types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationConfig {
    pub enable_message_batching: bool,
    pub enable_compression: bool,
    pub enable_priority_queue: bool,
    pub enable_adaptive_compression: bool,
    pub enable_message_deduplication: bool,
    pub enable_smart_retry: bool,
    pub enable_bandwidth_throttling: bool,
    pub max_batch_size: usize,
    pub batch_timeout_ms: u32,
    pub compression_threshold: usize,
    pub priority_queue_size: usize,
    pub bandwidth_limit_bps: u32,
    pub adaptive_compression_threshold: f32,
}

impl Default for OptimizationConfig {
    fn default() -> Self {
        Self {
            enable_message_batching: true,
            enable_compression: true,
            enable_priority_queue: true,
            enable_adaptive_compression: true,
            enable_message_deduplication: false,
            enable_smart_retry: true,
            enable_bandwidth_throttling: true,
            max_batch_size: 50,
            batch_timeout_ms: 10,
            compression_threshold: 256,
            priority_queue_size: 1000,
            bandwidth_limit_bps: 1000000, // 1 Mbps
            adaptive_compression_threshold: 0.7,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageBatch {
    pub batch_id: String,
    pub messages: Vec<NetworkMessage>,
    pub created_at: u64,
    pub total_size: usize,
    pub compressed: bool,
    pub compression_ratio: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriorityMessage {
    pub message: NetworkMessage,
    pub priority_score: f32,
    pub retry_count: u32,
    pub next_retry_time: u64,
    pub estimated_bandwidth: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthUsage {
    pub current_bps: u32,
    pub average_bps: u32,
    pub peak_bps: u32,
    pub utilization_ratio: f32,
    pub last_update: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionStats {
    pub total_compressed: u64,
    pub total_decompressed: u64,
    pub compression_ratio: f32,
    pub compression_time_ms: u64,
    pub decompression_time_ms: u64,
    pub adaptive_compressions: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationStats {
    pub messages_batched: u64,
    pub batches_created: u64,
    pub messages_compressed: u64,
    pub bandwidth_saved: u64,
    pub priority_queue_hits: u64,
    pub smart_retries: u64,
    pub deduplication_hits: u64,
    pub adaptive_adjustments: u64,
}

// Network optimizer
pub struct NetworkOptimizer {
    config: OptimizationConfig,
    message_queue: VecDeque<NetworkMessage>,
    priority_queue: Vec<PriorityMessage>,
    batch_buffer: Vec<NetworkMessage>,
    bandwidth_tracker: BandwidthTracker,
    compression_engine: CompressionEngine,
    deduplication_cache: HashMap<String, String>, // message hash -> message_id
    retry_manager: RetryManager,
    stats: OptimizationStats,
    last_batch_time: u64,
    adaptive_compression_ratio: f32,
}

#[derive(Debug)]
struct BandwidthTracker {
    usage_history: VecDeque<u32>,
    current_usage: u32,
    last_reset: u64,
    window_size: usize,
}

#[derive(Debug)]
struct CompressionEngine {
    compression_stats: CompressionStats,
    compression_cache: HashMap<String, Vec<u8>>,
    adaptive_threshold: f32,
}

#[derive(Debug)]
struct RetryManager {
    pending_retries: HashMap<String, PriorityMessage>,
    retry_history: HashMap<String, Vec<u64>>,
    max_retries: u32,
    backoff_multiplier: f32,
}

impl NetworkOptimizer {
    pub fn new(config: OptimizationConfig) -> Self {
        console_log!("⚡ Initializing network optimizer");

        Self {
            config,
            message_queue: VecDeque::new(),
            priority_queue: Vec::new(),
            batch_buffer: Vec::new(),
            bandwidth_tracker: BandwidthTracker::new(),
            compression_engine: CompressionEngine::new(),
            deduplication_cache: HashMap::new(),
            retry_manager: RetryManager::new(),
            stats: OptimizationStats {
                messages_batched: 0,
                batches_created: 0,
                messages_compressed: 0,
                bandwidth_saved: 0,
                priority_queue_hits: 0,
                smart_retries: 0,
                deduplication_hits: 0,
                adaptive_adjustments: 0,
            },
            last_batch_time: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64,
            adaptive_compression_ratio: 0.7,
        }
    }

    // Message processing
    pub fn process_message(&mut self, message: NetworkMessage) -> Vec<NetworkMessage> {
        let mut processed_messages = Vec::new();

        // Check for message deduplication
        if self.config.enable_message_deduplication {
            if let Some(existing_id) = self.check_message_deduplication(&message) {
                console_log!("🔄 Duplicate message detected: {} -> {}", existing_id, message.id);
                self.stats.deduplication_hits += 1;
                return processed_messages;
            }
        }

        // Add to priority queue if enabled
        if self.config.enable_priority_queue {
            self.add_to_priority_queue(message);
        } else {
            self.message_queue.push_back(message);
        }

        // Process messages based on optimization settings
        if self.config.enable_message_batching {
            processed_messages.extend(self.process_batching());
        }

        if self.config.enable_bandwidth_throttling {
            self.apply_bandwidth_throttling(&mut processed_messages);
        }

        processed_messages
    }

    // Priority queue management
    fn add_to_priority_queue(&mut self, message: NetworkMessage) {
        let priority_score = self.calculate_priority_score(&message);
        let estimated_bandwidth = self.estimate_message_bandwidth(&message);

        let priority_message = PriorityMessage {
            message,
            priority_score,
            retry_count: 0,
            next_retry_time: 0,
            estimated_bandwidth,
        };

        // Insert into priority queue (sorted by priority score)
        let insert_pos = self.priority_queue.binary_search_by(|pm| {
            priority_score.partial_cmp(&pm.priority_score).unwrap_or(std::cmp::Ordering::Equal)
        }).unwrap_or_else(|pos| pos);

        self.priority_queue.insert(insert_pos, priority_message);

        // Limit queue size
        if self.priority_queue.len() > self.config.priority_queue_size {
            self.priority_queue.pop(); // Remove lowest priority
        }

        self.stats.priority_queue_hits += 1;
    }

    fn calculate_priority_score(&self, message: &NetworkMessage) -> f32 {
        let mut score = 0.0;

        // Base priority
        match message.priority {
            MessagePriority::Critical => score += 100.0,
            MessagePriority::High => score += 75.0,
            MessagePriority::Normal => score += 50.0,
            MessagePriority::Low => score += 25.0,
        }

        // Reliability bonus
        if message.reliable {
            score += 20.0;
        }

        // Age penalty (older messages get lower priority)
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        let age_ms = now - message.timestamp * 1000;
        score -= (age_ms as f32 / 1000.0).min(50.0);

        // Size penalty (larger messages get lower priority)
        let size_penalty = (self.estimate_message_bandwidth(message) as f32 / 1024.0).min(20.0);
        score -= size_penalty;

        score
    }

    // Message batching
    fn process_batching(&mut self) -> Vec<NetworkMessage> {
        let mut processed_messages = Vec::new();
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;

        // Collect messages for batching
        if self.config.enable_priority_queue {
            while let Some(priority_message) = self.priority_queue.pop() {
                self.batch_buffer.push(priority_message.message);
                
                if self.batch_buffer.len() >= self.config.max_batch_size {
                    break;
                }
            }
        } else {
            while let Some(message) = self.message_queue.pop_front() {
                self.batch_buffer.push(message);
                
                if self.batch_buffer.len() >= self.config.max_batch_size {
                    break;
                }
            }
        }

        // Check if we should create a batch
        let should_batch = self.batch_buffer.len() >= self.config.max_batch_size ||
                          (now - self.last_batch_time) >= self.config.batch_timeout_ms as u64;

        if should_batch && !self.batch_buffer.is_empty() {
            if let Some(batch) = self.create_batch() {
                processed_messages.push(batch);
            }
        }

        processed_messages
    }

    fn create_batch(&mut self) -> Option<NetworkMessage> {
        if self.batch_buffer.is_empty() {
            return None;
        }

        let batch_id = format!("batch_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis());
        let total_size = self.batch_buffer.iter().map(|m| self.estimate_message_bandwidth(m)).sum();

        // Create batch data
        let batch_data = serde_json::json!({
            "batch_id": batch_id,
            "messages": self.batch_buffer.iter().map(|m| {
                serde_json::json!({
                    "id": m.id,
                    "type": format!("{:?}", m.message_type),
                    "sender_id": m.sender_id,
                    "recipient_id": m.recipient_id,
                    "timestamp": m.timestamp,
                    "data": m.data,
                    "priority": format!("{:?}", m.priority),
                    "reliable": m.reliable,
                    "sequence_number": m.sequence_number
                })
            }).collect::<Vec<_>>(),
            "created_at": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            "message_count": self.batch_buffer.len()
        });

        let batch_message = NetworkMessage {
            id: batch_id,
            message_type: crate::networking::NetworkMessageType::Custom("BATCH".to_string()),
            sender_id: "optimizer".to_string(),
            recipient_id: None, // Broadcast
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            data: batch_data,
            priority: MessagePriority::Normal,
            reliable: true,
            sequence_number: None,
        };

        // Update stats
        self.stats.messages_batched += self.batch_buffer.len() as u64;
        self.stats.batches_created += 1;
        self.last_batch_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;

        console_log!("📦 Created batch with {} messages, total size: {} bytes", 
                   self.batch_buffer.len(), total_size);

        // Clear batch buffer
        self.batch_buffer.clear();

        Some(batch_message)
    }

    // Compression
    pub fn compress_message(&mut self, message: &mut NetworkMessage) -> Result<(), String> {
        if !self.config.enable_compression {
            return Ok(());
        }

        let message_size = self.estimate_message_bandwidth(message);
        if message_size < self.config.compression_threshold {
            return Ok(());
        }

        // Check adaptive compression
        if self.config.enable_adaptive_compression {
            let compression_ratio = self.compression_engine.get_current_compression_ratio();
            if compression_ratio < self.adaptive_compression_ratio {
                console_log!("⚡ Adaptive compression: skipping (ratio: {:.2})", compression_ratio);
                return Ok(());
            }
        }

        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        // Simulate compression (in production, use real compression library)
        let compressed_data = self.simulate_compression(&message.data.to_string())?;
        
        let compression_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() - start_time;
        let original_size = message.data.to_string().len();
        let compressed_size = compressed_data.len();
        let compression_ratio = compressed_size as f32 / original_size as f32;

        // Update message with compressed data
        message.data = serde_json::json!({
            "compressed": true,
            "original_size": original_size,
            "compressed_data": compressed_data
        });

        // Update stats
        self.stats.messages_compressed += 1;
        self.compression_engine.compression_stats.total_compressed += 1;
        self.compression_engine.compression_stats.compression_ratio = compression_ratio;
        self.compression_engine.compression_stats.compression_time_ms += compression_time;

        console_log!("🗜️ Compressed message: {} -> {} bytes ({:.2}% reduction)", 
                   original_size, compressed_size, (1.0 - compression_ratio) * 100.0);

        Ok(())
    }

    fn simulate_compression(&mut self, data: &str) -> Result<Vec<u8>, String> {
        // Simple compression simulation
        let mut compressed = Vec::new();
        let mut i = 0;

        while i < data.len() {
            let byte = data.as_bytes()[i];
            compressed.push(byte);
            
            // Count repeated bytes
            let mut count = 1;
            while i + count < data.len() && data.as_bytes()[i + count] == byte && count < 255 {
                count += 1;
            }
            
            if count > 3 {
                compressed.push(count as u8);
                i += count;
            } else {
                i += 1;
            }
        }

        Ok(compressed)
    }

    // Bandwidth throttling
    fn apply_bandwidth_throttling(&mut self, messages: &mut Vec<NetworkMessage>) {
        if !self.config.enable_bandwidth_throttling {
            return;
        }

        let total_bandwidth = messages.iter().map(|m| self.estimate_message_bandwidth(m)).sum::<u32>();
        let current_usage = self.bandwidth_tracker.get_current_usage();
        let available_bandwidth = self.config.bandwidth_limit_bps.saturating_sub(current_usage);

        if total_bandwidth > available_bandwidth {
            // Sort messages by priority
            messages.sort_by(|a, b| {
                self.calculate_priority_score(b).partial_cmp(&self.calculate_priority_score(a))
                    .unwrap_or(std::cmp::Ordering::Equal)
            });

            // Remove low priority messages until within bandwidth limit
            let mut used_bandwidth = 0;
            messages.retain(|message| {
                let message_bandwidth = self.estimate_message_bandwidth(message);
                if used_bandwidth + message_bandwidth <= available_bandwidth {
                    used_bandwidth += message_bandwidth;
                    true
                } else {
                    console_log!("🚫 Throttled message due to bandwidth limit");
                    false
                }
            });
        }

        // Update bandwidth tracker
        self.bandwidth_tracker.add_usage(total_bandwidth);
    }

    // Retry management
    pub fn handle_failed_message(&mut self, message: &NetworkMessage, error: &str) -> Option<NetworkMessage> {
        if !self.config.enable_smart_retry || !message.reliable {
            return None;
        }

        let retry_message = self.retry_manager.schedule_retry(message, error)?;
        self.stats.smart_retries += 1;

        Some(retry_message)
    }

    // Deduplication
    fn check_message_deduplication(&mut self, message: &NetworkMessage) -> Option<String> {
        let message_hash = self.calculate_message_hash(message);
        
        if let Some(existing_id) = self.deduplication_cache.get(&message_hash) {
            return Some(existing_id.clone());
        }

        // Add to cache
        self.deduplication_cache.insert(message_hash, message.id.clone());
        
        // Limit cache size
        if self.deduplication_cache.len() > 10000 {
            // Remove oldest entries (simplified)
            let keys_to_remove: Vec<_> = self.deduplication_cache.keys().take(1000).cloned().collect();
            for key in keys_to_remove {
                self.deduplication_cache.remove(&key);
            }
        }

        None
    }

    fn calculate_message_hash(&self, message: &NetworkMessage) -> String {
        // Simple hash calculation
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        message.message_type.hash(&mut hasher);
        message.sender_id.hash(&mut hasher);
        message.recipient_id.hash(&mut hasher);
        message.data.to_string().hash(&mut hasher);
        
        format!("{:x}", hasher.finish())
    }

    // Utility methods
    fn estimate_message_bandwidth(&self, message: &NetworkMessage) -> u32 {
        // Rough estimation of message size in bytes
        let base_size = 100; // Base metadata
        let data_size = message.data.to_string().len();
        (base_size + data_size) as u32
    }

    // Adaptive optimization
    pub fn adaptive_optimization(&mut self) {
        let current_compression_ratio = self.compression_engine.get_current_compression_ratio();
        let bandwidth_utilization = self.bandwidth_tracker.get_utilization_ratio();

        // Adjust compression threshold based on effectiveness
        if current_compression_ratio < self.config.adaptive_compression_threshold {
            self.adaptive_compression_ratio *= 1.1; // Make compression less aggressive
            console_log!("⚡ Adaptive optimization: reducing compression aggressiveness");
        } else if current_compression_ratio > 0.8 {
            self.adaptive_compression_ratio *= 0.9; // Make compression more aggressive
            console_log!("⚡ Adaptive optimization: increasing compression aggressiveness");
        }

        // Adjust bandwidth throttling based on utilization
        if bandwidth_utilization > 0.9 {
            console_log!("⚡ Adaptive optimization: high bandwidth usage detected");
        }

        self.stats.adaptive_adjustments += 1;
    }

    // Public API methods
    pub fn get_stats(&self) -> &OptimizationStats {
        &self.stats
    }

    pub fn get_bandwidth_usage(&self) -> BandwidthUsage {
        self.bandwidth_tracker.get_current_usage_stats()
    }

    pub fn get_compression_stats(&self) -> &CompressionStats {
        &self.compression_engine.compression_stats
    }

    pub fn update_config(&mut self, new_config: OptimizationConfig) {
        self.config = new_config;
        console_log!("⚡ Optimization config updated");
    }

    pub fn reset_stats(&mut self) {
        self.stats = OptimizationStats {
            messages_batched: 0,
            batches_created: 0,
            messages_compressed: 0,
            bandwidth_saved: 0,
            priority_queue_hits: 0,
            smart_retries: 0,
            deduplication_hits: 0,
            adaptive_adjustments: 0,
        };
        console_log!("🧹 Optimization stats reset");
    }
}

impl BandwidthTracker {
    fn new() -> Self {
        Self {
            usage_history: VecDeque::new(),
            current_usage: 0,
            last_reset: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            window_size: 60, // 1 minute window
        }
    }

    fn add_usage(&mut self, usage: u32) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        // Reset if window expired
        if now - self.last_reset >= self.window_size as u64 {
            self.current_usage = 0;
            self.usage_history.clear();
            self.last_reset = now;
        }

        self.current_usage += usage;
        self.usage_history.push_back(usage);

        // Limit history size
        while self.usage_history.len() > self.window_size {
            self.usage_history.pop_front();
        }
    }

    fn get_current_usage(&self) -> u32 {
        self.current_usage
    }

    fn get_utilization_ratio(&self) -> f32 {
        if self.usage_history.is_empty() {
            0.0
        } else {
            let average = self.usage_history.iter().sum::<u32>() / self.usage_history.len() as u32;
            average as f32 / 1000000.0 // Normalize to 1 Mbps baseline
        }
    }

    fn get_current_usage_stats(&self) -> BandwidthUsage {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let average_bps = if self.usage_history.is_empty() {
            0
        } else {
            self.usage_history.iter().sum::<u32>() / self.usage_history.len() as u32
        };
        let peak_bps = self.usage_history.iter().max().unwrap_or(&0);

        BandwidthUsage {
            current_bps: self.current_usage,
            average_bps,
            peak_bps: *peak_bps,
            utilization_ratio: self.get_utilization_ratio(),
            last_update: now,
        }
    }
}

impl CompressionEngine {
    fn new() -> Self {
        Self {
            compression_stats: CompressionStats {
                total_compressed: 0,
                total_decompressed: 0,
                compression_ratio: 0.7,
                compression_time_ms: 0,
                decompression_time_ms: 0,
                adaptive_compressions: 0,
            },
            compression_cache: HashMap::new(),
            adaptive_threshold: 0.7,
        }
    }

    fn get_current_compression_ratio(&self) -> f32 {
        self.compression_stats.compression_ratio
    }
}

impl RetryManager {
    fn new() -> Self {
        Self {
            pending_retries: HashMap::new(),
            retry_history: HashMap::new(),
            max_retries: 3,
            backoff_multiplier: 2.0,
        }
    }

    fn schedule_retry(&mut self, message: &NetworkMessage, _error: &str) -> Option<NetworkMessage> {
        let retry_count = self.retry_history.get(&message.id).map(|v| v.len()).unwrap_or(0);

        if retry_count >= self.max_retries {
            console_log!("❌ Max retries exceeded for message: {}", message.id);
            return None;
        }

        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let backoff_delay = (self.backoff_multiplier.powi(retry_count as i32) * 1000.0) as u64;
        let next_retry_time = now + backoff_delay;

        let mut retry_message = message.clone();
        retry_message.timestamp = now;

        // Record retry
        self.pending_retries.insert(message.id.clone(), PriorityMessage {
            message: retry_message.clone(),
            priority_score: 0.0,
            retry_count: retry_count as u32,
            next_retry_time,
            estimated_bandwidth: 0,
        });

        self.retry_history.entry(message.id.clone()).or_insert_with(Vec::new).push(now);

        console_log!("🔄 Scheduled retry for message: {} (attempt {})", message.id, retry_count + 1);

        Some(retry_message)
    }
}

// WASM exports
#[wasm_bindgen]
pub struct NetworkOptimizerWrapper {
    inner: std::sync::Mutex<NetworkOptimizer>,
}

#[wasm_bindgen]
impl NetworkOptimizerWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> NetworkOptimizerWrapper {
        let config = OptimizationConfig::default();
        NetworkOptimizerWrapper {
            inner: std::sync::Mutex::new(NetworkOptimizer::new(config)),
        }
    }

    #[wasm_bindgen]
    pub fn process_message(&self, message_json: &str) -> JsValue {
        let message: NetworkMessage = serde_json::from_str(message_json).unwrap();
        let mut optimizer = self.inner.lock().unwrap();
        let processed_messages = optimizer.process_message(message);
        serde_wasm_bindgen::to_value(&processed_messages).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let optimizer = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&optimizer.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_bandwidth_usage(&self) -> JsValue {
        let optimizer = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&optimizer.get_bandwidth_usage()).unwrap()
    }

    #[wasm_bindgen]
    pub fn adaptive_optimization(&self) {
        let mut optimizer = self.inner.lock().unwrap();
        optimizer.adaptive_optimization();
    }
}

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// Include submodules
pub mod serialization;
pub mod security;
pub mod monitoring;
pub mod optimization;
pub mod testing;

// Core networking types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessageType {
    // Connection management
    Connect,
    Disconnect,
    Heartbeat,
    Acknowledge,
    
    // Game state
    PlayerJoin,
    PlayerLeave,
    PlayerUpdate,
    WorldState,
    EntityUpdate,
    EntityDestroy,
    
    // Chat and communication
    ChatMessage,
    SystemMessage,
    
    // Custom messages
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMessage {
    pub id: String,
    pub message_type: NetworkMessageType,
    pub sender_id: String,
    pub recipient_id: Option<String>, // None for broadcast
    pub timestamp: u64,
    pub data: serde_json::Value,
    pub priority: MessagePriority,
    pub reliable: bool,
    pub sequence_number: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessagePriority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPeer {
    pub id: String,
    pub address: String,
    pub port: u16,
    pub connected: bool,
    pub last_heartbeat: u64,
    pub latency: u32,
    pub packet_loss: f32,
    pub bandwidth: u32,
    pub connection_type: ConnectionType,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionType {
    Client,
    Server,
    Peer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub max_connections: u32,
    pub heartbeat_interval: u32,
    pub connection_timeout: u32,
    pub resend_timeout: u32,
    pub max_retries: u32,
    pub buffer_size: u32,
    pub compression_enabled: bool,
    pub encryption_enabled: bool,
    pub debug_mode: bool,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            max_connections: 100,
            heartbeat_interval: 5000, // 5 seconds
            connection_timeout: 15000, // 15 seconds
            resend_timeout: 1000, // 1 second
            max_retries: 3,
            buffer_size: 1024 * 1024, // 1MB
            compression_enabled: true,
            encryption_enabled: true,
            debug_mode: false,
        }
    }
}

// Network statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub packets_dropped: u64,
    pub retransmissions: u64,
    pub average_latency: f32,
    pub uptime: u64,
    pub active_connections: u32,
}

// Network manager
pub struct NetworkManager {
    config: NetworkConfig,
    peers: HashMap<String, NetworkPeer>,
    message_queue: VecDeque<NetworkMessage>,
    message_handlers: HashMap<NetworkMessageType, Box<dyn MessageHandler>>,
    stats: NetworkStats,
    is_server: bool,
    server_address: Option<String>,
    client_id: String,
    sequence_counter: u32,
    last_heartbeat: u64,
    start_time: u64,
}

pub trait MessageHandler: Send + Sync {
    fn handle_message(&mut self, message: &NetworkMessage, manager: &mut NetworkManager) -> Result<(), String>;
}

impl NetworkManager {
    pub fn new(config: NetworkConfig, is_server: bool) -> Self {
        console_log!("🌐 Initializing network manager (server: {})", is_server);
        
        Self {
            config,
            peers: HashMap::new(),
            message_queue: VecDeque::new(),
            message_handlers: HashMap::new(),
            stats: NetworkStats {
                messages_sent: 0,
                messages_received: 0,
                bytes_sent: 0,
                bytes_received: 0,
                packets_dropped: 0,
                retransmissions: 0,
                average_latency: 0.0,
                uptime: 0,
                active_connections: 0,
            },
            is_server,
            server_address: None,
            client_id: format!("client_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()),
            sequence_counter: 0,
            last_heartbeat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            start_time: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        }
    }

    // Connection management
    pub fn start_server(&mut self, address: &str, port: u16) -> Result<(), String> {
        console_log!("🚀 Starting server on {}:{}", address, port);
        
        if !self.is_server {
            return Err("Cannot start server in client mode".to_string());
        }

        self.server_address = Some(format!("{}:{}", address, port));
        
        // Simulate server startup
        console_log!("✅ Server started successfully on {}:{}", address, port);
        
        Ok(())
    }

    pub fn connect_to_server(&mut self, address: &str, port: u16) -> Result<(), String> {
        console_log!("🔌 Connecting to server {}:{}", address, port);

        if self.is_server {
            return Err("Cannot connect to server in server mode".to_string());
        }

        // Simulate connection
        let server_peer = NetworkPeer {
            id: "server".to_string(),
            address: address.to_string(),
            port,
            connected: true,
            last_heartbeat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            latency: 50,
            packet_loss: 0.0,
            bandwidth: 1000000, // 1 Mbps
            connection_type: ConnectionType::Server,
            metadata: HashMap::new(),
        };

        self.peers.insert("server".to_string(), server_peer);

        // Send connect message
        let connect_message = NetworkMessage {
            id: self.generate_message_id(),
            message_type: NetworkMessageType::Connect,
            sender_id: self.client_id.clone(),
            recipient_id: Some("server".to_string()),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            data: serde_json::json!({
                "client_version": "1.0.0",
                "protocol_version": "1.0"
            }),
            priority: MessagePriority::High,
            reliable: true,
            sequence_number: Some(self.next_sequence()),
        };

        self.send_message(connect_message)?;

        console_log!("✅ Connected to server {}:{}", address, port);
        Ok(())
    }

    pub fn disconnect(&mut self, peer_id: &str) -> Result<(), String> {
        console_log!("🔌 Disconnecting from peer: {}", peer_id);

        let disconnect_message = NetworkMessage {
            id: self.generate_message_id(),
            message_type: NetworkMessageType::Disconnect,
            sender_id: self.client_id.clone(),
            recipient_id: Some(peer_id.to_string()),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            data: serde_json::json!({
                "reason": "manual_disconnect"
            }),
            priority: MessagePriority::Normal,
            reliable: true,
            sequence_number: Some(self.next_sequence()),
        };

        self.send_message(disconnect_message)?;

        // Remove peer
        self.peers.remove(peer_id);

        console_log!("✅ Disconnected from peer: {}", peer_id);
        Ok(())
    }

    // Message handling
    pub fn send_message(&mut self, message: NetworkMessage) -> Result<(), String> {
        console_log!("📤 Sending message: {:?}", message.message_type);

        // Check if recipient exists
        if let Some(recipient_id) = &message.recipient_id {
            if !self.peers.contains_key(recipient_id) && recipient_id != "server" {
                return Err(format!("Recipient not found: {}", recipient_id));
            }
        }

        // Add to queue
        self.message_queue.push_back(message);

        // Update stats
        self.stats.messages_sent += 1;

        Ok(())
    }

    pub fn broadcast_message(&mut self, message: NetworkMessage) -> Result<(), String> {
        console_log!("📡 Broadcasting message: {:?}", message.message_type);

        // Send to all connected peers
        for peer_id in self.peers.keys() {
            let mut broadcast_message = message.clone();
            broadcast_message.recipient_id = Some(peer_id.clone());
            self.send_message(broadcast_message)?;
        }

        Ok(())
    }

    pub fn process_messages(&mut self) -> Result<(), String> {
        // Process queued messages
        while let Some(message) = self.message_queue.pop_front() {
            self.process_single_message(message)?;
        }

        // Update stats
        self.update_stats();

        Ok(())
    }

    fn process_single_message(&mut self, message: NetworkMessage) -> Result<(), String> {
        console_log!("📨 Processing message: {:?}", message.message_type);

        // Update stats
        self.stats.messages_received += 1;

        // Handle system messages
        match message.message_type {
            NetworkMessageType::Heartbeat => {
                self.handle_heartbeat(&message)?;
            }
            NetworkMessageType::Acknowledge => {
                self.handle_acknowledge(&message)?;
            }
            NetworkMessageType::Connect => {
                self.handle_connect(&message)?;
            }
            NetworkMessageType::Disconnect => {
                self.handle_disconnect(&message)?;
            }
            _ => {
                // Forward to custom handlers
                if let Some(handler) = self.message_handlers.get_mut(&message.message_type) {
                    handler.handle_message(&message, self)?;
                }
            }
        }

        Ok(())
    }

    // System message handlers
    fn handle_heartbeat(&mut self, message: &NetworkMessage) -> Result<(), String> {
        let peer_id = message.sender_id.clone();
        
        if let Some(peer) = self.peers.get_mut(&peer_id) {
            peer.last_heartbeat = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            
            // Send acknowledgment
            let ack_message = NetworkMessage {
                id: self.generate_message_id(),
                message_type: NetworkMessageType::Acknowledge,
                sender_id: self.client_id.clone(),
                recipient_id: Some(peer_id),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                data: serde_json::json!({
                    "original_message_id": message.id,
                    "timestamp": message.timestamp
                }),
                priority: MessagePriority::Low,
                reliable: false,
                sequence_number: None,
            };

            self.send_message(ack_message)?;
        }

        Ok(())
    }

    fn handle_acknowledge(&mut self, message: &NetworkMessage) -> Result<(), String> {
        console_log!("✅ Received acknowledgment for message from: {}", message.sender_id);
        // In a real implementation, this would handle reliable message delivery
        Ok(())
    }

    fn handle_connect(&mut self, message: &NetworkMessage) -> Result<(), String> {
        console_log!("👋 New connection from: {}", message.sender_id);

        if !self.is_server {
            return Err("Only servers can handle connect messages".to_string());
        }

        // Create new peer
        let new_peer = NetworkPeer {
            id: message.sender_id.clone(),
            address: "unknown".to_string(), // Would be extracted from connection
            port: 0,
            connected: true,
            last_heartbeat: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            latency: 0,
            packet_loss: 0.0,
            bandwidth: 0,
            connection_type: ConnectionType::Client,
            metadata: HashMap::new(),
        };

        self.peers.insert(message.sender_id.clone(), new_peer);

        // Send welcome message
        let welcome_message = NetworkMessage {
            id: self.generate_message_id(),
            message_type: NetworkMessageType::SystemMessage,
            sender_id: self.client_id.clone(),
            recipient_id: Some(message.sender_id.clone()),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            data: serde_json::json!({
                "type": "welcome",
                "server_id": self.client_id,
                "message": "Welcome to the server!"
            }),
            priority: MessagePriority::Normal,
            reliable: true,
            sequence_number: Some(self.next_sequence()),
        };

        self.send_message(welcome_message)?;

        Ok(())
    }

    fn handle_disconnect(&mut self, message: &NetworkMessage) -> Result<(), String> {
        console_log!("👋 Peer disconnected: {}", message.sender_id);

        // Remove peer
        self.peers.remove(&message.sender_id);

        // Notify other peers
        if self.is_server {
            let notify_message = NetworkMessage {
                id: self.generate_message_id(),
                message_type: NetworkMessageType::PlayerLeave,
                sender_id: self.client_id.clone(),
                recipient_id: None, // Broadcast
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                data: serde_json::json!({
                    "player_id": message.sender_id
                }),
                priority: MessagePriority::Normal,
                reliable: true,
                sequence_number: Some(self.next_sequence()),
            };

            self.broadcast_message(notify_message)?;
        }

        Ok(())
    }

    // Utility methods
    fn generate_message_id(&self) -> String {
        format!("msg_{}_{}", 
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis(),
            self.sequence_counter
        )
    }

    fn next_sequence(&mut self) -> u32 {
        self.sequence_counter += 1;
        self.sequence_counter
    }

    fn update_stats(&mut self) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        self.stats.uptime = now - self.start_time;
        self.stats.active_connections = self.peers.len() as u32;

        // Calculate average latency
        if !self.peers.is_empty() {
            let total_latency: u32 = self.peers.values().map(|p| p.latency).sum();
            self.stats.average_latency = total_latency as f32 / self.peers.len() as f32;
        }
    }

    // Public API methods
    pub fn register_message_handler(&mut self, message_type: NetworkMessageType, handler: Box<dyn MessageHandler>) {
        self.message_handlers.insert(message_type, handler);
    }

    pub fn get_connected_peers(&self) -> Vec<&NetworkPeer> {
        self.peers.values().collect()
    }

    pub fn get_peer(&self, peer_id: &str) -> Option<&NetworkPeer> {
        self.peers.get(peer_id)
    }

    pub fn get_stats(&self) -> &NetworkStats {
        &self.stats
    }

    pub fn is_connected(&self) -> bool {
        !self.peers.is_empty()
    }

    pub fn get_connection_count(&self) -> u32 {
        self.peers.len() as u32
    }

    // Heartbeat system
    pub fn send_heartbeats(&mut self) -> Result<(), String> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        if now - self.last_heartbeat >= self.config.heartbeat_interval as u64 {
            let peer_ids: Vec<String> = self.peers.keys().cloned().collect();
            
            for peer_id in peer_ids {
                let heartbeat_message = NetworkMessage {
                    id: self.generate_message_id(),
                    message_type: NetworkMessageType::Heartbeat,
                    sender_id: self.client_id.clone(),
                    recipient_id: Some(peer_id.clone()),
                    timestamp: now,
                    data: serde_json::json!({
                        "timestamp": now
                    }),
                    priority: MessagePriority::Low,
                    reliable: false,
                    sequence_number: None,
                };

                self.send_message(heartbeat_message)?;
            }

            self.last_heartbeat = now;
        }

        Ok(())
    }

    // Connection timeout handling
    pub fn check_timeouts(&mut self) -> Vec<String> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let mut timed_out_peers = Vec::new();

        for (peer_id, peer) in &self.peers {
            if now - peer.last_heartbeat > self.config.connection_timeout as u64 {
                timed_out_peers.push(peer_id.clone());
            }
        }

        // Remove timed out peers
        for peer_id in &timed_out_peers {
            console_log!("⏰ Peer timed out: {}", peer_id);
            self.peers.remove(peer_id);
            self.stats.packets_dropped += 1;
        }

        timed_out_peers
    }
}

// WASM exports
#[wasm_bindgen]
pub struct NetworkManagerWrapper {
    inner: Arc<Mutex<NetworkManager>>,
}

#[wasm_bindgen]
impl NetworkManagerWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(is_server: bool) -> NetworkManagerWrapper {
        let config = NetworkConfig::default();
        NetworkManagerWrapper {
            inner: Arc::new(Mutex::new(NetworkManager::new(config, is_server))),
        }
    }

    #[wasm_bindgen]
    pub fn start_server(&self, address: &str, port: u16) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.start_server(address, port) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn connect_to_server(&self, address: &str, port: u16) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.connect_to_server(address, port) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn disconnect(&self, peer_id: &str) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.disconnect(peer_id) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn send_message(&self, message_json: &str) -> Result<(), JsValue> {
        let message: NetworkMessage = serde_json::from_str(message_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid message: {}", e)))?;

        let mut manager = self.inner.lock().unwrap();
        match manager.send_message(message) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn broadcast_message(&self, message_json: &str) -> Result<(), JsValue> {
        let message: NetworkMessage = serde_json::from_str(message_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid message: {}", e)))?;

        let mut manager = self.inner.lock().unwrap();
        match manager.broadcast_message(message) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn process_messages(&self) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.process_messages() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_connected_peers(&self) -> JsValue {
        let manager = self.inner.lock().unwrap();
        let peers = manager.get_connected_peers();
        serde_wasm_bindgen::to_value(&peers).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&manager.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn is_connected(&self) -> bool {
        let manager = self.inner.lock().unwrap();
        manager.is_connected()
    }

    #[wasm_bindgen]
    pub fn get_connection_count(&self) -> u32 {
        let manager = self.inner.lock().unwrap();
        manager.get_connection_count()
    }

    #[wasm_bindgen]
    pub fn send_heartbeats(&self) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.send_heartbeats() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn check_timeouts(&self) -> JsValue {
        let mut manager = self.inner.lock().unwrap();
        let timed_out = manager.check_timeouts();
        serde_wasm_bindgen::to_value(&timed_out).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_network_config(
    max_connections: u32,
    heartbeat_interval: u32,
    connection_timeout: u32,
    compression_enabled: bool,
    encryption_enabled: bool
) -> JsValue {
    let config = NetworkConfig {
        max_connections,
        heartbeat_interval,
        connection_timeout,
        compression_enabled,
        encryption_enabled,
        ..NetworkConfig::default()
    };

    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_network_message(
    message_type: &str,
    sender_id: &str,
    recipient_id: Option<String>,
    data_json: &str,
    reliable: bool
) -> JsValue {
    let message_type = match message_type {
        "Connect" => NetworkMessageType::Connect,
        "Disconnect" => NetworkMessageType::Disconnect,
        "Heartbeat" => NetworkMessageType::Heartbeat,
        "Acknowledge" => NetworkMessageType::Acknowledge,
        "PlayerJoin" => NetworkMessageType::PlayerJoin,
        "PlayerLeave" => NetworkMessageType::PlayerLeave,
        "PlayerUpdate" => NetworkMessageType::PlayerUpdate,
        "WorldState" => NetworkMessageType::WorldState,
        "EntityUpdate" => NetworkMessageType::EntityUpdate,
        "EntityDestroy" => NetworkMessageType::EntityDestroy,
        "ChatMessage" => NetworkMessageType::ChatMessage,
        "SystemMessage" => NetworkMessageType::SystemMessage,
        _ => NetworkMessageType::Custom(message_type.to_string()),
    };

    let data: serde_json::Value = serde_json::from_str(data_json).unwrap_or(serde_json::Value::Null);

    let message = NetworkMessage {
        id: format!("msg_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()),
        message_type,
        sender_id: sender_id.to_string(),
        recipient_id,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        data,
        priority: MessagePriority::Normal,
        reliable,
        sequence_number: None,
    };

    serde_wasm_bindgen::to_value(&message).unwrap()
}

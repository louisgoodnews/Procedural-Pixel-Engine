use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::networking::NetworkMessage;

// Serialization types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializedMessage {
    pub version: u32,
    pub message_id: String,
    pub message_type: String,
    pub sender_id: String,
    pub recipient_id: Option<String>,
    pub timestamp: u64,
    pub data: Vec<u8>,
    pub priority: u8, // 0=Low, 1=Normal, 2=High, 3=Critical
    pub reliable: bool,
    pub sequence_number: Option<u32>,
    pub checksum: u32,
    pub compressed: bool,
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializationConfig {
    pub compression_enabled: bool,
    pub encryption_enabled: bool,
    pub compression_level: u8, // 1-9
    pub encryption_key: Option<String>,
    pub max_message_size: usize,
    pub chunk_large_messages: bool,
    pub chunk_size: usize,
}

impl Default for SerializationConfig {
    fn default() -> Self {
        Self {
            compression_enabled: true,
            encryption_enabled: false,
            compression_level: 6,
            encryption_key: None,
            max_message_size: 1024 * 1024, // 1MB
            chunk_large_messages: true,
            chunk_size: 64 * 1024, // 64KB
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageChunk {
    pub chunk_id: String,
    pub message_id: String,
    pub chunk_index: u32,
    pub total_chunks: u32,
    pub data: Vec<u8>,
    pub checksum: u32,
}

// Message serializer
pub struct MessageSerializer {
    config: SerializationConfig,
    compression_cache: HashMap<String, Vec<u8>>,
    encryption_cache: HashMap<String, Vec<u8>>,
}

impl MessageSerializer {
    pub fn new(config: SerializationConfig) -> Self {
        Self {
            config,
            compression_cache: HashMap::new(),
            encryption_cache: HashMap::new(),
        }
    }

    // Serialize a network message
    pub fn serialize(&mut self, message: &NetworkMessage) -> Result<Vec<SerializedMessage>, String> {
        // Convert message data to bytes
        let data_bytes = self.serialize_data(&message.data)?;

        // Apply compression if enabled
        let compressed_data = if self.config.compression_enabled {
            self.compress_data(&data_bytes)?
        } else {
            data_bytes
        };

        // Apply encryption if enabled
        let encrypted_data = if self.config.encryption_enabled {
            self.encrypt_data(&compressed_data)?
        } else {
            compressed_data
        };

        // Check if message needs to be chunked
        if encrypted_data.len() > self.config.max_message_size && self.config.chunk_large_messages {
            return self.chunk_message(message, &encrypted_data);
        }

        // Calculate checksum
        let checksum = self.calculate_checksum(&encrypted_data);

        // Create serialized message
        let serialized = SerializedMessage {
            version: 1,
            message_id: message.id.clone(),
            message_type: self.serialize_message_type(&message.message_type),
            sender_id: message.sender_id.clone(),
            recipient_id: message.recipient_id.clone(),
            timestamp: message.timestamp,
            data: encrypted_data,
            priority: self.serialize_priority(&message.priority),
            reliable: message.reliable,
            sequence_number: message.sequence_number,
            checksum,
            compressed: self.config.compression_enabled,
            encrypted: self.config.encryption_enabled,
        };

        Ok(vec![serialized])
    }

    // Deserialize a network message
    pub fn deserialize(&mut self, serialized: &SerializedMessage) -> Result<NetworkMessage, String> {
        // Verify checksum
        let calculated_checksum = self.calculate_checksum(&serialized.data);
        if calculated_checksum != serialized.checksum {
            return Err("Checksum verification failed".to_string());
        }

        // Decrypt if needed
        let decrypted_data = if serialized.encrypted {
            self.decrypt_data(&serialized.data)?
        } else {
            serialized.data.clone()
        };

        // Decompress if needed
        let decompressed_data = if serialized.compressed {
            self.decompress_data(&decrypted_data)?
        } else {
            decrypted_data
        };

        // Deserialize message data
        let message_data = self.deserialize_data(&decompressed_data)?;

        // Create network message
        let message = NetworkMessage {
            id: serialized.message_id.clone(),
            message_type: self.deserialize_message_type(&serialized.message_type)?,
            sender_id: serialized.sender_id.clone(),
            recipient_id: serialized.recipient_id.clone(),
            timestamp: serialized.timestamp,
            data: message_data,
            priority: self.deserialize_priority(serialized.priority)?,
            reliable: serialized.reliable,
            sequence_number: serialized.sequence_number,
        };

        Ok(message)
    }

    // Chunk large messages
    fn chunk_message(&self, message: &NetworkMessage, data: &[u8]) -> Result<Vec<SerializedMessage>, String> {
        let total_chunks = (data.len() + self.config.chunk_size - 1) / self.config.chunk_size;
        let mut chunks = Vec::new();

        for (index, chunk_data) in data.chunks(self.config.chunk_size).enumerate() {
            let checksum = self.calculate_checksum(chunk_data);

            // Create chunk metadata
            let chunk_info = serde_json::json!({
                "chunk_id": format!("{}_{}", message.id, index),
                "message_id": message.id,
                "chunk_index": index,
                "total_chunks": total_chunks,
                "original_message_type": self.serialize_message_type(&message.message_type),
                "original_sender_id": message.sender_id,
                "original_recipient_id": message.recipient_id,
                "original_timestamp": message.timestamp,
                "original_priority": self.serialize_priority(&message.priority),
                "original_reliable": message.reliable,
                "original_sequence_number": message.sequence_number,
                "compressed": self.config.compression_enabled,
                "encrypted": self.config.encryption_enabled
            });

            let chunk_data_bytes = self.serialize_data(&chunk_info)?;
            let mut full_chunk_data = chunk_data_bytes;
            full_chunk_data.extend_from_slice(chunk_data);

            let chunk_checksum = self.calculate_checksum(&full_chunk_data);

            let serialized_chunk = SerializedMessage {
                version: 1,
                message_id: format!("{}_{}", message.id, index),
                message_type: "CHUNK".to_string(),
                sender_id: message.sender_id.clone(),
                recipient_id: message.recipient_id.clone(),
                timestamp: message.timestamp,
                data: full_chunk_data,
                priority: self.serialize_priority(&message.priority),
                reliable: message.reliable,
                sequence_number: message.sequence_number,
                checksum: chunk_checksum,
                compressed: false, // Chunks are not compressed individually
                encrypted: false, // Chunks are not encrypted individually
            };

            chunks.push(serialized_chunk);
        }

        Ok(chunks)
    }

    // Data serialization methods
    fn serialize_data(&self, data: &serde_json::Value) -> Result<Vec<u8>, String> {
        serde_json::to_vec(data)
            .map_err(|e| format!("Failed to serialize data: {}", e))
    }

    fn deserialize_data(&self, data: &[u8]) -> Result<serde_json::Value, String> {
        serde_json::from_slice(data)
            .map_err(|e| format!("Failed to deserialize data: {}", e))
    }

    // Compression methods
    fn compress_data(&mut self, data: &[u8]) -> Result<Vec<u8>, String> {
        // Simple compression simulation (in production, use real compression library)
        if data.len() < 100 {
            return Ok(data.to_vec()); // Don't compress small data
        }

        // Simulate compression by removing repeated bytes
        let mut compressed = Vec::new();
        let mut i = 0;
        while i < data.len() {
            let byte = data[i];
            compressed.push(byte);
            
            // Count repeated bytes
            let mut count = 1;
            while i + count < data.len() && data[i + count] == byte && count < 255 {
                count += 1;
            }
            
            if count > 3 {
                compressed.push(count as u8);
                i += count;
            } else {
                i += 1;
            }
        }

        // Cache compression result
        let cache_key = format!("compress_{}", self.calculate_checksum(data));
        self.compression_cache.insert(cache_key, compressed.clone());

        Ok(compressed)
    }

    fn decompress_data(&mut self, data: &[u8]) -> Result<Vec<u8>, String> {
        // Simple decompression simulation
        let mut decompressed = Vec::new();
        let mut i = 0;

        while i < data.len() {
            let byte = data[i];
            decompressed.push(byte);
            i += 1;

            // Check if next byte is a count
            if i < data.len() && data[i] > 0 && data[i] <= 255 {
                let count = data[i] as usize;
                if count > 3 && i + count - 1 < data.len() {
                    // Repeat the previous byte
                    for _ in 1..count {
                        decompressed.push(byte);
                    }
                    i += 1;
                }
            }
        }

        Ok(decompressed)
    }

    // Encryption methods (simplified)
    fn encrypt_data(&mut self, data: &[u8]) -> Result<Vec<u8>, String> {
        if self.config.encryption_key.is_none() {
            return Ok(data.to_vec());
        }

        // Simple XOR encryption (in production, use real encryption)
        let key = self.config.encryption_key.as_ref().unwrap();
        let key_bytes = key.as_bytes();
        let mut encrypted = Vec::new();

        for (i, &byte) in data.iter().enumerate() {
            let key_byte = key_bytes[i % key_bytes.len()];
            encrypted.push(byte ^ key_byte);
        }

        // Cache encryption result
        let cache_key = format!("encrypt_{}", self.calculate_checksum(data));
        self.encryption_cache.insert(cache_key, encrypted.clone());

        Ok(encrypted)
    }

    fn decrypt_data(&mut self, data: &[u8]) -> Result<Vec<u8>, String> {
        if self.config.encryption_key.is_none() {
            return Ok(data.to_vec());
        }

        // Simple XOR decryption
        let key = self.config.encryption_key.as_ref().unwrap();
        let key_bytes = key.as_bytes();
        let mut decrypted = Vec::new();

        for (i, &byte) in data.iter().enumerate() {
            let key_byte = key_bytes[i % key_bytes.len()];
            decrypted.push(byte ^ key_byte);
        }

        Ok(decrypted)
    }

    // Message type serialization
    fn serialize_message_type(&self, message_type: &crate::networking::NetworkMessageType) -> String {
        match message_type {
            crate::networking::NetworkMessageType::Connect => "Connect".to_string(),
            crate::networking::NetworkMessageType::Disconnect => "Disconnect".to_string(),
            crate::networking::NetworkMessageType::Heartbeat => "Heartbeat".to_string(),
            crate::networking::NetworkMessageType::Acknowledge => "Acknowledge".to_string(),
            crate::networking::NetworkMessageType::PlayerJoin => "PlayerJoin".to_string(),
            crate::networking::NetworkMessageType::PlayerLeave => "PlayerLeave".to_string(),
            crate::networking::NetworkMessageType::PlayerUpdate => "PlayerUpdate".to_string(),
            crate::networking::NetworkMessageType::WorldState => "WorldState".to_string(),
            crate::networking::NetworkMessageType::EntityUpdate => "EntityUpdate".to_string(),
            crate::networking::NetworkMessageType::EntityDestroy => "EntityDestroy".to_string(),
            crate::networking::NetworkMessageType::ChatMessage => "ChatMessage".to_string(),
            crate::networking::NetworkMessageType::SystemMessage => "SystemMessage".to_string(),
            crate::networking::NetworkMessageType::Custom(name) => name.clone(),
        }
    }

    fn deserialize_message_type(&self, message_type: &str) -> Result<crate::networking::NetworkMessageType, String> {
        match message_type {
            "Connect" => Ok(crate::networking::NetworkMessageType::Connect),
            "Disconnect" => Ok(crate::networking::NetworkMessageType::Disconnect),
            "Heartbeat" => Ok(crate::networking::NetworkMessageType::Heartbeat),
            "Acknowledge" => Ok(crate::networking::NetworkMessageType::Acknowledge),
            "PlayerJoin" => Ok(crate::networking::NetworkMessageType::PlayerJoin),
            "PlayerLeave" => Ok(crate::networking::NetworkMessageType::PlayerLeave),
            "PlayerUpdate" => Ok(crate::networking::NetworkMessageType::PlayerUpdate),
            "WorldState" => Ok(crate::networking::NetworkMessageType::WorldState),
            "EntityUpdate" => Ok(crate::networking::NetworkMessageType::EntityUpdate),
            "EntityDestroy" => Ok(crate::networking::NetworkMessageType::EntityDestroy),
            "ChatMessage" => Ok(crate::networking::NetworkMessageType::ChatMessage),
            "SystemMessage" => Ok(crate::networking::NetworkMessageType::SystemMessage),
            "CHUNK" => Ok(crate::networking::NetworkMessageType::Custom("CHUNK".to_string())),
            _ => Ok(crate::networking::NetworkMessageType::Custom(message_type.to_string())),
        }
    }

    // Priority serialization
    fn serialize_priority(&self, priority: &crate::networking::MessagePriority) -> u8 {
        match priority {
            crate::networking::MessagePriority::Low => 0,
            crate::networking::MessagePriority::Normal => 1,
            crate::networking::MessagePriority::High => 2,
            crate::networking::MessagePriority::Critical => 3,
        }
    }

    fn deserialize_priority(&self, priority: u8) -> Result<crate::networking::MessagePriority, String> {
        match priority {
            0 => Ok(crate::networking::MessagePriority::Low),
            1 => Ok(crate::networking::MessagePriority::Normal),
            2 => Ok(crate::networking::MessagePriority::High),
            3 => Ok(crate::networking::MessagePriority::Critical),
            _ => Err(format!("Invalid priority: {}", priority)),
        }
    }

    // Checksum calculation
    fn calculate_checksum(&self, data: &[u8]) -> u32 {
        // Simple checksum (in production, use CRC32 or similar)
        let mut checksum: u32 = 0;
        for &byte in data {
            checksum = checksum.wrapping_mul(31).wrapping_add(byte as u32);
        }
        checksum
    }

    // Utility methods
    pub fn get_compression_stats(&self) -> (usize, usize) {
        let total_original = self.compression_cache.len();
        let total_compressed = self.compression_cache.values().map(|v| v.len()).sum();
        (total_original, total_compressed)
    }

    pub fn get_encryption_stats(&self) -> usize {
        self.encryption_cache.len()
    }

    pub fn clear_caches(&mut self) {
        self.compression_cache.clear();
        self.encryption_cache.clear();
    }

    pub fn update_config(&mut self, new_config: SerializationConfig) {
        self.config = new_config;
        // Clear caches when config changes
        self.clear_caches();
    }
}

// Chunk assembler for reassembling chunked messages
pub struct ChunkAssembler {
    chunks: HashMap<String, HashMap<u32, MessageChunk>>,
    message_timeouts: HashMap<String, u64>,
    timeout_duration: u64,
}

impl ChunkAssembler {
    pub fn new(timeout_duration: u64) -> Self {
        Self {
            chunks: HashMap::new(),
            message_timeouts: HashMap::new(),
            timeout_duration,
        }
    }

    pub fn add_chunk(&mut self, chunk: &MessageChunk) -> Result<Option<NetworkMessage>, String> {
        let message_id = chunk.message_id.clone();

        // Add chunk to collection
        if !self.chunks.contains_key(&message_id) {
            self.chunks.insert(message_id.clone(), HashMap::new());
            self.message_timeouts.insert(message_id.clone(), 
                std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs());
        }

        let message_chunks = self.chunks.get_mut(&message_id).unwrap();
        message_chunks.insert(chunk.chunk_index, chunk.clone());

        // Check if all chunks are received
        if message_chunks.len() == chunk.total_chunks as usize {
            return self.assemble_message(&message_id);
        }

        Ok(None)
    }

    fn assemble_message(&mut self, message_id: &str) -> Result<Option<NetworkMessage>, String> {
        let chunks = self.chunks.get(message_id).unwrap();
        
        // Sort chunks by index
        let mut sorted_chunks: Vec<_> = chunks.values().collect();
        sorted_chunks.sort_by_key(|c| c.chunk_index);

        // Extract metadata from first chunk
        let first_chunk_data = &sorted_chunks[0].data;
        let metadata_end = first_chunk_data.iter().position(|&b| b == 0).unwrap_or(first_chunk_data.len());
        let metadata_bytes = &first_chunk_data[..metadata_end];
        
        let metadata: serde_json::Value = serde_json::from_slice(metadata_bytes)
            .map_err(|e| format!("Failed to parse chunk metadata: {}", e))?;

        // Reassemble message data
        let mut message_data = Vec::new();
        for chunk in &sorted_chunks {
            let data_start = if chunk.chunk_index == 0 { metadata_end + 1 } else { 0 };
            message_data.extend_from_slice(&chunk.data[data_start..]);
        }

        // Create network message
        let message = NetworkMessage {
            id: metadata["original_message_id"].as_str().unwrap().to_string(),
            message_type: crate::networking::NetworkMessageType::Custom(
                metadata["original_message_type"].as_str().unwrap().to_string()
            ),
            sender_id: metadata["original_sender_id"].as_str().unwrap().to_string(),
            recipient_id: metadata["original_recipient_id"].as_str().map(|s| s.to_string()),
            timestamp: metadata["original_timestamp"].as_u64().unwrap(),
            data: serde_json::from_slice(&message_data).unwrap_or(serde_json::Value::Null),
            priority: match metadata["original_priority"].as_u64().unwrap() {
                0 => crate::networking::MessagePriority::Low,
                1 => crate::networking::MessagePriority::Normal,
                2 => crate::networking::MessagePriority::High,
                3 => crate::networking::MessagePriority::Critical,
                _ => crate::networking::MessagePriority::Normal,
            },
            reliable: metadata["original_reliable"].as_bool().unwrap(),
            sequence_number: metadata["original_sequence_number"].as_u64().map(|n| n as u32),
        };

        // Clean up
        self.chunks.remove(message_id);
        self.message_timeouts.remove(message_id);

        Ok(Some(message))
    }

    pub fn check_timeouts(&mut self) -> Vec<String> {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        let mut timed_out = Vec::new();

        for (message_id, &timeout_time) in &self.message_timeouts {
            if now - timeout_time > self.timeout_duration {
                timed_out.push(message_id.clone());
            }
        }

        // Remove timed out messages
        for message_id in &timed_out {
            self.chunks.remove(message_id);
            self.message_timeouts.remove(message_id);
        }

        timed_out
    }

    pub fn get_pending_chunks(&self) -> usize {
        self.chunks.len()
    }

    pub fn clear(&mut self) {
        self.chunks.clear();
        self.message_timeouts.clear();
    }
}

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use web_sys::window;

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// Save system enums and types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SaveType {
    Auto,
    Manual,
    Quick,
    Cloud,
    Backup,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SaveCompressionType {
    None,
    Gzip,
    Brotli,
    LZ4,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SaveEncryptionType {
    None,
    AES256,
    ChaCha20,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SaveStatus {
    Success,
    Error(String),
    Corrupted,
    Incompatible,
    CloudError(String),
    EncryptionError(String),
    CompressionError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CloudProvider {
    None,
    LocalStorage,
    IndexedDB,
    Firebase,
    AWS,
    Custom,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveData {
    pub id: String,
    pub name: String,
    pub description: String,
    pub save_type: SaveType,
    pub version: String,
    pub timestamp: u64,
    pub playtime: u64, // in seconds
    pub level: u32,
    pub scene: String,
    pub player_position: [f32; 3],
    pub player_rotation: [f32; 4], // quaternion
    pub health: f32,
    pub max_health: f32,
    pub experience: u64,
    pub level_experience: u64,
    pub inventory: Vec<InventoryItem>,
    pub quests: Vec<QuestData>,
    pub world_state: HashMap<String, String>,
    pub game_flags: HashMap<String, bool>,
    pub variables: HashMap<String, f64>,
    pub screenshot: Option<String>, // base64 encoded
    pub metadata: SaveMetadata,
    pub checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItem {
    pub id: String,
    pub name: String,
    pub quantity: u32,
    pub quality: u32, // 0-100
    pub durability: f32, // 0.0-1.0
    pub custom_properties: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestData {
    pub id: String,
    pub name: String,
    pub status: String, // "active", "completed", "failed"
    pub progress: f32, // 0.0-1.0
    pub objectives: Vec<QuestObjective>,
    pub rewards: Vec<QuestReward>,
    pub started_timestamp: u64,
    pub completed_timestamp: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestObjective {
    pub id: String,
    pub description: String,
    pub completed: bool,
    pub progress: f32,
    pub required_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestReward {
    pub id: String,
    pub type_: String, // "experience", "item", "gold", etc.
    pub amount: u64,
    pub item_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveMetadata {
    pub game_version: String,
    pub engine_version: String,
    pub platform: String,
    pub compression_type: SaveCompressionType,
    pub encryption_type: SaveEncryptionType,
    pub cloud_provider: CloudProvider,
    pub file_size: u64,
    pub compressed_size: u64,
    pub encrypted: bool,
    pub tags: Vec<String>,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveSlot {
    pub id: String,
    pub name: String,
    pub description: String,
    pub save_data: Option<SaveData>,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_played: u64,
    pub playtime: u64,
    pub screenshot: Option<String>,
    pub is_valid: bool,
    pub is_corrupted: bool,
    pub is_compatible: bool,
    pub cloud_synced: bool,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveConfig {
    pub auto_save_enabled: bool,
    pub auto_save_interval: u32, // in seconds
    pub max_auto_saves: u32,
    pub max_manual_saves: u32,
    pub compression_type: SaveCompressionType,
    pub encryption_type: SaveEncryptionType,
    pub cloud_provider: CloudProvider,
    pub cloud_sync_enabled: bool,
    pub validate_saves: bool,
    pub backup_saves: bool,
    pub max_backup_saves: u32,
    pub screenshot_enabled: bool,
    pub screenshot_quality: u32, // 0-100
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveStats {
    pub total_saves: u64,
    pub auto_saves: u64,
    pub manual_saves: u64,
    pub cloud_saves: u64,
    pub failed_saves: u64,
    pub corrupted_saves: u64,
    pub total_size: u64,
    pub compressed_size: u64,
    pub average_save_time: f64,
    pub last_save_time: u64,
    pub save_slots_used: u32,
    pub save_slots_total: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub compatibility_score: f32, // 0.0-1.0
    pub missing_fields: Vec<String>,
    pub version_compatibility: String,
}

// Main save system engine
pub struct SaveSystem {
    config: SaveConfig,
    save_slots: HashMap<String, SaveSlot>,
    current_save_id: Option<String>,
    stats: SaveStats,
    last_auto_save: u64,
    save_queue: Vec<String>,
    cloud_sync_queue: Vec<String>,
}

impl SaveSystem {
    pub fn new(config: SaveConfig) -> Self {
        console_log!("💾 Initializing Save System");
        
        Self {
            config,
            save_slots: HashMap::new(),
            current_save_id: None,
            stats: SaveStats {
                total_saves: 0,
                auto_saves: 0,
                manual_saves: 0,
                cloud_saves: 0,
                failed_saves: 0,
                corrupted_saves: 0,
                total_size: 0,
                compressed_size: 0,
                average_save_time: 0.0,
                last_save_time: 0,
                save_slots_used: 0,
                save_slots_total: 10, // Default 10 slots
            },
            last_auto_save: 0,
            save_queue: Vec::new(),
            cloud_sync_queue: Vec::new(),
        }
    }

    // Configuration management
    pub fn update_config(&mut self, config: SaveConfig) {
        self.config = config;
        console_log!("⚙️ Save System configuration updated");
    }

    pub fn get_config(&self) -> SaveConfig {
        self.config.clone()
    }

    // Statistics
    pub fn get_stats(&self) -> SaveStats {
        self.stats.clone()
    }

    pub fn get_save_system_summary(&self) -> String {
        format!(
            "💾 Save System Summary:\n\
            Total Saves: {}\n\
            Auto Saves: {}\n\
            Manual Saves: {}\n\
            Cloud Saves: {}\n\
            Failed Saves: {}\n\
            Corrupted Saves: {}\n\
            Total Size: {} bytes\n\
            Compressed Size: {} bytes\n\
            Average Save Time: {:.2}ms\n\
            Save Slots Used: {}/{}\n\
            Last Save Time: {}",
            self.stats.total_saves,
            self.stats.auto_saves,
            self.stats.manual_saves,
            self.stats.cloud_saves,
            self.stats.failed_saves,
            self.stats.corrupted_saves,
            self.stats.total_size,
            self.stats.compressed_size,
            self.stats.average_save_time,
            self.stats.save_slots_used,
            self.stats.save_slots_total,
            self.stats.last_save_time
        )
    }

    // Save slot management
    pub fn create_save_slot(&mut self, id: String, name: String, description: String) -> Result<(), String> {
        if self.save_slots.contains_key(&id) {
            return Err("Save slot already exists".to_string());
        }

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let save_slot = SaveSlot {
            id: id.clone(),
            name,
            description,
            save_data: None,
            created_at: now,
            updated_at: now,
            last_played: now,
            playtime: 0,
            screenshot: None,
            is_valid: true,
            is_corrupted: false,
            is_compatible: true,
            cloud_synced: false,
            tags: Vec::new(),
        };

        self.save_slots.insert(id.clone(), save_slot);
        self.stats.save_slots_used = self.save_slots.len() as u32;
        
        console_log!("📁 Created save slot: {}", id);
        Ok(())
    }

    pub fn delete_save_slot(&mut self, id: &str) -> Result<(), String> {
        if let Some(_slot) = self.save_slots.remove(id) {
            self.stats.save_slots_used = self.save_slots.len() as u32;
            
            // Clear current save if it was the deleted slot
            if let Some(current_id) = &self.current_save_id {
                if current_id == id {
                    self.current_save_id = None;
                }
            }
            
            console_log!("🗑️ Deleted save slot: {}", id);
            Ok(())
        } else {
            Err("Save slot not found".to_string())
        }
    }

    pub fn get_save_slot(&self, id: &str) -> Option<SaveSlot> {
        self.save_slots.get(id).cloned()
    }

    pub fn get_all_save_slots(&self) -> Vec<SaveSlot> {
        self.save_slots.values().cloned().collect()
    }

    pub fn get_save_slots_by_type(&self, save_type: SaveType) -> Vec<SaveSlot> {
        self.save_slots
            .values()
            .filter(|slot| {
                if let Some(save_data) = &slot.save_data {
                    save_data.save_type == save_type
                } else {
                    false
                }
            })
            .cloned()
            .collect()
    }

    // Save operations
    pub fn save_game(&mut self, save_data: SaveData) -> Result<String, String> {
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        // Validate save data
        let validation = self.validate_save_data(&save_data);
        if !validation.is_valid {
            return Err(format!("Save data validation failed: {:?}", validation.errors));
        }

        // Compress save data if enabled
        let compressed_data = if self.config.compression_type != SaveCompressionType::None {
            self.compress_save_data(&save_data)?
        } else {
            serde_json::to_string(&save_data).unwrap()
        };

        // Encrypt save data if enabled
        let final_data = if self.config.encryption_type != SaveEncryptionType::None {
            self.encrypt_save_data(&compressed_data)?
        } else {
            compressed_data
        };

        // Calculate checksum
        let checksum = self.calculate_checksum(&final_data);

        // Update save data with metadata
        let mut updated_save_data = save_data.clone();
        updated_save_data.checksum = checksum.clone();
        updated_save_data.metadata.compression_type = self.config.compression_type.clone();
        updated_save_data.metadata.encryption_type = self.config.encryption_type.clone();
        updated_save_data.metadata.cloud_provider = self.config.cloud_provider.clone();
        updated_save_data.metadata.file_size = final_data.len() as u64;

        // Find or create save slot
        let save_slot_id = if let Some(current_id) = &self.current_save_id {
            current_id.clone()
        } else {
            // Create new save slot
            let new_id = format!("save_{}", self.stats.total_saves + 1);
            self.create_save_slot(
                new_id.clone(),
                updated_save_data.name.clone(),
                updated_save_data.description.clone(),
            )?;
            new_id
        };

        // Clone save data for later use
        let save_data_clone = updated_save_data.clone();
        let save_slot_id_clone = save_slot_id.clone();

        // Update save slot
        if let Some(slot) = self.save_slots.get_mut(&save_slot_id) {
            slot.save_data = Some(updated_save_data.clone());
            slot.updated_at = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            slot.last_played = slot.updated_at;
            slot.playtime = updated_save_data.playtime;
            slot.screenshot = updated_save_data.screenshot.clone();
            slot.is_valid = true;
            slot.is_corrupted = false;
            slot.is_compatible = true;
        }

        // Update statistics
        let end_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();
        
        let save_time = (end_time - start_time) as u64;
        self.update_save_stats(&save_data_clone, save_time);

        // Add to cloud sync queue if enabled
        if self.config.cloud_sync_enabled {
            self.cloud_sync_queue.push(save_slot_id_clone.clone());
        }

        self.current_save_id = Some(save_slot_id_clone.clone());
        
        console_log!("💾 Saved game: {} ({}ms)", save_slot_id_clone, save_time);
        Ok(save_slot_id_clone)
    }

    pub fn load_game(&mut self, save_slot_id: &str) -> Result<SaveData, String> {
        let save_data = if let Some(slot) = self.save_slots.get(save_slot_id) {
            let save_data = slot.save_data.as_ref()
                .ok_or("No save data in slot")?;

            // Validate checksum
            let current_checksum = self.calculate_checksum(&serde_json::to_string(&save_data).unwrap());
            if current_checksum != save_data.checksum {
                return Err("Save data checksum mismatch - data may be corrupted".to_string());
            }

            // Check compatibility
            let compatibility = self.check_compatibility(&save_data);
            if !compatibility.is_valid {
                return Err(format!("Save data incompatible: {:?}", compatibility.errors));
            }

            save_data.clone()
        } else {
            return Err("Save slot not found".to_string());
        };

        // Update current save
        self.current_save_id = Some(save_slot_id.to_string());
        
        // Update last played time
        if let Some(slot) = self.save_slots.get_mut(save_slot_id) {
            slot.last_played = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }

        console_log!("📂 Loaded game: {}", save_slot_id);
        Ok(save_data)
    }

    pub fn auto_save(&mut self) -> Result<String, String> {
        if !self.config.auto_save_enabled {
            return Err("Auto save is disabled".to_string());
        }

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now - self.last_auto_save < self.config.auto_save_interval as u64 {
            return Err("Auto save interval not reached".to_string());
        }

        // Create auto save data
        let auto_save_data = self.create_auto_save_data()?;
        
        // Save the game
        let save_id = self.save_game(auto_save_data)?;
        
        self.last_auto_save = now;
        self.stats.auto_saves += 1;
        
        console_log!("🔄 Auto saved: {}", save_id);
        Ok(save_id)
    }

    pub fn quick_save(&mut self) -> Result<String, String> {
        // Create quick save data
        let quick_save_data = self.create_quick_save_data()?;
        
        // Save the game
        let save_id = self.save_game(quick_save_data)?;
        
        console_log!("⚡ Quick saved: {}", save_id);
        Ok(save_id)
    }

    // Validation
    pub fn validate_save_data(&self, save_data: &SaveData) -> ValidationResult {
        let mut result = ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
            compatibility_score: 1.0,
            missing_fields: Vec::new(),
            version_compatibility: "compatible".to_string(),
        };

        // Check required fields
        if save_data.id.is_empty() {
            result.errors.push("Save ID is required".to_string());
            result.is_valid = false;
        }

        if save_data.name.is_empty() {
            result.errors.push("Save name is required".to_string());
            result.is_valid = false;
        }

        if save_data.version.is_empty() {
            result.errors.push("Save version is required".to_string());
            result.is_valid = false;
        }

        // Check data ranges
        if save_data.health < 0.0 || save_data.health > save_data.max_health {
            result.warnings.push("Health value is out of range".to_string());
        }

        if save_data.experience < save_data.level_experience {
            result.warnings.push("Experience less than level experience".to_string());
        }

        // Check inventory
        for item in &save_data.inventory {
            if item.quantity == 0 {
                result.warnings.push(format!("Inventory item {} has zero quantity", item.id));
            }
        }

        // Check quests
        for quest in &save_data.quests {
            if quest.progress < 0.0 || quest.progress > 1.0 {
                result.warnings.push(format!("Quest {} has invalid progress", quest.id));
            }
        }

        // Calculate compatibility score
        result.compatibility_score = self.calculate_compatibility_score(save_data);

        result
    }

    // Compatibility checking
    pub fn check_compatibility(&self, save_data: &SaveData) -> ValidationResult {
        let mut result = ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
            compatibility_score: 1.0,
            missing_fields: Vec::new(),
            version_compatibility: "compatible".to_string(),
        };

        // Check game version compatibility
        let current_version = "1.0.0"; // This should come from engine config
        if save_data.metadata.game_version != current_version {
            result.warnings.push(format!(
                "Save version {} differs from current version {}",
                save_data.metadata.game_version, current_version
            ));
            result.compatibility_score *= 0.9;
        }

        // Check engine version compatibility
        let current_engine_version = "1.0.0"; // This should come from engine config
        if save_data.metadata.engine_version != current_engine_version {
            result.warnings.push(format!(
                "Engine version {} differs from current version {}",
                save_data.metadata.engine_version, current_engine_version
            ));
            result.compatibility_score *= 0.8;
        }

        // Check platform compatibility
        let current_platform = "web"; // This should come from browser detection
        if save_data.metadata.platform != current_platform {
            result.warnings.push(format!(
                "Save platform {} differs from current platform {}",
                save_data.metadata.platform, current_platform
            ));
            result.compatibility_score *= 0.7;
        }

        // Determine overall compatibility
        if result.compatibility_score < 0.5 {
            result.is_valid = false;
            result.version_compatibility = "incompatible".to_string();
        } else if result.compatibility_score < 0.8 {
            result.version_compatibility = "partially_compatible".to_string();
        }

        result
    }

    // Cloud operations
    pub fn sync_to_cloud(&mut self) -> Result<Vec<String>, String> {
        if !self.config.cloud_sync_enabled {
            return Err("Cloud sync is disabled".to_string());
        }

        let mut synced_saves = Vec::new();
        
        // Collect save IDs and data first to avoid borrow checker issues
        let save_data: Vec<(String, SaveData)> = self.cloud_sync_queue
            .iter()
            .filter_map(|save_id| {
                self.save_slots.get(save_id).and_then(|slot| {
                    slot.save_data.as_ref().map(|data| (save_id.clone(), data.clone()))
                })
            })
            .collect();

        // Clear the queue
        self.cloud_sync_queue.clear();

        // Process each save
        for (save_id, save_data) in save_data {
            match self.upload_to_cloud(&save_id, &save_data) {
                Ok(_) => {
                    synced_saves.push(save_id.clone());
                    self.stats.cloud_saves += 1;
                    
                    // Update slot sync status
                    if let Some(slot) = self.save_slots.get_mut(&save_id) {
                        slot.cloud_synced = true;
                    }
                }
                Err(e) => {
                    console_log!("❌ Failed to sync {} to cloud: {}", save_id, e);
                }
            }
        }

        console_log!("☁️ Synced {} saves to cloud", synced_saves.len());
        Ok(synced_saves)
    }

    pub fn download_from_cloud(&mut self, save_id: &str) -> Result<SaveData, String> {
        match self.download_from_cloud_internal(save_id) {
            Ok(save_data) => {
                // Validate downloaded save
                let validation = self.validate_save_data(&save_data);
                if !validation.is_valid {
                    return Err("Downloaded save data is invalid".to_string());
                }

                // Store in save slot
                let save_slot_id = format!("cloud_{}", save_id);
                if !self.save_slots.contains_key(&save_slot_id) {
                    self.create_save_slot(
                        save_slot_id.clone(),
                        save_data.name.clone(),
                        "Cloud save".to_string(),
                    )?;
                }

                if let Some(slot) = self.save_slots.get_mut(&save_slot_id) {
                    slot.save_data = Some(save_data.clone());
                    slot.cloud_synced = true;
                    slot.updated_at = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs();
                }

                console_log!("☁️ Downloaded save from cloud: {}", save_id);
                Ok(save_data)
            }
            Err(e) => Err(e)
        }
    }

    // Backup operations
    pub fn create_backup(&mut self, save_slot_id: &str) -> Result<String, String> {
        let save_slot = self.save_slots.get(save_slot_id)
            .ok_or("Save slot not found")?;

        let save_data = save_slot.save_data.as_ref()
            .ok_or("No save data in slot")?;

        // Create backup save data
        let mut backup_data = save_data.clone();
        backup_data.id = format!("backup_{}", backup_data.id);
        backup_data.name = format!("Backup of {}", backup_data.name);
        backup_data.description = format!("Backup created at {}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
        backup_data.save_type = SaveType::Backup;

        // Save backup
        let backup_id = self.save_game(backup_data)?;
        
        console_log!("📦 Created backup: {}", backup_id);
        Ok(backup_id)
    }

    pub fn restore_backup(&mut self, backup_id: &str, target_slot_id: &str) -> Result<(), String> {
        let backup_data = self.load_game(backup_id)?;
        
        // Create save slot if it doesn't exist
        if !self.save_slots.contains_key(target_slot_id) {
            self.create_save_slot(
                target_slot_id.to_string(),
                backup_data.name.clone(),
                backup_data.description.clone(),
            )?;
        }

        // Remove backup type and restore
        let mut restored_data = backup_data;
        restored_data.save_type = SaveType::Manual;
        restored_data.id = target_slot_id.to_string();

        self.save_game(restored_data)?;
        
        console_log!("🔄 Restored backup to: {}", target_slot_id);
        Ok(())
    }

    // Utility methods
    fn create_auto_save_data(&self) -> Result<SaveData, String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Ok(SaveData {
            id: format!("auto_{}", now),
            name: "Auto Save".to_string(),
            description: "Automatic save".to_string(),
            save_type: SaveType::Auto,
            version: "1.0.0".to_string(),
            timestamp: now,
            playtime: 0, // This should come from game state
            level: 1,
            scene: "main_menu".to_string(), // This should come from game state
            player_position: [0.0, 0.0, 0.0],
            player_rotation: [0.0, 0.0, 0.0, 1.0],
            health: 100.0,
            max_health: 100.0,
            experience: 0,
            level_experience: 0,
            inventory: Vec::new(),
            quests: Vec::new(),
            world_state: HashMap::new(),
            game_flags: HashMap::new(),
            variables: HashMap::new(),
            screenshot: None,
            metadata: SaveMetadata {
                game_version: "1.0.0".to_string(),
                engine_version: "1.0.0".to_string(),
                platform: "web".to_string(),
                compression_type: self.config.compression_type.clone(),
                encryption_type: self.config.encryption_type.clone(),
                cloud_provider: self.config.cloud_provider.clone(),
                file_size: 0,
                compressed_size: 0,
                encrypted: false,
                tags: vec!["auto".to_string()],
                notes: "Auto-generated save".to_string(),
            },
            checksum: String::new(),
        })
    }

    fn create_quick_save_data(&self) -> Result<SaveData, String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Ok(SaveData {
            id: format!("quick_{}", now),
            name: "Quick Save".to_string(),
            description: "Quick save".to_string(),
            save_type: SaveType::Quick,
            version: "1.0.0".to_string(),
            timestamp: now,
            playtime: 0, // This should come from game state
            level: 1,
            scene: "main_menu".to_string(), // This should come from game state
            player_position: [0.0, 0.0, 0.0],
            player_rotation: [0.0, 0.0, 0.0, 1.0],
            health: 100.0,
            max_health: 100.0,
            experience: 0,
            level_experience: 0,
            inventory: Vec::new(),
            quests: Vec::new(),
            world_state: HashMap::new(),
            game_flags: HashMap::new(),
            variables: HashMap::new(),
            screenshot: None,
            metadata: SaveMetadata {
                game_version: "1.0.0".to_string(),
                engine_version: "1.0.0".to_string(),
                platform: "web".to_string(),
                compression_type: self.config.compression_type.clone(),
                encryption_type: self.config.encryption_type.clone(),
                cloud_provider: self.config.cloud_provider.clone(),
                file_size: 0,
                compressed_size: 0,
                encrypted: false,
                tags: vec!["quick".to_string()],
                notes: "Quick save".to_string(),
            },
            checksum: String::new(),
        })
    }

    fn update_save_stats(&mut self, save_data: &SaveData, save_time: u64) {
        self.stats.total_saves += 1;
        self.stats.last_save_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Update average save time
        if self.stats.total_saves == 1 {
            self.stats.average_save_time = save_time as f64;
        } else {
            let alpha = 0.1;
            self.stats.average_save_time = self.stats.average_save_time * (1.0 - alpha) + save_time as f64 * alpha;
        }

        // Update type-specific stats
        match save_data.save_type {
            SaveType::Auto => self.stats.auto_saves += 1,
            SaveType::Manual => self.stats.manual_saves += 1,
            SaveType::Cloud => self.stats.cloud_saves += 1,
            _ => {}
        }

        // Update size stats
        self.stats.total_size += save_data.metadata.file_size;
        self.stats.compressed_size += save_data.metadata.compressed_size;
    }

    fn calculate_checksum(&self, data: &str) -> String {
        // Simple checksum implementation
        let mut hash = 0u64;
        for byte in data.bytes() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
        }
        format!("{:016x}", hash)
    }

    fn calculate_compatibility_score(&self, save_data: &SaveData) -> f32 {
        let mut score = 1.0;

        // Version compatibility
        if save_data.metadata.game_version != "1.0.0" {
            score *= 0.8;
        }

        // Platform compatibility
        if save_data.metadata.platform != "web" {
            score *= 0.7;
        }

        // Data completeness
        if save_data.inventory.is_empty() {
            score *= 0.9;
        }

        if save_data.quests.is_empty() {
            score *= 0.9;
        }

        score
    }

    fn compress_save_data(&self, save_data: &SaveData) -> Result<String, String> {
        let data = serde_json::to_string(save_data)
            .map_err(|e| format!("Failed to serialize save data: {}", e))?;

        match self.config.compression_type {
            SaveCompressionType::None => Ok(data),
            SaveCompressionType::Gzip => self.compress_gzip(&data),
            SaveCompressionType::Brotli => self.compress_brotli(&data),
            SaveCompressionType::LZ4 => self.compress_lz4(&data),
            SaveCompressionType::Custom => Err("Custom compression not implemented".to_string()),
        }
    }

    fn encrypt_save_data(&self, data: &str) -> Result<String, String> {
        match self.config.encryption_type {
            SaveEncryptionType::None => Ok(data.to_string()),
            SaveEncryptionType::AES256 => self.encrypt_aes256(data),
            SaveEncryptionType::ChaCha20 => self.encrypt_chacha20(data),
            SaveEncryptionType::Custom => Err("Custom encryption not implemented".to_string()),
        }
    }

    fn compress_gzip(&self, data: &str) -> Result<String, String> {
        // Placeholder implementation
        // In a real implementation, you would use a compression library
        Ok(data.to_string())
    }

    fn compress_brotli(&self, data: &str) -> Result<String, String> {
        // Placeholder implementation
        Ok(data.to_string())
    }

    fn compress_lz4(&self, data: &str) -> Result<String, String> {
        // Placeholder implementation
        Ok(data.to_string())
    }

    fn encrypt_aes256(&self, data: &str) -> Result<String, String> {
        // Placeholder implementation
        // In a real implementation, you would use an encryption library
        Ok(data.to_string())
    }

    fn encrypt_chacha20(&self, data: &str) -> Result<String, String> {
        // Placeholder implementation
        Ok(data.to_string())
    }

    fn upload_to_cloud(&self, save_id: &str, save_data: &SaveData) -> Result<(), String> {
        match self.config.cloud_provider {
            CloudProvider::LocalStorage => self.upload_to_local_storage(save_id, save_data),
            CloudProvider::IndexedDB => self.upload_to_indexed_db(save_id, save_data),
            CloudProvider::Firebase => self.upload_to_firebase(save_id, save_data),
            CloudProvider::AWS => self.upload_to_aws(save_id, save_data),
            CloudProvider::Custom => Err("Custom cloud provider not implemented".to_string()),
            CloudProvider::None => Err("No cloud provider configured".to_string()),
        }
    }

    fn download_from_cloud_internal(&self, save_id: &str) -> Result<SaveData, String> {
        match self.config.cloud_provider {
            CloudProvider::LocalStorage => self.download_from_local_storage(save_id),
            CloudProvider::IndexedDB => self.download_from_indexed_db(save_id),
            CloudProvider::Firebase => self.download_from_firebase(save_id),
            CloudProvider::AWS => self.download_from_aws(save_id),
            CloudProvider::Custom => Err("Custom cloud provider not implemented".to_string()),
            CloudProvider::None => Err("No cloud provider configured".to_string()),
        }
    }

    fn upload_to_local_storage(&self, save_id: &str, save_data: &SaveData) -> Result<(), String> {
        if let Some(window) = window() {
            let storage = window.local_storage().unwrap_or_else(|e| {
                web_sys::console::error_1(&format!("Failed to access local storage: {:?}", e).into());
                None
            });
            
            if let Some(storage) = storage {
                let data = serde_json::to_string(save_data)
                    .map_err(|e| format!("Failed to serialize save data: {}", e))?;

                storage.set_item(save_id, &data)
                    .map_err(|e| format!("Failed to save to local storage: {:?}", e))?;
                Ok(())
            } else {
                Err("Local storage not available".to_string())
            }
        } else {
            Err("No window object available".to_string())
        }
    }

    fn download_from_local_storage(&self, save_id: &str) -> Result<SaveData, String> {
        if let Some(window) = window() {
            let storage = window.local_storage().unwrap_or_else(|e| {
                web_sys::console::error_1(&format!("Failed to access local storage: {:?}", e).into());
                None
            });
            
            if let Some(storage) = storage {
                let data = storage.get_item(save_id)
                    .map_err(|e| format!("Failed to get item from local storage: {:?}", e))?
                    .ok_or("Save not found in local storage")?;

                let save_data: SaveData = serde_json::from_str(&data)
                    .map_err(|e| format!("Failed to deserialize save data: {}", e))?;

                Ok(save_data)
            } else {
                Err("Local storage not available".to_string())
            }
        } else {
            Err("No window object available".to_string())
        }
    }

    fn upload_to_indexed_db(&self, _save_id: &str, _save_data: &SaveData) -> Result<(), String> {
        // Placeholder implementation
        Err("IndexedDB upload not implemented".to_string())
    }

    fn download_from_indexed_db(&self, _save_id: &str) -> Result<SaveData, String> {
        // Placeholder implementation
        Err("IndexedDB download not implemented".to_string())
    }

    fn upload_to_firebase(&self, _save_id: &str, _save_data: &SaveData) -> Result<(), String> {
        // Placeholder implementation
        Err("Firebase upload not implemented".to_string())
    }

    fn download_from_firebase(&self, _save_id: &str) -> Result<SaveData, String> {
        // Placeholder implementation
        Err("Firebase download not implemented".to_string())
    }

    fn upload_to_aws(&self, _save_id: &str, _save_data: &SaveData) -> Result<(), String> {
        // Placeholder implementation
        Err("AWS upload not implemented".to_string())
    }

    fn download_from_aws(&self, _save_id: &str) -> Result<SaveData, String> {
        // Placeholder implementation
        Err("AWS download not implemented".to_string())
    }
}

// WASM exports
#[wasm_bindgen]
pub struct SaveSystemExport {
    inner: Arc<Mutex<SaveSystem>>,
}

#[wasm_bindgen]
impl SaveSystemExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<SaveSystemExport, JsValue> {
        let config: SaveConfig = serde_wasm_bindgen::from_value(config)?;
        let save_system = SaveSystem::new(config);
        Ok(SaveSystemExport {
            inner: Arc::new(Mutex::new(save_system)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: SaveConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let save_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&save_system.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let save_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&save_system.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_save_system_summary(&mut self) -> String {
        self.inner.lock().unwrap().get_save_system_summary()
    }

    #[wasm_bindgen]
    pub fn create_save_slot(&mut self, id: String, name: String, description: String) -> Result<(), JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.create_save_slot(id, name, description) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn delete_save_slot(&mut self, id: &str) -> Result<(), JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.delete_save_slot(id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_save_slot(&self, id: &str) -> JsValue {
        let save_system = self.inner.lock().unwrap();
        if let Some(slot) = save_system.get_save_slot(id) {
            serde_wasm_bindgen::to_value(&slot).unwrap()
        } else {
            JsValue::null()
        }
    }

    #[wasm_bindgen]
    pub fn get_all_save_slots(&self) -> JsValue {
        let save_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&save_system.get_all_save_slots()).unwrap()
    }

    #[wasm_bindgen]
    pub fn save_game(&mut self, save_data: JsValue) -> Result<JsValue, JsValue> {
        let save_data: SaveData = serde_wasm_bindgen::from_value(save_data).unwrap();
        let mut save_system = self.inner.lock().unwrap();
        match save_system.save_game(save_data) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn load_game(&mut self, save_slot_id: &str) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.load_game(save_slot_id) {
            Ok(data) => Ok(serde_wasm_bindgen::to_value(&data).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn auto_save(&mut self) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.auto_save() {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn quick_save(&mut self) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.quick_save() {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn validate_save_data(&self, save_data: JsValue) -> JsValue {
        let save_data: SaveData = serde_wasm_bindgen::from_value(save_data).unwrap();
        let save_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&save_system.validate_save_data(&save_data)).unwrap()
    }

    #[wasm_bindgen]
    pub fn check_compatibility(&self, save_data: JsValue) -> JsValue {
        let save_data: SaveData = serde_wasm_bindgen::from_value(save_data).unwrap();
        let save_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&save_system.check_compatibility(&save_data)).unwrap()
    }

    #[wasm_bindgen]
    pub fn sync_to_cloud(&mut self) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.sync_to_cloud() {
            Ok(synced) => Ok(serde_wasm_bindgen::to_value(&synced).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn download_from_cloud(&mut self, save_id: &str) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.download_from_cloud(save_id) {
            Ok(data) => Ok(serde_wasm_bindgen::to_value(&data).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn create_backup(&mut self, save_slot_id: &str) -> Result<JsValue, JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.create_backup(save_slot_id) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn restore_backup(&mut self, backup_id: &str, target_slot_id: &str) -> Result<(), JsValue> {
        let mut save_system = self.inner.lock().unwrap();
        match save_system.restore_backup(backup_id, target_slot_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_save_config() -> JsValue {
    let config = SaveConfig {
        auto_save_enabled: true,
        auto_save_interval: 300, // 5 minutes
        max_auto_saves: 5,
        max_manual_saves: 20,
        compression_type: SaveCompressionType::Gzip,
        encryption_type: SaveEncryptionType::None,
        cloud_provider: CloudProvider::LocalStorage,
        cloud_sync_enabled: false,
        validate_saves: true,
        backup_saves: true,
        max_backup_saves: 10,
        screenshot_enabled: true,
        screenshot_quality: 75,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_save_development_config() -> JsValue {
    let config = SaveConfig {
        auto_save_enabled: true,
        auto_save_interval: 60, // 1 minute
        max_auto_saves: 10,
        max_manual_saves: 50,
        compression_type: SaveCompressionType::None,
        encryption_type: SaveEncryptionType::None,
        cloud_provider: CloudProvider::LocalStorage,
        cloud_sync_enabled: false,
        validate_saves: true,
        backup_saves: true,
        max_backup_saves: 20,
        screenshot_enabled: true,
        screenshot_quality: 90,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_save_production_config() -> JsValue {
    let config = SaveConfig {
        auto_save_enabled: true,
        auto_save_interval: 600, // 10 minutes
        max_auto_saves: 3,
        max_manual_saves: 10,
        compression_type: SaveCompressionType::Gzip,
        encryption_type: SaveEncryptionType::AES256,
        cloud_provider: CloudProvider::IndexedDB,
        cloud_sync_enabled: true,
        validate_saves: true,
        backup_saves: true,
        max_backup_saves: 5,
        screenshot_enabled: true,
        screenshot_quality: 50,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_save_mobile_config() -> JsValue {
    let config = SaveConfig {
        auto_save_enabled: true,
        auto_save_interval: 900, // 15 minutes
        max_auto_saves: 2,
        max_manual_saves: 5,
        compression_type: SaveCompressionType::LZ4,
        encryption_type: SaveEncryptionType::AES256,
        cloud_provider: CloudProvider::Firebase,
        cloud_sync_enabled: true,
        validate_saves: true,
        backup_saves: false,
        max_backup_saves: 3,
        screenshot_enabled: false,
        screenshot_quality: 50,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

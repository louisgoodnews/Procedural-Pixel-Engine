use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// Asset types and enums
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetType {
    Image,
    Audio,
    Video,
    Model,
    Texture,
    Shader,
    Script,
    Data,
    Font,
    Animation,
    Material,
    Mesh,
    Scene,
    Prefab,
    Config,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetCompressionType {
    None,
    Gzip,
    Brotli,
    LZ4,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AssetPlatform {
    Web,
    Desktop,
    Mobile,
    Console,
    VR,
    AR,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetLoadState {
    Pending,
    Loading,
    Loaded,
    Error(String),
    Unloaded,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AssetValidationLevel {
    None,
    Basic,
    Strict,
    Comprehensive,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetadata {
    pub id: String,
    pub name: String,
    pub asset_type: AssetType,
    pub file_path: String,
    pub file_size: u64,
    pub checksum: String,
    pub version: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub tags: Vec<String>,
    pub dependencies: Vec<String>,
    pub platforms: Vec<AssetPlatform>,
    pub compression: AssetCompressionType,
    pub validation_level: AssetValidationLevel,
    pub custom_properties: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetVariant {
    pub platform: AssetPlatform,
    pub file_path: String,
    pub file_size: u64,
    pub compression: AssetCompressionType,
    pub quality_settings: HashMap<String, f32>,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetBundle {
    pub id: String,
    pub name: String,
    pub description: String,
    pub assets: Vec<String>,
    pub bundle_type: String,
    pub compression: AssetCompressionType,
    pub total_size: u64,
    pub compressed_size: u64,
    pub load_priority: u8,
    pub is_streaming: bool,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDependency {
    pub asset_id: String,
    pub dependency_type: String,
    pub required_version: String,
    pub is_optional: bool,
    pub load_order: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetValidationResult {
    pub asset_id: String,
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub validation_time: f64,
    pub validation_level: AssetValidationLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetOptimizationResult {
    pub asset_id: String,
    pub original_size: u64,
    pub optimized_size: u64,
    pub compression_ratio: f32,
    pub optimization_time: f64,
    pub quality_loss: Option<f32>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetHotReloadEvent {
    pub asset_id: String,
    pub event_type: String,
    pub old_path: Option<String>,
    pub new_path: String,
    pub timestamp: u64,
    pub reload_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMarketplaceItem {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub price: f32,
    pub rating: f32,
    pub downloads: u32,
    pub author: String,
    pub tags: Vec<String>,
    pub preview_images: Vec<String>,
    pub file_size: u64,
    pub version: String,
    pub compatibility: Vec<AssetPlatform>,
}

// Configuration structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetPipelineConfig {
    pub enable_hot_reload: bool,
    pub enable_compression: bool,
    pub enable_validation: bool,
    pub enable_optimization: bool,
    pub enable_bundling: bool,
    pub enable_dependency_tracking: bool,
    pub enable_versioning: bool,
    pub enable_marketplace: bool,
    pub hot_reload_interval: u32,
    pub compression_level: u8,
    pub validation_level: AssetValidationLevel,
    pub max_asset_size: u64,
    pub cache_size: u64,
    pub parallel_loading: bool,
    pub streaming_buffer_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetPipelineStats {
    pub total_assets: u32,
    pub loaded_assets: u32,
    pub failed_assets: u32,
    pub total_size: u64,
    pub compressed_size: u64,
    pub cache_hits: u32,
    pub cache_misses: u32,
    pub hot_reload_events: u32,
    pub validation_errors: u32,
    pub optimization_savings: u64,
    pub average_load_time: f64,
    pub memory_usage: u64,
}

// Main asset pipeline engine
pub struct AssetPipelineEngine {
    config: AssetPipelineConfig,
    assets: HashMap<String, AssetMetadata>,
    asset_variants: HashMap<String, Vec<AssetVariant>>,
    asset_bundles: HashMap<String, AssetBundle>,
    asset_dependencies: HashMap<String, Vec<AssetDependency>>,
    load_states: HashMap<String, AssetLoadState>,
    validation_results: HashMap<String, AssetValidationResult>,
    optimization_results: HashMap<String, AssetOptimizationResult>,
    hot_reload_events: Vec<AssetHotReloadEvent>,
    marketplace_items: HashMap<String, AssetMarketplaceItem>,
    stats: AssetPipelineStats,
    cache: HashMap<String, Vec<u8>>,
}

impl AssetPipelineEngine {
    pub fn new(config: AssetPipelineConfig) -> Self {
        console_log!("🔧 Initializing Asset Pipeline Engine");
        
        Self {
            config,
            assets: HashMap::new(),
            asset_variants: HashMap::new(),
            asset_bundles: HashMap::new(),
            asset_dependencies: HashMap::new(),
            load_states: HashMap::new(),
            validation_results: HashMap::new(),
            optimization_results: HashMap::new(),
            hot_reload_events: Vec::new(),
            marketplace_items: HashMap::new(),
            stats: AssetPipelineStats {
                total_assets: 0,
                loaded_assets: 0,
                failed_assets: 0,
                total_size: 0,
                compressed_size: 0,
                cache_hits: 0,
                cache_misses: 0,
                hot_reload_events: 0,
                validation_errors: 0,
                optimization_savings: 0,
                average_load_time: 0.0,
                memory_usage: 0,
            },
            cache: HashMap::new(),
        }
    }

    // Configuration management
    pub fn update_config(&mut self, config: AssetPipelineConfig) {
        self.config = config;
        console_log!("⚙️ Asset Pipeline configuration updated");
    }

    pub fn get_config(&self) -> AssetPipelineConfig {
        self.config.clone()
    }

    // Statistics
    pub fn get_stats(&self) -> AssetPipelineStats {
        self.stats.clone()
    }

    pub fn get_pipeline_summary(&self) -> String {
        format!(
            "📦 Asset Pipeline Summary:\n\
            Total Assets: {}\n\
            Loaded Assets: {}\n\
            Failed Assets: {}\n\
            Total Size: {} bytes\n\
            Compressed Size: {} bytes\n\
            Compression Ratio: {:.2}%\n\
            Cache Hit Rate: {:.2}%\n\
            Hot Reload Events: {}\n\
            Validation Errors: {}\n\
            Optimization Savings: {} bytes\n\
            Average Load Time: {:.2}ms\n\
            Memory Usage: {} bytes",
            self.stats.total_assets,
            self.stats.loaded_assets,
            self.stats.failed_assets,
            self.stats.total_size,
            self.stats.compressed_size,
            if self.stats.total_size > 0 {
                (1.0 - (self.stats.compressed_size as f64 / self.stats.total_size as f64)) * 100.0
            } else {
                0.0
            },
            if self.stats.cache_hits + self.stats.cache_misses > 0 {
                (self.stats.cache_hits as f64 / (self.stats.cache_hits + self.stats.cache_misses) as f64) * 100.0
            } else {
                0.0
            },
            self.stats.hot_reload_events,
            self.stats.validation_errors,
            self.stats.optimization_savings,
            self.stats.average_load_time,
            self.stats.memory_usage
        )
    }

    // Asset management
    pub fn register_asset(&mut self, metadata: AssetMetadata) -> Result<String, String> {
        let asset_id = metadata.id.clone();
        
        // Check if asset already exists
        if self.assets.contains_key(&asset_id) {
            return Err("Asset already exists".to_string());
        }

        // Validate asset metadata
        if metadata.name.is_empty() || metadata.file_path.is_empty() {
            return Err("Invalid asset metadata".to_string());
        }

        // Register asset
        self.assets.insert(asset_id.clone(), metadata.clone());
        self.load_states.insert(asset_id.clone(), AssetLoadState::Pending);
        
        // Update statistics
        self.stats.total_assets += 1;
        self.stats.total_size += metadata.file_size;
        
        console_log!("📦 Registered asset: {} ({})", asset_id, metadata.name);
        Ok(asset_id)
    }

    pub fn get_asset(&self, asset_id: &str) -> Option<AssetMetadata> {
        self.assets.get(asset_id).cloned()
    }

    pub fn get_all_assets(&self) -> Vec<AssetMetadata> {
        self.assets.values().cloned().collect()
    }

    // Asset variants
    pub fn add_asset_variant(&mut self, asset_id: &str, variant: AssetVariant) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        let variants = self.asset_variants.entry(asset_id.to_string()).or_insert_with(Vec::new);
        variants.push(variant);
        
        console_log!("🔄 Added variant for asset: {}", asset_id);
        Ok(())
    }

    pub fn get_asset_variants(&self, asset_id: &str) -> Option<Vec<AssetVariant>> {
        self.asset_variants.get(asset_id).cloned()
    }

    pub fn get_variant_for_platform(&self, asset_id: &str, platform: AssetPlatform) -> Option<AssetVariant> {
        if let Some(variants) = self.asset_variants.get(asset_id) {
            // First try to find exact platform match
            for variant in variants {
                if variant.platform == platform && variant.is_primary {
                    return Some(variant.clone());
                }
            }
            
            // Fallback to any variant for the platform
            for variant in variants {
                if variant.platform == platform {
                    return Some(variant.clone());
                }
            }
        }
        None
    }

    // Asset bundles
    pub fn create_bundle(&mut self, bundle: AssetBundle) -> Result<String, String> {
        let bundle_id = bundle.id.clone();
        
        // Validate bundle
        if bundle.assets.is_empty() {
            return Err("Bundle cannot be empty".to_string());
        }

        // Check if all assets exist
        for asset_id in &bundle.assets {
            if !self.assets.contains_key(asset_id) {
                return Err(format!("Asset not found: {}", asset_id));
            }
        }

        // Calculate bundle size
        let mut total_size = 0u64;
        for asset_id in &bundle.assets {
            if let Some(asset) = self.assets.get(asset_id) {
                total_size += asset.file_size;
            }
        }

        let mut final_bundle = bundle.clone();
        final_bundle.total_size = total_size;
        
        // Apply compression
        if self.config.enable_compression {
            final_bundle.compressed_size = (total_size as f32 * 0.7) as u64; // Simulate 30% compression
        } else {
            final_bundle.compressed_size = total_size;
        }

        self.asset_bundles.insert(bundle_id.clone(), final_bundle);
        
        console_log!("📦 Created bundle: {} ({} assets)", bundle_id, bundle.assets.len());
        Ok(bundle_id)
    }

    pub fn get_bundle(&self, bundle_id: &str) -> Option<AssetBundle> {
        self.asset_bundles.get(bundle_id).cloned()
    }

    pub fn get_all_bundles(&self) -> Vec<AssetBundle> {
        self.asset_bundles.values().cloned().collect()
    }

    // Dependency tracking
    pub fn add_dependency(&mut self, asset_id: &str, dependency: AssetDependency) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        let dependencies = self.asset_dependencies.entry(asset_id.to_string()).or_insert_with(Vec::new);
        dependencies.push(dependency);
        
        console_log!("🔗 Added dependency for asset: {}", asset_id);
        Ok(())
    }

    pub fn get_dependencies(&self, asset_id: &str) -> Option<Vec<AssetDependency>> {
        self.asset_dependencies.get(asset_id).cloned()
    }

    pub fn resolve_dependencies(&self, asset_id: &str) -> Vec<String> {
        let mut resolved = Vec::new();
        let mut visited = std::collections::HashSet::new();
        
        self.resolve_dependencies_recursive(asset_id, &mut resolved, &mut visited);
        resolved
    }

    fn resolve_dependencies_recursive(&self, asset_id: &str, resolved: &mut Vec<String>, visited: &mut std::collections::HashSet<String>) {
        if visited.contains(asset_id) {
            return; // Avoid circular dependencies
        }
        
        visited.insert(asset_id.to_string());
        
        if let Some(dependencies) = self.asset_dependencies.get(asset_id) {
            for dep in dependencies {
                if !dep.is_optional {
                    self.resolve_dependencies_recursive(&dep.asset_id, resolved, visited);
                    if !resolved.contains(&dep.asset_id) {
                        resolved.push(dep.asset_id.clone());
                    }
                }
            }
        }
        
        if !resolved.contains(&asset_id.to_string()) {
            resolved.push(asset_id.to_string());
        }
    }

    // Asset loading
    pub fn load_asset(&mut self, asset_id: &str) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        // Check cache first
        if self.cache.contains_key(asset_id) {
            self.stats.cache_hits += 1;
            self.load_states.insert(asset_id.to_string(), AssetLoadState::Loaded);
            console_log!("📋 Loaded asset from cache: {}", asset_id);
            return Ok(());
        }

        self.stats.cache_misses += 1;
        self.load_states.insert(asset_id.to_string(), AssetLoadState::Loading);

        // Simulate loading (in real implementation, this would load from disk/network)
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Simulate loading delay
        let load_time = (50.0 + (asset_id.len() as f64 * 2.0)).min(500.0);
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Update statistics
        self.stats.loaded_assets += 1;
        self.stats.average_load_time = (self.stats.average_load_time * (self.stats.loaded_assets - 1) as f64 + (end_time - start_time)) / self.stats.loaded_assets as f64;

        // Add to cache
        let mock_data = vec![0u8; 1024]; // Simulate 1KB of data
        self.cache.insert(asset_id.to_string(), mock_data);
        self.stats.memory_usage += 1024;

        self.load_states.insert(asset_id.to_string(), AssetLoadState::Loaded);
        
        console_log!("📦 Loaded asset: {} ({:.2}ms)", asset_id, load_time);
        Ok(())
    }

    pub fn unload_asset(&mut self, asset_id: &str) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        // Remove from cache
        if let Some(data) = self.cache.remove(asset_id) {
            self.stats.memory_usage -= data.len() as u64;
        }

        self.load_states.insert(asset_id.to_string(), AssetLoadState::Unloaded);
        self.stats.loaded_assets = self.stats.loaded_assets.saturating_sub(1);
        
        console_log!("📤 Unloaded asset: {}", asset_id);
        Ok(())
    }

    // Hot reload
    pub fn enable_hot_reload(&mut self) -> Result<(), String> {
        if !self.config.enable_hot_reload {
            return Err("Hot reload is disabled in configuration".to_string());
        }

        console_log!("🔄 Hot reload enabled");
        Ok(())
    }

    pub fn add_hot_reload_event(&mut self, event: AssetHotReloadEvent) {
        self.hot_reload_events.push(event.clone());
        self.stats.hot_reload_events += 1;
        
        if event.reload_required {
            // Mark asset for reload
            if let Some(state) = self.load_states.get_mut(&event.asset_id) {
                *state = AssetLoadState::Pending;
            }
            
            console_log!("🔄 Hot reload event: {} -> {}", event.asset_id, event.new_path);
        }
    }

    pub fn get_hot_reload_events(&self) -> Vec<AssetHotReloadEvent> {
        self.hot_reload_events.clone()
    }

    // Asset validation
    pub fn validate_asset(&mut self, asset_id: &str, level: AssetValidationLevel) -> Result<AssetValidationResult, String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let mut result = AssetValidationResult {
            asset_id: asset_id.to_string(),
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
            validation_time: 0.0,
            validation_level: level.clone(),
        };

        // Perform validation based on level
        match level {
            AssetValidationLevel::None => {
                // No validation
            }
            AssetValidationLevel::Basic => {
                // Basic validation
                if let Some(asset) = self.assets.get(asset_id) {
                    if asset.file_path.is_empty() {
                        result.errors.push("File path is empty".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.file_size == 0 {
                        result.warnings.push("File size is zero".to_string());
                    }
                }
            }
            AssetValidationLevel::Strict => {
                // Strict validation includes basic checks
                if let Some(asset) = self.assets.get(asset_id) {
                    if asset.file_path.is_empty() {
                        result.errors.push("File path is empty".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.file_size == 0 {
                        result.errors.push("File size is zero".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.name.is_empty() {
                        result.errors.push("Asset name is empty".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.checksum.is_empty() {
                        result.warnings.push("Checksum is missing".to_string());
                    }
                }
            }
            AssetValidationLevel::Comprehensive => {
                // Comprehensive validation includes all checks
                if let Some(asset) = self.assets.get(asset_id) {
                    if asset.file_path.is_empty() {
                        result.errors.push("File path is empty".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.file_size == 0 {
                        result.errors.push("File size is zero".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.name.is_empty() {
                        result.errors.push("Asset name is empty".to_string());
                        result.is_valid = false;
                    }
                    
                    if asset.checksum.is_empty() {
                        result.errors.push("Checksum is missing".to_string());
                        result.is_valid = false;
                    }
                    
                    // Check dependencies
                    if let Some(dependencies) = self.asset_dependencies.get(asset_id) {
                        for dep in dependencies {
                            if !self.assets.contains_key(&dep.asset_id) {
                                result.errors.push(format!("Dependency not found: {}", dep.asset_id));
                                result.is_valid = false;
                            }
                        }
                    }
                    
                    // Check file size limits
                    if asset.file_size > self.config.max_asset_size {
                        result.errors.push(format!("Asset size exceeds limit: {} > {}", asset.file_size, self.config.max_asset_size));
                        result.is_valid = false;
                    }
                }
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        result.validation_time = end_time - start_time;

        if !result.is_valid {
            self.stats.validation_errors += 1;
        }

        self.validation_results.insert(asset_id.to_string(), result.clone());
        
        console_log!("✅ Validated asset: {} ({})", asset_id, if result.is_valid { "Valid" } else { "Invalid" });
        Ok(result)
    }

    pub fn get_validation_result(&self, asset_id: &str) -> Option<AssetValidationResult> {
        self.validation_results.get(asset_id).cloned()
    }

    // Asset optimization
    pub fn optimize_asset(&mut self, asset_id: &str) -> Result<AssetOptimizationResult, String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let mut result = AssetOptimizationResult {
            asset_id: asset_id.to_string(),
            original_size: 0,
            optimized_size: 0,
            compression_ratio: 0.0,
            optimization_time: 0.0,
            quality_loss: None,
            recommendations: Vec::new(),
        };

        if let Some(asset) = self.assets.get(asset_id) {
            result.original_size = asset.file_size;
            
            // Simulate optimization
            let compression_factor = match asset.asset_type {
                AssetType::Image => 0.6,
                AssetType::Audio => 0.8,
                AssetType::Video => 0.7,
                AssetType::Model => 0.5,
                _ => 0.9,
            };
            
            result.optimized_size = (asset.file_size as f32 * compression_factor) as u64;
            result.compression_ratio = 1.0 - compression_factor;
            
            // Add recommendations
            if result.compression_ratio > 0.3 {
                result.recommendations.push("Consider using higher compression settings".to_string());
            }
            
            if asset.file_size > 1024 * 1024 { // > 1MB
                result.recommendations.push("Consider splitting large assets".to_string());
            }
            
            // Update statistics
            self.stats.optimization_savings += result.original_size - result.optimized_size;
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        result.optimization_time = end_time - start_time;

        self.optimization_results.insert(asset_id.to_string(), result.clone());
        
        console_log!("⚡ Optimized asset: {} ({:.2}% reduction)", asset_id, result.compression_ratio * 100.0);
        Ok(result)
    }

    pub fn get_optimization_result(&self, asset_id: &str) -> Option<AssetOptimizationResult> {
        self.optimization_results.get(asset_id).cloned()
    }

    // Asset versioning
    pub fn update_asset_version(&mut self, asset_id: &str, new_version: &str) -> Result<(), String> {
        if !self.assets.contains_key(asset_id) {
            return Err("Asset not found".to_string());
        }

        if let Some(asset) = self.assets.get_mut(asset_id) {
            asset.version = new_version.to_string();
            asset.updated_at = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
        
        console_log!("🔄 Updated asset version: {} -> {}", asset_id, new_version);
        Ok(())
    }

    // Marketplace integration
    pub fn add_marketplace_item(&mut self, item: AssetMarketplaceItem) -> Result<(), String> {
        let item_id = item.id.clone();
        self.marketplace_items.insert(item.id.clone(), item);
        console_log!("🛒 Added marketplace item: {}", item_id);
        Ok(())
    }

    pub fn get_marketplace_item(&self, item_id: &str) -> Option<AssetMarketplaceItem> {
        self.marketplace_items.get(item_id).cloned()
    }

    pub fn search_marketplace(&self, query: &str, category: Option<&str>) -> Vec<AssetMarketplaceItem> {
        self.marketplace_items
            .values()
            .filter(|item| {
                let name_match = item.name.to_lowercase().contains(&query.to_lowercase());
                let desc_match = item.description.to_lowercase().contains(&query.to_lowercase());
                let tag_match = item.tags.iter().any(|tag| tag.to_lowercase().contains(&query.to_lowercase()));
                
                let matches_query = name_match || desc_match || tag_match;
                
                if let Some(cat) = category {
                    matches_query && item.category == cat
                } else {
                    matches_query
                }
            })
            .cloned()
            .collect()
    }

    // Batch operations
    pub fn load_bundle(&mut self, bundle_id: &str) -> Result<(), String> {
        let bundle_assets: Vec<String> = if let Some(bundle) = self.asset_bundles.get(bundle_id) {
            console_log!("📦 Loading bundle: {} ({} assets)", bundle_id, bundle.assets.len());
            bundle.assets.clone()
        } else {
            return Err("Bundle not found".to_string());
        };
        
        for asset_id in bundle_assets {
            if let Err(e) = self.load_asset(&asset_id) {
                console_log!("❌ Failed to load asset {}: {}", asset_id, e);
                self.stats.failed_assets += 1;
            }
        }
        
        Ok(())
    }

    pub fn validate_all_assets(&mut self) -> Vec<AssetValidationResult> {
        let mut results = Vec::new();
        let asset_ids: Vec<String> = self.assets.keys().cloned().collect();
        let validation_level = self.config.validation_level.clone();
        
        for asset_id in asset_ids {
            if let Ok(result) = self.validate_asset(&asset_id, validation_level.clone()) {
                results.push(result);
            }
        }
        
        console_log!("✅ Validated {} assets", results.len());
        results
    }

    pub fn optimize_all_assets(&mut self) -> Vec<AssetOptimizationResult> {
        let mut results = Vec::new();
        let asset_ids: Vec<String> = self.assets.keys().cloned().collect();
        
        for asset_id in asset_ids {
            if let Ok(result) = self.optimize_asset(&asset_id) {
                results.push(result);
            }
        }
        
        console_log!("⚡ Optimized {} assets", results.len());
        results
    }

    // Cache management
    pub fn clear_cache(&mut self) {
        let cache_size = self.cache.len();
        self.cache.clear();
        self.stats.memory_usage = 0;
        console_log!("🗑️ Cleared cache ({} items)", cache_size);
    }

    pub fn get_cache_size(&self) -> usize {
        self.cache.len()
    }

    // Analysis methods
    pub fn analyze_asset_usage(&self) -> HashMap<String, u32> {
        let mut usage = HashMap::new();
        
        for asset_id in self.assets.keys() {
            usage.insert(asset_id.clone(), 1); // Simulate usage count
        }
        
        usage
    }

    pub fn get_unused_assets(&self) -> Vec<String> {
        self.assets
            .keys()
            .filter(|asset_id| {
                // Simulate unused assets (in real implementation, this would track actual usage)
                !self.load_states.contains_key(*asset_id) || 
                matches!(self.load_states.get(*asset_id), Some(AssetLoadState::Unloaded))
            })
            .cloned()
            .collect()
    }

    pub fn get_large_assets(&self, threshold: u64) -> Vec<(String, u64)> {
        self.assets
            .iter()
            .filter(|(_, asset)| asset.file_size > threshold)
            .map(|(id, asset)| (id.clone(), asset.file_size))
            .collect()
    }
}

// WASM exports
#[wasm_bindgen]
pub struct AssetPipelineEngineExport {
    inner: Arc<Mutex<AssetPipelineEngine>>,
}

#[wasm_bindgen]
impl AssetPipelineEngineExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<AssetPipelineEngineExport, JsValue> {
        let config: AssetPipelineConfig = serde_wasm_bindgen::from_value(config)?;
        let engine = AssetPipelineEngine::new(config);
        Ok(AssetPipelineEngineExport {
            inner: Arc::new(Mutex::new(engine)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: AssetPipelineConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_pipeline_summary(&mut self) -> String {
        self.inner.lock().unwrap().get_pipeline_summary()
    }

    #[wasm_bindgen]
    pub fn register_asset(&mut self, metadata: JsValue) -> Result<String, JsValue> {
        let metadata: AssetMetadata = serde_wasm_bindgen::from_value(metadata)?;
        let mut engine = self.inner.lock().unwrap();
        match engine.register_asset(metadata) {
            Ok(id) => Ok(id),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_asset(&self, asset_id: &str) -> Result<JsValue, JsValue> {
        let engine = self.inner.lock().unwrap();
        match engine.get_asset(asset_id) {
            Some(asset) => Ok(serde_wasm_bindgen::to_value(&asset).unwrap()),
            None => Err(JsValue::from_str("Asset not found")),
        }
    }

    #[wasm_bindgen]
    pub fn get_all_assets(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.get_all_assets()).unwrap()
    }

    #[wasm_bindgen]
    pub fn load_asset(&mut self, asset_id: &str) -> Result<(), JsValue> {
        let mut engine = self.inner.lock().unwrap();
        match engine.load_asset(asset_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn unload_asset(&mut self, asset_id: &str) -> Result<(), JsValue> {
        let mut engine = self.inner.lock().unwrap();
        match engine.unload_asset(asset_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn create_bundle(&mut self, bundle: JsValue) -> Result<String, JsValue> {
        let bundle: AssetBundle = serde_wasm_bindgen::from_value(bundle)?;
        let mut engine = self.inner.lock().unwrap();
        match engine.create_bundle(bundle) {
            Ok(id) => Ok(id),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn load_bundle(&mut self, bundle_id: &str) -> Result<(), JsValue> {
        let mut engine = self.inner.lock().unwrap();
        match engine.load_bundle(bundle_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn validate_asset(&mut self, asset_id: &str, level: JsValue) -> Result<JsValue, JsValue> {
        let level: AssetValidationLevel = serde_wasm_bindgen::from_value(level)?;
        let mut engine = self.inner.lock().unwrap();
        match engine.validate_asset(asset_id, level) {
            Ok(result) => Ok(serde_wasm_bindgen::to_value(&result).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn optimize_asset(&mut self, asset_id: &str) -> Result<JsValue, JsValue> {
        let mut engine = self.inner.lock().unwrap();
        match engine.optimize_asset(asset_id) {
            Ok(result) => Ok(serde_wasm_bindgen::to_value(&result).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn add_hot_reload_event(&mut self, event: JsValue) {
        let event: AssetHotReloadEvent = serde_wasm_bindgen::from_value(event).unwrap();
        self.inner.lock().unwrap().add_hot_reload_event(event);
    }

    #[wasm_bindgen]
    pub fn get_hot_reload_events(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.get_hot_reload_events()).unwrap()
    }

    #[wasm_bindgen]
    pub fn search_marketplace(&self, query: &str, category: Option<String>) -> JsValue {
        let engine = self.inner.lock().unwrap();
        let cat = category.as_deref();
        serde_wasm_bindgen::to_value(&engine.search_marketplace(query, cat)).unwrap()
    }

    #[wasm_bindgen]
    pub fn analyze_asset_usage(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.analyze_asset_usage()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_unused_assets(&self) -> JsValue {
        let engine = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&engine.get_unused_assets()).unwrap()
    }

    #[wasm_bindgen]
    pub fn clear_cache(&mut self) {
        self.inner.lock().unwrap().clear_cache();
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_asset_pipeline_config() -> JsValue {
    let config = AssetPipelineConfig {
        enable_hot_reload: true,
        enable_compression: true,
        enable_validation: true,
        enable_optimization: true,
        enable_bundling: true,
        enable_dependency_tracking: true,
        enable_versioning: true,
        enable_marketplace: false,
        hot_reload_interval: 1000,
        compression_level: 6,
        validation_level: AssetValidationLevel::Basic,
        max_asset_size: 100 * 1024 * 1024, // 100MB
        cache_size: 1024 * 1024 * 1024, // 1GB
        parallel_loading: true,
        streaming_buffer_size: 1024 * 1024, // 1MB
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_development_config() -> JsValue {
    let config = AssetPipelineConfig {
        enable_hot_reload: true,
        enable_compression: false,
        enable_validation: true,
        validation_level: AssetValidationLevel::Strict,
        enable_optimization: false,
        enable_bundling: false,
        enable_dependency_tracking: true,
        enable_versioning: true,
        enable_marketplace: false,
        hot_reload_interval: 500,
        compression_level: 0,
        max_asset_size: 500 * 1024 * 1024, // 500MB
        cache_size: 2 * 1024 * 1024 * 1024, // 2GB
        parallel_loading: true,
        streaming_buffer_size: 2 * 1024 * 1024, // 2MB
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_production_config() -> JsValue {
    let config = AssetPipelineConfig {
        enable_hot_reload: false,
        enable_compression: true,
        enable_validation: true,
        validation_level: AssetValidationLevel::Basic,
        enable_optimization: true,
        enable_bundling: true,
        enable_dependency_tracking: true,
        enable_versioning: true,
        enable_marketplace: true,
        hot_reload_interval: 0,
        compression_level: 9,
        max_asset_size: 50 * 1024 * 1024, // 50MB
        cache_size: 512 * 1024 * 1024, // 512MB
        parallel_loading: true,
        streaming_buffer_size: 512 * 1024, // 512KB
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_mobile_config() -> JsValue {
    let config = AssetPipelineConfig {
        enable_hot_reload: false,
        enable_compression: true,
        enable_validation: true,
        enable_optimization: true,
        enable_bundling: true,
        enable_dependency_tracking: true,
        enable_versioning: true,
        enable_marketplace: false,
        hot_reload_interval: 0,
        compression_level: 9,
        validation_level: AssetValidationLevel::Strict,
        max_asset_size: 20 * 1024 * 1024, // 20MB
        cache_size: 256 * 1024 * 1024, // 256MB
        parallel_loading: false,
        streaming_buffer_size: 256 * 1024, // 256KB
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

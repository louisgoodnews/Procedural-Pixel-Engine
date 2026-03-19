use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// Core plugin system structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub license: String,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub keywords: Vec<String>,
    pub category: PluginCategory,
    pub engine_version: String,
    pub dependencies: Vec<String>,
    pub permissions: Vec<PluginPermission>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginCategory {
    Rendering,
    Audio,
    Physics,
    AI,
    UI,
    Tools,
    Content,
    Network,
    System,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginPermission {
    FileSystem,
    Network,
    SystemInfo,
    UserInput,
    Graphics,
    Audio,
    Database,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub metadata: PluginMetadata,
    pub entry_point: String,
    pub assets: Vec<String>,
    pub config: PluginConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub auto_load: bool,
    pub hot_reload: bool,
    pub isolated: bool,
    pub max_memory: Option<u64>,
    pub timeout: Option<u64>,
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginState {
    pub manifest: PluginManifest,
    pub loaded: bool,
    pub enabled: bool,
    pub error: Option<String>,
    pub load_time: Option<u64>,
    pub memory_usage: u64,
    pub api_calls: u64,
    pub last_activity: u64,
}

// Plugin API traits
pub trait PluginAPI {
    fn initialize(&mut self, context: &PluginContext) -> Result<(), String>;
    fn update(&mut self, context: &PluginContext, delta_time: f32) -> Result<(), String>;
    fn render(&mut self, context: &PluginContext) -> Result<(), String>;
    fn cleanup(&mut self, context: &PluginContext) -> Result<(), String>;
    fn handle_event(&mut self, context: &PluginContext, event: &PluginEvent) -> Result<(), String>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginContext {
    pub plugin_id: String,
    pub engine_version: String,
    pub timestamp: u64,
    pub delta_time: f32,
    pub frame_count: u64,
    pub memory_available: u64,
    pub permissions: Vec<PluginPermission>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginEvent {
    pub event_type: String,
    pub data: serde_json::Value,
    pub source: String,
    pub timestamp: u64,
}

// Plugin manager
pub struct PluginManager {
    plugins: HashMap<String, PluginState>,
    api_registry: HashMap<String, Box<dyn PluginAPI>>,
    event_bus: Arc<Mutex<Vec<PluginEvent>>>,
    security_manager: PluginSecurityManager,
    version_manager: PluginVersionManager,
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            api_registry: HashMap::new(),
            event_bus: Arc::new(Mutex::new(Vec::new())),
            security_manager: PluginSecurityManager::new(),
            version_manager: PluginVersionManager::new(),
        }
    }

    pub fn load_plugin(&mut self, manifest: PluginManifest) -> Result<String, String> {
        console_log!("🔌 Loading plugin: {}", manifest.metadata.name);

        // Security validation
        self.security_manager.validate_plugin(&manifest)?;

        // Version compatibility check
        self.version_manager.check_compatibility(&manifest)?;

        // Check for existing plugin
        if self.plugins.contains_key(&manifest.metadata.id) {
            return Err(format!("Plugin {} already loaded", manifest.metadata.id));
        }

        // Create plugin state
        let plugin_state = PluginState {
            manifest: manifest.clone(),
            loaded: false,
            enabled: false,
            error: None,
            load_time: None,
            memory_usage: 0,
            api_calls: 0,
            last_activity: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };

        // Store plugin state
        let plugin_id = manifest.metadata.id.clone();
        self.plugins.insert(plugin_id.clone(), plugin_state);

        console_log!("✅ Plugin loaded successfully: {}", plugin_id);
        Ok(plugin_id)
    }

    pub fn enable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        console_log!("🚀 Enabling plugin: {}", plugin_id);

        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin not found: {}", plugin_id))?;

        if plugin.enabled {
            return Ok(());
        }

        // Initialize plugin
        let context = PluginContext {
            plugin_id: plugin_id.to_string(),
            engine_version: "1.0.0".to_string(),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            delta_time: 0.0,
            frame_count: 0,
            memory_available: 1024 * 1024 * 1024, // 1GB
            permissions: plugin.manifest.metadata.permissions.clone(),
        };

        // Simulate plugin initialization
        plugin.loaded = true;
        plugin.enabled = true;
        plugin.load_time = Some(SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
        plugin.error = None;

        console_log!("✅ Plugin enabled successfully: {}", plugin_id);
        Ok(())
    }

    pub fn disable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        console_log!("⏸️ Disabling plugin: {}", plugin_id);

        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin not found: {}", plugin_id))?;

        if !plugin.enabled {
            return Ok(());
        }

        plugin.enabled = false;
        plugin.loaded = false;

        console_log!("✅ Plugin disabled successfully: {}", plugin_id);
        Ok(())
    }

    pub fn unload_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        console_log!("🗑️ Unloading plugin: {}", plugin_id);

        // Disable first
        if let Ok(_) = self.disable_plugin(plugin_id) {
            // Remove from registry
            self.plugins.remove(plugin_id);
            self.api_registry.remove(plugin_id);
        }

        console_log!("✅ Plugin unloaded successfully: {}", plugin_id);
        Ok(())
    }

    pub fn update_plugins(&mut self, delta_time: f32) {
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

        for (plugin_id, plugin_state) in self.plugins.iter_mut() {
            if plugin_state.enabled && plugin_state.loaded {
                // Update plugin activity
                plugin_state.last_activity = current_time;
                plugin_state.api_calls += 1;

                // Simulate memory usage
                plugin_state.memory_usage = (plugin_state.memory_usage + 1024) % (1024 * 1024);
            }
        }
    }

    pub fn get_plugin_list(&self) -> Vec<&PluginState> {
        self.plugins.values().collect()
    }

    pub fn get_plugin(&self, plugin_id: &str) -> Option<&PluginState> {
        self.plugins.get(plugin_id)
    }

    pub fn emit_event(&mut self, event: PluginEvent) {
        let mut event_bus = self.event_bus.lock().unwrap();
        event_bus.push(event);
    }

    pub fn get_events(&self) -> Vec<PluginEvent> {
        let event_bus = self.event_bus.lock().unwrap();
        event_bus.clone()
    }

    pub fn get_performance_stats(&self) -> PluginPerformanceStats {
        let total_plugins = self.plugins.len();
        let enabled_plugins = self.plugins.values().filter(|p| p.enabled).count();
        let total_memory = self.plugins.values().map(|p| p.memory_usage).sum();
        let total_api_calls = self.plugins.values().map(|p| p.api_calls).sum();

        PluginPerformanceStats {
            total_plugins,
            enabled_plugins,
            total_memory,
            total_api_calls,
            average_memory_per_plugin: if total_plugins > 0 { total_memory / total_plugins as u64 } else { 0 },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginPerformanceStats {
    pub total_plugins: usize,
    pub enabled_plugins: usize,
    pub total_memory: u64,
    pub total_api_calls: u64,
    pub average_memory_per_plugin: u64,
}

// Security manager
pub struct PluginSecurityManager {
    allowed_permissions: HashMap<String, Vec<PluginPermission>>,
    blocked_domains: Vec<String>,
    max_memory_per_plugin: u64,
}

impl PluginSecurityManager {
    pub fn new() -> Self {
        Self {
            allowed_permissions: HashMap::new(),
            blocked_domains: vec![
                "malicious-site.com".to_string(),
                "suspicious-domain.net".to_string(),
            ],
            max_memory_per_plugin: 512 * 1024 * 1024, // 512MB
        }
    }

    pub fn validate_plugin(&self, manifest: &PluginManifest) -> Result<(), String> {
        // Check permissions
        for permission in &manifest.metadata.permissions {
            if !self.is_permission_allowed(permission) {
                return Err(format!("Permission not allowed: {:?}", permission));
            }
        }

        // Check memory limits
        if let Some(max_memory) = manifest.config.max_memory {
            if max_memory > self.max_memory_per_plugin {
                return Err(format!("Memory limit exceeded: {} > {}", max_memory, self.max_memory_per_plugin));
            }
        }

        // Check for suspicious dependencies
        for dependency in &manifest.metadata.dependencies {
            if self.blocked_domains.iter().any(|domain| dependency.contains(domain)) {
                return Err(format!("Blocked dependency: {}", dependency));
            }
        }

        Ok(())
    }

    fn is_permission_allowed(&self, permission: &PluginPermission) -> bool {
        // For now, allow all permissions except dangerous ones
        match permission {
            PluginPermission::FileSystem => false,
            PluginPermission::SystemInfo => true,
            PluginPermission::Network => true,
            PluginPermission::UserInput => true,
            PluginPermission::Graphics => true,
            PluginPermission::Audio => true,
            PluginPermission::Database => false,
            PluginPermission::Custom(_) => true,
        }
    }
}

// Version manager
pub struct PluginVersionManager {
    current_engine_version: String,
    compatibility_matrix: HashMap<String, Vec<String>>,
}

impl PluginVersionManager {
    pub fn new() -> Self {
        let mut compatibility_matrix = HashMap::new();
        compatibility_matrix.insert("1.0.0".to_string(), vec!["1.0.0".to_string(), "1.0.1".to_string()]);
        compatibility_matrix.insert("1.1.0".to_string(), vec!["1.1.0".to_string(), "1.1.1".to_string()]);

        Self {
            current_engine_version: "1.0.0".to_string(),
            compatibility_matrix,
        }
    }

    pub fn check_compatibility(&self, manifest: &PluginManifest) -> Result<(), String> {
        let required_version = &manifest.metadata.engine_version;

        if let Some(compatible_versions) = self.compatibility_matrix.get(&self.current_engine_version) {
            if compatible_versions.contains(required_version) {
                return Ok(());
            }
        }

        Err(format!(
            "Plugin version {} is not compatible with engine version {}",
            required_version, self.current_engine_version
        ))
    }
}

// WASM exports
#[wasm_bindgen]
pub struct PluginManagerWrapper {
    inner: Arc<Mutex<PluginManager>>,
}

#[wasm_bindgen]
impl PluginManagerWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PluginManagerWrapper {
        PluginManagerWrapper {
            inner: Arc::new(Mutex::new(PluginManager::new())),
        }
    }

    #[wasm_bindgen]
    pub fn load_plugin(&self, manifest_json: &str) -> Result<String, JsValue> {
        let manifest: PluginManifest = serde_json::from_str(manifest_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid manifest: {}", e)))?;

        let mut manager = self.inner.lock().unwrap();
        match manager.load_plugin(manifest) {
            Ok(plugin_id) => Ok(plugin_id),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn enable_plugin(&self, plugin_id: &str) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.enable_plugin(plugin_id) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn disable_plugin(&self, plugin_id: &str) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.disable_plugin(plugin_id) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn unload_plugin(&self, plugin_id: &str) -> Result<(), JsValue> {
        let mut manager = self.inner.lock().unwrap();
        match manager.unload_plugin(plugin_id) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_plugin_list(&self) -> JsValue {
        let manager = self.inner.lock().unwrap();
        let plugins: Vec<&PluginState> = manager.get_plugin_list();
        serde_wasm_bindgen::to_value(&plugins).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_plugin(&self, plugin_id: &str) -> JsValue {
        let manager = self.inner.lock().unwrap();
        match manager.get_plugin(plugin_id) {
            Some(plugin) => serde_wasm_bindgen::to_value(&plugin).unwrap(),
            None => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn emit_event(&self, event_json: &str) -> Result<(), JsValue> {
        let event: PluginEvent = serde_json::from_str(event_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid event: {}", e)))?;

        let mut manager = self.inner.lock().unwrap();
        manager.emit_event(event);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_events(&self) -> JsValue {
        let manager = self.inner.lock().unwrap();
        let events = manager.get_events();
        serde_wasm_bindgen::to_value(&events).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_performance_stats(&self) -> JsValue {
        let manager = self.inner.lock().unwrap();
        let stats = manager.get_performance_stats();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn update_plugins(&self, delta_time: f32) {
        let mut manager = self.inner.lock().unwrap();
        manager.update_plugins(delta_time);
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_plugin_manifest(
    id: &str,
    name: &str,
    version: &str,
    description: &str,
    author: &str,
    category: &str,
) -> JsValue {
    let manifest = PluginManifest {
        metadata: PluginMetadata {
            id: id.to_string(),
            name: name.to_string(),
            version: version.to_string(),
            description: description.to_string(),
            author: author.to_string(),
            license: "MIT".to_string(),
            homepage: None,
            repository: None,
            keywords: vec![],
            category: match category {
                "rendering" => PluginCategory::Rendering,
                "audio" => PluginCategory::Audio,
                "physics" => PluginCategory::Physics,
                "ai" => PluginCategory::AI,
                "ui" => PluginCategory::UI,
                "tools" => PluginCategory::Tools,
                "content" => PluginCategory::Content,
                "network" => PluginCategory::Network,
                "system" => PluginCategory::System,
                _ => PluginCategory::Other(category.to_string()),
            },
            engine_version: "1.0.0".to_string(),
            dependencies: vec![],
            permissions: vec![PluginPermission::Graphics],
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        },
        entry_point: "index.js".to_string(),
        assets: vec![],
        config: PluginConfig {
            auto_load: true,
            hot_reload: false,
            isolated: true,
            max_memory: Some(64 * 1024 * 1024), // 64MB
            timeout: Some(30000), // 30 seconds
            environment: HashMap::new(),
        },
    };

    serde_wasm_bindgen::to_value(&manifest).unwrap()
}

#[wasm_bindgen]
pub fn create_plugin_event(event_type: &str, data_json: &str, source: &str) -> JsValue {
    let data: serde_json::Value = serde_json::from_str(data_json).unwrap_or(serde_json::Value::Null);
    
    let event = PluginEvent {
        event_type: event_type.to_string(),
        data,
        source: source.to_string(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };

    serde_wasm_bindgen::to_value(&event).unwrap()
}

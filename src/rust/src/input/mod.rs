use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum InputType {
    Keyboard,
    Mouse,
    Touch,
    Gamepad,
    Motion,
    Voice,
    Gesture,
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum InputAction {
    Press,
    Release,
    Move,
    Scroll,
    Zoom,
    Rotate,
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputEvent {
    pub id: String,
    pub input_type: InputType,
    pub action: InputAction,
    pub timestamp: f64,
    pub position: Option<InputPosition>,
    pub data: Option<InputData>,
    pub device_id: String,
    pub context_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputPosition {
    pub x: f32,
    pub y: f32,
    pub z: Option<f32>,
    pub screen_x: f32,
    pub screen_y: f32,
    pub normalized_x: f32,
    pub normalized_y: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputData {
    pub key_code: Option<u32>,
    pub button: Option<u32>,
    pub modifiers: Vec<String>,
    pub pressure: Option<f32>,
    pub tilt_x: Option<f32>,
    pub tilt_y: Option<f32>,
    pub rotation: Option<f32>,
    pub force: Option<f32>,
    pub custom_data: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputDevice {
    pub id: String,
    pub name: String,
    pub device_type: InputType,
    pub capabilities: Vec<String>,
    pub is_connected: bool,
    pub is_enabled: bool,
    pub sensitivity: f32,
    pub dead_zone: f32,
    pub custom_settings: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputMapping {
    pub id: String,
    pub name: String,
    pub input_type: InputType,
    pub trigger: InputTrigger,
    pub action: MappedAction,
    pub is_active: bool,
    pub priority: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputTrigger {
    pub input_type: InputType,
    pub key_code: Option<u32>,
    pub button: Option<u32>,
    pub gesture_type: Option<String>,
    pub voice_command: Option<String>,
    pub custom_trigger: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct MappedAction {
    pub action_id: String,
    pub action_name: String,
    pub parameters: HashMap<String, String>,
    pub context_filter: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputContext {
    pub id: String,
    pub name: String,
    pub priority: u32,
    pub is_active: bool,
    pub mappings: Vec<String>,
    pub conditions: Vec<ContextCondition>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct ContextCondition {
    pub condition_type: String,
    pub value: String,
    pub operator: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct AccessibilityConfig {
    pub enable_screen_reader: bool,
    pub enable_high_contrast: bool,
    pub enable_large_text: bool,
    pub enable_voice_control: bool,
    pub enable_gesture_control: bool,
    pub enable_switch_control: bool,
    pub announcement_level: u32,
    pub visual_cues: bool,
    pub haptic_feedback: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputConfig {
    pub enable_multitouch: bool,
    pub enable_gestures: bool,
    pub enable_voice_input: bool,
    pub enable_motion_input: bool,
    pub enable_gamepad_support: bool,
    pub max_touch_points: u32,
    pub gesture_sensitivity: f32,
    pub voice_threshold: f32,
    pub motion_threshold: f32,
    pub accessibility: AccessibilityConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct InputStats {
    pub total_events: u64,
    pub events_per_second: f32,
    pub active_devices: u32,
    pub active_contexts: u32,
    pub error_count: u64,
    pub last_activity: f64,
}

pub struct InputManager {
    config: InputConfig,
    devices: HashMap<String, InputDevice>,
    events: Vec<InputEvent>,
    mappings: HashMap<String, InputMapping>,
    contexts: HashMap<String, InputContext>,
    active_context: Option<String>,
    stats: InputStats,
    gesture_recognizer: Option<GestureRecognizer>,
    voice_processor: Option<VoiceProcessor>,
}

impl InputManager {
    pub fn new(config: InputConfig) -> InputManager {
        console_log("🎮 Initializing Input Management System...");
        
        let mut manager = InputManager {
            config: config.clone(),
            devices: HashMap::new(),
            events: Vec::new(),
            mappings: HashMap::new(),
            contexts: HashMap::new(),
            active_context: None,
            stats: InputStats {
                total_events: 0,
                events_per_second: 0.0,
                active_devices: 0,
                active_contexts: 0,
                error_count: 0,
                last_activity: web_sys::window()
                    .unwrap()
                    .performance()
                    .unwrap()
                    .now(),
            },
            gesture_recognizer: None,
            voice_processor: None,
        };
        
        // Initialize subsystems
        if config.enable_gestures {
            manager.gesture_recognizer = Some(GestureRecognizer::new());
        }
        
        if config.enable_voice_input {
            manager.voice_processor = Some(VoiceProcessor::new(config.voice_threshold));
        }
        
        // Initialize default devices
        manager.initialize_default_devices();
        
        // Initialize default mappings
        manager.initialize_default_mappings();
        
        // Initialize default contexts
        manager.initialize_default_contexts();
        
        console_log("✅ Input Management System initialized successfully");
        manager
    }
    
    pub fn update_config(&mut self, config: InputConfig) {
        self.config = config;
    }
    
    pub fn get_config(&self) -> InputConfig {
        self.config.clone()
    }
    
    pub fn get_stats(&self) -> InputStats {
        self.stats.clone()
    }
    
    // Device Management
    fn initialize_default_devices(&mut self) {
        // Add keyboard
        let keyboard = InputDevice {
            id: "keyboard_default".to_string(),
            name: "Default Keyboard".to_string(),
            device_type: InputType::Keyboard,
            capabilities: vec![
                "key_press".to_string(),
                "key_release".to_string(),
                "modifiers".to_string(),
            ],
            is_connected: true,
            is_enabled: true,
            sensitivity: 1.0,
            dead_zone: 0.0,
            custom_settings: HashMap::new(),
        };
        self.devices.insert(keyboard.id.clone(), keyboard);
        
        // Add mouse
        let mouse = InputDevice {
            id: "mouse_default".to_string(),
            name: "Default Mouse".to_string(),
            device_type: InputType::Mouse,
            capabilities: vec![
                "move".to_string(),
                "click".to_string(),
                "scroll".to_string(),
                "drag".to_string(),
            ],
            is_connected: true,
            is_enabled: true,
            sensitivity: 1.0,
            dead_zone: 0.0,
            custom_settings: HashMap::new(),
        };
        self.devices.insert(mouse.id.clone(), mouse);
        
        // Add touch device
        if self.config.enable_multitouch {
            let touch = InputDevice {
                id: "touch_default".to_string(),
                name: "Touch Screen".to_string(),
                device_type: InputType::Touch,
                capabilities: vec![
                    "touch_start".to_string(),
                    "touch_move".to_string(),
                    "touch_end".to_string(),
                    "multi_touch".to_string(),
                ],
                is_connected: true,
                is_enabled: true,
                sensitivity: 1.0,
                dead_zone: 0.0,
                custom_settings: HashMap::new(),
            };
            self.devices.insert(touch.id.clone(), touch);
        }
        
        console_log(&format!("📱 Initialized {} devices", self.devices.len()));
    }
    
    pub fn register_device(&mut self, device: InputDevice) -> Result<(), String> {
        // Validate device
        if device.id.is_empty() || device.name.is_empty() {
            return Err("Device ID and name are required".to_string());
        }
        
        // Check for duplicate ID
        if self.devices.contains_key(&device.id) {
            return Err("Device ID already exists".to_string());
        }
        
        // Add device
        self.devices.insert(device.id.clone(), device.clone());
        
        console_log(&format!("📱 Registered device: {}", device.name));
        Ok(())
    }
    
    pub fn unregister_device(&mut self, device_id: &str) -> Result<(), String> {
        if let Some(device) = self.devices.remove(device_id) {
            console_log(&format!("📱 Unregistered device: {}", device.name));
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }
    
    pub fn get_devices(&self) -> Vec<InputDevice> {
        self.devices.values().cloned().collect()
    }
    
    pub fn get_device(&self, device_id: &str) -> Option<InputDevice> {
        self.devices.get(device_id).cloned()
    }
    
    pub fn enable_device(&mut self, device_id: &str) -> Result<(), String> {
        if let Some(device) = self.devices.get_mut(device_id) {
            device.is_enabled = true;
            console_log(&format!("✅ Enabled device: {}", device.name));
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }
    
    pub fn disable_device(&mut self, device_id: &str) -> Result<(), String> {
        if let Some(device) = self.devices.get_mut(device_id) {
            device.is_enabled = false;
            console_log(&format!("❌ Disabled device: {}", device.name));
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }
    
    // Event Processing
    pub fn process_input_event(&mut self, event: InputEvent) -> Result<Vec<MappedAction>, String> {
        // Validate event
        if !self.validate_event(&event) {
            self.stats.error_count += 1;
            return Err("Invalid input event".to_string());
        }
        
        // Check if device is enabled
        if let Some(device) = self.devices.get(&event.device_id) {
            if !device.is_enabled {
                return Ok(Vec::new());
            }
        } else {
            return Err("Device not found".to_string());
        }
        
        // Store event
        self.events.push(event.clone());
        
        // Update stats
        self.stats.total_events += 1;
        self.stats.last_activity = event.timestamp;
        
        // Process gestures if enabled
        if self.config.enable_gestures {
            if let Some(ref mut recognizer) = self.gesture_recognizer {
                recognizer.process_event(&event);
            }
        }
        
        // Process voice if enabled
        if self.config.enable_voice_input {
            if let Some(ref mut processor) = self.voice_processor {
                processor.process_event(&event);
            }
        }
        
        // Map to actions
        let mapped_actions = self.map_event_to_actions(&event);
        
        console_log(&format!("🎮 Processed input event: {:?} -> {} actions", event.input_type, mapped_actions.len()));
        
        Ok(mapped_actions)
    }
    
    fn validate_event(&self, event: &InputEvent) -> bool {
        // Check required fields
        if event.id.is_empty() || event.device_id.is_empty() || event.context_id.is_empty() {
            return false;
        }
        
        // Check timestamp
        if event.timestamp <= 0.0 {
            return false;
        }
        
        // Check if device exists
        if !self.devices.contains_key(&event.device_id) {
            return false;
        }
        
        // Check if context exists
        if !self.contexts.contains_key(&event.context_id) {
            return false;
        }
        
        true
    }
    
    fn map_event_to_actions(&self, event: &InputEvent) -> Vec<MappedAction> {
        let mut actions = Vec::new();
        
        // Get active context
        let context_id = self.active_context.as_ref().unwrap_or(&event.context_id);
        
        if let Some(context) = self.contexts.get(context_id) {
            // Check context conditions
            if !self.check_context_conditions(&context.conditions) {
                return actions;
            }
            
            // Find matching mappings
            for mapping_id in &context.mappings {
                if let Some(mapping) = self.mappings.get(mapping_id) {
                    if self.mapping_matches_event(mapping, event) {
                        actions.push(mapping.action.clone());
                    }
                }
            }
        }
        
        // Sort by priority
        actions.sort_by(|a, b| b.action_id.cmp(&a.action_id));
        
        actions
    }
    
    fn mapping_matches_event(&self, mapping: &InputMapping, event: &InputEvent) -> bool {
        if !mapping.is_active {
            return false;
        }
        
        if mapping.input_type != event.input_type {
            return false;
        }
        
        // Check trigger conditions
        let trigger = &mapping.trigger;
        
        // Check key code
        if let (Some(trigger_key), Some(event_data)) = (trigger.key_code, &event.data) {
            if let Some(event_key) = event_data.key_code {
                if trigger_key != event_key {
                    return false;
                }
            }
        }
        
        // Check button
        if let (Some(trigger_button), Some(event_data)) = (trigger.button, &event.data) {
            if let Some(event_button) = event_data.button {
                if trigger_button != event_button {
                    return false;
                }
            }
        }
        
        true
    }
    
    fn check_context_conditions(&self, conditions: &[ContextCondition]) -> bool {
        for condition in conditions {
            // Simple condition checking (would be more complex in real implementation)
            match condition.condition_type.as_str() {
                "device_connected" => {
                    let device_id = condition.value.clone();
                    if let Some(device) = self.devices.get(&device_id) {
                        if !device.is_connected {
                            return false;
                        }
                    }
                }
                "device_enabled" => {
                    let device_id = condition.value.clone();
                    if let Some(device) = self.devices.get(&device_id) {
                        if !device.is_enabled {
                            return false;
                        }
                    }
                }
                _ => {}
            }
        }
        
        true
    }
    
    // Mapping Management
    fn initialize_default_mappings(&mut self) {
        // Keyboard mappings
        let keyboard_mapping = InputMapping {
            id: "keyboard_w".to_string(),
            name: "Move Forward".to_string(),
            input_type: InputType::Keyboard,
            trigger: InputTrigger {
                input_type: InputType::Keyboard,
                key_code: Some(87), // W key
                button: None,
                gesture_type: None,
                voice_command: None,
                custom_trigger: None,
            },
            action: MappedAction {
                action_id: "move_forward".to_string(),
                action_name: "Move Forward".to_string(),
                parameters: HashMap::new(),
                context_filter: None,
            },
            is_active: true,
            priority: 1,
        };
        self.mappings.insert(keyboard_mapping.id.clone(), keyboard_mapping);
        
        // Mouse mappings
        let mouse_mapping = InputMapping {
            id: "mouse_click".to_string(),
            name: "Primary Action".to_string(),
            input_type: InputType::Mouse,
            trigger: InputTrigger {
                input_type: InputType::Mouse,
                key_code: None,
                button: Some(0), // Left click
                gesture_type: None,
                voice_command: None,
                custom_trigger: None,
            },
            action: MappedAction {
                action_id: "primary_action".to_string(),
                action_name: "Primary Action".to_string(),
                parameters: HashMap::new(),
                context_filter: None,
            },
            is_active: true,
            priority: 1,
        };
        self.mappings.insert(mouse_mapping.id.clone(), mouse_mapping);
        
        console_log(&format!("🗺️ Initialized {} mappings", self.mappings.len()));
    }
    
    pub fn add_mapping(&mut self, mapping: InputMapping) -> Result<(), String> {
        // Validate mapping
        if mapping.id.is_empty() || mapping.name.is_empty() {
            return Err("Mapping ID and name are required".to_string());
        }
        
        // Add mapping
        self.mappings.insert(mapping.id.clone(), mapping.clone());
        
        console_log(&format!("🗺️ Added mapping: {}", mapping.name));
        Ok(())
    }
    
    pub fn remove_mapping(&mut self, mapping_id: &str) -> Result<(), String> {
        if let Some(mapping) = self.mappings.remove(mapping_id) {
            console_log(&format!("🗺️ Removed mapping: {}", mapping.name));
            Ok(())
        } else {
            Err("Mapping not found".to_string())
        }
    }
    
    pub fn get_mappings(&self) -> Vec<InputMapping> {
        self.mappings.values().cloned().collect()
    }
    
    pub fn enable_mapping(&mut self, mapping_id: &str) -> Result<(), String> {
        if let Some(mapping) = self.mappings.get_mut(mapping_id) {
            mapping.is_active = true;
            console_log(&format!("✅ Enabled mapping: {}", mapping.name));
            Ok(())
        } else {
            Err("Mapping not found".to_string())
        }
    }
    
    pub fn disable_mapping(&mut self, mapping_id: &str) -> Result<(), String> {
        if let Some(mapping) = self.mappings.get_mut(mapping_id) {
            mapping.is_active = false;
            console_log(&format!("❌ Disabled mapping: {}", mapping.name));
            Ok(())
        } else {
            Err("Mapping not found".to_string())
        }
    }
    
    // Context Management
    fn initialize_default_contexts(&mut self) {
        // Game context
        let game_context = InputContext {
            id: "game".to_string(),
            name: "Game".to_string(),
            priority: 1,
            is_active: true,
            mappings: vec![
                "keyboard_w".to_string(),
                "mouse_click".to_string(),
            ],
            conditions: vec![
                ContextCondition {
                    condition_type: "device_enabled".to_string(),
                    value: "keyboard_default".to_string(),
                    operator: "equals".to_string(),
                },
            ],
        };
        self.contexts.insert(game_context.id.clone(), game_context);
        
        // UI context
        let ui_context = InputContext {
            id: "ui".to_string(),
            name: "User Interface".to_string(),
            priority: 2,
            is_active: false,
            mappings: vec![
                "mouse_click".to_string(),
            ],
            conditions: vec![],
        };
        self.contexts.insert(ui_context.id.clone(), ui_context);
        
        // Set active context
        self.active_context = Some("game".to_string());
        
        console_log(&format!("🎭 Initialized {} contexts", self.contexts.len()));
    }
    
    pub fn add_context(&mut self, context: InputContext) -> Result<(), String> {
        // Validate context
        if context.id.is_empty() || context.name.is_empty() {
            return Err("Context ID and name are required".to_string());
        }
        
        // Add context
        self.contexts.insert(context.id.clone(), context.clone());
        
        console_log(&format!("🎭 Added context: {}", context.name));
        Ok(())
    }
    
    pub fn remove_context(&mut self, context_id: &str) -> Result<(), String> {
        if let Some(context) = self.contexts.remove(context_id) {
            // Clear active context if it was removed
            if self.active_context.as_ref().map(|s| s.as_str()) == Some(context_id) {
                self.active_context = None;
            }
            
            console_log(&format!("🎭 Removed context: {}", context.name));
            Ok(())
        } else {
            Err("Context not found".to_string())
        }
    }
    
    pub fn get_contexts(&self) -> Vec<InputContext> {
        self.contexts.values().cloned().collect()
    }
    
    pub fn set_active_context(&mut self, context_id: &str) -> Result<(), String> {
        if !self.contexts.contains_key(context_id) {
            return Err("Context not found".to_string());
        }
        
        self.active_context = Some(context_id.to_string());
        
        if let Some(context) = self.contexts.get(context_id) {
            console_log(&format!("🎭 Set active context: {}", context.name));
        }
        
        Ok(())
    }
    
    pub fn get_active_context(&self) -> Option<String> {
        self.active_context.clone()
    }
    
    // Gesture Recognition
    pub fn recognize_gesture(&mut self, points: Vec<InputPosition>) -> Option<String> {
        if !self.config.enable_gestures {
            return None;
        }
        
        if let Some(ref mut recognizer) = self.gesture_recognizer {
            recognizer.recognize_gesture(points)
        } else {
            None
        }
    }
    
    // Voice Processing
    pub fn process_voice_command(&mut self, audio_data: Vec<f32>) -> Option<String> {
        if !self.config.enable_voice_input {
            return None;
        }
        
        if let Some(ref mut processor) = self.voice_processor {
            processor.process_audio(audio_data)
        } else {
            None
        }
    }
    
    // Accessibility
    pub fn enable_accessibility_features(&mut self) -> Result<(), String> {
        let config = &mut self.config.accessibility;
        
        if config.enable_screen_reader {
            console_log("🔊 Screen reader enabled");
        }
        
        if config.enable_high_contrast {
            console_log("🎨 High contrast mode enabled");
        }
        
        if config.enable_large_text {
            console_log("📝 Large text enabled");
        }
        
        if config.enable_voice_control {
            console_log("🎤 Voice control enabled");
        }
        
        if config.enable_gesture_control {
            console_log("👋 Gesture control enabled");
        }
        
        if config.enable_switch_control {
            console_log("🔄 Switch control enabled");
        }
        
        console_log("♿ Accessibility features enabled");
        Ok(())
    }
    
    pub fn announce_to_screen_reader(&self, message: &str) {
        if self.config.accessibility.enable_screen_reader {
            console_log(&format!("🔊 Screen Reader: {}", message));
            // In real implementation, this would use the screen reader API
        }
    }
    
    pub fn show_visual_cue(&self, cue_type: &str, message: &str) {
        if self.config.accessibility.visual_cues {
            console_log(&format!("👁️ Visual Cue [{}]: {}", cue_type, message));
            // In real implementation, this would show visual indicators
        }
    }
    
    pub fn trigger_haptic_feedback(&self, intensity: f32) {
        if self.config.accessibility.haptic_feedback {
            console_log(&format!("📳 Haptic Feedback: {:.2}", intensity));
            // In real implementation, this would trigger haptic feedback
        }
    }
    
    // Statistics and Monitoring
    pub fn update_stats(&mut self) {
        let now = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        let time_diff = now - self.stats.last_activity;
        
        // Calculate events per second
        if time_diff > 0.0 {
            self.stats.events_per_second = (self.stats.total_events as f64 / (time_diff / 1000.0)) as f32;
        }
        
        // Update active devices count
        self.stats.active_devices = self.devices.values()
            .filter(|d| d.is_connected && d.is_enabled)
            .count() as u32;
        
        // Update active contexts count
        self.stats.active_contexts = self.contexts.values()
            .filter(|c| c.is_active)
            .count() as u32;
    }
    
    pub fn get_input_summary(&mut self) -> String {
        self.update_stats();
        
        format!(
            "🎮 Input Management Summary\n\
             ========================\n\
             Total Events: {}\n\
             Events/Second: {:.2}\n\
             Active Devices: {}\n\
             Active Contexts: {}\n\
             Error Count: {}\n\
             Last Activity: {:.2}s ago\n\
             \n\
             Devices:\n\
             {}\n\
             \n\
             Contexts:\n\
             {}",
            self.stats.total_events,
            self.stats.events_per_second,
            self.stats.active_devices,
            self.stats.active_contexts,
            self.stats.error_count,
            (web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now() - self.stats.last_activity) / 1000.0,
            self.devices.values()
                .map(|d| format!("  - {}: {} ({})", d.name, format!("{:?}", d.device_type), if d.is_enabled { "enabled" } else { "disabled" }))
                .collect::<Vec<_>>()
                .join("\n"),
            self.contexts.values()
                .map(|c| format!("  - {}: {} (priority: {})", c.name, c.id, c.priority))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }
}

// Gesture Recognition
pub struct GestureRecognizer {
    gestures: HashMap<String, GesturePattern>,
}

impl GestureRecognizer {
    pub fn new() -> GestureRecognizer {
        let mut recognizer = GestureRecognizer {
            gestures: HashMap::new(),
        };
        
        // Initialize default gestures
        recognizer.initialize_default_gestures();
        
        recognizer
    }
    
    fn initialize_default_gestures(&mut self) {
        // Swipe gesture
        let swipe_pattern = GesturePattern {
            name: "swipe".to_string(),
            min_points: 2,
            max_points: 10,
            direction_threshold: 0.8,
            distance_threshold: 50.0,
        };
        self.gestures.insert("swipe".to_string(), swipe_pattern);
        
        // Tap gesture
        let tap_pattern = GesturePattern {
            name: "tap".to_string(),
            min_points: 1,
            max_points: 1,
            direction_threshold: 0.0,
            distance_threshold: 10.0,
        };
        self.gestures.insert("tap".to_string(), tap_pattern);
        
        // Pinch gesture
        let pinch_pattern = GesturePattern {
            name: "pinch".to_string(),
            min_points: 2,
            max_points: 2,
            direction_threshold: 0.0,
            distance_threshold: 20.0,
        };
        self.gestures.insert("pinch".to_string(), pinch_pattern);
    }
    
    pub fn process_event(&mut self, event: &InputEvent) {
        // Process touch events for gesture recognition
        if event.input_type == InputType::Touch {
            // In real implementation, this would collect touch points
            // and recognize gestures based on patterns
        }
    }
    
    pub fn recognize_gesture(&mut self, points: Vec<InputPosition>) -> Option<String> {
        if points.len() < 2 {
            return None;
        }
        
        // Simple gesture recognition (would be more sophisticated in real implementation)
        let start_point = &points[0];
        let end_point = &points[points.len() - 1];
        
        let dx = end_point.x - start_point.x;
        let dy = end_point.y - start_point.y;
        let distance = (dx * dx + dy * dy).sqrt();
        
        if distance < 10.0 {
            return Some("tap".to_string());
        } else if distance > 50.0 {
            return Some("swipe".to_string());
        }
        
        None
    }
}

#[derive(Clone)]
struct GesturePattern {
    name: String,
    min_points: usize,
    max_points: usize,
    direction_threshold: f32,
    distance_threshold: f32,
}

// Voice Processing
pub struct VoiceProcessor {
    threshold: f32,
    commands: HashMap<String, VoiceCommand>,
}

impl VoiceProcessor {
    pub fn new(threshold: f32) -> VoiceProcessor {
        let mut processor = VoiceProcessor {
            threshold,
            commands: HashMap::new(),
        };
        
        // Initialize default voice commands
        processor.initialize_default_commands();
        
        processor
    }
    
    fn initialize_default_commands(&mut self) {
        let move_command = VoiceCommand {
            phrase: "move forward".to_string(),
            confidence_threshold: 0.8,
            action_id: "move_forward".to_string(),
        };
        self.commands.insert("move forward".to_string(), move_command);
        
        let stop_command = VoiceCommand {
            phrase: "stop".to_string(),
            confidence_threshold: 0.9,
            action_id: "stop".to_string(),
        };
        self.commands.insert("stop".to_string(), stop_command);
    }
    
    pub fn process_event(&mut self, event: &InputEvent) {
        // Process audio events for voice recognition
        if event.input_type == InputType::Voice {
            // In real implementation, this would process audio data
        }
    }
    
    pub fn process_audio(&mut self, audio_data: Vec<f32>) -> Option<String> {
        // Simple voice processing (would use actual speech recognition in real implementation)
        let average_volume = audio_data.iter().map(|&x| x.abs()).sum::<f32>() / audio_data.len() as f32;
        
        if average_volume > self.threshold {
            // Simulate voice recognition
            return Some("move forward".to_string());
        }
        
        None
    }
}

#[derive(Clone)]
struct VoiceCommand {
    phrase: String,
    confidence_threshold: f32,
    action_id: String,
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct InputManagerExport {
    inner: InputManager,
}

#[wasm_bindgen]
impl InputManagerExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> InputManagerExport {
        let config = serde_wasm_bindgen::from_value::<InputConfig>(config).unwrap();
        console_log("🦀 Input Manager initialized");
        InputManagerExport {
            inner: InputManager::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(input_config) = serde_wasm_bindgen::from_value::<InputConfig>(config) {
            self.inner.update_config(input_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_input_summary(&mut self) -> String {
        self.inner.get_input_summary()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let stats = self.inner.get_stats();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn enable_accessibility_features(&mut self) -> JsValue {
        match self.inner.enable_accessibility_features() {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn announce_to_screen_reader(&self, message: &str) {
        self.inner.announce_to_screen_reader(message);
    }

    #[wasm_bindgen]
    pub fn show_visual_cue(&self, cue_type: &str, message: &str) {
        self.inner.show_visual_cue(cue_type, message);
    }

    #[wasm_bindgen]
    pub fn trigger_haptic_feedback(&self, intensity: f32) {
        self.inner.trigger_haptic_feedback(intensity);
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_input_config(
    enable_multitouch: bool,
    enable_gestures: bool,
    enable_voice_input: bool,
    enable_motion_input: bool,
    enable_gamepad_support: bool,
    max_touch_points: u32,
    gesture_sensitivity: f32,
    voice_threshold: f32,
    motion_threshold: f32,
    enable_screen_reader: bool,
    enable_high_contrast: bool,
    enable_large_text: bool,
    enable_voice_control: bool,
    enable_gesture_control: bool,
    enable_switch_control: bool,
    announcement_level: u32,
    visual_cues: bool,
    haptic_feedback: bool
) -> JsValue {
    let config = InputConfig {
        enable_multitouch,
        enable_gestures,
        enable_voice_input,
        enable_motion_input,
        enable_gamepad_support,
        max_touch_points,
        gesture_sensitivity,
        voice_threshold,
        motion_threshold,
        accessibility: AccessibilityConfig {
            enable_screen_reader,
            enable_high_contrast,
            enable_large_text,
            enable_voice_control,
            enable_gesture_control,
            enable_switch_control,
            announcement_level,
            visual_cues,
            haptic_feedback,
        },
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

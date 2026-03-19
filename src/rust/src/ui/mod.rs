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

// UI system enums and types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UIWidgetType {
    Container,
    Button,
    Label,
    Image,
    TextField,
    TextArea,
    CheckBox,
    RadioButton,
    Slider,
    ProgressBar,
    ListBox,
    ComboBox,
    TabContainer,
    ScrollPane,
    Panel,
    Window,
    Menu,
    MenuItem,
    // AI Editor specific widgets
    AIBehaviorTreeEditor,
    AIAgentEditor,
    AIBehaviorEditor,
    AIStateEditor,
    AIDebugger,
    AIVisualizer,
    // World Editor widget types and events
    WorldEditor,
    WorldViewport,
    WorldChunkEditor,
    WorldObjectEditor,
    WorldTerrainEditor,
    WorldProperties,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UILayoutType {
    Absolute,
    Vertical,
    Horizontal,
    Grid,
    Flex,
    Relative,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UIEventType {
    Click,
    DoubleClick,
    MouseDown,
    MouseUp,
    MouseMove,
    MouseEnter,
    MouseLeave,
    KeyDown,
    KeyUp,
    Focus,
    Blur,
    Change,
    Submit,
    Resize,
    Scroll,
    TouchStart,
    TouchMove,
    TouchEnd,
    // AI Editor specific events
    AIAgentCreate,
    AIAgentDelete,
    AIBehaviorCreate,
    AIBehaviorDelete,
    AIBehaviorUpdate,
    // World Editor specific events
    WorldCreate,
    WorldLoad,
    WorldSave,
    WorldExport,
    WorldImport,
    WorldChunkCreate,
    WorldChunkDelete,
    WorldObjectCreate,
    WorldObjectDelete,
    WorldObjectUpdate,
    WorldTerrainModify,
    WorldPropertiesUpdate,
    AIBehaviorTreeEdit,
    AIStateChange,
    AIDebugStart,
    AIDebugStop,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UIAnimationType {
    Fade,
    Slide,
    Scale,
    Rotate,
    Bounce,
    Elastic,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum UIThemeType {
    Default,
    Dark,
    Light,
    Custom,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIWidget {
    pub id: String,
    pub widget_type: UIWidgetType,
    pub name: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub visible: bool,
    pub enabled: bool,
    pub focused: bool,
    pub parent_id: Option<String>,
    pub children: Vec<String>,
    pub style: UIStyle,
    pub layout: UILayout,
    pub events: Vec<UIEvent>,
    pub animations: Vec<UIAnimation>,
    pub accessibility: UIAccessibility,
    pub custom_properties: HashMap<String, String>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIStyle {
    pub background_color: String,
    pub border_color: String,
    pub border_width: f32,
    pub border_radius: f32,
    pub padding: UIPadding,
    pub margin: UIMargin,
    pub font: UIFont,
    pub text_color: String,
    pub text_align: UITextAlignment,
    pub shadow: UIShadow,
    pub opacity: f32,
    pub transform: UITransform,
    pub z_index: i32,
    pub cursor: UICursor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIPadding {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIMargin {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIFont {
    pub family: String,
    pub size: f32,
    pub weight: String,
    pub style: String,
    pub line_height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UITextAlignment {
    pub horizontal: String,
    pub vertical: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIShadow {
    pub color: String,
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur: f32,
    pub spread: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UITransform {
    pub translate_x: f32,
    pub translate_y: f32,
    pub scale_x: f32,
    pub scale_y: f32,
    pub rotation: f32,
    pub skew_x: f32,
    pub skew_y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UICursor {
    pub cursor_type: String,
    pub hot_spot_x: f32,
    pub hot_spot_y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UILayout {
    pub layout_type: UILayoutType,
    pub spacing: f32,
    pub alignment: String,
    pub wrap: bool,
    pub scroll_x: bool,
    pub scroll_y: bool,
    pub grid_columns: u32,
    pub grid_rows: u32,
    pub flex_direction: String,
    pub flex_wrap: String,
    pub flex_justify_content: String,
    pub flex_align_items: String,
    pub flex_align_content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIEvent {
    pub event_type: UIEventType,
    pub target_id: String,
    pub timestamp: u64,
    pub mouse_x: f32,
    pub mouse_y: f32,
    pub key_code: u32,
    pub key_modifiers: Vec<String>,
    pub touch_points: Vec<UITouchPoint>,
    pub custom_data: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UITouchPoint {
    pub id: u32,
    pub x: f32,
    pub y: f32,
    pub pressure: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIAnimation {
    pub id: String,
    pub animation_type: UIAnimationType,
    pub duration: f32,
    pub delay: f32,
    pub easing: String,
    pub repeat: bool,
    pub auto_reverse: bool,
    pub from_state: UIAnimationState,
    pub to_state: UIAnimationState,
    pub current_time: f32,
    pub is_playing: bool,
    pub is_paused: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIAnimationState {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub opacity: f32,
    pub rotation: f32,
    pub scale_x: f32,
    pub scale_y: f32,
    pub background_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIAccessibility {
    pub accessible: bool,
    pub label: String,
    pub description: String,
    pub role: String,
    pub tab_index: i32,
    pub aria_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UITheme {
    pub id: String,
    pub name: String,
    pub theme_type: UIThemeType,
    pub colors: HashMap<String, String>,
    pub fonts: HashMap<String, UIFont>,
    pub sizes: HashMap<String, f32>,
    pub spacing: HashMap<String, f32>,
    pub animations: HashMap<String, UIAnimationTemplate>,
    pub custom_properties: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIAnimationTemplate {
    pub name: String,
    pub animation_type: UIAnimationType,
    pub duration: f32,
    pub easing: String,
    pub keyframes: Vec<UIKeyframe>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIKeyframe {
    pub time: f32,
    pub properties: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIConfig {
    pub enable_animations: bool,
    pub enable_accessibility: bool,
    pub default_theme: String,
    pub auto_layout: bool,
    pub pixel_perfect: bool,
    pub retina_display: bool,
    pub touch_support: bool,
    pub keyboard_support: bool,
    pub mouse_support: bool,
    pub debug_mode: bool,
    pub max_widgets: u32,
    pub event_queue_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIStats {
    pub total_widgets: u32,
    pub visible_widgets: u32,
    pub enabled_widgets: u32,
    pub active_animations: u32,
    pub pending_events: u32,
    pub processed_events: u32,
    pub render_time: f64,
    pub update_time: f64,
    pub layout_time: f64,
    pub event_time: f64,
    pub memory_usage: u64,
    pub last_update: u64,
}

// Main UI system engine
pub struct UISystem {
    config: UIConfig,
    widgets: HashMap<String, UIWidget>,
    themes: HashMap<String, UITheme>,
    current_theme: String,
    focused_widget: Option<String>,
    event_queue: Vec<UIEvent>,
    stats: UIStats,
    animation_time: f32,
    last_event_time: u64,
}

impl UISystem {
    pub fn new(config: UIConfig) -> Self {
        console_log!("🎨 Initializing UI System");
        
        let mut system = Self {
            config,
            widgets: HashMap::new(),
            themes: HashMap::new(),
            current_theme: "default".to_string(),
            focused_widget: None,
            event_queue: Vec::new(),
            stats: UIStats {
                total_widgets: 0,
                visible_widgets: 0,
                enabled_widgets: 0,
                active_animations: 0,
                pending_events: 0,
                processed_events: 0,
                render_time: 0.0,
                update_time: 0.0,
                layout_time: 0.0,
                event_time: 0.0,
                memory_usage: 0,
                last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            },
            animation_time: 0.0,
            last_event_time: 0,
        };
        
        // Initialize default theme
        system.initialize_default_themes();
        
        system
    }

    // Configuration management
    pub fn update_config(&mut self, config: UIConfig) {
        self.config = config;
        console_log!("⚙️ UI System configuration updated");
    }

    pub fn get_config(&self) -> UIConfig {
        self.config.clone()
    }

    // Statistics
    pub fn get_stats(&self) -> UIStats {
        self.stats.clone()
    }

    pub fn get_ui_system_summary(&self) -> String {
        format!(
            "🎨 UI System Summary:\n\
            Total Widgets: {}\n\
            Visible Widgets: {}\n\
            Enabled Widgets: {}\n\
            Active Animations: {}\n\
            Pending Events: {}\n\
            Processed Events: {}\n\
            Render Time: {:.2}ms\n\
            Update Time: {:.2}ms\n\
            Layout Time: {:.2}ms\n\
            Event Time: {:.2}ms\n\
            Memory Usage: {} bytes\n\
            Last Update: {}",
            self.stats.total_widgets,
            self.stats.visible_widgets,
            self.stats.enabled_widgets,
            self.stats.active_animations,
            self.stats.pending_events,
            self.stats.processed_events,
            self.stats.render_time,
            self.stats.update_time,
            self.stats.layout_time,
            self.stats.event_time,
            self.stats.memory_usage,
            self.stats.last_update
        )
    }

    // Theme management
    pub fn add_theme(&mut self, theme: UITheme) -> Result<(), String> {
        if self.themes.contains_key(&theme.id) {
            return Err("Theme already exists".to_string());
        }
        
        let theme_id = theme.id.clone();
        self.themes.insert(theme_id.clone(), theme);
        console_log!("🎨 Added theme: {}", theme_id);
        Ok(())
    }

    pub fn remove_theme(&mut self, theme_id: &str) -> Result<(), String> {
        if theme_id == self.current_theme {
            return Err("Cannot remove current theme".to_string());
        }
        
        if !self.themes.contains_key(theme_id) {
            return Err("Theme not found".to_string());
        }
        
        self.themes.remove(theme_id);
        console_log!("🗑️ Removed theme: {}", theme_id);
        Ok(())
    }

    pub fn set_theme(&mut self, theme_id: &str) -> Result<(), String> {
        if !self.themes.contains_key(theme_id) {
            return Err("Theme not found".to_string());
        }
        
        self.current_theme = theme_id.to_string();
        console_log!("🎨 Set theme: {}", theme_id);
        Ok(())
    }

    pub fn get_theme(&self, theme_id: &str) -> Option<UITheme> {
        self.themes.get(theme_id).cloned()
    }

    pub fn get_current_theme(&self) -> UITheme {
        self.themes.get(&self.current_theme).cloned()
            .unwrap_or_else(|| UITheme {
                id: "default".to_string(),
                name: "Default Theme".to_string(),
                theme_type: UIThemeType::Default,
                colors: HashMap::new(),
                fonts: HashMap::new(),
                sizes: HashMap::new(),
                spacing: HashMap::new(),
                animations: HashMap::new(),
                custom_properties: HashMap::new(),
            })
    }

    // Widget management
    pub fn create_widget(&mut self, widget: UIWidget) -> Result<String, String> {
        if self.widgets.len() >= self.config.max_widgets as usize {
            return Err("Maximum widget limit reached".to_string());
        }
        
        if self.widgets.contains_key(&widget.id) {
            return Err("Widget already exists".to_string());
        }
        
        let widget_id = widget.id.clone();
        self.widgets.insert(widget_id.clone(), widget);
        self.stats.total_widgets += 1;
        
        if self.widgets.get(&widget_id).unwrap().visible {
            self.stats.visible_widgets += 1;
        }
        
        if self.widgets.get(&widget_id).unwrap().enabled {
            self.stats.enabled_widgets += 1;
        }
        
        console_log!("🎨 Created widget: {}", widget_id);
        Ok(widget_id)
    }

    pub fn delete_widget(&mut self, widget_id: &str) -> Result<(), String> {
        if let Some(widget) = self.widgets.remove(widget_id) {
            if widget.visible {
                self.stats.visible_widgets -= 1;
            }
            
            if widget.enabled {
                self.stats.enabled_widgets -= 1;
            }
            
            self.stats.total_widgets -= 1;
            
            // Remove from parent's children
            if let Some(parent_id) = &widget.parent_id {
                if let Some(parent) = self.widgets.get_mut(parent_id) {
                    parent.children.retain(|id| id != widget_id);
                }
            }
            
            // Remove children
            for child_id in &widget.children {
                self.delete_widget(child_id);
            }
            
            console_log!("🗑️ Deleted widget: {}", widget_id);
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn get_widget(&self, widget_id: &str) -> Option<UIWidget> {
        self.widgets.get(widget_id).cloned()
    }

    pub fn get_all_widgets(&self) -> Vec<UIWidget> {
        self.widgets.values().cloned().collect()
    }

    pub fn get_widgets_by_type(&self, widget_type: UIWidgetType) -> Vec<UIWidget> {
        self.widgets
            .values()
            .filter(|widget| widget.widget_type == widget_type)
            .cloned()
            .collect()
    }

    pub fn get_visible_widgets(&self) -> Vec<UIWidget> {
        self.widgets
            .values()
            .filter(|widget| widget.visible)
            .cloned()
            .collect()
    }

    // Widget hierarchy
    pub fn add_child(&mut self, parent_id: &str, child_id: &str) -> Result<(), String> {
        // Get current parent info first
        let current_parent_id = if let Some(child) = self.widgets.get(child_id) {
            child.parent_id.clone()
        } else {
            return Err("Child widget not found".to_string());
        };
        
        // Remove from current parent if exists
        if let Some(current_parent_id) = &current_parent_id {
            if let Some(current_parent) = self.widgets.get_mut(current_parent_id) {
                current_parent.children.retain(|id| id != child_id);
            }
        }
        
        // Add to new parent
        if let Some(parent) = self.widgets.get_mut(parent_id) {
            parent.children.push(child_id.to_string());
        } else {
            return Err("Parent widget not found".to_string());
        }
        
        // Update child's parent
        if let Some(child) = self.widgets.get_mut(child_id) {
            child.parent_id = Some(parent_id.to_string());
        }
        
        console_log!("🔗 Added child {} to parent {}", child_id, parent_id);
        Ok(())
    }

    pub fn remove_child(&mut self, parent_id: &str, child_id: &str) -> Result<(), String> {
        if let Some(parent) = self.widgets.get_mut(parent_id) {
            parent.children.retain(|id| id != child_id);
            
            if let Some(child) = self.widgets.get_mut(child_id) {
                child.parent_id = None;
            }
            
            console_log!("🔓 Removed child {} from parent {}", child_id, parent_id);
            Ok(())
        } else {
            Err("Parent widget not found".to_string())
        }
    }

    // Widget properties
    pub fn set_widget_position(&mut self, widget_id: &str, x: f32, y: f32) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            widget.x = x;
            widget.y = y;
            widget.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn set_widget_size(&mut self, widget_id: &str, width: f32, height: f32) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            widget.width = width;
            widget.height = height;
            widget.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn set_widget_visibility(&mut self, widget_id: &str, visible: bool) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            let was_visible = widget.visible;
            widget.visible = visible;
            widget.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            
            if was_visible && !visible {
                self.stats.visible_widgets -= 1;
            } else if !was_visible && visible {
                self.stats.visible_widgets += 1;
            }
            
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn set_widget_enabled(&mut self, widget_id: &str, enabled: bool) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            let was_enabled = widget.enabled;
            widget.enabled = enabled;
            widget.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            
            if was_enabled && !enabled {
                self.stats.enabled_widgets -= 1;
            } else if !was_enabled && enabled {
                self.stats.enabled_widgets += 1;
            }
            
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn set_widget_style(&mut self, widget_id: &str, style: UIStyle) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            widget.style = style;
            widget.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    // Event handling
    pub fn add_event(&mut self, event: UIEvent) {
        if self.event_queue.len() < self.config.event_queue_size as usize {
            self.event_queue.push(event);
            self.stats.pending_events += 1;
        }
    }

    pub fn process_events(&mut self) -> Vec<UIEvent> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        let processed_events: Vec<UIEvent> = self.event_queue.drain(..).collect();
        self.stats.pending_events = 0;
        self.stats.processed_events += processed_events.len() as u32;
        
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.event_time = (end_time - start_time) as f64;
        
        processed_events
    }

    pub fn handle_click_event(&mut self, widget_id: &str, mouse_x: f32, mouse_y: f32) -> Result<(), String> {
        if let Some(widget) = self.widgets.get(widget_id) {
            if !widget.visible || !widget.enabled {
                return Err("Widget not interactive".to_string());
            }
            
            let event = UIEvent {
                event_type: UIEventType::Click,
                target_id: widget_id.to_string(),
                timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                mouse_x,
                mouse_y,
                key_code: 0,
                key_modifiers: Vec::new(),
                touch_points: Vec::new(),
                custom_data: HashMap::new(),
            };
            
            self.add_event(event);
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    // Animation system
    pub fn add_animation(&mut self, widget_id: &str, animation: UIAnimation) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            widget.animations.push(animation);
            self.stats.active_animations += 1;
            console_log!("🎬 Added animation to widget: {}", widget_id);
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn remove_animation(&mut self, widget_id: &str, animation_id: &str) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            let original_count = widget.animations.len();
            widget.animations.retain(|anim| anim.id != animation_id);
            
            if widget.animations.len() < original_count {
                self.stats.active_animations -= 1;
                console_log!("🎬 Removed animation from widget: {}", widget_id);
                Ok(())
            } else {
                Err("Animation not found".to_string())
            }
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn play_animation(&mut self, widget_id: &str, animation_id: &str) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            if let Some(animation) = widget.animations.iter_mut().find(|anim| anim.id == animation_id) {
                animation.is_playing = true;
                animation.is_paused = false;
                animation.current_time = 0.0;
                console_log!("▶️ Playing animation: {} on widget: {}", animation_id, widget_id);
                Ok(())
            } else {
                Err("Animation not found".to_string())
            }
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn pause_animation(&mut self, widget_id: &str, animation_id: &str) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            if let Some(animation) = widget.animations.iter_mut().find(|anim| anim.id == animation_id) {
                animation.is_paused = true;
                console_log!("⏸️ Paused animation: {} on widget: {}", animation_id, widget_id);
                Ok(())
            } else {
                Err("Animation not found".to_string())
            }
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn stop_animation(&mut self, widget_id: &str, animation_id: &str) -> Result<(), String> {
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            if let Some(animation) = widget.animations.iter_mut().find(|anim| anim.id == animation_id) {
                animation.is_playing = false;
                animation.is_paused = false;
                animation.current_time = 0.0;
                console_log!("⏹️ Stopped animation: {} on widget: {}", animation_id, widget_id);
                Ok(())
            } else {
                Err("Animation not found".to_string())
            }
        } else {
            Err("Widget not found".to_string())
        }
    }

    // Layout system
    pub fn update_layout(&mut self) -> Result<(), String> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        if !self.config.auto_layout {
            return Ok(());
        }
        
        // Get root widget IDs (widgets without parents)
        let root_widget_ids: Vec<String> = self.widgets
            .keys()
            .filter(|&id| {
                if let Some(widget) = self.widgets.get(id) {
                    widget.parent_id.is_none()
                } else {
                    false
                }
            })
            .cloned()
            .collect();
        
        // Process each root widget
        for widget_id in root_widget_ids {
            self.update_widget_layout_by_id(&widget_id)?;
        }
        
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.layout_time = (end_time - start_time) as f64;
        
        Ok(())
    }

    fn update_widget_layout_by_id(&mut self, widget_id: &str) -> Result<(), String> {
        let layout_type = if let Some(widget) = self.widgets.get(widget_id) {
            widget.layout.layout_type.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        match layout_type {
            UILayoutType::Absolute => self.update_absolute_layout(widget_id),
            UILayoutType::Vertical => self.update_vertical_layout(widget_id),
            UILayoutType::Horizontal => self.update_horizontal_layout(widget_id),
            UILayoutType::Grid => self.update_grid_layout(widget_id),
            UILayoutType::Flex => self.update_flex_layout(widget_id),
            UILayoutType::Relative => self.update_relative_layout(widget_id),
            UILayoutType::Custom => Ok(()), // Custom layout handled by user
        }
    }

    fn update_absolute_layout(&mut self, widget_id: &str) -> Result<(), String> {
        // Absolute layout - children positioned at their x, y coordinates
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        for child_id in children {
            self.update_widget_layout_by_id(&child_id)?;
        }
        Ok(())
    }

    fn update_vertical_layout(&mut self, widget_id: &str) -> Result<(), String> {
        let (widget_x, widget_y, widget_width, widget_padding_top, widget_padding_left, widget_padding_right, widget_spacing) = {
            if let Some(widget) = self.widgets.get(widget_id) {
                (
                    widget.x,
                    widget.y,
                    widget.width,
                    widget.style.padding.top,
                    widget.style.padding.left,
                    widget.style.padding.right,
                    widget.layout.spacing,
                )
            } else {
                return Err("Widget not found".to_string());
            }
        };
        
        let mut current_y = widget_y + widget_padding_top;
        let available_width = widget_width - widget_padding_left - widget_padding_right;
        
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        for child_id in children {
            if let Some(child) = self.widgets.get_mut(&child_id) {
                child.x = widget_x + widget_padding_left;
                child.y = current_y;
                
                // Set child width to available width if needed
                if child.width <= 0.0 {
                    child.width = available_width;
                }
                
                current_y += child.height + widget_spacing;
            }
            
            self.update_widget_layout_by_id(&child_id)?;
        }
        Ok(())
    }

    fn update_horizontal_layout(&mut self, widget_id: &str) -> Result<(), String> {
        let (widget_x, widget_y, widget_height, widget_padding_top, widget_padding_left, widget_padding_bottom, widget_spacing) = {
            if let Some(widget) = self.widgets.get(widget_id) {
                (
                    widget.x,
                    widget.y,
                    widget.height,
                    widget.style.padding.top,
                    widget.style.padding.left,
                    widget.style.padding.bottom,
                    widget.layout.spacing,
                )
            } else {
                return Err("Widget not found".to_string());
            }
        };
        
        let mut current_x = widget_x + widget_padding_left;
        let available_height = widget_height - widget_padding_top - widget_padding_bottom;
        
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        for child_id in children {
            if let Some(child) = self.widgets.get_mut(&child_id) {
                child.x = current_x;
                child.y = widget_y + widget_padding_top;
                
                // Set child height to available height if needed
                if child.height <= 0.0 {
                    child.height = available_height;
                }
                
                current_x += child.width + widget_spacing;
            }
            
            self.update_widget_layout_by_id(&child_id)?;
        }
        Ok(())
    }

    fn update_grid_layout(&mut self, widget_id: &str) -> Result<(), String> {
        let (cols, rows, widget_x, widget_y, widget_width, widget_height, padding_top, padding_left, padding_right, padding_bottom) = {
            if let Some(widget) = self.widgets.get(widget_id) {
                (
                    widget.layout.grid_columns,
                    widget.layout.grid_rows,
                    widget.x,
                    widget.y,
                    widget.width,
                    widget.height,
                    widget.style.padding.top,
                    widget.style.padding.left,
                    widget.style.padding.right,
                    widget.style.padding.bottom,
                )
            } else {
                return Err("Widget not found".to_string());
            }
        };
        
        let cell_width = (widget_width - padding_left - padding_right) / cols as f32;
        let cell_height = (widget_height - padding_top - padding_bottom) / rows as f32;
        
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        for (index, child_id) in children.iter().enumerate() {
            if let Some(child) = self.widgets.get_mut(child_id) {
                let col = (index as u32) % cols;
                let row = (index as u32) / cols;
                
                child.x = widget_x + padding_left + col as f32 * cell_width;
                child.y = widget_y + padding_top + row as f32 * cell_height;
                child.width = cell_width;
                child.height = cell_height;
            }
            
            self.update_widget_layout_by_id(child_id)?;
        }
        Ok(())
    }

    fn update_flex_layout(&mut self, widget_id: &str) -> Result<(), String> {
        let (is_row, available_space, widget_x, widget_y, padding_top, padding_left, _padding_bottom, spacing) = {
            if let Some(widget) = self.widgets.get(widget_id) {
                let is_row = widget.layout.flex_direction == "row";
                let available_space = if is_row {
                    widget.width - widget.style.padding.left - widget.style.padding.right
                } else {
                    widget.height - widget.style.padding.top - widget.style.padding.bottom
                };
                (
                    is_row,
                    available_space,
                    widget.x,
                    widget.y,
                    widget.style.padding.top,
                    widget.style.padding.left,
                    widget.style.padding.bottom,
                    widget.layout.spacing,
                )
            } else {
                return Err("Widget not found".to_string());
            }
        };
        
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        let child_count = children.len();
        if child_count == 0 {
            return Ok(());
        }
        
        let child_space = available_space / child_count as f32;
        let mut current_pos = if is_row {
            widget_x + padding_left
        } else {
            widget_y + padding_top
        };
        
        for child_id in children {
            if let Some(child) = self.widgets.get_mut(&child_id) {
                if is_row {
                    child.x = current_pos;
                    child.y = widget_y + padding_top;
                    child.width = child_space;
                    current_pos += child_space + spacing;
                } else {
                    child.x = widget_x + padding_left;
                    child.y = current_pos;
                    child.height = child_space;
                    current_pos += child_space + spacing;
                }
            }
            
            self.update_widget_layout_by_id(&child_id)?;
        }
        Ok(())
    }

    fn update_relative_layout(&mut self, widget_id: &str) -> Result<(), String> {
        let (widget_x, widget_y) = {
            if let Some(widget) = self.widgets.get(widget_id) {
                (widget.x, widget.y)
            } else {
                return Err("Widget not found".to_string());
            }
        };
        
        let children = if let Some(widget) = self.widgets.get(widget_id) {
            widget.children.clone()
        } else {
            return Err("Widget not found".to_string());
        };
        
        // Simplified relative layout - similar to absolute but with parent-relative positioning
        for child_id in children {
            if let Some(child) = self.widgets.get_mut(&child_id) {
                // Position relative to parent
                child.x = widget_x + child.x;
                child.y = widget_y + child.y;
            }
            
            self.update_widget_layout_by_id(&child_id)?;
        }
        Ok(())
    }

    // Rendering
    pub fn render(&mut self) -> Result<Vec<UIRenderCommand>, String> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        let mut render_commands = Vec::new();
        
        // Get visible widgets sorted by z-index
        let mut visible_widgets = self.get_visible_widgets();
        visible_widgets.sort_by(|a, b| a.style.z_index.cmp(&b.style.z_index));
        
        for widget in visible_widgets {
            let command = self.create_render_command(&widget)?;
            render_commands.push(command);
        }
        
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.render_time = (end_time - start_time) as f64;
        
        Ok(render_commands)
    }

    fn create_render_command(&self, widget: &UIWidget) -> Result<UIRenderCommand, String> {
        let command = UIRenderCommand {
            widget_id: widget.id.clone(),
            widget_type: widget.widget_type.clone(),
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
            style: widget.style.clone(),
            visible: widget.visible,
            enabled: widget.enabled,
            focused: widget.focused,
            text: self.get_widget_text(widget),
            image_url: self.get_widget_image_url(widget),
            value: self.get_widget_value(widget),
            min_value: self.get_widget_min_value(widget),
            max_value: self.get_widget_max_value(widget),
            step: self.get_widget_step(widget),
            checked: self.get_widget_checked(widget),
            options: self.get_widget_options(widget),
            selected_index: self.get_widget_selected_index(widget),
            progress: self.get_widget_progress(widget),
            children: widget.children.clone(),
        };
        
        Ok(command)
    }

    // Widget-specific helpers
    fn get_widget_text(&self, widget: &UIWidget) -> String {
        widget.custom_properties.get("text").cloned().unwrap_or_default()
    }

    fn get_widget_image_url(&self, widget: &UIWidget) -> String {
        widget.custom_properties.get("image_url").cloned().unwrap_or_default()
    }

    fn get_widget_value(&self, widget: &UIWidget) -> f32 {
        widget.custom_properties
            .get("value")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0)
    }

    fn get_widget_min_value(&self, widget: &UIWidget) -> f32 {
        widget.custom_properties
            .get("min_value")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0)
    }

    fn get_widget_max_value(&self, widget: &UIWidget) -> f32 {
        widget.custom_properties
            .get("max_value")
            .and_then(|s| s.parse().ok())
            .unwrap_or(100.0)
    }

    fn get_widget_step(&self, widget: &UIWidget) -> f32 {
        widget.custom_properties
            .get("step")
            .and_then(|s| s.parse().ok())
            .unwrap_or(1.0)
    }

    fn get_widget_checked(&self, widget: &UIWidget) -> bool {
        widget.custom_properties
            .get("checked")
            .and_then(|s| s.parse().ok())
            .unwrap_or(false)
    }

    fn get_widget_options(&self, widget: &UIWidget) -> Vec<String> {
        widget.custom_properties
            .get("options")
            .map(|s| s.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default()
    }

    fn get_widget_selected_index(&self, widget: &UIWidget) -> u32 {
        widget.custom_properties
            .get("selected_index")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0)
    }

    fn get_widget_progress(&self, widget: &UIWidget) -> f32 {
        widget.custom_properties
            .get("progress")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0)
    }

    // Utility methods
    fn initialize_default_themes(&mut self) {
        // Default theme
        let default_theme = UITheme {
            id: "default".to_string(),
            name: "Default Theme".to_string(),
            theme_type: UIThemeType::Default,
            colors: {
                let mut colors = HashMap::new();
                colors.insert("background".to_string(), "#ffffff".to_string());
                colors.insert("foreground".to_string(), "#000000".to_string());
                colors.insert("primary".to_string(), "#007bff".to_string());
                colors.insert("secondary".to_string(), "#6c757d".to_string());
                colors.insert("success".to_string(), "#28a745".to_string());
                colors.insert("warning".to_string(), "#ffc107".to_string());
                colors.insert("danger".to_string(), "#dc3545".to_string());
                colors.insert("info".to_string(), "#17a2b8".to_string());
                colors.insert("light".to_string(), "#f8f9fa".to_string());
                colors.insert("dark".to_string(), "#343a40".to_string());
                colors
            },
            fonts: {
                let mut fonts = HashMap::new();
                fonts.insert("default".to_string(), UIFont {
                    family: "Arial".to_string(),
                    size: 14.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                });
                fonts.insert("heading".to_string(), UIFont {
                    family: "Arial".to_string(),
                    size: 24.0,
                    weight: "bold".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.2,
                });
                fonts
            },
            sizes: {
                let mut sizes = HashMap::new();
                sizes.insert("small".to_string(), 12.0);
                sizes.insert("medium".to_string(), 14.0);
                sizes.insert("large".to_string(), 18.0);
                sizes.insert("xlarge".to_string(), 24.0);
                sizes
            },
            spacing: {
                let mut spacing = HashMap::new();
                spacing.insert("xs".to_string(), 4.0);
                spacing.insert("sm".to_string(), 8.0);
                spacing.insert("md".to_string(), 16.0);
                spacing.insert("lg".to_string(), 24.0);
                spacing.insert("xl".to_string(), 32.0);
                spacing
            },
            animations: HashMap::new(),
            custom_properties: HashMap::new(),
        };
        
        self.themes.insert("default".to_string(), default_theme);
        
        // Dark theme
        let dark_theme = UITheme {
            id: "dark".to_string(),
            name: "Dark Theme".to_string(),
            theme_type: UIThemeType::Dark,
            colors: {
                let mut colors = HashMap::new();
                colors.insert("background".to_string(), "#1a1a1a".to_string());
                colors.insert("foreground".to_string(), "#ffffff".to_string());
                colors.insert("primary".to_string(), "#0d6efd".to_string());
                colors.insert("secondary".to_string(), "#6c757d".to_string());
                colors.insert("success".to_string(), "#198754".to_string());
                colors.insert("warning".to_string(), "#ffc107".to_string());
                colors.insert("danger".to_string(), "#dc3545".to_string());
                colors.insert("info".to_string(), "#0dcaf0".to_string());
                colors.insert("light".to_string(), "#212529".to_string());
                colors.insert("dark".to_string(), "#000000".to_string());
                colors
            },
            fonts: {
                let mut fonts = HashMap::new();
                fonts.insert("default".to_string(), UIFont {
                    family: "Arial".to_string(),
                    size: 14.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                });
                fonts.insert("heading".to_string(), UIFont {
                    family: "Arial".to_string(),
                    size: 24.0,
                    weight: "bold".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.2,
                });
                fonts
            },
            sizes: {
                let mut sizes = HashMap::new();
                sizes.insert("small".to_string(), 12.0);
                sizes.insert("medium".to_string(), 14.0);
                sizes.insert("large".to_string(), 18.0);
                sizes.insert("xlarge".to_string(), 24.0);
                sizes
            },
            spacing: {
                let mut spacing = HashMap::new();
                spacing.insert("xs".to_string(), 4.0);
                spacing.insert("sm".to_string(), 8.0);
                spacing.insert("md".to_string(), 16.0);
                spacing.insert("lg".to_string(), 24.0);
                spacing.insert("xl".to_string(), 32.0);
                spacing
            },
            animations: HashMap::new(),
            custom_properties: HashMap::new(),
        };
        
        self.themes.insert("dark".to_string(), dark_theme);
    }

    // Focus management
    pub fn set_focus(&mut self, widget_id: &str) -> Result<(), String> {
        // Remove focus from current widget
        if let Some(current_focus) = &self.focused_widget {
            if let Some(widget) = self.widgets.get_mut(current_focus) {
                widget.focused = false;
            }
        }
        
        // Set focus to new widget
        if let Some(widget) = self.widgets.get_mut(widget_id) {
            widget.focused = true;
            self.focused_widget = Some(widget_id.to_string());
            console_log!("🎯 Set focus to widget: {}", widget_id);
            Ok(())
        } else {
            Err("Widget not found".to_string())
        }
    }

    pub fn clear_focus(&mut self) {
        if let Some(current_focus) = &self.focused_widget {
            if let Some(widget) = self.widgets.get_mut(current_focus) {
                widget.focused = false;
            }
        }
        
        self.focused_widget = None;
        console_log!("🎯 Cleared focus");
    }

    pub fn get_focused_widget(&self) -> Option<String> {
        self.focused_widget.clone()
    }

    // Hit testing
    pub fn hit_test(&self, x: f32, y: f32) -> Option<String> {
        // Check widgets in reverse z-index order (top to bottom)
        let mut visible_widgets = self.get_visible_widgets();
        visible_widgets.sort_by(|a, b| b.style.z_index.cmp(&a.style.z_index));
        
        for widget in visible_widgets {
            if x >= widget.x && x <= widget.x + widget.width &&
               y >= widget.y && y <= widget.y + widget.height {
                return Some(widget.id.clone());
            }
        }
        
        None
    }

    // Update loop
    pub fn update(&mut self, delta_time: f32) -> Result<(), String> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        // Update animations
        if self.config.enable_animations {
            self.update_animations(delta_time)?;
        }
        
        // Update layout
        self.update_layout()?;
        
        // Update statistics
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.update_time = (end_time - start_time) as f64;
        self.stats.last_update = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        Ok(())
    }

    fn update_animations(&mut self, delta_time: f32) -> Result<(), String> {
        // Collect all animation updates that need to be applied
        let mut widget_updates = Vec::new();
        
        for (widget_id, widget) in &self.widgets {
            for (animation_index, animation) in widget.animations.iter().enumerate() {
                if animation.is_playing && !animation.is_paused {
                    let new_time = animation.current_time + delta_time;
                    let is_complete = new_time >= animation.duration;
                    let final_time = if is_complete && !animation.repeat {
                        animation.duration
                    } else if is_complete && animation.repeat {
                        0.0
                    } else {
                        new_time
                    };
                    
                    let progress = final_time / animation.duration;
                    let t = self.ease_function(progress, &animation.easing);
                    
                    // Calculate the final widget state
                    let final_x = animation.from_state.x + (animation.to_state.x - animation.from_state.x) * t;
                    let final_y = animation.from_state.y + (animation.to_state.y - animation.from_state.y) * t;
                    let final_width = animation.from_state.width + (animation.to_state.width - animation.from_state.width) * t;
                    let final_height = animation.from_state.height + (animation.to_state.height - animation.from_state.height) * t;
                    let final_opacity = animation.from_state.opacity + (animation.to_state.opacity - animation.from_state.opacity) * t;
                    let final_rotation = animation.from_state.rotation + (animation.to_state.rotation - animation.from_state.rotation) * t;
                    let final_scale_x = animation.from_state.scale_x + (animation.to_state.scale_x - animation.from_state.scale_x) * t;
                    let final_scale_y = animation.from_state.scale_y + (animation.to_state.scale_y - animation.from_state.scale_y) * t;
                    
                    widget_updates.push((
                        widget_id.clone(),
                        animation_index,
                        final_time,
                        is_complete && !animation.repeat,
                        animation.repeat,
                        final_x,
                        final_y,
                        final_width,
                        final_height,
                        final_opacity,
                        final_rotation,
                        final_scale_x,
                        final_scale_y,
                    ));
                }
            }
        }
        
        // Apply all updates
        for (widget_id, animation_index, new_time, is_complete, should_repeat, final_x, final_y, final_width, final_height, final_opacity, final_rotation, final_scale_x, final_scale_y) in widget_updates {
            if let Some(widget) = self.widgets.get_mut(&widget_id) {
                if let Some(animation) = widget.animations.get_mut(animation_index) {
                    animation.current_time = new_time;
                    
                    if is_complete {
                        if should_repeat {
                            animation.current_time = 0.0;
                        } else {
                            animation.is_playing = false;
                        }
                    }
                    
                    // Apply the calculated values to the widget
                    widget.x = final_x;
                    widget.y = final_y;
                    widget.width = final_width;
                    widget.height = final_height;
                    widget.style.opacity = final_opacity;
                    widget.style.transform.rotation = final_rotation;
                    widget.style.transform.scale_x = final_scale_x;
                    widget.style.transform.scale_y = final_scale_y;
                }
            }
        }
        
        Ok(())
    }

    fn apply_animation_to_widget(&self, widget: &mut UIWidget, animation: &UIAnimation, progress: f32) -> Result<(), String> {
        // Simple linear interpolation between from and to states
        let t = self.ease_function(progress, &animation.easing);
        
        widget.x = animation.from_state.x + (animation.to_state.x - animation.from_state.x) * t;
        widget.y = animation.from_state.y + (animation.to_state.y - animation.from_state.y) * t;
        widget.width = animation.from_state.width + (animation.to_state.width - animation.from_state.width) * t;
        widget.height = animation.from_state.height + (animation.to_state.height - animation.from_state.height) * t;
        widget.style.opacity = animation.from_state.opacity + (animation.to_state.opacity - animation.from_state.opacity) * t;
        widget.style.transform.rotation = animation.from_state.rotation + (animation.to_state.rotation - animation.from_state.rotation) * t;
        widget.style.transform.scale_x = animation.from_state.scale_x + (animation.to_state.scale_x - animation.from_state.scale_x) * t;
        widget.style.transform.scale_y = animation.from_state.scale_y + (animation.to_state.scale_y - animation.from_state.scale_y) * t;
        
        Ok(())
    }

    fn ease_function(&self, t: f32, easing_type: &str) -> f32 {
        match easing_type {
            "linear" => t,
            "ease-in" => t * t,
            "ease-out" => 1.0 - (1.0 - t) * (1.0 - t),
            "ease-in-out" => {
                if t < 0.5 {
                    2.0 * t * t
                } else {
                    -1.0 + (4.0 - 2.0 * t) * t
                }
            },
            "bounce" => {
                if t < 1.0 / 2.75 {
                    7.5625 * t * t
                } else if t < 2.0 / 2.75 {
                    let t_adj = t - 1.5 / 2.75;
                    7.5625 * t_adj * t_adj + 0.75
                } else if t < 2.5 / 2.75 {
                    let t_adj = t - 2.25 / 2.75;
                    7.5625 * t_adj * t_adj + 0.9375
                } else {
                    let t_adj = t - 2.625 / 2.75;
                    7.5625 * t_adj * t_adj + 0.984375
                }
            },
            _ => t,
        }
    }
    
    // AI Editor methods
    pub fn create_ai_editor_window(&mut self, x: f32, y: f32, width: f32, height: f32) -> Result<String, String> {
        console_log!("🤖 Creating AI Editor Window");
        
        let window_widget = UIWidget {
            id: format!("ai_editor_window_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::Window,
            name: "AI Editor".to_string(),
            x,
            y,
            width,
            height,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: None,
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 2.0,
                border_radius: 8.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 14.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 2.0,
                    offset_y: 2.0,
                    blur: 5.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1000,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 5.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "AI Editor Window".to_string(),
                description: "Window for editing AI behaviors and agents".to_string(),
                role: "dialog".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: HashMap::new(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let window_id = window_widget.id.clone();
        self.create_widget(window_widget)?;
        
        // Create a simple container for AI editor content
        let container_id = self.create_ai_editor_container(&window_id)?;
        
        // Update window children
        if let Some(window) = self.widgets.get_mut(&window_id) {
            window.children.push(container_id);
        }
        
        Ok(window_id)
    }
    
    fn create_ai_editor_container(&mut self, parent_id: &str) -> Result<String, String> {
        let container = UIWidget {
            id: format!("ai_editor_container_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::Container,
            name: "AI Editor Container".to_string(),
            x: 10.0,
            y: 40.0,
            width: 580.0,
            height: 350.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#34495e".to_string(),
                border_color: "#2c3e50".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 10.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "AI Editor Container".to_string(),
                description: "Container for AI editor content".to_string(),
                role: "group".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: HashMap::new(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let container_id = container.id.clone();
        self.create_widget(container)?;
        
        // Add a simple label
        let label_id = self.create_ai_editor_label(&container_id)?;
        
        // Update container children
        if let Some(container) = self.widgets.get_mut(&container_id) {
            container.children.push(label_id);
        }
        
        Ok(container_id)
    }
    
    fn create_ai_editor_label(&mut self, parent_id: &str) -> Result<String, String> {
        let label = UIWidget {
            id: format!("ai_editor_label_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::Label,
            name: "AI Editor Label".to_string(),
            x: 0.0,
            y: 0.0,
            width: 200.0,
            height: 20.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "transparent".to_string(),
                border_color: "transparent".to_string(),
                border_width: 0.0,
                border_radius: 0.0,
                padding: UIPadding { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
                margin: UIMargin { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 14.0,
                    weight: "bold".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "center".to_string() },
                shadow: UIShadow {
                    color: "transparent".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Absolute,
                spacing: 0.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: false,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "row".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "center".to_string(),
                flex_align_content: "center".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "AI Editor Title".to_string(),
                description: "Title label for AI editor".to_string(),
                role: "heading".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("text".to_string(), "AI Editor - Basic Implementation".to_string());
                props
            },
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let label_id = label.id.clone();
        self.create_widget(label)?;
        
        Ok(label_id)
    }
    
    pub fn handle_ai_editor_events(&mut self) -> Result<(), String> {
        let events_to_process: Vec<UIEvent> = self.event_queue
            .iter()
            .filter(|event| matches!(event.event_type, UIEventType::AIAgentCreate | UIEventType::AIAgentDelete | UIEventType::AIBehaviorCreate))
            .cloned()
            .collect();
        
        for event in events_to_process {
            match event.event_type {
                UIEventType::AIAgentCreate => {
                    console_log!("🤖 Creating new AI agent");
                    self.create_new_ai_agent()?;
                }
                UIEventType::AIAgentDelete => {
                    console_log!("🗑️ Deleting AI agent");
                    // Implementation would delete the specified agent
                }
                UIEventType::AIBehaviorCreate => {
                    console_log!("🎯 Creating new AI behavior");
                    // Implementation would create a new behavior
                }
                _ => {}
            }
        }
        
        Ok(())
    }
    
    fn create_new_ai_agent(&mut self) -> Result<String, String> {
        let agent_id = format!("ai_agent_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs());
        
        // This would integrate with the AI system to create a new agent
        // For now, we'll just create a UI representation
        console_log!("✅ Created AI agent: {}", agent_id);
        
        Ok(agent_id)
    }

    // World Editor methods
    pub fn create_world_editor_window(&mut self, x: f32, y: f32, width: f32, height: f32) -> Result<String, String> {
        console_log!("🌍 Creating World Editor Window");
        
        let window_widget = UIWidget {
            id: format!("world_editor_window_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::WorldEditor,
            name: "World Editor".to_string(),
            x,
            y,
            width,
            height,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: None,
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 2.0,
                border_radius: 8.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 14.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 2.0,
                    offset_y: 2.0,
                    blur: 5.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1000,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 5.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Editor Window".to_string(),
                description: "Window for editing world properties and chunks".to_string(),
                role: "dialog".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: HashMap::new(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let window_id = window_widget.id.clone();
        self.create_widget(window_widget)?;
        
        // Create world editor tabs
        let tab_container_id = self.create_world_editor_tabs(&window_id)?;
        
        // Update window children
        if let Some(window) = self.widgets.get_mut(&window_id) {
            window.children.push(tab_container_id);
        }
        
        Ok(window_id)
    }
    
    fn create_world_editor_tabs(&mut self, parent_id: &str) -> Result<String, String> {
        let tab_container = UIWidget {
            id: format!("world_tab_container_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::TabContainer,
            name: "World Editor Tabs".to_string(),
            x: 0.0,
            y: 0.0,
            width: 600.0,
            height: 400.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#34495e".to_string(),
                border_color: "#2c3e50".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                margin: UIMargin { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 0.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: false,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Editor Tabs".to_string(),
                description: "Tab container for world editor sections".to_string(),
                role: "tablist".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: HashMap::new(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let tab_container_id = tab_container.id.clone();
        self.create_widget(tab_container)?;
        
        // Create individual tabs
        let properties_tab_id = self.create_world_properties_tab(&tab_container_id)?;
        let chunks_tab_id = self.create_world_chunks_tab(&tab_container_id)?;
        let objects_tab_id = self.create_world_objects_tab(&tab_container_id)?;
        let terrain_tab_id = self.create_world_terrain_tab(&tab_container_id)?;
        
        // Update tab container children
        if let Some(tab_container) = self.widgets.get_mut(&tab_container_id) {
            tab_container.children.extend(vec![properties_tab_id, chunks_tab_id, objects_tab_id, terrain_tab_id]);
        }
        
        Ok(tab_container_id)
    }
    
    fn create_world_properties_tab(&mut self, parent_id: &str) -> Result<String, String> {
        let properties_panel = UIWidget {
            id: format!("world_properties_panel_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::WorldProperties,
            name: "World Properties".to_string(),
            x: 10.0,
            y: 40.0,
            width: 580.0,
            height: 350.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 10.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Properties Panel".to_string(),
                description: "Panel for editing world properties".to_string(),
                role: "tabpanel".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("tab_title".to_string(), "Properties".to_string());
                props
            },
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let panel_id = properties_panel.id.clone();
        self.create_widget(properties_panel)?;
        
        Ok(panel_id)
    }
    
    fn create_world_chunks_tab(&mut self, parent_id: &str) -> Result<String, String> {
        let chunks_panel = UIWidget {
            id: format!("world_chunks_panel_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::WorldChunkEditor,
            name: "World Chunks".to_string(),
            x: 10.0,
            y: 40.0,
            width: 580.0,
            height: 350.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 10.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Chunks Panel".to_string(),
                description: "Panel for managing world chunks".to_string(),
                role: "tabpanel".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("tab_title".to_string(), "Chunks".to_string());
                props
            },
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let panel_id = chunks_panel.id.clone();
        self.create_widget(chunks_panel)?;
        
        Ok(panel_id)
    }
    
    fn create_world_objects_tab(&mut self, parent_id: &str) -> Result<String, String> {
        let objects_panel = UIWidget {
            id: format!("world_objects_panel_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::WorldObjectEditor,
            name: "World Objects".to_string(),
            x: 10.0,
            y: 40.0,
            width: 580.0,
            height: 350.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 10.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Objects Panel".to_string(),
                description: "Panel for managing world objects".to_string(),
                role: "tabpanel".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("tab_title".to_string(), "Objects".to_string());
                props
            },
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let panel_id = objects_panel.id.clone();
        self.create_widget(objects_panel)?;
        
        Ok(panel_id)
    }
    
    fn create_world_terrain_tab(&mut self, parent_id: &str) -> Result<String, String> {
        let terrain_panel = UIWidget {
            id: format!("world_terrain_panel_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            widget_type: UIWidgetType::WorldTerrainEditor,
            name: "World Terrain".to_string(),
            x: 10.0,
            y: 40.0,
            width: 580.0,
            height: 350.0,
            visible: true,
            enabled: true,
            focused: false,
            parent_id: Some(parent_id.to_string()),
            children: Vec::new(),
            style: UIStyle {
                background_color: "#2c3e50".to_string(),
                border_color: "#34495e".to_string(),
                border_width: 1.0,
                border_radius: 5.0,
                padding: UIPadding { top: 10.0, right: 10.0, bottom: 10.0, left: 10.0 },
                margin: UIMargin { top: 5.0, right: 5.0, bottom: 5.0, left: 5.0 },
                font: UIFont {
                    family: "Arial, sans-serif".to_string(),
                    size: 12.0,
                    weight: "normal".to_string(),
                    style: "normal".to_string(),
                    line_height: 1.4,
                },
                text_color: "#ecf0f1".to_string(),
                text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
                shadow: UIShadow {
                    color: "#000000".to_string(),
                    offset_x: 0.0,
                    offset_y: 0.0,
                    blur: 0.0,
                    spread: 0.0,
                },
                opacity: 1.0,
                transform: UITransform {
                    translate_x: 0.0,
                    translate_y: 0.0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    rotation: 0.0,
                    skew_x: 0.0,
                    skew_y: 0.0,
                },
                z_index: 1,
                cursor: UICursor {
                    cursor_type: "default".to_string(),
                    hot_spot_x: 0.0,
                    hot_spot_y: 0.0,
                },
            },
            layout: UILayout {
                layout_type: UILayoutType::Vertical,
                spacing: 10.0,
                alignment: "start".to_string(),
                wrap: false,
                scroll_x: false,
                scroll_y: true,
                grid_columns: 1,
                grid_rows: 1,
                flex_direction: "column".to_string(),
                flex_wrap: "nowrap".to_string(),
                flex_justify_content: "flex-start".to_string(),
                flex_align_items: "stretch".to_string(),
                flex_align_content: "stretch".to_string(),
            },
            events: Vec::new(),
            animations: Vec::new(),
            accessibility: UIAccessibility {
                accessible: true,
                label: "World Terrain Panel".to_string(),
                description: "Panel for editing world terrain".to_string(),
                role: "tabpanel".to_string(),
                tab_index: 0,
                aria_attributes: HashMap::new(),
            },
            custom_properties: {
                let mut props = HashMap::new();
                props.insert("tab_title".to_string(), "Terrain".to_string());
                props
            },
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        let panel_id = terrain_panel.id.clone();
        self.create_widget(terrain_panel)?;
        
        Ok(panel_id)
    }
    
    pub fn handle_world_editor_events(&mut self) -> Result<(), String> {
        let events_to_process: Vec<UIEvent> = self.event_queue
            .iter()
            .filter(|event| matches!(
                event.event_type, 
                UIEventType::WorldCreate | UIEventType::WorldLoad | UIEventType::WorldSave |
                UIEventType::WorldExport | UIEventType::WorldImport |
                UIEventType::WorldChunkCreate | UIEventType::WorldChunkDelete |
                UIEventType::WorldObjectCreate | UIEventType::WorldObjectDelete |
                UIEventType::WorldObjectUpdate | UIEventType::WorldTerrainModify |
                UIEventType::WorldPropertiesUpdate
            ))
            .cloned()
            .collect();
        
        for event in events_to_process {
            match &event.event_type {
                UIEventType::WorldCreate => {
                    console_log!("🌍 Creating new world");
                    // Implementation would create a new world
                }
                UIEventType::WorldLoad => {
                    console_log!("📂 Loading world");
                    // Implementation would load a world from file
                }
                UIEventType::WorldSave => {
                    console_log!("💾 Saving world");
                    // Implementation would save current world
                }
                UIEventType::WorldExport => {
                    console_log!("📤 Exporting world");
                    // Implementation would export world to file
                }
                UIEventType::WorldImport => {
                    console_log!("📥 Importing world");
                    // Implementation would import world from file
                }
                UIEventType::WorldChunkCreate => {
                    console_log!("🧱 Creating world chunk");
                    // Implementation would create a new chunk
                }
                UIEventType::WorldChunkDelete => {
                    console_log!("🗑️ Deleting world chunk");
                    // Implementation would delete a chunk
                }
                UIEventType::WorldObjectCreate => {
                    console_log!("🎯 Creating world object");
                    // Implementation would create a new object
                }
                UIEventType::WorldObjectDelete => {
                    console_log!("🗑️ Deleting world object");
                    // Implementation would delete an object
                }
                UIEventType::WorldObjectUpdate => {
                    console_log!("✏️ Updating world object");
                    // Implementation would update an object
                }
                UIEventType::WorldTerrainModify => {
                    console_log!("🏔️ Modifying world terrain");
                    // Implementation would modify terrain
                }
                UIEventType::WorldPropertiesUpdate => {
                    console_log!("⚙️ Updating world properties");
                    // Implementation would update world properties
                }
                _ => {}
            }
        }
        
        Ok(())
    }
}

// Render command structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIRenderCommand {
    pub widget_id: String,
    pub widget_type: UIWidgetType,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub style: UIStyle,
    pub visible: bool,
    pub enabled: bool,
    pub focused: bool,
    pub text: String,
    pub image_url: String,
    pub value: f32,
    pub min_value: f32,
    pub max_value: f32,
    pub step: f32,
    pub checked: bool,
    pub options: Vec<String>,
    pub selected_index: u32,
    pub progress: f32,
    pub children: Vec<String>,
}

// WASM exports
#[wasm_bindgen]
pub struct UISystemExport {
    inner: Arc<Mutex<UISystem>>,
}

#[wasm_bindgen]
impl UISystemExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<UISystemExport, JsValue> {
        let config: UIConfig = serde_wasm_bindgen::from_value(config)?;
        let ui_system = UISystem::new(config);
        Ok(UISystemExport {
            inner: Arc::new(Mutex::new(ui_system)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: UIConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ui_system.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ui_system.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_ui_system_summary(&mut self) -> String {
        self.inner.lock().unwrap().get_ui_system_summary()
    }

    #[wasm_bindgen]
    pub fn create_widget(&mut self, widget: JsValue) -> Result<JsValue, JsValue> {
        let widget: UIWidget = serde_wasm_bindgen::from_value(widget).unwrap();
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.create_widget(widget) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn delete_widget(&mut self, widget_id: String) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.delete_widget(&widget_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_widget(&self, widget_id: String) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        if let Some(widget) = ui_system.get_widget(&widget_id) {
            serde_wasm_bindgen::to_value(&widget).unwrap()
        } else {
            JsValue::null()
        }
    }

    #[wasm_bindgen]
    pub fn get_all_widgets(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ui_system.get_all_widgets()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_visible_widgets(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ui_system.get_visible_widgets()).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_widget_position(&mut self, widget_id: String, x: f32, y: f32) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_widget_position(&widget_id, x, y) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_widget_size(&mut self, widget_id: String, width: f32, height: f32) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_widget_size(&widget_id, width, height) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_widget_visibility(&mut self, widget_id: String, visible: bool) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_widget_visibility(&widget_id, visible) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_widget_enabled(&mut self, widget_id: String, enabled: bool) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_widget_enabled(&widget_id, enabled) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn handle_click_event(&mut self, widget_id: String, mouse_x: f32, mouse_y: f32) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.handle_click_event(&widget_id, mouse_x, mouse_y) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn add_theme(&mut self, theme: JsValue) -> Result<(), JsValue> {
        let theme: UITheme = serde_wasm_bindgen::from_value(theme).unwrap();
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.add_theme(theme) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_theme(&mut self, theme_id: String) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_theme(&theme_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_current_theme(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ui_system.get_current_theme()).unwrap()
    }

    #[wasm_bindgen]
    pub fn update_layout(&mut self) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.update_layout() {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn render(&mut self) -> Result<JsValue, JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.render() {
            Ok(commands) => Ok(serde_wasm_bindgen::to_value(&commands).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self, delta_time: f32) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.update(delta_time) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn hit_test(&self, x: f32, y: f32) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        if let Some(widget_id) = ui_system.hit_test(x, y) {
            JsValue::from_str(&widget_id)
        } else {
            JsValue::null()
        }
    }

    #[wasm_bindgen]
    pub fn set_focus(&mut self, widget_id: String) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.set_focus(&widget_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn clear_focus(&mut self) {
        self.inner.lock().unwrap().clear_focus();
    }

    #[wasm_bindgen]
    pub fn get_focused_widget(&self) -> JsValue {
        let ui_system = self.inner.lock().unwrap();
        if let Some(widget_id) = ui_system.get_focused_widget() {
            JsValue::from_str(&widget_id)
        } else {
            JsValue::null()
        }
    }

    #[wasm_bindgen]
    pub fn create_ai_editor_window(&self, x: f32, y: f32, width: f32, height: f32) -> Result<String, JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.create_ai_editor_window(x, y, width, height) {
            Ok(window_id) => Ok(window_id),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn handle_ai_editor_events(&self) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.handle_ai_editor_events() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn create_world_editor_window(&self, x: f32, y: f32, width: f32, height: f32) -> Result<String, JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.create_world_editor_window(x, y, width, height) {
            Ok(window_id) => Ok(window_id),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn handle_world_editor_events(&self) -> Result<(), JsValue> {
        let mut ui_system = self.inner.lock().unwrap();
        match ui_system.handle_world_editor_events() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_ui_config() -> JsValue {
    let config = UIConfig {
        enable_animations: true,
        enable_accessibility: true,
        default_theme: "default".to_string(),
        auto_layout: true,
        pixel_perfect: false,
        retina_display: true,
        touch_support: true,
        keyboard_support: true,
        mouse_support: true,
        debug_mode: false,
        max_widgets: 1000,
        event_queue_size: 100,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_ui_widget() -> JsValue {
    let widget = UIWidget {
        id: "default".to_string(),
        widget_type: UIWidgetType::Container,
        name: "Default Widget".to_string(),
        x: 0.0,
        y: 0.0,
        width: 100.0,
        height: 100.0,
        visible: true,
        enabled: true,
        focused: false,
        parent_id: None,
        children: Vec::new(),
        style: UIStyle {
            background_color: "#ffffff".to_string(),
            border_color: "#000000".to_string(),
            border_width: 1.0,
            border_radius: 0.0,
            padding: UIPadding { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
            margin: UIMargin { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
            font: UIFont {
                family: "Arial".to_string(),
                size: 14.0,
                weight: "normal".to_string(),
                style: "normal".to_string(),
                line_height: 1.4,
            },
            text_color: "#000000".to_string(),
            text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
            shadow: UIShadow {
                color: "#000000".to_string(),
                offset_x: 0.0,
                offset_y: 0.0,
                blur: 0.0,
                spread: 0.0,
            },
            opacity: 1.0,
            transform: UITransform {
                translate_x: 0.0,
                translate_y: 0.0,
                scale_x: 1.0,
                scale_y: 1.0,
                rotation: 0.0,
                skew_x: 0.0,
                skew_y: 0.0,
            },
            z_index: 0,
            cursor: UICursor {
                cursor_type: "default".to_string(),
                hot_spot_x: 0.0,
                hot_spot_y: 0.0,
            },
        },
        layout: UILayout {
            layout_type: UILayoutType::Absolute,
            spacing: 0.0,
            alignment: "left".to_string(),
            wrap: false,
            scroll_x: false,
            scroll_y: false,
            grid_columns: 1,
            grid_rows: 1,
            flex_direction: "row".to_string(),
            flex_wrap: "nowrap".to_string(),
            flex_justify_content: "flex-start".to_string(),
            flex_align_items: "stretch".to_string(),
            flex_align_content: "stretch".to_string(),
        },
        events: Vec::new(),
        animations: Vec::new(),
        accessibility: UIAccessibility {
            accessible: true,
            label: "".to_string(),
            description: "".to_string(),
            role: "widget".to_string(),
            tab_index: 0,
            aria_attributes: HashMap::new(),
        },
        custom_properties: HashMap::new(),
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };
    serde_wasm_bindgen::to_value(&widget).unwrap()
}

#[wasm_bindgen]
pub fn create_ui_style() -> JsValue {
    let style = UIStyle {
        background_color: "#ffffff".to_string(),
        border_color: "#000000".to_string(),
        border_width: 1.0,
        border_radius: 0.0,
        padding: UIPadding { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
        margin: UIMargin { top: 0.0, right: 0.0, bottom: 0.0, left: 0.0 },
        font: UIFont {
            family: "Arial".to_string(),
            size: 14.0,
            weight: "normal".to_string(),
            style: "normal".to_string(),
            line_height: 1.4,
        },
        text_color: "#000000".to_string(),
        text_align: UITextAlignment { horizontal: "left".to_string(), vertical: "top".to_string() },
        shadow: UIShadow {
            color: "#000000".to_string(),
            offset_x: 0.0,
            offset_y: 0.0,
            blur: 0.0,
            spread: 0.0,
        },
        opacity: 1.0,
        transform: UITransform {
            translate_x: 0.0,
            translate_y: 0.0,
            scale_x: 1.0,
            scale_y: 1.0,
            rotation: 0.0,
            skew_x: 0.0,
            skew_y: 0.0,
        },
        z_index: 0,
        cursor: UICursor {
            cursor_type: "default".to_string(),
            hot_spot_x: 0.0,
            hot_spot_y: 0.0,
        },
    };
    serde_wasm_bindgen::to_value(&style).unwrap()
}

#[wasm_bindgen]
pub fn create_ui_theme() -> JsValue {
    let theme = UITheme {
        id: "custom".to_string(),
        name: "Custom Theme".to_string(),
        theme_type: UIThemeType::Custom,
        colors: HashMap::new(),
        fonts: HashMap::new(),
        sizes: HashMap::new(),
        spacing: HashMap::new(),
        animations: HashMap::new(),
        custom_properties: HashMap::new(),
    };
    serde_wasm_bindgen::to_value(&theme).unwrap()
}

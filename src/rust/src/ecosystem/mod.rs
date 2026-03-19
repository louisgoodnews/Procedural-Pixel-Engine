use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct CommunityConfig {
    pub enable_sharing: bool,
    pub enable_collaboration: bool,
    pub enable_marketplace: bool,
    pub enable_tutorials: bool,
    pub enable_templates: bool,
    pub max_shared_projects: u32,
    pub collaboration_rooms: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct PluginConfig {
    pub enable_plugins: bool,
    pub auto_update: bool,
    pub sandbox_mode: bool,
    pub max_plugins: u32,
    pub plugin_timeout: f64,
    pub security_level: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct CloudConfig {
    pub enable_cloud: bool,
    pub auto_sync: bool,
    pub compression_level: u32,
    pub encryption_enabled: bool,
    pub max_storage_mb: u32,
    pub sync_interval: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct AnalyticsConfig {
    pub enable_analytics: bool,
    pub track_performance: bool,
    pub track_usage: bool,
    pub anonymize_data: bool,
    pub retention_days: u32,
    pub real_time_updates: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct EcosystemConfig {
    pub community: CommunityConfig,
    pub plugins: PluginConfig,
    pub cloud: CloudConfig,
    pub analytics: AnalyticsConfig,
    pub enable_mod_support: bool,
    pub enable_api_access: bool,
    pub enable_webhooks: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct SharedProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub created_at: f64,
    pub updated_at: f64,
    pub downloads: u32,
    pub likes: u32,
    pub tags: Vec<String>,
    pub file_size: u32,
    pub thumbnail_url: String,
    pub is_public: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub created_at: f64,
    pub updated_at: f64,
    pub downloads: u32,
    pub rating: f32,
    pub dependencies: Vec<String>,
    pub permissions: Vec<String>,
    pub file_size: u32,
    pub is_enabled: bool,
    pub is_compatible: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct Tutorial {
    pub id: String,
    pub title: String,
    pub description: String,
    pub author: String,
    pub difficulty: u32,
    pub duration_minutes: u32,
    pub steps: Vec<TutorialStep>,
    pub tags: Vec<String>,
    pub created_at: f64,
    pub views: u32,
    pub rating: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct TutorialStep {
    pub id: String,
    pub title: String,
    pub content: String,
    pub code_example: String,
    pub image_url: String,
    pub order: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub preview_url: String,
    pub file_count: u32,
    pub file_size: u32,
    pub downloads: u32,
    pub rating: f32,
    pub created_at: f64,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct AnalyticsData {
    pub timestamp: f64,
    pub active_users: u32,
    pub total_projects: u32,
    pub total_downloads: u32,
    pub performance_metrics: PerformanceMetrics,
    pub usage_stats: UsageStats,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct PerformanceMetrics {
    pub avg_load_time: f64,
    pub avg_fps: f64,
    pub memory_usage: u32,
    pub error_rate: f32,
    pub uptime: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct UsageStats {
    pub most_used_features: Vec<String>,
    pub peak_concurrent_users: u32,
    pub avg_session_duration: f64,
    pub feature_adoption_rate: f32,
}

pub struct RustEcosystem {
    config: EcosystemConfig,
    shared_projects: Vec<SharedProject>,
    plugins: Vec<Plugin>,
    tutorials: Vec<Tutorial>,
    templates: Vec<Template>,
    analytics_data: Vec<AnalyticsData>,
    active_users: HashMap<String, f64>,
}

impl RustEcosystem {
    pub fn new(config: EcosystemConfig) -> RustEcosystem {
        console_log("🌐 Initializing Rust Ecosystem...");
        
        let mut ecosystem = RustEcosystem {
            config: config.clone(),
            shared_projects: Vec::new(),
            plugins: Vec::new(),
            tutorials: Vec::new(),
            templates: Vec::new(),
            analytics_data: Vec::new(),
            active_users: HashMap::new(),
        };
        
        // Initialize ecosystem components
        if config.community.enable_sharing {
            ecosystem.initialize_community_sharing();
        }
        
        if config.plugins.enable_plugins {
            ecosystem.initialize_plugin_system();
        }
        
        if config.cloud.enable_cloud {
            ecosystem.initialize_cloud_sync();
        }
        
        if config.analytics.enable_analytics {
            ecosystem.initialize_analytics();
        }
        
        console_log("✅ Rust Ecosystem initialized successfully");
        ecosystem
    }
    
    pub fn update_config(&mut self, config: EcosystemConfig) {
        self.config = config;
    }
    
    pub fn get_config(&self) -> EcosystemConfig {
        self.config.clone()
    }
    
    // Community Features
    fn initialize_community_sharing(&mut self) {
        console_log("👥 Initializing community sharing...");
        
        // Simulate loading shared projects
        self.shared_projects = vec![
            SharedProject {
                id: "proj_001".to_string(),
                name: "Particle System Showcase".to_string(),
                description: "Advanced particle effects with physics simulation".to_string(),
                author: "CommunityUser123".to_string(),
                created_at: 1640995200000.0, // Jan 1, 2022
                updated_at: 1672531200000.0, // Jan 1, 2023
                downloads: 15420,
                likes: 892,
                tags: vec!["particles".to_string(), "physics".to_string(), "effects".to_string()],
                file_size: 2048576, // 2MB
                thumbnail_url: "https://example.com/thumb1.jpg".to_string(),
                is_public: true,
            },
            SharedProject {
                id: "proj_002".to_string(),
                name: "Audio Visualizer".to_string(),
                description: "Real-time audio visualization with frequency analysis".to_string(),
                author: "AudioMaster".to_string(),
                created_at: 1643673600000.0, // Feb 1, 2022
                updated_at: 1675209600000.0, // Feb 1, 2023
                downloads: 12350,
                likes: 756,
                tags: vec!["audio".to_string(), "visualization".to_string(), "fft".to_string()],
                file_size: 1536000, // 1.5MB
                thumbnail_url: "https://example.com/thumb2.jpg".to_string(),
                is_public: true,
            },
            SharedProject {
                id: "proj_003".to_string(),
                name: "Physics Playground".to_string(),
                description: "Interactive physics simulation with realistic constraints".to_string(),
                author: "PhysicsGuru".to_string(),
                created_at: 1646092800000.0, // Mar 1, 2022
                updated_at: 1677888000000.0, // Mar 1, 2023
                downloads: 18930,
                likes: 1234,
                tags: vec!["physics".to_string(), "simulation".to_string(), "interactive".to_string()],
                file_size: 3072000, // 3MB
                thumbnail_url: "https://example.com/thumb3.jpg".to_string(),
                is_public: true,
            },
        ];
        
        console_log(&format!("📁 Loaded {} shared projects", self.shared_projects.len()));
    }
    
    pub fn share_project(&mut self, project: SharedProject) -> Result<(), String> {
        if !self.config.community.enable_sharing {
            return Err("Community sharing is disabled".to_string());
        }
        
        if self.shared_projects.len() >= self.config.community.max_shared_projects as usize {
            return Err("Maximum shared projects limit reached".to_string());
        }
        
        // Validate project
        if project.name.is_empty() || project.author.is_empty() {
            return Err("Project name and author are required".to_string());
        }
        
        // Add project
        self.shared_projects.push(project);
        
        console_log(&format!("📤 Shared project: {}", self.shared_projects.last().unwrap().name));
        Ok(())
    }
    
    pub fn get_shared_projects(&self) -> Vec<SharedProject> {
        self.shared_projects.clone()
    }
    
    pub fn search_projects(&self, query: &str) -> Vec<SharedProject> {
        let query_lower = query.to_lowercase();
        self.shared_projects.iter()
            .filter(|project| {
                project.name.to_lowercase().contains(&query_lower) ||
                project.description.to_lowercase().contains(&query_lower) ||
                project.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower)) ||
                project.author.to_lowercase().contains(&query_lower)
            })
            .cloned()
            .collect()
    }
    
    pub fn like_project(&mut self, project_id: &str) -> Result<(), String> {
        if let Some(project) = self.shared_projects.iter_mut().find(|p| p.id == project_id) {
            project.likes += 1;
            console_log(&format!("❤️ Liked project: {}", project.name));
            Ok(())
        } else {
            Err("Project not found".to_string())
        }
    }
    
    pub fn download_project(&mut self, project_id: &str) -> Result<(), String> {
        if let Some(project) = self.shared_projects.iter_mut().find(|p| p.id == project_id) {
            project.downloads += 1;
            console_log(&format!("⬇️ Downloaded project: {}", project.name));
            Ok(())
        } else {
            Err("Project not found".to_string())
        }
    }
    
    // Plugin System
    fn initialize_plugin_system(&mut self) {
        console_log("🔌 Initializing plugin system...");
        
        // Simulate loading plugins
        self.plugins = vec![
            Plugin {
                id: "plugin_001".to_string(),
                name: "Advanced Color Grading".to_string(),
                version: "1.2.0".to_string(),
                description: "Professional color grading tools with LUT support".to_string(),
                author: "ColorTech".to_string(),
                created_at: 1640995200000.0,
                updated_at: 1672531200000.0,
                downloads: 8750,
                rating: 4.7,
                dependencies: vec![],
                permissions: vec!["canvas_access".to_string(), "storage_read".to_string()],
                file_size: 512000, // 512KB
                is_enabled: true,
                is_compatible: true,
            },
            Plugin {
                id: "plugin_002".to_string(),
                name: "Network Synchronization".to_string(),
                version: "2.1.0".to_string(),
                description: "Real-time network synchronization for multiplayer projects".to_string(),
                author: "NetSync".to_string(),
                created_at: 1643673600000.0,
                updated_at: 1675209600000.0,
                downloads: 5230,
                rating: 4.2,
                dependencies: vec!["websocket".to_string()],
                permissions: vec!["network_access".to_string(), "storage_write".to_string()],
                file_size: 1024000, // 1MB
                is_enabled: false,
                is_compatible: true,
            },
            Plugin {
                id: "plugin_003".to_string(),
                name: "Machine Learning Tools".to_string(),
                version: "1.0.0".to_string(),
                description: "ML-powered tools for pattern recognition and prediction".to_string(),
                author: "MLDev".to_string(),
                created_at: 1646092800000.0,
                updated_at: 1677888000000.0,
                downloads: 3200,
                rating: 4.5,
                dependencies: vec!["tensorflow".to_string()],
                permissions: vec!["compute_access".to_string(), "storage_read".to_string()],
                file_size: 2048000, // 2MB
                is_enabled: false,
                is_compatible: false, // Not compatible with current environment
            },
        ];
        
        console_log(&format!("🔌 Loaded {} plugins", self.plugins.len()));
    }
    
    pub fn install_plugin(&mut self, plugin: Plugin) -> Result<(), String> {
        if !self.config.plugins.enable_plugins {
            return Err("Plugin system is disabled".to_string());
        }
        
        if self.plugins.len() >= self.config.plugins.max_plugins as usize {
            return Err("Maximum plugins limit reached".to_string());
        }
        
        // Check compatibility
        if !plugin.is_compatible {
            return Err("Plugin is not compatible with current environment".to_string())
        }
        
        // Check dependencies
        for dep in &plugin.dependencies {
            if !self.plugins.iter().any(|p| p.id == *dep) {
                return Err(format!("Missing dependency: {}", dep));
            }
        }
        
        // Add plugin
        self.plugins.push(plugin);
        
        console_log(&format!("📦 Installed plugin: {}", self.plugins.last().unwrap().name));
        Ok(())
    }
    
    pub fn enable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.iter_mut().find(|p| p.id == plugin_id) {
            plugin.is_enabled = true;
            console_log(&format!("✅ Enabled plugin: {}", plugin.name));
            Ok(())
        } else {
            Err("Plugin not found".to_string())
        }
    }
    
    pub fn disable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.iter_mut().find(|p| p.id == plugin_id) {
            plugin.is_enabled = false;
            console_log(&format!("❌ Disabled plugin: {}", plugin.name));
            Ok(())
        } else {
            Err("Plugin not found".to_string())
        }
    }
    
    pub fn get_plugins(&self) -> Vec<Plugin> {
        self.plugins.clone()
    }
    
    pub fn get_enabled_plugins(&self) -> Vec<Plugin> {
        self.plugins.iter().filter(|p| p.is_enabled).cloned().collect()
    }
    
    // Tutorial System
    fn initialize_tutorials(&mut self) {
        console_log("📚 Initializing tutorial system...");
        
        // Simulate loading tutorials
        self.tutorials = vec![
            Tutorial {
                id: "tutorial_001".to_string(),
                title: "Getting Started with Rust Physics".to_string(),
                description: "Learn the basics of physics simulation in Rust".to_string(),
                author: "RustExpert".to_string(),
                difficulty: 1,
                duration_minutes: 30,
                steps: vec![
                    TutorialStep {
                        id: "step_001".to_string(),
                        title: "Setting Up Physics World".to_string(),
                        content: "Create a physics world and configure basic parameters".to_string(),
                        code_example: "let physics = PhysicsSystem::new();".to_string(),
                        image_url: "https://example.com/physics_setup.jpg".to_string(),
                        order: 1,
                    },
                    TutorialStep {
                        id: "step_002".to_string(),
                        title: "Adding Physics Bodies".to_string(),
                        content: "Learn how to add bodies to the physics world".to_string(),
                        code_example: "let body_id = physics.add_body();".to_string(),
                        image_url: "https://example.com/physics_bodies.jpg".to_string(),
                        order: 2,
                    },
                ],
                tags: vec!["physics".to_string(), "beginner".to_string(), "rust".to_string()],
                created_at: 1640995200000.0,
                views: 15420,
                rating: 4.8,
            },
            Tutorial {
                id: "tutorial_002".to_string(),
                title: "Advanced Particle Systems".to_string(),
                description: "Master complex particle effects and optimization".to_string(),
                author: "ParticleMaster".to_string(),
                difficulty: 3,
                duration_minutes: 60,
                steps: vec![
                    TutorialStep {
                        id: "step_003".to_string(),
                        title: "Particle Emitters".to_string(),
                        content: "Create and configure particle emitters".to_string(),
                        code_example: "let emitter = ParticleEmitter::new();".to_string(),
                        image_url: "https://example.com/emitter_setup.jpg".to_string(),
                        order: 1,
                    },
                    TutorialStep {
                        id: "step_004".to_string(),
                        title: "Performance Optimization".to_string(),
                        content: "Optimize particle systems for better performance".to_string(),
                        code_example: "particles.optimize_performance();".to_string(),
                        image_url: "https://example.com/performance_opt.jpg".to_string(),
                        order: 2,
                    },
                ],
                tags: vec!["particles".to_string(), "advanced".to_string(), "optimization".to_string()],
                created_at: 1643673600000.0,
                views: 8920,
                rating: 4.6,
            },
        ];
        
        console_log(&format!("📚 Loaded {} tutorials", self.tutorials.len()));
    }
    
    pub fn get_tutorials(&self) -> Vec<Tutorial> {
        self.tutorials.clone()
    }
    
    pub fn get_tutorial_by_id(&self, tutorial_id: &str) -> Option<Tutorial> {
        self.tutorials.iter().find(|t| t.id == tutorial_id).cloned()
    }
    
    pub fn search_tutorials(&self, query: &str) -> Vec<Tutorial> {
        let query_lower = query.to_lowercase();
        self.tutorials.iter()
            .filter(|tutorial| {
                tutorial.title.to_lowercase().contains(&query_lower) ||
                tutorial.description.to_lowercase().contains(&query_lower) ||
                tutorial.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }
    
    pub fn view_tutorial(&mut self, tutorial_id: &str) -> Result<(), String> {
        if let Some(tutorial) = self.tutorials.iter_mut().find(|t| t.id == tutorial_id) {
            tutorial.views += 1;
            console_log(&format!("👁️ Viewed tutorial: {}", tutorial.title));
            Ok(())
        } else {
            Err("Tutorial not found".to_string())
        }
    }
    
    // Template System
    fn initialize_templates(&mut self) {
        console_log("📋 Initializing template system...");
        
        // Simulate loading templates
        self.templates = vec![
            Template {
                id: "template_001".to_string(),
                name: "2D Platformer".to_string(),
                description: "Complete 2D platformer game template with physics".to_string(),
                category: "Games".to_string(),
                preview_url: "https://example.com/platformer_preview.jpg".to_string(),
                file_count: 25,
                file_size: 5120000, // 5MB
                downloads: 15420,
                rating: 4.7,
                created_at: 1640995200000.0,
                tags: vec!["platformer".to_string(), "2d".to_string(), "physics".to_string()],
            },
            Template {
                id: "template_002".to_string(),
                name: "Particle Effects Demo".to_string(),
                description: "Showcase of various particle effects and animations".to_string(),
                category: "Demos".to_string(),
                preview_url: "https://example.com/particles_preview.jpg".to_string(),
                file_count: 15,
                file_size: 2048000, // 2MB
                downloads: 12350,
                rating: 4.5,
                created_at: 1643673600000.0,
                tags: vec!["particles".to_string(), "effects".to_string(), "demo".to_string()],
            },
            Template {
                id: "template_003".to_string(),
                name: "Audio Visualizer".to_string(),
                description: "Real-time audio visualization with frequency analysis".to_string(),
                category: "Audio".to_string(),
                preview_url: "https://example.com/audio_preview.jpg".to_string(),
                file_count: 20,
                file_size: 3072000, // 3MB
                downloads: 8920,
                rating: 4.8,
                created_at: 1646092800000.0,
                tags: vec!["audio".to_string(), "visualization".to_string(), "fft".to_string()],
            },
        ];
        
        console_log(&format!("📋 Loaded {} templates", self.templates.len()));
    }
    
    pub fn get_templates(&self) -> Vec<Template> {
        self.templates.clone()
    }
    
    pub fn get_templates_by_category(&self, category: &str) -> Vec<Template> {
        self.templates.iter()
            .filter(|template| template.category == category)
            .cloned()
            .collect()
    }
    
    pub fn search_templates(&self, query: &str) -> Vec<Template> {
        let query_lower = query.to_lowercase();
        self.templates.iter()
            .filter(|template| {
                template.name.to_lowercase().contains(&query_lower) ||
                template.description.to_lowercase().contains(&query_lower) ||
                template.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }
    
    pub fn download_template(&mut self, template_id: &str) -> Result<(), String> {
        if let Some(template) = self.templates.iter_mut().find(|t| t.id == template_id) {
            template.downloads += 1;
            console_log(&format!("⬇️ Downloaded template: {}", template.name));
            Ok(())
        } else {
            Err("Template not found".to_string())
        }
    }
    
    // Cloud Sync
    fn initialize_cloud_sync(&mut self) {
        console_log("☁️ Initializing cloud sync...");
        
        // Simulate cloud sync initialization
        if self.config.cloud.encryption_enabled {
            console_log("🔐 Cloud encryption enabled");
        }
        
        if self.config.cloud.auto_sync {
            console_log("🔄 Auto-sync enabled");
        }
        
        console_log("✅ Cloud sync initialized");
    }
    
    pub fn sync_to_cloud(&mut self) -> Result<(), String> {
        if !self.config.cloud.enable_cloud {
            return Err("Cloud sync is disabled".to_string());
        }
        
        // Simulate cloud sync
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Simulate upload process
        std::thread::sleep(std::time::Duration::from_millis(1000));
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        let duration = end_time - start_time;
        
        console_log(&format!("☁️ Synced to cloud in {:.2}ms", duration));
        Ok(())
    }
    
    pub fn sync_from_cloud(&mut self) -> Result<(), String> {
        if !self.config.cloud.enable_cloud {
            return Err("Cloud sync is disabled".to_string());
        }
        
        // Simulate cloud download
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Simulate download process
        std::thread::sleep(std::time::Duration::from_millis(800));
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        let duration = end_time - start_time;
        
        console_log(&format!("☁️ Synced from cloud in {:.2}ms", duration));
        Ok(())
    }
    
    // Analytics
    fn initialize_analytics(&mut self) {
        console_log("📊 Initializing analytics...");
        
        // Initialize with some sample data
        self.analytics_data.push(AnalyticsData {
            timestamp: web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now(),
            active_users: 1250,
            total_projects: 15670,
            total_downloads: 89420,
            performance_metrics: PerformanceMetrics {
                avg_load_time: 2.3,
                avg_fps: 58.7,
                memory_usage: 256,
                error_rate: 0.02,
                uptime: 99.8,
            },
            usage_stats: UsageStats {
                most_used_features: vec![
                    "physics".to_string(),
                    "particles".to_string(),
                    "audio".to_string(),
                ],
                peak_concurrent_users: 1850,
                avg_session_duration: 45.6,
                feature_adoption_rate: 0.73,
            },
        });
        
        console_log("📊 Analytics initialized");
    }
    
    pub fn collect_analytics(&mut self) {
        if !self.config.analytics.enable_analytics {
            return;
        }
        
        let current_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Update active users
        let user_id = "current_user".to_string(); // In real implementation, get actual user ID
        self.active_users.insert(user_id, current_time);
        
        // Clean up inactive users (older than 5 minutes)
        let five_minutes_ago = current_time - 300000.0;
        self.active_users.retain(|_, last_seen| *last_seen > five_minutes_ago);
        
        // Create analytics snapshot
        let analytics = AnalyticsData {
            timestamp: current_time,
            active_users: self.active_users.len() as u32,
            total_projects: self.shared_projects.len() as u32,
            total_downloads: self.shared_projects.iter().map(|p| p.downloads).sum(),
            performance_metrics: PerformanceMetrics {
                avg_load_time: 2.1, // Simulated
                avg_fps: 59.2, // Simulated
                memory_usage: 248, // Simulated
                error_rate: 0.018, // Simulated
                uptime: 99.9, // Simulated
            },
            usage_stats: UsageStats {
                most_used_features: vec![
                    "physics".to_string(),
                    "particles".to_string(),
                    "audio".to_string(),
                    "advanced".to_string(),
                ],
                peak_concurrent_users: 1920, // Simulated
                avg_session_duration: 47.3, // Simulated
                feature_adoption_rate: 0.78, // Simulated
            },
        };
        
        self.analytics_data.push(analytics);
        
        // Keep only recent data (based on retention days)
        let retention_ms = self.config.analytics.retention_days as f64 * 24.0 * 60.0 * 60.0 * 1000.0;
        let cutoff_time = current_time - retention_ms;
        self.analytics_data.retain(|data| data.timestamp > cutoff_time);
        
        console_log("📊 Analytics collected");
    }
    
    pub fn get_analytics(&self) -> Vec<AnalyticsData> {
        self.analytics_data.clone()
    }
    
    pub fn get_analytics_summary(&self) -> String {
        if self.analytics_data.is_empty() {
            return "No analytics data available".to_string();
        }
        
        let latest = &self.analytics_data[self.analytics_data.len() - 1];
        
        format!(
            "📊 Analytics Summary\n\
             ===================\n\
             Active Users: {}\n\
             Total Projects: {}\n\
             Total Downloads: {}\n\
             Average Load Time: {:.2}s\n\
             Average FPS: {:.1}\n\
             Memory Usage: {}MB\n\
             Error Rate: {:.3}%\n\
             Uptime: {:.1}%\n\
             Peak Concurrent Users: {}\n\
             Average Session Duration: {:.1}min\n\
             Feature Adoption Rate: {:.1}%",
            latest.active_users,
            latest.total_projects,
            latest.total_downloads,
            latest.performance_metrics.avg_load_time,
            latest.performance_metrics.avg_fps,
            latest.performance_metrics.memory_usage,
            latest.performance_metrics.error_rate * 100.0,
            latest.performance_metrics.uptime,
            latest.usage_stats.peak_concurrent_users,
            latest.usage_stats.avg_session_duration,
            latest.usage_stats.feature_adoption_rate * 100.0
        )
    }
    
    // Mod Support
    pub fn enable_mod_support(&mut self) -> Result<(), String> {
        if !self.config.enable_mod_support {
            return Err("Mod support is disabled".to_string());
        }
        
        console_log("🎮 Enabling mod support...");
        
        // Simulate mod support initialization
        console_log("✅ Mod support enabled");
        Ok(())
    }
    
    // API Access
    pub fn enable_api_access(&mut self) -> Result<(), String> {
        if !self.config.enable_api_access {
            return Err("API access is disabled".to_string());
        }
        
        console_log("🔗 Enabling API access...");
        
        // Simulate API initialization
        console_log("✅ API access enabled");
        Ok(())
    }
    
    // Webhooks
    pub fn setup_webhook(&mut self, url: &str, events: Vec<String>) -> Result<(), String> {
        if !self.config.enable_webhooks {
            return Err("Webhooks are disabled".to_string());
        }
        
        console_log(&format!("🪝 Setting up webhook for: {}", url));
        
        // Simulate webhook setup
        for event in events {
            console_log(&format!("  - Subscribed to: {}", event));
        }
        
        console_log("✅ Webhook setup complete");
        Ok(())
    }
    
    // Ecosystem Status
    pub fn get_ecosystem_status(&self) -> String {
        format!(
            "🌐 Ecosystem Status\n\
             =================\n\
             Community Sharing: {}\n\
             Plugin System: {}\n\
             Cloud Sync: {}\n\
             Analytics: {}\n\
             Mod Support: {}\n\
             API Access: {}\n\
             Webhooks: {}\n\
             \n\
             📊 Statistics:\n\
             Shared Projects: {}\n\
             Installed Plugins: {}\n\
             Available Tutorials: {}\n\
             Available Templates: {}\n\
             Active Users: {}",
            if self.config.community.enable_sharing { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.plugins.enable_plugins { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.cloud.enable_cloud { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.analytics.enable_analytics { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.enable_mod_support { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.enable_api_access { "✅ Enabled" } else { "❌ Disabled" },
            if self.config.enable_webhooks { "✅ Enabled" } else { "❌ Disabled" },
            self.shared_projects.len(),
            self.plugins.len(),
            self.tutorials.len(),
            self.templates.len(),
            self.active_users.len()
        )
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustEcosystemExport {
    inner: RustEcosystem,
}

#[wasm_bindgen]
impl RustEcosystemExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> RustEcosystemExport {
        let config = serde_wasm_bindgen::from_value::<EcosystemConfig>(config).unwrap();
        console_log("🦀 Rust Ecosystem initialized");
        RustEcosystemExport {
            inner: RustEcosystem::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(ecosystem_config) = serde_wasm_bindgen::from_value::<EcosystemConfig>(config) {
            self.inner.update_config(ecosystem_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_ecosystem_status(&self) -> String {
        self.inner.get_ecosystem_status()
    }

    #[wasm_bindgen]
    pub fn get_shared_projects(&self) -> JsValue {
        let projects = self.inner.get_shared_projects();
        serde_wasm_bindgen::to_value(&projects).unwrap()
    }

    #[wasm_bindgen]
    pub fn search_projects(&self, query: &str) -> JsValue {
        let projects = self.inner.search_projects(query);
        serde_wasm_bindgen::to_value(&projects).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_plugins(&self) -> JsValue {
        let plugins = self.inner.get_plugins();
        serde_wasm_bindgen::to_value(&plugins).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_tutorials(&self) -> JsValue {
        let tutorials = self.inner.get_tutorials();
        serde_wasm_bindgen::to_value(&tutorials).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_templates(&self) -> JsValue {
        let templates = self.inner.get_templates();
        serde_wasm_bindgen::to_value(&templates).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_analytics_summary(&self) -> String {
        self.inner.get_analytics_summary()
    }

    #[wasm_bindgen]
    pub fn collect_analytics(&mut self) {
        self.inner.collect_analytics();
    }

    #[wasm_bindgen]
    pub fn sync_to_cloud(&mut self) -> JsValue {
        match self.inner.sync_to_cloud() {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn sync_from_cloud(&mut self) -> JsValue {
        match self.inner.sync_from_cloud() {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_ecosystem_config(
    enable_sharing: bool,
    enable_collaboration: bool,
    enable_marketplace: bool,
    enable_tutorials: bool,
    enable_templates: bool,
    max_shared_projects: u32,
    collaboration_rooms: u32,
    enable_plugins: bool,
    auto_update: bool,
    sandbox_mode: bool,
    max_plugins: u32,
    plugin_timeout: f64,
    security_level: u32,
    enable_cloud: bool,
    auto_sync: bool,
    compression_level: u32,
    encryption_enabled: bool,
    max_storage_mb: u32,
    sync_interval: f64,
    enable_analytics: bool,
    track_performance: bool,
    track_usage: bool,
    anonymize_data: bool,
    retention_days: u32,
    real_time_updates: bool,
    enable_mod_support: bool,
    enable_api_access: bool,
    enable_webhooks: bool
) -> JsValue {
    let config = EcosystemConfig {
        community: CommunityConfig {
            enable_sharing,
            enable_collaboration,
            enable_marketplace,
            enable_tutorials,
            enable_templates,
            max_shared_projects,
            collaboration_rooms,
        },
        plugins: PluginConfig {
            enable_plugins,
            auto_update,
            sandbox_mode,
            max_plugins,
            plugin_timeout,
            security_level,
        },
        cloud: CloudConfig {
            enable_cloud,
            auto_sync,
            compression_level,
            encryption_enabled,
            max_storage_mb,
            sync_interval,
        },
        analytics: AnalyticsConfig {
            enable_analytics,
            track_performance,
            track_usage,
            anonymize_data,
            retention_days,
            real_time_updates,
        },
        enable_mod_support,
        enable_api_access,
        enable_webhooks,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

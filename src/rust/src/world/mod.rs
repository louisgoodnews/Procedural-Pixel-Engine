use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// World management enums and types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorldChunkStatus {
    Unloaded,
    Loading,
    Loaded,
    Active,
    Unloading,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum LODLevel {
    Highest,
    High,
    Medium,
    Low,
    Lowest,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CullingMethod {
    Frustum,
    Occlusion,
    Distance,
    Combined,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldChunk {
    pub id: String,
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub size: f32,
    pub status: WorldChunkStatus,
    pub lod_level: LODLevel,
    pub objects: Vec<WorldObject>,
    pub terrain: TerrainData,
    pub last_accessed: u64,
    pub load_time: u64,
    pub memory_usage: u64,
    pub visible: bool,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldObject {
    pub id: String,
    pub object_type: String,
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    pub scale: [f32; 3],
    pub lod_levels: Vec<LODData>,
    pub bounding_box: BoundingBox,
    pub visible: bool,
    pub culled: bool,
    pub last_updated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LODData {
    pub level: LODLevel,
    pub mesh_id: String,
    pub material_id: String,
    pub distance_threshold: f32,
    pub triangle_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerrainData {
    pub heightmap: Vec<f32>,
    pub width: u32,
    pub height: u32,
    pub scale: f32,
    pub material_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub min: [f32; 3],
    pub max: [f32; 3],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldViewport {
    pub position: [f32; 3],
    pub direction: [f32; 3],
    pub up: [f32; 3],
    pub fov: f32,
    pub near_plane: f32,
    pub far_plane: f32,
    pub aspect_ratio: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingConfig {
    pub chunk_size: f32,
    pub load_distance: f32,
    pub unload_distance: f32,
    pub max_loaded_chunks: u32,
    pub streaming_enabled: bool,
    pub lod_enabled: bool,
    pub culling_enabled: bool,
    pub background_loading: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldStats {
    pub total_chunks: u32,
    pub loaded_chunks: u32,
    pub active_chunks: u32,
    pub visible_objects: u32,
    pub culled_objects: u32,
    pub memory_usage: u64,
    pub streaming_queue_size: u32,
    pub average_load_time: f64,
    pub last_update: u64,
}

// World serialization structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldSaveData {
    pub version: String,
    pub name: String,
    pub timestamp: u64,
    pub config: StreamingConfig,
    pub chunks: Vec<WorldChunk>,
    pub metadata: WorldMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldMetadata {
    pub author: String,
    pub description: String,
    pub tags: Vec<String>,
    pub world_size: [f32; 3],
    pub total_objects: u32,
    pub creation_time: u64,
    pub last_modified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializationFormat {
    pub format_type: String,
    pub compression: bool,
    pub version: String,
}

// World optimization structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldPerformanceReport {
    pub total_chunks: u32,
    pub loaded_chunks: u32,
    pub visible_objects: u32,
    pub culled_objects: u32,
    pub memory_usage_mb: u64,
    pub average_objects_per_chunk: f32,
    pub optimization_suggestions: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldOptimizationSettings {
    pub lod_enabled: Option<bool>,
    pub culling_enabled: Option<bool>,
    pub max_loaded_chunks: Option<u32>,
    pub load_distance: Option<f32>,
}

// World collaboration structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldSession {
    pub id: String,
    pub name: String,
    pub user_id: String,
    pub created_at: u64,
    pub last_activity: u64,
    pub active_users: Vec<String>,
    pub changes: Vec<WorldChange>,
    pub permissions: WorldPermissions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldPermissions {
    pub can_edit: bool,
    pub can_save: bool,
    pub can_load: bool,
    pub can_export: bool,
    pub can_import: bool,
    pub can_delete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldChange {
    pub id: String,
    pub user_id: String,
    pub timestamp: u64,
    pub change_type: String,
    pub description: String,
    pub object_id: Option<String>,
    pub chunk_id: Option<String>,
}

// Main world management system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldManager {
    config: StreamingConfig,
    chunks: HashMap<String, WorldChunk>,
    viewport: WorldViewport,
    stats: WorldStats,
    chunk_cache: HashMap<String, WorldChunk>,
    streaming_queue: Vec<String>,
    lod_manager: LODManager,
    culling_manager: CullingManager,
    last_update: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LODManager {
    enabled: bool,
    levels: Vec<LODLevel>,
    distance_thresholds: HashMap<LODLevel, f32>,
    current_viewport: WorldViewport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CullingManager {
    enabled: bool,
    method: CullingMethod,
    frustum_planes: [([f32; 4]); 6],
    viewport: WorldViewport,
}

impl WorldManager {
    pub fn new(config: StreamingConfig) -> Self {
        console_log!("🌍 Initializing World Manager");
        
        let system = Self {
            config: config.clone(),
            chunks: HashMap::new(),
            viewport: WorldViewport {
                position: [0.0, 0.0, 0.0],
                direction: [0.0, 0.0, 1.0],
                up: [0.0, 1.0, 0.0],
                fov: 60.0,
                near_plane: 0.1,
                far_plane: 1000.0,
                aspect_ratio: 16.0 / 9.0,
            },
            stats: WorldStats {
                total_chunks: 0,
                loaded_chunks: 0,
                active_chunks: 0,
                visible_objects: 0,
                culled_objects: 0,
                memory_usage: 0,
                streaming_queue_size: 0,
                average_load_time: 0.0,
                last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            },
            chunk_cache: HashMap::new(),
            streaming_queue: Vec::new(),
            lod_manager: LODManager {
                enabled: config.lod_enabled,
                levels: vec![
                    LODLevel::Highest,
                    LODLevel::High,
                    LODLevel::Medium,
                    LODLevel::Low,
                    LODLevel::Lowest,
                ],
                distance_thresholds: {
                    let mut thresholds = HashMap::new();
                    thresholds.insert(LODLevel::Highest, 10.0);
                    thresholds.insert(LODLevel::High, 25.0);
                    thresholds.insert(LODLevel::Medium, 50.0);
                    thresholds.insert(LODLevel::Low, 100.0);
                    thresholds.insert(LODLevel::Lowest, 200.0);
                    thresholds
                },
                current_viewport: WorldViewport {
                    position: [0.0, 0.0, 0.0],
                    direction: [0.0, 0.0, 1.0],
                    up: [0.0, 1.0, 0.0],
                    fov: 60.0,
                    near_plane: 0.1,
                    far_plane: 1000.0,
                    aspect_ratio: 16.0 / 9.0,
                },
            },
            culling_manager: CullingManager {
                enabled: config.culling_enabled,
                method: CullingMethod::Combined,
                frustum_planes: [
                    [0.0, 0.0, 0.0, 0.0], // Left
                    [0.0, 0.0, 0.0, 0.0], // Right
                    [0.0, 0.0, 0.0, 0.0], // Top
                    [0.0, 0.0, 0.0, 0.0], // Bottom
                    [0.0, 0.0, 0.0, 0.0], // Near
                    [0.0, 0.0, 0.0, 0.0], // Far
                ],
                viewport: WorldViewport {
                    position: [0.0, 0.0, 0.0],
                    direction: [0.0, 0.0, 1.0],
                    up: [0.0, 1.0, 0.0],
                    fov: 60.0,
                    near_plane: 0.1,
                    far_plane: 1000.0,
                    aspect_ratio: 16.0 / 9.0,
                },
            },
            last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };
        
        console_log!("✅ World Manager initialized with streaming: {}", config.streaming_enabled);
        system
    }

    // Configuration management
    pub fn update_config(&mut self, config: StreamingConfig) {
        self.config = config.clone();
        self.lod_manager.enabled = config.lod_enabled;
        self.culling_manager.enabled = config.culling_enabled;
    }

    pub fn get_config(&self) -> StreamingConfig {
        self.config.clone()
    }

    // Viewport management
    pub fn update_viewport(&mut self, viewport: WorldViewport) {
        self.viewport = viewport.clone();
        self.lod_manager.current_viewport = viewport.clone();
        self.culling_manager.viewport = viewport.clone();
        
        if self.culling_manager.enabled {
            self.culling_manager.update_frustum_planes(&viewport);
        }
    }

    pub fn get_viewport(&self) -> WorldViewport {
        self.viewport.clone()
    }

    // World streaming
    pub fn update_streaming(&mut self) -> Result<(), String> {
        if !self.config.streaming_enabled {
            return Ok(());
        }

        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        // Update streaming queue
        self.update_streaming_queue()?;
        
        // Process streaming queue
        self.process_streaming_queue(current_time)?;
        
        // Update chunk statuses
        self.update_chunk_statuses(current_time)?;
        
        // Update LOD levels
        if self.lod_manager.enabled {
            self.update_lod_levels()?;
        }
        
        // Perform culling
        if self.culling_manager.enabled {
            self.perform_culling()?;
        }
        
        // Update stats
        self.update_stats(current_time);
        
        Ok(())
    }

    fn update_streaming_queue(&mut self) -> Result<(), String> {
        let viewport_pos = self.viewport.position;
        let chunk_size = self.config.chunk_size;
        
        // Calculate which chunks should be loaded based on viewport position
        let load_radius = (self.config.load_distance / chunk_size) as i32;
        let chunk_x = (viewport_pos[0] / chunk_size) as i32;
        let chunk_y = (viewport_pos[1] / chunk_size) as i32;
        let chunk_z = (viewport_pos[2] / chunk_size) as i32;
        
        // Clear current queue
        self.streaming_queue.clear();
        
        // Add chunks to loading queue
        for x in (chunk_x - load_radius)..=(chunk_x + load_radius) {
            for y in (chunk_y - load_radius)..=(chunk_y + load_radius) {
                for z in (chunk_z - load_radius)..=(chunk_z + load_radius) {
                    let chunk_id = format!("chunk_{}_{}_{}", x, y, z);
                    
                    // Check if chunk is already loaded
                    if !self.chunks.contains_key(&chunk_id) {
                        // Calculate distance from viewport
                        let chunk_center_x = (x as f32 + 0.5) * chunk_size;
                        let chunk_center_y = (y as f32 + 0.5) * chunk_size;
                        let chunk_center_z = (z as f32 + 0.5) * chunk_size;
                        
                        let dx = chunk_center_x - viewport_pos[0];
                        let dy = chunk_center_y - viewport_pos[1];
                        let dz = chunk_center_z - viewport_pos[2];
                        let distance = (dx * dx + dy * dy + dz * dz).sqrt();
                        
                        if distance <= self.config.load_distance {
                            self.streaming_queue.push(chunk_id);
                        }
                    }
                }
            }
        }
        
        // Sort queue by distance (closest first)
        let viewport_pos_clone = viewport_pos.clone();
        self.streaming_queue.sort_by(|a, b| {
            let dist_a = Self::calculate_chunk_distance_static(a, &viewport_pos_clone, self.config.chunk_size);
            let dist_b = Self::calculate_chunk_distance_static(b, &viewport_pos_clone, self.config.chunk_size);
            dist_a.partial_cmp(&dist_b).unwrap_or(std::cmp::Ordering::Equal)
        });
        
        Ok(())
    }

    fn process_streaming_queue(&mut self, current_time: u64) -> Result<(), String> {
        let mut chunks_to_load = Vec::new();
        let mut chunks_to_unload = Vec::new();
        
        // Determine chunks to load
        for chunk_id in &self.streaming_queue {
            if self.chunks.len() >= self.config.max_loaded_chunks as usize {
                break;
            }
            
            if !self.chunks.contains_key(chunk_id) {
                chunks_to_load.push(chunk_id.clone());
            }
        }
        
        // Determine chunks to unload
        let viewport_pos = self.viewport.position;
        let chunk_size = self.config.chunk_size;
        for (chunk_id, _chunk) in &self.chunks {
            let distance = Self::calculate_chunk_distance_static(chunk_id, &viewport_pos, chunk_size);
            
            if distance > self.config.unload_distance {
                chunks_to_unload.push(chunk_id.clone());
            }
        }
        
        // Load new chunks
        for chunk_id in chunks_to_load {
            self.load_chunk(&chunk_id, current_time)?;
        }
        
        // Unload distant chunks
        for chunk_id in chunks_to_unload {
            self.unload_chunk(&chunk_id)?;
        }
        
        Ok(())
    }

    fn load_chunk(&mut self, chunk_id: &str, current_time: u64) -> Result<(), String> {
        // Check if chunk is in cache
        if let Some(cached_chunk) = self.chunk_cache.remove(chunk_id) {
            console_log!("📦 Loading chunk {} from cache", chunk_id);
            self.chunks.insert(chunk_id.to_string(), cached_chunk);
        } else {
            // Generate new chunk
            console_log!("🏗️ Generating new chunk {}", chunk_id);
            let chunk = self.generate_chunk(chunk_id, current_time)?;
            self.chunks.insert(chunk_id.to_string(), chunk);
        }
        
        Ok(())
    }

    fn unload_chunk(&mut self, chunk_id: &str) -> Result<(), String> {
        if let Some(chunk) = self.chunks.remove(chunk_id) {
            console_log!("🗑️ Unloading chunk {}", chunk_id);
            
            // Add to cache if space permits
            if self.chunk_cache.len() < 100 {
                self.chunk_cache.insert(chunk_id.to_string(), chunk);
            }
        }
        
        Ok(())
    }

    fn generate_chunk(&self, chunk_id: &str, current_time: u64) -> Result<WorldChunk, String> {
        // Parse chunk coordinates from ID
        let parts: Vec<&str> = chunk_id.split('_').collect();
        if parts.len() != 4 {
            return Err("Invalid chunk ID format".to_string());
        }
        
        let x = parts[1].parse::<i32>().unwrap_or(0);
        let y = parts[2].parse::<i32>().unwrap_or(0);
        let z = parts[3].parse::<i32>().unwrap_or(0);
        
        // Generate terrain data
        let terrain = self.generate_terrain_data(x, y, z)?;
        
        // Generate some objects
        let objects = self.generate_chunk_objects(x, y, z)?;
        
        Ok(WorldChunk {
            id: chunk_id.to_string(),
            x,
            y,
            z,
            size: self.config.chunk_size,
            status: WorldChunkStatus::Loaded,
            lod_level: LODLevel::Highest,
            objects,
            terrain,
            last_accessed: current_time,
            load_time: current_time,
            memory_usage: 1024 * 1024, // 1MB placeholder
            visible: true,
            active: true,
        })
    }

    fn generate_terrain_data(&self, x: i32, y: i32, z: i32) -> Result<TerrainData, String> {
        let width: u32 = 64;
        let height: u32 = 64;
        let mut heightmap = Vec::with_capacity((width * height) as usize);
        
        // Simple procedural terrain generation
        for i in 0..height {
            for j in 0..width {
                let world_x = (x as f32 * self.config.chunk_size) + (j as f32 / width as f32) * self.config.chunk_size;
                let world_z = (z as f32 * self.config.chunk_size) + (i as f32 / height as f32) * self.config.chunk_size;
                
                // Simple noise function
                let height_value = (world_x * 0.01).sin() * (world_z * 0.01).cos() * 10.0;
                heightmap.push(height_value);
            }
        }
        
        Ok(TerrainData {
            heightmap,
            width,
            height,
            scale: 1.0,
            material_ids: vec!["grass".to_string(), "stone".to_string(), "dirt".to_string()],
        })
    }

    fn generate_chunk_objects(&self, x: i32, y: i32, z: i32) -> Result<Vec<WorldObject>, String> {
        let mut objects = Vec::new();
        let chunk_center_x = (x as f32 + 0.5) * self.config.chunk_size;
        let chunk_center_y = (y as f32 + 0.5) * self.config.chunk_size;
        let chunk_center_z = (z as f32 + 0.5) * self.config.chunk_size;
        
        // Generate some random objects
        for i in 0..5 {
            let object_id = format!("object_{}_{}_{}_{}", x, y, z, i);
            let offset_x = (i as f32 - 2.0) * 20.0;
            let offset_z = (i as f32 - 2.0) * 20.0;
            
            objects.push(WorldObject {
                id: object_id,
                object_type: "tree".to_string(),
                position: [
                    chunk_center_x + offset_x,
                    chunk_center_y,
                    chunk_center_z + offset_z,
                ],
                rotation: [0.0, 1.0, 0.0, 0.0],
                scale: [1.0, 1.0, 1.0],
                lod_levels: vec![
                    LODData {
                        level: LODLevel::Highest,
                        mesh_id: "tree_high".to_string(),
                        material_id: "tree_material".to_string(),
                        distance_threshold: 10.0,
                        triangle_count: 1000,
                    },
                    LODData {
                        level: LODLevel::Low,
                        mesh_id: "tree_low".to_string(),
                        material_id: "tree_material".to_string(),
                        distance_threshold: 50.0,
                        triangle_count: 100,
                    },
                ],
                bounding_box: BoundingBox {
                    min: [-1.0, 0.0, -1.0],
                    max: [1.0, 10.0, 1.0],
                },
                visible: true,
                culled: false,
                last_updated: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            });
        }
        
        Ok(objects)
    }

    fn calculate_chunk_distance(&self, chunk_id: &str, viewport_pos: &[f32; 3]) -> f32 {
        Self::calculate_chunk_distance_static(chunk_id, viewport_pos, self.config.chunk_size)
    }

    fn calculate_chunk_distance_static(chunk_id: &str, viewport_pos: &[f32; 3], chunk_size: f32) -> f32 {
        // Parse chunk coordinates from ID
        let parts: Vec<&str> = chunk_id.split('_').collect();
        if parts.len() == 4 {
            if let (Ok(x), Ok(y), Ok(z)) = (
                parts[1].parse::<i32>(),
                parts[2].parse::<i32>(),
                parts[3].parse::<i32>(),
            ) {
                let chunk_center_x = (x as f32 + 0.5) * chunk_size;
                let chunk_center_y = (y as f32 + 0.5) * chunk_size;
                let chunk_center_z = (z as f32 + 0.5) * chunk_size;
                
                let dx = chunk_center_x - viewport_pos[0];
                let dy = chunk_center_y - viewport_pos[1];
                let dz = chunk_center_z - viewport_pos[2];
                
                return (dx * dx + dy * dy + dz * dz).sqrt();
            }
        }
        
        f32::MAX
    }

    fn update_chunk_statuses(&mut self, current_time: u64) -> Result<(), String> {
        let viewport_pos = self.viewport.position;
        let chunk_size = self.config.chunk_size;
        
        for chunk in self.chunks.values_mut() {
            let distance = Self::calculate_chunk_distance_static(&chunk.id, &viewport_pos, chunk_size);
            
            // Update chunk status based on distance
            if distance <= self.config.load_distance {
                if chunk.status == WorldChunkStatus::Loaded {
                    chunk.status = WorldChunkStatus::Active;
                }
                chunk.active = true;
                chunk.visible = true;
            } else if distance > self.config.unload_distance {
                if chunk.status == WorldChunkStatus::Active {
                    chunk.status = WorldChunkStatus::Unloading;
                }
                chunk.active = false;
                chunk.visible = false;
            }
            
            chunk.last_accessed = current_time;
        }
        
        Ok(())
    }

    fn update_lod_levels(&mut self) -> Result<(), String> {
        let viewport_pos = self.viewport.position;
        let chunk_size = self.config.chunk_size;
        
        for chunk in self.chunks.values_mut() {
            let distance = Self::calculate_chunk_distance_static(&chunk.id, &viewport_pos, chunk_size);
            
            // Determine LOD level based on distance
            let new_lod_level = self.lod_manager.determine_lod_level(distance);
            
            if new_lod_level != chunk.lod_level {
                chunk.lod_level = new_lod_level.clone();
                console_log!("🔍 Updated LOD for chunk {} to {:?}", chunk.id, new_lod_level);
            }
        }
        
        Ok(())
    }

    fn perform_culling(&mut self) -> Result<(), String> {
        let mut total_objects = 0;
        let mut culled_objects = 0;
        
        for chunk in self.chunks.values_mut() {
            if !chunk.visible {
                continue;
            }
            
            for object in chunk.objects.iter_mut() {
                total_objects += 1;
                
                // Perform frustum culling
                let should_cull = self.culling_manager.should_cull_object(&object.bounding_box);
                
                if should_cull {
                    object.culled = true;
                    object.visible = false;
                    culled_objects += 1;
                } else {
                    object.culled = false;
                    object.visible = true;
                }
            }
        }
        
        console_log!("🎯 Culled {}/{} objects", culled_objects, total_objects);
        
        Ok(())
    }

    fn update_stats(&mut self, current_time: u64) {
        self.stats.total_chunks = self.chunks.len() as u32;
        self.stats.loaded_chunks = self.chunks.values()
            .filter(|c| c.status == WorldChunkStatus::Loaded || c.status == WorldChunkStatus::Active)
            .count() as u32;
        self.stats.active_chunks = self.chunks.values()
            .filter(|c| c.status == WorldChunkStatus::Active)
            .count() as u32;
        
        self.stats.visible_objects = self.chunks.values()
            .flat_map(|c| c.objects.iter())
            .filter(|o| o.visible)
            .count() as u32;
        
        self.stats.culled_objects = self.chunks.values()
            .flat_map(|c| c.objects.iter())
            .filter(|o| o.culled)
            .count() as u32;
        
        self.stats.memory_usage = self.chunks.values()
            .map(|c| c.memory_usage)
            .sum();
        
        self.stats.streaming_queue_size = self.streaming_queue.len() as u32;
        self.stats.last_update = current_time;
    }

    // Utility methods
    pub fn get_chunk(&self, chunk_id: &str) -> Option<&WorldChunk> {
        self.chunks.get(chunk_id)
    }

    pub fn get_visible_chunks(&self) -> Vec<&WorldChunk> {
        self.chunks.values()
            .filter(|c| c.visible && c.active)
            .collect()
    }

    pub fn get_visible_objects(&self) -> Vec<&WorldObject> {
        self.chunks.values()
            .flat_map(|c| c.objects.iter())
            .filter(|o| o.visible && !o.culled)
            .collect()
    }

    pub fn get_stats(&self) -> WorldStats {
        self.stats.clone()
    }

    pub fn get_world_summary(&self) -> String {
        format!(
            "World Manager: {} chunks loaded, {} active, {} objects visible, {}MB memory usage",
            self.stats.loaded_chunks,
            self.stats.active_chunks,
            self.stats.visible_objects,
            self.stats.memory_usage / (1024 * 1024)
        )
    }

    // World serialization methods
    pub fn save_world(&self, name: &str, author: &str, description: &str) -> Result<WorldSaveData, String> {
        console_log!("💾 Saving world: {}", name);
        
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let total_objects: u32 = self.chunks.values()
            .map(|c| c.objects.len() as u32)
            .sum();
        
        let metadata = WorldMetadata {
            author: author.to_string(),
            description: description.to_string(),
            tags: vec!["procedural".to_string(), "3d".to_string()],
            world_size: [
                self.config.load_distance * 2.0,
                self.config.load_distance * 2.0,
                self.config.load_distance * 2.0,
            ],
            total_objects,
            creation_time: current_time,
            last_modified: current_time,
        };
        
        let chunks: Vec<WorldChunk> = self.chunks.values().cloned().collect();
        
        Ok(WorldSaveData {
            version: "1.0.0".to_string(),
            name: name.to_string(),
            timestamp: current_time,
            config: self.config.clone(),
            chunks,
            metadata,
        })
    }

    pub fn load_world(&mut self, save_data: WorldSaveData) -> Result<(), String> {
        console_log!("📂 Loading world: {}", save_data.name);
        
        // Clear existing world
        self.chunks.clear();
        self.chunk_cache.clear();
        self.streaming_queue.clear();
        
        // Apply configuration
        self.config = save_data.config.clone();
        self.lod_manager.enabled = save_data.config.lod_enabled;
        self.culling_manager.enabled = save_data.config.culling_enabled;
        
        // Load chunks
        for chunk in save_data.chunks {
            self.chunks.insert(chunk.id.clone(), chunk);
        }
        
        console_log!("✅ Loaded {} chunks for world {}", self.chunks.len(), save_data.name);
        
        Ok(())
    }

    pub fn export_world_to_json(&self, name: &str, author: &str, description: &str) -> Result<String, String> {
        let save_data = self.save_world(name, author, description)?;
        match serde_json::to_string_pretty(&save_data) {
            Ok(json) => Ok(json),
            Err(e) => Err(format!("Failed to serialize world to JSON: {}", e)),
        }
    }

    pub fn import_world_from_json(&mut self, json_str: &str) -> Result<(), String> {
        match serde_json::from_str::<WorldSaveData>(json_str) {
            Ok(save_data) => self.load_world(save_data),
            Err(e) => Err(format!("Failed to deserialize world from JSON: {}", e)),
        }
    }

    pub fn export_world_to_binary(&self, name: &str, author: &str, description: &str) -> Result<Vec<u8>, String> {
        let save_data = self.save_world(name, author, description)?;
        match bincode::serialize(&save_data) {
            Ok(binary) => Ok(binary),
            Err(e) => Err(format!("Failed to serialize world to binary: {}", e)),
        }
    }

    pub fn import_world_from_binary(&mut self, binary_data: &[u8]) -> Result<(), String> {
        match bincode::deserialize::<WorldSaveData>(binary_data) {
            Ok(save_data) => self.load_world(save_data),
            Err(e) => Err(format!("Failed to deserialize world from binary: {}", e)),
        }
    }

    pub fn get_world_info(&self) -> WorldMetadata {
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let total_objects: u32 = self.chunks.values()
            .map(|c| c.objects.len() as u32)
            .sum();
        
        WorldMetadata {
            author: "Procedural Pixel Engine".to_string(),
            description: "Generated procedural world".to_string(),
            tags: vec!["procedural".to_string(), "3d".to_string(), "streaming".to_string()],
            world_size: [
                self.config.load_distance * 2.0,
                self.config.load_distance * 2.0,
                self.config.load_distance * 2.0,
            ],
            total_objects,
            creation_time: current_time,
            last_modified: current_time,
        }
    }

    pub fn validate_world_data(&self) -> Result<Vec<String>, String> {
        let mut issues = Vec::new();
        
        // Check chunk consistency
        for (chunk_id, chunk) in &self.chunks {
            if chunk.size != self.config.chunk_size {
                issues.push(format!("Chunk {} has inconsistent size: {}", chunk_id, chunk.size));
            }
            
            // Check object references
            for object in &chunk.objects {
                if object.id.is_empty() {
                    issues.push(format!("Empty object ID in chunk {}", chunk_id));
                }
            }
        }
        
        // Check memory usage
        let total_memory = self.chunks.values()
            .map(|c| c.memory_usage)
            .sum::<u64>();
        
        if total_memory > 1024 * 1024 * 1024 { // 1GB limit
            issues.push(format!("High memory usage: {}MB", total_memory / (1024 * 1024)));
        }
        
        Ok(issues)
    }

    pub fn optimize_world_data(&mut self) -> Result<(), String> {
        console_log!("🔧 Optimizing world data");
        
        // Remove duplicate objects
        for chunk in self.chunks.values_mut() {
            let mut seen_objects = std::collections::HashSet::new();
            chunk.objects.retain(|obj| {
                if seen_objects.contains(&obj.id) {
                    console_log!("Removing duplicate object: {}", obj.id);
                    false
                } else {
                    seen_objects.insert(obj.id.clone());
                    true
                }
            });
        }
        
        // Optimize chunk cache
        if self.chunk_cache.len() > 50 {
            console_log!("Optimizing chunk cache");
            self.chunk_cache.clear();
        }
        
        Ok(())
    }

    // World optimization methods
    pub fn analyze_world_performance(&self) -> Result<WorldPerformanceReport, String> {
        console_log!("📊 Analyzing world performance");
        
        let total_objects: u32 = self.chunks.values()
            .map(|c| c.objects.len() as u32)
            .sum();
        
        let visible_objects: u32 = self.chunks.values()
            .flat_map(|c| c.objects.iter())
            .filter(|o| o.visible && !o.culled)
            .count() as u32;
        
        let culled_objects: u32 = self.chunks.values()
            .flat_map(|c| c.objects.iter())
            .filter(|o| o.culled)
            .count() as u32;
        
        let memory_usage_mb = self.stats.memory_usage / (1024 * 1024);
        let average_chunk_size = if self.chunks.is_empty() { 0.0 } else {
            self.chunks.values()
                .map(|c| c.objects.len())
                .sum::<usize>() as f32 / self.chunks.len() as f32
        };
        
        Ok(WorldPerformanceReport {
            total_chunks: self.chunks.len() as u32,
            loaded_chunks: self.stats.loaded_chunks,
            visible_objects,
            culled_objects,
            memory_usage_mb: memory_usage_mb,
            average_objects_per_chunk: average_chunk_size,
            optimization_suggestions: self.generate_optimization_suggestions(memory_usage_mb, average_chunk_size),
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        })
    }
    
    fn generate_optimization_suggestions(&self, memory_usage_mb: u64, average_objects_per_chunk: f32) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        if memory_usage_mb > 500 {
            suggestions.push("Consider reducing chunk size or object count to lower memory usage".to_string());
        }
        
        if average_objects_per_chunk > 100.0 {
            suggestions.push("High object density detected - consider object pooling or instancing".to_string());
        }
        
        if self.config.load_distance > 300.0 {
            suggestions.push("Large load distance may impact performance - consider reducing to 200-250 units".to_string());
        }
        
        if !self.config.lod_enabled {
            suggestions.push("Enable LOD system to improve performance with distant objects".to_string());
        }
        
        if !self.config.culling_enabled {
            suggestions.push("Enable culling to skip rendering of off-screen objects".to_string());
        }
        
        suggestions
    }

    pub fn apply_optimization_settings(&mut self, settings: WorldOptimizationSettings) -> Result<(), String> {
        console_log!("⚙️ Applying optimization settings");
        
        // Apply LOD settings
        if let Some(lod_enabled) = settings.lod_enabled {
            self.config.lod_enabled = lod_enabled;
            self.lod_manager.enabled = lod_enabled;
        }
        
        // Apply culling settings
        if let Some(culling_enabled) = settings.culling_enabled {
            self.config.culling_enabled = culling_enabled;
            self.culling_manager.enabled = culling_enabled;
        }
        
        // Apply streaming settings
        if let Some(max_loaded_chunks) = settings.max_loaded_chunks {
            self.config.max_loaded_chunks = max_loaded_chunks;
        }
        
        if let Some(load_distance) = settings.load_distance {
            self.config.load_distance = load_distance;
        }
        
        Ok(())
    }

    // World collaboration methods
    pub fn create_world_session(&mut self, session_name: &str, user_id: &str) -> Result<WorldSession, String> {
        console_log!("👥 Creating world session: {} for user {}", session_name, user_id);
        
        let session = WorldSession {
            id: format!("session_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
            name: session_name.to_string(),
            user_id: user_id.to_string(),
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            last_activity: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            active_users: vec![user_id.to_string()],
            changes: Vec::new(),
            permissions: WorldPermissions {
                can_edit: true,
                can_save: true,
                can_load: true,
                can_export: true,
                can_import: true,
                can_delete: false, // Require admin permission
            },
        };
        
        Ok(session)
    }
    
    pub fn add_user_to_session(&mut self, session_id: &str, user_id: &str) -> Result<(), String> {
        console_log!("👤 Adding user {} to session {}", user_id, session_id);
        // Implementation would add user to active session
        Ok(())
    }
    
    pub fn track_world_change(&mut self, session_id: &str, change: WorldChange) -> Result<(), String> {
        console_log!("📝 Tracking world change in session {}", session_id);
        // Implementation would track change for collaboration
        Ok(())
    }
    
    pub fn get_active_sessions(&self) -> Vec<WorldSession> {
        // Implementation would return active collaboration sessions
        Vec::new()
    }
    
    pub fn export_world_for_collaboration(&self, format: &str) -> Result<String, String> {
        console_log!("📤 Exporting world for collaboration in format: {}", format);
        
        match format {
            "json" => self.export_world_to_json("collaborative_world", "Procedural Pixel Engine", "World exported for collaboration"),
            "binary" => {
                let binary_data = self.export_world_to_binary("collaborative_world", "Procedural Pixel Engine", "World exported for collaboration")?;
                Ok(format!("Binary export completed: {} bytes", binary_data.len()))
            }
            _ => Err("Unsupported export format".to_string()),
        }
    }
}

impl LODManager {
    pub fn determine_lod_level(&self, distance: f32) -> LODLevel {
        for level in &self.levels {
            if let Some(&threshold) = self.distance_thresholds.get(level) {
                if distance <= threshold {
                    return level.clone();
                }
            }
        }
        
        LODLevel::Lowest
    }
}

impl CullingManager {
    pub fn update_frustum_planes(&mut self, _viewport: &WorldViewport) {
        // Calculate frustum planes based on viewport
        // This is a simplified implementation - a real implementation would use proper matrix calculations
        
        // For now, just set some default planes
        self.frustum_planes = [
            [-1.0, 0.0, 0.0, 100.0], // Left
            [1.0, 0.0, 0.0, 100.0],  // Right
            [0.0, -1.0, 0.0, 100.0], // Top
            [0.0, 1.0, 0.0, 100.0],  // Bottom
            [0.0, 0.0, -1.0, 1.0],   // Near
            [0.0, 0.0, 1.0, 1000.0], // Far
        ];
    }

    pub fn should_cull_object(&self, bounding_box: &BoundingBox) -> bool {
        match self.method {
            CullingMethod::Frustum => self.frustum_cull(bounding_box),
            CullingMethod::Distance => self.distance_cull(bounding_box),
            CullingMethod::Occlusion => false, // Placeholder
            CullingMethod::Combined => {
                self.frustum_cull(bounding_box) || self.distance_cull(bounding_box)
            }
        }
    }

    fn frustum_cull(&self, bounding_box: &BoundingBox) -> bool {
        // Simple frustum culling - check if bounding box is outside any frustum plane
        for plane in &self.frustum_planes {
            if self.is_outside_plane(bounding_box, plane) {
                return true;
            }
        }
        false
    }

    fn distance_cull(&self, bounding_box: &BoundingBox) -> bool {
        // Calculate distance from bounding box center to viewport
        let center_x = (bounding_box.min[0] + bounding_box.max[0]) / 2.0;
        let center_y = (bounding_box.min[1] + bounding_box.max[1]) / 2.0;
        let center_z = (bounding_box.min[2] + bounding_box.max[2]) / 2.0;
        
        let dx = center_x - self.viewport.position[0];
        let dy = center_y - self.viewport.position[1];
        let dz = center_z - self.viewport.position[2];
        
        let distance = (dx * dx + dy * dy + dz * dz).sqrt();
        
        // Cull objects beyond far plane
        distance > self.viewport.far_plane
    }

    fn is_outside_plane(&self, bounding_box: &BoundingBox, plane: &[f32; 4]) -> bool {
        // Check if all corners of the bounding box are outside the plane
        let corners = [
            [bounding_box.min[0], bounding_box.min[1], bounding_box.min[2]],
            [bounding_box.max[0], bounding_box.min[1], bounding_box.min[2]],
            [bounding_box.min[0], bounding_box.max[1], bounding_box.min[2]],
            [bounding_box.max[0], bounding_box.max[1], bounding_box.min[2]],
            [bounding_box.min[0], bounding_box.min[1], bounding_box.max[2]],
            [bounding_box.max[0], bounding_box.min[1], bounding_box.max[2]],
            [bounding_box.min[0], bounding_box.max[1], bounding_box.max[2]],
            [bounding_box.max[0], bounding_box.max[1], bounding_box.max[2]],
        ];
        
        for corner in &corners {
            let distance = plane[0] * corner[0] + plane[1] * corner[1] + plane[2] * corner[2] + plane[3];
            if distance >= 0.0 {
                return false; // At least one corner is inside or on the plane
            }
        }
        
        true // All corners are outside the plane
    }
}

// WASM exports
#[wasm_bindgen]
pub struct WorldManagerExport {
    inner: std::sync::Arc<std::sync::Mutex<WorldManager>>,
}

#[wasm_bindgen]
impl WorldManagerExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<WorldManagerExport, JsValue> {
        let config: StreamingConfig = serde_wasm_bindgen::from_value(config)?;
        let world_manager = WorldManager::new(config);
        Ok(WorldManagerExport {
            inner: std::sync::Arc::new(std::sync::Mutex::new(world_manager)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: StreamingConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let world_manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&world_manager.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn update_viewport(&self, viewport: JsValue) -> Result<(), JsValue> {
        let viewport: WorldViewport = serde_wasm_bindgen::from_value(viewport)?;
        self.inner.lock().unwrap().update_viewport(viewport);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn update_streaming(&self) -> Result<(), JsValue> {
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.update_streaming() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let world_manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&world_manager.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_world_summary(&self) -> String {
        self.inner.lock().unwrap().get_world_summary()
    }

    #[wasm_bindgen]
    pub fn save_world(&self, name: &str, author: &str, description: &str) -> Result<JsValue, JsValue> {
        let world_manager = self.inner.lock().unwrap();
        match world_manager.save_world(name, author, description) {
            Ok(save_data) => Ok(serde_wasm_bindgen::to_value(&save_data).unwrap()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn load_world(&self, save_data: JsValue) -> Result<(), JsValue> {
        let save_data: WorldSaveData = serde_wasm_bindgen::from_value(save_data)?;
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.load_world(save_data) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn export_world_to_json(&self, name: &str, author: &str, description: &str) -> Result<String, JsValue> {
        let world_manager = self.inner.lock().unwrap();
        match world_manager.export_world_to_json(name, author, description) {
            Ok(json) => Ok(json),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn import_world_from_json(&self, json_str: &str) -> Result<(), JsValue> {
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.import_world_from_json(json_str) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_world_info(&self) -> JsValue {
        let world_manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&world_manager.get_world_info()).unwrap()
    }

    #[wasm_bindgen]
    pub fn validate_world_data(&self) -> Result<JsValue, JsValue> {
        let world_manager = self.inner.lock().unwrap();
        match world_manager.validate_world_data() {
            Ok(issues) => Ok(serde_wasm_bindgen::to_value(&issues).unwrap()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn optimize_world_data(&self) -> Result<(), JsValue> {
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.optimize_world_data() {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn analyze_world_performance(&self) -> Result<JsValue, JsValue> {
        let world_manager = self.inner.lock().unwrap();
        match world_manager.analyze_world_performance() {
            Ok(report) => Ok(serde_wasm_bindgen::to_value(&report).unwrap()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn create_world_session(&self, session_name: &str, user_id: &str) -> Result<JsValue, JsValue> {
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.create_world_session(session_name, user_id) {
            Ok(session) => Ok(serde_wasm_bindgen::to_value(&session).unwrap()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn add_user_to_session(&self, session_id: &str, user_id: &str) -> Result<(), JsValue> {
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.add_user_to_session(session_id, user_id) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn track_world_change(&self, session_id: &str, change: JsValue) -> Result<(), JsValue> {
        let change: WorldChange = serde_wasm_bindgen::from_value(change)?;
        let mut world_manager = self.inner.lock().unwrap();
        match world_manager.track_world_change(session_id, change) {
            Ok(()) => Ok(()),
            Err(error) => Err(JsValue::from_str(&error)),
        }
    }

    #[wasm_bindgen]
    pub fn get_active_sessions(&self) -> JsValue {
        let world_manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&world_manager.get_active_sessions()).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_streaming_config() -> JsValue {
    let config = StreamingConfig {
        chunk_size: 64.0,
        load_distance: 200.0,
        unload_distance: 300.0,
        max_loaded_chunks: 100,
        streaming_enabled: true,
        lod_enabled: true,
        culling_enabled: true,
        background_loading: true,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_world_viewport() -> JsValue {
    let viewport = WorldViewport {
        position: [0.0, 0.0, 0.0],
        direction: [0.0, 0.0, 1.0],
        up: [0.0, 1.0, 0.0],
        fov: 60.0,
        near_plane: 0.1,
        far_plane: 1000.0,
        aspect_ratio: 16.0 / 9.0,
    };
    serde_wasm_bindgen::to_value(&viewport).unwrap()
}

#[wasm_bindgen]
pub fn create_serialization_format() -> JsValue {
    let format = SerializationFormat {
        format_type: "json".to_string(),
        compression: true,
        version: "1.0.0".to_string(),
    };
    serde_wasm_bindgen::to_value(&format).unwrap()
}

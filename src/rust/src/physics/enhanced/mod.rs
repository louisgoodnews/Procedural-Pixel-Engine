use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;
use std::collections::HashMap;
use crate::math::Vector3;
use super::PhysicsBody;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum JointType {
    Revolute,
    Prismatic,
    Spherical,
    Weld,
    Fixed,
    Distance,
    Hinge,
    Slider,
    Universal,
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum MaterialType {
    Static,
    Dynamic,
    Kinematic,
    Trigger,
    Sensor,
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum ShapeType {
    Sphere,
    Box,
    Capsule,
    Cylinder,
    Cone,
    Mesh,
    Heightfield,
    Compound,
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct Joint {
    pub id: String,
    pub joint_type: JointType,
    pub body_a_id: String,
    pub body_b_id: String,
    pub anchor_a: Vector3,
    pub anchor_b: Vector3,
    pub axis: Vector3,
    pub limits: JointLimits,
    pub motor: JointMotor,
    pub is_enabled: bool,
    pub break_force: f32,
    pub break_torque: f32,
    pub is_broken: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct JointLimits {
    pub lower_limit: f32,
    pub upper_limit: f32,
    pub motor_speed: f32,
    pub motor_force: f32,
    pub stiffness: f32,
    pub damping: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct JointMotor {
    pub target_velocity: f32,
    pub max_force: f32,
    pub is_enabled: bool,
    pub motor_type: MotorType,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum MotorType {
    Velocity,
    Position,
    Angular,
    Linear,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub material_type: MaterialType,
    pub density: f32,
    pub friction: f32,
    pub restitution: f32,
    pub rolling_friction: f32,
    pub spinning_friction: f32,
    pub hardness: f32,
    pub elasticity: f32,
    pub durability: f32,
    pub heat_capacity: f32,
    pub thermal_conductivity: f32,
    pub electrical_conductivity: f32,
    pub magnetic_permeability: f32,
    pub color: [f32; 4],
    pub texture_id: Option<String>,
    pub custom_properties: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct RaycastHit {
    pub point: Vector3,
    pub normal: Vector3,
    pub distance: f32,
    pub body_id: String,
    pub material_id: String,
    pub face_index: u32,
    pub triangle_index: u32,
    pub uv_coords: [f32; 2],
    pub is_valid: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct RaycastResult {
    pub hits: Vec<RaycastHit>,
    pub ray_origin: Vector3,
    pub ray_direction: Vector3,
    pub max_distance: f32,
    pub hit_count: u32,
    pub closest_hit: Option<RaycastHit>,
    pub farthest_hit: Option<RaycastHit>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct EnhancedCollisionShape {
    pub id: String,
    pub shape_type: ShapeType,
    pub dimensions: Vector3,
    pub radius: f32,
    pub height: f32,
    pub vertices: Vec<Vector3>,
    pub indices: Vec<u32>,
    pub transform: [f32; 16], // 4x4 matrix
    pub is_trigger: bool,
    pub is_sensor: bool,
    pub layer_mask: u32,
    pub collision_mask: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct PhysicsConfig {
    pub enable_joints: bool,
    pub enable_raycasting: bool,
    pub enable_materials: bool,
    pub enable_advanced_collision: bool,
    pub enable_continuous_collision: bool,
    pub enable_substepping: bool,
    pub substep_count: u32,
    pub solver_iterations: u32,
    pub warm_starting: bool,
    pub enable_sleeping: bool,
    pub sleep_threshold: f32,
    pub enable_debug_rendering: bool,
    pub max_velocity: f32,
    pub max_angular_velocity: f32,
    pub gravity_scale: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct PhysicsStats {
    pub total_bodies: u32,
    pub active_bodies: u32,
    pub sleeping_bodies: u32,
    pub total_joints: u32,
    pub active_joints: u32,
    pub broken_joints: u32,
    pub total_materials: u32,
    pub raycast_count: u32,
    pub collision_count: u32,
    pub solver_iterations_used: u32,
    pub simulation_time: f32,
    pub broadphase_time: f32,
    pub narrowphase_time: f32,
    pub solver_time: f32,
}

pub struct EnhancedPhysicsEngine {
    config: PhysicsConfig,
    joints: HashMap<String, Joint>,
    materials: HashMap<String, Material>,
    collision_shapes: HashMap<String, EnhancedCollisionShape>,
    raycast_cache: Vec<RaycastResult>,
    stats: PhysicsStats,
    joint_solver: Option<JointSolver>,
    collision_detector: Option<CollisionDetector>,
    material_system: Option<MaterialSystem>,
}

impl EnhancedPhysicsEngine {
    pub fn new(config: PhysicsConfig) -> EnhancedPhysicsEngine {
        console_log("🔬 Initializing Enhanced Physics Engine...");
        
        let mut engine = EnhancedPhysicsEngine {
            config: config.clone(),
            joints: HashMap::new(),
            materials: HashMap::new(),
            collision_shapes: HashMap::new(),
            raycast_cache: Vec::new(),
            stats: PhysicsStats {
                total_bodies: 0,
                active_bodies: 0,
                sleeping_bodies: 0,
                total_joints: 0,
                active_joints: 0,
                broken_joints: 0,
                total_materials: 0,
                raycast_count: 0,
                collision_count: 0,
                solver_iterations_used: 0,
                simulation_time: 0.0,
                broadphase_time: 0.0,
                narrowphase_time: 0.0,
                solver_time: 0.0,
            },
            joint_solver: None,
            collision_detector: None,
            material_system: None,
        };
        
        // Initialize subsystems
        if config.enable_joints {
            engine.joint_solver = Some(JointSolver::new(config.solver_iterations));
        }
        
        if config.enable_advanced_collision {
            engine.collision_detector = Some(CollisionDetector::new());
        }
        
        if config.enable_materials {
            engine.material_system = Some(MaterialSystem::new());
        }
        
        // Initialize default materials
        engine.initialize_default_materials();
        
        console_log("✅ Enhanced Physics Engine initialized successfully");
        engine
    }
    
    pub fn update_config(&mut self, config: PhysicsConfig) {
        self.config = config;
        
        // Update subsystems
        if self.config.enable_joints {
            if self.joint_solver.is_none() {
                self.joint_solver = Some(JointSolver::new(self.config.solver_iterations));
            }
        } else {
            self.joint_solver = None;
        }
        
        if self.config.enable_advanced_collision {
            if self.collision_detector.is_none() {
                self.collision_detector = Some(CollisionDetector::new());
            }
        } else {
            self.collision_detector = None;
        }
        
        if self.config.enable_materials {
            if self.material_system.is_none() {
                self.material_system = Some(MaterialSystem::new());
            }
        } else {
            self.material_system = None;
        }
    }
    
    pub fn get_config(&self) -> PhysicsConfig {
        self.config.clone()
    }
    
    pub fn get_stats(&self) -> PhysicsStats {
        self.stats.clone()
    }
    
    // Joint Management
    pub fn add_joint(&mut self, joint: Joint) -> Result<(), String> {
        // Validate joint
        if joint.id.is_empty() || joint.body_a_id.is_empty() || joint.body_b_id.is_empty() {
            return Err("Joint ID and body IDs are required".to_string());
        }
        
        // Check for duplicate ID
        if self.joints.contains_key(&joint.id) {
            return Err("Joint ID already exists".to_string());
        }
        
        // Add joint
        self.joints.insert(joint.id.clone(), joint.clone());
        self.stats.total_joints += 1;
        
        if joint.is_enabled {
            self.stats.active_joints += 1;
        }
        
        console_log(&format!("🔗 Added joint: {}", joint.id));
        Ok(())
    }
    
    pub fn remove_joint(&mut self, joint_id: &str) -> Result<(), String> {
        if let Some(joint) = self.joints.remove(joint_id) {
            self.stats.total_joints -= 1;
            
            if joint.is_enabled {
                self.stats.active_joints -= 1;
            }
            
            if joint.is_broken {
                self.stats.broken_joints -= 1;
            }
            
            console_log(&format!("🔗 Removed joint: {}", joint.id));
            Ok(())
        } else {
            Err("Joint not found".to_string())
        }
    }
    
    pub fn get_joints(&self) -> Vec<Joint> {
        self.joints.values().cloned().collect()
    }
    
    pub fn get_joint(&self, joint_id: &str) -> Option<Joint> {
        self.joints.get(joint_id).cloned()
    }
    
    pub fn enable_joint(&mut self, joint_id: &str) -> Result<(), String> {
        if let Some(joint) = self.joints.get_mut(joint_id) {
            if !joint.is_enabled {
                joint.is_enabled = true;
                self.stats.active_joints += 1;
                console_log(&format!("✅ Enabled joint: {}", joint.id));
            }
            Ok(())
        } else {
            Err("Joint not found".to_string())
        }
    }
    
    pub fn disable_joint(&mut self, joint_id: &str) -> Result<(), String> {
        if let Some(joint) = self.joints.get_mut(joint_id) {
            if joint.is_enabled {
                joint.is_enabled = false;
                self.stats.active_joints -= 1;
                console_log(&format!("❌ Disabled joint: {}", joint.id));
            }
            Ok(())
        } else {
            Err("Joint not found".to_string())
        }
    }
    
    pub fn break_joint(&mut self, joint_id: &str) -> Result<(), String> {
        if let Some(joint) = self.joints.get_mut(joint_id) {
            if !joint.is_broken {
                joint.is_broken = true;
                joint.is_enabled = false;
                self.stats.broken_joints += 1;
                self.stats.active_joints -= 1;
                console_log(&format!("💥 Broken joint: {}", joint.id));
            }
            Ok(())
        } else {
            Err("Joint not found".to_string())
        }
    }
    
    // Material Management
    fn initialize_default_materials(&mut self) {
        // Default material
        let default_material = Material {
            id: "default".to_string(),
            name: "Default Material".to_string(),
            material_type: MaterialType::Dynamic,
            density: 1.0,
            friction: 0.5,
            restitution: 0.3,
            rolling_friction: 0.1,
            spinning_friction: 0.1,
            hardness: 1.0,
            elasticity: 0.5,
            durability: 100.0,
            heat_capacity: 1.0,
            thermal_conductivity: 0.1,
            electrical_conductivity: 0.0,
            magnetic_permeability: 1.0,
            color: [0.5, 0.5, 0.5, 1.0],
            texture_id: None,
            custom_properties: HashMap::new(),
        };
        self.materials.insert(default_material.id.clone(), default_material);
        
        // Metal material
        let metal_material = Material {
            id: "metal".to_string(),
            name: "Metal".to_string(),
            material_type: MaterialType::Dynamic,
            density: 7.8,
            friction: 0.7,
            restitution: 0.1,
            rolling_friction: 0.05,
            spinning_friction: 0.05,
            hardness: 5.0,
            elasticity: 0.2,
            durability: 500.0,
            heat_capacity: 0.5,
            thermal_conductivity: 50.0,
            electrical_conductivity: 1000000.0,
            magnetic_permeability: 100.0,
            color: [0.7, 0.7, 0.8, 1.0],
            texture_id: None,
            custom_properties: HashMap::new(),
        };
        self.materials.insert(metal_material.id.clone(), metal_material);
        
        // Rubber material
        let rubber_material = Material {
            id: "rubber".to_string(),
            name: "Rubber".to_string(),
            material_type: MaterialType::Dynamic,
            density: 1.2,
            friction: 0.9,
            restitution: 0.8,
            rolling_friction: 0.3,
            spinning_friction: 0.3,
            hardness: 0.5,
            elasticity: 0.9,
            durability: 200.0,
            heat_capacity: 2.0,
            thermal_conductivity: 0.2,
            electrical_conductivity: 0.0,
            magnetic_permeability: 1.0,
            color: [0.2, 0.2, 0.2, 1.0],
            texture_id: None,
            custom_properties: HashMap::new(),
        };
        self.materials.insert(rubber_material.id.clone(), rubber_material);
        
        // Glass material
        let glass_material = Material {
            id: "glass".to_string(),
            name: "Glass".to_string(),
            material_type: MaterialType::Dynamic,
            density: 2.5,
            friction: 0.3,
            restitution: 0.05,
            rolling_friction: 0.01,
            spinning_friction: 0.01,
            hardness: 6.0,
            elasticity: 0.1,
            durability: 50.0,
            heat_capacity: 0.8,
            thermal_conductivity: 1.0,
            electrical_conductivity: 0.0,
            magnetic_permeability: 1.0,
            color: [0.8, 0.9, 1.0, 0.7],
            texture_id: None,
            custom_properties: HashMap::new(),
        };
        self.materials.insert(glass_material.id.clone(), glass_material);
        
        self.stats.total_materials = self.materials.len() as u32;
        
        console_log(&format!("🧪 Initialized {} materials", self.materials.len()));
    }
    
    pub fn add_material(&mut self, material: Material) -> Result<(), String> {
        // Validate material
        if material.id.is_empty() || material.name.is_empty() {
            return Err("Material ID and name are required".to_string());
        }
        
        // Check for duplicate ID
        if self.materials.contains_key(&material.id) {
            return Err("Material ID already exists".to_string());
        }
        
        // Add material
        self.materials.insert(material.id.clone(), material.clone());
        self.stats.total_materials += 1;
        
        console_log(&format!("🧪 Added material: {}", material.name));
        Ok(())
    }
    
    pub fn remove_material(&mut self, material_id: &str) -> Result<(), String> {
        if let Some(material) = self.materials.remove(material_id) {
            self.stats.total_materials -= 1;
            console_log(&format!("🧪 Removed material: {}", material.name));
            Ok(())
        } else {
            Err("Material not found".to_string())
        }
    }
    
    pub fn get_materials(&self) -> Vec<Material> {
        self.materials.values().cloned().collect()
    }
    
    pub fn get_material(&self, material_id: &str) -> Option<Material> {
        self.materials.get(material_id).cloned()
    }
    
    // Raycasting
    pub fn raycast(&mut self, origin: Vector3, direction: Vector3, max_distance: f32) -> RaycastResult {
        if !self.config.enable_raycasting {
            return RaycastResult {
                hits: Vec::new(),
                ray_origin: origin,
                ray_direction: direction,
                max_distance,
                hit_count: 0,
                closest_hit: None,
                farthest_hit: None,
            };
        }
        
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Normalize direction
        let direction_length = (direction.x * direction.x + direction.y * direction.y + direction.z * direction.z).sqrt();
        let normalized_direction = Vector3 {
            x: direction.x / direction_length,
            y: direction.y / direction_length,
            z: direction.z / direction_length,
        };
        
        // Simulate raycasting
        let mut hits = Vec::new();
        let num_hits = (max_distance / 10.0) as u32; // Simulate hits every 10 units
        
        for i in 0..num_hits {
            let distance = (i + 1) as f32 * 10.0;
            let point = Vector3 {
                x: origin.x + normalized_direction.x * distance,
                y: origin.y + normalized_direction.y * distance,
                z: origin.z + normalized_direction.z * distance,
            };
            
            let hit = RaycastHit {
                point,
                normal: Vector3 { x: 0.0, y: 1.0, z: 0.0 }, // Up normal
                distance,
                body_id: format!("body_{}", i),
                material_id: "default".to_string(),
                face_index: i,
                triangle_index: i,
                uv_coords: [0.5, 0.5],
                is_valid: true,
            };
            
            hits.push(hit);
        }
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        let raycast_time = end_time - start_time;
        
        // Find closest and farthest hits
        let closest_hit = hits.iter().min_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap()).cloned();
        let farthest_hit = hits.iter().max_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap()).cloned();
        
        let result = RaycastResult {
            hits: hits.clone(),
            ray_origin: origin,
            ray_direction: normalized_direction,
            max_distance,
            hit_count: hits.len() as u32,
            closest_hit,
            farthest_hit,
        };
        
        // Cache result
        self.raycast_cache.push(result.clone());
        if self.raycast_cache.len() > 100 {
            self.raycast_cache.remove(0);
        }
        
        self.stats.raycast_count += 1;
        
        console_log(&format!("🔫 Raycast completed: {} hits in {:.2}ms", hits.len(), raycast_time));
        
        result
    }
    
    pub fn raycast_all(&mut self, origin: Vector3, direction: Vector3, max_distance: f32) -> Vec<RaycastResult> {
        let mut results = Vec::new();
        
        // Simulate multiple raycasts in different directions
        let directions = vec![
            Vector3 { x: 1.0, y: 0.0, z: 0.0 },
            Vector3 { x: 0.0, y: 1.0, z: 0.0 },
            Vector3 { x: 0.0, y: 0.0, z: 1.0 },
            Vector3 { x: -1.0, y: 0.0, z: 0.0 },
            Vector3 { x: 0.0, y: -1.0, z: 0.0 },
            Vector3 { x: 0.0, y: 0.0, z: -1.0 },
        ];
        
        for dir in directions {
            let result = self.raycast(origin, dir, max_distance);
            results.push(result);
        }
        
        results
    }
    
    pub fn raycast_in_sphere(&mut self, center: Vector3, radius: f32, ray_count: u32) -> Vec<RaycastResult> {
        let mut results = Vec::new();
        
        for i in 0..ray_count {
            let angle = (i as f32 / ray_count as f32) * 2.0 * std::f32::consts::PI;
            let direction = Vector3 {
                x: angle.cos(),
                y: 0.0,
                z: angle.sin(),
            };
            
            let result = self.raycast(center, direction, radius);
            results.push(result);
        }
        
        results
    }
    
    // Collision Shapes
    pub fn add_collision_shape(&mut self, shape: EnhancedCollisionShape) -> Result<(), String> {
        // Validate shape
        if shape.id.is_empty() {
            return Err("Shape ID is required".to_string());
        }
        
        // Check for duplicate ID
        if self.collision_shapes.contains_key(&shape.id) {
            return Err("Shape ID already exists".to_string());
        }
        
        // Add shape
        self.collision_shapes.insert(shape.id.clone(), shape.clone());
        
        console_log(&format!("🔷 Added collision shape: {}", shape.id));
        Ok(())
    }
    
    pub fn remove_collision_shape(&mut self, shape_id: &str) -> Result<(), String> {
        if let Some(shape) = self.collision_shapes.remove(shape_id) {
            console_log(&format!("🔷 Removed collision shape: {}", shape.id));
            Ok(())
        } else {
            Err("Collision shape not found".to_string())
        }
    }
    
    pub fn get_collision_shapes(&self) -> Vec<EnhancedCollisionShape> {
        self.collision_shapes.values().cloned().collect()
    }
    
    pub fn get_collision_shape(&self, shape_id: &str) -> Option<EnhancedCollisionShape> {
        self.collision_shapes.get(shape_id).cloned()
    }
    
    // Physics Simulation
    pub fn simulate_step(&mut self, dt: f32, bodies: &mut Vec<PhysicsBody>) -> Result<(), String> {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Update statistics
        self.stats.total_bodies = bodies.len() as u32;
        self.stats.active_bodies = bodies.iter().filter(|b| b.is_active()).count() as u32;
        self.stats.sleeping_bodies = bodies.iter().filter(|b| !b.is_active()).count() as u32;
        
        // Substepping
        let substep_dt = dt / self.config.substep_count as f32;
        
        for _ in 0..self.config.substep_count {
            // Update joints
            if self.config.enable_joints {
                if let Some(ref mut solver) = self.joint_solver {
                    solver.solve(&mut self.joints, bodies, substep_dt);
                }
            }
            
            // Update materials
            if self.config.enable_materials {
                if let Some(ref mut material_system) = self.material_system {
                    material_system.update(&mut self.materials, bodies, substep_dt);
                }
            }
            
            // Collision detection
            if self.config.enable_advanced_collision {
                if let Some(ref mut detector) = self.collision_detector {
                    detector.detect_collisions(bodies, &self.collision_shapes, substep_dt);
                    self.stats.collision_count += detector.get_collision_count();
                }
            }
            
            // Integrate bodies
            for body in bodies.iter_mut() {
                if body.is_active() {
                    body.integrate(substep_dt, &self.config);
                }
            }
        }
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        let simulation_time = end_time - start_time;
        self.stats.simulation_time = simulation_time as f32;
        
        console_log(&format!("⚙️ Physics simulation completed in {:.2}ms", simulation_time));
        
        Ok(())
    }
    
    // Material Interactions
    pub fn calculate_collision_response(&self, material_a: &Material, material_b: &Material, normal: Vector3, relative_velocity: Vector3) -> Vector3 {
        // Calculate combined properties
        let combined_friction = (material_a.friction + material_b.friction) * 0.5;
        let combined_restitution = (material_a.restitution + material_b.restitution) * 0.5;
        let combined_hardness = (material_a.hardness + material_b.hardness) * 0.5;
        
        // Calculate impulse based on materials
        let velocity_along_normal = relative_velocity.x * normal.x + relative_velocity.y * normal.y + relative_velocity.z * normal.z;
        
        let impulse_magnitude = -(1.0 + combined_restitution) * velocity_along_normal;
        let impulse = Vector3 {
            x: normal.x * impulse_magnitude,
            y: normal.y * impulse_magnitude,
            z: normal.z * impulse_magnitude,
        };
        
        // Apply friction
        let tangent_velocity = Vector3 {
            x: relative_velocity.x - normal.x * velocity_along_normal,
            y: relative_velocity.y - normal.y * velocity_along_normal,
            z: relative_velocity.z - normal.z * velocity_along_normal,
        };
        
        let tangent_length = (tangent_velocity.x * tangent_velocity.x + tangent_velocity.y * tangent_velocity.y + tangent_velocity.z * tangent_velocity.z).sqrt();
        
        if tangent_length > 0.001 {
            let friction_impulse = Vector3 {
                x: (tangent_velocity.x / tangent_length) * combined_friction * impulse_magnitude.abs(),
                y: (tangent_velocity.y / tangent_length) * combined_friction * impulse_magnitude.abs(),
                z: (tangent_velocity.z / tangent_length) * combined_friction * impulse_magnitude.abs(),
            };
            
            Vector3 {
                x: impulse.x + friction_impulse.x,
                y: impulse.y + friction_impulse.y,
                z: impulse.z + friction_impulse.z,
            }
        } else {
            impulse
        }
    }
    
    pub fn apply_material_damage(&self, material: &Material, impact_force: f32) -> f32 {
        // Calculate damage based on material properties
        let damage_factor = impact_force / (material.hardness * material.durability);
        
        // Apply material-specific damage modifiers
        let modified_damage = match material.material_type {
            MaterialType::Static => damage_factor * 0.1, // Static materials resist damage
            MaterialType::Dynamic => damage_factor,
            MaterialType::Kinematic => damage_factor * 0.0, // Kinematic objects don't take damage
            MaterialType::Trigger => damage_factor * 0.0, // Triggers don't take damage
            MaterialType::Sensor => damage_factor * 0.0, // Sensors don't take damage
            MaterialType::Custom(_) => damage_factor,
        };
        
        modified_damage.min(1.0) // Cap damage at 100%
    }
    
    pub fn calculate_thermal_transfer(&self, material_a: &Material, material_b: &Material, contact_area: f32, temperature_diff: f32, dt: f32) -> f32 {
        // Calculate thermal conductivity
        let combined_conductivity = (material_a.thermal_conductivity + material_b.thermal_conductivity) * 0.5;
        
        // Calculate heat capacity
        let combined_heat_capacity = (material_a.heat_capacity + material_b.heat_capacity) * 0.5;
        
        // Calculate heat transfer
        let heat_transfer_rate = combined_conductivity * contact_area * temperature_diff;
        let heat_transfer = heat_transfer_rate * dt / combined_heat_capacity;
        
        heat_transfer
    }
    
    // Statistics and Monitoring
    pub fn update_stats(&mut self) {
        // Update solver iterations
        if let Some(ref solver) = self.joint_solver {
            self.stats.solver_iterations_used = solver.get_iterations_used();
        }
    }
    
    pub fn get_physics_summary(&mut self) -> String {
        self.update_stats();
        
        format!(
            "🔬 Enhanced Physics Summary\n\
             ========================\n\
             Total Bodies: {}\n\
             Active Bodies: {}\n\
             Sleeping Bodies: {}\n\
             Total Joints: {}\n\
             Active Joints: {}\n\
             Broken Joints: {}\n\
             Total Materials: {}\n\
             Raycast Count: {}\n\
             Collision Count: {}\n\
             Solver Iterations: {}\n\
             Simulation Time: {:.2}ms\n\
             \n\
             Joints:\n\
             {}\n\
             \n\
             Materials:\n\
             {}",
            self.stats.total_bodies,
            self.stats.active_bodies,
            self.stats.sleeping_bodies,
            self.stats.total_joints,
            self.stats.active_joints,
            self.stats.broken_joints,
            self.stats.total_materials,
            self.stats.raycast_count,
            self.stats.collision_count,
            self.stats.solver_iterations_used,
            self.stats.simulation_time,
            self.joints.values()
                .map(|j| format!("  - {}: {} ({})", j.id, format!("{:?}", j.joint_type), if j.is_enabled { "enabled" } else { "disabled" }))
                .collect::<Vec<_>>()
                .join("\n"),
            self.materials.values()
                .map(|m| format!("  - {}: {}", m.name, format!("{:?}", m.material_type)))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }
}

// Joint Solver
pub struct JointSolver {
    iterations: u32,
    warm_starting: bool,
}

impl JointSolver {
    pub fn new(iterations: u32) -> JointSolver {
        JointSolver {
            iterations,
            warm_starting: true,
        }
    }
    
    pub fn solve(&mut self, joints: &mut HashMap<String, Joint>, bodies: &mut Vec<PhysicsBody>, dt: f32) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Solve joints iteratively
        for _ in 0..self.iterations {
            for joint in joints.values_mut() {
                if joint.is_enabled && !joint.is_broken {
                    // Simple constraint solving (would be more sophisticated in real implementation)
                    self.solve_joint_constraint(joint, bodies, dt);
                }
            }
        }
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        console_log(&format!("🔗 Joint solver completed {} iterations in {:.2}ms", self.iterations, end_time - start_time));
    }
    
    fn solve_joint_constraint(&self, joint: &mut Joint, bodies: &mut Vec<PhysicsBody>, dt: f32) {
        // Find bodies by index
        let body_a_index = bodies.iter().position(|b| b.id.to_string() == joint.body_a_id);
        let body_b_index = bodies.iter().position(|b| b.id.to_string() == joint.body_b_id);
        
        if let (Some(a_idx), Some(b_idx)) = (body_a_index, body_b_index) {
            if a_idx != b_idx {
                // Use split_at_mut to get mutable references to two different bodies
                let (first_part, second_part) = bodies.split_at_mut(a_idx.max(b_idx));
                let (body_a, body_b) = if a_idx < b_idx {
                    (&mut first_part[a_idx], &mut second_part[b_idx - a_idx - 1])
                } else {
                    (&mut second_part[a_idx - b_idx - 1], &mut first_part[b_idx])
                };
            // Simple constraint: maintain distance between anchor points
            let current_distance = ((body_a.position.x - body_b.position.x).powi(2) + 
                                    (body_a.position.y - body_b.position.y).powi(2)).sqrt();
            
            let target_distance = joint.anchor_a.distance(&joint.anchor_b);
            let error = current_distance - target_distance;
            
            // Apply corrective force
            if error.abs() > 0.001 {
                let direction = Vector3 {
                    x: (body_b.position.x - body_a.position.x) / current_distance,
                    y: (body_b.position.y - body_a.position.y) / current_distance,
                    z: 0.0,
                };
                
                let force_magnitude = error * joint.limits.stiffness;
                let force = Vector3 {
                    x: direction.x * force_magnitude,
                    y: direction.y * force_magnitude,
                    z: direction.z * force_magnitude,
                };
                
                body_a.apply_force(force.x, force.y);
                body_b.apply_force(-force.x, -force.y);
            }
            
            // Check for joint breakage
            let total_force = body_a.get_total_force() + body_b.get_total_force();
            if total_force > joint.break_force {
                joint.is_broken = true;
                joint.is_enabled = false;
                console_log(&format!("💥 Joint {} broke due to excessive force", joint.id));
            }
            }
        }
    }
    
    pub fn get_iterations_used(&self) -> u32 {
        self.iterations
    }
}

// Collision Detector
pub struct CollisionDetector {
    collision_count: u32,
}

impl CollisionDetector {
    pub fn new() -> CollisionDetector {
        CollisionDetector {
            collision_count: 0,
        }
    }
    
    pub fn detect_collisions(&mut self, bodies: &mut Vec<PhysicsBody>, shapes: &HashMap<String, EnhancedCollisionShape>, dt: f32) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        self.collision_count = 0;
        
        // Simple broadphase: check all pairs
        for i in 0..bodies.len() {
            for j in (i + 1)..bodies.len() {
                if bodies[i].is_active() && bodies[j].is_active() {
                    // Use split_at_mut to get mutable references to two different bodies
                    let (first_part, second_part) = bodies.split_at_mut(j);
                    let (body_a, body_b) = (&mut first_part[i], &mut second_part[0]);
                    
                    if self.check_collision(body_a, body_b, shapes) {
                        self.collision_count += 1;
                    }
                }
            }
        }
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        console_log(&format!("💥 Collision detection completed: {} collisions in {:.2}ms", self.collision_count, end_time - start_time));
    }
    
    fn check_collision(&self, body_a: &mut PhysicsBody, body_b: &mut PhysicsBody, shapes: &HashMap<String, EnhancedCollisionShape>) -> bool {
        // Simple sphere-sphere collision
        let distance = ((body_a.position.x - body_b.position.x).powi(2) + 
                        (body_a.position.y - body_b.position.y).powi(2)).sqrt();
        
        let combined_radius = body_a.radius + body_b.radius;
        
        if distance < combined_radius {
            // Collision detected
            let normal = Vector3 {
                x: (body_b.position.x - body_a.position.x) / distance,
                y: (body_b.position.y - body_a.position.y) / distance,
                z: 0.0,
            };
            
            let relative_velocity = Vector3 {
                x: body_b.velocity.x - body_a.velocity.x,
                y: body_b.velocity.y - body_a.velocity.y,
                z: 0.0,
            };
            
            let velocity_along_normal = relative_velocity.x * normal.x + relative_velocity.y * normal.y + relative_velocity.z * normal.z;
            
            if velocity_along_normal < 0.0 {
                // Bodies are moving towards each other
                let restitution = (body_a.restitution + body_b.restitution) * 0.5;
                let impulse_magnitude = -(1.0 + restitution) * velocity_along_normal;
                
                let impulse = Vector3 {
                    x: normal.x * impulse_magnitude,
                    y: normal.y * impulse_magnitude,
                    z: normal.z * impulse_magnitude,
                };
                
                body_a.apply_impulse(impulse.x, impulse.y);
                body_b.apply_impulse(-impulse.x, -impulse.y);
                
                return true;
            }
        }
        
        false
    }
    
    pub fn get_collision_count(&self) -> u32 {
        self.collision_count
    }
}

// Material System
pub struct MaterialSystem {
    material_interactions: HashMap<String, HashMap<String, f32>>,
}

impl MaterialSystem {
    pub fn new() -> MaterialSystem {
        let mut system = MaterialSystem {
            material_interactions: HashMap::new(),
        };
        
        // Initialize material interaction matrix
        system.initialize_material_interactions();
        
        system
    }
    
    fn initialize_material_interactions(&mut self) {
        // Define material interaction coefficients
        let interactions = vec![
            ("metal", "metal", 0.8),
            ("metal", "rubber", 0.9),
            ("metal", "glass", 0.3),
            ("metal", "default", 0.7),
            ("rubber", "rubber", 0.95),
            ("rubber", "glass", 0.4),
            ("rubber", "default", 0.8),
            ("glass", "glass", 0.2),
            ("glass", "default", 0.3),
            ("default", "default", 0.5),
        ];
        
        for (material_a, material_b, coefficient) in interactions {
            self.material_interactions
                .entry(material_a.to_string())
                .or_insert_with(HashMap::new)
                .insert(material_b.to_string(), coefficient);
        }
    }
    
    pub fn update(&mut self, materials: &mut HashMap<String, Material>, bodies: &mut Vec<PhysicsBody>, dt: f32) {
        // Update material properties over time
        for material in materials.values_mut() {
            // Simulate material degradation
            if material.durability > 0.0 {
                material.durability *= 0.9999; // Very slow degradation
            }
            
            // Simulate temperature effects (simplified)
            if material.heat_capacity > 0.0 {
                // Cool down over time
                // In a real implementation, this would be based on actual temperature
            }
        }
        
        // Apply material properties to bodies
        for body in bodies.iter_mut() {
            if let Some(material) = materials.get(&body.get_material_id()) {
                body.friction = material.friction;
                body.restitution = material.restitution;
            }
        }
    }
    
    pub fn get_interaction_coefficient(&self, material_a: &str, material_b: &str) -> f32 {
        if let Some(interactions) = self.material_interactions.get(material_a) {
            interactions.get(material_b).copied().unwrap_or(0.5)
        } else {
            0.5 // Default interaction coefficient
        }
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct EnhancedPhysicsEngineExport {
    inner: EnhancedPhysicsEngine,
}

#[wasm_bindgen]
impl EnhancedPhysicsEngineExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> EnhancedPhysicsEngineExport {
        let config = serde_wasm_bindgen::from_value::<PhysicsConfig>(config).unwrap();
        console_log("🦀 Enhanced Physics Engine initialized");
        EnhancedPhysicsEngineExport {
            inner: EnhancedPhysicsEngine::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(physics_config) = serde_wasm_bindgen::from_value::<PhysicsConfig>(config) {
            self.inner.update_config(physics_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let stats = self.inner.get_stats();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_physics_summary(&mut self) -> String {
        self.inner.get_physics_summary()
    }

    #[wasm_bindgen]
    pub fn raycast(&mut self, origin: JsValue, direction: JsValue, max_distance: f32) -> JsValue {
        let origin_vec = serde_wasm_bindgen::from_value::<Vector3>(origin).unwrap();
        let direction_vec = serde_wasm_bindgen::from_value::<Vector3>(direction).unwrap();
        let result = self.inner.raycast(origin_vec, direction_vec, max_distance);
        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn add_material(&mut self, material: JsValue) -> JsValue {
        match self.inner.add_material(serde_wasm_bindgen::from_value::<Material>(material).unwrap()) {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn get_materials(&self) -> JsValue {
        let materials = self.inner.get_materials();
        serde_wasm_bindgen::to_value(&materials).unwrap()
    }

    #[wasm_bindgen]
    pub fn add_joint(&mut self, joint: JsValue) -> JsValue {
        match self.inner.add_joint(serde_wasm_bindgen::from_value::<Joint>(joint).unwrap()) {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn get_joints(&self) -> JsValue {
        let joints = self.inner.get_joints();
        serde_wasm_bindgen::to_value(&joints).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_physics_config(
    enable_joints: bool,
    enable_raycasting: bool,
    enable_materials: bool,
    enable_advanced_collision: bool,
    enable_continuous_collision: bool,
    enable_substepping: bool,
    substep_count: u32,
    solver_iterations: u32,
    warm_starting: bool,
    enable_sleeping: bool,
    sleep_threshold: f32,
    enable_debug_rendering: bool,
    max_velocity: f32,
    max_angular_velocity: f32,
    gravity_scale: f32
) -> JsValue {
    let config = PhysicsConfig {
        enable_joints,
        enable_raycasting,
        enable_materials,
        enable_advanced_collision,
        enable_continuous_collision,
        enable_substepping,
        substep_count,
        solver_iterations,
        warm_starting,
        enable_sleeping,
        sleep_threshold,
        enable_debug_rendering,
        max_velocity,
        max_angular_velocity,
        gravity_scale,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

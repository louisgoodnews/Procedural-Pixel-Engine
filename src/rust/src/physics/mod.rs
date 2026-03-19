use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
pub mod enhanced;
use crate::math::{Vector2, Matrix3, Vector3};
use crate::utils::console_log;
use rayon::prelude::*;
use std::f32;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct PhysicsBody {
    pub id: u32,
    pub position: Vector2,
    pub velocity: Vector2,
    pub acceleration: Vector2,
    pub mass: f32,
    pub radius: f32,
    pub restitution: f32,
    pub friction: f32,
    pub is_static: bool,
    pub layer: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct CollisionInfo {
    pub entity_a: u32,
    pub entity_b: u32,
    pub normal: Vector2,
    pub penetration: f32,
    pub contact_point: Vector2,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct PhysicsWorld {
    pub gravity: Vector2,
    pub time_step: f32,
    pub velocity_iterations: u32,
    pub position_iterations: u32,
    pub bounds_min: Vector2,
    pub bounds_max: Vector2,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct PhysicsStats {
    pub entity_count: u32,
    pub collision_count: u32,
    pub update_time: f64,
    pub broadphase_time: f64,
    pub narrowphase_time: f64,
    pub constraint_time: f64,
}

pub struct PhysicsSystem {
    bodies: Vec<PhysicsBody>,
    world: PhysicsWorld,
    stats: PhysicsStats,
    collision_pairs: Vec<(usize, usize)>,
}

impl PhysicsSystem {
    pub fn new() -> PhysicsSystem {
        PhysicsSystem {
            bodies: Vec::new(),
            world: PhysicsWorld {
                gravity: Vector2::new(0.0, 9.81),
                time_step: 1.0 / 60.0,
                velocity_iterations: 8,
                position_iterations: 3,
                bounds_min: Vector2::new(-1000.0, -1000.0),
                bounds_max: Vector2::new(1000.0, 1000.0),
            },
            stats: PhysicsStats {
                entity_count: 0,
                collision_count: 0,
                update_time: 0.0,
                broadphase_time: 0.0,
                narrowphase_time: 0.0,
                constraint_time: 0.0,
            },
            collision_pairs: Vec::new(),
        }
    }

    pub fn add_body(&mut self, body: PhysicsBody) {
        self.bodies.push(body);
        self.stats.entity_count = self.bodies.len() as u32;
    }

    pub fn remove_body(&mut self, id: u32) -> bool {
        let original_len = self.bodies.len();
        self.bodies.retain(|body| body.id != id);
        let removed = self.bodies.len() < original_len;
        if removed {
            self.stats.entity_count = self.bodies.len() as u32;
        }
        removed
    }

    pub fn get_body(&self, id: u32) -> Option<&PhysicsBody> {
        self.bodies.iter().find(|body| body.id == id)
    }

    pub fn get_body_mut(&mut self, id: u32) -> Option<&mut PhysicsBody> {
        self.bodies.iter_mut().find(|body| body.id == id)
    }

    pub fn clear_bodies(&mut self) {
        self.bodies.clear();
        self.stats.entity_count = 0;
        self.stats.collision_count = 0;
    }

    pub fn set_world_config(&mut self, world: PhysicsWorld) {
        self.world = world;
    }

    pub fn get_world_config(&self) -> PhysicsWorld {
        self.world
    }

    // Broadphase collision detection using spatial hashing
    fn broadphase(&mut self) -> Vec<(usize, usize)> {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let cell_size = 100.0; // Grid cell size
        let mut potential_pairs: Vec<(usize, usize)> = Vec::new();
        let mut spatial_hash: std::collections::HashMap<(i32, i32), Vec<usize>> = std::collections::HashMap::new();

        // Insert bodies into spatial hash
        for (i, body) in self.bodies.iter().enumerate() {
            if body.is_static {
                continue;
            }

            let cell_x = (body.position.x / cell_size) as i32;
            let cell_y = (body.position.y / cell_size) as i32;

            for dx in -1..=1 {
                for dy in -1..=1 {
                    let cell_key = (cell_x + dx, cell_y + dy);
                    spatial_hash.entry(cell_key).or_insert_with(Vec::new).push(i);
                }
            }
        }

        // Find potential collisions
        for bodies_in_cell in spatial_hash.values() {
            for i in 0..bodies_in_cell.len() {
                for j in (i + 1)..bodies_in_cell.len() {
                    let body_a_idx = bodies_in_cell[i];
                    let body_b_idx = bodies_in_cell[j];
                    
                    if body_a_idx < body_b_idx {
                        potential_pairs.push((body_a_idx, body_b_idx));
                    }
                }
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.broadphase_time = end_time - start_time;
        self.collision_pairs = potential_pairs.clone();
        potential_pairs
    }

    // Narrowphase collision detection
    fn narrowphase(&self, potential_pairs: &[(usize, usize)]) -> (Vec<CollisionInfo>, f64) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let collisions: Vec<CollisionInfo> = potential_pairs
            .par_iter()
            .filter_map(|&(idx_a, idx_b)| {
                let body_a = &self.bodies[idx_a];
                let body_b = &self.bodies[idx_b];

                // Skip static-static collisions
                if body_a.is_static && body_b.is_static {
                    return None;
                }

                // Circle-circle collision detection
                let distance = body_a.position.distance(&body_b.position);
                let combined_radius = body_a.radius + body_b.radius;

                if distance < combined_radius {
                    let normal = (body_b.position - body_a.position).normalize();
                    let penetration = combined_radius - distance;
                    let contact_point = body_a.position + normal * body_a.radius;

                    Some(CollisionInfo {
                        entity_a: body_a.id,
                        entity_b: body_b.id,
                        normal,
                        penetration,
                        contact_point,
                    })
                } else {
                    None
                }
            })
            .collect();

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        (collisions, end_time - start_time)
    }

    // Apply collision resolution
    fn resolve_collisions(&mut self, collisions: &[CollisionInfo]) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Create a list of collision updates to apply
        let mut collision_updates: Vec<(u32, Vector2, Vector2)> = Vec::new();

        for collision in collisions {
            // Find the bodies involved in this collision
            let mut body_a_idx = None;
            let mut body_b_idx = None;
            
            for (i, body) in self.bodies.iter().enumerate() {
                if body.id == collision.entity_a {
                    body_a_idx = Some(i);
                }
                if body.id == collision.entity_b {
                    body_b_idx = Some(i);
                }
            }

            if let (Some(idx_a), Some(idx_b)) = (body_a_idx, body_b_idx) {
                let body_a = &self.bodies[idx_a];
                let body_b = &self.bodies[idx_b];

                // Skip if both are static
                if body_a.is_static && body_b.is_static {
                    continue;
                }

                // Calculate relative velocity
                let relative_velocity = body_b.velocity - body_a.velocity;
                let velocity_along_normal = relative_velocity.dot(&collision.normal);

                // Don't resolve if velocities are separating
                if velocity_along_normal > 0.0 {
                    continue;
                }

                // Calculate restitution
                let restitution = body_a.restitution.min(body_b.restitution);

                // Calculate impulse scalar
                let impulse_scalar = -(1.0 + restitution) * velocity_along_normal;
                let impulse_scalar = impulse_scalar / (1.0 / body_a.mass + 1.0 / body_b.mass);

                // Apply impulse
                let impulse = collision.normal * impulse_scalar;

                let new_velocity_a = if !body_a.is_static {
                    body_a.velocity - impulse * (1.0 / body_a.mass)
                } else {
                    body_a.velocity
                };

                let new_velocity_b = if !body_b.is_static {
                    body_b.velocity + impulse * (1.0 / body_b.mass)
                } else {
                    body_b.velocity
                };

                // Positional correction to prevent sinking
                const SLOP: f32 = 0.01;
                const PERCENT: f32 = 0.8;

                let correction_magnitude = collision.penetration.max(SLOP) / (1.0 / body_a.mass + 1.0 / body_b.mass) * PERCENT;
                let correction = collision.normal * correction_magnitude;

                let new_position_a = if !body_a.is_static {
                    body_a.position - correction * (1.0 / body_a.mass)
                } else {
                    body_a.position
                };

                let new_position_b = if !body_b.is_static {
                    body_b.position + correction * (1.0 / body_b.mass)
                } else {
                    body_b.position
                };

                collision_updates.push((collision.entity_a, new_velocity_a, new_position_a));
                collision_updates.push((collision.entity_b, new_velocity_b, new_position_b));
            }
        }

        // Apply all collision updates
        for (entity_id, new_velocity, new_position) in collision_updates {
            if let Some(body) = self.bodies.iter_mut().find(|b| b.id == entity_id) {
                body.velocity = new_velocity;
                body.position = new_position;
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.constraint_time = end_time - start_time;
        self.stats.collision_count = collisions.len() as u32;
    }

    // Integrate forces and update positions
    fn integrate(&mut self, dt: f32) {
        for body in &mut self.bodies {
            if body.is_static {
                continue;
            }

            // Apply gravity
            body.acceleration = body.acceleration + self.world.gravity;

            // Update velocity (Euler integration)
            body.velocity = body.velocity + body.acceleration * dt;

            // Apply friction
            body.velocity = body.velocity * (1.0 - body.friction * dt);

            // Update position
            body.position = body.position + body.velocity * dt;

            // Apply world bounds
            if body.position.x - body.radius < self.world.bounds_min.x {
                body.position.x = self.world.bounds_min.x + body.radius;
                body.velocity.x = -body.velocity.x * body.restitution;
            }
            if body.position.x + body.radius > self.world.bounds_max.x {
                body.position.x = self.world.bounds_max.x - body.radius;
                body.velocity.x = -body.velocity.x * body.restitution;
            }
            if body.position.y - body.radius < self.world.bounds_min.y {
                body.position.y = self.world.bounds_min.y + body.radius;
                body.velocity.y = -body.velocity.y * body.restitution;
            }
            if body.position.y + body.radius > self.world.bounds_max.y {
                body.position.y = self.world.bounds_max.y - body.radius;
                body.velocity.y = -body.velocity.y * body.restitution;
            }

            // Reset acceleration for next frame
            body.acceleration = Vector2::zero();
        }
    }

    // Main update function
    pub fn update(&mut self, dt: f32) -> PhysicsStats {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Broadphase collision detection
        let potential_pairs = self.broadphase();

        // Narrowphase collision detection
        let (collisions, narrowphase_time) = self.narrowphase(&potential_pairs);

        // Resolve collisions
        self.resolve_collisions(&collisions);

        // Integrate forces and update positions
        self.integrate(dt);

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.update_time = end_time - start_time;
        self.stats.narrowphase_time = narrowphase_time;
        self.stats
    }

    // Get physics statistics
    pub fn get_stats(&self) -> PhysicsStats {
        self.stats
    }

    // Get all bodies for serialization
    pub fn get_bodies(&self) -> &[PhysicsBody] {
        &self.bodies
    }

    // Update multiple bodies at once (for batch updates)
    pub fn update_bodies(&mut self, bodies: &[PhysicsBody]) {
        for &new_body in bodies {
            if let Some(body) = self.bodies.iter_mut().find(|b| b.id == new_body.id) {
                *body = new_body;
            }
        }
    }

    // Raycasting for line-of-sight and collision queries
    pub fn raycast(&self, origin: Vector2, direction: Vector2, max_distance: f32) -> Option<(u32, Vector2)> {
        let normalized_dir = direction.normalize();
        let mut closest_hit: Option<(f32, u32)> = None;

        for body in &self.bodies {
            // Ray-circle intersection
            let to_center = body.position - origin;
            let projection_length = to_center.dot(&normalized_dir);
            
            if projection_length < 0.0 || projection_length > max_distance {
                continue;
            }

            let closest_point = origin + normalized_dir * projection_length;
            let distance_to_center = closest_point.distance(&body.position);

            if distance_to_center <= body.radius {
                if let Some((closest_dist, _)) = closest_hit {
                    if projection_length < closest_dist {
                        closest_hit = Some((projection_length, body.id));
                    }
                } else {
                    closest_hit = Some((projection_length, body.id));
                }
            }
        }

        closest_hit.map(|(dist, id)| (id, origin + normalized_dir * dist))
    }

    // Find all bodies in a given area
    pub fn query_area(&self, center: Vector2, radius: f32) -> Vec<u32> {
        self.bodies
            .iter()
            .filter(|body| body.position.distance(&center) <= radius + body.radius)
            .map(|body| body.id)
            .collect()
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustPhysicsSystem {
    inner: PhysicsSystem,
}

#[wasm_bindgen]
impl RustPhysicsSystem {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RustPhysicsSystem {
        console_log("🦀 Rust Physics System initialized");
        RustPhysicsSystem {
            inner: PhysicsSystem::new(),
        }
    }

    #[wasm_bindgen]
    pub fn add_body(&mut self, body: JsValue) {
        if let Ok(physics_body) = serde_wasm_bindgen::from_value::<PhysicsBody>(body) {
            self.inner.add_body(physics_body);
        }
    }

    #[wasm_bindgen]
    pub fn remove_body(&mut self, id: u32) -> bool {
        self.inner.remove_body(id)
    }

    #[wasm_bindgen]
    pub fn update(&mut self, dt: f32) -> JsValue {
        let stats = self.inner.update(dt);
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let stats = self.inner.get_stats();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_bodies(&self) -> JsValue {
        let bodies = self.inner.get_bodies();
        serde_wasm_bindgen::to_value(&bodies).unwrap()
    }

    #[wasm_bindgen]
    pub fn update_bodies(&mut self, bodies: JsValue) {
        if let Ok(body_array) = serde_wasm_bindgen::from_value::<Vec<PhysicsBody>>(bodies) {
            self.inner.update_bodies(&body_array);
        }
    }

    #[wasm_bindgen]
    pub fn raycast(&self, origin_x: f32, origin_y: f32, dir_x: f32, dir_y: f32, max_dist: f32) -> JsValue {
        let origin = Vector2::new(origin_x, origin_y);
        let direction = Vector2::new(dir_x, dir_y);
        
        if let Some((entity_id, hit_point)) = self.inner.raycast(origin, direction, max_dist) {
            let result = serde_json::json!({
                "entityId": entity_id,
                "hitPoint": {
                    "x": hit_point.x,
                    "y": hit_point.y
                }
            });
            JsValue::from_str(&result.to_string())
        } else {
            JsValue::NULL
        }
    }

    #[wasm_bindgen]
    pub fn query_area(&self, center_x: f32, center_y: f32, radius: f32) -> JsValue {
        let center = Vector2::new(center_x, center_y);
        let entity_ids = self.inner.query_area(center, radius);
        serde_wasm_bindgen::to_value(&entity_ids).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_world_config(&mut self, world: JsValue) {
        if let Ok(world_config) = serde_wasm_bindgen::from_value::<PhysicsWorld>(world) {
            self.inner.set_world_config(world_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_world_config(&self) -> JsValue {
        let world = self.inner.get_world_config();
        serde_wasm_bindgen::to_value(&world).unwrap()
    }

    #[wasm_bindgen]
    pub fn clear_bodies(&mut self) {
        self.inner.clear_bodies();
    }

    #[wasm_bindgen]
    pub fn benchmark_physics(&mut self, entity_count: u32, iterations: u32) -> JsValue {
        console_log(&format!("🧪 Starting physics benchmark: {} entities, {} iterations", entity_count, iterations));
        
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Create test bodies
        self.inner.clear_bodies();
        for i in 0..entity_count {
            let body = PhysicsBody {
                id: i,
                position: Vector2::new(
                    (i as f32 * 10.0) % 200.0 - 100.0,
                    (i as f32 * 15.0) % 200.0 - 100.0
                ),
                velocity: Vector2::new(
                    (i as f32 * 0.1).sin() * 50.0,
                    (i as f32 * 0.1).cos() * 50.0
                ),
                acceleration: Vector2::zero(),
                mass: 1.0 + (i as f32 % 5.0),
                radius: 5.0 + (i as f32 % 10.0),
                restitution: 0.5 + ((i as f32 % 5.0) * 0.1),
                friction: 0.01 + ((i as f32 % 3.0) * 0.01),
                is_static: i % 10 == 0,
                layer: (i % 4) as u8,
            };
            self.inner.add_body(body);
        }

        // Run physics simulation
        for _ in 0..iterations {
            self.inner.update(1.0 / 60.0);
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let total_time = end_time - start_time;
        let avg_time_per_frame = total_time / iterations as f64;
        let fps = 1000.0 / avg_time_per_frame;

        let result = serde_json::json!({
            "entityCount": entity_count,
            "iterations": iterations,
            "totalTime": total_time,
            "avgTimePerFrame": avg_time_per_frame,
            "estimatedFPS": fps,
            "stats": self.inner.get_stats()
        });

        console_log(&format!("⚡ Physics benchmark completed: {:.2}ms total, {:.2}ms/frame, {:.1} FPS", total_time, avg_time_per_frame, fps));
        
        JsValue::from_str(&result.to_string())
    }
}

// Additional methods for PhysicsBody to support enhanced physics
impl PhysicsBody {
    pub fn get_id(&self) -> String {
        self.id.to_string()
    }
    
    pub fn is_active(&self) -> bool {
        !self.is_static && (self.velocity.x.abs() > 0.01 || self.velocity.y.abs() > 0.01)
    }
    
    pub fn integrate(&mut self, dt: f32, config: &crate::physics::enhanced::PhysicsConfig) {
        if !self.is_static {
            // Apply gravity
            self.acceleration.y += config.gravity_scale * 9.81;
            
            // Update velocity
            self.velocity.x += self.acceleration.x * dt;
            self.velocity.y += self.acceleration.y * dt;
            
            // Clamp velocity
            let speed = (self.velocity.x * self.velocity.x + self.velocity.y * self.velocity.y).sqrt();
            if speed > config.max_velocity {
                let scale = config.max_velocity / speed;
                self.velocity.x *= scale;
                self.velocity.y *= scale;
            }
            
            // Update position
            self.position.x += self.velocity.x * dt;
            self.position.y += self.velocity.y * dt;
            
            // Reset acceleration
            self.acceleration = Vector2::zero();
        }
    }
    
    pub fn apply_force(&mut self, fx: f32, fy: f32) {
        if !self.is_static {
            self.acceleration.x += fx / self.mass;
            self.acceleration.y += fy / self.mass;
        }
    }
    
    pub fn apply_impulse(&mut self, ix: f32, iy: f32) {
        if !self.is_static {
            self.velocity.x += ix / self.mass;
            self.velocity.y += iy / self.mass;
        }
    }
    
    pub fn get_total_force(&self) -> f32 {
        (self.acceleration.x * self.mass).abs() + (self.acceleration.y * self.mass).abs()
    }
    
    pub fn get_material_id(&self) -> String {
        "default".to_string() // Default material, would be configurable in real implementation
    }
    
    pub fn set_material_id(&mut self, _material_id: String) {
        // Would set material ID in real implementation
    }
}

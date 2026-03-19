use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::math::Vector2;
use crate::utils::console_log;
use rayon::prelude::*;
use std::f32;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Particle {
    pub id: u32,
    pub position: Vector2,
    pub velocity: Vector2,
    pub acceleration: Vector2,
    pub color: Color,
    pub size: f32,
    pub life: f32,
    pub max_life: f32,
    pub mass: f32,
    pub active: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct EmitterConfig {
    pub position: Vector2,
    pub velocity: Vector2,
    pub velocity_variance: Vector2,
    pub acceleration: Vector2,
    pub color_start: Color,
    pub color_end: Color,
    pub size_start: f32,
    pub size_end: f32,
    pub life_min: f32,
    pub life_max: f32,
    pub mass_min: f32,
    pub mass_max: f32,
    pub emission_rate: f32,
    pub emission_angle: f32,
    pub emission_angle_variance: f32,
    pub burst_count: u32,
    pub loop_emission: bool,
    pub active: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct ParticleSystemConfig {
    pub max_particles: u32,
    pub gravity: Vector2,
    pub damping: f32,
    pub wind_force: Vector2,
    pub time_step: f32,
    pub enable_collisions: bool,
    pub enable_sorting: bool,
    pub blending_mode: u8, // 0: Alpha, 1: Additive, 2: Multiply
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct ParticleStats {
    pub active_particles: u32,
    pub total_emitted: u32,
    pub update_time: f64,
    pub emission_time: f64,
    pub physics_time: f64,
    pub sorting_time: f64,
    pub rendering_time: f64,
}

pub struct ParticleSystem {
    particles: Vec<Particle>,
    emitters: Vec<EmitterConfig>,
    config: ParticleSystemConfig,
    stats: ParticleStats,
    emission_accumulator: f32,
    total_emitted: u32,
    next_particle_id: u32,
}

impl ParticleSystem {
    pub fn new(config: ParticleSystemConfig) -> ParticleSystem {
        ParticleSystem {
            particles: Vec::with_capacity(config.max_particles as usize),
            emitters: Vec::new(),
            config,
            stats: ParticleStats {
                active_particles: 0,
                total_emitted: 0,
                update_time: 0.0,
                emission_time: 0.0,
                physics_time: 0.0,
                sorting_time: 0.0,
                rendering_time: 0.0,
            },
            emission_accumulator: 0.0,
            total_emitted: 0,
            next_particle_id: 0,
        }
    }

    pub fn add_emitter(&mut self, emitter: EmitterConfig) {
        self.emitters.push(emitter);
    }

    pub fn remove_emitter(&mut self, index: usize) -> bool {
        if index < self.emitters.len() {
            self.emitters.remove(index);
            true
        } else {
            false
        }
    }

    pub fn clear_emitters(&mut self) {
        self.emitters.clear();
    }

    pub fn clear_particles(&mut self) {
        self.particles.clear();
        self.stats.active_particles = 0;
    }

    pub fn get_config(&self) -> ParticleSystemConfig {
        self.config
    }

    pub fn set_config(&mut self, config: ParticleSystemConfig) {
        self.config = config;
        // Resize particle vector if needed
        if self.particles.capacity() < config.max_particles as usize {
            self.particles.reserve(config.max_particles as usize - self.particles.capacity());
        }
    }

    pub fn get_stats(&self) -> ParticleStats {
        self.stats
    }

    pub fn get_active_particles(&self) -> &[Particle] {
        &self.particles
    }

    // Emit particles from all active emitters
    fn emit_particles(&mut self, dt: f32) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Collect emitter data first to avoid borrowing issues
        let emitter_data: Vec<(EmitterConfig, u32)> = self.emitters
            .iter()
            .filter(|e| e.active)
            .enumerate()
            .map(|(i, emitter)| {
                let particles_to_emit = if emitter.burst_count > 0 {
                    emitter.burst_count
                } else {
                    self.emission_accumulator += emitter.emission_rate * dt;
                    let count = self.emission_accumulator as u32;
                    self.emission_accumulator -= count as f32;
                    count
                };
                (*emitter, particles_to_emit)
            })
            .collect();

        for (emitter, particles_to_emit) in emitter_data {
            for _ in 0..particles_to_emit {
                if self.particles.len() >= self.config.max_particles as usize {
                    // Find and replace the oldest dead particle
                    if let Some(dead_index) = self.particles.iter().position(|p| !p.active) {
                        self.create_particle(&emitter, dead_index);
                    } else {
                        // No dead particles, skip emission
                        break;
                    }
                } else {
                    // Add new particle
                    self.create_particle(&emitter, self.particles.len());
                }
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.emission_time = end_time - start_time;
    }

    // Create a single particle
    fn create_particle(&mut self, emitter: &EmitterConfig, index: usize) {
        if index >= self.particles.len() {
            self.particles.push(Particle {
                id: self.next_particle_id,
                position: emitter.position,
                velocity: emitter.velocity,
                acceleration: emitter.acceleration,
                color: emitter.color_start,
                size: emitter.size_start,
                life: emitter.life_max,
                max_life: emitter.life_max,
                mass: emitter.mass_min,
                active: true,
            });
        } else {
            self.particles[index] = Particle {
                id: self.next_particle_id,
                position: emitter.position,
                velocity: emitter.velocity,
                acceleration: emitter.acceleration,
                color: emitter.color_start,
                size: emitter.size_start,
                life: emitter.life_max,
                max_life: emitter.life_max,
                mass: emitter.mass_min,
                active: true,
            };
        }

        // Apply variance
        let particle = &mut self.particles[index];
        
        // Velocity variance
        particle.velocity.x += (rand::random::<f32>() - 0.5) * emitter.velocity_variance.x;
        particle.velocity.y += (rand::random::<f32>() - 0.5) * emitter.velocity_variance.y;
        
        // Emission angle
        let base_angle = emitter.emission_angle;
        let angle_variance = emitter.emission_angle_variance;
        let final_angle = base_angle + (rand::random::<f32>() - 0.5) * angle_variance;
        
        let speed = particle.velocity.magnitude();
        particle.velocity.x = final_angle.cos() * speed;
        particle.velocity.y = final_angle.sin() * speed;
        
        // Life variance
        particle.life = emitter.life_min + rand::random::<f32>() * (emitter.life_max - emitter.life_min);
        particle.max_life = particle.life;
        
        // Mass variance
        particle.mass = emitter.mass_min + rand::random::<f32>() * (emitter.mass_max - emitter.mass_min);
        
        self.next_particle_id += 1;
        self.total_emitted += 1;
    }

    // Update particle physics
    fn update_particles(&mut self, dt: f32) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Update particles in parallel
        self.particles.par_iter_mut().for_each(|particle| {
            if !particle.active {
                return;
            }

            // Update life
            particle.life -= dt;
            if particle.life <= 0.0 {
                particle.active = false;
                return;
            }

            // Apply forces
            particle.acceleration = particle.acceleration + self.config.gravity + self.config.wind_force;

            // Update velocity
            particle.velocity = particle.velocity + particle.acceleration * dt;

            // Apply damping
            particle.velocity = particle.velocity * (1.0 - self.config.damping * dt);

            // Update position
            particle.position = particle.position + particle.velocity * dt;

            // Reset acceleration for next frame
            particle.acceleration = Vector2::zero();
        });

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.physics_time = end_time - start_time;
    }

    // Update particle appearance (color, size based on life)
    fn update_particle_appearance(&mut self) {
        // Get the first active emitter for interpolation
        let emitter = self.emitters.iter().find(|e| e.active).copied();
        
        for particle in &mut self.particles {
            if !particle.active {
                continue;
            }

            if let Some(emitter) = emitter {
                let life_ratio = 1.0 - (particle.life / particle.max_life);
                
                // Interpolate color
                particle.color.r = (emitter.color_start.r as f32 * (1.0 - life_ratio) + emitter.color_end.r as f32 * life_ratio) as u8;
                particle.color.g = (emitter.color_start.g as f32 * (1.0 - life_ratio) + emitter.color_end.g as f32 * life_ratio) as u8;
                particle.color.b = (emitter.color_start.b as f32 * (1.0 - life_ratio) + emitter.color_end.b as f32 * life_ratio) as u8;
                particle.color.a = (emitter.color_start.a as f32 * (1.0 - life_ratio) + emitter.color_end.a as f32 * life_ratio) as u8;
                
                // Interpolate size
                particle.size = emitter.size_start * (1.0 - life_ratio) + emitter.size_end * life_ratio;
            }
        }
    }

    // Sort particles by depth (if enabled)
    fn sort_particles(&mut self) {
        if !self.config.enable_sorting {
            return;
        }

        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Sort by y-position (back to front)
        self.particles.sort_by(|a, b| {
            if !a.active && !b.active {
                std::cmp::Ordering::Equal
            } else if !a.active {
                std::cmp::Ordering::Greater
            } else if !b.active {
                std::cmp::Ordering::Less
            } else {
                a.position.y.partial_cmp(&b.position.y).unwrap_or(std::cmp::Ordering::Equal)
            }
        });

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.sorting_time = end_time - start_time;
    }

    // Main update function
    pub fn update(&mut self, dt: f32) -> ParticleStats {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Emit new particles
        self.emit_particles(dt);

        // Update particle physics
        self.update_particles(dt);

        // Update particle appearance
        self.update_particle_appearance();

        // Sort particles if needed
        self.sort_particles();

        // Update stats
        self.stats.active_particles = self.particles.iter().filter(|p| p.active).count() as u32;
        self.stats.total_emitted = self.total_emitted;

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.update_time = end_time - start_time;
        self.stats
    }

    // Apply force to all particles
    pub fn apply_force(&mut self, force: Vector2) {
        for particle in &mut self.particles {
            if particle.active {
                particle.acceleration = particle.acceleration + force / particle.mass;
            }
        }
    }

    // Apply force to particles in area
    pub fn apply_force_in_area(&mut self, force: Vector2, center: Vector2, radius: f32) {
        for particle in &mut self.particles {
            if particle.active {
                let distance = particle.position.distance(&center);
                if distance <= radius {
                    let falloff = 1.0 - (distance / radius);
                    particle.acceleration = particle.acceleration + (force * falloff) / particle.mass;
                }
            }
        }
    }

    // Get particles in area
    pub fn get_particles_in_area(&self, center: Vector2, radius: f32) -> Vec<&Particle> {
        self.particles
            .iter()
            .filter(|p| p.active && p.position.distance(&center) <= radius)
            .collect()
    }

    // Create explosion effect
    pub fn create_explosion(&mut self, center: Vector2, force: f32, particle_count: u32, color: Color) {
        for i in 0..particle_count {
            if self.particles.len() >= self.config.max_particles as usize {
                if let Some(dead_index) = self.particles.iter().position(|p| !p.active) {
                    self.create_explosion_particle(center, force, color, dead_index, i, particle_count);
                } else {
                    break;
                }
            } else {
                self.create_explosion_particle(center, force, color, self.particles.len(), i, particle_count);
            }
        }
    }

    fn create_explosion_particle(&mut self, center: Vector2, force: f32, color: Color, index: usize, particle_index: u32, total_particles: u32) {
        let angle = (particle_index as f32 / total_particles as f32) * 2.0 * f32::consts::PI;
        let speed = force * (0.5 + rand::random::<f32>() * 0.5);
        
        let particle = Particle {
            id: self.next_particle_id,
            position: center,
            velocity: Vector2::new(angle.cos() * speed, angle.sin() * speed),
            acceleration: Vector2::zero(),
            color,
            size: 2.0 + rand::random::<f32>() * 4.0,
            life: 0.5 + rand::random::<f32>() * 1.0,
            max_life: 1.0,
            mass: 0.1 + rand::random::<f32>() * 0.5,
            active: true,
        };

        if index >= self.particles.len() {
            self.particles.push(particle);
        } else {
            self.particles[index] = particle;
        }

        self.next_particle_id += 1;
        self.total_emitted += 1;
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustParticleSystem {
    inner: ParticleSystem,
}

#[wasm_bindgen]
impl RustParticleSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> RustParticleSystem {
        let config = serde_wasm_bindgen::from_value::<ParticleSystemConfig>(config).unwrap();
        console_log("🦀 Rust Particle System initialized");
        RustParticleSystem {
            inner: ParticleSystem::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn add_emitter(&mut self, emitter: JsValue) {
        if let Ok(emitter_config) = serde_wasm_bindgen::from_value::<EmitterConfig>(emitter) {
            self.inner.add_emitter(emitter_config);
        }
    }

    #[wasm_bindgen]
    pub fn remove_emitter(&mut self, index: usize) -> bool {
        self.inner.remove_emitter(index)
    }

    #[wasm_bindgen]
    pub fn clear_emitters(&mut self) {
        self.inner.clear_emitters();
    }

    #[wasm_bindgen]
    pub fn clear_particles(&mut self) {
        self.inner.clear_particles();
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
    pub fn get_active_particles(&self) -> JsValue {
        let particles = self.inner.get_active_particles();
        serde_wasm_bindgen::to_value(&particles).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config: JsValue) {
        if let Ok(system_config) = serde_wasm_bindgen::from_value::<ParticleSystemConfig>(config) {
            self.inner.set_config(system_config);
        }
    }

    #[wasm_bindgen]
    pub fn apply_force(&mut self, force_x: f32, force_y: f32) {
        let force = Vector2::new(force_x, force_y);
        self.inner.apply_force(force);
    }

    #[wasm_bindgen]
    pub fn apply_force_in_area(&mut self, force_x: f32, force_y: f32, center_x: f32, center_y: f32, radius: f32) {
        let force = Vector2::new(force_x, force_y);
        let center = Vector2::new(center_x, center_y);
        self.inner.apply_force_in_area(force, center, radius);
    }

    #[wasm_bindgen]
    pub fn create_explosion(&mut self, center_x: f32, center_y: f32, force: f32, particle_count: u32, color_r: u8, color_g: u8, color_b: u8, color_a: u8) {
        let center = Vector2::new(center_x, center_y);
        let color = Color { r: color_r, g: color_g, b: color_b, a: color_a };
        self.inner.create_explosion(center, force, particle_count, color);
    }

    #[wasm_bindgen]
    pub fn benchmark_particles(&mut self, particle_count: u32, emitter_count: u32, iterations: u32) -> JsValue {
        console_log(&format!("🧪 Starting particle benchmark: {} particles, {} emitters, {} iterations", particle_count, emitter_count, iterations));
        
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Clear existing particles and emitters
        self.inner.clear_particles();
        self.inner.clear_emitters();

        // Create test emitters
        for i in 0..emitter_count {
            let emitter = EmitterConfig {
                position: Vector2::new(
                    (i as f32 * 50.0) % 200.0 - 100.0,
                    (i as f32 * 30.0) % 200.0 - 100.0
                ),
                velocity: Vector2::new(
                    (i as f32 * 0.1).sin() * 20.0,
                    (i as f32 * 0.1).cos() * 20.0
                ),
                velocity_variance: Vector2::new(10.0, 10.0),
                acceleration: Vector2::zero(),
                color_start: Color { r: 255, g: 100, b: 50, a: 255 },
                color_end: Color { r: 255, g: 200, b: 100, a: 100 },
                size_start: 5.0,
                size_end: 1.0,
                life_min: 1.0,
                life_max: 3.0,
                mass_min: 0.1,
                mass_max: 0.5,
                emission_rate: particle_count as f32 / emitter_count as f32,
                emission_angle: 0.0,
                emission_angle_variance: f32::consts::PI * 2.0,
                burst_count: 0,
                loop_emission: true,
                active: true,
            };
            self.inner.add_emitter(emitter);
        }

        // Run particle simulation
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
            "particleCount": particle_count,
            "emitterCount": emitter_count,
            "iterations": iterations,
            "totalTime": total_time,
            "avgTimePerFrame": avg_time_per_frame,
            "estimatedFPS": fps,
            "stats": self.inner.get_stats()
        });

        console_log(&format!("⚡ Particle benchmark completed: {:.2}ms total, {:.2}ms/frame, {:.1} FPS", total_time, avg_time_per_frame, fps));
        
        JsValue::from_str(&result.to_string())
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_particle_config(
    max_particles: u32,
    gravity_x: f32, gravity_y: f32,
    damping: f32,
    wind_x: f32, wind_y: f32,
    time_step: f32,
    enable_collisions: bool,
    enable_sorting: bool,
    blending_mode: u8
) -> JsValue {
    let config = ParticleSystemConfig {
        max_particles,
        gravity: Vector2::new(gravity_x, gravity_y),
        damping,
        wind_force: Vector2::new(wind_x, wind_y),
        time_step,
        enable_collisions,
        enable_sorting,
        blending_mode,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_emitter_config(
    pos_x: f32, pos_y: f32,
    vel_x: f32, vel_y: f32,
    vel_var_x: f32, vel_var_y: f32,
    acc_x: f32, acc_y: f32,
    color_start_r: u8, color_start_g: u8, color_start_b: u8, color_start_a: u8,
    color_end_r: u8, color_end_g: u8, color_end_b: u8, color_end_a: u8,
    size_start: f32, size_end: f32,
    life_min: f32, life_max: f32,
    mass_min: f32, mass_max: f32,
    emission_rate: f32,
    emission_angle: f32,
    emission_angle_variance: f32,
    burst_count: u32,
    loop_emission: bool,
    active: bool
) -> JsValue {
    let emitter = EmitterConfig {
        position: Vector2::new(pos_x, pos_y),
        velocity: Vector2::new(vel_x, vel_y),
        velocity_variance: Vector2::new(vel_var_x, vel_var_y),
        acceleration: Vector2::new(acc_x, acc_y),
        color_start: Color { r: color_start_r, g: color_start_g, b: color_start_b, a: color_start_a },
        color_end: Color { r: color_end_r, g: color_end_g, b: color_end_b, a: color_end_a },
        size_start,
        size_end,
        life_min,
        life_max,
        mass_min,
        mass_max,
        emission_rate,
        emission_angle,
        emission_angle_variance,
        burst_count,
        loop_emission,
        active,
    };
    serde_wasm_bindgen::to_value(&emitter).unwrap()
}

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::math::Vector2;
use crate::utils::console_log;
use crate::physics::PhysicsSystem;
use crate::particles::ParticleSystem;
use crate::audio::AudioSystem;
use std::f32;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct SystemPerformance {
    pub processing_time: f64,
    pub memory_usage: u32,
    pub cpu_usage: f32,
    pub throughput: f32,
    pub latency: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct HybridConfig {
    pub auto_switching: bool,
    pub performance_threshold: f32,
    pub memory_threshold: u32,
    pub latency_threshold: f32,
    pub benchmark_interval: f32,
    pub adaptive_quality: bool,
    pub prefer_rust: bool,
    pub fallback_enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct SystemMetrics {
    pub physics_performance: SystemPerformance,
    pub particles_performance: SystemPerformance,
    pub audio_performance: SystemPerformance,
    pub total_performance: SystemPerformance,
    pub rust_usage: f32,
    pub typescript_usage: f32,
    pub switch_count: u32,
    pub last_switch_time: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum SystemType {
    Rust,
    TypeScript,
    Hybrid,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct SystemState {
    pub system_type: SystemType,
    pub active: bool,
    pub performance_history: Vec<SystemPerformance>,
    pub last_benchmark: f64,
    pub switch_count: u32,
}

pub struct HybridEngine {
    config: HybridConfig,
    metrics: SystemMetrics,
    
    // Rust systems
    physics_system: Option<PhysicsSystem>,
    particle_system: Option<ParticleSystem>,
    audio_system: Option<AudioSystem>,
    
    // System states
    physics_state: SystemState,
    particles_state: SystemState,
    audio_state: SystemState,
    
    // Performance tracking
    last_benchmark_time: f64,
    benchmark_history: Vec<SystemMetrics>,
    performance_window: Vec<f64>,
    
    // Adaptive parameters
    adaptive_quality_level: f32,
    last_quality_adjustment: f64,
}

impl HybridEngine {
    pub fn new(config: HybridConfig) -> HybridEngine {
        HybridEngine {
            config,
            metrics: SystemMetrics {
                physics_performance: SystemPerformance {
                    processing_time: 0.0,
                    memory_usage: 0,
                    cpu_usage: 0.0,
                    throughput: 0.0,
                    latency: 0.0,
                },
                particles_performance: SystemPerformance {
                    processing_time: 0.0,
                    memory_usage: 0,
                    cpu_usage: 0.0,
                    throughput: 0.0,
                    latency: 0.0,
                },
                audio_performance: SystemPerformance {
                    processing_time: 0.0,
                    memory_usage: 0,
                    cpu_usage: 0.0,
                    throughput: 0.0,
                    latency: 0.0,
                },
                total_performance: SystemPerformance {
                    processing_time: 0.0,
                    memory_usage: 0,
                    cpu_usage: 0.0,
                    throughput: 0.0,
                    latency: 0.0,
                },
                rust_usage: 0.0,
                typescript_usage: 0.0,
                switch_count: 0,
                last_switch_time: 0.0,
            },
            physics_system: None,
            particle_system: None,
            audio_system: None,
            physics_state: SystemState {
                system_type: if config.prefer_rust { SystemType::Rust } else { SystemType::TypeScript },
                active: true,
                performance_history: Vec::new(),
                last_benchmark: 0.0,
                switch_count: 0,
            },
            particles_state: SystemState {
                system_type: if config.prefer_rust { SystemType::Rust } else { SystemType::TypeScript },
                active: true,
                performance_history: Vec::new(),
                last_benchmark: 0.0,
                switch_count: 0,
            },
            audio_state: SystemState {
                system_type: if config.prefer_rust { SystemType::Rust } else { SystemType::TypeScript },
                active: true,
                performance_history: Vec::new(),
                last_benchmark: 0.0,
                switch_count: 0,
            },
            last_benchmark_time: 0.0,
            benchmark_history: Vec::new(),
            performance_window: Vec::new(),
            adaptive_quality_level: 1.0,
            last_quality_adjustment: 0.0,
        }
    }

    pub fn initialize_rust_systems(&mut self) {
        // Initialize Rust systems if available
        // This would be called when Rust systems are ready
        console_log("🦀 Initializing Rust systems in hybrid engine");
        
        // Note: In a real implementation, these would be actual system instances
        // For now, we'll simulate their presence
        self.physics_system = Some(PhysicsSystem::new());
        
        // Create a default particle config for initialization
        let particle_config = crate::particles::ParticleSystemConfig {
            max_particles: 10000,
            gravity: crate::math::Vector2::new(0.0, 9.81),
            damping: 0.01,
            wind_force: crate::math::Vector2::new(0.0, 0.0),
            time_step: 1.0 / 60.0,
            enable_collisions: false,
            enable_sorting: true,
            blending_mode: 0,
        };
        self.particle_system = Some(ParticleSystem::new(particle_config));
        
        // Create a default audio config for initialization
        let audio_config = crate::audio::AudioConfig {
            sample_rate: 44100,
            buffer_size: 512,
            max_sources: 32,
            max_effects: 8,
            distance_model: 2,
            doppler_factor: 1.0,
            speed_of_sound: 343.0,
            master_volume: 1.0,
        };
        self.audio_system = Some(AudioSystem::new(audio_config));
    }

    pub fn update_config(&mut self, config: HybridConfig) {
        self.config = config;
    }

    pub fn get_config(&self) -> HybridConfig {
        self.config
    }

    pub fn get_metrics(&self) -> SystemMetrics {
        self.metrics.clone()
    }

    // Performance monitoring and benchmarking
    pub fn benchmark_systems(&mut self) -> SystemMetrics {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Benchmark each system
        self.metrics.physics_performance = self.benchmark_physics();
        self.metrics.particles_performance = self.benchmark_particles();
        self.metrics.audio_performance = self.benchmark_audio();

        // Calculate total performance
        self.metrics.total_performance = self.calculate_total_performance();

        // Update usage statistics
        self.update_usage_statistics();

        // Check if auto-switching is needed
        if self.config.auto_switching {
            self.check_auto_switching();
        }

        // Adaptive quality adjustment
        if self.config.adaptive_quality {
            self.adjust_adaptive_quality();
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.metrics.total_performance.processing_time = end_time - start_time;
        self.last_benchmark_time = end_time;

        // Store benchmark history
        self.benchmark_history.push(self.metrics.clone());
        if self.benchmark_history.len() > 100 {
            self.benchmark_history.remove(0);
        }

        self.metrics.clone()
    }

    fn benchmark_physics(&self) -> SystemPerformance {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Simulate physics benchmark
        let mut processing_time = 0.0;
        let mut memory_usage = 0;

        match self.physics_state.system_type {
            SystemType::Rust => {
                // Simulate Rust physics performance
                processing_time = 2.5; // ms
                memory_usage = 1024; // KB
            }
            SystemType::TypeScript => {
                // Simulate TypeScript physics performance
                processing_time = 8.5; // ms
                memory_usage = 2048; // KB
            }
            SystemType::Hybrid => {
                // Simulate hybrid physics performance
                processing_time = 4.5; // ms
                memory_usage = 1536; // KB
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        SystemPerformance {
            processing_time,
            memory_usage,
            cpu_usage: (processing_time / 16.67 * 100.0) as f32, // Relative to 60fps budget
            throughput: (1000.0 / processing_time) as f32,
            latency: processing_time as f32,
        }
    }

    fn benchmark_particles(&self) -> SystemPerformance {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Simulate particles benchmark
        let mut processing_time = 0.0;
        let mut memory_usage = 0;

        match self.particles_state.system_type {
            SystemType::Rust => {
                // Simulate Rust particles performance
                processing_time = 1.8; // ms
                memory_usage = 2048; // KB
            }
            SystemType::TypeScript => {
                // Simulate TypeScript particles performance
                processing_time = 12.5; // ms
                memory_usage = 4096; // KB
            }
            SystemType::Hybrid => {
                // Simulate hybrid particles performance
                processing_time = 3.2; // ms
                memory_usage = 3072; // KB
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        SystemPerformance {
            processing_time,
            memory_usage,
            cpu_usage: (processing_time / 16.67 * 100.0) as f32, // Relative to 60fps budget
            throughput: (1000.0 / processing_time) as f32,
            latency: processing_time as f32,
        }
    }

    fn benchmark_audio(&self) -> SystemPerformance {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Simulate audio benchmark
        let mut processing_time = 0.0;
        let mut memory_usage = 0;

        match self.audio_state.system_type {
            SystemType::Rust => {
                // Simulate Rust audio performance
                processing_time = 2.8; // ms
                memory_usage = 512; // KB
            }
            SystemType::TypeScript => {
                // Simulate TypeScript audio performance
                processing_time = 8.5; // ms
                memory_usage = 1024; // KB
            }
            SystemType::Hybrid => {
                // Simulate hybrid audio performance
                processing_time = 4.5; // ms
                memory_usage = 768; // KB
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        SystemPerformance {
            processing_time,
            memory_usage,
            cpu_usage: (processing_time / 16.67 * 100.0) as f32, // Relative to 60fps budget
            throughput: (1000.0 / processing_time) as f32,
            latency: processing_time as f32,
        }
    }

    fn calculate_total_performance(&self) -> SystemPerformance {
        let total_processing_time = self.metrics.physics_performance.processing_time +
                                   self.metrics.particles_performance.processing_time +
                                   self.metrics.audio_performance.processing_time;
        
        let total_memory_usage = self.metrics.physics_performance.memory_usage +
                                self.metrics.particles_performance.memory_usage +
                                self.metrics.audio_performance.memory_usage;
        
        let avg_cpu_usage = (self.metrics.physics_performance.cpu_usage +
                            self.metrics.particles_performance.cpu_usage +
                            self.metrics.audio_performance.cpu_usage) / 3.0;
        
        let avg_throughput = (self.metrics.physics_performance.throughput +
                             self.metrics.particles_performance.throughput +
                             self.metrics.audio_performance.throughput) / 3.0;

        SystemPerformance {
            processing_time: total_processing_time,
            memory_usage: total_memory_usage,
            cpu_usage: avg_cpu_usage,
            throughput: avg_throughput,
            latency: (total_processing_time / 3.0) as f32,
        }
    }

    fn update_usage_statistics(&mut self) {
        let rust_systems = [
            self.physics_state.system_type == SystemType::Rust,
            self.particles_state.system_type == SystemType::Rust,
            self.audio_state.system_type == SystemType::Rust,
        ];
        
        let typescript_systems = [
            self.physics_state.system_type == SystemType::TypeScript,
            self.particles_state.system_type == SystemType::TypeScript,
            self.audio_state.system_type == SystemType::TypeScript,
        ];

        let rust_count = rust_systems.iter().filter(|&&x| x).count() as f32;
        let typescript_count = typescript_systems.iter().filter(|&&x| x).count() as f32;
        let total_systems = 3.0;

        self.metrics.rust_usage = rust_count / total_systems * 100.0;
        self.metrics.typescript_usage = typescript_count / total_systems * 100.0;
    }

    fn check_auto_switching(&mut self) {
        let current_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Check physics system
        if self.should_switch_system(&self.physics_state, &self.metrics.physics_performance) {
            self.switch_physics_system();
        }

        // Check particles system
        if self.should_switch_system(&self.particles_state, &self.metrics.particles_performance) {
            self.switch_particles_system();
        }

        // Check audio system
        if self.should_switch_system(&self.audio_state, &self.metrics.audio_performance) {
            self.switch_audio_system();
        }

        self.metrics.last_switch_time = current_time;
    }

    fn should_switch_system(&self, state: &SystemState, performance: &SystemPerformance) -> bool {
        // Don't switch if recently switched
        let current_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        if current_time - state.last_benchmark < 1000.0 { // 1 second cooldown
            return false;
        }

        // Check performance thresholds
        let performance_score = self.calculate_performance_score(performance);
        
        if performance_score > self.config.performance_threshold {
            return true;
        }

        // Check memory threshold
        if performance.memory_usage > self.config.memory_threshold {
            return true;
        }

        // Check latency threshold
        if performance.latency > self.config.latency_threshold {
            return true;
        }

        false
    }

    fn calculate_performance_score(&self, performance: &SystemPerformance) -> f32 {
        let cpu_weight = 0.4;
        let memory_weight = 0.3;
        let latency_weight = 0.3;

        let cpu_score = performance.cpu_usage / 100.0;
        let memory_score = (performance.memory_usage as f32 / self.config.memory_threshold as f32).min(1.0);
        let latency_score = (performance.latency / self.config.latency_threshold).min(1.0);

        cpu_score * cpu_weight + memory_score * memory_weight + latency_score * latency_weight
    }

    fn switch_physics_system(&mut self) {
        let new_type = match self.physics_state.system_type {
            SystemType::Rust => SystemType::TypeScript,
            SystemType::TypeScript => SystemType::Rust,
            SystemType::Hybrid => {
                if self.config.prefer_rust {
                    SystemType::Rust
                } else {
                    SystemType::TypeScript
                }
            }
        };

        console_log(&format!("🔄 Switching physics system from {:?} to {:?}", self.physics_state.system_type, new_type));
        
        self.physics_state.system_type = new_type;
        self.physics_state.switch_count += 1;
        self.physics_state.last_benchmark = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        self.metrics.switch_count += 1;
    }

    fn switch_particles_system(&mut self) {
        let new_type = match self.particles_state.system_type {
            SystemType::Rust => SystemType::TypeScript,
            SystemType::TypeScript => SystemType::Rust,
            SystemType::Hybrid => {
                if self.config.prefer_rust {
                    SystemType::Rust
                } else {
                    SystemType::TypeScript
                }
            }
        };

        console_log(&format!("🔄 Switching particles system from {:?} to {:?}", self.particles_state.system_type, new_type));
        
        self.particles_state.system_type = new_type;
        self.particles_state.switch_count += 1;
        self.particles_state.last_benchmark = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        self.metrics.switch_count += 1;
    }

    fn switch_audio_system(&mut self) {
        let new_type = match self.audio_state.system_type {
            SystemType::Rust => SystemType::TypeScript,
            SystemType::TypeScript => SystemType::Rust,
            SystemType::Hybrid => {
                if self.config.prefer_rust {
                    SystemType::Rust
                } else {
                    SystemType::TypeScript
                }
            }
        };

        console_log(&format!("🔄 Switching audio system from {:?} to {:?}", self.audio_state.system_type, new_type));
        
        self.audio_state.system_type = new_type;
        self.audio_state.switch_count += 1;
        self.audio_state.last_benchmark = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        self.metrics.switch_count += 1;
    }

    fn adjust_adaptive_quality(&mut self) {
        let current_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Adjust quality every 5 seconds
        if current_time - self.last_quality_adjustment < 5000.0 {
            return;
        }

        let total_cpu_usage = self.metrics.total_performance.cpu_usage;
        let target_cpu_usage = 70.0; // Target 70% CPU usage

        if total_cpu_usage > target_cpu_usage + 10.0 {
            // Reduce quality
            self.adaptive_quality_level = (self.adaptive_quality_level - 0.1).max(0.5);
        } else if total_cpu_usage < target_cpu_usage - 10.0 {
            // Increase quality
            self.adaptive_quality_level = (self.adaptive_quality_level + 0.1).min(2.0);
        }

        console_log(&format!("🎯 Adaptive quality adjusted to {:.2}", self.adaptive_quality_level));
        self.last_quality_adjustment = current_time;
    }

    // System optimization methods
    pub fn optimize_for_performance(&mut self) {
        console_log("⚡ Optimizing for maximum performance");
        
        // Switch all systems to Rust for maximum performance
        self.physics_state.system_type = SystemType::Rust;
        self.particles_state.system_type = SystemType::Rust;
        self.audio_state.system_type = SystemType::Rust;
        
        // Set adaptive quality to maximum
        self.adaptive_quality_level = 2.0;
        
        // Update config
        self.config.prefer_rust = true;
        self.config.adaptive_quality = false;
    }

    pub fn optimize_for_memory(&mut self) {
        console_log("💾 Optimizing for memory efficiency");
        
        // Use TypeScript for better memory efficiency in some cases
        self.physics_state.system_type = SystemType::TypeScript;
        self.particles_state.system_type = SystemType::Hybrid;
        self.audio_state.system_type = SystemType::TypeScript;
        
        // Reduce quality to save memory
        self.adaptive_quality_level = 0.7;
        
        // Update config
        self.config.prefer_rust = false;
        self.config.adaptive_quality = true;
    }

    pub fn optimize_for_latency(&mut self) {
        console_log("⏱️ Optimizing for low latency");
        
        // Use Rust for lowest latency
        self.physics_state.system_type = SystemType::Rust;
        self.particles_state.system_type = SystemType::Rust;
        self.audio_state.system_type = SystemType::Rust;
        
        // Set adaptive quality for latency
        self.adaptive_quality_level = 1.5;
        
        // Update config
        self.config.latency_threshold = 8.0; // 8ms target
        self.config.adaptive_quality = true;
    }

    pub fn get_system_states(&self) -> (SystemType, SystemType, SystemType) {
        (
            self.physics_state.system_type,
            self.particles_state.system_type,
            self.audio_state.system_type,
        )
    }

    pub fn get_adaptive_quality(&self) -> f32 {
        self.adaptive_quality_level
    }

    pub fn set_adaptive_quality(&mut self, quality: f32) {
        self.adaptive_quality_level = quality.clamp(0.5, 2.0);
    }

    pub fn force_system_switch(&mut self, system: &str, system_type: SystemType) -> bool {
        match system {
            "physics" => {
                self.physics_state.system_type = system_type;
                self.physics_state.switch_count += 1;
                true
            }
            "particles" => {
                self.particles_state.system_type = system_type;
                self.particles_state.switch_count += 1;
                true
            }
            "audio" => {
                self.audio_state.system_type = system_type;
                self.audio_state.switch_count += 1;
                true
            }
            _ => false,
        }
    }

    pub fn get_performance_history(&self) -> &[SystemMetrics] {
        &self.benchmark_history
    }

    pub fn clear_performance_history(&mut self) {
        self.benchmark_history.clear();
        self.performance_window.clear();
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustHybridEngine {
    inner: HybridEngine,
}

#[wasm_bindgen]
impl RustHybridEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> RustHybridEngine {
        let config = serde_wasm_bindgen::from_value::<HybridConfig>(config).unwrap();
        console_log("🦀 Rust Hybrid Engine initialized");
        RustHybridEngine {
            inner: HybridEngine::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn initialize_rust_systems(&mut self) {
        self.inner.initialize_rust_systems();
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(hybrid_config) = serde_wasm_bindgen::from_value::<HybridConfig>(config) {
            self.inner.update_config(hybrid_config);
        }
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn benchmark_systems(&mut self) -> JsValue {
        let metrics = self.inner.benchmark_systems();
        serde_wasm_bindgen::to_value(&metrics).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_metrics(&self) -> JsValue {
        let metrics = self.inner.get_metrics();
        serde_wasm_bindgen::to_value(&metrics).unwrap()
    }

    #[wasm_bindgen]
    pub fn optimize_for_performance(&mut self) {
        self.inner.optimize_for_performance();
    }

    #[wasm_bindgen]
    pub fn optimize_for_memory(&mut self) {
        self.inner.optimize_for_memory();
    }

    #[wasm_bindgen]
    pub fn optimize_for_latency(&mut self) {
        self.inner.optimize_for_latency();
    }

    #[wasm_bindgen]
    pub fn get_system_states(&self) -> JsValue {
        let (physics, particles, audio) = self.inner.get_system_states();
        let result = serde_json::json!({
            "physics": physics,
            "particles": particles,
            "audio": audio
        });
        JsValue::from_str(&result.to_string())
    }

    #[wasm_bindgen]
    pub fn get_adaptive_quality(&self) -> f32 {
        self.inner.get_adaptive_quality()
    }

    #[wasm_bindgen]
    pub fn set_adaptive_quality(&mut self, quality: f32) {
        self.inner.set_adaptive_quality(quality);
    }

    #[wasm_bindgen]
    pub fn force_system_switch(&mut self, system: String, system_type: u8) -> bool {
        let rust_type = match system_type {
            0 => SystemType::Rust,
            1 => SystemType::TypeScript,
            2 => SystemType::Hybrid,
            _ => return false,
        };
        self.inner.force_system_switch(&system, rust_type)
    }

    #[wasm_bindgen]
    pub fn get_performance_history(&self) -> JsValue {
        let history = self.inner.get_performance_history();
        serde_wasm_bindgen::to_value(&history).unwrap()
    }

    #[wasm_bindgen]
    pub fn clear_performance_history(&mut self) {
        self.inner.clear_performance_history();
    }

    #[wasm_bindgen]
    pub fn benchmark_hybrid_performance(&mut self, iterations: u32) -> JsValue {
        console_log(&format!("🧪 Starting hybrid performance benchmark: {} iterations", iterations));
        
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let mut results = Vec::new();

        for i in 0..iterations {
            let metrics = self.inner.benchmark_systems();
            results.push(metrics);

            // Simulate different load conditions
            if i % 10 == 0 {
                // Occasionally trigger optimization
                match i % 3 {
                    0 => self.inner.optimize_for_performance(),
                    1 => self.inner.optimize_for_memory(),
                    2 => self.inner.optimize_for_latency(),
                    _ => {}
                }
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        let total_time = end_time - start_time;
        let avg_time_per_iteration = total_time / iterations as f64;

        let result = serde_json::json!({
            "iterations": iterations,
            "totalTime": total_time,
            "avgTimePerIteration": avg_time_per_iteration,
            "finalMetrics": self.inner.get_metrics(),
            "systemStates": self.inner.get_system_states(),
            "adaptiveQuality": self.inner.get_adaptive_quality(),
            "switchCount": self.inner.get_metrics().switch_count
        });

        console_log(&format!("⚡ Hybrid benchmark completed: {:.2}ms total, {:.2}ms/iteration", total_time, avg_time_per_iteration));
        
        JsValue::from_str(&result.to_string())
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_hybrid_config(
    auto_switching: bool,
    performance_threshold: f32,
    memory_threshold: u32,
    latency_threshold: f32,
    benchmark_interval: f32,
    adaptive_quality: bool,
    prefer_rust: bool,
    fallback_enabled: bool
) -> JsValue {
    let config = HybridConfig {
        auto_switching,
        performance_threshold,
        memory_threshold,
        latency_threshold,
        benchmark_interval,
        adaptive_quality,
        prefer_rust,
        fallback_enabled,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

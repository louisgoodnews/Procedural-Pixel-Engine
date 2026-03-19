// Audio module placeholder
// This will be implemented in Phase 26

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::math::Vector2;
use crate::utils::console_log;
use rayon::prelude::*;
use std::f32;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct AudioBuffer {
    pub data: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u8,
    pub length: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct AudioSource {
    pub id: u32,
    pub position: Vector2,
    pub velocity: Vector2,
    pub volume: f32,
    pub pitch: f32,
    pub pan: f32,
    pub loop_enabled: bool,
    pub is_playing: bool,
    pub is_3d: bool,
    pub max_distance: f32,
    pub reference_distance: f32,
    pub rolloff_factor: f32,
    pub cone_inner_angle: f32,
    pub cone_outer_angle: f32,
    pub cone_outer_gain: f32,
    pub direction: Vector2,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct AudioListener {
    pub position: Vector2,
    pub velocity: Vector2,
    pub direction: Vector2,
    pub up: Vector2,
    pub gain: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct AudioEffect {
    pub id: u32,
    pub effect_type: u8, // 0: Reverb, 1: Delay, 2: Distortion, 3: Filter, 4: Compressor
    pub wet_level: f32,
    pub dry_level: f32,
    pub parameters: [f32; 8], // Effect-specific parameters
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct AudioConfig {
    pub sample_rate: u32,
    pub buffer_size: usize,
    pub max_sources: u32,
    pub max_effects: u32,
    pub distance_model: u8, // 0: Inverse, 1: Inverse Clamped, 2: Exponential, 3: Exponential Clamped
    pub doppler_factor: f32,
    pub speed_of_sound: f32,
    pub master_volume: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct AudioStats {
    pub active_sources: u32,
    pub active_effects: u32,
    pub processing_time: f64,
    pub mixing_time: f64,
    pub effects_time: f64,
    pub cpu_usage: f32,
    pub memory_usage: u32,
}

pub struct AudioSystem {
    sources: Vec<AudioSource>,
    effects: Vec<AudioEffect>,
    listener: AudioListener,
    config: AudioConfig,
    stats: AudioStats,
    audio_buffers: Vec<AudioBuffer>,
    next_source_id: u32,
    next_effect_id: u32,
    master_buffer: Vec<f32>,
    temp_buffer: Vec<f32>,
}

impl AudioSystem {
    pub fn new(config: AudioConfig) -> AudioSystem {
        AudioSystem {
            sources: Vec::with_capacity(config.max_sources as usize),
            effects: Vec::with_capacity(config.max_effects as usize),
            listener: AudioListener {
                position: Vector2::new(0.0, 0.0),
                velocity: Vector2::new(0.0, 0.0),
                direction: Vector2::new(0.0, 1.0),
                up: Vector2::new(0.0, 0.0),
                gain: 1.0,
            },
            config,
            stats: AudioStats {
                active_sources: 0,
                active_effects: 0,
                processing_time: 0.0,
                mixing_time: 0.0,
                effects_time: 0.0,
                cpu_usage: 0.0,
                memory_usage: 0,
            },
            audio_buffers: Vec::new(),
            next_source_id: 0,
            next_effect_id: 0,
            master_buffer: vec![0.0; config.buffer_size * 2], // Stereo
            temp_buffer: vec![0.0; config.buffer_size * 2],
        }
    }

    pub fn add_source(&mut self, source: AudioSource) -> u32 {
        let id = self.next_source_id;
        self.next_source_id += 1;
        
        let mut new_source = source;
        new_source.id = id;
        
        if self.sources.len() < self.config.max_sources as usize {
            self.sources.push(new_source);
        } else {
            // Replace first inactive source
            if let Some(index) = self.sources.iter().position(|s| !s.is_playing) {
                self.sources[index] = new_source;
            }
        }
        
        id
    }

    pub fn remove_source(&mut self, id: u32) -> bool {
        if let Some(index) = self.sources.iter().position(|s| s.id == id) {
            self.sources.remove(index);
            true
        } else {
            false
        }
    }

    pub fn add_effect(&mut self, effect: AudioEffect) -> u32 {
        let id = self.next_effect_id;
        self.next_effect_id += 1;
        
        let mut new_effect = effect;
        new_effect.id = id;
        
        if self.effects.len() < self.config.max_effects as usize {
            self.effects.push(new_effect);
        } else {
            // Replace first disabled effect
            if let Some(index) = self.effects.iter().position(|e| !e.enabled) {
                self.effects[index] = new_effect;
            }
        }
        
        id
    }

    pub fn remove_effect(&mut self, id: u32) -> bool {
        if let Some(index) = self.effects.iter().position(|e| e.id == id) {
            self.effects.remove(index);
            true
        } else {
            false
        }
    }

    pub fn set_listener(&mut self, listener: AudioListener) {
        self.listener = listener;
    }

    pub fn get_listener(&self) -> AudioListener {
        self.listener
    }

    pub fn get_config(&self) -> AudioConfig {
        self.config
    }

    pub fn set_config(&mut self, config: AudioConfig) {
        self.config = config;
        // Resize buffers if needed
        if self.master_buffer.len() != config.buffer_size * 2 {
            self.master_buffer.resize(config.buffer_size * 2, 0.0);
            self.temp_buffer.resize(config.buffer_size * 2, 0.0);
        }
    }

    pub fn get_stats(&self) -> AudioStats {
        self.stats
    }

    // Calculate distance-based gain for 3D audio
    fn calculate_distance_gain(&self, source: &AudioSource) -> f32 {
        if !source.is_3d {
            return 1.0;
        }

        let distance = source.position.distance(&self.listener.position);
        
        match self.config.distance_model {
            0 => { // Inverse
                if distance == 0.0 { 1.0 } else { source.reference_distance / distance }
            }
            1 => { // Inverse Clamped
                if distance == 0.0 { 1.0 } else {
                    let gain = source.reference_distance / distance;
                    gain.min(1.0).max(0.0)
                }
            }
            2 => { // Exponential
                (distance / source.reference_distance).powf(-source.rolloff_factor)
            }
            3 => { // Exponential Clamped
                let gain = (distance / source.reference_distance).powf(-source.rolloff_factor);
                gain.min(1.0).max(0.0)
            }
            _ => 1.0,
        }
    }

    // Calculate directional gain for 3D audio
    fn calculate_directional_gain(&self, source: &AudioSource) -> f32 {
        if !source.is_3d {
            return 1.0;
        }

        let to_source = source.position - self.listener.position;
        let to_source_normalized = to_source.normalize();
        let listener_forward = self.listener.direction.normalize();
        
        let dot_product = to_source_normalized.dot(&listener_forward);
        let angle = dot_product.acos();
        
        if angle <= source.cone_inner_angle {
            1.0
        } else if angle >= source.cone_outer_angle {
            source.cone_outer_gain
        } else {
            // Linear interpolation between inner and outer cone
            let range = source.cone_outer_angle - source.cone_inner_angle;
            let factor = (angle - source.cone_inner_angle) / range;
            1.0 + (source.cone_outer_gain - 1.0) * factor
        }
    }

    // Calculate Doppler effect
    fn calculate_doppler_pitch(&self, source: &AudioSource) -> f32 {
        if !source.is_3d {
            return source.pitch;
        }

        let to_source = source.position - self.listener.position;
        let distance = to_source.magnitude();
        
        if distance == 0.0 {
            return source.pitch;
        }

        let to_source_normalized = to_source.normalize();
        let listener_forward = self.listener.direction.normalize();
        
        let source_velocity_towards_listener = source.velocity.dot(&to_source_normalized);
        let listener_velocity_towards_source = self.listener.velocity.dot(&to_source_normalized);
        
        let relative_velocity = source_velocity_towards_listener - listener_velocity_towards_source;
        
        let doppler_factor = 1.0 + (relative_velocity / self.config.speed_of_sound) * self.config.doppler_factor;
        
        source.pitch * doppler_factor
    }

    // Apply reverb effect
    fn apply_reverb(&self, input: &[f32], output: &mut [f32], wet_level: f32, dry_level: f32, room_size: f32, damping: f32) {
        // Simple reverb implementation using delay lines
        let delay_samples = (room_size * self.config.sample_rate as f32 * 0.1) as usize;
        let delay_samples = delay_samples.min(input.len());
        
        for i in 0..input.len() {
            let delayed_sample = if i >= delay_samples {
                input[i - delay_samples] * damping
            } else {
                0.0
            };
            
            output[i] = input[i] * dry_level + delayed_sample * wet_level;
        }
    }

    // Apply delay effect
    fn apply_delay(&self, input: &[f32], output: &mut [f32], wet_level: f32, dry_level: f32, delay_time: f32, feedback: f32) {
        let delay_samples = (delay_time * self.config.sample_rate as f32) as usize;
        let delay_samples = delay_samples.min(input.len());
        
        for i in 0..input.len() {
            let delayed_sample = if i >= delay_samples {
                output[i - delay_samples] * feedback + input[i - delay_samples]
            } else {
                0.0
            };
            
            output[i] = input[i] * dry_level + delayed_sample * wet_level;
        }
    }

    // Apply distortion effect
    fn apply_distortion(&self, input: &[f32], output: &mut [f32], gain: f32, level: f32) {
        for i in 0..input.len() {
            let sample = input[i] * gain;
            let distorted = if sample > 0.0 {
                sample.tanh() * level
            } else {
                (-sample).tanh() * level
            };
            output[i] = distorted;
        }
    }

    // Apply low-pass filter
    fn apply_low_pass_filter(&self, input: &[f32], output: &mut [f32], cutoff: f32, resonance: f32) {
        let nyquist = self.config.sample_rate as f32 * 0.5;
        let normalized_cutoff = (cutoff / nyquist).min(0.99);
        
        let q = 1.0 / resonance;
        let k = (f32::consts::PI * normalized_cutoff).tan();
        let norm = 1.0 / (1.0 + k / q + k * k);
        
        let b0 = k * k * norm;
        let b1 = 2.0 * b0;
        let b2 = b0;
        let a1 = 2.0 * (k * k - 1.0) * norm;
        let a2 = (1.0 - k / q + k * k) * norm;
        
        let mut x1 = 0.0;
        let mut x2 = 0.0;
        let mut y1 = 0.0;
        let mut y2 = 0.0;
        
        for i in 0..input.len() {
            let x0 = input[i];
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            
            output[i] = y0;
            
            x2 = x1;
            x1 = x0;
            y2 = y1;
            y1 = y0;
        }
    }

    // Apply compressor effect
    fn apply_compressor(&self, input: &[f32], output: &mut [f32], threshold: f32, ratio: f32, attack: f32, release: f32) {
        let attack_coeff = (-1.0 / (attack * self.config.sample_rate as f32)).exp();
        let release_coeff = (-1.0 / (release * self.config.sample_rate as f32)).exp();
        
        let mut envelope = 0.0;
        
        for i in 0..input.len() {
            let input_level = input[i].abs();
            
            // Update envelope
            if input_level > envelope {
                envelope = input_level + (envelope - input_level) * attack_coeff;
            } else {
                envelope = envelope + (input_level - envelope) * release_coeff;
            }
            
            // Apply compression
            let gain = if envelope > threshold {
                1.0 / (1.0 + ratio * (envelope - threshold))
            } else {
                1.0
            };
            
            output[i] = input[i] * gain;
        }
    }

    // Mix all audio sources
    fn mix_audio(&mut self) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Clear master buffer
        for sample in &mut self.master_buffer {
            *sample = 0.0;
        }

        // Mix all active sources
        for source in &self.sources {
            if !source.is_playing {
                continue;
            }

            let distance_gain = self.calculate_distance_gain(source);
            let directional_gain = self.calculate_directional_gain(source);
            let doppler_pitch = self.calculate_doppler_pitch(source);
            
            let total_gain = source.volume * distance_gain * directional_gain * self.listener.gain * self.config.master_volume;
            
            // For now, generate a simple sine wave as placeholder
            // In a real implementation, this would mix actual audio data
            for i in 0..self.config.buffer_size {
                let phase = (i as f32 / self.config.sample_rate as f32) * 440.0 * doppler_pitch;
                let sample = (phase * 2.0 * f32::consts::PI).sin() * total_gain;
                
                // Apply panning
                let left_gain = 1.0 - source.pan;
                let right_gain = 1.0 + source.pan;
                
                self.master_buffer[i * 2] += sample * left_gain;
                self.master_buffer[i * 2 + 1] += sample * right_gain;
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.mixing_time = end_time - start_time;
    }

    // Apply audio effects
    fn apply_effects(&mut self) {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Copy master buffer to temp buffer
        self.temp_buffer.copy_from_slice(&self.master_buffer);

        // Apply all enabled effects
        for effect in &self.effects {
            if !effect.enabled {
                continue;
            }

            match effect.effect_type {
                0 => { // Reverb
                    let mut output = self.master_buffer.clone();
                    self.apply_reverb(
                        &self.temp_buffer,
                        &mut output,
                        effect.wet_level,
                        effect.dry_level,
                        effect.parameters[0], // room_size
                        effect.parameters[1], // damping
                    );
                    self.master_buffer.copy_from_slice(&output);
                }
                1 => { // Delay
                    let mut output = self.master_buffer.clone();
                    self.apply_delay(
                        &self.temp_buffer,
                        &mut output,
                        effect.wet_level,
                        effect.dry_level,
                        effect.parameters[0], // delay_time
                        effect.parameters[1], // feedback
                    );
                    self.master_buffer.copy_from_slice(&output);
                }
                2 => { // Distortion
                    let mut output = self.master_buffer.clone();
                    self.apply_distortion(
                        &self.temp_buffer,
                        &mut output,
                        effect.parameters[0], // gain
                        effect.parameters[1], // level
                    );
                    self.master_buffer.copy_from_slice(&output);
                }
                3 => { // Filter
                    let mut output = self.master_buffer.clone();
                    self.apply_low_pass_filter(
                        &self.temp_buffer,
                        &mut output,
                        effect.parameters[0], // cutoff
                        effect.parameters[1], // resonance
                    );
                    self.master_buffer.copy_from_slice(&output);
                }
                4 => { // Compressor
                    let mut output = self.master_buffer.clone();
                    self.apply_compressor(
                        &self.temp_buffer,
                        &mut output,
                        effect.parameters[0], // threshold
                        effect.parameters[1], // ratio
                        effect.parameters[2], // attack
                        effect.parameters[3], // release
                    );
                    self.master_buffer.copy_from_slice(&output);
                }
                _ => {}
            }
        }

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.effects_time = end_time - start_time;
    }

    // Main audio processing function
    pub fn process_audio(&mut self) -> AudioStats {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Mix all audio sources
        self.mix_audio();

        // Apply audio effects
        self.apply_effects();

        // Update stats
        self.stats.active_sources = self.sources.iter().filter(|s| s.is_playing).count() as u32;
        self.stats.active_effects = self.effects.iter().filter(|e| e.enabled).count() as u32;
        self.stats.memory_usage = (self.sources.len() + self.effects.len()) as u32 * 64; // Approximate memory usage

        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        self.stats.processing_time = end_time - start_time;
        self.stats
    }

    // Get mixed audio buffer
    pub fn get_audio_buffer(&self) -> &[f32] {
        &self.master_buffer
    }

    // Play/pause audio source
    pub fn play_source(&mut self, id: u32) -> bool {
        if let Some(source) = self.sources.iter_mut().find(|s| s.id == id) {
            source.is_playing = true;
            true
        } else {
            false
        }
    }

    pub fn pause_source(&mut self, id: u32) -> bool {
        if let Some(source) = self.sources.iter_mut().find(|s| s.id == id) {
            source.is_playing = false;
            true
        } else {
            false
        }
    }

    // Update source properties
    pub fn update_source_position(&mut self, id: u32, position: Vector2) -> bool {
        if let Some(source) = self.sources.iter_mut().find(|s| s.id == id) {
            source.position = position;
            true
        } else {
            false
        }
    }

    pub fn update_source_velocity(&mut self, id: u32, velocity: Vector2) -> bool {
        if let Some(source) = self.sources.iter_mut().find(|s| s.id == id) {
            source.velocity = velocity;
            true
        } else {
            false
        }
    }

    pub fn update_source_volume(&mut self, id: u32, volume: f32) -> bool {
        if let Some(source) = self.sources.iter_mut().find(|s| s.id == id) {
            source.volume = volume;
            true
        } else {
            false
        }
    }

    // Enable/disable audio effects
    pub fn enable_effect(&mut self, id: u32, enabled: bool) -> bool {
        if let Some(effect) = self.effects.iter_mut().find(|e| e.id == id) {
            effect.enabled = enabled;
            true
        } else {
            false
        }
    }

    // Set effect parameters
    pub fn set_effect_parameters(&mut self, id: u32, parameters: [f32; 8]) -> bool {
        if let Some(effect) = self.effects.iter_mut().find(|e| e.id == id) {
            effect.parameters = parameters;
            true
        } else {
            false
        }
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct RustAudioSystem {
    inner: AudioSystem,
}

#[wasm_bindgen]
impl RustAudioSystem {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> RustAudioSystem {
        let config = serde_wasm_bindgen::from_value::<AudioConfig>(config).unwrap();
        console_log("🦀 Rust Audio System initialized");
        RustAudioSystem {
            inner: AudioSystem::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn add_source(&mut self, source: JsValue) -> u32 {
        if let Ok(audio_source) = serde_wasm_bindgen::from_value::<AudioSource>(source) {
            self.inner.add_source(audio_source)
        } else {
            0
        }
    }

    #[wasm_bindgen]
    pub fn remove_source(&mut self, id: u32) -> bool {
        self.inner.remove_source(id)
    }

    #[wasm_bindgen]
    pub fn add_effect(&mut self, effect: JsValue) -> u32 {
        if let Ok(audio_effect) = serde_wasm_bindgen::from_value::<AudioEffect>(effect) {
            self.inner.add_effect(audio_effect)
        } else {
            0
        }
    }

    #[wasm_bindgen]
    pub fn remove_effect(&mut self, id: u32) -> bool {
        self.inner.remove_effect(id)
    }

    #[wasm_bindgen]
    pub fn set_listener(&mut self, listener: JsValue) {
        if let Ok(audio_listener) = serde_wasm_bindgen::from_value::<AudioListener>(listener) {
            self.inner.set_listener(audio_listener);
        }
    }

    #[wasm_bindgen]
    pub fn get_listener(&self) -> JsValue {
        let listener = self.inner.get_listener();
        serde_wasm_bindgen::to_value(&listener).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let config = self.inner.get_config();
        serde_wasm_bindgen::to_value(&config).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config: JsValue) {
        if let Ok(audio_config) = serde_wasm_bindgen::from_value::<AudioConfig>(config) {
            self.inner.set_config(audio_config);
        }
    }

    #[wasm_bindgen]
    pub fn process_audio(&mut self) -> JsValue {
        let stats = self.inner.process_audio();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let stats = self.inner.get_stats();
        serde_wasm_bindgen::to_value(&stats).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_audio_buffer(&self) -> JsValue {
        let buffer = self.inner.get_audio_buffer();
        serde_wasm_bindgen::to_value(&buffer).unwrap()
    }

    #[wasm_bindgen]
    pub fn play_source(&mut self, id: u32) -> bool {
        self.inner.play_source(id)
    }

    #[wasm_bindgen]
    pub fn pause_source(&mut self, id: u32) -> bool {
        self.inner.pause_source(id)
    }

    #[wasm_bindgen]
    pub fn update_source_position(&mut self, id: u32, x: f32, y: f32) -> bool {
        let position = Vector2::new(x, y);
        self.inner.update_source_position(id, position)
    }

    #[wasm_bindgen]
    pub fn update_source_velocity(&mut self, id: u32, vx: f32, vy: f32) -> bool {
        let velocity = Vector2::new(vx, vy);
        self.inner.update_source_velocity(id, velocity)
    }

    #[wasm_bindgen]
    pub fn update_source_volume(&mut self, id: u32, volume: f32) -> bool {
        self.inner.update_source_volume(id, volume)
    }

    #[wasm_bindgen]
    pub fn enable_effect(&mut self, id: u32, enabled: bool) -> bool {
        self.inner.enable_effect(id, enabled)
    }

    #[wasm_bindgen]
    pub fn set_effect_parameters(&mut self, id: u32, params: JsValue) -> bool {
        if let Ok(parameters) = serde_wasm_bindgen::from_value::<[f32; 8]>(params) {
            self.inner.set_effect_parameters(id, parameters)
        } else {
            false
        }
    }

    #[wasm_bindgen]
    pub fn benchmark_audio(&mut self, source_count: u32, effect_count: u32, iterations: u32) -> JsValue {
        console_log(&format!("🧪 Starting audio benchmark: {} sources, {} effects, {} iterations", source_count, effect_count, iterations));
        
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();

        // Clear existing sources and effects
        self.inner.sources.clear();
        self.inner.effects.clear();

        // Create test sources
        for i in 0..source_count {
            let source = AudioSource {
                id: 0, // Will be set by add_source
                position: Vector2::new(
                    (i as f32 * 10.0) % 200.0 - 100.0,
                    (i as f32 * 15.0) % 200.0 - 100.0
                ),
                velocity: Vector2::new(
                    (i as f32 * 0.1).sin() * 5.0,
                    (i as f32 * 0.1).cos() * 5.0
                ),
                volume: 0.5,
                pitch: 1.0,
                pan: (i as f32 % 10.0 - 5.0) * 0.1,
                loop_enabled: true,
                is_playing: true,
                is_3d: i % 2 == 0,
                max_distance: 100.0,
                reference_distance: 10.0,
                rolloff_factor: 1.0,
                cone_inner_angle: f32::consts::PI / 4.0,
                cone_outer_angle: f32::consts::PI / 2.0,
                cone_outer_gain: 0.5,
                direction: Vector2::new(0.0, 1.0),
            };
            self.inner.add_source(source);
        }

        // Create test effects
        for i in 0..effect_count {
            let effect = AudioEffect {
                id: 0, // Will be set by add_effect
                effect_type: (i % 5) as u8,
                wet_level: 0.3,
                dry_level: 0.7,
                parameters: [
                    0.5 + (i as f32 % 10.0) * 0.1,
                    0.5 + (i as f32 % 5.0) * 0.1,
                    0.1, 0.1, 0.1, 0.1, 0.1, 0.1
                ],
                enabled: true,
            };
            self.inner.add_effect(effect);
        }

        // Run audio processing
        for _ in 0..iterations {
            self.inner.process_audio();
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
            "sourceCount": source_count,
            "effectCount": effect_count,
            "iterations": iterations,
            "totalTime": total_time,
            "avgTimePerFrame": avg_time_per_frame,
            "estimatedFPS": fps,
            "stats": self.inner.get_stats()
        });

        console_log(&format!("⚡ Audio benchmark completed: {:.2}ms total, {:.2}ms/frame, {:.1} FPS", total_time, avg_time_per_frame, fps));
        
        JsValue::from_str(&result.to_string())
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_audio_config(
    sample_rate: u32,
    buffer_size: usize,
    max_sources: u32,
    max_effects: u32,
    distance_model: u8,
    doppler_factor: f32,
    speed_of_sound: f32,
    master_volume: f32
) -> JsValue {
    let config = AudioConfig {
        sample_rate,
        buffer_size,
        max_sources,
        max_effects,
        distance_model,
        doppler_factor,
        speed_of_sound,
        master_volume,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_audio_source(
    x: f32, y: f32,
    vx: f32, vy: f32,
    volume: f32,
    pitch: f32,
    pan: f32,
    loop_enabled: bool,
    is_3d: bool,
    max_distance: f32,
    reference_distance: f32,
    rolloff_factor: f32,
    cone_inner_angle: f32,
    cone_outer_angle: f32,
    cone_outer_gain: f32,
    dir_x: f32, dir_y: f32
) -> JsValue {
    let source = AudioSource {
        id: 0, // Will be set by add_source
        position: Vector2::new(x, y),
        velocity: Vector2::new(vx, vy),
        volume,
        pitch,
        pan,
        loop_enabled,
        is_playing: false,
        is_3d,
        max_distance,
        reference_distance,
        rolloff_factor,
        cone_inner_angle,
        cone_outer_angle,
        cone_outer_gain,
        direction: Vector2::new(dir_x, dir_y),
    };
    serde_wasm_bindgen::to_value(&source).unwrap()
}

#[wasm_bindgen]
pub fn create_audio_effect(
    effect_type: u8,
    wet_level: f32,
    dry_level: f32,
    params: JsValue
) -> JsValue {
    let parameters = serde_wasm_bindgen::from_value::<[f32; 8]>(params).unwrap_or([0.0; 8]);
    let effect = AudioEffect {
        id: 0, // Will be set by add_effect
        effect_type,
        wet_level,
        dry_level,
        parameters,
        enabled: false,
    };
    serde_wasm_bindgen::to_value(&effect).unwrap()
}

#[wasm_bindgen]
pub fn create_audio_listener(
    x: f32, y: f32,
    vx: f32, vy: f32,
    dir_x: f32, dir_y: f32,
    up_x: f32, up_y: f32,
    gain: f32
) -> JsValue {
    let listener = AudioListener {
        position: Vector2::new(x, y),
        velocity: Vector2::new(vx, vy),
        direction: Vector2::new(dir_x, dir_y),
        up: Vector2::new(up_x, up_y),
        gain,
    };
    serde_wasm_bindgen::to_value(&listener).unwrap()
}

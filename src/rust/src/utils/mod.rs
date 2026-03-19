use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use js_sys::SharedArrayBuffer;

// Memory management utilities
pub struct MemoryManager {
    buffers: Vec<u32>, // Store buffer IDs for now
    next_buffer_id: u32,
}

impl MemoryManager {
    pub fn new() -> MemoryManager {
        MemoryManager {
            buffers: Vec::new(),
            next_buffer_id: 0,
        }
    }
    
    pub fn allocate_buffer(&mut self, size: usize) -> u32 {
        let buffer_id = self.next_buffer_id;
        self.next_buffer_id += 1;
        
        // Note: SharedArrayBuffer creation in Rust for WASM is complex
        // For now, we'll use a placeholder that will be enhanced later
        web_sys::console::log_1(&format!("Allocating buffer {} with size {}", buffer_id, size).into());
        
        buffer_id
    }
    
    pub fn deallocate_buffer(&mut self, buffer_id: u32) {
        web_sys::console::log_1(&format!("Deallocating buffer {}", buffer_id).into());
        self.buffers.retain(|&id| id != buffer_id);
    }
    
    pub fn get_buffer_count(&self) -> usize {
        self.buffers.len()
    }
}

// Serialization helpers
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

// Utility functions
pub fn console_log(s: &str) {
    web_sys::console::log_1(&s.into());
}

pub fn console_warn(s: &str) {
    web_sys::console::warn_1(&s.into());
}

pub fn console_error(s: &str) {
    web_sys::console::error_1(&s.into());
}

pub fn get_performance_now() -> f64 {
    web_sys::window()
        .unwrap()
        .performance()
        .unwrap()
        .now()
}

// Performance testing utilities
pub struct Benchmark {
    name: String,
    start_time: f64,
}

impl Benchmark {
    pub fn new(name: &str) -> Benchmark {
        let start_time = get_performance_now();
        console_log(&format!("Starting benchmark: {}", name));
        Benchmark {
            name: name.to_string(),
            start_time,
        }
    }
    
    pub fn end(self) -> f64 {
        let end_time = get_performance_now();
        let duration = end_time - self.start_time;
        console_log(&format!("Benchmark '{}' completed in {:.2}ms", self.name, duration));
        duration
    }
}

// Exported utility functions
#[wasm_bindgen]
pub fn log_message(message: &str) {
    console_log(message);
}

#[wasm_bindgen]
pub fn get_current_time() -> f64 {
    get_performance_now()
}

#[wasm_bindgen]
pub fn run_benchmark(name: &str, iterations: u32) -> f64 {
    let _benchmark = Benchmark::new(name);
    
    let start_time = get_performance_now();
    let mut result = 0.0;
    
    for i in 0..iterations {
        result += (i as f64).sin().cos();
    }
    
    let end_time = get_performance_now();
    
    // Prevent compiler from optimizing away the calculation
    if result == 0.0 {
        console_log("Unexpected result");
    }
    
    end_time - start_time
}

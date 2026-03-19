use wasm_bindgen::prelude::*;

// Import console.log for debugging
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

// Basic performance test
#[wasm_bindgen]
pub fn performance_test(iterations: u32) -> f64 {
    let start = web_sys::window()
        .unwrap()
        .performance()
        .unwrap()
        .now();
    
    // Simulate CPU-intensive work
    let mut result = 0.0;
    for i in 0..iterations {
        result += (i as f64).sin().cos();
    }
    
    let end = web_sys::window()
        .unwrap()
        .performance()
        .unwrap()
        .now();
    
    // Prevent compiler optimization
    if result == 0.0 {
        web_sys::console::log_1(&"Unexpected result".into());
    }
    
    end - start
}

// Performance info structure
#[derive(serde::Serialize)]
pub struct PerformanceInfo {
    pub physics_entities: usize,
    pub particle_count: usize,
    pub audio_channels: usize,
}

#[wasm_bindgen]
pub struct EngineCore {
    physics_entities: usize,
    particle_count: usize,
    audio_channels: usize,
}

#[wasm_bindgen]
impl EngineCore {
    #[wasm_bindgen(constructor)]
    pub fn new() -> EngineCore {
        EngineCore {
            physics_entities: 0,
            particle_count: 0,
            audio_channels: 0,
        }
    }
    
    #[wasm_bindgen]
    pub fn get_performance_info(&self) -> JsValue {
        let info = PerformanceInfo {
            physics_entities: self.physics_entities,
            particle_count: self.particle_count,
            audio_channels: self.audio_channels,
        };
        serde_wasm_bindgen::to_value(&info).unwrap()
    }
    
    #[wasm_bindgen]
    pub fn update_metrics(&mut self, physics: usize, particles: usize, audio: usize) {
        self.physics_entities = physics;
        self.particle_count = particles;
        self.audio_channels = audio;
    }
}

// Module declarations
pub mod physics;
pub mod particles;
pub mod audio;
pub mod hybrid;
pub mod testing;
pub mod advanced;
pub mod ecosystem;
pub mod visual;
pub mod assets;
pub mod input;
pub mod math;
pub mod utils;
pub mod profiler;
pub mod save;
pub mod ui;
pub mod ai;
pub mod world;
pub mod plugins;
pub mod networking;
pub mod security;

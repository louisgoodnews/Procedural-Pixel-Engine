use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;

// Basic vector operations
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vector2 {
    pub fn new(x: f32, y: f32) -> Vector2 {
        Vector2 { x, y }
    }
    
    pub fn zero() -> Vector2 {
        Vector2 { x: 0.0, y: 0.0 }
    }
    
    pub fn one() -> Vector2 {
        Vector2 { x: 1.0, y: 1.0 }
    }
    
    pub fn magnitude(&self) -> f32 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
    
    pub fn magnitude_squared(&self) -> f32 {
        self.x * self.x + self.y * self.y
    }
    
    pub fn normalize(&self) -> Vector2 {
        let mag = self.magnitude();
        if mag > 0.0 {
            Vector2 {
                x: self.x / mag,
                y: self.y / mag,
            }
        } else {
            Vector2::zero()
        }
    }
    
    pub fn dot(&self, other: &Vector2) -> f32 {
        self.x * other.x + self.y * other.y
    }
    
    pub fn cross(&self, other: &Vector2) -> f32 {
        self.x * other.y - self.y * other.x
    }
    
    pub fn distance(&self, other: &Vector2) -> f32 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
    
    pub fn lerp(&self, other: &Vector2, t: f32) -> Vector2 {
        Vector2 {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
        }
    }
}

// Implement required traits
impl std::ops::Add for Vector2 {
    type Output = Vector2;
    
    fn add(self, other: Vector2) -> Vector2 {
        Vector2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl std::ops::Sub for Vector2 {
    type Output = Vector2;
    
    fn sub(self, other: Vector2) -> Vector2 {
        Vector2 {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

impl std::ops::Mul<f32> for Vector2 {
    type Output = Vector2;
    
    fn mul(self, scalar: f32) -> Vector2 {
        Vector2 {
            x: self.x * scalar,
            y: self.y * scalar,
        }
    }
}

impl std::ops::Div<f32> for Vector2 {
    type Output = Vector2;
    
    fn div(self, scalar: f32) -> Vector2 {
        Vector2 {
            x: self.x / scalar,
            y: self.y / scalar,
        }
    }
}

impl std::ops::Neg for Vector2 {
    type Output = Vector2;
    
    fn neg(self) -> Vector2 {
        Vector2 {
            x: -self.x,
            y: -self.y,
        }
    }
}

// Vector3 implementation
impl Vector3 {
    pub fn new(x: f32, y: f32, z: f32) -> Vector3 {
        Vector3 { x, y, z }
    }
    
    pub fn zero() -> Vector3 {
        Vector3 { x: 0.0, y: 0.0, z: 0.0 }
    }
    
    pub fn one() -> Vector3 {
        Vector3 { x: 1.0, y: 1.0, z: 1.0 }
    }
    
    pub fn magnitude(&self) -> f32 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
    
    pub fn magnitude_squared(&self) -> f32 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }
    
    pub fn normalize(&self) -> Vector3 {
        let mag = self.magnitude();
        if mag > 0.0 {
            Vector3 {
                x: self.x / mag,
                y: self.y / mag,
                z: self.z / mag,
            }
        } else {
            Vector3::zero()
        }
    }
    
    pub fn dot(&self, other: &Vector3) -> f32 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }
    
    pub fn cross(&self, other: &Vector3) -> Vector3 {
        Vector3 {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }
    
    pub fn distance(&self, other: &Vector3) -> f32 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2) + (self.z - other.z).powi(2)).sqrt()
    }
    
    pub fn lerp(&self, other: &Vector3, t: f32) -> Vector3 {
        Vector3 {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }
}

// Matrix operations
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
#[repr(C)]
pub struct Matrix3 {
    pub m: [f32; 9], // Column-major order
}

impl Matrix3 {
    pub fn identity() -> Matrix3 {
        Matrix3 {
            m: [
                1.0, 0.0, 0.0, // Column 1
                0.0, 1.0, 0.0, // Column 2
                0.0, 0.0, 1.0, // Column 3
            ],
        }
    }
    
    pub fn translation(x: f32, y: f32) -> Matrix3 {
        Matrix3 {
            m: [
                1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                x,   y,   1.0,
            ],
        }
    }
    
    pub fn rotation(angle: f32) -> Matrix3 {
        let cos_a = angle.cos();
        let sin_a = angle.sin();
        
        Matrix3 {
            m: [
                cos_a, sin_a, 0.0,
                -sin_a, cos_a, 0.0,
                0.0,   0.0,   1.0,
            ],
        }
    }
    
    pub fn scale(x: f32, y: f32) -> Matrix3 {
        Matrix3 {
            m: [
                x,   0.0, 0.0,
                0.0, y,   0.0,
                0.0, 0.0, 1.0,
            ],
        }
    }
    
    pub fn transform_point(&self, point: &Vector2) -> Vector2 {
        Vector2 {
            x: self.m[0] * point.x + self.m[3] * point.y + self.m[6],
            y: self.m[1] * point.x + self.m[4] * point.y + self.m[7],
        }
    }
    
    pub fn multiply(&self, other: &Matrix3) -> Matrix3 {
        Matrix3 {
            m: [
                self.m[0] * other.m[0] + self.m[3] * other.m[1] + self.m[6] * other.m[2],
                self.m[1] * other.m[0] + self.m[4] * other.m[1] + self.m[7] * other.m[2],
                self.m[2] * other.m[0] + self.m[5] * other.m[1] + self.m[8] * other.m[2],
                
                self.m[0] * other.m[3] + self.m[3] * other.m[4] + self.m[6] * other.m[5],
                self.m[1] * other.m[3] + self.m[4] * other.m[4] + self.m[7] * other.m[5],
                self.m[2] * other.m[3] + self.m[5] * other.m[4] + self.m[8] * other.m[5],
                
                self.m[0] * other.m[6] + self.m[3] * other.m[7] + self.m[6] * other.m[8],
                self.m[1] * other.m[6] + self.m[4] * other.m[7] + self.m[7] * other.m[8],
                self.m[2] * other.m[6] + self.m[5] * other.m[7] + self.m[8] * other.m[8],
            ],
        }
    }
}

// Utility functions
#[wasm_bindgen]
pub fn vector2_new(x: f32, y: f32) -> JsValue {
    serde_wasm_bindgen::to_value(&Vector2::new(x, y)).unwrap()
}

#[wasm_bindgen]
pub fn vector2_magnitude(x: f32, y: f32) -> f32 {
    Vector2::new(x, y).magnitude()
}

#[wasm_bindgen]
pub fn vector2_normalize(x: f32, y: f32) -> JsValue {
    let normalized = Vector2::new(x, y).normalize();
    serde_wasm_bindgen::to_value(&normalized).unwrap()
}

#[wasm_bindgen]
pub fn vector2_distance(x1: f32, y1: f32, x2: f32, y2: f32) -> f32 {
    Vector2::new(x1, y1).distance(&Vector2::new(x2, y2))
}

#[wasm_bindgen]
pub fn matrix3_identity() -> JsValue {
    serde_wasm_bindgen::to_value(&Matrix3::identity()).unwrap()
}

#[wasm_bindgen]
pub fn matrix3_translation(x: f32, y: f32) -> JsValue {
    serde_wasm_bindgen::to_value(&Matrix3::translation(x, y)).unwrap()
}

#[wasm_bindgen]
pub fn matrix3_rotation(angle: f32) -> JsValue {
    serde_wasm_bindgen::to_value(&Matrix3::rotation(angle)).unwrap()
}

#[wasm_bindgen]
pub fn matrix3_scale(x: f32, y: f32) -> JsValue {
    serde_wasm_bindgen::to_value(&Matrix3::scale(x, y)).unwrap()
}

// Performance test for math operations
#[wasm_bindgen]
pub fn benchmark_math_operations(iterations: u32) -> f64 {
    let start_time = crate::utils::get_performance_now();
    
    let mut result = 0.0;
    for i in 0..iterations {
        let angle = (i as f32) * 0.01;
        let v1 = Vector2::new(angle.cos(), angle.sin());
        let v2 = Vector2::new(angle.sin(), -angle.cos());
        
        result += v1.dot(&v2);
        result += v1.magnitude();
        result += v1.distance(&v2);
        
        let m1 = Matrix3::rotation(angle);
        let m2 = Matrix3::translation(angle, -angle);
        let m3 = m1.multiply(&m2);
        
        let p = m3.transform_point(&v1);
        result += p.x + p.y;
    }
    
    let end_time = crate::utils::get_performance_now();
    
    // Prevent compiler optimization
    if result == 0.0 {
        console_log("Unexpected math benchmark result");
    }
    
    end_time - start_time
}

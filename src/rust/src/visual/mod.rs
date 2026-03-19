use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use crate::utils::console_log;
use std::collections::HashMap;
use crate::math::Vector3;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum NodeType {
    // Math nodes
    Add,
    Subtract,
    Multiply,
    Divide,
    Power,
    Sqrt,
    Abs,
    Min,
    Max,
    Clamp,
    Lerp,
    Sin,
    Cos,
    Tan,
    Asin,
    Acos,
    Atan,
    Atan2,
    // Logic nodes
    And,
    Or,
    Not,
    Xor,
    Equal,
    NotEqual,
    Greater,
    Less,
    GreaterEqual,
    LessEqual,
    // Flow control nodes
    If,
    Switch,
    ForLoop,
    WhileLoop,
    ForEach,
    Break,
    Continue,
    Return,
    // Variable nodes
    Variable,
    SetVariable,
    GetVariable,
    Constant,
    // Function nodes
    Function,
    CallFunction,
    ReturnFunction,
    // Array nodes
    Array,
    GetArrayElement,
    SetArrayElement,
    ArrayLength,
    ArrayPush,
    ArrayPop,
    // Object nodes
    Object,
    GetProperty,
    SetProperty,
    HasProperty,
    DeleteProperty,
    // String nodes
    String,
    Concat,
    Substring,
    Length,
    ToUpper,
    ToLower,
    Split,
    Join,
    // Custom nodes
    Custom(u32),
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum NodeCategory {
    Math,
    Logic,
    FlowControl,
    Variable,
    Function,
    Array,
    Object,
    String,
    Custom,
    Utility,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum DataType {
    Number,
    Boolean,
    String,
    Array,
    Object,
    Function,
    Any,
    Void,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub enum ExecutionState {
    Ready,
    Running,
    Paused,
    Completed,
    Error,
    Breakpoint,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct NodePort {
    pub id: String,
    pub name: String,
    pub data_type: DataType,
    pub is_input: bool,
    pub is_connected: bool,
    pub value: NodeValue,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub enum NodeValue {
    Number(f64),
    Boolean(bool),
    String(String),
    Array(Vec<NodeValue>),
    Object(HashMap<String, NodeValue>),
    Null,
    Undefined,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct VisualNode {
    pub id: String,
    pub node_type: NodeType,
    pub category: NodeCategory,
    pub name: String,
    pub description: String,
    pub position: Vector3,
    pub inputs: Vec<NodePort>,
    pub outputs: Vec<NodePort>,
    pub properties: HashMap<String, NodeValue>,
    pub is_enabled: bool,
    pub has_breakpoint: bool,
    pub execution_count: u32,
    pub last_execution_time: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct NodeConnection {
    pub id: String,
    pub source_node_id: String,
    pub source_port_id: String,
    pub target_node_id: String,
    pub target_port_id: String,
    pub is_enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct VisualScript {
    pub id: String,
    pub name: String,
    pub description: String,
    pub nodes: HashMap<String, VisualNode>,
    pub connections: Vec<NodeConnection>,
    pub variables: HashMap<String, NodeValue>,
    pub functions: HashMap<String, VisualFunction>,
    pub entry_point_id: Option<String>,
    pub is_enabled: bool,
    pub auto_execute: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct VisualFunction {
    pub id: String,
    pub name: String,
    pub parameters: Vec<NodePort>,
    pub return_type: DataType,
    pub body: VisualScript,
    pub is_async: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct DebugInfo {
    pub node_id: String,
    pub execution_state: ExecutionState,
    pub current_value: NodeValue,
    pub execution_time: f64,
    pub error_message: Option<String>,
    pub call_stack: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct PerformanceProfile {
    pub node_id: String,
    pub execution_count: u32,
    pub total_time: f64,
    pub average_time: f64,
    pub max_time: f64,
    pub min_time: f64,
    pub memory_usage: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct VisualScriptConfig {
    pub enable_debugging: bool,
    pub enable_profiling: bool,
    pub enable_breakpoints: bool,
    pub max_execution_time: f64,
    pub max_nodes: u32,
    pub enable_optimization: bool,
    pub enable_code_generation: bool,
    pub enable_collaborative_editing: bool,
    pub auto_save: bool,
    pub save_interval: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[repr(C)]
pub struct VisualScriptStats {
    pub total_scripts: u32,
    pub active_scripts: u32,
    pub total_nodes: u32,
    pub active_nodes: u32,
    pub total_connections: u32,
    pub total_functions: u32,
    pub total_variables: u32,
    pub execution_count: u32,
    pub average_execution_time: f64,
    pub total_execution_time: f64,
    pub memory_usage: u32,
}

pub struct VisualScriptEngine {
    config: VisualScriptConfig,
    scripts: HashMap<String, VisualScript>,
    debug_info: Vec<DebugInfo>,
    performance_profiles: HashMap<String, PerformanceProfile>,
    breakpoints: HashMap<String, Vec<String>>,
    execution_stack: Vec<String>,
    current_script: Option<String>,
    stats: VisualScriptStats,
    code_generator: Option<CodeGenerator>,
    collaborative_editor: Option<CollaborativeEditor>,
}

impl VisualScriptEngine {
    pub fn new(config: VisualScriptConfig) -> VisualScriptEngine {
        console_log("🎨 Initializing Visual Script Engine...");
        
        let mut engine = VisualScriptEngine {
            config: config.clone(),
            scripts: HashMap::new(),
            debug_info: Vec::new(),
            performance_profiles: HashMap::new(),
            breakpoints: HashMap::new(),
            execution_stack: Vec::new(),
            current_script: None,
            stats: VisualScriptStats {
                total_scripts: 0,
                active_scripts: 0,
                total_nodes: 0,
                active_nodes: 0,
                total_connections: 0,
                total_functions: 0,
                total_variables: 0,
                execution_count: 0,
                average_execution_time: 0.0,
                total_execution_time: 0.0,
                memory_usage: 0,
            },
            code_generator: if config.enable_code_generation {
                Some(CodeGenerator::new())
            } else {
                None
            },
            collaborative_editor: if config.enable_collaborative_editing {
                Some(CollaborativeEditor::new())
            } else {
                None
            },
        };
        
        // Initialize default node types
        engine.initialize_default_nodes();
        
        console_log("✅ Visual Script Engine initialized successfully");
        engine
    }
    
    pub fn update_config(&mut self, config: VisualScriptConfig) {
        self.config = config.clone();
        
        // Update subsystems
        if config.enable_code_generation && self.code_generator.is_none() {
            self.code_generator = Some(CodeGenerator::new());
        } else if !config.enable_code_generation {
            self.code_generator = None;
        }
        
        if config.enable_collaborative_editing && self.collaborative_editor.is_none() {
            self.collaborative_editor = Some(CollaborativeEditor::new());
        } else if !config.enable_collaborative_editing {
            self.collaborative_editor = None;
        }
    }
    
    pub fn get_config(&self) -> VisualScriptConfig {
        self.config.clone()
    }
    
    pub fn get_stats(&self) -> VisualScriptStats {
        self.stats.clone()
    }
    
    // Script Management
    pub fn create_script(&mut self, id: String, name: String, description: String) -> Result<(), String> {
        // Validate script
        if id.is_empty() || name.is_empty() {
            return Err("Script ID and name are required".to_string());
        }
        
        // Check for duplicate ID
        if self.scripts.contains_key(&id) {
            return Err("Script ID already exists".to_string());
        }
        
        // Create script
        let script = VisualScript {
            id: id.clone(),
            name,
            description,
            nodes: HashMap::new(),
            connections: Vec::new(),
            variables: HashMap::new(),
            functions: HashMap::new(),
            entry_point_id: None,
            is_enabled: true,
            auto_execute: false,
        };
        
        self.scripts.insert(id.clone(), script);
        self.stats.total_scripts += 1;
        self.stats.active_scripts += 1;
        
        console_log(&format!("🎨 Created script: {}", id));
        Ok(())
    }
    
    pub fn remove_script(&mut self, script_id: &str) -> Result<(), String> {
        if let Some(script) = self.scripts.remove(script_id) {
            self.stats.total_scripts -= 1;
            if script.is_enabled {
                self.stats.active_scripts -= 1;
            }
            
            // Update node and connection counts
            self.stats.total_nodes -= script.nodes.len() as u32;
            self.stats.total_connections -= script.connections.len() as u32;
            self.stats.total_functions -= script.functions.len() as u32;
            self.stats.total_variables -= script.variables.len() as u32;
            
            console_log(&format!("🎨 Removed script: {}", script_id));
            Ok(())
        } else {
            Err("Script not found".to_string())
        }
    }
    
    pub fn get_scripts(&self) -> Vec<VisualScript> {
        self.scripts.values().cloned().collect()
    }
    
    pub fn get_script(&self, script_id: &str) -> Option<VisualScript> {
        self.scripts.get(script_id).cloned()
    }
    
    // Node Management
    pub fn add_node(&mut self, script_id: &str, node: VisualNode) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            // Check for duplicate node ID
            if script.nodes.contains_key(&node.id) {
                return Err("Node ID already exists in script".to_string());
            }
            
            script.nodes.insert(node.id.clone(), node.clone());
            self.stats.total_nodes += 1;
            if node.is_enabled {
                self.stats.active_nodes += 1;
            }
            
            console_log(&format!("🔧 Added node: {} to script: {}", node.id, script_id));
            Ok(())
        } else {
            Err("Script not found".to_string())
        }
    }
    
    pub fn remove_node(&mut self, script_id: &str, node_id: &str) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            if let Some(node) = script.nodes.remove(node_id) {
                self.stats.total_nodes -= 1;
                if node.is_enabled {
                    self.stats.active_nodes -= 1;
                }
                
                // Remove connections to this node
                script.connections.retain(|conn| {
                    conn.source_node_id != node_id && conn.target_node_id != node_id
                });
                
                console_log(&format!("🔧 Removed node: {} from script: {}", node_id, script_id));
                Ok(())
            } else {
                Err("Node not found".to_string())
            }
        } else {
            Err("Script not found".to_string())
        }
    }
    
    // Connection Management
    pub fn add_connection(&mut self, script_id: &str, connection: NodeConnection) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            // Validate connection
            if !script.nodes.contains_key(&connection.source_node_id) ||
               !script.nodes.contains_key(&connection.target_node_id) {
                return Err("Source or target node not found".to_string());
            }
            
            script.connections.push(connection.clone());
            self.stats.total_connections += 1;
            
            console_log(&format!("🔗 Added connection: {} in script: {}", connection.id, script_id));
            Ok(())
        } else {
            Err("Script not found".to_string())
        }
    }
    
    pub fn remove_connection(&mut self, script_id: &str, connection_id: &str) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            let initial_len = script.connections.len();
            script.connections.retain(|conn| conn.id != connection_id);
            
            if script.connections.len() < initial_len {
                self.stats.total_connections -= 1;
                console_log(&format!("🔗 Removed connection: {} from script: {}", connection_id, script_id));
                Ok(())
            } else {
                Err("Connection not found".to_string())
            }
        } else {
            Err("Script not found".to_string())
        }
    }
    
    // Execution
    pub fn execute_script(&mut self, script_id: &str) -> Result<NodeValue, String> {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        if let Some(script) = self.scripts.get_mut(script_id) {
            if !script.is_enabled {
                return Err("Script is disabled".to_string());
            }
            
            self.current_script = Some(script_id.to_string());
            self.execution_stack.clear();
            self.debug_info.clear();
            
            // Find entry point
            let entry_point_id = script.entry_point_id.clone()
                .ok_or("No entry point defined")?;
            
            let result = self.execute_node(script_id, &entry_point_id);
            
            let end_time = web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now();
            
            let execution_time = end_time - start_time;
            self.stats.execution_count += 1;
            self.stats.total_execution_time += execution_time;
            self.stats.average_execution_time = self.stats.total_execution_time / self.stats.execution_count as f64;
            
            // Update performance profiles
            if self.config.enable_profiling {
                self.update_performance_profiles(execution_time);
            }
            
            console_log(&format!("⚡ Script {} executed in {:.2}ms", script_id, execution_time));
            
            self.current_script = None;
            result
        } else {
            Err("Script not found".to_string())
        }
    }
    
    fn execute_node(&mut self, script_id: &str, node_id: &str) -> Result<NodeValue, String> {
        let start_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Get node type and clone necessary data before borrowing
        let (node_type, node_name, has_breakpoint) = {
            if let Some(script) = self.scripts.get(script_id) {
                if let Some(node) = script.nodes.get(node_id) {
                    (node.node_type, node.name.clone(), node.has_breakpoint)
                } else {
                    return Err("Node not found".to_string());
                }
            } else {
                return Err("Script not found".to_string());
            }
        };
        
        // Check for breakpoint
        if self.config.enable_breakpoints && has_breakpoint {
            self.debug_info.push(DebugInfo {
                node_id: node_id.to_string(),
                execution_state: ExecutionState::Breakpoint,
                current_value: NodeValue::Null,
                execution_time: 0.0,
                error_message: None,
                call_stack: self.execution_stack.clone(),
            });
            return Err("Breakpoint hit".to_string());
        }
        
        // Update debug info
        self.debug_info.push(DebugInfo {
            node_id: node_id.to_string(),
            execution_state: ExecutionState::Running,
            current_value: NodeValue::Null,
            execution_time: 0.0,
            error_message: None,
            call_stack: self.execution_stack.clone(),
        });
        
        self.execution_stack.push(node_id.to_string());
        
        // Execute node based on type
        let result = {
            // Clone necessary data before borrowing
            let node_type = {
                if let Some(script) = self.scripts.get(script_id) {
                    if let Some(node) = script.nodes.get(node_id) {
                        node.node_type
                    } else {
                        return Err("Node not found".to_string());
                    }
                } else {
                    return Err("Script not found".to_string());
                }
            };
            
            match node_type {
                NodeType::Add => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_add_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Subtract => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_subtract_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Multiply => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_multiply_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Divide => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_divide_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::And => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_and_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Or => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_or_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Not => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_not_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::If => {
                    // Handle If node separately due to complexity
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_if_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Variable => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_variable_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::SetVariable => {
                    // Handle SetVariable by extracting data first, then modifying script
                    let (var_name, value) = {
                        if let Some(script) = self.scripts.get(script_id) {
                            if let Some(node) = script.nodes.get(node_id) {
                                let var_name = node.properties.get("name").cloned();
                                let value = node.inputs.get(0).map(|input| input.value.clone());
                                (var_name, value)
                            } else {
                                return Err("Node not found".to_string());
                            }
                        } else {
                            return Err("Script not found".to_string());
                        }
                    };
                    
                    // Now set the variable in the mutable script
                    if let (Some(var_name), Some(value)) = (var_name, value) {
                        if let NodeValue::String(name) = var_name {
                            if let Some(mut_script) = self.scripts.get_mut(script_id) {
                                mut_script.variables.insert(name, value.clone());
                                Ok(value)
                            } else {
                                Err("Script not found".to_string())
                            }
                        } else {
                            Err("Variable name must be string".to_string())
                        }
                    } else {
                        Err("Variable name or value not found".to_string())
                    }
                }
                NodeType::GetVariable => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_get_variable_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                NodeType::Constant => {
                    if let Some(script) = self.scripts.get(script_id) {
                        if let Some(node) = script.nodes.get(node_id) {
                            let node_clone = node.clone();
                            let script_clone = script.clone();
                            Self::execute_constant_node_static(&node_clone, &script_clone)
                        } else {
                            Err("Node not found".to_string())
                        }
                    } else {
                        Err("Script not found".to_string())
                    }
                }
                _ => Err("Node type not implemented".to_string()),
            }
        };
        
        let end_time = web_sys::window()
            .unwrap()
            .performance()
            .unwrap()
            .now();
        
        // Update node execution time and count
        if let Some(script) = self.scripts.get_mut(script_id) {
            if let Some(node) = script.nodes.get_mut(node_id) {
                node.last_execution_time = end_time - start_time;
                node.execution_count += 1;
            }
        }
        
        // Update debug info with result
        if let Some(debug_info) = self.debug_info.last_mut() {
            debug_info.execution_state = match &result {
                Ok(_) => ExecutionState::Completed,
                Err(_) => ExecutionState::Error,
            };
            debug_info.current_value = result.clone().unwrap_or(NodeValue::Null);
            debug_info.execution_time = end_time - start_time;
            if let Err(ref error) = result {
                debug_info.error_message = Some(error.clone());
            }
        }
        
        self.execution_stack.pop();
        result
    }
    
    // Math node executions (static versions to avoid borrow checker issues)
    fn execute_add_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("Add node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Number(a), NodeValue::Number(b)) => {
                Ok(NodeValue::Number(a + b))
            }
            (NodeValue::String(a), NodeValue::String(b)) => {
                Ok(NodeValue::String(format!("{}{}", a, b)))
            }
            (NodeValue::Array(a), NodeValue::Array(b)) => {
                let mut result = a.clone();
                result.extend(b.clone());
                Ok(NodeValue::Array(result))
            }
            _ => Err("Incompatible types for addition".to_string()),
        }
    }
    
    fn execute_subtract_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("Subtract node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Number(a), NodeValue::Number(b)) => {
                Ok(NodeValue::Number(a - b))
            }
            _ => Err("Subtraction only works with numbers".to_string()),
        }
    }
    
    fn execute_multiply_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("Multiply node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Number(a), NodeValue::Number(b)) => {
                Ok(NodeValue::Number(a * b))
            }
            _ => Err("Multiplication only works with numbers".to_string()),
        }
    }
    
    fn execute_divide_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("Divide node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Number(a), NodeValue::Number(b)) => {
                if *b == 0.0 {
                    Err("Division by zero".to_string())
                } else {
                    Ok(NodeValue::Number(a / b))
                }
            }
            _ => Err("Division only works with numbers".to_string()),
        }
    }
    
    // Logic node executions (static versions)
    fn execute_and_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("And node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Boolean(a), NodeValue::Boolean(b)) => {
                Ok(NodeValue::Boolean(*a && *b))
            }
            _ => Err("And node requires boolean inputs".to_string()),
        }
    }
    
    fn execute_or_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("Or node requires 2 inputs".to_string());
        }
        
        let input1 = &node.inputs[0].value;
        let input2 = &node.inputs[1].value;
        
        match (input1, input2) {
            (NodeValue::Boolean(a), NodeValue::Boolean(b)) => {
                Ok(NodeValue::Boolean(*a || *b))
            }
            _ => Err("Or node requires boolean inputs".to_string()),
        }
    }
    
    fn execute_not_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 1 {
            return Err("Not node requires 1 input".to_string());
        }
        
        let input = &node.inputs[0].value;
        
        match input {
            NodeValue::Boolean(a) => Ok(NodeValue::Boolean(!a)),
            _ => Err("Not node requires boolean input".to_string()),
        }
    }
    
    // Variable node executions (static versions)
    fn execute_variable_node_static(node: &VisualNode, script: &VisualScript) -> Result<NodeValue, String> {
        let var_name = node.properties.get("name")
            .ok_or("Variable name not specified")?;
        
        match var_name {
            NodeValue::String(name) => {
                if let Some(value) = script.variables.get(name) {
                    Ok(value.clone())
                } else {
                    Err(format!("Variable '{}' not found", name))
                }
            }
            _ => Err("Variable name must be string".to_string()),
        }
    }
    
    fn execute_get_variable_node_static(node: &VisualNode, script: &VisualScript) -> Result<NodeValue, String> {
        Self::execute_variable_node_static(node, script)
    }
    
    fn execute_constant_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        let value = node.properties.get("value")
            .ok_or("Constant value not specified")?;
        Ok(value.clone())
    }
    
    // Flow control node executions (static versions)
    fn execute_if_node_static(node: &VisualNode, _script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("If node requires condition and true branch".to_string());
        }
        
        let condition = &node.inputs[0].value;
        let true_branch = &node.inputs[1].value;
        let false_branch = if node.inputs.len() > 2 {
            Some(&node.inputs[2].value)
        } else {
            None
        };
        
        match condition {
            NodeValue::Boolean(cond) => {
                if *cond {
                    Ok(true_branch.clone())
                } else if let Some(false_branch) = false_branch {
                    Ok(false_branch.clone())
                } else {
                    Ok(NodeValue::Null)
                }
            }
            _ => Err("If condition must be boolean".to_string()),
        }
    }
    
    // Flow control node executions (still need mutable access for some)
    fn execute_if_node(&mut self, node: &VisualNode, script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 2 {
            return Err("If node requires condition and true branch".to_string());
        }
        
        let condition = &node.inputs[0].value;
        let true_branch = &node.inputs[1].value;
        let false_branch = if node.inputs.len() > 2 {
            Some(&node.inputs[2].value)
        } else {
            None
        };
        
        match condition {
            NodeValue::Boolean(cond) => {
                if *cond {
                    Ok(true_branch.clone())
                } else if let Some(false_branch) = false_branch {
                    Ok(false_branch.clone())
                } else {
                    Ok(NodeValue::Null)
                }
            }
            _ => Err("If condition must be boolean".to_string()),
        }
    }
    
    // Variable node executions (still need mutable access for set variable)
    fn execute_set_variable_node(&mut self, node: &VisualNode, script: &mut VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 1 {
            return Err("Set variable node requires value input".to_string());
        }
        
        let var_name = node.properties.get("name")
            .ok_or("Variable name not specified")?;
        let value = &node.inputs[0].value;
        
        match var_name {
            NodeValue::String(name) => {
                script.variables.insert(name.clone(), value.clone());
                Ok(value.clone())
            }
            _ => Err("Variable name must be string".to_string()),
        }
    }
    
    // Static version for set variable that doesn't modify the script
    fn execute_set_variable_node_static(node: &VisualNode, script: &VisualScript) -> Result<NodeValue, String> {
        if node.inputs.len() < 1 {
            return Err("Set variable node requires value input".to_string());
        }
        
        let var_name = node.properties.get("name")
            .ok_or("Variable name not specified")?;
        let value = &node.inputs[0].value;
        
        match var_name {
            NodeValue::String(name) => {
                // In static version, we just return the value without modifying the script
                Ok(value.clone())
            }
            _ => Err("Variable name must be string".to_string()),
        }
    }
    
    // Debugging
    pub fn set_breakpoint(&mut self, script_id: &str, node_id: &str) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            if let Some(node) = script.nodes.get_mut(node_id) {
                node.has_breakpoint = true;
                
                // Add to breakpoints map
                let breakpoints = self.breakpoints.entry(script_id.to_string())
                    .or_insert_with(Vec::new);
                if !breakpoints.contains(&node_id.to_string()) {
                    breakpoints.push(node_id.to_string());
                }
                
                console_log(&format!("🛑 Set breakpoint on node: {} in script: {}", node_id, script_id));
                Ok(())
            } else {
                Err("Node not found".to_string())
            }
        } else {
            Err("Script not found".to_string())
        }
    }
    
    pub fn remove_breakpoint(&mut self, script_id: &str, node_id: &str) -> Result<(), String> {
        if let Some(script) = self.scripts.get_mut(script_id) {
            if let Some(node) = script.nodes.get_mut(node_id) {
                node.has_breakpoint = false;
                
                // Remove from breakpoints map
                if let Some(breakpoints) = self.breakpoints.get_mut(script_id) {
                    breakpoints.retain(|id| id != node_id);
                }
                
                console_log(&format!("🛑 Removed breakpoint from node: {} in script: {}", node_id, script_id));
                Ok(())
            } else {
                Err("Node not found".to_string())
            }
        } else {
            Err("Script not found".to_string())
        }
    }
    
    pub fn get_debug_info(&self) -> Vec<DebugInfo> {
        self.debug_info.clone()
    }
    
    pub fn step_execution(&mut self) -> Result<NodeValue, String> {
        if let Some(script_id) = self.current_script.clone() {
            if let Some(node_id) = self.execution_stack.last().cloned() {
                self.execute_node(&script_id, &node_id)
            } else {
                Err("No node in execution stack".to_string())
            }
        } else {
            Err("No script being executed".to_string())
        }
    }
    
    // Performance profiling
    fn update_performance_profiles(&mut self, execution_time: f64) {
        if let Some(script_id) = &self.current_script {
            for debug_info in &self.debug_info {
                let profile = self.performance_profiles
                    .entry(debug_info.node_id.clone())
                    .or_insert_with(|| PerformanceProfile {
                        node_id: debug_info.node_id.clone(),
                        execution_count: 0,
                        total_time: 0.0,
                        average_time: 0.0,
                        max_time: 0.0,
                        min_time: f64::INFINITY,
                        memory_usage: 0,
                    });
                
                profile.execution_count += 1;
                profile.total_time += debug_info.execution_time;
                profile.average_time = profile.total_time / profile.execution_count as f64;
                profile.max_time = profile.max_time.max(debug_info.execution_time);
                profile.min_time = profile.min_time.min(debug_info.execution_time);
            }
        }
    }
    
    pub fn get_performance_profiles(&self) -> HashMap<String, PerformanceProfile> {
        self.performance_profiles.clone()
    }
    
    // Code generation
    pub fn generate_code(&self, script_id: &str, language: &str) -> Result<String, String> {
        if let Some(code_generator) = &self.code_generator {
            if let Some(script) = self.scripts.get(script_id) {
                code_generator.generate_code(script, language)
            } else {
                Err("Script not found".to_string())
            }
        } else {
            Err("Code generation not enabled".to_string())
        }
    }
    
    // Collaborative editing
    pub fn start_collaborative_session(&mut self) -> Result<String, String> {
        if let Some(collaborative_editor) = &mut self.collaborative_editor {
            collaborative_editor.start_session()
        } else {
            Err("Collaborative editing not enabled".to_string())
        }
    }
    
    pub fn join_collaborative_session(&mut self, session_id: &str) -> Result<(), String> {
        if let Some(collaborative_editor) = &mut self.collaborative_editor {
            collaborative_editor.join_session(session_id)
        } else {
            Err("Collaborative editing not enabled".to_string())
        }
    }
    
    // Utility methods
    fn initialize_default_nodes(&mut self) {
        // This would initialize a library of default node templates
        console_log("🔧 Initialized default node library");
    }
    
    pub fn update_stats(&mut self) {
        // Update statistics based on current state
        self.stats.total_scripts = self.scripts.len() as u32;
        self.stats.active_scripts = self.scripts.values().filter(|s| s.is_enabled).count() as u32;
        self.stats.total_nodes = self.scripts.values().map(|s| s.nodes.len()).sum::<usize>() as u32;
        self.stats.active_nodes = self.scripts.values()
            .flat_map(|s| s.nodes.values())
            .filter(|n| n.is_enabled)
            .count() as u32;
        self.stats.total_connections = self.scripts.values().map(|s| s.connections.len()).sum::<usize>() as u32;
        self.stats.total_functions = self.scripts.values().map(|s| s.functions.len()).sum::<usize>() as u32;
        self.stats.total_variables = self.scripts.values().map(|s| s.variables.len()).sum::<usize>() as u32;
    }
    
    pub fn get_script_summary(&mut self) -> String {
        self.update_stats();
        
        format!(
            "🎨 Visual Script Engine Summary\n\
             ============================\n\
             Total Scripts: {}\n\
             Active Scripts: {}\n\
             Total Nodes: {}\n\
             Active Nodes: {}\n\
             Total Connections: {}\n\
             Total Functions: {}\n\
             Total Variables: {}\n\
             Execution Count: {}\n\
             Average Execution Time: {:.2}ms\n\
             Total Execution Time: {:.2}ms\n\
             Memory Usage: {} bytes",
            self.stats.total_scripts,
            self.stats.active_scripts,
            self.stats.total_nodes,
            self.stats.active_nodes,
            self.stats.total_connections,
            self.stats.total_functions,
            self.stats.total_variables,
            self.stats.execution_count,
            self.stats.average_execution_time,
            self.stats.total_execution_time,
            self.stats.memory_usage
        )
    }
}

// Code Generator
pub struct CodeGenerator {
    templates: HashMap<String, String>,
}

impl CodeGenerator {
    pub fn new() -> CodeGenerator {
        CodeGenerator {
            templates: HashMap::new(),
        }
    }
    
    pub fn generate_code(&self, script: &VisualScript, language: &str) -> Result<String, String> {
        match language {
            "typescript" => self.generate_typescript_code(script),
            "javascript" => self.generate_javascript_code(script),
            "rust" => self.generate_rust_code(script),
            _ => Err("Unsupported language".to_string()),
        }
    }
    
    fn generate_typescript_code(&self, script: &VisualScript) -> Result<String, String> {
        let mut code = String::new();
        
        // Generate function signature
        code.push_str(&format!("function {}(): any {{\n", script.name));
        
        // Generate variable declarations
        for (var_name, var_value) in &script.variables {
            code.push_str(&format!("  let {} = {:?};\n", var_name, var_value));
        }
        
        // Generate node executions
        for (node_id, node) in &script.nodes {
            code.push_str(&format!("  // Node: {}\n", node.name));
            // This would generate actual code based on node type
        }
        
        code.push_str("}\n");
        Ok(code)
    }
    
    fn generate_javascript_code(&self, script: &VisualScript) -> Result<String, String> {
        // Similar to TypeScript but without type annotations
        self.generate_typescript_code(script)
    }
    
    fn generate_rust_code(&self, script: &VisualScript) -> Result<String, String> {
        let mut code = String::new();
        
        // Generate function signature
        code.push_str(&format!("fn {}() -> Result<(), Box<dyn std::error::Error>> {{\n", script.name));
        
        // Generate variable declarations
        for (var_name, var_value) in &script.variables {
            code.push_str(&format!("  let mut {} = {:?};\n", var_name, var_value));
        }
        
        // Generate node executions
        for (node_id, node) in &script.nodes {
            code.push_str(&format!("  // Node: {}\n", node.name));
            // This would generate actual Rust code based on node type
        }
        
        code.push_str("  Ok(())\n}\n");
        Ok(code)
    }
}

// Collaborative Editor
pub struct CollaborativeEditor {
    sessions: HashMap<String, CollaborativeSession>,
}

#[derive(Clone)]
pub struct CollaborativeSession {
    pub id: String,
    pub participants: Vec<String>,
    pub operations: Vec<CollaborativeOperation>,
    pub created_at: f64,
}

#[derive(Clone)]
pub struct CollaborativeOperation {
    pub user_id: String,
    pub operation_type: String,
    pub data: String,
    pub timestamp: f64,
}

impl CollaborativeEditor {
    pub fn new() -> CollaborativeEditor {
        CollaborativeEditor {
            sessions: HashMap::new(),
        }
    }
    
    pub fn start_session(&mut self) -> Result<String, String> {
        let session_id = format!("session_{}", self.sessions.len());
        let session = CollaborativeSession {
            id: session_id.clone(),
            participants: Vec::new(),
            operations: Vec::new(),
            created_at: web_sys::window()
                .unwrap()
                .performance()
                .unwrap()
                .now(),
        };
        
        self.sessions.insert(session_id.clone(), session);
        console_log(&format!("🤝 Started collaborative session: {}", session_id));
        Ok(session_id)
    }
    
    pub fn join_session(&mut self, session_id: &str) -> Result<(), String> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            // Add participant logic would go here
            console_log(&format!("🤝 Joined collaborative session: {}", session_id));
            Ok(())
        } else {
            Err("Session not found".to_string())
        }
    }
}

// Exported functions for TypeScript
#[wasm_bindgen]
pub struct VisualScriptEngineExport {
    inner: VisualScriptEngine,
}

#[wasm_bindgen]
impl VisualScriptEngineExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> VisualScriptEngineExport {
        let config = serde_wasm_bindgen::from_value::<VisualScriptConfig>(config).unwrap();
        console_log("🎨 Visual Script Engine initialized");
        VisualScriptEngineExport {
            inner: VisualScriptEngine::new(config),
        }
    }

    #[wasm_bindgen]
    pub fn update_config(&mut self, config: JsValue) {
        if let Ok(visual_config) = serde_wasm_bindgen::from_value::<VisualScriptConfig>(config) {
            self.inner.update_config(visual_config);
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
    pub fn get_script_summary(&mut self) -> String {
        self.inner.get_script_summary()
    }

    #[wasm_bindgen]
    pub fn create_script(&mut self, id: String, name: String, description: String) -> JsValue {
        match self.inner.create_script(id, name, description) {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn get_scripts(&self) -> JsValue {
        let scripts = self.inner.get_scripts();
        serde_wasm_bindgen::to_value(&scripts).unwrap()
    }

    #[wasm_bindgen]
    pub fn execute_script(&mut self, script_id: String) -> JsValue {
        match self.inner.execute_script(&script_id) {
            Ok(result) => serde_wasm_bindgen::to_value(&result).unwrap(),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn set_breakpoint(&mut self, script_id: String, node_id: String) -> JsValue {
        match self.inner.set_breakpoint(&script_id, &node_id) {
            Ok(()) => JsValue::from_str("success"),
            Err(e) => JsValue::from_str(&e),
        }
    }

    #[wasm_bindgen]
    pub fn get_debug_info(&self) -> JsValue {
        let debug_info = self.inner.get_debug_info();
        serde_wasm_bindgen::to_value(&debug_info).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_performance_profiles(&self) -> JsValue {
        let profiles = self.inner.get_performance_profiles();
        serde_wasm_bindgen::to_value(&profiles).unwrap()
    }

    #[wasm_bindgen]
    pub fn generate_code(&self, script_id: String, language: String) -> JsValue {
        match self.inner.generate_code(&script_id, &language) {
            Ok(code) => JsValue::from_str(&code),
            Err(e) => JsValue::from_str(&e),
        }
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_visual_script_config(
    enable_debugging: bool,
    enable_profiling: bool,
    enable_breakpoints: bool,
    max_execution_time: f64,
    max_nodes: u32,
    enable_optimization: bool,
    enable_code_generation: bool,
    enable_collaborative_editing: bool,
    auto_save: bool,
    save_interval: u32
) -> JsValue {
    let config = VisualScriptConfig {
        enable_debugging,
        enable_profiling,
        enable_breakpoints,
        max_execution_time,
        max_nodes,
        enable_optimization,
        enable_code_generation,
        enable_collaborative_editing,
        auto_save,
        save_interval,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

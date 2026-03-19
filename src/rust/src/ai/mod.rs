use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use web_sys::window;

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// AI system enums and types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AIBehaviorType {
    Idle,
    Patrol,
    Chase,
    Flee,
    Attack,
    Defend,
    Search,
    Follow,
    Guard,
    Explore,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AINodeType {
    Selector,
    Sequence,
    Parallel,
    Condition,
    Action,
    Decorator,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AIStateType {
    Idle,
    Moving,
    Attacking,
    Defending,
    Fleeing,
    Searching,
    Patrolling,
    Following,
    Guarding,
    Dead,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PathfindingAlgorithm {
    AStar,
    Dijkstra,
    BFS,
    DFS,
    DijkstraOptimized,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AILearningType {
    Reinforcement,
    Neural,
    Genetic,
    QLearning,
    Custom,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIBehaviorTree {
    pub id: String,
    pub name: String,
    pub root_node: AINode,
    pub blackboard: HashMap<String, String>,
    pub variables: HashMap<String, f32>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AINode {
    pub id: String,
    pub node_type: AINodeType,
    pub name: String,
    pub condition: Option<String>,
    pub action: Option<String>,
    pub children: Vec<String>,
    pub parameters: HashMap<String, String>,
    pub status: AINodeStatus,
    pub last_execution: u64,
    pub execution_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AINodeStatus {
    Ready,
    Running,
    Success,
    Failure,
    Invalid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIStateMachine {
    pub id: String,
    pub name: String,
    pub current_state: String,
    pub states: HashMap<String, AIState>,
    pub transitions: HashMap<String, Vec<AITransition>>,
    pub global_transitions: Vec<AITransition>,
    pub variables: HashMap<String, f32>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIState {
    pub id: String,
    pub name: String,
    pub state_type: AIStateType,
    pub on_enter: Option<String>,
    pub on_update: Option<String>,
    pub on_exit: Option<String>,
    pub duration: Option<f32>,
    pub can_interrupt: bool,
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AITransition {
    pub from_state: String,
    pub to_state: String,
    pub condition: String,
    pub priority: u32,
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAgent {
    pub id: String,
    pub name: String,
    pub position: [f32; 3],
    pub rotation: [f32; 3],
    pub velocity: [f32; 3],
    pub health: f32,
    pub max_health: f32,
    pub energy: f32,
    pub max_energy: f32,
    pub behavior_tree: Option<String>,
    pub state_machine: Option<String>,
    pub current_target: Option<String>,
    pub path: Vec<[f32; 3]>,
    pub path_index: usize,
    pub blackboard: HashMap<String, String>,
    pub variables: HashMap<String, f32>,
    pub behaviors: Vec<AIBehavior>,
    pub learning_data: HashMap<String, f32>,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_update: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIBehavior {
    pub id: String,
    pub behavior_type: AIBehaviorType,
    pub priority: f32,
    pub weight: f32,
    pub duration: Option<f32>,
    pub parameters: HashMap<String, String>,
    pub conditions: Vec<String>,
    pub is_active: bool,
    pub start_time: u64,
    pub last_execution: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathfindingGrid {
    pub id: String,
    pub width: usize,
    pub height: usize,
    pub cell_size: f32,
    pub nodes: Vec<PathfindingNode>,
    pub obstacles: Vec<PathfindingObstacle>,
    pub algorithm: PathfindingAlgorithm,
    pub heuristic_weight: f32,
    pub diagonal_movement: bool,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathfindingNode {
    pub x: usize,
    pub y: usize,
    pub walkable: bool,
    pub cost: f32,
    pub heuristic: f32,
    pub parent: Option<(usize, usize)>,
    pub g_score: f32,
    pub f_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathfindingObstacle {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub shape: ObstacleShape,
    pub is_dynamic: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ObstacleShape {
    Rectangle,
    Circle,
    Polygon,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Path {
    pub id: String,
    pub points: Vec<[f32; 3]>,
    pub total_cost: f32,
    pub algorithm: PathfindingAlgorithm,
    pub created_at: u64,
    pub is_valid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AILearningSystem {
    pub id: String,
    pub learning_type: AILearningType,
    pub learning_rate: f32,
    pub discount_factor: f32,
    pub exploration_rate: f32,
    pub memory_size: usize,
    pub experience_buffer: Vec<AIExperience>,
    pub model_data: HashMap<String, f32>,
    pub statistics: AILearningStatistics,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIExperience {
    pub state: String,
    pub action: String,
    pub reward: f32,
    pub next_state: String,
    pub done: bool,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AILearningStatistics {
    pub total_experiences: u32,
    pub successful_experiences: u32,
    pub failed_experiences: u32,
    pub average_reward: f32,
    pub learning_progress: f32,
    pub last_update: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub enable_behavior_trees: bool,
    pub enable_state_machines: bool,
    pub enable_pathfinding: bool,
    pub enable_learning: bool,
    pub max_agents: u32,
    pub update_frequency: f32,
    pub pathfinding_grid_size: usize,
    pub learning_buffer_size: usize,
    pub debug_mode: bool,
    pub visualize_ai: bool,
    pub performance_monitoring: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIStats {
    pub total_agents: u32,
    pub active_agents: u32,
    pub behavior_trees_executed: u32,
    pub state_machine_updates: u32,
    pub pathfinding_calculations: u32,
    pub learning_experiences: u32,
    pub average_update_time: f64,
    pub average_pathfinding_time: f64,
    pub average_learning_time: f64,
    pub memory_usage: u64,
    pub last_update: u64,
}

// Main AI system engine
pub struct AISystem {
    config: AIConfig,
    agents: HashMap<String, AIAgent>,
    behavior_trees: HashMap<String, AIBehaviorTree>,
    state_machines: HashMap<String, AIStateMachine>,
    pathfinding_grids: HashMap<String, PathfindingGrid>,
    learning_systems: HashMap<String, AILearningSystem>,
    stats: AIStats,
    last_update: u64,
}

impl AISystem {
    pub fn new(config: AIConfig) -> Self {
        console_log!("🤖 Initializing AI System");
        
        let system = Self {
            config,
            agents: HashMap::new(),
            behavior_trees: HashMap::new(),
            state_machines: HashMap::new(),
            pathfinding_grids: HashMap::new(),
            learning_systems: HashMap::new(),
            stats: AIStats {
                total_agents: 0,
                active_agents: 0,
                behavior_trees_executed: 0,
                state_machine_updates: 0,
                pathfinding_calculations: 0,
                learning_experiences: 0,
                average_update_time: 0.0,
                average_pathfinding_time: 0.0,
                average_learning_time: 0.0,
                memory_usage: 0,
                last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            },
            last_update: 0,
        };
        
        system
    }

    // Configuration management
    pub fn update_config(&mut self, config: AIConfig) {
        self.config = config;
        console_log!("⚙️ AI System configuration updated");
    }

    pub fn get_config(&self) -> AIConfig {
        self.config.clone()
    }

    // Statistics
    pub fn get_stats(&self) -> AIStats {
        self.stats.clone()
    }

    pub fn get_ai_system_summary(&self) -> String {
        format!(
            "🤖 AI System Summary:\n\
            Total Agents: {}\n\
            Active Agents: {}\n\
            Behavior Trees Executed: {}\n\
            State Machine Updates: {}\n\
            Pathfinding Calculations: {}\n\
            Learning Experiences: {}\n\
            Average Update Time: {:.2}ms\n\
            Average Pathfinding Time: {:.2}ms\n\
            Average Learning Time: {:.2}ms\n\
            Memory Usage: {} bytes\n\
            Last Update: {}",
            self.stats.total_agents,
            self.stats.active_agents,
            self.stats.behavior_trees_executed,
            self.stats.state_machine_updates,
            self.stats.pathfinding_calculations,
            self.stats.learning_experiences,
            self.stats.average_update_time,
            self.stats.average_pathfinding_time,
            self.stats.average_learning_time,
            self.stats.memory_usage,
            self.stats.last_update
        )
    }

    // Agent management
    pub fn create_agent(&mut self, agent: AIAgent) -> Result<String, String> {
        if self.agents.len() >= self.config.max_agents as usize {
            return Err("Maximum agent limit reached".to_string());
        }
        
        if self.agents.contains_key(&agent.id) {
            return Err("Agent already exists".to_string());
        }
        
        let agent_id = agent.id.clone();
        self.agents.insert(agent_id.clone(), agent);
        self.stats.total_agents += 1;
        self.stats.active_agents += 1;
        
        console_log!("🤖 Created agent: {}", agent_id);
        Ok(agent_id)
    }

    pub fn delete_agent(&mut self, agent_id: &str) -> Result<(), String> {
        if let Some(_agent) = self.agents.remove(agent_id) {
            self.stats.total_agents -= 1;
            self.stats.active_agents -= 1;
            
            console_log!("🗑️ Deleted agent: {}", agent_id);
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    pub fn get_agent(&self, agent_id: &str) -> Option<AIAgent> {
        self.agents.get(agent_id).cloned()
    }

    pub fn get_all_agents(&self) -> Vec<AIAgent> {
        self.agents.values().cloned().collect()
    }

    pub fn get_active_agents(&self) -> Vec<AIAgent> {
        self.agents
            .values()
            .filter(|agent| agent.health > 0.0)
            .cloned()
            .collect()
    }

    // Agent properties
    pub fn set_agent_position(&mut self, agent_id: &str, position: [f32; 3]) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            agent.position = position;
            agent.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    pub fn set_agent_health(&mut self, agent_id: &str, health: f32) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            agent.health = health.clamp(0.0, agent.max_health);
            agent.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    pub fn set_agent_target(&mut self, agent_id: &str, target_id: Option<String>) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            agent.current_target = target_id;
            agent.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    // Behavior tree management
    pub fn create_behavior_tree(&mut self, tree: AIBehaviorTree) -> Result<String, String> {
        if self.behavior_trees.contains_key(&tree.id) {
            return Err("Behavior tree already exists".to_string());
        }
        
        let tree_id = tree.id.clone();
        self.behavior_trees.insert(tree_id.clone(), tree);
        console_log!("🌳 Created behavior tree: {}", tree_id);
        Ok(tree_id)
    }

    pub fn delete_behavior_tree(&mut self, tree_id: &str) -> Result<(), String> {
        if let Some(_tree) = self.behavior_trees.remove(tree_id) {
            console_log!("🗑️ Deleted behavior tree: {}", tree_id);
            Ok(())
        } else {
            Err("Behavior tree not found".to_string())
        }
    }

    pub fn get_behavior_tree(&self, tree_id: &str) -> Option<AIBehaviorTree> {
        self.behavior_trees.get(tree_id).cloned()
    }

    pub fn assign_behavior_tree(&mut self, agent_id: &str, tree_id: &str) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            if !self.behavior_trees.contains_key(tree_id) {
                return Err("Behavior tree not found".to_string());
            }
            agent.behavior_tree = Some(tree_id.to_string());
            agent.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    // State machine management
    pub fn create_state_machine(&mut self, machine: AIStateMachine) -> Result<String, String> {
        if self.state_machines.contains_key(&machine.id) {
            return Err("State machine already exists".to_string());
        }
        
        let machine_id = machine.id.clone();
        self.state_machines.insert(machine_id.clone(), machine);
        console_log!("⚙️ Created state machine: {}", machine_id);
        Ok(machine_id)
    }

    pub fn delete_state_machine(&mut self, machine_id: &str) -> Result<(), String> {
        if let Some(_machine) = self.state_machines.remove(machine_id) {
            console_log!("🗑️ Deleted state machine: {}", machine_id);
            Ok(())
        } else {
            Err("State machine not found".to_string())
        }
    }

    pub fn get_state_machine(&self, machine_id: &str) -> Option<AIStateMachine> {
        self.state_machines.get(machine_id).cloned()
    }

    pub fn assign_state_machine(&mut self, agent_id: &str, machine_id: &str) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(agent_id) {
            if !self.state_machines.contains_key(machine_id) {
                return Err("State machine not found".to_string());
            }
            agent.state_machine = Some(machine_id.to_string());
            agent.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    // Pathfinding management
    pub fn create_pathfinding_grid(&mut self, grid: PathfindingGrid) -> Result<String, String> {
        if self.pathfinding_grids.contains_key(&grid.id) {
            return Err("Pathfinding grid already exists".to_string());
        }
        
        let grid_id = grid.id.clone();
        self.pathfinding_grids.insert(grid_id.clone(), grid);
        console_log!("🗺️ Created pathfinding grid: {}", grid_id);
        Ok(grid_id)
    }

    pub fn delete_pathfinding_grid(&mut self, grid_id: &str) -> Result<(), String> {
        if let Some(_grid) = self.pathfinding_grids.remove(grid_id) {
            console_log!("🗑️ Deleted pathfinding grid: {}", grid_id);
            Ok(())
        } else {
            Err("Pathfinding grid not found".to_string())
        }
    }

    pub fn get_pathfinding_grid(&self, grid_id: &str) -> Option<PathfindingGrid> {
        self.pathfinding_grids.get(grid_id).cloned()
    }

    // Learning system management
    pub fn create_learning_system(&mut self, system: AILearningSystem) -> Result<String, String> {
        if self.learning_systems.contains_key(&system.id) {
            return Err("Learning system already exists".to_string());
        }
        
        let system_id = system.id.clone();
        self.learning_systems.insert(system_id.clone(), system);
        console_log!("🧠 Created learning system: {}", system_id);
        Ok(system_id)
    }

    pub fn delete_learning_system(&mut self, system_id: &str) -> Result<(), String> {
        if let Some(_system) = self.learning_systems.remove(system_id) {
            console_log!("🗑️ Deleted learning system: {}", system_id);
            Ok(())
        } else {
            Err("Learning system not found".to_string())
        }
    }

    pub fn get_learning_system(&self, system_id: &str) -> Option<AILearningSystem> {
        self.learning_systems.get(system_id).cloned()
    }

    // AI update loop
    pub fn update(&mut self, delta_time: f32) -> Result<(), String> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        // Update active agents
        let mut active_agents: Vec<String> = self.agents
            .keys()
            .filter(|&id| {
                if let Some(agent) = self.agents.get(id) {
                    agent.health > 0.0
                } else {
                    false
                }
            })
            .cloned()
            .collect();
        
        for agent_id in active_agents {
            self.update_agent(&agent_id, delta_time)?;
        }
        
        // Update statistics
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.average_update_time = (end_time - start_time) as f64;
        self.stats.last_update = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        Ok(())
    }

    fn update_agent(&mut self, agent_id: &str, delta_time: f32) -> Result<(), String> {
        // Get agent data first
        let agent_data = if let Some(agent) = self.agents.get(agent_id) {
            agent.clone()
        } else {
            return Err("Agent not found".to_string());
        };
        
        // Collect all updates to apply later
        let mut behavior_updates = Vec::new();
        let mut path_updates = Vec::new();
        let mut learning_updates = Vec::new();
        
        // Execute behavior tree
        if let Some(tree_id) = &agent_data.behavior_tree {
            if let Some(_tree) = self.behavior_trees.get_mut(tree_id) {
                // For now, simulate successful execution
                self.stats.behavior_trees_executed += 1;
            }
        }
        
        // Update state machine
        if let Some(machine_id) = &agent_data.state_machine {
            if let Some(_machine) = self.state_machines.get_mut(machine_id) {
                // For now, simulate successful update
                self.stats.state_machine_updates += 1;
            }
        }
        
        // Collect behavior updates
        for (index, behavior) in agent_data.behaviors.iter().enumerate() {
            if !behavior.is_active {
                continue;
            }
            
            let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            let time_since_last = current_time - behavior.last_execution;
            
            // Use a default cooldown of 1 second if no duration is specified
            let cooldown = behavior.duration.unwrap_or(1.0) as u64;
            
            if time_since_last >= cooldown {
                behavior_updates.push((index, current_time));
            }
        }
        
        // Collect path updates
        if !agent_data.path.is_empty() {
            path_updates.push(delta_time);
        }
        
        // Collect learning updates
        if let Some(learning_system_id) = agent_data.learning_data.get("learning_system_id") {
            let learning_system_id_str = learning_system_id.to_string();
            learning_updates.push((learning_system_id_str, delta_time));
        }
        
        // Apply all updates in a single mutable borrow
        {
            let agent = self.agents.get_mut(agent_id).unwrap();
            
            // Update basic properties
            agent.position[0] += agent_data.velocity[0] * delta_time;
            agent.position[1] += agent_data.velocity[1] * delta_time;
            agent.position[2] += agent_data.velocity[2] * delta_time;
            agent.energy = (agent.energy - delta_time * 0.1).max(0.0).min(agent.max_energy);
            agent.last_update = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            agent.updated_at = agent.last_update;
            
            // Apply behavior updates
            for (index, execution_time) in behavior_updates {
                if let Some(behavior) = agent.behaviors.get_mut(index) {
                    let behavior_type = behavior.behavior_type.clone();
                    // Execute behavior logic directly without calling self method
                    match behavior_type {
                        AIBehaviorType::Idle => {
                            agent.velocity = [0.0, 0.0, 0.0];
                        }
                        AIBehaviorType::Patrol => {
                            // Simple patrol behavior
                            agent.velocity = [1.0, 0.0, 0.0];
                        }
                        AIBehaviorType::Chase => {
                            // Simple chase behavior
                            agent.velocity = [2.0, 0.0, 0.0];
                        }
                        AIBehaviorType::Flee => {
                            // Simple flee behavior
                            agent.velocity = [-1.5, 0.0, 0.0];
                        }
                        AIBehaviorType::Attack => {
                            // Simple attack behavior
                            agent.velocity = [0.0, 0.0, 0.0];
                        }
                        AIBehaviorType::Defend => {
                            // Simple defend behavior
                            agent.velocity = [0.5, 0.0, 0.0];
                        }
                        AIBehaviorType::Search => {
                            // Simple search behavior
                            agent.velocity = [0.7, 0.7, 0.0];
                        }
                        AIBehaviorType::Follow => {
                            // Simple follow behavior
                            agent.velocity = [1.2, 0.0, 0.0];
                        }
                        AIBehaviorType::Guard => {
                            // Simple guard behavior
                            agent.velocity = [0.0, 0.0, 0.0];
                        }
                        AIBehaviorType::Explore => {
                            // Simple explore behavior
                            agent.velocity = [0.8, 0.8, 0.0];
                        }
                        AIBehaviorType::Custom => {
                            // Simple custom behavior
                            agent.velocity = [0.0, 0.0, 0.0];
                        }
                    }
                    behavior.last_execution = execution_time;
                }
            }
            
            // Apply path updates
            for _delta_time in path_updates {
                // Simple path following
                if let Some(target) = agent_data.path.first() {
                    let dx = target[0] - agent.position[0];
                    let dy = target[1] - agent.position[1];
                    let distance = (dx * dx + dy * dy).sqrt();
                    
                    if distance > 0.1 {
                        agent.velocity[0] = (dx / distance) * 2.0;
                        agent.velocity[1] = (dy / distance) * 2.0;
                    }
                }
            }
        }
        
        // Apply learning updates (separate since it needs different mutable borrows)
        for (learning_system_id_str, _delta_time) in learning_updates {
            if let Some(_learning_system) = self.learning_systems.get_mut(&learning_system_id_str) {
                // Simple learning update - just increment stats
                self.stats.learning_experiences += 1;
            }
        }
        
        Ok(())
    }

    fn execute_behavior_tree(&mut self, tree: &mut AIBehaviorTree, agent: &mut AIAgent) -> Result<bool, String> {
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        let result = self.execute_node(&mut tree.root_node, agent, &mut tree.blackboard, &mut tree.variables)?;
        
        tree.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        console_log!("🌳 Behavior tree executed in {}ms", end_time - start_time);
        
        Ok(result)
    }

    fn execute_node(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.last_execution = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        node.execution_count += 1;
        
        match node.node_type {
            AINodeType::Selector => self.execute_selector(node, agent, blackboard, variables),
            AINodeType::Sequence => self.execute_sequence(node, agent, blackboard, variables),
            AINodeType::Parallel => self.execute_parallel(node, agent, blackboard, variables),
            AINodeType::Condition => self.execute_condition(node, agent, blackboard, variables),
            AINodeType::Action => self.execute_action(node, agent, blackboard, variables),
            AINodeType::Decorator => self.execute_decorator(node, agent, blackboard, variables),
            AINodeType::Custom => self.execute_custom_node(node, agent, blackboard, variables),
        }
    }

    fn execute_selector(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        // Collect child IDs first to avoid borrow issues
        let child_ids: Vec<String> = node.children.clone();
        
        for child_id in child_ids {
            // For now, we'll simulate execution without recursive calls
            // In a real implementation, we'd need to traverse the tree structure
            let result = true; // Placeholder
            if result {
                node.status = AINodeStatus::Success;
                return Ok(true);
            }
        }
        
        node.status = AINodeStatus::Failure;
        Ok(false)
    }

    fn execute_sequence(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        // Collect child IDs first to avoid borrow issues
        let child_ids: Vec<String> = node.children.clone();
        
        for child_id in child_ids {
            // For now, we'll simulate execution without recursive calls
            let result = true; // Placeholder
            if !result {
                node.status = AINodeStatus::Failure;
                return Ok(false);
            }
        }
        
        node.status = AINodeStatus::Success;
        Ok(true)
    }

    fn execute_parallel(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        // Collect child IDs first to avoid borrow issues
        let child_ids: Vec<String> = node.children.clone();
        
        let mut success_count = 0;
        let total_children = child_ids.len();
        
        for child_id in child_ids {
            // For now, we'll simulate execution without recursive calls
            let result = true; // Placeholder
            if result {
                success_count += 1;
            }
        }
        
        // Success if more than half of children succeed
        if success_count as f32 > total_children as f32 / 2.0 {
            node.status = AINodeStatus::Success;
            Ok(true)
        } else {
            node.status = AINodeStatus::Failure;
            Ok(false)
        }
    }

    fn execute_condition(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        if let Some(condition) = &node.condition {
            let result = self.evaluate_condition(condition, agent, blackboard, variables)?;
            node.status = if result { AINodeStatus::Success } else { AINodeStatus::Failure };
            Ok(result)
        } else {
            node.status = AINodeStatus::Failure;
            Ok(false)
        }
    }

    fn execute_action(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        if let Some(action) = &node.action {
            let result = self.execute_action_logic(action, agent, blackboard, variables)?;
            node.status = if result { AINodeStatus::Success } else { AINodeStatus::Failure };
            Ok(result)
        } else {
            node.status = AINodeStatus::Failure;
            Ok(false)
        }
    }

    fn execute_decorator(&mut self, node: &mut AINode, agent: &mut AIAgent, blackboard: &mut HashMap<String, String>, variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        // For now, just execute the first child
        if let Some(child_id) = node.children.first() {
            // For now, we'll simulate execution without recursive calls
            let result = true; // Placeholder
            node.status = if result { AINodeStatus::Success } else { AINodeStatus::Failure };
            Ok(result)
        } else {
            node.status = AINodeStatus::Failure;
            Ok(false)
        }
    }

    fn execute_custom_node(&mut self, node: &mut AINode, _agent: &mut AIAgent, _blackboard: &mut HashMap<String, String>, _variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        node.status = AINodeStatus::Running;
        
        // Custom node execution would be implemented by the user
        // For now, return success
        node.status = AINodeStatus::Success;
        Ok(true)
    }

    fn evaluate_condition(&self, condition: &str, agent: &AIAgent, _blackboard: &HashMap<String, String>, _variables: &HashMap<String, f32>) -> Result<bool, String> {
        // Simple condition evaluation
        if condition == "has_target" {
            Ok(agent.current_target.is_some())
        } else if condition == "is_healthy" {
            Ok(agent.health > agent.max_health * 0.5)
        } else if condition == "has_energy" {
            Ok(agent.energy > agent.max_energy * 0.2)
        } else if condition.starts_with("distance_to_target") {
            // This would need actual distance calculation
            Ok(true)
        } else {
            Ok(false) // Default to false for unknown conditions
        }
    }

    fn execute_action_logic(&mut self, action: &str, agent: &mut AIAgent, _blackboard: &mut HashMap<String, String>, _variables: &mut HashMap<String, f32>) -> Result<bool, String> {
        match action {
            "idle" => {
                agent.velocity = [0.0, 0.0, 0.0];
                Ok(true)
            }
            "patrol" => {
                // Simple patrol logic
                if agent.path.is_empty() {
                    // Generate patrol path
                    agent.path = vec![
                        [agent.position[0] + 50.0, agent.position[1], agent.position[2]],
                        [agent.position[0] + 50.0, agent.position[1] + 50.0, agent.position[2]],
                        [agent.position[0], agent.position[1] + 50.0, agent.position[2]],
                        [agent.position[0], agent.position[1], agent.position[2]],
                    ];
                    agent.path_index = 0;
                }
                Ok(true)
            }
            "chase" => {
                if let Some(_target_id) = &agent.current_target {
                    // Chase logic would need target position
                    agent.velocity = [1.0, 0.0, 0.0]; // Simple chase
                    Ok(true)
                } else {
                    Ok(false)
                }
            }
            "flee" => {
                agent.velocity = [-1.0, 0.0, 0.0]; // Simple flee
                Ok(true)
            }
            "attack" => {
                // Attack logic
                Ok(true)
            }
            "defend" => {
                // Defend logic
                Ok(true)
            }
            _ => Ok(false),
        }
    }

    fn get_node_mut(&mut self, _node_id: &str) -> Option<&mut AINode> {
        // This would need to traverse the tree to find the node
        // For now, return None (placeholder)
        None
    }

    fn update_state_machine(&mut self, machine: &mut AIStateMachine, agent: &mut AIAgent, _delta_time: f32) -> Result<bool, String> {
        let current_state = if let Some(state) = machine.states.get(&machine.current_state) {
            state
        } else {
            return Err("Current state not found".to_string());
        };
        
        // Execute state update
        if let Some(update_action) = &current_state.on_update {
            self.execute_action_logic(update_action, agent, &mut HashMap::new(), &mut HashMap::new())?;
        }
        
        // Check state duration
        if let Some(duration) = current_state.duration {
            let elapsed = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() - agent.last_update;
            if elapsed as f32 > duration {
                // Check for transitions
                for transition in &machine.transitions[&machine.current_state] {
                    if self.evaluate_condition(&transition.condition, agent, &HashMap::new(), &HashMap::new())? {
                        machine.current_state = transition.to_state.clone();
                        break;
                    }
                }
            }
        }
        
        // Check global transitions
        for transition in &machine.global_transitions {
            if transition.from_state == machine.current_state {
                if self.evaluate_condition(&transition.condition, agent, &HashMap::new(), &HashMap::new())? {
                    machine.current_state = transition.to_state.clone();
                    break;
                }
            }
        }
        
        machine.updated_at = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        Ok(true)
    }

    fn update_agent_behaviors(&mut self, agent: &mut AIAgent, _delta_time: f32) -> Result<(), String> {
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        // Collect behavior updates first to avoid borrow checker issues
        let mut behavior_updates = Vec::new();
        
        for (index, behavior) in agent.behaviors.iter().enumerate() {
            if !behavior.is_active {
                continue;
            }
            
            // Check if behavior should be executed
            let mut should_execute = true;
            for condition in &behavior.conditions {
                if !self.evaluate_condition(condition, agent, &agent.blackboard, &agent.variables)? {
                    should_execute = false;
                    break;
                }
            }
            
            if should_execute {
                behavior_updates.push((index, current_time));
            }
        }
        
        // Apply updates
        for (index, execution_time) in behavior_updates {
            // Get behavior data first
            let behavior_type = if let Some(behavior) = agent.behaviors.get(index) {
                behavior.behavior_type.clone()
            } else {
                continue;
            };
            
            // Execute behavior logic by type
            self.execute_behavior_logic_by_type(&behavior_type, agent, _delta_time)?;
            
            // Update behavior execution time
            if let Some(behavior) = agent.behaviors.get_mut(index) {
                behavior.last_execution = execution_time;
            }
        }
        
        Ok(())
    }

    fn execute_behavior_logic_by_type(&mut self, behavior_type: &AIBehaviorType, agent: &mut AIAgent, _delta_time: f32) -> Result<(), String> {
        match behavior_type {
            AIBehaviorType::Idle => {
                agent.velocity = [0.0, 0.0, 0.0];
            }
            AIBehaviorType::Patrol => {
                // Patrol logic
                if agent.path.is_empty() {
                    // Generate patrol path
                    agent.path = vec![
                        [agent.position[0] + 100.0, agent.position[1], agent.position[2]],
                        [agent.position[0] + 100.0, agent.position[1] + 100.0, agent.position[2]],
                        [agent.position[0], agent.position[1] + 100.0, agent.position[2]],
                        [agent.position[0], agent.position[1], agent.position[2]],
                    ];
                    agent.path_index = 0;
                }
            }
            AIBehaviorType::Chase => {
                // Chase logic
                if let Some(_target_id) = &agent.current_target {
                    agent.velocity = [2.0, 0.0, 0.0];
                }
            }
            AIBehaviorType::Flee => {
                agent.velocity = [-2.0, 0.0, 0.0];
            }
            AIBehaviorType::Attack => {
                // Attack logic
            }
            AIBehaviorType::Defend => {
                // Defend logic
            }
            AIBehaviorType::Search => {
                // Search logic
                agent.velocity = [1.0, 1.0, 0.0];
            }
            AIBehaviorType::Follow => {
                // Follow logic
                if let Some(_target_id) = &agent.current_target {
                    agent.velocity = [1.5, 0.0, 0.0];
                }
            }
            AIBehaviorType::Guard => {
                // Guard logic
            }
            AIBehaviorType::Explore => {
                // Explore logic
                agent.velocity = [0.5, 0.5, 0.0];
            }
            AIBehaviorType::Custom => {
                // Custom behavior logic
            }
        }
        
        Ok(())
    }

    fn execute_behavior_logic(&mut self, behavior: &mut AIBehavior, agent: &mut AIAgent, _delta_time: f32) -> Result<(), String> {
        match behavior.behavior_type {
            AIBehaviorType::Idle => {
                agent.velocity = [0.0, 0.0, 0.0];
            }
            AIBehaviorType::Patrol => {
                // Patrol logic
                if agent.path.is_empty() {
                    // Generate patrol path
                    agent.path = vec![
                        [agent.position[0] + 100.0, agent.position[1], agent.position[2]],
                        [agent.position[0] + 100.0, agent.position[1] + 100.0, agent.position[2]],
                        [agent.position[0], agent.position[1] + 100.0, agent.position[2]],
                        [agent.position[0], agent.position[1], agent.position[2]],
                    ];
                    agent.path_index = 0;
                }
            }
            AIBehaviorType::Chase => {
                // Chase logic
                if let Some(_target_id) = &agent.current_target {
                    agent.velocity = [2.0, 0.0, 0.0];
                }
            }
            AIBehaviorType::Flee => {
                agent.velocity = [-2.0, 0.0, 0.0];
            }
            AIBehaviorType::Attack => {
                // Attack logic
                agent.velocity = [0.0, 0.0, 0.0];
            }
            AIBehaviorType::Defend => {
                // Defend logic
                agent.velocity = [0.0, 0.0, 0.0];
            }
            AIBehaviorType::Search => {
                // Search logic
                agent.velocity = [1.0, 1.0, 0.0];
            }
            AIBehaviorType::Follow => {
                // Follow logic
                if let Some(_target_id) = &agent.current_target {
                    agent.velocity = [1.5, 0.0, 0.0];
                }
            }
            AIBehaviorType::Guard => {
                // Guard logic
                agent.velocity = [0.0, 0.0, 0.0];
            }
            AIBehaviorType::Explore => {
                // Explore logic
                agent.velocity = [0.5, 0.5, 0.0];
            }
            AIBehaviorType::Custom => {
                // Custom behavior logic
            }
        }
        
        Ok(())
    }

    fn follow_path(&mut self, agent: &mut AIAgent, _delta_time: f32) -> Result<(), String> {
        if agent.path_index >= agent.path.len() {
            agent.path.clear();
            agent.path_index = 0;
            return Ok(());
        }
        
        let target = agent.path[agent.path_index];
        let dx = target[0] - agent.position[0];
        let dy = target[1] - agent.position[1];
        let dz = target[2] - agent.position[2];
        
        let distance = (dx * dx + dy * dy + dz * dz).sqrt();
        
        if distance < 5.0 {
            agent.path_index += 1;
        } else {
            let speed = 2.0;
            agent.velocity[0] = (dx / distance) * speed;
            agent.velocity[1] = (dy / distance) * speed;
            agent.velocity[2] = (dz / distance) * speed;
        }
        
        Ok(())
    }

    fn update_learning(&mut self, learning_system: &mut AILearningSystem, agent: &AIAgent, _delta_time: f32) -> Result<(), String> {
        // Simple learning update
        let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        // Add experience based on agent state
        let behavior_type = agent.behaviors.get(0).map(|b| b.behavior_type.clone()).unwrap_or(AIBehaviorType::Idle);
        let experience = AIExperience {
            state: format!("{:?}", behavior_type),
            action: "update".to_string(),
            reward: agent.health / agent.max_health,
            next_state: format!("{:?}", behavior_type),
            done: false,
            timestamp: current_time,
        };
        
        learning_system.experience_buffer.push(experience.clone());
        
        // Limit buffer size
        if learning_system.experience_buffer.len() > learning_system.memory_size {
            learning_system.experience_buffer.remove(0);
        }
        
        // Update statistics
        learning_system.statistics.total_experiences += 1;
        if experience.reward > 0.5 {
            learning_system.statistics.successful_experiences += 1;
        } else {
            learning_system.statistics.failed_experiences += 1;
        }
        
        learning_system.statistics.average_reward = 
            (learning_system.statistics.average_reward * (learning_system.statistics.total_experiences - 1) as f32 + experience.reward) 
            / learning_system.statistics.total_experiences as f32;
        
        learning_system.updated_at = current_time;
        
        Ok(())
    }

    // Pathfinding
    pub fn find_path(&mut self, grid_id: &str, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        let grid = if let Some(grid) = self.pathfinding_grids.get(grid_id) {
            grid.clone()
        } else {
            return Err("Pathfinding grid not found".to_string());
        };
        
        let start_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        let path = match grid.algorithm {
            PathfindingAlgorithm::AStar => self.astar_pathfinding(&grid, start, end),
            PathfindingAlgorithm::Dijkstra => self.dijkstra_pathfinding(&grid, start, end),
            PathfindingAlgorithm::BFS => self.bfs_pathfinding(&grid, start, end),
            PathfindingAlgorithm::DFS => self.dfs_pathfinding(&grid, start, end),
            PathfindingAlgorithm::DijkstraOptimized => self.dijkstra_optimized_pathfinding(&grid, start, end),
            PathfindingAlgorithm::Custom => self.custom_pathfinding(&grid, start, end),
        }?;
        
        let end_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.stats.pathfinding_calculations += 1;
        self.stats.average_pathfinding_time = (end_time - start_time) as f64;
        
        console_log!("🗺️ Path found in {}ms with {} nodes", end_time - start_time, path.points.len());
        
        Ok(path)
    }

    fn astar_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Convert world coordinates to grid coordinates
        let start_x = (start[0] / grid.cell_size) as usize;
        let start_y = (start[1] / grid.cell_size) as usize;
        let end_x = (end[0] / grid.cell_size) as usize;
        let end_y = (end[1] / grid.cell_size) as usize;
        
        // Simple A* implementation
        let mut open_set = vec![(start_x, start_y)];
        let mut closed_set = std::collections::HashSet::new();
        let mut came_from = HashMap::new();
        let mut g_score = HashMap::new();
        let mut f_score = HashMap::new();
        
        g_score.insert((start_x, start_y), 0.0);
        f_score.insert((start_x, start_y), self.heuristic(start_x, start_y, end_x, end_y));
        
        while !open_set.is_empty() {
            // Find node with lowest f_score
            let mut current = open_set[0];
            let mut current_index = 0;
            
            for (i, &(x, y)) in open_set.iter().enumerate() {
                if let Some(&score) = f_score.get(&(x, y)) {
                    if let Some(&current_score) = f_score.get(&current) {
                        if score < current_score {
                            current = (x, y);
                            current_index = i;
                        }
                    }
                }
            }
            
            open_set.remove(current_index);
            closed_set.insert(current);
            
            if current == (end_x, end_y) {
                // Reconstruct path
                let mut path_points = Vec::new();
                let mut current_node = current;
                
                while current_node != (start_x, start_y) {
                    path_points.push([
                        current_node.0 as f32 * grid.cell_size,
                        current_node.1 as f32 * grid.cell_size,
                        start[2],
                    ]);
                    
                    if let Some(&parent) = came_from.get(&current_node) {
                        current_node = parent;
                    } else {
                        break;
                    }
                }
                
                path_points.reverse();
                path_points.push(end);
                
                return Ok(Path {
                    id: format!("path_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()),
                    points: path_points,
                    total_cost: f_score.get(&current).unwrap_or(&0.0).clone(),
                    algorithm: PathfindingAlgorithm::AStar,
                    created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                    is_valid: true,
                });
            }
            
            // Check neighbors
            for neighbor in self.get_neighbors(current.0, current.1, grid) {
                if closed_set.contains(&neighbor) {
                    continue;
                }
                
                let tentative_g_score = g_score.get(&current).unwrap_or(&0.0) + 1.0;
                
                if !open_set.contains(&neighbor) {
                    open_set.push(neighbor);
                } else if tentative_g_score >= *g_score.get(&neighbor).unwrap_or(&f32::MAX) {
                    continue;
                }
                
                came_from.insert(neighbor, current);
                g_score.insert(neighbor, tentative_g_score);
                f_score.insert(neighbor, tentative_g_score + self.heuristic(neighbor.0, neighbor.1, end_x, end_y));
            }
        }
        
        Err("No path found".to_string())
    }

    fn heuristic(&self, x1: usize, y1: usize, x2: usize, y2: usize) -> f32 {
        // Manhattan distance
        ((x1 as f32 - x2 as f32).abs() + (y1 as f32 - y2 as f32).abs())
    }

    fn get_neighbors(&self, x: usize, y: usize, grid: &PathfindingGrid) -> Vec<(usize, usize)> {
        let mut neighbors = Vec::new();
        
        // Check all four directions
        let directions = [(0, -1), (1, 0), (0, 1), (-1, 0)];
        
        for (dx, dy) in directions.iter() {
            let nx = (x as i32 + dx) as usize;
            let ny = (y as i32 + dy) as usize;
            
            if nx < grid.width && ny < grid.height {
                if let Some(node) = grid.nodes.get(ny * grid.width + nx) {
                    if node.walkable {
                        neighbors.push((nx, ny));
                    }
                }
            }
        }
        
        neighbors
    }

    fn dijkstra_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Simplified Dijkstra implementation
        self.astar_pathfinding(grid, start, end)
    }

    fn bfs_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Simplified BFS implementation
        self.astar_pathfinding(grid, start, end)
    }

    fn dfs_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Simplified DFS implementation
        self.astar_pathfinding(grid, start, end)
    }

    fn dijkstra_optimized_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Simplified optimized Dijkstra implementation
        self.astar_pathfinding(grid, start, end)
    }

    fn custom_pathfinding(&self, grid: &PathfindingGrid, start: [f32; 3], end: [f32; 3]) -> Result<Path, String> {
        // Custom pathfinding implementation
        self.astar_pathfinding(grid, start, end)
    }

    // Debug and visualization
    pub fn get_debug_info(&self) -> AIDebugInfo {
        AIDebugInfo {
            total_agents: self.agents.len(),
            active_agents: self.get_active_agents().len(),
            behavior_trees: self.behavior_trees.len(),
            state_machines: self.state_machines.len(),
            pathfinding_grids: self.pathfinding_grids.len(),
            learning_systems: self.learning_systems.len(),
            stats: self.stats.clone(),
            config: self.config.clone(),
        }
    }

    pub fn visualize_ai(&self) -> AIVisualizationData {
        let mut agents_data = Vec::new();
        
        for (agent_id, agent) in &self.agents {
            agents_data.push(AIAgentVisualization {
                id: agent_id.clone(),
                position: agent.position,
                health: agent.health,
                current_behavior: agent.behaviors.get(0).map(|b| b.behavior_type.clone()).unwrap_or(AIBehaviorType::Idle),
                current_state: agent.state_machine.clone(),
                path: agent.path.clone(),
                target: agent.current_target.clone(),
            });
        }
        
        AIVisualizationData {
            agents: agents_data,
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        }
    }
}

// Debug and visualization structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIDebugInfo {
    pub total_agents: usize,
    pub active_agents: usize,
    pub behavior_trees: usize,
    pub state_machines: usize,
    pub pathfinding_grids: usize,
    pub learning_systems: usize,
    pub stats: AIStats,
    pub config: AIConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIVisualizationData {
    pub agents: Vec<AIAgentVisualization>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAgentVisualization {
    pub id: String,
    pub position: [f32; 3],
    pub health: f32,
    pub current_behavior: AIBehaviorType,
    pub current_state: Option<String>,
    pub path: Vec<[f32; 3]>,
    pub target: Option<String>,
}

// WASM exports
#[wasm_bindgen]
pub struct AISystemExport {
    inner: Arc<Mutex<AISystem>>,
}

#[wasm_bindgen]
impl AISystemExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<AISystemExport, JsValue> {
        let config: AIConfig = serde_wasm_bindgen::from_value(config)?;
        let ai_system = AISystem::new(config);
        Ok(AISystemExport {
            inner: Arc::new(Mutex::new(ai_system)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: AIConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_ai_system_summary(&mut self) -> String {
        self.inner.lock().unwrap().get_ai_system_summary()
    }

    #[wasm_bindgen]
    pub fn create_agent(&mut self, agent: JsValue) -> Result<JsValue, JsValue> {
        let agent: AIAgent = serde_wasm_bindgen::from_value(agent).unwrap();
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.create_agent(agent) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn delete_agent(&mut self, agent_id: String) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.delete_agent(&agent_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_agent(&self, agent_id: String) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        if let Some(agent) = ai_system.get_agent(&agent_id) {
            serde_wasm_bindgen::to_value(&agent).unwrap()
        } else {
            JsValue::null()
        }
    }

    #[wasm_bindgen]
    pub fn get_all_agents(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.get_all_agents()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_active_agents(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.get_active_agents()).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_agent_position(&mut self, agent_id: String, x: f32, y: f32, z: f32) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.set_agent_position(&agent_id, [x, y, z]) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_agent_health(&mut self, agent_id: String, health: f32) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.set_agent_health(&agent_id, health) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn set_agent_target(&mut self, agent_id: String, target_id: Option<String>) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.set_agent_target(&agent_id, target_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn create_behavior_tree(&mut self, tree: JsValue) -> Result<JsValue, JsValue> {
        let tree: AIBehaviorTree = serde_wasm_bindgen::from_value(tree).unwrap();
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.create_behavior_tree(tree) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn assign_behavior_tree(&mut self, agent_id: String, tree_id: String) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.assign_behavior_tree(&agent_id, &tree_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn create_state_machine(&mut self, machine: JsValue) -> Result<JsValue, JsValue> {
        let machine: AIStateMachine = serde_wasm_bindgen::from_value(machine).unwrap();
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.create_state_machine(machine) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn assign_state_machine(&mut self, agent_id: String, machine_id: String) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.assign_state_machine(&agent_id, &machine_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn create_pathfinding_grid(&mut self, grid: JsValue) -> Result<JsValue, JsValue> {
        let grid: PathfindingGrid = serde_wasm_bindgen::from_value(grid).unwrap();
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.create_pathfinding_grid(grid) {
            Ok(id) => Ok(JsValue::from_str(&id)),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn find_path(&mut self, grid_id: String, start_x: f32, start_y: f32, start_z: f32, end_x: f32, end_y: f32, end_z: f32) -> Result<JsValue, JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.find_path(&grid_id, [start_x, start_y, start_z], [end_x, end_y, end_z]) {
            Ok(path) => Ok(serde_wasm_bindgen::to_value(&path).unwrap()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self, delta_time: f32) -> Result<(), JsValue> {
        let mut ai_system = self.inner.lock().unwrap();
        match ai_system.update(delta_time) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_debug_info(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.get_debug_info()).unwrap()
    }

    #[wasm_bindgen]
    pub fn visualize_ai(&self) -> JsValue {
        let ai_system = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&ai_system.visualize_ai()).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_ai_config() -> JsValue {
    let config = AIConfig {
        enable_behavior_trees: true,
        enable_state_machines: true,
        enable_pathfinding: true,
        enable_learning: true,
        max_agents: 1000,
        update_frequency: 60.0,
        pathfinding_grid_size: 100,
        learning_buffer_size: 10000,
        debug_mode: false,
        visualize_ai: false,
        performance_monitoring: true,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_ai_agent() -> JsValue {
    let agent = AIAgent {
        id: "default".to_string(),
        name: "Default Agent".to_string(),
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
        velocity: [0.0, 0.0, 0.0],
        health: 100.0,
        max_health: 100.0,
        energy: 100.0,
        max_energy: 100.0,
        behavior_tree: None,
        state_machine: None,
        current_target: None,
        path: Vec::new(),
        path_index: 0,
        blackboard: HashMap::new(),
        variables: HashMap::new(),
        behaviors: Vec::new(),
        learning_data: HashMap::new(),
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };
    serde_wasm_bindgen::to_value(&agent).unwrap()
}

#[wasm_bindgen]
pub fn create_behavior_tree() -> JsValue {
    let tree = AIBehaviorTree {
        id: "default".to_string(),
        name: "Default Behavior Tree".to_string(),
        root_node: AINode {
            id: "root".to_string(),
            node_type: AINodeType::Selector,
            name: "Root Node".to_string(),
            condition: None,
            action: None,
            children: Vec::new(),
            parameters: HashMap::new(),
            status: AINodeStatus::Ready,
            last_execution: 0,
            execution_count: 0,
        },
        blackboard: HashMap::new(),
        variables: HashMap::new(),
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };
    serde_wasm_bindgen::to_value(&tree).unwrap()
}

#[wasm_bindgen]
pub fn create_state_machine() -> JsValue {
    let machine = AIStateMachine {
        id: "default".to_string(),
        name: "Default State Machine".to_string(),
        current_state: "idle".to_string(),
        states: {
            let mut states = HashMap::new();
            states.insert("idle".to_string(), AIState {
                id: "idle".to_string(),
                name: "Idle".to_string(),
                state_type: AIStateType::Idle,
                on_enter: None,
                on_update: None,
                on_exit: None,
                duration: None,
                can_interrupt: true,
                parameters: HashMap::new(),
            });
            states
        },
        transitions: HashMap::new(),
        global_transitions: Vec::new(),
        variables: HashMap::new(),
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        updated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };
    serde_wasm_bindgen::to_value(&machine).unwrap()
}

#[wasm_bindgen]
pub fn create_pathfinding_grid() -> JsValue {
    let grid = PathfindingGrid {
        id: "default".to_string(),
        width: 100,
        height: 100,
        cell_size: 1.0,
        nodes: (0..10000).map(|i| PathfindingNode {
            x: i % 100,
            y: i / 100,
            walkable: true,
            cost: 1.0,
            heuristic: 0.0,
            parent: None,
            g_score: f32::MAX,
            f_score: f32::MAX,
        }).collect(),
        obstacles: Vec::new(),
        algorithm: PathfindingAlgorithm::AStar,
        heuristic_weight: 1.0,
        diagonal_movement: false,
        created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
    };
    serde_wasm_bindgen::to_value(&grid).unwrap()
}

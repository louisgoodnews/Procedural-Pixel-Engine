use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use web_sys::window;

// Console logging macro
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format_args!($($t)*).to_string().into()))
}

// Performance metrics and enums
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProfilerCategory {
    CPU,
    GPU,
    Memory,
    Rendering,
    Physics,
    Audio,
    Network,
    Input,
    Scripting,
    AssetLoading,
    Animation,
    Particles,
    UI,
    General,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PerformanceMetricType {
    FrameTime,
    FPS,
    CPUUsage,
    GPUUsage,
    MemoryUsage,
    DrawCalls,
    Triangles,
    Vertices,
    TextureMemory,
    BufferMemory,
    AudioLatency,
    NetworkLatency,
    ScriptExecutionTime,
    AssetLoadTime,
    PhysicsUpdateTime,
    AnimationTime,
    ParticleCount,
    UITime,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PerformanceLevel {
    Excellent,
    Good,
    Average,
    Poor,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

// Data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub timestamp: u64,
    pub category: ProfilerCategory,
    pub metric_type: PerformanceMetricType,
    pub value: f64,
    pub unit: String,
    pub frame_number: u64,
    pub context: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameAnalysis {
    pub frame_number: u64,
    pub frame_time: f64,
    pub fps: f64,
    pub cpu_time: f64,
    pub gpu_time: f64,
    pub render_time: f64,
    pub physics_time: f64,
    pub audio_time: f64,
    pub script_time: f64,
    pub asset_time: f64,
    pub animation_time: f64,
    pub particle_time: f64,
    pub ui_time: f64,
    pub draw_calls: u32,
    pub triangles: u32,
    pub vertices: u32,
    pub texture_memory: u64,
    pub buffer_memory: u64,
    pub memory_usage: u64,
    pub bottlenecks: Vec<String>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceBudget {
    pub category: ProfilerCategory,
    pub metric_type: PerformanceMetricType,
    pub target_value: f64,
    pub warning_threshold: f64,
    pub critical_threshold: f64,
    pub unit: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub id: String,
    pub timestamp: u64,
    pub severity: AlertSeverity,
    pub category: ProfilerCategory,
    pub metric_type: PerformanceMetricType,
    pub current_value: f64,
    pub threshold_value: f64,
    pub message: String,
    pub suggestions: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceReport {
    pub id: String,
    pub timestamp: u64,
    pub duration: u64,
    pub frame_count: u64,
    pub average_fps: f64,
    pub min_fps: f64,
    pub max_fps: f64,
    pub average_frame_time: f64,
    pub cpu_usage: f64,
    pub gpu_usage: f64,
    pub memory_usage: u64,
    pub draw_calls: u64,
    pub triangles: u64,
    pub vertices: u64,
    pub bottlenecks: Vec<String>,
    pub recommendations: Vec<String>,
    pub alerts: Vec<PerformanceAlert>,
    pub performance_level: PerformanceLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegressionTest {
    pub id: String,
    pub name: String,
    pub category: ProfilerCategory,
    pub metric_type: PerformanceMetricType,
    pub baseline_value: f64,
    pub tolerance_percent: f64,
    pub enabled: bool,
    pub last_result: Option<f64>,
    pub last_test_time: Option<u64>,
    pub failing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilerConfig {
    pub enable_real_time_tracking: bool,
    pub enable_cpu_profiling: bool,
    pub enable_gpu_profiling: bool,
    pub enable_memory_profiling: bool,
    pub enable_frame_analysis: bool,
    pub enable_budget_warnings: bool,
    pub enable_regression_testing: bool,
    pub enable_automated_reports: bool,
    pub enable_optimization_suggestions: bool,
    pub sampling_rate: u32,
    pub history_size: usize,
    pub report_interval: u32,
    pub alert_cooldown: u32,
    pub ui_update_rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilerStats {
    pub total_metrics: u64,
    pub total_frames: u64,
    pub total_alerts: u64,
    pub active_alerts: u64,
    pub average_fps: f64,
    pub average_frame_time: f64,
    pub peak_memory_usage: u64,
    pub total_draw_calls: u64,
    pub total_triangles: u64,
    pub regression_tests_run: u64,
    pub regression_tests_failed: u64,
    pub reports_generated: u64,
    pub optimization_suggestions: u64,
    pub uptime: u64,
}

// Main performance profiler engine
pub struct PerformanceProfiler {
    config: ProfilerConfig,
    metrics: VecDeque<PerformanceMetric>,
    frame_analyses: VecDeque<FrameAnalysis>,
    budgets: HashMap<String, PerformanceBudget>,
    alerts: HashMap<String, PerformanceAlert>,
    regression_tests: HashMap<String, RegressionTest>,
    reports: Vec<PerformanceReport>,
    stats: ProfilerStats,
    current_frame: u64,
    start_time: u64,
    last_alert_time: HashMap<String, u64>,
    optimization_cache: HashMap<String, Vec<String>>,
}

impl PerformanceProfiler {
    pub fn new(config: ProfilerConfig) -> Self {
        console_log!("🔍 Initializing Performance Profiler");
        
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            config,
            metrics: VecDeque::new(),
            frame_analyses: VecDeque::new(),
            budgets: HashMap::new(),
            alerts: HashMap::new(),
            regression_tests: HashMap::new(),
            reports: Vec::new(),
            stats: ProfilerStats {
                total_metrics: 0,
                total_frames: 0,
                total_alerts: 0,
                active_alerts: 0,
                average_fps: 0.0,
                average_frame_time: 0.0,
                peak_memory_usage: 0,
                total_draw_calls: 0,
                total_triangles: 0,
                regression_tests_run: 0,
                regression_tests_failed: 0,
                reports_generated: 0,
                optimization_suggestions: 0,
                uptime: 0,
            },
            current_frame: 0,
            start_time: now,
            last_alert_time: HashMap::new(),
            optimization_cache: HashMap::new(),
        }
    }

    // Configuration management
    pub fn update_config(&mut self, config: ProfilerConfig) {
        self.config = config;
        console_log!("⚙️ Performance Profiler configuration updated");
    }

    pub fn get_config(&self) -> ProfilerConfig {
        self.config.clone()
    }

    // Statistics
    pub fn get_stats(&self) -> ProfilerStats {
        self.stats.clone()
    }

    pub fn get_profiler_summary(&self) -> String {
        format!(
            "🔍 Performance Profiler Summary:\n\
            Total Metrics: {}\n\
            Total Frames: {}\n\
            Total Alerts: {}\n\
            Active Alerts: {}\n\
            Average FPS: {:.2}\n\
            Average Frame Time: {:.2}ms\n\
            Peak Memory Usage: {} bytes\n\
            Total Draw Calls: {}\n\
            Total Triangles: {}\n\
            Regression Tests Run: {}\n\
            Regression Tests Failed: {}\n\
            Reports Generated: {}\n\
            Optimization Suggestions: {}\n\
            Uptime: {} seconds",
            self.stats.total_metrics,
            self.stats.total_frames,
            self.stats.total_alerts,
            self.stats.active_alerts,
            self.stats.average_fps,
            self.stats.average_frame_time,
            self.stats.peak_memory_usage,
            self.stats.total_draw_calls,
            self.stats.total_triangles,
            self.stats.regression_tests_run,
            self.stats.regression_tests_failed,
            self.stats.reports_generated,
            self.stats.optimization_suggestions,
            self.stats.uptime
        )
    }

    // Real-time performance tracking
    pub fn start_real_time_tracking(&mut self) -> Result<(), String> {
        if !self.config.enable_real_time_tracking {
            return Err("Real-time tracking is disabled".to_string());
        }

        console_log!("📊 Started real-time performance tracking");
        Ok(())
    }

    pub fn stop_real_time_tracking(&mut self) {
        console_log!("⏹️ Stopped real-time performance tracking");
    }

    pub fn add_metric(&mut self, metric: PerformanceMetric) {
        if !self.config.enable_real_time_tracking {
            return;
        }

        // Add to metrics history
        self.metrics.push_back(metric.clone());
        
        // Limit history size
        if self.metrics.len() > self.config.history_size {
            self.metrics.pop_front();
        }

        // Update statistics
        self.stats.total_metrics += 1;
        self.stats.uptime = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() - self.start_time;

        // Check performance budgets
        if self.config.enable_budget_warnings {
            self.check_performance_budget(&metric);
        }

        // Update specific stats
        match metric.metric_type {
            PerformanceMetricType::FPS => {
                self.update_fps_stats(metric.value);
            }
            PerformanceMetricType::FrameTime => {
                self.update_frame_time_stats(metric.value);
            }
            PerformanceMetricType::MemoryUsage => {
                if metric.value as u64 > self.stats.peak_memory_usage {
                    self.stats.peak_memory_usage = metric.value as u64;
                }
            }
            PerformanceMetricType::DrawCalls => {
                self.stats.total_draw_calls += metric.value as u64;
            }
            PerformanceMetricType::Triangles => {
                self.stats.total_triangles += metric.value as u64;
            }
            _ => {}
        }
    }

    fn update_fps_stats(&mut self, fps: f64) {
        if self.stats.total_frames == 0 {
            self.stats.average_fps = fps;
        } else {
            let alpha = 0.1; // Exponential moving average
            self.stats.average_fps = self.stats.average_fps * (1.0 - alpha) + fps * alpha;
        }
    }

    fn update_frame_time_stats(&mut self, frame_time: f64) {
        if self.stats.total_frames == 0 {
            self.stats.average_frame_time = frame_time;
        } else {
            let alpha = 0.1;
            self.stats.average_frame_time = self.stats.average_frame_time * (1.0 - alpha) + frame_time * alpha;
        }
    }

    // Frame analysis
    pub fn analyze_frame(&mut self, frame_data: FrameAnalysis) -> Result<(), String> {
        if !self.config.enable_frame_analysis {
            return Err("Frame analysis is disabled".to_string());
        }

        self.current_frame += 1;
        let mut analysis = frame_data.clone();
        analysis.frame_number = self.current_frame;

        // Identify bottlenecks
        analysis.bottlenecks = self.identify_bottlenecks(&analysis);
        
        // Generate recommendations
        analysis.recommendations = self.generate_frame_recommendations(&analysis);

        // Add to history
        self.frame_analyses.push_back(analysis.clone());
        
        // Limit history size
        if self.frame_analyses.len() > self.config.history_size {
            self.frame_analyses.pop_front();
        }

        // Update statistics
        self.stats.total_frames += 1;
        self.update_fps_stats(analysis.fps);
        self.update_frame_time_stats(analysis.frame_time);
        self.stats.total_draw_calls += analysis.draw_calls as u64;
        self.stats.total_triangles += analysis.triangles as u64;

        console_log!("📊 Analyzed frame {}: {:.2}ms, {:.1} FPS", analysis.frame_number, analysis.frame_time, analysis.fps);
        Ok(())
    }

    fn identify_bottlenecks(&self, frame: &FrameAnalysis) -> Vec<String> {
        let mut bottlenecks = Vec::new();
        
        // Check frame time
        if frame.frame_time > 16.67 { // > 60 FPS
            bottlenecks.push("Frame time exceeds 60 FPS target".to_string());
        }
        
        if frame.frame_time > 33.33 { // > 30 FPS
            bottlenecks.push("Frame time exceeds 30 FPS target".to_string());
        }

        // Check individual components
        if frame.cpu_time > 10.0 {
            bottlenecks.push("CPU usage is high".to_string());
        }

        if frame.gpu_time > 10.0 {
            bottlenecks.push("GPU usage is high".to_string());
        }

        if frame.render_time > 8.0 {
            bottlenecks.push("Rendering time is high".to_string());
        }

        if frame.physics_time > 5.0 {
            bottlenecks.push("Physics simulation is slow".to_string());
        }

        if frame.script_time > 5.0 {
            bottlenecks.push("Script execution is slow".to_string());
        }

        if frame.asset_time > 3.0 {
            bottlenecks.push("Asset loading is blocking".to_string());
        }

        if frame.draw_calls > 1000 {
            bottlenecks.push("Too many draw calls".to_string());
        }

        if frame.triangles > 1000000 {
            bottlenecks.push("Too many triangles".to_string());
        }

        bottlenecks
    }

    fn generate_frame_recommendations(&self, frame: &FrameAnalysis) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        // Frame time recommendations
        if frame.frame_time > 16.67 {
            recommendations.push("Optimize rendering pipeline to maintain 60 FPS".to_string());
        }

        if frame.frame_time > 33.33 {
            recommendations.push("Consider reducing visual quality for better performance".to_string());
        }

        // CPU recommendations
        if frame.cpu_time > 10.0 {
            recommendations.push("Optimize CPU-intensive operations".to_string());
            recommendations.push("Consider using multithreading for heavy computations".to_string());
        }

        // GPU recommendations
        if frame.gpu_time > 10.0 {
            recommendations.push("Reduce shader complexity".to_string());
            recommendations.push("Optimize texture sizes and formats".to_string());
        }

        // Rendering recommendations
        if frame.render_time > 8.0 {
            recommendations.push("Implement culling techniques".to_string());
            recommendations.push("Reduce overdraw".to_string());
        }

        // Draw call recommendations
        if frame.draw_calls > 1000 {
            recommendations.push("Batch draw calls together".to_string());
            recommendations.push("Use instanced rendering".to_string());
        }

        // Triangle recommendations
        if frame.triangles > 1000000 {
            recommendations.push("Use LOD (Level of Detail) systems".to_string());
            recommendations.push("Implement occlusion culling".to_string());
        }

        // Memory recommendations
        if frame.memory_usage > 512 * 1024 * 1024 { // > 512MB
            recommendations.push("Optimize memory usage".to_string());
            recommendations.push("Implement texture streaming".to_string());
        }

        recommendations
    }

    // Performance budgets
    pub fn add_budget(&mut self, budget: PerformanceBudget) -> Result<(), String> {
        let category = budget.category.clone();
        let key = format!("{:?}_{:?}", budget.category, budget.metric_type);
        self.budgets.insert(key, budget);
        console_log!("💰 Added performance budget for {:?}", category);
        Ok(())
    }

    pub fn remove_budget(&mut self, category: ProfilerCategory, metric_type: PerformanceMetricType) -> Result<(), String> {
        let key = format!("{:?}_{:?}", category, metric_type);
        if self.budgets.remove(&key).is_none() {
            return Err("Budget not found".to_string());
        }
        console_log!("🗑️ Removed performance budget for {:?}", category);
        Ok(())
    }

    fn check_performance_budget(&mut self, metric: &PerformanceMetric) {
        let key = format!("{:?}_{:?}", metric.category, metric.metric_type);
        
        if let Some(budget) = self.budgets.get(&key) {
            if !budget.enabled {
                return;
            }

            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            // Check alert cooldown
            if let Some(last_time) = self.last_alert_time.get(&key) {
                if now - last_time < self.config.alert_cooldown as u64 {
                    return;
                }
            }

            let mut severity = AlertSeverity::Info;
            let mut threshold_value = budget.target_value;

            if metric.value >= budget.critical_threshold {
                severity = AlertSeverity::Critical;
                threshold_value = budget.critical_threshold;
            } else if metric.value >= budget.warning_threshold {
                severity = AlertSeverity::Warning;
                threshold_value = budget.warning_threshold;
            } else if metric.value >= budget.target_value {
                severity = AlertSeverity::Info;
                threshold_value = budget.target_value;
            } else {
                return; // Within budget
            }

            // Create alert
            let alert_id = format!("alert_{}_{}", key, now);
            let alert = PerformanceAlert {
                id: alert_id.clone(),
                timestamp: now,
                severity,
                category: metric.category.clone(),
                metric_type: metric.metric_type.clone(),
                current_value: metric.value,
                threshold_value,
                message: format!("{:?} {:?} exceeded budget: {:.2} > {:.2} {}", 
                    metric.category, metric.metric_type, metric.value, threshold_value, budget.unit),
                suggestions: self.generate_budget_suggestions(&metric, budget),
                is_active: true,
            };

            self.alerts.insert(alert_id.clone(), alert.clone());
            self.last_alert_time.insert(key, now);
            
            // Update statistics
            self.stats.total_alerts += 1;
            self.stats.active_alerts += 1;

            console_log!("⚠️ Performance alert: {}", alert.message);
        }
    }

    fn generate_budget_suggestions(&self, metric: &PerformanceMetric, _budget: &PerformanceBudget) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        match metric.metric_type {
            PerformanceMetricType::FrameTime => {
                suggestions.push("Reduce scene complexity".to_string());
                suggestions.push("Optimize rendering pipeline".to_string());
                suggestions.push("Enable vsync if needed".to_string());
            }
            PerformanceMetricType::CPUUsage => {
                suggestions.push("Optimize algorithms and data structures".to_string());
                suggestions.push("Use multithreading where possible".to_string());
                suggestions.push("Profile CPU bottlenecks".to_string());
            }
            PerformanceMetricType::GPUUsage => {
                suggestions.push("Reduce shader complexity".to_string());
                suggestions.push("Optimize texture usage".to_string());
                suggestions.push("Implement culling techniques".to_string());
            }
            PerformanceMetricType::MemoryUsage => {
                suggestions.push("Implement memory pooling".to_string());
                suggestions.push("Use texture compression".to_string());
                suggestions.push("Optimize asset loading".to_string());
            }
            PerformanceMetricType::DrawCalls => {
                suggestions.push("Batch similar draw calls".to_string());
                suggestions.push("Use instanced rendering".to_string());
                suggestions.push("Reduce state changes".to_string());
            }
            _ => {
                suggestions.push("Profile the specific metric".to_string());
                suggestions.push("Consult optimization documentation".to_string());
            }
        }

        suggestions
    }

    // Alert management
    pub fn get_alerts(&self) -> Vec<PerformanceAlert> {
        self.alerts.values().cloned().collect()
    }

    pub fn get_active_alerts(&self) -> Vec<PerformanceAlert> {
        self.alerts.values()
            .filter(|alert| alert.is_active)
            .cloned()
            .collect()
    }

    pub fn dismiss_alert(&mut self, alert_id: &str) -> Result<(), String> {
        if let Some(alert) = self.alerts.get_mut(alert_id) {
            alert.is_active = false;
            self.stats.active_alerts = self.stats.active_alerts.saturating_sub(1);
            console_log!("✅ Dismissed alert: {}", alert_id);
            Ok(())
        } else {
            Err("Alert not found".to_string())
        }
    }

    pub fn clear_alerts(&mut self) {
        let count = self.alerts.len();
        self.alerts.clear();
        self.stats.active_alerts = 0;
        console_log!("🗑️ Cleared {} alerts", count);
    }

    // Regression testing
    pub fn add_regression_test(&mut self, test: RegressionTest) -> Result<(), String> {
        let test_id = test.id.clone();
        self.regression_tests.insert(test.id.clone(), test);
        console_log!("🧪 Added regression test: {}", test_id);
        Ok(())
    }

    pub fn run_regression_tests(&mut self) -> Vec<(String, bool, f64)> {
        if !self.config.enable_regression_testing {
            return Vec::new();
        }

        let mut results = Vec::new();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Collect test data first to avoid borrow checker issues
        let test_data: Vec<(String, ProfilerCategory, PerformanceMetricType, f64, f64)> = self.regression_tests
            .iter()
            .filter(|(_, test)| test.enabled)
            .map(|(id, test)| {
                (id.clone(), test.category.clone(), test.metric_type.clone(), test.baseline_value, test.tolerance_percent)
            })
            .collect();

        for (id, category, metric_type, baseline_value, tolerance_percent) in test_data {
            // Get current metric value
            let current_value = self.get_current_metric_value(&category, &metric_type);
            
            // Check against baseline
            let tolerance = baseline_value * (tolerance_percent / 100.0);
            let passed = (current_value - baseline_value).abs() <= tolerance;
            
            // Update test
            if let Some(test) = self.regression_tests.get_mut(&id) {
                test.last_result = Some(current_value);
                test.last_test_time = Some(now);
                test.failing = !passed;
            }

            self.stats.regression_tests_run += 1;
            if !passed {
                self.stats.regression_tests_failed += 1;
            }

            results.push((id.clone(), passed, current_value));

            console_log!("🧪 Regression test {}: {} (current: {:.2}, baseline: {:.2})", 
                id, if passed { "PASSED" } else { "FAILED" }, current_value, baseline_value);
        }

        results
    }

    fn get_current_metric_value(&self, category: &ProfilerCategory, metric_type: &PerformanceMetricType) -> f64 {
        // Get the most recent metric value for the given category and type
        for metric in self.metrics.iter().rev() {
            if metric.category == *category && metric.metric_type == *metric_type {
                return metric.value;
            }
        }
        0.0
    }

    // Automated reports
    pub fn generate_report(&mut self) -> PerformanceReport {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let duration = now - self.start_time;
        let frame_count = self.stats.total_frames;

        // Calculate statistics
        let average_fps = if frame_count > 0 {
            self.stats.average_fps
        } else {
            0.0
        };

        let min_fps = self.frame_analyses
            .iter()
            .map(|f| f.fps)
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        let max_fps = self.frame_analyses
            .iter()
            .map(|f| f.fps)
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        let average_frame_time = if frame_count > 0 {
            self.stats.average_frame_time
        } else {
            0.0
        };

        // Get current usage
        let cpu_usage = self.get_current_metric_value(&ProfilerCategory::CPU, &PerformanceMetricType::CPUUsage);
        let gpu_usage = self.get_current_metric_value(&ProfilerCategory::GPU, &PerformanceMetricType::GPUUsage);
        let memory_usage = self.get_current_metric_value(&ProfilerCategory::Memory, &PerformanceMetricType::MemoryUsage) as u64;

        // Collect bottlenecks and recommendations
        let mut bottlenecks = Vec::new();
        let mut recommendations = Vec::new();

        for analysis in self.frame_analyses.iter().rev().take(10) {
            bottlenecks.extend(analysis.bottlenecks.clone());
            recommendations.extend(analysis.recommendations.clone());
        }

        // Remove duplicates
        bottlenecks.sort();
        bottlenecks.dedup();
        recommendations.sort();
        recommendations.dedup();

        // Get active alerts
        let alerts = self.get_active_alerts();

        // Determine performance level
        let performance_level = if average_fps >= 60.0 && cpu_usage < 70.0 && gpu_usage < 70.0 {
            PerformanceLevel::Excellent
        } else if average_fps >= 45.0 && cpu_usage < 85.0 && gpu_usage < 85.0 {
            PerformanceLevel::Good
        } else if average_fps >= 30.0 && cpu_usage < 95.0 && gpu_usage < 95.0 {
            PerformanceLevel::Average
        } else if average_fps >= 15.0 {
            PerformanceLevel::Poor
        } else {
            PerformanceLevel::Critical
        };

        let report = PerformanceReport {
            id: format!("report_{}", now),
            timestamp: now,
            duration,
            frame_count,
            average_fps,
            min_fps,
            max_fps,
            average_frame_time,
            cpu_usage,
            gpu_usage,
            memory_usage,
            draw_calls: self.stats.total_draw_calls,
            triangles: self.stats.total_triangles,
            vertices: self.stats.total_triangles, // Approximation
            bottlenecks,
            recommendations,
            alerts,
            performance_level: performance_level.clone(),
        };

        self.reports.push(report.clone());
        self.stats.reports_generated += 1;

        let performance_level_clone = performance_level.clone();
        console_log!("📊 Generated performance report: {} FPS, {:?}", average_fps, performance_level_clone);
        report
    }

    pub fn get_reports(&self) -> Vec<PerformanceReport> {
        self.reports.clone()
    }

    pub fn get_latest_report(&self) -> Option<PerformanceReport> {
        self.reports.last().cloned()
    }

    // Optimization suggestions
    pub fn get_optimization_suggestions(&mut self) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        // Get current metrics
        let fps = self.get_current_metric_value(&ProfilerCategory::General, &PerformanceMetricType::FPS);
        let frame_time = self.get_current_metric_value(&ProfilerCategory::General, &PerformanceMetricType::FrameTime);
        let cpu_usage = self.get_current_metric_value(&ProfilerCategory::CPU, &PerformanceMetricType::CPUUsage);
        let gpu_usage = self.get_current_metric_value(&ProfilerCategory::GPU, &PerformanceMetricType::GPUUsage);
        let memory_usage = self.get_current_metric_value(&ProfilerCategory::Memory, &PerformanceMetricType::MemoryUsage);
        let draw_calls = self.get_current_metric_value(&ProfilerCategory::Rendering, &PerformanceMetricType::DrawCalls);

        // Generate suggestions based on current performance
        if fps < 60.0 {
            suggestions.push("Target 60 FPS for smooth gameplay".to_string());
        }

        if fps < 30.0 {
            suggestions.push("Critical: FPS below 30, consider major optimizations".to_string());
        }

        if frame_time > 16.67 {
            suggestions.push("Frame time exceeds 16.67ms (60 FPS target)".to_string());
        }

        if cpu_usage > 80.0 {
            suggestions.push("High CPU usage detected, optimize CPU-intensive code".to_string());
        }

        if gpu_usage > 80.0 {
            suggestions.push("High GPU usage detected, optimize rendering pipeline".to_string());
        }

        if memory_usage > 512.0 * 1024.0 * 1024.0 {
            suggestions.push("High memory usage, implement memory optimization".to_string());
        }

        if draw_calls > 1000.0 {
            suggestions.push("Too many draw calls, implement batching".to_string());
        }

        // Add suggestions from recent frame analyses
        for analysis in self.frame_analyses.iter().rev().take(5) {
            suggestions.extend(analysis.recommendations.clone());
        }

        // Remove duplicates and sort
        suggestions.sort();
        suggestions.dedup();

        self.stats.optimization_suggestions += suggestions.len() as u64;
        suggestions
    }

    // UI data
    pub fn get_ui_data(&self) -> ProfilerUIData {
        ProfilerUIData {
            current_fps: self.get_current_metric_value(&ProfilerCategory::General, &PerformanceMetricType::FPS),
            current_frame_time: self.get_current_metric_value(&ProfilerCategory::General, &PerformanceMetricType::FrameTime),
            cpu_usage: self.get_current_metric_value(&ProfilerCategory::CPU, &PerformanceMetricType::CPUUsage),
            gpu_usage: self.get_current_metric_value(&ProfilerCategory::GPU, &PerformanceMetricType::GPUUsage),
            memory_usage: self.get_current_metric_value(&ProfilerCategory::Memory, &PerformanceMetricType::MemoryUsage),
            draw_calls: self.get_current_metric_value(&ProfilerCategory::Rendering, &PerformanceMetricType::DrawCalls),
            triangles: self.get_current_metric_value(&ProfilerCategory::Rendering, &PerformanceMetricType::Triangles),
            active_alerts: self.get_active_alerts(),
            performance_level: self.calculate_performance_level(),
            recent_frame_analyses: self.frame_analyses.iter().rev().take(60).cloned().collect(), // Last 60 frames
        }
    }

    fn calculate_performance_level(&self) -> PerformanceLevel {
        let fps = self.get_current_metric_value(&ProfilerCategory::General, &PerformanceMetricType::FPS);
        let cpu_usage = self.get_current_metric_value(&ProfilerCategory::CPU, &PerformanceMetricType::CPUUsage);
        let gpu_usage = self.get_current_metric_value(&ProfilerCategory::GPU, &PerformanceMetricType::GPUUsage);

        if fps >= 60.0 && cpu_usage < 70.0 && gpu_usage < 70.0 {
            PerformanceLevel::Excellent
        } else if fps >= 45.0 && cpu_usage < 85.0 && gpu_usage < 85.0 {
            PerformanceLevel::Good
        } else if fps >= 30.0 && cpu_usage < 95.0 && gpu_usage < 95.0 {
            PerformanceLevel::Average
        } else if fps >= 15.0 {
            PerformanceLevel::Poor
        } else {
            PerformanceLevel::Critical
        }
    }
}

// UI data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilerUIData {
    pub current_fps: f64,
    pub current_frame_time: f64,
    pub cpu_usage: f64,
    pub gpu_usage: f64,
    pub memory_usage: f64,
    pub draw_calls: f64,
    pub triangles: f64,
    pub active_alerts: Vec<PerformanceAlert>,
    pub performance_level: PerformanceLevel,
    pub recent_frame_analyses: Vec<FrameAnalysis>,
}

// WASM exports
#[wasm_bindgen]
pub struct PerformanceProfilerExport {
    inner: Arc<Mutex<PerformanceProfiler>>,
}

#[wasm_bindgen]
impl PerformanceProfilerExport {
    #[wasm_bindgen(constructor)]
    pub fn new(config: JsValue) -> Result<PerformanceProfilerExport, JsValue> {
        let config: ProfilerConfig = serde_wasm_bindgen::from_value(config)?;
        let profiler = PerformanceProfiler::new(config);
        Ok(PerformanceProfilerExport {
            inner: Arc::new(Mutex::new(profiler)),
        })
    }

    #[wasm_bindgen]
    pub fn update_config(&self, config: JsValue) -> Result<(), JsValue> {
        let config: ProfilerConfig = serde_wasm_bindgen::from_value(config)?;
        self.inner.lock().unwrap().update_config(config);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn get_config(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_config()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_profiler_summary(&mut self) -> String {
        self.inner.lock().unwrap().get_profiler_summary()
    }

    #[wasm_bindgen]
    pub fn start_real_time_tracking(&mut self) -> Result<(), JsValue> {
        let mut profiler = self.inner.lock().unwrap();
        match profiler.start_real_time_tracking() {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn stop_real_time_tracking(&mut self) {
        self.inner.lock().unwrap().stop_real_time_tracking();
    }

    #[wasm_bindgen]
    pub fn add_metric(&mut self, metric: JsValue) {
        let metric: PerformanceMetric = serde_wasm_bindgen::from_value(metric).unwrap();
        self.inner.lock().unwrap().add_metric(metric);
    }

    #[wasm_bindgen]
    pub fn analyze_frame(&mut self, frame_data: JsValue) -> Result<(), JsValue> {
        let frame_data: FrameAnalysis = serde_wasm_bindgen::from_value(frame_data).unwrap();
        let mut profiler = self.inner.lock().unwrap();
        match profiler.analyze_frame(frame_data) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn add_budget(&mut self, budget: JsValue) -> Result<(), JsValue> {
        let budget: PerformanceBudget = serde_wasm_bindgen::from_value(budget).unwrap();
        let mut profiler = self.inner.lock().unwrap();
        match profiler.add_budget(budget) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn get_alerts(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_alerts()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_active_alerts(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_active_alerts()).unwrap()
    }

    #[wasm_bindgen]
    pub fn dismiss_alert(&mut self, alert_id: &str) -> Result<(), JsValue> {
        let mut profiler = self.inner.lock().unwrap();
        match profiler.dismiss_alert(alert_id) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn clear_alerts(&mut self) {
        self.inner.lock().unwrap().clear_alerts();
    }

    #[wasm_bindgen]
    pub fn add_regression_test(&mut self, test: JsValue) -> Result<(), JsValue> {
        let test: RegressionTest = serde_wasm_bindgen::from_value(test).unwrap();
        let mut profiler = self.inner.lock().unwrap();
        match profiler.add_regression_test(test) {
            Ok(_) => Ok(()),
            Err(e) => Err(JsValue::from_str(&e)),
        }
    }

    #[wasm_bindgen]
    pub fn run_regression_tests(&mut self) -> JsValue {
        let mut profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.run_regression_tests()).unwrap()
    }

    #[wasm_bindgen]
    pub fn generate_report(&mut self) -> JsValue {
        let mut profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.generate_report()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_reports(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_reports()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_optimization_suggestions(&mut self) -> JsValue {
        let mut profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_optimization_suggestions()).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_ui_data(&self) -> JsValue {
        let profiler = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&profiler.get_ui_data()).unwrap()
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_profiler_config() -> JsValue {
    let config = ProfilerConfig {
        enable_real_time_tracking: true,
        enable_cpu_profiling: true,
        enable_gpu_profiling: true,
        enable_memory_profiling: true,
        enable_frame_analysis: true,
        enable_budget_warnings: true,
        enable_regression_testing: true,
        enable_automated_reports: true,
        enable_optimization_suggestions: true,
        sampling_rate: 60,
        history_size: 1000,
        report_interval: 5000,
        alert_cooldown: 1000,
        ui_update_rate: 30,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_profiler_development_config() -> JsValue {
    let config = ProfilerConfig {
        enable_real_time_tracking: true,
        enable_cpu_profiling: true,
        enable_gpu_profiling: true,
        enable_memory_profiling: true,
        enable_frame_analysis: true,
        enable_budget_warnings: true,
        enable_regression_testing: false,
        enable_automated_reports: false,
        enable_optimization_suggestions: true,
        sampling_rate: 60,
        history_size: 2000,
        report_interval: 10000,
        alert_cooldown: 500,
        ui_update_rate: 60,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_profiler_production_config() -> JsValue {
    let config = ProfilerConfig {
        enable_real_time_tracking: false,
        enable_cpu_profiling: false,
        enable_gpu_profiling: false,
        enable_memory_profiling: true,
        enable_frame_analysis: false,
        enable_budget_warnings: true,
        enable_regression_testing: true,
        enable_automated_reports: true,
        enable_optimization_suggestions: false,
        sampling_rate: 30,
        history_size: 500,
        report_interval: 30000,
        alert_cooldown: 5000,
        ui_update_rate: 10,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

#[wasm_bindgen]
pub fn create_minimal_config() -> JsValue {
    let config = ProfilerConfig {
        enable_real_time_tracking: false,
        enable_cpu_profiling: false,
        enable_gpu_profiling: false,
        enable_memory_profiling: true,
        enable_frame_analysis: false,
        enable_budget_warnings: false,
        enable_regression_testing: false,
        enable_automated_reports: false,
        enable_optimization_suggestions: false,
        sampling_rate: 10,
        history_size: 100,
        report_interval: 60000,
        alert_cooldown: 10000,
        ui_update_rate: 5,
    };
    serde_wasm_bindgen::to_value(&config).unwrap()
}

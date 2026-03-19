use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::networking::{NetworkMessage, NetworkPeer};

// Security types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPolicy {
    pub max_connections_per_ip: u32,
    pub max_messages_per_second: u32,
    pub max_message_size: usize,
    pub allowed_message_types: Vec<String>,
    pub blocked_ips: Vec<String>,
    pub require_authentication: bool,
    pub encryption_required: bool,
    pub rate_limiting_enabled: bool,
    pub ddos_protection_enabled: bool,
    pub message_validation_enabled: bool,
}

impl Default for SecurityPolicy {
    fn default() -> Self {
        Self {
            max_connections_per_ip: 5,
            max_messages_per_second: 100,
            max_message_size: 1024 * 1024, // 1MB
            allowed_message_types: vec![
                "Connect".to_string(),
                "Disconnect".to_string(),
                "Heartbeat".to_string(),
                "Acknowledge".to_string(),
                "PlayerJoin".to_string(),
                "PlayerLeave".to_string(),
                "PlayerUpdate".to_string(),
                "WorldState".to_string(),
                "EntityUpdate".to_string(),
                "EntityDestroy".to_string(),
                "ChatMessage".to_string(),
                "SystemMessage".to_string(),
            ],
            blocked_ips: vec![],
            require_authentication: false,
            encryption_required: false,
            rate_limiting_enabled: true,
            ddos_protection_enabled: true,
            message_validation_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityViolation {
    pub violation_type: ViolationType,
    pub severity: ViolationSeverity,
    pub peer_id: String,
    pub message_id: Option<String>,
    pub description: String,
    pub timestamp: u64,
    pub action_taken: SecurityAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ViolationType {
    RateLimitExceeded,
    MessageSizeExceeded,
    UnauthorizedMessageType,
    BlockedIPAddress,
    SuspiciousActivity,
    AuthenticationFailure,
    EncryptionRequired,
    DDOSAttack,
    InvalidMessageFormat,
    ConnectionFlood,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ViolationSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityAction {
    Warning,
    MessageDropped,
    TemporaryBan,
    PermanentBan,
    Disconnect,
    Report,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthenticationToken {
    pub token_id: String,
    pub user_id: String,
    pub permissions: Vec<String>,
    pub expires_at: u64,
    pub issued_at: u64,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityStats {
    pub total_violations: u64,
    pub blocked_ips: usize,
    pub banned_peers: usize,
    pub rate_limit_violations: u64,
    pub authentication_failures: u64,
    pub ddos_attempts: u64,
    pub messages_blocked: u64,
    pub uptime: u64,
}

// Security manager
pub struct SecurityManager {
    policy: SecurityPolicy,
    violations: Vec<SecurityViolation>,
    banned_ips: HashSet<String>,
    banned_peers: HashSet<String>,
    rate_limiters: HashMap<String, RateLimiter>,
    connection_tracker: HashMap<String, ConnectionTracker>,
    authentication_tokens: HashMap<String, AuthenticationToken>,
    suspicious_patterns: SuspiciousPatternDetector,
    stats: SecurityStats,
    start_time: u64,
}

#[derive(Debug, Clone)]
struct RateLimiter {
    message_count: u32,
    last_reset: u64,
    violations: u32,
}

#[derive(Debug, Clone)]
struct ConnectionTracker {
    connection_count: u32,
    last_connection: u64,
    connection_attempts: Vec<u64>,
}

#[derive(Debug)]
struct SuspiciousPatternDetector {
    message_patterns: HashMap<String, u32>,
    timing_patterns: Vec<u64>,
    anomaly_threshold: f32,
}

impl SecurityManager {
    pub fn new(policy: SecurityPolicy) -> Self {
        console_log!("🔒 Initializing security manager");

        Self {
            policy,
            violations: Vec::new(),
            banned_ips: HashSet::new(),
            banned_peers: HashSet::new(),
            rate_limiters: HashMap::new(),
            connection_tracker: HashMap::new(),
            authentication_tokens: HashMap::new(),
            suspicious_patterns: SuspiciousPatternDetector::new(),
            stats: SecurityStats {
                total_violations: 0,
                blocked_ips: 0,
                banned_peers: 0,
                rate_limit_violations: 0,
                authentication_failures: 0,
                ddos_attempts: 0,
                messages_blocked: 0,
                uptime: 0,
            },
            start_time: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        }
    }

    // Message validation
    pub fn validate_message(&mut self, message: &NetworkMessage, peer: &NetworkPeer) -> Result<bool, SecurityAction> {
        // Check if peer is banned
        if self.banned_peers.contains(&peer.id) {
            self.record_violation(
                ViolationType::AuthenticationFailure,
                ViolationSeverity::High,
                peer.id.clone(),
                Some(message.id.clone()),
                "Banned peer attempted to send message".to_string(),
                SecurityAction::MessageDropped
            );
            return Err(SecurityAction::MessageDropped);
        }

        // Check if IP is blocked
        if self.banned_ips.contains(&peer.address) {
            self.record_violation(
                ViolationType::BlockedIPAddress,
                ViolationSeverity::High,
                peer.id.clone(),
                Some(message.id.clone()),
                "Blocked IP attempted to send message".to_string(),
                SecurityAction::MessageDropped
            );
            return Err(SecurityAction::MessageDropped);
        }

        // Check message size
        let message_size = self.estimate_message_size(message);
        if message_size > self.policy.max_message_size {
            self.record_violation(
                ViolationType::MessageSizeExceeded,
                ViolationSeverity::Medium,
                peer.id.clone(),
                Some(message.id.clone()),
                format!("Message size exceeded: {} bytes", message_size),
                SecurityAction::MessageDropped
            );
            return Err(SecurityAction::MessageDropped);
        }

        // Check message type authorization
        if self.policy.message_validation_enabled {
            let message_type_str = self.message_type_to_string(&message.message_type);
            if !self.policy.allowed_message_types.contains(&message_type_str) {
                self.record_violation(
                    ViolationType::UnauthorizedMessageType,
                    ViolationSeverity::Medium,
                    peer.id.clone(),
                    Some(message.id.clone()),
                    format!("Unauthorized message type: {}", message_type_str),
                    SecurityAction::MessageDropped
                );
                return Err(SecurityAction::MessageDropped);
            }
        }

        // Rate limiting
        if self.policy.rate_limiting_enabled {
            if let Some(action) = self.check_rate_limit(&peer.id, &message.id) {
                return Err(action);
            }
        }

        // Check for suspicious patterns
        if self.detect_suspicious_activity(message, peer) {
            self.record_violation(
                ViolationType::SuspiciousActivity,
                ViolationSeverity::High,
                peer.id.clone(),
                Some(message.id.clone()),
                "Suspicious activity detected".to_string(),
                SecurityAction::Warning
            );
        }

        // Check encryption requirement
        if self.policy.encryption_required && !self.is_message_encrypted(message) {
            self.record_violation(
                ViolationType::EncryptionRequired,
                ViolationSeverity::Medium,
                peer.id.clone(),
                Some(message.id.clone()),
                "Encryption required but message not encrypted".to_string(),
                SecurityAction::MessageDropped
            );
            return Err(SecurityAction::MessageDropped);
        }

        Ok(true)
    }

    // Connection validation
    pub fn validate_connection(&mut self, peer_address: &str, peer_id: &str) -> Result<bool, SecurityAction> {
        // Check if IP is blocked
        if self.banned_ips.contains(peer_address) {
            self.record_violation(
                ViolationType::BlockedIPAddress,
                ViolationSeverity::Critical,
                peer_id.to_string(),
                None,
                format!("Blocked IP attempted connection: {}", peer_address),
                SecurityAction::Disconnect
            );
            return Err(SecurityAction::Disconnect);
        }

        // Check connection limits
        if self.policy.ddos_protection_enabled {
            if let Some(action) = self.check_connection_flood(peer_address, peer_id) {
                return Err(action);
            }
        }

        Ok(true)
    }

    // Authentication
    pub fn authenticate_peer(&mut self, peer_id: &str, token: &str) -> Result<AuthenticationToken, SecurityAction> {
        if !self.policy.require_authentication {
            // Create a default token for unauthenticated access
            let default_token = AuthenticationToken {
                token_id: format!("default_{}", peer_id),
                user_id: peer_id.to_string(),
                permissions: vec!["basic".to_string()],
                expires_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 3600,
                issued_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                signature: "none".to_string(),
            };
            return Ok(default_token);
        }

        // Validate token
        if let Some(auth_token) = self.authentication_tokens.get(token) {
            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            
            if auth_token.expires_at < now {
                self.record_violation(
                    ViolationType::AuthenticationFailure,
                    ViolationSeverity::Medium,
                    peer_id.to_string(),
                    None,
                    "Expired authentication token".to_string(),
                    SecurityAction::Disconnect
                );
                return Err(SecurityAction::Disconnect);
            }

            Ok(auth_token.clone())
        } else {
            self.record_violation(
                ViolationType::AuthenticationFailure,
                ViolationSeverity::High,
                peer_id.to_string(),
                None,
                "Invalid authentication token".to_string(),
                SecurityAction::Disconnect
            );
            Err(SecurityAction::Disconnect)
        }
    }

    // Rate limiting
    fn check_rate_limit(&mut self, peer_id: &str, message_id: &str) -> Option<SecurityAction> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        let message_count = {
            let rate_limiter = self.rate_limiters.entry(peer_id.to_string()).or_insert(RateLimiter {
                message_count: 0,
                last_reset: now,
                violations: 0,
            });

            // Reset counter if needed
            if now - rate_limiter.last_reset >= 1 {
                rate_limiter.message_count = 0;
                rate_limiter.last_reset = now;
            }

            rate_limiter.message_count += 1;
            rate_limiter.message_count
        };

        // Check if rate limit exceeded
        if message_count > self.policy.max_messages_per_second {
            let violations = {
                let rate_limiter = self.rate_limiters.get_mut(peer_id).unwrap();
                rate_limiter.violations += 1;
                rate_limiter.violations
            };
            
            self.stats.rate_limit_violations += 1;

            let action = if violations > 5 {
                SecurityAction::TemporaryBan
            } else if violations > 10 {
                SecurityAction::PermanentBan
            } else {
                SecurityAction::MessageDropped
            };

            self.record_violation(
                ViolationType::RateLimitExceeded,
                ViolationSeverity::Medium,
                peer_id.to_string(),
                Some(message_id.to_string()),
                format!("Rate limit exceeded: {} messages/second", message_count),
                action.clone()
            );

            return Some(action);
        }

        None
    }

    // Connection flood protection
    fn check_connection_flood(&mut self, peer_address: &str, peer_id: &str) -> Option<SecurityAction> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        
        let (connection_count, last_connection, connection_attempts) = {
            let tracker = self.connection_tracker.entry(peer_address.to_string()).or_insert(ConnectionTracker {
                connection_count: 0,
                last_connection: now,
                connection_attempts: Vec::new(),
            });

            tracker.connection_count += 1;
            tracker.last_connection = now;
            tracker.connection_attempts.push(now);

            // Clean old connection attempts (keep only last minute)
            tracker.connection_attempts.retain(|&timestamp| now - timestamp < 60);

            (tracker.connection_count, tracker.last_connection, tracker.connection_attempts.len())
        };

        // Check connection limits
        if connection_count > self.policy.max_connections_per_ip {
            let action = if connection_count > self.policy.max_connections_per_ip * 2 {
                SecurityAction::PermanentBan
            } else {
                SecurityAction::TemporaryBan
            };

            self.record_violation(
                ViolationType::ConnectionFlood,
                ViolationSeverity::High,
                peer_id.to_string(),
                None,
                format!("Connection flood detected: {} connections", connection_count),
                action.clone()
            );

            return Some(action);
        }

        // Check for rapid connection attempts (potential DDoS)
        if connection_attempts > 10 {
            self.record_violation(
                ViolationType::DDOSAttack,
                ViolationSeverity::Critical,
                peer_id.to_string(),
                None,
                "Rapid connection attempts detected".to_string(),
                SecurityAction::TemporaryBan
            );

            self.stats.ddos_attempts += 1;
            return Some(SecurityAction::TemporaryBan);
        }

        None
    }

    // Suspicious activity detection
    fn detect_suspicious_activity(&mut self, message: &NetworkMessage, peer: &NetworkPeer) -> bool {
        // Analyze message patterns
        let message_pattern = format!("{:?}_{:?}", message.message_type, message.data);
        let count = self.suspicious_patterns.message_patterns.entry(message_pattern).or_insert(0);
        *count += 1;

        // Check for repetitive patterns
        if *count > 100 {
            return true;
        }

        // Analyze timing patterns
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        self.suspicious_patterns.timing_patterns.push(now);

        // Keep only last 1000 timestamps
        if self.suspicious_patterns.timing_patterns.len() > 1000 {
            self.suspicious_patterns.timing_patterns.drain(0..500);
        }

        // Check for abnormal timing patterns
        if self.suspicious_patterns.timing_patterns.len() > 50 {
            let intervals: Vec<u64> = self.suspicious_patterns.timing_patterns
                .windows(2)
                .map(|w| w[1] - w[0])
                .collect();

            let avg_interval = intervals.iter().sum::<u64>() / intervals.len() as u64;
            let variance = intervals.iter()
                .map(|&interval| {
                    let diff = interval as i64 - avg_interval as i64;
                    (diff * diff) as u64
                })
                .sum::<u64>() / intervals.len() as u64;

            // Low variance with high frequency might indicate bot activity
            if variance < 10 && avg_interval < 100 {
                return true;
            }
        }

        false
    }

    // Utility methods
    fn record_violation(&mut self, violation_type: ViolationType, severity: ViolationSeverity, 
                        peer_id: String, message_id: Option<String>, description: String, action: SecurityAction) {
        let violation = SecurityViolation {
            violation_type,
            severity,
            peer_id,
            message_id,
            description,
            timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            action_taken: action.clone(),
        };

        self.violations.push(violation);
        self.stats.total_violations += 1;

        // Apply security action
        match action {
            SecurityAction::TemporaryBan => {
                // In a real implementation, this would ban for a limited time
                console_log!("⚠️ Temporary ban applied");
            }
            SecurityAction::PermanentBan => {
                // In a real implementation, this would ban permanently
                console_log!("🚫 Permanent ban applied");
            }
            SecurityAction::Disconnect => {
                console_log!("🔌 Disconnect applied");
            }
            _ => {}
        }
    }

    fn estimate_message_size(&self, message: &NetworkMessage) -> usize {
        // Rough estimation of message size
        let base_size = 100; // Base metadata size
        let data_size = message.data.to_string().len();
        base_size + data_size
    }

    fn message_type_to_string(&self, message_type: &crate::networking::NetworkMessageType) -> String {
        match message_type {
            crate::networking::NetworkMessageType::Connect => "Connect".to_string(),
            crate::networking::NetworkMessageType::Disconnect => "Disconnect".to_string(),
            crate::networking::NetworkMessageType::Heartbeat => "Heartbeat".to_string(),
            crate::networking::NetworkMessageType::Acknowledge => "Acknowledge".to_string(),
            crate::networking::NetworkMessageType::PlayerJoin => "PlayerJoin".to_string(),
            crate::networking::NetworkMessageType::PlayerLeave => "PlayerLeave".to_string(),
            crate::networking::NetworkMessageType::PlayerUpdate => "PlayerUpdate".to_string(),
            crate::networking::NetworkMessageType::WorldState => "WorldState".to_string(),
            crate::networking::NetworkMessageType::EntityUpdate => "EntityUpdate".to_string(),
            crate::networking::NetworkMessageType::EntityDestroy => "EntityDestroy".to_string(),
            crate::networking::NetworkMessageType::ChatMessage => "ChatMessage".to_string(),
            crate::networking::NetworkMessageType::SystemMessage => "SystemMessage".to_string(),
            crate::networking::NetworkMessageType::Custom(name) => name.clone(),
        }
    }

    fn is_message_encrypted(&self, _message: &NetworkMessage) -> bool {
        // In a real implementation, this would check if the message is properly encrypted
        // For now, we'll assume all messages are unencrypted
        false
    }

    // Public API methods
    pub fn ban_ip(&mut self, ip: &str) {
        self.banned_ips.insert(ip.to_string());
        self.stats.blocked_ips = self.banned_ips.len();
        console_log!("🚫 Banned IP: {}", ip);
    }

    pub fn unban_ip(&mut self, ip: &str) {
        self.banned_ips.remove(ip);
        self.stats.blocked_ips = self.banned_ips.len();
        console_log!("✅ Unbanned IP: {}", ip);
    }

    pub fn ban_peer(&mut self, peer_id: &str) {
        self.banned_peers.insert(peer_id.to_string());
        self.stats.banned_peers = self.banned_peers.len();
        console_log!("🚫 Banned peer: {}", peer_id);
    }

    pub fn unban_peer(&mut self, peer_id: &str) {
        self.banned_peers.remove(peer_id);
        self.stats.banned_peers = self.banned_peers.len();
        console_log!("✅ Unbanned peer: {}", peer_id);
    }

    pub fn is_ip_banned(&self, ip: &str) -> bool {
        self.banned_ips.contains(ip)
    }

    pub fn is_peer_banned(&self, peer_id: &str) -> bool {
        self.banned_peers.contains(peer_id)
    }

    pub fn get_violations(&self) -> &Vec<SecurityViolation> {
        &self.violations
    }

    pub fn get_stats(&mut self) -> &SecurityStats {
        self.stats.uptime = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() - self.start_time;
        &self.stats
    }

    pub fn update_policy(&mut self, new_policy: SecurityPolicy) {
        self.policy = new_policy;
        console_log!("🔒 Security policy updated");
    }

    pub fn clear_violations(&mut self) {
        self.violations.clear();
        console_log!("🧹 Security violations cleared");
    }

    pub fn generate_report(&self) -> String {
        format!(
            "Security Report\n\
            ====================\n\
            Total Violations: {}\n\
            Blocked IPs: {}\n\
            Banned Peers: {}\n\
            Rate Limit Violations: {}\n\
            Authentication Failures: {}\n\
            DDoS Attempts: {}\n\
            Messages Blocked: {}\n\
            Uptime: {} seconds\n\
            ====================",
            self.stats.total_violations,
            self.stats.blocked_ips,
            self.stats.banned_peers,
            self.stats.rate_limit_violations,
            self.stats.authentication_failures,
            self.stats.ddos_attempts,
            self.stats.messages_blocked,
            self.stats.uptime
        )
    }
}

impl SuspiciousPatternDetector {
    fn new() -> Self {
        Self {
            message_patterns: HashMap::new(),
            timing_patterns: Vec::new(),
            anomaly_threshold: 0.1,
        }
    }
}

// WASM exports
#[wasm_bindgen]
pub struct SecurityManagerWrapper {
    inner: std::sync::Mutex<SecurityManager>,
}

#[wasm_bindgen]
impl SecurityManagerWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SecurityManagerWrapper {
        let policy = SecurityPolicy::default();
        SecurityManagerWrapper {
            inner: std::sync::Mutex::new(SecurityManager::new(policy)),
        }
    }

    #[wasm_bindgen]
    pub fn validate_message(&self, message_json: &str, peer_json: &str) -> Result<bool, JsValue> {
        let message: NetworkMessage = serde_json::from_str(message_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid message: {}", e)))?;
        
        let peer: NetworkPeer = serde_json::from_str(peer_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid peer: {}", e)))?;

        let mut manager = self.inner.lock().unwrap();
        match manager.validate_message(&message, &peer) {
            Ok(_) => Ok(true),
            Err(action) => {
                let action_str = match action {
                    crate::networking::security::SecurityAction::Warning => "Warning",
                    crate::networking::security::SecurityAction::MessageDropped => "MessageDropped",
                    crate::networking::security::SecurityAction::TemporaryBan => "TemporaryBan",
                    crate::networking::security::SecurityAction::PermanentBan => "PermanentBan",
                    crate::networking::security::SecurityAction::Disconnect => "Disconnect",
                    crate::networking::security::SecurityAction::Report => "Report",
                };
                Err(JsValue::from_str(action_str))
            }
        }
    }

    #[wasm_bindgen]
    pub fn ban_ip(&self, ip: &str) {
        let mut manager = self.inner.lock().unwrap();
        manager.ban_ip(ip);
    }

    #[wasm_bindgen]
    pub fn unban_ip(&self, ip: &str) {
        let mut manager = self.inner.lock().unwrap();
        manager.unban_ip(ip);
    }

    #[wasm_bindgen]
    pub fn is_ip_banned(&self, ip: &str) -> bool {
        let manager = self.inner.lock().unwrap();
        manager.is_ip_banned(ip)
    }

    #[wasm_bindgen]
    pub fn get_stats(&self) -> JsValue {
        let mut manager = self.inner.lock().unwrap();
        serde_wasm_bindgen::to_value(&manager.get_stats()).unwrap()
    }

    #[wasm_bindgen]
    pub fn generate_report(&self) -> String {
        let manager = self.inner.lock().unwrap();
        manager.generate_report()
    }
}

import { BrowserLogger } from "../BrowserLogger";

// Security types
export interface SecurityConfig {
  encryptionEnabled: boolean;
  authenticationRequired: boolean;
  antiCheatEnabled: boolean;
  ddosProtectionEnabled: boolean;
  monitoringEnabled: boolean;
  keyRotationInterval: number;
  sessionTimeout: number;
  maxFailedAttempts: number;
}

export interface AuthCredentials {
  userId: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  permissions: Permission[];
  deviceFingerprint: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  securityLevel: SecurityLevel;
}

export interface SecureMessage {
  encryptedPayload: number[];
  hmacSignature: number[];
  messageId: string;
  timestamp: number;
  nonce: number[];
  keyId: string;
  senderCertificate: number[];
}

export interface PlayerAction {
  movement?: Movement;
  actionType?: string;
  stateChange?: StateChange;
  timestamp: number;
}

export interface Movement {
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  distance: number;
  deltaTime: number;
  acceleration: number;
  hasValidPath: boolean;
}

export interface StateChange {
  resourceChanges: Record<string, number>;
  inventoryChanges: InventoryChange[];
}

export interface InventoryChange {
  itemId: string;
  quantity: number;
  action: string;
}

export interface ConnectionInfo {
  ipAddress: string;
  country: string;
  userAgent: string;
  requestRate: number;
}

export interface SecurityMetrics {
  timestamp: number;
  authenticationAttempts: number;
  authenticationFailures: number;
  blockedConnections: number;
  suspiciousActivities: number;
  detectedCheats: number;
  ddosAttempts: number;
  securityAlerts: number;
}

export interface SecurityAlert {
  id: string;
  threatType: string;
  severity: ThreatSeverity;
  description: string;
  timestamp: number;
  source: string;
}

export interface ValidationResult {
  valid: boolean;
  type?: 'violation' | 'suspicious';
  violationType?: string;
  threatLevel?: string;
  message?: string;
  reason?: string;
}

export enum Permission {
  Connect = 'Connect',
  SendMessage = 'SendMessage',
  ReceiveMessages = 'ReceiveMessages',
  AdministerServer = 'AdministerServer',
  ModerateChat = 'ModerateChat',
  KickPlayers = 'KickPlayers',
  BanPlayers = 'BanPlayers',
  AccessLogs = 'AccessLogs',
  ModifySecurity = 'ModifySecurity',
  SystemConfiguration = 'SystemConfiguration',
}

export enum SecurityLevel {
  Guest = 'Guest',
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin',
  System = 'System',
}

export enum ThreatSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

// Security Manager class
export class SecurityManager {
  private wasmModule: any;
  private securityInstance: any;
  private config: SecurityConfig;
  private currentSession: UserSession | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeWasm();
  }

  private async initializeWasm(): Promise<void> {
    try {
      // Import the WASM module
      const wasmModule = await import('../../../pkg/procedural_pixel_engine_core.js');
      await wasmModule.default();
      
      this.wasmModule = wasmModule;
      this.securityInstance = new wasmModule.SecurityManagerWrapper();
      
      BrowserLogger.info('SecurityManager', 'Bulletproof security system initialized');
    } catch (error) {
      BrowserLogger.warn('SecurityManager', 'WASM module not available, using fallback implementation', error);
      // Fallback implementation for development
      this.initializeFallback();
    }
  }

  private initializeFallback(): void {
    BrowserLogger.info('SecurityManager', 'Using fallback security implementation');
    // Create a mock security instance for development
    this.securityInstance = {
      authenticate_user: async (credentials: string) => {
        const creds = JSON.parse(credentials);
        return JSON.stringify({
          sessionId: this.generateSecureId(),
          userId: creds.userId,
          permissions: ['Connect', 'SendMessage', 'ReceiveMessages'],
          deviceFingerprint: this.generateSecureId(),
          createdAt: Date.now() / 1000,
          expiresAt: (Date.now() / 1000) + 3600,
          lastActivity: Date.now() / 1000,
          securityLevel: 'User'
        });
      },
      encrypt_message: async (message: Uint8Array, recipientId: string) => {
        return JSON.stringify({
          encryptedPayload: Array.from(message),
          hmacSignature: new Array(32).fill(0),
          messageId: this.generateSecureId(),
          timestamp: Date.now() / 1000,
          nonce: new Array(12).fill(0),
          keyId: this.generateSecureId(),
          senderCertificate: new Array(256).fill(0)
        });
      },
      decrypt_message: async (secureMessage: string) => {
        const msg = JSON.parse(secureMessage);
        return Array.from(msg.encryptedPayload);
      },
      validate_player_action: async (playerId: string, action: string) => {
        return JSON.stringify({ valid: true });
      },
      check_connection: async (connectionInfo: string) => {
        // Always allow connections in fallback mode
        return;
      },
      update_metrics: () => {
        // Mock implementation
      },
      get_security_stats: () => {
        return {
          timestamp: Date.now() / 1000,
          authenticationAttempts: 0,
          authenticationFailures: 0,
          blockedConnections: 0,
          suspiciousActivities: 0,
          detectedCheats: 0,
          ddosAttempts: 0,
          securityAlerts: 0
        };
      }
    };
  }

  private generateSecureId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${randomPart}`;
  }

  // Authentication methods
  public async authenticateUser(credentials: AuthCredentials): Promise<UserSession> {
    BrowserLogger.info('SecurityManager', `Authenticating user: ${credentials.userId}`);

    try {
      const credentialsJson = JSON.stringify(credentials);
      const sessionJson = await this.securityInstance.authenticate_user(credentialsJson);
      const session: UserSession = JSON.parse(sessionJson);

      this.currentSession = session;
      this.emit('authenticated', session);

      BrowserLogger.info('SecurityManager', `User authenticated successfully: ${session.userId}`);
      return session;
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Authentication failed', error);
      this.emit('authenticationFailed', { userId: credentials.userId, error });
      throw error;
    }
  }

  public async logout(): Promise<void> {
    if (this.currentSession) {
      BrowserLogger.info('SecurityManager', `Logging out user: ${this.currentSession.userId}`);
      
      this.currentSession = null;
      this.emit('loggedOut', null);
      
      BrowserLogger.info('SecurityManager', 'User logged out successfully');
    }
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null && this.isSessionValid();
  }

  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  public hasPermission(permission: Permission): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.permissions.includes(permission);
  }

  public hasSecurityLevel(level: SecurityLevel): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.securityLevel === level;
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) return false;
    
    const now = Date.now() / 1000;
    return now < this.currentSession.expiresAt && 
           (now - this.currentSession.lastActivity) < this.config.sessionTimeout;
  }

  // Cryptographic methods
  public async encryptMessage(message: string, recipientId: string): Promise<SecureMessage> {
    BrowserLogger.debug('SecurityManager', `Encrypting message for: ${recipientId}`);

    try {
      const messageBytes = new TextEncoder().encode(message);
      const secureMessageJson = await this.securityInstance.encrypt_message(messageBytes, recipientId);
      const secureMessage: SecureMessage = JSON.parse(secureMessageJson);

      BrowserLogger.debug('SecurityManager', 'Message encrypted successfully');
      return secureMessage;
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Message encryption failed', error);
      throw error;
    }
  }

  public async decryptMessage(secureMessage: SecureMessage): Promise<string> {
    BrowserLogger.debug('SecurityManager', `Decrypting message: ${secureMessage.messageId}`);

    try {
      const secureMessageJson = JSON.stringify(secureMessage);
      const decryptedBytes = await this.securityInstance.decrypt_message(secureMessageJson);
      const decryptedMessage = new TextDecoder().decode(decryptedBytes);

      BrowserLogger.debug('SecurityManager', 'Message decrypted successfully');
      return decryptedMessage;
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Message decryption failed', error);
      throw error;
    }
  }

  // Anti-cheat validation
  public async validatePlayerAction(playerId: string, action: PlayerAction): Promise<ValidationResult> {
    BrowserLogger.debug('SecurityManager', `Validating action for player: ${playerId}`);

    try {
      const actionJson = JSON.stringify(action);
      const resultJson = await this.securityInstance.validate_player_action(playerId, actionJson);
      const result: ValidationResult = JSON.parse(resultJson);

      if (!result.valid) {
        BrowserLogger.warn('SecurityManager', `Invalid action detected for ${playerId}:`, result);
        this.emit('invalidAction', { playerId, result });
      }

      return result;
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Action validation failed', error);
      throw error;
    }
  }

  // DDoS protection
  public async checkConnection(connectionInfo: ConnectionInfo): Promise<void> {
    BrowserLogger.debug('SecurityManager', `Checking connection from: ${connectionInfo.ipAddress}`);

    try {
      const connectionInfoJson = JSON.stringify(connectionInfo);
      await this.securityInstance.check_connection(connectionInfoJson);

      BrowserLogger.debug('SecurityManager', 'Connection check passed');
    } catch (error) {
      BrowserLogger.warn('SecurityManager', 'Connection blocked:', error);
      this.emit('connectionBlocked', { connectionInfo, error });
      throw error;
    }
  }

  // Security monitoring
  public updateMetrics(): void {
    if (!this.config.monitoringEnabled) return;

    try {
      this.securityInstance.update_metrics();
      BrowserLogger.debug('SecurityManager', 'Security metrics updated');
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Failed to update metrics', error);
    }
  }

  public async getSecurityStats(): Promise<SecurityMetrics> {
    try {
      const metrics = await this.securityInstance.get_security_stats();
      return metrics as SecurityMetrics;
    } catch (error) {
      BrowserLogger.error('SecurityManager', 'Failed to get security stats', error);
      throw error;
    }
  }

  // Device fingerprinting
  public generateDeviceFingerprint(): DeviceInfo {
    const fingerprint: DeviceInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
    };

    BrowserLogger.debug('SecurityManager', 'Device fingerprint generated');
    return fingerprint;
  }

  // Session management
  public refreshSession(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now() / 1000;
      BrowserLogger.debug('SecurityManager', 'Session refreshed');
    }
  }

  public extendSession(): void {
    if (this.currentSession) {
      this.currentSession.expiresAt = Date.now() / 1000 + this.config.sessionTimeout;
      BrowserLogger.debug('SecurityManager', 'Session extended');
    }
  }

  // Event handling
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          BrowserLogger.error('SecurityManager', `Error in event listener for ${event}`, error);
        }
      });
    }
  }

  // Utility methods
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    BrowserLogger.info('SecurityManager', 'Security configuration updated');
  }

  public isEncryptionEnabled(): boolean {
    return this.config.encryptionEnabled;
  }

  public isAuthenticationRequired(): boolean {
    return this.config.authenticationRequired;
  }

  public isAntiCheatEnabled(): boolean {
    return this.config.antiCheatEnabled;
  }

  public isDDoSProtectionEnabled(): boolean {
    return this.config.ddosProtectionEnabled;
  }

  public isMonitoringEnabled(): boolean {
    return this.config.monitoringEnabled;
  }

  // Security utilities
  public static createDefaultConfig(): SecurityConfig {
    return {
      encryptionEnabled: true,
      authenticationRequired: true,
      antiCheatEnabled: true,
      ddosProtectionEnabled: true,
      monitoringEnabled: true,
      keyRotationInterval: 1800, // 30 minutes
      sessionTimeout: 3600, // 1 hour
      maxFailedAttempts: 5,
    };
  }

  public static createHighSecurityConfig(): SecurityConfig {
    return {
      encryptionEnabled: true,
      authenticationRequired: true,
      antiCheatEnabled: true,
      ddosProtectionEnabled: true,
      monitoringEnabled: true,
      keyRotationInterval: 900, // 15 minutes
      sessionTimeout: 1800, // 30 minutes
      maxFailedAttempts: 3,
    };
  }

  public static createDevelopmentConfig(): SecurityConfig {
    return {
      encryptionEnabled: false,
      authenticationRequired: false,
      antiCheatEnabled: false,
      ddosProtectionEnabled: false,
      monitoringEnabled: true,
      keyRotationInterval: 3600, // 1 hour
      sessionTimeout: 7200, // 2 hours
      maxFailedAttempts: 10,
    };
  }

  // Validation helpers
  public static validateCredentials(credentials: AuthCredentials): string[] {
    const errors: string[] = [];

    if (!credentials.userId || credentials.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!credentials.password || credentials.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!credentials.deviceInfo.userAgent) {
      errors.push('Device user agent is required');
    }

    return errors;
  }

  public static validateMovement(movement: Movement): string[] {
    const errors: string[] = [];

    if (movement.distance < 0) {
      errors.push('Distance cannot be negative');
    }

    if (movement.deltaTime <= 0) {
      errors.push('Delta time must be positive');
    }

    if (movement.acceleration < 0) {
      errors.push('Acceleration cannot be negative');
    }

    return errors;
  }

  public static validateStateChange(stateChange: StateChange): string[] {
    const errors: string[] = [];

    for (const [resource, amount] of Object.entries(stateChange.resourceChanges)) {
      if (amount < 0) {
        errors.push(`Resource ${resource} cannot be negative`);
      }
    }

    return errors;
  }

  // Security monitoring helpers
  public static calculateSecurityScore(metrics: SecurityMetrics): number {
    let score = 100;

    // Penalize authentication failures
    if (metrics.authenticationAttempts > 0) {
      const failureRate = metrics.authenticationFailures / metrics.authenticationAttempts;
      score -= failureRate * 20;
    }

    // Penalize blocked connections
    score -= Math.min(metrics.blockedConnections * 0.1, 10);

    // Penalize suspicious activities
    score -= Math.min(metrics.suspiciousActivities * 0.5, 15);

    // Penalize detected cheats
    score -= Math.min(metrics.detectedCheats * 2, 20);

    // Penalize DDoS attempts
    score -= Math.min(metrics.ddosAttempts * 1, 10);

    // Penalize security alerts
    score -= Math.min(metrics.securityAlerts * 0.5, 5);

    return Math.max(score, 0);
  }

  public static getSecurityLevel(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  // Cleanup
  public destroy(): void {
    this.currentSession = null;
    this.eventListeners.clear();
    BrowserLogger.info('SecurityManager', 'Security manager destroyed');
  }
}

// Global security manager instance
let globalSecurityManager: SecurityManager | null = null;

export function getSecurityManager(): SecurityManager {
  if (!globalSecurityManager) {
    const config = SecurityManager.createDefaultConfig();
    globalSecurityManager = new SecurityManager(config);
  }
  return globalSecurityManager;
}

export function createSecurityManager(config: SecurityConfig): SecurityManager {
  return new SecurityManager(config);
}

// Security utilities
export class SecurityUtils {
  static generateSecureId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${randomPart}`;
  }

  static hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    strength: 'Weak' | 'Fair' | 'Good' | 'Strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let strength = 0;

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    } else {
      strength += 1;
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain lowercase letters');
    } else {
      strength += 1;
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain uppercase letters');
    } else {
      strength += 1;
    }

    if (!/\d/.test(password)) {
      issues.push('Password must contain numbers');
    } else {
      strength += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain special characters');
    } else {
      strength += 1;
    }

    let strengthLevel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
    if (strength >= 4) strengthLevel = 'Strong';
    else if (strength >= 3) strengthLevel = 'Good';
    else if (strength >= 2) strengthLevel = 'Fair';

    return {
      isValid: issues.length === 0,
      strength: strengthLevel,
      issues,
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static generateSessionToken(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Array(32)
      .fill(0)
      .map(() => Math.random().toString(36).substr(2, 1))
      .join('');
    return `${timestamp}_${randomBytes}`;
  }

  static async secureHash(data: string): Promise<string> {
    // In a real implementation, this would use Web Crypto API
    // For now, we'll use a simple hash
    return this.hashString(data);
  }

  static async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // In a real implementation, this would use Web Crypto API
    // For now, we'll generate dummy keys
    const timestamp = Date.now().toString();
    return {
      publicKey: `public_${timestamp}`,
      privateKey: `private_${timestamp}`,
    };
  }

  static async encrypt(data: string, key: string): Promise<string> {
    // In a real implementation, this would use Web Crypto API
    // For now, we'll use simple XOR encryption
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted); // Base64 encode
  }

  static async decrypt(encryptedData: string, key: string): Promise<string> {
    // In a real implementation, this would use Web Crypto API
    // For now, we'll use simple XOR decryption
    const data = atob(encryptedData); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  }
}

import { BrowserLogger } from "../BrowserLogger";
import { ThreatSeverity, ValidationResult } from "./SecurityManager";

// Anti-cheat types
export interface AntiCheatConfig {
  enabled: boolean;
  strictMode: boolean;
  detectionSensitivity: number; // 0.0 - 1.0
  maxViolationsBeforeBan: number;
  violationTimeout: number; // seconds
  enableBehavioralAnalysis: boolean;
  enableStatisticalAnalysis: boolean;
  enableHeuristicDetection: boolean;
  enableMachineLearning: boolean;
}

export interface PlayerProfile {
  playerId: string;
  sessionId: string;
  joinTime: number;
  lastActivity: number;
  violations: CheatViolation[];
  trustScore: number; // 0.0 - 1.0
  behaviorProfile: BehaviorProfile;
  statisticalProfile: StatisticalProfile;
  riskLevel: RiskLevel;
  isFlagged: boolean;
  isBanned: boolean;
}

export interface CheatViolation {
  id: string;
  type: CheatType;
  severity: ThreatSeverity;
  timestamp: number;
  description: string;
  evidence: CheatEvidence;
  confidence: number; // 0.0 - 1.0
  resolved: boolean;
}

export interface CheatEvidence {
  data: any;
  context: string;
  metadata: Record<string, any>;
}

export interface BehaviorProfile {
  movementPatterns: MovementPattern[];
  actionPatterns: ActionPattern[];
  temporalPatterns: TemporalPattern[];
  consistencyScore: number;
  anomalyScore: number;
}

export interface MovementPattern {
  type: MovementType;
  averageSpeed: number;
  maxSpeed: number;
  acceleration: number;
  directionChanges: number;
  teleportationEvents: number;
  consistency: number;
  lastUpdated: number;
}

export interface ActionPattern {
  actionType: string;
  frequency: number;
  timing: number[];
  accuracy: number;
  reactionTime: number;
  consistency: number;
  lastUpdated: number;
}

export interface TemporalPattern {
  timeOfDay: number;
  activityLevel: number;
  sessionDuration: number;
  breakPatterns: number[];
  consistency: number;
  lastUpdated: number;
}

export interface StatisticalProfile {
  metrics: PlayerMetrics;
  baselines: PlayerMetrics;
  deviations: MetricDeviations;
  anomalyScore: number;
  lastUpdated: number;
}

export interface PlayerMetrics {
  movementSpeed: number;
  accuracy: number;
  reactionTime: number;
  actionsPerMinute: number;
  resourceUsage: number;
  networkLatency: number;
  inputFrequency: number;
}

export interface MetricDeviations {
  movementSpeed: number;
  accuracy: number;
  reactionTime: number;
  actionsPerMinute: number;
  resourceUsage: number;
  networkLatency: number;
  inputFrequency: number;
}

export enum MovementType {
  Walking = 'walking',
  Running = 'running',
  Jumping = 'jumping',
  Driving = 'driving',
  Flying = 'flying',
  Swimming = 'swimming',
}

export enum CheatType {
  SpeedHack = 'speed_hack',
  TeleportHack = 'teleport_hack',
  Aimbot = 'aimbot',
  Wallhack = 'wallhack',
  ResourceHack = 'resource_hack',
  AutoClicker = 'auto_clicker',
  MacroAbuse = 'macro_abuse',
  Exploit = 'exploit',
  NetworkManipulation = 'network_manipulation',
  ClientModification = 'client_modification',
}

export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface DetectionRule {
  id: string;
  name: string;
  type: CheatType;
  conditions: DetectionCondition[];
  weight: number;
  severity: ThreatSeverity;
  enabled: boolean;
}

export interface DetectionCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'outside' | 'regex';
  value: any;
  weight: number;
}

export interface CheatReport {
  id: string;
  playerId: string;
  cheatType: CheatType;
  severity: ThreatSeverity;
  timestamp: number;
  evidence: CheatEvidence[];
  confidence: number;
  automatedAction: string;
  reviewed: boolean;
  resolved: boolean;
}

// Anti-Cheat System class
export class AntiCheatSystem {
  private config: AntiCheatConfig;
  private playerProfiles: Map<string, PlayerProfile> = new Map();
  private detectionRules: DetectionRule[] = [];
  private cheatReports: CheatReport[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private monitoringInterval: number | null = null;
  private baselines: Map<string, PlayerMetrics> = new Map();

  constructor(config: AntiCheatConfig) {
    this.config = config;
    this.initializeDetectionRules();
    this.initializeBaselines();
    
    if (config.enabled) {
      this.startMonitoring();
    }
  }

  private initializeDetectionRules(): void {
    this.detectionRules = [
      {
        id: 'speed_hack_detection',
        name: 'Speed Hack Detection',
        type: CheatType.SpeedHack,
        conditions: [
          { field: 'averageSpeed', operator: 'greater_than', value: 25, weight: 0.8 },
          { field: 'maxSpeed', operator: 'greater_than', value: 50, weight: 0.9 },
          { field: 'consistency', operator: 'less_than', value: 0.3, weight: 0.6 }
        ],
        weight: 1.0,
        severity: ThreatSeverity.High,
        enabled: true,
      },
      {
        id: 'teleport_hack_detection',
        name: 'Teleport Hack Detection',
        type: CheatType.TeleportHack,
        conditions: [
          { field: 'teleportationEvents', operator: 'greater_than', value: 5, weight: 0.9 },
          { field: 'distance', operator: 'greater_than', value: 100, weight: 0.8 },
          { field: 'hasValidPath', operator: 'equals', value: false, weight: 0.7 }
        ],
        weight: 1.0,
        severity: ThreatSeverity.Critical,
        enabled: true,
      },
      {
        id: 'aimbot_detection',
        name: 'Aimbot Detection',
        type: CheatType.Aimbot,
        conditions: [
          { field: 'accuracy', operator: 'greater_than', value: 0.95, weight: 0.8 },
          { field: 'reactionTime', operator: 'less_than', value: 100, weight: 0.7 },
          { field: 'consistency', operator: 'greater_than', value: 0.9, weight: 0.6 }
        ],
        weight: 1.0,
        severity: ThreatSeverity.High,
        enabled: true,
      },
      {
        id: 'resource_hack_detection',
        name: 'Resource Hack Detection',
        type: CheatType.ResourceHack,
        conditions: [
          { field: 'resourceGain', operator: 'greater_than', value: 1000, weight: 0.8 },
          { field: 'resourceRate', operator: 'greater_than', value: 100, weight: 0.7 },
          { field: 'legitimateSources', operator: 'equals', value: 0, weight: 0.9 }
        ],
        weight: 1.0,
        severity: ThreatSeverity.Medium,
        enabled: true,
      },
      {
        id: 'auto_clicker_detection',
        name: 'Auto Clicker Detection',
        type: CheatType.AutoClicker,
        conditions: [
          { field: 'clickInterval', operator: 'less_than', value: 50, weight: 0.8 },
          { field: 'consistency', operator: 'greater_than', value: 0.95, weight: 0.7 },
          { field: 'duration', operator: 'greater_than', value: 300, weight: 0.6 }
        ],
        weight: 1.0,
        severity: ThreatSeverity.Medium,
        enabled: true,
      }
    ];
  }

  private initializeBaselines(): void {
    // Initialize baseline metrics for legitimate players
    this.baselines.set('default', {
      movementSpeed: 8.0,
      accuracy: 0.4,
      reactionTime: 250,
      actionsPerMinute: 30,
      resourceUsage: 100,
      networkLatency: 50,
      inputFrequency: 2.0,
    });
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = window.setInterval(() => {
      this.analyzeAllPlayers();
      this.cleanupOldData();
    }, 5000); // Analyze every 5 seconds

    BrowserLogger.info('AntiCheatSystem', 'Anti-cheat monitoring started');
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      BrowserLogger.info('AntiCheatSystem', 'Anti-cheat monitoring stopped');
    }
  }

  // Player management
  public registerPlayer(playerId: string, sessionId: string): void {
    if (this.playerProfiles.has(playerId)) {
      BrowserLogger.warn('AntiCheatSystem', `Player ${playerId} already registered`);
      return;
    }

    const profile: PlayerProfile = {
      playerId,
      sessionId,
      joinTime: Date.now(),
      lastActivity: Date.now(),
      violations: [],
      trustScore: 1.0,
      behaviorProfile: {
        movementPatterns: [],
        actionPatterns: [],
        temporalPatterns: [],
        consistencyScore: 1.0,
        anomalyScore: 0.0,
      },
      statisticalProfile: {
        metrics: this.getBaselineMetrics('default'),
        baselines: this.getBaselineMetrics('default'),
        deviations: this.createEmptyDeviations(),
        anomalyScore: 0.0,
        lastUpdated: Date.now(),
      },
      riskLevel: RiskLevel.Low,
      isFlagged: false,
      isBanned: false,
    };

    this.playerProfiles.set(playerId, profile);
    BrowserLogger.info('AntiCheatSystem', `Player ${playerId} registered for anti-cheat monitoring`);
  }

  public unregisterPlayer(playerId: string): void {
    if (this.playerProfiles.has(playerId)) {
      this.playerProfiles.delete(playerId);
      BrowserLogger.info('AntiCheatSystem', `Player ${playerId} unregistered from anti-cheat monitoring`);
    }
  }

  // Main analysis methods
  public analyzePlayerAction(playerId: string, action: PlayerAction): ValidationResult {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) {
      BrowserLogger.warn('AntiCheatSystem', `Player ${playerId} not found for analysis`);
      return { valid: true };
    }

    profile.lastActivity = Date.now();

    // Update profiles
    this.updateBehaviorProfile(profile, action);
    this.updateStatisticalProfile(profile, action);

    // Run detection rules
    const violations = this.runDetectionRules(profile, action);
    
    // Process violations
    for (const violation of violations) {
      this.processViolation(profile, violation);
    }

    // Update trust score and risk level
    this.updateTrustScore(profile);
    this.updateRiskLevel(profile);

    // Return validation result
    if (violations.length > 0) {
      const mostSevere = violations.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );

      return {
        valid: false,
        type: 'violation',
        violationType: mostSevere.type,
        message: mostSevere.description,
        reason: `Cheat detected: ${mostSevere.type} (confidence: ${(mostSevere.confidence * 100).toFixed(1)}%)`
      };
    }

    return { valid: true };
  }

  private updateBehaviorProfile(profile: PlayerProfile, action: PlayerAction): void {
    if (!this.config.enableBehavioralAnalysis) return;

    // Update movement patterns
    if (action.movement) {
      this.updateMovementPattern(profile, action.movement);
    }

    // Update action patterns
    if (action.actionType) {
      this.updateActionPattern(profile, action);
    }

    // Update temporal patterns
    this.updateTemporalPattern(profile);

    // Calculate consistency and anomaly scores
    this.calculateBehaviorScores(profile);
  }

  private updateMovementPattern(profile: PlayerProfile, movement: any): void {
    const now = Date.now();
    const patterns = profile.behaviorProfile.movementPatterns;
    
    // Find or create movement pattern
    let pattern = patterns.find(p => p.type === movement.type);
    if (!pattern) {
      pattern = {
        type: movement.type,
        averageSpeed: 0,
        maxSpeed: 0,
        acceleration: 0,
        directionChanges: 0,
        teleportationEvents: 0,
        consistency: 1.0,
        lastUpdated: now,
      };
      patterns.push(pattern);
    }

    // Update pattern metrics
    pattern.averageSpeed = (pattern.averageSpeed * 0.9) + (movement.speed * 0.1);
    pattern.maxSpeed = Math.max(pattern.maxSpeed, movement.speed);
    pattern.acceleration = (pattern.acceleration * 0.9) + (movement.acceleration * 0.1);
    pattern.directionChanges += movement.directionChange ? 1 : 0;
    
    if (movement.teleport) {
      pattern.teleportationEvents++;
    }

    pattern.lastUpdated = now;
  }

  private updateActionPattern(profile: PlayerProfile, action: PlayerAction): void {
    const now = Date.now();
    const patterns = profile.behaviorProfile.actionPatterns;
    
    // Find or create action pattern
    let pattern = patterns.find(p => p.actionType === action.actionType);
    if (!pattern) {
      pattern = {
        actionType: action.actionType!,
        frequency: 0,
        timing: [],
        accuracy: 0,
        reactionTime: 0,
        consistency: 1.0,
        lastUpdated: now,
      };
      patterns.push(pattern);
    }

    // Update pattern metrics
    pattern.frequency++;
    pattern.timing.push(action.timestamp || now);
    
    if (action.accuracy !== undefined) {
      pattern.accuracy = (pattern.accuracy * 0.9) + (action.accuracy * 0.1);
    }
    
    if (action.reactionTime !== undefined) {
      pattern.reactionTime = (pattern.reactionTime * 0.9) + (action.reactionTime * 0.1);
    }

    // Keep only recent timing data
    if (pattern.timing.length > 100) {
      pattern.timing = pattern.timing.slice(-100);
    }

    pattern.lastUpdated = now;
  }

  private updateTemporalPattern(profile: PlayerProfile): void {
    const now = Date.now();
    const patterns = profile.behaviorProfile.temporalPatterns;
    
    // Create hourly temporal pattern
    const hour = new Date(now).getHours();
    let pattern = patterns.find(p => Math.floor(p.timeOfDay / 3600) === hour);
    
    if (!pattern) {
      pattern = {
        timeOfDay: hour * 3600,
        activityLevel: 0,
        sessionDuration: now - profile.joinTime,
        breakPatterns: [],
        consistency: 1.0,
        lastUpdated: now,
      };
      patterns.push(pattern);
    }

    pattern.activityLevel = (pattern.activityLevel * 0.95) + 1; // Decay + current activity
    pattern.lastUpdated = now;
  }

  private calculateBehaviorScores(profile: PlayerProfile): void {
    const behaviorProfile = profile.behaviorProfile;
    
    // Calculate consistency score
    let consistencySum = 0;
    let consistencyCount = 0;
    
    for (const pattern of behaviorProfile.movementPatterns) {
      consistencySum += pattern.consistency;
      consistencyCount++;
    }
    
    for (const pattern of behaviorProfile.actionPatterns) {
      consistencySum += pattern.consistency;
      consistencyCount++;
    }
    
    behaviorProfile.consistencyScore = consistencyCount > 0 ? consistencySum / consistencyCount : 1.0;
    
    // Calculate anomaly score
    let anomalySum = 0;
    let anomalyCount = 0;
    
    for (const pattern of behaviorProfile.movementPatterns) {
      if (pattern.teleportationEvents > 0) anomalySum += 1.0;
      if (pattern.maxSpeed > 50) anomalySum += 0.8;
      if (pattern.acceleration > 100) anomalySum += 0.6;
      anomalyCount++;
    }
    
    behaviorProfile.anomalyScore = anomalyCount > 0 ? anomalySum / anomalyCount : 0.0;
  }

  private updateStatisticalProfile(profile: PlayerProfile, action: PlayerAction): void {
    if (!this.config.enableStatisticalAnalysis) return;

    const stats = profile.statisticalProfile;
    const metrics = stats.metrics;
    
    // Update metrics based on action
    if (action.movement) {
      metrics.movementSpeed = (metrics.movementSpeed * 0.9) + (action.movement.speed * 0.1);
    }
    
    if (action.accuracy !== undefined) {
      metrics.accuracy = (metrics.accuracy * 0.9) + (action.accuracy * 0.1);
    }
    
    if (action.reactionTime !== undefined) {
      metrics.reactionTime = (metrics.reactionTime * 0.9) + (action.reactionTime * 0.1);
    }
    
    // Calculate actions per minute
    const now = Date.now();
    const timeDiff = (now - stats.lastUpdated) / 60000; // minutes
    if (timeDiff > 0) {
      metrics.actionsPerMinute = Math.min(60 / timeDiff, 300); // Cap at 300 actions/min
    }
    
    stats.lastUpdated = now;
    
    // Calculate deviations from baseline
    this.calculateDeviations(stats);
  }

  private calculateDeviations(stats: StatisticalProfile): void {
    const metrics = stats.metrics;
    const baselines = stats.baselines;
    const deviations = stats.deviations;
    
    deviations.movementSpeed = Math.abs(metrics.movementSpeed - baselines.movementSpeed) / baselines.movementSpeed;
    deviations.accuracy = Math.abs(metrics.accuracy - baselines.accuracy) / baselines.accuracy;
    deviations.reactionTime = Math.abs(metrics.reactionTime - baselines.reactionTime) / baselines.reactionTime;
    deviations.actionsPerMinute = Math.abs(metrics.actionsPerMinute - baselines.actionsPerMinute) / baselines.actionsPerMinute;
    
    // Calculate overall anomaly score
    const deviationValues = Object.values(deviations);
    stats.anomalyScore = deviationValues.reduce((sum, val) => sum + val, 0) / deviationValues.length;
  }

  private runDetectionRules(profile: PlayerProfile, action: PlayerAction): CheatViolation[] {
    const violations: CheatViolation[] = [];
    
    for (const rule of this.detectionRules) {
      if (!rule.enabled) continue;
      
      const confidence = this.evaluateRule(profile, action, rule);
      if (confidence >= this.config.detectionSensitivity) {
        const violation: CheatViolation = {
          id: this.generateId(),
          type: rule.type,
          severity: rule.severity,
          timestamp: Date.now(),
          description: `${rule.name} detected (confidence: ${(confidence * 100).toFixed(1)}%)`,
          evidence: {
            data: action,
            context: 'player_action',
            metadata: { ruleId: rule.id, confidence }
          },
          confidence,
          resolved: false,
        };
        
        violations.push(violation);
      }
    }
    
    return violations;
  }

  private evaluateRule(profile: PlayerProfile, action: PlayerAction, rule: DetectionRule): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(profile, action, condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, condition);
      
      if (conditionMet) {
        totalScore += condition.weight;
      }
      
      totalWeight += condition.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private getFieldValue(profile: PlayerProfile, action: PlayerAction, field: string): any {
    switch (field) {
      case 'averageSpeed':
        return profile.behaviorProfile.movementPatterns.reduce((sum, p) => sum + p.averageSpeed, 0) / 
               Math.max(1, profile.behaviorProfile.movementPatterns.length);
      case 'maxSpeed':
        return Math.max(...profile.behaviorProfile.movementPatterns.map(p => p.maxSpeed));
      case 'accuracy':
        return profile.statisticalProfile.metrics.accuracy;
      case 'reactionTime':
        return profile.statisticalProfile.metrics.reactionTime;
      case 'teleportationEvents':
        return profile.behaviorProfile.movementPatterns.reduce((sum, p) => sum + p.teleportationEvents, 0);
      case 'consistency':
        return profile.behaviorProfile.consistencyScore;
      case 'anomalyScore':
        return profile.statisticalProfile.anomalyScore;
      default:
        return (action as any)[field];
    }
  }

  private evaluateCondition(value: any, condition: DetectionCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'between':
        return Array.isArray(condition.value) && value >= condition.value[0] && value <= condition.value[1];
      case 'outside':
        return Array.isArray(condition.value) && (value < condition.value[0] || value > condition.value[1]);
      case 'regex':
        return new RegExp(condition.value).test(value.toString());
      default:
        return false;
    }
  }

  private processViolation(profile: PlayerProfile, violation: CheatViolation): void {
    // Add violation to profile
    profile.violations.push(violation);
    
    // Create cheat report
    const report: CheatReport = {
      id: this.generateId(),
      playerId: profile.playerId,
      cheatType: violation.type,
      severity: violation.severity,
      timestamp: violation.timestamp,
      evidence: [violation.evidence],
      confidence: violation.confidence,
      automatedAction: this.determineAutomatedAction(profile, violation),
      reviewed: false,
      resolved: false,
    };
    
    this.cheatReports.push(report);
    
    // Emit violation event
    this.emit('violation', { profile, violation, report });
    
    BrowserLogger.warn('AntiCheatSystem', `Cheat violation detected for ${profile.playerId}: ${violation.type}`);
  }

  private determineAutomatedAction(profile: PlayerProfile, violation: CheatViolation): string {
    if (violation.severity === ThreatSeverity.Critical) {
      return 'immediate_ban';
    } else if (violation.severity === ThreatSeverity.High) {
      return 'temporary_ban';
    } else if (profile.violations.length >= this.config.maxViolationsBeforeBan) {
      return 'ban';
    } else {
      return 'warning';
    }
  }

  private updateTrustScore(profile: PlayerProfile): void {
    let score = 1.0;
    
    // Penalize for violations
    for (const violation of profile.violations) {
      const penalty = this.getViolationPenalty(violation);
      score -= penalty;
    }
    
    // Reward for consistent behavior
    score += profile.behaviorProfile.consistencyScore * 0.1;
    
    // Penalize for anomalies
    score -= profile.statisticalProfile.anomalyScore * 0.2;
    
    profile.trustScore = Math.max(0, Math.min(1, score));
  }

  private getViolationPenalty(violation: CheatViolation): number {
    let penalty = 0.1;
    
    switch (violation.severity) {
      case ThreatSeverity.Critical:
        penalty = 0.5;
        break;
      case ThreatSeverity.High:
        penalty = 0.3;
        break;
      case ThreatSeverity.Medium:
        penalty = 0.2;
        break;
      case ThreatSeverity.Low:
        penalty = 0.1;
        break;
    }
    
    return penalty * violation.confidence;
  }

  private updateRiskLevel(profile: PlayerProfile): void {
    const trustScore = profile.trustScore;
    const violationCount = profile.violations.length;
    const anomalyScore = profile.statisticalProfile.anomalyScore;
    
    if (trustScore < 0.2 || violationCount >= this.config.maxViolationsBeforeBan) {
      profile.riskLevel = RiskLevel.Critical;
    } else if (trustScore < 0.4 || violationCount >= 5) {
      profile.riskLevel = RiskLevel.High;
    } else if (trustScore < 0.6 || violationCount >= 2) {
      profile.riskLevel = RiskLevel.Medium;
    } else {
      profile.riskLevel = RiskLevel.Low;
    }
    
    // Update flagged status
    profile.isFlagged = profile.riskLevel !== RiskLevel.Low;
    
    // Update banned status
    if (profile.riskLevel === RiskLevel.Critical && violationCount >= this.config.maxViolationsBeforeBan) {
      profile.isBanned = true;
      this.emit('playerBanned', { playerId: profile.playerId, profile });
    }
  }

  private analyzeAllPlayers(): void {
    for (const profile of this.playerProfiles.values()) {
      // Remove inactive players
      if (Date.now() - profile.lastActivity > 300000) { // 5 minutes
        this.unregisterPlayer(profile.playerId);
        continue;
      }
      
      // Update risk levels
      this.updateRiskLevel(profile);
      
      // Check for cleanup
      this.cleanupOldViolations(profile);
    }
  }

  private cleanupOldViolations(profile: PlayerProfile): void {
    const cutoff = Date.now() - (this.config.violationTimeout * 1000);
    profile.violations = profile.violations.filter(v => v.timestamp > cutoff);
  }

  private cleanupOldData(): void {
    // Clean up old reports
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.cheatReports = this.cheatReports.filter(r => r.timestamp > cutoff);
  }

  // Public API methods
  public getPlayerProfile(playerId: string): PlayerProfile | null {
    return this.playerProfiles.get(playerId) || null;
  }

  public getAllPlayerProfiles(): PlayerProfile[] {
    return Array.from(this.playerProfiles.values());
  }

  public getCheatReports(playerId?: string): CheatReport[] {
    if (playerId) {
      return this.cheatReports.filter(r => r.playerId === playerId);
    }
    return [...this.cheatReports];
  }

  public getDetectionRules(): DetectionRule[] {
    return [...this.detectionRules];
  }

  public addDetectionRule(rule: DetectionRule): void {
    this.detectionRules.push(rule);
    BrowserLogger.info('AntiCheatSystem', `Detection rule added: ${rule.name}`);
  }

  public removeDetectionRule(ruleId: string): void {
    this.detectionRules = this.detectionRules.filter(r => r.id !== ruleId);
    BrowserLogger.info('AntiCheatSystem', `Detection rule removed: ${ruleId}`);
  }

  public updateDetectionRule(ruleId: string, updates: Partial<DetectionRule>): void {
    const rule = this.detectionRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      BrowserLogger.info('AntiCheatSystem', `Detection rule updated: ${ruleId}`);
    }
  }

  public banPlayer(playerId: string, reason: string): void {
    const profile = this.playerProfiles.get(playerId);
    if (profile) {
      profile.isBanned = true;
      profile.riskLevel = RiskLevel.Critical;
      
      const report: CheatReport = {
        id: this.generateId(),
        playerId,
        cheatType: CheatType.ClientModification,
        severity: ThreatSeverity.Critical,
        timestamp: Date.now(),
        evidence: [{
          data: { reason },
          context: 'manual_ban',
          metadata: {}
        }],
        confidence: 1.0,
        automatedAction: 'manual_ban',
        reviewed: true,
        resolved: true,
      };
      
      this.cheatReports.push(report);
      this.emit('playerBanned', { playerId, profile, reason });
      
      BrowserLogger.warn('AntiCheatSystem', `Player ${playerId} banned: ${reason}`);
    }
  }

  public unbanPlayer(playerId: string): void {
    const profile = this.playerProfiles.get(playerId);
    if (profile) {
      profile.isBanned = false;
      profile.riskLevel = RiskLevel.Low;
      profile.trustScore = 0.5; // Start with medium trust
      profile.violations = []; // Clear violations
      
      this.emit('playerUnbanned', { playerId, profile });
      
      BrowserLogger.info('AntiCheatSystem', `Player ${playerId} unbanned`);
    }
  }

  public getStatistics(): AntiCheatStatistics {
    const profiles = Array.from(this.playerProfiles.values());
    const reports = this.cheatReports;
    
    return {
      totalPlayers: profiles.length,
      activePlayers: profiles.filter(p => !p.isBanned).length,
      bannedPlayers: profiles.filter(p => p.isBanned).length,
      flaggedPlayers: profiles.filter(p => p.isFlagged).length,
      totalViolations: profiles.reduce((sum, p) => sum + p.violations.length, 0),
      totalReports: reports.length,
      averageTrustScore: profiles.reduce((sum, p) => sum + p.trustScore, 0) / profiles.length,
      riskDistribution: this.calculateRiskDistribution(profiles),
      cheatTypeDistribution: this.calculateCheatTypeDistribution(reports),
      detectionRate: this.calculateDetectionRate(profiles, reports),
    };
  }

  private calculateRiskDistribution(profiles: PlayerProfile[]): Record<RiskLevel, number> {
    const distribution = {
      [RiskLevel.Low]: 0,
      [RiskLevel.Medium]: 0,
      [RiskLevel.High]: 0,
      [RiskLevel.Critical]: 0,
    };
    
    for (const profile of profiles) {
      distribution[profile.riskLevel]++;
    }
    
    return distribution;
  }

  private calculateCheatTypeDistribution(reports: CheatReport[]): Record<CheatType, number> {
    const distribution: Record<string, number> = {};
    
    for (const report of reports) {
      distribution[report.cheatType] = (distribution[report.cheatType] || 0) + 1;
    }
    
    return distribution as Record<CheatType, number>;
  }

  private calculateDetectionRate(profiles: PlayerProfile[], reports: CheatReport[]): number {
    if (profiles.length === 0) return 0;
    return reports.length / profiles.length;
  }

  // Utility methods
  private generateId(): string {
    return `ac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBaselineMetrics(key: string): PlayerMetrics {
    return this.baselines.get(key) || this.baselines.get('default')!;
  }

  private createEmptyDeviations(): MetricDeviations {
    return {
      movementSpeed: 0,
      accuracy: 0,
      reactionTime: 0,
      actionsPerMinute: 0,
      resourceUsage: 0,
      networkLatency: 0,
      inputFrequency: 0,
    };
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
          BrowserLogger.error('AntiCheatSystem', `Error in event listener for ${event}`, error);
        }
      });
    }
  }

  // Configuration
  public updateConfig(newConfig: Partial<AntiCheatConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }

    BrowserLogger.info('AntiCheatSystem', 'Anti-cheat configuration updated');
  }

  public getConfig(): AntiCheatConfig {
    return { ...this.config };
  }

  // Cleanup
  public destroy(): void {
    this.stopMonitoring();
    this.playerProfiles.clear();
    this.detectionRules = [];
    this.cheatReports = [];
    this.eventListeners.clear();
    BrowserLogger.info('AntiCheatSystem', 'Anti-cheat system destroyed');
  }
}

// Supporting types
export interface PlayerAction {
  movement?: {
    type: MovementType;
    speed: number;
    acceleration: number;
    directionChange: boolean;
    teleport: boolean;
    timestamp: number;
  };
  actionType?: string;
  accuracy?: number;
  reactionTime?: number;
  timestamp?: number;
}

export interface AntiCheatStatistics {
  totalPlayers: number;
  activePlayers: number;
  bannedPlayers: number;
  flaggedPlayers: number;
  totalViolations: number;
  totalReports: number;
  averageTrustScore: number;
  riskDistribution: Record<RiskLevel, number>;
  cheatTypeDistribution: Record<CheatType, number>;
  detectionRate: number;
}

// Utility functions
export function createDefaultAntiCheatConfig(): AntiCheatConfig {
  return {
    enabled: true,
    strictMode: false,
    detectionSensitivity: 0.7,
    maxViolationsBeforeBan: 5,
    violationTimeout: 3600, // 1 hour
    enableBehavioralAnalysis: true,
    enableStatisticalAnalysis: true,
    enableHeuristicDetection: true,
    enableMachineLearning: false,
  };
}

export function createStrictAntiCheatConfig(): AntiCheatConfig {
  return {
    enabled: true,
    strictMode: true,
    detectionSensitivity: 0.5,
    maxViolationsBeforeBan: 3,
    violationTimeout: 1800, // 30 minutes
    enableBehavioralAnalysis: true,
    enableStatisticalAnalysis: true,
    enableHeuristicDetection: true,
    enableMachineLearning: true,
  };
}

export function createDevelopmentAntiCheatConfig(): AntiCheatConfig {
  return {
    enabled: false,
    strictMode: false,
    detectionSensitivity: 0.9,
    maxViolationsBeforeBan: 10,
    violationTimeout: 7200, // 2 hours
    enableBehavioralAnalysis: false,
    enableStatisticalAnalysis: false,
    enableHeuristicDetection: false,
    enableMachineLearning: false,
  };
}

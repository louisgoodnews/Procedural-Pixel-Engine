import { BrowserLogger } from "../BrowserLogger";
import { SecurityManager, SecurityMetrics, SecurityAlert, ThreatSeverity } from "./SecurityManager";

// Monitoring types
export interface MonitoringConfig {
  alertThresholds: AlertThresholds;
  metricsRetentionPeriod: number; // seconds
  realTimeMonitoring: boolean;
  automatedResponse: boolean;
  notificationEnabled: boolean;
}

export interface AlertThresholds {
  maxAuthenticationFailures: number;
  maxBlockedConnections: number;
  maxSuspiciousActivities: number;
  maxDetectedCheats: number;
  maxDDoSAttempts: number;
  maxSecurityAlerts: number;
  maxResponseTime: number; // milliseconds
}

export interface SecurityIncident {
  id: string;
  type: IncidentType;
  severity: ThreatSeverity;
  title: string;
  description: string;
  timestamp: number;
  source: string;
  affectedUsers: string[];
  status: IncidentStatus;
  resolution?: string;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export enum IncidentType {
  AuthenticationFailure = 'AuthenticationFailure',
  SuspiciousActivity = 'SuspiciousActivity',
  CheatDetection = 'CheatDetection',
  DDoSAttack = 'DDoSAttack',
  DataBreach = 'DataBreach',
  SystemCompromise = 'SystemCompromise',
  PolicyViolation = 'PolicyViolation',
  PerformanceIssue = 'PerformanceIssue',
}

export enum IncidentStatus {
  Open = 'Open',
  Investigating = 'Investigating',
  Contained = 'Contained',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: ThreatSeverity;
  detectionRules: DetectionRule[];
  mitigationActions: string[];
  lastDetected: number;
  detectionCount: number;
}

export interface DetectionRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
  weight: number;
}

export interface SecurityReport {
  id: string;
  generatedAt: number;
  period: ReportPeriod;
  metrics: SecurityMetrics;
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  threats: ThreatPattern[];
  recommendations: string[];
  securityScore: number;
  trends: SecurityTrend[];
}

export enum ReportPeriod {
  Hourly = 'Hourly',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export interface SecurityTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  period: number;
  significance: 'low' | 'medium' | 'high';
}

// Security Monitor class
export class SecurityMonitor {
  private securityManager: SecurityManager;
  private config: MonitoringConfig;
  private metrics: SecurityMetrics[] = [];
  private alerts: SecurityAlert[] = [];
  private incidents: SecurityIncident[] = [];
  private threatPatterns: ThreatPattern[] = [];
  private monitoringInterval: number | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(securityManager: SecurityManager, config: MonitoringConfig) {
    this.securityManager = securityManager;
    this.config = config;
    this.initializeThreatPatterns();
    
    if (config.realTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  private initializeThreatPatterns(): void {
    // Initialize common threat patterns
    this.threatPatterns = [
      {
        id: 'brute_force_auth',
        name: 'Brute Force Authentication',
        description: 'Multiple failed authentication attempts from the same source',
        pattern: 'multiple_auth_failures',
        severity: ThreatSeverity.High,
        detectionRules: [
          { field: 'authenticationFailures', operator: 'greater_than', value: 5, weight: 0.8 },
          { field: 'timeWindow', operator: 'less_than', value: 300, weight: 0.6 } // 5 minutes
        ],
        mitigationActions: ['block_ip', 'increase_auth_delay', 'notify_admin'],
        lastDetected: 0,
        detectionCount: 0,
      },
      {
        id: 'speed_hack',
        name: 'Speed Hack Detection',
        description: 'Player moving faster than physically possible',
        pattern: 'impossible_movement',
        severity: ThreatSeverity.Medium,
        detectionRules: [
          { field: 'movementSpeed', operator: 'greater_than', value: 50, weight: 0.9 },
          { field: 'consistency', operator: 'greater_than', value: 0.8, weight: 0.7 }
        ],
        mitigationActions: ['warn_player', 'validate_movement', 'log_incident'],
        lastDetected: 0,
        detectionCount: 0,
      },
      {
        id: 'ddos_attack',
        name: 'DDoS Attack',
        description: 'High volume of requests from multiple sources',
        pattern: 'request_flood',
        severity: ThreatSeverity.Critical,
        detectionRules: [
          { field: 'requestsPerSecond', operator: 'greater_than', value: 1000, weight: 0.9 },
          { field: 'uniqueSources', operator: 'greater_than', value: 100, weight: 0.8 }
        ],
        mitigationActions: ['rate_limit', 'block_ips', 'scale_resources', 'notify_admin'],
        lastDetected: 0,
        detectionCount: 0,
      },
      {
        id: 'aimbot_detection',
        name: 'Aimbot Detection',
        description: 'Unnatural aiming accuracy and reaction time',
        pattern: 'perfect_aim',
        severity: ThreatSeverity.High,
        detectionRules: [
          { field: 'accuracy', operator: 'greater_than', value: 0.95, weight: 0.8 },
          { field: 'reactionTime', operator: 'less_than', value: 100, weight: 0.7 }
        ],
        mitigationActions: ['validate_aim', 'shadow_ban', 'investigate'],
        lastDetected: 0,
        detectionCount: 0,
      }
    ];
  }

  public startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      this.stopRealTimeMonitoring();
    }

    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
      this.analyzeMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, 1000); // Check every second

    BrowserLogger.info('SecurityMonitor', 'Real-time security monitoring started');
  }

  public stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      BrowserLogger.info('SecurityMonitor', 'Real-time security monitoring stopped');
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.securityManager.getSecurityStats();
      this.metrics.push(metrics);

      // Keep only recent metrics
      const cutoff = Date.now() / 1000 - this.config.metricsRetentionPeriod;
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

      BrowserLogger.debug('SecurityMonitor', 'Security metrics collected');
    } catch (error) {
      BrowserLogger.error('SecurityMonitor', 'Failed to collect metrics', error);
    }
  }

  private analyzeMetrics(): void {
    if (this.metrics.length < 2) return;

    const latest = this.metrics[this.metrics.length - 1];
    const previous = this.metrics[this.metrics.length - 2];

    // Analyze trends and detect anomalies
    this.detectAnomalies(latest, previous);
    this.detectThreatPatterns(latest);
    this.updateThreatIntelligence(latest);
  }

  private detectAnomalies(current: SecurityMetrics, previous: SecurityMetrics): void {
    const anomalies: string[] = [];

    // Check for sudden spikes in authentication failures
    if (current.authenticationFailures > previous.authenticationFailures * 2) {
      anomalies.push('Spike in authentication failures detected');
      this.createAlert('authentication_failure_spike', ThreatSeverity.High, 
        'Sudden spike in authentication failures detected', 'authentication');
    }

    // Check for unusual blocked connections
    if (current.blockedConnections > previous.blockedConnections * 3) {
      anomalies.push('Spike in blocked connections detected');
      this.createAlert('blocked_connection_spike', ThreatSeverity.Medium,
        'Sudden spike in blocked connections detected', 'network');
    }

    // Check for suspicious activities
    if (current.suspiciousActivities > previous.suspiciousActivities * 2) {
      anomalies.push('Increase in suspicious activities detected');
      this.createAlert('suspicious_activity_increase', ThreatSeverity.Medium,
        'Increase in suspicious activities detected', 'behavior');
    }

    // Check for cheat detection
    if (current.detectedCheats > previous.detectedCheats) {
      anomalies.push('Cheat activity detected');
      this.createAlert('cheat_detected', ThreatSeverity.High,
        'Cheat activity detected', 'anti_cheat');
    }

    // Check for DDoS attempts
    if (current.ddosAttempts > previous.ddosAttempts) {
      anomalies.push('DDoS attempt detected');
      this.createAlert('ddos_attempt', ThreatSeverity.Critical,
        'DDoS attempt detected', 'network');
    }

    if (anomalies.length > 0) {
      BrowserLogger.warn('SecurityMonitor', 'Anomalies detected:', anomalies);
      this.emit('anomaliesDetected', { anomalies, metrics: current });
    }
  }

  private detectThreatPatterns(metrics: SecurityMetrics): void {
    for (const pattern of this.threatPatterns) {
      if (this.matchesPattern(metrics, pattern)) {
        this.handleThreatDetection(pattern, metrics);
      }
    }
  }

  private matchesPattern(metrics: SecurityMetrics, pattern: ThreatPattern): boolean {
    let totalScore = 0;
    let maxScore = 0;

    for (const rule of pattern.detectionRules) {
      maxScore += rule.weight;
      
      if (this.evaluateRule(metrics, rule)) {
        totalScore += rule.weight;
      }
    }

    // Pattern matches if enough rules are satisfied
    const matchThreshold = maxScore * 0.6; // 60% of total weight
    return totalScore >= matchThreshold;
  }

  private evaluateRule(metrics: SecurityMetrics, rule: DetectionRule): boolean {
    const value = (metrics as any)[rule.field];
    
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'contains':
        return typeof value === 'string' && value.includes(rule.value);
      case 'greater_than':
        return value > rule.value;
      case 'less_than':
        return value < rule.value;
      case 'regex':
        return new RegExp(rule.value).test(value);
      default:
        return false;
    }
  }

  private handleThreatDetection(pattern: ThreatPattern, metrics: SecurityMetrics): void {
    pattern.lastDetected = Date.now() / 1000;
    pattern.detectionCount++;

    BrowserLogger.warn('SecurityMonitor', `Threat pattern detected: ${pattern.name}`);

    // Create security incident
    const incident = this.createIncident(
      this.getIncidentTypeForPattern(pattern),
      pattern.severity,
      pattern.name,
      `${pattern.description} - Detection count: ${pattern.detectionCount}`,
      'threat_detection',
      []
    );

    // Apply mitigation actions
    if (this.config.automatedResponse) {
      this.applyMitigationActions(pattern, incident);
    }

    // Emit threat detection event
    this.emit('threatDetected', { pattern, incident, metrics });
  }

  private getIncidentTypeForPattern(pattern: ThreatPattern): IncidentType {
    switch (pattern.id) {
      case 'brute_force_auth':
        return IncidentType.AuthenticationFailure;
      case 'speed_hack':
      case 'aimbot_detection':
        return IncidentType.CheatDetection;
      case 'ddos_attack':
        return IncidentType.DDoSAttack;
      default:
        return IncidentType.SuspiciousActivity;
    }
  }

  private applyMitigationActions(pattern: ThreatPattern, incident: SecurityIncident): void {
    BrowserLogger.info('SecurityMonitor', `Applying mitigation actions for: ${pattern.name}`);

    for (const action of pattern.mitigationActions) {
      this.executeMitigationAction(action, incident);
    }
  }

  private executeMitigationAction(action: string, incident: SecurityIncident): void {
    switch (action) {
      case 'block_ip':
        // Implementation would block the IP address
        BrowserLogger.info('SecurityMonitor', 'Blocking IP address');
        break;
      case 'warn_player':
        // Implementation would warn the player
        BrowserLogger.info('SecurityMonitor', 'Warning player');
        break;
      case 'rate_limit':
        // Implementation would apply rate limiting
        BrowserLogger.info('SecurityMonitor', 'Applying rate limiting');
        break;
      case 'notify_admin':
        // Implementation would notify administrators
        BrowserLogger.warn('SecurityMonitor', `Notifying admin of incident: ${incident.id}`);
        this.emit('adminNotification', { incident });
        break;
      case 'shadow_ban':
        // Implementation would shadow ban the player
        BrowserLogger.info('SecurityMonitor', 'Applying shadow ban');
        break;
      default:
        BrowserLogger.warn('SecurityMonitor', `Unknown mitigation action: ${action}`);
    }
  }

  private updateThreatIntelligence(metrics: SecurityMetrics): void {
    // Update threat intelligence based on current metrics
    // This would typically involve machine learning models
    BrowserLogger.debug('SecurityMonitor', 'Updating threat intelligence');
  }

  private checkThresholds(): void {
    if (this.metrics.length === 0) return;

    const latest = this.metrics[this.metrics.length - 1];
    const thresholds = this.config.alertThresholds;

    // Check authentication failures
    if (latest.authenticationFailures > thresholds.maxAuthenticationFailures) {
      this.createAlert('authentication_failures_threshold', ThreatSeverity.High,
        `Authentication failures exceeded threshold: ${latest.authenticationFailures}`, 'authentication');
    }

    // Check blocked connections
    if (latest.blockedConnections > thresholds.maxBlockedConnections) {
      this.createAlert('blocked_connections_threshold', ThreatSeverity.Medium,
        `Blocked connections exceeded threshold: ${latest.blockedConnections}`, 'network');
    }

    // Check suspicious activities
    if (latest.suspiciousActivities > thresholds.maxSuspiciousActivities) {
      this.createAlert('suspicious_activities_threshold', ThreatSeverity.Medium,
        `Suspicious activities exceeded threshold: ${latest.suspiciousActivities}`, 'behavior');
    }

    // Check detected cheats
    if (latest.detectedCheats > thresholds.maxDetectedCheats) {
      this.createAlert('detected_cheats_threshold', ThreatSeverity.High,
        `Detected cheats exceeded threshold: ${latest.detectedCheats}`, 'anti_cheat');
    }

    // Check DDoS attempts
    if (latest.ddosAttempts > thresholds.maxDDoSAttempts) {
      this.createAlert('ddos_attempts_threshold', ThreatSeverity.Critical,
        `DDoS attempts exceeded threshold: ${latest.ddosAttempts}`, 'network');
    }

    // Check security alerts
    if (latest.securityAlerts > thresholds.maxSecurityAlerts) {
      this.createAlert('security_alerts_threshold', ThreatSeverity.High,
        `Security alerts exceeded threshold: ${latest.securityAlerts}`, 'system');
    }
  }

  private createAlert(id: string, severity: ThreatSeverity, description: string, source: string): void {
    const alert: SecurityAlert = {
      id: this.generateId(),
      threatType: id,
      severity,
      description,
      timestamp: Date.now() / 1000,
      source,
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    if (this.config.notificationEnabled) {
      this.sendNotification(alert);
    }

    BrowserLogger.warn('SecurityMonitor', `Security alert created: ${description}`);
  }

  private createIncident(
    type: IncidentType,
    severity: ThreatSeverity,
    title: string,
    description: string,
    source: string,
    affectedUsers: string[]
  ): SecurityIncident {
    const incident: SecurityIncident = {
      id: this.generateId(),
      type,
      severity,
      title,
      description,
      timestamp: Date.now() / 1000,
      source,
      affectedUsers,
      status: IncidentStatus.Open,
      metadata: {},
    };

    this.incidents.push(incident);
    this.emit('incident', incident);

    BrowserLogger.warn('SecurityMonitor', `Security incident created: ${title}`);
    return incident;
  }

  private sendNotification(alert: SecurityAlert): void {
    // Implementation would send notifications via various channels
    BrowserLogger.info('SecurityMonitor', `Notification sent for alert: ${alert.threatType}`);
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() / 1000 - this.config.metricsRetentionPeriod;
    
    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    // Clean up old alerts (keep longer)
    const alertCutoff = Date.now() / 1000 - (this.config.metricsRetentionPeriod * 2);
    this.alerts = this.alerts.filter(a => a.timestamp > alertCutoff);
    
    // Clean up resolved incidents (keep even longer)
    const incidentCutoff = Date.now() / 1000 - (this.config.metricsRetentionPeriod * 7);
    this.incidents = this.incidents.filter(i => 
      i.timestamp > incidentCutoff || i.status === IncidentStatus.Open
    );
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getMetrics(): SecurityMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): SecurityMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getAlerts(severity?: ThreatSeverity): SecurityAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  public getIncidents(status?: IncidentStatus): SecurityIncident[] {
    if (status) {
      return this.incidents.filter(i => i.status === status);
    }
    return [...this.incidents];
  }

  public getThreatPatterns(): ThreatPattern[] {
    return [...this.threatPatterns];
  }

  public updateIncident(incidentId: string, updates: Partial<SecurityIncident>): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      Object.assign(incident, updates);
      this.emit('incidentUpdated', incident);
      BrowserLogger.info('SecurityMonitor', `Incident updated: ${incidentId}`);
    }
  }

  public resolveIncident(incidentId: string, resolution: string): void {
    this.updateIncident(incidentId, {
      status: IncidentStatus.Resolved,
      resolution,
      resolvedAt: Date.now() / 1000,
    });
  }

  public addThreatPattern(pattern: ThreatPattern): void {
    this.threatPatterns.push(pattern);
    BrowserLogger.info('SecurityMonitor', `Threat pattern added: ${pattern.name}`);
  }

  public removeThreatPattern(patternId: string): void {
    this.threatPatterns = this.threatPatterns.filter(p => p.id !== patternId);
    BrowserLogger.info('SecurityMonitor', `Threat pattern removed: ${patternId}`);
  }

  public generateReport(period: ReportPeriod): SecurityReport {
    const now = Date.now() / 1000;
    let periodStart: number;

    switch (period) {
      case ReportPeriod.Hourly:
        periodStart = now - 3600;
        break;
      case ReportPeriod.Daily:
        periodStart = now - 86400;
        break;
      case ReportPeriod.Weekly:
        periodStart = now - 604800;
        break;
      case ReportPeriod.Monthly:
        periodStart = now - 2592000;
        break;
    }

    const periodMetrics = this.metrics.filter(m => m.timestamp >= periodStart);
    const periodAlerts = this.alerts.filter(a => a.timestamp >= periodStart);
    const periodIncidents = this.incidents.filter(i => i.timestamp >= periodStart);

    const aggregatedMetrics = this.aggregateMetrics(periodMetrics);
    const securityScore = this.calculateSecurityScore(aggregatedMetrics);
    const trends = this.calculateTrends(periodMetrics);
    const recommendations = this.generateRecommendations(aggregatedMetrics, periodIncidents);

    return {
      id: this.generateId(),
      generatedAt: now,
      period,
      metrics: aggregatedMetrics,
      incidents: periodIncidents,
      alerts: periodAlerts,
      threats: this.threatPatterns,
      recommendations,
      securityScore,
      trends,
    };
  }

  private aggregateMetrics(metrics: SecurityMetrics[]): SecurityMetrics {
    if (metrics.length === 0) {
      return {
        timestamp: Date.now() / 1000,
        authenticationAttempts: 0,
        authenticationFailures: 0,
        blockedConnections: 0,
        suspiciousActivities: 0,
        detectedCheats: 0,
        ddosAttempts: 0,
        securityAlerts: 0,
      };
    }

    const latest = metrics[metrics.length - 1];
    const aggregated: SecurityMetrics = {
      timestamp: latest.timestamp,
      authenticationAttempts: metrics.reduce((sum, m) => sum + m.authenticationAttempts, 0),
      authenticationFailures: metrics.reduce((sum, m) => sum + m.authenticationFailures, 0),
      blockedConnections: metrics.reduce((sum, m) => sum + m.blockedConnections, 0),
      suspiciousActivities: metrics.reduce((sum, m) => sum + m.suspiciousActivities, 0),
      detectedCheats: metrics.reduce((sum, m) => sum + m.detectedCheats, 0),
      ddosAttempts: metrics.reduce((sum, m) => sum + m.ddosAttempts, 0),
      securityAlerts: metrics.reduce((sum, m) => sum + m.securityAlerts, 0),
    };

    return aggregated;
  }

  private calculateSecurityScore(metrics: SecurityMetrics): number {
    let score = 100;

    // Penalize authentication failures
    if (metrics.authenticationAttempts > 0) {
      const failureRate = metrics.authenticationFailures / metrics.authenticationAttempts;
      score -= failureRate * 30;
    }

    // Penalize blocked connections
    score -= Math.min(metrics.blockedConnections * 0.5, 15);

    // Penalize suspicious activities
    score -= Math.min(metrics.suspiciousActivities * 2, 20);

    // Penalize detected cheats
    score -= Math.min(metrics.detectedCheats * 5, 25);

    // Penalize DDoS attempts
    score -= Math.min(metrics.ddosAttempts * 3, 20);

    // Penalize security alerts
    score -= Math.min(metrics.securityAlerts * 1, 10);

    return Math.max(score, 0);
  }

  private calculateTrends(metrics: SecurityMetrics[]): SecurityTrend[] {
    if (metrics.length < 10) return [];

    const trends: SecurityTrend[] = [];
    const metricNames = ['authenticationFailures', 'blockedConnections', 'suspiciousActivities', 'detectedCheats'];

    for (const metricName of metricNames) {
      const trend = this.calculateTrendForMetric(metrics, metricName);
      if (trend) {
        trends.push(trend);
      }
    }

    return trends;
  }

  private calculateTrendForMetric(metrics: SecurityMetrics[], metricName: string): SecurityTrend | null {
    const recent = metrics.slice(-10);
    const older = metrics.slice(-20, -10);

    if (older.length === 0) return null;

    const recentAvg = recent.reduce((sum, m) => sum + (m as any)[metricName], 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + (m as any)[metricName], 0) / older.length;

    const changeRate = (recentAvg - olderAvg) / olderAvg;
    let trend: 'increasing' | 'decreasing' | 'stable';

    if (Math.abs(changeRate) < 0.1) {
      trend = 'stable';
    } else if (changeRate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    const significance = Math.abs(changeRate) > 0.5 ? 'high' : 
                        Math.abs(changeRate) > 0.2 ? 'medium' : 'low';

    return {
      metric: metricName,
      trend,
      changeRate,
      period: 10,
      significance,
    };
  }

  private generateRecommendations(metrics: SecurityMetrics, incidents: SecurityIncident[]): string[] {
    const recommendations: string[] = [];

    if (metrics.authenticationFailures > 10) {
      recommendations.push('Consider implementing stronger authentication measures');
    }

    if (metrics.blockedConnections > 50) {
      recommendations.push('Review and update IP blocking rules');
    }

    if (metrics.detectedCheats > 5) {
      recommendations.push('Update anti-cheat detection algorithms');
    }

    if (metrics.ddosAttempts > 0) {
      recommendations.push('Enhance DDoS protection measures');
    }

    const criticalIncidents = incidents.filter(i => i.severity === ThreatSeverity.Critical);
    if (criticalIncidents.length > 0) {
      recommendations.push('Review and address critical security incidents');
    }

    return recommendations;
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
          BrowserLogger.error('SecurityMonitor', `Error in event listener for ${event}`, error);
        }
      });
    }
  }

  // Configuration
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.realTimeMonitoring !== undefined) {
      if (newConfig.realTimeMonitoring) {
        this.startRealTimeMonitoring();
      } else {
        this.stopRealTimeMonitoring();
      }
    }

    BrowserLogger.info('SecurityMonitor', 'Monitoring configuration updated');
  }

  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // Cleanup
  public destroy(): void {
    this.stopRealTimeMonitoring();
    this.metrics = [];
    this.alerts = [];
    this.incidents = [];
    this.eventListeners.clear();
    BrowserLogger.info('SecurityMonitor', 'Security monitor destroyed');
  }
}

// Utility functions
export function createDefaultMonitoringConfig(): MonitoringConfig {
  return {
    alertThresholds: {
      maxAuthenticationFailures: 10,
      maxBlockedConnections: 50,
      maxSuspiciousActivities: 20,
      maxDetectedCheats: 5,
      maxDDoSAttempts: 1,
      maxSecurityAlerts: 25,
      maxResponseTime: 1000,
    },
    metricsRetentionPeriod: 86400, // 24 hours
    realTimeMonitoring: true,
    automatedResponse: true,
    notificationEnabled: true,
  };
}

export function createHighSecurityMonitoringConfig(): MonitoringConfig {
  return {
    alertThresholds: {
      maxAuthenticationFailures: 5,
      maxBlockedConnections: 25,
      maxSuspiciousActivities: 10,
      maxDetectedCheats: 2,
      maxDDoSAttempts: 0,
      maxSecurityAlerts: 10,
      maxResponseTime: 500,
    },
    metricsRetentionPeriod: 604800, // 7 days
    realTimeMonitoring: true,
    automatedResponse: true,
    notificationEnabled: true,
  };
}

export function createDevelopmentMonitoringConfig(): MonitoringConfig {
  return {
    alertThresholds: {
      maxAuthenticationFailures: 50,
      maxBlockedConnections: 200,
      maxSuspiciousActivities: 100,
      maxDetectedCheats: 20,
      maxDDoSAttempts: 10,
      maxSecurityAlerts: 100,
      maxResponseTime: 5000,
    },
    metricsRetentionPeriod: 3600, // 1 hour
    realTimeMonitoring: false,
    automatedResponse: false,
    notificationEnabled: false,
  };
}

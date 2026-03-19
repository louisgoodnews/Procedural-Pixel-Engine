import { BrowserLogger } from "../BrowserLogger";
import { PluginManifest, PluginPermission, PluginMetadata } from "./PluginManager";

// Security types
export interface SecurityPolicy {
  allowedDomains: string[];
  blockedDomains: string[];
  maxFileSize: number;
  maxMemoryUsage: number;
  allowedPermissions: PluginPermission[];
  requireSignature: boolean;
  sandboxMode: boolean;
  networkAccess: boolean;
  fileSystemAccess: boolean;
  systemInfoAccess: boolean;
}

export interface SecurityViolation {
  type: "domain" | "permission" | "size" | "memory" | "signature" | "malicious";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: any;
  timestamp: number;
}

export interface SecurityReport {
  pluginId: string;
  violations: SecurityViolation[];
  riskScore: number;
  recommendations: string[];
  approved: boolean;
  timestamp: number;
}

export interface PluginSignature {
  algorithm: string;
  publicKey: string;
  signature: string;
  timestamp: number;
  verified: boolean;
}

// Plugin Security Manager
export class PluginSecurityManager {
  private policy: SecurityPolicy;
  private trustedAuthors: Set<string> = new Set();
  private blockedAuthors: Set<string> = new Set();
  private securityCache: Map<string, SecurityReport> = new Map();
  private malwareSignatures: string[] = [];

  constructor() {
    this.policy = this.createDefaultPolicy();
    this.loadSecurityData();
  }

  private createDefaultPolicy(): SecurityPolicy {
    return {
      allowedDomains: [
        "github.com",
        "gitlab.com",
        "npmjs.com",
        "proceduralpixel.com",
        "cdn.jsdelivr.net"
      ],
      blockedDomains: [
        "malicious-site.com",
        "suspicious-domain.net",
        "fake-plugin.org"
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      allowedPermissions: [
        PluginPermission.Graphics,
        PluginPermission.Audio,
        PluginPermission.UserInput,
        PluginPermission.SystemInfo
      ],
      requireSignature: true,
      sandboxMode: true,
      networkAccess: false,
      fileSystemAccess: false,
      systemInfoAccess: true
    };
  }

  private loadSecurityData(): void {
    // Load trusted authors
    this.trustedAuthors.add("Graphics Studio");
    this.trustedAuthors.add("Audio Labs");
    this.trustedAuthors.add("AI Systems");
    this.trustedAuthors.add("Procedural Pixel Engine Team");

    // Load malware signatures (in production, this would come from a security service)
    this.malwareSignatures = [
      "eval(",
      "Function(",
      "document.write",
      "innerHTML",
      "outerHTML",
      "setTimeout(0)",
      "setInterval(0)"
    ];
  }

  // Main security validation
  async validatePlugin(manifest: PluginManifest, pluginCode?: string): Promise<SecurityReport> {
    BrowserLogger.info("PluginSecurity", `Validating plugin: ${manifest.metadata.id}`);

    const violations: SecurityViolation[] = [];
    const startTime = Date.now();

    try {
      // 1. Basic manifest validation
      violations.push(...this.validateManifest(manifest));

      // 2. Permission validation
      violations.push(...this.validatePermissions(manifest));

      // 3. Domain validation
      violations.push(...this.validateDomains(manifest));

      // 4. Size validation
      violations.push(...this.validateSize(manifest));

      // 5. Memory validation
      violations.push(...this.validateMemory(manifest));

      // 6. Author validation
      violations.push(...this.validateAuthor(manifest));

      // 7. Code validation (if provided)
      if (pluginCode) {
        violations.push(...this.validateCode(pluginCode));
      }

      // 8. Signature validation
      violations.push(...this.validateSignature(manifest));

    } catch (error) {
      violations.push({
        type: "malicious",
        severity: "critical",
        message: "Security validation failed with unexpected error",
        details: error,
        timestamp: Date.now()
      });
    }

    const report: SecurityReport = {
      pluginId: manifest.metadata.id,
      violations,
      riskScore: this.calculateRiskScore(violations),
      recommendations: this.generateRecommendations(violations),
      approved: violations.filter(v => v.severity === "critical").length === 0,
      timestamp: Date.now()
    };

    // Cache the report
    this.securityCache.set(manifest.metadata.id, report);

    BrowserLogger.info("PluginSecurity", `Security validation completed for ${manifest.metadata.id}`, {
      violations: violations.length,
      riskScore: report.riskScore,
      approved: report.approved,
      duration: Date.now() - startTime
    });

    return report;
  }

  // Validation methods
  private validateManifest(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check required fields
    const requiredFields: (keyof PluginMetadata)[] = ['id', 'name', 'version', 'description', 'author', 'engineVersion'];
    for (const field of requiredFields) {
      if (!(field in manifest.metadata)) {
        violations.push({
          type: "malicious",
          severity: "high",
          message: `Missing required field: ${field}`,
          details: { field },
          timestamp: Date.now()
        });
      }
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(manifest.metadata.version)) {
      violations.push({
        type: "malicious",
        severity: "medium",
        message: "Invalid version format",
        details: { version: manifest.metadata.version },
        timestamp: Date.now()
      });
    }

    // Validate engine version
    if (!this.isEngineVersionCompatible(manifest.metadata.engineVersion)) {
      violations.push({
        type: "malicious",
        severity: "high",
        message: "Incompatible engine version",
        details: { engineVersion: manifest.metadata.engineVersion },
        timestamp: Date.now()
      });
    }

    return violations;
  }

  private validatePermissions(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const permission of manifest.metadata.permissions) {
      if (!this.policy.allowedPermissions.includes(permission)) {
        violations.push({
          type: "permission",
          severity: "high",
          message: `Permission not allowed: ${permission}`,
          details: { permission },
          timestamp: Date.now()
        });
      }
    }

    // Check for dangerous permission combinations
    const dangerousCombinations = [
      [PluginPermission.FileSystem, PluginPermission.Network],
      [PluginPermission.SystemInfo, PluginPermission.Network]
    ];

    for (const combination of dangerousCombinations) {
      if (combination.every(p => manifest.metadata.permissions.includes(p))) {
        violations.push({
          type: "permission",
          severity: "critical",
          message: "Dangerous permission combination detected",
          details: { combination },
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  private validateDomains(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check repository domain
    if (manifest.metadata.repository) {
      const domain = this.extractDomain(manifest.metadata.repository);
      if (this.policy.blockedDomains.includes(domain)) {
        violations.push({
          type: "domain",
          severity: "critical",
          message: "Blocked domain detected in repository",
          details: { domain, url: manifest.metadata.repository },
          timestamp: Date.now()
        });
      }
    }

    // Check homepage domain
    if (manifest.metadata.homepage) {
      const domain = this.extractDomain(manifest.metadata.homepage);
      if (this.policy.blockedDomains.includes(domain)) {
        violations.push({
          type: "domain",
          severity: "critical",
          message: "Blocked domain detected in homepage",
          details: { domain, url: manifest.metadata.homepage },
          timestamp: Date.now()
        });
      }
    }

    // Check dependencies
    for (const dependency of manifest.metadata.dependencies) {
      const domain = this.extractDomain(dependency);
      if (this.policy.blockedDomains.includes(domain)) {
        violations.push({
          type: "domain",
          severity: "high",
          message: "Blocked domain detected in dependencies",
          details: { domain, dependency },
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  private validateSize(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // In a real implementation, this would check actual file sizes
    // For now, we'll simulate size validation
    const estimatedSize = this.estimatePluginSize(manifest);
    
    if (estimatedSize > this.policy.maxFileSize) {
      violations.push({
        type: "size",
        severity: "medium",
        message: "Plugin size exceeds limit",
        details: { 
          estimatedSize, 
          maxSize: this.policy.maxFileSize,
          sizeExceeded: estimatedSize - this.policy.maxFileSize
        },
        timestamp: Date.now()
      });
    }

    return violations;
  }

  private validateMemory(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    const requestedMemory = manifest.config.maxMemory || 0;
    
    if (requestedMemory > this.policy.maxMemoryUsage) {
      violations.push({
        type: "memory",
        severity: "medium",
        message: "Requested memory exceeds limit",
        details: { 
          requestedMemory, 
          maxMemory: this.policy.maxMemoryUsage,
          memoryExceeded: requestedMemory - this.policy.maxMemoryUsage
        },
        timestamp: Date.now()
      });
    }

    return violations;
  }

  private validateAuthor(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    const author = manifest.metadata.author;

    // Check blocked authors
    if (this.blockedAuthors.has(author)) {
      violations.push({
        type: "malicious",
        severity: "critical",
        message: "Blocked author detected",
        details: { author },
        timestamp: Date.now()
      });
    }

    // Check for suspicious author names
    const suspiciousPatterns = [
      /admin/i,
      /root/i,
      /system/i,
      /anonymous/i,
      /test.*test/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(author)) {
        violations.push({
          type: "malicious",
          severity: "medium",
          message: "Suspicious author name detected",
          details: { author, pattern: pattern.source },
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  private validateCode(pluginCode: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Check for malware signatures
    for (const signature of this.malwareSignatures) {
      if (pluginCode.includes(signature)) {
        violations.push({
          type: "malicious",
          severity: "critical",
          message: "Malicious code signature detected",
          details: { signature },
          timestamp: Date.now()
        });
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi,
      /setTimeout\s*\(\s*0/gi,
      /setInterval\s*\(\s*0/gi,
      /XMLHttpRequest/gi,
      /fetch\s*\(/gi
    ];

    for (const pattern of suspiciousPatterns) {
      const matches = pluginCode.match(pattern);
      if (matches && matches.length > 0) {
        violations.push({
          type: "malicious",
          severity: "high",
          message: "Suspicious code pattern detected",
          details: { pattern: pattern.source, count: matches.length },
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  private validateSignature(manifest: PluginManifest): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    if (this.policy.requireSignature) {
      // In a real implementation, this would verify cryptographic signatures
      // For now, we'll simulate signature validation
      const hasValidSignature = this.simulateSignatureValidation(manifest);
      
      if (!hasValidSignature) {
        violations.push({
          type: "signature",
          severity: "medium",
          message: "Missing or invalid plugin signature",
          details: { requireSignature: this.policy.requireSignature },
          timestamp: Date.now()
        });
      }
    }

    return violations;
  }

  // Utility methods
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return "";
    }
  }

  private isEngineVersionCompatible(version: string): boolean {
    // Simple compatibility check
    const supportedVersions = ["1.0.0", "1.0.1", "1.1.0"];
    return supportedVersions.includes(version);
  }

  private estimatePluginSize(manifest: PluginManifest): number {
    // Estimate size based on manifest
    let size = 1024; // Base size for manifest
    
    size += manifest.assets.length * 1024; // 1KB per asset
    size += manifest.metadata.dependencies.length * 512; // 512B per dependency
    size += manifest.metadata.permissions.length * 256; // 256B per permission
    
    return size;
  }

  private simulateSignatureValidation(manifest: PluginManifest): boolean {
    // In a real implementation, this would verify cryptographic signatures
    // For now, we'll simulate based on author trust
    return this.trustedAuthors.has(manifest.metadata.author);
  }

  private calculateRiskScore(violations: SecurityViolation[]): number {
    let score = 0;
    
    for (const violation of violations) {
      switch (violation.severity) {
        case "critical":
          score += 100;
          break;
        case "high":
          score += 50;
          break;
        case "medium":
          score += 25;
          break;
        case "low":
          score += 10;
          break;
      }
    }

    return Math.min(score, 100);
  }

  private generateRecommendations(violations: SecurityViolation[]): string[] {
    const recommendations: string[] = [];
    
    if (violations.some(v => v.type === "permission")) {
      recommendations.push("Review and reduce requested permissions to only what's necessary");
    }
    
    if (violations.some(v => v.type === "domain")) {
      recommendations.push("Use trusted domains for repositories and dependencies");
    }
    
    if (violations.some(v => v.type === "size")) {
      recommendations.push("Optimize plugin size by removing unused assets and dependencies");
    }
    
    if (violations.some(v => v.type === "memory")) {
      recommendations.push("Reduce memory usage or implement memory management");
    }
    
    if (violations.some(v => v.type === "malicious")) {
      recommendations.push("Review code for security vulnerabilities and remove suspicious patterns");
    }
    
    if (violations.some(v => v.type === "signature")) {
      recommendations.push("Sign your plugin with a valid cryptographic signature");
    }

    return recommendations;
  }

  // Public API
  getSecurityReport(pluginId: string): SecurityReport | null {
    return this.securityCache.get(pluginId) || null;
  }

  async scanPlugin(manifest: PluginManifest, pluginCode?: string): Promise<SecurityReport> {
    return this.validatePlugin(manifest, pluginCode);
  }

  updatePolicy(newPolicy: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
    BrowserLogger.info("PluginSecurity", "Security policy updated");
  }

  addTrustedAuthor(author: string): void {
    this.trustedAuthors.add(author);
    BrowserLogger.info("PluginSecurity", `Added trusted author: ${author}`);
  }

  removeTrustedAuthor(author: string): void {
    this.trustedAuthors.delete(author);
    BrowserLogger.info("PluginSecurity", `Removed trusted author: ${author}`);
  }

  addBlockedAuthor(author: string): void {
    this.blockedAuthors.add(author);
    BrowserLogger.info("PluginSecurity", `Added blocked author: ${author}`);
  }

  removeBlockedAuthor(author: string): void {
    this.blockedAuthors.delete(author);
    BrowserLogger.info("PluginSecurity", `Removed blocked author: ${author}`);
  }

  getPolicy(): SecurityPolicy {
    return { ...this.policy };
  }

  getSecurityStats(): {
    totalScanned: number;
    violationsFound: number;
    criticalViolations: number;
    averageRiskScore: number;
  } {
    const reports = Array.from(this.securityCache.values());
    const totalScanned = reports.length;
    const violationsFound = reports.reduce((sum, report) => sum + report.violations.length, 0);
    const criticalViolations = reports.reduce((sum, report) => 
      sum + report.violations.filter(v => v.severity === "critical").length, 0
    );
    const averageRiskScore = totalScanned > 0 
      ? reports.reduce((sum, report) => sum + report.riskScore, 0) / totalScanned 
      : 0;

    return {
      totalScanned,
      violationsFound,
      criticalViolations,
      averageRiskScore
    };
  }
}

// Global security manager instance
let globalSecurityManager: PluginSecurityManager | null = null;

export function getPluginSecurityManager(): PluginSecurityManager {
  if (!globalSecurityManager) {
    globalSecurityManager = new PluginSecurityManager();
  }
  return globalSecurityManager;
}

// Security utilities
export class SecurityUtils {
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  static hashString(input: string): string {
    // Simple hash function (in production, use a proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  static async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    // In a real implementation, this would use Web Crypto API
    // For now, return a simulated result
    return data.length > 0 && signature.length > 0 && publicKey.length > 0;
  }
}

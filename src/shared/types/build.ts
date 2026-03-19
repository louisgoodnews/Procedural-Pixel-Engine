export interface BuildProfile {
  id: string;
  name: string;
  description: string;
  environment: "development" | "test" | "release";
  targets: BuildTarget[];
  optimizations: BuildOptimizations;
  validation: BuildValidation;
  packaging: PackagingsOptions;
}

export interface BuildTarget {
  platform: "windows" | "macos" | "linux" | "web";
  architecture: "x64" | "arm64";
  format: "installer" | "archive" | "portable";
  outputName: string;
  iconPath?: string;
  certificateInfo?: CertificateInfo;
}

export interface BuildOptimizations {
  minify: boolean;
  compress: boolean;
  bundleAssets: boolean;
  removeDebugCode: boolean;
  optimizeAssets: boolean;
  enableSourceMaps: boolean;
  treeshaking: boolean;
  deadCodeElimination: boolean;
}

export interface BuildValidation {
  validateAssets: boolean;
  validateBlueprints: boolean;
  validateAudio: boolean;
  validateLogic: boolean;
  checkDependencies: boolean;
  verifyIntegrity: boolean;
  strictMode: boolean;
}

export interface PackagingsOptions {
  includeSource: boolean;
  includeDebugTools: boolean;
  includeDevAssets: boolean;
  compressionLevel: number; // 0-9
  createChecksums: boolean;
  signPackages: boolean;
}

export interface CertificateInfo {
  thumbprint: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
}

export interface BuildReport {
  buildId: string;
  profileId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  status: "success" | "warning" | "error";
  targets: BuildTargetReport[];
  validation: ValidationReport;
  artifacts: BuildArtifact[];
  warnings: BuildWarning[];
  errors: BuildError[];
  metrics: BuildMetrics;
}

export interface BuildTargetReport {
  target: BuildTarget;
  status: "success" | "warning" | "error" | "skipped";
  outputPath: string;
  fileSize: number; // in bytes
  compressedSize: number; // in bytes
  checksum: string;
  warnings: string[];
  errors: string[];
}

export interface ValidationReport {
  assets: AssetValidationResult;
  blueprints: BlueprintValidationResult;
  audio: AudioValidationResult;
  logic: LogicValidationResult;
  dependencies: DependencyValidationResult;
  integrity: IntegrityValidationResult;
  overall: "passed" | "warning" | "failed";
}

export interface AssetValidationResult {
  status: "passed" | "warning" | "failed";
  totalAssets: number;
  validAssets: number;
  invalidAssets: number;
  missingAssets: string[];
  corruptedAssets: string[];
  oversizedAssets: string[];
  issues: AssetIssue[];
}

export interface AssetIssue {
  assetId: string;
  type: "missing" | "corrupted" | "oversized" | "invalid_format";
  severity: "warning" | "error";
  message: string;
  suggestion: string;
}

export interface BlueprintValidationResult {
  status: "passed" | "warning" | "failed";
  totalBlueprints: number;
  validBlueprints: number;
  invalidBlueprints: number;
  issues: BlueprintIssue[];
}

export interface BlueprintIssue {
  blueprintId: string;
  type: "schema_error" | "invalid_reference" | "missing_component" | "logic_error";
  severity: "warning" | "error";
  message: string;
  line?: number;
  column?: number;
}

export interface AudioValidationResult {
  status: "passed" | "warning" | "failed";
  totalAudioAssets: number;
  validAudioAssets: number;
  invalidAudioAssets: number;
  issues: AudioIssue[];
}

export interface AudioIssue {
  audioId: string;
  type: "missing_file" | "invalid_format" | "corrupted" | "oversized";
  severity: "warning" | "error";
  message: string;
}

export interface LogicValidationResult {
  status: "passed" | "warning" | "failed";
  totalLogicGraphs: number;
  validLogicGraphs: number;
  invalidLogicGraphs: number;
  issues: LogicIssue[];
}

export interface LogicIssue {
  graphId: string;
  nodeId?: string;
  type: "missing_node" | "invalid_connection" | "circular_dependency" | "type_error";
  severity: "warning" | "error";
  message: string;
}

export interface DependencyValidationResult {
  status: "passed" | "warning" | "failed";
  totalDependencies: number;
  resolvedDependencies: number;
  unresolvedDependencies: string[];
  circularDependencies: string[][];
  outdatedDependencies: string[];
}

export interface IntegrityValidationResult {
  status: "passed" | "warning" | "failed";
  checksumsValid: boolean;
  signaturesValid: boolean;
  tamperedFiles: string[];
  missingSignatures: string[];
}

export interface BuildArtifact {
  id: string;
  name: string;
  type: "executable" | "installer" | "archive" | "bundle";
  platform: string;
  architecture: string;
  path: string;
  size: number;
  checksum: string;
  downloadUrl?: string;
}

export interface BuildWarning {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface BuildError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface BuildMetrics {
  totalBuildTime: number;
  validationTime: number;
  packagingTime: number;
  compressionRatio: number;
  assetOptimizationRatio: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

export interface PublishBundle {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  website?: string;
  repository?: string;
  license: string;
  tags: string[];
  category: "game" | "tool" | "template" | "demo";
  platforms: string[];
  minimumSystemRequirements: SystemRequirements;
  recommendedSystemRequirements: SystemRequirements;
  screenshots: string[];
  trailer?: string;
  changelog: string[];
  buildReports: BuildReport[];
  artifacts: BuildArtifact[];
  metadata: PublishMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface SystemRequirements {
  os: string[];
  processor: string;
  memory: string; // e.g., "4 GB RAM"
  graphics: string;
  storage: string; // e.g., "500 MB available space"
  additional?: string;
}

export interface PublishMetadata {
  engine: {
    name: string;
    version: string;
  };
  project: {
    name: string;
    version: string;
    buildNumber: number;
  };
  features: string[];
  dependencies: ProjectDependency[];
  compatibility: CompatibilityInfo;
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: "required" | "optional";
  description: string;
}

export interface CompatibilityInfo {
  minimumEngineVersion: string;
  maximumEngineVersion?: string;
  compatiblePlatforms: string[];
  deprecatedFeatures: string[];
  breakingChanges: string[];
}

export interface BuildConfiguration {
  profiles: BuildProfile[];
  defaultProfile: string;
  globalSettings: GlobalBuildSettings;
}

export interface GlobalBuildSettings {
  outputDirectory: string;
  cacheDirectory: string;
  tempDirectory: string;
  parallelBuilds: boolean;
  maxConcurrentJobs: number;
  retryAttempts: number;
  timeout: number; // in seconds
  logLevel: "debug" | "info" | "warn" | "error";
  keepArtifacts: boolean;
  generateReports: boolean;
}

export interface BuildQueue {
  id: string;
  builds: QueuedBuild[];
  status: "idle" | "running" | "completed" | "failed";
  currentBuild?: string;
  completedBuilds: string[];
  failedBuilds: string[];
}

export interface QueuedBuild {
  id: string;
  profileId: string;
  priority: number;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  report?: BuildReport;
}

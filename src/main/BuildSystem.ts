import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BlueprintCatalog } from "../shared/types";
import type {
  AssetIssue,
  AssetValidationResult,
  AudioValidationResult,
  BlueprintValidationResult,
  BuildArtifact,
  BuildConfiguration,
  BuildOptimizations,
  BuildProfile,
  BuildQueue,
  BuildReport,
  BuildTarget,
  BuildTargetReport,
  BuildValidation,
  DependencyValidationResult,
  GlobalBuildSettings,
  IntegrityValidationResult,
  LogicValidationResult,
  PackagingsOptions,
  PublishBundle,
  QueuedBuild,
  ValidationReport,
} from "../shared/types/build";
import { AssetIndex } from "./AssetIndex";

export class BuildSystem {
  private configuration: BuildConfiguration;
  private queue: BuildQueue = {
    id: "main",
    builds: [],
    status: "idle",
    completedBuilds: [],
    failedBuilds: [],
  };
  private isBuilding = false;

  constructor(projectRoot: string) {
    this.configuration = this.createDefaultConfiguration(projectRoot);
  }

  private createDefaultConfiguration(projectRoot: string): BuildConfiguration {
    return {
      profiles: [
        {
          id: "development",
          name: "Development Build",
          description: "Fast build with debug information",
          environment: "development",
          targets: [
            {
              platform: "windows",
              architecture: "x64",
              format: "portable",
              outputName: "procedural-pixel-engine-dev",
            },
            {
              platform: "macos",
              architecture: "x64",
              format: "portable",
              outputName: "procedural-pixel-engine-dev",
            },
            {
              platform: "linux",
              architecture: "x64",
              format: "portable",
              outputName: "procedural-pixel-engine-dev",
            },
          ],
          optimizations: {
            minify: false,
            compress: false,
            bundleAssets: false,
            removeDebugCode: false,
            optimizeAssets: false,
            enableSourceMaps: true,
            treeshaking: false,
            deadCodeElimination: false,
          },
          validation: {
            validateAssets: true,
            validateBlueprints: true,
            validateAudio: true,
            validateLogic: true,
            checkDependencies: false,
            verifyIntegrity: false,
            strictMode: false,
          },
          packaging: {
            includeSource: true,
            includeDebugTools: true,
            includeDevAssets: true,
            compressionLevel: 0,
            createChecksums: true,
            signPackages: false,
          },
        },
        {
          id: "test",
          name: "Test Build",
          description: "Optimized build for testing",
          environment: "test",
          targets: [
            {
              platform: "windows",
              architecture: "x64",
              format: "installer",
              outputName: "procedural-pixel-engine-test",
            },
            {
              platform: "macos",
              architecture: "x64",
              format: "archive",
              outputName: "procedural-pixel-engine-test",
            },
            {
              platform: "linux",
              architecture: "x64",
              format: "archive",
              outputName: "procedural-pixel-engine-test",
            },
          ],
          optimizations: {
            minify: true,
            compress: true,
            bundleAssets: true,
            removeDebugCode: true,
            optimizeAssets: true,
            enableSourceMaps: false,
            treeshaking: true,
            deadCodeElimination: true,
          },
          validation: {
            validateAssets: true,
            validateBlueprints: true,
            validateAudio: true,
            validateLogic: true,
            checkDependencies: true,
            verifyIntegrity: true,
            strictMode: true,
          },
          packaging: {
            includeSource: false,
            includeDebugTools: false,
            includeDevAssets: false,
            compressionLevel: 6,
            createChecksums: true,
            signPackages: false,
          },
        },
        {
          id: "release",
          name: "Release Build",
          description: "Production-ready build with maximum optimization",
          environment: "release",
          targets: [
            {
              platform: "windows",
              architecture: "x64",
              format: "installer",
              outputName: "procedural-pixel-engine",
            },
            {
              platform: "windows",
              architecture: "arm64",
              format: "installer",
              outputName: "procedural-pixel-engine-arm64",
            },
            {
              platform: "macos",
              architecture: "x64",
              format: "installer",
              outputName: "procedural-pixel-engine",
            },
            {
              platform: "macos",
              architecture: "arm64",
              format: "installer",
              outputName: "procedural-pixel-engine-arm64",
            },
            {
              platform: "linux",
              architecture: "x64",
              format: "archive",
              outputName: "procedural-pixel-engine",
            },
            {
              platform: "linux",
              architecture: "arm64",
              format: "archive",
              outputName: "procedural-pixel-engine-arm64",
            },
          ],
          optimizations: {
            minify: true,
            compress: true,
            bundleAssets: true,
            removeDebugCode: true,
            optimizeAssets: true,
            enableSourceMaps: false,
            treeshaking: true,
            deadCodeElimination: true,
          },
          validation: {
            validateAssets: true,
            validateBlueprints: true,
            validateAudio: true,
            validateLogic: true,
            checkDependencies: true,
            verifyIntegrity: true,
            strictMode: true,
          },
          packaging: {
            includeSource: false,
            includeDebugTools: false,
            includeDevAssets: false,
            compressionLevel: 9,
            createChecksums: true,
            signPackages: true,
          },
        },
      ],
      defaultProfile: "development",
      globalSettings: {
        outputDirectory: path.join(projectRoot, "dist", "builds"),
        cacheDirectory: path.join(projectRoot, ".cache", "build"),
        tempDirectory: path.join(projectRoot, "temp", "build"),
        parallelBuilds: true,
        maxConcurrentJobs: 3,
        retryAttempts: 2,
        timeout: 1200, // 20 minutes
        logLevel: "info",
        keepArtifacts: true,
        generateReports: true,
      },
    };
  }

  public async queueBuild(profileId: string, priority = 0): Promise<string> {
    const buildId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedBuild: QueuedBuild = {
      id: buildId,
      profileId,
      priority,
      requestedAt: new Date().toISOString(),
      status: "queued",
    };

    this.queue.builds.push(queuedBuild);
    this.queue.builds.sort((a, b) => b.priority - a.priority);

    // Start building if not already running
    if (this.queue.status === "idle") {
      this.processQueue();
    }

    return buildId;
  }

  private async processQueue(): Promise<void> {
    if (this.isBuilding || this.queue.builds.length === 0) {
      return;
    }

    this.isBuilding = true;
    this.queue.status = "running";

    while (this.queue.builds.length > 0) {
      const build = this.queue.builds.find((b) => b.status === "queued");
      if (!build) break;

      build.status = "running";
      build.startedAt = new Date().toISOString();
      this.queue.currentBuild = build.id;

      try {
        const profile = this.configuration.profiles.find((p) => p.id === build.profileId);
        if (!profile) {
          throw new Error(`Build profile not found: ${build.profileId}`);
        }

        const report = await this.executeBuild(profile);
        build.report = report;
        build.status = report.status === "error" ? "failed" : "completed";
        build.completedAt = new Date().toISOString();

        if (build.status === "completed") {
          this.queue.completedBuilds.push(build.id);
        } else {
          this.queue.failedBuilds.push(build.id);
        }
      } catch (error) {
        build.status = "failed";
        build.completedAt = new Date().toISOString();
        this.queue.failedBuilds.push(build.id);
        console.error(`Build ${build.id} failed:`, error);
      }

      // Remove from queue
      this.queue.builds = this.queue.builds.filter((b) => b.id !== build.id);
    }

    this.queue.status = "idle";
    this.queue.currentBuild = undefined;
    this.isBuilding = false;
  }

  private async executeBuild(profile: BuildProfile): Promise<BuildReport> {
    const buildId = `build-${Date.now()}`;
    const startTime = Date.now();

    console.log(`Starting build: ${profile.name} (${profile.id})`);

    try {
      // Create output directory
      await this.ensureDirectory(this.configuration.globalSettings.outputDirectory);

      // Validation phase
      const validationStartTime = Date.now();
      const validation = await this.validateProject(profile.validation);
      const validationTime = Date.now() - validationStartTime;

      if (validation.overall === "failed" && profile.validation.strictMode) {
        throw new Error("Build validation failed in strict mode");
      }

      // Build targets
      const targetReports: BuildTargetReport[] = [];
      const artifacts: BuildArtifact[] = [];

      for (const target of profile.targets) {
        try {
          const targetReport = await this.buildTarget(target, profile);
          targetReports.push(targetReport);

          if (targetReport.status === "success") {
            artifacts.push(...(await this.createArtifacts(target, targetReport)));
          }
        } catch (error) {
          targetReports.push({
            target,
            status: "error",
            outputPath: "",
            fileSize: 0,
            compressedSize: 0,
            checksum: "",
            warnings: [],
            errors: [error instanceof Error ? error.message : String(error)],
          });
        }
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const report: BuildReport = {
        buildId,
        profileId: profile.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        status: targetReports.some((t) => t.status === "error")
          ? "error"
          : targetReports.some((t) => t.status === "warning")
            ? "warning"
            : "success",
        targets: targetReports,
        validation,
        artifacts,
        warnings: [],
        errors: [],
        metrics: {
          totalBuildTime: duration,
          validationTime: validationTime / 1000,
          packagingTime: 0, // Would be calculated during packaging
          compressionRatio: this.calculateCompressionRatio(targetReports),
          assetOptimizationRatio: 0, // Would be calculated during optimization
          memoryUsage: 0, // Would be tracked during build
          cpuUsage: 0, // Would be tracked during build
          diskUsage: this.calculateDiskUsage(targetReports),
        },
      };

      console.log(`Build completed: ${profile.name} in ${duration}s`);
      return report;
    } catch (error) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      return {
        buildId,
        profileId: profile.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        status: "error",
        targets: [],
        validation: this.createEmptyValidation(),
        artifacts: [],
        warnings: [],
        errors: [
          {
            code: "BUILD_FAILED",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
        metrics: {
          totalBuildTime: duration,
          validationTime: 0,
          packagingTime: 0,
          compressionRatio: 0,
          assetOptimizationRatio: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          diskUsage: 0,
        },
      };
    }
  }

  private async validateProject(validation: BuildValidation): Promise<ValidationReport> {
    const projectRoot = this.getProjectRoot();

    const [assets, blueprints, audio, logic, dependencies, integrity] = await Promise.all([
      this.validateAssets(validation.validateAssets, projectRoot),
      this.validateBlueprints(validation.validateBlueprints, projectRoot),
      this.validateAudio(validation.validateAudio, projectRoot),
      this.validateLogic(validation.validateLogic, projectRoot),
      this.checkDependencies(validation.checkDependencies, projectRoot),
      this.verifyIntegrity(validation.verifyIntegrity, projectRoot),
    ]);

    const overall = this.determineOverallValidation([
      assets,
      blueprints,
      audio,
      logic,
      dependencies,
      integrity,
    ]);

    return {
      assets,
      blueprints,
      audio,
      logic,
      dependencies,
      integrity,
      overall,
    };
  }

  private async validateAssets(
    enabled: boolean,
    projectRoot: string,
  ): Promise<AssetValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        totalAssets: 0,
        validAssets: 0,
        invalidAssets: 0,
        missingAssets: [],
        corruptedAssets: [],
        oversizedAssets: [],
        issues: [],
      };
    }

    const assetsDir = path.join(projectRoot, "assets");
    const issues: AssetIssue[] = [];
    let totalAssets = 0;
    let validAssets = 0;

    try {
      const assetFiles = await this.getAllFiles(assetsDir, [
        "json",
        "png",
        "jpg",
        "jpeg",
        "wav",
        "mp3",
        "ogg",
      ]);
      totalAssets = assetFiles.length;

      for (const file of assetFiles) {
        try {
          const fileStat = await stat(file);
          const relativePath = path.relative(assetsDir, file);
          const assetId = relativePath.replace(/\.[^/.]+$/, ""); // Remove extension

          // Check file size (max 10MB for assets)
          if (fileStat.size > 10 * 1024 * 1024) {
            issues.push({
              assetId,
              type: "oversized",
              severity: "warning",
              message: `Asset is too large: ${Math.round(fileStat.size / 1024 / 1024)}MB`,
              suggestion: "Consider compressing or optimizing the asset",
            });
          }

          // Validate file format based on extension
          const ext = path.extname(file).toLowerCase();
          if (!this.isValidAssetFormat(ext)) {
            issues.push({
              assetId,
              type: "invalid_format",
              severity: "error",
              message: `Unsupported asset format: ${ext}`,
              suggestion: "Use supported formats: json, png, jpg, wav, mp3, ogg",
            });
          } else {
            validAssets++;
          }
        } catch (error) {
          const relativePath = path.relative(assetsDir, file);
          const assetId = relativePath.replace(/\.[^/.]+$/, "");

          issues.push({
            assetId,
            type: "corrupted",
            severity: "error",
            message: `Asset file is corrupted or unreadable: ${relativePath}`,
            suggestion: "Replace the asset file",
          });
        }
      }
    } catch (error) {
      return {
        status: "failed",
        totalAssets: 0,
        validAssets: 0,
        invalidAssets: 0,
        missingAssets: [],
        corruptedAssets: [],
        oversizedAssets: [],
        issues: [
          {
            assetId: "unknown",
            type: "corrupted",
            severity: "error",
            message: `Failed to scan assets directory: ${error}`,
            suggestion: "Check assets directory permissions",
          },
        ],
      };
    }

    const invalidAssets = issues.filter((i) => i.severity === "error").length;
    const status = invalidAssets > 0 ? "failed" : issues.length > 0 ? "warning" : "passed";

    return {
      status,
      totalAssets,
      validAssets,
      invalidAssets,
      missingAssets: issues.filter((i) => i.type === "missing").map((i) => i.assetId),
      corruptedAssets: issues.filter((i) => i.type === "corrupted").map((i) => i.assetId),
      oversizedAssets: issues.filter((i) => i.type === "oversized").map((i) => i.assetId),
      issues,
    };
  }

  private async validateBlueprints(
    enabled: boolean,
    projectRoot: string,
  ): Promise<BlueprintValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        totalBlueprints: 0,
        validBlueprints: 0,
        invalidBlueprints: 0,
        issues: [],
      };
    }

    // This would integrate with the existing blueprint validation
    // For now, return a placeholder
    return {
      status: "passed",
      totalBlueprints: 0,
      validBlueprints: 0,
      invalidBlueprints: 0,
      issues: [],
    };
  }

  private async validateAudio(
    enabled: boolean,
    projectRoot: string,
  ): Promise<AudioValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        totalAudioAssets: 0,
        validAudioAssets: 0,
        invalidAudioAssets: 0,
        issues: [],
      };
    }

    // Audio validation implementation
    return {
      status: "passed",
      totalAudioAssets: 0,
      validAudioAssets: 0,
      invalidAudioAssets: 0,
      issues: [],
    };
  }

  private async validateLogic(
    enabled: boolean,
    projectRoot: string,
  ): Promise<LogicValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        totalLogicGraphs: 0,
        validLogicGraphs: 0,
        invalidLogicGraphs: 0,
        issues: [],
      };
    }

    // Logic validation implementation
    return {
      status: "passed",
      totalLogicGraphs: 0,
      validLogicGraphs: 0,
      invalidLogicGraphs: 0,
      issues: [],
    };
  }

  private async checkDependencies(
    enabled: boolean,
    projectRoot: string,
  ): Promise<DependencyValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        totalDependencies: 0,
        resolvedDependencies: 0,
        unresolvedDependencies: [],
        circularDependencies: [],
        outdatedDependencies: [],
      };
    }

    // Dependency checking implementation
    return {
      status: "passed",
      totalDependencies: 0,
      resolvedDependencies: 0,
      unresolvedDependencies: [],
      circularDependencies: [],
      outdatedDependencies: [],
    };
  }

  private async verifyIntegrity(
    enabled: boolean,
    projectRoot: string,
  ): Promise<IntegrityValidationResult> {
    if (!enabled) {
      return {
        status: "passed",
        checksumsValid: true,
        signaturesValid: true,
        tamperedFiles: [],
        missingSignatures: [],
      };
    }

    // Integrity verification implementation
    return {
      status: "passed",
      checksumsValid: true,
      signaturesValid: true,
      tamperedFiles: [],
      missingSignatures: [],
    };
  }

  private async buildTarget(
    target: BuildTarget,
    profile: BuildProfile,
  ): Promise<BuildTargetReport> {
    const outputDir = path.join(
      this.configuration.globalSettings.outputDirectory,
      `${target.platform}-${target.architecture}`,
    );
    await this.ensureDirectory(outputDir);

    const outputPath = path.join(outputDir, target.outputName);

    // This is a simplified build process
    // In a real implementation, this would:
    // 1. Run the actual build process (Vite, Electron Builder, etc.)
    // 2. Apply optimizations
    // 3. Package according to format
    // 4. Generate checksums

    // Simulate build process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const fileSize = 1000000; // 1MB placeholder
    const compressedSize = fileSize * 0.8; // 20% compression placeholder
    const checksum = this.calculateChecksum(outputPath);

    return {
      target,
      status: "success",
      outputPath,
      fileSize,
      compressedSize,
      checksum,
      warnings: [],
      errors: [],
    };
  }

  private async createArtifacts(
    target: BuildTarget,
    report: BuildTargetReport,
  ): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];

    const artifact: BuildArtifact = {
      id: `artifact-${target.platform}-${target.architecture}-${Date.now()}`,
      name: target.outputName,
      type: target.format === "installer" ? "installer" : "archive",
      platform: target.platform,
      architecture: target.architecture,
      path: report.outputPath,
      size: report.fileSize,
      checksum: report.checksum,
    };

    artifacts.push(artifact);
    return artifacts;
  }

  // Utility methods
  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  private async getAllFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentDir: string): Promise<void> {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  private isValidAssetFormat(ext: string): boolean {
    return [".json", ".png", ".jpg", ".jpeg", ".wav", ".mp3", ".ogg"].includes(ext);
  }

  private determineOverallValidation(results: any[]): "passed" | "warning" | "failed" {
    if (results.some((r) => r.status === "failed")) return "failed";
    if (results.some((r) => r.status === "warning")) return "warning";
    return "passed";
  }

  private createEmptyValidation(): ValidationReport {
    return {
      assets: {
        status: "passed",
        totalAssets: 0,
        validAssets: 0,
        invalidAssets: 0,
        missingAssets: [],
        corruptedAssets: [],
        oversizedAssets: [],
        issues: [],
      },
      blueprints: {
        status: "passed",
        totalBlueprints: 0,
        validBlueprints: 0,
        invalidBlueprints: 0,
        issues: [],
      },
      audio: {
        status: "passed",
        totalAudioAssets: 0,
        validAudioAssets: 0,
        invalidAudioAssets: 0,
        issues: [],
      },
      logic: {
        status: "passed",
        totalLogicGraphs: 0,
        validLogicGraphs: 0,
        invalidLogicGraphs: 0,
        issues: [],
      },
      dependencies: {
        status: "passed",
        totalDependencies: 0,
        resolvedDependencies: 0,
        unresolvedDependencies: [],
        circularDependencies: [],
        outdatedDependencies: [],
      },
      integrity: {
        status: "passed",
        checksumsValid: true,
        signaturesValid: true,
        tamperedFiles: [],
        missingSignatures: [],
      },
      overall: "passed",
    };
  }

  private calculateCompressionRatio(targetReports: BuildTargetReport[]): number {
    const totalSize = targetReports.reduce((sum, report) => sum + report.fileSize, 0);
    const totalCompressed = targetReports.reduce((sum, report) => sum + report.compressedSize, 0);
    return totalSize > 0 ? totalCompressed / totalSize : 1;
  }

  private calculateDiskUsage(targetReports: BuildTargetReport[]): number {
    return targetReports.reduce((sum, report) => sum + report.fileSize, 0);
  }

  private calculateChecksum(filePath: string): string {
    // Placeholder implementation
    return createHash("sha256").update(filePath).digest("hex");
  }

  private getProjectRoot(): string {
    // This should be passed in or determined from the current context
    return process.cwd();
  }

  // Public API methods
  public getQueue(): BuildQueue {
    return { ...this.queue };
  }

  public getConfiguration(): BuildConfiguration {
    return { ...this.configuration };
  }

  public async createPublishBundle(
    buildReports: BuildReport[],
    metadata: Partial<PublishBundle> & {
      features?: string[];
      dependencies?: any[];
    },
  ): Promise<PublishBundle> {
    const bundle: PublishBundle = {
      id: `bundle-${Date.now()}`,
      name: metadata.name || "Procedural Pixel Engine Game",
      version: metadata.version || "1.0.0",
      description: metadata.description || "",
      author: metadata.author || "",
      website: metadata.website,
      repository: metadata.repository,
      license: metadata.license || "MIT",
      tags: metadata.tags || [],
      category: metadata.category || "game",
      platforms: [...new Set(buildReports.flatMap((r) => r.targets.map((t) => t.target.platform)))],
      minimumSystemRequirements: metadata.minimumSystemRequirements || {
        os: ["Windows 10", "macOS 10.14", "Ubuntu 20.04"],
        processor: "Dual Core CPU",
        memory: "4 GB RAM",
        graphics: "OpenGL 3.3",
        storage: "500 MB available space",
      },
      recommendedSystemRequirements: metadata.recommendedSystemRequirements || {
        os: ["Windows 11", "macOS 12.0", "Ubuntu 22.04"],
        processor: "Quad Core CPU",
        memory: "8 GB RAM",
        graphics: "OpenGL 4.1",
        storage: "1 GB available space",
      },
      screenshots: metadata.screenshots || [],
      trailer: metadata.trailer,
      changelog: metadata.changelog || [],
      buildReports,
      artifacts: [...new Set(buildReports.flatMap((r) => r.artifacts))],
      metadata: {
        engine: {
          name: "Procedural Pixel Engine",
          version: "1.0.0",
        },
        project: {
          name: metadata.name || "Untitled Project",
          version: metadata.version || "1.0.0",
          buildNumber: buildReports.length,
        },
        features: metadata.features || [],
        dependencies: metadata.dependencies || [],
        compatibility: {
          minimumEngineVersion: "1.0.0",
          compatiblePlatforms: [
            ...new Set(buildReports.flatMap((r) => r.targets.map((t) => t.target.platform))),
          ],
          deprecatedFeatures: [],
          breakingChanges: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return bundle;
  }

  public async exportBundle(bundle: PublishBundle, outputPath: string): Promise<void> {
    await this.ensureDirectory(path.dirname(outputPath));

    const bundleJson = JSON.stringify(bundle, null, 2);
    await writeFile(outputPath, bundleJson, "utf-8");
  }
}

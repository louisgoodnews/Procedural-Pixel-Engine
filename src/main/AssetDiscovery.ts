import { randomUUID } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetMappingEntry, AssetMappingFile } from "../shared/types";
import { BrowserLogger } from "../renderer/BrowserLogger";
import { AssetIndex } from "./AssetIndex";

export class AssetDiscovery {
  private static instance: AssetDiscovery | null = null;
  private watchers: Map<string, any> = new Map(); // FileSystemWatcher type

  static getInstance(): AssetDiscovery {
    if (!this.instance) {
      this.instance = new AssetDiscovery();
    }
    return this.instance;
  }

  async discoverAndIndexAssets(assetRoot: string): Promise<void> {
    BrowserLogger.info("AssetDiscovery", "Starting asset discovery and indexing", { assetRoot });

    try {
      // Discover all blueprint files
      const blueprintFiles = await this.discoverBlueprintFiles(assetRoot);
      const sceneFiles = await this.discoverSceneFiles(assetRoot);
      const logicFiles = await this.discoverLogicFiles(assetRoot);

      // Load existing mapping
      const mappingPath = path.join(assetRoot, "mapping.json");
      let existingMapping: AssetMappingFile;
      
      try {
        const mappingContent = await readFile(mappingPath, "utf-8");
        existingMapping = JSON.parse(mappingContent) as AssetMappingFile;
      } catch {
        existingMapping = {
          entries: [],
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
        };
      }

      // Create new mapping with discovered assets
      const newMapping = await this.createUpdatedMapping(
        existingMapping,
        blueprintFiles,
        sceneFiles,
        logicFiles,
        assetRoot
      );

      // Save updated mapping
      await writeFile(mappingPath, JSON.stringify(newMapping, null, 2));
      
      BrowserLogger.info("AssetDiscovery", "Asset discovery completed", {
        blueprints: blueprintFiles.length,
        scenes: sceneFiles.length,
        logic: logicFiles.length,
        totalEntries: newMapping.entries.length,
      });

    } catch (error) {
      BrowserLogger.error("AssetDiscovery", "Asset discovery failed", error);
      throw error;
    }
  }

  async startWatching(assetRoot: string): Promise<void> {
    BrowserLogger.info("AssetDiscovery", "Starting asset watching", { assetRoot });

    try {
      const blueprintDir = path.join(assetRoot, "blueprints");
      const scenesDir = path.join(assetRoot, "scenes");
      const logicDir = path.join(assetRoot, "logic");

      // Watch blueprint directory
      await this.watchDirectory(blueprintDir, "blueprint", assetRoot);
      
      // Watch scenes directory
      await this.watchDirectory(scenesDir, "scene", assetRoot);
      
      // Watch logic directory
      await this.watchDirectory(logicDir, "logic", assetRoot);

      BrowserLogger.info("AssetDiscovery", "Asset watching started");
    } catch (error) {
      BrowserLogger.error("AssetDiscovery", "Failed to start asset watching", error);
    }
  }

  async stopWatching(): Promise<void> {
    BrowserLogger.info("AssetDiscovery", "Stopping asset watching");

    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        BrowserLogger.debug("AssetDiscovery", `Stopped watching: ${path}`);
      } catch (error) {
        BrowserLogger.warn("AssetDiscovery", `Failed to stop watching: ${path}`, error);
      }
    }

    this.watchers.clear();
    BrowserLogger.info("AssetDiscovery", "Asset watching stopped");
  }

  private async discoverBlueprintFiles(assetRoot: string): Promise<string[]> {
    const blueprintDir = path.join(assetRoot, "blueprints");
    const files: string[] = [];

    try {
      const entries = await readdir(blueprintDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".json")) {
          const filePath = path.join(blueprintDir, entry.name);
          
          // Validate that it's a valid blueprint file
          if (await this.isValidBlueprintFile(filePath)) {
            files.push(entry.name);
            BrowserLogger.debug("AssetDiscovery", `Found blueprint file: ${entry.name}`);
          } else {
            BrowserLogger.warn("AssetDiscovery", `Invalid blueprint file: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      BrowserLogger.warn("AssetDiscovery", "Failed to scan blueprint directory", error);
    }

    return files;
  }

  private async discoverSceneFiles(assetRoot: string): Promise<string[]> {
    const scenesDir = path.join(assetRoot, "scenes");
    const files: string[] = [];

    try {
      const entries = await readdir(scenesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".json")) {
          const filePath = path.join(scenesDir, entry.name);
          
          if (await this.isValidSceneFile(filePath)) {
            files.push(entry.name);
            BrowserLogger.debug("AssetDiscovery", `Found scene file: ${entry.name}`);
          } else {
            BrowserLogger.warn("AssetDiscovery", `Invalid scene file: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      BrowserLogger.warn("AssetDiscovery", "Failed to scan scenes directory", error);
    }

    return files;
  }

  private async discoverLogicFiles(assetRoot: string): Promise<string[]> {
    const logicDir = path.join(assetRoot, "logic");
    const files: string[] = [];

    try {
      const entries = await readdir(logicDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".json")) {
          const filePath = path.join(logicDir, entry.name);
          
          if (await this.isValidLogicFile(filePath)) {
            files.push(entry.name);
            BrowserLogger.debug("AssetDiscovery", `Found logic file: ${entry.name}`);
          } else {
            BrowserLogger.warn("AssetDiscovery", `Invalid logic file: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      BrowserLogger.warn("AssetDiscovery", "Failed to scan logic directory", error);
    }

    return files;
  }

  private async isValidBlueprintFile(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      
      // Check for required blueprint fields
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.name === "string" &&
        typeof parsed.pixelSize === "number" &&
        Array.isArray(parsed.matrix) &&
        parsed.matrix.every((row: any) => Array.isArray(row))
      );
    } catch {
      return false;
    }
  }

  private async isValidSceneFile(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.name === "string" &&
        Array.isArray(parsed.entities)
      );
    } catch {
      return false;
    }
  }

  private async isValidLogicFile(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.id === "string" &&
        typeof parsed.graph === "object"
      );
    } catch {
      return false;
    }
  }

  private async createUpdatedMapping(
    existing: AssetMappingFile,
    blueprintFiles: string[],
    sceneFiles: string[],
    logicFiles: string[],
    assetRoot: string
  ): Promise<AssetMappingFile> {
    const entries: AssetMappingEntry[] = [];
    const now = new Date().toISOString();
    const existingEntries = new Map(existing.entries.map(e => [e.fileName, e]));

    // Process blueprint files
    for (const fileName of blueprintFiles) {
      const existing = existingEntries.get(fileName);
      if (existing) {
        // Update existing entry
        entries.push({
          ...existing,
          updatedAt: now,
        });
        existingEntries.delete(fileName);
      } else {
        // Create new entry - read name from JSON file
        const id = this.generateAssetId(fileName);
        const filePath = path.join(assetRoot, "blueprints", fileName);
        const name = await this.extractNameFromJsonFile(filePath);
        entries.push({
          fileName,
          id,
          kind: "blueprint",
          name,
          updatedAt: now,
        });
      }
    }

    // Process scene files
    for (const fileName of sceneFiles) {
      const existing = existingEntries.get(fileName);
      if (existing) {
        entries.push({
          ...existing,
          updatedAt: now,
        });
        existingEntries.delete(fileName);
      } else {
        const id = this.generateAssetId(fileName);
        const filePath = path.join(assetRoot, "scenes", fileName);
        const name = await this.extractNameFromJsonFile(filePath);
        entries.push({
          fileName,
          id,
          kind: "scene",
          name,
          updatedAt: now,
        });
      }
    }

    // Process logic files
    for (const fileName of logicFiles) {
      const existing = existingEntries.get(fileName);
      if (existing) {
        entries.push({
          ...existing,
          updatedAt: now,
        });
        existingEntries.delete(fileName);
      } else {
        const id = this.generateAssetId(fileName);
        const filePath = path.join(assetRoot, "logic", fileName);
        const name = await this.extractNameFromJsonFile(filePath);
        entries.push({
          fileName,
          id,
          kind: "logic",
          name,
          updatedAt: now,
        });
      }
    }

    // Log orphaned entries (files that were in mapping but no longer exist)
    for (const [fileName, entry] of existingEntries) {
      BrowserLogger.warn("AssetDiscovery", `Orphaned mapping entry: ${fileName}`, entry);
    }

    return {
      entries,
      schemaVersion: 1,
      updatedAt: now,
    };
  }

  private generateAssetId(fileName: string): string {
    // Check if filename is already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const nameWithoutExt = fileName.replace(/\.json$/i, "");
    
    if (uuidRegex.test(nameWithoutExt)) {
      return nameWithoutExt;
    }
    
    // Generate new UUID for named files
    return randomUUID();
  }

  private async extractNameFromJsonFile(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      
      // Extract name from the JSON file content
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        return parsed.name.trim();
      }
      
      // Fallback to filename-based extraction
      return this.extractNameFromFileName(filePath);
    } catch {
      // If we can't read the file, fallback to filename
      return this.extractNameFromFileName(filePath);
    }
  }

  private extractNameFromFileName(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.json$/i, "");
    
    // If it's a UUID, generate a generic name
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(nameWithoutExt)) {
      return `asset-${nameWithoutExt.substring(0, 8)}`;
    }
    
    return nameWithoutExt;
  }

  private async watchDirectory(dirPath: string, assetType: "blueprint" | "scene" | "logic", assetRoot: string): Promise<void> {
    try {
      // In a real implementation, you'd use Node.js fs.watch or chokidar
      // For now, we'll simulate file watching with polling
      
      const watcher = {
        close: () => {}, // Placeholder
        // In real implementation: fs.watch(dirPath, (eventType, filename) => { ... })
      };

      this.watchers.set(dirPath, watcher);
      
      BrowserLogger.debug("AssetDiscovery", `Started watching directory: ${dirPath}`);
      
      // Simulate file system events (in real implementation, this would be event-driven)
      setInterval(async () => {
        await this.discoverAndIndexAssets(assetRoot);
      }, 5000); // Check every 5 seconds
      
    } catch (error) {
      BrowserLogger.error("AssetDiscovery", `Failed to watch directory: ${dirPath}`, error);
    }
  }
}

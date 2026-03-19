import { BrowserLogger } from "../BrowserLogger";

// Plugin types
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  category: PluginCategory;
  engineVersion: string;
  dependencies: string[];
  permissions: PluginPermission[];
  createdAt: number;
  updatedAt: number;
}

export enum PluginCategory {
  Rendering = "rendering",
  Audio = "audio",
  Physics = "physics",
  AI = "ai",
  UI = "ui",
  Tools = "tools",
  Content = "content",
  Network = "network",
  System = "system",
  Other = "other"
}

export enum PluginPermission {
  FileSystem = "fileSystem",
  Network = "network",
  SystemInfo = "systemInfo",
  UserInput = "userInput",
  Graphics = "graphics",
  Audio = "audio",
  Database = "database",
  Custom = "custom"
}

export interface PluginManifest {
  metadata: PluginMetadata;
  entryPoint: string;
  assets: string[];
  config: PluginConfig;
}

export interface PluginConfig {
  autoLoad: boolean;
  hotReload: boolean;
  isolated: boolean;
  maxMemory?: number;
  timeout?: number;
  environment: Record<string, string>;
}

export interface PluginState {
  manifest: PluginManifest;
  loaded: boolean;
  enabled: boolean;
  error?: string;
  loadTime?: number;
  memoryUsage: number;
  apiCalls: number;
  lastActivity: number;
}

export interface PluginEvent {
  eventType: string;
  data: any;
  source: string;
  timestamp: number;
}

export interface PluginPerformanceStats {
  totalPlugins: number;
  enabledPlugins: number;
  totalMemory: number;
  totalApiCalls: number;
  averageMemoryPerPlugin: number;
}

// Plugin Manager Class
export class PluginManager {
  private wasmModule: any;
  private pluginManagerWrapper: any;
  private plugins: Map<string, PluginState> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private hotReloadWatchers: Map<string, FileSystemWatcher> = new Map();

  constructor() {
    this.initializeWasm();
  }

  private async initializeWasm(): Promise<void> {
    try {
      // Import WASM module
      const module = await import("../../pkg/procedural_pixel_engine_core.js");
      await module.default();
      
      this.wasmModule = module;
      this.pluginManagerWrapper = new module.PluginManagerWrapper();
      
      BrowserLogger.info("PluginManager", "WASM plugin manager initialized");
    } catch (error) {
      BrowserLogger.error("PluginManager", "Failed to initialize WASM plugin manager", error);
    }
  }

  // Plugin lifecycle management
  async loadPlugin(manifest: PluginManifest): Promise<string> {
    BrowserLogger.info("PluginManager", `Loading plugin: ${manifest.metadata.name}`);

    try {
      // Validate manifest
      this.validateManifest(manifest);

      // Load through WASM
      const manifestJson = JSON.stringify(manifest);
      const pluginId = await this.pluginManagerWrapper.load_plugin(manifestJson);

      // Store in local cache
      const pluginState: PluginState = {
        manifest,
        loaded: true,
        enabled: false,
        memoryUsage: 0,
        apiCalls: 0,
        lastActivity: Date.now()
      };

      this.plugins.set(pluginId, pluginState);

      // Setup hot-reload if enabled
      if (manifest.config.hotReload) {
        this.setupHotReload(pluginId, manifest);
      }

      BrowserLogger.info("PluginManager", `Plugin loaded successfully: ${pluginId}`);
      this.emitEvent("pluginLoaded", { pluginId, manifest });
      
      return pluginId;
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to load plugin: ${manifest.metadata.name}`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginManager", `Enabling plugin: ${pluginId}`);

    try {
      await this.pluginManagerWrapper.enable_plugin(pluginId);
      
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.enabled = true;
        plugin.loadTime = Date.now();
      }

      BrowserLogger.info("PluginManager", `Plugin enabled: ${pluginId}`);
      this.emitEvent("pluginEnabled", { pluginId });
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to enable plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginManager", `Disabling plugin: ${pluginId}`);

    try {
      await this.pluginManagerWrapper.disable_plugin(pluginId);
      
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.enabled = false;
      }

      BrowserLogger.info("PluginManager", `Plugin disabled: ${pluginId}`);
      this.emitEvent("pluginDisabled", { pluginId });
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to disable plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginManager", `Unloading plugin: ${pluginId}`);

    try {
      await this.pluginManagerWrapper.unload_plugin(pluginId);
      
      // Remove hot-reload watcher
      const watcher = this.hotReloadWatchers.get(pluginId);
      if (watcher) {
        watcher.dispose();
        this.hotReloadWatchers.delete(pluginId);
      }

      this.plugins.delete(pluginId);

      BrowserLogger.info("PluginManager", `Plugin unloaded: ${pluginId}`);
      this.emitEvent("pluginUnloaded", { pluginId });
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to unload plugin: ${pluginId}`, error);
      throw error;
    }
  }

  // Plugin information
  getPluginList(): PluginState[] {
    const pluginsJson = this.pluginManagerWrapper.get_plugin_list();
    return JSON.parse(pluginsJson);
  }

  getPlugin(pluginId: string): PluginState | null {
    const pluginJson = this.pluginManagerWrapper.get_plugin(pluginId);
    return pluginJson ? JSON.parse(pluginJson) : null;
  }

  getPerformanceStats(): PluginPerformanceStats {
    const statsJson = this.pluginManagerWrapper.get_performance_stats();
    return JSON.parse(statsJson);
  }

  // Event system
  emitEvent(eventType: string, data: any): void {
    const event: PluginEvent = {
      eventType,
      data,
      source: "PluginManager",
      timestamp: Date.now()
    };

    this.pluginManagerWrapper.emit_event(JSON.stringify(event));

    // Notify local listeners
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => listener(event));
  }

  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Hot-reload system
  private setupHotReload(pluginId: string, manifest: PluginManifest): void {
    BrowserLogger.info("PluginManager", `Setting up hot-reload for: ${pluginId}`);

    // In a real implementation, this would watch for file changes
    // For now, we'll simulate hot-reload with a timer
    const watcher = {
      dispose: () => {
        BrowserLogger.info("PluginManager", `Hot-reload watcher disposed for: ${pluginId}`);
      }
    };

    this.hotReloadWatchers.set(pluginId, watcher);
  }

  // Validation
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.metadata.id || !manifest.metadata.name || !manifest.metadata.version) {
      throw new Error("Plugin manifest missing required fields (id, name, version)");
    }

    if (!manifest.metadata.engineVersion) {
      throw new Error("Plugin manifest missing engine version");
    }

    // Validate version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(manifest.metadata.version)) {
      throw new Error("Invalid version format. Expected semantic version (x.y.z)");
    }

    // Validate category
    const validCategories = Object.values(PluginCategory);
    if (!validCategories.includes(manifest.metadata.category as PluginCategory)) {
      throw new Error(`Invalid plugin category: ${manifest.metadata.category}`);
    }
  }

  // Plugin installation from marketplace
  async installFromMarketplace(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginManager", `Installing plugin from marketplace: ${pluginId}`);

    try {
      // In a real implementation, this would download from marketplace
      // For now, we'll simulate installation
      const manifest = await this.fetchMarketplaceManifest(pluginId);
      await this.loadPlugin(manifest);
      
      BrowserLogger.info("PluginManager", `Plugin installed from marketplace: ${pluginId}`);
      this.emitEvent("pluginInstalled", { pluginId, source: "marketplace" });
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to install plugin from marketplace: ${pluginId}`, error);
      throw error;
    }
  }

  private async fetchMarketplaceManifest(pluginId: string): Promise<PluginManifest> {
    // Simulate marketplace API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock manifest for demonstration
        const mockManifest: PluginManifest = {
          metadata: {
            id: pluginId,
            name: `Plugin ${pluginId}`,
            version: "1.0.0",
            description: "A sample plugin from marketplace",
            author: "Marketplace Developer",
            license: "MIT",
            category: PluginCategory.Tools,
            engineVersion: "1.0.0",
            dependencies: [],
            permissions: [PluginPermission.Graphics],
            keywords: ["sample", "demo"],
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          entryPoint: "index.js",
          assets: [],
          config: {
            autoLoad: true,
            hotReload: false,
            isolated: true,
            maxMemory: 64 * 1024 * 1024,
            timeout: 30000,
            environment: {}
          }
        };

        resolve(mockManifest);
      }, 1000);
    });
  }

  // Update system
  async checkForUpdates(): Promise<PluginUpdate[]> {
    BrowserLogger.info("PluginManager", "Checking for plugin updates");

    const updates: PluginUpdate[] = [];
    
    for (const [pluginId, plugin] of this.plugins) {
      try {
        const latestVersion = await this.fetchLatestVersion(pluginId);
        if (this.isNewerVersion(latestVersion, plugin.manifest.metadata.version)) {
          updates.push({
            pluginId,
            currentVersion: plugin.manifest.metadata.version,
            latestVersion,
            changelog: await this.fetchChangelog(pluginId)
          });
        }
      } catch (error) {
        BrowserLogger.warn("PluginManager", `Failed to check updates for ${pluginId}`, error);
      }
    }

    BrowserLogger.info("PluginManager", `Found ${updates.length} plugin updates`);
    return updates;
  }

  private async fetchLatestVersion(pluginId: string): Promise<string> {
    // Simulate version check
    return "1.1.0";
  }

  private async fetchChangelog(pluginId: string): Promise<string> {
    // Simulate changelog fetch
    return "Bug fixes and performance improvements";
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  async updatePlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginManager", `Updating plugin: ${pluginId}`);

    try {
      // Disable and unload current version
      await this.disablePlugin(pluginId);
      await this.unloadPlugin(pluginId);

      // Install new version
      await this.installFromMarketplace(pluginId);

      BrowserLogger.info("PluginManager", `Plugin updated: ${pluginId}`);
      this.emitEvent("pluginUpdated", { pluginId });
    } catch (error) {
      BrowserLogger.error("PluginManager", `Failed to update plugin: ${pluginId}`, error);
      throw error;
    }
  }

  // Cleanup
  dispose(): void {
    BrowserLogger.info("PluginManager", "Disposing plugin manager");

    // Unload all plugins
    for (const pluginId of this.plugins.keys()) {
      try {
        this.unloadPlugin(pluginId);
      } catch (error) {
        BrowserLogger.warn("PluginManager", `Failed to unload plugin during disposal: ${pluginId}`, error);
      }
    }

    // Dispose hot-reload watchers
    for (const watcher of this.hotReloadWatchers.values()) {
      watcher.dispose();
    }

    this.plugins.clear();
    this.eventListeners.clear();
    this.hotReloadWatchers.clear();
  }
}

// Supporting types
export interface PluginUpdate {
  pluginId: string;
  currentVersion: string;
  latestVersion: string;
  changelog: string;
}

// File system watcher interface (simplified)
interface FileSystemWatcher {
  dispose(): void;
}

// Global plugin manager instance
let globalPluginManager: PluginManager | null = null;

export function getPluginManager(): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager();
  }
  return globalPluginManager;
}

// Utility functions
export function createPluginManifest(
  id: string,
  name: string,
  version: string,
  description: string,
  author: string,
  category: PluginCategory
): PluginManifest {
  return {
    metadata: {
      id,
      name,
      version,
      description,
      author,
      license: "MIT",
      category,
      engineVersion: "1.0.0",
      dependencies: [],
      permissions: [PluginPermission.Graphics],
      keywords: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    entryPoint: "index.js",
    assets: [],
    config: {
      autoLoad: true,
      hotReload: false,
      isolated: true,
      maxMemory: 64 * 1024 * 1024,
      timeout: 30000,
      environment: {}
    }
  };
}

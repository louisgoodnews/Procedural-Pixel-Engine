import { BrowserLogger } from "../BrowserLogger";
import { PluginManager, PluginManifest, PluginCategory, PluginMetadata, PluginPermission } from "./PluginManager";

// Marketplace types
export interface MarketplacePlugin {
  id: string;
  metadata: PluginMetadata;
  manifest: PluginManifest;
  downloadUrl: string;
  documentationUrl: string;
  supportUrl: string;
  rating: number;
  downloadCount: number;
  reviews: PluginReview[];
  tags: string[];
  featured: boolean;
  verified: boolean;
  price: number;
  license: string;
  screenshots: string[];
  videos: string[];
  lastUpdated: number;
}

export interface PluginReview {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
  helpful: number;
  verified: boolean;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  pluginCount: number;
}

export interface MarketplaceSearch {
  query: string;
  category?: PluginCategory;
  tags?: string[];
  priceRange?: [number, number];
  rating?: number;
  verified?: boolean;
  sortBy?: "popularity" | "rating" | "newest" | "updated";
  sortOrder?: "asc" | "desc";
}

export interface MarketplaceStats {
  totalPlugins: number;
  totalDownloads: number;
  totalReviews: number;
  averageRating: number;
  categories: MarketplaceCategory[];
  featuredPlugins: MarketplacePlugin[];
  recentlyUpdated: MarketplacePlugin[];
}

// Plugin Marketplace Class
export class PluginMarketplace {
  private pluginManager: PluginManager;
  private plugins: Map<string, MarketplacePlugin> = new Map();
  private categories: Map<string, MarketplaceCategory> = new Map();
  private userPlugins: Set<string> = new Set();
  private installedPlugins: Set<string> = new Set();

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    this.initializeCategories();
    this.loadMockData();
  }

  private initializeCategories(): void {
    const categories: MarketplaceCategory[] = [
      {
        id: PluginCategory.Rendering,
        name: "Rendering",
        description: "Plugins for graphics, rendering, and visual effects",
        icon: "🎨",
        pluginCount: 0
      },
      {
        id: PluginCategory.Audio,
        name: "Audio",
        description: "Plugins for sound, music, and audio processing",
        icon: "🎵",
        pluginCount: 0
      },
      {
        id: PluginCategory.Physics,
        name: "Physics",
        description: "Plugins for physics simulation and collision detection",
        icon: "⚛️",
        pluginCount: 0
      },
      {
        id: PluginCategory.AI,
        name: "AI & Machine Learning",
        description: "Plugins for artificial intelligence and machine learning",
        icon: "🤖",
        pluginCount: 0
      },
      {
        id: PluginCategory.UI,
        name: "User Interface",
        description: "Plugins for user interfaces and interaction systems",
        icon: "🖥️",
        pluginCount: 0
      },
      {
        id: PluginCategory.Tools,
        name: "Development Tools",
        description: "Plugins for development, debugging, and productivity",
        icon: "🔧",
        pluginCount: 0
      },
      {
        id: PluginCategory.Content,
        name: "Content & Assets",
        description: "Plugins for content creation and asset management",
        icon: "📦",
        pluginCount: 0
      },
      {
        id: PluginCategory.Network,
        name: "Networking",
        description: "Plugins for networking, multiplayer, and online features",
        icon: "🌐",
        pluginCount: 0
      },
      {
        id: PluginCategory.System,
        name: "System & Utilities",
        description: "Plugins for system utilities and core functionality",
        icon: "⚙️",
        pluginCount: 0
      }
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private loadMockData(): void {
    // Load mock marketplace data
    const mockPlugins = this.generateMockPlugins();
    
    mockPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
      
      // Update category count
      const category = this.categories.get(plugin.metadata.category);
      if (category) {
        category.pluginCount++;
      }
    });

    BrowserLogger.info("PluginMarketplace", `Loaded ${mockPlugins.length} mock plugins`);
  }

  private generateMockPlugins(): MarketplacePlugin[] {
    return [
      {
        id: "advanced-particle-system",
        metadata: {
          id: "advanced-particle-system",
          name: "Advanced Particle System",
          version: "2.1.0",
          description: "High-performance GPU-accelerated particle system with advanced effects",
          author: "Graphics Studio",
          license: "MIT",
          homepage: "https://graphics-studio.com/particles",
          repository: "https://github.com/graphics-studio/particles",
          keywords: ["particles", "effects", "gpu", "performance"],
          category: PluginCategory.Rendering,
          engineVersion: "1.0.0",
          dependencies: [],
          permissions: [],
          createdAt: Date.now() - 86400000 * 30,
          updatedAt: Date.now() - 86400000 * 5
        },
        manifest: {
          metadata: {} as PluginMetadata,
          entryPoint: "index.js",
          assets: ["shaders/", "textures/"],
          config: {
            autoLoad: true,
            hotReload: false,
            isolated: true,
            maxMemory: 128 * 1024 * 1024,
            timeout: 30000,
            environment: {}
          }
        },
        downloadUrl: "https://marketplace.com/download/advanced-particle-system",
        documentationUrl: "https://docs.graphics-studio.com/particles",
        supportUrl: "https://support.graphics-studio.com",
        rating: 4.8,
        downloadCount: 15420,
        reviews: [
          {
            id: "review-1",
            userId: "user-123",
            username: "DevMaster",
            rating: 5,
            comment: "Excellent particle system! Performance is amazing.",
            createdAt: Date.now() - 86400000 * 2,
            helpful: 42,
            verified: true
          },
          {
            id: "review-2",
            userId: "user-456",
            username: "GameDev99",
            rating: 4,
            comment: "Great effects, but documentation could be better.",
            createdAt: Date.now() - 86400000 * 7,
            helpful: 18,
            verified: false
          }
        ],
        tags: ["particles", "gpu", "effects", "performance", "graphics"],
        featured: true,
        verified: true,
        price: 0,
        license: "MIT",
        screenshots: [
          "https://marketplace.com/screenshots/particles-1.png",
          "https://marketplace.com/screenshots/particles-2.png"
        ],
        videos: [
          "https://marketplace.com/videos/particles-demo.mp4"
        ],
        lastUpdated: Date.now() - 86400000 * 5
      },
      {
        id: "procedural-audio-generator",
        metadata: {
          id: "procedural-audio-generator",
          name: "Procedural Audio Generator",
          version: "1.5.2",
          description: "Generate dynamic audio and music procedurally for your games",
          author: "Audio Labs",
          license: "Commercial",
          homepage: "https://audiolabs.com/procedural",
          repository: "https://github.com/audiolabs/procedural",
          keywords: ["audio", "music", "procedural", "sound"],
          category: PluginCategory.Audio,
          engineVersion: "1.0.0",
          dependencies: [],
          permissions: [PluginPermission.Audio],
          createdAt: Date.now() - 86400000 * 60,
          updatedAt: Date.now() - 86400000 * 10
        },
        manifest: {
          metadata: {} as PluginMetadata,
          entryPoint: "index.js",
          assets: ["samples/", "presets/"],
          config: {
            autoLoad: false,
            hotReload: false,
            isolated: true,
            maxMemory: 64 * 1024 * 1024,
            timeout: 30000,
            environment: {}
          }
        },
        downloadUrl: "https://marketplace.com/download/procedural-audio-generator",
        documentationUrl: "https://docs.audiolabs.com/procedural",
        supportUrl: "https://support.audiolabs.com",
        rating: 4.6,
        downloadCount: 8934,
        reviews: [
          {
            id: "review-3",
            userId: "user-789",
            username: "SoundDesigner",
            rating: 5,
            comment: "Revolutionary procedural audio! Saves so much time.",
            createdAt: Date.now() - 86400000 * 3,
            helpful: 31,
            verified: true
          }
        ],
        tags: ["audio", "music", "procedural", "sound", "dynamic"],
        featured: true,
        verified: true,
        price: 29.99,
        license: "Commercial",
        screenshots: [
          "https://marketplace.com/screenshots/audio-1.png",
          "https://marketplace.com/screenshots/audio-2.png"
        ],
        videos: [
          "https://marketplace.com/videos/audio-demo.mp4"
        ],
        lastUpdated: Date.now() - 86400000 * 10
      },
      {
        id: "ai-behavior-trees",
        metadata: {
          id: "ai-behavior-trees",
          name: "AI Behavior Trees",
          version: "3.0.1",
          description: "Visual behavior tree editor and runtime for advanced AI",
          author: "AI Systems",
          license: "MIT",
          homepage: "https://aisystems.com/behavior-trees",
          repository: "https://github.com/aisystems/behavior-trees",
          keywords: ["ai", "behavior", "trees", "visual", "editor"],
          category: PluginCategory.AI,
          engineVersion: "1.0.0",
          dependencies: [],
          permissions: [],
          createdAt: Date.now() - 86400000 * 45,
          updatedAt: Date.now() - 86400000 * 15
        },
        manifest: {
          metadata: {} as PluginMetadata,
          entryPoint: "index.js",
          assets: ["templates/", "behaviors/"],
          config: {
            autoLoad: true,
            hotReload: true,
            isolated: true,
            maxMemory: 96 * 1024 * 1024,
            timeout: 30000,
            environment: {}
          }
        },
        downloadUrl: "https://marketplace.com/download/ai-behavior-trees",
        documentationUrl: "https://docs.aisystems.com/behavior-trees",
        supportUrl: "https://support.aisystems.com",
        rating: 4.9,
        downloadCount: 12876,
        reviews: [
          {
            id: "review-4",
            userId: "user-101",
            username: "AIDev",
            rating: 5,
            comment: "Best behavior tree system I've used. Visual editor is fantastic!",
            createdAt: Date.now() - 86400000 * 1,
            helpful: 28,
            verified: true
          }
        ],
        tags: ["ai", "behavior", "trees", "visual", "editor", "gameplay"],
        featured: false,
        verified: true,
        price: 0,
        license: "MIT",
        screenshots: [
          "https://marketplace.com/screenshots/ai-1.png",
          "https://marketplace.com/screenshots/ai-2.png"
        ],
        videos: [
          "https://marketplace.com/videos/ai-demo.mp4"
        ],
        lastUpdated: Date.now() - 86400000 * 15
      }
    ];
  }

  // Marketplace operations
  async searchPlugins(search: MarketplaceSearch): Promise<MarketplacePlugin[]> {
    BrowserLogger.info("PluginMarketplace", `Searching plugins: ${search.query}`);

    let results = Array.from(this.plugins.values());

    // Apply filters
    if (search.query) {
      const query = search.query.toLowerCase();
      results = results.filter(plugin => 
        plugin.metadata.name.toLowerCase().includes(query) ||
        plugin.metadata.description.toLowerCase().includes(query) ||
        plugin.metadata.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (search.category) {
      results = results.filter(plugin => plugin.metadata.category === search.category);
    }

    if (search.tags && search.tags.length > 0) {
      results = results.filter(plugin => 
        search.tags!.some(tag => plugin.tags.includes(tag))
      );
    }

    if (search.priceRange) {
      results = results.filter(plugin => 
        plugin.price >= search.priceRange![0] && plugin.price <= search.priceRange![1]
      );
    }

    if (search.rating) {
      results = results.filter(plugin => plugin.rating >= search.rating!);
    }

    if (search.verified !== undefined) {
      results = results.filter(plugin => plugin.verified === search.verified);
    }

    // Apply sorting
    if (search.sortBy) {
      results.sort((a, b) => {
        let comparison = 0;

        switch (search.sortBy) {
          case "popularity":
            comparison = b.downloadCount - a.downloadCount;
            break;
          case "rating":
            comparison = b.rating - a.rating;
            break;
          case "newest":
            comparison = b.metadata.createdAt - a.metadata.createdAt;
            break;
          case "updated":
            comparison = b.lastUpdated - a.lastUpdated;
            break;
        }

        return search.sortOrder === "desc" ? comparison : -comparison;
      });
    }

    BrowserLogger.info("PluginMarketplace", `Found ${results.length} plugins matching search`);
    return results;
  }

  async getPlugin(pluginId: string): Promise<MarketplacePlugin | null> {
    return this.plugins.get(pluginId) || null;
  }

  async getFeaturedPlugins(): Promise<MarketplacePlugin[]> {
    return Array.from(this.plugins.values()).filter(plugin => plugin.featured);
  }

  async getRecentlyUpdated(): Promise<MarketplacePlugin[]> {
    const allPlugins = Array.from(this.plugins.values());
    return allPlugins
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, 10);
  }

  async getCategories(): Promise<MarketplaceCategory[]> {
    return Array.from(this.categories.values());
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const allPlugins = Array.from(this.plugins.values());
    const totalDownloads = allPlugins.reduce((sum, plugin) => sum + plugin.downloadCount, 0);
    const totalReviews = allPlugins.reduce((sum, plugin) => sum + plugin.reviews.length, 0);
    const averageRating = allPlugins.length > 0 
      ? allPlugins.reduce((sum, plugin) => sum + plugin.rating, 0) / allPlugins.length 
      : 0;

    return {
      totalPlugins: allPlugins.length,
      totalDownloads,
      totalReviews,
      averageRating,
      categories: Array.from(this.categories.values()),
      featuredPlugins: allPlugins.filter(plugin => plugin.featured),
      recentlyUpdated: await this.getRecentlyUpdated()
    };
  }

  // Plugin installation
  async installPlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginMarketplace", `Installing plugin: ${pluginId}`);

    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    try {
      // Check if already installed
      if (this.installedPlugins.has(pluginId)) {
        throw new Error(`Plugin already installed: ${pluginId}`);
      }

      // Download and install through plugin manager
      await this.pluginManager.loadPlugin(plugin.manifest);
      await this.pluginManager.enablePlugin(pluginId);

      // Track installation
      this.installedPlugins.add(pluginId);
      plugin.downloadCount++;

      BrowserLogger.info("PluginMarketplace", `Plugin installed successfully: ${pluginId}`);
    } catch (error) {
      BrowserLogger.error("PluginMarketplace", `Failed to install plugin: ${pluginId}`, error);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    BrowserLogger.info("PluginMarketplace", `Uninstalling plugin: ${pluginId}`);

    try {
      // Check if installed
      if (!this.installedPlugins.has(pluginId)) {
        throw new Error(`Plugin not installed: ${pluginId}`);
      }

      // Uninstall through plugin manager
      await this.pluginManager.unloadPlugin(pluginId);

      // Remove from installed list
      this.installedPlugins.delete(pluginId);

      BrowserLogger.info("PluginMarketplace", `Plugin uninstalled successfully: ${pluginId}`);
    } catch (error) {
      BrowserLogger.error("PluginMarketplace", `Failed to uninstall plugin: ${pluginId}`, error);
      throw error;
    }
  }

  // Review system
  async addReview(pluginId: string, review: Omit<PluginReview, "id" | "createdAt" | "helpful" | "verified">): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const newReview: PluginReview = {
      ...review,
      id: `review-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      helpful: 0,
      verified: false // In real implementation, this would check user verification
    };

    plugin.reviews.push(newReview);

    // Update rating
    const totalRating = plugin.reviews.reduce((sum, r) => sum + r.rating, 0);
    plugin.rating = totalRating / plugin.reviews.length;

    BrowserLogger.info("PluginMarketplace", `Review added for plugin: ${pluginId}`);
  }

  async markReviewHelpful(pluginId: string, reviewId: string, userId: string): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const review = plugin.reviews.find(r => r.id === reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    review.helpful++;

    BrowserLogger.info("PluginMarketplace", `Review marked as helpful: ${reviewId}`);
  }

  // User management
  async getUserPlugins(userId: string): Promise<MarketplacePlugin[]> {
    // In a real implementation, this would fetch from user's account
    return Array.from(this.plugins.values()).filter(plugin => 
      this.userPlugins.has(plugin.id) || this.installedPlugins.has(plugin.id)
    );
  }

  async purchasePlugin(pluginId: string, userId: string): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.price === 0) {
      // Free plugin
      this.userPlugins.add(pluginId);
      return;
    }

    // In a real implementation, this would process payment
    BrowserLogger.info("PluginMarketplace", `Plugin purchased: ${pluginId} by user: ${userId}`);
    this.userPlugins.add(pluginId);
  }

  // Utility methods
  isPluginInstalled(pluginId: string): boolean {
    return this.installedPlugins.has(pluginId);
  }

  isPluginOwned(pluginId: string): boolean {
    return this.userPlugins.has(pluginId);
  }

  getInstalledPlugins(): MarketplacePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.installedPlugins.has(plugin.id)
    );
  }

  getOwnedPlugins(): MarketplacePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.userPlugins.has(plugin.id)
    );
  }
}

// Global marketplace instance
let globalMarketplace: PluginMarketplace | null = null;

export function getPluginMarketplace(): PluginMarketplace {
  if (!globalMarketplace) {
    const pluginManager = getPluginManager();
    globalMarketplace = new PluginMarketplace(pluginManager);
  }
  return globalMarketplace;
}

// Import getPluginManager
import { getPluginManager } from "./PluginManager";

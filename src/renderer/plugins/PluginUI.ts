import { BrowserLogger } from "../BrowserLogger";
import { PluginManager, PluginState, PluginCategory, PluginPermission } from "./PluginManager";
import { PluginMarketplace, MarketplacePlugin, MarketplaceSearch } from "./PluginMarketplace";

// UI types
export interface PluginUIState {
  currentView: "manager" | "marketplace" | "installed" | "settings";
  selectedPlugin?: PluginState | MarketplacePlugin;
  searchQuery: string;
  selectedCategory?: PluginCategory;
  sortBy: "popularity" | "rating" | "newest" | "updated";
  sortOrder: "asc" | "desc";
  showInstalledOnly: boolean;
  showVerifiedOnly: boolean;
  priceRange: [number, number];
  selectedTags: string[];
}

export interface PluginUIEvent {
  type: "plugin-selected" | "plugin-installed" | "plugin-uninstalled" | "plugin-enabled" | "plugin-disabled" | "search" | "filter-changed";
  data: any;
}

// Plugin UI Manager
export class PluginUIManager {
  private pluginManager: PluginManager;
  private marketplace: PluginMarketplace;
  private state: PluginUIState;
  private eventListeners: Map<string, Function[]> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.pluginManager = getPluginManager();
    this.marketplace = getPluginMarketplace();
    
    this.state = {
      currentView: "manager",
      searchQuery: "",
      sortBy: "popularity",
      sortOrder: "desc",
      showInstalledOnly: false,
      showVerifiedOnly: false,
      priceRange: [0, 100],
      selectedTags: []
    };

    this.initializeEventListeners();
    this.render();
  }

  private initializeEventListeners(): void {
    this.pluginManager.addEventListener("pluginLoaded", (event: any) => {
      this.emitEvent("plugin-installed", event.data);
      this.refreshCurrentView();
    });

    this.pluginManager.addEventListener("pluginUnloaded", (event: any) => {
      this.emitEvent("plugin-uninstalled", event.data);
      this.refreshCurrentView();
    });

    this.pluginManager.addEventListener("pluginEnabled", (event: any) => {
      this.emitEvent("plugin-enabled", event.data);
      this.refreshCurrentView();
    });

    this.pluginManager.addEventListener("pluginDisabled", (event: any) => {
      this.emitEvent("plugin-disabled", event.data);
      this.refreshCurrentView();
    });
  }

  // UI rendering
  private render(): void {
    this.container.innerHTML = this.generateMainHTML();
    this.attachEventHandlers();
    this.renderCurrentView();
  }

  private generateMainHTML(): string {
    return `
      <div class="plugin-ui">
        <header class="plugin-header">
          <h1>Plugin Manager</h1>
          <nav class="plugin-nav">
            <button class="nav-btn ${this.state.currentView === "manager" ? "active" : ""}" data-view="manager">
              📦 My Plugins
            </button>
            <button class="nav-btn ${this.state.currentView === "marketplace" ? "active" : ""}" data-view="marketplace">
              🛒 Marketplace
            </button>
            <button class="nav-btn ${this.state.currentView === "installed" ? "active" : ""}" data-view="installed">
              ✅ Installed
            </button>
            <button class="nav-btn ${this.state.currentView === "settings" ? "active" : ""}" data-view="settings">
              ⚙️ Settings
            </button>
          </nav>
        </header>

        <div class="plugin-content">
          ${this.renderSearchBar()}
          <div class="plugin-view-container" id="plugin-view-container">
            <!-- Dynamic content will be rendered here -->
          </div>
        </div>

        <div class="plugin-details-modal" id="plugin-details-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="modal-title">Plugin Details</h2>
              <button class="close-btn" id="close-modal">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
              <!-- Plugin details will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderSearchBar(): string {
    return `
      <div class="plugin-search">
        <div class="search-bar">
          <input type="text" id="plugin-search-input" placeholder="Search plugins..." value="${this.state.searchQuery}">
          <button class="search-btn" id="search-btn">🔍</button>
        </div>
        
        <div class="filter-controls">
          <select id="category-filter" class="filter-select">
            <option value="">All Categories</option>
            <option value="rendering">🎨 Rendering</option>
            <option value="audio">🎵 Audio</option>
            <option value="physics">⚛️ Physics</option>
            <option value="ai">🤖 AI</option>
            <option value="ui">🖥️ UI</option>
            <option value="tools">🔧 Tools</option>
            <option value="content">📦 Content</option>
            <option value="network">🌐 Network</option>
            <option value="system">⚙️ System</option>
          </select>

          <select id="sort-select" class="filter-select">
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="updated">Recently Updated</option>
          </select>

          <label class="checkbox-label">
            <input type="checkbox" id="verified-only" ${this.state.showVerifiedOnly ? "checked" : ""}>
            Verified Only
          </label>

          <label class="checkbox-label">
            <input type="checkbox" id="installed-only" ${this.state.showInstalledOnly ? "checked" : ""}>
            Installed Only
          </label>
        </div>
      </div>
    `;
  }

  private renderCurrentView(): void {
    const container = document.getElementById("plugin-view-container");
    if (!container) return;

    switch (this.state.currentView) {
      case "manager":
        container.innerHTML = this.renderManagerView();
        break;
      case "marketplace":
        container.innerHTML = this.renderMarketplaceView();
        break;
      case "installed":
        container.innerHTML = this.renderInstalledView();
        break;
      case "settings":
        container.innerHTML = this.renderSettingsView();
        break;
    }
  }

  private renderManagerView(): string {
    const plugins = this.pluginManager.getPluginList();
    const stats = this.pluginManager.getPerformanceStats();

    return `
      <div class="manager-view">
        <div class="stats-overview">
          <div class="stat-card">
            <h3>Total Plugins</h3>
            <span class="stat-value">${stats.totalPlugins}</span>
          </div>
          <div class="stat-card">
            <h3>Enabled</h3>
            <span class="stat-value">${stats.enabledPlugins}</span>
          </div>
          <div class="stat-card">
            <h3>Memory Usage</h3>
            <span class="stat-value">${this.formatBytes(stats.totalMemory)}</span>
          </div>
          <div class="stat-card">
            <h3>API Calls</h3>
            <span class="stat-value">${stats.totalApiCalls.toLocaleString()}</span>
          </div>
        </div>

        <div class="plugin-list">
          <h2>My Plugins</h2>
          ${plugins.length === 0 ? 
            "<p class='empty-state'>No plugins installed. Visit the marketplace to discover plugins!</p>" :
            plugins.map(plugin => this.renderPluginCard(plugin)).join("")
          }
        </div>
      </div>
    `;
  }

  private renderMarketplaceView(): string {
    return `
      <div class="marketplace-view">
        <div class="featured-section">
          <h2>Featured Plugins</h2>
          <div class="featured-grid" id="featured-grid">
            <!-- Featured plugins will be loaded here -->
          </div>
        </div>

        <div class="browse-section">
          <h2>Browse All Plugins</h2>
          <div class="plugin-grid" id="marketplace-grid">
            <!-- Marketplace plugins will be loaded here -->
          </div>
        </div>
      </div>
    `;
  }

  private renderInstalledView(): string {
    const installedPlugins = this.marketplace.getInstalledPlugins();

    return `
      <div class="installed-view">
        <h2>Installed Plugins</h2>
        ${installedPlugins.length === 0 ? 
          "<p class='empty-state'>No plugins installed yet.</p>" :
          installedPlugins.map(plugin => this.renderMarketplacePluginCard(plugin)).join("")
        }
      </div>
    `;
  }

  private renderSettingsView(): string {
    return `
      <div class="settings-view">
        <h2>Plugin Settings</h2>
        
        <div class="settings-section">
          <h3>General</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="auto-update" checked>
              Automatically update plugins
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="beta-updates">
              Include beta updates
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="hot-reload" checked>
              Enable hot-reload for development
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>Security</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="verify-plugins" checked>
              Verify plugin signatures
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="sandbox-plugins" checked>
              Run plugins in sandbox
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="restrict-permissions" checked>
              Restrict plugin permissions
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>Performance</h3>
          <div class="setting-item">
            <label for="max-memory">Maximum memory per plugin:</label>
            <input type="number" id="max-memory" value="128" min="16" max="1024"> MB
          </div>
          <div class="setting-item">
            <label for="plugin-timeout">Plugin timeout:</label>
            <input type="number" id="plugin-timeout" value="30" min="5" max="300"> seconds
          </div>
        </div>

        <div class="settings-actions">
          <button class="primary-btn" id="save-settings">Save Settings</button>
          <button class="secondary-btn" id="reset-settings">Reset to Defaults</button>
        </div>
      </div>
    `;
  }

  private renderPluginCard(plugin: PluginState): string {
    const statusIcon = plugin.enabled ? "✅" : "⏸️";
    const statusClass = plugin.enabled ? "enabled" : "disabled";
    const memoryUsage = this.formatBytes(plugin.memoryUsage);
    
    return `
      <div class="plugin-card ${statusClass}" data-plugin-id="${plugin.manifest.metadata.id}">
        <div class="plugin-header">
          <h3>${plugin.manifest.metadata.name}</h3>
          <span class="plugin-version">v${plugin.manifest.metadata.version}</span>
        </div>
        
        <div class="plugin-info">
          <p class="plugin-description">${plugin.manifest.metadata.description}</p>
          <div class="plugin-meta">
            <span class="plugin-author">by ${plugin.manifest.metadata.author}</span>
            <span class="plugin-category">${this.formatCategory(plugin.manifest.metadata.category)}</span>
          </div>
        </div>

        <div class="plugin-stats">
          <span class="stat">Memory: ${memoryUsage}</span>
          <span class="stat">API Calls: ${plugin.apiCalls.toLocaleString()}</span>
        </div>

        <div class="plugin-actions">
          <button class="action-btn toggle-btn" data-action="toggle">
            ${statusIcon} ${plugin.enabled ? "Disable" : "Enable"}
          </button>
          <button class="action-btn configure-btn" data-action="configure">⚙️</button>
          <button class="action-btn uninstall-btn" data-action="uninstall">🗑️</button>
        </div>

        ${plugin.error ? `<div class="plugin-error">❌ ${plugin.error}</div>` : ""}
      </div>
    `;
  }

  private renderMarketplacePluginCard(plugin: MarketplacePlugin): string {
    const isInstalled = this.marketplace.isPluginInstalled(plugin.id);
    const isOwned = this.marketplace.isPluginOwned(plugin.id);
    const priceDisplay = plugin.price === 0 ? "Free" : `$${plugin.price}`;
    
    return `
      <div class="marketplace-plugin-card ${isInstalled ? "installed" : ""}" data-plugin-id="${plugin.id}">
        <div class="plugin-header">
          <h3>${plugin.metadata.name}</h3>
          <span class="plugin-price">${priceDisplay}</span>
          ${plugin.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
        </div>
        
        <div class="plugin-preview">
          <img src="${plugin.screenshots[0] || '/placeholder.png'}" alt="${plugin.metadata.name}" class="plugin-screenshot">
        </div>

        <div class="plugin-info">
          <p class="plugin-description">${plugin.metadata.description}</p>
          <div class="plugin-meta">
            <span class="plugin-author">by ${plugin.metadata.author}</span>
            <span class="plugin-rating">⭐ ${plugin.rating.toFixed(1)}</span>
            <span class="plugin-downloads">📥 ${plugin.downloadCount.toLocaleString()}</span>
          </div>
        </div>

        <div class="plugin-tags">
          ${plugin.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>

        <div class="plugin-actions">
          ${isInstalled ? 
            `<button class="action-btn installed-btn" disabled>✅ Installed</button>` :
            isOwned ?
              `<button class="action-btn install-btn" data-action="install">📦 Install</button>` :
              `<button class="action-btn purchase-btn" data-action="purchase">🛒 ${priceDisplay}</button>`
          }
          <button class="action-btn details-btn" data-action="details">ℹ️ Details</button>
        </div>
      </div>
    `;
  }

  // Event handling
  private attachEventHandlers(): void {
    // Navigation
    this.container.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const view = (e.target as HTMLElement).dataset.view as any;
        this.switchView(view);
      });
    });

    // Search
    const searchInput = document.getElementById("plugin-search-input") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn");
    
    searchInput?.addEventListener("input", (e) => {
      this.state.searchQuery = (e.target as HTMLInputElement).value;
      this.emitEvent("search", { query: this.state.searchQuery });
    });

    searchBtn?.addEventListener("click", () => {
      this.performSearch();
    });

    // Filters
    const categoryFilter = document.getElementById("category-filter") as HTMLSelectElement;
    const sortSelect = document.getElementById("sort-select") as HTMLSelectElement;
    const verifiedOnly = document.getElementById("verified-only") as HTMLInputElement;
    const installedOnly = document.getElementById("installed-only") as HTMLInputElement;

    categoryFilter?.addEventListener("change", (e) => {
      this.state.selectedCategory = (e.target as HTMLSelectElement).value as PluginCategory || undefined;
      this.performSearch();
    });

    sortSelect?.addEventListener("change", (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.state.sortBy = value as any;
      this.performSearch();
    });

    verifiedOnly?.addEventListener("change", (e) => {
      this.state.showVerifiedOnly = (e.target as HTMLInputElement).checked;
      this.performSearch();
    });

    installedOnly?.addEventListener("change", (e) => {
      this.state.showInstalledOnly = (e.target as HTMLInputElement).checked;
      this.performSearch();
    });

    // Modal
    const closeModal = document.getElementById("close-modal");
    closeModal?.addEventListener("click", () => {
      this.closeModal();
    });

    // Plugin actions (delegated)
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const pluginCard = target.closest(".plugin-card, .marketplace-plugin-card");
      
      if (pluginCard) {
        const pluginId = pluginCard.getAttribute("data-plugin-id");
        const action = target.getAttribute("data-action");
        
        if (pluginId && action) {
          this.handlePluginAction(pluginId, action);
        }
      }
    });
  }

  private handlePluginAction(pluginId: string, action: string): void {
    switch (action) {
      case "toggle":
        this.togglePlugin(pluginId);
        break;
      case "configure":
        this.openPluginConfig(pluginId);
        break;
      case "uninstall":
        this.uninstallPlugin(pluginId);
        break;
      case "install":
        this.installPlugin(pluginId);
        break;
      case "purchase":
        this.purchasePlugin(pluginId);
        break;
      case "details":
        this.showPluginDetails(pluginId);
        break;
    }
  }

  private async togglePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.pluginManager.getPlugin(pluginId);
      if (plugin?.enabled) {
        await this.pluginManager.disablePlugin(pluginId);
      } else {
        await this.pluginManager.enablePlugin(pluginId);
      }
      this.refreshCurrentView();
    } catch (error) {
      BrowserLogger.error("PluginUI", `Failed to toggle plugin: ${pluginId}`, error);
    }
  }

  private async installPlugin(pluginId: string): Promise<void> {
    try {
      await this.marketplace.installPlugin(pluginId);
      this.refreshCurrentView();
    } catch (error) {
      BrowserLogger.error("PluginUI", `Failed to install plugin: ${pluginId}`, error);
    }
  }

  private async uninstallPlugin(pluginId: string): Promise<void> {
    if (confirm("Are you sure you want to uninstall this plugin?")) {
      try {
        await this.marketplace.uninstallPlugin(pluginId);
        this.refreshCurrentView();
      } catch (error) {
        BrowserLogger.error("PluginUI", `Failed to uninstall plugin: ${pluginId}`, error);
      }
    }
  }

  private async purchasePlugin(pluginId: string): Promise<void> {
    try {
      await this.marketplace.purchasePlugin(pluginId, "current-user");
      this.refreshCurrentView();
    } catch (error) {
      BrowserLogger.error("PluginUI", `Failed to purchase plugin: ${pluginId}`, error);
    }
  }

  private async showPluginDetails(pluginId: string): Promise<void> {
    const plugin = await this.marketplace.getPlugin(pluginId);
    if (!plugin) return;

    const modal = document.getElementById("plugin-details-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    if (modal && modalTitle && modalBody) {
      modalTitle.textContent = plugin.metadata.name;
      modalBody.innerHTML = this.generatePluginDetailsHTML(plugin);
      modal.style.display = "flex";
    }
  }

  private generatePluginDetailsHTML(plugin: MarketplacePlugin): string {
    const isInstalled = this.marketplace.isPluginInstalled(plugin.id);
    const isOwned = this.marketplace.isPluginOwned(plugin.id);
    const priceDisplay = plugin.price === 0 ? "Free" : `$${plugin.price}`;

    return `
      <div class="plugin-details">
        <div class="details-header">
          <div class="details-info">
            <h2>${plugin.metadata.name}</h2>
            <p class="version">Version ${plugin.metadata.version}</p>
            <p class="author">by ${plugin.metadata.author}</p>
            <div class="details-stats">
              <span class="rating">⭐ ${plugin.rating.toFixed(1)} (${plugin.reviews.length} reviews)</span>
              <span class="downloads">📥 ${plugin.downloadCount.toLocaleString()} downloads</span>
            </div>
          </div>
          <div class="details-actions">
            ${isInstalled ? 
              `<button class="action-btn installed-btn" disabled>✅ Installed</button>` :
              isOwned ?
                `<button class="action-btn install-btn" onclick="pluginUI.installPlugin('${plugin.id}')">📦 Install</button>` :
                `<button class="action-btn purchase-btn" onclick="pluginUI.purchasePlugin('${plugin.id}')">🛒 ${priceDisplay}</button>`
            }
          </div>
        </div>

        <div class="details-content">
          <div class="description">
            <h3>Description</h3>
            <p>${plugin.metadata.description}</p>
          </div>

          <div class="screenshots">
            <h3>Screenshots</h3>
            <div class="screenshot-gallery">
              ${plugin.screenshots.map(url => `<img src="${url}" alt="Screenshot" class="screenshot">`).join("")}
            </div>
          </div>

          <div class="details-meta">
            <h3>Information</h3>
            <div class="meta-grid">
              <div class="meta-item">
                <strong>Category:</strong> ${this.formatCategory(plugin.metadata.category)}
              </div>
              <div class="meta-item">
                <strong>License:</strong> ${plugin.license}
              </div>
              <div class="meta-item">
                <strong>Last Updated:</strong> ${new Date(plugin.lastUpdated).toLocaleDateString()}
              </div>
              <div class="meta-item">
                <strong>Engine Version:</strong> ${plugin.metadata.engineVersion}
              </div>
            </div>
          </div>

          <div class="reviews">
            <h3>Reviews</h3>
            ${plugin.reviews.map(review => `
              <div class="review">
                <div class="review-header">
                  <strong>${review.username}</strong>
                  <span class="review-rating">⭐ ${review.rating}</span>
                  <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
                <div class="review-actions">
                  <button class="helpful-btn">👍 Helpful (${review.helpful})</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  private closeModal(): void {
    const modal = document.getElementById("plugin-details-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  private openPluginConfig(pluginId: string): void {
    // TODO: Implement plugin configuration UI
    BrowserLogger.info("PluginUI", `Opening configuration for plugin: ${pluginId}`);
  }

  // Utility methods
  private switchView(view: PluginUIState["currentView"]): void {
    this.state.currentView = view;
    this.render();
  }

  private refreshCurrentView(): void {
    this.renderCurrentView();
    
    // Load marketplace data if needed
    if (this.state.currentView === "marketplace") {
      this.loadMarketplaceData();
    }
  }

  private async loadMarketplaceData(): Promise<void> {
    try {
      const featuredPlugins = await this.marketplace.getFeaturedPlugins();
      const featuredGrid = document.getElementById("featured-grid");
      
      if (featuredGrid) {
        featuredGrid.innerHTML = featuredPlugins.map(plugin => 
          this.renderMarketplacePluginCard(plugin)
        ).join("");
      }

      // Load all plugins for browsing
      await this.performSearch();
    } catch (error) {
      BrowserLogger.error("PluginUI", "Failed to load marketplace data", error);
    }
  }

  private async performSearch(): Promise<void> {
    if (this.state.currentView !== "marketplace") return;

    try {
      const search: MarketplaceSearch = {
        query: this.state.searchQuery,
        category: this.state.selectedCategory,
        sortBy: this.state.sortBy,
        sortOrder: this.state.sortOrder,
        verified: this.state.showVerifiedOnly || undefined
      };

      const results = await this.marketplace.searchPlugins(search);
      const grid = document.getElementById("marketplace-grid");
      
      if (grid) {
        grid.innerHTML = results.map(plugin => 
          this.renderMarketplacePluginCard(plugin)
        ).join("");
      }
    } catch (error) {
      BrowserLogger.error("PluginUI", "Failed to perform search", error);
    }
  }

  private formatCategory(category: PluginCategory): string {
    const categoryNames = {
      [PluginCategory.Rendering]: "Rendering",
      [PluginCategory.Audio]: "Audio",
      [PluginCategory.Physics]: "Physics",
      [PluginCategory.AI]: "AI",
      [PluginCategory.UI]: "UI",
      [PluginCategory.Tools]: "Tools",
      [PluginCategory.Content]: "Content",
      [PluginCategory.Network]: "Network",
      [PluginCategory.System]: "System",
      [PluginCategory.Other]: "Other"
    };
    return categoryNames[category] || "Other";
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Event system
  private emitEvent(type: PluginUIEvent["type"], data: any): void {
    const event: PluginUIEvent = { type, data };
    
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => listener(event));
  }

  public addEventListener(type: PluginUIEvent["type"], listener: Function): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: PluginUIEvent["type"], listener: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Public API
  public getState(): PluginUIState {
    return { ...this.state };
  }

  public setState(newState: Partial<PluginUIState>): void {
    this.state = { ...this.state, ...newState };
    this.render();
  }
}

// Global instance
let globalPluginUI: PluginUIManager | null = null;

export function initializePluginUI(container: HTMLElement): PluginUIManager {
  globalPluginUI = new PluginUIManager(container);
  return globalPluginUI;
}

export function getPluginUI(): PluginUIManager | null {
  return globalPluginUI;
}

// Import dependencies
import { getPluginManager } from "./PluginManager";
import { getPluginMarketplace } from "./PluginMarketplace";

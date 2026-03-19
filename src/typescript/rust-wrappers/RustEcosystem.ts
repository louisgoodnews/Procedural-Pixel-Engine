import init, { RustEcosystemExport, create_ecosystem_config } from '../../../pkg/procedural_pixel_engine_core.js';

export interface CommunityConfig {
    enableSharing: boolean;
    enableCollaboration: boolean;
    enableMarketplace: boolean;
    enableTutorials: boolean;
    enableTemplates: boolean;
    maxSharedProjects: number;
    collaborationRooms: number;
}

export interface PluginConfig {
    enablePlugins: boolean;
    autoUpdate: boolean;
    sandboxMode: boolean;
    maxPlugins: number;
    pluginTimeout: number;
    securityLevel: number;
}

export interface CloudConfig {
    enableCloud: boolean;
    autoSync: boolean;
    compressionLevel: number;
    encryptionEnabled: boolean;
    maxStorageMb: number;
    syncInterval: number;
}

export interface AnalyticsConfig {
    enableAnalytics: boolean;
    trackPerformance: boolean;
    trackUsage: boolean;
    anonymizeData: boolean;
    retentionDays: number;
    realTimeUpdates: boolean;
}

export interface EcosystemConfig {
    community: CommunityConfig;
    plugins: PluginConfig;
    cloud: CloudConfig;
    analytics: AnalyticsConfig;
    enableModSupport: boolean;
    enableApiAccess: boolean;
    enableWebhooks: boolean;
}

export interface SharedProject {
    id: string;
    name: string;
    description: string;
    author: string;
    createdAt: number;
    updatedAt: number;
    downloads: number;
    likes: number;
    tags: string[];
    fileSize: number;
    thumbnailUrl: string;
    isPublic: boolean;
}

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    createdAt: number;
    updatedAt: number;
    downloads: number;
    rating: number;
    dependencies: string[];
    permissions: string[];
    fileSize: number;
    isEnabled: boolean;
    isCompatible: boolean;
}

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    codeExample: string;
    imageUrl: string;
    order: number;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    author: string;
    difficulty: number;
    durationMinutes: number;
    steps: TutorialStep[];
    tags: string[];
    createdAt: number;
    views: number;
    rating: number;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    previewUrl: string;
    fileCount: number;
    fileSize: number;
    downloads: number;
    rating: number;
    createdAt: number;
    tags: string[];
}

export interface PerformanceMetrics {
    avgLoadTime: number;
    avgFps: number;
    memoryUsage: number;
    errorRate: number;
    uptime: number;
}

export interface UsageStats {
    mostUsedFeatures: string[];
    peakConcurrentUsers: number;
    avgSessionDuration: number;
    featureAdoptionRate: number;
}

export interface AnalyticsData {
    timestamp: number;
    activeUsers: number;
    totalProjects: number;
    totalDownloads: number;
    performanceMetrics: PerformanceMetrics;
    usageStats: UsageStats;
}

export class RustEcosystem {
    private wasmModule: RustEcosystemExport | null = null;
    private initialized = false;

    async initialize(config: EcosystemConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new RustEcosystemExport(config);
            this.initialized = true;
            console.log('🌐 Rust Ecosystem initialized');
        }
    }

    updateConfig(config: EcosystemConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): EcosystemConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            community: {
                enableSharing: config.community.enable_sharing,
                enableCollaboration: config.community.enable_collaboration,
                enableMarketplace: config.community.enable_marketplace,
                enableTutorials: config.community.enable_tutorials,
                enableTemplates: config.community.enable_templates,
                maxSharedProjects: config.community.max_shared_projects,
                collaborationRooms: config.community.collaboration_rooms,
            },
            plugins: {
                enablePlugins: config.plugins.enable_plugins,
                autoUpdate: config.plugins.auto_update,
                sandboxMode: config.plugins.sandbox_mode,
                maxPlugins: config.plugins.max_plugins,
                pluginTimeout: config.plugins.plugin_timeout,
                securityLevel: config.plugins.security_level,
            },
            cloud: {
                enableCloud: config.cloud.enable_cloud,
                autoSync: config.cloud.auto_sync,
                compressionLevel: config.cloud.compression_level,
                encryptionEnabled: config.cloud.encryption_enabled,
                maxStorageMb: config.cloud.max_storage_mb,
                syncInterval: config.cloud.sync_interval,
            },
            analytics: {
                enableAnalytics: config.analytics.enable_analytics,
                trackPerformance: config.analytics.track_performance,
                trackUsage: config.analytics.track_usage,
                anonymizeData: config.analytics.anonymize_data,
                retentionDays: config.analytics.retention_days,
                realTimeUpdates: config.analytics.real_time_updates,
            },
            enableModSupport: config.enable_mod_support,
            enableApiAccess: config.enable_api_access,
            enableWebhooks: config.enable_webhooks,
        };
    }

    getEcosystemStatus(): string {
        this.ensureInitialized();
        return this.wasmModule!.get_ecosystem_status();
    }

    // Community Features
    getSharedProjects(): SharedProject[] {
        this.ensureInitialized();
        const projects = this.wasmModule!.get_shared_projects();
        return projects.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            author: project.author,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            downloads: project.downloads,
            likes: project.likes,
            tags: project.tags,
            fileSize: project.file_size,
            thumbnailUrl: project.thumbnail_url,
            isPublic: project.is_public,
        }));
    }

    searchProjects(query: string): SharedProject[] {
        this.ensureInitialized();
        const projects = this.wasmModule!.search_projects(query);
        return projects.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            author: project.author,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            downloads: project.downloads,
            likes: project.likes,
            tags: project.tags,
            fileSize: project.file_size,
            thumbnailUrl: project.thumbnail_url,
            isPublic: project.is_public,
        }));
    }

    // Plugin System
    getPlugins(): Plugin[] {
        this.ensureInitialized();
        const plugins = this.wasmModule!.get_plugins();
        return plugins.map((plugin: any) => ({
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            createdAt: plugin.created_at,
            updatedAt: plugin.updated_at,
            downloads: plugin.downloads,
            rating: plugin.rating,
            dependencies: plugin.dependencies,
            permissions: plugin.permissions,
            fileSize: plugin.file_size,
            isEnabled: plugin.is_enabled,
            isCompatible: plugin.is_compatible,
        }));
    }

    getEnabledPlugins(): Plugin[] {
        return this.getPlugins().filter(plugin => plugin.isEnabled);
    }

    // Tutorial System
    getTutorials(): Tutorial[] {
        this.ensureInitialized();
        const tutorials = this.wasmModule!.get_tutorials();
        return tutorials.map((tutorial: any) => ({
            id: tutorial.id,
            title: tutorial.title,
            description: tutorial.description,
            author: tutorial.author,
            difficulty: tutorial.difficulty,
            durationMinutes: tutorial.duration_minutes,
            steps: tutorial.steps.map((step: any) => ({
                id: step.id,
                title: step.title,
                content: step.content,
                codeExample: step.code_example,
                imageUrl: step.image_url,
                order: step.order,
            })),
            tags: tutorial.tags,
            createdAt: tutorial.created_at,
            views: tutorial.views,
            rating: tutorial.rating,
        }));
    }

    searchTutorials(query: string): Tutorial[] {
        const tutorials = this.getTutorials();
        const queryLower = query.toLowerCase();
        
        return tutorials.filter(tutorial => 
            tutorial.title.toLowerCase().includes(queryLower) ||
            tutorial.description.toLowerCase().includes(queryLower) ||
            tutorial.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
    }

    getTutorialById(tutorialId: string): Tutorial | null {
        const tutorials = this.getTutorials();
        return tutorials.find(tutorial => tutorial.id === tutorialId) || null;
    }

    // Template System
    getTemplates(): Template[] {
        this.ensureInitialized();
        const templates = this.wasmModule!.get_templates();
        return templates.map((template: any) => ({
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            previewUrl: template.preview_url,
            fileCount: template.file_count,
            fileSize: template.file_size,
            downloads: template.downloads,
            rating: template.rating,
            createdAt: template.created_at,
            tags: template.tags,
        }));
    }

    getTemplatesByCategory(category: string): Template[] {
        const templates = this.getTemplates();
        return templates.filter(template => template.category === category);
    }

    searchTemplates(query: string): Template[] {
        const templates = this.getTemplates();
        const queryLower = query.toLowerCase();
        
        return templates.filter(template => 
            template.name.toLowerCase().includes(queryLower) ||
            template.description.toLowerCase().includes(queryLower) ||
            template.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
    }

    getTemplateCategories(): string[] {
        const templates = this.getTemplates();
        const categories = new Set(templates.map(template => template.category));
        return Array.from(categories).sort();
    }

    // Analytics
    getAnalyticsSummary(): string {
        this.ensureInitialized();
        return this.wasmModule!.get_analytics_summary();
    }

    collectAnalytics(): void {
        this.ensureInitialized();
        this.wasmModule!.collect_analytics();
    }

    // Cloud Sync
    async syncToCloud(): Promise<{ success: boolean; message: string }> {
        this.ensureInitialized();
        const result = this.wasmModule!.sync_to_cloud();
        
        if (result === 'success') {
            return { success: true, message: 'Successfully synced to cloud' };
        } else {
            return { success: false, message: result };
        }
    }

    async syncFromCloud(): Promise<{ success: boolean; message: string }> {
        this.ensureInitialized();
        const result = this.wasmModule!.sync_from_cloud();
        
        if (result === 'success') {
            return { success: true, message: 'Successfully synced from cloud' };
        } else {
            return { success: false, message: result };
        }
    }

    // Utility methods for creating configurations
    static createEcosystemConfig(config: Partial<EcosystemConfig>): EcosystemConfig {
        return {
            community: {
                enableSharing: config.community?.enableSharing !== undefined ? config.community.enableSharing : true,
                enableCollaboration: config.community?.enableCollaboration !== undefined ? config.community.enableCollaboration : true,
                enableMarketplace: config.community?.enableMarketplace !== undefined ? config.community.enableMarketplace : true,
                enableTutorials: config.community?.enableTutorials !== undefined ? config.community.enableTutorials : true,
                enableTemplates: config.community?.enableTemplates !== undefined ? config.community.enableTemplates : true,
                maxSharedProjects: config.community?.maxSharedProjects || 1000,
                collaborationRooms: config.community?.collaborationRooms || 10,
            },
            plugins: {
                enablePlugins: config.plugins?.enablePlugins !== undefined ? config.plugins.enablePlugins : true,
                autoUpdate: config.plugins?.autoUpdate !== undefined ? config.plugins.autoUpdate : true,
                sandboxMode: config.plugins?.sandboxMode !== undefined ? config.plugins.sandboxMode : true,
                maxPlugins: config.plugins?.maxPlugins || 50,
                pluginTimeout: config.plugins?.pluginTimeout || 30000,
                securityLevel: config.plugins?.securityLevel || 2,
            },
            cloud: {
                enableCloud: config.cloud?.enableCloud !== undefined ? config.cloud.enableCloud : true,
                autoSync: config.cloud?.autoSync !== undefined ? config.cloud.autoSync : true,
                compressionLevel: config.cloud?.compressionLevel || 2,
                encryptionEnabled: config.cloud?.encryptionEnabled !== undefined ? config.cloud.encryptionEnabled : true,
                maxStorageMb: config.cloud?.maxStorageMb || 1024,
                syncInterval: config.cloud?.syncInterval || 300000,
            },
            analytics: {
                enableAnalytics: config.analytics?.enableAnalytics !== undefined ? config.analytics.enableAnalytics : true,
                trackPerformance: config.analytics?.trackPerformance !== undefined ? config.analytics.trackPerformance : true,
                trackUsage: config.analytics?.trackUsage !== undefined ? config.analytics.trackUsage : true,
                anonymizeData: config.analytics?.anonymizeData !== undefined ? config.analytics.anonymizeData : true,
                retentionDays: config.analytics?.retentionDays || 30,
                realTimeUpdates: config.analytics?.realTimeUpdates !== undefined ? config.analytics.realTimeUpdates : true,
            },
            enableModSupport: config.enableModSupport !== undefined ? config.enableModSupport : true,
            enableApiAccess: config.enableApiAccess !== undefined ? config.enableApiAccess : true,
            enableWebhooks: config.enableWebhooks !== undefined ? config.enableWebhooks : true,
        };
    }

    // Configuration presets
    static createFullEcosystemConfig(): EcosystemConfig {
        return RustEcosystem.createEcosystemConfig({
            community: {
                enableSharing: true,
                enableCollaboration: true,
                enableMarketplace: true,
                enableTutorials: true,
                enableTemplates: true,
                maxSharedProjects: 5000,
                collaborationRooms: 50,
            },
            plugins: {
                enablePlugins: true,
                autoUpdate: true,
                sandboxMode: true,
                maxPlugins: 100,
                pluginTimeout: 60000,
                securityLevel: 3,
            },
            cloud: {
                enableCloud: true,
                autoSync: true,
                compressionLevel: 3,
                encryptionEnabled: true,
                maxStorageMb: 5120,
                syncInterval: 60000,
            },
            analytics: {
                enableAnalytics: true,
                trackPerformance: true,
                trackUsage: true,
                anonymizeData: true,
                retentionDays: 90,
                realTimeUpdates: true,
            },
            enableModSupport: true,
            enableApiAccess: true,
            enableWebhooks: true,
        });
    }

    static createBasicEcosystemConfig(): EcosystemConfig {
        return RustEcosystem.createEcosystemConfig({
            community: {
                enableSharing: true,
                enableCollaboration: false,
                enableMarketplace: false,
                enableTutorials: true,
                enableTemplates: true,
                maxSharedProjects: 500,
                collaborationRooms: 5,
            },
            plugins: {
                enablePlugins: true,
                autoUpdate: false,
                sandboxMode: true,
                maxPlugins: 20,
                pluginTimeout: 15000,
                securityLevel: 2,
            },
            cloud: {
                enableCloud: false,
                autoSync: false,
                compressionLevel: 1,
                encryptionEnabled: false,
                maxStorageMb: 256,
                syncInterval: 600000,
            },
            analytics: {
                enableAnalytics: false,
                trackPerformance: false,
                trackUsage: false,
                anonymizeData: true,
                retentionDays: 7,
                realTimeUpdates: false,
            },
            enableModSupport: false,
            enableApiAccess: false,
            enableWebhooks: false,
        });
    }

    static createDeveloperEcosystemConfig(): EcosystemConfig {
        return RustEcosystem.createEcosystemConfig({
            community: {
                enableSharing: true,
                enableCollaboration: true,
                enableMarketplace: false,
                enableTutorials: true,
                enableTemplates: true,
                maxSharedProjects: 2000,
                collaborationRooms: 20,
            },
            plugins: {
                enablePlugins: true,
                autoUpdate: true,
                sandboxMode: false,
                maxPlugins: 50,
                pluginTimeout: 30000,
                securityLevel: 1,
            },
            cloud: {
                enableCloud: true,
                autoSync: true,
                compressionLevel: 2,
                encryptionEnabled: true,
                maxStorageMb: 2048,
                syncInterval: 300000,
            },
            analytics: {
                enableAnalytics: true,
                trackPerformance: true,
                trackUsage: true,
                anonymizeData: false,
                retentionDays: 30,
                realTimeUpdates: true,
            },
            enableModSupport: true,
            enableApiAccess: true,
            enableWebhooks: true,
        });
    }

    static createProductionEcosystemConfig(): EcosystemConfig {
        return RustEcosystem.createEcosystemConfig({
            community: {
                enableSharing: true,
                enableCollaboration: true,
                enableMarketplace: true,
                enableTutorials: true,
                enableTemplates: true,
                maxSharedProjects: 10000,
                collaborationRooms: 100,
            },
            plugins: {
                enablePlugins: true,
                autoUpdate: true,
                sandboxMode: true,
                maxPlugins: 200,
                pluginTimeout: 120000,
                securityLevel: 3,
            },
            cloud: {
                enableCloud: true,
                autoSync: true,
                compressionLevel: 3,
                encryptionEnabled: true,
                maxStorageMb: 10240,
                syncInterval: 30000,
            },
            analytics: {
                enableAnalytics: true,
                trackPerformance: true,
                trackUsage: true,
                anonymizeData: true,
                retentionDays: 365,
                realTimeUpdates: true,
            },
            enableModSupport: false,
            enableApiAccess: true,
            enableWebhooks: true,
        });
    }

    // Ecosystem analysis methods
    analyzeEcosystemHealth(): {
        communityHealth: number;
        pluginHealth: number;
        cloudHealth: number;
        analyticsHealth: number;
        overallHealth: number;
        recommendations: string[];
    } {
        const projects = this.getSharedProjects();
        const plugins = this.getPlugins();
        const tutorials = this.getTutorials();
        const templates = this.getTemplates();
        
        // Community health (0-100)
        const communityHealth = Math.min(100, (
            (projects.length / 100) * 30 + // Project count
            (projects.reduce((sum, p) => sum + p.downloads, 0) / 10000) * 25 + // Downloads
            (projects.reduce((sum, p) => sum + p.likes, 0) / 1000) * 25 + // Likes
            (tutorials.length / 50) * 20 // Tutorial count
        ));
        
        // Plugin health (0-100)
        const enabledPlugins = plugins.filter(p => p.isEnabled);
        const pluginHealth = Math.min(100, (
            (enabledPlugins.length / 20) * 40 + // Enabled plugins
            (plugins.filter(p => p.isCompatible).length / plugins.length) * 30 + // Compatibility
            (plugins.reduce((sum, p) => sum + p.rating, 0) / (plugins.length * 5)) * 30 // Average rating
        ));
        
        // Cloud health (simulated)
        const cloudHealth = 85; // Assume good cloud health
        
        // Analytics health (simulated)
        const analyticsHealth = 90; // Assume good analytics health
        
        // Overall health
        const overallHealth = (communityHealth + pluginHealth + cloudHealth + analyticsHealth) / 4;
        
        // Recommendations
        const recommendations: string[] = [];
        
        if (communityHealth < 70) {
            recommendations.push('Increase community engagement by adding more tutorials and templates');
        }
        
        if (pluginHealth < 70) {
            recommendations.push('Review plugin compatibility and update outdated plugins');
        }
        
        if (projects.length < 50) {
            recommendations.push('Encourage more project sharing to grow the community');
        }
        
        if (enabledPlugins.length < 10) {
            recommendations.push('Enable more plugins to enhance functionality');
        }
        
        if (tutorials.length < 20) {
            recommendations.push('Add more tutorials to help new users get started');
        }
        
        return {
            communityHealth,
            pluginHealth,
            cloudHealth,
            analyticsHealth,
            overallHealth,
            recommendations,
        };
    }

    // Search and discovery methods
    searchAll(query: string): {
        projects: SharedProject[];
        plugins: Plugin[];
        tutorials: Tutorial[];
        templates: Template[];
    } {
        return {
            projects: this.searchProjects(query),
            plugins: this.getPlugins().filter(plugin => 
                plugin.name.toLowerCase().includes(query.toLowerCase()) ||
                plugin.description.toLowerCase().includes(query.toLowerCase())
            ),
            tutorials: this.searchTutorials(query),
            templates: this.searchTemplates(query),
        };
    }

    getPopularContent(): {
        topProjects: SharedProject[];
        topPlugins: Plugin[];
        topTutorials: Tutorial[];
        topTemplates: Template[];
    } {
        const projects = this.getSharedProjects()
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);
        
        const plugins = this.getPlugins()
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);
        
        const tutorials = this.getTutorials()
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
        
        const templates = this.getTemplates()
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);
        
        return {
            topProjects: projects,
            topPlugins: plugins,
            topTutorials: tutorials,
            topTemplates: templates,
        };
    }

    getTrendingContent(): {
        trendingProjects: SharedProject[];
        trendingPlugins: Plugin[];
        trendingTutorials: Tutorial[];
        trendingTemplates: Template[];
    } {
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        // Simulate trending by recent activity (would use actual timestamps in real implementation)
        const projects = this.getSharedProjects()
            .filter(p => p.updatedAt > oneWeekAgo)
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);
        
        const plugins = this.getPlugins()
            .filter(p => p.updatedAt > oneWeekAgo)
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5);
        
        const tutorials = this.getTutorials()
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        
        const templates = this.getTemplates()
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        
        return {
            trendingProjects: projects,
            trendingPlugins: plugins,
            trendingTutorials: tutorials,
            trendingTemplates: templates,
        };
    }

    // Ecosystem management methods
    generateEcosystemReport(): string {
        const projects = this.getSharedProjects();
        const plugins = this.getPlugins();
        const tutorials = this.getTutorials();
        const templates = this.getTemplates();
        const health = this.analyzeEcosystemHealth();
        const popular = this.getPopularContent();
        
        let report = `🌐 Rust Ecosystem Report
Generated: ${new Date().toISOString()}

📊 Ecosystem Health:
- Overall Health: ${health.overallHealth.toFixed(1)}%
- Community Health: ${health.communityHealth.toFixed(1)}%
- Plugin Health: ${health.pluginHealth.toFixed(1)}%
- Cloud Health: ${health.cloudHealth.toFixed(1)}%
- Analytics Health: ${health.analyticsHealth.toFixed(1)}%

📈 Content Statistics:
- Shared Projects: ${projects.length}
- Available Plugins: ${plugins.length}
- Available Tutorials: ${tutorials.length}
- Available Templates: ${templates.length}
- Enabled Plugins: ${plugins.filter(p => p.isEnabled).length}

🔥 Popular Content:
Top Projects:
${popular.topProjects.map((p, i) => `${i + 1}. ${p.name} (${p.downloads} downloads)`).join('\n')}

Top Plugins:
${popular.topPlugins.map((p, i) => `${i + 1}. ${p.name} (${p.downloads} downloads)`).join('\n')}

Top Tutorials:
${popular.topTutorials.map((t, i) => `${i + 1}. ${t.title} (${t.views} views)`).join('\n')}

Top Templates:
${popular.topTemplates.map((t, i) => `${i + 1}. ${t.name} (${t.downloads} downloads)`).join('\n')}

💡 Recommendations:
${health.recommendations.map(rec => `- ${rec}`).join('\n') || 'No recommendations at this time'}

📋 Categories:
${this.getTemplateCategories().map(cat => `- ${cat}`).join('\n')}
`;

        return report;
    }

    exportEcosystemData(format: 'json' | 'csv' = 'json'): string {
        const projects = this.getSharedProjects();
        const plugins = this.getPlugins();
        const tutorials = this.getTutorials();
        const templates = this.getTemplates();
        const health = this.analyzeEcosystemHealth();
        
        const data = {
            timestamp: new Date().toISOString(),
            projects,
            plugins,
            tutorials,
            templates,
            health,
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            // Create separate CSV sections for each content type
            let csv = '# Projects\n';
            csv += 'Name,Author,Downloads,Likes,Tags\n';
            projects.forEach(p => {
                csv += `"${p.name}","${p.author}",${p.downloads},${p.likes},"${p.tags.join(';')}"\n`;
            });
            
            csv += '\n# Plugins\n';
            csv += 'Name,Version,Author,Downloads,Rating,Enabled\n';
            plugins.forEach(p => {
                csv += `"${p.name}","${p.version}","${p.author}",${p.downloads},${p.rating},${p.isEnabled}\n`;
            });
            
            csv += '\n# Tutorials\n';
            csv += 'Title,Author,Difficulty,Duration,Views,Rating\n';
            tutorials.forEach(t => {
                csv += `"${t.title}","${t.author}",${t.difficulty},${t.durationMinutes},${t.views},${t.rating}\n`;
            });
            
            csv += '\n# Templates\n';
            csv += 'Name,Category,Downloads,Rating,FileCount\n';
            templates.forEach(t => {
                csv += `"${t.name}","${t.category}",${t.downloads},${t.rating},${t.fileCount}\n`;
            });
            
            return csv;
        }
        
        return JSON.stringify(data, null, 2);
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Rust Ecosystem not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

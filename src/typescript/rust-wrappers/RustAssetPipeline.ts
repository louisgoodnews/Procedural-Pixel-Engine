// Enums
export enum AssetType {
    Image = 0,
    Audio = 1,
    Video = 2,
    Model = 3,
    Texture = 4,
    Shader = 5,
    Script = 6,
    Data = 7,
    Font = 8,
    Animation = 9,
    Material = 10,
    Mesh = 11,
    Scene = 12,
    Prefab = 13,
    Config = 14,
}

export enum AssetCompressionType {
    None = 0,
    Gzip = 1,
    Brotli = 2,
    LZ4 = 3,
    Custom = 4,
}

export enum AssetPlatform {
    Web = 0,
    Desktop = 1,
    Mobile = 2,
    Console = 3,
    VR = 4,
    AR = 5,
}

export enum AssetLoadState {
    Pending = 0,
    Loading = 1,
    Loaded = 2,
    Error = 3,
    Unloaded = 4,
}

export enum AssetValidationLevel {
    None = 0,
    Basic = 1,
    Strict = 2,
    Comprehensive = 3,
}

// Interfaces
export interface AssetMetadata {
    id: string;
    name: string;
    assetType: AssetType;
    filePath: string;
    fileSize: number;
    checksum: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    tags: string[];
    dependencies: string[];
    platforms: AssetPlatform[];
    compression: AssetCompressionType;
    validationLevel: AssetValidationLevel;
    customProperties: Record<string, string>;
}

export interface AssetVariant {
    platform: AssetPlatform;
    filePath: string;
    fileSize: number;
    compression: AssetCompressionType;
    qualitySettings: Record<string, number>;
    isPrimary: boolean;
}

export interface AssetBundle {
    id: string;
    name: string;
    description: string;
    assets: string[];
    bundleType: string;
    compression: AssetCompressionType;
    totalSize: number;
    compressedSize: number;
    loadPriority: number;
    isStreaming: boolean;
    createdAt: number;
}

export interface AssetDependency {
    assetId: string;
    dependencyType: string;
    requiredVersion: string;
    isOptional: boolean;
    loadOrder: number;
}

export interface AssetValidationResult {
    assetId: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validationTime: number;
    validationLevel: AssetValidationLevel;
}

export interface AssetOptimizationResult {
    assetId: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    optimizationTime: number;
    qualityLoss?: number;
    recommendations: string[];
}

export interface AssetHotReloadEvent {
    assetId: string;
    eventType: string;
    oldPath?: string;
    newPath: string;
    timestamp: number;
    reloadRequired: boolean;
}

export interface AssetMarketplaceItem {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    downloads: number;
    author: string;
    tags: string[];
    previewImages: string[];
    fileSize: number;
    version: string;
    compatibility: AssetPlatform[];
}

export interface AssetPipelineConfig {
    enableHotReload: boolean;
    enableCompression: boolean;
    enableValidation: boolean;
    enableOptimization: boolean;
    enableBundling: boolean;
    enableDependencyTracking: boolean;
    enableVersioning: boolean;
    enableMarketplace: boolean;
    hotReloadInterval: number;
    compressionLevel: number;
    validationLevel: AssetValidationLevel;
    maxAssetSize: number;
    cacheSize: number;
    parallelLoading: boolean;
    streamingBufferSize: number;
}

export interface AssetPipelineStats {
    totalAssets: number;
    loadedAssets: number;
    failedAssets: number;
    totalSize: number;
    compressedSize: number;
    cacheHits: number;
    cacheMisses: number;
    hotReloadEvents: number;
    validationErrors: number;
    optimizationSavings: number;
    averageLoadTime: number;
    memoryUsage: number;
}

// Main class
export class RustAssetPipeline {
    private engine: any;
    private initialized: boolean = false;

    constructor() {
        this.engine = null;
    }

    async initialize(config: AssetPipelineConfig): Promise<void> {
        try {
            // Import the WASM module
            const wasmModule = await import('../../pkg/procedural_pixel_engine_core');
            
            // Create the asset pipeline engine
            this.engine = new wasmModule.AssetPipelineEngineExport(config);
            this.initialized = true;
            
            console.log('✅ Rust Asset Pipeline Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Rust Asset Pipeline Engine:', error);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    // Configuration
    updateConfig(config: AssetPipelineConfig): void {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        this.engine.update_config(config);
    }

    getConfig(): AssetPipelineConfig {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_config();
    }

    // Statistics
    getStats(): AssetPipelineStats {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_stats();
    }

    getPipelineSummary(): string {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_pipeline_summary();
    }

    // Asset management
    registerAsset(metadata: AssetMetadata): { success: boolean; assetId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            const assetId = this.engine.register_asset(metadata);
            return { success: true, assetId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getAsset(assetId: string): AssetMetadata | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_asset(assetId);
        } catch (error) {
            return null;
        }
    }

    getAllAssets(): AssetMetadata[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_all_assets();
    }

    // Asset variants
    addAssetVariant(assetId: string, variant: AssetVariant): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.add_asset_variant(assetId, variant);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getAssetVariants(assetId: string): AssetVariant[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_asset_variants(assetId) || [];
        } catch (error) {
            return [];
        }
    }

    getVariantForPlatform(assetId: string, platform: AssetPlatform): AssetVariant | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        const variants = this.getAssetVariants(assetId);
        return variants.find(v => v.platform === platform) || null;
    }

    // Asset bundles
    createBundle(bundle: AssetBundle): { success: boolean; bundleId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            const bundleId = this.engine.create_bundle(bundle);
            return { success: true, bundleId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getBundle(bundleId: string): AssetBundle | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_bundle(bundleId);
        } catch (error) {
            return null;
        }
    }

    getAllBundles(): AssetBundle[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_all_bundles();
    }

    loadBundle(bundleId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.load_bundle(bundleId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Dependency tracking
    addDependency(assetId: string, dependency: AssetDependency): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.add_dependency(assetId, dependency);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getDependencies(assetId: string): AssetDependency[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_dependencies(assetId) || [];
        } catch (error) {
            return [];
        }
    }

    resolveDependencies(assetId: string): string[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.resolve_dependencies(assetId) || [];
        } catch (error) {
            return [];
        }
    }

    // Asset loading
    loadAsset(assetId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.load_asset(assetId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    unloadAsset(assetId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.unload_asset(assetId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Hot reload
    enableHotReload(): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.enable_hot_reload();
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    addHotReloadEvent(event: AssetHotReloadEvent): void {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        this.engine.add_hot_reload_event(event);
    }

    getHotReloadEvents(): AssetHotReloadEvent[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_hot_reload_events();
    }

    // Asset validation
    validateAsset(assetId: string, level: AssetValidationLevel): { success: boolean; result?: AssetValidationResult; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            const result = this.engine.validate_asset(assetId, level);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getValidationResult(assetId: string): AssetValidationResult | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_validation_result(assetId);
        } catch (error) {
            return null;
        }
    }

    // Asset optimization
    optimizeAsset(assetId: string): { success: boolean; result?: AssetOptimizationResult; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            const result = this.engine.optimize_asset(assetId);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getOptimizationResult(assetId: string): AssetOptimizationResult | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_optimization_result(assetId);
        } catch (error) {
            return null;
        }
    }

    // Asset versioning
    updateAssetVersion(assetId: string, newVersion: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.update_asset_version(assetId, newVersion);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Marketplace integration
    addMarketplaceItem(item: AssetMarketplaceItem): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Asset Pipeline Engine not initialized' };
        }
        try {
            this.engine.add_marketplace_item(item);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getMarketplaceItem(itemId: string): AssetMarketplaceItem | null {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        try {
            return this.engine.get_marketplace_item(itemId);
        } catch (error) {
            return null;
        }
    }

    searchMarketplace(query: string, category?: string): AssetMarketplaceItem[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.search_marketplace(query, category);
    }

    // Analysis methods
    analyzeAssetUsage(): Record<string, number> {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.analyze_asset_usage();
    }

    getUnusedAssets(): string[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_unused_assets();
    }

    getLargeAssets(threshold: number): Array<{ id: string; size: number }> {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        const results = this.engine.get_large_assets(threshold);
        return Array.isArray(results) ? results : [];
    }

    // Cache management
    clearCache(): void {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        this.engine.clear_cache();
    }

    getCacheSize(): number {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }
        return this.engine.get_cache_size();
    }

    // Utility methods
    static createDefaultConfig(): AssetPipelineConfig {
        return {
            enableHotReload: true,
            enableCompression: true,
            enableValidation: true,
            enableOptimization: true,
            enableBundling: true,
            enableDependencyTracking: true,
            enableVersioning: true,
            enableMarketplace: false,
            hotReloadInterval: 1000,
            compressionLevel: 6,
            validationLevel: AssetValidationLevel.Basic,
            maxAssetSize: 100 * 1024 * 1024, // 100MB
            cacheSize: 1024 * 1024 * 1024, // 1GB
            parallelLoading: true,
            streamingBufferSize: 1024 * 1024, // 1MB
        };
    }

    static createDevelopmentConfig(): AssetPipelineConfig {
        return {
            enableHotReload: true,
            enableCompression: false,
            enableValidation: true,
            enableOptimization: false,
            enableBundling: false,
            enableDependencyTracking: true,
            enableVersioning: true,
            enableMarketplace: false,
            hotReloadInterval: 500,
            compressionLevel: 0,
            validationLevel: AssetValidationLevel.Strict,
            maxAssetSize: 500 * 1024 * 1024, // 500MB
            cacheSize: 2 * 1024 * 1024 * 1024, // 2GB
            parallelLoading: true,
            streamingBufferSize: 2 * 1024 * 1024, // 2MB
        };
    }

    static createProductionConfig(): AssetPipelineConfig {
        return {
            enableHotReload: false,
            enableCompression: true,
            enableValidation: true,
            enableOptimization: true,
            enableBundling: true,
            enableDependencyTracking: true,
            enableVersioning: true,
            enableMarketplace: true,
            hotReloadInterval: 0,
            compressionLevel: 9,
            validationLevel: AssetValidationLevel.Basic,
            maxAssetSize: 50 * 1024 * 1024, // 50MB
            cacheSize: 512 * 1024 * 1024, // 512MB
            parallelLoading: true,
            streamingBufferSize: 512 * 1024, // 512KB
        };
    }

    static createMobileConfig(): AssetPipelineConfig {
        return {
            enableHotReload: false,
            enableCompression: true,
            enableValidation: true,
            enableOptimization: true,
            enableBundling: true,
            enableDependencyTracking: true,
            enableVersioning: true,
            enableMarketplace: false,
            hotReloadInterval: 0,
            compressionLevel: 9,
            validationLevel: AssetValidationLevel.Strict,
            maxAssetSize: 20 * 1024 * 1024, // 20MB
            cacheSize: 256 * 1024 * 1024, // 256MB
            parallelLoading: false,
            streamingBufferSize: 256 * 1024, // 256KB
        };
    }

    // Asset factory methods
    static createAssetMetadata(
        id: string,
        name: string,
        assetType: AssetType,
        filePath: string,
        fileSize: number,
        version: string = "1.0.0"
    ): AssetMetadata {
        const now = Date.now();
        return {
            id,
            name,
            assetType,
            filePath,
            fileSize,
            checksum: "", // Would be calculated in real implementation
            version,
            createdAt: now,
            updatedAt: now,
            tags: [],
            dependencies: [],
            platforms: [AssetPlatform.Web, AssetPlatform.Desktop],
            compression: AssetCompressionType.None,
            validationLevel: AssetValidationLevel.Basic,
            customProperties: {},
        };
    }

    static createAssetVariant(
        platform: AssetPlatform,
        filePath: string,
        fileSize: number,
        isPrimary: boolean = false
    ): AssetVariant {
        return {
            platform,
            filePath,
            fileSize,
            compression: AssetCompressionType.None,
            qualitySettings: {},
            isPrimary,
        };
    }

    static createAssetBundle(
        id: string,
        name: string,
        description: string,
        assets: string[],
        bundleType: string = "standard"
    ): AssetBundle {
        return {
            id,
            name,
            description,
            assets,
            bundleType,
            compression: AssetCompressionType.Gzip,
            totalSize: 0, // Would be calculated
            compressedSize: 0, // Would be calculated
            loadPriority: 5,
            isStreaming: false,
            createdAt: Date.now(),
        };
    }

    static createAssetDependency(
        assetId: string,
        dependencyType: string,
        requiredVersion: string,
        isOptional: boolean = false,
        loadOrder: number = 0
    ): AssetDependency {
        return {
            assetId,
            dependencyType,
            requiredVersion,
            isOptional,
            loadOrder,
        };
    }

    static createHotReloadEvent(
        assetId: string,
        eventType: string,
        newPath: string,
        oldPath?: string,
        reloadRequired: boolean = true
    ): AssetHotReloadEvent {
        return {
            assetId,
            eventType,
            oldPath,
            newPath,
            timestamp: Date.now(),
            reloadRequired,
        };
    }

    static createMarketplaceItem(
        id: string,
        name: string,
        description: string,
        category: string,
        price: number,
        author: string,
        tags: string[] = []
    ): AssetMarketplaceItem {
        return {
            id,
            name,
            description,
            category,
            price,
            rating: 0.0,
            downloads: 0,
            author,
            tags,
            previewImages: [],
            fileSize: 0,
            version: "1.0.0",
            compatibility: [AssetPlatform.Web, AssetPlatform.Desktop],
        };
    }

    // Analysis and optimization methods
    generatePerformanceReport(): string {
        if (!this.initialized) {
            return 'Asset Pipeline Engine not initialized';
        }

        const stats = this.getStats();
        const unusedAssets = this.getUnusedAssets();
        const largeAssets = this.getLargeAssets(1024 * 1024); // > 1MB

        return `
📦 Asset Pipeline Performance Report
==================================

System Statistics:
- Total Assets: ${stats.totalAssets}
- Loaded Assets: ${stats.loadedAssets}
- Failed Assets: ${stats.failedAssets}
- Total Size: ${this.formatBytes(stats.totalSize)}
- Compressed Size: ${this.formatBytes(stats.compressedSize)}
- Compression Ratio: ${stats.totalSize > 0 ? ((1 - stats.compressedSize / stats.totalSize) * 100).toFixed(2) : '0.00'}%
- Cache Hit Rate: ${stats.cacheHits + stats.cacheMisses > 0 ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(2) : '0.00'}%
- Hot Reload Events: ${stats.hotReloadEvents}
- Validation Errors: ${stats.validationErrors}
- Optimization Savings: ${this.formatBytes(stats.optimizationSavings)}
- Average Load Time: ${stats.averageLoadTime.toFixed(2)}ms
- Memory Usage: ${this.formatBytes(stats.memoryUsage)}

Asset Analysis:
- Unused Assets: ${unusedAssets.length}
- Large Assets (>1MB): ${largeAssets.length}

Recommendations:
${this.generateRecommendations(stats, unusedAssets, largeAssets).map(rec => `  - ${rec}`).join('\n')}
        `.trim();
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private generateRecommendations(
        stats: AssetPipelineStats,
        unusedAssets: string[],
        largeAssets: Array<{ id: string; size: number }>
    ): string[] {
        const recommendations: string[] = [];

        if (stats.failedAssets > 0) {
            recommendations.push(`Fix ${stats.failedAssets} failed asset loads`);
        }

        if (stats.cacheHits + stats.cacheMisses > 0) {
            const hitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
            if (hitRate < 0.5) {
                recommendations.push('Improve cache hit rate by adjusting cache size or preload strategy');
            }
        }

        if (stats.totalSize > 0 && stats.compressedSize / stats.totalSize > 0.8) {
            recommendations.push('Consider increasing compression levels to reduce asset sizes');
        }

        if (unusedAssets.length > 0) {
            recommendations.push(`Remove ${unusedAssets.length} unused assets to free up space`);
        }

        if (largeAssets.length > 0) {
            recommendations.push(`Optimize ${largeAssets.length} large assets for better performance`);
        }

        if (stats.averageLoadTime > 100) {
            recommendations.push('Optimize asset loading to reduce average load time');
        }

        if (stats.memoryUsage > 512 * 1024 * 1024) { // > 512MB
            recommendations.push('Reduce memory usage by implementing better cache management');
        }

        if (recommendations.length === 0) {
            recommendations.push('Asset pipeline is performing well');
        }

        return recommendations;
    }

    // Batch operations
    validateAllAssets(level: AssetValidationLevel): AssetValidationResult[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }

        const assets = this.getAllAssets();
        const results: AssetValidationResult[] = [];

        for (const asset of assets) {
            const result = this.validateAsset(asset.id, level);
            if (result.success && result.result) {
                results.push(result.result);
            }
        }

        return results;
    }

    optimizeAllAssets(): AssetOptimizationResult[] {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }

        const assets = this.getAllAssets();
        const results: AssetOptimizationResult[] = [];

        for (const asset of assets) {
            const result = this.optimizeAsset(asset.id);
            if (result.success && result.result) {
                results.push(result.result);
            }
        }

        return results;
    }

    loadAllAssets(): { success: number; failed: number; errors: string[] } {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }

        const assets = this.getAllAssets();
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const asset of assets) {
            const result = this.loadAsset(asset.id);
            if (result.success) {
                success++;
            } else {
                failed++;
                if (result.error) {
                    errors.push(`${asset.id}: ${result.error}`);
                }
            }
        }

        return { success, failed, errors };
    }

    unloadAllAssets(): { success: number; failed: number; errors: string[] } {
        if (!this.initialized) {
            throw new Error('Asset Pipeline Engine not initialized');
        }

        const assets = this.getAllAssets();
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const asset of assets) {
            const result = this.unloadAsset(asset.id);
            if (result.success) {
                success++;
            } else {
                failed++;
                if (result.error) {
                    errors.push(`${asset.id}: ${result.error}`);
                }
            }
        }

        return { success, failed, errors };
    }
}

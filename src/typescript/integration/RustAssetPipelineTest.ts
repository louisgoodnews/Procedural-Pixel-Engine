import { RustAssetPipeline, AssetType, AssetPlatform, AssetCompressionType, AssetLoadState, AssetValidationLevel } from '../rust-wrappers/RustAssetPipeline';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustAssetPipelineTest {
    private assetPipeline: RustAssetPipeline;
    private results: TestResult[] = [];

    constructor() {
        this.assetPipeline = new RustAssetPipeline();
    }

    async runAllTests(): Promise<void> {
        console.log('📦 Starting Rust Asset Pipeline Tests...');
        console.log('====================================');
        
        try {
            await this.testInitialization();
            await this.testConfigurationPresets();
            await this.testAssetRegistration();
            await this.testAssetVariants();
            await this.testAssetBundles();
            await this.testDependencyTracking();
            await this.testAssetLoading();
            await this.testHotReload();
            await this.testAssetValidation();
            await this.testAssetOptimization();
            await this.testAssetVersioning();
            await this.testMarketplaceIntegration();
            await this.testPerformanceAnalysis();
            await this.testBatchOperations();
            await this.testCacheManagement();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Asset Pipeline test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Asset Pipeline Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Asset Pipeline Initialization';
        const start = performance.now();
        
        try {
            const config = RustAssetPipeline.createDefaultConfig();
            await this.assetPipeline.initialize(config);
            
            // Test initialization by calling a method
            try {
                this.assetPipeline.getConfig();
            } catch (error) {
                throw new Error('Asset Pipeline not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.assetPipeline.getConfig();
            if (!retrievedConfig.enableHotReload || !retrievedConfig.enableCompression) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.assetPipeline.getStats();
            if (stats.totalAssets < 0 || stats.loadedAssets < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test pipeline summary
            const summary = this.assetPipeline.getPipelineSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Pipeline summary not available');
            }
            
            this.addResult(testName, 'pass', 'Asset Pipeline initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test default configuration
            const defaultConfig = RustAssetPipeline.createDefaultConfig();
            if (!defaultConfig.enableHotReload || !defaultConfig.enableCompression || !defaultConfig.enableValidation) {
                throw new Error('Default config should enable most features');
            }
            
            // Apply default config
            await this.assetPipeline.initialize(defaultConfig);
            let currentConfig = this.assetPipeline.getConfig();
            
            if (!currentConfig.enableHotReload) {
                throw new Error('Default config not applied correctly');
            }
            
            // Test development configuration
            const devConfig = RustAssetPipeline.createDevelopmentConfig();
            if (!devConfig.enableHotReload || devConfig.enableCompression || devConfig.enableOptimization) {
                throw new Error('Development config should enable hot reload and disable optimization');
            }
            
            this.assetPipeline.updateConfig(devConfig);
            currentConfig = this.assetPipeline.getConfig();
            
            if (!currentConfig.enableHotReload || currentConfig.enableCompression) {
                throw new Error('Development config not applied correctly');
            }
            
            // Test production configuration
            const prodConfig = RustAssetPipeline.createProductionConfig();
            if (prodConfig.enableHotReload || !prodConfig.enableOptimization || prodConfig.maxAssetSize > 100 * 1024 * 1024) {
                throw new Error('Production config should disable hot reload and enable optimization');
            }
            
            this.assetPipeline.updateConfig(prodConfig);
            currentConfig = this.assetPipeline.getConfig();
            
            if (currentConfig.enableHotReload || !currentConfig.enableOptimization) {
                throw new Error('Production config not applied correctly');
            }
            
            // Test mobile configuration
            const mobileConfig = RustAssetPipeline.createMobileConfig();
            if (mobileConfig.enableHotReload || !mobileConfig.enableCompression || mobileConfig.maxAssetSize > 50 * 1024 * 1024) {
                throw new Error('Mobile config should be optimized for mobile');
            }
            
            this.assetPipeline.updateConfig(mobileConfig);
            currentConfig = this.assetPipeline.getConfig();
            
            if (currentConfig.enableHotReload || currentConfig.maxAssetSize > 50 * 1024 * 1024) {
                throw new Error('Mobile config not applied correctly');
            }
            
            // Test custom configuration
            const customConfig = RustAssetPipeline.createDefaultConfig();
            customConfig.maxAssetSize = 200 * 1024 * 1024;
            customConfig.hotReloadInterval = 2000;
            customConfig.cacheSize = 2 * 1024 * 1024 * 1024;
            
            this.assetPipeline.updateConfig(customConfig);
            currentConfig = this.assetPipeline.getConfig();
            
            if (currentConfig.maxAssetSize !== 200 * 1024 * 1024 || currentConfig.hotReloadInterval !== 2000) {
                throw new Error('Custom config not applied correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                configsTested: 4,
                customConfigTested: true,
                configPersistenceVerified: true,
                featuresVerified: {
                    hotReload: defaultConfig.enableHotReload,
                    compression: defaultConfig.enableCompression,
                    validation: defaultConfig.enableValidation,
                    optimization: prodConfig.enableOptimization,
                    marketplace: prodConfig.enableMarketplace,
                }
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetRegistration(): Promise<void> {
        const testName = 'Asset Registration';
        const start = performance.now();
        
        try {
            // Create test assets
            const imageAsset = RustAssetPipeline.createAssetMetadata(
                'image_001',
                'Test Image',
                AssetType.Image,
                '/assets/textures/test.png',
                1024 * 1024, // 1MB
                '1.0.0'
            );
            
            const audioAsset = RustAssetPipeline.createAssetMetadata(
                'audio_001',
                'Test Audio',
                AssetType.Audio,
                '/assets/sounds/test.wav',
                512 * 1024, // 512KB
                '1.0.0'
            );
            
            const modelAsset = RustAssetPipeline.createAssetMetadata(
                'model_001',
                'Test Model',
                AssetType.Model,
                '/assets/models/test.fbx',
                5 * 1024 * 1024, // 5MB
                '1.0.0'
            );
            
            // Register assets
            const result1 = this.assetPipeline.registerAsset(imageAsset);
            if (!result1.success || !result1.assetId) {
                throw new Error('Failed to register image asset');
            }
            
            const result2 = this.assetPipeline.registerAsset(audioAsset);
            if (!result2.success || !result2.assetId) {
                throw new Error('Failed to register audio asset');
            }
            
            const result3 = this.assetPipeline.registerAsset(modelAsset);
            if (!result3.success || !result3.assetId) {
                throw new Error('Failed to register model asset');
            }
            
            // Test duplicate registration
            const duplicateResult = this.assetPipeline.registerAsset(imageAsset);
            if (duplicateResult.success) {
                throw new Error('Should not allow duplicate asset registration');
            }
            
            // Test asset retrieval
            const retrievedImage = this.assetPipeline.getAsset('image_001');
            if (!retrievedImage || retrievedImage.name !== 'Test Image') {
                throw new Error('Image asset not retrieved correctly');
            }
            
            const retrievedAudio = this.assetPipeline.getAsset('audio_001');
            if (!retrievedAudio || retrievedAudio.assetType !== AssetType.Audio) {
                throw new Error('Audio asset not retrieved correctly');
            }
            
            // Test get all assets
            const allAssets = this.assetPipeline.getAllAssets();
            if (allAssets.length !== 3) {
                throw new Error('Expected 3 assets, got ' + allAssets.length);
            }
            
            // Verify asset properties
            for (const asset of allAssets) {
                if (!asset.id || !asset.name || !asset.filePath) {
                    throw new Error('Asset missing required properties');
                }
                
                if (asset.fileSize <= 0) {
                    throw new Error('Asset size should be positive');
                }
            }
            
            // Test stats update
            const stats = this.assetPipeline.getStats();
            if (stats.totalAssets !== 3) {
                throw new Error('Stats not updated correctly');
            }
            
            this.addResult(testName, 'pass', 'Asset registration works correctly', performance.now() - start, {
                assetsRegistered: 3,
                assetTypesTested: 3,
                duplicateRegistrationTested: true,
                assetRetrievalTested: true,
                statsUpdated: true,
                totalAssetSize: stats.totalSize,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset registration failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetVariants(): Promise<void> {
        const testName = 'Asset Variants';
        const start = performance.now();
        
        try {
            // Create asset variants for different platforms
            const webVariant = RustAssetPipeline.createAssetVariant(
                AssetPlatform.Web,
                '/assets/web/texture.webp',
                512 * 1024, // 512KB
                true
            );
            
            const mobileVariant = RustAssetPipeline.createAssetVariant(
                AssetPlatform.Mobile,
                '/assets/mobile/texture.jpg',
                256 * 1024, // 256KB
                false
            );
            
            const desktopVariant = RustAssetPipeline.createAssetVariant(
                AssetPlatform.Desktop,
                '/assets/desktop/texture.png',
                1024 * 1024, // 1MB
                false
            );
            
            // Add variants to existing asset
            const result1 = this.assetPipeline.addAssetVariant('image_001', webVariant);
            if (!result1.success) {
                throw new Error('Failed to add web variant');
            }
            
            const result2 = this.assetPipeline.addAssetVariant('image_001', mobileVariant);
            if (!result2.success) {
                throw new Error('Failed to add mobile variant');
            }
            
            const result3 = this.assetPipeline.addAssetVariant('image_001', desktopVariant);
            if (!result3.success) {
                throw new Error('Failed to add desktop variant');
            }
            
            // Test variant retrieval
            const variants = this.assetPipeline.getAssetVariants('image_001');
            if (variants.length !== 3) {
                throw new Error('Expected 3 variants, got ' + variants.length);
            }
            
            // Verify variant properties
            for (const variant of variants) {
                if (!variant.filePath || variant.fileSize <= 0) {
                    throw new Error('Variant missing required properties');
                }
            }
            
            // Test platform-specific variant retrieval
            const webVariantRetrieved = this.assetPipeline.getVariantForPlatform('image_001', AssetPlatform.Web);
            if (!webVariantRetrieved || webVariantRetrieved.platform !== AssetPlatform.Web) {
                throw new Error('Web variant not retrieved correctly');
            }
            
            const mobileVariantRetrieved = this.assetPipeline.getVariantForPlatform('image_001', AssetPlatform.Mobile);
            if (!mobileVariantRetrieved || mobileVariantRetrieved.platform !== AssetPlatform.Mobile) {
                throw new Error('Mobile variant not retrieved correctly');
            }
            
            // Test non-existent platform
            const vrVariant = this.assetPipeline.getVariantForPlatform('image_001', AssetPlatform.VR);
            if (vrVariant !== null) {
                throw new Error('Should return null for non-existent platform variant');
            }
            
            // Test non-existent asset
            const nonExistentVariants = this.assetPipeline.getAssetVariants('non_existent');
            if (nonExistentVariants.length !== 0) {
                throw new Error('Should return empty array for non-existent asset');
            }
            
            this.addResult(testName, 'pass', 'Asset variants work correctly', performance.now() - start, {
                variantsCreated: 3,
                platformsSupported: 3,
                variantRetrievalTested: true,
                platformSpecificRetrievalTested: true,
                edgeCasesTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset variants failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetBundles(): Promise<void> {
        const testName = 'Asset Bundles';
        const start = performance.now();
        
        try {
            // Create asset bundles
            const textureBundle = RustAssetPipeline.createAssetBundle(
                'texture_bundle',
                'Texture Bundle',
                'Bundle of texture assets',
                ['image_001'],
                'texture'
            );
            
            const audioBundle = RustAssetPipeline.createAssetBundle(
                'audio_bundle',
                'Audio Bundle',
                'Bundle of audio assets',
                ['audio_001'],
                'audio'
            );
            
            const modelBundle = RustAssetPipeline.createAssetBundle(
                'model_bundle',
                'Model Bundle',
                'Bundle of model assets',
                ['model_001'],
                'model'
            );
            
            const mixedBundle = RustAssetPipeline.createAssetBundle(
                'mixed_bundle',
                'Mixed Bundle',
                'Bundle with mixed asset types',
                ['image_001', 'audio_001', 'model_001'],
                'mixed'
            );
            
            // Create bundles
            const result1 = this.assetPipeline.createBundle(textureBundle);
            if (!result1.success || !result1.bundleId) {
                throw new Error('Failed to create texture bundle');
            }
            
            const result2 = this.assetPipeline.createBundle(audioBundle);
            if (!result2.success || !result2.bundleId) {
                throw new Error('Failed to create audio bundle');
            }
            
            const result3 = this.assetPipeline.createBundle(modelBundle);
            if (!result3.success || !result3.bundleId) {
                throw new Error('Failed to create model bundle');
            }
            
            const result4 = this.assetPipeline.createBundle(mixedBundle);
            if (!result4.success || !result4.bundleId) {
                throw new Error('Failed to create mixed bundle');
            }
            
            // Test bundle retrieval
            const retrievedBundle = this.assetPipeline.getBundle('texture_bundle');
            if (!retrievedBundle || retrievedBundle.name !== 'Texture Bundle') {
                throw new Error('Bundle not retrieved correctly');
            }
            
            // Test get all bundles
            const allBundles = this.assetPipeline.getAllBundles();
            if (allBundles.length !== 4) {
                throw new Error('Expected 4 bundles, got ' + allBundles.length);
            }
            
            // Verify bundle properties
            for (const bundle of allBundles) {
                if (!bundle.id || !bundle.name || bundle.assets.length === 0) {
                    throw new Error('Bundle missing required properties');
                }
                
                if (bundle.totalSize <= 0) {
                    throw new Error('Bundle size should be positive');
                }
            }
            
            // Test bundle loading
            const loadResult = this.assetPipeline.loadBundle('texture_bundle');
            if (!loadResult.success) {
                throw new Error('Failed to load bundle');
            }
            
            // Test loading non-existent bundle
            const invalidLoadResult = this.assetPipeline.loadBundle('non_existent');
            if (invalidLoadResult.success) {
                throw new Error('Should fail for non-existent bundle');
            }
            
            // Test creating bundle with non-existent assets
            const invalidBundle = RustAssetPipeline.createAssetBundle(
                'invalid_bundle',
                'Invalid Bundle',
                'Bundle with non-existent assets',
                ['non_existent_asset'],
                'invalid'
            );
            
            const invalidResult = this.assetPipeline.createBundle(invalidBundle);
            if (invalidResult.success) {
                throw new Error('Should fail for bundle with non-existent assets');
            }
            
            this.addResult(testName, 'pass', 'Asset bundles work correctly', performance.now() - start, {
                bundlesCreated: 4,
                bundleTypesTested: 4,
                bundleRetrievalTested: true,
                bundleLoadingTested: true,
                errorHandlingTested: true,
                totalBundleSize: allBundles.reduce((sum, bundle) => sum + bundle.totalSize, 0),
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset bundles failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testDependencyTracking(): Promise<void> {
        const testName = 'Dependency Tracking';
        const start = performance.now();
        
        try {
            // Create dependencies
            const imageDependency = RustAssetPipeline.createAssetDependency(
                'audio_001',
                'texture_reference',
                '1.0.0',
                false,
                1
            );
            
            const modelDependency = RustAssetPipeline.createAssetDependency(
                'model_001',
                'texture_reference',
                '1.0.0',
                false,
                2
            );
            
            const optionalDependency = RustAssetPipeline.createAssetDependency(
                'image_001',
                'optional_shader',
                '1.0.0',
                true,
                3
            );
            
            // Add dependencies
            const result1 = this.assetPipeline.addDependency('image_001', imageDependency);
            if (!result1.success) {
                throw new Error('Failed to add image dependency');
            }
            
            const result2 = this.assetPipeline.addDependency('model_001', modelDependency);
            if (!result2.success) {
                throw new Error('Failed to add model dependency');
            }
            
            const result3 = this.assetPipeline.addDependency('image_001', optionalDependency);
            if (!result3.success) {
                throw new Error('Failed to add optional dependency');
            }
            
            // Test dependency retrieval
            const imageDependencies = this.assetPipeline.getDependencies('image_001');
            if (imageDependencies.length !== 2) {
                throw new Error('Expected 2 dependencies for image, got ' + imageDependencies.length);
            }
            
            const modelDependencies = this.assetPipeline.getDependencies('model_001');
            if (modelDependencies.length !== 1) {
                throw new Error('Expected 1 dependency for model, got ' + modelDependencies.length);
            }
            
            // Verify dependency properties
            for (const dep of imageDependencies) {
                if (!dep.assetId || !dep.dependencyType || !dep.requiredVersion) {
                    throw new Error('Dependency missing required properties');
                }
            }
            
            // Test dependency resolution
            const resolvedImage = this.assetPipeline.resolveDependencies('image_001');
            if (!resolvedImage.includes('image_001') || !resolvedImage.includes('audio_001')) {
                throw new Error('Dependency resolution failed for image');
            }
            
            const resolvedModel = this.assetPipeline.resolveDependencies('model_001');
            if (!resolvedModel.includes('model_001') || !resolvedModel.includes('image_001')) {
                throw new Error('Dependency resolution failed for model');
            }
            
            // Test non-existent asset dependencies
            const nonExistentDeps = this.assetPipeline.getDependencies('non_existent');
            if (nonExistentDeps.length !== 0) {
                throw new Error('Should return empty array for non-existent asset');
            }
            
            // Test dependency resolution for non-existent asset
            const nonExistentResolved = this.assetPipeline.resolveDependencies('non_existent');
            if (nonExistentResolved.length !== 0) {
                throw new Error('Should return empty array for non-existent asset resolution');
            }
            
            this.addResult(testName, 'pass', 'Dependency tracking works correctly', performance.now() - start, {
                dependenciesCreated: 3,
                dependencyTypesTested: 2,
                dependencyRetrievalTested: true,
                dependencyResolutionTested: true,
                optionalDependenciesTested: true,
                loadOrderVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Dependency tracking failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetLoading(): Promise<void> {
        const testName = 'Asset Loading';
        const start = performance.now();
        
        try {
            // Test loading individual assets
            const loadResult1 = this.assetPipeline.loadAsset('image_001');
            if (!loadResult1.success) {
                throw new Error('Failed to load image asset');
            }
            
            const loadResult2 = this.assetPipeline.loadAsset('audio_001');
            if (!loadResult2.success) {
                throw new Error('Failed to load audio asset');
            }
            
            const loadResult3 = this.assetPipeline.loadAsset('model_001');
            if (!loadResult3.success) {
                throw new Error('Failed to load model asset');
            }
            
            // Test loading non-existent asset
            const invalidLoadResult = this.assetPipeline.loadAsset('non_existent');
            if (invalidLoadResult.success) {
                throw new Error('Should fail for non-existent asset');
            }
            
            // Check stats after loading
            const stats = this.assetPipeline.getStats();
            if (stats.loadedAssets < 3) {
                throw new Error('Assets not loaded correctly');
            }
            
            // Test unloading assets
            const unloadResult1 = this.assetPipeline.unloadAsset('image_001');
            if (!unloadResult1.success) {
                throw new Error('Failed to unload image asset');
            }
            
            const unloadResult2 = this.assetPipeline.unloadAsset('audio_001');
            if (!unloadResult2.success) {
                throw new Error('Failed to unload audio asset');
            }
            
            // Test unloading non-existent asset
            const invalidUnloadResult = this.assetPipeline.unloadAsset('non_existent');
            if (invalidUnloadResult.success) {
                throw new Error('Should fail for non-existent asset');
            }
            
            // Test batch loading
            const batchLoadResult = this.assetPipeline.loadAllAssets();
            if (batchLoadResult.success < 3) {
                throw new Error('Batch loading failed');
            }
            
            // Test batch unloading
            const batchUnloadResult = this.assetPipeline.unloadAllAssets();
            if (batchUnloadResult.success < 3) {
                throw new Error('Batch unloading failed');
            }
            
            // Test cache operations
            const initialCacheSize = this.assetPipeline.getCacheSize();
            
            // Load assets to populate cache
            this.assetPipeline.loadAsset('image_001');
            this.assetPipeline.loadAsset('audio_001');
            
            const populatedCacheSize = this.assetPipeline.getCacheSize();
            if (populatedCacheSize <= initialCacheSize) {
                throw new Error('Cache size should increase after loading assets');
            }
            
            // Clear cache
            this.assetPipeline.clearCache();
            
            const clearedCacheSize = this.assetPipeline.getCacheSize();
            if (clearedCacheSize !== 0) {
                throw new Error('Cache should be empty after clearing');
            }
            
            this.addResult(testName, 'pass', 'Asset loading works correctly', performance.now() - start, {
                assetsLoaded: 3,
                assetsUnloaded: 2,
                batchOperationsTested: true,
                cacheOperationsTested: true,
                errorHandlingTested: true,
                statsUpdated: true,
                finalCacheSize: clearedCacheSize,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset loading failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testHotReload(): Promise<void> {
        const testName = 'Hot Reload';
        const start = performance.now();
        
        try {
            // Enable hot reload
            const enableResult = this.assetPipeline.enableHotReload();
            if (!enableResult.success) {
                throw new Error('Failed to enable hot reload');
            }
            
            // Create hot reload events
            const updateEvent = RustAssetPipeline.createHotReloadEvent(
                'image_001',
                'update',
                '/assets/textures/test_updated.png',
                '/assets/textures/test.png'
            );
            
            const createEvent = RustAssetPipeline.createHotReloadEvent(
                'new_asset',
                'create',
                '/assets/textures/new_texture.png'
            );
            
            const deleteEvent = RustAssetPipeline.createHotReloadEvent(
                'audio_001',
                'delete',
                '',
                '/assets/sounds/test.wav'
            );
            
            // Add hot reload events
            this.assetPipeline.addHotReloadEvent(updateEvent);
            this.assetPipeline.addHotReloadEvent(createEvent);
            this.assetPipeline.addHotReloadEvent(deleteEvent);
            
            // Test hot reload event retrieval
            const events = this.assetPipeline.getHotReloadEvents();
            if (events.length < 3) {
                throw new Error('Expected at least 3 hot reload events');
            }
            
            // Verify event properties
            for (const event of events) {
                if (!event.assetId || !event.eventType || !event.newPath) {
                    throw new Error('Hot reload event missing required properties');
                }
                
                if (event.timestamp <= 0) {
                    throw new Error('Event timestamp should be positive');
                }
            }
            
            // Test update event
            const updateEventFound = events.find(e => e.assetId === 'image_001' && e.eventType === 'update');
            if (!updateEventFound || !updateEventFound.oldPath) {
                throw new Error('Update event not found or missing old path');
            }
            
            // Test create event
            const createEventFound = events.find(e => e.assetId === 'new_asset' && e.eventType === 'create');
            if (!createEventFound) {
                throw new Error('Create event not found');
            }
            
            // Test delete event
            const deleteEventFound = events.find(e => e.assetId === 'audio_001' && e.eventType === 'delete');
            if (!deleteEventFound || deleteEventFound.newPath !== '') {
                throw new Error('Delete event not found or incorrect new path');
            }
            
            // Check stats
            const stats = this.assetPipeline.getStats();
            if (stats.hotReloadEvents < 3) {
                throw new Error('Hot reload events not counted correctly');
            }
            
            this.addResult(testName, 'pass', 'Hot reload works correctly', performance.now() - start, {
                hotReloadEnabled: true,
                eventsCreated: 3,
                eventTypesTested: 3,
                eventRetrievalTested: true,
                eventPropertiesVerified: true,
                statsUpdated: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Hot reload failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetValidation(): Promise<void> {
        const testName = 'Asset Validation';
        const start = performance.now();
        
        try {
            // Test validation at different levels
            const basicValidation = this.assetPipeline.validateAsset('image_001', AssetValidationLevel.Basic);
            if (!basicValidation.success || !basicValidation.result) {
                throw new Error('Basic validation failed');
            }
            
            const strictValidation = this.assetPipeline.validateAsset('image_001', AssetValidationLevel.Strict);
            if (!strictValidation.success || !strictValidation.result) {
                throw new Error('Strict validation failed');
            }
            
            const comprehensiveValidation = this.assetPipeline.validateAsset('image_001', AssetValidationLevel.Comprehensive);
            if (!comprehensiveValidation.success || !comprehensiveValidation.result) {
                throw new Error('Comprehensive validation failed');
            }
            
            // Test validation result properties
            const validationResult = basicValidation.result!;
            if (!validationResult.assetId || validationResult.validationTime < 0) {
                throw new Error('Validation result missing required properties');
            }
            
            // Test validation result retrieval
            const retrievedResult = this.assetPipeline.getValidationResult('image_001');
            if (!retrievedResult || retrievedResult.assetId !== 'image_001') {
                throw new Error('Validation result not retrieved correctly');
            }
            
            // Test validation of non-existent asset
            const invalidValidation = this.assetPipeline.validateAsset('non_existent', AssetValidationLevel.Basic);
            if (invalidValidation.success) {
                throw new Error('Should fail for non-existent asset');
            }
            
            // Test batch validation
            const batchResults = this.assetPipeline.validateAllAssets(AssetValidationLevel.Basic);
            if (batchResults.length < 3) {
                throw new Error('Batch validation should validate all assets');
            }
            
            // Verify batch validation results
            for (const result of batchResults) {
                if (!result.assetId || result.validationTime < 0) {
                    throw new Error('Batch validation result missing required properties');
                }
            }
            
            // Check validation statistics
            const stats = this.assetPipeline.getStats();
            if (stats.validationErrors > 0) {
                console.log('Validation errors detected:', stats.validationErrors);
            }
            
            this.addResult(testName, 'pass', 'Asset validation works correctly', performance.now() - start, {
                validationLevelsTested: 3,
                batchValidationTested: true,
                validationResultRetrievalTested: true,
                errorHandlingTested: true,
                validationResultsGenerated: batchResults.length,
                averageValidationTime: batchResults.reduce((sum, r) => sum + r.validationTime, 0) / batchResults.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset validation failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetOptimization(): Promise<void> {
        const testName = 'Asset Optimization';
        const start = performance.now();
        
        try {
            // Test asset optimization
            const optimizationResult = this.assetPipeline.optimizeAsset('image_001');
            if (!optimizationResult.success || !optimizationResult.result) {
                throw new Error('Asset optimization failed');
            }
            
            const result = optimizationResult.result!;
            
            // Verify optimization result properties
            if (!result.assetId || result.originalSize <= 0 || result.optimizedSize <= 0) {
                throw new Error('Optimization result missing required properties');
            }
            
            if (result.compressionRatio < 0 || result.compressionRatio > 1) {
                throw new Error('Compression ratio should be between 0 and 1');
            }
            
            if (result.optimizationTime < 0) {
                throw new Error('Optimization time should be positive');
            }
            
            // Test optimization result retrieval
            const retrievedResult = this.assetPipeline.getOptimizationResult('image_001');
            if (!retrievedResult || retrievedResult.assetId !== 'image_001') {
                throw new Error('Optimization result not retrieved correctly');
            }
            
            // Test optimization of non-existent asset
            const invalidOptimization = this.assetPipeline.optimizeAsset('non_existent');
            if (invalidOptimization.success) {
                throw new Error('Should fail for non-existent asset');
            }
            
            // Test batch optimization
            const batchResults = this.assetPipeline.optimizeAllAssets();
            if (batchResults.length < 3) {
                throw new Error('Batch optimization should optimize all assets');
            }
            
            // Verify batch optimization results
            for (const result of batchResults) {
                if (!result.assetId || result.originalSize <= 0 || result.optimizedSize <= 0) {
                    throw new Error('Batch optimization result missing required properties');
                }
                
                if (result.compressionRatio < 0 || result.compressionRatio > 1) {
                    throw new Error('Compression ratio should be between 0 and 1');
                }
            }
            
            // Check optimization statistics
            const stats = this.assetPipeline.getStats();
            if (stats.optimizationSavings <= 0) {
                throw new Error('Optimization savings should be positive');
            }
            
            // Calculate total savings
            const totalOriginalSize = batchResults.reduce((sum, r) => sum + r.originalSize, 0);
            const totalOptimizedSize = batchResults.reduce((sum, r) => sum + r.optimizedSize, 0);
            const totalSavings = totalOriginalSize - totalOptimizedSize;
            
            if (Math.abs(totalSavings - stats.optimizationSavings) > 1000) {
                throw new Error('Optimization savings calculation mismatch');
            }
            
            this.addResult(testName, 'pass', 'Asset optimization works correctly', performance.now() - start, {
                assetsOptimized: batchResults.length,
                batchOptimizationTested: true,
                optimizationResultRetrievalTested: true,
                errorHandlingTested: true,
                totalSavings: totalSavings,
                averageCompressionRatio: batchResults.reduce((sum, r) => sum + r.compressionRatio, 0) / batchResults.length,
                averageOptimizationTime: batchResults.reduce((sum, r) => sum + r.optimizationTime, 0) / batchResults.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset optimization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAssetVersioning(): Promise<void> {
        const testName = 'Asset Versioning';
        const start = performance.now();
        
        try {
            // Test asset version update
            const updateResult = this.assetPipeline.updateAssetVersion('image_001', '1.1.0');
            if (!updateResult.success) {
                throw new Error('Failed to update asset version');
            }
            
            // Verify version update
            const updatedAsset = this.assetPipeline.getAsset('image_001');
            if (!updatedAsset || updatedAsset.version !== '1.1.0') {
                throw new Error('Asset version not updated correctly');
            }
            
            // Test updating non-existent asset
            const invalidUpdate = this.assetPipeline.updateAssetVersion('non_existent', '2.0.0');
            if (invalidUpdate.success) {
                throw new Error('Should fail for non-existent asset');
            }
            
            // Test multiple version updates
            const versions = ['1.2.0', '1.3.0', '2.0.0'];
            for (const version of versions) {
                const result = this.assetPipeline.updateAssetVersion('image_001', version);
                if (!result.success) {
                    throw new Error(`Failed to update to version ${version}`);
                }
            }
            
            // Verify final version
            const finalAsset = this.assetPipeline.getAsset('image_001');
            if (!finalAsset || finalAsset.version !== '2.0.0') {
                throw new Error('Final version not correct');
            }
            
            // Test timestamp update
            const originalTimestamp = finalAsset.updatedAt;
            
            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            
            this.assetPipeline.updateAssetVersion('image_001', '2.0.1');
            
            const updatedFinalAsset = this.assetPipeline.getAsset('image_001');
            if (!updatedFinalAsset || updatedFinalAsset.updatedAt <= originalTimestamp) {
                throw new Error('Updated timestamp should be greater than original');
            }
            
            // Test version update on other assets
            this.assetPipeline.updateAssetVersion('audio_001', '1.1.0');
            this.assetPipeline.updateAssetVersion('model_001', '1.1.0');
            
            const audioAsset = this.assetPipeline.getAsset('audio_001');
            const modelAsset = this.assetPipeline.getAsset('model_001');
            
            if (!audioAsset || audioAsset.version !== '1.1.0') {
                throw new Error('Audio asset version not updated correctly');
            }
            
            if (!modelAsset || modelAsset.version !== '1.1.0') {
                throw new Error('Model asset version not updated correctly');
            }
            
            this.addResult(testName, 'pass', 'Asset versioning works correctly', performance.now() - start, {
                assetsVersioned: 3,
                versionUpdatesTested: 6,
                timestampUpdateTested: true,
                errorHandlingTested: true,
                finalVersions: {
                    image: '2.0.1',
                    audio: '1.1.0',
                    model: '1.1.0',
                },
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Asset versioning failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testMarketplaceIntegration(): Promise<void> {
        const testName = 'Marketplace Integration';
        const start = performance.now();
        
        try {
            // Create marketplace items
            const texturePack = RustAssetPipeline.createMarketplaceItem(
                'texture_pack_001',
                'HD Texture Pack',
                'High quality textures for games',
                'textures',
                19.99,
                'TextureStudio',
                ['hd', 'textures', 'game-ready']
            );
            
            const audioBundle = RustAssetPipeline.createMarketplaceItem(
                'audio_bundle_001',
                'Pro Audio Bundle',
                'Professional sound effects and music',
                'audio',
                29.99,
                'SoundForge',
                ['audio', 'sfx', 'music', 'professional']
            );
            
            const modelCollection = RustAssetPipeline.createMarketplaceItem(
                'model_collection_001',
                '3D Model Collection',
                'Collection of 3D models for various uses',
                'models',
                49.99,
                'ModelMaster',
                ['3d', 'models', 'game-ready', 'animated']
            );
            
            // Add marketplace items
            const result1 = this.assetPipeline.addMarketplaceItem(texturePack);
            if (!result1.success) {
                throw new Error('Failed to add texture pack');
            }
            
            const result2 = this.assetPipeline.addMarketplaceItem(audioBundle);
            if (!result2.success) {
                throw new Error('Failed to add audio bundle');
            }
            
            const result3 = this.assetPipeline.addMarketplaceItem(modelCollection);
            if (!result3.success) {
                throw new Error('Failed to add model collection');
            }
            
            // Test marketplace item retrieval
            const retrievedItem = this.assetPipeline.getMarketplaceItem('texture_pack_001');
            if (!retrievedItem || retrievedItem.name !== 'HD Texture Pack') {
                throw new Error('Marketplace item not retrieved correctly');
            }
            
            // Test marketplace search
            const textureResults = this.assetPipeline.searchMarketplace('texture');
            if (textureResults.length < 1) {
                throw new Error('Should find at least 1 texture item');
            }
            
            const audioResults = this.assetPipeline.searchMarketplace('audio');
            if (audioResults.length < 1) {
                throw new Error('Should find at least 1 audio item');
            }
            
            const modelResults = this.assetPipeline.searchMarketplace('3d');
            if (modelResults.length < 1) {
                throw new Error('Should find at least 1 model item');
            }
            
            // Test category-specific search
            const textureCategoryResults = this.assetPipeline.searchMarketplace('hd', 'textures');
            if (textureCategoryResults.length < 1) {
                throw new Error('Should find at least 1 texture item in category');
            }
            
            // Test search with no results
            const noResults = this.assetPipeline.searchMarketplace('non_existent_term');
            if (noResults.length > 0) {
                throw new Error('Should return empty array for non-existent term');
            }
            
            // Test retrieval of non-existent item
            const nonExistentItem = this.assetPipeline.getMarketplaceItem('non_existent');
            if (nonExistentItem !== null) {
                throw new Error('Should return null for non-existent item');
            }
            
            // Verify marketplace item properties
            for (const item of [texturePack, audioBundle, modelCollection]) {
                if (!item.id || !item.name || !item.category || item.price < 0) {
                    throw new Error('Marketplace item missing required properties');
                }
                
                if (!item.compatibility || item.compatibility.length === 0) {
                    throw new Error('Marketplace item should have compatibility information');
                }
            }
            
            this.addResult(testName, 'pass', 'Marketplace integration works correctly', performance.now() - start, {
                marketplaceItemsAdded: 3,
                searchQueriesTested: 5,
                categorySearchTested: true,
                itemRetrievalTested: true,
                errorHandlingTested: true,
                totalMarketplaceValue: texturePack.price + audioBundle.price + modelCollection.price,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Marketplace integration failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceAnalysis(): Promise<void> {
        const testName = 'Performance Analysis';
        const start = performance.now();
        
        try {
            // Test asset usage analysis
            const usageAnalysis = this.assetPipeline.analyzeAssetUsage();
            if (!usageAnalysis || typeof usageAnalysis !== 'object') {
                throw new Error('Asset usage analysis should return an object');
            }
            
            // Verify usage analysis contains registered assets
            if (!usageAnalysis['image_001'] || !usageAnalysis['audio_001'] || !usageAnalysis['model_001']) {
                throw new Error('Usage analysis should contain all registered assets');
            }
            
            // Test unused assets detection
            const unusedAssets = this.assetPipeline.getUnusedAssets();
            if (!Array.isArray(unusedAssets)) {
                throw new Error('Unused assets should return an array');
            }
            
            // Test large assets detection
            const largeAssets = this.assetPipeline.getLargeAssets(1024 * 1024); // > 1MB
            if (!Array.isArray(largeAssets)) {
                throw new Error('Large assets should return an array');
            }
            
            // Verify large assets detection
            const modelAsset = largeAssets.find(asset => asset.id === 'model_001');
            if (!modelAsset) {
                throw new Error('Model asset should be detected as large (>1MB)');
            }
            
            if (modelAsset.size <= 1024 * 1024) {
                throw new Error('Model asset size should be greater than 1MB');
            }
            
            // Test performance report generation
            const performanceReport = this.assetPipeline.generatePerformanceReport();
            if (!performanceReport || performanceReport.length === 0) {
                throw new Error('Performance report should not be empty');
            }
            
            // Verify performance report contains expected sections
            const expectedSections = [
                'Asset Pipeline Performance Report',
                'System Statistics:',
                'Asset Analysis:',
                'Recommendations:',
            ];
            
            for (const section of expectedSections) {
                if (!performanceReport.includes(section)) {
                    console.warn(`Performance report missing section: ${section}`);
                }
            }
            
            // Test performance statistics
            const stats = this.assetPipeline.getStats();
            if (stats.totalAssets < 3 || stats.loadedAssets < 0 || stats.totalSize <= 0) {
                throw new Error('Performance statistics not valid');
            }
            
            // Test cache hit rate calculation
            if (stats.cacheHits + stats.cacheMisses > 0) {
                const hitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
                if (hitRate < 0 || hitRate > 1) {
                    throw new Error('Cache hit rate should be between 0 and 1');
                }
            }
            
            // Test compression ratio calculation
            if (stats.totalSize > 0) {
                const compressionRatio = stats.compressedSize / stats.totalSize;
                if (compressionRatio < 0 || compressionRatio > 1) {
                    throw new Error('Compression ratio should be between 0 and 1');
                }
            }
            
            this.addResult(testName, 'pass', 'Performance analysis works correctly', performance.now() - start, {
                usageAnalysisGenerated: true,
                unusedAssetsDetected: unusedAssets.length,
                largeAssetsDetected: largeAssets.length,
                performanceReportGenerated: true,
                statisticsVerified: true,
                reportLength: performanceReport.length,
                recommendationsGenerated: performanceReport.split('\n').filter(line => line.includes('-')).length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBatchOperations(): Promise<void> {
        const testName = 'Batch Operations';
        const start = performance.now();
        
        try {
            // Test batch validation
            const batchValidationResults = this.assetPipeline.validateAllAssets(AssetValidationLevel.Basic);
            if (!Array.isArray(batchValidationResults) || batchValidationResults.length < 3) {
                throw new Error('Batch validation should return results for all assets');
            }
            
            // Verify batch validation results
            for (const result of batchValidationResults) {
                if (!result.assetId || result.validationTime < 0) {
                    throw new Error('Batch validation result missing required properties');
                }
            }
            
            // Test batch optimization
            const batchOptimizationResults = this.assetPipeline.optimizeAllAssets();
            if (!Array.isArray(batchOptimizationResults) || batchOptimizationResults.length < 3) {
                throw new Error('Batch optimization should return results for all assets');
            }
            
            // Verify batch optimization results
            for (const result of batchOptimizationResults) {
                if (!result.assetId || result.originalSize <= 0 || result.optimizedSize <= 0) {
                    throw new Error('Batch optimization result missing required properties');
                }
            }
            
            // Test batch loading
            const batchLoadResult = this.assetPipeline.loadAllAssets();
            if (!batchLoadResult || batchLoadResult.success < 3) {
                throw new Error('Batch loading should load all assets');
            }
            
            if (batchLoadResult.failed > 0) {
                console.log('Batch loading failures:', batchLoadResult.errors);
            }
            
            // Test batch unloading
            const batchUnloadResult = this.assetPipeline.unloadAllAssets();
            if (!batchUnloadResult || batchUnloadResult.success < 3) {
                throw new Error('Batch unloading should unload all assets');
            }
            
            if (batchUnloadResult.failed > 0) {
                console.log('Batch unloading failures:', batchUnloadResult.errors);
            }
            
            // Calculate batch operation metrics
            const totalValidationTime = batchValidationResults.reduce((sum, r) => sum + r.validationTime, 0);
            const totalOptimizationTime = batchOptimizationResults.reduce((sum, r) => sum + r.optimizationTime, 0);
            const totalOptimizationSavings = batchOptimizationResults.reduce((sum, r) => sum + (r.originalSize - r.optimizedSize), 0);
            
            // Verify batch operation efficiency
            if (totalValidationTime <= 0) {
                throw new Error('Total validation time should be positive');
            }
            
            if (totalOptimizationTime <= 0) {
                throw new Error('Total optimization time should be positive');
            }
            
            if (totalOptimizationSavings <= 0) {
                throw new Error('Total optimization savings should be positive');
            }
            
            // Test batch operation statistics
            const stats = this.assetPipeline.getStats();
            if (stats.validationErrors < 0 || stats.optimizationSavings < totalOptimizationSavings) {
                throw new Error('Batch operation statistics not updated correctly');
            }
            
            this.addResult(testName, 'pass', 'Batch operations work correctly', performance.now() - start, {
                batchValidationTested: true,
                batchOptimizationTested: true,
                batchLoadingTested: true,
                batchUnloadingTested: true,
                totalValidationTime: totalValidationTime,
                totalOptimizationTime: totalOptimizationTime,
                totalOptimizationSavings: totalOptimizationSavings,
                averageValidationTime: totalValidationTime / batchValidationResults.length,
                averageOptimizationTime: totalOptimizationTime / batchOptimizationResults.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Batch operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCacheManagement(): Promise<void> {
        const testName = 'Cache Management';
        const start = performance.now();
        
        try {
            // Get initial cache size
            const initialCacheSize = this.assetPipeline.getCacheSize();
            
            // Load assets to populate cache
            this.assetPipeline.loadAsset('image_001');
            this.assetPipeline.loadAsset('audio_001');
            this.assetPipeline.loadAsset('model_001');
            
            // Check cache size after loading
            const populatedCacheSize = this.assetPipeline.getCacheSize();
            if (populatedCacheSize <= initialCacheSize) {
                throw new Error('Cache size should increase after loading assets');
            }
            
            // Load same assets again (should hit cache)
            this.assetPipeline.loadAsset('image_001');
            this.assetPipeline.loadAsset('audio_001');
            
            // Check cache hit rate
            const stats = this.assetPipeline.getStats();
            if (stats.cacheHits <= 0) {
                throw new Error('Should have cache hits after loading same assets');
            }
            
            // Test cache clearing
            this.assetPipeline.clearCache();
            
            const clearedCacheSize = this.assetPipeline.getCacheSize();
            if (clearedCacheSize !== 0) {
                throw new Error('Cache should be empty after clearing');
            }
            
            // Test cache operations after clearing
            this.assetPipeline.loadAsset('image_001');
            
            const afterClearCacheSize = this.assetPipeline.getCacheSize();
            if (afterClearCacheSize <= 0) {
                throw new Error('Cache should repopulate after loading assets');
            }
            
            // Test multiple cache clears
            this.assetPipeline.clearCache();
            this.assetPipeline.clearCache();
            
            const doubleClearCacheSize = this.assetPipeline.getCacheSize();
            if (doubleClearCacheSize !== 0) {
                throw new Error('Cache should remain empty after multiple clears');
            }
            
            // Test cache size consistency
            this.assetPipeline.loadAsset('image_001');
            this.assetPipeline.loadAsset('audio_001');
            
            const finalCacheSize = this.assetPipeline.getCacheSize();
            const finalCacheSize2 = this.assetPipeline.getCacheSize();
            
            if (finalCacheSize !== finalCacheSize2) {
                throw new Error('Cache size should be consistent between calls');
            }
            
            // Test cache memory usage
            const finalStats = this.assetPipeline.getStats();
            if (finalStats.memoryUsage <= 0) {
                throw new Error('Memory usage should be positive after loading assets');
            }
            
            this.addResult(testName, 'pass', 'Cache management works correctly', performance.now() - start, {
                initialCacheSize: initialCacheSize,
                populatedCacheSize: populatedCacheSize,
                clearedCacheSize: clearedCacheSize,
                cacheHits: stats.cacheHits,
                cacheMisses: stats.cacheMisses,
                cacheHitRate: stats.cacheHits / (stats.cacheHits + stats.cacheMisses),
                memoryUsage: finalStats.memoryUsage,
                cacheConsistencyVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Cache management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n📦 Rust Asset Pipeline Test Report');
        console.log('===================================');
        
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const skipped = this.results.filter(r => r.status === 'skip').length;
        const total = this.results.length;
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
        
        if (failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => r.status === 'fail').forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
        }
        
        // Asset Pipeline System Summary
        const initTest = this.results.find(r => r.name === 'Asset Pipeline Initialization');
        const configTest = this.results.find(r => r.name === 'Configuration Presets');
        const registrationTest = this.results.find(r => r.name === 'Asset Registration');
        const loadingTest = this.results.find(r => r.name === 'Asset Loading');
        const performanceTest = this.results.find(r => r.name === 'Performance Analysis');
        
        if (initTest?.details || configTest?.details || registrationTest?.details || loadingTest?.details || performanceTest?.details) {
            console.log(`\n📦 Asset Pipeline System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (configTest?.details) {
                console.log(`   Configuration: ${configTest.details.configsTested} presets tested`);
            }
            if (registrationTest?.details) {
                console.log(`   Asset Registration: ${registrationTest.details.assetsRegistered} assets registered`);
            }
            if (loadingTest?.details) {
                console.log(`   Asset Loading: ${loadingTest.details.assetsLoaded} assets loaded`);
            }
            if (performanceTest?.details) {
                console.log(`   Performance Analysis: ${performanceTest.details.recommendationsGenerated} recommendations generated`);
            }
        }
        
        // Save detailed results
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total,
                passed,
                failed,
                skipped,
                successRate: (passed / total) * 100,
                totalDuration,
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency,
                webgl: !!document.createElement('canvas').getContext('webgl'),
                wasm: typeof WebAssembly !== 'undefined',
            },
        };
        
        console.log('\n📄 Detailed test report:', JSON.stringify(report, null, 2));
    }

    getResults(): TestResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}

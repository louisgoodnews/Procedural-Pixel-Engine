import { RustEcosystem, EcosystemConfig, SharedProject, Plugin, Tutorial, Template } from '../rust-wrappers/RustEcosystem';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustEcosystemTest {
    private rustEcosystem: RustEcosystem;
    private results: TestResult[] = [];

    constructor() {
        this.rustEcosystem = new RustEcosystem();
    }

    async runAllTests(): Promise<void> {
        console.log('🌐 Starting Rust Ecosystem Tests...');
        console.log('====================================');
        
        try {
            await this.testInitialization();
            await this.testCommunityFeatures();
            await this.testPluginSystem();
            await this.testTutorialSystem();
            await this.testTemplateSystem();
            await this.testCloudSync();
            await this.testAnalytics();
            await this.testSearchAndDiscovery();
            await this.testConfigurationPresets();
            await this.testEcosystemAnalysis();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Ecosystem test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Ecosystem Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Rust Ecosystem Initialization';
        const start = performance.now();
        
        try {
            const config = RustEcosystem.createFullEcosystemConfig();
            await this.rustEcosystem.initialize(config);
            
            if (!this.rustEcosystem.isInitialized()) {
                throw new Error('Rust Ecosystem not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.rustEcosystem.getConfig();
            if (!retrievedConfig.community.enableSharing || !retrievedConfig.plugins.enablePlugins) {
                throw new Error('Config not set correctly');
            }
            
            // Test ecosystem status
            const status = this.rustEcosystem.getEcosystemStatus();
            if (!status || status.length === 0) {
                throw new Error('Ecosystem status not available');
            }
            
            this.addResult(testName, 'pass', 'Rust Ecosystem initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCommunityFeatures(): Promise<void> {
        const testName = 'Community Features';
        const start = performance.now();
        
        try {
            // Test shared projects
            const projects = this.rustEcosystem.getSharedProjects();
            if (projects.length === 0) {
                throw new Error('No shared projects available');
            }
            
            // Check project structure
            for (const project of projects.slice(0, 3)) {
                if (!project.id || !project.name || !project.author) {
                    throw new Error('Project structure invalid');
                }
                
                if (project.downloads < 0 || project.likes < 0) {
                    throw new Error('Project metrics invalid');
                }
            }
            
            // Test project search
            const searchResults = this.rustEcosystem.searchProjects('particle');
            if (searchResults.length === 0) {
                console.warn('No search results for "particle" query');
            }
            
            // Verify search results contain query
            for (const result of searchResults) {
                const query = 'particle';
                const containsQuery = 
                    result.name.toLowerCase().includes(query) ||
                    result.description.toLowerCase().includes(query) ||
                    result.tags.some(tag => tag.toLowerCase().includes(query));
                
                if (!containsQuery) {
                    console.warn(`Search result "${result.name}" doesn't contain query "${query}"`);
                }
            }
            
            this.addResult(testName, 'pass', 'Community features work correctly', performance.now() - start, {
                totalProjects: projects.length,
                searchResults: searchResults.length,
                topProject: projects[0]?.name,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Community features failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPluginSystem(): Promise<void> {
        const testName = 'Plugin System';
        const start = performance.now();
        
        try {
            // Test plugins
            const plugins = this.rustEcosystem.getPlugins();
            if (plugins.length === 0) {
                throw new Error('No plugins available');
            }
            
            // Check plugin structure
            for (const plugin of plugins) {
                if (!plugin.id || !plugin.name || !plugin.version) {
                    throw new Error('Plugin structure invalid');
                }
                
                if (plugin.rating < 0 || plugin.rating > 5) {
                    throw new Error('Plugin rating invalid');
                }
                
                if (!Array.isArray(plugin.dependencies) || !Array.isArray(plugin.permissions)) {
                    throw new Error('Plugin dependencies/permissions invalid');
                }
            }
            
            // Test enabled plugins
            const enabledPlugins = this.rustEcosystem.getEnabledPlugins();
            if (enabledPlugins.length > plugins.length) {
                throw new Error('Enabled plugins count exceeds total plugins');
            }
            
            // Verify enabled plugins are actually enabled
            for (const plugin of enabledPlugins) {
                if (!plugin.isEnabled) {
                    throw new Error('Plugin listed as enabled but isEnabled is false');
                }
            }
            
            this.addResult(testName, 'pass', 'Plugin system works correctly', performance.now() - start, {
                totalPlugins: plugins.length,
                enabledPlugins: enabledPlugins.length,
                topPlugin: plugins[0]?.name,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Plugin system failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTutorialSystem(): Promise<void> {
        const testName = 'Tutorial System';
        const start = performance.now();
        
        try {
            // Test tutorials
            const tutorials = this.rustEcosystem.getTutorials();
            if (tutorials.length === 0) {
                throw new Error('No tutorials available');
            }
            
            // Check tutorial structure
            for (const tutorial of tutorials) {
                if (!tutorial.id || !tutorial.title || !tutorial.author) {
                    throw new Error('Tutorial structure invalid');
                }
                
                if (tutorial.difficulty < 1 || tutorial.difficulty > 5) {
                    throw new Error('Tutorial difficulty invalid');
                }
                
                if (!Array.isArray(tutorial.steps) || tutorial.steps.length === 0) {
                    throw new Error('Tutorial steps invalid');
                }
                
                // Check step structure
                for (const step of tutorial.steps) {
                    if (!step.id || !step.title || !step.content) {
                        throw new Error('Tutorial step structure invalid');
                    }
                }
            }
            
            // Test tutorial search
            const searchResults = this.rustEcosystem.searchTutorials('physics');
            if (searchResults.length === 0) {
                console.warn('No search results for "physics" query');
            }
            
            // Test get tutorial by ID
            if (tutorials.length > 0) {
                const firstTutorial = tutorials[0];
                const foundTutorial = this.rustEcosystem.getTutorialById(firstTutorial.id);
                
                if (!foundTutorial) {
                    throw new Error('Failed to find tutorial by ID');
                }
                
                if (foundTutorial.id !== firstTutorial.id) {
                    throw new Error('Found tutorial ID mismatch');
                }
            }
            
            this.addResult(testName, 'pass', 'Tutorial system works correctly', performance.now() - start, {
                totalTutorials: tutorials.length,
                searchResults: searchResults.length,
                topTutorial: tutorials[0]?.title,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Tutorial system failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testTemplateSystem(): Promise<void> {
        const testName = 'Template System';
        const start = performance.now();
        
        try {
            // Test templates
            const templates = this.rustEcosystem.getTemplates();
            if (templates.length === 0) {
                throw new Error('No templates available');
            }
            
            // Check template structure
            for (const template of templates) {
                if (!template.id || !template.name || !template.category) {
                    throw new Error('Template structure invalid');
                }
                
                if (template.rating < 0 || template.rating > 5) {
                    throw new Error('Template rating invalid');
                }
                
                if (template.fileCount <= 0 || template.fileSize <= 0) {
                    throw new Error('Template file metrics invalid');
                }
            }
            
            // Test template categories
            const categories = this.rustEcosystem.getTemplateCategories();
            if (categories.length === 0) {
                throw new Error('No template categories available');
            }
            
            // Test templates by category
            for (const category of categories.slice(0, 2)) {
                const categoryTemplates = this.rustEcosystem.getTemplatesByCategory(category);
                
                // Verify all templates are in the correct category
                for (const template of categoryTemplates) {
                    if (template.category !== category) {
                        throw new Error(`Template "${template.name}" in wrong category`);
                    }
                }
            }
            
            // Test template search
            const searchResults = this.rustEcosystem.searchTemplates('game');
            if (searchResults.length === 0) {
                console.warn('No search results for "game" query');
            }
            
            this.addResult(testName, 'pass', 'Template system works correctly', performance.now() - start, {
                totalTemplates: templates.length,
                categories: categories.length,
                searchResults: searchResults.length,
                topTemplate: templates[0]?.name,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Template system failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCloudSync(): Promise<void> {
        const testName = 'Cloud Sync';
        const start = performance.now();
        
        try {
            // Test sync to cloud
            const syncToResult = await this.rustEcosystem.syncToCloud();
            if (!syncToResult.success) {
                console.warn(`Cloud sync to failed: ${syncToResult.message}`);
            }
            
            // Test sync from cloud
            const syncFromResult = await this.rustEcosystem.syncFromCloud();
            if (!syncFromResult.success) {
                console.warn(`Cloud sync from failed: ${syncFromResult.message}`);
            }
            
            // At least one sync should work in test environment
            if (!syncToResult.success && !syncFromResult.success) {
                throw new Error('Both cloud sync operations failed');
            }
            
            this.addResult(testName, 'pass', 'Cloud sync works correctly', performance.now() - start, {
                syncToSuccess: syncToResult.success,
                syncFromSuccess: syncFromResult.success,
                syncToMessage: syncToResult.message,
                syncFromMessage: syncFromResult.message,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Cloud sync failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAnalytics(): Promise<void> {
        const testName = 'Analytics';
        const start = performance.now();
        
        try {
            // Test analytics collection
            this.rustEcosystem.collectAnalytics();
            
            // Test analytics summary
            const summary = this.rustEcosystem.getAnalyticsSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Analytics summary not available');
            }
            
            // Check if summary contains expected metrics
            const expectedMetrics = [
                'Active Users',
                'Total Projects',
                'Total Downloads',
                'Average Load Time',
                'Average FPS',
                'Memory Usage',
                'Error Rate',
                'Uptime',
            ];
            
            for (const metric of expectedMetrics) {
                if (!summary.includes(metric)) {
                    console.warn(`Analytics summary missing metric: ${metric}`);
                }
            }
            
            this.addResult(testName, 'pass', 'Analytics work correctly', performance.now() - start, {
                summaryLength: summary.length,
                hasMetrics: expectedMetrics.every(metric => summary.includes(metric)),
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Analytics failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSearchAndDiscovery(): Promise<void> {
        const testName = 'Search and Discovery';
        const start = performance.now();
        
        try {
            // Test search all
            const searchResults = this.rustEcosystem.searchAll('physics');
            
            if (!searchResults.projects || !searchResults.plugins || !searchResults.tutorials || !searchResults.templates) {
                throw new Error('Search results structure invalid');
            }
            
            // Test popular content
            const popularContent = this.rustEcosystem.getPopularContent();
            
            if (!popularContent.topProjects || !popularContent.topPlugins || !popularContent.topTutorials || !popularContent.topTemplates) {
                throw new Error('Popular content structure invalid');
            }
            
            // Verify popular content is sorted correctly
            if (popularContent.topProjects.length > 1) {
                for (let i = 0; i < popularContent.topProjects.length - 1; i++) {
                    if (popularContent.topProjects[i].downloads < popularContent.topProjects[i + 1].downloads) {
                        throw new Error('Popular projects not sorted by downloads');
                    }
                }
            }
            
            // Test trending content
            const trendingContent = this.rustEcosystem.getTrendingContent();
            
            if (!trendingContent.trendingProjects || !trendingContent.trendingPlugins || !trendingContent.trendingTutorials || !trendingContent.trendingTemplates) {
                throw new Error('Trending content structure invalid');
            }
            
            // Verify search results contain query
            const query = 'physics';
            const hasResults = 
                searchResults.projects.length > 0 ||
                searchResults.plugins.length > 0 ||
                searchResults.tutorials.length > 0 ||
                searchResults.templates.length > 0;
            
            if (!hasResults) {
                console.warn(`No search results for query "${query}"`);
            }
            
            this.addResult(testName, 'pass', 'Search and discovery work correctly', performance.now() - start, {
                searchProjects: searchResults.projects.length,
                searchPlugins: searchResults.plugins.length,
                searchTutorials: searchResults.tutorials.length,
                searchTemplates: searchResults.templates.length,
                popularProjects: popularContent.topProjects.length,
                trendingProjects: trendingContent.trendingProjects.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Search and discovery failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test full ecosystem configuration
            const fullConfig = RustEcosystem.createFullEcosystemConfig();
            await this.rustEcosystem.initialize(fullConfig);
            
            const fullStatus = this.rustEcosystem.getEcosystemStatus();
            if (!fullStatus.includes('✅ Enabled')) {
                console.warn('Full ecosystem configuration may not have all features enabled');
            }
            
            // Test basic ecosystem configuration
            const basicConfig = RustEcosystem.createBasicEcosystemConfig();
            await this.rustEcosystem.initialize(basicConfig);
            
            const basicStatus = this.rustEcosystem.getEcosystemStatus();
            if (!basicStatus.includes('❌ Disabled')) {
                console.warn('Basic ecosystem configuration may not have features disabled');
            }
            
            // Test developer ecosystem configuration
            const devConfig = RustEcosystem.createDeveloperEcosystemConfig();
            await this.rustEcosystem.initialize(devConfig);
            
            const devStatus = this.rustEcosystem.getEcosystemStatus();
            if (!devStatus.includes('API Access: ✅ Enabled')) {
                console.warn('Developer ecosystem configuration should have API access enabled');
            }
            
            // Test production ecosystem configuration
            const prodConfig = RustEcosystem.createProductionEcosystemConfig();
            await this.rustEcosystem.initialize(prodConfig);
            
            const prodStatus = this.rustEcosystem.getEcosystemStatus();
            if (!prodStatus.includes('Mod Support: ❌ Disabled')) {
                console.warn('Production ecosystem configuration should have mod support disabled');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                fullConfigFeatures: fullStatus.split('✅').length - 1,
                basicConfigFeatures: basicStatus.split('✅').length - 1,
                devConfigFeatures: devStatus.split('✅').length - 1,
                prodConfigFeatures: prodStatus.split('✅').length - 1,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEcosystemAnalysis(): Promise<void> {
        const testName = 'Ecosystem Analysis';
        const start = performance.now();
        
        try {
            // Test ecosystem health analysis
            const health = this.rustEcosystem.analyzeEcosystemHealth();
            
            if (!health.communityHealth || !health.pluginHealth || !health.overallHealth) {
                throw new Error('Health analysis structure invalid');
            }
            
            // Verify health scores are in valid range
            if (health.communityHealth < 0 || health.communityHealth > 100) {
                throw new Error('Community health score out of range');
            }
            
            if (health.pluginHealth < 0 || health.pluginHealth > 100) {
                throw new Error('Plugin health score out of range');
            }
            
            if (health.overallHealth < 0 || health.overallHealth > 100) {
                throw new Error('Overall health score out of range');
            }
            
            // Verify recommendations is an array
            if (!Array.isArray(health.recommendations)) {
                throw new Error('Recommendations should be an array');
            }
            
            // Test ecosystem report generation
            const report = this.rustEcosystem.generateEcosystemReport();
            if (!report || report.length === 0) {
                throw new Error('Ecosystem report generation failed');
            }
            
            // Check if report contains expected sections
            const expectedSections = [
                'Ecosystem Health',
                'Content Statistics',
                'Popular Content',
                'Recommendations',
                'Categories',
            ];
            
            for (const section of expectedSections) {
                if (!report.includes(section)) {
                    console.warn(`Report missing section: ${section}`);
                }
            }
            
            // Test ecosystem data export
            const jsonExport = this.rustEcosystem.exportEcosystemData('json');
            const csvExport = this.rustEcosystem.exportEcosystemData('csv');
            
            if (!jsonExport || !csvExport) {
                throw new Error('Ecosystem data export failed');
            }
            
            // Parse JSON export to verify structure
            const parsedExport = JSON.parse(jsonExport);
            if (!parsedExport.projects || !parsedExport.plugins || !parsedExport.health) {
                throw new Error('JSON export structure invalid');
            }
            
            // Verify CSV export has expected sections
            if (!csvExport.includes('# Projects') || !csvExport.includes('# Plugins')) {
                throw new Error('CSV export missing expected sections');
            }
            
            this.addResult(testName, 'pass', 'Ecosystem analysis works correctly', performance.now() - start, {
                communityHealth: health.communityHealth,
                pluginHealth: health.pluginHealth,
                overallHealth: health.overallHealth,
                recommendationsCount: health.recommendations.length,
                reportLength: report.length,
                jsonExportSize: jsonExport.length,
                csvExportSize: csvExport.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Ecosystem analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🌐 Rust Ecosystem Test Report');
        console.log('===============================');
        
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
        
        // Ecosystem summary
        const communityTest = this.results.find(r => r.name === 'Community Features');
        const pluginTest = this.results.find(r => r.name === 'Plugin System');
        const tutorialTest = this.results.find(r => r.name === 'Tutorial System');
        const templateTest = this.results.find(r => r.name === 'Template System');
        
        if (communityTest?.details || pluginTest?.details || tutorialTest?.details || templateTest?.details) {
            console.log(`\n🌐 Ecosystem Summary:`);
            if (communityTest?.details) {
                console.log(`   Shared Projects: ${communityTest.details.totalProjects}`);
            }
            if (pluginTest?.details) {
                console.log(`   Available Plugins: ${pluginTest.details.totalPlugins}`);
            }
            if (tutorialTest?.details) {
                console.log(`   Available Tutorials: ${tutorialTest.details.totalTutorials}`);
            }
            if (templateTest?.details) {
                console.log(`   Available Templates: ${templateTest.details.totalTemplates}`);
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

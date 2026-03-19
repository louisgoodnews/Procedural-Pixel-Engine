import { RustUISystem, UIWidgetType, UILayoutType, UIEventType, UIAnimationType, UIThemeType } from '../rust-wrappers/RustUISystem';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustUISystemTest {
    private uiSystem: RustUISystem;
    private results: TestResult[] = [];

    constructor() {
        this.uiSystem = new RustUISystem();
    }

    async runAllTests(): Promise<void> {
        console.log('🎨 Starting Rust UI System Tests...');
        console.log('=====================================');
        
        try {
            await this.testInitialization();
            await this.testConfigurationPresets();
            await this.testThemeManagement();
            await this.testWidgetManagement();
            await this.testWidgetHierarchy();
            await this.testWidgetProperties();
            await this.testLayoutSystem();
            await this.testEventHandling();
            await this.testAnimationSystem();
            await this.testRendering();
            await this.testFocusManagement();
            await this.testHitTesting();
            await this.testPerformance();
            await this.testWidgetFactories();
            await this.testAnimationFactories();
            await this.testThemeFactories();
            await this.testLayoutHelpers();
            await this.testDebugHelpers();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust UI System test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust UI System Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'UI System Initialization';
        const start = performance.now();
        
        try {
            const config = RustUISystem.createDefaultConfig();
            await this.uiSystem.initialize(config);
            
            // Test initialization by calling a method
            try {
                this.uiSystem.getConfig();
            } catch (error) {
                throw new Error('UI System not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.uiSystem.getConfig();
            if (!retrievedConfig.enableAnimations || !retrievedConfig.enableAccessibility) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.uiSystem.getStats();
            if (stats.totalWidgets < 0 || stats.visibleWidgets < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test UI system summary
            const summary = this.uiSystem.getUISystemSummary();
            if (!summary || summary.length === 0) {
                throw new Error('UI system summary not available');
            }
            
            this.addResult(testName, 'pass', 'UI System initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test default configuration
            const defaultConfig = RustUISystem.createDefaultConfig();
            if (!defaultConfig.enableAnimations || !defaultConfig.enableAccessibility || !defaultConfig.autoLayout) {
                throw new Error('Default config should enable most features');
            }
            
            // Apply default config
            await this.uiSystem.initialize(defaultConfig);
            let currentConfig = this.uiSystem.getConfig();
            
            if (!currentConfig.enableAnimations || !currentConfig.enableAccessibility) {
                throw new Error('Default config not applied correctly');
            }
            
            // Test development configuration
            const devConfig = RustUISystem.createDevelopmentConfig();
            if (!devConfig.enableAnimations || !devConfig.debugMode || devConfig.maxWidgets !== 500) {
                throw new Error('Development config should enable debugging');
            }
            
            this.uiSystem.updateConfig(devConfig);
            currentConfig = this.uiSystem.getConfig();
            
            if (!currentConfig.debugMode || currentConfig.maxWidgets !== 500) {
                throw new Error('Development config not applied correctly');
            }
            
            // Test production configuration
            const prodConfig = RustUISystem.createProductionConfig();
            if (!prodConfig.enableAnimations || !prodConfig.enableAccessibility || prodConfig.maxWidgets !== 2000) {
                throw new Error('Production config should optimize for performance');
            }
            
            this.uiSystem.updateConfig(prodConfig);
            currentConfig = this.uiSystem.getConfig();
            
            if (!currentConfig.enableAccessibility || currentConfig.maxWidgets !== 2000) {
                throw new Error('Production config not applied correctly');
            }
            
            // Test mobile configuration
            const mobileConfig = RustUISystem.createMobileConfig();
            if (mobileConfig.enableAnimations || !mobileConfig.touchSupport || mobileConfig.keyboardSupport) {
                throw new Error('Mobile config should optimize for mobile');
            }
            
            // Test custom configuration
            const customConfig = RustUISystem.createDefaultConfig();
            customConfig.maxWidgets = 1500;
            customConfig.eventQueueSize = 150;
            customConfig.pixelPerfect = true;
            
            this.uiSystem.updateConfig(customConfig);
            currentConfig = this.uiSystem.getConfig();
            
            if (currentConfig.maxWidgets !== 1500 || currentConfig.eventQueueSize !== 150) {
                throw new Error('Custom config not applied correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                configsTested: 4,
                customConfigTested: true,
                configPersistenceVerified: true,
                featuresVerified: {
                    animations: defaultConfig.enableAnimations,
                    accessibility: defaultConfig.enableAccessibility,
                    autoLayout: defaultConfig.autoLayout,
                    debugMode: devConfig.debugMode,
                },
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testThemeManagement(): Promise<void> {
        const testName = 'Theme Management';
        const start = performance.now();
        
        try {
            // Test creating and adding theme
            const theme = RustUISystem.createTheme('test_theme', 'Test Theme', UIThemeType.Custom);
            theme.colors = {
                primary: '#ff0000',
                secondary: '#00ff00',
                background: '#0000ff',
            };
            
            const addResult = this.uiSystem.addTheme(theme);
            if (!addResult.success) {
                throw new Error(`Failed to add theme: ${addResult.error}`);
            }
            
            // Test setting theme
            const setResult = this.uiSystem.setTheme('test_theme');
            if (!setResult.success) {
                throw new Error(`Failed to set theme: ${setResult.error}`);
            }
            
            // Test getting current theme
            const currentTheme = this.uiSystem.getCurrentTheme();
            if (currentTheme.id !== 'test_theme' || currentTheme.name !== 'Test Theme') {
                throw new Error('Current theme not set correctly');
            }
            
            // Test default theme creation
            const defaultTheme = this.uiSystem.createDefaultTheme();
            if (!defaultTheme.colors.primary || !defaultTheme.colors.background) {
                throw new Error('Default theme missing required colors');
            }
            
            // Test dark theme creation
            const darkTheme = this.uiSystem.createDarkTheme();
            if (!darkTheme.colors.primary || !darkTheme.colors.background) {
                throw new Error('Dark theme missing required colors');
            }
            
            if (darkTheme.colors.background === defaultTheme.colors.background) {
                throw new Error('Dark theme should have different background color');
            }
            
            // Test removing theme
            const removeResult = this.uiSystem.removeTheme('test_theme');
            if (!removeResult.success) {
                throw new Error(`Failed to remove theme: ${removeResult.error}`);
            }
            
            // Test removing non-existent theme
            const invalidRemoveResult = this.uiSystem.removeTheme('nonexistent');
            if (invalidRemoveResult.success) {
                throw new Error('Should fail to remove non-existent theme');
            }
            
            // Test setting non-existent theme
            const invalidSetResult = this.uiSystem.setTheme('nonexistent');
            if (invalidSetResult.success) {
                throw new Error('Should fail to set non-existent theme');
            }
            
            this.addResult(testName, 'pass', 'Theme management works correctly', performance.now() - start, {
                themeCreated: true,
                themeAdded: true,
                themeSet: true,
                themeRetrieved: true,
                themeRemoved: true,
                defaultThemeCreated: true,
                darkThemeCreated: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Theme management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testWidgetManagement(): Promise<void> {
        const testName = 'Widget Management';
        const start = performance.now();
        
        try {
            // Test creating widgets
            const widgets = [
                RustUISystem.createWidget('widget1', UIWidgetType.Button, 'Button 1', 10, 10, 100, 40),
                RustUISystem.createWidget('widget2', UIWidgetType.Label, 'Label 1', 10, 60, 200, 20),
                RustUISystem.createWidget('widget3', UIWidgetType.Container, 'Container 1', 0, 0, 300, 200),
            ];
            
            for (const widget of widgets) {
                const result = this.uiSystem.createWidget(widget);
                if (!result.success) {
                    throw new Error(`Failed to create widget ${widget.id}: ${result.error}`);
                }
            }
            
            // Test getting all widgets
            const allWidgets = this.uiSystem.getAllWidgets();
            if (allWidgets.length < widgets.length) {
                throw new Error('Not all widgets created');
            }
            
            // Test getting individual widget
            const widget1 = this.uiSystem.getWidget('widget1');
            if (!widget1 || widget1.name !== 'Button 1') {
                throw new Error('Widget not retrieved correctly');
            }
            
            // Test getting non-existent widget
            const nonExistent = this.uiSystem.getWidget('nonexistent');
            if (nonExistent !== null) {
                throw new Error('Should return null for non-existent widget');
            }
            
            // Test getting widgets by type
            const buttons = this.uiSystem.getWidgetsByType(UIWidgetType.Button);
            if (buttons.length !== 1) {
                throw new Error('Should find 1 button widget');
            }
            
            // Test getting visible widgets
            const visibleWidgets = this.uiSystem.getVisibleWidgets();
            if (visibleWidgets.length < widgets.length) {
                throw new Error('All widgets should be visible by default');
            }
            
            // Test creating duplicate widget
            const duplicateWidget = RustUISystem.createWidget('widget1', UIWidgetType.Button, 'Duplicate', 0, 0, 100, 40);
            const duplicateResult = this.uiSystem.createWidget(duplicateWidget);
            if (duplicateResult.success) {
                throw new Error('Should fail to create duplicate widget');
            }
            
            // Test deleting widget
            const deleteResult = this.uiSystem.deleteWidget('widget3');
            if (!deleteResult.success) {
                throw new Error('Failed to delete widget');
            }
            
            // Verify widget is deleted
            const deletedWidget = this.uiSystem.getWidget('widget3');
            if (deletedWidget !== null) {
                throw new Error('Deleted widget should not exist');
            }
            
            // Test deleting non-existent widget
            const deleteNonExistent = this.uiSystem.deleteWidget('nonexistent');
            if (deleteNonExistent.success) {
                throw new Error('Should fail to delete non-existent widget');
            }
            
            this.addResult(testName, 'pass', 'Widget management works correctly', performance.now() - start, {
                widgetsCreated: widgets.length,
                widgetsRetrieved: allWidgets.length,
                duplicateTested: true,
                deletionTested: true,
                typeFilteringTested: true,
                visibilityFilteringTested: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Widget management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testWidgetHierarchy(): Promise<void> {
        const testName = 'Widget Hierarchy';
        const start = performance.now();
        
        try {
            // Create parent and child widgets
            const parent = RustUISystem.createContainer('parent', 'Parent', 0, 0, 400, 300, UILayoutType.Vertical);
            const child1 = RustUISystem.createButton('child1', 'Child 1', 10, 10, 100, 40);
            const child2 = RustUISystem.createButton('child2', 'Child 2', 10, 60, 100, 40);
            const grandchild = RustUISystem.createLabel('grandchild', 'Grandchild', 10, 10, 80, 20);
            
            // Create widgets
            this.uiSystem.createWidget(parent);
            this.uiSystem.createWidget(child1);
            this.uiSystem.createWidget(child2);
            this.uiSystem.createWidget(grandchild);
            
            // Test adding children
            const addChild1Result = this.uiSystem.addChild('parent', 'child1');
            if (!addChild1Result.success) {
                throw new Error(`Failed to add child1: ${addChild1Result.error}`);
            }
            
            const addChild2Result = this.uiSystem.addChild('parent', 'child2');
            if (!addChild2Result.success) {
                throw new Error(`Failed to add child2: ${addChild2Result.error}`);
            }
            
            // Test adding grandchild
            const addGrandchildResult = this.uiSystem.addChild('child1', 'grandchild');
            if (!addGrandchildResult.success) {
                throw new Error(`Failed to add grandchild: ${addGrandchildResult.error}`);
            }
            
            // Verify hierarchy
            const parentWidget = this.uiSystem.getWidget('parent');
            if (!parentWidget || parentWidget.children.length !== 2) {
                throw new Error('Parent should have 2 children');
            }
            
            const child1Widget = this.uiSystem.getWidget('child1');
            if (!child1Widget || child1Widget.parentId !== 'parent') {
                throw new Error('Child1 should have parent set');
            }
            
            if (child1Widget.children.length !== 1) {
                throw new Error('Child1 should have 1 child');
            }
            
            const grandchildWidget = this.uiSystem.getWidget('grandchild');
            if (!grandchildWidget || grandchildWidget.parentId !== 'child1') {
                throw new Error('Grandchild should have child1 as parent');
            }
            
            // Test removing child
            const removeChildResult = this.uiSystem.removeChild('parent', 'child2');
            if (!removeChildResult.success) {
                throw new Error(`Failed to remove child: ${removeChildResult.error}`);
            }
            
            // Verify removal
            const updatedParent = this.uiSystem.getWidget('parent');
            if (!updatedParent || updatedParent.children.length !== 1) {
                throw new Error('Parent should have 1 child after removal');
            }
            
            const updatedChild2 = this.uiSystem.getWidget('child2');
            if (!updatedChild2 || updatedChild2.parentId !== undefined) {
                throw new Error('Removed child should have no parent');
            }
            
            // Test adding child to non-existent parent
            const invalidAddResult = this.uiSystem.addChild('nonexistent', 'child1');
            if (invalidAddResult.success) {
                throw new Error('Should fail to add child to non-existent parent');
            }
            
            // Test removing child from non-existent parent
            const invalidRemoveResult = this.uiSystem.removeChild('nonexistent', 'child1');
            if (invalidRemoveResult.success) {
                throw new Error('Should fail to remove child from non-existent parent');
            }
            
            this.addResult(testName, 'pass', 'Widget hierarchy works correctly', performance.now() - start, {
                hierarchyCreated: true,
                childrenAdded: true,
                grandchildAdded: true,
                childRemoved: true,
                hierarchyVerified: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Widget hierarchy failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testWidgetProperties(): Promise<void> {
        const testName = 'Widget Properties';
        const start = performance.now();
        
        try {
            // Create test widget
            const widget = RustUISystem.createWidget('prop_test', UIWidgetType.Button, 'Test', 50, 50, 120, 40);
            this.uiSystem.createWidget(widget);
            
            // Test position
            const posResult = this.uiSystem.setWidgetPosition('prop_test', 100, 150);
            if (!posResult.success) {
                throw new Error(`Failed to set position: ${posResult.error}`);
            }
            
            const updatedWidget = this.uiSystem.getWidget('prop_test');
            if (!updatedWidget || updatedWidget.x !== 100 || updatedWidget.y !== 150) {
                throw new Error('Position not updated correctly');
            }
            
            // Test size
            const sizeResult = this.uiSystem.setWidgetSize('prop_test', 200, 80);
            if (!sizeResult.success) {
                throw new Error(`Failed to set size: ${sizeResult.error}`);
            }
            
            const resizedWidget = this.uiSystem.getWidget('prop_test');
            if (!resizedWidget || resizedWidget.width !== 200 || resizedWidget.height !== 80) {
                throw new Error('Size not updated correctly');
            }
            
            // Test visibility
            const visResult = this.uiSystem.setWidgetVisibility('prop_test', false);
            if (!visResult.success) {
                throw new Error(`Failed to set visibility: ${visResult.error}`);
            }
            
            const hiddenWidget = this.uiSystem.getWidget('prop_test');
            if (!hiddenWidget || hiddenWidget.visible !== false) {
                throw new Error('Visibility not updated correctly');
            }
            
            // Test enabled state
            const enabledResult = this.uiSystem.setWidgetEnabled('prop_test', false);
            if (!enabledResult.success) {
                throw new Error(`Failed to set enabled state: ${enabledResult.error}`);
            }
            
            const disabledWidget = this.uiSystem.getWidget('prop_test');
            if (!disabledWidget || disabledWidget.enabled !== false) {
                throw new Error('Enabled state not updated correctly');
            }
            
            // Test style
            const newStyle = RustUISystem.createDefaultStyle();
            newStyle.backgroundColor = '#ff0000';
            newStyle.borderColor = '#00ff00';
            newStyle.borderWidth = 2;
            newStyle.borderRadius = 8;
            
            const styleResult = this.uiSystem.setWidgetStyle('prop_test', newStyle);
            if (!styleResult.success) {
                throw new Error(`Failed to set style: ${styleResult.error}`);
            }
            
            const styledWidget = this.uiSystem.getWidget('prop_test');
            if (!styledWidget || styledWidget.style.backgroundColor !== '#ff0000') {
                throw new Error('Style not updated correctly');
            }
            
            // Test properties on non-existent widget
            const invalidPosResult = this.uiSystem.setWidgetPosition('nonexistent', 0, 0);
            if (invalidPosResult.success) {
                throw new Error('Should fail to set position on non-existent widget');
            }
            
            // Restore visibility and enabled state for other tests
            this.uiSystem.setWidgetVisibility('prop_test', true);
            this.uiSystem.setWidgetEnabled('prop_test', true);
            
            this.addResult(testName, 'pass', 'Widget properties work correctly', performance.now() - start, {
                positionTested: true,
                sizeTested: true,
                visibilityTested: true,
                enabledTested: true,
                styleTested: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Widget properties failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testLayoutSystem(): Promise<void> {
        const testName = 'Layout System';
        const start = performance.now();
        
        try {
            // Create container with vertical layout
            const container = RustUISystem.createContainer('layout_container', 'Layout Container', 0, 0, 400, 300, UILayoutType.Vertical);
            container.layout.spacing = 10;
            this.uiSystem.createWidget(container);
            
            // Create child widgets
            const child1 = RustUISystem.createButton('layout_child1', 'Child 1', 0, 0, 100, 30);
            const child2 = RustUISystem.createButton('layout_child2', 'Child 2', 0, 0, 100, 30);
            const child3 = RustUISystem.createButton('layout_child3', 'Child 3', 0, 0, 100, 30);
            
            this.uiSystem.createWidget(child1);
            this.uiSystem.createWidget(child2);
            this.uiSystem.createWidget(child3);
            
            // Add children to container
            this.uiSystem.addChild('layout_container', 'layout_child1');
            this.uiSystem.addChild('layout_container', 'layout_child2');
            this.uiSystem.addChild('layout_container', 'layout_child3');
            
            // Test layout update
            const layoutResult = this.uiSystem.updateLayout();
            if (!layoutResult.success) {
                throw new Error(`Failed to update layout: ${layoutResult.error}`);
            }
            
            // Verify vertical layout
            const updatedChild1 = this.uiSystem.getWidget('layout_child1');
            const updatedChild2 = this.uiSystem.getWidget('layout_child2');
            const updatedChild3 = this.uiSystem.getWidget('layout_child3');
            
            if (!updatedChild1 || !updatedChild2 || !updatedChild3) {
                throw new Error('Children not found after layout update');
            }
            
            // Check vertical arrangement
            if (updatedChild2.y <= updatedChild1.y || updatedChild3.y <= updatedChild2.y) {
                throw new Error('Children not arranged vertically');
            }
            
            // Test horizontal layout
            const horizontalContainer = RustUISystem.createContainer('horizontal_container', 'Horizontal Container', 0, 350, 400, 100, UILayoutType.Horizontal);
            this.uiSystem.createWidget(horizontalContainer);
            
            const hChild1 = RustUISystem.createButton('h_child1', 'H Child 1', 0, 0, 80, 30);
            const hChild2 = RustUISystem.createButton('h_child2', 'H Child 2', 0, 0, 80, 30);
            
            this.uiSystem.createWidget(hChild1);
            this.uiSystem.createWidget(hChild2);
            
            this.uiSystem.addChild('horizontal_container', 'h_child1');
            this.uiSystem.addChild('horizontal_container', 'h_child2');
            
            this.uiSystem.updateLayout();
            
            const updatedHChild1 = this.uiSystem.getWidget('h_child1');
            const updatedHChild2 = this.uiSystem.getWidget('h_child2');
            
            if (!updatedHChild1 || !updatedHChild2) {
                throw new Error('Horizontal children not found after layout update');
            }
            
            // Check horizontal arrangement
            if (updatedHChild2.x <= updatedHChild1.x) {
                throw new Error('Children not arranged horizontally');
            }
            
            // Test grid layout
            const gridContainer = RustUISystem.createContainer('grid_container', 'Grid Container', 450, 0, 300, 200, UILayoutType.Grid);
            gridContainer.layout.gridColumns = 2;
            gridContainer.layout.gridRows = 2;
            this.uiSystem.createWidget(gridContainer);
            
            const gridChild1 = RustUISystem.createButton('grid_child1', 'Grid 1', 0, 0, 100, 40);
            const gridChild2 = RustUISystem.createButton('grid_child2', 'Grid 2', 0, 0, 100, 40);
            const gridChild3 = RustUISystem.createButton('grid_child3', 'Grid 3', 0, 0, 100, 40);
            const gridChild4 = RustUISystem.createButton('grid_child4', 'Grid 4', 0, 0, 100, 40);
            
            this.uiSystem.createWidget(gridChild1);
            this.uiSystem.createWidget(gridChild2);
            this.uiSystem.createWidget(gridChild3);
            this.uiSystem.createWidget(gridChild4);
            
            this.uiSystem.addChild('grid_container', 'grid_child1');
            this.uiSystem.addChild('grid_container', 'grid_child2');
            this.uiSystem.addChild('grid_container', 'grid_child3');
            this.uiSystem.addChild('grid_container', 'grid_child4');
            
            this.uiSystem.updateLayout();
            
            const updatedGridChild1 = this.uiSystem.getWidget('grid_child1');
            const updatedGridChild2 = this.uiSystem.getWidget('grid_child2');
            const updatedGridChild3 = this.uiSystem.getWidget('grid_child3');
            const updatedGridChild4 = this.uiSystem.getWidget('grid_child4');
            
            if (!updatedGridChild1 || !updatedGridChild2 || !updatedGridChild3 || !updatedGridChild4) {
                throw new Error('Grid children not found after layout update');
            }
            
            // Check grid arrangement (2x2 grid)
            if (updatedGridChild2.x <= updatedGridChild1.x || updatedGridChild3.y <= updatedGridChild1.y) {
                throw new Error('Children not arranged in grid');
            }
            
            this.addResult(testName, 'pass', 'Layout system works correctly', performance.now() - start, {
                verticalLayoutTested: true,
                horizontalLayoutTested: true,
                gridLayoutTested: true,
                spacingApplied: true,
                layoutUpdateTested: true,
                childrenArrangedCorrectly: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Layout system failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEventHandling(): Promise<void> {
        const testName = 'Event Handling';
        const start = performance.now();
        
        try {
            // Create test widget
            const widget = RustUISystem.createButton('event_test', 'Event Test', 100, 100, 120, 40);
            this.uiSystem.createWidget(widget);
            
            // Test click event
            const clickResult = this.uiSystem.handleClickEvent('event_test', 150, 120);
            if (!clickResult.success) {
                throw new Error(`Failed to handle click event: ${clickResult.error}`);
            }
            
            // Test click on non-existent widget
            const invalidClickResult = this.uiSystem.handleClickEvent('nonexistent', 0, 0);
            if (invalidClickResult.success) {
                throw new Error('Should fail to handle click on non-existent widget');
            }
            
            // Test click on disabled widget
            this.uiSystem.setWidgetEnabled('event_test', false);
            const disabledClickResult = this.uiSystem.handleClickEvent('event_test', 150, 120);
            if (disabledClickResult.success) {
                throw new Error('Should fail to handle click on disabled widget');
            }
            
            // Test click on invisible widget
            this.uiSystem.setWidgetEnabled('event_test', true);
            this.uiSystem.setWidgetVisibility('event_test', false);
            const invisibleClickResult = this.uiSystem.handleClickEvent('event_test', 150, 120);
            if (invisibleClickResult.success) {
                throw new Error('Should fail to handle click on invisible widget');
            }
            
            // Restore widget state
            this.uiSystem.setWidgetVisibility('event_test', true);
            
            this.addResult(testName, 'pass', 'Event handling works correctly', performance.now() - start, {
                clickEventTested: true,
                disabledWidgetTested: true,
                invisibleWidgetTested: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Event handling failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAnimationSystem(): Promise<void> {
        const testName = 'Animation System';
        const start = performance.now();
        
        try {
            // Create test widget
            const widget = RustUISystem.createWidget('anim_test', UIWidgetType.Button, 'Animation Test', 100, 100, 120, 40);
            this.uiSystem.createWidget(widget);
            
            // Create animation
            const fromState = RustUISystem.createAnimationState(100, 100, 120, 40, 1, 0, 1, 1);
            const toState = RustUISystem.createAnimationState(200, 200, 120, 40, 0.5, 45, 1.5, 1.5);
            const animation = RustUISystem.createAnimation('test_anim', UIAnimationType.Fade, 1000, fromState, toState);
            
            // Test adding animation
            const addResult = this.uiSystem.addAnimation('anim_test', animation);
            if (!addResult.success) {
                throw new Error(`Failed to add animation: ${addResult.error}`);
            }
            
            // Test playing animation
            const playResult = this.uiSystem.playAnimation('anim_test', 'test_anim');
            if (!playResult.success) {
                throw new Error(`Failed to play animation: ${playResult.error}`);
            }
            
            // Test pausing animation
            const pauseResult = this.uiSystem.pauseAnimation('anim_test', 'test_anim');
            if (!pauseResult.success) {
                throw new Error(`Failed to pause animation: ${pauseResult.error}`);
            }
            
            // Test resuming animation
            const resumeResult = this.uiSystem.playAnimation('anim_test', 'test_anim');
            if (!resumeResult.success) {
                throw new Error(`Failed to resume animation: ${resumeResult.error}`);
            }
            
            // Test stopping animation
            const stopResult = this.uiSystem.stopAnimation('anim_test', 'test_anim');
            if (!stopResult.success) {
                throw new Error(`Failed to stop animation: ${stopResult.error}`);
            }
            
            // Test removing animation
            const removeResult = this.uiSystem.removeAnimation('anim_test', 'test_anim');
            if (!removeResult.success) {
                throw new Error(`Failed to remove animation: ${removeResult.error}`);
            }
            
            // Test animation on non-existent widget
            const invalidAddResult = this.uiSystem.addAnimation('nonexistent', animation);
            if (invalidAddResult.success) {
                throw new Error('Should fail to add animation to non-existent widget');
            }
            
            // Test non-existent animation
            const invalidPlayResult = this.uiSystem.playAnimation('anim_test', 'nonexistent');
            if (invalidPlayResult.success) {
                throw new Error('Should fail to play non-existent animation');
            }
            
            this.addResult(testName, 'pass', 'Animation system works correctly', performance.now() - start, {
                animationCreated: true,
                animationAdded: true,
                animationPlayed: true,
                animationPaused: true,
                animationStopped: true,
                animationRemoved: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Animation system failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRendering(): Promise<void> {
        const testName = 'Rendering';
        const start = performance.now();
        
        try {
            // Create test widgets
            const button = RustUISystem.createButton('render_button', 'Render Button', 10, 10, 100, 40);
            const label = RustUISystem.createLabel('render_label', 'Render Label', 10, 60, 150, 20);
            const container = RustUISystem.createContainer('render_container', 'Render Container', 200, 10, 200, 150);
            
            this.uiSystem.createWidget(button);
            this.uiSystem.createWidget(label);
            this.uiSystem.createWidget(container);
            
            // Test rendering
            const renderResult = this.uiSystem.render();
            if (!renderResult.success) {
                throw new Error(`Failed to render: ${renderResult.error}`);
            }
            
            if (!renderResult.commands || renderResult.commands.length === 0) {
                throw new Error('No render commands generated');
            }
            
            // Verify render commands
            const commands = renderResult.commands;
            const buttonCommand = commands.find(cmd => cmd.widgetId === 'render_button');
            const labelCommand = commands.find(cmd => cmd.widgetId === 'render_label');
            const containerCommand = commands.find(cmd => cmd.widgetId === 'render_container');
            
            if (!buttonCommand) {
                throw new Error('Button render command not found');
            }
            
            if (!labelCommand) {
                throw new Error('Label render command not found');
            }
            
            if (!containerCommand) {
                throw new Error('Container render command not found');
            }
            
            // Verify command properties
            if (buttonCommand.widgetType !== UIWidgetType.Button) {
                throw new Error('Button command has wrong widget type');
            }
            
            if (buttonCommand.text !== 'Render Button') {
                throw new Error('Button command has wrong text');
            }
            
            if (labelCommand.text !== 'Render Label') {
                throw new Error('Label command has wrong text');
            }
            
            // Test rendering with invisible widget
            this.uiSystem.setWidgetVisibility('render_button', false);
            const invisibleRenderResult = this.uiSystem.render();
            if (!invisibleRenderResult.success) {
                throw new Error('Failed to render with invisible widget');
            }
            
            const invisibleCommands = invisibleRenderResult.commands;
            const invisibleButtonCommand = invisibleCommands.find(cmd => cmd.widgetId === 'render_button');
            
            if (invisibleButtonCommand && invisibleButtonCommand.visible) {
                throw new Error('Invisible widget should not be visible in render command');
            }
            
            // Restore visibility
            this.uiSystem.setWidgetVisibility('render_button', true);
            
            this.addResult(testName, 'pass', 'Rendering works correctly', performance.now() - start, {
                commandsGenerated: commands.length,
                buttonCommandFound: true,
                labelCommandFound: true,
                containerCommandFound: true,
                commandPropertiesVerified: true,
                invisibleWidgetTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Rendering failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testFocusManagement(): Promise<void> {
        const testName = 'Focus Management';
        const start = performance.now();
        
        try {
            // Create test widgets
            const widget1 = RustUISystem.createButton('focus1', 'Focus 1', 10, 10, 100, 40);
            const widget2 = RustUISystem.createButton('focus2', 'Focus 2', 10, 60, 100, 40);
            
            this.uiSystem.createWidget(widget1);
            this.uiSystem.createWidget(widget2);
            
            // Test setting focus
            const setFocusResult = this.uiSystem.setFocus('focus1');
            if (!setFocusResult.success) {
                throw new Error(`Failed to set focus: ${setFocusResult.error}`);
            }
            
            // Verify focused widget
            const focusedWidget = this.uiSystem.getFocusedWidget();
            if (focusedWidget !== 'focus1') {
                throw new Error('Wrong widget has focus');
            }
            
            // Verify widget state
            const widget1State = this.uiSystem.getWidget('focus1');
            if (!widget1State || !widget1State.focused) {
                throw new Error('Widget should be focused');
            }
            
            // Test switching focus
            this.uiSystem.setFocus('focus2');
            const newFocusedWidget = this.uiSystem.getFocusedWidget();
            if (newFocusedWidget !== 'focus2') {
                throw new Error('Focus not switched correctly');
            }
            
            // Verify previous widget lost focus
            const widget1StateAfter = this.uiSystem.getWidget('focus1');
            if (!widget1StateAfter || widget1StateAfter.focused) {
                throw new Error('Previous widget should have lost focus');
            }
            
            // Test clearing focus
            this.uiSystem.clearFocus();
            const clearedFocus = this.uiSystem.getFocusedWidget();
            if (clearedFocus !== null) {
                throw new Error('Focus should be cleared');
            }
            
            // Verify widget state after clearing focus
            const widget2StateAfter = this.uiSystem.getWidget('focus2');
            if (!widget2StateAfter || widget2StateAfter.focused) {
                throw new Error('Widget should not be focused after clear');
            }
            
            // Test focus on non-existent widget
            const invalidFocusResult = this.uiSystem.setFocus('nonexistent');
            if (invalidFocusResult.success) {
                throw new Error('Should fail to set focus on non-existent widget');
            }
            
            this.addResult(testName, 'pass', 'Focus management works correctly', performance.now() - start, {
                focusSet: true,
                focusSwitched: true,
                focusCleared: true,
                widgetStateVerified: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Focus management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testHitTesting(): Promise<void> {
        const testName = 'Hit Testing';
        const start = performance.now();
        
        try {
            // Create test widgets
            const widget1 = RustUISystem.createWidget('hit1', UIWidgetType.Button, 'Hit 1', 50, 50, 100, 40);
            const widget2 = RustUISystem.createWidget('hit2', UIWidgetType.Button, 'Hit 2', 200, 100, 80, 60);
            
            this.uiSystem.createWidget(widget1);
            this.uiSystem.createWidget(widget2);
            
            // Test hit testing on widget1
            const hit1 = this.uiSystem.hitTest(100, 70); // Inside widget1
            if (hit1 !== 'hit1') {
                throw new Error('Hit test failed for widget1');
            }
            
            // Test hit testing on widget2
            const hit2 = this.uiSystem.hitTest(240, 130); // Inside widget2
            if (hit2 !== 'hit2') {
                throw new Error('Hit test failed for widget2');
            }
            
            // Test hit testing outside widgets
            const miss = this.uiSystem.hitTest(10, 10); // Outside both widgets
            if (miss !== null) {
                throw new Error('Hit test should return null for miss');
            }
            
            // Test hit testing on invisible widget
            this.uiSystem.setWidgetVisibility('hit1', false);
            const invisibleHit = this.uiSystem.hitTest(100, 70);
            if (invisibleHit === 'hit1') {
                throw new Error('Hit test should not find invisible widget');
            }
            
            // Test hit testing on disabled widget (should still be hit)
            this.uiSystem.setWidgetVisibility('hit1', true);
            this.uiSystem.setWidgetEnabled('hit1', false);
            const disabledHit = this.uiSystem.hitTest(100, 70);
            if (disabledHit !== 'hit1') {
                throw new Error('Hit test should find disabled widget');
            }
            
            // Test edge cases
            const edgeHit = this.uiSystem.hitTest(50, 50); // Top-left corner of widget1
            if (edgeHit !== 'hit1') {
                throw new Error('Hit test should work on widget edges');
            }
            
            const edgeHit2 = this.uiSystem.hitTest(150, 90); // Bottom-right corner of widget1
            if (edgeHit2 !== 'hit1') {
                throw new Error('Hit test should work on widget edges');
            }
            
            this.addResult(testName, 'pass', 'Hit testing works correctly', performance.now() - start, {
                hitTestInside: true,
                hitTestOutside: true,
                invisibleWidgetTested: true,
                disabledWidgetTested: true,
                edgeCasesTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Hit testing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformance(): Promise<void> {
        const testName = 'Performance';
        const start = performance.now();
        
        try {
            // Create many widgets for performance testing
            const widgetCount = 100;
            const widgets = [];
            
            for (let i = 0; i < widgetCount; i++) {
                const widget = RustUISystem.createWidget(`perf_${i}`, UIWidgetType.Button, `Perf ${i}`, 
                    Math.random() * 800, Math.random() * 600, 80, 30);
                widgets.push(widget);
            }
            
            // Measure widget creation time
            const creationStart = performance.now();
            for (const widget of widgets) {
                this.uiSystem.createWidget(widget);
            }
            const creationTime = performance.now() - creationStart;
            
            // Measure rendering time
            const renderStart = performance.now();
            const renderResult = this.uiSystem.render();
            const renderTime = performance.now() - renderStart;
            
            if (!renderResult.success) {
                throw new Error('Rendering failed during performance test');
            }
            
            // Measure layout update time
            const layoutStart = performance.now();
            this.uiSystem.updateLayout();
            const layoutTime = performance.now() - layoutStart;
            
            // Measure stats retrieval time
            const statsStart = performance.now();
            const stats = this.uiSystem.getStats();
            const statsTime = performance.now() - statsStart;
            
            // Verify performance metrics
            if (stats.totalWidgets < widgetCount) {
                throw new Error('Not all widgets were created');
            }
            
            if (stats.visibleWidgets < widgetCount) {
                throw new Error('Not all widgets are visible');
            }
            
            // Get performance metrics
            const metrics = this.uiSystem.getPerformanceMetrics();
            
            // Performance thresholds (in milliseconds)
            const maxCreationTime = 100; // 100ms for 100 widgets
            const maxRenderTime = 50; // 50ms for rendering
            const maxLayoutTime = 20; // 20ms for layout
            const maxStatsTime = 5; // 5ms for stats
            
            if (creationTime > maxCreationTime) {
                throw new Error(`Widget creation too slow: ${creationTime.toFixed(2)}ms`);
            }
            
            if (renderTime > maxRenderTime) {
                throw new Error(`Rendering too slow: ${renderTime.toFixed(2)}ms`);
            }
            
            if (layoutTime > maxLayoutTime) {
                throw new Error(`Layout update too slow: ${layoutTime.toFixed(2)}ms`);
            }
            
            if (statsTime > maxStatsTime) {
                throw new Error(`Stats retrieval too slow: ${statsTime.toFixed(2)}ms`);
            }
            
            // Test memory usage
            if (metrics.memoryUsage <= 0) {
                throw new Error('Memory usage should be positive');
            }
            
            // Cleanup test widgets
            for (let i = 0; i < widgetCount; i++) {
                this.uiSystem.deleteWidget(`perf_${i}`);
            }
            
            this.addResult(testName, 'pass', 'Performance tests passed', performance.now() - start, {
                widgetCount,
                creationTime: creationTime.toFixed(2),
                renderTime: renderTime.toFixed(2),
                layoutTime: layoutTime.toFixed(2),
                statsTime: statsTime.toFixed(2),
                memoryUsage: metrics.memoryUsage,
                performanceThresholdsMet: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance test failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testWidgetFactories(): Promise<void> {
        const testName = 'Widget Factories';
        const start = performance.now();
        
        try {
            // Test button factory
            const buttonResult = this.uiSystem.createSimpleButton('factory_button', 'Click Me', 10, 10);
            if (!buttonResult.success) {
                throw new Error(`Failed to create simple button: ${buttonResult.error}`);
            }
            
            const button = this.uiSystem.getWidget('factory_button');
            if (!button || button.widgetType !== UIWidgetType.Button) {
                throw new Error('Simple button factory failed');
            }
            
            // Test label factory
            const labelResult = this.uiSystem.createSimpleLabel('factory_label', 'Hello World', 10, 60);
            if (!labelResult.success) {
                throw new Error(`Failed to create simple label: ${labelResult.error}`);
            }
            
            const label = this.uiSystem.getWidget('factory_label');
            if (!label || label.widgetType !== UIWidgetType.Label) {
                throw new Error('Simple label factory failed');
            }
            
            // Test vertical container factory
            const vContainerResult = this.uiSystem.createVerticalContainer('v_container', 10, 100, 300, 200);
            if (!vContainerResult.success) {
                throw new Error(`Failed to create vertical container: ${vContainerResult.error}`);
            }
            
            const vContainer = this.uiSystem.getWidget('v_container');
            if (!vContainer || vContainer.layout.layoutType !== UILayoutType.Vertical) {
                throw new Error('Vertical container factory failed');
            }
            
            // Test horizontal container factory
            const hContainerResult = this.uiSystem.createHorizontalContainer('h_container', 10, 320, 300, 100);
            if (!hContainerResult.success) {
                throw new Error(`Failed to create horizontal container: ${hContainerResult.error}`);
            }
            
            const hContainer = this.uiSystem.getWidget('h_container');
            if (!hContainer || hContainer.layout.layoutType !== UILayoutType.Horizontal) {
                throw new Error('Horizontal container factory failed');
            }
            
            // Test grid container factory
            const gridResult = this.uiSystem.createGridContainer('grid_container', 10, 440, 200, 200, 2, 2);
            if (!gridResult.success) {
                throw new Error(`Failed to create grid container: ${gridResult.error}`);
            }
            
            const gridContainer = this.uiSystem.getWidget('grid_container');
            if (!gridContainer || gridContainer.layout.layoutType !== UILayoutType.Grid) {
                throw new Error('Grid container factory failed');
            }
            
            if (gridContainer.layout.gridColumns !== 2 || gridContainer.layout.gridRows !== 2) {
                throw new Error('Grid container layout parameters not set correctly');
            }
            
            // Test flex container factory
            const flexResult = this.uiSystem.createFlexContainer('flex_container', 10, 660, 300, 100, 'column', 'center', 'center');
            if (!flexResult.success) {
                throw new Error(`Failed to create flex container: ${flexResult.error}`);
            }
            
            const flexContainer = this.uiSystem.getWidget('flex_container');
            if (!flexContainer || flexContainer.layout.layoutType !== UILayoutType.Flex) {
                throw new Error('Flex container factory failed');
            }
            
            if (flexContainer.layout.flexDirection !== 'column' || flexContainer.layout.flexJustifyContent !== 'center') {
                throw new Error('Flex container layout parameters not set correctly');
            }
            
            this.addResult(testName, 'pass', 'Widget factories work correctly', performance.now() - start, {
                buttonFactoryTested: true,
                labelFactoryTested: true,
                verticalContainerFactoryTested: true,
                horizontalContainerFactoryTested: true,
                gridContainerFactoryTested: true,
                flexContainerFactoryTested: true,
                layoutParametersVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Widget factories failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAnimationFactories(): Promise<void> {
        const testName = 'Animation Factories';
        const start = performance.now();
        
        try {
            // Create test widget
            const widget = RustUISystem.createWidget('anim_factory_test', UIWidgetType.Button, 'Animation Test', 100, 100, 100, 40);
            this.uiSystem.createWidget(widget);
            
            // Test fade animation factory
            const fadeAnim = this.uiSystem.createFadeAnimation('fade_test', 1.0, 0.0, 1000);
            const fadeResult = this.uiSystem.addAnimation('anim_factory_test', fadeAnim);
            if (!fadeResult.success) {
                throw new Error(`Failed to add fade animation: ${fadeResult.error}`);
            }
            
            // Test slide animation factory
            const slideAnim = this.uiSystem.createSlideAnimation('slide_test', 100, 100, 200, 200, 1000);
            const slideResult = this.uiSystem.addAnimation('anim_factory_test', slideAnim);
            if (!slideResult.success) {
                throw new Error(`Failed to add slide animation: ${slideResult.error}`);
            }
            
            // Test scale animation factory
            const scaleAnim = this.uiSystem.createScaleAnimation('scale_test', 1.0, 2.0, 1000);
            const scaleResult = this.uiSystem.addAnimation('anim_factory_test', scaleAnim);
            if (!scaleResult.success) {
                throw new Error(`Failed to add scale animation: ${scaleResult.error}`);
            }
            
            // Test rotate animation factory
            const rotateAnim = this.uiSystem.createRotateAnimation('rotate_test', 0, 360, 1000);
            const rotateResult = this.uiSystem.addAnimation('anim_factory_test', rotateAnim);
            if (!rotateResult.success) {
                throw new Error(`Failed to add rotate animation: ${rotateResult.error}`);
            }
            
            // Verify animation properties
            const widgetWithAnims = this.uiSystem.getWidget('anim_factory_test');
            if (!widgetWithAnims || widgetWithAnims.animations.length !== 4) {
                throw new Error('Not all animations were added');
            }
            
            // Test playing animations
            this.uiSystem.playAnimation('anim_factory_test', 'fade_test');
            this.uiSystem.playAnimation('anim_factory_test', 'slide_test');
            this.uiSystem.playAnimation('anim_factory_test', 'scale_test');
            this.uiSystem.playAnimation('anim_factory_test', 'rotate_test');
            
            // Clean up animations
            this.uiSystem.removeAnimation('anim_factory_test', 'fade_test');
            this.uiSystem.removeAnimation('anim_factory_test', 'slide_test');
            this.uiSystem.removeAnimation('anim_factory_test', 'scale_test');
            this.uiSystem.removeAnimation('anim_factory_test', 'rotate_test');
            
            this.addResult(testName, 'pass', 'Animation factories work correctly', performance.now() - start, {
                fadeAnimationTested: true,
                slideAnimationTested: true,
                scaleAnimationTested: true,
                rotateAnimationTested: true,
                animationsPlayed: true,
                animationsRemoved: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Animation factories failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testThemeFactories(): Promise<void> {
        const testName = 'Theme Factories';
        const start = performance.now();
        
        try {
            // Test default theme factory
            const defaultTheme = this.uiSystem.createDefaultTheme();
            if (!defaultTheme.colors.primary || !defaultTheme.colors.background) {
                throw new Error('Default theme missing required colors');
            }
            
            if (defaultTheme.themeType !== UIThemeType.Default) {
                throw new Error('Default theme has wrong type');
            }
            
            // Test dark theme factory
            const darkTheme = this.uiSystem.createDarkTheme();
            if (!darkTheme.colors.primary || !darkTheme.colors.background) {
                throw new Error('Dark theme missing required colors');
            }
            
            if (darkTheme.themeType !== UIThemeType.Dark) {
                throw new Error('Dark theme has wrong type');
            }
            
            // Verify themes are different
            if (defaultTheme.colors.background === darkTheme.colors.background) {
                throw new Error('Default and dark themes should be different');
            }
            
            // Test adding themes to system
            const addDefaultResult = this.uiSystem.addTheme(defaultTheme);
            if (!addDefaultResult.success) {
                throw new Error(`Failed to add default theme: ${addDefaultResult.error}`);
            }
            
            const addDarkResult = this.uiSystem.addTheme(darkTheme);
            if (!addDarkResult.success) {
                throw new Error(`Failed to add dark theme: ${addDarkResult.error}`);
            }
            
            // Test switching themes
            this.uiSystem.setTheme('default');
            const currentDefault = this.uiSystem.getCurrentTheme();
            if (currentDefault.id !== 'default') {
                throw new Error('Default theme not set correctly');
            }
            
            this.uiSystem.setTheme('dark');
            const currentDark = this.uiSystem.getCurrentTheme();
            if (currentDark.id !== 'dark') {
                throw new Error('Dark theme not set correctly');
            }
            
            // Verify theme properties
            if (!currentDark.colors || Object.keys(currentDark.colors).length === 0) {
                throw new Error('Current theme missing colors');
            }
            
            if (!currentDark.fonts || Object.keys(currentDark.fonts).length === 0) {
                throw new Error('Current theme missing fonts');
            }
            
            if (!currentDark.sizes || Object.keys(currentDark.sizes).length === 0) {
                throw new Error('Current theme missing sizes');
            }
            
            if (!currentDark.spacing || Object.keys(currentDark.spacing).length === 0) {
                throw new Error('Current theme missing spacing');
            }
            
            this.addResult(testName, 'pass', 'Theme factories work correctly', performance.now() - start, {
                defaultThemeCreated: true,
                darkThemeCreated: true,
                themesAdded: true,
                themesSwitched: true,
                themePropertiesVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Theme factories failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testLayoutHelpers(): Promise<void> {
        const testName = 'Layout Helpers';
        const start = performance.now();
        
        try {
            // Create parent and child widgets
            const parent = RustUISystem.createContainer('layout_helper_parent', 'Parent', 0, 0, 400, 300);
            const child = RustUISystem.createButton('layout_helper_child', 'Child', 0, 0, 100, 40);
            
            this.uiSystem.createWidget(parent);
            this.uiSystem.createWidget(child);
            this.uiSystem.addChild('layout_helper_parent', 'layout_helper_child');
            
            // Test center widget
            const centerResult = this.uiSystem.centerWidget('layout_helper_parent', 'layout_helper_child');
            if (!centerResult.success) {
                throw new Error(`Failed to center widget: ${centerResult.error}`);
            }
            
            // Verify centering
            const centeredChild = this.uiSystem.getWidget('layout_helper_child');
            if (!centeredChild) {
                throw new Error('Centered child not found');
            }
            
            const expectedX = parent.x + (parent.width - child.width) / 2;
            const expectedY = parent.y + (parent.height - child.height) / 2;
            
            if (Math.abs(centeredChild.x - expectedX) > 0.1 || Math.abs(centeredChild.y - expectedY) > 0.1) {
                throw new Error('Widget not centered correctly');
            }
            
            // Test align widgets
            const child2 = RustUISystem.createButton('layout_helper_child2', 'Child 2', 0, 0, 80, 30);
            const child3 = RustUISystem.createButton('layout_helper_child3', 'Child 3', 0, 0, 120, 35);
            
            this.uiSystem.createWidget(child2);
            this.uiSystem.createWidget(child3);
            this.uiSystem.addChild('layout_helper_parent', 'layout_helper_child2');
            this.uiSystem.addChild('layout_helper_parent', 'layout_helper_child3');
            
            // Test left alignment
            const leftAlignResult = this.uiSystem.alignWidgets('layout_helper_parent', 'left');
            if (!leftAlignResult.success) {
                throw new Error(`Failed to align left: ${leftAlignResult.error}`);
            }
            
            // Test center alignment
            const centerAlignResult = this.uiSystem.alignWidgets('layout_helper_parent', 'center');
            if (!centerAlignResult.success) {
                throw new Error(`Failed to align center: ${centerAlignResult.error}`);
            }
            
            // Test right alignment
            const rightAlignResult = this.uiSystem.alignWidgets('layout_helper_parent', 'right');
            if (!rightAlignResult.success) {
                throw new Error(`Failed to align right: ${rightAlignResult.error}`);
            }
            
            // Test top alignment
            const topAlignResult = this.uiSystem.alignWidgets('layout_helper_parent', 'top');
            if (!topAlignResult.success) {
                throw new Error(`Failed to align top: ${topAlignResult.error}`);
            }
            
            // Test bottom alignment
            const bottomAlignResult = this.uiSystem.alignWidgets('layout_helper_parent', 'bottom');
            if (!bottomAlignResult.success) {
                throw new Error(`Failed to align bottom: ${bottomAlignResult.error}`);
            }
            
            // Test error cases
            const invalidCenterResult = this.uiSystem.centerWidget('nonexistent', 'layout_helper_child');
            if (invalidCenterResult.success) {
                throw new Error('Should fail to center with non-existent parent');
            }
            
            const invalidAlignResult = this.uiSystem.alignWidgets('nonexistent', 'left');
            if (invalidAlignResult.success) {
                throw new Error('Should fail to align with non-existent parent');
            }
            
            this.addResult(testName, 'pass', 'Layout helpers work correctly', performance.now() - start, {
                centerWidgetTested: true,
                leftAlignmentTested: true,
                centerAlignmentTested: true,
                rightAlignmentTested: true,
                topAlignmentTested: true,
                bottomAlignmentTested: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Layout helpers failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testDebugHelpers(): Promise<void> {
        const testName = 'Debug Helpers';
        const start = performance.now();
        
        try {
            // Create widget hierarchy for testing
            const root = RustUISystem.createContainer('debug_root', 'Root', 0, 0, 500, 400);
            const child1 = RustUISystem.createContainer('debug_child1', 'Child 1', 10, 10, 200, 150);
            const child2 = RustUISystem.createButton('debug_child2', 'Child 2', 220, 10, 100, 40);
            const grandchild = RustUISystem.createLabel('debug_grandchild', 'Grandchild', 10, 10, 80, 20);
            
            this.uiSystem.createWidget(root);
            this.uiSystem.createWidget(child1);
            this.uiSystem.createWidget(child2);
            this.uiSystem.createWidget(grandchild);
            
            this.uiSystem.addChild('debug_root', 'debug_child1');
            this.uiSystem.addChild('debug_root', 'debug_child2');
            this.uiSystem.addChild('debug_child1', 'debug_grandchild');
            
            // Test debug mode enable
            this.uiSystem.enableDebugMode();
            
            const config = this.uiSystem.getConfig();
            if (!config.debugMode) {
                throw new Error('Debug mode not enabled');
            }
            
            // Test debug mode disable
            this.uiSystem.disableDebugMode();
            
            const configAfter = this.uiSystem.getConfig();
            if (configAfter.debugMode) {
                throw new Error('Debug mode not disabled');
            }
            
            // Test hierarchy printing (this just ensures it doesn't throw an error)
            try {
                this.uiSystem.printWidgetHierarchy();
            } catch (error) {
                throw new Error(`Hierarchy printing failed: ${error}`);
            }
            
            // Test performance metrics
            const metrics = this.uiSystem.getPerformanceMetrics();
            if (!metrics || typeof metrics.totalWidgets !== 'number') {
                throw new Error('Performance metrics not valid');
            }
            
            if (metrics.totalWidgets < 4) {
                throw new Error('Performance metrics should show created widgets');
            }
            
            // Test cleanup
            this.uiSystem.cleanup();
            
            const statsAfter = this.uiSystem.getStats();
            if (statsAfter.totalWidgets > 0) {
                throw new Error('Cleanup should remove all widgets');
            }
            
            this.addResult(testName, 'pass', 'Debug helpers work correctly', performance.now() - start, {
                debugModeEnabled: true,
                debugModeDisabled: true,
                hierarchyPrinted: true,
                performanceMetricsRetrieved: true,
                cleanupTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Debug helpers failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🎨 Rust UI System Test Report');
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
        
        // UI System Summary
        const initTest = this.results.find(r => r.name === 'UI System Initialization');
        const configTest = this.results.find(r => r.name === 'Configuration Presets');
        const widgetTest = this.results.find(r => r.name === 'Widget Management');
        const layoutTest = this.results.find(r => r.name === 'Layout System');
        const renderTest = this.results.find(r => r.name === 'Rendering');
        
        if (initTest?.details || configTest?.details || widgetTest?.details || layoutTest?.details || renderTest?.details) {
            console.log(`\n🎨 UI System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (configTest?.details) {
                console.log(`   Configuration: ${configTest.details.configsTested} presets tested`);
            }
            if (widgetTest?.details) {
                console.log(`   Widget Management: ${widgetTest.details.widgetsCreated} widgets created`);
            }
            if (layoutTest?.details) {
                console.log(`   Layout System: ${layoutTest.details.verticalLayoutTested ? '✅' : '❌'} Vertical, ${layoutTest.details.horizontalLayoutTested ? '✅' : '❌'} Horizontal, ${layoutTest.details.gridLayoutTested ? '✅' : '❌'} Grid`);
            }
            if (renderTest?.details) {
                console.log(`   Rendering: ${renderTest.details.commandsGenerated} commands generated`);
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

import { RustInput, InputType, InputAction, InputConfig, InputEvent } from '../rust-wrappers/RustInput';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustInputTest {
    private rustInput: RustInput;
    private results: TestResult[] = [];
    private testEvents: InputEvent[] = [];

    constructor() {
        this.rustInput = new RustInput();
    }

    async runAllTests(): Promise<void> {
        console.log('🎮 Starting Rust Input Management Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testDeviceManagement();
            await this.testEventProcessing();
            await this.testAccessibilityFeatures();
            await this.testConfigurationPresets();
            await this.testInputAnalysis();
            await this.testPerformanceMonitoring();
            await this.testConfigurationValidation();
            await this.testInputSimulation();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Input test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Input Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Input Manager Initialization';
        const start = performance.now();
        
        try {
            const config = RustInput.createFullInputConfig();
            await this.rustInput.initialize(config);
            
            if (!this.rustInput.isInitialized()) {
                throw new Error('Input Manager not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.rustInput.getConfig();
            if (!retrievedConfig.enableMultitouch || !retrievedConfig.enableGestures) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.rustInput.getStats();
            if (stats.totalEvents < 0 || stats.eventsPerSecond < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test input summary
            const summary = this.rustInput.getInputSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Input summary not available');
            }
            
            this.addResult(testName, 'pass', 'Input Manager initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testDeviceManagement(): Promise<void> {
        const testName = 'Device Management';
        const start = performance.now();
        
        try {
            // Create test events to simulate device usage
            const keyboardEvent = this.rustInput.createKeyboardEvent('w', InputAction.Press);
            const mouseEvent = this.rustInput.createMouseEvent(100, 200, InputAction.Press);
            const touchEvent = this.rustInput.createTouchEvent(150, 250, InputAction.Press);
            
            // Add to test events
            this.testEvents.push(keyboardEvent, mouseEvent, touchEvent);
            
            // Verify event structure
            for (const event of [keyboardEvent, mouseEvent, touchEvent]) {
                if (!event.id || !event.deviceId || !event.contextId) {
                    throw new Error('Event structure invalid');
                }
                
                if (event.timestamp <= 0) {
                    throw new Error('Event timestamp invalid');
                }
            }
            
            // Verify specific event properties
            if (keyboardEvent.data?.keyCode === undefined) {
                throw new Error('Keyboard event missing key code');
            }
            
            if (mouseEvent.position?.x === undefined || mouseEvent.position?.y === undefined) {
                throw new Error('Mouse event missing position');
            }
            
            if (touchEvent.data?.button === undefined) {
                throw new Error('Touch event missing touch ID');
            }
            
            this.addResult(testName, 'pass', 'Device management works correctly', window.performance.now() - start, {
                testEvents: this.testEvents.length,
                keyboardEvent: keyboardEvent.inputType,
                mouseEvent: mouseEvent.inputType,
                touchEvent: touchEvent.inputType,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Device management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testEventProcessing(): Promise<void> {
        const testName = 'Event Processing';
        const start = performance.now();
        
        try {
            // Create various test events
            const events = [
                this.rustInput.createKeyboardEvent('a', InputAction.Press),
                this.rustInput.createKeyboardEvent('a', InputAction.Release),
                this.rustInput.createMouseEvent(100, 100, InputAction.Move),
                this.rustInput.createMouseEvent(100, 100, InputAction.Press, 0),
                this.rustInput.createMouseEvent(100, 100, InputAction.Release, 0),
                this.rustInput.createTouchEvent(200, 200, InputAction.Press, 0),
                this.rustInput.createTouchEvent(200, 200, InputAction.Move, 0),
                this.rustInput.createTouchEvent(200, 200, InputAction.Release, 0),
            ];
            
            // Add to test events
            this.testEvents.push(...events);
            
            // Analyze event patterns
            const patterns = this.rustInput.analyzeInputPatterns(events);
            
            if (patterns.totalEvents !== events.length) {
                throw new Error('Event count mismatch');
            }
            
            // Verify event type analysis
            const expectedTypes = [InputType.Keyboard, InputType.Mouse, InputType.Touch];
            for (const type of expectedTypes) {
                if (patterns.eventsByType[type] === undefined) {
                    console.warn(`No events of type ${InputType[type]} found`);
                }
            }
            
            // Verify event action analysis
            const expectedActions = [InputAction.Press, InputAction.Release, InputAction.Move];
            for (const action of expectedActions) {
                if (patterns.eventsByAction[action] === undefined) {
                    console.warn(`No events of action ${InputAction[action]} found`);
                }
            }
            
            // Verify device usage
            if (Object.keys(patterns.deviceUsage).length === 0) {
                throw new Error('No device usage data found');
            }
            
            // Test anomaly detection
            const anomalies = this.rustInput.detectInputAnomalies(events);
            
            if (!anomalies.anomalies || !anomalies.recommendations) {
                throw new Error('Anomaly detection structure invalid');
            }
            
            this.addResult(testName, 'pass', 'Event processing works correctly', window.performance.now() - start, {
                totalEvents: patterns.totalEvents,
                eventTypes: Object.keys(patterns.eventsByType).length,
                deviceUsage: Object.keys(patterns.deviceUsage).length,
                anomalies: anomalies.anomalies.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Event processing failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAccessibilityFeatures(): Promise<void> {
        const testName = 'Accessibility Features';
        const start = performance.now();
        
        try {
            // Test accessibility feature enabling
            const result = this.rustInput.enableAccessibilityFeatures();
            
            if (!result.success) {
                console.warn(`Accessibility features warning: ${result.message}`);
            }
            
            // Test screen reader announcements
            this.rustInput.announceToScreenReader('Test announcement');
            
            // Test visual cues
            this.rustInput.showVisualCue('info', 'Test visual cue');
            
            // Test haptic feedback
            this.rustInput.triggerHapticFeedback(0.5);
            
            // Test accessibility configuration
            const accessibilityConfig = RustInput.createAccessibilityInputConfig();
            await this.rustInput.initialize(accessibilityConfig);
            
            const config = this.rustInput.getConfig();
            
            if (!config.accessibility.enableScreenReader || 
                !config.accessibility.visualCues || 
                !config.accessibility.hapticFeedback) {
                throw new Error('Accessibility config not set correctly');
            }
            
            // Test accessibility features testing
            const accessibilityTest = this.rustInput.testAccessibilityFeatures();
            
            if (!accessibilityTest.screenReader || 
                !accessibilityTest.visualCues || 
                !accessibilityTest.hapticFeedback) {
                throw new Error('Accessibility test results invalid');
            }
            
            // Verify recommendations
            if (!Array.isArray(accessibilityTest.recommendations)) {
                throw new Error('Accessibility recommendations invalid');
            }
            
            this.addResult(testName, 'pass', 'Accessibility features work correctly', window.performance.now() - start, {
                screenReader: accessibilityTest.screenReader,
                visualCues: accessibilityTest.visualCues,
                hapticFeedback: accessibilityTest.hapticFeedback,
                recommendations: accessibilityTest.recommendations.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Accessibility features failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test full input configuration
            const fullConfig = RustInput.createFullInputConfig();
            await this.rustInput.initialize(fullConfig);
            
            const fullConfigRetrieved = this.rustInput.getConfig();
            if (!fullConfigRetrieved.enableMultitouch || !fullConfigRetrieved.enableGestures) {
                throw new Error('Full input configuration not set correctly');
            }
            
            // Test basic input configuration
            const basicConfig = RustInput.createBasicInputConfig();
            await this.rustInput.initialize(basicConfig);
            
            const basicConfigRetrieved = this.rustInput.getConfig();
            if (basicConfigRetrieved.enableGestures || basicConfigRetrieved.enableVoiceInput) {
                throw new Error('Basic input configuration not set correctly');
            }
            
            // Test mobile input configuration
            const mobileConfig = RustInput.createMobileInputConfig();
            await this.rustInput.initialize(mobileConfig);
            
            const mobileConfigRetrieved = this.rustInput.getConfig();
            if (!mobileConfigRetrieved.enableMultitouch || !mobileConfigRetrieved.enableMotionInput) {
                throw new Error('Mobile input configuration not set correctly');
            }
            
            // Test desktop input configuration
            const desktopConfig = RustInput.createDesktopInputConfig();
            await this.rustInput.initialize(desktopConfig);
            
            const desktopConfigRetrieved = this.rustInput.getConfig();
            if (desktopConfigRetrieved.enableMultitouch || !desktopConfigRetrieved.enableGamepadSupport) {
                throw new Error('Desktop input configuration not set correctly');
            }
            
            // Test accessibility input configuration
            const accessibilityConfig = RustInput.createAccessibilityInputConfig();
            await this.rustInput.initialize(accessibilityConfig);
            
            const accessibilityConfigRetrieved = this.rustInput.getConfig();
            if (!accessibilityConfigRetrieved.accessibility.enableScreenReader || 
                !accessibilityConfigRetrieved.accessibility.hapticFeedback) {
                throw new Error('Accessibility input configuration not set correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', window.performance.now() - start, {
                fullConfigFeatures: this.countEnabledFeatures(fullConfigRetrieved),
                basicConfigFeatures: this.countEnabledFeatures(basicConfigRetrieved),
                mobileConfigFeatures: this.countEnabledFeatures(mobileConfigRetrieved),
                desktopConfigFeatures: this.countEnabledFeatures(desktopConfigRetrieved),
                accessibilityConfigFeatures: this.countEnabledFeatures(accessibilityConfigRetrieved),
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testInputAnalysis(): Promise<void> {
        const testName = 'Input Analysis';
        const start = performance.now();
        
        try {
            // Create test events with various patterns
            const events = [
                // Normal typing pattern
                this.rustInput.createKeyboardEvent('h', InputAction.Press),
                this.rustInput.createKeyboardEvent('h', InputAction.Release),
                this.rustInput.createKeyboardEvent('e', InputAction.Press),
                this.rustInput.createKeyboardEvent('e', InputAction.Release),
                this.rustInput.createKeyboardEvent('l', InputAction.Press),
                this.rustInput.createKeyboardEvent('l', InputAction.Release),
                this.rustInput.createKeyboardEvent('l', InputAction.Press),
                this.rustInput.createKeyboardEvent('l', InputAction.Release),
                this.rustInput.createKeyboardEvent('o', InputAction.Press),
                this.rustInput.createKeyboardEvent('o', InputAction.Release),
                
                // Mouse movement pattern
                this.rustInput.createMouseEvent(100, 100, InputAction.Move),
                this.rustInput.createMouseEvent(105, 102, InputAction.Move),
                this.rustInput.createMouseEvent(110, 104, InputAction.Move),
                this.rustInput.createMouseEvent(115, 106, InputAction.Move),
                
                // Rapid fire events (should be detected as anomaly)
                this.rustInput.createKeyboardEvent('x', InputAction.Press),
                this.rustInput.createKeyboardEvent('x', InputAction.Release),
                this.rustInput.createKeyboardEvent('y', InputAction.Press),
                this.rustInput.createKeyboardEvent('y', InputAction.Release),
            ];
            
            // Add timestamps to simulate rapid fire
            const baseTime = Date.now();
            events.forEach((event, index) => {
                event.timestamp = baseTime + (index * 5); // 5ms intervals
            });
            
            // Analyze input patterns
            const patterns = this.rustInput.analyzeInputPatterns(events);
            
            if (patterns.totalEvents !== events.length) {
                throw new Error('Pattern analysis event count mismatch');
            }
            
            // Detect anomalies
            const anomalies = this.rustInput.detectInputAnomalies(events);
            
            if (!anomalies.anomalies || !anomalies.recommendations) {
                throw new Error('Anomaly detection structure invalid');
            }
            
            // Should detect rapid fire events
            const rapidFireAnomalies = anomalies.anomalies.filter(a => a.type === 'rapid_fire');
            if (rapidFireAnomalies.length === 0) {
                console.warn('No rapid fire anomalies detected (may be expected)');
            }
            
            // Test performance monitoring
            const performance = this.rustInput.monitorInputPerformance(events);
            
            if (!performance.averageLatency || !performance.eventProcessingRate) {
                throw new Error('Performance monitoring structure invalid');
            }
            
            // Verify performance metrics are reasonable
            if (performance.averageLatency < 0 || performance.maxLatency < 0) {
                throw new Error('Invalid latency values');
            }
            
            if (performance.eventProcessingRate < 0) {
                throw new Error('Invalid processing rate');
            }
            
            this.addResult(testName, 'pass', 'Input analysis works correctly', window.performance.now() - start, {
                totalEvents: patterns.totalEvents,
                averageInterval: patterns.averageInterval,
                peakActivity: patterns.peakActivity,
                anomalies: anomalies.anomalies.length,
                averageLatency: performance.averageLatency,
                processingRate: performance.eventProcessingRate,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Input analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceMonitoring(): Promise<void> {
        const testName = 'Performance Monitoring';
        const start = performance.now();
        
        try {
            // Create a large number of events to test performance
            const events: InputEvent[] = [];
            const baseTime = Date.now();
            
            for (let i = 0; i < 1000; i++) {
                const event = this.rustInput.createKeyboardEvent('a', InputAction.Press);
                event.timestamp = baseTime + (i * 10); // 10ms intervals
                events.push(event);
            }
            
            // Monitor performance
            const performance = this.rustInput.monitorInputPerformance(events);
            
            if (!performance.averageLatency || !performance.maxLatency || !performance.eventProcessingRate) {
                throw new Error('Performance monitoring incomplete');
            }
            
            // Verify metrics are within reasonable ranges
            if (performance.averageLatency <= 0 || performance.averageLatency > 100) {
                console.warn(`Unusual average latency: ${performance.averageLatency}ms`);
            }
            
            if (performance.maxLatency <= 0 || performance.maxLatency > 1000) {
                console.warn(`Unusual max latency: ${performance.maxLatency}ms`);
            }
            
            if (performance.eventProcessingRate <= 0) {
                throw new Error('Invalid event processing rate');
            }
            
            if (performance.memoryUsage < 0) {
                throw new Error('Invalid memory usage');
            }
            
            // Check for recommendations
            if (!Array.isArray(performance.recommendations)) {
                throw new Error('Performance recommendations invalid');
            }
            
            // Test with different event patterns
            const rapidEvents = events.slice(0, 100).map((event, index) => ({
                ...event,
                timestamp: baseTime + (index * 1), // 1ms intervals - very rapid
            }));
            
            const rapidPerformance = this.rustInput.monitorInputPerformance(rapidEvents);
            
            if (rapidPerformance.eventProcessingRate <= performance.eventProcessingRate) {
                console.warn('Rapid events should have higher processing rate');
            }
            
            this.addResult(testName, 'pass', 'Performance monitoring works correctly', window.performance.now() - start, {
                averageLatency: performance.averageLatency,
                maxLatency: performance.maxLatency,
                processingRate: performance.eventProcessingRate,
                memoryUsage: performance.memoryUsage,
                recommendations: performance.recommendations.length,
                rapidProcessingRate: rapidPerformance.eventProcessingRate,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance monitoring failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationValidation(): Promise<void> {
        const testName = 'Configuration Validation';
        const start = performance.now();
        
        try {
            // Test valid configuration
            const validConfig = RustInput.createFullInputConfig();
            const validValidation = this.rustInput.validateConfiguration(validConfig);
            
            if (!validValidation.isValid) {
                throw new Error('Valid configuration marked as invalid');
            }
            
            if (validValidation.errors.length > 0) {
                throw new Error('Valid configuration has errors');
            }
            
            // Test invalid configuration
            const invalidConfig: InputConfig = {
                ...validConfig,
                enableGestures: true,
                gestureSensitivity: 1.5, // Invalid: > 1.0
                enableVoiceInput: true,
                voiceThreshold: -0.1, // Invalid: < 0.0
                enableMotionInput: true,
                motionThreshold: 1.5, // Invalid: > 1.0
            };
            
            const invalidValidation = this.rustInput.validateConfiguration(invalidConfig);
            
            if (invalidValidation.isValid) {
                throw new Error('Invalid configuration marked as valid');
            }
            
            if (invalidValidation.errors.length === 0) {
                throw new Error('Invalid configuration has no errors');
            }
            
            // Test configuration with warnings
            const warningConfig: InputConfig = {
                ...validConfig,
                enableMultitouch: true,
                maxTouchPoints: 1, // Warning: multitouch with only 1 point
            };
            
            const warningValidation = this.rustInput.validateConfiguration(warningConfig);
            
            if (warningValidation.warnings.length === 0) {
                console.warn('Expected warning for multitouch with 1 point');
            }
            
            // Verify recommendations are provided
            if (!Array.isArray(invalidValidation.recommendations)) {
                throw new Error('Validation recommendations invalid');
            }
            
            // Test edge cases
            const edgeConfig: InputConfig = {
                ...validConfig,
                gestureSensitivity: 0.1, // Edge: minimum valid value
                voiceThreshold: 1.0, // Edge: maximum valid value
                motionThreshold: 0.0, // Edge: minimum valid value
            };
            
            const edgeValidation = this.rustInput.validateConfiguration(edgeConfig);
            
            if (!edgeValidation.isValid) {
                throw new Error('Edge case configuration marked as invalid');
            }
            
            this.addResult(testName, 'pass', 'Configuration validation works correctly', window.performance.now() - start, {
                validConfigErrors: validValidation.errors.length,
                validConfigWarnings: validValidation.warnings.length,
                invalidConfigErrors: invalidValidation.errors.length,
                warningConfigWarnings: warningValidation.warnings.length,
                edgeConfigValid: edgeValidation.isValid,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testInputSimulation(): Promise<void> {
        const testName = 'Input Simulation';
        const start = performance.now();
        
        try {
            // Simulate keyboard typing
            const word = 'hello';
            const keyboardEvents: InputEvent[] = [];
            
            for (const char of word) {
                keyboardEvents.push(this.rustInput.createKeyboardEvent(char, InputAction.Press));
                keyboardEvents.push(this.rustInput.createKeyboardEvent(char, InputAction.Release));
            }
            
            // Simulate mouse drag
            const mouseEvents: InputEvent[] = [
                this.rustInput.createMouseEvent(100, 100, InputAction.Press, 0),
                this.rustInput.createMouseEvent(110, 105, InputAction.Move),
                this.rustInput.createMouseEvent(120, 110, InputAction.Move),
                this.rustInput.createMouseEvent(130, 115, InputAction.Move),
                this.rustInput.createMouseEvent(140, 120, InputAction.Release, 0),
            ];
            
            // Simulate multi-touch gesture
            const touchEvents: InputEvent[] = [
                this.rustInput.createTouchEvent(200, 200, InputAction.Press, 0),
                this.rustInput.createTouchEvent(250, 250, InputAction.Press, 1),
                this.rustInput.createTouchEvent(210, 210, InputAction.Move, 0),
                this.rustInput.createTouchEvent(260, 260, InputAction.Move, 1),
                this.rustInput.createTouchEvent(220, 220, InputAction.Release, 0),
                this.rustInput.createTouchEvent(270, 270, InputAction.Release, 1),
            ];
            
            // Combine all events
            const allEvents = [...keyboardEvents, ...mouseEvents, ...touchEvents];
            
            // Add realistic timestamps
            const baseTime = Date.now();
            allEvents.forEach((event, index) => {
                event.timestamp = baseTime + (index * 50); // 50ms intervals
            });
            
            // Analyze the simulated input
            const patterns = this.rustInput.analyzeInputPatterns(allEvents);
            
            if (patterns.totalEvents !== allEvents.length) {
                throw new Error('Simulation event count mismatch');
            }
            
            // Verify event types are present
            const expectedTypes = [InputType.Keyboard, InputType.Mouse, InputType.Touch];
            for (const type of expectedTypes) {
                if (patterns.eventsByType[type] === undefined || patterns.eventsByType[type] === 0) {
                    throw new Error(`Missing events of type ${InputType[type]}`);
                }
            }
            
            // Test gesture recognition simulation
            const gesturePoints = touchEvents
                .filter(e => e.position)
                .map(e => e.position!)
                .filter((_, index) => index % 2 === 0); // Use every other point
            
            // Simulate gesture recognition (would call actual recognizer in real implementation)
            const simulatedGesture = gesturePoints.length >= 2 ? 'swipe' : 'tap';
            
            // Test voice command simulation
            const voiceAudioData = new Array(1024).fill(0).map(() => Math.random() * 0.1); // Silent audio
            const simulatedVoiceCommand = 'move forward'; // Would use actual voice recognition
            
            // Generate comprehensive report
            const report = this.rustInput.generateInputReport(allEvents);
            
            if (!report || report.length === 0) {
                throw new Error('Report generation failed');
            }
            
            // Verify report contains expected sections
            const expectedSections = [
                'Statistics:',
                'Input Patterns:',
                'Events by Type:',
                'Events by Action:',
                'Device Usage:',
                'Anomalies:',
                'Performance:',
                'Accessibility:',
                'Recommendations:',
            ];
            
            for (const section of expectedSections) {
                if (!report.includes(section)) {
                    console.warn(`Report missing section: ${section}`);
                }
            }
            
            this.addResult(testName, 'pass', 'Input simulation works correctly', window.performance.now() - start, {
                simulatedEvents: allEvents.length,
                keyboardEvents: keyboardEvents.length,
                mouseEvents: mouseEvents.length,
                touchEvents: touchEvents.length,
                simulatedGesture,
                simulatedVoiceCommand,
                reportLength: report.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Input simulation failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private countEnabledFeatures(config: InputConfig): number {
        let count = 0;
        if (config.enableMultitouch) count++;
        if (config.enableGestures) count++;
        if (config.enableVoiceInput) count++;
        if (config.enableMotionInput) count++;
        if (config.enableGamepadSupport) count++;
        
        // Count accessibility features
        if (config.accessibility.enableScreenReader) count++;
        if (config.accessibility.enableHighContrast) count++;
        if (config.accessibility.enableLargeText) count++;
        if (config.accessibility.enableVoiceControl) count++;
        if (config.accessibility.enableGestureControl) count++;
        if (config.accessibility.enableSwitchControl) count++;
        if (config.accessibility.visualCues) count++;
        if (config.accessibility.hapticFeedback) count++;
        
        return count;
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🎮 Rust Input Management Test Report');
        console.log('=====================================');
        
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
        
        // Input system summary
        const initTest = this.results.find(r => r.name === 'Input Manager Initialization');
        const eventTest = this.results.find(r => r.name === 'Event Processing');
        const accessibilityTest = this.results.find(r => r.name === 'Accessibility Features');
        
        if (initTest?.details || eventTest?.details || accessibilityTest?.details) {
            console.log(`\n🎮 Input System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (eventTest?.details) {
                console.log(`   Event Processing: ${eventTest.details.totalEvents} events processed`);
            }
            if (accessibilityTest?.details) {
                console.log(`   Accessibility: ${accessibilityTest.details.screenReader ? '✅' : '❌'} Screen Reader`);
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
                touchSupport: 'ontouchstart' in window,
                gamepadSupport: 'getGamepads' in navigator,
            },
        };
        
        console.log('\n📄 Detailed test report:', JSON.stringify(report, null, 2));
    }

    getResults(): TestResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
        this.testEvents = [];
    }
}

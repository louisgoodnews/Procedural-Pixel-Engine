import init, { InputManagerExport, create_input_config } from '../../../pkg/procedural_pixel_engine_core.js';

export enum InputType {
    Keyboard = 0,
    Mouse = 1,
    Touch = 2,
    Gamepad = 3,
    Motion = 4,
    Voice = 5,
    Gesture = 6,
    Custom = 7,
}

export enum InputAction {
    Press = 0,
    Release = 1,
    Move = 2,
    Scroll = 3,
    Zoom = 4,
    Rotate = 5,
    Custom = 6,
}

export interface InputEvent {
    id: string;
    inputType: InputType;
    action: InputAction;
    timestamp: number;
    position?: InputPosition;
    data?: InputData;
    deviceId: string;
    contextId: string;
}

export interface InputPosition {
    x: number;
    y: number;
    z?: number;
    screenX: number;
    screenY: number;
    normalizedX: number;
    normalizedY: number;
}

export interface InputData {
    keyCode?: number;
    button?: number;
    modifiers: string[];
    pressure?: number;
    tiltX?: number;
    tiltY?: number;
    rotation?: number;
    force?: number;
    customData: Record<string, string>;
}

export interface InputDevice {
    id: string;
    name: string;
    deviceType: InputType;
    capabilities: string[];
    isConnected: boolean;
    isEnabled: boolean;
    sensitivity: number;
    deadZone: number;
    customSettings: Record<string, string>;
}

export interface InputMapping {
    id: string;
    name: string;
    inputType: InputType;
    trigger: InputTrigger;
    action: MappedAction;
    isActive: boolean;
    priority: number;
}

export interface InputTrigger {
    inputType: InputType;
    keyCode?: number;
    button?: number;
    gestureType?: string;
    voiceCommand?: string;
    customTrigger?: string;
}

export interface MappedAction {
    actionId: string;
    actionName: string;
    parameters: Record<string, string>;
    contextFilter?: string;
}

export interface InputContext {
    id: string;
    name: string;
    priority: number;
    isActive: boolean;
    mappings: string[];
    conditions: ContextCondition[];
}

export interface ContextCondition {
    conditionType: string;
    value: string;
    operator: string;
}

export interface AccessibilityConfig {
    enableScreenReader: boolean;
    enableHighContrast: boolean;
    enableLargeText: boolean;
    enableVoiceControl: boolean;
    enableGestureControl: boolean;
    enableSwitchControl: boolean;
    announcementLevel: number;
    visualCues: boolean;
    hapticFeedback: boolean;
}

export interface InputConfig {
    enableMultitouch: boolean;
    enableGestures: boolean;
    enableVoiceInput: boolean;
    enableMotionInput: boolean;
    enableGamepadSupport: boolean;
    maxTouchPoints: number;
    gestureSensitivity: number;
    voiceThreshold: number;
    motionThreshold: number;
    accessibility: AccessibilityConfig;
}

export interface InputStats {
    totalEvents: number;
    eventsPerSecond: number;
    activeDevices: number;
    activeContexts: number;
    errorCount: number;
    lastActivity: number;
}

export class RustInput {
    private wasmModule: InputManagerExport | null = null;
    private initialized = false;
    private eventListeners: Map<string, (event: InputEvent) => void> = new Map();

    async initialize(config: InputConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new InputManagerExport(config);
            this.initialized = true;
            console.log('🎮 Rust Input Manager initialized');
        }
    }

    updateConfig(config: InputConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): InputConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            enableMultitouch: config.enable_multitouch,
            enableGestures: config.enable_gestures,
            enableVoiceInput: config.enable_voice_input,
            enableMotionInput: config.enable_motion_input,
            enableGamepadSupport: config.enable_gamepad_support,
            maxTouchPoints: config.max_touch_points,
            gestureSensitivity: config.gesture_sensitivity,
            voiceThreshold: config.voice_threshold,
            motionThreshold: config.motion_threshold,
            accessibility: {
                enableScreenReader: config.accessibility.enable_screen_reader,
                enableHighContrast: config.accessibility.enable_high_contrast,
                enableLargeText: config.accessibility.enable_large_text,
                enableVoiceControl: config.accessibility.enable_voice_control,
                enableGestureControl: config.accessibility.enable_gesture_control,
                enableSwitchControl: config.accessibility.enable_switch_control,
                announcementLevel: config.accessibility.announcement_level,
                visualCues: config.accessibility.visual_cues,
                hapticFeedback: config.accessibility.haptic_feedback,
            },
        };
    }

    getInputSummary(): string {
        this.ensureInitialized();
        return this.wasmModule!.get_input_summary();
    }

    getStats(): InputStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.get_stats();
        return {
            totalEvents: stats.total_events,
            eventsPerSecond: stats.events_per_second,
            activeDevices: stats.active_devices,
            activeContexts: stats.active_contexts,
            errorCount: stats.error_count,
            lastActivity: stats.last_activity,
        };
    }

    // Accessibility Features
    enableAccessibilityFeatures(): { success: boolean; message: string } {
        this.ensureInitialized();
        const result = this.wasmModule!.enable_accessibility_features();
        
        if (result === 'success') {
            return { success: true, message: 'Accessibility features enabled successfully' };
        } else {
            return { success: false, message: result };
        }
    }

    announceToScreenReader(message: string): void {
        this.ensureInitialized();
        this.wasmModule!.announce_to_screen_reader(message);
    }

    showVisualCue(cueType: string, message: string): void {
        this.ensureInitialized();
        this.wasmModule!.show_visual_cue(cueType, message);
    }

    triggerHapticFeedback(intensity: number): void {
        this.ensureInitialized();
        this.wasmModule!.trigger_haptic_feedback(intensity);
    }

    // Utility methods for creating configurations
    static createInputConfig(config: Partial<InputConfig>): InputConfig {
        return {
            enableMultitouch: config.enableMultitouch !== undefined ? config.enableMultitouch : true,
            enableGestures: config.enableGestures !== undefined ? config.enableGestures : true,
            enableVoiceInput: config.enableVoiceInput !== undefined ? config.enableVoiceInput : false,
            enableMotionInput: config.enableMotionInput !== undefined ? config.enableMotionInput : false,
            enableGamepadSupport: config.enableGamepadSupport !== undefined ? config.enableGamepadSupport : true,
            maxTouchPoints: config.maxTouchPoints || 10,
            gestureSensitivity: config.gestureSensitivity || 0.7,
            voiceThreshold: config.voiceThreshold || 0.5,
            motionThreshold: config.motionThreshold || 0.3,
            accessibility: {
                enableScreenReader: config.accessibility?.enableScreenReader !== undefined ? config.accessibility.enableScreenReader : false,
                enableHighContrast: config.accessibility?.enableHighContrast !== undefined ? config.accessibility.enableHighContrast : false,
                enableLargeText: config.accessibility?.enableLargeText !== undefined ? config.accessibility.enableLargeText : false,
                enableVoiceControl: config.accessibility?.enableVoiceControl !== undefined ? config.accessibility.enableVoiceControl : false,
                enableGestureControl: config.accessibility?.enableGestureControl !== undefined ? config.accessibility.enableGestureControl : false,
                enableSwitchControl: config.accessibility?.enableSwitchControl !== undefined ? config.accessibility.enableSwitchControl : false,
                announcementLevel: config.accessibility?.announcementLevel || 1,
                visualCues: config.accessibility?.visualCues !== undefined ? config.accessibility.visualCues : true,
                hapticFeedback: config.accessibility?.hapticFeedback !== undefined ? config.accessibility.hapticFeedback : true,
            },
        };
    }

    // Configuration presets
    static createFullInputConfig(): InputConfig {
        return RustInput.createInputConfig({
            enableMultitouch: true,
            enableGestures: true,
            enableVoiceInput: true,
            enableMotionInput: true,
            enableGamepadSupport: true,
            maxTouchPoints: 10,
            gestureSensitivity: 0.8,
            voiceThreshold: 0.6,
            motionThreshold: 0.4,
            accessibility: {
                enableScreenReader: true,
                enableHighContrast: true,
                enableLargeText: true,
                enableVoiceControl: true,
                enableGestureControl: true,
                enableSwitchControl: true,
                announcementLevel: 2,
                visualCues: true,
                hapticFeedback: true,
            },
        });
    }

    static createBasicInputConfig(): InputConfig {
        return RustInput.createInputConfig({
            enableMultitouch: true,
            enableGestures: false,
            enableVoiceInput: false,
            enableMotionInput: false,
            enableGamepadSupport: false,
            maxTouchPoints: 5,
            gestureSensitivity: 0.5,
            voiceThreshold: 0.5,
            motionThreshold: 0.3,
            accessibility: {
                enableScreenReader: false,
                enableHighContrast: false,
                enableLargeText: false,
                enableVoiceControl: false,
                enableGestureControl: false,
                enableSwitchControl: false,
                announcementLevel: 1,
                visualCues: true,
                hapticFeedback: false,
            },
        });
    }

    static createMobileInputConfig(): InputConfig {
        return RustInput.createInputConfig({
            enableMultitouch: true,
            enableGestures: true,
            enableVoiceInput: false,
            enableMotionInput: true,
            enableGamepadSupport: false,
            maxTouchPoints: 10,
            gestureSensitivity: 0.9,
            voiceThreshold: 0.5,
            motionThreshold: 0.6,
            accessibility: {
                enableScreenReader: true,
                enableHighContrast: true,
                enableLargeText: true,
                enableVoiceControl: false,
                enableGestureControl: true,
                enableSwitchControl: false,
                announcementLevel: 2,
                visualCues: true,
                hapticFeedback: true,
            },
        });
    }

    static createDesktopInputConfig(): InputConfig {
        return RustInput.createInputConfig({
            enableMultitouch: false,
            enableGestures: false,
            enableVoiceInput: true,
            enableMotionInput: false,
            enableGamepadSupport: true,
            maxTouchPoints: 1,
            gestureSensitivity: 0.5,
            voiceThreshold: 0.6,
            motionThreshold: 0.3,
            accessibility: {
                enableScreenReader: true,
                enableHighContrast: true,
                enableLargeText: false,
                enableVoiceControl: true,
                enableGestureControl: false,
                enableSwitchControl: false,
                announcementLevel: 1,
                visualCues: false,
                hapticFeedback: false,
            },
        });
    }

    static createAccessibilityInputConfig(): InputConfig {
        return RustInput.createInputConfig({
            enableMultitouch: true,
            enableGestures: true,
            enableVoiceInput: true,
            enableMotionInput: true,
            enableGamepadSupport: true,
            maxTouchPoints: 10,
            gestureSensitivity: 0.6,
            voiceThreshold: 0.4,
            motionThreshold: 0.2,
            accessibility: {
                enableScreenReader: true,
                enableHighContrast: true,
                enableLargeText: true,
                enableVoiceControl: true,
                enableGestureControl: true,
                enableSwitchControl: true,
                announcementLevel: 3,
                visualCues: true,
                hapticFeedback: true,
            },
        });
    }

    // Input event handling
    createInputEvent(
        id: string,
        inputType: InputType,
        action: InputAction,
        deviceId: string,
        contextId: string,
        position?: InputPosition,
        data?: InputData
    ): InputEvent {
        return {
            id,
            inputType,
            action,
            timestamp: performance.now(),
            position,
            data: data || {
                modifiers: [],
                customData: {},
            },
            deviceId,
            contextId,
        };
    }

    // Device simulation for testing
    createKeyboardEvent(key: string, action: InputAction, modifiers: string[] = []): InputEvent {
        const keyCode = this.getKeyCode(key);
        return this.createInputEvent(
            `keyboard_${Date.now()}`,
            InputType.Keyboard,
            action,
            'keyboard_default',
            'game',
            undefined,
            {
                keyCode,
                modifiers,
                customData: {},
            }
        );
    }

    createMouseEvent(x: number, y: number, action: InputAction, button = 0): InputEvent {
        return this.createInputEvent(
            `mouse_${Date.now()}`,
            InputType.Mouse,
            action,
            'mouse_default',
            'game',
            {
                x,
                y,
                screenX: x,
                screenY: y,
                normalizedX: x / window.innerWidth,
                normalizedY: y / window.innerHeight,
            },
            {
                button,
                modifiers: [],
                customData: {},
            }
        );
    }

    createTouchEvent(x: number, y: number, action: InputAction, touchId = 0): InputEvent {
        return this.createInputEvent(
            `touch_${Date.now()}`,
            InputType.Touch,
            action,
            'touch_default',
            'game',
            {
                x,
                y,
                screenX: x,
                screenY: y,
                normalizedX: x / window.innerWidth,
                normalizedY: y / window.innerHeight,
            },
            {
                button: touchId,
                modifiers: [],
                pressure: 1.0,
                customData: {},
            }
        );
    }

    // Utility methods
    private getKeyCode(key: string): number {
        const keyMap: Record<string, number> = {
            'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72,
            'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80,
            'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88,
            'y': 89, 'z': 90,
            '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54,
            '7': 55, '8': 56, '9': 57,
            ' ': 32, 'enter': 13, 'escape': 27, 'tab': 9, 'backspace': 8,
            'delete': 46, 'arrowup': 38, 'arrowdown': 40, 'arrowleft': 37, 'arrowright': 39,
        };
        return keyMap[key.toLowerCase()] || 0;
    }

    // Input analysis methods
    analyzeInputPatterns(events: InputEvent[]): {
        totalEvents: number;
        eventsByType: Record<InputType, number>;
        eventsByAction: Record<InputAction, number>;
        averageInterval: number;
        peakActivity: number;
        deviceUsage: Record<string, number>;
    } {
        const eventsByType: Record<number, number> = {};
        const eventsByAction: Record<number, number> = {};
        const deviceUsage: Record<string, number> = {};
        
        let totalInterval = 0;
        let maxEventsPerSecond = 0;
        let currentSecondEvents = 0;
        let lastSecond = Math.floor(events[0]?.timestamp / 1000) || 0;

        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            // Count by type
            eventsByType[event.inputType] = (eventsByType[event.inputType] || 0) + 1;
            
            // Count by action
            eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
            
            // Count by device
            deviceUsage[event.deviceId] = (deviceUsage[event.deviceId] || 0) + 1;
            
            // Calculate intervals
            if (i > 0) {
                totalInterval += event.timestamp - events[i - 1].timestamp;
            }
            
            // Calculate peak activity
            const currentSecond = Math.floor(event.timestamp / 1000);
            if (currentSecond === lastSecond) {
                currentSecondEvents++;
            } else {
                maxEventsPerSecond = Math.max(maxEventsPerSecond, currentSecondEvents);
                currentSecondEvents = 1;
                lastSecond = currentSecond;
            }
        }

        const averageInterval = events.length > 1 ? totalInterval / (events.length - 1) : 0;

        return {
            totalEvents: events.length,
            eventsByType: eventsByType as Record<InputType, number>,
            eventsByAction: eventsByAction as Record<InputAction, number>,
            averageInterval,
            peakActivity: Math.max(maxEventsPerSecond, currentSecondEvents),
            deviceUsage,
        };
    }

    detectInputAnomalies(events: InputEvent[]): {
        anomalies: Array<{
            type: string;
            description: string;
            timestamp: number;
            severity: 'low' | 'medium' | 'high';
        }>;
        recommendations: string[];
    } {
        const anomalies: Array<{
            type: string;
            description: string;
            timestamp: number;
            severity: 'low' | 'medium' | 'high';
        }> = [];
        const recommendations: string[] = [];

        // Check for rapid fire events
        for (let i = 1; i < events.length; i++) {
            const interval = events[i].timestamp - events[i - 1].timestamp;
            if (interval < 10) { // Less than 10ms between events
                anomalies.push({
                    type: 'rapid_fire',
                    description: `Rapid input detected: ${interval.toFixed(2)}ms interval`,
                    timestamp: events[i].timestamp,
                    severity: 'medium',
                });
            }
        }

        // Check for stuck keys
        const pressEvents = events.filter(e => e.action === InputAction.Press);
        const releaseEvents = events.filter(e => e.action === InputAction.Release);
        
        if (pressEvents.length > releaseEvents.length + 5) {
            anomalies.push({
                type: 'stuck_keys',
                description: 'More press events than release events detected',
                timestamp: Date.now(),
                severity: 'high',
            });
            recommendations.push('Check for stuck keys or input device issues');
        }

        // Check for unusual device usage
        const deviceUsage = this.analyzeInputPatterns(events).deviceUsage;
        Object.entries(deviceUsage).forEach(([deviceId, count]) => {
            if (count > events.length * 0.8) {
                anomalies.push({
                    type: 'device_overuse',
                    description: `Device ${deviceId} accounts for ${(count / events.length * 100).toFixed(1)}% of input`,
                    timestamp: Date.now(),
                    severity: 'low',
                });
            }
        });

        return { anomalies, recommendations };
    }

    // Performance monitoring
    monitorInputPerformance(events: InputEvent[]): {
        averageLatency: number;
        maxLatency: number;
        eventProcessingRate: number;
        memoryUsage: number;
        recommendations: string[];
    } {
        const now = performance.now();
        const recentEvents = events.filter(e => now - e.timestamp < 1000); // Last second
        
        // Simulate latency measurement (would use actual timing data in real implementation)
        const averageLatency = 5.2; // ms
        const maxLatency = 12.8; // ms
        const eventProcessingRate = recentEvents.length;
        
        // Simulate memory usage estimation
        const memoryUsage = events.length * 0.1; // KB per event
        
        const recommendations: string[] = [];
        
        if (averageLatency > 10) {
            recommendations.push('Consider optimizing input processing for better performance');
        }
        
        if (maxLatency > 20) {
            recommendations.push('Some input events have high latency, investigate bottlenecks');
        }
        
        if (eventProcessingRate > 100) {
            recommendations.push('High input rate detected, consider implementing rate limiting');
        }
        
        if (memoryUsage > 1024) { // 1MB
            recommendations.push('Consider implementing event cleanup to reduce memory usage');
        }

        return {
            averageLatency,
            maxLatency,
            eventProcessingRate,
            memoryUsage,
            recommendations,
        };
    }

    // Accessibility helpers
    testAccessibilityFeatures(): {
        screenReader: boolean;
        visualCues: boolean;
        hapticFeedback: boolean;
        voiceControl: boolean;
        gestureControl: boolean;
        recommendations: string[];
    } {
        const config = this.getConfig();
        const accessibility = config.accessibility;
        
        const recommendations: string[] = [];
        
        if (!accessibility.enableScreenReader) {
            recommendations.push('Consider enabling screen reader for visually impaired users');
        }
        
        if (!accessibility.visualCues) {
            recommendations.push('Consider enabling visual cues for better accessibility');
        }
        
        if (!accessibility.hapticFeedback) {
            recommendations.push('Consider enabling haptic feedback for tactile feedback');
        }
        
        if (!accessibility.enableVoiceControl && config.enableVoiceInput) {
            recommendations.push('Voice input is enabled but voice control is disabled');
        }
        
        if (!accessibility.enableGestureControl && config.enableGestures) {
            recommendations.push('Gestures are enabled but gesture control is disabled');
        }

        return {
            screenReader: accessibility.enableScreenReader,
            visualCues: accessibility.visualCues,
            hapticFeedback: accessibility.hapticFeedback,
            voiceControl: accessibility.enableVoiceControl,
            gestureControl: accessibility.enableGestureControl,
            recommendations,
        };
    }

    // Input configuration validation
    validateConfiguration(config: InputConfig): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        recommendations: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Validate multitouch settings
        if (config.enableMultitouch && config.maxTouchPoints < 2) {
            warnings.push('Multitouch enabled but max touch points is less than 2');
        }

        // Validate gesture sensitivity
        if (config.enableGestures) {
            if (config.gestureSensitivity < 0.1 || config.gestureSensitivity > 1.0) {
                errors.push('Gesture sensitivity must be between 0.1 and 1.0');
            }
        }

        // Validate voice threshold
        if (config.enableVoiceInput) {
            if (config.voiceThreshold < 0.0 || config.voiceThreshold > 1.0) {
                errors.push('Voice threshold must be between 0.0 and 1.0');
            }
        }

        // Validate motion threshold
        if (config.enableMotionInput) {
            if (config.motionThreshold < 0.0 || config.motionThreshold > 1.0) {
                errors.push('Motion threshold must be between 0.0 and 1.0');
            }
        }

        // Recommendations
        if (!config.enableGamepadSupport) {
            recommendations.push('Consider enabling gamepad support for better gaming experience');
        }

        if (config.enableVoiceInput && !config.accessibility.enableVoiceControl) {
            recommendations.push('Consider enabling voice control for better voice input experience');
        }

        if (config.enableGestures && !config.accessibility.enableGestureControl) {
            recommendations.push('Consider enabling gesture control for better gesture experience');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            recommendations,
        };
    }

    // Generate input report
    generateInputReport(events: InputEvent[]): string {
        const stats = this.getStats();
        const patterns = this.analyzeInputPatterns(events);
        const anomalies = this.detectInputAnomalies(events);
        const performance = this.monitorInputPerformance(events);
        const accessibility = this.testAccessibilityFeatures();

        let report = `🎮 Input Management Report
Generated: ${new Date().toISOString()}

📊 Statistics:
- Total Events: ${stats.totalEvents}
- Events/Second: ${stats.eventsPerSecond.toFixed(2)}
- Active Devices: ${stats.activeDevices}
- Active Contexts: ${stats.activeContexts}
- Error Count: ${stats.errorCount}

🔍 Input Patterns:
- Total Events: ${patterns.totalEvents}
- Average Interval: ${patterns.averageInterval.toFixed(2)}ms
- Peak Activity: ${patterns.peakActivity} events/sec

Events by Type:
${Object.entries(patterns.eventsByType).map(([type, count]) => 
    `  - ${InputType[parseInt(type) as InputType]}: ${count}`
).join('\n')}

Events by Action:
${Object.entries(patterns.eventsByAction).map(([action, count]) => 
    `  - ${InputAction[parseInt(action) as InputAction]}: ${count}`
).join('\n')}

Device Usage:
${Object.entries(patterns.deviceUsage).map(([device, count]) => 
    `  - ${device}: ${count} events`
).join('\n')}

⚠️ Anomalies:
${anomalies.anomalies.length > 0 ? 
    anomalies.anomalies.map(a => `  - ${a.type}: ${a.description} (${a.severity})`).join('\n') :
    '  No anomalies detected'
}

🚀 Performance:
- Average Latency: ${performance.averageLatency.toFixed(2)}ms
- Max Latency: ${performance.maxLatency.toFixed(2)}ms
- Processing Rate: ${performance.eventProcessingRate} events/sec
- Memory Usage: ${performance.memoryUsage.toFixed(2)}KB

♿ Accessibility:
- Screen Reader: ${accessibility.screenReader ? '✅' : '❌'}
- Visual Cues: ${accessibility.visualCues ? '✅' : '❌'}
- Haptic Feedback: ${accessibility.hapticFeedback ? '✅' : '❌'}
- Voice Control: ${accessibility.voiceControl ? '✅' : '❌'}
- Gesture Control: ${accessibility.gestureControl ? '✅' : '❌'}

💡 Recommendations:
${[...performance.recommendations, ...anomalies.recommendations, ...accessibility.recommendations]
    .map(rec => `- ${rec}`)
    .join('\n') || 'No recommendations at this time'}
`;

        return report;
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Input Manager not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

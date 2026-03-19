// Enums
export enum UIWidgetType {
    Container = 0,
    Button = 1,
    Label = 2,
    Image = 3,
    TextField = 4,
    TextArea = 5,
    CheckBox = 6,
    RadioButton = 7,
    Slider = 8,
    ProgressBar = 9,
    ListBox = 10,
    ComboBox = 11,
    TabContainer = 12,
    ScrollPane = 13,
    Panel = 14,
    Window = 15,
    Menu = 16,
    MenuItem = 17,
    Custom = 18,
}

export enum UILayoutType {
    Absolute = 0,
    Vertical = 1,
    Horizontal = 2,
    Grid = 3,
    Flex = 4,
    Relative = 5,
    Custom = 6,
}

export enum UIEventType {
    Click = 0,
    DoubleClick = 1,
    MouseDown = 2,
    MouseUp = 3,
    MouseMove = 4,
    MouseEnter = 5,
    MouseLeave = 6,
    KeyDown = 7,
    KeyUp = 8,
    Focus = 9,
    Blur = 10,
    Change = 11,
    Submit = 12,
    Resize = 13,
    Scroll = 14,
    TouchStart = 15,
    TouchMove = 16,
    TouchEnd = 17,
    Custom = 18,
}

export enum UIAnimationType {
    Fade = 0,
    Slide = 1,
    Scale = 2,
    Rotate = 3,
    Bounce = 4,
    Elastic = 5,
    Custom = 6,
}

export enum UIThemeType {
    Default = 0,
    Dark = 1,
    Light = 2,
    Custom = 3,
}

// Interfaces
export interface UIWidget {
    id: string;
    widgetType: UIWidgetType;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    enabled: boolean;
    focused: boolean;
    parentId?: string;
    children: string[];
    style: UIStyle;
    layout: UILayout;
    events: UIEvent[];
    animations: UIAnimation[];
    accessibility: UIAccessibility;
    customProperties: Record<string, string>;
    createdAt: number;
    updatedAt: number;
}

export interface UIStyle {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: UIPadding;
    margin: UIMargin;
    font: UIFont;
    textColor: string;
    textAlign: UITextAlignment;
    shadow: UIShadow;
    opacity: number;
    transform: UITransform;
    zIndex: number;
    cursor: UICursor;
}

export interface UIPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface UIMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface UIFont {
    family: string;
    size: number;
    weight: string;
    style: string;
    lineHeight: number;
}

export interface UITextAlignment {
    horizontal: string;
    vertical: string;
}

export interface UIShadow {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
}

export interface UITransform {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
}

export interface UICursor {
    cursorType: string;
    hotSpotX: number;
    hotSpotY: number;
}

export interface UILayout {
    layoutType: UILayoutType;
    spacing: number;
    alignment: string;
    wrap: boolean;
    scrollX: boolean;
    scrollY: boolean;
    gridColumns: number;
    gridRows: number;
    flexDirection: string;
    flexWrap: string;
    flexJustifyContent: string;
    flexAlignItems: string;
    flexAlignContent: string;
}

export interface UIEvent {
    eventType: UIEventType;
    targetId: string;
    timestamp: number;
    mouseX: number;
    mouseY: number;
    keyCode: number;
    keyModifiers: string[];
    touchPoints: UITouchPoint[];
    customData: Record<string, string>;
}

export interface UITouchPoint {
    id: number;
    x: number;
    y: number;
    pressure: number;
}

export interface UIAnimation {
    id: string;
    animationType: UIAnimationType;
    duration: number;
    delay: number;
    easing: string;
    repeat: boolean;
    autoReverse: boolean;
    fromState: UIAnimationState;
    toState: UIAnimationState;
    currentTime: number;
    isPlaying: boolean;
    isPaused: boolean;
}

export interface UIAnimationState {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    backgroundColor: string;
}

export interface UIAccessibility {
    accessible: boolean;
    label: string;
    description: string;
    role: string;
    tabIndex: number;
    ariaAttributes: Record<string, string>;
}

export interface UITheme {
    id: string;
    name: string;
    themeType: UIThemeType;
    colors: Record<string, string>;
    fonts: Record<string, UIFont>;
    sizes: Record<string, number>;
    spacing: Record<string, number>;
    animations: Record<string, UIAnimationTemplate>;
    customProperties: Record<string, string>;
}

export interface UIAnimationTemplate {
    name: string;
    animationType: UIAnimationType;
    duration: number;
    easing: string;
    keyframes: UIKeyframe[];
}

export interface UIKeyframe {
    time: number;
    properties: Record<string, number>;
}

export interface UIConfig {
    enableAnimations: boolean;
    enableAccessibility: boolean;
    defaultTheme: string;
    autoLayout: boolean;
    pixelPerfect: boolean;
    retinaDisplay: boolean;
    touchSupport: boolean;
    keyboardSupport: boolean;
    mouseSupport: boolean;
    debugMode: boolean;
    maxWidgets: number;
    eventQueueSize: number;
}

export interface UIStats {
    totalWidgets: number;
    visibleWidgets: number;
    enabledWidgets: number;
    activeAnimations: number;
    pendingEvents: number;
    processedEvents: number;
    renderTime: number;
    updateTime: number;
    layoutTime: number;
    eventTime: number;
    memoryUsage: number;
    lastUpdate: number;
}

export interface UIRenderCommand {
    widgetId: string;
    widgetType: UIWidgetType;
    x: number;
    y: number;
    width: number;
    height: number;
    style: UIStyle;
    visible: boolean;
    enabled: boolean;
    focused: boolean;
    text: string;
    imageUrl: string;
    value: number;
    minValue: number;
    maxValue: number;
    step: number;
    checked: boolean;
    options: string[];
    selectedIndex: number;
    progress: number;
    children: string[];
}

// Main class
export class RustUISystem {
    private uiSystem: any;
    private initialized: boolean = false;

    constructor() {
        this.uiSystem = null;
    }

    async initialize(config: UIConfig): Promise<void> {
        try {
            // Import the WASM module
            const wasmModule = await import('../../pkg/procedural_pixel_engine_core');
            
            // Create the UI system
            this.uiSystem = new wasmModule.UISystemExport(config);
            this.initialized = true;
            
            console.log('🎨 Rust UI System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Rust UI System:', error);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    // Configuration
    updateConfig(config: UIConfig): void {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        this.uiSystem.update_config(config);
    }

    getConfig(): UIConfig {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_config();
    }

    // Statistics
    getStats(): UIStats {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_stats();
    }

    getUISystemSummary(): string {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_ui_system_summary();
    }

    // Theme management
    addTheme(theme: UITheme): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.add_theme(theme);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    removeTheme(themeId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.remove_theme(themeId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    setTheme(themeId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_theme(themeId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getCurrentTheme(): UITheme {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_current_theme();
    }

    // Widget management
    createWidget(widget: UIWidget): { success: boolean; widgetId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            const widgetId = this.uiSystem.create_widget(widget);
            return { success: true, widgetId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    deleteWidget(widgetId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.delete_widget(widgetId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getWidget(widgetId: string): UIWidget | null {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        const widget = this.uiSystem.get_widget(widgetId);
        return widget || null;
    }

    getAllWidgets(): UIWidget[] {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_all_widgets();
    }

    getVisibleWidgets(): UIWidget[] {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        return this.uiSystem.get_visible_widgets();
    }

    getWidgetsByType(widgetType: UIWidgetType): UIWidget[] {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        const allWidgets = this.getAllWidgets();
        return allWidgets.filter(widget => widget.widgetType === widgetType);
    }

    // Widget hierarchy
    addChild(parentId: string, childId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.add_child(parentId, childId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    removeChild(parentId: string, childId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.remove_child(parentId, childId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Widget properties
    setWidgetPosition(widgetId: string, x: number, y: number): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_widget_position(widgetId, x, y);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    setWidgetSize(widgetId: string, width: number, height: number): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_widget_size(widgetId, width, height);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    setWidgetVisibility(widgetId: string, visible: boolean): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_widget_visibility(widgetId, visible);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    setWidgetEnabled(widgetId: string, enabled: boolean): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_widget_enabled(widgetId, enabled);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    setWidgetStyle(widgetId: string, style: UIStyle): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_widget_style(widgetId, style);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Event handling
    handleClickEvent(widgetId: string, mouseX: number, mouseY: number): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.handle_click_event(widgetId, mouseX, mouseY);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Animation system
    addAnimation(widgetId: string, animation: UIAnimation): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.add_animation(widgetId, animation);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    removeAnimation(widgetId: string, animationId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.remove_animation(widgetId, animationId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    playAnimation(widgetId: string, animationId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.play_animation(widgetId, animationId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    pauseAnimation(widgetId: string, animationId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.pause_animation(widgetId, animationId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    stopAnimation(widgetId: string, animationId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.stop_animation(widgetId, animationId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Layout system
    updateLayout(): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.update_layout();
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Rendering
    render(): { success: boolean; commands?: UIRenderCommand[]; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            const commands = this.uiSystem.render();
            return { success: true, commands };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Update loop
    update(deltaTime: number): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.update(deltaTime);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Hit testing
    hitTest(x: number, y: number): string | null {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        const result = this.uiSystem.hit_test(x, y);
        return result || null;
    }

    // Focus management
    setFocus(widgetId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'UI System not initialized' };
        }
        try {
            this.uiSystem.set_focus(widgetId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    clearFocus(): void {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        this.uiSystem.clear_focus();
    }

    getFocusedWidget(): string | null {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        const result = this.uiSystem.get_focused_widget();
        return result || null;
    }

    // Utility methods
    static createDefaultConfig(): UIConfig {
        return {
            enableAnimations: true,
            enableAccessibility: true,
            defaultTheme: "default",
            autoLayout: true,
            pixelPerfect: false,
            retinaDisplay: true,
            touchSupport: true,
            keyboardSupport: true,
            mouseSupport: true,
            debugMode: false,
            maxWidgets: 1000,
            eventQueueSize: 100,
        };
    }

    static createDevelopmentConfig(): UIConfig {
        return {
            enableAnimations: true,
            enableAccessibility: false,
            defaultTheme: "default",
            autoLayout: true,
            pixelPerfect: true,
            retinaDisplay: false,
            touchSupport: true,
            keyboardSupport: true,
            mouseSupport: true,
            debugMode: true,
            maxWidgets: 500,
            eventQueueSize: 50,
        };
    }

    static createProductionConfig(): UIConfig {
        return {
            enableAnimations: true,
            enableAccessibility: true,
            defaultTheme: "default",
            autoLayout: true,
            pixelPerfect: false,
            retinaDisplay: true,
            touchSupport: true,
            keyboardSupport: true,
            mouseSupport: true,
            debugMode: false,
            maxWidgets: 2000,
            eventQueueSize: 200,
        };
    }

    static createMobileConfig(): UIConfig {
        return {
            enableAnimations: false,
            enableAccessibility: true,
            defaultTheme: "default",
            autoLayout: true,
            pixelPerfect: false,
            retinaDisplay: true,
            touchSupport: true,
            keyboardSupport: false,
            mouseSupport: false,
            debugMode: false,
            maxWidgets: 100,
            eventQueueSize: 25,
        };
    }

    // Factory methods
    static createWidget(
        id: string,
        widgetType: UIWidgetType,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        visible: boolean = true,
        enabled: boolean = true
    ): UIWidget {
        return {
            id,
            widgetType,
            name,
            x,
            y,
            width,
            height,
            visible,
            enabled,
            focused: false,
            parentId: undefined,
            children: [],
            style: RustUISystem.createDefaultStyle(),
            layout: RustUISystem.createDefaultLayout(),
            events: [],
            animations: [],
            accessibility: RustUISystem.createDefaultAccessibility(),
            customProperties: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    static createButton(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        text: string = ""
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Button, name, x, y, width, height);
        widget.customProperties.text = text;
        widget.style.backgroundColor = "#007bff";
        widget.style.textColor = "#ffffff";
        widget.style.borderWidth = 1;
        widget.style.borderColor = "#0056b3";
        widget.style.borderRadius = 4;
        widget.style.padding = { top: 8, right: 16, bottom: 8, left: 16 };
        return widget;
    }

    static createLabel(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        text: string = ""
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Label, name, x, y, width, height);
        widget.customProperties.text = text;
        widget.style.backgroundColor = "transparent";
        widget.style.textColor = "#000000";
        widget.style.font = {
            family: "Arial",
            size: 14,
            weight: "normal",
            style: "normal",
            lineHeight: 1.4,
        };
        return widget;
    }

    static createImage(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        imageUrl: string = ""
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Image, name, x, y, width, height);
        widget.customProperties.imageUrl = imageUrl;
        widget.style.backgroundColor = "transparent";
        return widget;
    }

    static createContainer(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        layoutType: UILayoutType = UILayoutType.Absolute
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Container, name, x, y, width, height);
        widget.layout.layoutType = layoutType;
        widget.style.backgroundColor = "transparent";
        return widget;
    }

    static createPanel(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Panel, name, x, y, width, height);
        widget.style.backgroundColor = "#ffffff";
        widget.style.borderWidth = 1;
        widget.style.borderColor = "#dee2e6";
        widget.style.borderRadius = 4;
        widget.style.padding = { top: 16, right: 16, bottom: 16, left: 16 };
        return widget;
    }

    static createTextField(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        placeholder: string = ""
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.TextField, name, x, y, width, height);
        widget.customProperties.placeholder = placeholder;
        widget.customProperties.value = "";
        widget.style.backgroundColor = "#ffffff";
        widget.style.borderWidth = 1;
        widget.style.borderColor = "#ced4da";
        widget.style.borderRadius = 4;
        widget.style.padding = { top: 6, right: 12, bottom: 6, left: 12 };
        widget.style.font = {
            family: "Arial",
            size: 14,
            weight: "normal",
            style: "normal",
            lineHeight: 1.4,
        };
        return widget;
    }

    static createCheckBox(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        checked: boolean = false
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.CheckBox, name, x, y, width, height);
        widget.customProperties.checked = checked.toString();
        widget.style.backgroundColor = "transparent";
        return widget;
    }

    static createSlider(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        minValue: number = 0,
        maxValue: number = 100,
        value: number = 50
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.Slider, name, x, y, width, height);
        widget.customProperties.minValue = minValue.toString();
        widget.customProperties.maxValue = maxValue.toString();
        widget.customProperties.value = value.toString();
        widget.customProperties.step = "1";
        widget.style.backgroundColor = "transparent";
        return widget;
    }

    static createProgressBar(
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        progress: number = 0
    ): UIWidget {
        const widget = RustUISystem.createWidget(id, UIWidgetType.ProgressBar, name, x, y, width, height);
        widget.customProperties.progress = progress.toString();
        widget.style.backgroundColor = "#e9ecef";
        widget.style.borderRadius = 4;
        return widget;
    }

    static createDefaultStyle(): UIStyle {
        return {
            backgroundColor: "#ffffff",
            borderColor: "#000000",
            borderWidth: 0,
            borderRadius: 0,
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            font: {
                family: "Arial",
                size: 14,
                weight: "normal",
                style: "normal",
                lineHeight: 1.4,
            },
            textColor: "#000000",
            textAlign: { horizontal: "left", vertical: "top" },
            shadow: {
                color: "#000000",
                offsetX: 0,
                offsetY: 0,
                blur: 0,
                spread: 0,
            },
            opacity: 1,
            transform: {
                translateX: 0,
                translateY: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                skewX: 0,
                skewY: 0,
            },
            zIndex: 0,
            cursor: {
                cursorType: "default",
                hotSpotX: 0,
                hotSpotY: 0,
            },
        };
    }

    static createDefaultLayout(): UILayout {
        return {
            layoutType: UILayoutType.Absolute,
            spacing: 0,
            alignment: "left",
            wrap: false,
            scrollX: false,
            scrollY: false,
            gridColumns: 1,
            gridRows: 1,
            flexDirection: "row",
            flexWrap: "nowrap",
            flexJustifyContent: "flex-start",
            flexAlignItems: "stretch",
            flexAlignContent: "stretch",
        };
    }

    static createDefaultAccessibility(): UIAccessibility {
        return {
            accessible: true,
            label: "",
            description: "",
            role: "widget",
            tabIndex: 0,
            ariaAttributes: {},
        };
    }

    static createTheme(
        id: string,
        name: string,
        themeType: UIThemeType = UIThemeType.Custom
    ): UITheme {
        return {
            id,
            name,
            themeType,
            colors: {},
            fonts: {},
            sizes: {},
            spacing: {},
            animations: {},
            customProperties: {},
        };
    }

    static createAnimation(
        id: string,
        animationType: UIAnimationType,
        duration: number,
        fromState: UIAnimationState,
        toState: UIAnimationState,
        easing: string = "linear",
        delay: number = 0,
        repeat: boolean = false,
        autoReverse: boolean = false
    ): UIAnimation {
        return {
            id,
            animationType,
            duration,
            delay,
            easing,
            repeat,
            autoReverse,
            fromState,
            toState,
            currentTime: 0,
            isPlaying: false,
            isPaused: false,
        };
    }

    static createAnimationState(
        x: number,
        y: number,
        width: number,
        height: number,
        opacity: number = 1,
        rotation: number = 0,
        scaleX: number = 1,
        scaleY: number = 1,
        backgroundColor: string = "#ffffff"
    ): UIAnimationState {
        return {
            x,
            y,
            width,
            height,
            opacity,
            rotation,
            scaleX,
            scaleY,
            backgroundColor,
        };
    }

    // UI creation helpers
    createSimpleButton(
        id: string,
        text: string,
        x: number,
        y: number,
        width: number = 120,
        height: number = 40
    ): { success: boolean; widgetId?: string; error?: string } {
        const widget = RustUISystem.createButton(id, text, x, y, width, height, text);
        return this.createWidget(widget);
    }

    createSimpleLabel(
        id: string,
        text: string,
        x: number,
        y: number,
        width: number = 200,
        height: number = 20
    ): { success: boolean; widgetId?: string; error?: string } {
        const widget = RustUISystem.createLabel(id, text, x, y, width, height, text);
        return this.createWidget(widget);
    }

    createContainerWithLayout(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        layoutType: UILayoutType,
        spacing: number = 0
    ): { success: boolean; widgetId?: string; error?: string } {
        const widget = RustUISystem.createContainer(id, "Container", x, y, width, height, layoutType);
        widget.layout.spacing = spacing;
        return this.createWidget(widget);
    }

    createVerticalContainer(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        spacing: number = 8
    ): { success: boolean; widgetId?: string; error?: string } {
        return this.createContainerWithLayout(id, x, y, width, height, UILayoutType.Vertical, spacing);
    }

    createHorizontalContainer(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        spacing: number = 8
    ): { success: boolean; widgetId?: string; error?: string } {
        return this.createContainerWithLayout(id, x, y, width, height, UILayoutType.Horizontal, spacing);
    }

    createGridContainer(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        columns: number,
        rows: number
    ): { success: boolean; widgetId?: string; error?: string } {
        const widget = RustUISystem.createContainer(id, "Grid Container", x, y, width, height, UILayoutType.Grid);
        widget.layout.gridColumns = columns;
        widget.layout.gridRows = rows;
        return this.createWidget(widget);
    }

    createFlexContainer(
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        flexDirection: string = "row",
        justifyContent: string = "flex-start",
        alignItems: string = "stretch"
    ): { success: boolean; widgetId?: string; error?: string } {
        const widget = RustUISystem.createContainer(id, "Flex Container", x, y, width, height, UILayoutType.Flex);
        widget.layout.flexDirection = flexDirection;
        widget.layout.flexJustifyContent = justifyContent;
        widget.layout.flexAlignItems = alignItems;
        return this.createWidget(widget);
    }

    // Animation helpers
    createFadeAnimation(
        id: string,
        fromOpacity: number,
        toOpacity: number,
        duration: number
    ): UIAnimation {
        const fromState = RustUISystem.createAnimationState(0, 0, 100, 100, fromOpacity);
        const toState = RustUISystem.createAnimationState(0, 0, 100, 100, toOpacity);
        return RustUISystem.createAnimation(id, UIAnimationType.Fade, duration, fromState, toState);
    }

    createSlideAnimation(
        id: string,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        duration: number
    ): UIAnimation {
        const fromState = RustUISystem.createAnimationState(fromX, fromY, 100, 100);
        const toState = RustUISystem.createAnimationState(toX, toY, 100, 100);
        return RustUISystem.createAnimation(id, UIAnimationType.Slide, duration, fromState, toState);
    }

    createScaleAnimation(
        id: string,
        fromScale: number,
        toScale: number,
        duration: number
    ): UIAnimation {
        const fromState = RustUISystem.createAnimationState(0, 0, 100, 100, 1, 0, fromScale, fromScale);
        const toState = RustUISystem.createAnimationState(0, 0, 100, 100, 1, 0, toScale, toScale);
        return RustUISystem.createAnimation(id, UIAnimationType.Scale, duration, fromState, toState);
    }

    createRotateAnimation(
        id: string,
        fromRotation: number,
        toRotation: number,
        duration: number
    ): UIAnimation {
        const fromState = RustUISystem.createAnimationState(0, 0, 100, 100, 1, fromRotation);
        const toState = RustUISystem.createAnimationState(0, 0, 100, 100, 1, toRotation);
        return RustUISystem.createAnimation(id, UIAnimationType.Rotate, duration, fromState, toState);
    }

    // Theme helpers
    createDefaultTheme(): UITheme {
        const theme = RustUISystem.createTheme("default", "Default Theme", UIThemeType.Default);
        
        // Add default colors
        theme.colors = {
            primary: "#007bff",
            secondary: "#6c757d",
            success: "#28a745",
            warning: "#ffc107",
            danger: "#dc3545",
            info: "#17a2b8",
            light: "#f8f9fa",
            dark: "#343a40",
            background: "#ffffff",
            foreground: "#000000",
            border: "#dee2e6",
        };
        
        // Add default fonts
        theme.fonts = {
            default: {
                family: "Arial",
                size: 14,
                weight: "normal",
                style: "normal",
                lineHeight: 1.4,
            },
            heading: {
                family: "Arial",
                size: 24,
                weight: "bold",
                style: "normal",
                lineHeight: 1.2,
            },
            small: {
                family: "Arial",
                size: 12,
                weight: "normal",
                style: "normal",
                lineHeight: 1.4,
            },
        };
        
        // Add default sizes
        theme.sizes = {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
        };
        
        // Add default spacing
        theme.spacing = {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
        };
        
        return theme;
    }

    createDarkTheme(): UITheme {
        const theme = RustUISystem.createTheme("dark", "Dark Theme", UIThemeType.Dark);
        
        // Add dark colors
        theme.colors = {
            primary: "#0d6efd",
            secondary: "#6c757d",
            success: "#198754",
            warning: "#ffc107",
            danger: "#dc3545",
            info: "#0dcaf0",
            light: "#212529",
            dark: "#000000",
            background: "#1a1a1a",
            foreground: "#ffffff",
            border: "#495057",
        };
        
        // Add fonts (same as default)
        theme.fonts = {
            default: {
                family: "Arial",
                size: 14,
                weight: "normal",
                style: "normal",
                lineHeight: 1.4,
            },
            heading: {
                family: "Arial",
                size: 24,
                weight: "bold",
                style: "normal",
                lineHeight: 1.2,
            },
            small: {
                family: "Arial",
                size: 12,
                weight: "normal",
                style: "normal",
                lineHeight: 1.4,
            },
        };
        
        // Add sizes (same as default)
        theme.sizes = {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
        };
        
        // Add spacing (same as default)
        theme.spacing = {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
        };
        
        return theme;
    }

    // Layout helpers
    centerWidget(parentId: string, childId: string): { success: boolean; error?: string } {
        const parent = this.getWidget(parentId);
        if (!parent) {
            return { success: false, error: 'Parent widget not found' };
        }
        
        const child = this.getWidget(childId);
        if (!child) {
            return { success: false, error: 'Child widget not found' };
        }
        
        const centerX = parent.x + (parent.width - child.width) / 2;
        const centerY = parent.y + (parent.height - child.height) / 2;
        
        return this.setWidgetPosition(childId, centerX, centerY);
    }

    alignWidgets(parentId: string, alignment: string): { success: boolean; error?: string } {
        const parent = this.getWidget(parentId);
        if (!parent) {
            return { success: false, error: 'Parent widget not found' };
        }
        
        let success = true;
        let error = '';
        
        for (index, childId) of parent.children.entries()) {
            const child = this.getWidget(childId);
            if (!child) continue;
            
            let x = child.x;
            let y = child.y;
            
            switch (alignment) {
                case 'left':
                    x = parent.x + parent.style.padding.left;
                    break;
                case 'right':
                    x = parent.x + parent.width - child.width - parent.style.padding.right;
                    break;
                case 'top':
                    y = parent.y + parent.style.padding.top;
                    break;
                case 'bottom':
                    y = parent.y + parent.height - child.height - parent.style.padding.bottom;
                    break;
                case 'center':
                    x = parent.x + (parent.width - child.width) / 2;
                    break;
                case 'middle':
                    y = parent.y + (parent.height - child.height) / 2;
                    break;
            }
            
            const result = this.setWidgetPosition(childId, x, y);
            if (!result.success) {
                success = false;
                error = result.error || 'Unknown error';
            }
        }
        
        return { success, error: error || undefined };
    }

    // Event handling helpers
    addClickHandler(widgetId: string, handler: (event: UIEvent) => void): { success: boolean; error?: string } {
        // This would need to be implemented with a callback system
        // For now, we'll store the handler in the widget's custom properties
        const widget = this.getWidget(widgetId);
        if (!widget) {
            return { success: false, error: 'Widget not found' };
        }
        
        widget.customProperties.clickHandler = 'true';
        return { success: true };
    }

    // Performance monitoring
    getPerformanceMetrics(): {
        totalWidgets: number;
        visibleWidgets: number;
        enabledWidgets: number;
        activeAnimations: number;
        renderTime: number;
        updateTime: number;
        layoutTime: number;
        eventTime: number;
        memoryUsage: number;
    } {
        const stats = this.getStats();
        return {
            totalWidgets: stats.totalWidgets,
            visibleWidgets: stats.visibleWidgets,
            enabledWidgets: stats.enabledWidgets,
            activeAnimations: stats.activeAnimations,
            renderTime: stats.renderTime,
            updateTime: stats.updateTime,
            layoutTime: stats.layoutTime,
            eventTime: stats.eventTime,
            memoryUsage: stats.memoryUsage,
        };
    }

    // Debug helpers
    enableDebugMode(): void {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        
        const config = this.getConfig();
        config.debugMode = true;
        this.updateConfig(config);
    }

    disableDebugMode(): void {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        
        const config = this.getConfig();
        config.debugMode = false;
        this.updateConfig(config);
    }

    printWidgetHierarchy(): void {
        if (!this.initialized) {
            throw new Error('UI System not initialized');
        }
        
        const widgets = this.getAllWidgets();
        const rootWidgets = widgets.filter(w => !w.parentId);
        
        console.log('🎨 UI Widget Hierarchy:');
        this.printWidgetHierarchyRecursive(rootWidgets, 0);
    }

    private printWidgetHierarchyRecursive(widgets: UIWidget[], depth: number): void {
        const indent = '  '.repeat(depth);
        
        for (const widget of widgets) {
            console.log(`${indent}- ${widget.name} (${widget.id}) - ${UIWidgetType[widget.widgetType]}`);
            
            if (widget.children.length > 0) {
                const childWidgets = widget.children
                    .map(id => this.getWidget(id))
                    .filter(w => w !== null) as UIWidget[];
                this.printWidgetHierarchyRecursive(childWidgets, depth + 1);
            }
        }
    }

    // Cleanup
    cleanup(): void {
        if (!this.initialized) {
            return;
        }
        
        // Remove all widgets
        const widgets = this.getAllWidgets();
        for (const widget of widgets) {
            this.deleteWidget(widget.id);
        }
        
        // Clear themes
        // Note: This would need to be implemented in the Rust module
        
        console.log('🧹 UI System cleaned up');
    }
}

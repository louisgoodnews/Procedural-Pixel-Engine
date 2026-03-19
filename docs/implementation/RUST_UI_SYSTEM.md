# Rust UI System

## Overview

The Rust UI System is a comprehensive user interface framework designed for game development with advanced features like widget management, layout systems, animations, theming, and accessibility support. Built with Rust and WebAssembly, it provides high-performance, flexible, and reliable UI rendering with TypeScript integration for seamless web development.

## Features

### 🎨 Comprehensive Widget System
- **Multiple Widget Types**: Containers, buttons, labels, images, text fields, sliders, progress bars, and more
- **Widget Hierarchy**: Parent-child relationships with automatic layout management
- **Widget Properties**: Position, size, visibility, enabled state, styling, and custom properties
- **Widget Events**: Click, hover, keyboard, touch, and custom event handling
- **Widget Accessibility**: ARIA attributes, tab navigation, and screen reader support

### 📐 Advanced Layout System
- **Multiple Layout Types**: Absolute, vertical, horizontal, grid, flex, and relative layouts
- **Auto-Layout**: Automatic widget positioning and sizing based on layout rules
- **Responsive Design**: Adaptive layouts that adjust to different screen sizes
- **Layout Constraints**: Padding, margins, spacing, and alignment options
- **Scrolling Support**: Horizontal and vertical scrolling for overflow content

### 🎬 Animation System
- **Animation Types**: Fade, slide, scale, rotate, bounce, and custom animations
- **Easing Functions**: Linear, ease-in, ease-out, ease-in-out, and bounce easing
- **Animation Control**: Play, pause, stop, and repeat options
- **State Transitions**: Smooth transitions between widget states
- **Performance Optimized**: Efficient animation updates with minimal overhead

### 🎨 Theme System
- **Theme Management**: Create, switch, and customize themes dynamically
- **Built-in Themes**: Default, dark, and light themes included
- **Color Schemes**: Comprehensive color palettes for consistent styling
- **Typography**: Font families, sizes, weights, and line heights
- **Responsive Sizing**: Adaptive sizing for different screen densities

### 🖱️ Event Handling
- **Mouse Events**: Click, double-click, down, up, move, enter, and leave
- **Keyboard Events**: Key down, up, and focus management
- **Touch Events**: Touch start, move, and end for mobile devices
- **Custom Events**: User-defined events for advanced interactions
- **Event Bubbling**: Hierarchical event propagation

### ♿ Accessibility Features
- **ARIA Support**: Accessible Rich Internet Applications attributes
- **Keyboard Navigation**: Tab order and keyboard shortcuts
- **Screen Reader**: Text alternatives and descriptions
- **Focus Management**: Visual and programmatic focus indicators
- **High Contrast**: Support for high contrast themes

### 🚀 Performance Optimization
- **Efficient Rendering**: Optimized render command generation
- **Layout Caching**: Cached layout calculations for better performance
- **Memory Management**: Automatic cleanup of unused resources
- **Performance Monitoring**: Built-in performance metrics and profiling
- **Batch Operations**: Efficient batch updates for multiple widgets

## Quick Start

### Installation

```typescript
import { RustUISystem } from './rust-wrappers/RustUISystem';
```

### Basic Setup

```typescript
// Create UI system
const uiSystem = new RustUISystem();

// Initialize with configuration
const config = RustUISystem.createDefaultConfig();
await uiSystem.initialize(config);

// Create a simple button
const result = uiSystem.createSimpleButton('myButton', 'Click Me', 100, 100);
if (result.success) {
    console.log('Button created:', result.widgetId);
}

// Render the UI
const renderResult = uiSystem.render();
if (renderResult.success) {
    console.log('Render commands:', renderResult.commands);
}
```

## API Reference

### RustUISystem Class

#### Constructor
```typescript
constructor()
```
Creates a new UI system instance.

#### Initialization
```typescript
async initialize(config: UIConfig): Promise<void>
```
Initializes the UI system with the specified configuration.

#### Configuration
```typescript
updateConfig(config: UIConfig): void
getConfig(): UIConfig
```
Updates or retrieves the current UI system configuration.

#### Statistics
```typescript
getStats(): UIStats
getUISystemSummary(): string
getPerformanceMetrics(): UIPerformanceMetrics
```
Retrieves UI system statistics and performance metrics.

### Theme Management

#### Theme Operations
```typescript
addTheme(theme: UITheme): { success: boolean; error?: string }
removeTheme(themeId: string): { success: boolean; error?: string }
setTheme(themeId: string): { success: boolean; error?: string }
getCurrentTheme(): UITheme
```
Manages UI themes and styling.

#### Theme Factory Methods
```typescript
static createDefaultTheme(): UITheme
static createDarkTheme(): UITheme
static createTheme(id: string, name: string, themeType?: UIThemeType): UITheme
```
Creates predefined or custom themes.

### Widget Management

#### Widget Operations
```typescript
createWidget(widget: UIWidget): { success: boolean; widgetId?: string; error?: string }
deleteWidget(widgetId: string): { success: boolean; error?: string }
getWidget(widgetId: string): UIWidget | null
getAllWidgets(): UIWidget[]
getVisibleWidgets(): UIWidget[]
getWidgetsByType(widgetType: UIWidgetType): UIWidget[]
```
Manages UI widgets and their properties.

#### Widget Factory Methods
```typescript
static createWidget(id: string, widgetType: UIWidgetType, name: string, x: number, y: number, width: number, height: number): UIWidget
static createButton(id: string, name: string, x: number, y: number, width: number, height: number, text?: string): UIWidget
static createLabel(id: string, name: string, x: number, y: number, width: number, height: number, text?: string): UIWidget
static createContainer(id: string, name: string, x: number, y: number, width: number, height: number, layoutType?: UILayoutType): UIWidget
```
Creates predefined widget types.

#### Convenience Methods
```typescript
createSimpleButton(id: string, text: string, x: number, y: number, width?: number, height?: number): { success: boolean; widgetId?: string; error?: string }
createSimpleLabel(id: string, text: string, x: number, y: number, width?: number, height?: number): { success: boolean; widgetId?: string; error?: string }
createVerticalContainer(id: string, x: number, y: number, width: number, height: number, spacing?: number): { success: boolean; widgetId?: string; error?: string }
createHorizontalContainer(id: string, x: number, y: number, width: number, height: number, spacing?: number): { success: boolean; widgetId?: string; error?: string }
createGridContainer(id: string, x: number, y: number, width: number, height: number, columns: number, rows: number): { success: boolean; widgetId?: string; error?: string }
createFlexContainer(id: string, x: number, y: number, width: number, height: number, flexDirection?: string, justifyContent?: string, alignItems?: string): { success: boolean; widgetId?: string; error?: string }
```
Creates common UI patterns with minimal configuration.

### Widget Hierarchy

#### Hierarchy Operations
```typescript
addChild(parentId: string, childId: string): { success: boolean; error?: string }
removeChild(parentId: string, childId: string): { success: boolean; error?: string }
```
Manages parent-child relationships between widgets.

### Widget Properties

#### Property Management
```typescript
setWidgetPosition(widgetId: string, x: number, y: number): { success: boolean; error?: string }
setWidgetSize(widgetId: string, width: number, height: number): { success: boolean; error?: string }
setWidgetVisibility(widgetId: string, visible: boolean): { success: boolean; error?: string }
setWidgetEnabled(widgetId: string, enabled: boolean): { success: boolean; error?: string }
setWidgetStyle(widgetId: string, style: UIStyle): { success: boolean; error?: string }
```
Updates widget properties and styling.

### Layout System

#### Layout Operations
```typescript
updateLayout(): { success: boolean; error?: string }
```
Updates widget layouts based on layout rules.

#### Layout Helpers
```typescript
centerWidget(parentId: string, childId: string): { success: boolean; error?: string }
alignWidgets(parentId: string, alignment: string): { success: boolean; error?: string }
```
Provides common layout operations.

### Event Handling

#### Event Operations
```typescript
handleClickEvent(widgetId: string, mouseX: number, mouseY: number): { success: boolean; error?: string }
```
Handles user input events.

### Animation System

#### Animation Operations
```typescript
addAnimation(widgetId: string, animation: UIAnimation): { success: boolean; error?: string }
removeAnimation(widgetId: string, animationId: string): { success: boolean; error?: string }
playAnimation(widgetId: string, animationId: string): { success: boolean; error?: string }
pauseAnimation(widgetId: string, animationId: string): { success: boolean; error?: string }
stopAnimation(widgetId: string, animationId: string): { success: boolean; error?: string }
```
Manages widget animations.

#### Animation Factory Methods
```typescript
static createAnimation(id: string, animationType: UIAnimationType, duration: number, fromState: UIAnimationState, toState: UIAnimationState, easing?: string, delay?: number, repeat?: boolean, autoReverse?: boolean): UIAnimation
static createFadeAnimation(id: string, fromOpacity: number, toOpacity: number, duration: number): UIAnimation
static createSlideAnimation(id: string, fromX: number, fromY: number, toX: number, toY: number, duration: number): UIAnimation
static createScaleAnimation(id: string, fromScale: number, toScale: number, duration: number): UIAnimation
static createRotateAnimation(id: string, fromRotation: number, toRotation: number, duration: number): UIAnimation
```
Creates predefined animations.

### Rendering

#### Render Operations
```typescript
render(): { success: boolean; commands?: UIRenderCommand[]; error?: string }
```
Generates render commands for the current UI state.

### Focus Management

#### Focus Operations
```typescript
setFocus(widgetId: string): { success: boolean; error?: string }
clearFocus(): void
getFocusedWidget(): string | null
```
Manages keyboard focus and navigation.

### Hit Testing

#### Hit Testing
```typescript
hitTest(x: number, y: number): string | null
```
Determines which widget is at a specific position.

### Update Loop

#### Update Operations
```typescript
update(deltaTime: number): { success: boolean; error?: string }
```
Updates animations and layout calculations.

### Debug Helpers

#### Debug Operations
```typescript
enableDebugMode(): void
disableDebugMode(): void
printWidgetHierarchy(): void
cleanup(): void
```
Provides debugging and maintenance utilities.

## Data Types

### UIWidgetType
```typescript
enum UIWidgetType {
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
```

### UILayoutType
```typescript
enum UILayoutType {
    Absolute = 0,
    Vertical = 1,
    Horizontal = 2,
    Grid = 3,
    Flex = 4,
    Relative = 5,
    Custom = 6,
}
```

### UIEventType
```typescript
enum UIEventType {
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
```

### UIAnimationType
```typescript
enum UIAnimationType {
    Fade = 0,
    Slide = 1,
    Scale = 2,
    Rotate = 3,
    Bounce = 4,
    Elastic = 5,
    Custom = 6,
}
```

### UIThemeType
```typescript
enum UIThemeType {
    Default = 0,
    Dark = 1,
    Light = 2,
    Custom = 3,
}
```

### UIConfig
```typescript
interface UIConfig {
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
```

### UIWidget
```typescript
interface UIWidget {
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
```

### UIStyle
```typescript
interface UIStyle {
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
```

### UILayout
```typescript
interface UILayout {
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
```

### UIAnimation
```typescript
interface UIAnimation {
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
```

### UITheme
```typescript
interface UITheme {
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
```

### UIStats
```typescript
interface UIStats {
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
```

### UIRenderCommand
```typescript
interface UIRenderCommand {
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
```

## Configuration

### Default Configuration
```typescript
const config = RustUISystem.createDefaultConfig();
```
Enables most features with balanced settings for general use.

### Development Configuration
```typescript
const config = RustUISystem.createDevelopmentConfig();
```
Optimized for development with debug mode and pixel-perfect rendering.

### Production Configuration
```typescript
const config = RustUISystem.createProductionConfig();
```
Optimized for production with performance optimizations and higher widget limits.

### Mobile Configuration
```typescript
const config = RustUISystem.createMobileConfig();
```
Optimized for mobile devices with touch support and limited features.

### Custom Configuration
```typescript
const config = RustUISystem.createDefaultConfig();
config.enableAnimations = true;
config.enableAccessibility = true;
config.autoLayout = true;
config.pixelPerfect = false;
config.retinaDisplay = true;
config.maxWidgets = 1500;
config.eventQueueSize = 150;
```

## Usage Examples

### Basic UI Creation

```typescript
// Initialize UI system
const uiSystem = new RustUISystem();
await uiSystem.initialize(RustUISystem.createDefaultConfig());

// Create a simple button
const buttonResult = uiSystem.createSimpleButton('myButton', 'Click Me', 100, 100);
if (buttonResult.success) {
    console.log('Button created:', buttonResult.widgetId);
}

// Create a label
const labelResult = uiSystem.createSimpleLabel('myLabel', 'Hello World', 100, 150);
if (labelResult.success) {
    console.log('Label created:', labelResult.widgetId);
}

// Render the UI
const renderResult = uiSystem.render();
if (renderResult.success) {
    console.log('Render commands:', renderResult.commands);
}
```

### Layout Management

```typescript
// Create a vertical container
const containerResult = uiSystem.createVerticalContainer('mainContainer', 0, 0, 400, 300, 10);
if (containerResult.success) {
    // Add buttons to container
    uiSystem.createSimpleButton('btn1', 'Button 1', 10, 10);
    uiSystem.createSimpleButton('btn2', 'Button 2', 10, 10);
    uiSystem.createSimpleButton('btn3', 'Button 3', 10, 10);
    
    // Add children to container
    uiSystem.addChild('mainContainer', 'btn1');
    uiSystem.addChild('mainContainer', 'btn2');
    uiSystem.addChild('mainContainer', 'btn3');
    
    // Update layout
    uiSystem.updateLayout();
}
```

### Theme Management

```typescript
// Create custom theme
const customTheme = RustUISystem.createTheme('myTheme', 'My Theme');
customTheme.colors = {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#f7f7f7',
    text: '#2d3436',
};

// Add theme
uiSystem.addTheme(customTheme);

// Set theme
uiSystem.setTheme('myTheme');

// Use dark theme
const darkTheme = uiSystem.createDarkTheme();
uiSystem.addTheme(darkTheme);
uiSystem.setTheme('dark');
```

### Animation System

```typescript
// Create fade animation
const fadeAnim = uiSystem.createFadeAnimation('fadeIn', 0, 1, 500);
uiSystem.addAnimation('myWidget', fadeAnim);

// Play animation
uiSystem.playAnimation('myWidget', 'fadeIn');

// Create slide animation
const slideAnim = uiSystem.createSlideAnimation('slideIn', -100, 0, 0, 0, 300);
uiSystem.addAnimation('myWidget', slideAnim);
uiSystem.playAnimation('myWidget', 'slideIn');

// Create scale animation
const scaleAnim = uiSystem.createScaleAnimation('scaleUp', 0.5, 1.0, 400);
uiSystem.addAnimation('myWidget', scaleAnim);
uiSystem.playAnimation('myWidget', 'scaleUp');
```

### Event Handling

```typescript
// Handle click events
uiSystem.handleClickEvent('myButton', 150, 120);

// Update loop for animations and events
function gameLoop(deltaTime: number) {
    uiSystem.update(deltaTime);
    
    // Render
    const renderResult = uiSystem.render();
    if (renderResult.success) {
        // Process render commands
        processRenderCommands(renderResult.commands);
    }
}

// Start game loop
requestAnimationFrame(function frame(timestamp) {
    const deltaTime = timestamp - lastTime;
    gameLoop(deltaTime);
    lastTime = timestamp;
    requestAnimationFrame(frame);
});
```

### Advanced Layout

```typescript
// Grid layout
const gridResult = uiSystem.createGridContainer('gridContainer', 0, 0, 400, 300, 3, 2);
if (gridResult.success) {
    // Add 6 items to 3x2 grid
    for (let i = 0; i < 6; i++) {
        const item = RustUISystem.createButton(`gridItem${i}`, `Item ${i}`, 0, 0, 100, 40);
        uiSystem.createWidget(item);
        uiSystem.addChild('gridContainer', `gridItem${i}`);
    }
    uiSystem.updateLayout();
}

// Flex layout
const flexResult = uiSystem.createFlexContainer('flexContainer', 0, 350, 400, 100, 'row', 'space-between', 'center');
if (flexResult.success) {
    // Add items to flex container
    uiSystem.createSimpleButton('flex1', 'Left', 0, 0);
    uiSystem.createSimpleButton('flex2', 'Center', 0, 0);
    uiSystem.createSimpleButton('flex3', 'Right', 0, 0);
    
    uiSystem.addChild('flexContainer', 'flex1');
    uiSystem.addChild('flexContainer', 'flex2');
    uiSystem.addChild('flexContainer', 'flex3');
    
    uiSystem.updateLayout();
}
```

### Custom Widget Styling

```typescript
// Create custom styled button
const customButton = RustUISystem.createButton('customBtn', 'Custom', 100, 100);

// Apply custom style
const customStyle = RustUISystem.createDefaultStyle();
customStyle.backgroundColor = '#ff6b6b';
customStyle.borderColor = '#ee5a52';
customStyle.borderWidth = 2;
customStyle.borderRadius = 8;
customStyle.padding = { top: 12, right: 24, bottom: 12, left: 24 };
customStyle.font = {
    family: 'Arial',
    size: 16,
    weight: 'bold',
    style: 'normal',
    lineHeight: 1.4,
};
customStyle.textColor = '#ffffff';
customStyle.shadow = {
    color: 'rgba(0, 0, 0, 0.2)',
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: 0,
};

uiSystem.createWidget(customButton);
uiSystem.setWidgetStyle('customBtn', customStyle);
```

### Focus Management

```typescript
// Set focus to a widget
uiSystem.setFocus('myButton');

// Get currently focused widget
const focusedWidget = uiSystem.getFocusedWidget();
if (focusedWidget) {
    console.log('Focused widget:', focusedWidget);
}

// Clear focus
uiSystem.clearFocus();

// Handle keyboard navigation
function handleKeyDown(keyCode: number) {
    const focused = uiSystem.getFocusedWidget();
    if (!focused) return;
    
    // Implement tab navigation
    if (keyCode === 9) { // Tab key
        const widgets = uiSystem.getVisibleWidgets();
        const currentIndex = widgets.findIndex(w => w.id === focused);
        const nextIndex = (currentIndex + 1) % widgets.length;
        uiSystem.setFocus(widgets[nextIndex].id);
    }
}
```

### Hit Testing

```typescript
// Handle mouse click
function handleMouseClick(x: number, y: number) {
    const hitWidget = uiSystem.hitTest(x, y);
    if (hitWidget) {
        console.log('Clicked on widget:', hitWidget);
        uiSystem.handleClickEvent(hitWidget, x, y);
    }
}

// Handle mouse move
function handleMouseMove(x: number, y: number) {
    const hitWidget = uiSystem.hitTest(x, y);
    if (hitWidget) {
        // Change cursor based on widget
        const widget = uiSystem.getWidget(hitWidget);
        if (widget) {
            document.body.style.cursor = widget.style.cursor.cursorType;
        }
    } else {
        document.body.style.cursor = 'default';
    }
}
```

### Performance Monitoring

```typescript
// Get performance metrics
const metrics = uiSystem.getPerformanceMetrics();
console.log('Performance Metrics:');
console.log('Total Widgets:', metrics.totalWidgets);
console.log('Visible Widgets:', metrics.visibleWidgets);
console.log('Active Animations:', metrics.activeAnimations);
console.log('Render Time:', metrics.renderTime + 'ms');
console.log('Update Time:', metrics.updateTime + 'ms');
console.log('Layout Time:', metrics.layoutTime + 'ms');
console.log('Memory Usage:', metrics.memoryUsage + ' bytes');

// Monitor performance in real-time
setInterval(() => {
    const stats = uiSystem.getStats();
    if (stats.renderTime > 16.67) { // > 60fps
        console.warn('Slow render detected:', stats.renderTime + 'ms');
    }
}, 1000);
```

### Debug Mode

```typescript
// Enable debug mode
uiSystem.enableDebugMode();

// Print widget hierarchy
uiSystem.printWidgetHierarchy();

// Get detailed system summary
const summary = uiSystem.getUISystemSummary();
console.log(summary);

// Disable debug mode
uiSystem.disableDebugMode();
```

## Performance Optimization

### Best Practices

1. **Widget Management**
   - Limit the number of visible widgets
   - Use container widgets for grouping
   - Remove unused widgets
   - Use visibility instead of deletion for frequently toggled widgets

2. **Layout Optimization**
   - Use appropriate layout types
   - Avoid deeply nested layouts
   - Use spacing and padding efficiently
   - Cache layout calculations when possible

3. **Animation Performance**
   - Use simple animations for better performance
   - Limit concurrent animations
   - Use hardware acceleration when available
   - Consider animation duration and complexity

4. **Rendering Optimization**
   - Update only when necessary
   - Use dirty flagging for widgets
   - Batch render operations
   - Minimize overdraw

5. **Memory Management**
   - Clean up unused widgets and animations
   - Use object pooling for frequently created widgets
   - Monitor memory usage
   - Avoid memory leaks in event handlers

### Performance Monitoring

1. **Frame Rate Monitoring**
   ```typescript
   let lastTime = 0;
   function monitorFrameRate(timestamp: number) {
       const deltaTime = timestamp - lastTime;
       const fps = 1000 / deltaTime;
       
       if (fps < 60) {
           console.warn('Low FPS detected:', fps.toFixed(1));
       }
       
       lastTime = timestamp;
       requestAnimationFrame(monitorFrameRate);
   }
   ```

2. **Widget Count Monitoring**
   ```typescript
   function monitorWidgetCount() {
       const stats = uiSystem.getStats();
       const maxWidgets = uiSystem.getConfig().maxWidgets;
       
       if (stats.totalWidgets > maxWidgets * 0.8) {
           console.warn('Widget count approaching limit:', stats.totalWidgets);
       }
   }
   ```

3. **Memory Usage Monitoring**
   ```typescript
   function monitorMemoryUsage() {
       const metrics = uiSystem.getPerformanceMetrics();
       
       if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
           console.warn('High memory usage:', metrics.memoryUsage);
       }
   }
   ```

## Accessibility

### Accessibility Features

1. **ARIA Attributes**
   ```typescript
   const accessibleWidget = RustUISystem.createWidget('accessible', UIWidgetType.Button, 'Accessible Button', 100, 100, 120, 40);
   
   // Set accessibility properties
   accessibleWidget.accessibility.label = 'Submit Form';
   accessibleWidget.accessibility.description = 'Submits the form and processes the data';
   accessibleWidget.accessibility.role = 'button';
   accessibleWidget.accessibility.tabIndex = 0;
   accessibleWidget.accessibility.ariaAttributes = {
       'aria-pressed': 'false',
       'aria-describedby': 'form-help',
   };
   ```

2. **Keyboard Navigation**
   ```typescript
   // Enable keyboard support
   const config = uiSystem.getConfig();
   config.keyboardSupport = true;
   uiSystem.updateConfig(config);
   
   // Handle keyboard events
   function handleKeyboardEvent(event: KeyboardEvent) {
       const focused = uiSystem.getFocusedWidget();
       if (!focused) return;
       
       switch (event.key) {
           case 'Enter':
           case ' ':
               uiSystem.handleClickEvent(focused, 0, 0);
               break;
           case 'Tab':
               navigateToNextWidget(event.shiftKey);
               break;
       }
   }
   ```

3. **Screen Reader Support**
   ```typescript
   // Announce important changes
   function announceToScreenReader(message: string) {
       const announcement = RustUISystem.createWidget('announcement', UIWidgetType.Label, 'Announcement', -1000, -1000, 1, 1);
       announcement.customProperties.text = message;
       announcement.accessibility.role = 'status';
       announcement.accessibility.live = 'polite';
       
       uiSystem.createWidget(announcement);
       
       // Remove after announcement
       setTimeout(() => {
           uiSystem.deleteWidget('announcement');
       }, 1000);
   }
   ```

## Troubleshooting

### Common Issues

#### UI System Not Initializing
```typescript
try {
    await uiSystem.initialize(config);
} catch (error) {
    console.error('UI System initialization failed:', error);
    // Check if WASM module is available
    if (typeof WebAssembly === 'undefined') {
        console.error('WebAssembly not supported');
    }
}
```

#### Widget Not Rendering
```typescript
const renderResult = uiSystem.render();
if (!renderResult.success) {
    console.error('Rendering failed:', renderResult.error);
} else {
    console.log('Render commands:', renderResult.commands.length);
}
```

#### Layout Not Updating
```typescript
const layoutResult = uiSystem.updateLayout();
if (!layoutResult.success) {
    console.error('Layout update failed:', layoutResult.error);
}

// Check widget hierarchy
uiSystem.printWidgetHierarchy();
```

#### Animation Not Playing
```typescript
const playResult = uiSystem.playAnimation('widgetId', 'animationId');
if (!playResult.success) {
    console.error('Animation play failed:', playResult.error);
}

// Check if animations are enabled
const config = uiSystem.getConfig();
if (!config.enableAnimations) {
    console.log('Animations are disabled');
}
```

#### Performance Issues
```typescript
const metrics = uiSystem.getPerformanceMetrics();
if (metrics.renderTime > 16.67) { // > 60fps
    console.warn('Slow render detected:', metrics.renderTime);
    
    // Optimize
    const config = uiSystem.getConfig();
    config.enableAnimations = false;
    uiSystem.updateConfig(config);
}
```

### Performance Issues

#### Slow Rendering
- Reduce visible widget count
- Use simpler layouts
- Disable unnecessary animations
- Optimize widget hierarchy

#### High Memory Usage
- Clean up unused widgets
- Use object pooling
- Monitor memory leaks
- Reduce widget complexity

#### Layout Performance
- Use appropriate layout types
- Avoid deeply nested layouts
- Cache layout calculations
- Use dirty flagging

#### Animation Performance
- Limit concurrent animations
- Use simple easing functions
- Reduce animation complexity
- Consider hardware acceleration

### Debug Mode

```typescript
// Enable debug mode for detailed logging
uiSystem.enableDebugMode();

// Monitor performance
setInterval(() => {
    const stats = uiSystem.getStats();
    const metrics = uiSystem.getPerformanceMetrics();
    
    console.log('UI Stats:', stats);
    console.log('Performance:', metrics);
}, 1000);

// Print widget hierarchy
uiSystem.printWidgetHierarchy();
```

## Best Practices

### Development Workflow

1. **Setup Phase**
   - Initialize UI system with appropriate configuration
   - Set up themes and styling
   - Configure event handlers
   - Enable debug mode for development

2. **Widget Creation**
   - Use factory methods for common widgets
   - Organize widgets in logical hierarchies
   - Set appropriate layouts
   - Configure accessibility attributes

3. **Styling Phase**
   - Apply consistent themes
   - Use responsive sizing
   - Set appropriate colors and fonts
   - Configure animations and transitions

4. **Testing Phase**
   - Test widget interactions
   - Verify layout behavior
   - Check animations
   - Test accessibility features

5. **Optimization Phase**
   - Monitor performance metrics
   - Optimize widget count
   - Improve layout efficiency
   - Reduce memory usage

### UI Design Principles

1. **Consistency**
   - Use consistent styling across widgets
   - Apply themes uniformly
   - Maintain consistent spacing
   - Use consistent interaction patterns

2. **Responsiveness**
   - Design for different screen sizes
   - Use flexible layouts
   - Test on various devices
   - Consider touch vs. mouse input

3. **Accessibility**
   - Provide text alternatives
   - Support keyboard navigation
   - Use semantic markup
   - Test with screen readers

4. **Performance**
   - Minimize widget count
   - Use efficient layouts
   - Optimize animations
   - Monitor memory usage

### Code Organization

1. **Widget Management**
   - Group related widgets
   - Use descriptive IDs
   - Organize in logical containers
   - Document widget purposes

2. **Event Handling**
   - Use consistent event patterns
   - Handle edge cases
   - Provide visual feedback
   - Log important events

3. **Styling Architecture**
   - Use theme-based styling
   - Create reusable style presets
   - Document style guidelines
   - Test theme switching

4. **Animation Design**
   - Use purposeful animations
   - Keep animations short
   - Provide smooth transitions
   - Consider performance impact

## API Compatibility

### Browser Support

The UI system requires:
- **WebAssembly**: Modern browsers with WASM support
- **TypeScript**: TypeScript 4.0+ for type safety
- **ES6+**: Modern JavaScript features
- **Canvas**: 2D canvas for rendering
- **Event APIs**: Mouse, keyboard, and touch event support

### Version Compatibility

- **Rust UI System**: 1.0.0+
- **WebAssembly**: Current version
- **TypeScript**: 4.0+

### Performance Requirements

- **Minimum Overhead**: < 16ms for 60fps rendering
- **Memory Usage**: < 50MB for typical UI
- **Widget Limit**: Configurable (default 1000)
- **Event Queue**: Configurable (default 100)

## Contributing

### Development Setup

1. Clone the repository
2. Install Rust and wasm-pack
3. Build the WASM module:
   ```bash
   cd src/rust
   wasm-pack build --target web --out-dir ../../pkg
   ```
4. Run tests:
   ```typescript
   import { RustUISystemTest } from './integration/RustUISystemTest';
   
   const test = new RustUISystemTest();
   await test.runAllTests();
   ```

### Code Style

- Follow Rust naming conventions
- Use TypeScript strict mode
- Include comprehensive documentation
- Write unit tests for new features

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Run the test suite for diagnostics

## Changelog

### Version 1.0.0
- Initial release of UI system
- Complete widget management system
- Advanced layout system with multiple types
- Animation system with easing functions
- Theme management and styling
- Event handling and interaction
- Accessibility features and support
- Performance monitoring and optimization
- TypeScript integration with full type safety
- Complete test suite and documentation

---

*Last updated: 2026-03-16*

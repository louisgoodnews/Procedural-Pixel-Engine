# Plugin Development Guide

## 🚀 Welcome to Plugin Development

This comprehensive guide will help you create, publish, and distribute plugins for the Procedural Pixel Engine. Plugins extend the engine's capabilities with custom functionality, new features, and specialized tools.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Architecture](#plugin-architecture)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Plugin API Reference](#plugin-api-reference)
5. [Best Practices](#best-practices)
6. [Publishing Your Plugin](#publishing-your-plugin)
7. [Advanced Topics](#advanced-topics)
8. [Troubleshooting](#troubleshooting)

## 🏁 Getting Started

### Prerequisites

- Node.js 16+ installed
- Basic knowledge of TypeScript/JavaScript
- Understanding of game development concepts
- Text editor (VS Code recommended)

### Development Environment Setup

1. **Install the Plugin CLI**
   ```bash
   npm install -g @procedural-pixel-engine/plugin-cli
   ```

2. **Create a New Plugin**
   ```bash
   ppe-plugin create my-awesome-plugin
   cd my-awesome-plugin
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Project Structure

```
my-awesome-plugin/
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── components/           # UI components
│   ├── systems/              # Engine systems
│   └── utils/                # Utility functions
├── assets/                   # Plugin assets
├── docs/                     # Documentation
├── tests/                    # Unit tests
├── plugin.json              # Plugin manifest
├── package.json             # NPM configuration
├── README.md                # Plugin description
└── tsconfig.json            # TypeScript configuration
```

## 🏗️ Plugin Architecture

### Core Components

#### **Plugin Manifest (`plugin.json`)**
Every plugin must include a manifest file that describes its metadata, dependencies, and configuration.

```json
{
  "metadata": {
    "id": "my-awesome-plugin",
    "name": "My Awesome Plugin",
    "version": "1.0.0",
    "description": "An awesome plugin that adds cool features",
    "author": "Your Name",
    "license": "MIT",
    "category": "tools",
    "engineVersion": "1.0.0",
    "keywords": ["awesome", "tools", "productivity"],
    "permissions": ["graphics"],
    "dependencies": []
  },
  "entryPoint": "src/index.js",
  "assets": ["assets/"],
  "config": {
    "autoLoad": true,
    "hotReload": true,
    "isolated": true,
    "maxMemory": 64000000,
    "timeout": 30000
  }
}
```

#### **Plugin Class**
The main plugin class implements the `PluginAPI` interface and provides the core functionality.

```typescript
import { PluginAPI, PluginContext, PluginEvent } from "@procedural-pixel-engine/plugin-api";

export class MyAwesomePlugin implements PluginAPI {
  private isActive = false;
  private settings: PluginSettings;

  constructor() {
    this.settings = {
      enableFeature: true,
      customValue: 42
    };
  }

  async initialize(context: PluginContext): Promise<void> {
    console.log(`Initializing ${context.pluginId}`);
    
    // Setup plugin state
    this.isActive = true;
    
    // Register event listeners
    context.addEventListener("engine.tick", this.onEngineTick.bind(this));
    
    // Initialize UI if needed
    if (this.settings.enableFeature) {
      this.setupUI(context);
    }
  }

  async update(context: PluginContext, deltaTime: number): Promise<void> {
    if (!this.isActive) return;

    // Update plugin logic
    this.updateLogic(deltaTime);
  }

  async render(context: PluginContext): Promise<void> {
    if (!this.isActive) return;

    // Render plugin visuals
    this.renderGraphics(context);
  }

  async cleanup(context: PluginContext): Promise<void> {
    console.log(`Cleaning up ${context.pluginId}`);
    
    // Remove event listeners
    context.removeEventListener("engine.tick", this.onEngineTick);
    
    // Cleanup resources
    this.isActive = false;
  }

  async handleEvent(context: PluginContext, event: PluginEvent): Promise<void> {
    switch (event.eventType) {
      case "user.input":
        this.handleUserInput(event.data);
        break;
      case "world.loaded":
        this.onWorldLoaded(event.data);
        break;
    }
  }

  private onEngineTick(event: PluginEvent): void {
    // Handle engine tick events
  }

  private setupUI(context: PluginContext): void {
    // Create UI elements
    const panel = context.ui.createPanel("My Awesome Plugin");
    panel.addButton("Do Something", () => {
      this.doSomethingAwesome();
    });
  }

  private updateLogic(deltaTime: number): void {
    // Update plugin logic
  }

  private renderGraphics(context: PluginContext): void {
    // Render plugin graphics
    const renderer = context.graphics.getRenderer();
    renderer.drawCircle(100, 100, 50, { color: "#ff0000" });
  }

  private handleUserInput(inputData: any): void {
    // Handle user input
  }

  private onWorldLoaded(worldData: any): void {
    // Handle world loaded events
  }

  private doSomethingAwesome(): void {
    console.log("Doing something awesome!");
  }
}
```

## 🛠️ Creating Your First Plugin

### Step 1: Define Your Plugin's Purpose

Before writing code, clearly define what your plugin will do:

- **Problem**: What problem does your plugin solve?
- **Features**: What specific features will it provide?
- **Users**: Who will benefit from this plugin?
- **Scope**: What's in scope and what's out of scope?

### Step 2: Create the Plugin Structure

Use the CLI to create a new plugin:

```bash
ppe-plugin create my-first-plugin --template=basic
cd my-first-plugin
```

### Step 3: Implement the Plugin Logic

Edit `src/index.ts` to implement your plugin:

```typescript
import { PluginAPI, PluginContext } from "@procedural-pixel-engine/plugin-api";

export class MyFirstPlugin implements PluginAPI {
  private messageCount = 0;

  async initialize(context: PluginContext): Promise<void> {
    console.log("My First Plugin initialized!");
    
    // Add a menu item
    context.ui.addMenuItem({
      label: "My Plugin Action",
      onClick: () => this.showMessage()
    });
  }

  async update(context: PluginContext, deltaTime: number): Promise<void> {
    // Update logic here
  }

  async render(context: PluginContext): Promise<void> {
    // Rendering logic here
  }

  async cleanup(context: PluginContext): Promise<void> {
    console.log("My First Plugin cleaned up!");
  }

  async handleEvent(context: PluginContext, event: PluginEvent): Promise<void> {
    // Handle events here
  }

  private showMessage(): void {
    this.messageCount++;
    context.ui.showNotification(`Message #${this.messageCount}: Hello from my plugin!`);
  }
}
```

### Step 4: Test Your Plugin

Run the development server:

```bash
npm run dev
```

This will:
- Compile your plugin
- Start a development engine instance
- Load your plugin automatically
- Enable hot-reloading for quick iteration

### Step 5: Debug and Iterate

Use the built-in debugging tools:

```typescript
// Debug logging
context.debug.log("Debug message");
context.debug.warn("Warning message");
context.debug.error("Error message");

// Performance monitoring
const perfTimer = context.debug.startTimer("my-operation");
// ... do work
perfTimer.end();
```

## 📖 Plugin API Reference

### Core API

#### **PluginContext**
The context object provides access to engine systems and utilities.

```typescript
interface PluginContext {
  // Plugin information
  pluginId: string;
  engineVersion: string;
  timestamp: number;
  delta_time: number;
  
  // Engine systems
  graphics: GraphicsAPI;
  audio: AudioAPI;
  input: InputAPI;
  ui: UIAPI;
  world: WorldAPI;
  
  // Utilities
  debug: DebugAPI;
  storage: StorageAPI;
  network: NetworkAPI;
  
  // Events
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  emitEvent(event: string, data: any): void;
}
```

#### **Graphics API**
Access the rendering system.

```typescript
interface GraphicsAPI {
  // Rendering
  getRenderer(): Renderer;
  drawLine(x1: number, y1: number, x2: number, y2: number, style: DrawStyle): void;
  drawRect(x: number, y: number, width: number, height: number, style: DrawStyle): void;
  drawCircle(x: number, y: number, radius: number, style: DrawStyle): void;
  drawText(text: string, x: number, y: number, style: TextStyle): void;
  
  // Textures
  loadTexture(url: string): Promise<Texture>;
  createTexture(data: ImageData): Texture;
  
  // Shaders
  loadShader(vertexSource: string, fragmentSource: string): Promise<Shader>;
  setShader(shader: Shader): void;
}
```

#### **UI API**
Create user interface elements.

```typescript
interface UIAPI {
  // Panels
  createPanel(title: string): UIPanel;
  
  // Controls
  createButton(label: string, onClick: () => void): UIButton;
  createTextField(placeholder: string): UITextField;
  createCheckbox(label: string, checked: boolean): UICheckbox;
  createSlider(min: number, max: number, value: number): UISlider;
  
  // Notifications
  showNotification(message: string, type?: "info" | "warning" | "error"): void;
  
  // Menu
  addMenuItem(item: MenuItem): void;
  removeMenuItem(itemId: string): void;
}
```

#### **World API**
Interact with the game world.

```typescript
interface WorldAPI {
  // Entities
  createEntity(components: ComponentData[]): Entity;
  getEntity(id: string): Entity | null;
  removeEntity(id: string): void;
  
  // Queries
  queryEntities(components: string[]): Entity[];
  
  // Components
  addComponent(entityId: string, component: ComponentData): void;
  removeComponent(entityId: string, componentType: string): void;
  getComponent(entityId: string, componentType: string): ComponentData | null;
}
```

### Event System

Plugins can listen to and emit events to communicate with the engine and other plugins.

#### **Built-in Events**

```typescript
// Engine events
"engine.tick"        // Fired every frame
"engine.start"       // Engine started
"engine.stop"        // Engine stopped
"engine.pause"       // Engine paused
"engine.resume"      // Engine resumed

// World events
"world.loaded"       // World loaded
"world.saved"        // World saved
"entity.created"     // Entity created
"entity.destroyed"   // Entity destroyed

// Input events
"user.input"         // User input
"user.keydown"       // Key pressed
"user.keyup"         // Key released
"user.mousemove"     // Mouse moved
"user.click"         // Mouse clicked

// UI events
"ui.panel.opened"    // Panel opened
"ui.panel.closed"    // Panel closed
"ui.button.clicked"  // Button clicked
```

#### **Custom Events**

Create your own events for plugin communication:

```typescript
// Emit custom event
context.emitEvent("my-plugin.action", { 
  type: "awesome",
  data: { value: 42 }
});

// Listen to custom event
context.addEventListener("my-plugin.action", (event) => {
  console.log("Custom event received:", event.data);
});
```

## 🎯 Best Practices

### Performance

1. **Use Efficient Data Structures**
   ```typescript
   // Good: Use Maps for frequent lookups
   const entityCache = new Map<string, Entity>();
   
   // Bad: Use Arrays for frequent lookups
   const entityCache: Entity[] = [];
   ```

2. **Avoid Memory Leaks**
   ```typescript
   // Always clean up event listeners
   async cleanup(context: PluginContext): Promise<void> {
     context.removeEventListener("engine.tick", this.onTick);
   }
   ```

3. **Use Object Pooling**
   ```typescript
   class ParticlePool {
     private particles: Particle[] = [];
     
     get(): Particle {
       return this.particles.pop() || new Particle();
     }
     
     release(particle: Particle): void {
       particle.reset();
       this.particles.push(particle);
     }
   }
   ```

### Code Organization

1. **Separate Concerns**
   ```typescript
   // Good: Separate logic into different modules
   export class MyPlugin {
     private renderer: PluginRenderer;
     private ui: PluginUI;
     private logic: PluginLogic;
     
     async initialize(context: PluginContext): Promise<void> {
       this.renderer = new PluginRenderer(context);
       this.ui = new PluginUI(context);
       this.logic = new PluginLogic(context);
     }
   }
   ```

2. **Use Dependency Injection**
   ```typescript
   // Good: Inject dependencies
   export class MyPlugin {
     constructor(
       private graphics: GraphicsAPI,
       private audio: AudioAPI,
       private storage: StorageAPI
     ) {}
   }
   ```

### Error Handling

1. **Always Handle Errors**
   ```typescript
   try {
     await this.loadResources();
   } catch (error) {
     context.debug.error("Failed to load resources:", error);
     context.ui.showNotification("Failed to load plugin resources", "error");
   }
   ```

2. **Provide Fallbacks**
   ```typescript
   async loadTexture(url: string): Promise<Texture> {
     try {
       return await context.graphics.loadTexture(url);
     } catch (error) {
       // Fallback to default texture
       return this.getDefaultTexture();
     }
   }
   ```

### Security

1. **Validate Input**
   ```typescript
   private validateInput(input: any): boolean {
     if (typeof input !== "object") return false;
     if (typeof input.value !== "number") return false;
     if (input.value < 0 || input.value > 100) return false;
     return true;
   }
   ```

2. **Use Secure Storage**
   ```typescript
   // Store sensitive data securely
   await context.storage.setSecure("api-key", apiKey);
   const apiKey = await context.storage.getSecure("api-key");
   ```

## 📦 Publishing Your Plugin

### Prepare for Publishing

1. **Update Plugin Manifest**
   ```json
   {
     "metadata": {
       "id": "my-awesome-plugin",
       "name": "My Awesome Plugin",
       "version": "1.0.0",
       "description": "A comprehensive description of what your plugin does",
       "author": "Your Name",
       "license": "MIT",
       "homepage": "https://github.com/yourname/my-awesome-plugin",
       "repository": "https://github.com/yourname/my-awesome-plugin",
       "keywords": ["awesome", "tools", "productivity"],
       "category": "tools"
     }
   }
   ```

2. **Create Documentation**
   - Update README.md with installation and usage instructions
   - Add API documentation
   - Include screenshots and examples

3. **Write Tests**
   ```typescript
   import { MyPlugin } from "../src/index";

   describe("MyPlugin", () => {
     let plugin: MyPlugin;
     let mockContext: PluginContext;

     beforeEach(() => {
       plugin = new MyPlugin();
       mockContext = createMockContext();
     });

     test("should initialize correctly", async () => {
       await expect(plugin.initialize(mockContext)).resolves.not.toThrow();
     });

     test("should handle events correctly", async () => {
       const event = { eventType: "test", data: {}, source: "test", timestamp: Date.now() };
       await expect(plugin.handleEvent(mockContext, event)).resolves.not.toThrow();
     });
   });
   ```

4. **Build Plugin**
   ```bash
   npm run build
   ```

### Publish to Marketplace

1. **Create Marketplace Account**
   - Visit [plugin marketplace](https://marketplace.proceduralpixel.com)
   - Create developer account
   - Verify your email

2. **Upload Plugin**
   ```bash
   ppe-plugin publish
   ```

3. **Fill Plugin Information**
   - Plugin name and description
   - Category and tags
   - Screenshots and videos
   - Pricing (free or paid)
   - Support information

4. **Submit for Review**
   - Plugin will be reviewed for quality and security
   - Review typically takes 2-3 business days
   - You'll receive email when approved

### Version Management

Use semantic versioning for your plugin releases:

- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features, backward compatible
- **Patch (X.Y.Z)**: Bug fixes, backward compatible

```bash
# Create a new version
npm version patch  # or minor, major
npm run build
ppe-plugin publish
```

## 🔧 Advanced Topics

### Hot Reloading

Enable hot-reloading for faster development:

```typescript
// plugin.json
{
  "config": {
    "hotReload": true
  }
}

// In your plugin
export class MyPlugin implements PluginAPI {
  private hotReloadEnabled = false;

  async initialize(context: PluginContext): Promise<void> {
    this.hotReloadEnabled = context.config.hotReload;
    
    if (this.hotReloadEnabled) {
      context.addEventListener("plugin.hot-reload", this.onHotReload.bind(this));
    }
  }

  private onHotReload(event: PluginEvent): void {
    // Save state before reload
    const state = this.saveState();
    
    // Cleanup current instance
    this.cleanup(context);
    
    // Reload with saved state
    this.initialize(context);
    this.restoreState(state);
  }
}
```

### Plugin Communication

Plugins can communicate with each other through events:

```typescript
// Sender plugin
context.emitEvent("shared-data.updated", {
  source: "data-processor-plugin",
  data: processedData
});

// Receiver plugin
context.addEventListener("shared-data.updated", (event) => {
  if (event.data.source === "data-processor-plugin") {
    this.updateVisualization(event.data.data);
  }
});
```

### Custom Components

Create custom ECS components:

```typescript
interface CustomComponent {
  type: "custom";
  customProperty: string;
  customValue: number;
}

// Register custom component
context.world.registerComponent("custom", CustomComponent);

// Use custom component
const entity = context.world.createEntity([
  { type: "position", x: 100, y: 100 },
  { type: "custom", customProperty: "test", customValue: 42 }
]);
```

### Shader Programming

Write custom shaders for advanced effects:

```glsl
// Custom vertex shader
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_projection;
uniform float u_time;

void main() {
  vec2 position = a_position;
  position.x += sin(u_time + position.y * 0.1) * 10.0;
  gl_Position = u_projection * vec4(position, 0.0, 1.0);
}

// Custom fragment shader
precision mediump float;
uniform sampler2D u_texture;
uniform float u_time;

void main() {
  vec4 color = texture2D(u_texture, gl_TexCoord[0].xy);
  color.rgb *= sin(u_time) * 0.5 + 0.5;
  gl_FragColor = color;
}
```

```typescript
// Load and use custom shader
const shader = await context.graphics.loadShader(vertexSource, fragmentSource);
context.graphics.setShader(shader);
```

## 🐛 Troubleshooting

### Common Issues

#### **Plugin Won't Load**
- Check `plugin.json` for syntax errors
- Verify all dependencies are installed
- Ensure engine version compatibility
- Check browser console for error messages

#### **Performance Issues**
- Use performance profiling tools
- Check for memory leaks
- Optimize rendering calls
- Reduce update frequency if possible

#### **Event Handling Problems**
- Ensure event listeners are properly removed
- Check event data structure
- Verify event names match exactly
- Use debugging to trace event flow

### Debugging Tools

#### **Plugin Debugger**
```typescript
// Enable debug mode
context.debug.setMode("verbose");

// Add debug breakpoints
context.debug.breakpoint("before-render");

// Log performance
context.debug.profile("render-loop", () => {
  this.render(context);
});
```

#### **Error Reporting**
```typescript
// Setup error handling
context.addEventListener("plugin.error", (event) => {
  console.error("Plugin error:", event.data);
  
  // Report to analytics
  context.analytics.track("plugin.error", {
    pluginId: context.pluginId,
    error: event.data.message,
    stack: event.data.stack
  });
});
```

### Getting Help

1. **Documentation**: Visit [plugin documentation](https://docs.proceduralpixel.com/plugins)
2. **Community**: Join our [Discord server](https://discord.gg/proceduralpixel)
3. **GitHub**: Open an issue on [plugin-templates](https://github.com/procedural-pixel-engine/plugin-templates)
4. **Support**: Email support@proceduralpixel.com

---

## 🎉 Congratulations!

You now have everything you need to create amazing plugins for the Procedural Pixel Engine. Remember to:

- Start simple and iterate
- Test thoroughly
- Document your code
- Engage with the community
- Have fun creating!

Happy plugin development! 🚀

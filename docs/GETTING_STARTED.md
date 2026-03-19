# Getting Started with Procedural Pixel Engine

Welcome to the Procedural Pixel Engine! This guide will help you get up and running quickly, from installation to your first game.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Basic Concepts](#basic-concepts)
5. [Your First Game](#your-first-game)
6. [Next Steps](#next-steps)
7. [Resources](#resources)

## Installation

### Prerequisites

- Node.js 18+ or Bun 1.0+
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of TypeScript

### Install the Engine

```bash
# Using npm
npm install procedural-pixel-engine

# Using yarn
yarn add procedural-pixel-engine

# Using pnpm
pnpm add procedural-pixel-engine

# Using Bun
bun add procedural-pixel-engine
```

### Create a New Project

```bash
# Using the CLI tool
npx create-ppe-game my-game
cd my-game

# Or manually create a project
mkdir my-game
cd my-game
npm init -y
npm install procedural-pixel-engine typescript vite
```

### Setup TypeScript

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Setup Vite (Optional)

Create a `vite.config.ts` file:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          engine: ['procedural-pixel-engine']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

## Quick Start

### Basic HTML Setup

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
        }
        #game-canvas {
            display: block;
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <canvas id="game-canvas"></canvas>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### Basic Engine Setup

Create a `src/main.ts` file:

```typescript
import { ProceduralPixelEngine } from 'procedural-pixel-engine';

async function main() {
  // Get the canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  // Create the engine
  const engine = new ProceduralPixelEngine({
    canvas: canvas,
    renderer: 'webgl2',
    physics: true,
    audio: true,
    input: true
  });
  
  try {
    // Initialize the engine
    await engine.initialize();
    console.log('Engine initialized successfully!');
    
    // Start the game loop
    engine.start();
    
  } catch (error) {
    console.error('Failed to initialize engine:', error);
  }
}

// Start the game
main();
```

### Run Your Game

```bash
# Using Vite
npm run dev

# Using a simple HTTP server
npx serve .

# Open your browser and navigate to http://localhost:3000
```

## Project Structure

A typical Procedural Pixel Engine project looks like this:

```
my-game/
├── src/
│   ├── main.ts              # Main entry point
│   ├── game/                # Game-specific code
│   │   ├── scenes/          # Scene definitions
│   │   ├── entities/        # Entity definitions
│   │   ├── systems/         # Game systems
│   │   └── components/       # Custom components
│   ├── assets/              # Game assets
│   │   ├── textures/        # Image files
│   │   ├── models/          # 3D models
│   │   ├── audio/           # Sound files
│   │   └── animations/      # Animation files
│   └── utils/               # Utility functions
├── public/                  # Static files
│   └── index.html          # Main HTML file
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration (optional)
└── README.md               # Project documentation
```

## Basic Concepts

### Entity Component System (ECS)

The Procedural Pixel Engine uses an Entity Component System (ECS) architecture:

- **Entities**: Objects in your game (player, enemies, items)
- **Components**: Data attached to entities (position, velocity, health)
- **Systems**: Logic that processes entities with specific components

```typescript
// Create an entity
const player = engine.createEntity();

// Add components
player.addComponent(new Transform({ x: 0, y: 0, z: 0 }));
player.addComponent(new Velocity({ x: 0, y: 0, z: 0 }));
player.addComponent(new Health({ current: 100, max: 100 }));

// Create a system
class MovementSystem implements System {
  update(deltaTime: number, entities: Entity[]): void {
    entities.forEach(entity => {
      const transform = entity.getComponent(Transform);
      const velocity = entity.getComponent(Velocity);
      
      if (transform && velocity) {
        transform.x += velocity.x * deltaTime;
        transform.y += velocity.y * deltaTime;
        transform.z += velocity.z * deltaTime;
      }
    });
  }
}

// Add the system to the engine
engine.addSystem(new MovementSystem());
```

### Scene Management

Scenes organize your game objects and provide a hierarchical structure:

```typescript
// Create a scene
const scene = engine.createScene();

// Create objects
const player = scene.createObject();
const enemy = scene.createObject();

// Set up hierarchy
scene.addChild(player);
scene.addChild(enemy);

// Scene properties
scene.setActive(true);
scene.setVisible(true);
```

### Rendering Pipeline

The engine provides a flexible rendering pipeline:

```typescript
// Get the renderer
const renderer = engine.getRenderer();

// Create a camera
const camera = engine.createCamera('perspective', 75, aspectRatio, 0.1, 1000);
camera.setPosition({ x: 0, y: 5, z: 10 });
camera.lookAt({ x: 0, y: 0, z: 0 });

// Create a mesh
const mesh = engine.createMesh({
  vertices: [...],
  indices: [...]
});

// Create a material
const material = engine.createMaterial({
  albedo: { r: 1, g: 0, b: 0 },
  metallic: 0.0,
  roughness: 0.5
});

// Create a renderer component
const renderer = new MeshRenderer({
  mesh: mesh,
  material: material
});

entity.addComponent(renderer);
```

## Your First Game

Let's create a simple 2D platformer game:

### Step 1: Setup the Scene

```typescript
// src/game/scenes/GameScene.ts
import { Scene, Camera } from 'procedural-pixel-engine';

export class GameScene extends Scene {
  private camera: Camera;
  
  constructor() {
    super();
    this.setupCamera();
    this.setupPlayer();
    this.setupPlatforms();
  }
  
  private setupCamera(): void {
    this.camera = this.engine.createCamera('orthographic', -400, 400, -300, 300, 0.1, 1000);
    this.camera.setPosition({ x: 0, y: 0, z: 10 });
  }
  
  private setupPlayer(): void {
    const player = this.createObject();
    
    // Transform component
    player.addComponent(new Transform({
      position: { x: 0, y: 100, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    }));
    
    // Sprite component
    player.addComponent(new Sprite({
      texture: 'player.png',
      size: { x: 32, y: 32 }
    }));
    
    // Physics component
    player.addComponent(new RigidBody({
      type: 'dynamic',
      mass: 1,
      shape: new BoxShape({ x: 16, y: 16, z: 1 })
    }));
    
    // Player controller component
    player.addComponent(new PlayerController());
  }
  
  private setupPlatforms(): void {
    // Ground platform
    const ground = this.createObject();
    ground.addComponent(new Transform({
      position: { x: 0, y: -200, z: 0 },
      scale: { x: 20, y: 1, z: 1 }
    }));
    ground.addComponent(new Sprite({
      texture: 'ground.png',
      size: { x: 800, y: 40 }
    }));
    ground.addComponent(new RigidBody({
      type: 'static',
      shape: new BoxShape({ x: 400, y: 20, z: 1 })
    }));
    
    // Floating platform
    const platform = this.createObject();
    platform.addComponent(new Transform({
      position: { x: 200, y: -50, z: 0 },
      scale: { x: 3, y: 1, z: 1 }
    }));
    platform.addComponent(new Sprite({
      texture: 'platform.png',
      size: { x: 120, y: 40 }
    }));
    platform.addComponent(new RigidBody({
      type: 'static',
      shape: new BoxShape({ x: 60, y: 20, z: 1 })
    }));
  }
}
```

### Step 2: Create Player Controller

```typescript
// src/game/components/PlayerController.ts
import { Component, InputEngine, Vector3 } from 'procedural-pixel-engine';

export class PlayerController extends Component {
  private input: InputEngine;
  private moveSpeed: number = 200;
  private jumpForce: number = 500;
  private isGrounded: boolean = false;
  
  constructor() {
    super();
  }
  
  onAttach(): void {
    this.input = this.engine.getInput();
  }
  
  update(deltaTime: number): void {
    const transform = this.entity.getComponent(Transform);
    const body = this.entity.getComponent(RigidBody);
    
    if (!transform || !body) return;
    
    // Handle input
    const keyboard = this.input.getKeyboard();
    
    // Movement
    let moveX = 0;
    if (keyboard.isKeyDown('ArrowLeft') || keyboard.isKeyDown('KeyA')) {
      moveX = -1;
    } else if (keyboard.isKeyDown('ArrowRight') || keyboard.isKeyDown('KeyD')) {
      moveX = 1;
    }
    
    // Apply movement
    if (moveX !== 0) {
      body.applyForce({ x: moveX * this.moveSpeed, y: 0, z: 0 });
    }
    
    // Jump
    if ((keyboard.isKeyPressed('Space') || keyboard.isKeyPressed('ArrowUp') || keyboard.isKeyPressed('KeyW')) && this.isGrounded) {
      body.applyImpulse({ x: 0, y: this.jumpForce, z: 0 });
      this.isGrounded = false;
    }
  }
  
  onCollision(other: Entity): void {
    // Check if landed on ground
    const otherTransform = other.getComponent(Transform);
    const myTransform = this.entity.getComponent(Transform);
    
    if (otherTransform && myTransform) {
      if (otherTransform.y < myTransform.y) {
        this.isGrounded = true;
      }
    }
  }
}
```

### Step 3: Create Custom Components

```typescript
// src/game/components/Transform.ts
export class Transform extends Component {
  public position: Vector3;
  public rotation: Vector3;
  public scale: Vector3;
  
  constructor(data: Partial<TransformData> = {}) {
    super();
    this.position = data.position || { x: 0, y: 0, z: 0 };
    this.rotation = data.rotation || { x: 0, y: 0, z: 0 };
    this.scale = data.scale || { x: 1, y: 1, z: 1 };
  }
  
  getWorldPosition(): Vector3 {
    // Calculate world position based on parent hierarchy
    return this.position;
  }
  
  translate(offset: Vector3): void {
    this.position.x += offset.x;
    this.position.y += offset.y;
    this.position.z += offset.z;
  }
  
  rotate(offset: Vector3): void {
    this.rotation.x += offset.x;
    this.rotation.y += offset.y;
    this.rotation.z += offset.z;
  }
  
  setScale(scale: Vector3): void {
    this.scale = scale;
  }
}

// src/game/components/Sprite.ts
export class Sprite extends Component {
  public texture: string;
  public size: Vector2;
  public color: Color;
  public visible: boolean;
  
  constructor(data: SpriteData) {
    super();
    this.texture = data.texture;
    this.size = data.size;
    this.color = data.color || { r: 1, g: 1, b: 1, a: 1 };
    this.visible = true;
  }
  
  setTexture(texture: string): void {
    this.texture = texture;
  }
  
  setSize(size: Vector2): void {
    this.size = size;
  }
  
  setColor(color: Color): void {
    this.color = color;
  }
  
  setVisible(visible: boolean): void {
    this.visible = visible;
  }
}
```

### Step 4: Main Game Loop

```typescript
// src/main.ts
import { ProceduralPixelEngine } from 'procedural-pixel-engine';
import { GameScene } from './game/scenes/GameScene';

async function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  const engine = new ProceduralPixelEngine({
    canvas: canvas,
    renderer: 'webgl2',
    physics: true,
    audio: true,
    input: true
  });
  
  try {
    await engine.initialize();
    
    // Create and load the game scene
    const gameScene = new GameScene(engine);
    engine.setScene(gameScene);
    
    // Start the game loop
    engine.start();
    
    console.log('Game started successfully!');
    
  } catch (error) {
    console.error('Failed to start game:', error);
  }
}

main();
```

## Next Steps

### Add More Features

1. **Animation System**
   ```typescript
   // Load and play animations
   const animation = await engine.getAnimation().loadAnimation('walk.fbx');
   const player = engine.createPlayer(animation);
   player.play();
   ```

2. **Audio System**
   ```typescript
   // Load and play sounds
   const jumpSound = await engine.getAudio().loadSound('jump.wav');
   engine.getAudio().playSound(jumpSound);
   ```

3. **UI System**
   ```typescript
   // Create UI elements
   const ui = engine.getUI();
   const scoreLabel = ui.createWidget('label');
   scoreLabel.setText('Score: 0');
   ```

4. **Particle Effects**
   ```typescript
   // Create particle systems
   const particles = engine.createParticleSystem({
     texture: 'particle.png',
     count: 100,
     lifetime: 2.0
   });
   ```

### Optimize Performance

```typescript
// Enable performance optimizations
const performance = engine.getPerformance();
performance.enableOptimization('culling');
performance.enableOptimization('lod');
performance.enableOptimization('batching');

// Monitor performance
performance.onFrameDrop((fps) => {
  console.log(`Frame rate dropped to ${fps}`);
});
```

### Add Multiplayer

```typescript
// Setup networking
const networking = engine.getNetworking();
await networking.connect('ws://localhost:8080');

networking.onMessage((clientId, message) => {
  if (message.type === 'player_position') {
    // Update other player positions
  }
});

// Send player position
setInterval(() => {
  const position = player.getComponent(Transform).position;
  networking.send({
    type: 'player_position',
    data: position
  });
}, 100);
```

## Resources

### Documentation

- [API Reference](./API.md) - Complete API documentation
- [Architecture Guide](./ARCHITECTURE.md) - Engine architecture overview
- [Tutorials](./tutorials/) - Step-by-step tutorials
- [Examples](../examples/) - Example projects

### Community

- [Discord Server](https://discord.gg/procedural-pixel-engine) - Chat with other developers
- [GitHub Discussions](https://github.com/your-org/procedural-pixel-engine/discussions) - Ask questions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/procedural-pixel-engine) - Get help

### Tools

- [Asset Store](https://store.proceduralpixelengine.com) - Download assets and tools
- [Visual Editor](https://editor.proceduralpixelengine.com) - Online visual editor
- [Performance Profiler](https://profiler.proceduralpixelengine.com) - Performance analysis tools

### Learning Resources

- [Video Tutorials](https://youtube.com/procedural-pixel-engine) - Video tutorials
- [Blog](https://blog.proceduralpixelengine.com) - Development blog
- [Newsletter](https://newsletter.proceduralpixelengine.com) - Monthly updates

## Troubleshooting

### Common Issues

1. **Engine won't initialize**
   - Check browser compatibility
   - Ensure WebGL is enabled
   - Check console for error messages

2. **Poor performance**
   - Enable performance optimizations
   - Reduce texture sizes
   - Use object pooling

3. **Physics issues**
   - Check collision shapes
   - Verify physics world settings
   - Ensure proper mass values

### Getting Help

If you run into issues:

1. Check the [documentation](./API.md)
2. Search [GitHub issues](https://github.com/your-org/procedural-pixel-engine/issues)
3. Ask on [Discord](https://discord.gg/procedural-pixel-engine)
4. Create a new issue with detailed information

---

Happy game development! 🎮✨

This guide should help you get started with the Procedural Pixel Engine. For more advanced topics, check out the API documentation and tutorials.

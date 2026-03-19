# API Documentation

Welcome to the Procedural Pixel Engine API documentation. This comprehensive guide covers all aspects of the engine's API, from basic usage to advanced features.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Engine](#core-engine)
- [Rendering System](#rendering-system)
- [Physics Engine](#physics-engine)
- [Audio System](#audio-system)
- [Animation System](#animation-system)
- [Input System](#input-system)
- [UI System](#ui-system)
- [Networking](#networking)
- [AI & Machine Learning](#ai--machine-learning)
- [VR/AR Support](#vrar-support)
- [Mobile Platform](#mobile-platform)
- [Console Platform](#console-platform)
- [Security Features](#security-features)
- [Cloud Integration](#cloud-integration)
- [Performance Optimization](#performance-optimization)
- [Accessibility Features](#accessibility-features)
- [Social Features](#social-features)
- [Testing Framework](#testing-framework)
- [Utility Functions](#utility-functions)

## Getting Started

### Installation

```bash
npm install procedural-pixel-engine
```

### Basic Setup

```typescript
import { ProceduralPixelEngine } from 'procedural-pixel-engine';

// Create engine instance
const engine = new ProceduralPixelEngine({
  canvas: document.getElementById('game-canvas'),
  renderer: 'webgl2',
  physics: true,
  audio: true
});

// Initialize engine
await engine.initialize();

// Start game loop
engine.start();
```

### Configuration Options

```typescript
interface EngineConfig {
  canvas: HTMLCanvasElement;
  renderer: 'webgl2' | 'webgpu' | 'canvas2d';
  physics?: boolean | PhysicsConfig;
  audio?: boolean | AudioConfig;
  input?: boolean | InputConfig;
  ui?: boolean | UIConfig;
  networking?: boolean | NetworkingConfig;
  ai?: boolean | AIConfig;
  vr?: boolean | VRConfig;
  mobile?: boolean | MobileConfig;
  console?: boolean | ConsoleConfig;
  security?: boolean | SecurityConfig;
  cloud?: boolean | CloudConfig;
  performance?: boolean | PerformanceConfig;
  accessibility?: boolean | AccessibilityConfig;
  social?: boolean | SocialConfig;
  testing?: boolean | TestingConfig;
}
```

## Core Engine

### Engine Class

The main engine class that orchestrates all systems.

```typescript
class ProceduralPixelEngine {
  constructor(config: EngineConfig);
  
  // Lifecycle
  async initialize(): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  
  // Systems
  getRenderer(): Renderer;
  getPhysics(): PhysicsEngine;
  getAudio(): AudioEngine;
  getAnimation(): AnimationEngine;
  getInput(): InputEngine;
  getUI(): UIEngine;
  getNetworking(): NetworkingEngine;
  getAI(): AIEngine;
  getVR(): VREngine;
  getMobile(): MobileEngine;
  getConsole(): ConsoleEngine;
  getSecurity(): SecurityEngine;
  getCloud(): CloudEngine;
  getPerformance(): PerformanceEngine;
  getAccessibility(): AccessibilityEngine;
  getSocial(): SocialEngine;
  getTesting(): TestingEngine;
  
  // Utilities
  getVersion(): string;
  getPlatform(): Platform;
  getCapabilities(): EngineCapabilities;
  getStats(): EngineStats;
}
```

### Entity Component System (ECS)

```typescript
// Entity management
class Entity {
  constructor(id: string);
  
  addComponent<T extends Component>(component: T): void;
  removeComponent<T extends Component>(componentType: ComponentType<T>): void;
  getComponent<T extends Component>(componentType: ComponentType<T>): T | null;
  hasComponent<T extends Component>(componentType: ComponentType<T>): boolean;
  getComponents(): Component[];
  destroy(): void;
}

// Component system
class Component {
  constructor(data: ComponentData);
  
  getData(): ComponentData;
  setData(data: ComponentData): void;
  clone(): Component;
}

// System interface
interface System {
  update(deltaTime: number, entities: Entity[]): void;
  onEntityAdded(entity: Entity): void;
  onEntityRemoved(entity: Entity): void;
}

// World management
class World {
  constructor();
  
  createEntity(): Entity;
  destroyEntity(entity: Entity): void;
  getEntities(): Entity[];
  getEntitiesWithComponents(...componentTypes: ComponentType[]): Entity[];
  addSystem(system: System): void;
  removeSystem(system: System): void;
  update(deltaTime: number): void;
}
```

## Rendering System

### Renderer Interface

```typescript
interface Renderer {
  // Initialization
  initialize(canvas: HTMLCanvasElement, config: RendererConfig): Promise<void>;
  
  // Rendering
  clear(): void;
  render(scene: Scene, camera: Camera): void;
  present(): void;
  
  // Resources
  createTexture(data: TextureData): Texture;
  createShader(vertexSource: string, fragmentSource: string): Shader;
  createMesh(geometry: Geometry): Mesh;
  createMaterial(material: Material): Material;
  
  // Capabilities
  getCapabilities(): RendererCapabilities;
  getStats(): RendererStats;
  
  // Configuration
  setViewport(x: number, y: number, width: number, height: number): void;
  setClearColor(r: number, g: number, b: number, a: number): void;
  enableFeature(feature: RendererFeature): void;
  disableFeature(feature: RendererFeature): void;
}
```

### Scene Management

```typescript
class Scene {
  constructor();
  
  // Objects
  addObject(object: SceneObject): void;
  removeObject(object: SceneObject): void;
  getObject(id: string): SceneObject | null;
  getObjects(): SceneObject[];
  
  // Hierarchy
  addChild(child: SceneObject): void;
  removeChild(child: SceneObject): void;
  getChildren(): SceneObject[];
  
  // Components
  addComponent<T extends Component>(component: T): void;
  removeComponent<T extends Component>(componentType: ComponentType<T>): void;
  getComponent<T extends Component>(componentType: ComponentType<T>): T | null;
  
  // Properties
  setActive(active: boolean): void;
  isActive(): boolean;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
}

class SceneObject {
  constructor();
  
  // Transform
  getPosition(): Vector3;
  setPosition(position: Vector3): void;
  getRotation(): Quaternion;
  setRotation(rotation: Quaternion): void;
  getScale(): Vector3;
  setScale(scale: Vector3): void;
  
  // Hierarchy
  getParent(): SceneObject | null;
  setParent(parent: SceneObject | null): void;
  getChildren(): SceneObject[];
  addChild(child: SceneObject): void;
  removeChild(child: SceneObject): void;
  
  // Components
  addComponent<T extends Component>(component: T): void;
  removeComponent<T extends Component>(componentType: ComponentType<T>): void;
  getComponent<T extends Component>(componentType: ComponentType<T>): T | null;
  hasComponent<T extends Component>(componentType: ComponentType<T>): boolean;
}
```

### Camera System

```typescript
class Camera {
  constructor();
  
  // Projection
  setPerspective(fov: number, aspect: number, near: number, far: number): void;
  setOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): void;
  
  // View
  lookAt(eye: Vector3, target: Vector3, up: Vector3): void;
  setPosition(position: Vector3): void;
  setRotation(rotation: Quaternion): void;
  
  // Properties
  getPosition(): Vector3;
  getRotation(): Quaternion;
  getViewMatrix(): Matrix4;
  getProjectionMatrix(): Matrix4;
  getViewProjectionMatrix(): Matrix4;
  
  // Frustum
  getFrustum(): Frustum;
  isInFrustum(position: Vector3, radius: number): boolean;
}

class OrthographicCamera extends Camera {
  constructor(left: number, right: number, bottom: number, top: number, near: number, far: number);
}

class PerspectiveCamera extends Camera {
  constructor(fov: number, aspect: number, near: number, far: number);
}
```

## Physics Engine

### Physics World

```typescript
class PhysicsWorld {
  constructor(config: PhysicsConfig);
  
  // Simulation
  step(deltaTime: number): void;
  setGravity(gravity: Vector3): void;
  getGravity(): Vector3;
  
  // Bodies
  addBody(body: PhysicsBody): void;
  removeBody(body: PhysicsBody): void;
  getBodies(): PhysicsBody[];
  
  // Collisions
  enableCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): void;
  disableCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): void;
  setCollisionCallback(callback: CollisionCallback): void;
  
  // Queries
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult[];
  sphereCast(center: Vector3, radius: number, maxDistance: number): SphereCastResult[];
  boxCast(center: Vector3, halfExtents: Vector3, maxDistance: number): BoxCastResult[];
  
  // Debugging
  setDebugRenderer(renderer: DebugRenderer): void;
  enableDebugRendering(enabled: boolean): void;
}
```

### Physics Bodies

```typescript
class PhysicsBody {
  constructor(config: BodyConfig);
  
  // Properties
  setPosition(position: Vector3): void;
  getPosition(): Vector3;
  setRotation(rotation: Quaternion): void;
  getRotation(): Quaternion;
  setVelocity(velocity: Vector3): void;
  getVelocity(): Vector3;
  setAngularVelocity(angularVelocity: Vector3): void;
  getAngularVelocity(): Vector3;
  setMass(mass: number): void;
  getMass(): number;
  setFriction(friction: number): void;
  getFriction(): number;
  setRestitution(restitution: number): void;
  getRestitution(): number;
  
  // Forces
  applyForce(force: Vector3, point?: Vector3): void;
  applyImpulse(impulse: Vector3, point?: Vector3): void;
  applyTorque(torque: Vector3): void;
  clearForces(): void;
  
  // Sleep state
  setSleeping(sleeping: boolean): void;
  isSleeping(): boolean;
  setSleepThreshold(threshold: number): void;
  getSleepThreshold(): number;
  
  // Events
  setCollisionCallback(callback: CollisionCallback): void;
  setSleepCallback(callback: SleepCallback): void;
}

class RigidBody extends PhysicsBody {
  constructor(shape: CollisionShape, mass: number);
}

class StaticBody extends PhysicsBody {
  constructor(shape: CollisionShape);
}

class KinematicBody extends PhysicsBody {
  constructor(shape: CollisionShape);
}
```

### Collision Shapes

```typescript
interface CollisionShape {
  getType(): CollisionShapeType;
  getAABB(transform: Transform): AABB;
  raycast(ray: Ray, transform: Transform): RaycastResult | null;
}

class BoxShape implements CollisionShape {
  constructor(halfExtents: Vector3);
  getHalfExtents(): Vector3;
}

class SphereShape implements CollisionShape {
  constructor(radius: number);
  getRadius(): number;
}

class CapsuleShape implements CollisionShape {
  constructor(radius: number, height: number);
  getRadius(): number;
  getHeight(): number;
}

class MeshShape implements CollisionShape {
  constructor(vertices: Vector3[], indices: number[]);
  getVertices(): Vector3[];
  getIndices(): number[];
}

class HeightfieldShape implements CollisionShape {
  constructor(heights: number[], width: number, length: number);
  getHeights(): number[];
  getWidth(): number;
  getLength(): number;
}
```

## Audio System

### Audio Engine

```typescript
class AudioEngine {
  constructor(config: AudioConfig);
  
  // Initialization
  initialize(): Promise<void>;
  
  // Listeners
  setListener(position: Vector3, orientation: Vector3, velocity: Vector3): void;
  getListener(): AudioListener;
  
  // Sounds
  loadSound(url: string): Promise<Sound>;
  createSound(buffer: AudioBuffer): Sound;
  playSound(sound: Sound, config?: SoundConfig): AudioInstance;
  
  // Music
  loadMusic(url: string): Promise<Music>;
  playMusic(music: Music, loop?: boolean): AudioInstance;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  
  // Effects
  createEffect(type: EffectType, config?: EffectConfig): AudioEffect;
  
  // Categories
  setCategoryVolume(category: AudioCategory, volume: number): void;
  getCategoryVolume(category: AudioCategory): number;
  muteCategory(category: AudioCategory): void;
  unmuteCategory(category: AudioCategory): void;
  
  // Global settings
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
  mute(): void;
  unmute(): void;
  
  // Debugging
  getStats(): AudioStats;
  enableDebug(enabled: boolean): void;
}
```

### Audio Objects

```typescript
class Sound {
  constructor(buffer: AudioBuffer);
  
  getBuffer(): AudioBuffer;
  getDuration(): number;
  getChannels(): number;
  getSampleRate(): number;
}

class Music {
  constructor(buffer: AudioBuffer);
  
  getBuffer(): AudioBuffer;
  getDuration(): number;
  getChannels(): number;
  getSampleRate(): number;
}

class AudioInstance {
  constructor(source: AudioBufferSourceNode);
  
  // Playback
  play(): void;
  pause(): void;
  stop(): void;
  isPlaying(): boolean;
  isPaused(): boolean;
  
  // Properties
  setVolume(volume: number): void;
  getVolume(): number;
  setPitch(pitch: number): void;
  getPitch(): number;
  setLoop(loop: boolean): void;
  getLoop(): boolean;
  
  // 3D audio
  setPosition(position: Vector3): void;
  getPosition(): Vector3;
  setVelocity(velocity: Vector3): void;
  getVelocity(): Vector3;
  setDirection(direction: Vector3): void;
  getDirection(): Vector3;
  setCone(innerAngle: number, outerAngle: number, outerGain: number): void;
  
  // Effects
  addEffect(effect: AudioEffect): void;
  removeEffect(effect: AudioEffect): void;
  getEffects(): AudioEffect[];
  
  // Events
  setEndedCallback(callback: () => void): void;
}

class AudioEffect {
  constructor(node: AudioNode);
  
  connect(destination: AudioNode): void;
  disconnect(): void;
  setBypass(bypass: boolean): void;
  isBypassed(): boolean;
}
```

## Animation System

### Animation Engine

```typescript
class AnimationEngine {
  constructor(config: AnimationConfig);
  
  // Animation clips
  loadAnimation(url: string): Promise<AnimationClip>;
  createAnimation(data: AnimationData): AnimationClip;
  
  // Animation players
  createPlayer(clip: AnimationClip): AnimationPlayer;
  createMixer(): AnimationMixer;
  
  // Animation graphs
  createGraph(): AnimationGraph;
  createStateMachine(): AnimationStateMachine;
  
  // Inverse kinematics
  createIKSolver(solverType: IKSolverType): IKSolver;
  
  // Performance
  setMaxAnimations(max: number): void;
  getMaxAnimations(): number;
  getStats(): AnimationStats;
}
```

### Animation Clips

```typescript
class AnimationClip {
  constructor(data: AnimationData);
  
  // Properties
  getName(): string;
  getDuration(): number;
  getFps(): number;
  getLoop(): boolean;
  
  // Keyframes
  getKeyframes(track: string): Keyframe[];
  addKeyframe(track: string, keyframe: Keyframe): void;
  removeKeyframe(track: string, time: number): void;
  
  // Evaluation
  evaluate(time: number): AnimationPose;
  evaluateAtNormalizedTime(normalizedTime: number): AnimationPose;
  
  // Events
  addEvent(time: number, event: AnimationEvent): void;
  removeEvent(time: number): event: AnimationEvent): void;
  getEvents(time: number, duration: number): AnimationEvent[];
}

class Keyframe {
  constructor(time: number, value: any, inTangent?: Vector3, outTangent?: Vector3);
  
  getTime(): number;
  getValue(): any;
  getInTangent(): Vector3 | null;
  getOutTangent(): Vector3 | null;
  setTime(time: number): void;
  setValue(value: any): void;
  setInTangent(tangent: Vector3): void;
  setOutTangent(tangent: Vector3): void;
}
```

### Animation Players

```typescript
class AnimationPlayer {
  constructor(clip: AnimationClip);
  
  // Playback
  play(): void;
  pause(): void;
  stop(): void;
  isPlaying(): boolean;
  isPaused(): boolean;
  
  // Time
  setTime(time: number): void;
  getTime(): number;
  getNormalizedTime(): number;
  
  // Properties
  setClip(clip: AnimationClip): void;
  getClip(): AnimationClip;
  setSpeed(speed: number): void;
  getSpeed(): number;
  setWeight(weight: number): void;
  getWeight(): number;
  setLoop(loop: boolean): void;
  getLoop(): boolean;
  
  // Evaluation
  evaluate(): AnimationPose;
  
  // Events
  setPlayCallback(callback: () => void): void;
  setPauseCallback(callback: () => void): void;
  setStopCallback(callback: () => void): void;
  setLoopCallback(callback: () => void): void;
}

class AnimationMixer {
  constructor();
  
  // Players
  addPlayer(player: AnimationPlayer): void;
  removePlayer(player: AnimationPlayer): void;
  getPlayers(): AnimationPlayer[];
  
  // Evaluation
  evaluate(): AnimationPose;
  
  // Layers
  addLayer(layer: AnimationLayer): void;
  removeLayer(layer: AnimationLayer): void;
  getLayers(): AnimationLayer[];
}
```

## Input System

### Input Engine

```typescript
class InputEngine {
  constructor(config: InputConfig);
  
  // Initialization
  initialize(): Promise<void>;
  
  // Devices
  getKeyboard(): Keyboard;
  getMouse(): Mouse;
  getGamepad(index: number): Gamepad | null;
  getTouch(): Touch;
  getVR(): VRInput | null;
  
  // Actions
  createAction(name: string, bindings: InputBinding[]): InputAction;
  getAction(name: string): InputAction | null;
  removeAction(name: string): void;
  
  // Mapping
  loadMapping(url: string): Promise<void>;
  saveMapping(url: string): void;
  resetMapping(): void;
  
  // Events
  on(event: InputEvent, callback: InputEventCallback): void;
  off(event: InputEvent, callback: InputEventCallback): void;
  
  // Settings
  setDeadzone(device: InputDeviceType, deadzone: number): void;
  getDeadzone(device: InputDeviceType): number;
  setSensitivity(device: InputDeviceType, sensitivity: number): void;
  getSensitivity(device: InputDeviceType): number;
}
```

### Input Devices

```typescript
class Keyboard {
  constructor();
  
  // Key state
  isKeyDown(key: KeyCode): boolean;
  isKeyUp(key: KeyCode): boolean;
  isKeyPressed(key: KeyCode): boolean;
  isKeyReleased(key: KeyCode): boolean;
  
  // Events
  onKeyDown(callback: (key: KeyCode) => void): void;
  onKeyUp(callback: (key: KeyCode) => void): void;
  onKeyPressed(callback: (key: KeyCode) => void): void;
  onKeyReleased(callback: (key: KeyCode) => void): void;
  
  // Modifiers
  isShiftDown(): boolean;
  isControlDown(): boolean;
  isAltDown(): boolean;
  isMetaDown(): boolean;
}

class Mouse {
  constructor();
  
  // Position
  getPosition(): Vector2;
  getDelta(): Vector2;
  getWheelDelta(): Vector2;
  
  // Buttons
  isButtonDown(button: MouseButton): boolean;
  isButtonUp(button: MouseButton): boolean;
  isButtonPressed(button: MouseButton): boolean;
  isButtonReleased(button: MouseButton): boolean;
  
  // Events
  onMouseMove(callback: (position: Vector2, delta: Vector2) => void): void;
  onMouseDown(callback: (button: MouseButton, position: Vector2) => void): void;
  onMouseUp(callback: (button: MouseButton, position: Vector2) => void): void;
  onWheel(callback: (delta: Vector2) => void): void;
  
  // Cursor
  setCursor(cursor: CursorStyle): void;
  getCursor(): CursorStyle;
  showCursor(): void;
  hideCursor(): void;
  lockCursor(): void;
  unlockCursor(): void;
  isCursorLocked(): boolean;
}

class Gamepad {
  constructor(index: number);
  
  // Connection
  isConnected(): boolean;
  getName(): string;
  getId(): string;
  
  // Buttons
  isButtonDown(button: GamepadButton): boolean;
  isButtonUp(button: GamepadButton): boolean;
  isButtonPressed(button: GamepadButton): boolean;
  isButtonReleased(button: GamepadButton): boolean;
  getButtonValue(button: GamepadButton): number;
  
  // Axes
  getAxis(axis: GamepadAxis): number;
  getAxisDelta(axis: GamepadAxis): number;
  
  // Vibration
  setVibration(leftMotor: number, rightMotor: number, duration?: number): void;
  stopVibration(): void;
  
  // Events
  onConnected(callback: () => void): void;
  onDisconnected(callback: () => void): void;
  onButtonDown(callback: (button: GamepadButton) => void): void;
  onButtonUp(callback: (button: GamepadButton) => void): void;
  onAxisMove(callback: (axis: GamepadAxis, value: number) => void): void;
}
```

## UI System

### UI Engine

```typescript
class UIEngine {
  constructor(config: UIConfig);
  
  // Initialization
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  
  // Hierarchy
  createWidget(type: WidgetType, parent?: Widget): Widget;
  destroyWidget(widget: Widget): void;
  getRootWidget(): Widget;
  
  // Layout
  setLayout(widget: Widget, layout: Layout): void;
  getLayout(widget: Widget): Layout;
  
  // Styling
  setStyle(widget: Widget, style: UIStyle): void;
  getStyle(widget: Widget): UIStyle;
  applyTheme(theme: UITheme): void;
  
  // Events
  addEventHandler(widget: Widget, event: UIEvent, handler: UIEventHandler): void;
  removeEventHandler(widget: Widget, event: UIEvent, handler: UIEventHandler): void;
  
  // Focus
  setFocus(widget: Widget): void;
  getFocusedWidget(): Widget | null;
  clearFocus(): void;
  
  // Accessibility
  setAccessibilityInfo(widget: Widget, info: AccessibilityInfo): void;
  getAccessibilityInfo(widget: Widget): AccessibilityInfo;
  
  // Debugging
  enableDebugRendering(enabled: boolean): void;
  getWidgetAtPosition(position: Vector2): Widget | null;
}
```

### UI Widgets

```typescript
class Widget {
  constructor(type: WidgetType);
  
  // Hierarchy
  getParent(): Widget | null;
  setParent(parent: Widget | null): void;
  getChildren(): Widget[];
  addChild(child: Widget): void;
  removeChild(child: Widget): void;
  
  // Properties
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  setFocusable(focusable: boolean): void;
  isFocusable(): boolean;
  
  // Transform
  getPosition(): Vector2;
  setPosition(position: Vector2): void;
  getSize(): Vector2;
  setSize(size: Vector2): void;
  getBounds(): Rectangle;
  
  // Events
  addEventHandler(event: UIEvent, handler: UIEventHandler): void;
  removeEventHandler(event: UIEvent, handler: UIEventHandler): void;
  hasEventHandler(event: UIEvent): boolean;
  
  // Styling
  setStyle(style: UIStyle): void;
  getStyle(): UIStyle;
  applyStyle(style: UIStyle): void;
  
  // Focus
  focus(): void;
  blur(): void;
  hasFocus(): boolean;
}

class Button extends Widget {
  constructor();
  
  // Text
  setText(text: string): void;
  getText(): string;
  
  // Events
  onClick(callback: () => void): void;
  onPressed(callback: () => void): void;
  onReleased(callback: () => void): void;
}

class Label extends Widget {
  constructor();
  
  // Text
  setText(text: string): void;
  getText(): string;
  setFont(font: Font): void;
  getFont(): Font;
  setColor(color: Color): void;
  getColor(): Color;
  setAlignment(alignment: TextAlignment): void;
  getAlignment(): TextAlignment;
}

class TextBox extends Widget {
  constructor();
  
  // Text
  setText(text: string): void;
  getText(): string;
  setPlaceholder(placeholder: string): void;
  getPlaceholder(): string;
  
  // Events
  onTextChanged(callback: (text: string) => void): void;
  onSubmit(callback: () => void): void;
}

class Panel extends Widget {
  constructor();
  
  // Layout
  setLayout(layout: Layout): void;
  getLayout(): Layout;
  
  // Scrolling
  setScrollable(scrollable: boolean): void;
  isScrollable(): boolean;
  setScrollPosition(position: Vector2): void;
  getScrollPosition(): Vector2;
  getScrollSize(): Vector2;
}
```

## Networking

### Networking Engine

```typescript
class NetworkingEngine {
  constructor(config: NetworkingConfig);
  
  // Connection
  connect(url: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getConnectionState(): ConnectionState;
  
  // Messages
  send(message: NetworkMessage, reliable?: boolean): void;
  sendToClient(clientId: string, message: NetworkMessage, reliable?: boolean): void;
  broadcast(message: NetworkMessage, reliable?: boolean): void;
  
  // Events
  onConnect(callback: (clientId: string) => void): void;
  onDisconnect(callback: (clientId: string) => void): void;
  onMessage(callback: (clientId: string, message: NetworkMessage) => void): void;
  onError(callback: (error: NetworkError) => void): void;
  
  // Server
  startServer(port: number): Promise<void>;
  stopServer(): void;
  isServerRunning(): boolean;
  getClients(): NetworkClient[];
  
  // Client
  getClientId(): string | null;
  getPing(): number;
  getStats(): NetworkStats;
  
  // Security
  enableEncryption(enabled: boolean): void;
  isEncryptionEnabled(): boolean;
  setCompression(enabled: boolean): void;
  isCompressionEnabled(): boolean;
}
```

### Network Messages

```typescript
class NetworkMessage {
  constructor(type: string, data: any);
  
  getType(): string;
  getData(): any;
  setType(type: string): void;
  setData(data: any): void;
  
  // Serialization
  serialize(): ArrayBuffer;
  static deserialize(buffer: ArrayBuffer): NetworkMessage;
  
  // Reliability
  setReliable(reliable: boolean): void;
  isReliable(): boolean;
  setOrdered(ordered: boolean): void;
  isOrdered(): boolean;
  
  // Priority
  setPriority(priority: MessagePriority): void;
  getPriority(): MessagePriority;
}

class NetworkClient {
  constructor(id: string, connection: Connection);
  
  getId(): string;
  getConnectionState(): ConnectionState;
  getPing(): number;
  getStats(): ClientStats;
  
  // Communication
  send(message: NetworkMessage, reliable?: boolean): void;
  disconnect(): void;
  
  // Events
  onDisconnect(callback: () => void): void;
  onMessage(callback: (message: NetworkMessage) => void): void;
  onError(callback: (error: NetworkError) => void): void;
}
```

## AI & Machine Learning

### AI Engine

```typescript
class AIEngine {
  constructor(config: AIConfig);
  
  // Agents
  createAgent(config: AgentConfig): AIAgent;
  destroyAgent(agent: AIAgent): void;
  getAgents(): AIAgent[];
  
  // Behaviors
  createBehaviorTree(tree: BehaviorTreeData): BehaviorTree;
  createStateMachine(states: StateMachineData): StateMachine;
  createNeuralNetwork(layers: number[]): NeuralNetwork;
  
  // Pathfinding
  createPathfinder(world: World): Pathfinder;
  findPath(start: Vector3, end: Vector3): Vector3[];
  
  // Learning
  createReinforcementLearner(config: RLConfig): ReinforcementLearner;
  createGeneticAlgorithm(config: GAConfig): GeneticAlgorithm;
  
  // Perception
  createSensor(type: SensorType, config: SensorConfig): Sensor;
  
  // Performance
  setMaxAgents(max: number): void;
  getMaxAgents(): number;
  getStats(): AIStats;
}
```

### AI Agents

```typescript
class AIAgent {
  constructor(config: AgentConfig);
  
  // Lifecycle
  update(deltaTime: number): void;
  destroy(): void;
  
  // Behavior
  setBehavior(behavior: Behavior): void;
  getBehavior(): Behavior | null;
  
  // State
  setState(state: AgentState): void;
  getState(): AgentState;
  
  // Movement
  setPosition(position: Vector3): void;
  getPosition(): Vector3;
  setVelocity(velocity: Vector3): void;
  getVelocity(): Vector3;
  setTarget(target: Vector3): void;
  getTarget(): Vector3;
  
  // Perception
  addSensor(sensor: Sensor): void;
  removeSensor(sensor: Sensor): void;
  getSensors(): Sensor[];
  perceive(): Perception[];
  
  // Memory
  addMemory(memory: Memory): void;
  removeMemory(memory: Memory): void;
  getMemories(): Memory[];
  forgetMemories(olderThan: number): void;
  
  // Events
  onStateChanged(callback: (oldState: AgentState, newState: AgentState) => void): void;
  onTargetReached(callback: () => void): void;
  onPerception(callback: (perceptions: Perception[]) => void): void;
}
```

## Performance Optimization

### Performance Engine

```typescript
class PerformanceEngine {
  constructor(config: PerformanceConfig);
  
  // Profiling
  startProfile(name: string): ProfileSession;
  stopProfile(session: ProfileSession): ProfileResult;
  getProfiles(): ProfileResult[];
  
  // Monitoring
  getMetrics(): PerformanceMetrics;
  getStats(): PerformanceStats;
  
  // Optimization
  enableOptimization(type: OptimizationType): void;
  disableOptimization(type: OptimizationType): void;
  isOptimizationEnabled(type: OptimizationType): boolean;
  
  // Memory management
  getMemoryUsage(): MemoryUsage;
  garbageCollect(): void;
  setMemoryLimit(limit: number): void;
  getMemoryLimit(): number;
  
  // Frame rate
  getFrameRate(): number;
  getFrameTime(): number;
  setTargetFrameRate(fps: number): void;
  getTargetFrameRate(): number;
  
  // Quality settings
  setQualityLevel(level: QualityLevel): void;
  getQualityLevel(): QualityLevel;
  autoAdjustQuality(enabled: boolean): void;
  isAutoQualityEnabled(): boolean;
  
  // Debugging
  enableDebugOverlay(enabled: boolean): void;
  isDebugOverlayEnabled(): boolean;
  captureFrame(): FrameCapture;
}
```

## Usage Examples

### Basic 2D Game Setup

```typescript
import { ProceduralPixelEngine } from 'procedural-pixel-engine';

// Create engine
const engine = new ProceduralPixelEngine({
  canvas: document.getElementById('game-canvas'),
  renderer: 'webgl2',
  physics: true,
  audio: true,
  input: true
});

// Initialize
await engine.initialize();

// Create scene
const scene = engine.createScene();

// Create camera
const camera = engine.createCamera('orthographic', -400, 400, -300, 300, 0.1, 1000);

// Create player
const player = scene.createObject();
player.addComponent(new Transform({ position: { x: 0, y: 0, z: 0 } }));
player.addComponent(new Sprite({ texture: 'player.png' }));
player.addComponent(new RigidBody(new BoxShape({ x: 32, y: 32, z: 1 }), 1));

// Handle input
engine.getInput().getKeyboard().onKeyPressed((key) => {
  const body = player.getComponent(RigidBody);
  if (key === 'ArrowLeft') {
    body.applyForce({ x: -100, y: 0, z: 0 });
  } else if (key === 'ArrowRight') {
    body.applyForce({ x: 100, y: 0, z: 0 });
  }
});

// Start game loop
engine.start();
```

### Advanced 3D Scene

```typescript
// Create 3D scene
const scene = engine.createScene();

// Create camera
const camera = engine.createCamera('perspective', 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setPosition({ x: 0, y: 5, z: 10 });
camera.lookAt({ x: 0, y: 0, z: 0 });

// Create lighting
const directionalLight = scene.createObject();
directionalLight.addComponent(new DirectionalLight({
  color: { r: 1, g: 1, b: 1 },
  intensity: 1.0,
  castShadows: true
}));
directionalLight.setPosition({ x: 10, y: 10, z: 10 });

// Create ground
const ground = scene.createObject();
ground.addComponent(new Transform({ position: { x: 0, y: -1, z: 0 } }));
ground.addComponent(new MeshRenderer({
  mesh: new BoxMesh({ x: 20, y: 1, z: 20 }),
  material: new PBRMaterial({
    albedo: { r: 0.5, g: 0.5, b: 0.5 },
    metallic: 0.0,
    roughness: 0.8
  })
}));
ground.addComponent(new StaticBody(new BoxShape({ x: 10, y: 0.5, z: 10 })));

// Create animated character
const character = scene.createObject();
character.addComponent(new Transform({ position: { x: 0, y: 0, z: 0 } }));
character.addComponent(new SkinnedMeshRenderer({
  mesh: await engine.loadMesh('character.fbx'),
  material: new PBRMaterial({
    albedo: { r: 0.8, g: 0.2, b: 0.2 },
    metallic: 0.0,
    roughness: 0.9
  })
}));
character.addComponent(new RigidBody(new CapsuleShape(0.5, 1.8), 70));

// Load animation
const walkAnimation = await engine.getAnimation().loadAnimation('walk.fbx');
const animationPlayer = engine.getAnimation().createPlayer(walkAnimation);
character.addComponent(animationPlayer);

// Play animation
animationPlayer.play();
```

This comprehensive API documentation provides a complete reference for the Procedural Pixel Engine, covering all major systems and their usage patterns. The API is designed to be intuitive, powerful, and extensible, supporting both simple 2D games and complex 3D applications.

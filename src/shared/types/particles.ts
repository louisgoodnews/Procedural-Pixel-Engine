export interface ParticleEmitter {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;

  // Emitter properties
  emissionRate: number; // particles per second
  burstCount?: number; // for burst effects
  burstDelay?: number; // delay before burst
  lifetime: number; // particle lifetime in seconds
  maxParticles: number; // maximum active particles

  // Spawn properties
  spawnShape: "point" | "circle" | "rectangle" | "cone";
  spawnRadius?: number; // for circle/cone shapes
  spawnWidth?: number; // for rectangle shapes
  spawnHeight?: number; // for rectangle shapes
  spawnAngle?: number; // for cone shapes (in radians)

  // Initial velocity
  velocityMode: "directional" | "radial" | "random";
  velocityMin: number;
  velocityMax: number;
  directionAngle?: number; // for directional mode (in radians)
  directionSpread?: number; // angle spread for directional mode (in radians)

  // Physics properties
  gravityMode: "none" | "world" | "local";
  gravityX: number;
  gravityY: number;
  accelerationX: number;
  accelerationY: number;
  damping: number; // velocity damping factor (0-1)

  // Visual properties
  sizeMode: "constant" | "curve" | "random";
  sizeStart: number;
  sizeEnd?: number;
  sizeRandomness?: number;

  colorMode: "constant" | "gradient" | "random";
  colorStart: string; // hex color
  colorEnd?: string; // hex color for gradient
  colorRandomness?: string[]; // array of colors for random mode

  opacityMode: "constant" | "fade" | "curve";
  opacityStart: number; // 0-1
  opacityEnd?: number; // 0-1
  opacityCurve?: number; // curve exponent

  // Animation properties
  rotationMode: "none" | "constant" | "random";
  rotationSpeed: number; // radians per second
  rotationRandomness?: number;

  // Blend modes
  blendMode: "normal" | "add" | "multiply" | "screen";

  // Performance settings
  cullingDistance?: number; // max distance from camera
  performanceBudget?: number; // max ms per frame

  // Logic integration
  logicTriggers?: ParticleLogicTrigger[];
}

export interface ParticleLogicTrigger {
  id: string;
  type: "on_spawn" | "on_death" | "on_collision" | "on_timer";
  timerDelay?: number; // for timer triggers
  eventName?: string; // custom event name
  targetGraph?: string; // logic graph to execute
}

export interface ParticleSystem {
  emitters: ParticleEmitter[];
  globalSettings: {
    maxTotalParticles: number;
    performanceMode: boolean;
    debugMode: boolean;
  };
}

export interface ParticleComponent {
  emitterId: string;
  active: boolean;
  emitTime: number; // when this emitter started emitting
  lastEmitTime: number; // last time a particle was emitted
  particleCount: number; // current active particle count
}

export interface ParticleInstance {
  id: string;
  emitterId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  life: number; // 0-1, where 1 is newborn, 0 is dead
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  createdAt: number;
}

export interface VFXPreset {
  id: string;
  name: string;
  category: "explosion" | "fire" | "smoke" | "magic" | "water" | "custom";
  description: string;
  emitterTemplate: Partial<ParticleEmitter>;
  previewImage?: string; // base64 encoded preview
}

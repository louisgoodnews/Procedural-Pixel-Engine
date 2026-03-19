import type {
  ColliderComponent,
  PhysicsBodyComponent,
  PixelArtComponent,
  PixelBlueprint,
  PositionComponent,
  VelocityComponent,
} from "../shared/types";
import type { AudioComponent, AudioRuntime } from "../shared/types/audio";
import type { ParticleComponent } from "../shared/types/particles";
import type { InputState } from "./InputState";

export interface ActiveParticle {
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
  age: number; // actual age in seconds
  maxAge: number; // lifetime in seconds
}

export interface EngineComponents {
  audioComponent: AudioComponent;
  collider: ColliderComponent;
  particleComponent: ParticleComponent;
  physicsBody: PhysicsBodyComponent;
  pixelArt: PixelArtComponent;
  position: PositionComponent;
  renderLayer: {
    order: number;
  };
  velocity: VelocityComponent;
}

export interface CameraResource {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportResource {
  width: number;
  height: number;
  background: string;
  logicalWidth: number;
  logicalHeight: number;
  displayScale: number;
}

export interface RenderStatsResource {
  drawCalls: number;
  visibleEntities: number;
}

export interface SystemBenchmark {
  durationMs: number;
  phase: "render" | "update";
  systemName: string;
}

export interface RuntimeMetricsResource {
  currentFps: number;
  heapUsedMb: number | null;
  lowPerformanceMode: boolean;
  namedBenchmarks: {
    logicGraphSystemMs: number;
    physicsSystemMs: number;
    renderSystemMs: number;
  };
  selectedSnapshotOffsetMs: number;
  stressTestActive: boolean;
  systemBenchmarks: SystemBenchmark[];
  tracedNodesByAsset: Record<string, string[]>;
}

export interface WorldSnapshotRecord {
  components: Record<string, unknown>;
  id: number;
}

export interface WorldSnapshotResource {
  createdAt: string;
  entities: WorldSnapshotRecord[];
  nextEntityId: number;
  resources: Record<string, unknown>;
}

export interface ArchitectureRuntimeResource {
  componentTemplates: string[];
  eventDefinitions: string[];
  globalSystems: string[];
  globalVariables: Record<string, number>;
  systemExecutionCounts: Record<string, number>;
}

export interface EventBusResource {
  frameEvents: string[];
}

export interface LogicRuntimeResource {
  timerState: Record<string, { elapsed: number }>;
}

export interface PhysicsDebugContact {
  entityA: number;
  entityB: number;
  isTrigger: boolean;
  layerA: string;
  layerB: string;
}

export interface PhysicsRuntimeResource {
  contacts: PhysicsDebugContact[];
  fixedDeltaMs: number;
  gravity: {
    x: number;
    y: number;
  };
}

export interface ParticleRuntimeResource {
  allParticles: ActiveParticle[];
  activeEmitters: number;
  totalEmitted: number;
  performanceMode: boolean;
}

export interface EngineResources {
  architectureRuntime: ArchitectureRuntimeResource;
  audioRuntime: AudioRuntime;
  blueprintLibrary: Map<string, PixelBlueprint>;
  camera: CameraResource;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  eventBus: EventBusResource;
  inputState: InputState;
  interactionState: {
    confirmPressed: boolean;
    cancelPressed: boolean;
  };
  logicRuntime: LogicRuntimeResource;
  particleRuntime: ParticleRuntimeResource;
  physicsRuntime: PhysicsRuntimeResource;
  renderStats: RenderStatsResource;
  runtimeMetrics: RuntimeMetricsResource;
  snapshotState: WorldSnapshotResource | null;
  viewport: ViewportResource;
}

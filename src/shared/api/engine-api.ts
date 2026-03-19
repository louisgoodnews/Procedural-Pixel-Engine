import type {
  ColliderComponent,
  LogicGraph,
  PhysicsBodyComponent,
  PixelBlueprint,
  PositionComponent,
  VelocityComponent,
} from "../types";

export interface EnginePermissionManifest {
  editor: string[];
  filesystem: string[];
  runtime: string[];
}

export interface EngineRuntimeEvent {
  eventType:
    | "component-modified"
    | "entity-destroyed"
    | "entity-spawned"
    | "logic-graph-set"
    | "session-created"
    | "session-disposed"
    | "snapshot-created"
    | "snapshot-restored"
    | "step-completed";
  frame: number;
  payload: Record<string, unknown>;
  sequence: number;
  sessionId: string;
}

export interface EngineSyncState {
  entities: EngineEntitySnapshot[];
  events: EngineRuntimeEvent[];
  frame: number;
  sessionId: string;
  snapshots: Array<{ capturedAtFrame: number; index: number }>;
}

export interface EngineApiManifest {
  permissions: EnginePermissionManifest;
  schemaVersion: 1;
  supportedMethods: string[];
}

export interface EngineEntityHandle {
  entityId: number;
}

export interface EngineSessionHandle {
  sessionId: string;
}

export interface EngineSpawnRequest {
  blueprintName: string;
  collider?: ColliderComponent;
  logicGraph?: LogicGraph;
  physicsBody?: PhysicsBodyComponent;
  position: PositionComponent;
  velocity?: VelocityComponent;
}

export interface EngineComponentPatch {
  entityId: number;
  key: "collider" | "physicsBody" | "pixelArt" | "position" | "velocity";
  value: unknown;
}

export interface EngineGraphPatch {
  entityId: number;
  logicGraph: LogicGraph;
}

export interface EngineEntitySnapshot {
  assignedComponents: string[];
  blueprintName: string;
  collider?: ColliderComponent;
  entityId: number;
  physicsBody?: PhysicsBodyComponent;
  position: PositionComponent;
  velocity: VelocityComponent;
}

export interface HeadlessSimulationRequest {
  durationMs: number;
  entities: EngineSpawnRequest[];
  inputsByStep?: Record<number, string[]>;
  stepMs: number;
  viewport?: {
    height: number;
    width: number;
  };
}

export interface HeadlessSimulationResult {
  entities: EngineEntitySnapshot[];
  frames: number;
  tracesByEntity: Record<number, string[]>;
}

export interface EngineRuntimeApi {
  getApiManifest(): Promise<EngineApiManifest>;
  getSessionEventLog(sessionId: string): Promise<EngineRuntimeEvent[]>;
  getSessionPermissions(): Promise<EnginePermissionManifest>;
  getSessionSyncState(sessionId: string): Promise<EngineSyncState>;
  createHeadlessSession(
    request?: Pick<HeadlessSimulationRequest, "entities" | "viewport">,
  ): Promise<EngineSessionHandle>;
  destroyEntity(sessionId: string, entityId: number): Promise<void>;
  disposeHeadlessSession(sessionId: string): Promise<void>;
  listAssets(): Promise<string[]>;
  listEntities(sessionId: string): Promise<EngineEntitySnapshot[]>;
  listSnapshots(sessionId: string): Promise<Array<{ capturedAtFrame: number; index: number }>>;
  modifyComponent(sessionId: string, patch: EngineComponentPatch): Promise<void>;
  restoreSnapshot(sessionId: string, snapshotIndex: number): Promise<void>;
  runHeadlessSimulation(request: HeadlessSimulationRequest): Promise<HeadlessSimulationResult>;
  setLogicGraph(sessionId: string, patch: EngineGraphPatch): Promise<void>;
  snapshotWorld(sessionId: string): Promise<{ entities: EngineEntitySnapshot[]; frame: number }>;
  spawnEntity(sessionId: string, request: EngineSpawnRequest): Promise<EngineEntityHandle>;
  stepHeadlessSession(
    sessionId: string,
    request: Pick<HeadlessSimulationRequest, "inputsByStep" | "stepMs"> & { frames: number },
  ): Promise<{ frames: number }>;
}

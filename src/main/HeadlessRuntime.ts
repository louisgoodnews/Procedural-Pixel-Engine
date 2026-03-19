import { randomUUID } from "node:crypto";
import type {
  EngineApiManifest,
  EngineComponentPatch,
  EngineEntitySnapshot,
  EngineGraphPatch,
  EnginePermissionManifest,
  EngineRuntimeEvent,
  EngineSpawnRequest,
  EngineSyncState,
  HeadlessSimulationRequest,
  HeadlessSimulationResult,
} from "../shared/api/engine-api";
import type { LogicGraph, PixelBlueprint } from "../shared/types";

interface HeadlessEntityState extends EngineEntitySnapshot {
  logicGraph?: LogicGraph;
}

interface HeadlessRuntimeOptions {
  blueprints: Map<string, PixelBlueprint>;
}

interface HeadlessSessionState {
  blueprints: Map<string, PixelBlueprint>;
  entities: HeadlessEntityState[];
  events: EngineRuntimeEvent[];
  frame: number;
  id: string;
  nextEventSequence: number;
  snapshots: Array<{ capturedAtFrame: number; entities: HeadlessEntityState[]; index: number }>;
  timerState: Record<string, { elapsed: number }>;
  viewport: {
    height: number;
    width: number;
  };
}

const ENGINE_PERMISSION_MANIFEST: EnginePermissionManifest = {
  editor: ["project", "asset-management", "exports"],
  filesystem: ["asset-bundles", "blueprints", "logic-assets", "scenes"],
  runtime: ["entities", "headless-simulation", "logic-graphs", "snapshots"],
};

const ENGINE_API_MANIFEST: EngineApiManifest = {
  permissions: ENGINE_PERMISSION_MANIFEST,
  schemaVersion: 1,
  supportedMethods: [
    "createHeadlessSession",
    "destroyEntity",
    "disposeHeadlessSession",
    "getApiManifest",
    "getSessionEventLog",
    "getSessionPermissions",
    "getSessionSyncState",
    "listAssets",
    "listEntities",
    "listSnapshots",
    "modifyComponent",
    "restoreSnapshot",
    "runHeadlessSimulation",
    "setLogicGraph",
    "snapshotWorld",
    "spawnEntity",
    "stepHeadlessSession",
  ],
};

function cloneEntity(entity: HeadlessEntityState): HeadlessEntityState {
  return {
    ...entity,
    assignedComponents: [...entity.assignedComponents],
    collider: entity.collider ? { ...entity.collider, mask: [...entity.collider.mask] } : undefined,
    logicGraph: entity.logicGraph
      ? {
          version: 1,
          nodes: entity.logicGraph.nodes.map((node) => ({
            ...node,
            data: node.data ? { ...node.data } : undefined,
            position: { ...node.position },
          })),
          connections: entity.logicGraph.connections.map((connection) => ({
            ...connection,
            from: { ...connection.from },
            to: { ...connection.to },
          })),
        }
      : undefined,
    physicsBody: entity.physicsBody ? { ...entity.physicsBody } : undefined,
    position: { ...entity.position },
    velocity: { ...entity.velocity },
  };
}

function makeRng(seed = 1337): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createEntityState(
  request: EngineSpawnRequest,
  blueprints: Map<string, PixelBlueprint>,
  entityId: number,
): HeadlessEntityState {
  const blueprint = blueprints.get(request.blueprintName);
  return {
    assignedComponents: [...(blueprint?.assignedComponents ?? [])],
    blueprintName: request.blueprintName,
    collider: request.collider
      ? {
          ...request.collider,
          mask: [...request.collider.mask],
        }
      : undefined,
    entityId,
    logicGraph: request.logicGraph ?? blueprint?.logicGraph,
    physicsBody: request.physicsBody ? { ...request.physicsBody } : undefined,
    position: { ...request.position },
    velocity: { ...(request.velocity ?? { x: 0, y: 0 }) },
  };
}

function pushEvent(
  session: HeadlessSessionState,
  eventType: EngineRuntimeEvent["eventType"],
  payload: Record<string, unknown>,
): void {
  session.events.push({
    eventType,
    frame: session.frame,
    payload,
    sequence: session.nextEventSequence++,
    sessionId: session.id,
  });
}

function getColliderBounds(entity: HeadlessEntityState): {
  height: number;
  isTrigger: boolean;
  layer: string;
  left: number;
  mask: string[];
  radius?: number;
  shape: "circle" | "rect";
  top: number;
  width: number;
} {
  const collider = entity.collider;
  const width = collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.width ?? 16);
  const height =
    collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.height ?? 16);

  return {
    height,
    isTrigger: collider?.isTrigger ?? false,
    layer: collider?.layer ?? "default",
    left: entity.position.x + (collider?.offsetX ?? 0),
    mask: collider?.mask ? [...collider.mask] : ["default"],
    radius: collider?.radius,
    shape: collider?.shape ?? "rect",
    top: entity.position.y + (collider?.offsetY ?? 0),
    width,
  };
}

function collidersOverlap(left: HeadlessEntityState, right: HeadlessEntityState): boolean {
  const boundsA = getColliderBounds(left);
  const boundsB = getColliderBounds(right);

  if (!boundsA.mask.includes(boundsB.layer) && !boundsB.mask.includes(boundsA.layer)) {
    return false;
  }

  if (boundsA.shape === "circle" && boundsB.shape === "circle") {
    const centerAX = boundsA.left + (boundsA.radius ?? boundsA.width / 2);
    const centerAY = boundsA.top + (boundsA.radius ?? boundsA.height / 2);
    const centerBX = boundsB.left + (boundsB.radius ?? boundsB.width / 2);
    const centerBY = boundsB.top + (boundsB.radius ?? boundsB.height / 2);
    const dx = centerAX - centerBX;
    const dy = centerAY - centerBY;
    const distanceSquared = dx * dx + dy * dy;
    const radius = (boundsA.radius ?? boundsA.width / 2) + (boundsB.radius ?? boundsB.width / 2);
    return distanceSquared <= radius * radius;
  }

  return !(
    boundsA.left + boundsA.width < boundsB.left ||
    boundsB.left + boundsB.width < boundsA.left ||
    boundsA.top + boundsA.height < boundsB.top ||
    boundsB.top + boundsB.height < boundsA.top
  );
}

function applyDeterministicPhysicsStep(session: HeadlessSessionState, deltaSeconds: number): void {
  for (const entity of session.entities) {
    const body = entity.physicsBody;
    if (!body || body.bodyType === "static") {
      continue;
    }

    const gravityScale = body.gravityScale ?? 1;
    entity.velocity.y += 240 * gravityScale * deltaSeconds;

    const friction = Math.min(1, Math.max(0, body.friction ?? 0));
    const damping = Math.max(0, 1 - friction * deltaSeconds);
    entity.velocity.x *= damping;
    entity.velocity.y *= damping;

    entity.position.x += entity.velocity.x * deltaSeconds;
    entity.position.y += entity.velocity.y * deltaSeconds;

    if (body.constraintToViewport !== false) {
      const restitution = Math.max(0, body.restitution ?? 0);
      if (entity.position.x < 0 || entity.position.x > session.viewport.width) {
        entity.position.x = Math.max(0, Math.min(entity.position.x, session.viewport.width));
        entity.velocity.x *= -Math.max(0, restitution);
      }
      if (entity.position.y < 0 || entity.position.y > session.viewport.height) {
        entity.position.y = Math.max(0, Math.min(entity.position.y, session.viewport.height));
        entity.velocity.y *= -Math.max(0, restitution);
      }
    }
  }

  for (let index = 0; index < session.entities.length; index += 1) {
    const current = session.entities[index];
    for (let compareIndex = index + 1; compareIndex < session.entities.length; compareIndex += 1) {
      const other = session.entities[compareIndex];
      if (!collidersOverlap(current, other)) {
        continue;
      }

      const currentBody = current.physicsBody;
      const otherBody = other.physicsBody;
      const isTrigger = current.collider?.isTrigger || other.collider?.isTrigger;

      pushEvent(session, "step-completed", {
        contact: [current.entityId, other.entityId],
        isTrigger,
      });

      if (isTrigger) {
        continue;
      }

      const restitution = Math.max(currentBody?.restitution ?? 0, otherBody?.restitution ?? 0);

      if (currentBody?.bodyType !== "static") {
        current.velocity.x *= -Math.max(0, restitution);
        current.velocity.y *= -Math.max(0, restitution);
      }
      if (otherBody?.bodyType !== "static") {
        other.velocity.x *= -Math.max(0, restitution);
        other.velocity.y *= -Math.max(0, restitution);
      }
    }
  }
}

function evaluateTrigger(
  entity: HeadlessEntityState,
  frameEvents: string[],
  nodeId: string,
  type: string,
  data: Record<string, unknown> | undefined,
  pressedKeys: Set<string>,
  stepMs: number,
  timerState: Record<string, { elapsed: number }>,
): boolean {
  if (type === "OnInput") {
    return pressedKeys.has(typeof data?.code === "string" ? data.code : "Space");
  }

  if (type === "OnEvent") {
    return frameEvents.includes(typeof data?.eventName === "string" ? data.eventName : "");
  }

  if (type === "OnTimer") {
    const key = `${entity.entityId}:${nodeId}`;
    const timer = timerState[key] ?? { elapsed: 0 };
    timer.elapsed += stepMs;
    const duration = typeof data?.ms === "number" ? data.ms : 1000;
    if (timer.elapsed < duration) {
      timerState[key] = timer;
      return false;
    }
    timer.elapsed = 0;
    timerState[key] = timer;
    return true;
  }

  return false;
}

function evaluateCondition(
  entity: HeadlessEntityState,
  type: string,
  data: Record<string, unknown> | undefined,
  random: () => number,
): boolean {
  if (type === "IfComponentExists") {
    return entity.assignedComponents.includes(
      typeof data?.component === "string" ? data.component : "",
    );
  }

  if (type === "CompareVelocity") {
    const axis = data?.axis === "y" ? "y" : "x";
    const operator = typeof data?.operator === "string" ? data.operator : ">";
    const compareTo = typeof data?.value === "number" ? data.value : 0;
    const current = entity.velocity[axis];
    if (operator === ">=") return current >= compareTo;
    if (operator === "<=") return current <= compareTo;
    if (operator === "===") return current === compareTo;
    if (operator === "<") return current < compareTo;
    return current > compareTo;
  }

  if (type === "DiceRoll") {
    const sides = Math.max(1, typeof data?.sides === "number" ? Math.floor(data.sides) : 6);
    const target = typeof data?.target === "number" ? data.target : Math.ceil(sides / 2);
    return Math.floor(random() * sides) + 1 >= target;
  }

  return false;
}

function executeAction(
  entity: HeadlessEntityState,
  frameEvents: string[],
  type: string,
  data: Record<string, unknown> | undefined,
  blueprints: Map<string, PixelBlueprint>,
  frameIndex: number,
): void {
  if (type === "ModifyComponent") {
    const component = data?.component === "position" ? entity.position : entity.velocity;
    const field = data?.field === "y" ? "y" : "x";
    const mode = data?.mode === "set" ? "set" : "add";
    const value = typeof data?.value === "number" ? data.value : 0;
    component[field] = mode === "set" ? value : component[field] + value;
    return;
  }

  if (type === "RandomRange") {
    const field = data?.field === "y" ? "y" : "x";
    const min = typeof data?.min === "number" ? data.min : -1;
    const max = typeof data?.max === "number" ? data.max : 1;
    entity.velocity[field] = min + (((frameIndex + 1) % 97) / 96) * (max - min);
    return;
  }

  if (type === "MathOperation") {
    const field = data?.field === "y" ? "y" : "x";
    const operator = typeof data?.operator === "string" ? data.operator : "add";
    const value = typeof data?.value === "number" ? data.value : 0;
    if (operator === "subtract") entity.velocity[field] -= value;
    else if (operator === "multiply") entity.velocity[field] *= value;
    else if (operator === "divide")
      entity.velocity[field] =
        value === 0 ? entity.velocity[field] : entity.velocity[field] / value;
    else entity.velocity[field] += value;
    return;
  }

  if (type === "AssignComponentTemplate") {
    const componentName = typeof data?.componentName === "string" ? data.componentName : "";
    if (componentName && !entity.assignedComponents.includes(componentName)) {
      entity.assignedComponents.push(componentName);
      entity.assignedComponents.sort((left, right) => left.localeCompare(right));
    }
    return;
  }

  if (type === "EmitEvent") {
    const eventName = typeof data?.eventName === "string" ? data.eventName : "";
    if (eventName) frameEvents.push(eventName);
    return;
  }

  if (type === "ChangeBlueprint") {
    const blueprintName = typeof data?.blueprint === "string" ? data.blueprint : "";
    if (blueprints.has(blueprintName)) {
      entity.blueprintName = blueprintName;
      entity.logicGraph = blueprints.get(blueprintName)?.logicGraph;
    }
  }
}

function executeLogicGraph(
  entity: HeadlessEntityState,
  frameIndex: number,
  frameEvents: string[],
  blueprints: Map<string, PixelBlueprint>,
  pressedKeys: Set<string>,
  random: () => number,
  stepMs: number,
  timerState: Record<string, { elapsed: number }>,
  tracesByEntity: Record<number, string[]>,
): void {
  const graph = entity.logicGraph;
  if (!graph) return;

  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  for (const connection of graph.connections) {
    const targets = outgoing.get(connection.from.nodeId) ?? [];
    targets.push(connection.to.nodeId);
    outgoing.set(connection.from.nodeId, targets);
  }

  for (const node of graph.nodes) {
    if (node.kind !== "trigger") continue;
    if (
      !evaluateTrigger(
        entity,
        frameEvents,
        node.id,
        node.type,
        node.data,
        pressedKeys,
        stepMs,
        timerState,
      )
    ) {
      continue;
    }

    tracesByEntity[entity.entityId] = tracesByEntity[entity.entityId] ?? [];
    tracesByEntity[entity.entityId]?.push(node.id);
    const stack = [...(outgoing.get(node.id) ?? [])];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const nextId = stack.pop();
      if (!nextId || visited.has(nextId)) continue;
      visited.add(nextId);
      tracesByEntity[entity.entityId]?.push(nextId);
      const nextNode = nodes.get(nextId);
      if (!nextNode) continue;
      if (
        nextNode.kind === "condition" &&
        !evaluateCondition(entity, nextNode.type, nextNode.data, random)
      ) {
        continue;
      }
      if (nextNode.kind === "action") {
        executeAction(entity, frameEvents, nextNode.type, nextNode.data, blueprints, frameIndex);
      }
      stack.push(...(outgoing.get(nextId) ?? []));
    }
  }
}

function stepEntities(
  session: HeadlessSessionState,
  request: Pick<HeadlessSimulationRequest, "inputsByStep" | "stepMs"> & { frames: number },
): { frames: number; tracesByEntity: Record<number, string[]> } {
  const random = makeRng(session.frame + 1337);
  const stepMs = Math.max(1, request.stepMs);
  const tracesByEntity: Record<number, string[]> = {};

  for (let frameOffset = 0; frameOffset < request.frames; frameOffset += 1) {
    const frameEvents: string[] = [];
    const pressedKeys = new Set(request.inputsByStep?.[frameOffset] ?? []);
    for (const entity of session.entities) {
      tracesByEntity[entity.entityId] = tracesByEntity[entity.entityId] ?? [];
      executeLogicGraph(
        entity,
        session.frame + frameOffset,
        frameEvents,
        session.blueprints,
        pressedKeys,
        random,
        stepMs,
        session.timerState,
        tracesByEntity,
      );
    }
    applyDeterministicPhysicsStep(session, stepMs / 1000);
    pushEvent(session, "step-completed", {
      frameOffset,
      pressedKeys: [...pressedKeys],
      tracesByEntity,
    });
    session.frame += 1;
  }

  return { frames: request.frames, tracesByEntity };
}

export function runHeadlessSimulation(
  request: HeadlessSimulationRequest,
  options: HeadlessRuntimeOptions,
): HeadlessSimulationResult {
  const session = createSession(
    {
      entities: request.entities,
      viewport: request.viewport,
    },
    options,
  );
  const stepped = stepEntities(session, {
    frames: Math.max(0, Math.ceil(Math.max(0, request.durationMs) / Math.max(1, request.stepMs))),
    inputsByStep: request.inputsByStep,
    stepMs: request.stepMs,
  });
  return {
    entities: session.entities.map((entity) => toEntitySnapshot(entity)),
    frames: stepped.frames,
    tracesByEntity: stepped.tracesByEntity,
  };
}

function createSession(
  request: Pick<HeadlessSimulationRequest, "entities" | "viewport"> | undefined,
  options: HeadlessRuntimeOptions,
): HeadlessSessionState {
  let nextEntityId = 1;
  return {
    blueprints: new Map(options.blueprints),
    entities: (request?.entities ?? []).map((entry) =>
      createEntityState(entry, options.blueprints, nextEntityId++),
    ),
    events: [],
    frame: 0,
    id: randomUUID(),
    nextEventSequence: 1,
    snapshots: [],
    timerState: {},
    viewport: request?.viewport ?? { width: 640, height: 480 },
  };
}

function toEntitySnapshot(entity: HeadlessEntityState): EngineEntitySnapshot {
  return {
    assignedComponents: [...entity.assignedComponents],
    blueprintName: entity.blueprintName,
    collider: entity.collider
      ? {
          ...entity.collider,
          mask: [...entity.collider.mask],
        }
      : undefined,
    entityId: entity.entityId,
    physicsBody: entity.physicsBody ? { ...entity.physicsBody } : undefined,
    position: { ...entity.position },
    velocity: { ...entity.velocity },
  };
}

export class HeadlessRuntimeManager {
  private readonly blueprints: Map<string, PixelBlueprint>;
  private readonly sessions = new Map<string, HeadlessSessionState>();

  constructor(options: HeadlessRuntimeOptions) {
    this.blueprints = new Map(options.blueprints);
  }

  getApiManifest(): EngineApiManifest {
    return {
      ...ENGINE_API_MANIFEST,
      permissions: {
        ...ENGINE_API_MANIFEST.permissions,
        editor: [...ENGINE_API_MANIFEST.permissions.editor],
        filesystem: [...ENGINE_API_MANIFEST.permissions.filesystem],
        runtime: [...ENGINE_API_MANIFEST.permissions.runtime],
      },
      supportedMethods: [...ENGINE_API_MANIFEST.supportedMethods],
    };
  }

  getSessionPermissions(): EnginePermissionManifest {
    return {
      editor: [...ENGINE_PERMISSION_MANIFEST.editor],
      filesystem: [...ENGINE_PERMISSION_MANIFEST.filesystem],
      runtime: [...ENGINE_PERMISSION_MANIFEST.runtime],
    };
  }

  createSession(request?: Pick<HeadlessSimulationRequest, "entities" | "viewport">): string {
    const session = createSession(request, { blueprints: this.blueprints });
    this.sessions.set(session.id, session);
    pushEvent(session, "session-created", {
      entityCount: session.entities.length,
    });
    return session.id;
  }

  disposeSession(sessionId: string): void {
    const session = this.requireSession(sessionId);
    pushEvent(session, "session-disposed", {});
    this.sessions.delete(sessionId);
  }

  listAssets(): string[] {
    return [...this.blueprints.keys()].sort((left, right) => left.localeCompare(right));
  }

  listEntities(sessionId: string): EngineEntitySnapshot[] {
    return this.requireSession(sessionId).entities.map((entity) => toEntitySnapshot(entity));
  }

  getSessionEventLog(sessionId: string): EngineRuntimeEvent[] {
    return this.requireSession(sessionId).events.map((event) => ({
      ...event,
      payload: JSON.parse(JSON.stringify(event.payload)) as Record<string, unknown>,
    }));
  }

  getSessionSyncState(sessionId: string): EngineSyncState {
    const session = this.requireSession(sessionId);
    return {
      entities: this.listEntities(sessionId),
      events: this.getSessionEventLog(sessionId),
      frame: session.frame,
      sessionId,
      snapshots: this.listSnapshots(sessionId),
    };
  }

  spawnEntity(sessionId: string, request: EngineSpawnRequest): number {
    const session = this.requireSession(sessionId);
    const entityId = Math.max(0, ...session.entities.map((entity) => entity.entityId)) + 1;
    session.entities.push(createEntityState(request, session.blueprints, entityId));
    pushEvent(session, "entity-spawned", {
      blueprintName: request.blueprintName,
      entityId,
    });
    return entityId;
  }

  destroyEntity(sessionId: string, entityId: number): void {
    const session = this.requireSession(sessionId);
    session.entities = session.entities.filter((entity) => entity.entityId !== entityId);
    pushEvent(session, "entity-destroyed", { entityId });
  }

  modifyComponent(sessionId: string, patch: EngineComponentPatch): void {
    const entity = this.requireEntity(sessionId, patch.entityId);
    if (patch.key === "position" && patch.value && typeof patch.value === "object") {
      entity.position = { ...(patch.value as EngineEntitySnapshot["position"]) };
      pushEvent(this.requireSession(sessionId), "component-modified", {
        entityId: patch.entityId,
        key: patch.key,
      });
      return;
    }
    if (patch.key === "velocity" && patch.value && typeof patch.value === "object") {
      entity.velocity = { ...(patch.value as EngineEntitySnapshot["velocity"]) };
      pushEvent(this.requireSession(sessionId), "component-modified", {
        entityId: patch.entityId,
        key: patch.key,
      });
      return;
    }
    if (patch.key === "collider" && patch.value && typeof patch.value === "object") {
      entity.collider = {
        ...(patch.value as NonNullable<EngineEntitySnapshot["collider"]>),
        mask: [
          ...((patch.value as NonNullable<EngineEntitySnapshot["collider"]>).mask ?? ["default"]),
        ],
      };
      pushEvent(this.requireSession(sessionId), "component-modified", {
        entityId: patch.entityId,
        key: patch.key,
      });
      return;
    }
    if (patch.key === "physicsBody" && patch.value && typeof patch.value === "object") {
      entity.physicsBody = {
        ...(patch.value as NonNullable<EngineEntitySnapshot["physicsBody"]>),
      };
      pushEvent(this.requireSession(sessionId), "component-modified", {
        entityId: patch.entityId,
        key: patch.key,
      });
    }
  }

  setLogicGraph(sessionId: string, patch: EngineGraphPatch): void {
    this.requireEntity(sessionId, patch.entityId).logicGraph = patch.logicGraph;
    pushEvent(this.requireSession(sessionId), "logic-graph-set", {
      entityId: patch.entityId,
      nodeCount: patch.logicGraph.nodes.length,
    });
  }

  snapshotWorld(sessionId: string): { entities: EngineEntitySnapshot[]; frame: number } {
    const session = this.requireSession(sessionId);
    const snapshot = {
      capturedAtFrame: session.frame,
      entities: session.entities.map((entity) => cloneEntity(entity)),
      index: session.snapshots.length,
    };
    session.snapshots.push(snapshot);
    pushEvent(session, "snapshot-created", {
      frame: snapshot.capturedAtFrame,
      snapshotIndex: snapshot.index,
    });
    return {
      entities: snapshot.entities.map((entity) => toEntitySnapshot(entity)),
      frame: snapshot.capturedAtFrame,
    };
  }

  listSnapshots(sessionId: string): Array<{ capturedAtFrame: number; index: number }> {
    return this.requireSession(sessionId).snapshots.map((snapshot) => ({
      capturedAtFrame: snapshot.capturedAtFrame,
      index: snapshot.index,
    }));
  }

  restoreSnapshot(sessionId: string, snapshotIndex: number): void {
    const session = this.requireSession(sessionId);
    const snapshot = session.snapshots.find((entry) => entry.index === snapshotIndex);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotIndex} was not found.`);
    }

    session.entities = snapshot.entities.map((entity) => cloneEntity(entity));
    session.frame = snapshot.capturedAtFrame;
    pushEvent(session, "snapshot-restored", {
      frame: snapshot.capturedAtFrame,
      snapshotIndex,
    });
  }

  stepSession(
    sessionId: string,
    request: Pick<HeadlessSimulationRequest, "inputsByStep" | "stepMs"> & { frames: number },
  ): { frames: number; tracesByEntity: Record<number, string[]> } {
    return stepEntities(this.requireSession(sessionId), request);
  }

  private requireEntity(sessionId: string, entityId: number): HeadlessEntityState {
    const entity = this.requireSession(sessionId).entities.find(
      (candidate) => candidate.entityId === entityId,
    );
    if (!entity) {
      throw new Error(`Entity ${entityId} was not found in session ${sessionId}.`);
    }
    return entity;
  }

  private requireSession(sessionId: string): HeadlessSessionState {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Headless session ${sessionId} was not found.`);
    }
    return session;
  }
}

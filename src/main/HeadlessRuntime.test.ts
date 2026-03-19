import { describe, expect, test } from "bun:test";
import type { HeadlessSimulationRequest } from "../shared/api/engine-api";
import { runHeadlessSimulation, HeadlessRuntimeManager } from "./HeadlessRuntime";
import type { PixelBlueprint } from "../shared/types";
import { validateBlueprintShape } from "../shared/blueprintValidation";

// Create test blueprint for testing
const testPlayerBlueprint: PixelBlueprint = {
  blueprintCategory: "Component",
  name: "player",
  blueprintType: "Sprite",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "", "O", "O", "O", "O", "", ""],
    ["", "O", "S", "S", "S", "S", "O", ""],
  ],
  colorMap: {
    O: "#101820",
    S: "#f5d76e",
  },
  pixelSize: 12,
};

describe("runHeadlessSimulation", () => {
  test("executes a blueprint logic graph without rendering", () => {
    const request: HeadlessSimulationRequest = {
      durationMs: 100,
      entities: [
        {
          blueprintName: "player",
          position: { x: 10, y: 10 },
          velocity: { x: 0, y: 0 },
        },
      ],
      inputsByStep: {
        0: ["Space"],
      },
      stepMs: 16,
      viewport: { width: 320, height: 240 },
    };

    const result = runHeadlessSimulation(request, {
      blueprints: new Map([["player", testPlayerBlueprint]]),
    });

    expect(result.frames).toBeGreaterThan(0);
    expect(result.entities[0]?.velocity.y).toBeLessThan(0);
    expect(result.tracesByEntity[result.entities[0]?.entityId ?? 0]?.length).toBeGreaterThan(0);
  });

  test("supports session-based spawn, snapshot, step, and restore commands", () => {
    const manager = new HeadlessRuntimeManager({
      blueprints: new Map([["player", testPlayerBlueprint]]),
    });
    const sessionId = manager.createSession({
      entities: [],
      viewport: { width: 320, height: 240 },
    });

    const entityId = manager.spawnEntity(sessionId, {
      blueprintName: "player",
      position: { x: 8, y: 8 },
      velocity: { x: 0, y: 0 },
    });
    const snapshot = manager.snapshotWorld(sessionId);

    expect(snapshot.entities).toHaveLength(1);
    manager.stepSession(sessionId, {
      frames: 1,
      inputsByStep: { 0: ["Space"] },
      stepMs: 16,
    });
    expect(manager.listEntities(sessionId)[0]?.velocity.y).toBeLessThan(0);

    manager.restoreSnapshot(sessionId, 0);
    expect(manager.listEntities(sessionId)[0]?.velocity.y).toBe(0);

    manager.destroyEntity(sessionId, entityId);
    expect(manager.listEntities(sessionId)).toHaveLength(0);
    manager.disposeSession(sessionId);
  });

  test("emits session events and exposes sync state for automation", () => {
    const manager = new HeadlessRuntimeManager({
      blueprints: new Map([["player", testPlayerBlueprint]]),
    });
    const sessionId = manager.createSession({
      entities: [],
      viewport: { width: 320, height: 240 },
    });

    const handle = manager.spawnEntity(sessionId, {
      blueprintName: "player",
      position: { x: 24, y: 24 },
      velocity: { x: 0, y: 0 },
    });

    manager.modifyComponent(sessionId, {
      entityId: handle,
      key: "velocity",
      value: { x: 6, y: -12 },
    });
    manager.snapshotWorld(sessionId);

    const events = manager.getSessionEventLog(sessionId);
    const syncState = manager.getSessionSyncState(sessionId);

    expect(manager.getApiManifest().supportedMethods).toContain("getSessionSyncState");
    expect(manager.getSessionPermissions().runtime).toContain("snapshots");
    expect(events.some((entry) => entry.eventType === "entity-spawned")).toBe(true);
    expect(events.some((entry) => entry.eventType === "component-modified")).toBe(true);
    expect(syncState.sessionId).toBe(sessionId);
    expect(syncState.snapshots).toHaveLength(1);
    expect(syncState.entities).toHaveLength(1);
  });

  test("applies deterministic collider and body settings during stepping", () => {
    const manager = new HeadlessRuntimeManager({
      blueprints: new Map([["player", testPlayerBlueprint]]),
    });
    const sessionId = manager.createSession({
      entities: [
        {
          blueprintName: "player",
          collider: {
            height: 16,
            layer: "actors",
            mask: ["actors"],
            shape: "rect",
            width: 16,
          },
          physicsBody: {
            bodyType: "dynamic",
            friction: 0,
            gravityScale: 0,
            restitution: 1,
          },
          position: { x: 64, y: 64 },
          velocity: { x: 10, y: 0 },
        },
        {
          blueprintName: "player",
          collider: {
            height: 16,
            layer: "actors",
            mask: ["actors"],
            shape: "rect",
            width: 16,
          },
          physicsBody: {
            bodyType: "static",
            gravityScale: 0,
            restitution: 1,
          },
          position: { x: 64, y: 64 },
          velocity: { x: 0, y: 0 },
        },
      ],
      viewport: { width: 320, height: 240 },
    });

    manager.stepSession(sessionId, { frames: 1, stepMs: 16 });
    const moved = manager.listEntities(sessionId)[0];

    expect(moved?.velocity.x).toBe(-10);
    expect(manager.getSessionEventLog(sessionId).some((entry) => entry.payload.contact)).toBe(true);
  });
});

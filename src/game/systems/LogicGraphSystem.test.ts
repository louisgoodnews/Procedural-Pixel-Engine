import { describe, expect, test } from "bun:test";
import { InputState } from "../../engine/InputState";
import { World } from "../../engine/World";
import { defaultInputBindings } from "../../engine/input";
import type { EngineResources } from "../../engine/types";
import type { PixelBlueprint } from "../../shared/types";
import type { GameComponents } from "../types";
import { LogicGraphSystem } from "./LogicGraphSystem";

describe("LogicGraphSystem", () => {
  test("executes timer-driven graph actions against ECS components", () => {
    const blueprint: PixelBlueprint = {
      name: "logic-test",
      schemaVersion: 1,
      revision: 1,
      updatedAt: "2026-03-15T00:00:00.000Z",
      zone: "test-zone",
      logicGraph: {
        version: 1,
        nodes: [
          {
            id: "timer-1",
            kind: "trigger",
            type: "OnTimer",
            position: { x: 10, y: 10 },
            data: { ms: 10 },
          },
          {
            id: "action-1",
            kind: "action",
            type: "ModifyComponent",
            position: { x: 160, y: 10 },
            data: {
              component: "velocity",
              field: "x",
              mode: "add",
              value: 6,
            },
          },
        ],
        connections: [
          {
            id: "edge-1",
            from: { nodeId: "timer-1", port: "out" },
            to: { nodeId: "action-1", port: "in" },
          },
        ],
      },
      matrix: [["A"]],
      colorMap: { A: "#ffffff" },
      pixelSize: 1,
    };

    const world = new World<GameComponents, EngineResources>();
    const entity = world.createEntity();
    world.addComponents(entity, {
      blueprintRef: { name: blueprint.name },
      velocity: { x: 0, y: 0 },
    });

    world.setResource("blueprintLibrary", new Map([[blueprint.name, blueprint]]));
    world.setResource("inputState", new InputState(defaultInputBindings));
    world.setResource("logicRuntime", {
      timerState: {},
    });
    world.setResource("runtimeMetrics", {
      currentFps: 60,
      heapUsedMb: null,
      lowPerformanceMode: false,
      namedBenchmarks: {
        logicGraphSystemMs: 0,
        physicsSystemMs: 0,
        renderSystemMs: 0,
      },
      selectedSnapshotOffsetMs: 0,
      stressTestActive: false,
      systemBenchmarks: [],
      tracedNodesByAsset: {},
    });

    const system = new LogicGraphSystem();
    system.execute(world, 0.02);

    expect(world.getComponent(entity, "velocity")).toEqual({ x: 6, y: 0 });
  });
});

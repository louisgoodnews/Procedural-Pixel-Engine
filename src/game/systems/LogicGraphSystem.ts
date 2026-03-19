import type { System, World } from "../../engine/World";
import type { EngineResources } from "../../engine/types";
import type { Entity } from "../../shared/types";
import type { GameComponents } from "../types";

export class LogicGraphSystem implements System<GameComponents, EngineResources> {
  execute(world: World<GameComponents, EngineResources>, deltaTime: number): void {
    const blueprintLibrary = world.getResource("blueprintLibrary");
    const inputState = world.getResource("inputState");
    const runtimeMetrics = world.getResource("runtimeMetrics");

    if (!blueprintLibrary || !inputState || !runtimeMetrics) {
      return;
    }

    runtimeMetrics.tracedNodesByAsset = {};

    for (const entity of world.getEntitiesWith("blueprintRef")) {
      const blueprintRef = world.getComponent(entity, "blueprintRef");
      if (!blueprintRef) {
        continue;
      }

      const blueprint = blueprintLibrary.get(blueprintRef.name);
      const logicGraph = blueprint?.logicGraph;
      if (!logicGraph || logicGraph.nodes.length === 0) {
        continue;
      }

      const nodes = new Map(logicGraph.nodes.map((node) => [node.id, node]));
      const outgoing = new Map<string, string[]>();

      for (const connection of logicGraph.connections) {
        const targets = outgoing.get(connection.from.nodeId) ?? [];
        targets.push(connection.to.nodeId);
        outgoing.set(connection.from.nodeId, targets);
      }

      for (const node of logicGraph.nodes) {
        if (node.kind !== "trigger") {
          continue;
        }

        if (!this.evaluateTrigger(world, entity, node.id, node.type, node.data, deltaTime)) {
          continue;
        }

        const assetTrace = runtimeMetrics.tracedNodesByAsset[blueprintRef.name] ?? [];
        assetTrace.push(node.id);
        runtimeMetrics.tracedNodesByAsset[blueprintRef.name] = assetTrace;
        this.walk(world, entity, blueprintRef.name, nodes, outgoing, node.id);
      }
    }
  }

  private walk(
    world: World<GameComponents, EngineResources>,
    entity: Entity,
    assetName: string,
    nodes: Map<string, { data?: Record<string, unknown>; id: string; kind: string; type: string }>,
    outgoing: Map<string, string[]>,
    nodeId: string,
  ): void {
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const visited = new Set<string>();
    const stack = [...(outgoing.get(nodeId) ?? [])];

    while (stack.length > 0) {
      const nextId = stack.pop();
      if (!nextId || visited.has(nextId)) {
        continue;
      }

      visited.add(nextId);
      if (runtimeMetrics) {
        const assetTrace = runtimeMetrics.tracedNodesByAsset[assetName] ?? [];
        assetTrace.push(nextId);
        runtimeMetrics.tracedNodesByAsset[assetName] = assetTrace;
      }
      const node = nodes.get(nextId);
      if (!node) {
        continue;
      }

      if (
        node.kind === "condition" &&
        !this.evaluateCondition(world, entity, node.type, node.data)
      ) {
        continue;
      }

      if (node.kind === "action") {
        this.executeAction(world, entity, node.type, node.data);
      }

      stack.push(...(outgoing.get(nextId) ?? []));
    }
  }

  private evaluateTrigger(
    world: World<GameComponents, EngineResources>,
    entity: Entity,
    nodeId: string,
    type: string,
    data: Record<string, unknown> | undefined,
    deltaTime: number,
  ): boolean {
    if (type === "OnInput") {
      const inputState = world.getResource("inputState");
      const code = typeof data?.code === "string" ? data.code : "Space";
      return !!inputState?.isPressed(code);
    }

    if (type === "OnEvent") {
      const eventBus = world.getResource("eventBus");
      const eventName = typeof data?.eventName === "string" ? data.eventName : "";
      return !!eventName && !!eventBus?.frameEvents.includes(eventName);
    }

    if (type === "OnTimer") {
      const logicRuntime = world.getResource("logicRuntime");
      if (!logicRuntime) {
        return false;
      }

      const duration = typeof data?.ms === "number" ? data.ms : 1000;
      const key = `${entity.id}:${nodeId}`;
      const timer = logicRuntime.timerState[key] ?? { elapsed: 0 };
      timer.elapsed += deltaTime * 1000;

      if (timer.elapsed < duration) {
        logicRuntime.timerState[key] = timer;
        return false;
      }

      timer.elapsed = 0;
      logicRuntime.timerState[key] = timer;
      return true;
    }

    return false;
  }

  private evaluateCondition(
    world: World<GameComponents, EngineResources>,
    entity: Entity,
    type: string,
    data: Record<string, unknown> | undefined,
  ): boolean {
    if (type === "IfComponentExists") {
      const component = typeof data?.component === "string" ? data.component : "";
      const pixelArt = world.getComponent(entity, "pixelArt") as
        | { assignedComponents?: string[] }
        | undefined;
      if (pixelArt?.assignedComponents?.includes(component)) {
        return true;
      }

      return (
        component.length > 0 &&
        world.getComponent(entity, component as keyof GameComponents) !== undefined
      );
    }

    if (type === "CompareVelocity") {
      const velocity = world.getComponent(entity, "velocity");
      if (!velocity) {
        return false;
      }

      const axis = data?.axis === "y" ? "y" : "x";
      const operator = typeof data?.operator === "string" ? data.operator : ">";
      const compareTo = typeof data?.value === "number" ? data.value : 0;
      const current = velocity[axis];

      if (operator === ">=") {
        return current >= compareTo;
      }
      if (operator === "<=") {
        return current <= compareTo;
      }
      if (operator === "===") {
        return current === compareTo;
      }
      if (operator === "<") {
        return current < compareTo;
      }

      return current > compareTo;
    }

    if (type === "DiceRoll") {
      const sides = Math.max(1, typeof data?.sides === "number" ? Math.floor(data.sides) : 6);
      const target = typeof data?.target === "number" ? data.target : Math.ceil(sides / 2);
      const roll = Math.floor(Math.random() * sides) + 1;
      return roll >= target;
    }

    return false;
  }

  private executeAction(
    world: World<GameComponents, EngineResources>,
    entity: Entity,
    type: string,
    data: Record<string, unknown> | undefined,
  ): void {
    if (type === "ModifyComponent") {
      const component = data?.component === "position" ? "position" : "velocity";
      const field = data?.field === "y" ? "y" : "x";
      const mode = data?.mode === "set" ? "set" : "add";
      const amount = typeof data?.value === "number" ? data.value : 0;
      const target = world.getComponent(entity, component);

      if (!target || typeof target[field] !== "number") {
        return;
      }

      target[field] = mode === "set" ? amount : target[field] + amount;
      return;
    }

    if (type === "ChangeBlueprint") {
      const nextName = typeof data?.blueprint === "string" ? data.blueprint : "";
      const nextBlueprint = world.getResource("blueprintLibrary")?.get(nextName);
      const pixelArt = world.getComponent(entity, "pixelArt");
      const blueprintRef = world.getComponent(entity, "blueprintRef");

      if (!nextBlueprint || !pixelArt || !blueprintRef) {
        return;
      }

      blueprintRef.name = nextBlueprint.name;
      pixelArt.matrix = nextBlueprint.matrix.map((row) => [...row]);
      pixelArt.colorMap = { ...nextBlueprint.colorMap };
      pixelArt.pixelSize = nextBlueprint.pixelSize;
      pixelArt.assignedComponents = [...(nextBlueprint.assignedComponents ?? [])];
      pixelArt.childBlueprints = nextBlueprint.childBlueprints?.map((child) => ({ ...child }));
      pixelArt.flipX = nextBlueprint.flipX;
      pixelArt.flipY = nextBlueprint.flipY;
      pixelArt.importSources = [...(nextBlueprint.importSources ?? [])];
      pixelArt.spriteFrames = nextBlueprint.spriteFrames?.map((frame) =>
        frame.map((row) => [...row]),
      );
      return;
    }

    if (type === "AssignComponentTemplate") {
      const componentName = typeof data?.componentName === "string" ? data.componentName : "";
      const pixelArt = world.getComponent(entity, "pixelArt") as
        | { assignedComponents?: string[] }
        | undefined;

      if (!pixelArt || !componentName) {
        return;
      }

      const assigned = new Set(pixelArt.assignedComponents ?? []);
      assigned.add(componentName);
      pixelArt.assignedComponents = [...assigned];
      return;
    }

    if (type === "EmitEvent") {
      const eventBus = world.getResource("eventBus");
      const eventName = typeof data?.eventName === "string" ? data.eventName : "";
      if (!eventBus || !eventName) {
        return;
      }

      if (!eventBus.frameEvents.includes(eventName)) {
        eventBus.frameEvents.push(eventName);
      }
      return;
    }

    if (type === "RandomRange") {
      const component = data?.component === "position" ? "position" : "velocity";
      const field = data?.field === "y" ? "y" : "x";
      const min = typeof data?.min === "number" ? data.min : -10;
      const max = typeof data?.max === "number" ? data.max : 10;
      const target = world.getComponent(entity, component);

      if (!target || typeof target[field] !== "number") {
        return;
      }

      target[field] = min + Math.random() * (max - min);
      return;
    }

    if (type === "MathOperation") {
      const component = data?.component === "position" ? "position" : "velocity";
      const field = data?.field === "y" ? "y" : "x";
      const operator = typeof data?.operator === "string" ? data.operator : "add";
      const amount = typeof data?.value === "number" ? data.value : 0;
      const target = world.getComponent(entity, component);

      if (!target || typeof target[field] !== "number") {
        return;
      }

      if (operator === "subtract") {
        target[field] -= amount;
        return;
      }
      if (operator === "multiply") {
        target[field] *= amount;
        return;
      }
      if (operator === "divide") {
        target[field] = amount === 0 ? target[field] : target[field] / amount;
        return;
      }

      target[field] += amount;
    }
  }
}

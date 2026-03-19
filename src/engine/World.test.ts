import { describe, expect, test } from "bun:test";
import { World } from "./World";

interface TestComponents {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface TestResources {
  frame: number;
}

describe("World", () => {
  test("creates entities and manages components", () => {
    const world = new World<TestComponents, TestResources>();
    const entity = world.createEntity();

    world.addComponent(entity, "position", { x: 4, y: 8 });
    world.addComponents(entity, {
      velocity: { x: 1, y: 2 },
    });

    expect(world.hasEntity(entity)).toBe(true);
    expect(world.getComponent(entity, "position")).toEqual({ x: 4, y: 8 });
    expect(world.getComponent(entity, "velocity")).toEqual({ x: 1, y: 2 });
  });

  test("supports removal and cached queries staying correct", () => {
    const world = new World<TestComponents, TestResources>();
    const first = world.createEntity();
    const second = world.createEntity();

    world.addComponent(first, "position", { x: 1, y: 1 });
    world.addComponent(second, "position", { x: 2, y: 2 });

    expect(world.getEntitiesWith("position").map((entity) => entity.id)).toEqual([1, 2]);

    world.removeComponent(second, "position");
    expect(world.getEntitiesWith("position").map((entity) => entity.id)).toEqual([1]);

    world.destroyEntity(first);
    expect(world.getEntitiesWith("position")).toEqual([]);
  });

  test("initializes systems once and executes update/render phases", () => {
    const world = new World<TestComponents, TestResources>();
    const calls: string[] = [];

    world.setResource("frame", 0);

    world.addSystem(
      {
        initialize(currentWorld) {
          calls.push(`init:${currentWorld.getResource("frame")}`);
        },
        execute(currentWorld) {
          calls.push(`update:${currentWorld.getResource("frame")}`);
        },
      },
      "update",
    );

    world.addSystem(
      {
        initialize() {
          calls.push("render:init");
        },
        execute() {
          calls.push("render:run");
        },
      },
      "render",
    );

    world.update(0.016);
    world.render(0.016);
    world.update(0.016);

    expect(calls).toEqual(["init:0", "render:init", "update:0", "render:run", "update:0"]);
  });
});

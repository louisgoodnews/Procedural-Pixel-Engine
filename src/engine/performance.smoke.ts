import { World } from "./World";

interface PerfComponents {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface PerfResources {
  ticks: number;
}

const world = new World<PerfComponents, PerfResources>();
world.setResource("ticks", 0);

world.addSystem({
  execute(currentWorld, deltaTime) {
    for (const entity of currentWorld.getEntitiesWith("position", "velocity")) {
      const position = currentWorld.getComponent(entity, "position");
      const velocity = currentWorld.getComponent(entity, "velocity");

      if (!position || !velocity) {
        continue;
      }

      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
    }
  },
});

for (let index = 0; index < 2000; index += 1) {
  const entity = world.createEntity();
  world.addComponents(entity, {
    position: { x: index, y: index },
    velocity: { x: 1, y: 1 },
  });
}

const startedAt = performance.now();

for (let frame = 0; frame < 240; frame += 1) {
  world.update(1 / 60);
}

const elapsed = performance.now() - startedAt;

console.log(`ECS performance smoke: 2000 entities x 240 frames in ${elapsed.toFixed(2)}ms`);

if (elapsed > 1500) {
  throw new Error(`ECS performance smoke exceeded threshold: ${elapsed.toFixed(2)}ms`);
}

import type { ColliderComponent, PositionComponent } from "../../shared/types";
import type { System, World } from "../World";
import type { EngineComponents, EngineResources, PhysicsDebugContact } from "../types";

interface ResolvedCollider {
  height: number;
  isTrigger: boolean;
  layer: string;
  left: number;
  mask: string[];
  radius?: number;
  shape: "circle" | "rect";
  top: number;
  width: number;
}

function resolveCollider(
  position: PositionComponent,
  collider: ColliderComponent | undefined,
): ResolvedCollider {
  const width = collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.width ?? 16);
  const height =
    collider?.shape === "circle" ? (collider.radius ?? 8) * 2 : (collider?.height ?? 16);

  return {
    height,
    isTrigger: collider?.isTrigger ?? false,
    layer: collider?.layer ?? "default",
    left: position.x + (collider?.offsetX ?? 0),
    mask: collider?.mask ? [...collider.mask] : ["default"],
    radius: collider?.radius,
    shape: collider?.shape ?? "rect",
    top: position.y + (collider?.offsetY ?? 0),
    width,
  };
}

function collidersOverlap(left: ResolvedCollider, right: ResolvedCollider): boolean {
  if (!left.mask.includes(right.layer) && !right.mask.includes(left.layer)) {
    return false;
  }

  if (left.shape === "circle" && right.shape === "circle") {
    const centerAX = left.left + (left.radius ?? left.width / 2);
    const centerAY = left.top + (left.radius ?? left.height / 2);
    const centerBX = right.left + (right.radius ?? right.width / 2);
    const centerBY = right.top + (right.radius ?? right.height / 2);
    const dx = centerAX - centerBX;
    const dy = centerAY - centerBY;
    const radius = (left.radius ?? left.width / 2) + (right.radius ?? right.width / 2);
    return dx * dx + dy * dy <= radius * radius;
  }

  return !(
    left.left + left.width < right.left ||
    right.left + right.width < left.left ||
    left.top + left.height < right.top ||
    right.top + right.height < left.top
  );
}

export class PhysicsSystem implements System<EngineComponents, EngineResources> {
  initialize(world: World<EngineComponents, EngineResources>): void {
    world.setResource("physicsRuntime", {
      contacts: [],
      fixedDeltaMs: 16,
      gravity: { x: 0, y: 240 },
    });
  }

  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    const viewport = world.getResource("viewport");
    const physicsRuntime = world.getResource("physicsRuntime");
    const contacts: PhysicsDebugContact[] = [];
    const fixedDeltaSeconds = (physicsRuntime?.fixedDeltaMs ?? 16) / 1000;
    const stepSeconds = fixedDeltaSeconds > 0 ? fixedDeltaSeconds : deltaTime;
    const entities = [...world.getEntitiesWith("position", "velocity")];

    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const velocity = world.getComponent(entity, "velocity");
      const body = world.getComponent(entity, "physicsBody");
      const pixelArt = world.getComponent(entity, "pixelArt");

      if (!position || !velocity) {
        continue;
      }

      if (body?.bodyType !== "static") {
        velocity.x += (physicsRuntime?.gravity.x ?? 0) * (body?.gravityScale ?? 0) * stepSeconds;
        velocity.y += (physicsRuntime?.gravity.y ?? 0) * (body?.gravityScale ?? 0) * stepSeconds;

        const friction = Math.min(1, Math.max(0, body?.friction ?? 0));
        const damping = Math.max(0, 1 - friction * stepSeconds);
        velocity.x *= damping;
        velocity.y *= damping;

        position.x += velocity.x * stepSeconds;
        position.y += velocity.y * stepSeconds;
      }

      if (!viewport || (!pixelArt && !body?.constraintToViewport)) {
        continue;
      }

      const width = pixelArt?.matrix[0]?.length ?? 1;
      const height = pixelArt?.matrix.length ?? 1;
      const spriteWidth = width * (pixelArt?.pixelSize ?? 1);
      const spriteHeight = height * (pixelArt?.pixelSize ?? 1);
      const constrainToViewport = body?.constraintToViewport ?? true;

      if (!constrainToViewport) {
        continue;
      }

      const restitution = Math.max(0, body?.restitution ?? 0);
      if (position.x < 0 || position.x > viewport.logicalWidth - spriteWidth) {
        position.x = Math.max(0, Math.min(position.x, viewport.logicalWidth - spriteWidth));
        velocity.x *= -restitution;
      }
      if (position.y < 0 || position.y > viewport.logicalHeight - spriteHeight) {
        position.y = Math.max(0, Math.min(position.y, viewport.logicalHeight - spriteHeight));
        velocity.y *= -restitution;
      }
    }

    for (let index = 0; index < entities.length; index += 1) {
      const current = entities[index];
      const currentPosition = world.getComponent(current, "position");
      if (!currentPosition) {
        continue;
      }

      const currentCollider = resolveCollider(
        currentPosition,
        world.getComponent(current, "collider"),
      );

      for (let compareIndex = index + 1; compareIndex < entities.length; compareIndex += 1) {
        const other = entities[compareIndex];
        const otherPosition = world.getComponent(other, "position");
        if (!otherPosition) {
          continue;
        }

        const otherCollider = resolveCollider(otherPosition, world.getComponent(other, "collider"));

        if (!collidersOverlap(currentCollider, otherCollider)) {
          continue;
        }

        contacts.push({
          entityA: current.id,
          entityB: other.id,
          isTrigger: currentCollider.isTrigger || otherCollider.isTrigger,
          layerA: currentCollider.layer,
          layerB: otherCollider.layer,
        });

        if (currentCollider.isTrigger || otherCollider.isTrigger) {
          continue;
        }

        const currentVelocity = world.getComponent(current, "velocity");
        const otherVelocity = world.getComponent(other, "velocity");
        const currentBody = world.getComponent(current, "physicsBody");
        const otherBody = world.getComponent(other, "physicsBody");
        const restitution = Math.max(currentBody?.restitution ?? 0, otherBody?.restitution ?? 0);

        if (currentVelocity && currentBody?.bodyType !== "static") {
          currentVelocity.x *= -restitution;
          currentVelocity.y *= -restitution;
        }
        if (otherVelocity && otherBody?.bodyType !== "static") {
          otherVelocity.x *= -restitution;
          otherVelocity.y *= -restitution;
        }
      }
    }

    if (physicsRuntime) {
      physicsRuntime.contacts = contacts;
    } else {
      world.setResource("physicsRuntime", {
        contacts,
        fixedDeltaMs: 16,
        gravity: { x: 0, y: 240 },
      });
    }
  }
}

export class MovementSystem extends PhysicsSystem {}

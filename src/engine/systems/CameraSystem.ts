import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";

export class CameraSystem implements System<EngineComponents, EngineResources> {
  execute(world: World<EngineComponents, EngineResources>): void {
    const viewport = world.getResource("viewport");
    const camera = world.getResource("camera");

    if (!viewport || !camera) {
      return;
    }

    const focusEntity = world.getEntitiesWith("position", "pixelArt")[0];
    if (!focusEntity) {
      return;
    }

    const position = world.getComponent(focusEntity, "position");
    const pixelArt = world.getComponent(focusEntity, "pixelArt");

    if (!position || !pixelArt) {
      return;
    }

    const spriteWidth = (pixelArt.matrix[0]?.length ?? 0) * pixelArt.pixelSize;
    const spriteHeight = pixelArt.matrix.length * pixelArt.pixelSize;
    const targetX = position.x + spriteWidth / 2 - viewport.logicalWidth / 2;
    const targetY = position.y + spriteHeight / 2 - viewport.logicalHeight / 2;

    camera.x = Math.max(0, targetX);
    camera.y = Math.max(0, targetY);
  }
}

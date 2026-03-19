import type { System, World } from "../../engine/World";
import type { EngineResources } from "../../engine/types";
import type { GameComponents } from "../types";

export class PlayerInputSystem implements System<GameComponents, EngineResources> {
  execute(world: World<GameComponents, EngineResources>): void {
    const inputState = world.getResource("inputState");
    const interactionState = world.getResource("interactionState");

    if (!inputState || !interactionState) {
      return;
    }

    const horizontal = inputState.getAxis("move_left", "move_right");
    const vertical = inputState.getAxis("move_up", "move_down");

    interactionState.confirmPressed = inputState.isActionPressed("confirm");
    interactionState.cancelPressed = inputState.isActionPressed("cancel");

    for (const entity of world.getEntitiesWith("velocity", "playerController")) {
      const velocity = world.getComponent(entity, "velocity");
      const controller = world.getComponent(entity, "playerController");

      if (!velocity || !controller) {
        continue;
      }

      velocity.x = horizontal * controller.speed;
      velocity.y = vertical * controller.speed;
    }
  }
}

import type { ColliderComponent, PositionComponent } from "../../shared/types";
import type { System, World } from "../World";
import type { EngineComponents, EngineResources, PhysicsDebugContact } from "../types";

export class PhysicsDebugSystem implements System<EngineComponents, EngineResources> {
  execute(world: World<EngineComponents, EngineResources>): void {
    const canvas = world.getResource("canvas");
    const context = world.getResource("context");
    const camera = world.getResource("camera");
    const physicsRuntime = world.getResource("physicsRuntime");
    const runtimeMetrics = world.getResource("runtimeMetrics");

    if (!canvas || !context || !camera || !physicsRuntime || !runtimeMetrics) {
      return;
    }

    // Only render debug overlays in low performance mode or when explicitly enabled
    if (!runtimeMetrics.lowPerformanceMode && runtimeMetrics.stressTestActive) {
      return;
    }

    this.renderColliderOutlines(context, world, camera);
    this.renderContactPoints(context, physicsRuntime.contacts, camera);
    this.renderPhysicsInfo(context, physicsRuntime, runtimeMetrics);
  }

  private renderColliderOutlines(
    context: CanvasRenderingContext2D,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const entities = world.getEntitiesWith("position", "collider");

    context.save();
    context.strokeStyle = "#00ff00";
    context.lineWidth = 1;
    context.setLineDash([2, 2]);

    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const collider = world.getComponent(entity, "collider");

      if (!position || !collider) {
        continue;
      }

      const x = position.x + (collider.offsetX ?? 0) - camera.x;
      const y = position.y + (collider.offsetY ?? 0) - camera.y;

      if (collider.shape === "circle") {
        const radius = collider.radius ?? 8;
        context.beginPath();
        context.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        context.stroke();
      } else {
        const width = collider.width ?? 16;
        const height = collider.height ?? 16;
        context.strokeRect(x, y, width, height);
      }
    }

    context.restore();
  }

  private renderContactPoints(
    context: CanvasRenderingContext2D,
    contacts: PhysicsDebugContact[],
    camera: EngineResources["camera"],
  ): void {
    if (contacts.length === 0) {
      return;
    }

    context.save();
    context.fillStyle = "#ff0000";
    context.strokeStyle = "#ff0000";
    context.lineWidth = 2;

    for (const contact of contacts) {
      // Draw contact indicator - this is a simplified visualization
      // In a real implementation, you'd calculate the actual contact point
      context.beginPath();
      context.arc(10 + contacts.indexOf(contact) * 15, 10, 3, 0, Math.PI * 2);
      context.fill();

      // Draw contact info text
      context.fillStyle = "#ffffff";
      context.font = "10px monospace";
      context.fillText(
        `${contact.entityA}↔${contact.entityB}`,
        10 + contacts.indexOf(contact) * 15,
        25,
      );
      context.fillText(
        contact.isTrigger ? "TRIGGER" : "COLLISION",
        10 + contacts.indexOf(contact) * 15,
        35,
      );
    }

    context.restore();
  }

  private renderPhysicsInfo(
    context: CanvasRenderingContext2D,
    physicsRuntime: EngineResources["physicsRuntime"],
    runtimeMetrics: EngineResources["runtimeMetrics"],
  ): void {
    context.save();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#000000";
    context.lineWidth = 3;
    context.font = "12px monospace";

    const info = [
      "Physics Debug Info",
      `Contacts: ${physicsRuntime.contacts.length}`,
      `Gravity: (${physicsRuntime.gravity.x}, ${physicsRuntime.gravity.y})`,
      `Fixed Delta: ${physicsRuntime.fixedDeltaMs}ms`,
      `Performance Mode: ${runtimeMetrics.lowPerformanceMode ? "ON" : "OFF"}`,
    ];

    let y = 60;
    for (const line of info) {
      context.strokeText(line, 10, y);
      context.fillText(line, 10, y);
      y += 15;
    }

    context.restore();
  }
}

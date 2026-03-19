import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";

export class ArchitectureRuntimeSystem implements System<EngineComponents, EngineResources> {
  execute(world: World<EngineComponents, EngineResources>): void {
    const runtime = world.getResource("architectureRuntime");
    if (!runtime) {
      return;
    }

    runtime.systemExecutionCounts = {};
    this.executeGlobalPresets(runtime);

    for (const entity of world.getEntitiesWith("pixelArt")) {
      const pixelArt = world.getComponent(entity, "pixelArt");
      if (!pixelArt) {
        continue;
      }

      pixelArt.assignedComponents = (pixelArt.assignedComponents ?? []).filter((template) =>
        runtime.componentTemplates.includes(template),
      );
      pixelArt.componentTree = pixelArt.componentTree ?? {};

      for (const template of pixelArt.assignedComponents) {
        this.ensureNestedComponent(pixelArt.componentTree, template);
      }

      for (const systemName of pixelArt.assignedGlobalSystems ?? []) {
        if (!runtime.globalSystems.includes(systemName)) {
          continue;
        }

        runtime.systemExecutionCounts[systemName] =
          (runtime.systemExecutionCounts[systemName] ?? 0) + 1;

        const velocity = world.getComponent(entity, "velocity");
        if (velocity) {
          const impulse = (systemName.length % 4) * 2;
          velocity.x += impulse * 0.001;
          velocity.y += impulse * 0.001;
        }

        this.executeEntityPreset(pixelArt.componentTree, systemName);
      }
    }
  }

  private ensureNestedComponent(target: Record<string, unknown>, template: string): void {
    const path = template.split(/[.:/]/g).filter(Boolean);
    let current: Record<string, unknown> = target;

    for (const segment of path) {
      const next = current[segment];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        current[segment] = {};
      }
      current = current[segment] as Record<string, unknown>;
    }
  }

  private executeEntityPreset(componentTree: Record<string, unknown>, systemName: string): void {
    if (systemName === "SurvivalSystem") {
      const survival = this.getNestedObject(componentTree, ["Survival"]);
      survival.Hunger = Math.max(0, (Number(survival.Hunger) || 100) - 0.02);
      survival.Thirst = Math.max(0, (Number(survival.Thirst) || 100) - 0.03);
      return;
    }

    if (systemName === "RPGStatsSystem") {
      const stats = this.getNestedObject(componentTree, ["Stats"]);
      stats.Mana = Math.min(100, (Number(stats.Mana) || 0) + 0.08);
      stats.Stamina = Math.min(100, (Number(stats.Stamina) || 0) + 0.12);
    }
  }

  private executeGlobalPresets(runtime: EngineResources["architectureRuntime"]): void {
    if (runtime.globalSystems.includes("DayNightCycleSystem")) {
      runtime.globalVariables.global_light = 0.5 + Math.sin(performance.now() / 5000) * 0.5;
    }
  }

  private getNestedObject(
    target: Record<string, unknown>,
    path: string[],
  ): Record<string, unknown> {
    let current = target;
    for (const segment of path) {
      const next = current[segment];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        current[segment] = {};
      }
      current = current[segment] as Record<string, unknown>;
    }
    return current;
  }
}

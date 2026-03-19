import type { EngineResources } from "../engine/types";
import type { BlueprintCatalog } from "../shared/types";

export interface HudElements {
  benchmarks: HTMLElement;
  benchmarkShell: HTMLElement;
  benchmarkToggle: HTMLButtonElement;
  physicsDebugToggle: HTMLButtonElement;
  timeLabel: HTMLElement;
  timeSlider: HTMLInputElement;
  stepBackButton: HTMLButtonElement;
  stepForwardButton: HTMLButtonElement;
  meta: HTMLElement;
  issues: HTMLElement;
}

interface HudCallbacks {
  onTimeTravel(offsetMs: number): void;
  onTogglePhysicsDebug(): void;
  onStepBack(): void;
  onStepForward(): void;
}

export function updateHud(
  hud: HudElements,
  resources: Pick<
    EngineResources,
    "camera" | "interactionState" | "renderStats" | "runtimeMetrics" | "viewport"
  >,
  catalog: BlueprintCatalog,
  stats: {
    fps: number;
    entityCount: number;
  },
): void {
  hud.meta.textContent =
    `FPS ${stats.fps.toFixed(1)} | ` +
    `Scale ${resources.viewport.displayScale.toFixed(2)}x | ` +
    `Camera ${Math.round(resources.camera.x)},${Math.round(resources.camera.y)} | ` +
    `Visible ${resources.renderStats.visibleEntities}/${stats.entityCount} | ` +
    `Draws ${resources.renderStats.drawCalls}`;

  hud.issues.textContent = `${resources.interactionState.confirmPressed ? "Confirm " : ""}${resources.interactionState.cancelPressed ? "Cancel " : ""}${
    catalog.issues.length > 0
      ? `Skipped assets: ${catalog.issues.map((issue) => issue.fileName).join(", ")}`
      : `Loaded assets: ${catalog.blueprints.map((blueprint) => blueprint.name).join(", ")}`
  }`;

  hud.benchmarks.textContent = `Memory ${
    resources.runtimeMetrics.heapUsedMb === null
      ? "n/a"
      : `${resources.runtimeMetrics.heapUsedMb.toFixed(1)} MB`
  } | Logic ${resources.runtimeMetrics.namedBenchmarks.logicGraphSystemMs.toFixed(2)}ms | Physics ${resources.runtimeMetrics.namedBenchmarks.physicsSystemMs.toFixed(2)}ms | Render ${resources.runtimeMetrics.namedBenchmarks.renderSystemMs.toFixed(2)}ms${
    resources.runtimeMetrics.systemBenchmarks.length > 0
      ? ` | ${resources.runtimeMetrics.systemBenchmarks
          .map((entry) => `${entry.systemName} ${entry.durationMs.toFixed(2)}ms`)
          .join(" | ")}`
      : " | Systems idle"
  }`;
  hud.timeLabel.textContent =
    resources.runtimeMetrics.selectedSnapshotOffsetMs > 0
      ? `-${(resources.runtimeMetrics.selectedSnapshotOffsetMs / 1000).toFixed(1)}s`
      : "Live";
}

export function initializeHudControls(hud: HudElements, callbacks: HudCallbacks): void {
  let collapsed = false;
  let physicsDebugEnabled = false;

  hud.benchmarkToggle.addEventListener("click", () => {
    collapsed = !collapsed;
    hud.benchmarkShell.classList.toggle("is-collapsed", collapsed);
    hud.benchmarkToggle.textContent = collapsed ? "Show Performance" : "Hide Performance";
  });

  hud.physicsDebugToggle.addEventListener("click", () => {
    physicsDebugEnabled = !physicsDebugEnabled;
    hud.physicsDebugToggle.textContent = physicsDebugEnabled
      ? "Hide Physics Debug"
      : "Show Physics Debug";
    callbacks.onTogglePhysicsDebug();
  });

  hud.timeSlider.addEventListener("input", () => {
    callbacks.onTimeTravel(Number(hud.timeSlider.value) || 0);
  });

  hud.stepBackButton.addEventListener("click", () => {
    callbacks.onStepBack();
  });

  hud.stepForwardButton.addEventListener("click", () => {
    callbacks.onStepForward();
  });
}

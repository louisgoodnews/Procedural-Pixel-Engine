import { InputState } from "../engine/InputState";
import { SnapshotService } from "../engine/SnapshotService";
import { World } from "../engine/World";
import { defaultInputBindings } from "../engine/input";
import { ArchitectureRuntimeSystem } from "../engine/systems/ArchitectureRuntimeSystem";
import { CameraSystem } from "../engine/systems/CameraSystem";
import { PhysicsDebugSystem } from "../engine/systems/PhysicsDebugSystem";
import { RenderSystem } from "../engine/systems/RenderSystem";
import type { EngineResources } from "../engine/types";
import { createGameScene } from "../game/scene";
import { LogicGraphSystem } from "../game/systems/LogicGraphSystem";
import { PlayerInputSystem } from "../game/systems/PlayerInputSystem";
import type { GameComponents } from "../game/types";
import type { BlueprintCatalog } from "../shared/types";
import type { PixelBlueprint } from "../shared/types";
import { onBlueprintPreviewUpdated, onStressTestRequested } from "./editor/events";
import { emitRuntimeTraceUpdated } from "./editor/events";
import type { HudElements } from "./hud";
import { initializeHudControls, updateHud } from "./hud";
import { BrowserLogger } from "./BrowserLogger";

// Import new multithreading systems
import { IntegratedPhysicsSystem } from "../main/IntegratedPhysicsSystem";
import { IntegratedParticleSystem } from "../main/IntegratedParticleSystem";
import { IntegratedRenderSystem } from "../main/IntegratedRenderSystem";
import { CoreOptimizationSystem } from "../main/CoreOptimizationSystem";
import { DynamicWorkerAllocationSystem } from "../main/DynamicWorkerAllocation";
import { MultithreadingPerformanceProfiler } from "../main/MultithreadingPerformanceProfiler";
import { MultithreadingStressTestSuite } from "../main/MultithreadingStressTestSuite";
import { AdvancedLoadBalancer } from "../main/AdvancedLoadBalancer";
import { MultithreadingIntegrationTest } from "../main/MultithreadingIntegrationTest";

export interface EngineController {
  startPlaytest(): void;
  stopPlaytest(): void;
}

function syncCanvasScale(canvas: HTMLCanvasElement): {
  logicalWidth: number;
  logicalHeight: number;
  displayScale: number;
} {
  const logicalWidth = canvas.width;
  const logicalHeight = canvas.height;
  const scale = Math.max(
    1,
    Math.floor(
      Math.min(window.innerWidth / logicalWidth, (window.innerHeight - 120) / logicalHeight),
    ),
  );

  canvas.style.width = `${logicalWidth * scale}px`;
  canvas.style.height = `${logicalHeight * scale}px`;

  return {
    logicalWidth,
    logicalHeight,
    displayScale: scale,
  };
}

function createWorld(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): World<GameComponents, EngineResources> {
  const world = new World<GameComponents, EngineResources>();
  const scale = syncCanvasScale(canvas);

  world.setResource("blueprintLibrary", new Map());
  world.setResource("architectureRuntime", {
    componentTemplates: JSON.parse(
      localStorage.getItem("ppe.architecture.components") ??
        '["Health","Mana","Stamina","Survival.Hunger","Survival.Thirst","Stats.Mana","Stats.Stamina"]',
    ) as string[],
    eventDefinitions: JSON.parse(
      localStorage.getItem("ppe.architecture.events") ?? '["pulse","alarm","checkpoint"]',
    ) as string[],
    globalSystems: JSON.parse(
      localStorage.getItem("ppe.architecture.systems") ??
        '["WeatherSystem","SurvivalSystem","RPGStatsSystem","DayNightCycleSystem"]',
    ) as string[],
    globalVariables: {
      global_light: 1,
    },
    systemExecutionCounts: {},
  });
  world.setResource("canvas", canvas);
  world.setResource("context", context);
  world.setResource("eventBus", {
    frameEvents: [],
  });
  world.setResource("camera", {
    x: 0,
    y: 0,
    zoom: 1,
  });
  world.setResource("renderStats", {
    drawCalls: 0,
    visibleEntities: 0,
  });
  world.setResource("runtimeMetrics", {
    currentFps: 0,
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
  world.setResource("snapshotState", null);
  world.setResource("viewport", {
    width: canvas.width,
    height: canvas.height,
    background: "#071018",
    logicalWidth: scale.logicalWidth,
    logicalHeight: scale.logicalHeight,
    displayScale: scale.displayScale,
  });

  const inputState = new InputState(defaultInputBindings);
  inputState.attach();
  world.setResource("inputState", inputState);
  world.setResource("interactionState", {
    confirmPressed: false,
    cancelPressed: false,
  });
  world.setResource("logicRuntime", {
    timerState: {},
  });

  // Add core game systems
  world.addSystem(new PlayerInputSystem(), "update");
  world.addSystem(new ArchitectureRuntimeSystem(), "update");
  world.addSystem(new LogicGraphSystem(), "update");
  
  // Add multithreading infrastructure systems
  world.addSystem(new CoreOptimizationSystem(), "update");
  world.addSystem(new DynamicWorkerAllocationSystem(), "update");
  world.addSystem(new AdvancedLoadBalancer(), "update");
  world.addSystem(new MultithreadingPerformanceProfiler(), "update");
  world.addSystem(new MultithreadingStressTestSuite(), "update");
  world.addSystem(new MultithreadingIntegrationTest(), "update");
  
  // Add integrated parallel systems
  world.addSystem(new IntegratedPhysicsSystem(), "update");
  world.addSystem(new IntegratedParticleSystem(), "update");
  world.addSystem(new CameraSystem(), "update");
  world.addSystem(new IntegratedRenderSystem(), "render");
  world.addSystem(new PhysicsDebugSystem(), "render");

  return world;
}

function createPreviewEntity(
  world: World<GameComponents, EngineResources>,
  blueprint: PixelBlueprint,
): void {
  const preview = world.createEntity();
  world.addComponents(preview, {
    blueprintRef: { name: blueprint.name, preview: true },
    pixelArt: {
      ...blueprint,
      colorMap: { ...blueprint.colorMap },
      matrix: blueprint.matrix.map((row) => [...row]),
      spriteFrames: blueprint.spriteFrames?.map((frame) => frame.map((row) => [...row])),
    },
    position: { x: 472, y: 72 },
    renderLayer: { order: 40 },
    velocity: { x: 0, y: 0 },
  });
}

export function startEngine(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  catalog: BlueprintCatalog,
  hud: HudElements,
): EngineController {
  BrowserLogger.info("Bootstrap", "=== Engine Startup ===");
  BrowserLogger.info("Bootstrap", "Node.js version", { version: process.version });
  BrowserLogger.info("Bootstrap", "Platform", { platform: process.platform });
  BrowserLogger.info("Bootstrap", "Memory", { 
    heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB` 
  });
  
  BrowserLogger.info("Bootstrap", "Starting engine initialization", {
    blueprintCount: catalog.blueprints.length,
    canvasSize: { width: canvas.width, height: canvas.height }
  });

  let paused = false;
  let playtestSnapshot: ReturnType<
    World<GameComponents, EngineResources>["createSnapshot"]
  > | null = null;
  const catalogBlueprints = new Map(
    catalog.blueprints.map((blueprint) => [blueprint.name, blueprint]),
  );
  
  // Log available blueprints for debugging
  BrowserLogger.info("Bootstrap", "Available blueprints", {
    count: catalog.blueprints.length,
    names: catalog.blueprints.map(bp => bp.name)
  });
  
  // Get available blueprints dynamically - no hardcoded names
  const availableBlueprints = catalog.blueprints;
  
  const world = createWorld(canvas, context);
  const blueprintLibrary = world.getResource("blueprintLibrary");
  if (blueprintLibrary) {
    BrowserLogger.info("Bootstrap", "Populating blueprint library", {
      count: catalog.blueprints.length
    });
    
    for (const blueprint of catalog.blueprints) {
      blueprintLibrary.set(blueprint.name, blueprint);
      BrowserLogger.debug("Bootstrap", `Added blueprint to library: ${blueprint.name}`, {
        category: blueprint.blueprintCategory,
        type: blueprint.blueprintType
      });
    }
  } else {
    BrowserLogger.error("Bootstrap", "Blueprint library resource not found");
  }
  
  // Create game scene with available blueprints (may be empty)
  BrowserLogger.info("Bootstrap", "Creating game scene");
  createGameScene(world, catalog, {
    player: catalogBlueprints.get("player"),
    shrine: catalogBlueprints.get("shrine"),
    villager: catalogBlueprints.get("villager"),
  });
  
  // Create preview entity using first available blueprint, or none if empty
  const previewBlueprint = availableBlueprints[0];
  if (previewBlueprint) {
    BrowserLogger.info("Bootstrap", `Creating preview entity with blueprint: ${previewBlueprint.name}`);
    createPreviewEntity(world, previewBlueprint);
  } else {
    BrowserLogger.warn("Bootstrap", "No blueprints available for preview entity");
  }
  const snapshotService = new SnapshotService<GameComponents, EngineResources>();
  initializeHudControls(hud, {
    onTimeTravel: (offsetMs) => {
      const runtimeMetrics = world.getResource("runtimeMetrics");
      if (!runtimeMetrics) {
        return;
      }

      runtimeMetrics.selectedSnapshotOffsetMs = offsetMs;

      if (offsetMs <= 0) {
        paused = false;
        return;
      }

      paused = true;
      snapshotService.restoreOffset(world, offsetMs, performance.now());
      emitRuntimeTraceUpdated({
        snapshotOffsetMs: offsetMs,
        tracedNodesByAsset: { ...runtimeMetrics.tracedNodesByAsset },
      });
    },
    onTogglePhysicsDebug: () => {
      const runtimeMetrics = world.getResource("runtimeMetrics");
      if (runtimeMetrics) {
        runtimeMetrics.lowPerformanceMode = !runtimeMetrics.lowPerformanceMode;
      }
    },
    onStepBack: () => {
      const runtimeMetrics = world.getResource("runtimeMetrics");
      if (!runtimeMetrics) {
        return;
      }

      // Step back by 100ms
      const newOffset = Math.min(runtimeMetrics.selectedSnapshotOffsetMs + 100, 10000);
      runtimeMetrics.selectedSnapshotOffsetMs = newOffset;
      paused = true;
      snapshotService.restoreOffset(world, newOffset, performance.now());
      emitRuntimeTraceUpdated({
        snapshotOffsetMs: newOffset,
        tracedNodesByAsset: { ...runtimeMetrics.tracedNodesByAsset },
      });
    },
    onStepForward: () => {
      const runtimeMetrics = world.getResource("runtimeMetrics");
      if (!runtimeMetrics) {
        return;
      }

      // Step forward by 100ms
      const newOffset = Math.max(runtimeMetrics.selectedSnapshotOffsetMs - 100, 0);
      runtimeMetrics.selectedSnapshotOffsetMs = newOffset;

      if (newOffset <= 0) {
        paused = false;
      } else {
        paused = true;
        snapshotService.restoreOffset(world, newOffset, performance.now());
      }
      emitRuntimeTraceUpdated({
        snapshotOffsetMs: newOffset,
        tracedNodesByAsset: { ...runtimeMetrics.tracedNodesByAsset },
      });
    },
  });

  world.start();

  onBlueprintPreviewUpdated((blueprint: PixelBlueprint) => {
    blueprintLibrary?.set(blueprint.name, blueprint);

    for (const entity of world.getEntitiesWith("blueprintRef", "pixelArt")) {
      const blueprintRef = world.getComponent(entity, "blueprintRef");
      const pixelArt = world.getComponent(entity, "pixelArt");

      if (!blueprintRef || !pixelArt) {
        continue;
      }

      if (!blueprintRef.preview && blueprintRef.name !== blueprint.name) {
        continue;
      }

      pixelArt.matrix = blueprint.matrix.map((row) => [...row]);
      pixelArt.colorMap = { ...blueprint.colorMap };
      pixelArt.flipX = blueprint.flipX;
      pixelArt.flipY = blueprint.flipY;
      pixelArt.pixelSize = blueprint.pixelSize;
      pixelArt.spriteFrames = blueprint.spriteFrames?.map((frame) => frame.map((row) => [...row]));
    }
  });

  window.addEventListener("resize", () => {
    const viewport = world.getResource("viewport");
    if (!viewport) {
      return;
    }

    const scale = syncCanvasScale(canvas);
    viewport.displayScale = scale.displayScale;
    viewport.logicalWidth = scale.logicalWidth;
    viewport.logicalHeight = scale.logicalHeight;
  });

  onStressTestRequested(({ actorCount, propCount }) => {
    BrowserLogger.info("Bootstrap", "Stress test requested", { actorCount, propCount });
  
    const sourceBlueprints = catalog.blueprints.length > 0 ? catalog.blueprints : [];
  
    if (sourceBlueprints.length === 0) {
      BrowserLogger.error("Bootstrap", "Cannot run stress test - no blueprints available");
      return;
    }
    
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (runtimeMetrics) {
      runtimeMetrics.stressTestActive = true;
    }

    BrowserLogger.info("Bootstrap", "Creating stress test entities", {
      propCount,
      blueprintCount: sourceBlueprints.length
    });

    for (let index = 0; index < propCount; index += 1) {
      const blueprint = structuredClone(sourceBlueprints[index % sourceBlueprints.length]);
      if (!blueprint) {
        BrowserLogger.warn("Bootstrap", `Skipping null blueprint at index ${index}`);
        continue;
      }
      
      blueprint.logicGraph = undefined;
      const blueprintName = `${blueprint.name}-prop-${index}`;
      blueprintLibrary?.set(blueprintName, blueprint);
      const entity = world.createEntity();
      world.addComponents(entity, {
        blueprintRef: { name: blueprintName },
        pixelArt: {
          ...blueprint,
          matrix: blueprint.matrix.map((row) => [...row]),
          colorMap: { ...blueprint.colorMap },
          spriteFrames: blueprint.spriteFrames?.map((frame) => frame.map((row) => [...row])),
        },
        position: {
          x: (index % 100) * 12,
          y: Math.floor(index / 100) * 10,
        },
        renderLayer: { order: 1 },
        velocity: { x: 0, y: 0 },
      });
      
      if (index % 100 === 0) {
        BrowserLogger.debug("Bootstrap", `Created ${index} stress test entities`);
      }
    }

    for (let index = 0; index < actorCount; index += 1) {
      const blueprint = structuredClone(sourceBlueprints[index % sourceBlueprints.length]);
      if (!blueprint) continue;
      
      blueprint.logicGraph = {
        version: 1,
        nodes: [
          {
            id: `trigger-${index}`,
            kind: "trigger",
            type: "OnTimer",
            position: { x: 0, y: 0 },
            data: { ms: 180 + (index % 8) * 40 },
          },
          {
            id: `action-${index}`,
            kind: "action",
            type: "ModifyComponent",
            position: { x: 180, y: 0 },
            data: {
              component: "velocity",
              field: index % 2 === 0 ? "x" : "y",
              mode: "add",
              value: index % 2 === 0 ? 6 : -6,
            },
          },
        ],
        connections: [
          {
            id: `connection-${index}`,
            from: { nodeId: `trigger-${index}`, port: "out" },
            to: { nodeId: `action-${index}`, port: "in" },
          },
        ],
      };
      const blueprintName = `${blueprint.name}-actor-${index}`;
      blueprintLibrary?.set(blueprintName, blueprint);
      const entity = world.createEntity();
      world.addComponents(entity, {
        blueprintRef: { name: blueprintName },
        pixelArt: {
          ...blueprint,
          matrix: blueprint.matrix.map((row) => [...row]),
          colorMap: { ...blueprint.colorMap },
          spriteFrames: blueprint.spriteFrames?.map((frame) => frame.map((row) => [...row])),
        },
        position: {
          x: (index % 100) * 12,
          y: 280 + Math.floor(index / 100) * 10,
        },
        renderLayer: { order: (index % 5) + 5 },
        velocity: { x: (index % 5) - 2, y: ((index + 2) % 5) - 2 },
      });
    }
  });

  let lastFrame = performance.now();
  let fps = 0;

  const frame = (now: number) => {
    const frameStart = performance.now();
    const deltaTime = Math.min((now - lastFrame) / 1000, 0.1);

    const scale = syncCanvasScale(canvas);
    const viewport = world.getResource("viewport");
    if (!viewport) {
      return;
    }

    viewport.displayScale = scale.displayScale;
    viewport.logicalWidth = scale.logicalWidth;
    viewport.logicalHeight = scale.logicalHeight;

    try {
      if (!paused) {
        world.update(deltaTime);
        world.render(deltaTime);
      } else {
        world.render(0);
      }
    } catch (error) {
      BrowserLogger.error("Bootstrap", "Error in game loop", error);
    }

    const camera = world.getResource("camera");
    const interactionState = world.getResource("interactionState");
    const renderStats = world.getResource("renderStats");
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const snapshotState = world.getResource("snapshotState");

    if (!camera || !interactionState || !renderStats || !runtimeMetrics || viewport === undefined) {
      BrowserLogger.error("Bootstrap", "Required resources missing from world", {
        camera: !!camera,
        interactionState: !!interactionState,
        renderStats: !!renderStats,
        runtimeMetrics: !!runtimeMetrics,
        viewport: viewport !== undefined
      });
      throw new Error("Renderer resources are missing from world.");
    }
    const eventBus = world.getResource("eventBus");
    if (eventBus) {
      eventBus.frameEvents = [];
    }

    runtimeMetrics.systemBenchmarks = [...world.getSystemBenchmarks()];
    runtimeMetrics.currentFps = fps;
    runtimeMetrics.lowPerformanceMode = runtimeMetrics.stressTestActive && fps < 60;
    runtimeMetrics.namedBenchmarks = {
      logicGraphSystemMs:
        runtimeMetrics.systemBenchmarks.find((entry) => entry.systemName === "LogicGraphSystem")
          ?.durationMs ?? 0,
      physicsSystemMs:
        runtimeMetrics.systemBenchmarks.find((entry) => entry.systemName === "PhysicsSystem")
          ?.durationMs ?? 0,
      renderSystemMs:
        runtimeMetrics.systemBenchmarks.find((entry) => entry.systemName === "RenderSystem")
          ?.durationMs ?? 0,
    };
    const memory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
      };
    };
    runtimeMetrics.heapUsedMb = memory.memory ? memory.memory.usedJSHeapSize / (1024 * 1024) : null;

    if (!paused) {
      snapshotService.captureWithResources(world, now, [
        "camera",
        "interactionState",
        "logicRuntime",
        "renderStats",
        "runtimeMetrics",
        "viewport",
      ]);
    }
    const snapshot = snapshotService.getLatestSnapshot();
    if (snapshot && snapshotState !== undefined) {
      world.setResource("snapshotState", {
        createdAt: snapshot.createdAt,
        entities: snapshot.entities.map((entity) => ({
          components: entity.components as Record<string, unknown>,
          id: entity.id,
        })),
        nextEntityId: snapshot.nextEntityId,
        resources: snapshot.resources as Record<string, unknown>,
      });
    }
    emitRuntimeTraceUpdated({
      snapshotOffsetMs: runtimeMetrics.selectedSnapshotOffsetMs,
      tracedNodesByAsset: { ...runtimeMetrics.tracedNodesByAsset },
    });

    updateHud(
      hud,
      {
        camera,
        interactionState,
        renderStats,
        runtimeMetrics,
        viewport,
      },
      catalog,
      {
        fps,
        entityCount: world.getEntityCount(),
      },
    );
    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);

  return {
    startPlaytest: () => {
      playtestSnapshot = world.createSnapshot([
        "architectureRuntime",
        "camera",
        "eventBus",
        "interactionState",
        "logicRuntime",
        "renderStats",
        "runtimeMetrics",
        "snapshotState",
        "viewport",
      ]);
      paused = false;
    },
    stopPlaytest: () => {
      if (!playtestSnapshot) {
        return;
      }

      world.restoreSnapshot(playtestSnapshot);
      const runtimeMetrics = world.getResource("runtimeMetrics");
      if (runtimeMetrics) {
        runtimeMetrics.selectedSnapshotOffsetMs = 0;
      }
      paused = false;
    },
  };
}

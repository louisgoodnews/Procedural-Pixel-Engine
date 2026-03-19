import type {
  BlueprintCatalog,
  PixelBlueprint,
  WorldPlacement,
  WorldScene,
} from "../../shared/types";
import {
  emitBlueprintRequested,
  emitStressTestRequested,
  onBlueprintSelected,
} from "../editor/events";
import { showToast } from "../toasts";

type BuilderTool = "place" | "select";

interface WorldBuilderElements {
  addComponentButton: HTMLButtonElement;
  deleteSelectedButton: HTMLButtonElement;
  layerBackgroundButton: HTMLButtonElement;
  layerForegroundButton: HTMLButtonElement;
  layerMidgroundButton: HTMLButtonElement;
  panel: HTMLElement;
  reloadButton: HTMLButtonElement;
  saveButton: HTMLButtonElement;
  sceneName: HTMLElement;
  sceneStatus: HTMLElement;
  selectedBlueprint: HTMLElement;
  selectionStatus: HTMLElement;
  searchInput: HTMLInputElement;
  snapButton: HTMLButtonElement;
  stressTestButton: HTMLButtonElement;
  surface: HTMLElement;
  toolPlace: HTMLButtonElement;
  toolSelect: HTMLButtonElement;
}

export interface WorldBuilderController {
  copySelection(): boolean;
  deleteSelection(): boolean;
  exportSceneBundle(): Promise<void>;
  isDirty(): boolean;
  load(): Promise<void>;
  addComponentToSelection(componentName: string): boolean;
  pasteSelection(): boolean;
  render(active: boolean): void;
  save(): Promise<void>;
}

function requireElements(): WorldBuilderElements {
  const requireElement = <TElement extends HTMLElement>(selector: string): TElement => {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
      throw new Error(`World builder element "${selector}" was not found.`);
    }

    return element;
  };

  return {
    addComponentButton: requireElement("#world-builder-add-component"),
    deleteSelectedButton: requireElement("#world-builder-delete-selected"),
    layerBackgroundButton: requireElement("#world-builder-layer-background"),
    layerForegroundButton: requireElement("#world-builder-layer-foreground"),
    layerMidgroundButton: requireElement("#world-builder-layer-midground"),
    panel: requireElement("#world-builder-panel"),
    reloadButton: requireElement("#world-builder-reload"),
    saveButton: requireElement("#world-builder-save"),
    sceneName: requireElement("#world-builder-scene-name"),
    sceneStatus: requireElement("#world-builder-scene-status"),
    selectedBlueprint: requireElement("#world-builder-selected-blueprint"),
    selectionStatus: requireElement("#world-builder-selection-status"),
    searchInput: requireElement("#world-builder-search"),
    snapButton: requireElement("#world-builder-toggle-snap"),
    stressTestButton: requireElement("#world-builder-stress-test"),
    surface: requireElement("#world-builder-surface"),
    toolPlace: requireElement("#world-builder-tool-place"),
    toolSelect: requireElement("#world-builder-tool-select"),
  };
}

function cloneScene(scene: WorldScene): WorldScene {
  return {
    ...scene,
    placements: scene.placements.map((placement) => ({ ...placement })),
  };
}

function snapshotScene(scene: WorldScene): string {
  return JSON.stringify(scene);
}

function isWorldBlueprint(blueprint: PixelBlueprint): boolean {
  return blueprint.blueprintType?.trim().toLowerCase() === "world";
}

function drawBlueprintPreview(container: HTMLElement, blueprint: PixelBlueprint): void {
  container.innerHTML = "";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const matrix = blueprint.spriteFrames?.[0] ?? blueprint.matrix;
  const width = matrix[0]?.length ?? 1;
  const height = matrix.length;
  const scale = Math.max(2, Math.floor(48 / Math.max(width, height, 1)));
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.imageSmoothingEnabled = false;

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const token = matrix[row][column];
      if (!token) {
        continue;
      }

      const color = blueprint.colorMap[token];
      if (!color) {
        continue;
      }

      context.fillStyle = color;
      context.fillRect(column * scale, row * scale, scale, scale);
    }
  }

  container.append(canvas);
}

function clampToSurface(
  value: number,
  maxCells: number,
  cellSize: number,
  snapToGrid: boolean,
): number {
  const max = (maxCells - 1) * cellSize;
  const normalized = Math.max(0, Math.min(max, value));
  return snapToGrid ? Math.floor(normalized / cellSize) * cellSize : normalized;
}

export function initializeWorldBuilder(
  catalog: BlueprintCatalog,
  initialScene: WorldScene,
): WorldBuilderController {
  const elements = requireElements();
  const blueprintLibrary = new Map(
    catalog.blueprints.map((blueprint) => [blueprint.name, blueprint]),
  );
  let scene = cloneScene(initialScene);
  let savedSnapshot = snapshotScene(initialScene);
  let selectedBlueprintName = catalog.blueprints[0]?.name ?? "player";
  let selectedPlacementId: string | null = null;
  let copiedPlacement: WorldPlacement | null = null;
  let searchFilter = "";
  const visibleLayerBands = new Set(["background", "midground", "foreground"]);
  let tool: BuilderTool = "place";
  let snapToGrid = true;
  const getCellSize = (): number => scene.cellSize ?? 32;
  const getColumns = (): number => scene.width ?? 28;
  const getRows = (): number => scene.height ?? 18;

  const isDirty = (): boolean => snapshotScene(scene) !== savedSnapshot;

  const getSelectedPlacement = (): WorldPlacement | undefined =>
    selectedPlacementId
      ? scene.placements.find((placement) => placement.id === selectedPlacementId)
      : undefined;

  const selectPlacement = (placementId: string | null) => {
    selectedPlacementId = placementId;
    render(elements.panel.classList.contains("is-active"));
  };

  const deleteSelection = (): boolean => {
    const selectedPlacement = getSelectedPlacement();
    if (!selectedPlacement) {
      return false;
    }

    scene.placements = scene.placements.filter(
      (placement) => placement.id !== selectedPlacement.id,
    );
    selectedPlacementId = null;
    render(elements.panel.classList.contains("is-active"));
    return true;
  };

  const updatePlacementPosition = (
    placementId: string,
    clientX: number,
    clientY: number,
    offsetX = 0,
    offsetY = 0,
  ) => {
    const placement = scene.placements.find((entry) => entry.id === placementId);
    if (!placement) {
      return;
    }

    const rect = elements.surface.getBoundingClientRect();
    placement.x = clampToSurface(
      clientX - rect.left - offsetX,
      getColumns(),
      getCellSize(),
      snapToGrid,
    );
    placement.y = clampToSurface(
      clientY - rect.top - offsetY,
      getRows(),
      getCellSize(),
      snapToGrid,
    );
  };

  const beginPlacementDrag = (placementId: string, event: PointerEvent) => {
    const placement = scene.placements.find((entry) => entry.id === placementId);
    if (!placement) {
      return;
    }

    const startPlacement = { x: placement.x, y: placement.y };
    const startPointer = { x: event.clientX, y: event.clientY };

    const onMove = (moveEvent: PointerEvent) => {
      const rect = elements.surface.getBoundingClientRect();
      const nextX = startPlacement.x + (moveEvent.clientX - startPointer.x);
      const nextY = startPlacement.y + (moveEvent.clientY - startPointer.y);
      updatePlacementPosition(placementId, rect.left + nextX, rect.top + nextY);
      render(elements.panel.classList.contains("is-active"));
    };

    const onUp = (upEvent: PointerEvent) => {
      const rect = elements.surface.getBoundingClientRect();
      const nextX = startPlacement.x + (upEvent.clientX - startPointer.x);
      const nextY = startPlacement.y + (upEvent.clientY - startPointer.y);
      updatePlacementPosition(placementId, rect.left + nextX, rect.top + nextY);
      render(elements.panel.classList.contains("is-active"));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const renderPlacements = () => {
    elements.surface.innerHTML = "";
    const viewport = elements.surface.parentElement;
    const viewportRect = viewport?.getBoundingClientRect();

    for (const placement of [...scene.placements].sort((left, right) => left.layer - right.layer)) {
      const blueprint = blueprintLibrary.get(placement.blueprintName);
      if (!blueprint) {
        continue;
      }
      if (
        searchFilter.length > 0 &&
        !placement.blueprintName.toLowerCase().includes(searchFilter) &&
        !(placement.components ?? []).some((component) =>
          component.toLowerCase().includes(searchFilter),
        )
      ) {
        continue;
      }
      const band =
        placement.layer < 10 ? "background" : placement.layer < 20 ? "midground" : "foreground";
      if (!visibleLayerBands.has(band)) {
        continue;
      }

      const object = document.createElement("button");
      object.type = "button";
      object.className = `world-object ${selectedPlacementId === placement.id ? "is-selected" : ""}`;
      object.style.left = `${placement.x}px`;
      object.style.top = `${placement.y}px`;
      object.style.zIndex = String(placement.layer + 1);
      object.title = `${placement.blueprintName} (${placement.x}, ${placement.y})`;
      if (viewportRect) {
        const objectSize = 48;
        const hiddenHorizontally =
          placement.x + objectSize < (viewport?.scrollLeft ?? 0) ||
          placement.x > (viewport?.scrollLeft ?? 0) + viewportRect.width;
        const hiddenVertically =
          placement.y + objectSize < (viewport?.scrollTop ?? 0) ||
          placement.y > (viewport?.scrollTop ?? 0) + viewportRect.height;
        if (hiddenHorizontally || hiddenVertically) {
          continue;
        }
      }
      drawBlueprintPreview(object, blueprint);
      object.addEventListener("click", (event) => {
        event.stopPropagation();
        tool = "select";
        selectPlacement(placement.id);
      });
      object.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        emitBlueprintRequested(blueprint);
      });
      object.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        tool = "select";
        selectPlacement(placement.id);
        beginPlacementDrag(placement.id, event);
      });
      elements.surface.append(object);
    }
  };

  const render = (active: boolean) => {
    elements.panel.classList.toggle("is-active", active);
    elements.surface.style.setProperty("--world-grid-size", `${getCellSize()}px`);
    elements.surface.style.minWidth = `${getColumns() * getCellSize()}px`;
    elements.surface.style.minHeight = `${getRows() * getCellSize()}px`;
    elements.sceneName.textContent = `${scene.name}.json${isDirty() ? " *" : ""}`;
    elements.sceneStatus.textContent = `${scene.placements.length} placed objects`;
    elements.selectedBlueprint.textContent = selectedBlueprintName
      ? `Selected asset: ${selectedBlueprintName}.json`
      : "Select a blueprint from the browser.";
    const selectedPlacement = getSelectedPlacement();
    elements.selectionStatus.textContent = selectedPlacement
      ? `Selected object: ${selectedPlacement.blueprintName} at ${selectedPlacement.x}, ${selectedPlacement.y} • components ${selectedPlacement.components?.length ?? 0}`
      : "No object selected.";
    elements.toolPlace.classList.toggle("is-selected", tool === "place");
    elements.toolSelect.classList.toggle("is-selected", tool === "select");
    elements.snapButton.classList.toggle("is-selected", snapToGrid);
    elements.snapButton.textContent = snapToGrid ? "Snap On" : "Snap Off";
    elements.layerBackgroundButton.classList.toggle(
      "is-selected",
      visibleLayerBands.has("background"),
    );
    elements.layerMidgroundButton.classList.toggle(
      "is-selected",
      visibleLayerBands.has("midground"),
    );
    elements.layerForegroundButton.classList.toggle(
      "is-selected",
      visibleLayerBands.has("foreground"),
    );
    renderPlacements();
  };

  const placeBlueprint = (clientX: number, clientY: number) => {
    const blueprint = blueprintLibrary.get(selectedBlueprintName);
    if (!blueprint) {
      showToast("Select a blueprint before placing objects", "error");
      return;
    }

    const rect = elements.surface.getBoundingClientRect();
    const x = clampToSurface(clientX - rect.left, getColumns(), getCellSize(), snapToGrid);
    const y = clampToSurface(clientY - rect.top, getRows(), getCellSize(), snapToGrid);
    const layer = isWorldBlueprint(blueprint) ? 0 : 10;

    scene.placements = scene.placements.filter(
      (placement) => !(placement.x === x && placement.y === y && placement.layer === layer),
    );

    const placementId = `placement-${crypto.randomUUID()}`;
    scene.placements.push({
      id: placementId,
      blueprintName: blueprint.name,
      layer,
      x,
      y,
    });
    selectedPlacementId = placementId;
    render(elements.panel.classList.contains("is-active"));
  };

  elements.surface.addEventListener("click", (event) => {
    if (tool === "place") {
      placeBlueprint(event.clientX, event.clientY);
      return;
    }

    selectPlacement(null);
  });

  elements.toolSelect.addEventListener("click", () => {
    tool = "select";
    render(elements.panel.classList.contains("is-active"));
  });

  elements.toolPlace.addEventListener("click", () => {
    tool = "place";
    render(elements.panel.classList.contains("is-active"));
  });

  elements.snapButton.addEventListener("click", () => {
    snapToGrid = !snapToGrid;
    render(elements.panel.classList.contains("is-active"));
  });

  elements.stressTestButton.addEventListener("click", () => {
    emitStressTestRequested({ actorCount: 2_500, propCount: 2_500 });
    showToast("Extreme stress test requested", "info");
  });

  onBlueprintSelected((blueprint) => {
    selectedBlueprintName = blueprint.name;
    render(elements.panel.classList.contains("is-active"));
  });

  window.addEventListener("keydown", (event) => {
    if (!elements.panel.classList.contains("is-active")) {
      return;
    }

    if (event.code !== "Delete") {
      return;
    }

    const selectedPlacement = getSelectedPlacement();
    if (!selectedPlacement) {
      return;
    }

    event.preventDefault();
    if (deleteSelection()) {
      showToast("World object deleted", "info");
      render(true);
    }
  });

  const save = async () => {
    try {
      const saved = await window.api.saveScene(scene);
      scene = cloneScene(saved);
      savedSnapshot = snapshotScene(saved);
      showToast("World scene saved successfully", "success");
      render(elements.panel.classList.contains("is-active"));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "World scene save failed", "error");
    }
  };

  elements.saveButton.addEventListener("click", () => {
    void save();
  });
  elements.reloadButton.addEventListener("click", () => {
    void load();
  });
  elements.deleteSelectedButton.addEventListener("click", () => {
    if (deleteSelection()) {
      showToast("World object deleted", "info");
    } else {
      showToast("No world object selected", "info");
    }
  });
  elements.addComponentButton.addEventListener("click", () => {
    const componentName = window.prompt("Component name", "Health")?.trim();
    if (!componentName) {
      return;
    }

    if (addComponentToSelection(componentName)) {
      showToast(`Added ${componentName}`, "success");
      return;
    }

    showToast("No world object selected", "info");
  });
  elements.searchInput.addEventListener("input", () => {
    searchFilter = elements.searchInput.value.trim().toLowerCase();
    render(elements.panel.classList.contains("is-active"));
  });
  const bindLayerToggle = (
    button: HTMLButtonElement,
    band: "background" | "foreground" | "midground",
  ) => {
    button.addEventListener("click", () => {
      if (visibleLayerBands.has(band)) {
        visibleLayerBands.delete(band);
      } else {
        visibleLayerBands.add(band);
      }
      render(elements.panel.classList.contains("is-active"));
    });
  };
  bindLayerToggle(elements.layerBackgroundButton, "background");
  bindLayerToggle(elements.layerMidgroundButton, "midground");
  bindLayerToggle(elements.layerForegroundButton, "foreground");
  elements.surface.parentElement?.addEventListener("scroll", () => {
    render(elements.panel.classList.contains("is-active"));
  });

  const load = async () => {
    try {
      const loaded = await window.api.loadScene(scene.name);
      scene = cloneScene(loaded);
      savedSnapshot = snapshotScene(loaded);
      selectedPlacementId = null;
      render(elements.panel.classList.contains("is-active"));
      showToast("World scene loaded", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "World scene load failed", "error");
    }
  };

  const addComponentToSelection = (componentName: string): boolean => {
    const selectedPlacement = getSelectedPlacement();
    if (!selectedPlacement) {
      return false;
    }

    const nextComponents = new Set(selectedPlacement.components ?? []);
    nextComponents.add(componentName);
    selectedPlacement.components = [...nextComponents].sort((left, right) =>
      left.localeCompare(right),
    );
    render(elements.panel.classList.contains("is-active"));
    return true;
  };

  return {
    addComponentToSelection,
    copySelection: () => {
      const selectedPlacement = getSelectedPlacement();
      if (!selectedPlacement) {
        return false;
      }

      copiedPlacement = { ...selectedPlacement };
      return true;
    },
    deleteSelection,
    exportSceneBundle: async () => {
      const fileName = await window.api.exportSceneBundle(scene.name, {
        exportedAt: new Date().toISOString(),
        kind: "scene-bundle",
        name: scene.name,
        scene,
        schemaVersion: 1,
      });
      showToast(`Exported ${fileName}`, "success");
    },
    isDirty,
    load,
    pasteSelection: () => {
      if (!copiedPlacement) {
        return false;
      }

      const offset = getCellSize();
      const sourcePlacement = copiedPlacement;
      if (!sourcePlacement) {
        return false;
      }
      let nextX = sourcePlacement.x;
      let nextY = sourcePlacement.y;

      let attempts = 0;
      do {
        nextX = clampToSurface(nextX + offset, getColumns(), getCellSize(), snapToGrid);
        nextY = clampToSurface(nextY + offset, getRows(), getCellSize(), snapToGrid);
        attempts += 1;
      } while (
        attempts < Math.max(getColumns(), getRows()) &&
        scene.placements.some(
          (placement) =>
            placement.id !== copiedPlacement?.id &&
            placement.id !== sourcePlacement.id &&
            placement.x === nextX &&
            placement.y === nextY &&
            placement.layer === sourcePlacement.layer,
        )
      );

      const nextPlacement: WorldPlacement = {
        ...sourcePlacement,
        id: `placement-${crypto.randomUUID()}`,
        x: nextX,
        y: nextY,
      };
      scene.placements.push(nextPlacement);
      selectedPlacementId = nextPlacement.id;
      render(elements.panel.classList.contains("is-active"));
      return true;
    },
    render,
    save,
  };
}

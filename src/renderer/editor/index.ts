import { validateBlueprintShape } from "../../shared/blueprintValidation";
import { zonePalettePresets } from "../../shared/palettes";
import type { BlueprintCatalog, LogicGraph, PixelBlueprint } from "../../shared/types";
import { createLogicCanvasController } from "../logic";
import { showToast } from "../toasts";
import type { WorldBuilderController } from "../worldBuilder";
import {
  emitBlueprintPersisted,
  emitBlueprintPreviewUpdated,
  onBlueprintRequested,
} from "./events";
import {
  type EditorState,
  applyBlueprint,
  centerMatrix,
  cloneBlueprint,
  commitHistory,
  createEditorState,
  createEmptyBlueprint,
  flipMatrixHorizontal,
  flipMatrixVertical,
  floodFill,
  redo,
  resizeMatrix,
  undo,
} from "./model";

type WorkspaceTabId = "world" | "world-builder" | string;
type CellMode = "erase" | "paint" | "sample";
type RegistryMode = "components" | "events" | "systems";

interface EditorOptions {
  blueprintFiles: string[];
  worldBuilder: WorldBuilderController;
}

interface EditorTab {
  id: string;
  originalName: string;
  savedSnapshot: string;
  state: EditorState;
}

interface EditorElements {
  addColorButton: HTMLButtonElement;
  architectureComponentAdd: HTMLButtonElement;
  architectureComponentInput: HTMLInputElement;
  architectureComponentList: HTMLElement;
  architectureModal: HTMLElement;
  architecturePanelComponents: HTMLElement;
  architecturePanelEvents: HTMLElement;
  architecturePanelSystems: HTMLElement;
  architectureEventAdd: HTMLButtonElement;
  architectureEventInput: HTMLInputElement;
  architectureEventList: HTMLElement;
  architectureTabEvents: HTMLButtonElement;
  architectureSystemsAdd: HTMLButtonElement;
  architectureSystemsInput: HTMLInputElement;
  architectureSystemsList: HTMLElement;
  architectureTabComponents: HTMLButtonElement;
  architectureTabSystems: HTMLButtonElement;
  architectureClose: HTMLButtonElement;
  assignedComponents: HTMLElement;
  assignedSystems: HTMLElement;
  blueprintTypeInput: HTMLInputElement;
  closeButton: HTMLButtonElement;
  colorCodeInput: HTMLInputElement;
  colorStudioClose: HTMLButtonElement;
  colorStudioCurrent: HTMLElement;
  colorStudioLibrary: HTMLElement;
  colorStudioModal: HTMLElement;
  colorStudioOpen: HTMLButtonElement;
  colorStudioPanelLibrary: HTMLElement;
  colorStudioPanelPicker: HTMLElement;
  colorStudioPicker: HTMLInputElement;
  colorStudioRecent: HTMLElement;
  colorStudioTabLibrary: HTMLButtonElement;
  colorStudioTabPicker: HTMLButtonElement;
  currentFile: HTMLElement;
  currentZone: HTMLElement;
  editorPanel: HTMLElement;
  editorSurface: HTMLElement;
  exitButton: HTMLButtonElement;
  exportBundleButton: HTMLButtonElement;
  exportWorkspaceButton: HTMLButtonElement;
  frameMeta: HTMLElement;
  grid: HTMLElement;
  gridMode: HTMLElement;
  gridShell: HTMLElement;
  gridSize: HTMLElement;
  importBlueprintButton: HTMLButtonElement;
  importBundleButton: HTMLButtonElement;
  issueList: HTMLElement;
  logicEditorClose: HTMLButtonElement;
  logicEditorCard: HTMLElement;
  logicEditorHeader: HTMLElement;
  logicEditorModal: HTMLElement;
  logicOpenButton: HTMLButtonElement;
  logicShell: HTMLElement;
  minimap: HTMLCanvasElement;
  minimapMeta: HTMLElement;
  modal: HTMLElement;
  modalCategory: HTMLSelectElement;
  modalCategoryField: HTMLElement;
  modalCancel: HTMLButtonElement;
  modalConfirm: HTMLButtonElement;
  modalCustomCategory: HTMLInputElement;
  modalCustomFields: HTMLElement;
  modalCustomHeight: HTMLInputElement;
  modalCustomToggle: HTMLInputElement;
  modalCustomType: HTMLInputElement;
  modalCustomWidth: HTMLInputElement;
  modalName: HTMLInputElement;
  modalSize: HTMLSelectElement;
  modalSizePresetField: HTMLElement;
  modalType: HTMLSelectElement;
  modalTypePresetField: HTMLElement;
  modalZonePalette: HTMLSelectElement;
  nameInput: HTMLInputElement;
  newButton: HTMLButtonElement;
  newProjectButton: HTMLButtonElement;
  nextFrameButton: HTMLButtonElement;
  openArchitectureStudioButton: HTMLButtonElement;
  openSettingsButton: HTMLButtonElement;
  openProjectButton: HTMLButtonElement;
  palette: HTMLElement;
  pixelSizeInput: HTMLInputElement;
  preview: HTMLCanvasElement;
  prevFrameButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
  resizeApply: HTMLButtonElement;
  resizeHeight: HTMLInputElement;
  resizeWidth: HTMLInputElement;
  saveButton: HTMLButtonElement;
  status: HTMLElement;
  tabs: HTMLElement;
  toolBucket: HTMLButtonElement;
  toolEraser: HTMLButtonElement;
  toolPen: HTMLButtonElement;
  toolPicker: HTMLButtonElement;
  toolSymmetry: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  deleteBlueprintButton: HTMLButtonElement;
  projectLabel: HTMLElement;
  projectBrowserClose: HTMLButtonElement;
  projectBrowserCreateConfirm: HTMLButtonElement;
  projectBrowserCurrent: HTMLElement;
  projectBrowserModal: HTMLElement;
  projectBrowserName: HTMLInputElement;
  projectBrowserOpenConfirm: HTMLButtonElement;
  projectBrowserPanelNew: HTMLElement;
  projectBrowserPanelOpen: HTMLElement;
  projectBrowserPath: HTMLInputElement;
  projectBrowserRecents: HTMLElement;
  projectBrowserTabNew: HTMLButtonElement;
  projectBrowserTabOpen: HTMLButtonElement;
  settingsApply: HTMLButtonElement;
  settingsClose: HTMLButtonElement;
  settingsFontSize: HTMLSelectElement;
  settingsModal: HTMLElement;
  settingsTheme: HTMLSelectElement;
  settingsUiScale: HTMLSelectElement;
  worldPanel: HTMLElement;
  zoneInput: HTMLInputElement;
}

const AUTOSAVE_PREFIX = "ppe.autosave.";
const AUTOSAVE_INTERVAL_MS = 60_000;
const COLOR_STUDIO_RECENTS_KEY = "ppe.colorStudio.recent";
const COLOR_STUDIO_TAB_KEY = "ppe.colorStudio.activeTab";
const ARCHITECTURE_TAB_KEY = "ppe.architecture.activeTab";
const COMPONENT_REGISTRY_KEY = "ppe.architecture.components";
const EVENT_REGISTRY_KEY = "ppe.architecture.events";
const LOGIC_WINDOW_POSITION_KEY = "ppe.logicWindow.position";
const RECENT_PROJECTS_KEY = "ppe.projects.recent";
const SETTINGS_FONT_SIZE_KEY = "ppe.settings.fontSize";
const SYSTEM_REGISTRY_KEY = "ppe.architecture.systems";
const SETTINGS_THEME_KEY = "ppe.settings.theme";
const SETTINGS_UI_SCALE_KEY = "ppe.settings.uiScale";

function requireElements(): EditorElements {
  const requireElement = <TElement extends HTMLElement>(selector: string): TElement => {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
      throw new Error(`Editor element "${selector}" was not found.`);
    }

    return element;
  };

  return {
    addColorButton: requireElement("#editor-add-color"),
    architectureComponentAdd: requireElement("#architecture-component-add"),
    architectureComponentInput: requireElement("#architecture-component-name"),
    architectureComponentList: requireElement("#architecture-component-list"),
    architectureModal: requireElement("#architecture-studio-modal"),
    architecturePanelComponents: requireElement("#architecture-panel-components"),
    architecturePanelEvents: requireElement("#architecture-panel-events"),
    architecturePanelSystems: requireElement("#architecture-panel-systems"),
    architectureEventAdd: requireElement("#architecture-event-add"),
    architectureEventInput: requireElement("#architecture-event-name"),
    architectureEventList: requireElement("#architecture-event-list"),
    architectureTabEvents: requireElement("#architecture-tab-events"),
    architectureSystemsAdd: requireElement("#architecture-system-add"),
    architectureSystemsInput: requireElement("#architecture-system-name"),
    architectureSystemsList: requireElement("#architecture-system-list"),
    architectureTabComponents: requireElement("#architecture-tab-components"),
    architectureTabSystems: requireElement("#architecture-tab-systems"),
    architectureClose: requireElement("#architecture-studio-close"),
    assignedComponents: requireElement("#editor-assigned-components"),
    assignedSystems: requireElement("#editor-assigned-systems"),
    blueprintTypeInput: requireElement("#editor-blueprint-type"),
    closeButton: requireElement("#editor-close"),
    colorCodeInput: requireElement("#editor-color-code"),
    colorStudioClose: requireElement("#color-studio-close"),
    colorStudioCurrent: requireElement("#editor-current-color"),
    colorStudioLibrary: requireElement("#color-studio-library"),
    colorStudioModal: requireElement("#color-studio-modal"),
    colorStudioOpen: requireElement("#editor-open-color-studio"),
    colorStudioPanelLibrary: requireElement("#color-studio-panel-library"),
    colorStudioPanelPicker: requireElement("#color-studio-panel-picker"),
    colorStudioPicker: requireElement("#color-studio-picker"),
    colorStudioRecent: requireElement("#color-studio-recent"),
    colorStudioTabLibrary: requireElement("#color-studio-tab-library"),
    colorStudioTabPicker: requireElement("#color-studio-tab-picker"),
    currentFile: requireElement("#editor-current-file"),
    currentZone: requireElement("#editor-current-zone"),
    editorPanel: requireElement("#editor-view-panel"),
    editorSurface: requireElement("#editor-surface"),
    exitButton: requireElement("#workspace-exit-app"),
    exportBundleButton: requireElement("#editor-export-bundle"),
    exportWorkspaceButton: requireElement("#workspace-export"),
    frameMeta: requireElement("#editor-frame-meta"),
    grid: requireElement("#editor-grid"),
    gridMode: requireElement("#editor-grid-mode"),
    gridShell: requireElement("#editor-grid-shell"),
    gridSize: requireElement("#editor-grid-size"),
    importBlueprintButton: requireElement("#editor-import-blueprint"),
    importBundleButton: requireElement("#editor-import-bundle"),
    issueList: requireElement("#editor-issues"),
    logicEditorClose: requireElement("#logic-editor-close"),
    logicEditorCard: requireElement("#logic-editor-card"),
    logicEditorHeader: requireElement("#logic-editor-header"),
    logicEditorModal: requireElement("#logic-editor-modal"),
    logicOpenButton: requireElement("#editor-open-logic-editor"),
    logicShell: requireElement("#logic-shell"),
    minimap: requireElement("#editor-minimap"),
    minimapMeta: requireElement("#editor-minimap-meta"),
    modal: requireElement("#new-blueprint-modal"),
    modalCategory: requireElement("#new-blueprint-category"),
    modalCategoryField: requireElement("#new-blueprint-category-field"),
    modalCancel: requireElement("#new-blueprint-cancel"),
    modalConfirm: requireElement("#new-blueprint-confirm"),
    modalCustomCategory: requireElement("#new-blueprint-custom-category"),
    modalCustomFields: requireElement("#new-blueprint-custom-fields"),
    modalCustomHeight: requireElement("#new-blueprint-custom-height"),
    modalCustomToggle: requireElement("#new-blueprint-custom-toggle"),
    modalCustomType: requireElement("#new-blueprint-custom-type"),
    modalCustomWidth: requireElement("#new-blueprint-custom-width"),
    modalName: requireElement("#new-blueprint-name"),
    modalSize: requireElement("#new-blueprint-size"),
    modalSizePresetField: requireElement("#new-blueprint-size-preset-field"),
    modalType: requireElement("#new-blueprint-type"),
    modalTypePresetField: requireElement("#new-blueprint-type-preset-field"),
    modalZonePalette: requireElement("#new-blueprint-zone-palette"),
    nameInput: requireElement("#editor-name"),
    newButton: requireElement("#workspace-new-blueprint"),
    newProjectButton: requireElement("#workspace-new-project"),
    nextFrameButton: requireElement("#editor-next-frame"),
    openArchitectureStudioButton: requireElement("#editor-open-architecture-studio"),
    openSettingsButton: requireElement("#workspace-open-settings"),
    openProjectButton: requireElement("#workspace-open-project"),
    palette: requireElement("#editor-palette"),
    pixelSizeInput: requireElement("#editor-pixel-size"),
    preview: requireElement("#editor-preview"),
    prevFrameButton: requireElement("#editor-prev-frame"),
    redoButton: requireElement("#editor-redo"),
    resizeApply: requireElement("#editor-resize-apply"),
    resizeHeight: requireElement("#editor-resize-height"),
    resizeWidth: requireElement("#editor-resize-width"),
    saveButton: requireElement("#editor-save"),
    status: requireElement("#editor-status"),
    tabs: requireElement("#workspace-tabs"),
    toolBucket: requireElement("#editor-tool-bucket"),
    toolEraser: requireElement("#editor-tool-eraser"),
    toolPen: requireElement("#editor-tool-pen"),
    toolPicker: requireElement("#editor-tool-picker"),
    toolSymmetry: requireElement("#editor-tool-symmetry"),
    undoButton: requireElement("#editor-undo"),
    deleteBlueprintButton: requireElement("#editor-delete-blueprint"),
    projectLabel: requireElement("#workspace-project-label"),
    projectBrowserClose: requireElement("#project-browser-close"),
    projectBrowserCreateConfirm: requireElement("#project-browser-create-confirm"),
    projectBrowserCurrent: requireElement("#project-browser-current"),
    projectBrowserModal: requireElement("#project-browser-modal"),
    projectBrowserName: requireElement("#project-browser-name"),
    projectBrowserOpenConfirm: requireElement("#project-browser-open-confirm"),
    projectBrowserPanelNew: requireElement("#project-browser-panel-new"),
    projectBrowserPanelOpen: requireElement("#project-browser-panel-open"),
    projectBrowserPath: requireElement("#project-browser-path"),
    projectBrowserRecents: requireElement("#project-browser-recents"),
    projectBrowserTabNew: requireElement("#project-browser-tab-new"),
    projectBrowserTabOpen: requireElement("#project-browser-tab-open"),
    settingsApply: requireElement("#settings-apply"),
    settingsClose: requireElement("#settings-close"),
    settingsFontSize: requireElement("#settings-font-size"),
    settingsModal: requireElement("#settings-modal"),
    settingsTheme: requireElement("#settings-theme"),
    settingsUiScale: requireElement("#settings-ui-scale"),
    worldPanel: requireElement("#world-view-panel"),
    zoneInput: requireElement("#editor-zone"),
  };
}

function snapshotBlueprint(blueprint: PixelBlueprint): string {
  return JSON.stringify(blueprint);
}

function getAutosaveKey(name: string): string {
  return `${AUTOSAVE_PREFIX}${name}`;
}

function normalizeColor(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const numbers = resolved.match(/\d+/g);

  if (!numbers || numbers.length < 3) {
    return "#8ac926";
  }

  return `#${numbers
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function loadStringList(key: string, fallback: string[]): string[] {
  const serialized = localStorage.getItem(key);
  if (!serialized) {
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
        )
      : [...fallback];
  } catch {
    return [...fallback];
  }
}

function saveStringList(key: string, values: string[]): void {
  localStorage.setItem(key, JSON.stringify(values));
}

function ensureSpriteFrames(blueprint: PixelBlueprint): string[][][] {
  if (!blueprint.spriteFrames || blueprint.spriteFrames.length === 0) {
    blueprint.spriteFrames = [blueprint.matrix.map((row) => [...row])];
  }

  if (!blueprint.matrix.length && blueprint.spriteFrames[0]) {
    blueprint.matrix = blueprint.spriteFrames[0].map((row) => [...row]);
  }

  return blueprint.spriteFrames;
}

function getFrameCount(blueprint: PixelBlueprint): number {
  return ensureSpriteFrames(blueprint).length;
}

function getActiveMatrix(state: EditorState): string[][] {
  const frames = ensureSpriteFrames(state.workingBlueprint);
  const safeIndex = Math.min(Math.max(state.activeFrameIndex, 0), frames.length - 1);
  state.activeFrameIndex = safeIndex;
  state.workingBlueprint.matrix = frames[safeIndex].map((row) => [...row]);
  return state.workingBlueprint.matrix;
}

function updateActiveMatrix(state: EditorState, matrix: string[][]): void {
  const frames = ensureSpriteFrames(state.workingBlueprint);
  const nextMatrix = matrix.map((row) => [...row]);
  frames[state.activeFrameIndex] = nextMatrix.map((row) => [...row]);
  state.workingBlueprint.matrix = nextMatrix;
  state.resizeHeight = nextMatrix.length;
  state.resizeWidth = nextMatrix[0]?.length ?? state.resizeWidth;
}

function createEditorTab(
  catalog: BlueprintCatalog,
  blueprint: PixelBlueprint,
  savedSnapshot: string,
): EditorTab {
  const state = createEditorState(catalog);
  applyBlueprint(state, blueprint, { resetHistory: true });
  ensureSpriteFrames(state.workingBlueprint);
  state.selectedToken = Object.keys(state.workingBlueprint.colorMap)[0] ?? "";
  getActiveMatrix(state);

  return {
    id: `editor-${crypto.randomUUID()}`,
    originalName: blueprint.name,
    savedSnapshot,
    state,
  };
}

function getBlueprintType(blueprint: PixelBlueprint): string {
  return blueprint.blueprintType?.trim() || "Sprite";
}

function loadRecentColors(): string[] {
  return loadStringList(COLOR_STUDIO_RECENTS_KEY, []);
}

function loadLogicWindowPosition(): { x: number; y: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOGIC_WINDOW_POSITION_KEY) ?? "null") as {
      x?: unknown;
      y?: unknown;
    } | null;
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {}

  return { x: 72, y: 72 };
}

function saveRecentColors(colors: string[]): void {
  localStorage.setItem(COLOR_STUDIO_RECENTS_KEY, JSON.stringify(colors.slice(0, 16)));
}

function getZonePalette(zonePalettePreset: string): Record<string, string> {
  const preset = zonePalettePresets[zonePalettePreset];
  if (!preset) {
    return { S: "#8ac926" };
  }

  return { ...preset };
}

function drawPreview(canvas: HTMLCanvasElement, blueprint: PixelBlueprint): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const matrix = blueprint.matrix;
  const width = matrix[0]?.length ?? 1;
  const height = matrix.length;
  const scale = Math.max(1, blueprint.pixelSize);

  canvas.width = width * scale;
  canvas.height = height * scale;
  context.clearRect(0, 0, canvas.width, canvas.height);
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
}

function renderValidation(elements: EditorElements, blueprint: PixelBlueprint): boolean {
  const validation = validateBlueprintShape(blueprint);
  elements.issueList.innerHTML = "";

  if (validation.valid) {
    elements.status.textContent = "Blueprint is valid and ready to save.";
    elements.status.className = "editor-status is-valid";
    return true;
  }

  elements.status.textContent = "Blueprint has validation issues.";
  elements.status.className = "editor-status is-invalid";

  for (const issue of validation.errors) {
    const item = document.createElement("li");
    item.textContent = issue;
    elements.issueList.append(item);
  }

  return false;
}

function cloneForAutosave(blueprint: PixelBlueprint): PixelBlueprint {
  return cloneBlueprint({
    ...blueprint,
    updatedAt: new Date().toISOString(),
  });
}

export function initializeBlueprintEditor(catalog: BlueprintCatalog, options: EditorOptions): void {
  const elements = requireElements();
  const logicCanvas = createLogicCanvasController();
  const knownBlueprints = new Map(
    catalog.blueprints.map((blueprint) => [blueprint.name, blueprint]),
  );
  const knownBlueprintFiles = new Set(options.blueprintFiles);
  const editorTabs: EditorTab[] = [];
  const componentRegistry = loadStringList(COMPONENT_REGISTRY_KEY, ["Health", "Mana", "Stamina"]);
  const eventRegistry = loadStringList(EVENT_REGISTRY_KEY, ["pulse", "alarm", "checkpoint"]);
  const systemRegistry = loadStringList(SYSTEM_REGISTRY_KEY, ["WeatherSystem"]);
  let activeTabId: WorkspaceTabId = "world";
  let colorStudioOpen = false;
  let architectureStudioOpen = false;
  let logicEditorOpen = false;
  let projectBrowserOpen = false;
  let settingsOpen = false;
  let projectBrowserTab: "new" | "open" = "open";
  let forceAppExit = false;
  let logicWindowPosition = loadLogicWindowPosition();
  let colorStudioColor = "#8ac926";
  let colorStudioTab =
    localStorage.getItem(COLOR_STUDIO_TAB_KEY) === "library" ? "library" : "picker";
  let architectureTab =
    localStorage.getItem(ARCHITECTURE_TAB_KEY) === "systems"
      ? "systems"
      : localStorage.getItem(ARCHITECTURE_TAB_KEY) === "events"
        ? "events"
        : "components";
  let recentColors = loadRecentColors();
  let recentProjects = loadStringList(RECENT_PROJECTS_KEY, []);

  const applyWorkspaceSettings = () => {
    const theme = localStorage.getItem(SETTINGS_THEME_KEY) ?? "dark";
    const fontSize = localStorage.getItem(SETTINGS_FONT_SIZE_KEY) ?? "16";
    const uiScale = localStorage.getItem(SETTINGS_UI_SCALE_KEY) ?? "1";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--workspace-font-size", `${fontSize}px`);
    document.documentElement.style.setProperty("--workspace-scale", uiScale);
    elements.settingsTheme.value = theme;
    elements.settingsFontSize.value = fontSize;
    elements.settingsUiScale.value = uiScale;
  };

  const renderSettings = () => {
    elements.settingsModal.classList.toggle("is-open", settingsOpen);
    elements.settingsModal.setAttribute("aria-hidden", settingsOpen ? "false" : "true");
  };

  const cleanupOrphanedAutosaves = () => {
    const validNames = new Set(
      Array.from(knownBlueprintFiles, (fileName) => fileName.replace(/\.json$/u, "")),
    );

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(AUTOSAVE_PREFIX)) {
        continue;
      }

      const blueprintName = key.slice(AUTOSAVE_PREFIX.length);
      if (!validNames.has(blueprintName)) {
        localStorage.removeItem(key);
      }
    }
  };

  cleanupOrphanedAutosaves();

  const getActiveEditor = (): EditorTab | undefined =>
    activeTabId === "world" || activeTabId === "world-builder"
      ? undefined
      : editorTabs.find((tab) => tab.id === activeTabId);

  const isDirty = (tab: EditorTab): boolean =>
    snapshotBlueprint(tab.state.workingBlueprint) !== tab.savedSnapshot;

  const hasDirtyWorkspace = (): boolean =>
    editorTabs.some((tab) => isDirty(tab)) || options.worldBuilder.isDirty();

  const syncFormToState = (state: EditorState) => {
    state.workingBlueprint.name = elements.nameInput.value.trim() || "untitled-blueprint";
    state.workingBlueprint.blueprintType = elements.blueprintTypeInput.value.trim() || "Sprite";
    state.workingBlueprint.zone = elements.zoneInput.value.trim() || "editor-lab";
    state.workingBlueprint.pixelSize = Math.max(1, Number(elements.pixelSizeInput.value) || 1);
    getActiveMatrix(state);
  };

  const persistRegistry = (mode: RegistryMode) => {
    if (mode === "components") {
      saveStringList(COMPONENT_REGISTRY_KEY, componentRegistry);
      return;
    }

    if (mode === "events") {
      saveStringList(EVENT_REGISTRY_KEY, eventRegistry);
      return;
    }

    saveStringList(SYSTEM_REGISTRY_KEY, systemRegistry);
  };

  const loadAutosave = (blueprint: PixelBlueprint): PixelBlueprint => {
    const serialized = localStorage.getItem(getAutosaveKey(blueprint.name));
    if (!serialized) {
      return cloneBlueprint(blueprint);
    }

    try {
      const parsed = JSON.parse(serialized) as unknown;
      const validation = validateBlueprintShape(parsed);

      if (!validation.valid) {
        return cloneBlueprint(blueprint);
      }

      showToast(`Recovered autosave for ${blueprint.name}.json`, "info");
      return cloneBlueprint(parsed as PixelBlueprint);
    } catch {
      return cloneBlueprint(blueprint);
    }
  };

  const setActiveTab = (tabId: WorkspaceTabId) => {
    activeTabId = tabId;
    render();

    if (tabId === "world") {
      const player = knownBlueprints.get("player");
      options.worldBuilder.render(false);
      if (player) {
        emitBlueprintPreviewUpdated(cloneBlueprint(player));
      }
      return;
    }

    if (tabId === "world-builder") {
      options.worldBuilder.render(true);
      return;
    }

    const active = getActiveEditor();
    if (active) {
      options.worldBuilder.render(false);
      emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    }
  };

  const openBlueprint = (source: PixelBlueprint) => {
    const existing = editorTabs.find(
      (tab) => tab.originalName === source.name || tab.state.workingBlueprint.name === source.name,
    );

    if (existing) {
      setActiveTab(existing.id);
      return;
    }

    const blueprint = loadAutosave(source);
    ensureSpriteFrames(blueprint);
    const tab = createEditorTab(catalog, blueprint, snapshotBlueprint(source));
    editorTabs.push(tab);
    showToast(`Loaded ${source.name}.json`, "info");
    setActiveTab(tab.id);
  };

  const closeActiveEditor = () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    if (isDirty(active)) {
      const shouldClose = window.confirm("Unsaved changes. Close anyway?");
      if (!shouldClose) {
        return;
      }
    }

    editorTabs.splice(
      editorTabs.findIndex((tab) => tab.id === active.id),
      1,
    );
    logicEditorOpen = false;
    setActiveTab("world");
  };

  const renderTabs = () => {
    elements.tabs.innerHTML = "";

    const createTabButton = (
      label: string,
      tabId: WorkspaceTabId,
      dirty = false,
      closeOnMiddle = false,
    ) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `workspace-tab ${activeTabId === tabId ? "is-active" : ""}`;
      button.textContent = `${label}${dirty ? " *" : ""}`;
      button.addEventListener("click", () => setActiveTab(tabId));
      if (closeOnMiddle) {
        button.addEventListener("auxclick", (event) => {
          if (event.button !== 1) {
            return;
          }

          event.preventDefault();
          const tab = editorTabs.find((entry) => entry.id === tabId);
          if (!tab) {
            return;
          }

          if (isDirty(tab) && !window.confirm("Unsaved changes. Close anyway?")) {
            return;
          }

          editorTabs.splice(editorTabs.indexOf(tab), 1);
          if (activeTabId === tabId) {
            logicEditorOpen = false;
            setActiveTab("world");
            return;
          }

          render();
        });
      }
      elements.tabs.append(button);
    };

    createTabButton("Canvas View", "world");
    createTabButton("Scene Editor", "world-builder", options.worldBuilder.isDirty());

    for (const tab of editorTabs) {
      createTabButton(
        `Editor: ${tab.state.workingBlueprint.name}.json`,
        tab.id,
        isDirty(tab),
        true,
      );
    }
  };

  const renderPalette = (state: EditorState) => {
    elements.palette.innerHTML = "";

    for (const [token, color] of Object.entries(state.workingBlueprint.colorMap)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `palette-swatch ${state.selectedToken === token ? "is-selected" : ""}`;
      button.style.setProperty("--swatch-color", color);
      button.innerHTML = `<span class="swatch-preview"></span><span>${token}</span>`;
      button.addEventListener("click", () => {
        state.selectedToken = token;
        state.selectedTool = "pen";
        colorStudioColor = normalizeColor(color);
        render();
      });
      elements.palette.append(button);
    }
  };

  const pushRecentColor = (color: string) => {
    recentColors = [color, ...recentColors.filter((entry) => entry !== color)].slice(0, 16);
    saveRecentColors(recentColors);
  };

  const applyStudioColor = (color: string) => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    colorStudioColor = normalizeColor(color);
    pushRecentColor(colorStudioColor);
    const token = active.state.selectedToken;

    commitMutation(() => {
      if (!token) {
        return false;
      }

      active.state.workingBlueprint.colorMap[token] = colorStudioColor;
      return true;
    });
  };

  const renderColorTiles = (
    container: HTMLElement,
    colors: Array<{ color: string; label: string }>,
  ) => {
    container.innerHTML = "";

    for (const entry of colors) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-tile";
      button.style.setProperty("--color-tile-value", entry.color);
      button.innerHTML = `<span class="color-tile-preview"></span><span>${entry.label}</span>`;
      button.addEventListener("click", () => applyStudioColor(entry.color));
      container.append(button);
    }
  };

  const renderColorStudio = (state?: EditorState) => {
    const activeState = state ?? getActiveEditor()?.state;
    const selectedToken = activeState?.selectedToken ?? "";
    const selectedColor =
      (selectedToken && activeState?.workingBlueprint.colorMap[selectedToken]) || colorStudioColor;

    colorStudioColor = normalizeColor(selectedColor || colorStudioColor);
    elements.colorStudioPicker.value = colorStudioColor;
    elements.colorStudioCurrent.innerHTML = `
      <span class="editor-current-color-preview" style="--current-color:${colorStudioColor}"></span>
      <span>${selectedToken || "No token selected"} • ${colorStudioColor}</span>
    `;
    elements.colorStudioModal.classList.toggle("is-open", colorStudioOpen);
    elements.colorStudioModal.setAttribute("aria-hidden", colorStudioOpen ? "false" : "true");
    elements.colorStudioTabPicker.classList.toggle("is-active", colorStudioTab === "picker");
    elements.colorStudioTabLibrary.classList.toggle("is-active", colorStudioTab === "library");
    elements.colorStudioPanelPicker.classList.toggle("is-hidden", colorStudioTab !== "picker");
    elements.colorStudioPanelLibrary.classList.toggle("is-hidden", colorStudioTab !== "library");

    renderColorTiles(
      elements.colorStudioRecent,
      recentColors.map((color) => ({ color, label: color })),
    );
    renderColorTiles(
      elements.colorStudioLibrary,
      Object.entries(activeState?.workingBlueprint.colorMap ?? {}).map(([token, color]) => ({
        color,
        label: token,
      })),
    );
  };

  const renderArchitectureStudio = (state?: EditorState) => {
    const activeState = state ?? getActiveEditor()?.state;
    elements.architectureModal.classList.toggle("is-open", architectureStudioOpen);
    elements.architectureModal.setAttribute(
      "aria-hidden",
      architectureStudioOpen ? "false" : "true",
    );
    elements.architectureTabComponents.classList.toggle(
      "is-active",
      architectureTab === "components",
    );
    elements.architectureTabSystems.classList.toggle("is-active", architectureTab === "systems");
    elements.architectureTabEvents.classList.toggle("is-active", architectureTab === "events");
    elements.architecturePanelComponents.classList.toggle(
      "is-hidden",
      architectureTab !== "components",
    );
    elements.architecturePanelSystems.classList.toggle("is-hidden", architectureTab !== "systems");
    elements.architecturePanelEvents.classList.toggle("is-hidden", architectureTab !== "events");

    const renderRegistry = (
      container: HTMLElement,
      items: string[],
      assigned: string[],
      onToggle: (item: string) => void,
    ) => {
      container.innerHTML = "";
      for (const item of items) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `tag-pill ${assigned.includes(item) ? "is-active" : ""}`;
        button.textContent = assigned.includes(item) ? `${item} • assigned` : item;
        button.addEventListener("click", () => onToggle(item));
        container.append(button);
      }
    };

    const renderEventRegistry = (container: HTMLElement, items: string[]) => {
      container.innerHTML = "";

      for (const item of items) {
        const row = document.createElement("div");
        row.className = "registry-row";

        const label = document.createElement("div");
        label.className = "registry-row-copy";
        label.innerHTML = `<strong>${item}</strong><span>Available to On Event and Emit Event nodes</span>`;

        const actions = document.createElement("div");
        actions.className = "registry-row-actions";

        const useButton = document.createElement("button");
        useButton.type = "button";
        useButton.className = "secondary-button";
        useButton.textContent = "Copy Name";
        useButton.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(item);
            showToast(`Copied ${item}`, "info");
          } catch {
            showToast("Clipboard copy failed", "error");
          }
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "secondary-button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
          const next = eventRegistry.filter((entry) => entry !== item);
          eventRegistry.splice(0, eventRegistry.length, ...next);
          persistRegistry("events");
          renderArchitectureStudio(getActiveEditor()?.state);
        });

        actions.append(useButton, removeButton);
        row.append(label, actions);
        container.append(row);
      }
    };

    renderRegistry(
      elements.architectureComponentList,
      componentRegistry,
      activeState?.workingBlueprint.assignedComponents ?? [],
      (item) => {
        commitMutation(() => {
          const list = new Set(activeState?.workingBlueprint.assignedComponents ?? []);
          if (list.has(item)) {
            list.delete(item);
          } else {
            list.add(item);
          }
          if (!activeState) {
            return false;
          }
          activeState.workingBlueprint.assignedComponents = [...list];
          return true;
        });
      },
    );

    renderRegistry(
      elements.architectureSystemsList,
      systemRegistry,
      activeState?.workingBlueprint.assignedGlobalSystems ?? [],
      (item) => {
        commitMutation(() => {
          const list = new Set(activeState?.workingBlueprint.assignedGlobalSystems ?? []);
          if (list.has(item)) {
            list.delete(item);
          } else {
            list.add(item);
          }
          if (!activeState) {
            return false;
          }
          activeState.workingBlueprint.assignedGlobalSystems = [...list];
          return true;
        });
      },
    );

    renderEventRegistry(elements.architectureEventList, eventRegistry);
  };

  const renderAssignments = (state: EditorState) => {
    const renderList = (container: HTMLElement, title: string, items: string[]) => {
      container.innerHTML = "";
      if (items.length === 0) {
        const empty = document.createElement("span");
        empty.className = "tag-pill is-muted";
        empty.textContent = `No ${title} assigned`;
        container.append(empty);
        return;
      }

      for (const item of items) {
        const pill = document.createElement("span");
        pill.className = "tag-pill is-active";
        pill.textContent = item;
        container.append(pill);
      }
    };

    renderList(
      elements.assignedComponents,
      "components",
      state.workingBlueprint.assignedComponents ?? [],
    );
    renderList(
      elements.assignedSystems,
      "global systems",
      state.workingBlueprint.assignedGlobalSystems ?? [],
    );
  };

  const applyCell = (state: EditorState, rowIndex: number, columnIndex: number, mode: CellMode) => {
    const matrix = getActiveMatrix(state);

    if (mode === "sample") {
      const token = matrix[rowIndex]?.[columnIndex];
      if (token) {
        state.selectedToken = token;
        state.selectedTool = "pen";
      }
      render();
      return;
    }

    commitMutation(() => {
      const nextToken = mode === "erase" ? "" : state.selectedToken;
      const nextMatrix = matrix.map((row) => [...row]);

      if (state.selectedTool === "bucket" && mode === "paint") {
        const changed = floodFill(nextMatrix, rowIndex, columnIndex, nextToken);
        if (state.symmetryHorizontal) {
          const mirroredColumn = nextMatrix[rowIndex].length - columnIndex - 1;
          floodFill(nextMatrix, rowIndex, mirroredColumn, nextToken);
        }
        if (!changed) {
          return false;
        }
        updateActiveMatrix(state, nextMatrix);
        return true;
      }

      const previous = nextMatrix[rowIndex][columnIndex];
      if (previous === nextToken) {
        return false;
      }

      nextMatrix[rowIndex][columnIndex] = nextToken;
      if (state.symmetryHorizontal) {
        const mirroredColumn = nextMatrix[rowIndex].length - columnIndex - 1;
        nextMatrix[rowIndex][mirroredColumn] = nextToken;
      }

      updateActiveMatrix(state, nextMatrix);
      return true;
    });
  };

  const renderGrid = (state: EditorState) => {
    const matrix = getActiveMatrix(state);
    elements.grid.innerHTML = "";
    elements.grid.style.setProperty("--editor-columns", String(matrix[0]?.length ?? 0));
    elements.grid.classList.add("editor-grid-virtual");

    const width = matrix[0]?.length ?? 0;
    const height = matrix.length;
    const cellSize =
      width > 8192 || height > 8192
        ? 2
        : width > 2048 || height > 2048
          ? 4
          : width > 512 || height > 512
            ? 8
            : 20;

    const surface = document.createElement("div");
    surface.className = "editor-grid-virtual-surface";
    surface.style.width = `${Math.max(1, width * cellSize)}px`;
    surface.style.height = `${Math.max(1, height * cellSize)}px`;

    const canvas = document.createElement("canvas");
    canvas.className = "editor-grid-canvas";
    surface.append(canvas);
    elements.grid.append(surface);

    const renderVisible = () => {
      const viewportWidth = Math.max(1, elements.grid.clientWidth);
      const viewportHeight = Math.max(1, elements.grid.clientHeight);
      const scrollLeft = elements.grid.scrollLeft;
      const scrollTop = elements.grid.scrollTop;
      const startColumn = Math.max(0, Math.floor(scrollLeft / cellSize));
      const startRow = Math.max(0, Math.floor(scrollTop / cellSize));
      const endColumn = Math.min(width, Math.ceil((scrollLeft + viewportWidth) / cellSize) + 1);
      const endRow = Math.min(height, Math.ceil((scrollTop + viewportHeight) / cellSize) + 1);
      const deviceScale = window.devicePixelRatio || 1;

      canvas.width = Math.ceil(viewportWidth * deviceScale);
      canvas.height = Math.ceil(viewportHeight * deviceScale);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      canvas.style.left = `${scrollLeft}px`;
      canvas.style.top = `${scrollTop}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      context.fillStyle = "rgba(8, 14, 15, 0.96)";
      context.fillRect(0, 0, viewportWidth, viewportHeight);

      for (let row = startRow; row < endRow; row += 1) {
        for (let column = startColumn; column < endColumn; column += 1) {
          const token = matrix[row][column];
          const localX = column * cellSize - scrollLeft;
          const localY = row * cellSize - scrollTop;

          if (token) {
            const color = state.workingBlueprint.colorMap[token];
            if (color) {
              context.fillStyle = color;
              context.fillRect(localX, localY, cellSize, cellSize);
            }
          }

          if (cellSize >= 8) {
            context.strokeStyle = "rgba(255,255,255,0.08)";
            context.strokeRect(localX, localY, cellSize, cellSize);
          }
        }
      }

      renderMiniMap();
    };

    const renderMiniMap = () => {
      const minimapSize = 160;
      const viewportWidth = Math.max(1, elements.grid.clientWidth);
      const viewportHeight = Math.max(1, elements.grid.clientHeight);
      const totalWidth = Math.max(1, width * cellSize);
      const totalHeight = Math.max(1, height * cellSize);
      const sampleStep = Math.max(1, Math.ceil(Math.max(width, height) / 128));
      const scale = Math.min(minimapSize / Math.max(1, width), minimapSize / Math.max(1, height));
      const canvasWidth = Math.max(1, Math.floor(width * scale));
      const canvasHeight = Math.max(1, Math.floor(height * scale));
      const deviceScale = window.devicePixelRatio || 1;

      elements.minimap.width = Math.ceil(canvasWidth * deviceScale);
      elements.minimap.height = Math.ceil(canvasHeight * deviceScale);
      elements.minimap.style.width = `${canvasWidth}px`;
      elements.minimap.style.height = `${canvasHeight}px`;
      elements.minimapMeta.textContent = `${Math.round((elements.grid.scrollLeft / totalWidth) * 100)}% / ${Math.round((elements.grid.scrollTop / totalHeight) * 100)}%`;

      const context = elements.minimap.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.fillStyle = "rgba(8, 14, 15, 0.96)";
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      for (let row = 0; row < height; row += sampleStep) {
        for (let column = 0; column < width; column += sampleStep) {
          const token = matrix[row]?.[column];
          if (!token) {
            continue;
          }

          const color = state.workingBlueprint.colorMap[token];
          if (!color) {
            continue;
          }

          context.fillStyle = color;
          context.fillRect(
            column * scale,
            row * scale,
            Math.max(1, sampleStep * scale),
            Math.max(1, sampleStep * scale),
          );
        }
      }

      context.strokeStyle = "rgba(142, 202, 230, 0.9)";
      context.lineWidth = 1;
      context.strokeRect(
        (elements.grid.scrollLeft / totalWidth) * canvasWidth,
        (elements.grid.scrollTop / totalHeight) * canvasHeight,
        Math.max(8, (viewportWidth / totalWidth) * canvasWidth),
        Math.max(8, (viewportHeight / totalHeight) * canvasHeight),
      );
    };

    const applyFromPointer = (event: MouseEvent, modeOverride?: CellMode) => {
      const rect = canvas.getBoundingClientRect();
      const column = Math.floor((event.clientX - rect.left + elements.grid.scrollLeft) / cellSize);
      const row = Math.floor((event.clientY - rect.top + elements.grid.scrollTop) / cellSize);

      if (row < 0 || row >= height || column < 0 || column >= width) {
        return;
      }

      const mode =
        modeOverride ??
        (state.selectedTool === "picker"
          ? "sample"
          : state.selectedTool === "eraser"
            ? "erase"
            : "paint");
      applyCell(state, row, column, mode);
    };

    canvas.addEventListener("click", (event) => {
      applyFromPointer(event);
    });
    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      applyFromPointer(event, "erase");
    });
    elements.grid.onscroll = renderVisible;
    elements.minimap.onclick = (event) => {
      const rect = elements.minimap.getBoundingClientRect();
      const targetX = (event.clientX - rect.left) / Math.max(1, rect.width);
      const targetY = (event.clientY - rect.top) / Math.max(1, rect.height);
      elements.grid.scrollLeft = Math.max(
        0,
        targetX * width * cellSize - elements.grid.clientWidth / 2,
      );
      elements.grid.scrollTop = Math.max(
        0,
        targetY * height * cellSize - elements.grid.clientHeight / 2,
      );
      renderVisible();
    };
    window.requestAnimationFrame(renderVisible);
  };

  const renderEditor = (tab: EditorTab) => {
    const state = tab.state;
    const matrix = getActiveMatrix(state);
    const frameCount = getFrameCount(state.workingBlueprint);
    const isSystemAsset = state.workingBlueprint.blueprintCategory === "System";

    elements.currentFile.textContent = `${state.workingBlueprint.name}.json${isDirty(tab) ? " *" : ""}`;
    elements.currentZone.textContent = `${state.workingBlueprint.zone} • ${state.workingBlueprint.blueprintCategory ?? "Component"} / ${getBlueprintType(state.workingBlueprint)} • revision ${state.workingBlueprint.revision}`;
    elements.blueprintTypeInput.value = getBlueprintType(state.workingBlueprint);
    elements.nameInput.value = state.workingBlueprint.name;
    elements.zoneInput.value = state.workingBlueprint.zone;
    elements.pixelSizeInput.value = String(state.workingBlueprint.pixelSize);
    elements.resizeWidth.value = String(state.resizeWidth);
    elements.resizeHeight.value = String(state.resizeHeight);
    elements.gridSize.textContent = `${matrix[0]?.length ?? 0} x ${matrix.length}`;
    elements.gridMode.textContent = `Tool: ${state.selectedTool}${state.symmetryHorizontal ? " • symmetry" : ""}`;
    elements.frameMeta.textContent = `Frame ${state.activeFrameIndex + 1} of ${frameCount} • imports ${state.workingBlueprint.importSources?.length ?? 0} • children ${state.workingBlueprint.childBlueprints?.length ?? 0}`;
    elements.prevFrameButton.disabled = frameCount <= 1;
    elements.undoButton.disabled = state.history.length === 0;
    elements.redoButton.disabled = state.future.length === 0;
    elements.toolPen.classList.toggle("is-selected", state.selectedTool === "pen");
    elements.toolBucket.classList.toggle("is-selected", state.selectedTool === "bucket");
    elements.toolEraser.classList.toggle("is-selected", state.selectedTool === "eraser");
    elements.toolPicker.classList.toggle("is-selected", state.selectedTool === "picker");
    elements.toolSymmetry.classList.toggle("is-selected", state.symmetryHorizontal);

    renderAssignments(state);
    renderPalette(state);
    renderColorStudio(state);
    renderArchitectureStudio(state);
    elements.editorPanel.dataset.editorMode = isSystemAsset ? "system" : "component";
    elements.logicEditorClose.hidden = isSystemAsset;
    elements.logicEditorModal.classList.toggle("is-open", isSystemAsset || logicEditorOpen);
    elements.logicEditorModal.setAttribute(
      "aria-hidden",
      isSystemAsset || logicEditorOpen ? "false" : "true",
    );
    applyLogicWindowPosition();
    if (!isSystemAsset) {
      renderGrid(state);
      drawPreview(elements.preview, state.workingBlueprint);
    } else {
      elements.grid.innerHTML = "";
      elements.minimapMeta.textContent = "";
      const previewContext = elements.preview.getContext("2d");
      previewContext?.clearRect(0, 0, elements.preview.width, elements.preview.height);
    }
    logicCanvas.render(state.workingBlueprint, {
      onTransient: (graph: LogicGraph) => {
        state.workingBlueprint.logicGraph = graph;
        emitBlueprintPreviewUpdated(cloneBlueprint(state.workingBlueprint));
      },
      onUpdate: (graph: LogicGraph) => {
        commitMutation(() => {
          state.workingBlueprint.logicGraph = graph;
          return true;
        });
      },
    });
    renderValidation(elements, state.workingBlueprint);
  };

  const render = () => {
    renderTabs();
    const active = getActiveEditor();
    const worldActive = activeTabId === "world";
    const worldBuilderActive = activeTabId === "world-builder";
    const editorActive = Boolean(active);

    elements.worldPanel.classList.toggle("is-active", worldActive);
    elements.editorPanel.classList.toggle("is-active", editorActive);
    elements.editorPanel.dataset.editorMode = "component";
    options.worldBuilder.render(worldBuilderActive);

    if (active && editorActive) {
      renderEditor(active);
      return;
    }

    elements.currentFile.textContent = "No blueprint open";
    elements.currentZone.textContent = "Open a blueprint from the browser or create a new one.";
    elements.grid.innerHTML = "";
    elements.palette.innerHTML = "";
    elements.issueList.innerHTML = "";
    elements.frameMeta.textContent = "No frames available.";
    elements.colorStudioCurrent.textContent = "No token selected";
    elements.assignedComponents.innerHTML = "";
    elements.assignedSystems.innerHTML = "";
    elements.logicEditorClose.hidden = false;
    elements.logicEditorModal.classList.remove("is-open");
    elements.logicEditorModal.setAttribute("aria-hidden", "true");
    logicCanvas.clear();
    elements.status.textContent = worldBuilderActive
      ? "World Builder active."
      : "Choose a blueprint to begin editing.";
    elements.status.className = "editor-status";
    renderColorStudio();
    renderArchitectureStudio();
  };

  const commitMutation = (mutate: () => boolean | undefined) => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    syncFormToState(active.state);
    commitHistory(active.state);
    const changed = mutate();

    if (changed === false) {
      active.state.history.pop();
      return;
    }

    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  };

  const saveActiveEditor = async () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    syncFormToState(active.state);
    const valid = renderValidation(elements, active.state.workingBlueprint);
    if (!valid) {
      showToast("Blueprint validation failed", "error");
      return;
    }

    try {
      const saved = await window.api.saveBlueprint(active.state.workingBlueprint);
      knownBlueprints.set(saved.name, cloneBlueprint(saved));
      knownBlueprintFiles.add(`${saved.name}.json`);
      active.originalName = saved.name;
      applyBlueprint(active.state, saved, { resetHistory: true });
      active.savedSnapshot = snapshotBlueprint(saved);
      localStorage.removeItem(getAutosaveKey(saved.name));
      emitBlueprintPersisted(cloneBlueprint(saved));
      emitBlueprintPreviewUpdated(cloneBlueprint(saved));
      showToast("Blueprint saved successfully", "success");
      render();
    } catch (error) {
      elements.status.textContent =
        error instanceof Error ? error.message : "Failed to save blueprint.";
      elements.status.className = "editor-status is-invalid";
      showToast("Blueprint save failed", "error");
    }
  };

  const syncCreateModalVisibility = () => {
    const useCustomSettings = elements.modalCustomToggle.checked;
    const category = elements.modalCategory.value;
    elements.modalCustomFields.classList.toggle("is-hidden", !useCustomSettings);
    elements.modalCategoryField.classList.toggle("is-hidden", useCustomSettings);
    elements.modalTypePresetField.classList.toggle("is-hidden", useCustomSettings);
    elements.modalSizePresetField.classList.toggle("is-hidden", useCustomSettings);
    elements.modalType.disabled = !useCustomSettings && category === "System";
  };

  const openCreateModal = () => {
    elements.modal.classList.add("is-open");
    elements.modal.setAttribute("aria-hidden", "false");
    syncCreateModalVisibility();
    elements.modalName.focus();
  };

  const closeCreateModal = () => {
    elements.modal.classList.remove("is-open");
    elements.modal.setAttribute("aria-hidden", "true");
    elements.modalName.value = "";
    elements.modalCategory.value = "Component";
    elements.modalType.value = "Sprite";
    elements.modalSize.value = "8";
    elements.modalZonePalette.value = "zone-1-core-gold";
    elements.modalCustomToggle.checked = false;
    elements.modalCustomCategory.value = "";
    elements.modalCustomType.value = "";
    elements.modalCustomWidth.value = "16";
    elements.modalCustomHeight.value = "16";
    syncCreateModalVisibility();
  };

  const createNewBlueprintTab = () => {
    const name = elements.modalName.value.trim() || "new-blueprint";
    const useCustomSettings = elements.modalCustomToggle.checked;
    const presetSize =
      elements.modalSize.value === "custom" ? 16 : Number(elements.modalSize.value) || 8;
    const width = useCustomSettings
      ? Math.max(1, Number(elements.modalCustomWidth.value) || 16)
      : presetSize;
    const height = useCustomSettings
      ? Math.max(1, Number(elements.modalCustomHeight.value) || 16)
      : presetSize;
    const blueprintCategory = useCustomSettings
      ? elements.modalCustomCategory.value.trim() || "Component"
      : elements.modalCategory.value;
    const blueprintType = useCustomSettings
      ? elements.modalCustomType.value.trim() || "Sprite"
      : elements.modalType.value;
    const zonePalettePreset = elements.modalZonePalette.value;
    const blueprint = createEmptyBlueprint();
    blueprint.name = name;
    blueprint.blueprintCategory =
      blueprintCategory === "System" || blueprintCategory === "Template"
        ? blueprintCategory
        : "Component";
    blueprint.blueprintType = blueprintType;
    blueprint.zone = zonePalettePreset;
    blueprint.zonePalettePreset = zonePalettePreset;
    blueprint.matrix = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ""),
    );
    blueprint.spriteFrames = [blueprint.matrix.map((row) => [...row])];
    blueprint.colorMap = getZonePalette(zonePalettePreset);
    openBlueprint(blueprint);
    closeCreateModal();
    showToast("New blueprint created", "success");
  };

  const saveAndExit = async () => {
    if (hasDirtyWorkspace()) {
      const shouldClose = window.confirm("Unsaved changes. Close anyway?");
      if (!shouldClose) {
        return;
      }
    }

    try {
      forceAppExit = true;
      await window.api.requestExit();
    } catch {
      forceAppExit = false;
      showToast("App exit failed", "error");
    }
  };

  const refreshProjectLabel = async () => {
    try {
      const project = await window.api.getActiveProject();
      elements.projectLabel.textContent = `Project: ${project.name} • ${project.path}`;
      elements.projectBrowserCurrent.textContent = `${project.name} • ${project.path}`;
      elements.projectBrowserPath.value = project.path;
      recentProjects = [
        project.path,
        ...recentProjects.filter((entry) => entry !== project.path),
      ].slice(0, 8);
      saveStringList(RECENT_PROJECTS_KEY, recentProjects);
      renderProjectBrowser();
    } catch {
      elements.projectLabel.textContent = "Project: unavailable";
      elements.projectBrowserCurrent.textContent = "Unavailable";
      renderProjectBrowser();
    }
  };

  const renderProjectBrowser = () => {
    elements.projectBrowserModal.classList.toggle("is-open", projectBrowserOpen);
    elements.projectBrowserModal.setAttribute("aria-hidden", projectBrowserOpen ? "false" : "true");
    elements.projectBrowserTabOpen.classList.toggle("is-active", projectBrowserTab === "open");
    elements.projectBrowserTabNew.classList.toggle("is-active", projectBrowserTab === "new");
    elements.projectBrowserPanelOpen.classList.toggle("is-hidden", projectBrowserTab !== "open");
    elements.projectBrowserPanelNew.classList.toggle("is-hidden", projectBrowserTab !== "new");
    elements.projectBrowserRecents.innerHTML = "";

    for (const projectPath of recentProjects) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-pill";
      button.textContent = projectPath;
      button.addEventListener("click", () => {
        elements.projectBrowserPath.value = projectPath;
      });
      elements.projectBrowserRecents.append(button);
    }
  };

  const persistLogicWindowPosition = () => {
    localStorage.setItem(LOGIC_WINDOW_POSITION_KEY, JSON.stringify(logicWindowPosition));
  };

  const clampLogicWindowPosition = () => {
    const maxX = Math.max(24, window.innerWidth - 360);
    const maxY = Math.max(24, window.innerHeight - 240);
    logicWindowPosition = {
      x: Math.max(24, Math.min(logicWindowPosition.x, maxX)),
      y: Math.max(24, Math.min(logicWindowPosition.y, maxY)),
    };
  };

  const applyLogicWindowPosition = () => {
    clampLogicWindowPosition();
    elements.logicEditorCard.style.left = `${logicWindowPosition.x}px`;
    elements.logicEditorCard.style.top = `${logicWindowPosition.y}px`;
  };

  const openProjectBrowser = (tab: "new" | "open") => {
    projectBrowserTab = tab;
    projectBrowserOpen = true;
    renderProjectBrowser();
  };

  const closeProjectBrowser = () => {
    projectBrowserOpen = false;
    renderProjectBrowser();
  };

  const openSettings = () => {
    settingsOpen = true;
    applyWorkspaceSettings();
    renderSettings();
  };

  const closeSettings = () => {
    settingsOpen = false;
    renderSettings();
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_THEME_KEY, elements.settingsTheme.value);
    localStorage.setItem(SETTINGS_FONT_SIZE_KEY, elements.settingsFontSize.value);
    localStorage.setItem(SETTINGS_UI_SCALE_KEY, elements.settingsUiScale.value);
    applyWorkspaceSettings();
    closeSettings();
    showToast("Settings applied", "success");
  };

  const createProject = async () => {
    const name = elements.projectBrowserName.value.trim();
    if (!name) {
      return;
    }

    try {
      await window.api.createProject(name);
      window.location.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Project creation failed", "error");
    }
  };

  const openProject = async () => {
    const projectPath = elements.projectBrowserPath.value.trim();
    if (!projectPath) {
      return;
    }

    try {
      await window.api.openProject(projectPath);
      window.location.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Project open failed", "error");
    }
  };

  const deleteActiveBlueprint = async () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    const targetName = active.state.workingBlueprint.name;
    const confirmDelete = window.confirm(`Delete ${targetName}.json?`);
    if (!confirmDelete) {
      return;
    }

    try {
      const initialResult = await window.api.deleteBlueprint(targetName, false);
      if (!initialResult.deleted) {
        const messages: string[] = [];
        if (initialResult.dependencies.referencedByBlueprints.length > 0) {
          messages.push(
            `Referenced by assets: ${initialResult.dependencies.referencedByBlueprints.join(", ")}`,
          );
        }
        if (initialResult.dependencies.referencedByScenes.length > 0) {
          messages.push(
            `Referenced by scenes: ${initialResult.dependencies.referencedByScenes.join(", ")}`,
          );
        }

        const shouldResolve = window.confirm(
          `This asset is still referenced.\n\n${messages.join("\n")}\n\nResolve references and delete anyway?`,
        );
        if (!shouldResolve) {
          return;
        }

        await window.api.deleteBlueprint(targetName, true);
      }

      knownBlueprints.delete(targetName);
      knownBlueprintFiles.delete(`${targetName}.json`);
      localStorage.removeItem(getAutosaveKey(targetName));
      editorTabs.splice(
        editorTabs.findIndex((tab) => tab.id === active.id),
        1,
      );
      logicEditorOpen = false;
      showToast(`Deleted ${targetName}.json`, "success");
      setActiveTab("world");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Asset deletion failed", "error");
    }
  };

  const exportCurrentWorkspace = async () => {
    if (activeTabId === "world-builder") {
      await options.worldBuilder.exportSceneBundle();
      return;
    }

    const active = getActiveEditor();
    if (active) {
      await exportActiveBundle();
      return;
    }

    const bundleName = window.prompt(
      "Export component template bundle name",
      "component-templates",
    );
    if (!bundleName?.trim()) {
      return;
    }

    const fileName = await window.api.exportAssetBundle(bundleName, {
      blueprint: createEmptyBlueprint(),
      componentTemplates: [...componentRegistry],
      exportedAt: new Date().toISOString(),
      kind: "engine-asset-bundle",
      schemaVersion: 1,
    });
    showToast(`Exported ${fileName}`, "success");
  };

  const importBlueprintIntoActive = () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    const currentName = active.state.workingBlueprint.name;
    const available = Array.from(knownBlueprints.values())
      .filter((blueprint) => blueprint.name !== currentName)
      .sort((left, right) => left.name.localeCompare(right.name));

    if (available.length === 0) {
      showToast("No other blueprints available to import", "info");
      return;
    }

    const selection = window.prompt(
      `Import into ${currentName}. Use "name" for child composition or "name:frame" for animation. Available: ${available.map((entry) => entry.name).join(", ")}`,
      available[0]?.name ?? "",
    );

    if (!selection) {
      return;
    }

    const [targetName, mode] = selection.trim().split(":");
    const imported = knownBlueprints.get(targetName);
    if (!imported) {
      showToast("Blueprint import target was not found", "error");
      return;
    }

    commitMutation(() => {
      active.state.workingBlueprint.importSources = [
        ...(active.state.workingBlueprint.importSources ?? []),
        imported.name,
      ];

      if (mode === "frame") {
        const frames = ensureSpriteFrames(active.state.workingBlueprint);
        frames.push(imported.matrix.map((row) => [...row]));
        active.state.activeFrameIndex = frames.length - 1;
        updateActiveMatrix(active.state, frames[active.state.activeFrameIndex]);
        return true;
      }

      active.state.workingBlueprint.childBlueprints = [
        ...(active.state.workingBlueprint.childBlueprints ?? []),
        {
          blueprintName: imported.name,
          offsetX: 0,
          offsetY: 0,
        },
      ];
      return true;
    });
    showToast(
      mode === "frame"
        ? `Imported ${imported.name}.json as animation frame`
        : `Imported ${imported.name}.json as child blueprint`,
      "success",
    );
  };

  const exportActiveBundle = async () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    syncFormToState(active.state);
    const exportMode =
      window.prompt("Export mode: bundle, logic, or sprites", "bundle")?.trim().toLowerCase() ?? "";
    if (!exportMode) {
      return;
    }
    const bundleName =
      window.prompt("Export asset bundle name", `${active.state.workingBlueprint.name}-bundle`) ??
      "";
    if (!bundleName.trim()) {
      return;
    }

    try {
      let fileName = "";
      if (exportMode === "logic") {
        fileName = await window.api.exportLogicGraph(bundleName, {
          exportedAt: new Date().toISOString(),
          graph: active.state.workingBlueprint.logicGraph ?? {
            version: 1,
            nodes: [],
            connections: [],
          },
          kind: "logic-graph",
          name: active.state.workingBlueprint.name,
          schemaVersion: 1,
        });
      } else if (exportMode === "sprites") {
        fileName = await window.api.exportSpriteLibrary(bundleName, {
          colorMap: { ...active.state.workingBlueprint.colorMap },
          exportedAt: new Date().toISOString(),
          kind: "sprite-library",
          name: active.state.workingBlueprint.name,
          pixelSize: active.state.workingBlueprint.pixelSize,
          schemaVersion: 1,
          spriteFrames: active.state.workingBlueprint.spriteFrames?.map((frame) =>
            frame.map((row) => [...row]),
          ) ?? [active.state.workingBlueprint.matrix.map((row) => [...row])],
        });
      } else {
        fileName = await window.api.exportAssetBundle(bundleName, {
          blueprint: cloneBlueprint(active.state.workingBlueprint),
          componentTemplates: [...componentRegistry],
          exportedAt: new Date().toISOString(),
          kind: "engine-asset-bundle",
          schemaVersion: 1,
        });
      }
      showToast(`Exported ${fileName}`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Asset export failed", "error");
    }
  };

  const importAssetBundle = async () => {
    const bundleFiles = await window.api.listAssetBundles();
    if (bundleFiles.length === 0) {
      showToast("No exported asset bundles were found", "info");
      return;
    }

    const selection =
      window.prompt(
        `Import asset bundle. Available: ${bundleFiles.join(", ")}`,
        bundleFiles[0]?.replace(/\.json$/u, "") ?? "",
      ) ?? "";

    if (!selection.trim()) {
      return;
    }

    try {
      const bundle = await window.api.importAssetBundle(selection.trim());
      for (const template of bundle.componentTemplates) {
        if (!componentRegistry.includes(template)) {
          componentRegistry.push(template);
        }
      }
      componentRegistry.sort((left, right) => left.localeCompare(right));
      persistRegistry("components");
      knownBlueprints.set(bundle.blueprint.name, cloneBlueprint(bundle.blueprint));
      knownBlueprintFiles.add(`${bundle.blueprint.name}.json`);
      openBlueprint(bundle.blueprint);
      showToast(`Imported ${bundle.blueprint.name}.json`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Asset import failed", "error");
    }
  };

  const addRegistryEntry = (mode: RegistryMode) => {
    const input =
      mode === "components"
        ? elements.architectureComponentInput
        : mode === "events"
          ? elements.architectureEventInput
          : elements.architectureSystemsInput;
    const registry =
      mode === "components"
        ? componentRegistry
        : mode === "events"
          ? eventRegistry
          : systemRegistry;
    const value = input.value.trim();
    if (!value) {
      return;
    }
    if (!registry.includes(value)) {
      registry.push(value);
      registry.sort((left, right) => left.localeCompare(right));
      persistRegistry(mode);
      showToast(
        `${mode === "components" ? "Component" : mode === "events" ? "Event" : "System"} registered`,
        "success",
      );
    }
    input.value = "";
    renderArchitectureStudio(getActiveEditor()?.state);
  };

  elements.newButton.addEventListener("click", openCreateModal);
  elements.newProjectButton.addEventListener("click", () => {
    openProjectBrowser("new");
  });
  elements.openProjectButton.addEventListener("click", () => {
    openProjectBrowser("open");
  });
  elements.openSettingsButton.addEventListener("click", openSettings);
  elements.exitButton.addEventListener("click", () => {
    void saveAndExit();
  });
  elements.exportWorkspaceButton.addEventListener("click", () => {
    void exportCurrentWorkspace();
  });
  elements.modalCancel.addEventListener("click", closeCreateModal);
  elements.modalConfirm.addEventListener("click", createNewBlueprintTab);
  elements.modalCustomToggle.addEventListener("change", syncCreateModalVisibility);
  elements.modalCategory.addEventListener("change", syncCreateModalVisibility);
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) {
      closeCreateModal();
    }
  });
  elements.colorStudioOpen.addEventListener("click", () => {
    colorStudioOpen = true;
    renderColorStudio();
  });
  elements.colorStudioClose.addEventListener("click", () => {
    colorStudioOpen = false;
    renderColorStudio();
  });
  elements.colorStudioModal.addEventListener("click", (event) => {
    if (event.target === elements.colorStudioModal) {
      colorStudioOpen = false;
      renderColorStudio();
    }
  });
  elements.colorStudioTabPicker.addEventListener("click", () => {
    colorStudioTab = "picker";
    localStorage.setItem(COLOR_STUDIO_TAB_KEY, colorStudioTab);
    renderColorStudio();
  });
  elements.colorStudioTabLibrary.addEventListener("click", () => {
    colorStudioTab = "library";
    localStorage.setItem(COLOR_STUDIO_TAB_KEY, colorStudioTab);
    renderColorStudio();
  });
  elements.colorStudioPicker.addEventListener("input", () => {
    applyStudioColor(elements.colorStudioPicker.value);
  });

  elements.openArchitectureStudioButton.addEventListener("click", () => {
    architectureStudioOpen = true;
    renderArchitectureStudio(getActiveEditor()?.state);
  });
  elements.logicOpenButton.addEventListener("click", () => {
    if (!getActiveEditor()) {
      return;
    }
    logicEditorOpen = true;
    applyLogicWindowPosition();
    render();
  });
  elements.logicEditorClose.addEventListener("click", () => {
    logicEditorOpen = false;
    render();
  });
  elements.logicEditorModal.addEventListener("click", (event) => {
    if (event.target === elements.logicEditorModal) {
      logicEditorOpen = false;
      render();
    }
  });
  elements.logicEditorHeader.addEventListener("pointerdown", (event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("button, input, select, textarea")
    ) {
      return;
    }

    const startPointer = { x: event.clientX, y: event.clientY };
    const startPosition = { ...logicWindowPosition };
    const onMove = (moveEvent: PointerEvent) => {
      logicWindowPosition = {
        x: startPosition.x + (moveEvent.clientX - startPointer.x),
        y: startPosition.y + (moveEvent.clientY - startPointer.y),
      };
      applyLogicWindowPosition();
    };
    const onUp = () => {
      clampLogicWindowPosition();
      persistLogicWindowPosition();
      applyLogicWindowPosition();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
  elements.projectBrowserClose.addEventListener("click", closeProjectBrowser);
  elements.projectBrowserCreateConfirm.addEventListener("click", () => {
    void createProject();
  });
  elements.projectBrowserOpenConfirm.addEventListener("click", () => {
    void openProject();
  });
  elements.projectBrowserTabOpen.addEventListener("click", () => {
    projectBrowserTab = "open";
    renderProjectBrowser();
  });
  elements.projectBrowserTabNew.addEventListener("click", () => {
    projectBrowserTab = "new";
    renderProjectBrowser();
  });
  elements.projectBrowserModal.addEventListener("click", (event) => {
    if (event.target === elements.projectBrowserModal) {
      closeProjectBrowser();
    }
  });
  elements.settingsClose.addEventListener("click", closeSettings);
  elements.settingsApply.addEventListener("click", saveSettings);
  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) {
      closeSettings();
    }
  });
  elements.architectureClose.addEventListener("click", () => {
    architectureStudioOpen = false;
    renderArchitectureStudio(getActiveEditor()?.state);
  });
  elements.architectureModal.addEventListener("click", (event) => {
    if (event.target === elements.architectureModal) {
      architectureStudioOpen = false;
      renderArchitectureStudio(getActiveEditor()?.state);
    }
  });
  elements.architectureTabComponents.addEventListener("click", () => {
    architectureTab = "components";
    localStorage.setItem(ARCHITECTURE_TAB_KEY, architectureTab);
    renderArchitectureStudio(getActiveEditor()?.state);
  });
  elements.architectureTabSystems.addEventListener("click", () => {
    architectureTab = "systems";
    localStorage.setItem(ARCHITECTURE_TAB_KEY, architectureTab);
    renderArchitectureStudio(getActiveEditor()?.state);
  });
  elements.architectureTabEvents.addEventListener("click", () => {
    architectureTab = "events";
    localStorage.setItem(ARCHITECTURE_TAB_KEY, architectureTab);
    renderArchitectureStudio(getActiveEditor()?.state);
  });
  elements.architectureComponentAdd.addEventListener("click", () => addRegistryEntry("components"));
  elements.architectureEventAdd.addEventListener("click", () => addRegistryEntry("events"));
  elements.architectureSystemsAdd.addEventListener("click", () => addRegistryEntry("systems"));
  elements.importBlueprintButton.addEventListener("click", importBlueprintIntoActive);
  elements.exportBundleButton.addEventListener("click", () => {
    void exportActiveBundle();
  });
  elements.importBundleButton.addEventListener("click", () => {
    void importAssetBundle();
  });
  elements.deleteBlueprintButton.addEventListener("click", () => {
    void deleteActiveBlueprint();
  });

  elements.nameInput.addEventListener("input", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }
    syncFormToState(active.state);
    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  });
  elements.blueprintTypeInput.addEventListener("input", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }
    syncFormToState(active.state);
    render();
  });
  elements.zoneInput.addEventListener("input", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }
    syncFormToState(active.state);
    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  });
  elements.pixelSizeInput.addEventListener("input", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }
    syncFormToState(active.state);
    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  });
  elements.resizeWidth.addEventListener("input", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.resizeWidth = Number(elements.resizeWidth.value) || active.state.resizeWidth;
    }
  });
  elements.resizeHeight.addEventListener("input", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.resizeHeight = Number(elements.resizeHeight.value) || active.state.resizeHeight;
    }
  });

  elements.toolPen.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.selectedTool = "pen";
      render();
    }
  });
  elements.toolBucket.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.selectedTool = "bucket";
      render();
    }
  });
  elements.toolEraser.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.selectedTool = "eraser";
      render();
    }
  });
  elements.toolPicker.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.selectedTool = "picker";
      render();
    }
  });
  elements.toolSymmetry.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active) {
      active.state.symmetryHorizontal = !active.state.symmetryHorizontal;
      render();
    }
  });
  elements.undoButton.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active && undo(active.state)) {
      emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
      render();
    }
  });
  elements.redoButton.addEventListener("click", () => {
    const active = getActiveEditor();
    if (active && redo(active.state)) {
      emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
      render();
    }
  });

  const bindCanvasTransform = (selector: string, transform: (matrix: string[][]) => string[][]) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const active = getActiveEditor();
      if (!active) {
        return;
      }

      commitMutation(() => {
        updateActiveMatrix(active.state, transform(getActiveMatrix(active.state)));
        return true;
      });
    });
  };

  bindCanvasTransform("#editor-canvas-flip-horizontal", flipMatrixHorizontal);
  bindCanvasTransform("#editor-canvas-flip-vertical", flipMatrixVertical);
  bindCanvasTransform("#editor-canvas-center", centerMatrix);

  elements.prevFrameButton.addEventListener("click", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    active.state.activeFrameIndex =
      (active.state.activeFrameIndex - 1 + getFrameCount(active.state.workingBlueprint)) %
      getFrameCount(active.state.workingBlueprint);
    getActiveMatrix(active.state);
    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  });

  elements.nextFrameButton.addEventListener("click", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    const frames = ensureSpriteFrames(active.state.workingBlueprint);
    if (active.state.activeFrameIndex === frames.length - 1) {
      commitMutation(() => {
        frames.push(getActiveMatrix(active.state).map((row) => [...row]));
        active.state.activeFrameIndex = frames.length - 1;
        updateActiveMatrix(active.state, frames[active.state.activeFrameIndex]);
        return true;
      });
      return;
    }

    active.state.activeFrameIndex += 1;
    getActiveMatrix(active.state);
    emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
    render();
  });

  elements.resizeApply.addEventListener("click", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    const nextWidth = Number(elements.resizeWidth.value);
    const nextHeight = Number(elements.resizeHeight.value);

    if (nextWidth < 1 || nextHeight < 1) {
      elements.status.textContent = "Resize values must be positive integers.";
      elements.status.className = "editor-status is-invalid";
      return;
    }

    commitMutation(() => {
      updateActiveMatrix(
        active.state,
        resizeMatrix(getActiveMatrix(active.state), nextWidth, nextHeight),
      );
      active.state.resizeWidth = nextWidth;
      active.state.resizeHeight = nextHeight;
      return true;
    });
  });

  elements.addColorButton.addEventListener("click", () => {
    const active = getActiveEditor();
    if (!active) {
      return;
    }

    const token = elements.colorCodeInput.value.trim().toUpperCase();
    const color = colorStudioColor;

    if (token.length !== 1 || !color) {
      elements.status.textContent = "Add a single-letter token and a color value.";
      elements.status.className = "editor-status is-invalid";
      return;
    }

    commitMutation(() => {
      active.state.workingBlueprint.colorMap[token] = color;
      active.state.selectedToken = token;
      active.state.selectedTool = "pen";
      elements.colorCodeInput.value = "";
      pushRecentColor(color);
      return true;
    });
  });

  elements.saveButton.addEventListener("click", () => {
    void saveActiveEditor();
  });
  elements.closeButton.addEventListener("click", closeActiveEditor);

  onBlueprintRequested((blueprint) => {
    knownBlueprints.set(blueprint.name, cloneBlueprint(blueprint));
    openBlueprint(blueprint);
  });

  window.addEventListener("keydown", (event) => {
    if (colorStudioOpen && event.code === "Escape") {
      event.preventDefault();
      colorStudioOpen = false;
      renderColorStudio();
      return;
    }

    if (architectureStudioOpen && event.code === "Escape") {
      event.preventDefault();
      architectureStudioOpen = false;
      renderArchitectureStudio(getActiveEditor()?.state);
      return;
    }

    if (logicEditorOpen && event.code === "Escape") {
      event.preventDefault();
      logicEditorOpen = false;
      render();
      return;
    }

    if (projectBrowserOpen && event.code === "Escape") {
      event.preventDefault();
      closeProjectBrowser();
      return;
    }

    if (settingsOpen && event.code === "Escape") {
      event.preventDefault();
      closeSettings();
      return;
    }

    if (elements.modal.classList.contains("is-open") && event.code === "Escape") {
      event.preventDefault();
      closeCreateModal();
      return;
    }

    if (event.code === "Escape" && activeTabId !== "world") {
      if (activeTabId === "world-builder") {
        if (options.worldBuilder.isDirty()) {
          const shouldClose = window.confirm("Unsaved changes. Close anyway?");
          if (!shouldClose) {
            return;
          }
        }
        event.preventDefault();
        setActiveTab("world");
        return;
      }

      event.preventDefault();
      closeActiveEditor();
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.code === "KeyS") {
        event.preventDefault();
        if (activeTabId === "world-builder") {
          void options.worldBuilder.save();
          return;
        }

        const active = getActiveEditor();
        if (active) {
          void saveActiveEditor();
        }
        return;
      }

      if (event.code === "KeyC" && activeTabId === "world-builder") {
        event.preventDefault();
        if (options.worldBuilder.copySelection()) {
          showToast("Scene object copied", "info");
        }
        return;
      }

      if (event.code === "KeyV" && activeTabId === "world-builder") {
        event.preventDefault();
        if (options.worldBuilder.pasteSelection()) {
          showToast("Scene object pasted", "success");
        }
        return;
      }

      if (event.code === "KeyZ" && event.shiftKey) {
        event.preventDefault();
        const active = getActiveEditor();
        if (active && redo(active.state)) {
          emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
          render();
        }
        return;
      }

      if (event.code === "KeyZ") {
        event.preventDefault();
        const active = getActiveEditor();
        if (active && undo(active.state)) {
          emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
          render();
        }
        return;
      }

      if (event.code === "KeyY") {
        event.preventDefault();
        const active = getActiveEditor();
        if (active && redo(active.state)) {
          emitBlueprintPreviewUpdated(cloneBlueprint(active.state.workingBlueprint));
          render();
        }
        return;
      }
    }

    const active = getActiveEditor();
    if (!active) {
      return;
    }

    if (!active) {
      return;
    }

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (event.code === "KeyB") {
      event.preventDefault();
      active.state.selectedTool = "pen";
      render();
    }
    if (event.code === "KeyG") {
      event.preventDefault();
      active.state.selectedTool = "bucket";
      render();
    }
    if (event.code === "KeyE") {
      event.preventDefault();
      active.state.selectedTool = "eraser";
      render();
    }
  });

  window.setInterval(() => {
    const dirtyTabs = editorTabs.filter((tab) => isDirty(tab));
    if (dirtyTabs.length === 0) {
      return;
    }

    for (const tab of dirtyTabs) {
      const blueprint = cloneForAutosave(tab.state.workingBlueprint);
      localStorage.setItem(getAutosaveKey(blueprint.name), JSON.stringify(blueprint));
    }

    showToast("Autosave complete", "info");
  }, AUTOSAVE_INTERVAL_MS);

  window.addEventListener("beforeunload", (event) => {
    if (forceAppExit) {
      return;
    }

    if (!hasDirtyWorkspace()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "Unsaved changes. Close anyway?";
  });

  const startupPlayer = knownBlueprints.get("player");
  if (startupPlayer) {
    openBlueprint(startupPlayer);
    activeTabId = "world";
    emitBlueprintPreviewUpdated(cloneBlueprint(startupPlayer));
  }

  applyWorkspaceSettings();
  renderSettings();
  renderProjectBrowser();
  void refreshProjectLabel();
  render();
}

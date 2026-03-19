import { validateBlueprintShape } from "../../shared/blueprintValidation";
import type { PixelBlueprint } from "../../shared/types";
import type { EditorState } from "./model";

export interface EditorElements {
  addColorButton: HTMLButtonElement;
  canvasCenter: HTMLButtonElement;
  canvasFlipHorizontal: HTMLButtonElement;
  canvasFlipVertical: HTMLButtonElement;
  colorCodeInput: HTMLInputElement;
  colorValueInput: HTMLInputElement;
  grid: HTMLElement;
  issueList: HTMLElement;
  nameInput: HTMLInputElement;
  overlay: HTMLElement;
  palette: HTMLElement;
  pixelSizeInput: HTMLInputElement;
  redoButton: HTMLButtonElement;
  resizeApply: HTMLButtonElement;
  resizeHeight: HTMLInputElement;
  resizeWidth: HTMLInputElement;
  saveButton: HTMLButtonElement;
  spritePreview: HTMLCanvasElement;
  status: HTMLElement;
  toolBucket: HTMLButtonElement;
  toolEraser: HTMLButtonElement;
  toolPicker: HTMLButtonElement;
  toolPen: HTMLButtonElement;
  toolSymmetry: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  zoneInput: HTMLInputElement;
  blueprintSelect: HTMLSelectElement;
}

export function requireEditorElements(): EditorElements {
  const requireElement = <TElement extends HTMLElement>(selector: string): TElement => {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
      throw new Error(`Editor element "${selector}" was not found.`);
    }
    return element;
  };

  return {
    addColorButton: requireElement("#editor-add-color"),
    blueprintSelect: requireElement("#editor-blueprint-select"),
    canvasCenter: requireElement("#editor-canvas-center"),
    canvasFlipHorizontal: requireElement("#editor-canvas-flip-horizontal"),
    canvasFlipVertical: requireElement("#editor-canvas-flip-vertical"),
    colorCodeInput: requireElement("#editor-color-code"),
    colorValueInput: requireElement("#editor-color-value"),
    grid: requireElement("#editor-grid"),
    issueList: requireElement("#editor-issues"),
    nameInput: requireElement("#editor-name"),
    overlay: requireElement("#editor-overlay"),
    palette: requireElement("#editor-palette"),
    pixelSizeInput: requireElement("#editor-pixel-size"),
    redoButton: requireElement("#editor-redo"),
    resizeApply: requireElement("#editor-resize-apply"),
    resizeHeight: requireElement("#editor-resize-height"),
    resizeWidth: requireElement("#editor-resize-width"),
    saveButton: requireElement("#editor-save"),
    spritePreview: requireElement("#editor-preview"),
    status: requireElement("#editor-status"),
    toolBucket: requireElement("#editor-tool-bucket"),
    toolEraser: requireElement("#editor-tool-eraser"),
    toolPicker: requireElement("#editor-tool-picker"),
    toolPen: requireElement("#editor-tool-pen"),
    toolSymmetry: requireElement("#editor-tool-symmetry"),
    undoButton: requireElement("#editor-undo"),
    zoneInput: requireElement("#editor-zone"),
  };
}

export function syncFormToBlueprint(elements: EditorElements, state: EditorState): void {
  state.workingBlueprint.name = elements.nameInput.value.trim() || "untitled-blueprint";
  state.workingBlueprint.zone = elements.zoneInput.value.trim() || "editor-lab";
  state.workingBlueprint.pixelSize = Number(elements.pixelSizeInput.value) || 1;
}

function populateBlueprintSelect(elements: EditorElements, state: EditorState): void {
  elements.blueprintSelect.innerHTML = "";

  for (const blueprint of state.blueprints) {
    const option = document.createElement("option");
    option.value = blueprint.name;
    option.textContent = `${blueprint.name} (${blueprint.zone})`;
    if (blueprint.name === state.workingBlueprint.name) {
      option.selected = true;
    }
    elements.blueprintSelect.append(option);
  }

  const createNew = document.createElement("option");
  createNew.value = "__new__";
  createNew.textContent = "New Blueprint";
  elements.blueprintSelect.append(createNew);
}

function renderPalette(
  elements: EditorElements,
  state: EditorState,
  onTokenSelect: (token: string) => void,
  onPaletteChange: (token: string, color: string) => void,
): void {
  elements.palette.innerHTML = "";

  for (const [token, color] of Object.entries(state.workingBlueprint.colorMap)) {
    const row = document.createElement("div");
    row.className = "palette-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `palette-swatch ${state.selectedToken === token ? "is-selected" : ""}`;
    button.style.setProperty("--swatch-color", color);
    button.innerHTML = `<span class="swatch-preview"></span><span>${token}</span>`;
    button.addEventListener("click", () => {
      onTokenSelect(token);
    });

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "palette-color-input";
    colorInput.value = normalizeColor(color);
    colorInput.addEventListener("input", () => {
      onPaletteChange(token, colorInput.value);
    });

    row.append(button, colorInput);
    elements.palette.append(row);
  }
}

function normalizeColor(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  const fallback = document.createElement("span");
  fallback.style.color = color;
  document.body.append(fallback);
  const resolved = getComputedStyle(fallback).color;
  fallback.remove();
  const numbers = resolved.match(/\d+/g);

  if (!numbers || numbers.length < 3) {
    return "#8ac926";
  }

  return `#${numbers
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function renderGrid(
  elements: EditorElements,
  state: EditorState,
  onChange: (rowIndex: number, columnIndex: number, mode: "erase" | "paint" | "sample") => void,
): void {
  elements.grid.innerHTML = "";
  elements.grid.style.setProperty(
    "--editor-columns",
    String(state.workingBlueprint.matrix[0]?.length ?? 0),
  );

  for (let rowIndex = 0; rowIndex < state.workingBlueprint.matrix.length; rowIndex += 1) {
    for (
      let columnIndex = 0;
      columnIndex < state.workingBlueprint.matrix[rowIndex].length;
      columnIndex += 1
    ) {
      const token = state.workingBlueprint.matrix[rowIndex][columnIndex];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "pixel-cell";
      cell.title = `Row ${rowIndex + 1}, Column ${columnIndex + 1}`;
      const color = token ? state.workingBlueprint.colorMap[token] : "";

      if (color) {
        cell.style.background = color;
      }

      cell.textContent = token || "";
      cell.addEventListener("click", () => {
        onChange(
          rowIndex,
          columnIndex,
          state.selectedTool === "picker"
            ? "sample"
            : state.selectedTool === "eraser"
              ? "erase"
              : "paint",
        );
      });
      cell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        onChange(rowIndex, columnIndex, "erase");
      });
      elements.grid.append(cell);
    }
  }
}

export function renderValidation(elements: EditorElements, blueprint: PixelBlueprint): boolean {
  const result = validateBlueprintShape(blueprint);
  elements.issueList.innerHTML = "";

  if (result.valid) {
    elements.status.textContent = "Blueprint is valid. Save to persist changes.";
    elements.status.className = "editor-status is-valid";
    return true;
  }

  elements.status.textContent = "Blueprint has validation issues.";
  elements.status.className = "editor-status is-invalid";

  for (const issue of result.errors) {
    const item = document.createElement("li");
    item.textContent = issue;
    elements.issueList.append(item);
  }

  return false;
}

function renderSpritePreview(elements: EditorElements, blueprint: PixelBlueprint): void {
  const context = elements.spritePreview.getContext("2d");
  if (!context) {
    return;
  }

  const spriteWidth = (blueprint.matrix[0]?.length ?? 1) * blueprint.pixelSize;
  const spriteHeight = blueprint.matrix.length * blueprint.pixelSize;

  elements.spritePreview.width = spriteWidth;
  elements.spritePreview.height = spriteHeight;
  context.clearRect(0, 0, spriteWidth, spriteHeight);

  for (let row = 0; row < blueprint.matrix.length; row += 1) {
    for (let column = 0; column < blueprint.matrix[row].length; column += 1) {
      const token = blueprint.matrix[row][column];
      if (!token) {
        continue;
      }

      const color = blueprint.colorMap[token];
      if (!color) {
        continue;
      }

      context.fillStyle = color;
      context.fillRect(
        column * blueprint.pixelSize,
        row * blueprint.pixelSize,
        blueprint.pixelSize,
        blueprint.pixelSize,
      );
    }
  }
}

export function renderEditor(
  elements: EditorElements,
  state: EditorState,
  onTokenSelect: (token: string) => void,
  onPaletteChange: (token: string, color: string) => void,
  onCellInteract: (
    rowIndex: number,
    columnIndex: number,
    mode: "erase" | "paint" | "sample",
  ) => void,
): boolean {
  elements.overlay.classList.toggle("is-open", state.visible);
  elements.nameInput.value = state.workingBlueprint.name;
  elements.zoneInput.value = state.workingBlueprint.zone;
  elements.pixelSizeInput.value = String(state.workingBlueprint.pixelSize);
  elements.resizeWidth.value = String(state.resizeWidth);
  elements.resizeHeight.value = String(state.resizeHeight);
  elements.toolPen.classList.toggle("is-selected", state.selectedTool === "pen");
  elements.toolBucket.classList.toggle("is-selected", state.selectedTool === "bucket");
  elements.toolEraser.classList.toggle("is-selected", state.selectedTool === "eraser");
  elements.toolPicker.classList.toggle("is-selected", state.selectedTool === "picker");
  elements.toolSymmetry.classList.toggle("is-selected", state.symmetryHorizontal);
  elements.undoButton.disabled = state.history.length === 0;
  elements.redoButton.disabled = state.future.length === 0;
  populateBlueprintSelect(elements, state);
  renderPalette(elements, state, onTokenSelect, onPaletteChange);
  renderGrid(elements, state, onCellInteract);
  renderSpritePreview(elements, state.workingBlueprint);
  return renderValidation(elements, state.workingBlueprint);
}

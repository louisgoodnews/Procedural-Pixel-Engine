import type { BlueprintCatalog, PixelBlueprint } from "../../shared/types";
import {
  emitBlueprintRequested,
  emitBlueprintSelected,
  onBlueprintPersisted,
  onBlueprintPreviewUpdated,
} from "../editor/events";

interface GalleryElements {
  filterKind: HTMLSelectElement;
  grid: HTMLElement;
  meta: HTMLElement;
  search: HTMLInputElement;
}

function requireGalleryElements(): GalleryElements {
  const grid = document.querySelector<HTMLElement>("#gallery-grid");
  const meta = document.querySelector<HTMLElement>("#gallery-meta");
  const search = document.querySelector<HTMLInputElement>("#gallery-search");
  const filterKind = document.querySelector<HTMLSelectElement>("#gallery-filter-kind");

  if (!grid || !meta || !search || !filterKind) {
    throw new Error("Gallery UI elements were not found.");
  }

  return { filterKind, grid, meta, search };
}

function drawBlueprintPreview(canvas: HTMLCanvasElement, blueprint: PixelBlueprint): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const matrix = blueprint.spriteFrames?.[0] ?? blueprint.matrix;
  const width = matrix[0]?.length ?? 1;
  const height = matrix.length;
  const scale = Math.max(2, Math.floor(64 / Math.max(width, height, 1)));

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

function createCard(
  blueprint: PixelBlueprint,
  fileName: string,
  selected: boolean,
  onOpen: (blueprint: PixelBlueprint) => void,
  onSelect: (blueprint: PixelBlueprint) => void,
): HTMLButtonElement {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `gallery-card ${selected ? "is-selected" : ""}`;

  const preview = document.createElement("canvas");
  preview.className = "gallery-card-preview";
  drawBlueprintPreview(preview, blueprint);

  const title = document.createElement("strong");
  title.textContent = blueprint.name;

  const zone = document.createElement("span");
  zone.className = "gallery-card-zone";
  zone.textContent = blueprint.zone;

  const file = document.createElement("span");
  file.className = "gallery-card-file";
  file.textContent = fileName;

  const info = document.createElement("div");
  info.className = "gallery-card-info";
  info.append(title, zone, file);

  card.append(preview, info);
  card.addEventListener("click", () => onSelect(blueprint));
  card.addEventListener("dblclick", () => onOpen(blueprint));
  return card;
}

export function initializeBlueprintGallery(catalog: BlueprintCatalog, fileNames: string[]): void {
  const elements = requireGalleryElements();
  const blueprintMap = new Map(
    catalog.blueprints.map((blueprint) => [blueprint.name, structuredClone(blueprint)]),
  );
  const fileSet = new Set(fileNames);
  let selectedName = catalog.blueprints[0]?.name ?? "";
  let renderToken = 0;

  const render = () => {
    renderToken += 1;
    const token = renderToken;
    elements.grid.innerHTML = "";
    const searchTerm = elements.search.value.trim().toLowerCase();
    const kind = elements.filterKind.value;
    const blueprints = Array.from(blueprintMap.values())
      .filter((blueprint) => {
        const matchesSearch =
          searchTerm.length === 0 ||
          blueprint.name.toLowerCase().includes(searchTerm) ||
          blueprint.zone.toLowerCase().includes(searchTerm);
        const normalizedKind = (blueprint.blueprintCategory ?? "Component").toLowerCase();
        const matchesKind = kind === "all" || normalizedKind === kind;
        return matchesSearch && matchesKind;
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    const renderChunk = (startIndex: number) => {
      if (token !== renderToken) {
        return;
      }

      for (const blueprint of blueprints.slice(startIndex, startIndex + 24)) {
        const fileName = `${blueprint.name}.json`;
        const card = createCard(
          blueprint,
          fileName,
          blueprint.name === selectedName,
          (opened) => {
            selectedName = opened.name;
            emitBlueprintRequested(structuredClone(opened));
            render();
          },
          (selected) => {
            selectedName = selected.name;
            emitBlueprintSelected(structuredClone(selected));
            render();
          },
        );
        elements.grid.append(card);
      }

      if (startIndex + 24 < blueprints.length) {
        window.requestAnimationFrame(() => renderChunk(startIndex + 24));
      }
    };

    renderChunk(0);

    elements.meta.textContent = `${blueprints.length} previews from ${fileSet.size} JSON files`;
  };

  elements.search.addEventListener("input", render);
  elements.filterKind.addEventListener("change", render);

  onBlueprintPreviewUpdated((blueprint) => {
    if (!blueprintMap.has(blueprint.name)) {
      return;
    }

    blueprintMap.set(blueprint.name, structuredClone(blueprint));
    render();
  });

  onBlueprintPersisted((blueprint) => {
    blueprintMap.set(blueprint.name, structuredClone(blueprint));
    fileSet.add(`${blueprint.name}.json`);
    render();
  });

  render();
}

import type { PixelBlueprint, BlueprintCatalog } from "../../shared/types";
import { validateBlueprintShape } from "../../shared/blueprintValidation";

// Create test blueprint for fallback
const testPlayerBlueprint: PixelBlueprint = {
  blueprintCategory: "Component",
  name: "player",
  blueprintType: "Sprite",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "", "O", "O", "O", "O", "", ""],
    ["", "O", "S", "S", "S", "S", "O", ""],
  ],
  colorMap: {
    O: "#101820",
    S: "#f5d76e",
  },
  pixelSize: 12,
};

const HISTORY_LIMIT = 100;

export type EditorTool = "bucket" | "eraser" | "pen" | "picker";

export interface EditorState {
  activeFrameIndex: number;
  blueprints: PixelBlueprint[];
  future: PixelBlueprint[];
  history: PixelBlueprint[];
  resizeHeight: number;
  resizeWidth: number;
  selectedTool: EditorTool;
  selectedToken: string;
  symmetryHorizontal: boolean;
  visible: boolean;
  workingBlueprint: PixelBlueprint;
}

export function cloneBlueprint(blueprint: PixelBlueprint): PixelBlueprint {
  return {
    ...blueprint,
    assignedComponents: [...(blueprint.assignedComponents ?? [])],
    assignedGlobalSystems: [...(blueprint.assignedGlobalSystems ?? [])],
    childBlueprints: blueprint.childBlueprints?.map((child) => ({ ...child })),
    colorMap: { ...blueprint.colorMap },
    componentTree: blueprint.componentTree
      ? (JSON.parse(JSON.stringify(blueprint.componentTree)) as Record<string, unknown>)
      : undefined,
    importSources: [...(blueprint.importSources ?? [])],
    logicGraph: blueprint.logicGraph
      ? {
          version: 1,
          nodes: blueprint.logicGraph.nodes.map((node) => ({
            ...node,
            data: node.data ? { ...node.data } : undefined,
            position: { ...node.position },
          })),
          connections: blueprint.logicGraph.connections.map((connection) => ({
            ...connection,
            from: { ...connection.from },
            to: { ...connection.to },
          })),
        }
      : undefined,
    matrix: blueprint.matrix.map((row) => [...row]),
    spriteFrames: blueprint.spriteFrames?.map((frame) => frame.map((row) => [...row])),
  };
}

export function createEmptyBlueprint(): PixelBlueprint {
  return cloneBlueprint({
    ...testPlayerBlueprint,
    assignedComponents: [],
    assignedGlobalSystems: [],
    blueprintType: "Sprite",
    importSources: [],
    name: "new-blueprint",
    revision: 1,
    updatedAt: new Date().toISOString(),
    zone: "editor-lab",
    matrix: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => "")),
    colorMap: {
      S: "#8ac926",
    },
  });
}

export function createEditorState(catalog: BlueprintCatalog): EditorState {
  const initialBlueprint = catalog.blueprints[0] ?? createEmptyBlueprint();

  return {
    activeFrameIndex: 0,
    blueprints: catalog.blueprints.map((blueprint) => cloneBlueprint(blueprint)),
    future: [],
    history: [],
    resizeHeight: initialBlueprint.matrix.length,
    resizeWidth: initialBlueprint.matrix[0]?.length ?? 8,
    selectedTool: "pen",
    selectedToken: Object.keys(initialBlueprint.colorMap)[0] ?? "",
    symmetryHorizontal: false,
    visible: false,
    workingBlueprint: cloneBlueprint(initialBlueprint),
  };
}

export function commitHistory(state: EditorState): void {
  state.history.push(cloneBlueprint(state.workingBlueprint));
  if (state.history.length > HISTORY_LIMIT) {
    state.history.shift();
  }
  state.future = [];
}

export function applyBlueprint(
  state: EditorState,
  blueprint: PixelBlueprint,
  options?: { resetHistory?: boolean },
): void {
  state.workingBlueprint = cloneBlueprint(blueprint);
  state.activeFrameIndex = 0;
  state.resizeHeight = blueprint.matrix.length;
  state.resizeWidth = blueprint.matrix[0]?.length ?? 8;

  if (!state.workingBlueprint.colorMap[state.selectedToken]) {
    state.selectedToken = Object.keys(state.workingBlueprint.colorMap)[0] ?? "";
  }

  if (options?.resetHistory) {
    state.history = [];
    state.future = [];
  }
}

export function undo(state: EditorState): boolean {
  const previous = state.history.pop();
  if (!previous) {
    return false;
  }

  state.future.push(cloneBlueprint(state.workingBlueprint));
  applyBlueprint(state, previous);
  return true;
}

export function redo(state: EditorState): boolean {
  const next = state.future.pop();
  if (!next) {
    return false;
  }

  state.history.push(cloneBlueprint(state.workingBlueprint));
  applyBlueprint(state, next);
  return true;
}

export function centerMatrix(matrix: string[][]): string[][] {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const centered = Array.from({ length: height }, () => Array.from({ length: width }, () => ""));
  let minRow = height;
  let maxRow = -1;
  let minColumn = width;
  let maxColumn = -1;

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      if (!matrix[row][column]) {
        continue;
      }

      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minColumn = Math.min(minColumn, column);
      maxColumn = Math.max(maxColumn, column);
    }
  }

  if (maxRow === -1 || maxColumn === -1) {
    return centered;
  }

  const spriteHeight = maxRow - minRow + 1;
  const spriteWidth = maxColumn - minColumn + 1;
  const rowOffset = Math.floor((height - spriteHeight) / 2) - minRow;
  const columnOffset = Math.floor((width - spriteWidth) / 2) - minColumn;

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let column = minColumn; column <= maxColumn; column += 1) {
      const token = matrix[row][column];
      if (!token) {
        continue;
      }

      centered[row + rowOffset][column + columnOffset] = token;
    }
  }

  return centered;
}

export function resizeMatrix(
  matrix: string[][],
  nextWidth: number,
  nextHeight: number,
): string[][] {
  const resized = Array.from({ length: nextHeight }, () =>
    Array.from({ length: nextWidth }, () => ""),
  );

  for (let row = 0; row < Math.min(matrix.length, nextHeight); row += 1) {
    for (let column = 0; column < Math.min(matrix[row].length, nextWidth); column += 1) {
      resized[row][column] = matrix[row][column];
    }
  }

  return resized;
}

export function flipMatrixHorizontal(matrix: string[][]): string[][] {
  return matrix.map((row) => [...row].reverse());
}

export function flipMatrixVertical(matrix: string[][]): string[][] {
  return [...matrix].reverse().map((row) => [...row]);
}

export function floodFill(
  matrix: string[][],
  startRow: number,
  startColumn: number,
  nextToken: string,
): boolean {
  const targetToken = matrix[startRow]?.[startColumn];
  if (targetToken === undefined || targetToken === nextToken) {
    return false;
  }

  const queue: Array<{ column: number; row: number }> = [{ column: startColumn, row: startRow }];
  const height = matrix.length;

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    if (matrix[current.row]?.[current.column] !== targetToken) {
      continue;
    }

    matrix[current.row][current.column] = nextToken;

    if (current.row > 0) {
      queue.push({ column: current.column, row: current.row - 1 });
    }
    if (current.row + 1 < height) {
      queue.push({ column: current.column, row: current.row + 1 });
    }
    if (current.column > 0) {
      queue.push({ column: current.column - 1, row: current.row });
    }
    if (current.column + 1 < matrix[current.row].length) {
      queue.push({ column: current.column + 1, row: current.row });
    }
  }

  return true;
}

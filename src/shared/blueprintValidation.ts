import type { BlueprintValidationResult, LogicGraph, PixelBlueprint } from "./types";

function isStringMatrix(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
  );
}

function isSpriteFrames(value: unknown): value is string[][][] {
  return Array.isArray(value) && value.every((frame) => isStringMatrix(frame));
}

function isColorMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}

function isLooseRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isChildBlueprintList(value: unknown): value is Array<{
  blueprintName: string;
  flipX?: boolean;
  flipY?: boolean;
  offsetX: number;
  offsetY: number;
}> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        !!entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof entry.blueprintName === "string" &&
        typeof entry.offsetX === "number" &&
        typeof entry.offsetY === "number" &&
        (entry.flipX === undefined || typeof entry.flipX === "boolean") &&
        (entry.flipY === undefined || typeof entry.flipY === "boolean"),
    )
  );
}

function isLogicGraph(value: unknown): value is LogicGraph {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const graph = value as Partial<LogicGraph>;
  if (graph.version !== 1 || !Array.isArray(graph.nodes) || !Array.isArray(graph.connections)) {
    return false;
  }

  const nodesValid = graph.nodes.every((node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return false;
    }

    return (
      typeof node.id === "string" &&
      (node.kind === "trigger" || node.kind === "condition" || node.kind === "action") &&
      typeof node.type === "string" &&
      !!node.position &&
      typeof node.position === "object" &&
      typeof node.position.x === "number" &&
      typeof node.position.y === "number" &&
      (node.data === undefined ||
        (!!node.data &&
          typeof node.data === "object" &&
          !Array.isArray(node.data) &&
          Object.values(node.data).every(
            (entry) =>
              entry === null ||
              entry === undefined ||
              typeof entry === "boolean" ||
              typeof entry === "number" ||
              typeof entry === "string",
          )))
    );
  });

  const connectionsValid = graph.connections.every((connection) => {
    if (!connection || typeof connection !== "object" || Array.isArray(connection)) {
      return false;
    }

    return (
      typeof connection.id === "string" &&
      !!connection.from &&
      !!connection.to &&
      typeof connection.from.nodeId === "string" &&
      typeof connection.from.port === "string" &&
      typeof connection.to.nodeId === "string" &&
      typeof connection.to.port === "string"
    );
  });

  return nodesValid && connectionsValid;
}

export function validateBlueprintShape(value: unknown): BlueprintValidationResult {
  const errors: string[] = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      valid: false,
      errors: ["Blueprint must be an object."],
    };
  }

  const blueprint = value as Partial<PixelBlueprint>;

  if (typeof blueprint.name !== "string" || blueprint.name.trim().length === 0) {
    errors.push("Blueprint name must be a non-empty string.");
  }

  if (blueprint.id !== undefined && typeof blueprint.id !== "string") {
    errors.push("Blueprint id must be a string when provided.");
  }

  if (
    blueprint.blueprintCategory !== undefined &&
    blueprint.blueprintCategory !== "Component" &&
    blueprint.blueprintCategory !== "System" &&
    blueprint.blueprintCategory !== "Template"
  ) {
    errors.push(
      "Blueprint blueprintCategory must be Component, System, or Template when provided.",
    );
  }

  if (
    blueprint.blueprintType !== undefined &&
    (typeof blueprint.blueprintType !== "string" || blueprint.blueprintType.trim().length === 0)
  ) {
    errors.push("Blueprint blueprintType must be a non-empty string when provided.");
  }

  if (blueprint.schemaVersion !== 1) {
    errors.push("Blueprint schemaVersion must be 1.");
  }

  if (!Number.isInteger(blueprint.revision) || (blueprint.revision ?? 0) <= 0) {
    errors.push("Blueprint revision must be a positive integer.");
  }

  if (typeof blueprint.zone !== "string" || blueprint.zone.trim().length === 0) {
    errors.push("Blueprint zone must be a non-empty string.");
  }

  if (typeof blueprint.updatedAt !== "string" || Number.isNaN(Date.parse(blueprint.updatedAt))) {
    errors.push("Blueprint updatedAt must be a valid ISO date string.");
  }

  if (!isStringMatrix(blueprint.matrix)) {
    errors.push("Blueprint matrix must be a 2D array of strings.");
  }

  if (!isColorMap(blueprint.colorMap)) {
    errors.push("Blueprint colorMap must be a record of string colors.");
  }

  if (typeof blueprint.pixelSize !== "number" || blueprint.pixelSize <= 0) {
    errors.push("Blueprint pixelSize must be a positive number.");
  }

  if (blueprint.flipX !== undefined && typeof blueprint.flipX !== "boolean") {
    errors.push("Blueprint flipX must be a boolean when provided.");
  }

  if (blueprint.flipY !== undefined && typeof blueprint.flipY !== "boolean") {
    errors.push("Blueprint flipY must be a boolean when provided.");
  }

  if (
    blueprint.zonePalettePreset !== undefined &&
    typeof blueprint.zonePalettePreset !== "string"
  ) {
    errors.push("Blueprint zonePalettePreset must be a string when provided.");
  }

  if (blueprint.assignedComponents !== undefined) {
    if (
      !Array.isArray(blueprint.assignedComponents) ||
      !blueprint.assignedComponents.every((entry) => typeof entry === "string")
    ) {
      errors.push("Blueprint assignedComponents must be an array of strings when provided.");
    }
  }

  if (blueprint.assignedGlobalSystems !== undefined) {
    if (
      !Array.isArray(blueprint.assignedGlobalSystems) ||
      !blueprint.assignedGlobalSystems.every((entry) => typeof entry === "string")
    ) {
      errors.push("Blueprint assignedGlobalSystems must be an array of strings when provided.");
    }
  }

  if (blueprint.importSources !== undefined) {
    if (
      !Array.isArray(blueprint.importSources) ||
      !blueprint.importSources.every((entry) => typeof entry === "string")
    ) {
      errors.push("Blueprint importSources must be an array of strings when provided.");
    }
  }

  if (blueprint.childBlueprints !== undefined && !isChildBlueprintList(blueprint.childBlueprints)) {
    errors.push(
      "Blueprint childBlueprints must be valid child blueprint references when provided.",
    );
  }

  if (blueprint.componentTree !== undefined && !isLooseRecord(blueprint.componentTree)) {
    errors.push("Blueprint componentTree must be an object when provided.");
  }

  if (blueprint.spriteFrames !== undefined && !isSpriteFrames(blueprint.spriteFrames)) {
    errors.push("Blueprint spriteFrames must be an array of string matrices when provided.");
  }

  if (blueprint.logicGraph !== undefined && !isLogicGraph(blueprint.logicGraph)) {
    errors.push("Blueprint logicGraph must be a valid versioned automation graph.");
  }

  if (blueprint.logicGraphRef !== undefined && typeof blueprint.logicGraphRef !== "string") {
    errors.push("Blueprint logicGraphRef must be a string when provided.");
  }

  if (isStringMatrix(blueprint.matrix) && blueprint.matrix.length > 0) {
    const width = blueprint.matrix[0].length;
    if (!blueprint.matrix.every((row) => row.length === width)) {
      errors.push("Blueprint matrix rows must all have the same width.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function parseBlueprint(value: unknown): PixelBlueprint {
  const result = validateBlueprintShape(value);
  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }

  return value as PixelBlueprint;
}

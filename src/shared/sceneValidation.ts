import type { WorldScene } from "./types";

export interface SceneValidationResult {
  errors: string[];
  valid: boolean;
}

export function validateWorldScene(value: unknown): SceneValidationResult {
  const errors: string[] = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      valid: false,
      errors: ["Scene must be an object."],
    };
  }

  const scene = value as Partial<WorldScene>;

  if (typeof scene.name !== "string" || scene.name.trim().length === 0) {
    errors.push("Scene name must be a non-empty string.");
  }

  if (scene.schemaVersion !== 1) {
    errors.push("Scene schemaVersion must be 1.");
  }

  if (typeof scene.zone !== "string" || scene.zone.trim().length === 0) {
    errors.push("Scene zone must be a non-empty string.");
  }

  if (typeof scene.updatedAt !== "string" || Number.isNaN(Date.parse(scene.updatedAt))) {
    errors.push("Scene updatedAt must be a valid ISO date string.");
  }

  if (scene.width !== undefined && (!Number.isInteger(scene.width) || (scene.width ?? 0) <= 0)) {
    errors.push("Scene width must be a positive integer when provided.");
  }

  if (scene.height !== undefined && (!Number.isInteger(scene.height) || (scene.height ?? 0) <= 0)) {
    errors.push("Scene height must be a positive integer when provided.");
  }

  if (
    scene.cellSize !== undefined &&
    (!Number.isInteger(scene.cellSize) || (scene.cellSize ?? 0) <= 0)
  ) {
    errors.push("Scene cellSize must be a positive integer when provided.");
  }

  if (!Array.isArray(scene.placements)) {
    errors.push("Scene placements must be an array.");
  } else {
    for (const placement of scene.placements) {
      if (!placement || typeof placement !== "object" || Array.isArray(placement)) {
        errors.push("Scene placements must contain objects.");
        continue;
      }

      if (typeof placement.id !== "string" || placement.id.trim().length === 0) {
        errors.push("Scene placement id must be a non-empty string.");
      }
      if (
        typeof placement.blueprintName !== "string" ||
        placement.blueprintName.trim().length === 0
      ) {
        errors.push("Scene placement blueprintName must be a non-empty string.");
      }
      if (
        placement.components !== undefined &&
        (!Array.isArray(placement.components) ||
          !placement.components.every((component) => typeof component === "string"))
      ) {
        errors.push("Scene placement components must be an array of strings when provided.");
      }
      if (typeof placement.x !== "number" || typeof placement.y !== "number") {
        errors.push("Scene placement coordinates must be numbers.");
      }
      if (!Number.isInteger(placement.layer)) {
        errors.push("Scene placement layer must be an integer.");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

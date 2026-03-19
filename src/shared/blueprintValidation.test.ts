import { describe, expect, test } from "bun:test";
import { validateBlueprintShape } from "./blueprintValidation";
import type { PixelBlueprint } from "./types";

// Create test blueprint for testing
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

describe("validateBlueprintShape", () => {
  test("accepts a valid blueprint", () => {
    expect(validateBlueprintShape(testPlayerBlueprint)).toEqual({
      valid: true,
      errors: [],
    });
  });

  test("reports multiple schema problems", () => {
    const result = validateBlueprintShape({
      name: "",
      blueprintType: "",
      schemaVersion: 2,
      revision: 0,
      updatedAt: "not-a-date",
      zone: "",
      matrix: [["A"], ["A", "B"]],
      colorMap: { A: 123 },
      pixelSize: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Blueprint name must be a non-empty string.");
    expect(result.errors).toContain(
      "Blueprint blueprintType must be a non-empty string when provided.",
    );
    expect(result.errors).toContain("Blueprint schemaVersion must be 1.");
    expect(result.errors).toContain("Blueprint revision must be a positive integer.");
    expect(result.errors).toContain("Blueprint zone must be a non-empty string.");
    expect(result.errors).toContain("Blueprint updatedAt must be a valid ISO date string.");
    expect(result.errors).toContain("Blueprint colorMap must be a record of string colors.");
    expect(result.errors).toContain("Blueprint pixelSize must be a positive number.");
    expect(result.errors).toContain("Blueprint matrix rows must all have the same width.");
  });

  test("accepts an optional future logic graph", () => {
    const result = validateBlueprintShape({
      ...testPlayerBlueprint,
      logicGraph: {
        version: 1,
        nodes: [
          {
            id: "trigger-1",
            kind: "trigger",
            type: "OnInput",
            position: { x: 120, y: 80 },
            data: { key: "Space" },
          },
          {
            id: "action-1",
            kind: "action",
            type: "ModifyComponent",
            position: { x: 340, y: 80 },
            data: { component: "Velocity", x: 5 },
          },
        ],
        connections: [
          {
            id: "edge-1",
            from: { nodeId: "trigger-1", port: "out" },
            to: { nodeId: "action-1", port: "in" },
          },
        ],
      },
    });

    expect(result).toEqual({
      valid: true,
      errors: [],
    });
  });
});

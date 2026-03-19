import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { BlueprintRepository } from "./BlueprintRepository";
import { AssetIndex } from "./AssetIndex";
import type { PixelBlueprint, AssetMappingFile, LogicGraphAsset } from "../shared/types";
import { validateBlueprintShape } from "../shared/blueprintValidation";

// Create test blueprints for testing
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

const testShrineBlueprint: PixelBlueprint = {
  blueprintCategory: "Component",
  name: "shrine",
  blueprintType: "Prop",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "", "S", "S", "", ""],
    ["", "S", "G", "G", "S", ""],
  ],
  colorMap: {
    S: "#5c677d",
    G: "#d8dbe2",
  },
  pixelSize: 10,
};

const testDirectories: string[] = [];

afterEach(async () => {
  while (testDirectories.length > 0) {
    const directory = testDirectories.pop();
    if (directory) {
      await rm(directory, { recursive: true, force: true });
    }
  }
});

async function createRepository() {
  const directory = await mkdtemp(path.join(tmpdir(), "pixel-engine-"));
  testDirectories.push(directory);
  return new BlueprintRepository(path.join(directory, "blueprints"));
}

describe("BlueprintRepository", () => {
  test("seeds defaults and loads a catalog", async () => {
    const repository = await createRepository();

    await repository.ensureBlueprints([testPlayerBlueprint, testShrineBlueprint]);
    const catalog = await repository.loadCatalog();

    expect(catalog.issues).toEqual([]);
    expect(catalog.blueprints.map((blueprint) => blueprint.name)).toEqual(["player", "shrine"]);
  });

  test("skips malformed blueprint files and reports issues", async () => {
    const repository = await createRepository();
    await repository.ensureDirectory();

    await Bun.write(
      path.join(repository.getDirectoryPath(), "broken.json"),
      JSON.stringify({ name: "broken", pixelSize: 0 }),
    );

    const catalog = await repository.loadCatalog();

    expect(catalog.blueprints).toEqual([]);
    expect(catalog.issues).toHaveLength(1);
    expect(catalog.issues[0]?.fileName).toBe("broken.json");
  });

  test("increments revision and normalizes names when saving", async () => {
    const repository = await createRepository();
    await repository.ensureBlueprints([testPlayerBlueprint]);

    const saved = await repository.saveBlueprint({
      ...testPlayerBlueprint,
      name: "Player Hero",
    } as PixelBlueprint);

    expect(saved.name).toBe("player-hero");
    expect(saved.revision).toBe(1);

    const savedAgain = await repository.saveBlueprint(saved);
    expect(savedAgain.revision).toBe(2);
  });

  test("stores blueprint files by uuid and extracts logic graphs into reusable files", async () => {
    const repository = await createRepository();
    const saved = await repository.saveBlueprint(testPlayerBlueprint);
    const directoryEntries = await repository.listBlueprintFiles();

    expect(directoryEntries).toHaveLength(1);
    expect(directoryEntries[0]).toMatch(/[0-9a-f-]{36}\.json/u);
    expect(saved.logicGraphRef).toBeString();

    const assetRoot = path.dirname(repository.getDirectoryPath());
    const mapping = JSON.parse(
      await readFile(path.join(assetRoot, "mapping.json"), "utf8"),
    ) as AssetMappingFile;
    expect(
      mapping.entries.some((entry) => entry.kind === "blueprint" && entry.name === "player"),
    ).toBe(true);
    expect(mapping.entries.some((entry) => entry.kind === "logic")).toBe(true);

    const logicFile = path.join(assetRoot, "logic", `${saved.logicGraphRef}.json`);
    const logicAsset = JSON.parse(await readFile(logicFile, "utf8")) as LogicGraphAsset;
    expect(logicAsset.graph.nodes.length).toBeGreaterThan(0);

    const storedBlueprint = JSON.parse(
      await readFile(path.join(repository.getDirectoryPath(), directoryEntries[0] ?? ""), "utf8"),
    ) as PixelBlueprint;
    expect(storedBlueprint.logicGraph).toBeUndefined();
    expect(storedBlueprint.logicGraphRef).toBe(saved.logicGraphRef);
  });
});

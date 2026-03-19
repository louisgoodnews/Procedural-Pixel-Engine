import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AssetIndex } from "./AssetIndex.js";

function validateBlueprintShape(blueprint) {
  const errors = [];
  if (!blueprint || typeof blueprint !== "object" || Array.isArray(blueprint)) {
    errors.push("Blueprint must be an object.");
  }
  if (typeof blueprint?.name !== "string" || blueprint.name.trim().length === 0) {
    errors.push("Blueprint name must be a non-empty string.");
  }
  if (blueprint?.schemaVersion !== 1) {
    errors.push("Blueprint schemaVersion must be 1.");
  }
  if (!Number.isInteger(blueprint?.revision) || blueprint.revision <= 0) {
    errors.push("Blueprint revision must be a positive integer.");
  }
  if (typeof blueprint?.updatedAt !== "string") {
    errors.push("Blueprint updatedAt must be present.");
  }
  if (typeof blueprint?.zone !== "string" || blueprint.zone.trim().length === 0) {
    errors.push("Blueprint zone must be a non-empty string.");
  }
  if (
    !Array.isArray(blueprint?.matrix) ||
    !blueprint.matrix.every(
      (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"),
    )
  ) {
    errors.push("Blueprint matrix must be a 2D array of strings.");
  }
  if (
    !blueprint?.colorMap ||
    typeof blueprint.colorMap !== "object" ||
    Array.isArray(blueprint.colorMap)
  ) {
    errors.push("Blueprint colorMap must be an object.");
  }
  if (typeof blueprint?.pixelSize !== "number" || blueprint.pixelSize <= 0) {
    errors.push("Blueprint pixelSize must be a positive number.");
  }
  return { valid: errors.length === 0, errors };
}

export class BlueprintRepository {
  constructor(blueprintsDirectory) {
    this.cache = new Map();
    this.blueprintsDirectory = blueprintsDirectory;
    const assetRoot = this.resolveAssetRoot(blueprintsDirectory);
    this.logicDirectory = path.join(assetRoot, "logic");
    this.index = new AssetIndex(path.join(assetRoot, "mapping.json"));
  }

  getDirectoryPath() {
    return this.blueprintsDirectory;
  }

  setDirectoryPath(blueprintsDirectory) {
    this.blueprintsDirectory = blueprintsDirectory;
    const assetRoot = this.resolveAssetRoot(blueprintsDirectory);
    this.logicDirectory = path.join(assetRoot, "logic");
    this.index = new AssetIndex(path.join(assetRoot, "mapping.json"));
    this.cache.clear();
  }

  async ensureDirectory() {
    await mkdir(this.blueprintsDirectory, { recursive: true });
    await mkdir(this.logicDirectory, { recursive: true });
    await this.index.ensureReady();
  }

  async ensureBlueprints(defaultBlueprints) {
    await this.ensureDirectory();
    const index = await this.index.load();
    for (const blueprint of defaultBlueprints) {
      const name = this.toSafeName(blueprint.name);
      if (!this.index.findByName(index, "blueprint", name)) {
        await this.saveBlueprint(blueprint);
      }
    }
  }

  async loadCatalog() {
    await this.ensureDirectory();
    const index = await this.index.load();
    const blueprints = [];
    const issues = [];
    for (const entry of this.index.listByKind(index, "blueprint")) {
      try {
        blueprints.push(await this.readBlueprintEntry(entry));
      } catch (error) {
        issues.push({
          fileName: entry.fileName,
          message: error instanceof Error ? error.message : "Unknown blueprint load failure.",
        });
      }
    }
    for (const fileName of await this.listUnknownFiles(index)) {
      issues.push({
        fileName,
        message: "Unindexed blueprint file found. mapping.json may be out of date.",
      });
    }
    for (const fileName of await this.findOrphanedLogicFiles(index)) {
      issues.push({
        fileName,
        message: "Orphaned logic file found. No blueprint currently references it.",
      });
    }
    return { blueprints, issues };
  }

  async saveBlueprint(blueprint) {
    await this.ensureDirectory();
    const index = await this.index.load();
    const normalizedName = this.toSafeName(blueprint.name);
    const existingById = blueprint.id
      ? this.index.findById(index, "blueprint", blueprint.id)
      : undefined;
    const existingByName = this.index.findByName(index, "blueprint", normalizedName);
    if (existingByName && existingById && existingByName.id !== existingById.id) {
      throw new Error(`Blueprint name "${normalizedName}" is already in use.`);
    }
    if (existingByName && !existingById && existingByName.name === normalizedName) {
      throw new Error(`Blueprint name "${normalizedName}" is already in use.`);
    }
    const assetId = existingById?.id ?? existingByName?.id ?? blueprint.id ?? randomUUID();
    const previousBlueprint = existingById
      ? await this.tryReadBlueprintEntry(existingById)
      : existingByName
        ? await this.tryReadBlueprintEntry(existingByName)
        : null;
    const logicGraphRef = await this.persistLogicGraph(
      normalizedName,
      blueprint.logicGraph,
      blueprint.logicGraphRef ?? previousBlueprint?.logicGraphRef,
    );
    const payload = {
      ...blueprint,
      id: assetId,
      logicGraphRef,
      name: normalizedName,
      schemaVersion: 1,
      revision: (previousBlueprint?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    const validation = validateBlueprintShape(payload);
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.errors.join(" ")}`);
    }
    await this.writeBlueprint(payload);
    let nextIndex = this.index.upsert(index, {
      fileName: `${assetId}.json`,
      id: assetId,
      kind: "blueprint",
      name: normalizedName,
      updatedAt: payload.updatedAt,
    });
    if (logicGraphRef) {
      nextIndex = this.index.upsert(nextIndex, {
        fileName: `${logicGraphRef}.json`,
        id: logicGraphRef,
        kind: "logic",
        name: `${normalizedName}-logic`,
        updatedAt: payload.updatedAt,
      });
    }
    await this.index.save(nextIndex);
    return payload;
  }

  async listBlueprintFiles() {
    await this.ensureDirectory();
    const index = await this.index.load();
    return this.index.listByKind(index, "blueprint").map((entry) => entry.fileName);
  }

  async deleteBlueprint(name) {
    await this.ensureDirectory();
    const index = await this.index.load();
    const target = this.index.findByName(index, "blueprint", this.toSafeName(name));
    if (!target) {
      return false;
    }
    const blueprint = await this.tryReadBlueprintEntry(target);
    await rm(path.join(this.blueprintsDirectory, target.fileName), { force: true });
    this.cache.delete(target.fileName);
    let nextIndex = this.index.remove(index, "blueprint", target.id);
    if (blueprint?.logicGraphRef) {
      await rm(path.join(this.logicDirectory, `${blueprint.logicGraphRef}.json`), { force: true });
      nextIndex = this.index.remove(nextIndex, "logic", blueprint.logicGraphRef);
    }
    await this.index.save(nextIndex);
    return true;
  }

  async readBlueprintEntry(entry) {
    const serialized = await this.readFileContents(entry.fileName);
    const cached = this.cache.get(entry.fileName);
    if (cached && cached.serialized === serialized) {
      return cached.blueprint;
    }
    const parsed = JSON.parse(serialized);
    const blueprint = {
      ...parsed,
      logicGraph: parsed.logicGraphRef
        ? await this.readLogicGraph(parsed.logicGraphRef)
        : undefined,
    };
    const validation = validateBlueprintShape(blueprint);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }
    this.cache.set(entry.fileName, { blueprint, serialized });
    return blueprint;
  }

  async tryReadBlueprintEntry(entry) {
    try {
      return await this.readBlueprintEntry(entry);
    } catch {
      return null;
    }
  }

  async writeBlueprint(blueprint) {
    const { logicGraph, ...serializedBlueprint } = blueprint;
    const fileName = `${blueprint.id}.json`;
    const filePath = path.join(this.blueprintsDirectory, fileName);
    const serialized = `${JSON.stringify(serializedBlueprint, null, 2)}\n`;
    const bunRuntime = globalThis.Bun;
    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }
    this.cache.set(fileName, { blueprint, serialized });
  }

  async persistLogicGraph(blueprintName, graph, existingId) {
    if (!graph) {
      return existingId;
    }
    const id = existingId ?? randomUUID();
    const payload = {
      graph,
      id,
      name: `${blueprintName}-logic`,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    const filePath = path.join(this.logicDirectory, `${id}.json`);
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const bunRuntime = globalThis.Bun;
    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }
    return id;
  }

  async readLogicGraph(logicId) {
    const filePath = path.join(this.logicDirectory, `${logicId}.json`);
    const bunRuntime = globalThis.Bun;
    const serialized = bunRuntime
      ? await bunRuntime.file(filePath).text()
      : await readFile(filePath, "utf8");
    const parsed = JSON.parse(serialized);
    if (parsed.schemaVersion !== 1 || parsed.id !== logicId || !parsed.graph) {
      throw new Error(`Logic graph "${logicId}" is invalid.`);
    }
    return parsed.graph;
  }

  async readFileContents(fileName) {
    const filePath = path.join(this.blueprintsDirectory, fileName);
    const bunRuntime = globalThis.Bun;
    return bunRuntime ? bunRuntime.file(filePath).text() : readFile(filePath, "utf8");
  }

  async listUnknownFiles(index) {
    const known = new Set(this.index.listByKind(index, "blueprint").map((entry) => entry.fileName));
    const bunRuntime = globalThis.Bun;
    const files = bunRuntime
      ? Array.from(new bunRuntime.Glob("*.json").scanSync({ cwd: this.blueprintsDirectory }))
      : (await readdir(this.blueprintsDirectory)).filter((fileName) => fileName.endsWith(".json"));
    return files.filter((fileName) => !known.has(fileName)).sort();
  }

  async findOrphanedLogicFiles(index) {
    const referenced = new Set(
      (
        await Promise.all(
          this.index
            .listByKind(index, "blueprint")
            .map(async (entry) => (await this.tryReadBlueprintEntry(entry))?.logicGraphRef),
        )
      ).filter((entry) => typeof entry === "string"),
    );
    return this.index
      .listByKind(index, "logic")
      .filter((entry) => !referenced.has(entry.id))
      .map((entry) => entry.fileName)
      .sort();
  }

  toSafeName(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
  }

  resolveAssetRoot(blueprintsDirectory) {
    return path.basename(blueprintsDirectory) === "blueprints"
      ? path.dirname(blueprintsDirectory)
      : blueprintsDirectory;
  }
}

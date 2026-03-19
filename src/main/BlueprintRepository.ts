import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateBlueprintShape } from "../shared/blueprintValidation";
import type {
  AssetMappingEntry,
  BlueprintCatalog,
  BlueprintLoadIssue,
  LogicGraph,
  LogicGraphAsset,
  PixelBlueprint,
} from "../shared/types";
import { AssetIndex } from "./AssetIndex";
import { BrowserLogger } from "../renderer/BrowserLogger";
import { AssetDiscovery } from "./AssetDiscovery";

interface BlueprintCacheEntry {
  blueprint: PixelBlueprint;
  serialized: string;
}

type StoredBlueprint = Omit<PixelBlueprint, "logicGraph">;

export class BlueprintRepository {
  private readonly cache = new Map<string, BlueprintCacheEntry>();
  private blueprintsDirectory: string;
  private logicDirectory: string;
  private index: AssetIndex;

  constructor(blueprintsDirectory: string) {
    this.blueprintsDirectory = blueprintsDirectory;
    const assetRoot = this.resolveAssetRoot(blueprintsDirectory);
    this.logicDirectory = path.join(assetRoot, "logic");
    this.index = new AssetIndex(path.join(assetRoot, "mapping.json"));
  }

  getDirectoryPath(): string {
    return this.blueprintsDirectory;
  }

  setDirectoryPath(blueprintsDirectory: string): void {
    this.blueprintsDirectory = blueprintsDirectory;
    const assetRoot = this.resolveAssetRoot(blueprintsDirectory);
    this.logicDirectory = path.join(assetRoot, "logic");
    this.index = new AssetIndex(path.join(assetRoot, "mapping.json"));
    this.cache.clear();
  }

  async ensureDirectory(): Promise<void> {
    await mkdir(this.blueprintsDirectory, { recursive: true });
    await mkdir(this.logicDirectory, { recursive: true });
    await this.index.ensureReady();
    
    // Initialize asset discovery and indexing
    await this.initializeAssetDiscovery();
  }

  private async initializeAssetDiscovery(): Promise<void> {
    try {
      const assetRoot = this.resolveAssetRoot(this.blueprintsDirectory);
      const discovery = AssetDiscovery.getInstance();
      
      // Discover and index all assets
      await discovery.discoverAndIndexAssets(assetRoot);
      
      // Start watching for changes
      await discovery.startWatching(assetRoot);
      
      BrowserLogger.info("BlueprintRepository", "Asset discovery initialized", { assetRoot });
    } catch (error) {
      BrowserLogger.error("BlueprintRepository", "Failed to initialize asset discovery", error);
    }
  }

  async ensureBlueprints(defaultBlueprints: PixelBlueprint[]): Promise<void> {
    await this.ensureDirectory();
    const index = await this.index.load();

    for (const blueprint of defaultBlueprints) {
      const name = this.toSafeName(blueprint.name);
      if (!this.index.findByName(index, "blueprint", name)) {
        await this.saveBlueprint(blueprint);
      }
    }
  }

  async loadCatalog(): Promise<BlueprintCatalog> {
    await this.ensureDirectory();
    const index = await this.index.load();
    const blueprints: PixelBlueprint[] = [];
    const issues: BlueprintLoadIssue[] = [];

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

  async saveBlueprint(blueprint: PixelBlueprint): Promise<PixelBlueprint> {
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

    const payload: PixelBlueprint = {
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

    const nextIndex = this.index.upsert(index, {
      fileName: `${assetId}.json`,
      id: assetId,
      kind: "blueprint",
      name: normalizedName,
      updatedAt: payload.updatedAt,
    });

    if (logicGraphRef) {
      await this.index.save(
        this.index.upsert(nextIndex, {
          fileName: `${logicGraphRef}.json`,
          id: logicGraphRef,
          kind: "logic",
          name: `${normalizedName}-logic`,
          updatedAt: payload.updatedAt,
        }),
      );
    } else {
      await this.index.save(nextIndex);
    }

    return payload;
  }

  async listBlueprintFiles(): Promise<string[]> {
    await this.ensureDirectory();
    const index = await this.index.load();
    return this.index.listByKind(index, "blueprint").map((entry) => entry.fileName);
  }

  async deleteBlueprint(name: string): Promise<boolean> {
    await this.ensureDirectory();
    const index = await this.index.load();
    const target = this.index.findByName(index, "blueprint", this.toSafeName(name));

    if (!target) {
      return false;
    }

    const blueprint = await this.tryReadBlueprintEntry(target);
    const filePath = path.join(this.blueprintsDirectory, target.fileName);
    await rm(filePath, { force: true });
    this.cache.delete(target.fileName);

    let nextIndex = this.index.remove(index, "blueprint", target.id);
    if (blueprint?.logicGraphRef) {
      await rm(path.join(this.logicDirectory, `${blueprint.logicGraphRef}.json`), { force: true });
      nextIndex = this.index.remove(nextIndex, "logic", blueprint.logicGraphRef);
    }

    await this.index.save(nextIndex);
    return true;
  }

  private async readBlueprintEntry(entry: AssetMappingEntry): Promise<PixelBlueprint> {
    const serialized = await this.readFileContents(entry.fileName);
    const cached = this.cache.get(entry.fileName);

    if (cached && cached.serialized === serialized) {
      return cached.blueprint;
    }

    const parsed = JSON.parse(serialized) as StoredBlueprint;
    const blueprint = {
      ...parsed,
      logicGraph: parsed.logicGraphRef
        ? await this.readLogicGraph(parsed.logicGraphRef)
        : undefined,
    } as PixelBlueprint;

    const validation = validateBlueprintShape(blueprint);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    this.cache.set(entry.fileName, { blueprint, serialized });
    return blueprint;
  }

  private async tryReadBlueprintEntry(entry: AssetMappingEntry): Promise<PixelBlueprint | null> {
    try {
      return await this.readBlueprintEntry(entry);
    } catch {
      return null;
    }
  }

  private async writeBlueprint(blueprint: PixelBlueprint): Promise<void> {
    const { logicGraph: _logicGraph, ...serializedBlueprint } = blueprint;
    const fileName = `${blueprint.id}.json`;
    const filePath = path.join(this.blueprintsDirectory, fileName);
    const serialized = `${JSON.stringify(serializedBlueprint, null, 2)}\n`;
    const bunRuntime = this.getBunRuntime();

    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }

    this.cache.set(fileName, { blueprint, serialized });
  }

  private async persistLogicGraph(
    blueprintName: string,
    graph: LogicGraph | undefined,
    existingId: string | undefined,
  ): Promise<string | undefined> {
    if (!graph) {
      return existingId;
    }

    const id = existingId ?? randomUUID();
    const payload: LogicGraphAsset = {
      graph,
      id,
      name: `${blueprintName}-logic`,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    const filePath = path.join(this.logicDirectory, `${id}.json`);
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    const bunRuntime = this.getBunRuntime();

    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }

    return id;
  }

  private async readLogicGraph(logicId: string): Promise<LogicGraph> {
    const filePath = path.join(this.logicDirectory, `${logicId}.json`);
    const bunRuntime = this.getBunRuntime();
    const serialized = bunRuntime
      ? await bunRuntime.file(filePath).text()
      : await readFile(filePath, "utf8");
    const parsed = JSON.parse(serialized) as LogicGraphAsset;

    if (parsed.schemaVersion !== 1 || parsed.id !== logicId || !parsed.graph) {
      throw new Error(`Logic graph "${logicId}" is invalid.`);
    }

    return parsed.graph;
  }

  private async readFileContents(fileName: string): Promise<string> {
    const filePath = path.join(this.blueprintsDirectory, fileName);
    const bunRuntime = this.getBunRuntime();

    if (bunRuntime) {
      return await bunRuntime.file(filePath).text();
    }

    return readFile(filePath, "utf8");
  }

  private async listUnknownFiles(
    index: Awaited<ReturnType<AssetIndex["load"]>>,
  ): Promise<string[]> {
    const known = new Set(this.index.listByKind(index, "blueprint").map((entry) => entry.fileName));
    const bunRuntime = this.getBunRuntime();
    const files = bunRuntime
      ? Array.from(new bunRuntime.Glob("*.json").scanSync({ cwd: this.blueprintsDirectory }))
      : (await readdir(this.blueprintsDirectory)).filter((fileName) => fileName.endsWith(".json"));

    return files.filter((fileName) => !known.has(fileName)).sort();
  }

  private async findOrphanedLogicFiles(
    index: Awaited<ReturnType<AssetIndex["load"]>>,
  ): Promise<string[]> {
    const referenced = new Set(
      (
        await Promise.all(
          this.index
            .listByKind(index, "blueprint")
            .map(async (entry) => (await this.tryReadBlueprintEntry(entry))?.logicGraphRef),
        )
      ).filter((entry): entry is string => typeof entry === "string"),
    );
    const logicEntries = this.index.listByKind(index, "logic");
    return logicEntries
      .filter((entry) => !referenced.has(entry.id))
      .map((entry) => entry.fileName)
      .sort();
  }

  private toSafeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
  }

  private getBunRuntime(): typeof Bun | undefined {
    return globalThis.Bun;
  }

  private resolveAssetRoot(blueprintsDirectory: string): string {
    return path.basename(blueprintsDirectory) === "blueprints"
      ? path.dirname(blueprintsDirectory)
      : blueprintsDirectory;
  }
}

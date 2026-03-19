import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateWorldScene } from "../shared/sceneValidation";
import type { AssetMappingEntry, WorldScene } from "../shared/types";
import { AssetIndex } from "./AssetIndex";

interface SceneCacheEntry {
  scene: WorldScene;
  serialized: string;
}

export class SceneRepository {
  private readonly cache = new Map<string, SceneCacheEntry>();
  private index: AssetIndex;
  private scenesDirectory: string;

  constructor(scenesDirectory: string) {
    this.scenesDirectory = scenesDirectory;
    this.index = new AssetIndex(path.join(this.resolveAssetRoot(scenesDirectory), "mapping.json"));
  }

  getDirectoryPath(): string {
    return this.scenesDirectory;
  }

  setDirectoryPath(scenesDirectory: string): void {
    this.scenesDirectory = scenesDirectory;
    this.index = new AssetIndex(path.join(this.resolveAssetRoot(scenesDirectory), "mapping.json"));
    this.cache.clear();
  }

  async ensureDirectory(): Promise<void> {
    await mkdir(this.scenesDirectory, { recursive: true });
    await this.index.ensureReady();
  }

  async ensureScenes(defaultScenes: WorldScene[]): Promise<void> {
    await this.ensureDirectory();
    const index = await this.index.load();

    for (const scene of defaultScenes) {
      if (!this.index.findByName(index, "scene", this.toSafeName(scene.name))) {
        await this.saveScene(scene);
      }
    }
  }

  async listSceneFiles(): Promise<string[]> {
    await this.ensureDirectory();
    const index = await this.index.load();
    return this.index.listByKind(index, "scene").map((entry) => entry.fileName);
  }

  async loadScene(name: string): Promise<WorldScene> {
    await this.ensureDirectory();
    const index = await this.index.load();
    const entry = this.index.findByName(index, "scene", this.toSafeName(name));
    if (!entry) {
      throw new Error(`Scene "${name}" was not found.`);
    }
    return this.readScene(entry);
  }

  async saveScene(scene: WorldScene): Promise<WorldScene> {
    await this.ensureDirectory();
    const index = await this.index.load();
    const normalizedName = this.toSafeName(scene.name);
    const existingById = scene.id ? this.index.findById(index, "scene", scene.id) : undefined;
    const existingByName = this.index.findByName(index, "scene", normalizedName);

    if (existingByName && existingById && existingByName.id !== existingById.id) {
      throw new Error(`Scene name "${normalizedName}" is already in use.`);
    }

    if (existingByName && !existingById && existingByName.name === normalizedName) {
      throw new Error(`Scene name "${normalizedName}" is already in use.`);
    }

    const payload: WorldScene = {
      ...scene,
      id: existingById?.id ?? existingByName?.id ?? scene.id ?? randomUUID(),
      name: normalizedName,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };

    const validation = validateWorldScene(payload);
    if (!validation.valid) {
      throw new Error(`Scene validation failed: ${validation.errors.join(" ")}`);
    }

    await this.writeScene(payload);
    await this.index.save(
      this.index.upsert(index, {
        fileName: `${payload.id}.json`,
        id: payload.id ?? randomUUID(),
        kind: "scene",
        name: payload.name,
        updatedAt: payload.updatedAt,
      }),
    );
    return payload;
  }

  private async readScene(entry: AssetMappingEntry): Promise<WorldScene> {
    const serialized = await this.readFileContents(entry.fileName);
    const cached = this.cache.get(entry.fileName);

    if (cached && cached.serialized === serialized) {
      return cached.scene;
    }

    const parsed = JSON.parse(serialized) as unknown;
    const validation = validateWorldScene(parsed);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    const scene = parsed as WorldScene;
    this.cache.set(entry.fileName, { scene, serialized });
    return scene;
  }

  private async writeScene(scene: WorldScene): Promise<void> {
    const fileName = `${scene.id}.json`;
    const filePath = path.join(this.scenesDirectory, fileName);
    const serialized = `${JSON.stringify(scene, null, 2)}\n`;
    const bunRuntime = this.getBunRuntime();

    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }

    this.cache.set(fileName, { scene, serialized });
  }

  private async readFileContents(fileName: string): Promise<string> {
    const filePath = path.join(this.scenesDirectory, fileName);
    const bunRuntime = this.getBunRuntime();

    if (bunRuntime) {
      return await bunRuntime.file(filePath).text();
    }

    return readFile(filePath, "utf8");
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

  private resolveAssetRoot(scenesDirectory: string): string {
    return path.basename(scenesDirectory) === "scenes"
      ? path.dirname(scenesDirectory)
      : scenesDirectory;
  }
}

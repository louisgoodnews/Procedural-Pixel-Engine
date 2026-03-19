import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AssetIndex } from "./AssetIndex.js";

function validateScene(scene) {
  const errors = [];
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    errors.push("Scene must be an object.");
  }
  if (typeof scene?.name !== "string" || scene.name.trim().length === 0) {
    errors.push("Scene name must be a non-empty string.");
  }
  if (scene?.schemaVersion !== 1) {
    errors.push("Scene schemaVersion must be 1.");
  }
  if (!Array.isArray(scene?.placements)) {
    errors.push("Scene placements must be an array.");
  }
  return { valid: errors.length === 0, errors };
}

export class SceneRepository {
  constructor(scenesDirectory) {
    this.cache = new Map();
    this.scenesDirectory = scenesDirectory;
    this.index = new AssetIndex(path.join(this.resolveAssetRoot(scenesDirectory), "mapping.json"));
  }

  getDirectoryPath() {
    return this.scenesDirectory;
  }

  setDirectoryPath(scenesDirectory) {
    this.scenesDirectory = scenesDirectory;
    this.index = new AssetIndex(path.join(this.resolveAssetRoot(scenesDirectory), "mapping.json"));
    this.cache.clear();
  }

  async ensureDirectory() {
    await mkdir(this.scenesDirectory, { recursive: true });
    await this.index.ensureReady();
  }

  async ensureScenes(defaultScenes) {
    await this.ensureDirectory();
    const index = await this.index.load();
    for (const scene of defaultScenes) {
      if (!this.index.findByName(index, "scene", this.toSafeName(scene.name))) {
        await this.saveScene(scene);
      }
    }
  }

  async listSceneFiles() {
    await this.ensureDirectory();
    const index = await this.index.load();
    return this.index.listByKind(index, "scene").map((entry) => entry.fileName);
  }

  async loadScene(name) {
    await this.ensureDirectory();
    const index = await this.index.load();
    const entry = this.index.findByName(index, "scene", this.toSafeName(name));
    if (!entry) {
      throw new Error(`Scene "${name}" was not found.`);
    }
    return this.readScene(entry);
  }

  async saveScene(scene) {
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
    const payload = {
      ...scene,
      id: existingById?.id ?? existingByName?.id ?? scene.id ?? randomUUID(),
      name: normalizedName,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    const validation = validateScene(payload);
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

  async readScene(entry) {
    const serialized = await this.readFileContents(entry.fileName);
    const cached = this.cache.get(entry.fileName);
    if (cached && cached.serialized === serialized) {
      return cached.scene;
    }
    const parsed = JSON.parse(serialized);
    const validation = validateScene(parsed);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }
    this.cache.set(entry.fileName, { scene: parsed, serialized });
    return parsed;
  }

  async writeScene(scene) {
    const fileName = `${scene.id}.json`;
    const filePath = path.join(this.scenesDirectory, fileName);
    const serialized = `${JSON.stringify(scene, null, 2)}\n`;
    const bunRuntime = globalThis.Bun;
    if (bunRuntime) {
      await bunRuntime.write(filePath, serialized);
    } else {
      await writeFile(filePath, serialized, "utf8");
    }
    this.cache.set(fileName, { scene, serialized });
  }

  async readFileContents(fileName) {
    const filePath = path.join(this.scenesDirectory, fileName);
    const bunRuntime = globalThis.Bun;
    return bunRuntime ? bunRuntime.file(filePath).text() : readFile(filePath, "utf8");
  }

  toSafeName(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
  }

  resolveAssetRoot(scenesDirectory) {
    return path.basename(scenesDirectory) === "scenes"
      ? path.dirname(scenesDirectory)
      : scenesDirectory;
  }
}

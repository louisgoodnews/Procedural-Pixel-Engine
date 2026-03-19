import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const EMPTY_INDEX = {
  entries: [],
  schemaVersion: 1,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

function isMappingEntry(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.fileName === "string" &&
    ["blueprint", "logic", "scene"].includes(value.kind) &&
    typeof value.updatedAt === "string"
  );
}

function isAssetMappingFile(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.schemaVersion === 1 &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.entries) &&
    value.entries.every((entry) => isMappingEntry(entry))
  );
}

export class AssetIndex {
  constructor(filePath) {
    this.filePath = filePath;
    this.backupFilePath = `${filePath}.bak`;
  }

  async ensureReady() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const current = await this.readIndexWithFallback();
    await this.writeIndex(current);
  }

  async load() {
    await this.ensureReady();
    return this.readIndexWithFallback();
  }

  async save(index) {
    await this.ensureReady();
    await this.writeIndex(index);
  }

  findById(index, kind, id) {
    return index.entries.find((entry) => entry.kind === kind && entry.id === id);
  }

  findByName(index, kind, name) {
    return index.entries.find((entry) => entry.kind === kind && entry.name === name);
  }

  listByKind(index, kind) {
    return index.entries.filter((entry) => entry.kind === kind);
  }

  upsert(index, nextEntry) {
    const nextEntries = index.entries.filter(
      (entry) =>
        !(
          entry.kind === nextEntry.kind &&
          (entry.id === nextEntry.id || entry.name === nextEntry.name)
        ),
    );
    nextEntries.push(nextEntry);
    nextEntries.sort((left, right) =>
      left.kind === right.kind
        ? left.name.localeCompare(right.name)
        : left.kind.localeCompare(right.kind),
    );
    return {
      entries: nextEntries,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(index, kind, id) {
    return {
      entries: index.entries.filter((entry) => !(entry.kind === kind && entry.id === id)),
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
  }

  async readIndexWithFallback() {
    const primary = await this.tryRead(this.filePath);
    if (primary) {
      return primary;
    }
    const backup = await this.tryRead(this.backupFilePath);
    if (backup) {
      await this.writeIndex(backup);
      return backup;
    }
    return EMPTY_INDEX;
  }

  async tryRead(filePath) {
    const bunRuntime = globalThis.Bun;
    try {
      const serialized = bunRuntime
        ? await bunRuntime.file(filePath).text()
        : await readFile(filePath, "utf8");
      const parsed = JSON.parse(serialized);
      return isAssetMappingFile(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async writeIndex(index) {
    const serialized = `${JSON.stringify(index, null, 2)}\n`;
    const bunRuntime = globalThis.Bun;
    if (bunRuntime) {
      await bunRuntime.write(this.filePath, serialized);
      await bunRuntime.write(this.backupFilePath, serialized);
      return;
    }
    await writeFile(this.filePath, serialized, "utf8");
    await copyFile(this.filePath, this.backupFilePath);
  }
}

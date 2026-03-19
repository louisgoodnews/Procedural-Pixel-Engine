import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetMappingEntry, AssetMappingFile } from "../shared/types";

const EMPTY_INDEX: AssetMappingFile = {
  entries: [],
  schemaVersion: 1,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

function isMappingEntry(value: unknown): value is AssetMappingEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entry = value as Partial<AssetMappingEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.fileName === "string" &&
    (entry.kind === "blueprint" || entry.kind === "logic" || entry.kind === "scene") &&
    typeof entry.updatedAt === "string"
  );
}

function isAssetMappingFile(value: unknown): value is AssetMappingFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const parsed = value as Partial<AssetMappingFile>;
  return (
    parsed.schemaVersion === 1 &&
    typeof parsed.updatedAt === "string" &&
    Array.isArray(parsed.entries) &&
    parsed.entries.every((entry) => isMappingEntry(entry))
  );
}

export class AssetIndex {
  private readonly backupFilePath: string;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.backupFilePath = `${filePath}.bak`;
  }

  async ensureReady(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const current = await this.readIndexWithFallback();
    await this.writeIndex(current);
  }

  async load(): Promise<AssetMappingFile> {
    await this.ensureReady();
    return this.readIndexWithFallback();
  }

  async save(index: AssetMappingFile): Promise<void> {
    await this.ensureReady();
    await this.writeIndex(index);
  }

  findById(
    index: AssetMappingFile,
    kind: AssetMappingEntry["kind"],
    id: string,
  ): AssetMappingEntry | undefined {
    return index.entries.find((entry) => entry.kind === kind && entry.id === id);
  }

  findByName(
    index: AssetMappingFile,
    kind: AssetMappingEntry["kind"],
    name: string,
  ): AssetMappingEntry | undefined {
    return index.entries.find((entry) => entry.kind === kind && entry.name === name);
  }

  listByKind(index: AssetMappingFile, kind: AssetMappingEntry["kind"]): AssetMappingEntry[] {
    return index.entries.filter((entry) => entry.kind === kind);
  }

  upsert(index: AssetMappingFile, nextEntry: AssetMappingEntry): AssetMappingFile {
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

  remove(index: AssetMappingFile, kind: AssetMappingEntry["kind"], id: string): AssetMappingFile {
    return {
      entries: index.entries.filter((entry) => !(entry.kind === kind && entry.id === id)),
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
  }

  private async readIndexWithFallback(): Promise<AssetMappingFile> {
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

  private async tryRead(filePath: string): Promise<AssetMappingFile | null> {
    const bunRuntime = globalThis.Bun;

    try {
      const serialized = bunRuntime
        ? await bunRuntime.file(filePath).text()
        : await readFile(filePath, "utf8");
      const parsed = JSON.parse(serialized) as unknown;
      return isAssetMappingFile(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private async writeIndex(index: AssetMappingFile): Promise<void> {
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

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app, ipcMain } from "electron";
import type { HeadlessSimulationRequest } from "../shared/api/engine-api";
import type {
  AssetBundle,
  AssetIntegrityReport,
  BlueprintDependencyReport,
  DeleteBlueprintResult,
  LogicGraphExport,
  PixelBlueprint,
  ProjectInfo,
  SceneExport,
  SpriteLibraryExport,
  WorldScene,
} from "../shared/types";
import { AssetIndex } from "./AssetIndex";
import { BlueprintRepository } from "./BlueprintRepository";
import { HeadlessRuntimeManager, runHeadlessSimulation } from "./HeadlessRuntime";
import { SceneRepository } from "./SceneRepository";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");
const defaultProjectRoot = workspaceRoot;
const isDev = !app.isPackaged;

interface ProjectConfig {
  activeProjectPath: string;
}

const starterScene: WorldScene = {
  cellSize: 32,
  height: 18,
  id: "starter-scene",
  name: "starter-plains",
  schemaVersion: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  width: 28,
  zone: "starter-plains",
  placements: [
    { id: "scene-player", blueprintName: "player", x: 96, y: 96, layer: 20 },
    { id: "scene-villager", blueprintName: "villager", x: 180, y: 112, layer: 15 },
    { id: "scene-shrine-a", blueprintName: "shrine", x: 260, y: 160, layer: 5 },
    { id: "scene-shrine-b", blueprintName: "shrine", x: 420, y: 260, layer: 5 },
  ],
};

let activeProjectRoot = defaultProjectRoot;
let assetIndex = new AssetIndex(path.join(activeProjectRoot, "assets", "mapping.json"));
let headlessRuntime = new HeadlessRuntimeManager({ blueprints: new Map() });

const blueprintRepository = new BlueprintRepository(
  path.join(activeProjectRoot, "assets", "blueprints"),
);
const sceneRepository = new SceneRepository(path.join(activeProjectRoot, "assets", "scenes"));

function getProjectConfigPath(): string {
  return path.join(app.getPath("userData"), "project-config.json");
}

function getBlueprintsDirectory(): string {
  return path.join(activeProjectRoot, "assets", "blueprints");
}

function getScenesDirectory(): string {
  return path.join(activeProjectRoot, "assets", "scenes");
}

function getExportsDirectory(): string {
  return path.join(activeProjectRoot, "assets", "exports");
}

function setActiveProjectRoot(projectPath: string): void {
  activeProjectRoot = path.resolve(projectPath);
  assetIndex = new AssetIndex(path.join(activeProjectRoot, "assets", "mapping.json"));
  blueprintRepository.setDirectoryPath(getBlueprintsDirectory());
  sceneRepository.setDirectoryPath(getScenesDirectory());
}

function getActiveProjectInfo(): ProjectInfo {
  return {
    name: path.basename(activeProjectRoot),
    path: activeProjectRoot,
  };
}

async function loadProjectConfig(): Promise<void> {
  try {
    const parsed = JSON.parse(await readFile(getProjectConfigPath(), "utf8")) as ProjectConfig;
    if (
      typeof parsed.activeProjectPath === "string" &&
      parsed.activeProjectPath.trim().length > 0
    ) {
      setActiveProjectRoot(parsed.activeProjectPath);
    }
  } catch {
    setActiveProjectRoot(defaultProjectRoot);
  }
}

async function saveProjectConfig(): Promise<void> {
  const payload: ProjectConfig = {
    activeProjectPath: activeProjectRoot,
  };
  await writeFile(getProjectConfigPath(), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getBunRuntime(): typeof Bun | undefined {
  return globalThis.Bun;
}

async function ensureProjectStructure(projectPath: string): Promise<void> {
  await mkdir(path.join(projectPath, "assets", "blueprints"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "logic"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "scenes"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "exports"), { recursive: true });
}

async function inspectAssetIntegrity(): Promise<AssetIntegrityReport> {
  await ensureProjectStructure(activeProjectRoot);
  await assetIndex.ensureReady();
  const index = await assetIndex.load();
  const knownBlueprints = new Set(
    assetIndex.listByKind(index, "blueprint").map((entry) => entry.fileName),
  );
  const knownLogic = new Set(assetIndex.listByKind(index, "logic").map((entry) => entry.fileName));
  const knownScenes = new Set(assetIndex.listByKind(index, "scene").map((entry) => entry.fileName));
  const bunRuntime = getBunRuntime();
  const scanJson = async (directory: string): Promise<string[]> => {
    if (bunRuntime) {
      return Array.from(new bunRuntime.Glob("*.json").scanSync({ cwd: directory })).sort();
    }
    return (await readdir(directory)).filter((fileName) => fileName.endsWith(".json")).sort();
  };

  const [blueprintFiles, logicFiles, sceneFiles] = await Promise.all([
    scanJson(getBlueprintsDirectory()),
    scanJson(path.join(activeProjectRoot, "assets", "logic")),
    scanJson(getScenesDirectory()),
  ]);
  const fileExists = async (filePath: string): Promise<boolean> => {
    try {
      if (bunRuntime) {
        await bunRuntime.file(filePath).text();
      } else {
        await readFile(filePath, "utf8");
      }
      return true;
    } catch {
      return false;
    }
  };
  const staleMappings = index.entries.map(async (entry) => {
    const directory =
      entry.kind === "blueprint"
        ? getBlueprintsDirectory()
        : entry.kind === "logic"
          ? path.join(activeProjectRoot, "assets", "logic")
          : getScenesDirectory();
    const exists = await fileExists(path.join(directory, entry.fileName));
    return exists ? null : `${entry.kind}:${entry.fileName}`;
  });
  const catalog = await blueprintRepository.loadCatalog();
  const referencedLogic = new Set(
    catalog.blueprints
      .map((blueprint) => blueprint.logicGraphRef)
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      .map((entry) => `${entry}.json`),
  );

  return {
    orphanLogicFiles: logicFiles.filter((fileName) => !referencedLogic.has(fileName)),
    staleMappings: (await Promise.all(staleMappings)).filter(
      (entry): entry is string => typeof entry === "string",
    ),
    unknownBlueprintFiles: blueprintFiles.filter((fileName) => !knownBlueprints.has(fileName)),
    unknownLogicFiles: logicFiles.filter((fileName) => !knownLogic.has(fileName)),
    unknownSceneFiles: sceneFiles.filter((fileName) => !knownScenes.has(fileName)),
  };
}

async function repairAssetIntegrity(
  _: Electron.IpcMainInvokeEvent,
  mode: "cleanup" | "reindex",
): Promise<AssetIntegrityReport> {
  await ensureProjectStructure(activeProjectRoot);
  await assetIndex.ensureReady();
  const report = await inspectAssetIntegrity();
  const index = await assetIndex.load();
  let nextIndex = index;
  const logicDirectory = path.join(activeProjectRoot, "assets", "logic");
  const bunRuntime = getBunRuntime();
  const removeFile = async (filePath: string) => {
    try {
      await rm(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  };

  if (mode === "cleanup") {
    for (const fileName of report.unknownBlueprintFiles) {
      await removeFile(path.join(getBlueprintsDirectory(), fileName));
    }
    for (const fileName of report.unknownLogicFiles) {
      await removeFile(path.join(logicDirectory, fileName));
    }
    for (const fileName of report.unknownSceneFiles) {
      await removeFile(path.join(getScenesDirectory(), fileName));
    }
    for (const fileName of report.orphanLogicFiles) {
      await removeFile(path.join(logicDirectory, fileName));
      const mapping = assetIndex
        .listByKind(nextIndex, "logic")
        .find((entry) => entry.fileName === fileName);
      if (mapping) {
        nextIndex = assetIndex.remove(nextIndex, "logic", mapping.id);
      }
    }
  } else {
    for (const fileName of report.unknownBlueprintFiles) {
      const serialized = bunRuntime
        ? await bunRuntime.file(path.join(getBlueprintsDirectory(), fileName)).text()
        : await readFile(path.join(getBlueprintsDirectory(), fileName), "utf8");
      const parsed = JSON.parse(serialized) as Partial<PixelBlueprint> & {
        id?: string;
        name?: string;
      };
      if (typeof parsed.id === "string" && typeof parsed.name === "string") {
        nextIndex = assetIndex.upsert(nextIndex, {
          fileName,
          id: parsed.id,
          kind: "blueprint",
          name: parsed.name,
          updatedAt:
            typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        });
      }
    }
    for (const fileName of report.unknownSceneFiles) {
      const serialized = bunRuntime
        ? await bunRuntime.file(path.join(getScenesDirectory(), fileName)).text()
        : await readFile(path.join(getScenesDirectory(), fileName), "utf8");
      const parsed = JSON.parse(serialized) as { id?: string; name?: string; updatedAt?: string };
      if (typeof parsed.id === "string" && typeof parsed.name === "string") {
        nextIndex = assetIndex.upsert(nextIndex, {
          fileName,
          id: parsed.id,
          kind: "scene",
          name: parsed.name,
          updatedAt:
            typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        });
      }
    }
    for (const fileName of report.unknownLogicFiles) {
      const serialized = bunRuntime
        ? await bunRuntime.file(path.join(logicDirectory, fileName)).text()
        : await readFile(path.join(logicDirectory, fileName), "utf8");
      const parsed = JSON.parse(serialized) as { id?: string; name?: string; updatedAt?: string };
      if (typeof parsed.id === "string" && typeof parsed.name === "string") {
        nextIndex = assetIndex.upsert(nextIndex, {
          fileName,
          id: parsed.id,
          kind: "logic",
          name: parsed.name,
          updatedAt:
            typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        });
      }
    }
  }

  for (const stale of report.staleMappings) {
    const [kind, fileName] = stale.split(":");
    const entry = nextIndex.entries.find(
      (mapping) => mapping.kind === kind && mapping.fileName === fileName,
    );
    if (entry) {
      nextIndex = assetIndex.remove(nextIndex, entry.kind, entry.id);
    }
  }

  await assetIndex.save(nextIndex);
  return inspectAssetIntegrity();
}

async function runEngineHeadlessSimulation(
  _: Electron.IpcMainInvokeEvent,
  request: HeadlessSimulationRequest,
) {
  const catalog = await blueprintRepository.loadCatalog();
  return runHeadlessSimulation(request, {
    blueprints: new Map(catalog.blueprints.map((blueprint) => [blueprint.name, blueprint])),
  });
}

async function rebuildHeadlessRuntime(): Promise<void> {
  const catalog = await blueprintRepository.loadCatalog();
  headlessRuntime = new HeadlessRuntimeManager({
    blueprints: new Map(catalog.blueprints.map((blueprint) => [blueprint.name, blueprint])),
  });
}

async function ensureCurrentProjectDefaults(): Promise<void> {
  await ensureProjectStructure(activeProjectRoot);
  // Don't ensure hardcoded blueprints - let the asset discovery system handle this
  await blueprintRepository.ensureDirectory();
  await sceneRepository.ensureDirectory();
}

function toSafeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-");
}

function toSafeBundleName(name: string): string {
  return toSafeName(name);
}

async function ensureExportsDirectory(): Promise<void> {
  await mkdir(getExportsDirectory(), { recursive: true });
}

async function writeExportFile(fileName: string, serialized: string): Promise<void> {
  const filePath = path.join(getExportsDirectory(), fileName);
  const bunRuntime = getBunRuntime();

  if (bunRuntime) {
    await bunRuntime.write(filePath, serialized);
    return;
  }

  await writeFile(filePath, serialized, "utf8");
}

async function readExportFile(fileName: string): Promise<string> {
  const filePath = path.join(getExportsDirectory(), fileName);
  const bunRuntime = getBunRuntime();

  if (bunRuntime) {
    return bunRuntime.file(filePath).text();
  }

  return readFile(filePath, "utf8");
}

async function listExportFiles(): Promise<string[]> {
  await ensureExportsDirectory();
  const bunRuntime = getBunRuntime();

  if (bunRuntime) {
    return Array.from(
      new bunRuntime.Glob("*.json").scanSync({ cwd: getExportsDirectory() }),
    ).sort();
  }

  return (await readdir(getExportsDirectory()))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
}

async function createProject(_: Electron.IpcMainInvokeEvent, name: string): Promise<ProjectInfo> {
  const safeName = toSafeName(name) || "untitled-project";
  const projectPath = path.join(workspaceRoot, "projects", safeName);
  await ensureProjectStructure(projectPath);
  setActiveProjectRoot(projectPath);
  await ensureCurrentProjectDefaults();
  await saveProjectConfig();
  return getActiveProjectInfo();
}

async function openProject(
  _: Electron.IpcMainInvokeEvent,
  projectPath: string,
): Promise<ProjectInfo> {
  const resolvedPath = path.resolve(projectPath);
  await ensureProjectStructure(resolvedPath);
  setActiveProjectRoot(resolvedPath);
  await ensureCurrentProjectDefaults();
  await saveProjectConfig();
  return getActiveProjectInfo();
}

function getActiveProject(): ProjectInfo {
  return getActiveProjectInfo();
}

async function saveBlueprint(
  _: Electron.IpcMainInvokeEvent,
  blueprint: PixelBlueprint,
): Promise<PixelBlueprint> {
  const saved = await blueprintRepository.saveBlueprint(blueprint);
  await rebuildHeadlessRuntime();
  return saved;
}

async function saveScene(_: Electron.IpcMainInvokeEvent, scene: WorldScene): Promise<WorldScene> {
  return sceneRepository.saveScene(scene);
}

function findBlueprintDependencies(
  targetName: string,
  blueprints: PixelBlueprint[],
  scenes: WorldScene[],
): BlueprintDependencyReport {
  return {
    referencedByBlueprints: blueprints
      .filter((blueprint) => {
        const childRef = blueprint.childBlueprints?.some(
          (child) => child.blueprintName === targetName,
        );
        const importRef = blueprint.importSources?.includes(targetName);
        return blueprint.name !== targetName && (childRef || importRef);
      })
      .map((blueprint) => blueprint.name),
    referencedByScenes: scenes
      .filter((scene) =>
        scene.placements.some((placement) => placement.blueprintName === targetName),
      )
      .map((scene) => scene.name),
  };
}

async function deleteBlueprint(
  _: Electron.IpcMainInvokeEvent,
  name: string,
  force = false,
): Promise<DeleteBlueprintResult> {
  const targetName = toSafeName(name);
  const catalog = await blueprintRepository.loadCatalog();
  const sceneFiles = await sceneRepository.listSceneFiles();
  const scenes = await Promise.all(
    sceneFiles.map((fileName) => sceneRepository.loadScene(fileName.replace(/\.json$/u, ""))),
  );
  const dependencies = findBlueprintDependencies(targetName, catalog.blueprints, scenes);
  const hasDependencies =
    dependencies.referencedByBlueprints.length > 0 || dependencies.referencedByScenes.length > 0;

  if (hasDependencies && !force) {
    return {
      deleted: false,
      dependencies,
    };
  }

  if (hasDependencies) {
    for (const blueprint of catalog.blueprints) {
      if (blueprint.name === targetName) {
        continue;
      }

      const nextChildren = blueprint.childBlueprints?.filter(
        (child) => child.blueprintName !== targetName,
      );
      const nextImports = blueprint.importSources?.filter((entry) => entry !== targetName);

      if (
        nextChildren?.length !== blueprint.childBlueprints?.length ||
        nextImports?.length !== blueprint.importSources?.length
      ) {
        await blueprintRepository.saveBlueprint({
          ...blueprint,
          childBlueprints: nextChildren,
          importSources: nextImports,
        });
      }
    }

    for (const scene of scenes) {
      const nextPlacements = scene.placements.filter(
        (placement) => placement.blueprintName !== targetName,
      );
      if (nextPlacements.length !== scene.placements.length) {
        await sceneRepository.saveScene({
          ...scene,
          placements: nextPlacements,
        });
      }
    }
  }

  return {
    deleted: await blueprintRepository.deleteBlueprint(targetName),
    dependencies,
  };
}

async function exportAssetBundle(
  _: Electron.IpcMainInvokeEvent,
  bundleName: string,
  bundle: AssetBundle,
): Promise<string> {
  await ensureExportsDirectory();
  const fileName = `${toSafeBundleName(bundleName)}.json`;
  const payload: AssetBundle = {
    ...bundle,
    exportedAt: new Date().toISOString(),
    kind: "engine-asset-bundle",
    schemaVersion: 1,
  };
  await writeExportFile(fileName, `${JSON.stringify(payload, null, 2)}\n`);
  return fileName;
}

async function exportLogicGraph(
  _: Electron.IpcMainInvokeEvent,
  name: string,
  graph: LogicGraphExport,
): Promise<string> {
  await ensureExportsDirectory();
  const fileName = `${toSafeBundleName(name)}-logic.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify(
      {
        ...graph,
        exportedAt: new Date().toISOString(),
        kind: "logic-graph",
        schemaVersion: 1,
      },
      null,
      2,
    )}\n`,
  );
  return fileName;
}

async function exportSpriteLibrary(
  _: Electron.IpcMainInvokeEvent,
  name: string,
  spriteLibrary: SpriteLibraryExport,
): Promise<string> {
  await ensureExportsDirectory();
  const fileName = `${toSafeBundleName(name)}-sprites.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify(
      {
        ...spriteLibrary,
        exportedAt: new Date().toISOString(),
        kind: "sprite-library",
        schemaVersion: 1,
      },
      null,
      2,
    )}\n`,
  );
  return fileName;
}

async function exportSceneBundle(
  _: Electron.IpcMainInvokeEvent,
  name: string,
  sceneBundle: SceneExport,
): Promise<string> {
  await ensureExportsDirectory();
  const fileName = `${toSafeBundleName(name)}-scene.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify(
      {
        ...sceneBundle,
        exportedAt: new Date().toISOString(),
        kind: "scene-bundle",
        schemaVersion: 1,
      },
      null,
      2,
    )}\n`,
  );
  return fileName;
}

async function importAssetBundle(
  _: Electron.IpcMainInvokeEvent,
  bundleName: string,
): Promise<AssetBundle> {
  await ensureExportsDirectory();
  const fileName = bundleName.endsWith(".json")
    ? bundleName
    : `${toSafeBundleName(bundleName)}.json`;
  const parsed = JSON.parse(await readExportFile(fileName)) as AssetBundle;

  if (parsed.kind !== "engine-asset-bundle" || parsed.schemaVersion !== 1) {
    throw new Error("Asset bundle format is invalid.");
  }

  return parsed;
}

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#11161d",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    await window.loadURL("http://127.0.0.1:5173");
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  await window.loadFile(path.join(workspaceRoot, "dist", "index.html"));
}

app.whenReady().then(async () => {
  await loadProjectConfig();
  await ensureCurrentProjectDefaults();
  await rebuildHeadlessRuntime();

  ipcMain.handle("app:requestExit", () => {
    app.exit(0);
  });
  ipcMain.handle("project:create", createProject);
  ipcMain.handle("project:getActive", getActiveProject);
  ipcMain.handle("project:open", openProject);
  ipcMain.handle("game:deleteBlueprint", deleteBlueprint);
  ipcMain.handle("game:inspectAssetIntegrity", inspectAssetIntegrity);
  ipcMain.handle("game:listBlueprints", () => blueprintRepository.listBlueprintFiles());
  ipcMain.handle("game:listAssetBundles", () => listExportFiles());
  ipcMain.handle("game:listScenes", () => sceneRepository.listSceneFiles());
  ipcMain.handle("game:exportAssetBundle", exportAssetBundle);
  ipcMain.handle("game:exportLogicGraph", exportLogicGraph);
  ipcMain.handle("game:exportSceneBundle", exportSceneBundle);
  ipcMain.handle("game:exportSpriteLibrary", exportSpriteLibrary);
  ipcMain.handle("game:importAssetBundle", importAssetBundle);
  ipcMain.handle("game:loadBlueprints", () => blueprintRepository.loadCatalog());
  ipcMain.handle("game:loadScene", (_event, name: string) => sceneRepository.loadScene(name));
  ipcMain.handle("game:repairAssetIntegrity", repairAssetIntegrity);
  ipcMain.handle("game:saveBlueprint", saveBlueprint);
  ipcMain.handle("game:saveScene", saveScene);
  ipcMain.handle("engine:createHeadlessSession", (_event, request) => ({
    sessionId: headlessRuntime.createSession(request),
  }));
  ipcMain.handle("engine:destroyEntity", (_event, sessionId: string, entityId: number) => {
    headlessRuntime.destroyEntity(sessionId, entityId);
  });
  ipcMain.handle("engine:disposeHeadlessSession", (_event, sessionId: string) => {
    headlessRuntime.disposeSession(sessionId);
  });
  ipcMain.handle("engine:getApiManifest", () => headlessRuntime.getApiManifest());
  ipcMain.handle("engine:getSessionEventLog", (_event, sessionId: string) =>
    headlessRuntime.getSessionEventLog(sessionId),
  );
  ipcMain.handle("engine:getSessionPermissions", () => headlessRuntime.getSessionPermissions());
  ipcMain.handle("engine:getSessionSyncState", (_event, sessionId: string) =>
    headlessRuntime.getSessionSyncState(sessionId),
  );
  ipcMain.handle("engine:listAssets", () => headlessRuntime.listAssets());
  ipcMain.handle("engine:listEntities", (_event, sessionId: string) =>
    headlessRuntime.listEntities(sessionId),
  );
  ipcMain.handle("engine:listSnapshots", (_event, sessionId: string) =>
    headlessRuntime.listSnapshots(sessionId),
  );
  ipcMain.handle("engine:modifyComponent", (_event, sessionId: string, patch) =>
    headlessRuntime.modifyComponent(sessionId, patch),
  );
  ipcMain.handle("engine:runHeadlessSimulation", runEngineHeadlessSimulation);
  ipcMain.handle("engine:restoreSnapshot", (_event, sessionId: string, snapshotIndex: number) =>
    headlessRuntime.restoreSnapshot(sessionId, snapshotIndex),
  );
  ipcMain.handle("engine:setLogicGraph", (_event, sessionId: string, patch) =>
    headlessRuntime.setLogicGraph(sessionId, patch),
  );
  ipcMain.handle("engine:snapshotWorld", (_event, sessionId: string) =>
    headlessRuntime.snapshotWorld(sessionId),
  );
  ipcMain.handle("engine:spawnEntity", (_event, sessionId: string, request) => ({
    entityId: headlessRuntime.spawnEntity(sessionId, request),
  }));
  ipcMain.handle("engine:stepHeadlessSession", (_event, sessionId: string, request) =>
    headlessRuntime.stepSession(sessionId, request),
  );

  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app, ipcMain } from "electron";
import { playerBlueprint, shrineBlueprint, villagerBlueprint } from "../shared/blueprints.js";
import { AssetIndex } from "./AssetIndex.js";
import { BlueprintRepository } from "./BlueprintRepository.js";
import { HeadlessRuntimeManager, runHeadlessSimulation } from "./HeadlessRuntime.js";
import { SceneRepository } from "./SceneRepository.js";
import { Logger } from "./LoggingSystem.js";
import { LogLevel } from "../shared/types/logging.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");
const defaultProjectRoot = workspaceRoot;
const isDev = !app.isPackaged;

// Initialize logging system
Logger.initialize({
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  logDirectory: "./logs"
}).catch(error => {
  console.error("Failed to initialize logging system in main process:", error);
});

Logger.info("MainProcess", "Electron main process starting");

const starterScene = {
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

function getProjectConfigPath() {
  return path.join(app.getPath("userData"), "project-config.json");
}

function getBlueprintsDirectory() {
  return path.join(activeProjectRoot, "assets", "blueprints");
}

function getScenesDirectory() {
  return path.join(activeProjectRoot, "assets", "scenes");
}

function getLogicDirectory() {
  return path.join(activeProjectRoot, "assets", "logic");
}

function getExportsDirectory() {
  return path.join(activeProjectRoot, "assets", "exports");
}

function setActiveProjectRoot(projectPath) {
  activeProjectRoot = path.resolve(projectPath);
  assetIndex = new AssetIndex(path.join(activeProjectRoot, "assets", "mapping.json"));
  blueprintRepository.setDirectoryPath(getBlueprintsDirectory());
  sceneRepository.setDirectoryPath(getScenesDirectory());
}

function getActiveProjectInfo() {
  return {
    name: path.basename(activeProjectRoot),
    path: activeProjectRoot,
  };
}

async function loadProjectConfig() {
  try {
    const parsed = JSON.parse(await readFile(getProjectConfigPath(), "utf8"));
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

async function saveProjectConfig() {
  await writeFile(
    getProjectConfigPath(),
    `${JSON.stringify({ activeProjectPath: activeProjectRoot }, null, 2)}\n`,
    "utf8",
  );
}

function getBunRuntime() {
  return globalThis.Bun;
}

async function ensureProjectStructure(projectPath) {
  await mkdir(path.join(projectPath, "assets", "blueprints"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "logic"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "scenes"), { recursive: true });
  await mkdir(path.join(projectPath, "assets", "exports"), { recursive: true });
}

async function ensureCurrentProjectDefaults() {
  await ensureProjectStructure(activeProjectRoot);
  await blueprintRepository.ensureBlueprints([playerBlueprint, shrineBlueprint, villagerBlueprint]);
  await sceneRepository.ensureScenes([starterScene]);
}

async function rebuildHeadlessRuntime() {
  const catalog = await blueprintRepository.loadCatalog();
  headlessRuntime = new HeadlessRuntimeManager({
    blueprints: new Map(catalog.blueprints.map((blueprint) => [blueprint.name, blueprint])),
  });
}

function toSafeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-");
}

async function ensureExportsDirectory() {
  await mkdir(getExportsDirectory(), { recursive: true });
}

async function writeExportFile(fileName, serialized) {
  const filePath = path.join(getExportsDirectory(), fileName);
  const bunRuntime = getBunRuntime();
  if (bunRuntime) {
    await bunRuntime.write(filePath, serialized);
  } else {
    await writeFile(filePath, serialized, "utf8");
  }
}

async function readExportFile(fileName) {
  const filePath = path.join(getExportsDirectory(), fileName);
  const bunRuntime = getBunRuntime();
  return bunRuntime ? bunRuntime.file(filePath).text() : readFile(filePath, "utf8");
}

async function listExportFiles() {
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

async function inspectAssetIntegrity() {
  await ensureProjectStructure(activeProjectRoot);
  await assetIndex.ensureReady();
  const index = await assetIndex.load();
  const bunRuntime = getBunRuntime();
  const scanJson = async (directory) => {
    if (bunRuntime) {
      return Array.from(new bunRuntime.Glob("*.json").scanSync({ cwd: directory })).sort();
    }
    return (await readdir(directory)).filter((fileName) => fileName.endsWith(".json")).sort();
  };
  const [blueprintFiles, logicFiles, sceneFiles] = await Promise.all([
    scanJson(getBlueprintsDirectory()),
    scanJson(getLogicDirectory()),
    scanJson(getScenesDirectory()),
  ]);
  const fileExists = async (filePath) => {
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
  const staleMappings = [];
  for (const entry of index.entries) {
    const directory =
      entry.kind === "blueprint"
        ? getBlueprintsDirectory()
        : entry.kind === "logic"
          ? getLogicDirectory()
          : getScenesDirectory();
    if (!(await fileExists(path.join(directory, entry.fileName)))) {
      staleMappings.push(`${entry.kind}:${entry.fileName}`);
    }
  }
  const catalog = await blueprintRepository.loadCatalog();
  const referencedLogic = new Set(
    catalog.blueprints
      .map((blueprint) => blueprint.logicGraphRef)
      .filter((value) => typeof value === "string" && value.length > 0)
      .map((value) => `${value}.json`),
  );
  return {
    orphanLogicFiles: logicFiles.filter((fileName) => !referencedLogic.has(fileName)),
    staleMappings,
    unknownBlueprintFiles: blueprintFiles.filter(
      (fileName) =>
        !assetIndex.listByKind(index, "blueprint").some((entry) => entry.fileName === fileName),
    ),
    unknownLogicFiles: logicFiles.filter(
      (fileName) =>
        !assetIndex.listByKind(index, "logic").some((entry) => entry.fileName === fileName),
    ),
    unknownSceneFiles: sceneFiles.filter(
      (fileName) =>
        !assetIndex.listByKind(index, "scene").some((entry) => entry.fileName === fileName),
    ),
  };
}

async function repairAssetIntegrity(_event, mode) {
  const report = await inspectAssetIntegrity();
  let nextIndex = await assetIndex.load();
  const bunRuntime = getBunRuntime();
  const readJson = async (filePath) =>
    JSON.parse(
      bunRuntime ? await bunRuntime.file(filePath).text() : await readFile(filePath, "utf8"),
    );
  const removeFile = async (filePath) => {
    try {
      await rm(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  };

  if (mode === "cleanup") {
    for (const fileName of report.unknownBlueprintFiles) {
      await removeFile(path.join(getBlueprintsDirectory(), fileName));
    }
    for (const fileName of report.unknownLogicFiles) {
      await removeFile(path.join(getLogicDirectory(), fileName));
    }
    for (const fileName of report.unknownSceneFiles) {
      await removeFile(path.join(getScenesDirectory(), fileName));
    }
    for (const fileName of report.orphanLogicFiles) {
      await removeFile(path.join(getLogicDirectory(), fileName));
      const entry = assetIndex
        .listByKind(nextIndex, "logic")
        .find((item) => item.fileName === fileName);
      if (entry) {
        nextIndex = assetIndex.remove(nextIndex, "logic", entry.id);
      }
    }
  } else {
    for (const fileName of report.unknownBlueprintFiles) {
      const parsed = await readJson(path.join(getBlueprintsDirectory(), fileName));
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
    for (const fileName of report.unknownLogicFiles) {
      const parsed = await readJson(path.join(getLogicDirectory(), fileName));
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
    for (const fileName of report.unknownSceneFiles) {
      const parsed = await readJson(path.join(getScenesDirectory(), fileName));
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

async function createProject(_event, name) {
  const safeName = toSafeName(name) || "untitled-project";
  const projectPath = path.join(workspaceRoot, "projects", safeName);
  await ensureProjectStructure(projectPath);
  setActiveProjectRoot(projectPath);
  await ensureCurrentProjectDefaults();
  await saveProjectConfig();
  return getActiveProjectInfo();
}

async function openProject(_event, projectPath) {
  const resolvedPath = path.resolve(projectPath);
  await ensureProjectStructure(resolvedPath);
  setActiveProjectRoot(resolvedPath);
  await ensureCurrentProjectDefaults();
  await saveProjectConfig();
  return getActiveProjectInfo();
}

function getActiveProject() {
  return getActiveProjectInfo();
}

async function saveBlueprint(_event, blueprint) {
  const saved = await blueprintRepository.saveBlueprint(blueprint);
  await rebuildHeadlessRuntime();
  return saved;
}

async function saveScene(_event, scene) {
  return sceneRepository.saveScene(scene);
}

function findBlueprintDependencies(targetName, blueprints, scenes) {
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

async function deleteBlueprint(_event, name, force = false) {
  const targetName = toSafeName(name);
  const catalog = await blueprintRepository.loadCatalog();
  const sceneFiles = await sceneRepository.listSceneFiles();
  const scenes = await Promise.all(
    sceneFiles.map(async (fileName) => {
      const scene = await sceneRepository.loadScene(fileName.replace(/\.json$/u, ""));
      return scene;
    }),
  );
  const dependencies = findBlueprintDependencies(targetName, catalog.blueprints, scenes);
  const hasDependencies =
    dependencies.referencedByBlueprints.length > 0 || dependencies.referencedByScenes.length > 0;
  if (hasDependencies && !force) {
    return { deleted: false, dependencies };
  }
  if (hasDependencies) {
    for (const blueprint of catalog.blueprints) {
      if (blueprint.name === targetName) continue;
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
        await sceneRepository.saveScene({ ...scene, placements: nextPlacements });
      }
    }
  }
  return {
    deleted: await blueprintRepository.deleteBlueprint(targetName),
    dependencies,
  };
}

async function exportAssetBundle(_event, bundleName, bundle) {
  await ensureExportsDirectory();
  const fileName = `${toSafeName(bundleName)}.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify({ ...bundle, exportedAt: new Date().toISOString(), kind: "engine-asset-bundle", schemaVersion: 1 }, null, 2)}\n`,
  );
  return fileName;
}

async function exportLogicGraph(_event, name, graph) {
  await ensureExportsDirectory();
  const fileName = `${toSafeName(name)}-logic.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify({ ...graph, exportedAt: new Date().toISOString(), kind: "logic-graph", schemaVersion: 1 }, null, 2)}\n`,
  );
  return fileName;
}

async function exportSpriteLibrary(_event, name, spriteLibrary) {
  await ensureExportsDirectory();
  const fileName = `${toSafeName(name)}-sprites.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify({ ...spriteLibrary, exportedAt: new Date().toISOString(), kind: "sprite-library", schemaVersion: 1 }, null, 2)}\n`,
  );
  return fileName;
}

async function exportSceneBundle(_event, name, sceneBundle) {
  await ensureExportsDirectory();
  const fileName = `${toSafeName(name)}-scene.json`;
  await writeExportFile(
    fileName,
    `${JSON.stringify({ ...sceneBundle, exportedAt: new Date().toISOString(), kind: "scene-bundle", schemaVersion: 1 }, null, 2)}\n`,
  );
  return fileName;
}

async function importAssetBundle(_event, bundleName) {
  await ensureExportsDirectory();
  const fileName = bundleName.endsWith(".json") ? bundleName : `${toSafeName(bundleName)}.json`;
  const parsed = JSON.parse(await readExportFile(fileName));
  if (parsed.kind !== "engine-asset-bundle" || parsed.schemaVersion !== 1) {
    throw new Error("Asset bundle format is invalid.");
  }
  return parsed;
}

async function runEngineHeadlessSimulation(_event, request) {
  const catalog = await blueprintRepository.loadCatalog();
  return runHeadlessSimulation(request, {
    blueprints: new Map(catalog.blueprints.map((blueprint) => [blueprint.name, blueprint])),
  });
}

async function createWindow() {
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
      webSecurity: false,
      allowRunningInsecureContent: true,
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
  ipcMain.handle("game:loadScene", (_event, name) => sceneRepository.loadScene(name));
  ipcMain.handle("game:repairAssetIntegrity", repairAssetIntegrity);
  ipcMain.handle("game:saveBlueprint", saveBlueprint);
  ipcMain.handle("game:saveScene", saveScene);
  ipcMain.handle("engine:createHeadlessSession", (_event, request) => ({
    sessionId: headlessRuntime.createSession(request),
  }));
  ipcMain.handle("engine:destroyEntity", (_event, sessionId, entityId) => {
    headlessRuntime.destroyEntity(sessionId, entityId);
  });
  ipcMain.handle("engine:disposeHeadlessSession", (_event, sessionId) => {
    headlessRuntime.disposeSession(sessionId);
  });
  ipcMain.handle("engine:getApiManifest", () => headlessRuntime.getApiManifest());
  ipcMain.handle("engine:getSessionEventLog", (_event, sessionId) =>
    headlessRuntime.getSessionEventLog(sessionId),
  );
  ipcMain.handle("engine:getSessionPermissions", () => headlessRuntime.getSessionPermissions());
  ipcMain.handle("engine:getSessionSyncState", (_event, sessionId) =>
    headlessRuntime.getSessionSyncState(sessionId),
  );
  ipcMain.handle("engine:listAssets", () => headlessRuntime.listAssets());
  ipcMain.handle("engine:listEntities", (_event, sessionId) =>
    headlessRuntime.listEntities(sessionId),
  );
  ipcMain.handle("engine:listSnapshots", (_event, sessionId) =>
    headlessRuntime.listSnapshots(sessionId),
  );
  ipcMain.handle("engine:modifyComponent", (_event, sessionId, patch) =>
    headlessRuntime.modifyComponent(sessionId, patch),
  );
  ipcMain.handle("engine:runHeadlessSimulation", runEngineHeadlessSimulation);
  ipcMain.handle("engine:restoreSnapshot", (_event, sessionId, snapshotIndex) =>
    headlessRuntime.restoreSnapshot(sessionId, snapshotIndex),
  );
  ipcMain.handle("engine:setLogicGraph", (_event, sessionId, patch) =>
    headlessRuntime.setLogicGraph(sessionId, patch),
  );
  ipcMain.handle("engine:snapshotWorld", (_event, sessionId) =>
    headlessRuntime.snapshotWorld(sessionId),
  );
  ipcMain.handle("engine:spawnEntity", (_event, sessionId, request) => ({
    entityId: headlessRuntime.spawnEntity(sessionId, request),
  }));
  ipcMain.handle("engine:stepHeadlessSession", (_event, sessionId, request) =>
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

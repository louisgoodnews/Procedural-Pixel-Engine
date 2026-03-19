import { contextBridge, ipcRenderer } from "electron";
import type { IGameAPI } from "../shared/api";

const api: IGameAPI = {
  createProject: (name) => ipcRenderer.invoke("project:create", name),
  deleteBlueprint: (name, force) => ipcRenderer.invoke("game:deleteBlueprint", name, force),
  engine: {
    createHeadlessSession: (request) => ipcRenderer.invoke("engine:createHeadlessSession", request),
    destroyEntity: (sessionId, entityId) =>
      ipcRenderer.invoke("engine:destroyEntity", sessionId, entityId),
    disposeHeadlessSession: (sessionId) =>
      ipcRenderer.invoke("engine:disposeHeadlessSession", sessionId),
    getApiManifest: () => ipcRenderer.invoke("engine:getApiManifest"),
    getSessionEventLog: (sessionId) => ipcRenderer.invoke("engine:getSessionEventLog", sessionId),
    getSessionPermissions: () => ipcRenderer.invoke("engine:getSessionPermissions"),
    getSessionSyncState: (sessionId) => ipcRenderer.invoke("engine:getSessionSyncState", sessionId),
    listAssets: () => ipcRenderer.invoke("engine:listAssets"),
    listEntities: (sessionId) => ipcRenderer.invoke("engine:listEntities", sessionId),
    listSnapshots: (sessionId) => ipcRenderer.invoke("engine:listSnapshots", sessionId),
    modifyComponent: (sessionId, patch) =>
      ipcRenderer.invoke("engine:modifyComponent", sessionId, patch),
    restoreSnapshot: (sessionId, snapshotIndex) =>
      ipcRenderer.invoke("engine:restoreSnapshot", sessionId, snapshotIndex),
    runHeadlessSimulation: (request) => ipcRenderer.invoke("engine:runHeadlessSimulation", request),
    setLogicGraph: (sessionId, patch) =>
      ipcRenderer.invoke("engine:setLogicGraph", sessionId, patch),
    snapshotWorld: (sessionId) => ipcRenderer.invoke("engine:snapshotWorld", sessionId),
    spawnEntity: (sessionId, request) =>
      ipcRenderer.invoke("engine:spawnEntity", sessionId, request),
    stepHeadlessSession: (sessionId, request) =>
      ipcRenderer.invoke("engine:stepHeadlessSession", sessionId, request),
  },
  exportAssetBundle: (bundleName, bundle) =>
    ipcRenderer.invoke("game:exportAssetBundle", bundleName, bundle),
  exportLogicGraph: (name, graph) => ipcRenderer.invoke("game:exportLogicGraph", name, graph),
  exportSceneBundle: (name, sceneBundle) =>
    ipcRenderer.invoke("game:exportSceneBundle", name, sceneBundle),
  exportSpriteLibrary: (name, spriteLibrary) =>
    ipcRenderer.invoke("game:exportSpriteLibrary", name, spriteLibrary),
  getActiveProject: () => ipcRenderer.invoke("project:getActive"),
  importAssetBundle: (bundleName) => ipcRenderer.invoke("game:importAssetBundle", bundleName),
  inspectAssetIntegrity: () => ipcRenderer.invoke("game:inspectAssetIntegrity"),
  listAssetBundles: () => ipcRenderer.invoke("game:listAssetBundles"),
  listBlueprints: () => ipcRenderer.invoke("game:listBlueprints"),
  listScenes: () => ipcRenderer.invoke("game:listScenes"),
  loadBlueprintCatalog: () => ipcRenderer.invoke("game:loadBlueprints"),
  loadScene: (name) => ipcRenderer.invoke("game:loadScene", name),
  openProject: (projectPath) => ipcRenderer.invoke("project:open", projectPath),
  repairAssetIntegrity: (mode) => ipcRenderer.invoke("game:repairAssetIntegrity", mode),
  requestExit: () => ipcRenderer.invoke("app:requestExit"),
  saveBlueprint: (blueprint) => ipcRenderer.invoke("game:saveBlueprint", blueprint),
  saveScene: (scene) => ipcRenderer.invoke("game:saveScene", scene),
};

contextBridge.exposeInMainWorld("api", api);

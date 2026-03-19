import type { EngineRuntimeApi } from "./api/engine-api";
import type {
  AssetBundle,
  AssetIntegrityReport,
  BlueprintCatalog,
  DeleteBlueprintResult,
  LogicGraphExport,
  PixelBlueprint,
  ProjectInfo,
  SceneExport,
  SpriteLibraryExport,
  WorldScene,
} from "./types";

export interface IGameAPI {
  createProject(name: string): Promise<ProjectInfo>;
  deleteBlueprint(name: string, force?: boolean): Promise<DeleteBlueprintResult>;
  engine: EngineRuntimeApi;
  exportAssetBundle(bundleName: string, bundle: AssetBundle): Promise<string>;
  exportLogicGraph(name: string, graph: LogicGraphExport): Promise<string>;
  exportSceneBundle(name: string, sceneBundle: SceneExport): Promise<string>;
  exportSpriteLibrary(name: string, spriteLibrary: SpriteLibraryExport): Promise<string>;
  importAssetBundle(bundleName: string): Promise<AssetBundle>;
  inspectAssetIntegrity(): Promise<AssetIntegrityReport>;
  getActiveProject(): Promise<ProjectInfo>;
  listAssetBundles(): Promise<string[]>;
  listBlueprints(): Promise<string[]>;
  listScenes(): Promise<string[]>;
  loadBlueprintCatalog(): Promise<BlueprintCatalog>;
  loadScene(name: string): Promise<WorldScene>;
  openProject(projectPath: string): Promise<ProjectInfo>;
  repairAssetIntegrity(mode: "cleanup" | "reindex"): Promise<AssetIntegrityReport>;
  requestExit(): Promise<void>;
  saveBlueprint(blueprint: PixelBlueprint): Promise<PixelBlueprint>;
  saveScene(scene: WorldScene): Promise<WorldScene>;
}

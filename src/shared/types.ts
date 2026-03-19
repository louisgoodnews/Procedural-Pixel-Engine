export interface Entity {
  id: number;
}

export interface PositionComponent {
  x: number;
  y: number;
}

export interface VelocityComponent {
  x: number;
  y: number;
}

export interface ColliderComponent {
  height?: number;
  isTrigger?: boolean;
  layer: string;
  mask: string[];
  offsetX?: number;
  offsetY?: number;
  radius?: number;
  shape: "circle" | "rect";
  width?: number;
}

export interface PhysicsBodyComponent {
  bodyType: "dynamic" | "kinematic" | "static";
  constraintToViewport?: boolean;
  friction?: number;
  gravityScale?: number;
  restitution?: number;
}

export interface PixelArtComponent {
  assignedComponents?: string[];
  assignedGlobalSystems?: string[];
  childBlueprints?: BlueprintChildReference[];
  componentTree?: Record<string, unknown>;
  matrix: string[][];
  colorMap: Record<string, string>;
  flipX?: boolean;
  flipY?: boolean;
  importSources?: string[];
  pixelSize: number;
  spriteFrames?: string[][][];
  zonePalettePreset?: string;
}

export type BlueprintType = string;

export interface BlueprintChildReference {
  blueprintName: string;
  flipX?: boolean;
  flipY?: boolean;
  offsetX: number;
  offsetY: number;
}

export type LogicNodeKind = "action" | "condition" | "trigger";

export interface LogicNodePosition {
  x: number;
  y: number;
}

export interface LogicNodeData {
  [key: string]: boolean | number | string | null | undefined;
}

export interface LogicNode {
  id: string;
  kind: LogicNodeKind;
  type: string;
  position: LogicNodePosition;
  data?: LogicNodeData;
}

export interface LogicConnectionEndpoint {
  nodeId: string;
  port: string;
}

export interface LogicConnection {
  id: string;
  from: LogicConnectionEndpoint;
  to: LogicConnectionEndpoint;
}

export interface LogicGraph {
  version: 1;
  nodes: LogicNode[];
  connections: LogicConnection[];
}

export interface LogicGraphAsset {
  graph: LogicGraph;
  id: string;
  name: string;
  schemaVersion: 1;
  updatedAt: string;
}

export type BlueprintCategory = "Component" | "System" | "Template";

export interface PixelBlueprint extends PixelArtComponent {
  blueprintCategory?: BlueprintCategory;
  blueprintType?: BlueprintType;
  id?: string;
  logicGraph?: LogicGraph;
  logicGraphRef?: string;
  name: string;
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  zone: string;
}

export type InputAction =
  | "move_left"
  | "move_right"
  | "move_up"
  | "move_down"
  | "confirm"
  | "cancel";

export interface BlueprintValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BlueprintLoadIssue {
  fileName: string;
  message: string;
}

export interface AssetBundle {
  blueprint: PixelBlueprint;
  componentTemplates: string[];
  exportedAt: string;
  kind: "engine-asset-bundle";
  schemaVersion: 1;
}

export interface LogicGraphExport {
  exportedAt: string;
  graph: LogicGraph;
  kind: "logic-graph";
  name: string;
  schemaVersion: 1;
}

export interface SpriteLibraryExport {
  colorMap: Record<string, string>;
  exportedAt: string;
  kind: "sprite-library";
  name: string;
  pixelSize: number;
  schemaVersion: 1;
  spriteFrames: string[][][];
}

export interface SceneExport {
  exportedAt: string;
  kind: "scene-bundle";
  name: string;
  scene: WorldScene;
  schemaVersion: 1;
}

export interface BlueprintCatalog {
  blueprints: PixelBlueprint[];
  issues: BlueprintLoadIssue[];
}

export interface BlueprintDependencyReport {
  referencedByBlueprints: string[];
  referencedByScenes: string[];
}

export interface DeleteBlueprintResult {
  deleted: boolean;
  dependencies: BlueprintDependencyReport;
}

export interface WorldPlacement {
  blueprintName: string;
  components?: string[];
  id: string;
  layer: number;
  x: number;
  y: number;
}

export interface WorldScene {
  cellSize?: number;
  height?: number;
  id?: string;
  name: string;
  schemaVersion: 1;
  updatedAt: string;
  width?: number;
  zone: string;
  placements: WorldPlacement[];
}

export interface AssetMappingEntry {
  fileName: string;
  id: string;
  kind: "blueprint" | "logic" | "scene";
  name: string;
  updatedAt: string;
}

export interface AssetMappingFile {
  entries: AssetMappingEntry[];
  schemaVersion: 1;
  updatedAt: string;
}

export interface AssetIntegrityReport {
  orphanLogicFiles: string[];
  staleMappings: string[];
  unknownBlueprintFiles: string[];
  unknownLogicFiles: string[];
  unknownSceneFiles: string[];
}

export interface ProjectInfo {
  name: string;
  path: string;
}

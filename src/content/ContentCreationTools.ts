/**
 * Content Creation Tools Expansion System
 * Provides comprehensive content creation tools for tile maps, materials, and animations
 */

// Tile map editor types
export enum TileMapOrientation {
  ORTHOGONAL = 'orthogonal',
  ISOMETRIC = 'isometric',
  STAGGERED = 'staggered',
  HEXAGONAL = 'hexagonal'
}

export enum TileLayerType {
  TILE = 'tile',
  OBJECT = 'object',
  IMAGE = 'image',
  GROUP = 'group'
}

export interface TileMapConfiguration {
  orientation: TileMapOrientation;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  infinite: boolean;
  renderOrder: 'right-down' | 'right-up' | 'left-down' | 'left-up';
  staggerAxis?: 'x' | 'y';
  staggerIndex?: 'odd' | 'even';
  hexSideLength?: number;
  backgroundColor: string;
  compressionLevel: number;
}

export interface TileSet {
  name: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  tileWidth: number;
  tileHeight: number;
  margin: number;
  spacing: number;
  tileCount: number;
  columns: number;
  tileProperties: Record<number, TileProperty>;
  tileTerrain: Record<number, number[]>;
  tiles: Record<number, TileData>;
}

export interface TileProperty {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool';
  value: any;
}

export interface TileData {
  animation?: TileAnimation[];
  objectGroup?: ObjectGroup;
  image?: string;
  probability?: number;
  terrain?: number[];
}

export interface TileAnimation {
  duration: number;
  tileId: number;
}

export interface ObjectGroup {
  color: string;
  drawOrder: 'index' | 'topdown';
  name: string;
  objects: MapObject[];
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
}

export interface MapObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties: Record<string, any>;
  gid?: number;
  text?: TextObject;
  ellipse?: boolean;
  point?: boolean;
  polygon?: Polygon;
  polyline?: Polyline;
}

export interface TextObject {
  text: string;
  fontFamily: string;
  fontSize: number;
  wrap: boolean;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeout: boolean;
  kerning: boolean;
  halign: 'left' | 'center' | 'right';
  valign: 'top' | 'center' | 'bottom';
}

export interface Polygon {
  points: number[][];
}

export interface Polyline {
  points: number[][];
}

export interface TileLayer {
  id: number;
  name: string;
  type: TileLayerType;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[][];
  properties: Record<string, any>;
  encoding: 'csv' | 'base64' | 'gzip';
  compression: 'none' | 'gzip' | 'zlib';
  chunks?: Chunk[];
  objects?: MapObject[];
  image?: string;
  drawOrder?: number;
}

export interface Chunk {
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[][];
}

// Auto-tiling system
export interface AutoTilingRule {
  name: string;
  pattern: number[][];
  tileId: number;
  priority: number;
  conditions: TilingCondition[];
}

export interface TilingCondition {
  type: 'neighbor' | 'corner' | 'edge' | 'terrain';
  position: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  value: any;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains';
}

export interface AutoTilingConfiguration {
  enabled: boolean;
  rules: AutoTilingRule[];
  updateMode: 'manual' | 'automatic' | 'on_change';
  performanceOptimization: boolean;
  previewMode: boolean;
}

// Terrain tools
export interface TerrainConfiguration {
  heightMap: HeightMap;
  textureLayers: TextureLayer[];
  paintingTools: PaintingTool[];
  terrainTypes: TerrainType[];
  brushSettings: BrushSettings;
}

export interface HeightMap {
  width: number;
  height: number;
  data: number[][];
  scale: number;
  resolution: number;
}

export interface TextureLayer {
  name: string;
  texture: string;
  blendMode: BlendMode;
  opacity: number;
  scale: number;
  offset: { x: number; y: number };
  rotation: number;
  tiling: boolean;
}

export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  SOFT_LIGHT = 'soft_light',
  HARD_LIGHT = 'hard_light',
  COLOR_DODGE = 'color_dodge',
  COLOR_BURN = 'color_burn',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion'
}

export interface PaintingTool {
  name: string;
  type: 'brush' | 'eraser' | 'fill' | 'smooth' | 'noise' | 'raise' | 'lower';
  size: number;
  strength: number;
  falloff: FalloffType;
  texture?: string;
  customSettings: Record<string, any>;
}

export enum FalloffType {
  LINEAR = 'linear',
  SMOOTH = 'smooth',
  SPHERE = 'sphere',
  TUBE = 'tube'
}

export interface TerrainType {
  name: string;
  texture: string;
  height: number;
  slope: number;
  color: string;
  properties: Record<string, any>;
}

export interface BrushSettings {
  size: number;
  strength: number;
  falloff: FalloffType;
  hardness: number;
  spacing: number;
  scatter: number;
  rotation: number;
  opacity: number;
}

// Material editor
export interface MaterialConfiguration {
  nodes: MaterialNode[];
  connections: NodeConnection[];
  preview: PreviewSettings;
  export: ExportSettings;
  templates: MaterialTemplate[];
}

export interface MaterialNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: Record<string, any>;
  enabled: boolean;
}

export enum NodeType {
  INPUT = 'input',
  OUTPUT = 'output',
  MATH = 'math',
  TEXTURE = 'texture',
  COLOR = 'color',
  VECTOR = 'vector',
  NOISE = 'noise',
  GRADIENT = 'gradient',
  BLEND = 'blend',
  TRANSFORM = 'transform',
  CONDITIONAL = 'conditional',
  CUSTOM = 'custom'
}

export interface NodeInput {
  name: string;
  type: DataType;
  value?: any;
  connected?: boolean;
  connectionId?: string;
}

export interface NodeOutput {
  name: string;
  type: DataType;
  value?: any;
}

export enum DataType {
  FLOAT = 'float',
  VECTOR2 = 'vector2',
  VECTOR3 = 'vector3',
  VECTOR4 = 'vector4',
  COLOR = 'color',
  TEXTURE = 'texture',
  BOOLEAN = 'boolean'
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

export interface PreviewSettings {
  enabled: boolean;
  model: string;
  lighting: boolean;
  environment: string;
  resolution: number;
  realtime: boolean;
}

export interface ExportSettings {
  format: 'glsl' | 'hlsl' | 'metal' | 'webgl';
  optimization: boolean;
  compression: boolean;
  includeComments: boolean;
}

export interface MaterialTemplate {
  name: string;
  description: string;
  category: string;
  nodes: MaterialNode[];
  connections: NodeConnection[];
  parameters: Record<string, any>;
}

// Texture painting
export interface TexturePaintingConfiguration {
  layers: PaintLayer[];
  brushes: PaintBrush[];
  tools: PaintTool[];
  canvas: PaintCanvas;
  settings: PaintSettings;
}

export interface PaintLayer {
  id: string;
  name: string;
  texture: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  locked: boolean;
  mask?: string;
}

export interface PaintBrush {
  name: string;
  texture: string;
  size: number;
  hardness: number;
  spacing: number;
  scatter: number;
  rotation: number;
  opacity: number;
  flow: number;
  smoothing: boolean;
  pressure: boolean;
}

export interface PaintTool {
  name: string;
  type: 'brush' | 'eraser' | 'smudge' | 'blur' | 'sharpen' | 'clone' | 'heal';
  brush: PaintBrush;
  settings: Record<string, any>;
}

export interface PaintCanvas {
  width: number;
  height: number;
  resolution: number;
  format: 'rgba' | 'rgb' | 'grayscale';
  backgroundColor: string;
}

export interface PaintSettings {
  undoLevels: number;
  autoSave: boolean;
  autoSaveInterval: number;
  pressureSensitivity: boolean;
  tabletSupport: boolean;
  gpuAcceleration: boolean;
}

// Procedural texture generation
export interface ProceduralTextureConfiguration {
  generators: TextureGenerator[];
  parameters: GeneratorParameters;
  output: OutputSettings;
  preview: PreviewSettings;
}

export interface TextureGenerator {
  name: string;
  type: GeneratorType;
  enabled: boolean;
  parameters: Record<string, any>;
  inputs: GeneratorInput[];
  outputs: GeneratorOutput[];
}

export enum GeneratorType {
  NOISE = 'noise',
  FRACTAL = 'fractal',
  GRADIENT = 'gradient',
  PATTERN = 'pattern',
  CELLULAR = 'cellular',
  VORONOI = 'voronoi',
  PERLIN = 'perlin',
  SIMPLEX = 'simplex',
  WORLEY = 'worley',
  RIDGED = 'ridged',
  TURBULENCE = 'turbulence'
}

export interface GeneratorInput {
  name: string;
  type: DataType;
  value?: any;
  connected?: boolean;
}

export interface GeneratorOutput {
  name: string;
  type: DataType;
}

export interface GeneratorParameters {
  resolution: number;
  seed: number;
  frequency: number;
  amplitude: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
}

export interface OutputSettings {
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'exr' | 'hdr';
  quality: number;
  compression: boolean;
}

// Animation timeline
export interface AnimationTimelineConfiguration {
  timeline: Timeline;
  tracks: AnimationTrack[];
  keyframes: Keyframe[];
  playback: PlaybackSettings;
  export: AnimationExportSettings;
}

export interface Timeline {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  timeScale: number;
  playbackRate: number;
  loop: boolean;
  pingPong: boolean;
}

export interface AnimationTrack {
  id: string;
  name: string;
  type: TrackType;
  target: string;
  property: string;
  keyframes: Keyframe[];
  enabled: boolean;
  muted: boolean;
  color: string;
}

export enum TrackType {
  POSITION = 'position',
  ROTATION = 'rotation',
  SCALE = 'scale',
  COLOR = 'color',
  OPACITY = 'opacity',
  PROPERTY = 'property',
  EVENT = 'event'
}

export interface Keyframe {
  id: string;
  time: number;
  value: any;
  interpolation: InterpolationType;
  easeIn: number;
  easeOut: number;
  tangentIn: { x: number; y: number };
  tangentOut: { x: number; y: number };
  locked: boolean;
  selected: boolean;
}

export enum InterpolationType {
  LINEAR = 'linear',
  STEP = 'step',
  CUBIC = 'cubic',
  BEZIER = 'bezier',
  HERMITE = 'hermite',
  CATMULL_ROM = 'catmull_rom',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out'
}

export interface PlaybackSettings {
  playOnStart: boolean;
  autoReverse: boolean;
  frameRate: number;
  skipFrames: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface AnimationExportSettings {
  format: 'gif' | 'mp4' | 'webm' | 'apng' | 'sprite_sheet';
  quality: number;
  frameRate: number;
  loop: boolean;
  optimize: boolean;
}

// Main content creation tools system
export class ContentCreationToolsSystem {
  private tileMapConfig: TileMapConfiguration;
  private autoTilingConfig: AutoTilingConfiguration;
  private terrainConfig: TerrainConfiguration;
  private materialConfig: MaterialConfiguration;
  private texturePaintingConfig: TexturePaintingConfiguration;
  private proceduralTextureConfig: ProceduralTextureConfiguration;
  private animationTimelineConfig: AnimationTimelineConfiguration;

  constructor() {
    this.tileMapConfig = this.createDefaultTileMapConfig();
    this.autoTilingConfig = this.createDefaultAutoTilingConfig();
    this.terrainConfig = this.createDefaultTerrainConfig();
    this.materialConfig = this.createDefaultMaterialConfig();
    this.texturePaintingConfig = this.createDefaultTexturePaintingConfig();
    this.proceduralTextureConfig = this.createDefaultProceduralTextureConfig();
    this.animationTimelineConfig = this.createDefaultAnimationTimelineConfig();
  }

  /**
   * Create default tile map configuration
   */
  private createDefaultTileMapConfig(): TileMapConfiguration {
    return {
      orientation: TileMapOrientation.ORTHOGONAL,
      width: 100,
      height: 100,
      tileWidth: 32,
      tileHeight: 32,
      infinite: false,
      renderOrder: 'right-down',
      backgroundColor: '#000000',
      compressionLevel: 6
    };
  }

  /**
   * Create default auto-tiling configuration
   */
  private createDefaultAutoTilingConfig(): AutoTilingConfiguration {
    return {
      enabled: true,
      rules: [],
      updateMode: 'automatic',
      performanceOptimization: true,
      previewMode: true
    };
  }

  /**
   * Create default terrain configuration
   */
  private createDefaultTerrainConfig(): TerrainConfiguration {
    return {
      heightMap: {
        width: 512,
        height: 512,
        data: [],
        scale: 1.0,
        resolution: 1.0
      },
      textureLayers: [],
      paintingTools: [
        {
          name: 'Raise',
          type: 'raise',
          size: 50,
          strength: 0.5,
          falloff: FalloffType.SMOOTH,
          customSettings: {}
        },
        {
          name: 'Lower',
          type: 'lower',
          size: 50,
          strength: 0.5,
          falloff: FalloffType.SMOOTH,
          customSettings: {}
        },
        {
          name: 'Smooth',
          type: 'smooth',
          size: 30,
          strength: 0.3,
          falloff: FalloffType.SPHERE,
          customSettings: {}
        }
      ],
      terrainTypes: [],
      brushSettings: {
        size: 50,
        strength: 0.5,
        falloff: FalloffType.SMOOTH,
        hardness: 0.5,
        spacing: 0.1,
        scatter: 0,
        rotation: 0,
        opacity: 1.0
      }
    };
  }

  /**
   * Create default material configuration
   */
  private createDefaultMaterialConfig(): MaterialConfiguration {
    return {
      nodes: [],
      connections: [],
      preview: {
        enabled: true,
        model: 'sphere',
        lighting: true,
        environment: 'studio',
        resolution: 512,
        realtime: true
      },
      export: {
        format: 'glsl',
        optimization: true,
        compression: false,
        includeComments: true
      },
      templates: []
    };
  }

  /**
   * Create default texture painting configuration
   */
  private createDefaultTexturePaintingConfig(): TexturePaintingConfiguration {
    return {
      layers: [],
      brushes: [
        {
          name: 'Round',
          texture: '',
          size: 50,
          hardness: 0.8,
          spacing: 0.1,
          scatter: 0,
          rotation: 0,
          opacity: 1.0,
          flow: 1.0,
          smoothing: true,
          pressure: true
        }
      ],
      tools: [
        {
          name: 'Brush',
          type: 'brush',
          brush: {
            name: 'Round',
            texture: '',
            size: 50,
            hardness: 0.8,
            spacing: 0.1,
            scatter: 0,
            rotation: 0,
            opacity: 1.0,
            flow: 1.0,
            smoothing: true,
            pressure: true
          },
          settings: {}
        }
      ],
      canvas: {
        width: 1024,
        height: 1024,
        resolution: 1.0,
        format: 'rgba',
        backgroundColor: '#ffffff'
      },
      settings: {
        undoLevels: 50,
        autoSave: true,
        autoSaveInterval: 300,
        pressureSensitivity: true,
        tabletSupport: true,
        gpuAcceleration: true
      }
    };
  }

  /**
   * Create default procedural texture configuration
   */
  private createDefaultProceduralTextureConfig(): ProceduralTextureConfiguration {
    return {
      generators: [
        {
          name: 'Perlin Noise',
          type: GeneratorType.PERLIN,
          enabled: true,
          parameters: {
            frequency: 0.01,
            amplitude: 1.0,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0
          },
          inputs: [],
          outputs: [
            { name: 'output', type: DataType.FLOAT }
          ]
        }
      ],
      parameters: {
        resolution: 512,
        seed: 12345,
        frequency: 0.01,
        amplitude: 1.0,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0
      },
      output: {
        width: 512,
        height: 512,
        format: 'png',
        quality: 90,
        compression: true
      },
      preview: {
        enabled: true,
        model: 'plane',
        lighting: false,
        environment: 'neutral',
        resolution: 256,
        realtime: true
      }
    };
  }

  /**
   * Create default animation timeline configuration
   */
  private createDefaultAnimationTimelineConfig(): AnimationTimelineConfiguration {
    return {
      timeline: {
        duration: 10.0,
        currentTime: 0.0,
        startTime: 0.0,
        endTime: 10.0,
        timeScale: 1.0,
        playbackRate: 1.0,
        loop: true,
        pingPong: false
      },
      tracks: [],
      keyframes: [],
      playback: {
        playOnStart: false,
        autoReverse: false,
        frameRate: 30,
        skipFrames: false,
        quality: 'high'
      },
      export: {
        format: 'gif',
        quality: 80,
        frameRate: 30,
        loop: true,
        optimize: true
      }
    };
  }

  /**
   * Initialize content creation tools
   */
  async initialize(): Promise<void> {
    try {
      // Initialize tile map editor
      await this.initializeTileMapEditor();
      
      // Initialize terrain tools
      await this.initializeTerrainTools();
      
      // Initialize material editor
      await this.initializeMaterialEditor();
      
      // Initialize texture painting
      await this.initializeTexturePainting();
      
      // Initialize procedural texture generation
      await this.initializeProceduralTextureGeneration();
      
      // Initialize animation timeline
      await this.initializeAnimationTimeline();
      
      console.log('Content creation tools initialized successfully');
    } catch (error) {
      console.error('Failed to initialize content creation tools:', error);
      throw error;
    }
  }

  /**
   * Initialize tile map editor
   */
  private async initializeTileMapEditor(): Promise<void> {
    // Implementation for tile map editor initialization
  }

  /**
   * Initialize terrain tools
   */
  private async initializeTerrainTools(): Promise<void> {
    // Implementation for terrain tools initialization
  }

  /**
   * Initialize material editor
   */
  private async initializeMaterialEditor(): Promise<void> {
    // Implementation for material editor initialization
  }

  /**
   * Initialize texture painting
   */
  private async initializeTexturePainting(): Promise<void> {
    // Implementation for texture painting initialization
  }

  /**
   * Initialize procedural texture generation
   */
  private async initializeProceduralTextureGeneration(): Promise<void> {
    // Implementation for procedural texture generation initialization
  }

  /**
   * Initialize animation timeline
   */
  private async initializeAnimationTimeline(): Promise<void> {
    // Implementation for animation timeline initialization
  }

  /**
   * Create tile map
   */
  createTileMap(config: Partial<TileMapConfiguration>): TileMapConfiguration {
    return { ...this.tileMapConfig, ...config };
  }

  /**
   * Add tile set
   */
  addTileSet(tileSet: TileSet): void {
    // Implementation for adding tile set
  }

  /**
   * Add tile layer
   */
  addTileLayer(layer: TileLayer): void {
    // Implementation for adding tile layer
  }

  /**
   * Apply auto-tiling rules
   */
  applyAutoTilingRules(rules: AutoTilingRule[]): void {
    this.autoTilingConfig.rules = rules;
  }

  /**
   * Create terrain height map
   */
  createTerrainHeightMap(width: number, height: number): HeightMap {
    return {
      width,
      height,
      data: Array(height).fill(null).map(() => Array(width).fill(0)),
      scale: 1.0,
      resolution: 1.0
    };
  }

  /**
   * Add texture layer
   */
  addTextureLayer(layer: TextureLayer): void {
    this.terrainConfig.textureLayers.push(layer);
  }

  /**
   * Create material node
   */
  createMaterialNode(type: NodeType, position: { x: number; y: number }): MaterialNode {
    return {
      id: this.generateId(),
      type,
      name: type.toString(),
      position,
      inputs: [],
      outputs: [],
      parameters: {},
      enabled: true
    };
  }

  /**
   * Connect material nodes
   */
  connectMaterialNodes(sourceNodeId: string, sourceOutputId: string, targetNodeId: string, targetInputId: string): void {
    const connection: NodeConnection = {
      id: this.generateId(),
      sourceNodeId,
      sourceOutputId,
      targetNodeId,
      targetInputId
    };
    this.materialConfig.connections.push(connection);
  }

  /**
   * Create paint layer
   */
  createPaintLayer(name: string, texture: string): PaintLayer {
    return {
      id: this.generateId(),
      name,
      texture,
      visible: true,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
      locked: false
    };
  }

  /**
   * Create procedural texture generator
   */
  createProceduralGenerator(type: GeneratorType): TextureGenerator {
    return {
      name: type.toString(),
      type,
      enabled: true,
      parameters: {},
      inputs: [],
      outputs: [
        { name: 'output', type: DataType.FLOAT }
      ]
    };
  }

  /**
   * Create animation track
   */
  createAnimationTrack(type: TrackType, target: string, property: string): AnimationTrack {
    return {
      id: this.generateId(),
      name: `${target}_${property}`,
      type,
      target,
      property,
      keyframes: [],
      enabled: true,
      muted: false,
      color: '#ffffff'
    };
  }

  /**
   * Add keyframe to track
   */
  addKeyframe(trackId: string, time: number, value: any, interpolation: InterpolationType = InterpolationType.LINEAR): Keyframe {
    const keyframe: Keyframe = {
      id: this.generateId(),
      time,
      value,
      interpolation,
      easeIn: 0,
      easeOut: 0,
      tangentIn: { x: 0, y: 0 },
      tangentOut: { x: 0, y: 0 },
      locked: false,
      selected: false
    };
    
    const track = this.animationTimelineConfig.tracks.find(t => t.id === trackId);
    if (track) {
      track.keyframes.push(keyframe);
      track.keyframes.sort((a, b) => a.time - b.time);
    }
    
    return keyframe;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get tile map configuration
   */
  getTileMapConfiguration(): TileMapConfiguration {
    return this.tileMapConfig;
  }

  /**
   * Get terrain configuration
   */
  getTerrainConfiguration(): TerrainConfiguration {
    return this.terrainConfig;
  }

  /**
   * Get material configuration
   */
  getMaterialConfiguration(): MaterialConfiguration {
    return this.materialConfig;
  }

  /**
   * Get texture painting configuration
   */
  getTexturePaintingConfiguration(): TexturePaintingConfiguration {
    return this.texturePaintingConfig;
  }

  /**
   * Get procedural texture configuration
   */
  getProceduralTextureConfiguration(): ProceduralTextureConfiguration {
    return this.proceduralTextureConfig;
  }

  /**
   * Get animation timeline configuration
   */
  getAnimationTimelineConfiguration(): AnimationTimelineConfiguration {
    return this.animationTimelineConfig;
  }

  /**
   * Export material shader
   */
  exportMaterialShader(format: 'glsl' | 'hlsl' | 'metal' | 'webgl'): string {
    // Implementation for shader export
    return '';
  }

  /**
   * Generate procedural texture
   */
  async generateProceduralTexture(): Promise<ImageData> {
    // Implementation for procedural texture generation
    return new ImageData(512, 512);
  }

  /**
   * Export animation
   */
  async exportAnimation(format: string): Promise<Blob> {
    // Implementation for animation export
    return new Blob();
  }
}

// Factory function
export function createContentCreationToolsSystem(): ContentCreationToolsSystem {
  return new ContentCreationToolsSystem();
}

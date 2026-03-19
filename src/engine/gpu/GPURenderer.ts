/**
 * Integrated GPU rendering system that replaces Canvas 2D calls
 * Provides high-performance GPU-accelerated rendering for sprites, particles, and geometry
 */

import { webglContextManager, WebGLContextInfo, WebGLContextManager } from './WebGLContext';
import { ShaderPipeline } from './ShaderPipeline';
import { GPUResourceManager } from './GPUResourceManager';
import { GPUBatchRenderer, BatchVertex } from './GPUBatchRenderer';
import type { System, World } from '../World';
import type { EngineComponents, EngineResources } from '../types';

export interface GPURendererConfig {
  enableBatching: boolean;
  enableInstancing: boolean;
  enableFrustumCulling: boolean;
  enableLOD: boolean;
  maxTextureSize: number;
  enableMipmapping: boolean;
  enableAntialiasing: boolean;
  enableDepthTesting: boolean;
  backgroundColor: string;
  performanceMode: boolean;
}

export interface GPURenderStats {
  frameTime: number;
  drawCalls: number;
  renderedSprites: number;
  renderedParticles: number;
  culledObjects: number;
  textureSwitches: number;
  shaderSwitches: number;
  gpuMemoryUsage: number;
  fps: number;
}

export interface SpriteRenderData {
  x: number;
  y: number;
  width: number;
  height: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  color: [number, number, number, number];
  rotation: number;
  scale: number;
}

export interface ParticleRenderData {
  x: number;
  y: number;
  size: number;
  color: [number, number, number, number];
  life: number;
  velocity: [number, number];
}

export class GPURenderer {
  private config: GPURendererConfig;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private contextInfo: WebGLContextInfo | null = null;
  
  // GPU systems
  private shaderPipeline: ShaderPipeline | null = null;
  private resourceManager: GPUResourceManager | null = null;
  private batchRenderer: GPUBatchRenderer | null = null;
  
  // Rendering state
  private projectionMatrix = new Float32Array(16);
  private viewMatrix = new Float32Array(16);
  private backgroundColor = [0.0, 0.0, 0.0, 1.0];
  private stats: GPURenderStats;
  
  // Batches
  private spriteBatchId: string | null = null;
  private particleBatchId: string | null = null;
  private coloredBatchId: string | null = null;
  
  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsUpdateTime = 0;

  constructor(config: Partial<GPURendererConfig> = {}) {
    this.config = {
      enableBatching: true,
      enableInstancing: true,
      enableFrustumCulling: true,
      enableLOD: true,
      maxTextureSize: 2048,
      enableMipmapping: true,
      enableAntialiasing: true,
      enableDepthTesting: false,
      backgroundColor: '#000000',
      performanceMode: false,
      ...config,
    };

    this.stats = {
      frameTime: 0,
      drawCalls: 0,
      renderedSprites: 0,
      renderedParticles: 0,
      culledObjects: 0,
      textureSwitches: 0,
      shaderSwitches: 0,
      gpuMemoryUsage: 0,
      fps: 60,
    };

    this.initializeMatrices();
  }

  /**
   * Initialize WebGL context and GPU systems
   */
  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    
    // Create WebGL context
    this.contextInfo = webglContextManager.createContext(canvas, {
      alpha: false,
      depth: this.config.enableDepthTesting,
      stencil: false,
      antialias: this.config.enableAntialiasing,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    if (!this.contextInfo) {
      console.error('Failed to create WebGL context');
      return false;
    }

    this.gl = this.contextInfo.context;

    // Initialize GPU systems
    this.shaderPipeline = new ShaderPipeline(this.gl);
    this.resourceManager = new GPUResourceManager(this.gl);
    this.batchRenderer = new GPUBatchRenderer(this.gl, this.shaderPipeline, this.resourceManager);

    // Parse background color
    this.backgroundColor = this.parseColor(this.config.backgroundColor);

    // Create default batches
    this.createDefaultBatches();

    console.log(`GPU Renderer initialized with WebGL ${this.contextInfo.version}`);
    console.log('GPU Capabilities:', this.contextInfo.capabilities);

    return true;
  }

  /**
   * Initialize projection and view matrices
   */
  private initializeMatrices(): void {
    // Orthographic projection matrix
    this.projectionMatrix = new Float32Array([
      2, 0, 0, 0,
      0, -2, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1,
    ]);

    // Identity view matrix
    this.viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  /**
   * Create default rendering batches
   */
  private createDefaultBatches(): void {
    if (!this.batchRenderer) return;

    this.spriteBatchId = this.batchRenderer.createBatch('sprite', undefined, {
      blendMode: 'alpha',
      depthTest: false,
      depthWrite: false,
    });

    this.particleBatchId = this.batchRenderer.createBatch('particle', undefined, {
      blendMode: 'add',
      depthTest: false,
      depthWrite: false,
    });

    this.coloredBatchId = this.batchRenderer.createBatch('colored', undefined, {
      blendMode: 'alpha',
      depthTest: false,
      depthWrite: false,
    });
  }

  /**
   * Parse color string to RGBA array
   */
  private parseColor(color: string): [number, number, number, number] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [0, 0, 0, 1];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    
    return [data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255];
  }

  /**
   * Main system execution
   */
  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.gl || !this.batchRenderer) return;

    const startTime = performance.now();

    // Get canvas from viewport resource
    const viewport = world.getResource('viewport');
    const camera = world.getResource('camera');
    const renderStats = world.getResource('renderStats');
    const canvas = world.getResource('canvas');

    if (!viewport || !camera || !canvas) return;

    // Initialize WebGL context if not already done
    if (!this.contextInfo) {
      this.initialize(canvas);
    }

    // Update projection matrix based on viewport
    this.updateProjectionMatrix(viewport.width, viewport.height);

    // Update view matrix based on camera
    this.updateViewMatrix(camera.x, camera.y);

    // Clear screen
    this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | (this.config.enableDepthTesting ? this.gl.DEPTH_BUFFER_BIT : 0));

    // Reset stats
    this.resetFrameStats();

    // Render entities
    this.renderEntities(world);

    // Render particles
    this.renderParticles(world);

    // Render UI elements
    this.renderUI(world);

    // Execute batch rendering
    this.batchRenderer.setProjectionMatrix(Array.from(this.projectionMatrix));
    this.batchRenderer.setViewMatrix(Array.from(this.viewMatrix));
    this.batchRenderer.render();

    // Update performance stats
    this.updatePerformanceStats(startTime);

    // Update world resources
    if (renderStats) {
      renderStats.drawCalls = this.stats.drawCalls;
      (renderStats as any).frameTime = this.stats.frameTime;
      (renderStats as any).fps = this.stats.fps;
    }

    (world as any).setResource('gpuRenderStats', this.stats);
  }

  /**
   * Update projection matrix
   */
  private updateProjectionMatrix(width: number, height: number): void {
    // Orthographic projection
    this.projectionMatrix[0] = 2 / width;
    this.projectionMatrix[5] = -2 / height;
    this.projectionMatrix[12] = -1;
    this.projectionMatrix[13] = 1;
  }

  /**
   * Update view matrix
   */
  private updateViewMatrix(cameraX: number, cameraY: number): void {
    this.viewMatrix[12] = -cameraX;
    this.viewMatrix[13] = -cameraY;
  }

  /**
   * Render entities
   */
  private renderEntities(world: World<EngineComponents, EngineResources>): void {
    const entities = world.getEntitiesWith('position', 'pixelArt', 'renderLayer');
    
    // Sort by render layer
    const sortedEntities = Array.from(entities).sort((a: any, b: any) => {
      const layerA = world.getComponent(a, 'renderLayer')?.order ?? 0;
      const layerB = world.getComponent(b, 'renderLayer')?.order ?? 0;
      return layerA - layerB;
    });

    for (const entity of sortedEntities) {
      this.renderEntity(world, entity);
    }
  }

  /**
   * Render a single entity
   */
  private renderEntity(world: World<EngineComponents, EngineResources>, entity: { id: number }): void {
    const position = world.getComponent(entity, 'position');
    const pixelArt = world.getComponent(entity, 'pixelArt');

    if (!position || !pixelArt || !this.batchRenderer || !this.spriteBatchId) return;

    // Check if entity is visible (simple frustum culling)
    if (this.config.enableFrustumCulling && !this.isEntityVisible(position, pixelArt)) {
      this.stats.culledObjects++;
      return;
    }

    // Create sprite vertices
    const vertices = this.createSpriteVertices(position, pixelArt);
    
    // Add to batch
    if (this.batchRenderer.addVertices(this.spriteBatchId, vertices)) {
      this.stats.renderedSprites++;
    }
  }

  /**
   * Check if entity is visible
   */
  private isEntityVisible(position: any, pixelArt: any): boolean {
    // Simplified visibility check
    // In practice, you'd implement proper frustum culling
    return true;
  }

  /**
   * Create sprite vertices
   */
  private createSpriteVertices(position: any, pixelArt: any): BatchVertex[] {
    const x = position.x;
    const y = position.y;
    const width = pixelArt.width || 32;
    const height = pixelArt.height || 32;

    // Calculate UV coordinates
    const u0 = 0;
    const v0 = 0;
    const u1 = 1;
    const v1 = 1;

    // Get color
    const color = this.parseColor(pixelArt.color || '#ffffff');

    // Create quad vertices (two triangles)
    return [
      // First triangle
      { x, y, u: u0, v: v0, r: color[0], g: color[1], b: color[2], a: color[3] },
      { x: x + width, y, u: u1, v: v0, r: color[0], g: color[1], b: color[2], a: color[3] },
      { x, y: y + height, u: u0, v: v1, r: color[0], g: color[1], b: color[2], a: color[3] },
      // Second triangle
      { x: x + width, y, u: u1, v: v0, r: color[0], g: color[1], b: color[2], a: color[3] },
      { x: x + width, y: y + height, u: u1, v: v1, r: color[0], g: color[1], b: color[2], a: color[3] },
      { x, y: y + height, u: u0, v: v1, r: color[0], g: color[1], b: color[2], a: color[3] },
    ];
  }

  /**
   * Render particles
   */
  private renderParticles(world: World<EngineComponents, EngineResources>): void {
    const particleRuntime = world.getResource('particleRuntime');
    
    if (!particleRuntime || !this.batchRenderer || !this.particleBatchId) return;

    for (const particle of particleRuntime.allParticles) {
      if (particle.life <= 0) continue;

      // Create particle vertices
      const vertices = this.createParticleVertices(particle);
      
      // Add to batch
      if (this.batchRenderer.addVertices(this.particleBatchId, vertices)) {
        this.stats.renderedParticles++;
      }
    }
  }

  /**
   * Create particle vertices
   */
  private createParticleVertices(particle: any): BatchVertex[] {
    const x = particle.position.x;
    const y = particle.position.y;
    const size = particle.size || 4;
    const color = this.parseColor(particle.color || '#ffffff');

    // Create point sprite vertices (single triangle)
    return [
      { x, y, u: 0, v: 0, r: color[0], g: color[1], b: color[2], a: color[3] * particle.life },
    ];
  }

  /**
   * Render UI elements
   */
  private renderUI(world: World<EngineComponents, EngineResources>): void {
    // UI rendering would be implemented here
    // For now, this is a placeholder for future UI rendering
  }

  /**
   * Reset frame statistics
   */
  private resetFrameStats(): void {
    this.stats.drawCalls = 0;
    this.stats.renderedSprites = 0;
    this.stats.renderedParticles = 0;
    this.stats.culledObjects = 0;
    this.stats.textureSwitches = 0;
    this.stats.shaderSwitches = 0;
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(startTime: number): void {
    const now = performance.now();
    this.stats.frameTime = now - startTime;

    // Update FPS
    this.frameCount++;
    if (now - this.fpsUpdateTime > 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    // Get GPU memory usage
    if (this.resourceManager) {
      const resourceStats = this.resourceManager.getStats();
      this.stats.gpuMemoryUsage = resourceStats.totalMemoryUsage;
    }
  }

  /**
   * Create texture from pixel art data
   */
  createTexture(pixelArt: any): string | null {
    if (!this.resourceManager) return null;

    const width = pixelArt.width || 32;
    const height = pixelArt.height || 32;

    // Create texture data from pixel art matrix
    const textureData = this.createTextureData(pixelArt);

    return this.resourceManager.createTexture(
      width,
      height,
      this.gl!.RGBA,
      this.gl!.UNSIGNED_BYTE,
      {
        data: textureData,
        minFilter: this.config.enableMipmapping ? this.gl!.LINEAR_MIPMAP_LINEAR : this.gl!.LINEAR,
        magFilter: this.gl!.LINEAR,
        wrapS: this.gl!.CLAMP_TO_EDGE,
        wrapT: this.gl!.CLAMP_TO_EDGE,
        generateMipmaps: this.config.enableMipmapping,
      }
    );
  }

  /**
   * Create texture data from pixel art matrix
   */
  private createTextureData(pixelArt: any): Uint8Array {
    const width = pixelArt.width || 32;
    const height = pixelArt.height || 32;
    const matrix = pixelArt.matrix || [];
    const colorMap = pixelArt.colorMap || { '#': [255, 255, 255, 255] };

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = matrix[y]?.[x];
        const color = colorMap[key] || [0, 0, 0, 0];
        
        const index = (y * width + x) * 4;
        data[index] = color[0];     // R
        data[index + 1] = color[1]; // G
        data[index + 2] = color[2]; // B
        data[index + 3] = color[3]; // A
      }
    }

    return data;
  }

  /**
   * Get rendering statistics
   */
  getStats(): GPURenderStats {
    return { ...this.stats };
  }

  /**
   * Get WebGL context info
   */
  getContextInfo(): WebGLContextInfo | null {
    return this.contextInfo;
  }

  /**
   * Check if GPU rendering is available
   */
  static isAvailable(): boolean {
    const systemCapabilities = WebGLContextManager.getSystemCapabilities();
    return systemCapabilities.webgl2 || systemCapabilities.webgl1;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GPURendererConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update background color
    this.backgroundColor = this.parseColor(this.config.backgroundColor);

    // Update batch renderer config
    if (this.batchRenderer) {
      this.batchRenderer.updateConfig({
        enableInstancing: this.config.enableInstancing,
        enableFrustumCulling: this.config.enableFrustumCulling,
        enableLOD: this.config.enableLOD,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): GPURendererConfig {
    return { ...this.config };
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    if (!this.gl) return;

    this.gl.viewport(0, 0, width, height);
    this.updateProjectionMatrix(width, height);
  }

  /**
   * Destroy the GPU renderer
   */
  destroy(): void {
    if (this.batchRenderer) {
      this.batchRenderer.destroy();
    }
    
    if (this.resourceManager) {
      this.resourceManager.destroy();
    }
    
    if (this.shaderPipeline) {
      this.shaderPipeline.destroy();
    }

    if (this.contextInfo && this.canvas) {
      webglContextManager.disposeContext(this.canvas);
    }

    this.gl = null;
    this.contextInfo = null;
    this.canvas = null;
  }
}

// Global GPU renderer instance
export const globalGPURenderer = new GPURenderer();

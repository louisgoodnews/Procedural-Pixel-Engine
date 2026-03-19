/**
 * GPU batch rendering system with instanced drawing support
 * Provides high-performance batched rendering for sprites, particles, and other geometry
 */

import { ShaderPipeline, BUILTIN_SHADERS } from './ShaderPipeline';
import { GPUResourceManager } from './GPUResourceManager';

export interface BatchVertex {
  x: number;
  y: number;
  u: number;
  v: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface InstanceData {
  modelMatrix: number[]; // 16 elements (mat4)
  color: number[]; // 4 elements (vec4)
  textureIndex: number;
  lodLevel: number;
}

export interface RenderBatch {
  id: string;
  shaderId: string;
  textureId?: string;
  vertices: BatchVertex[];
  indices: number[];
  instances?: InstanceData[];
  vertexBufferId?: string;
  indexBufferId?: string;
  instanceBufferId?: string;
  dirty: boolean;
  visible: boolean;
  blendMode: 'none' | 'alpha' | 'add' | 'multiply';
  depthTest: boolean;
  depthWrite: boolean;
}

export interface GPUBatchRendererConfig {
  maxVerticesPerBatch: number;
  maxIndicesPerBatch: number;
  maxInstancesPerBatch: number;
  enableInstancing: boolean;
  enableDynamicBatching: boolean;
  batchMergeThreshold: number;
  enableFrustumCulling: boolean;
  enableLOD: boolean;
}

export interface GPUBatchRendererStats {
  totalBatches: number;
  activeBatches: number;
  totalVertices: number;
  totalIndices: number;
  totalInstances: number;
  drawCalls: number;
  culledBatches: number;
  mergedBatches: number;
  renderTime: number;
  gpuMemoryUsage: number;
}

export class GPUBatchRenderer {
  private gl: WebGLRenderingContext;
  private shaderPipeline: ShaderPipeline;
  private resourceManager: GPUResourceManager;
  private config: GPUBatchRendererConfig;
  private batches = new Map<string, RenderBatch>();
  private stats: GPUBatchRendererStats;
  private projectionMatrix = new Float32Array(16);
  private viewMatrix = new Float32Array(16);

  constructor(
    gl: WebGLRenderingContext,
    shaderPipeline: ShaderPipeline,
    resourceManager: GPUResourceManager,
    config: Partial<GPUBatchRendererConfig> = {}
  ) {
    this.gl = gl;
    this.shaderPipeline = shaderPipeline;
    this.resourceManager = resourceManager;
    this.config = {
      maxVerticesPerBatch: 65536,
      maxIndicesPerBatch: 65536,
      maxInstancesPerBatch: 10000,
      enableInstancing: true,
      enableDynamicBatching: true,
      batchMergeThreshold: 100,
      enableFrustumCulling: true,
      enableLOD: true,
      ...config,
    };

    this.stats = {
      totalBatches: 0,
      activeBatches: 0,
      totalVertices: 0,
      totalIndices: 0,
      totalInstances: 0,
      drawCalls: 0,
      culledBatches: 0,
      mergedBatches: 0,
      renderTime: 0,
      gpuMemoryUsage: 0,
    };

    this.initializeMatrices();
    this.createBuiltinShaders();
  }

  /**
   * Initialize projection and view matrices
   */
  private initializeMatrices(): void {
    // Identity matrix
    this.projectionMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);

    this.viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  /**
   * Create built-in shader programs
   */
  private createBuiltinShaders(): void {
    this.shaderPipeline.createProgram('sprite', BUILTIN_SHADERS.sprite);
    this.shaderPipeline.createProgram('colored', BUILTIN_SHADERS.colored);
    this.shaderPipeline.createProgram('particle', BUILTIN_SHADERS.particle);
  }

  /**
   * Set projection matrix
   */
  setProjectionMatrix(matrix: number[]): void {
    this.projectionMatrix = new Float32Array(matrix);
  }

  /**
   * Set view matrix
   */
  setViewMatrix(matrix: number[]): void {
    this.viewMatrix = new Float32Array(matrix);
  }

  /**
   * Create a new render batch
   */
  createBatch(
    shaderId: string,
    textureId?: string,
    options: {
      blendMode?: RenderBatch['blendMode'];
      depthTest?: boolean;
      depthWrite?: boolean;
    } = {}
  ): string {
    const id = this.generateBatchId();
    
    const batch: RenderBatch = {
      id,
      shaderId,
      textureId,
      vertices: [],
      indices: [],
      instances: [],
      dirty: true,
      visible: true,
      blendMode: options.blendMode || 'alpha',
      depthTest: options.depthTest || false,
      depthWrite: options.depthWrite || false,
    };

    this.batches.set(id, batch);
    this.stats.totalBatches++;
    this.stats.activeBatches++;

    return id;
  }

  /**
   * Add vertices to a batch
   */
  addVertices(batchId: string, vertices: BatchVertex[], indices?: number[]): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    // Check batch size limits
    if (batch.vertices.length + vertices.length > this.config.maxVerticesPerBatch) {
      return false;
    }

    if (indices && batch.indices.length + indices.length > this.config.maxIndicesPerBatch) {
      return false;
    }

    // Add vertices and indices
    batch.vertices.push(...vertices);
    if (indices) {
      const offset = batch.vertices.length - vertices.length;
      const offsetIndices = indices.map(i => i + offset);
      batch.indices.push(...offsetIndices);
    }

    batch.dirty = true;
    return true;
  }

  /**
   * Add instances to a batch (for instanced rendering)
   */
  addInstances(batchId: string, instances: InstanceData[]): boolean {
    if (!this.config.enableInstancing) {
      return false;
    }

    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    if (batch.instances!.length + instances.length > this.config.maxInstancesPerBatch) {
      return false;
    }

    if (!batch.instances) {
      batch.instances = [];
    }

    batch.instances.push(...instances);
    batch.dirty = true;
    return true;
  }

  /**
   * Update batch GPU buffers
   */
  private updateBatchBuffers(batch: RenderBatch): void {
    if (!batch.dirty) {
      return;
    }

    // Create or update vertex buffer
    if (!batch.vertexBufferId) {
      batch.vertexBufferId = this.resourceManager.createBuffer('array', this.gl.DYNAMIC_DRAW);
    }

    const vertexData = new Float32Array(batch.vertices.length * 9); // 9 components per vertex
    let offset = 0;
    for (const vertex of batch.vertices) {
      vertexData[offset++] = vertex.x;
      vertexData[offset++] = vertex.y;
      vertexData[offset++] = vertex.u;
      vertexData[offset++] = vertex.v;
      vertexData[offset++] = vertex.r;
      vertexData[offset++] = vertex.g;
      vertexData[offset++] = vertex.b;
      vertexData[offset++] = vertex.a;
    }

    this.resourceManager.updateBuffer(batch.vertexBufferId, vertexData);

    // Create or update index buffer
    if (batch.indices.length > 0) {
      if (!batch.indexBufferId) {
        batch.indexBufferId = this.resourceManager.createBuffer('element', this.gl.DYNAMIC_DRAW);
      }

      const indexData = new Uint16Array(batch.indices);
      this.resourceManager.updateBuffer(batch.indexBufferId, indexData);
    }

    // Create or update instance buffer
    if (this.config.enableInstancing && batch.instances && batch.instances.length > 0) {
      if (!batch.instanceBufferId) {
        batch.instanceBufferId = this.resourceManager.createBuffer('array', this.gl.DYNAMIC_DRAW);
      }

      const instanceData = new Float32Array(batch.instances.length * 21); // 21 components per instance (16 + 4 + 1 + 1)
      offset = 0;
      for (const instance of batch.instances) {
        instanceData.set(instance.modelMatrix, offset);
        offset += 16;
        instanceData.set(instance.color, offset);
        offset += 4;
        instanceData[offset++] = instance.textureIndex;
        instanceData[offset++] = instance.lodLevel;
      }

      this.resourceManager.updateBuffer(batch.instanceBufferId, instanceData);
    }

    batch.dirty = false;
  }

  /**
   * Render a batch
   */
  private renderBatch(batch: RenderBatch): void {
    if (!batch.visible || batch.vertices.length === 0) {
      return;
    }

    // Update GPU buffers if needed
    this.updateBatchBuffers(batch);

    // Use shader program
    if (!this.shaderPipeline.useProgram(batch.shaderId)) {
      return;
    }

    // Set blend mode
    this.setBlendMode(batch.blendMode);

    // Set depth testing
    if (batch.depthTest) {
      this.gl.enable(this.gl.DEPTH_TEST);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }

    // Set depth write
    this.gl.depthMask(batch.depthWrite);

    // Set common uniforms
    this.shaderPipeline.setUniform('u_projection', this.projectionMatrix);
    this.shaderPipeline.setUniform('u_view', this.viewMatrix);
    this.shaderPipeline.setUniform('u_model', this.viewMatrix); // Default model matrix

    // Bind texture if available
    if (batch.textureId) {
      const texture = this.resourceManager.getTexture(batch.textureId);
      if (texture) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.shaderPipeline.setUniform('u_texture', 0);
      }
    }

    // Bind vertex buffer
    const vertexBuffer = this.resourceManager.getBuffer(batch.vertexBufferId!);
    if (vertexBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);

      // Set vertex attributes
      this.shaderPipeline.enableAttribute('a_position');
      this.shaderPipeline.setAttributePointer('a_position', 2, this.gl.FLOAT, false, 36, 0);

      this.shaderPipeline.enableAttribute('a_texCoord');
      this.shaderPipeline.setAttributePointer('a_texCoord', 2, this.gl.FLOAT, false, 36, 8);

      this.shaderPipeline.enableAttribute('a_color');
      this.shaderPipeline.setAttributePointer('a_color', 4, this.gl.FLOAT, false, 36, 16);
    }

    // Render with or without instancing
    if (this.config.enableInstancing && batch.instances && batch.instances.length > 0) {
      this.renderBatchInstanced(batch);
    } else {
      this.renderBatchStandard(batch);
    }

    this.stats.drawCalls++;
  }

  /**
   * Render batch with standard drawing
   */
  private renderBatchStandard(batch: RenderBatch): void {
    // Bind index buffer if available
    if (batch.indexBufferId && batch.indices.length > 0) {
      const indexBuffer = this.resourceManager.getBuffer(batch.indexBufferId);
      if (indexBuffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, batch.indices.length, this.gl.UNSIGNED_SHORT, 0);
      }
    } else {
      // Draw without indices
      this.gl.drawArrays(this.gl.TRIANGLES, 0, batch.vertices.length);
    }
  }

  /**
   * Render batch with instanced drawing
   */
  private renderBatchInstanced(batch: RenderBatch): void {
    // This would require WebGL 2.0 or ANGLE_instanced_arrays extension
    // For now, fall back to standard rendering
    this.renderBatchStandard(batch);
  }

  /**
   * Set blend mode
   */
  private setBlendMode(mode: RenderBatch['blendMode']): void {
    switch (mode) {
      case 'none':
        this.gl.disable(this.gl.BLEND);
        break;
      case 'alpha':
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        break;
      case 'add':
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        break;
      case 'multiply':
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
        break;
    }
  }

  /**
   * Render all visible batches
   */
  render(): void {
    const startTime = performance.now();

    this.stats.drawCalls = 0;
    this.stats.culledBatches = 0;

    for (const batch of this.batches.values()) {
      if (this.config.enableFrustumCulling && this.isBatchCulled(batch)) {
        this.stats.culledBatches++;
        continue;
      }

      this.renderBatch(batch);
    }

    this.stats.renderTime = performance.now() - startTime;
    this.updateStats();
  }

  /**
   * Check if batch is culled (simplified frustum culling)
   */
  private isBatchCulled(batch: RenderBatch): boolean {
    // Simplified culling - in practice you'd implement proper frustum culling
    return !batch.visible;
  }

  /**
   * Merge compatible batches
   */
  mergeBatches(): number {
    if (!this.config.enableDynamicBatching) {
      return 0;
    }

    let mergedCount = 0;
    const batchesByShader = new Map<string, RenderBatch[]>();

    // Group batches by shader and texture
    for (const batch of this.batches.values()) {
      if (!batch.visible || batch.dirty) continue;

      const key = `${batch.shaderId}_${batch.textureId || 'none'}_${batch.blendMode}`;
      if (!batchesByShader.has(key)) {
        batchesByShader.set(key, []);
      }
      batchesByShader.get(key)!.push(batch);
    }

    // Merge small batches
    for (const [key, batches] of batchesByShader) {
      if (batches.length <= 1) continue;

      // Sort by size (merge smaller batches first)
      batches.sort((a, b) => a.vertices.length - b.vertices.length);

      for (let i = 0; i < batches.length - 1; i++) {
        const targetBatch = batches[i]!;
        const sourceBatch = batches[i + 1]!;

        // Check if merge is possible
        if (targetBatch.vertices.length + sourceBatch.vertices.length <= this.config.batchMergeThreshold) {
          // Merge source into target
          const vertexOffset = targetBatch.vertices.length;
          targetBatch.vertices.push(...sourceBatch.vertices);

          // Offset indices
          const offsetIndices = sourceBatch.indices.map(i => i + vertexOffset);
          targetBatch.indices.push(...offsetIndices);

          // Remove source batch
          this.deleteBatch(sourceBatch.id);
          mergedCount++;
          this.stats.mergedBatches++;
        }
      }
    }

    return mergedCount;
  }

  /**
   * Clear a batch
   */
  clearBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    batch.vertices = [];
    batch.indices = [];
    if (batch.instances) {
      batch.instances = [];
    }
    batch.dirty = true;

    return true;
  }

  /**
   * Delete a batch
   */
  deleteBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    // Clean up GPU resources
    if (batch.vertexBufferId) {
      this.resourceManager.deleteBuffer(batch.vertexBufferId);
    }
    if (batch.indexBufferId) {
      this.resourceManager.deleteBuffer(batch.indexBufferId);
    }
    if (batch.instanceBufferId) {
      this.resourceManager.deleteBuffer(batch.instanceBufferId);
    }

    this.batches.delete(batchId);
    this.stats.activeBatches--;

    return true;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): RenderBatch | null {
    return this.batches.get(batchId) || null;
  }

  /**
   * Get all batches
   */
  getAllBatches(): RenderBatch[] {
    return Array.from(this.batches.values());
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.activeBatches = this.batches.size;
    this.stats.totalVertices = Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.vertices.length, 0);
    this.stats.totalIndices = Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.indices.length, 0);
    this.stats.totalInstances = Array.from(this.batches.values()).reduce((sum, batch) => sum + (batch.instances?.length || 0), 0);

    // Get GPU memory usage from resource manager
    const resourceStats = this.resourceManager.getStats();
    this.stats.gpuMemoryUsage = resourceStats.totalMemoryUsage;
  }

  /**
   * Get rendering statistics
   */
  getStats(): GPUBatchRendererStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GPUBatchRendererConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): GPUBatchRendererConfig {
    return { ...this.config };
  }

  /**
   * Destroy the batch renderer
   */
  destroy(): void {
    // Delete all batches
    for (const batchId of this.batches.keys()) {
      this.deleteBatch(batchId);
    }

    this.batches.clear();
  }
}

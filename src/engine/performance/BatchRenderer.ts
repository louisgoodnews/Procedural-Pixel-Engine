/**
 * Batch rendering system for improved rendering performance
 * Groups similar render operations to reduce draw calls and state changes
 */

export interface RenderBatch {
  id: string;
  type: 'sprite' | 'particle' | 'text' | 'shape';
  layer: number;
  material: string; // Material/shader identifier
  vertices: Float32Array;
  indices: Uint16Array;
  transform: Float32Array;
  color: Float32Array;
  texture?: string;
  visible: boolean;
  dirty: boolean;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxVerticesPerBatch: number;
  maxIndicesPerBatch: number;
  enableInstancing: boolean;
  enableFrustumCulling: boolean;
  enableDepthSorting: boolean;
  enableMaterialBatching: boolean;
}

export interface BatchStats {
  totalBatches: number;
  activeBatches: number;
  totalVertices: number;
  totalIndices: number;
  drawCalls: number;
  culledBatches: number;
  batchTime: number;
  renderTime: number;
}

export interface RenderCommand {
  type: 'draw' | 'clear' | 'setTransform' | 'setBlendMode';
  data: any;
  layer: number;
  material: string;
}

export class BatchRenderer {
  private config: BatchConfig;
  private batches = new Map<string, RenderBatch>();
  private renderQueue: RenderCommand[] = [];
  private stats: BatchStats;
  private vertexBuffer: Float32Array;
  private indexBuffer: Uint16Array;
  private currentBatchId = 0;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 1000,
      maxVerticesPerBatch: 65536, // 64K vertices
      maxIndicesPerBatch: 65536, // 64K indices
      enableInstancing: true,
      enableFrustumCulling: true,
      enableDepthSorting: true,
      enableMaterialBatching: true,
      ...config,
    };

    this.stats = {
      totalBatches: 0,
      activeBatches: 0,
      totalVertices: 0,
      totalIndices: 0,
      drawCalls: 0,
      culledBatches: 0,
      batchTime: 0,
      renderTime: 0,
    };

    // Pre-allocate buffers
    this.vertexBuffer = new Float32Array(this.config.maxVerticesPerBatch * 8); // 8 components per vertex
    this.indexBuffer = new Uint16Array(this.config.maxIndicesPerBatch);
  }

  /**
   * Create a new render batch
   */
  createBatch(
    type: RenderBatch['type'],
    layer: number,
    material: string,
    texture?: string
  ): string {
    const batchId = `batch_${this.currentBatchId++}`;
    
    const batch: RenderBatch = {
      id: batchId,
      type,
      layer,
      material,
      vertices: new Float32Array(0),
      indices: new Uint16Array(0),
      transform: new Float32Array([1, 0, 0, 1, 0, 0]), // Identity matrix
      color: new Float32Array([1, 1, 1, 1]),
      texture,
      visible: true,
      dirty: true,
    };

    this.batches.set(batchId, batch);
    this.stats.totalBatches++;
    this.stats.activeBatches++;

    return batchId;
  }

  /**
   * Add vertices to a batch
   */
  addVertices(
    batchId: string,
    vertices: number[],
    indices?: number[]
  ): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    // Check if batch would exceed size limits
    const newVertexCount = batch.vertices.length + vertices.length;
    const newIndexCount = batch.indices.length + (indices?.length || 0);

    if (newVertexCount > this.config.maxVerticesPerBatch ||
        newIndexCount > this.config.maxIndicesPerBatch) {
      // Split into new batch if too large
      return this.splitAndAddVertices(batch, vertices, indices);
    }

    // Add vertices
    const newVertices = new Float32Array(batch.vertices.length + vertices.length);
    newVertices.set(batch.vertices);
    newVertices.set(vertices, batch.vertices.length);
    batch.vertices = newVertices;

    // Add indices if provided
    if (indices) {
      const newIndices = new Uint16Array(batch.indices.length + indices.length);
      newIndices.set(batch.indices);
      
      // Offset indices based on current vertex count
      const vertexOffset = batch.vertices.length / 8; // 8 components per vertex
      const offsetIndices = indices.map(i => i + vertexOffset);
      newIndices.set(offsetIndices, batch.indices.length);
      
      batch.indices = newIndices;
    }

    batch.dirty = true;
    this.updateStats();
    return true;
  }

  /**
   * Split vertices into multiple batches if they exceed size limits
   */
  private splitAndAddVertices(
    batch: RenderBatch,
    vertices: number[],
    indices?: number[]
  ): boolean {
    const maxVertices = this.config.maxVerticesPerBatch;
    const verticesPerChunk = maxVertices - batch.vertices.length;

    if (vertices.length <= verticesPerChunk) {
      // Can fit in current batch
      return this.addVertices(batch.id, vertices, indices);
    }

    // Split into multiple chunks
    let vertexOffset = 0;
    let indexOffset = 0;
    let firstChunk = true;

    while (vertexOffset < vertices.length) {
      const chunkVertices = vertices.slice(vertexOffset, vertexOffset + verticesPerChunk);
      const chunkVertexCount = chunkVertices.length / 8; // 8 components per vertex
      
      let chunkIndices: number[] = [];
      if (indices) {
        const indicesInChunk = indices.filter(i => {
          const vertexIndex = i * 8; // Convert index to vertex position
          return vertexIndex >= vertexOffset && vertexIndex < vertexOffset + chunkVertices.length;
        });
        chunkIndices = indicesInChunk.map(i => i - (vertexOffset / 8));
      }

      if (firstChunk) {
        // Add to existing batch
        this.addVertices(batch.id, chunkVertices, chunkIndices);
        firstChunk = false;
      } else {
        // Create new batch
        const newBatchId = this.createBatch(batch.type, batch.layer, batch.material, batch.texture);
        this.addVertices(newBatchId, chunkVertices, chunkIndices);
      }

      vertexOffset += verticesPerChunk;
      indexOffset += chunkIndices.length;
    }

    return true;
  }

  /**
   * Update batch transform matrix
   */
  setBatchTransform(batchId: string, transform: number[]): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    batch.transform = new Float32Array(transform);
    batch.dirty = true;
    return true;
  }

  /**
   * Update batch color
   */
  setBatchColor(batchId: string, color: number[]): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    batch.color = new Float32Array(color);
    batch.dirty = true;
    return true;
  }

  /**
   * Set batch visibility
   */
  setBatchVisibility(batchId: string, visible: boolean): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    batch.visible = visible;
    return true;
  }

  /**
   * Remove a batch
   */
  removeBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return false;
    }

    this.batches.delete(batchId);
    this.stats.activeBatches--;
    this.updateStats();
    return true;
  }

  /**
   * Clear all batches
   */
  clear(): void {
    this.batches.clear();
    this.renderQueue.length = 0;
    this.stats.activeBatches = 0;
    this.updateStats();
  }

  /**
   * Optimize batches by merging compatible ones
   */
  optimizeBatches(): void {
    const batchGroups = new Map<string, RenderBatch[]>();

    // Group batches by type, layer, and material
    for (const batch of this.batches.values()) {
      if (!batch.visible) continue;

      const key = `${batch.type}_${batch.layer}_${batch.material}_${batch.texture || ''}`;
      if (!batchGroups.has(key)) {
        batchGroups.set(key, []);
      }
      batchGroups.get(key)!.push(batch);
    }

    // Merge small batches within each group
    for (const [key, batches] of batchGroups) {
      if (batches.length <= 1) continue;

      // Sort by size (merge smaller batches first)
      batches.sort((a, b) => a.vertices.length - b.vertices.length);

      let mergedCount = 0;
      for (let i = 0; i < batches.length - 1; i++) {
        const targetBatch = batches[i]!;
        const sourceBatch = batches[i + 1]!;

        // Check if merge is possible
        const totalVertices = targetBatch.vertices.length + sourceBatch.vertices.length;
        const totalIndices = targetBatch.indices.length + sourceBatch.indices.length;

        if (totalVertices <= this.config.maxVerticesPerBatch &&
            totalIndices <= this.config.maxIndicesPerBatch) {
          
          // Merge source into target
          const sourceVertices = Array.from(sourceBatch.vertices);
          const sourceIndices = Array.from(sourceBatch.indices);
          
          // Offset source indices
          const vertexOffset = targetBatch.vertices.length / 8;
          const offsetIndices = sourceIndices.map(i => i + vertexOffset);
          
          this.addVertices(targetBatch.id, sourceVertices, offsetIndices);
          this.removeBatch(sourceBatch.id);
          
          mergedCount++;
        }
      }
    }
  }

  /**
   * Generate render commands from batches
   */
  generateRenderCommands(): RenderCommand[] {
    this.renderQueue.length = 0;
    const startTime = performance.now();

    // Sort batches by layer and material for optimal rendering
    const sortedBatches = Array.from(this.batches.values())
      .filter(batch => batch.visible && batch.vertices.length > 0)
      .sort((a, b) => {
        if (a.layer !== b.layer) {
          return a.layer - b.layer;
        }
        if (a.material !== b.material) {
          return a.material.localeCompare(b.material);
        }
        return 0;
      });

    // Generate render commands
    let lastMaterial = '';
    let lastLayer = -1;

    for (const batch of sortedBatches) {
      // Material change command
      if (batch.material !== lastMaterial) {
        this.renderQueue.push({
          type: 'setBlendMode',
          data: { material: batch.material },
          layer: batch.layer,
          material: batch.material,
        });
        lastMaterial = batch.material;
      }

      // Transform command
      this.renderQueue.push({
        type: 'setTransform',
        data: { transform: Array.from(batch.transform) },
        layer: batch.layer,
        material: batch.material,
      });

      // Draw command
      this.renderQueue.push({
        type: 'draw',
        data: {
          vertices: batch.vertices,
          indices: batch.indices,
          color: Array.from(batch.color),
          texture: batch.texture,
        },
        layer: batch.layer,
        material: batch.material,
      });
    }

    this.stats.renderTime = performance.now() - startTime;
    return [...this.renderQueue];
  }

  /**
   * Execute render commands on a canvas context
   */
  executeRenderCommands(context: CanvasRenderingContext2D): void {
    const startTime = performance.now();
    this.stats.drawCalls = 0;

    for (const command of this.renderQueue) {
      switch (command.type) {
        case 'clear':
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          break;

        case 'setTransform':
          const transform = command.data.transform;
          context.setTransform(transform[0], transform[1], transform[2], transform[3], transform[4], transform[5]);
          break;

        case 'setBlendMode':
          // Set blend mode based on material
          this.setBlendMode(context, command.data.material);
          break;

        case 'draw':
          this.drawBatch(context, command.data);
          this.stats.drawCalls++;
          break;
      }
    }

    this.stats.renderTime = performance.now() - startTime;
  }

  /**
   * Set blend mode based on material
   */
  private setBlendMode(context: CanvasRenderingContext2D, material: string): void {
    switch (material) {
      case 'add':
        context.globalCompositeOperation = 'lighter';
        break;
      case 'multiply':
        context.globalCompositeOperation = 'multiply';
        break;
      case 'screen':
        context.globalCompositeOperation = 'screen';
        break;
      default:
        context.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Draw a batch to the canvas
   */
  private drawBatch(context: CanvasRenderingContext2D, data: any): void {
    const { vertices, indices, color, texture } = data;

    // Set color
    context.fillStyle = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;

    // Draw vertices as rectangles (simplified for 2D canvas)
    for (let i = 0; i < vertices.length; i += 16) { // 16 components per quad (4 vertices * 4 components)
      const x = vertices[i];
      const y = vertices[i + 1];
      const width = vertices[i + 4] - x; // Next vertex x - current x
      const height = vertices[i + 5] - y; // Next vertex y - current y

      if (width > 0 && height > 0) {
        context.fillRect(x, y, width, height);
      }
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.activeBatches = this.batches.size;
    this.stats.totalVertices = 0;
    this.stats.totalIndices = 0;

    for (const batch of this.batches.values()) {
      this.stats.totalVertices += batch.vertices.length;
      this.stats.totalIndices += batch.indices.length;
    }
  }

  /**
   * Get rendering statistics
   */
  getStats(): BatchStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): RenderBatch | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Get all batches
   */
  getAllBatches(): RenderBatch[] {
    return Array.from(this.batches.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): BatchConfig {
    return { ...this.config };
  }
}

// Global batch renderer instance
export const globalBatchRenderer = new BatchRenderer();

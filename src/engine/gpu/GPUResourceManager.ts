/**
 * GPU resource management system for WebGL
 * Manages buffers, textures, and other GPU resources with automatic cleanup and optimization
 */

export interface BufferInfo {
  id: string;
  buffer: WebGLBuffer;
  type: 'array' | 'element';
  usage: number; // WebGL usage constant
  size: number;
  lastUsed: number;
  persistent: boolean;
}

export interface TextureInfo {
  id: string;
  texture: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;
  minFilter: number;
  magFilter: number;
  wrapS: number;
  wrapT: number;
  generateMipmaps: boolean;
  lastUsed: number;
  persistent: boolean;
  memoryUsage: number; // bytes
}

export interface RenderbufferInfo {
  id: string;
  renderbuffer: WebGLRenderbuffer;
  width: number;
  height: number;
  format: number;
  lastUsed: number;
  persistent: boolean;
  memoryUsage: number;
}

export interface FramebufferInfo {
  id: string;
  framebuffer: WebGLFramebuffer;
  colorTexture?: string; // texture ID
  depthRenderbuffer?: string; // renderbuffer ID
  width: number;
  height: number;
  lastUsed: number;
  persistent: boolean;
}

export interface GPUResourceStats {
  buffers: {
    total: number;
    active: number;
    memoryUsage: number;
  };
  textures: {
    total: number;
    active: number;
    memoryUsage: number;
  };
  renderbuffers: {
    total: number;
    active: number;
    memoryUsage: number;
  };
  framebuffers: {
    total: number;
    active: number;
  };
  totalMemoryUsage: number;
  cleanupCount: number;
}

export interface GPUResourceManagerConfig {
  maxResourceAge: number; // milliseconds
  maxMemoryUsage: number; // bytes
  enableAutomaticCleanup: boolean;
  cleanupInterval: number; // milliseconds
  enableMemoryTracking: boolean;
  enableResourcePooling: boolean;
}

export class GPUResourceManager {
  private gl: WebGLRenderingContext;
  private config: GPUResourceManagerConfig;
  private buffers = new Map<string, BufferInfo>();
  private textures = new Map<string, TextureInfo>();
  private renderbuffers = new Map<string, RenderbufferInfo>();
  private framebuffers = new Map<string, FramebufferInfo>();
  private cleanupTimer: number | null = null;
  private stats: GPUResourceStats;
  private resourceCounter = 0;

  constructor(gl: WebGLRenderingContext, config: Partial<GPUResourceManagerConfig> = {}) {
    this.gl = gl;
    this.config = {
      maxResourceAge: 300000, // 5 minutes
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      enableAutomaticCleanup: true,
      cleanupInterval: 60000, // 1 minute
      enableMemoryTracking: true,
      enableResourcePooling: true,
      ...config,
    };

    this.stats = {
      buffers: { total: 0, active: 0, memoryUsage: 0 },
      textures: { total: 0, active: 0, memoryUsage: 0 },
      renderbuffers: { total: 0, active: 0, memoryUsage: 0 },
      framebuffers: { total: 0, active: 0 },
      totalMemoryUsage: 0,
      cleanupCount: 0,
    };

    if (this.config.enableAutomaticCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Create a GPU buffer
   */
  createBuffer(
    type: 'array' | 'element',
    usage: number,
    data?: ArrayBufferView,
    persistent: boolean = false
  ): string {
    const id = this.generateResourceId('buffer');
    const buffer = this.gl.createBuffer();
    
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer');
    }

    const bufferType = type === 'array' ? this.gl.ARRAY_BUFFER : this.gl.ELEMENT_ARRAY_BUFFER;
    this.gl.bindBuffer(bufferType, buffer);

    if (data) {
      this.gl.bufferData(bufferType, data, usage);
    }

    const bufferInfo: BufferInfo = {
      id,
      buffer,
      type,
      usage,
      size: data ? data.byteLength : 0,
      lastUsed: Date.now(),
      persistent,
    };

    this.buffers.set(id, bufferInfo);
    this.updateBufferStats();

    return id;
  }

  /**
   * Update buffer data
   */
  updateBuffer(id: string, data: ArrayBufferView, offset?: number): boolean {
    const bufferInfo = this.buffers.get(id);
    if (!bufferInfo) {
      return false;
    }

    const bufferType = bufferInfo.type === 'array' ? this.gl.ARRAY_BUFFER : this.gl.ELEMENT_ARRAY_BUFFER;
    this.gl.bindBuffer(bufferType, bufferInfo.buffer);

    if (offset !== undefined) {
      this.gl.bufferSubData(bufferType, offset, data);
    } else {
      this.gl.bufferData(bufferType, data, bufferInfo.usage);
    }

    bufferInfo.size = data.byteLength;
    bufferInfo.lastUsed = Date.now();
    this.updateBufferStats();

    return true;
  }

  /**
   * Get buffer by ID
   */
  getBuffer(id: string): WebGLBuffer | null {
    const bufferInfo = this.buffers.get(id);
    if (bufferInfo) {
      bufferInfo.lastUsed = Date.now();
      return bufferInfo.buffer;
    }
    return null;
  }

  /**
   * Create a texture
   */
  createTexture(
    width: number,
    height: number,
    format: number = this.gl.RGBA,
    type: number = this.gl.UNSIGNED_BYTE,
    options: {
      minFilter?: number;
      magFilter?: number;
      wrapS?: number;
      wrapT?: number;
      generateMipmaps?: boolean;
      persistent?: boolean;
      data?: ArrayBufferView;
    } = {}
  ): string {
    const id = this.generateResourceId('texture');
    const texture = this.gl.createTexture();
    
    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, options.minFilter || this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, options.magFilter || this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, options.wrapS || this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, options.wrapT || this.gl.CLAMP_TO_EDGE);

    // Upload texture data
    if (options.data) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, type, options.data);
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
    }

    // Generate mipmaps if requested
    if (options.generateMipmaps) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    const memoryUsage = this.calculateTextureMemoryUsage(width, height, format, type);

    const textureInfo: TextureInfo = {
      id,
      texture,
      width,
      height,
      format,
      type,
      minFilter: options.minFilter || this.gl.LINEAR,
      magFilter: options.magFilter || this.gl.LINEAR,
      wrapS: options.wrapS || this.gl.CLAMP_TO_EDGE,
      wrapT: options.wrapT || this.gl.CLAMP_TO_EDGE,
      generateMipmaps: options.generateMipmaps || false,
      lastUsed: Date.now(),
      persistent: options.persistent || false,
      memoryUsage,
    };

    this.textures.set(id, textureInfo);
    this.updateTextureStats();

    return id;
  }

  /**
   * Update texture data
   */
  updateTexture(id: string, data: ArrayBufferView, x?: number, y?: number, width?: number, height?: number): boolean {
    const textureInfo = this.textures.get(id);
    if (!textureInfo) {
      return false;
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, textureInfo.texture);

    if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, x, y, width, height, textureInfo.format, textureInfo.type, data);
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, textureInfo.format, textureInfo.width, textureInfo.height, 0, textureInfo.format, textureInfo.type, data);
    }

    textureInfo.lastUsed = Date.now();

    return true;
  }

  /**
   * Get texture by ID
   */
  getTexture(id: string): WebGLTexture | null {
    const textureInfo = this.textures.get(id);
    if (textureInfo) {
      textureInfo.lastUsed = Date.now();
      return textureInfo.texture;
    }
    return null;
  }

  /**
   * Create a renderbuffer
   */
  createRenderbuffer(width: number, height: number, format: number, persistent: boolean = false): string {
    const id = this.generateResourceId('renderbuffer');
    const renderbuffer = this.gl.createRenderbuffer();
    
    if (!renderbuffer) {
      throw new Error('Failed to create WebGL renderbuffer');
    }

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, format, width, height);

    const memoryUsage = this.calculateRenderbufferMemoryUsage(width, height, format);

    const renderbufferInfo: RenderbufferInfo = {
      id,
      renderbuffer,
      width,
      height,
      format,
      lastUsed: Date.now(),
      persistent,
      memoryUsage,
    };

    this.renderbuffers.set(id, renderbufferInfo);
    this.updateRenderbufferStats();

    return id;
  }

  /**
   * Get renderbuffer by ID
   */
  getRenderbuffer(id: string): WebGLRenderbuffer | null {
    const renderbufferInfo = this.renderbuffers.get(id);
    if (renderbufferInfo) {
      renderbufferInfo.lastUsed = Date.now();
      return renderbufferInfo.renderbuffer;
    }
    return null;
  }

  /**
   * Create a framebuffer
   */
  createFramebuffer(width: number, height: number, persistent: boolean = false): string {
    const id = this.generateResourceId('framebuffer');
    const framebuffer = this.gl.createFramebuffer();
    
    if (!framebuffer) {
      throw new Error('Failed to create WebGL framebuffer');
    }

    const framebufferInfo: FramebufferInfo = {
      id,
      framebuffer,
      width,
      height,
      lastUsed: Date.now(),
      persistent,
    };

    this.framebuffers.set(id, framebufferInfo);
    this.updateFramebufferStats();

    return id;
  }

  /**
   * Attach texture to framebuffer
   */
  attachTextureToFramebuffer(framebufferId: string, textureId: string, attachment: number = this.gl.COLOR_ATTACHMENT0): boolean {
    const framebufferInfo = this.framebuffers.get(framebufferId);
    const textureInfo = this.textures.get(textureId);

    if (!framebufferInfo || !textureInfo) {
      return false;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferInfo.framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, textureInfo.texture, 0);

    framebufferInfo.colorTexture = textureId;
    framebufferInfo.lastUsed = Date.now();

    return true;
  }

  /**
   * Attach renderbuffer to framebuffer
   */
  attachRenderbufferToFramebuffer(framebufferId: string, renderbufferId: string, attachment: number): boolean {
    const framebufferInfo = this.framebuffers.get(framebufferId);
    const renderbufferInfo = this.renderbuffers.get(renderbufferId);

    if (!framebufferInfo || !renderbufferInfo) {
      return false;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferInfo.framebuffer);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, renderbufferInfo.renderbuffer);

    if (attachment === this.gl.DEPTH_ATTACHMENT || attachment === this.gl.DEPTH_STENCIL_ATTACHMENT) {
      framebufferInfo.depthRenderbuffer = renderbufferId;
    }

    framebufferInfo.lastUsed = Date.now();

    return true;
  }

  /**
   * Get framebuffer by ID
   */
  getFramebuffer(id: string): WebGLFramebuffer | null {
    const framebufferInfo = this.framebuffers.get(id);
    if (framebufferInfo) {
      framebufferInfo.lastUsed = Date.now();
      return framebufferInfo.framebuffer;
    }
    return null;
  }

  /**
   * Delete buffer
   */
  deleteBuffer(id: string): boolean {
    const bufferInfo = this.buffers.get(id);
    if (!bufferInfo) {
      return false;
    }

    this.gl.deleteBuffer(bufferInfo.buffer);
    this.buffers.delete(id);
    this.updateBufferStats();

    return true;
  }

  /**
   * Delete texture
   */
  deleteTexture(id: string): boolean {
    const textureInfo = this.textures.get(id);
    if (!textureInfo) {
      return false;
    }

    this.gl.deleteTexture(textureInfo.texture);
    this.textures.delete(id);
    this.updateTextureStats();

    return true;
  }

  /**
   * Delete renderbuffer
   */
  deleteRenderbuffer(id: string): boolean {
    const renderbufferInfo = this.renderbuffers.get(id);
    if (!renderbufferInfo) {
      return false;
    }

    this.gl.deleteRenderbuffer(renderbufferInfo.renderbuffer);
    this.renderbuffers.delete(id);
    this.updateRenderbufferStats();

    return true;
  }

  /**
   * Delete framebuffer
   */
  deleteFramebuffer(id: string): boolean {
    const framebufferInfo = this.framebuffers.get(id);
    if (!framebufferInfo) {
      return false;
    }

    this.gl.deleteFramebuffer(framebufferInfo.framebuffer);
    this.framebuffers.delete(id);
    this.updateFramebufferStats();

    return true;
  }

  /**
   * Clean up old unused resources
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    // Clean up buffers
    for (const [id, buffer] of this.buffers) {
      if (!buffer.persistent && now - buffer.lastUsed > this.config.maxResourceAge) {
        this.deleteBuffer(id);
        cleaned++;
      }
    }

    // Clean up textures
    for (const [id, texture] of this.textures) {
      if (!texture.persistent && now - texture.lastUsed > this.config.maxResourceAge) {
        this.deleteTexture(id);
        cleaned++;
      }
    }

    // Clean up renderbuffers
    for (const [id, renderbuffer] of this.renderbuffers) {
      if (!renderbuffer.persistent && now - renderbuffer.lastUsed > this.config.maxResourceAge) {
        this.deleteRenderbuffer(id);
        cleaned++;
      }
    }

    // Clean up framebuffers
    for (const [id, framebuffer] of this.framebuffers) {
      if (!framebuffer.persistent && now - framebuffer.lastUsed > this.config.maxResourceAge) {
        this.deleteFramebuffer(id);
        cleaned++;
      }
    }

    // Force garbage collection if memory usage is high
    if (this.stats.totalMemoryUsage > this.config.maxMemoryUsage) {
      this.forceCleanup();
    }

    this.stats.cleanupCount++;
    return cleaned;
  }

  /**
   * Force cleanup of non-persistent resources
   */
  private forceCleanup(): void {
    // Delete all non-persistent resources
    const buffersToDelete = Array.from(this.buffers.entries()).filter(([_, buffer]) => !buffer.persistent);
    const texturesToDelete = Array.from(this.textures.entries()).filter(([_, texture]) => !texture.persistent);
    const renderbuffersToDelete = Array.from(this.renderbuffers.entries()).filter(([_, renderbuffer]) => !renderbuffer.persistent);
    const framebuffersToDelete = Array.from(this.framebuffers.entries()).filter(([_, framebuffer]) => !framebuffer.persistent);

    for (const [id] of buffersToDelete) this.deleteBuffer(id);
    for (const [id] of texturesToDelete) this.deleteTexture(id);
    for (const [id] of renderbuffersToDelete) this.deleteRenderbuffer(id);
    for (const [id] of framebuffersToDelete) this.deleteFramebuffer(id);
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Calculate texture memory usage
   */
  private calculateTextureMemoryUsage(width: number, height: number, format: number, type: number): number {
    let bytesPerPixel = 4; // Default for RGBA/UNSIGNED_BYTE

    switch (type) {
      case this.gl.UNSIGNED_BYTE:
        bytesPerPixel = 4;
        break;
      case this.gl.FLOAT:
        bytesPerPixel = 16;
        break;
      case this.gl.UNSIGNED_SHORT_5_6_5:
        bytesPerPixel = 2;
        break;
    }

    return width * height * bytesPerPixel;
  }

  /**
   * Calculate renderbuffer memory usage
   */
  private calculateRenderbufferMemoryUsage(width: number, height: number, format: number): number {
    let bytesPerPixel = 4; // Default

    switch (format) {
      case this.gl.RGB565:
      case this.gl.RGB5_A1:
      case this.gl.RGBA4:
        bytesPerPixel = 2;
        break;
      case this.gl.DEPTH_COMPONENT16:
        bytesPerPixel = 2;
        break;
      case (this.gl as any).DEPTH_COMPONENT24:
        bytesPerPixel = 3;
        break;
      case (this.gl as any).DEPTH24_STENCIL8:
      case this.gl.DEPTH_STENCIL:
        bytesPerPixel = 4;
        break;
    }

    return width * height * bytesPerPixel;
  }

  /**
   * Update buffer statistics
   */
  private updateBufferStats(): void {
    this.stats.buffers.total = this.buffers.size;
    this.stats.buffers.active = Array.from(this.buffers.values()).filter(b => !b.persistent).length;
    this.stats.buffers.memoryUsage = Array.from(this.buffers.values()).reduce((sum, b) => sum + b.size, 0);
    this.updateTotalMemoryUsage();
  }

  /**
   * Update texture statistics
   */
  private updateTextureStats(): void {
    this.stats.textures.total = this.textures.size;
    this.stats.textures.active = Array.from(this.textures.values()).filter(t => !t.persistent).length;
    this.stats.textures.memoryUsage = Array.from(this.textures.values()).reduce((sum, t) => sum + t.memoryUsage, 0);
    this.updateTotalMemoryUsage();
  }

  /**
   * Update renderbuffer statistics
   */
  private updateRenderbufferStats(): void {
    this.stats.renderbuffers.total = this.renderbuffers.size;
    this.stats.renderbuffers.active = Array.from(this.renderbuffers.values()).filter(r => !r.persistent).length;
    this.stats.renderbuffers.memoryUsage = Array.from(this.renderbuffers.values()).reduce((sum, r) => sum + r.memoryUsage, 0);
    this.updateTotalMemoryUsage();
  }

  /**
   * Update framebuffer statistics
   */
  private updateFramebufferStats(): void {
    this.stats.framebuffers.total = this.framebuffers.size;
    this.stats.framebuffers.active = Array.from(this.framebuffers.values()).filter(f => !f.persistent).length;
  }

  /**
   * Update total memory usage
   */
  private updateTotalMemoryUsage(): void {
    this.stats.totalMemoryUsage = this.stats.buffers.memoryUsage + 
                                 this.stats.textures.memoryUsage + 
                                 this.stats.renderbuffers.memoryUsage;
  }

  /**
   * Generate unique resource ID
   */
  private generateResourceId(type: string): string {
    return `${type}_${this.resourceCounter++}_${Date.now()}`;
  }

  /**
   * Get resource statistics
   */
  getStats(): GPUResourceStats {
    this.updateBufferStats();
    this.updateTextureStats();
    this.updateRenderbufferStats();
    this.updateFramebufferStats();
    
    return { ...this.stats };
  }

  /**
   * Get memory usage in human-readable format
   */
  getMemoryUsage(): {
    buffers: string;
    textures: string;
    renderbuffers: string;
    total: string;
    percentage: number;
  } {
    const stats = this.getStats();
    const maxMemory = this.config.maxMemoryUsage;

    return {
      buffers: this.formatBytes(stats.buffers.memoryUsage),
      textures: this.formatBytes(stats.textures.memoryUsage),
      renderbuffers: this.formatBytes(stats.renderbuffers.memoryUsage),
      total: this.formatBytes(stats.totalMemoryUsage),
      percentage: (stats.totalMemoryUsage / maxMemory) * 100,
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GPUResourceManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if settings changed
    if (this.config.enableAutomaticCleanup && !this.cleanupTimer) {
      this.startCleanupTimer();
    } else if (!this.config.enableAutomaticCleanup && this.cleanupTimer) {
      this.stopCleanupTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): GPUResourceManagerConfig {
    return { ...this.config };
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    this.stopCleanupTimer();

    // Delete all resources
    for (const id of this.buffers.keys()) this.deleteBuffer(id);
    for (const id of this.textures.keys()) this.deleteTexture(id);
    for (const id of this.renderbuffers.keys()) this.deleteRenderbuffer(id);
    for (const id of this.framebuffers.keys()) this.deleteFramebuffer(id);

    this.stats = {
      buffers: { total: 0, active: 0, memoryUsage: 0 },
      textures: { total: 0, active: 0, memoryUsage: 0 },
      renderbuffers: { total: 0, active: 0, memoryUsage: 0 },
      framebuffers: { total: 0, active: 0 },
      totalMemoryUsage: 0,
      cleanupCount: 0,
    };
  }
}

// Global resource manager instance
export const globalGPUResourceManager = (gl: WebGLRenderingContext) => new GPUResourceManager(gl);

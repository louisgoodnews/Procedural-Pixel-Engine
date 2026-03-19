/**
 * WebGL 2.0 context initialization and capability detection system
 * Provides robust WebGL context creation with fallback support and comprehensive capability reporting
 */

export interface WebGLCapabilities {
  webgl2: boolean;
  webgl1: boolean;
  maxTextureSize: number;
  maxCubeMapTextureSize: number;
  maxVertexAttributes: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  maxVaryings: number;
  maxVertexTextureImageUnits: number;
  maxFragmentTextureImageUnits: number;
  maxCombinedTextureImageUnits: number;
  maxRenderBufferSize: number;
  maxViewportDims: [number, number];
  maxSamples: number;
  aliasedLineWidthRange: [number, number];
  aliasedPointSizeRange: [number, number];
  maxTextureMaxAnisotropy: number;
  extensions: string[];
  supportedFormats?: any;
  renderableFormats?: any;
}

export interface WebGLContextConfig {
  alpha: boolean;
  depth: boolean;
  stencil: boolean;
  antialias: boolean;
  premultipliedAlpha: boolean;
  preserveDrawingBuffer: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat: boolean;
  desynchronized: boolean;
}

export interface WebGLContextInfo {
  context: WebGLRenderingContext;
  version: 'webgl2' | 'webgl1';
  capabilities: WebGLCapabilities;
  vendor: string;
  renderer: string;
  isHardwareAccelerated: boolean;
  config: WebGLContextConfig;
}

export class WebGLContextManager {
  private static instance: WebGLContextManager;
  private contextCache = new Map<HTMLCanvasElement, WebGLContextInfo>();
  private defaultConfig: WebGLContextConfig = {
    alpha: false,
    depth: true,
    stencil: false,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    desynchronized: false,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): WebGLContextManager {
    if (!WebGLContextManager.instance) {
      WebGLContextManager.instance = new WebGLContextManager();
    }
    return WebGLContextManager.instance;
  }

  /**
   * Create or retrieve WebGL context for a canvas
   */
  createContext(
    canvas: HTMLCanvasElement,
    config: Partial<WebGLContextConfig> = {}
  ): WebGLContextInfo | null {
    // Check cache first
    if (this.contextCache.has(canvas)) {
      return this.contextCache.get(canvas)!;
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Try WebGL 2.0 first
    let context = this.createWebGL2Context(canvas, finalConfig);
    let version: 'webgl2' | 'webgl1' = 'webgl2';

    // Fallback to WebGL 1.0 if WebGL 2.0 fails
    if (!context) {
      context = this.createWebGL1Context(canvas, finalConfig);
      version = 'webgl1';
    }

    if (!context) {
      console.error('WebGL context creation failed. Browser may not support WebGL.');
      return null;
    }

    const capabilities = this.detectCapabilities(context, version);
    const contextInfo: WebGLContextInfo = {
      context,
      version,
      capabilities,
      vendor: this.getParameterSafe(context, context.VENDOR) || 'Unknown',
      renderer: this.getParameterSafe(context, context.RENDERER) || 'Unknown',
      isHardwareAccelerated: this.isHardwareAccelerated(capabilities),
      config: finalConfig,
    };

    this.contextCache.set(canvas, contextInfo);
    return contextInfo;
  }

  /**
   * Create WebGL 2.0 context
   */
  private createWebGL2Context(
    canvas: HTMLCanvasElement,
    config: WebGLContextConfig
  ): WebGLRenderingContext | null {
    try {
      const context = canvas.getContext('webgl2', config);
      return context as WebGLRenderingContext | null;
    } catch (error) {
      console.warn('WebGL 2.0 context creation failed:', error);
      return null;
    }
  }

  /**
   * Create WebGL 1.0 context
   */
  private createWebGL1Context(
    canvas: HTMLCanvasElement,
    config: WebGLContextConfig
  ): WebGLRenderingContext | null {
    try {
      const context = canvas.getContext('webgl', config) || 
                     canvas.getContext('experimental-webgl', config);
      return context as WebGLRenderingContext | null;
    } catch (error) {
      console.warn('WebGL 1.0 context creation failed:', error);
      return null;
    }
  }

  /**
   * Detect WebGL capabilities
   */
  private detectCapabilities(
    context: WebGLRenderingContext | WebGL2RenderingContext,
    version: 'webgl2' | 'webgl1'
  ): WebGLCapabilities {
    const gl = context;
    
    const capabilities: WebGLCapabilities = {
      webgl2: version === 'webgl2',
      webgl1: true,
      maxTextureSize: this.getParameterSafe(gl, gl.MAX_TEXTURE_SIZE) || 2048,
      maxCubeMapTextureSize: this.getParameterSafe(gl, gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 1024,
      maxVertexAttributes: this.getParameterSafe(gl, gl.MAX_VERTEX_ATTRIBS) || 16,
      maxVertexUniforms: this.getParameterSafe(gl, gl.MAX_VERTEX_UNIFORM_VECTORS) || 256,
      maxFragmentUniforms: this.getParameterSafe(gl, gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 256,
      maxVaryings: this.getParameterSafe(gl, gl.MAX_VARYING_VECTORS) || 8,
      maxVertexTextureImageUnits: this.getParameterSafe(gl, gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 0,
      maxFragmentTextureImageUnits: this.getParameterSafe(gl, gl.MAX_TEXTURE_IMAGE_UNITS) || 8,
      maxCombinedTextureImageUnits: this.getParameterSafe(gl, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 8,
      maxRenderBufferSize: this.getParameterSafe(gl, gl.MAX_RENDERBUFFER_SIZE) || 16384,
      maxViewportDims: this.getParameterSafe(gl, gl.MAX_VIEWPORT_DIMS) || [2048, 2048] as [number, number],
      maxSamples: this.getMaxSamples(gl),
      aliasedLineWidthRange: this.getParameterSafe(gl, gl.ALIASED_LINE_WIDTH_RANGE) || [1, 1] as [number, number],
      aliasedPointSizeRange: this.getParameterSafe(gl, gl.ALIASED_POINT_SIZE_RANGE) || [1, 1] as [number, number],
      maxTextureMaxAnisotropy: this.getMaxAnisotropy(gl),
      extensions: this.getAvailableExtensions(gl),
      supportedFormats: this.getSupportedFormats(gl),
      renderableFormats: this.getRenderableFormats(gl),
    };

    return capabilities;
  }

  /**
   * Safely get WebGL parameter
   */
  private getParameterSafe<T>(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    parameter: number
  ): T | null {
    try {
      return gl.getParameter(parameter) as T;
    } catch (error) {
      console.warn(`Failed to get WebGL parameter ${parameter}:`, error);
      return null;
    }
  }

  /**
   * Get maximum samples
   */
  private getMaxSamples(gl: WebGLRenderingContext | WebGL2RenderingContext): number {
    // Check if WebGL 2.0 or if multisampling extension is available
    if ('MAX_SAMPLES' in gl) {
      return this.getParameterSafe(gl, (gl as any).MAX_SAMPLES) || 4;
    }
    
    // Fallback to WebGL 1.0 extension
    const ext = gl.getExtension('WEBGL_multisampled_render_to_texture');
    if (ext) {
      return 4; // Default to 4 samples if extension is available
    }
    
    return 1; // No multisampling
  }

  /**
   * Get maximum anisotropy
   */
  private getMaxAnisotropy(gl: WebGLRenderingContext | WebGL2RenderingContext): number {
    const ext = gl.getExtension('EXT_texture_filter_anisotropic') ||
                gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    
    if (ext) {
      return this.getParameterSafe(gl, (ext as any).MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
    }
    
    return 1;
  }

  /**
   * Get available extensions
   */
  private getAvailableExtensions(gl: WebGLRenderingContext | WebGL2RenderingContext): string[] {
    try {
      const extensions = gl.getSupportedExtensions();
      return extensions || [];
    } catch (error) {
      console.warn('Failed to get WebGL extensions:', error);
      return [];
    }
  }

  /**
   * Get supported formats
   */
  private getSupportedFormats(gl: WebGLRenderingContext | WebGL2RenderingContext): any {
    try {
      if ('getSupportedFormats' in gl) {
        return (gl as any).getSupportedFormats();
      }
    } catch (error) {
      // Fallback for WebGL 1.0
    }
    return {};
  }

  /**
   * Get renderable formats
   */
  private getRenderableFormats(gl: WebGLRenderingContext | WebGL2RenderingContext): any {
    try {
      if ('getRenderbufferFormats' in gl) {
        return (gl as any).getRenderbufferFormats();
      }
    } catch (error) {
      // Fallback for WebGL 1.0
    }
    return {};
  }

  /**
   * Check if rendering is hardware accelerated
   */
  private isHardwareAccelerated(capabilities: WebGLCapabilities): boolean {
    // Heuristics for hardware acceleration detection
    const indicators = [
      capabilities.maxTextureSize >= 4096,
      capabilities.maxVertexAttributes >= 16,
      capabilities.maxFragmentUniforms >= 256,
      capabilities.maxTextureMaxAnisotropy > 1,
      capabilities.extensions.length > 10,
    ];

    return indicators.filter(Boolean).length >= 3;
  }

  /**
   * Check if specific extension is supported
   */
  isExtensionSupported(canvas: HTMLCanvasElement, extensionName: string): boolean {
    const contextInfo = this.contextCache.get(canvas);
    if (!contextInfo) {
      return false;
    }

    return contextInfo.capabilities.extensions.includes(extensionName);
  }

  /**
   * Get context info for a canvas
   */
  getContextInfo(canvas: HTMLCanvasElement): WebGLContextInfo | null {
    return this.contextCache.get(canvas) || null;
  }

  /**
   * Check if WebGL 2.0 is available
   */
  static isWebGL2Available(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  }

  /**
   * Check if WebGL 1.0 is available
   */
  static isWebGL1Available(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  }

  /**
   * Get system WebGL capabilities without creating a context
   */
  static getSystemCapabilities(): {
    webgl2: boolean;
    webgl1: boolean;
    recommended: 'webgl2' | 'webgl1' | 'none';
  } {
    const webgl2 = WebGLContextManager.isWebGL2Available();
    const webgl1 = WebGLContextManager.isWebGL1Available();
    
    let recommended: 'webgl2' | 'webgl1' | 'none';
    if (webgl2) {
      recommended = 'webgl2';
    } else if (webgl1) {
      recommended = 'webgl1';
    } else {
      recommended = 'none';
    }

    return { webgl2, webgl1, recommended };
  }

  /**
   * Dispose of a WebGL context
   */
  disposeContext(canvas: HTMLCanvasElement): boolean {
    const contextInfo = this.contextCache.get(canvas);
    if (!contextInfo) {
      return false;
    }

    // Lose context if available
    const loseContextExt = contextInfo.context.getExtension('WEBGL_lose_context');
    if (loseContextExt) {
      loseContextExt.loseContext();
    }

    this.contextCache.delete(canvas);
    return true;
  }

  /**
   * Dispose of all contexts
   */
  disposeAllContexts(): void {
    for (const canvas of this.contextCache.keys()) {
      this.disposeContext(canvas);
    }
  }

  /**
   * Get performance metrics for all contexts
   */
  getPerformanceMetrics(): Array<{
    canvas: HTMLCanvasElement;
    version: string;
    vendor: string;
    renderer: string;
    isHardwareAccelerated: boolean;
    capabilities: Partial<WebGLCapabilities>;
  }> {
    const metrics = [];

    for (const [canvas, info] of this.contextCache) {
      metrics.push({
        canvas,
        version: info.version,
        vendor: info.vendor,
        renderer: info.renderer,
        isHardwareAccelerated: info.isHardwareAccelerated,
        capabilities: {
          maxTextureSize: info.capabilities.maxTextureSize,
          maxVertexAttributes: info.capabilities.maxVertexAttributes,
          maxFragmentUniforms: info.capabilities.maxFragmentUniforms,
          extensions: info.capabilities.extensions,
        },
      });
    }

    return metrics;
  }

  /**
   * Update default configuration
   */
  updateDefaultConfig(config: Partial<WebGLContextConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): WebGLContextConfig {
    return { ...this.defaultConfig };
  }
}

// Export singleton instance
export const webglContextManager = WebGLContextManager.getInstance();

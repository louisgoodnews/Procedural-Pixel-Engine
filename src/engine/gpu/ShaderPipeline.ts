/**
 * Shader pipeline system for WebGL rendering
 * Provides shader compilation, management, and uniform handling
 */

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface UniformInfo {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'ivec2' | 'ivec3' | 'ivec4' | 'bool' | 'mat2' | 'mat3' | 'mat4' | 'sampler2D';
  location: WebGLUniformLocation | null;
  size: number;
}

export interface AttributeInfo {
  name: string;
  location: number;
  size: number;
  type: number;
  normalized: boolean;
  stride: number;
  offset: number;
}

export interface ShaderProgram {
  id: string;
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  uniforms: Map<string, UniformInfo>;
  attributes: Map<string, AttributeInfo>;
  active: boolean;
  lastUsed: number;
}

export interface ShaderPipelineConfig {
  enableValidation: boolean;
  enablePrecisionHints: boolean;
  maxShaderAge: number; // milliseconds
  uniformUpdateOptimization: boolean;
  attributeCacheSize: number;
}

export class ShaderPipeline {
  private gl: WebGLRenderingContext;
  private programs = new Map<string, ShaderProgram>();
  private shaderCache = new Map<string, WebGLShader>();
  private config: ShaderPipelineConfig;
  private activeProgram: ShaderProgram | null = null;
  private stats = {
    compiledPrograms: 0,
    compiledShaders: 0,
    activePrograms: 0,
    uniformUpdates: 0,
    cacheHits: 0,
    compilationErrors: 0,
  };

  constructor(gl: WebGLRenderingContext, config: Partial<ShaderPipelineConfig> = {}) {
    this.gl = gl;
    this.config = {
      enableValidation: true,
      enablePrecisionHints: true,
      maxShaderAge: 60000, // 1 minute
      uniformUpdateOptimization: true,
      attributeCacheSize: 100,
      ...config,
    };
  }

  /**
   * Create a shader program from vertex and fragment shader sources
   */
  createProgram(id: string, sources: ShaderSource): boolean {
    // Check if program already exists
    if (this.programs.has(id)) {
      console.warn(`Shader program '${id}' already exists`);
      return false;
    }

    // Compile shaders
    const vertexShader = this.compileShader(sources.vertex, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(sources.fragment, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      this.stats.compilationErrors++;
      return false;
    }

    // Create program
    const program = this.gl.createProgram();
    if (!program) {
      console.error('Failed to create WebGL program');
      return false;
    }

    // Attach shaders
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    // Link program
    if (!this.linkProgram(program)) {
      this.gl.deleteProgram(program);
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      this.stats.compilationErrors++;
      return false;
    }

    // Validate program if enabled
    if (this.config.enableValidation && !this.validateProgram(program)) {
      this.gl.deleteProgram(program);
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      this.stats.compilationErrors++;
      return false;
    }

    // Extract uniforms and attributes
    const uniforms = this.extractUniforms(program);
    const attributes = this.extractAttributes(program);

    // Create shader program object
    const shaderProgram: ShaderProgram = {
      id,
      program,
      vertexShader,
      fragmentShader,
      uniforms,
      attributes,
      active: true,
      lastUsed: Date.now(),
    };

    this.programs.set(id, shaderProgram);
    this.stats.compiledPrograms++;
    this.stats.activePrograms++;

    return true;
  }

  /**
   * Compile a shader from source code
   */
  private compileShader(source: string, type: number): WebGLShader | null {
    // Check cache first
    const cacheKey = this.getShaderCacheKey(source, type);
    const cached = this.shaderCache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    const shader = this.gl.createShader(type);
    if (!shader) {
      console.error('Failed to create WebGL shader');
      return null;
    }

    // Add precision hints if enabled
    if (this.config.enablePrecisionHints) {
      source = this.addPrecisionHints(source, type);
    }

    // Compile shader
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    // Check compilation status
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      console.error(`Shader compilation failed: ${info}`);
      console.error(`Shader source:\n${source}`);
      this.gl.deleteShader(shader);
      return null;
    }

    // Cache shader
    this.shaderCache.set(cacheKey, shader);
    this.stats.compiledShaders++;

    return shader;
  }

  /**
   * Add precision hints to shader source
   */
  private addPrecisionHints(source: string, type: number): string {
    const precision = type === this.gl.VERTEX_SHADER ? 'highp' : 'mediump';
    
    if (!source.includes('precision ')) {
      return `precision ${precision} float;\nprecision ${precision} int;\n\n${source}`;
    }
    
    return source;
  }

  /**
   * Generate cache key for shader
   */
  private getShaderCacheKey(source: string, type: number): string {
    // Simple hash function for shader source
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      const char = source.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${type}_${hash}`;
  }

  /**
   * Link a shader program
   */
  private linkProgram(program: WebGLProgram): boolean {
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      console.error(`Program linking failed: ${info}`);
      return false;
    }

    return true;
  }

  /**
   * Validate a shader program
   */
  private validateProgram(program: WebGLProgram): boolean {
    this.gl.validateProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      console.error(`Program validation failed: ${info}`);
      return false;
    }

    return true;
  }

  /**
   * Extract uniform information from a program
   */
  private extractUniforms(program: WebGLProgram): Map<string, UniformInfo> {
    const uniforms = new Map<string, UniformInfo>();
    const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
      const info = this.gl.getActiveUniform(program, i);
      if (!info) continue;

      const location = this.gl.getUniformLocation(program, info.name);
      const uniformInfo: UniformInfo = {
        name: info.name,
        type: this.getUniformType(info.type),
        location,
        size: info.size,
      };

      uniforms.set(info.name, uniformInfo);
    }

    return uniforms;
  }

  /**
   * Extract attribute information from a program
   */
  private extractAttributes(program: WebGLProgram): Map<string, AttributeInfo> {
    const attributes = new Map<string, AttributeInfo>();
    const attributeCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < attributeCount; i++) {
      const info = this.gl.getActiveAttrib(program, i);
      if (!info) continue;

      const location = this.gl.getAttribLocation(program, info.name);
      const attributeInfo: AttributeInfo = {
        name: info.name,
        location,
        size: info.size,
        type: info.type,
        normalized: false,
        stride: 0,
        offset: 0,
      };

      attributes.set(info.name, attributeInfo);
    }

    return attributes;
  }

  /**
   * Get uniform type string from WebGL constant
   */
  private getUniformType(glType: number): UniformInfo['type'] {
    switch (glType) {
      case this.gl.FLOAT:
        return 'float';
      case this.gl.FLOAT_VEC2:
        return 'vec2';
      case this.gl.FLOAT_VEC3:
        return 'vec3';
      case this.gl.FLOAT_VEC4:
        return 'vec4';
      case this.gl.INT:
        return 'int';
      case this.gl.INT_VEC2:
        return 'ivec2';
      case this.gl.INT_VEC3:
        return 'ivec3';
      case this.gl.INT_VEC4:
        return 'ivec4';
      case this.gl.BOOL:
        return 'bool';
      case this.gl.FLOAT_MAT2:
        return 'mat2';
      case this.gl.FLOAT_MAT3:
        return 'mat3';
      case this.gl.FLOAT_MAT4:
        return 'mat4';
      case this.gl.SAMPLER_2D:
        return 'sampler2D';
      default:
        return 'float';
    }
  }

  /**
   * Use a shader program
   */
  useProgram(id: string): boolean {
    const program = this.programs.get(id);
    if (!program || !program.active) {
      console.warn(`Shader program '${id}' not found or inactive`);
      return false;
    }

    this.gl.useProgram(program.program);
    this.activeProgram = program;
    program.lastUsed = Date.now();

    return true;
  }

  /**
   * Set uniform value
   */
  setUniform(name: string, value: any): boolean {
    if (!this.activeProgram) {
      console.warn('No active shader program');
      return false;
    }

    const uniform = this.activeProgram.uniforms.get(name);
    if (!uniform || !uniform.location) {
      console.warn(`Uniform '${name}' not found in active program`);
      return false;
    }

    // Skip update if optimization is enabled and value hasn't changed
    if (this.config.uniformUpdateOptimization && this.uniformsEqual(uniform, value)) {
      return true;
    }

    this.setUniformValue(uniform, value);
    this.stats.uniformUpdates++;

    return true;
  }

  /**
   * Set uniform value based on type
   */
  private setUniformValue(uniform: UniformInfo, value: any): void {
    switch (uniform.type) {
      case 'float':
        this.gl.uniform1f(uniform.location, value);
        break;
      case 'vec2':
        this.gl.uniform2fv(uniform.location, value);
        break;
      case 'vec3':
        this.gl.uniform3fv(uniform.location, value);
        break;
      case 'vec4':
        this.gl.uniform4fv(uniform.location, value);
        break;
      case 'int':
        this.gl.uniform1i(uniform.location, value);
        break;
      case 'ivec2':
        this.gl.uniform2iv(uniform.location, value);
        break;
      case 'ivec3':
        this.gl.uniform3iv(uniform.location, value);
        break;
      case 'ivec4':
        this.gl.uniform4iv(uniform.location, value);
        break;
      case 'bool':
        this.gl.uniform1i(uniform.location, value ? 1 : 0);
        break;
      case 'mat2':
        this.gl.uniformMatrix2fv(uniform.location, false, value);
        break;
      case 'mat3':
        this.gl.uniformMatrix3fv(uniform.location, false, value);
        break;
      case 'mat4':
        this.gl.uniformMatrix4fv(uniform.location, false, value);
        break;
      case 'sampler2D':
        this.gl.uniform1i(uniform.location, value);
        break;
    }
  }

  /**
   * Check if uniform values are equal (for optimization)
   */
  private uniformsEqual(uniform: UniformInfo, newValue: any): boolean {
    // This is a simplified comparison - in practice you'd want more sophisticated caching
    return false;
  }

  /**
   * Get attribute location
   */
  getAttributeLocation(name: string): number | null {
    if (!this.activeProgram) {
      console.warn('No active shader program');
      return null;
    }

    const attribute = this.activeProgram.attributes.get(name);
    return attribute ? attribute.location : null;
  }

  /**
   * Enable vertex attribute
   */
  enableAttribute(name: string): boolean {
    const location = this.getAttributeLocation(name);
    if (location === null || location < 0) {
      return false;
    }

    this.gl.enableVertexAttribArray(location);
    return true;
  }

  /**
   * Disable vertex attribute
   */
  disableAttribute(name: string): boolean {
    const location = this.getAttributeLocation(name);
    if (location === null || location < 0) {
      return false;
    }

    this.gl.disableVertexAttribArray(location);
    return true;
  }

  /**
   * Set vertex attribute pointer
   */
  setAttributePointer(name: string, size: number, type: number, normalized: boolean, stride: number, offset: number): boolean {
    const location = this.getAttributeLocation(name);
    if (location === null || location < 0) {
      return false;
    }

    this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    return true;
  }

  /**
   * Delete a shader program
   */
  deleteProgram(id: string): boolean {
    const program = this.programs.get(id);
    if (!program) {
      return false;
    }

    this.gl.deleteProgram(program.program);
    this.gl.deleteShader(program.vertexShader);
    this.gl.deleteShader(program.fragmentShader);

    this.programs.delete(id);
    this.stats.activePrograms--;

    return true;
  }

  /**
   * Get shader program by ID
   */
  getProgram(id: string): ShaderProgram | null {
    return this.programs.get(id) || null;
  }

  /**
   * Get all shader programs
   */
  getAllPrograms(): ShaderProgram[] {
    return Array.from(this.programs.values());
  }

  /**
   * Clean up old unused shaders
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    // Clean up old shader programs
    for (const [id, program] of this.programs) {
      if (now - program.lastUsed > this.config.maxShaderAge && program !== this.activeProgram) {
        this.deleteProgram(id);
        cleaned++;
      }
    }

    // Clean up shader cache (keep only recently used)
    const cacheSize = this.shaderCache.size;
    if (cacheSize > this.config.attributeCacheSize) {
      const entries = Array.from(this.shaderCache.entries());
      const toDelete = entries.slice(0, cacheSize - this.config.attributeCacheSize);
      
      for (const [key, shader] of toDelete) {
        this.gl.deleteShader(shader);
        this.shaderCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return {
      ...this.stats,
      activePrograms: this.stats.activePrograms,
      cachedShaders: this.shaderCache.size,
      cacheHitRate: this.stats.compiledShaders > 0 ? (this.stats.cacheHits / this.stats.compiledShaders) * 100 : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      compiledPrograms: 0,
      compiledShaders: 0,
      activePrograms: this.programs.size,
      uniformUpdates: 0,
      cacheHits: 0,
      compilationErrors: 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ShaderPipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ShaderPipelineConfig {
    return { ...this.config };
  }

  /**
   * Destroy the shader pipeline
   */
  destroy(): void {
    // Delete all programs
    for (const id of this.programs.keys()) {
      this.deleteProgram(id);
    }

    // Clear cache
    for (const shader of this.shaderCache.values()) {
      this.gl.deleteShader(shader);
    }
    this.shaderCache.clear();

    this.activeProgram = null;
  }
}

// Built-in shader sources
export const BUILTIN_SHADERS = {
  // Basic sprite shader
  sprite: {
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      uniform mat4 u_projection;
      uniform mat4 u_model;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        gl_Position = u_projection * u_model * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `,
    fragment: `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_opacity;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * v_color * vec4(1.0, 1.0, 1.0, u_opacity);
      }
    `,
  },

  // Basic colored quad shader
  colored: {
    vertex: `
      attribute vec2 a_position;
      attribute vec4 a_color;
      
      uniform mat4 u_projection;
      uniform mat4 u_model;
      
      varying vec4 v_color;
      
      void main() {
        gl_Position = u_projection * u_model * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `,
    fragment: `
      precision mediump float;
      
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `,
  },

  // Particle shader
  particle: {
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_velocity;
      attribute float a_life;
      attribute float a_size;
      attribute vec4 a_color;
      
      uniform mat4 u_projection;
      uniform float u_time;
      uniform float u_pointSize;
      
      varying float v_life;
      varying vec4 v_color;
      
      void main() {
        vec2 pos = a_position + a_velocity * u_time;
        gl_Position = u_projection * vec4(pos, 0.0, 1.0);
        gl_PointSize = a_size * u_pointSize * a_life;
        
        v_life = a_life;
        v_color = a_color;
      }
    `,
    fragment: `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_opacity;
      
      varying float v_life;
      varying vec4 v_color;
      
      void main() {
        vec2 texCoord = gl_PointCoord;
        vec4 texColor = texture2D(u_texture, texCoord);
        
        gl_FragColor = texColor * v_color * vec4(1.0, 1.0, 1.0, v_life * u_opacity);
      }
    `,
  },
};

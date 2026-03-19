/**
 * GPU rendering systems index
 * Exports all GPU-related systems for WebGL acceleration
 */

export * from './WebGLContext';
export * from './ShaderPipeline';
export * from './GPUResourceManager';
export * from './GPUBatchRenderer';
export * from './GPURenderer';

// Global instances for easy access
export {
  webglContextManager,
} from './WebGLContext';

export {
  globalGPUResourceManager,
} from './GPUResourceManager';

export {
  globalGPURenderer,
} from './GPURenderer';

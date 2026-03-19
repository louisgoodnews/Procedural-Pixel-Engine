/**
 * Performance optimization systems index
 * Exports all performance-related systems for easy integration
 */

export * from './ObjectPool';
export * from './MemoryMonitor';
export * from './AssetManager';
export * from './FrustumCulling';
export * from './BatchRenderer';
export * from './FrameRateManager';
export * from './LODSystem';
export * from './PerformanceSystem';

// Global instances for easy access
export { globalPoolManager } from './ObjectPool';
export { globalMemoryMonitor } from './MemoryMonitor';
export { globalAssetManager } from './AssetManager';
export { globalFrustumCulling } from './FrustumCulling';
export { globalBatchRenderer } from './BatchRenderer';
export { globalFrameRateManager } from './FrameRateManager';
export { globalLODSystem } from './LODSystem';
export { globalPerformanceSystem } from './PerformanceSystem';

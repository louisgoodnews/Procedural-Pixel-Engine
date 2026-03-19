/**
 * Multithreading and Worker Thread Types
 * 
 * This file defines the types and interfaces for engine's multithreading system,
 * including worker pools, shared memory management, and parallel task execution.
 */

// Forward declaration for WorkerPool to avoid circular imports
export interface WorkerPool {
  submitTask(task: WorkerTask): Promise<WorkerTaskResult>;
  shutdown(): Promise<void>;
  getResource(): any;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  priority: TaskPriority;
  createdAt: number;
  timeout?: number;
}

export interface WorkerTaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  workerId: number;
}

export interface WorkerMetrics {
  workerId: number;
  tasksCompleted: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  currentTask?: WorkerTask;
  lastActivity: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  taskTimeout: number;
  maxMemoryUsage: number;
  enablePerformanceMonitoring: boolean;
}

export interface SharedMemoryBuffer {
  id: string;
  buffer: SharedArrayBuffer;
  size: number;
  type: 'physics' | 'particles' | 'rendering' | 'general';
  locked: boolean;
  owner?: string;
  createdAt: number;
  lastAccessed: number;
}

export interface ParallelPhysicsConfig {
  enableParallel: boolean;
  maxConcurrentSimulations: number;
  timestepMs: number;
  substeps: number;
  workerCount: number;
}

export interface ParallelParticleConfig {
  enableParallel: boolean;
  maxParticlesPerWorker: number;
  updateInterval: number;
  workerCount: number;
  sharedMemory: boolean;
}

export interface WorkerMessage {
  type: 'task' | 'result' | 'error' | 'init' | 'status' | 'metrics';
  data: any;
  timestamp: number;
  workerId?: number;
}

export interface WorkerStatus {
  workerId: number;
  status: 'idle' | 'busy' | 'initializing' | 'error' | 'terminated';
  currentTask?: string;
  lastHeartbeat: number;
}

// Resource interfaces for ECS integration
export interface WorkerPoolResource {
  availableWorkers: number;
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  performanceMetrics: WorkerMetrics[];
  config: WorkerPoolConfig;
}

export interface SharedMemoryResource {
  buffers: Map<string, SharedMemoryBuffer>;
  allocatedSize: number;
  maxCapacity: number;
  bufferCount: number;
}

export interface ParallelRenderConfig {
  enableParallel: boolean;
  maxEntitiesPerWorker: number;
  batchSize: number;
  workerCount: number;
  enableFrustumCulling: boolean;
}

export interface ParallelProcessingResource {
  physicsConfig: ParallelPhysicsConfig;
  particleConfig: ParallelParticleConfig;
  renderConfig: ParallelRenderConfig;
  activeWorkers: number;
  totalTasksProcessed: number;
  averageProcessingTime: number;
}

// Task types for specific systems
export interface PhysicsTask extends WorkerTask {
  type: 'physics-update';
  data: {
    entities: any[];
    deltaTime: number;
    substeps: number;
    worldBounds: any;
  };
}

export interface ParticleTask extends WorkerTask {
  type: 'particle-update';
  data: {
    particles: any[];
    deltaTime: number;
    forces: any[];
    constraints: any[];
  };
}

export interface RenderTask extends WorkerTask {
  type: 'render-batch';
  data: {
    entities: any[];
    deltaTime: number;
    viewport: any;
    camera: any;
    renderBounds: any;
  };
}

// Performance monitoring
export interface PerformanceSnapshot {
  timestamp: number;
  workerMetrics: WorkerMetrics[];
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  taskQueue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

// Error types
export interface WorkerError extends Error {
  workerId: number;
  taskId: string;
  errorType: 'timeout' | 'memory' | 'syntax' | 'runtime' | 'unknown';
  recoverable: boolean;
}

// Configuration for different worker types
export interface WorkerTypeConfig {
  physics: {
    scriptPath: string;
    maxMemory: number;
    timeout: number;
    maxConcurrentTasks: number;
  };
  particles: {
    scriptPath: string;
    maxMemory: number;
    timeout: number;
    maxConcurrentTasks: number;
  };
  rendering: {
    scriptPath: string;
    maxMemory: number;
    timeout: number;
    maxConcurrentTasks: number;
  };
  general: {
    scriptPath: string;
    maxMemory: number;
    timeout: number;
    maxConcurrentTasks: number;
  };
}

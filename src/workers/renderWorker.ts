/**
 * Render Worker Thread
 * 
 * Handles rendering calculations in a separate thread for parallel processing.
 * Supports culling, batching, and render data preparation.
 */

import { parentPort, workerData } from "node:worker_threads";
import type { WorkerMessage, WorkerTaskResult } from "../shared/types/multithreading";

// Render constants
const MAX_ENTITIES_PER_WORKER = 5000;
const FRUSTUM_PADDING = 100; // Extra padding for culling

interface RenderEntity {
  id: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  color: string;
  visible: boolean;
  layer: number;
  blueprint?: any;
}

interface Camera {
  position: { x: number; y: number };
  zoom: number;
  viewport: { x: number; y: number; width: number; height: number };
}

interface RenderBatch {
  layer: number;
  entities: RenderEntity[];
  material?: string;
  texture?: string;
}

/**
 * Render calculation functions
 */
class RenderCalculator {
  /**
   * Perform frustum culling
   */
  static frustumCulling(entities: RenderEntity[], camera: Camera): RenderEntity[] {
    const visibleEntities: RenderEntity[] = [];
    
    // Calculate camera bounds
    const cameraLeft = camera.position.x - (camera.viewport.width / 2) / camera.zoom - FRUSTUM_PADDING;
    const cameraRight = camera.position.x + (camera.viewport.width / 2) / camera.zoom + FRUSTUM_PADDING;
    const cameraTop = camera.position.y - (camera.viewport.height / 2) / camera.zoom - FRUSTUM_PADDING;
    const cameraBottom = camera.position.y + (camera.viewport.height / 2) / camera.zoom + FRUSTUM_PADDING;
    
    for (const entity of entities) {
      if (!entity.visible) continue;
      
      // Simple AABB culling
      const entityLeft = entity.position.x - entity.size.width / 2;
      const entityRight = entity.position.x + entity.size.width / 2;
      const entityTop = entity.position.y - entity.size.height / 2;
      const entityBottom = entity.position.y + entity.size.height / 2;
      
      // Check if entity is within camera bounds
      if (entityRight >= cameraLeft && entityLeft <= cameraRight &&
          entityBottom >= cameraTop && entityTop <= cameraBottom) {
        visibleEntities.push(entity);
      }
    }
    
    return visibleEntities;
  }

  /**
   * Sort entities by layer and other criteria
   */
  static sortEntities(entities: RenderEntity[]): RenderEntity[] {
    return entities.sort((a, b) => {
      // First sort by layer (ascending)
      if (a.layer !== b.layer) {
        return a.layer - b.layer;
      }
      
      // Then by Y position (for proper depth ordering)
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      
      // Finally by ID for consistency
      return a.id - b.id;
    });
  }

  /**
   * Create render batches
   */
  static createBatches(entities: RenderEntity[]): RenderBatch[] {
    const batches: Map<number, RenderBatch> = new Map();
    
    for (const entity of entities) {
      let batch = batches.get(entity.layer);
      
      if (!batch) {
        batch = {
          layer: entity.layer,
          entities: [],
          material: entity.blueprint?.material,
          texture: entity.blueprint?.texture
        };
        batches.set(entity.layer, batch);
      }
      
      batch.entities.push(entity);
    }
    
    return Array.from(batches.values());
  }

  /**
   * Calculate screen positions
   */
  static calculateScreenPositions(entities: RenderEntity[], camera: Camera): any[] {
    return entities.map(entity => {
      // Convert world position to screen position
      const screenX = (entity.position.x - camera.position.x) * camera.zoom + camera.viewport.width / 2;
      const screenY = (entity.position.y - camera.position.y) * camera.zoom + camera.viewport.height / 2;
      
      // Calculate screen size
      const screenWidth = entity.size.width * camera.zoom;
      const screenHeight = entity.size.height * camera.zoom;
      
      return {
        id: entity.id,
        x: screenX,
        y: screenY,
        width: screenWidth,
        height: screenHeight,
        rotation: entity.rotation,
        color: entity.color,
        layer: entity.layer,
        blueprint: entity.blueprint
      };
    });
  }

  /**
   * Optimize render data
   */
  static optimizeRenderData(batches: RenderBatch[]): RenderBatch[] {
    // Remove empty batches
    return batches.filter(batch => batch.entities.length > 0);
  }

  /**
   * Calculate LOD (Level of Detail)
   */
  static calculateLOD(entities: RenderEntity[], camera: Camera): any[] {
    return entities.map(entity => {
      const distance = Math.sqrt(
        (entity.position.x - camera.position.x) ** 2 + 
        (entity.position.y - camera.position.y) ** 2
      );
      
      let lod = 'high';
      if (distance > 1000) {
        lod = 'low';
      } else if (distance > 500) {
        lod = 'medium';
      }
      
      return {
        ...entity,
        lod,
        distance
      };
    });
  }
}

/**
 * Main worker message handler
 */
function handleMessage(message: WorkerMessage): void {
  switch (message.type) {
    case 'task':
      handleTask(message);
      break;
    case 'init':
      handleInit(message);
      break;
    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle render task
 */
async function handleTask(message: WorkerMessage): Promise<void> {
  const task = message.data;
  const startTime = performance.now();
  
  try {
    // Convert task data to render entities
    const entities: RenderEntity[] = task.data.entities.map((entityData: any) => ({
      id: entityData.id,
      position: { ...entityData.position },
      size: { ...entityData.size },
      rotation: entityData.rotation || 0,
      color: entityData.color || '#ffffff',
      visible: entityData.visible !== false,
      layer: entityData.renderLayer?.order || 0,
      blueprint: entityData.blueprint
    }));
    
    const camera: Camera = task.data.camera;
    
    // Render pipeline
    let visibleEntities = RenderCalculator.frustumCulling(entities, camera);
    visibleEntities = RenderCalculator.sortEntities(visibleEntities);
    
    // Apply LOD if enabled
    let entitiesWithLOD = visibleEntities;
    if (task.data.enableLOD) {
      entitiesWithLOD = RenderCalculator.calculateLOD(visibleEntities, camera);
    }
    
    const batches = RenderCalculator.createBatches(entitiesWithLOD);
    const optimizedBatches = RenderCalculator.optimizeRenderData(batches);
    
    // Calculate screen positions
    const renderData = optimizedBatches.map(batch => ({
      layer: batch.layer,
      material: batch.material,
      texture: batch.texture,
      entities: RenderCalculator.calculateScreenPositions(batch.entities, camera)
    }));
    
    const executionTime = performance.now() - startTime;
    
    const result: WorkerTaskResult = {
      taskId: task.id,
      success: true,
      data: {
        renderData,
        performanceMetrics: {
          totalEntities: entities.length,
          visibleEntities: visibleEntities.length,
          culledEntities: entities.length - visibleEntities.length,
          batchCount: renderData.length,
          executionTime
        }
      },
      executionTime,
      workerId: workerData.workerId
    };
    
    const response: WorkerMessage = {
      type: 'result',
      data: result,
      timestamp: Date.now(),
      workerId: workerData.workerId
    };
    
    parentPort?.postMessage(response);
    
  } catch (error) {
    const result: WorkerTaskResult = {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: performance.now() - startTime,
      workerId: workerData.workerId
    };
    
    const response: WorkerMessage = {
      type: 'error',
      data: result,
      timestamp: Date.now(),
      workerId: workerData.workerId
    };
    
    parentPort?.postMessage(response);
  }
}

/**
 * Handle worker initialization
 */
function handleInit(message: WorkerMessage): void {
  const response: WorkerMessage = {
    type: 'status',
    data: {
      status: 'initialized',
      workerId: workerData.workerId,
      capabilities: ['frustum-culling', 'batch-creation', 'lod-calculation'],
      maxEntities: MAX_ENTITIES_PER_WORKER
    },
    timestamp: Date.now(),
    workerId: workerData.workerId
  };
  
  parentPort?.postMessage(response);
}

// Set up message listener
if (parentPort) {
  parentPort.on('message', handleMessage);
  
  // Send initialization message
  const initMessage: WorkerMessage = {
    type: 'status',
    data: {
      status: 'ready',
      workerId: workerData.workerId
    },
    timestamp: Date.now(),
    workerId: workerData.workerId
  };
  
  parentPort.postMessage(initMessage);
} else {
  console.error('Render worker: parentPort is not available');
}

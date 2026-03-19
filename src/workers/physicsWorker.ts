/**
 * Physics Worker Thread
 * 
 * Handles physics calculations in a separate thread for parallel processing.
 * Supports collision detection, force application, and integration.
 */

import { parentPort, workerData } from "node:worker_threads";
import type { WorkerMessage, PhysicsTask, WorkerTaskResult } from "../shared/types/multithreading";

// Physics constants
const GRAVITY = 9.81 * 100; // pixels per second squared
const MAX_VELOCITY = 1000; // pixels per second
const MIN_VELOCITY = -1000;
const DAMPING = 0.99; // velocity damping factor

interface PhysicsEntity {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  radius: number;
  friction: number;
  restitution: number;
  isStatic: boolean;
}

interface CollisionPair {
  entityA: PhysicsEntity;
  entityB: PhysicsEntity;
  normal: { x: number; y: number };
  penetration: number;
}

/**
 * Physics calculation functions
 */
class PhysicsCalculator {
  /**
   * Update entity positions using Verlet integration
   */
  static integrate(entity: PhysicsEntity, deltaTime: number, substeps: number): void {
    if (entity.isStatic) return;

    const subDeltaTime = deltaTime / substeps;
    
    for (let i = 0; i < substeps; i++) {
      // Update velocity with acceleration
      entity.velocity.x += entity.acceleration.x * subDeltaTime;
      entity.velocity.y += entity.acceleration.y * subDeltaTime;
      
      // Apply gravity
      entity.velocity.y += GRAVITY * subDeltaTime;
      
      // Apply damping
      entity.velocity.x *= DAMPING;
      entity.velocity.y *= DAMPING;
      
      // Clamp velocity
      entity.velocity.x = Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, entity.velocity.x));
      entity.velocity.y = Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, entity.velocity.y));
      
      // Update position
      entity.position.x += entity.velocity.x * subDeltaTime;
      entity.position.y += entity.velocity.y * subDeltaTime;
      
      // Reset acceleration (will be recalculated next frame)
      entity.acceleration.x = 0;
      entity.acceleration.y = 0;
    }
  }

  /**
   * Detect collisions between entities
   */
  static detectCollisions(entities: PhysicsEntity[]): CollisionPair[] {
    const collisions: CollisionPair[] = [];
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        // Skip static-static collisions
        if (entityA.isStatic && entityB.isStatic) continue;
        
        // Calculate distance between centers
        const dx = entityB.position.x - entityA.position.x;
        const dy = entityB.position.y - entityA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if collision occurs
        const minDistance = entityA.radius + entityB.radius;
        if (distance < minDistance) {
          // Calculate collision normal
          const normal = { x: dx / distance, y: dy / distance };
          const penetration = minDistance - distance;
          
          collisions.push({
            entityA,
            entityB,
            normal,
            penetration
          });
        }
      }
    }
    
    return collisions;
  }

  /**
   * Resolve collisions using impulse-based resolution
   */
  static resolveCollisions(collisions: CollisionPair[]): void {
    for (const collision of collisions) {
      const { entityA, entityB, normal, penetration } = collision;
      
      // Separate entities
      const separationX = normal.x * penetration * 0.5;
      const separationY = normal.y * penetration * 0.5;
      
      if (!entityA.isStatic) {
        entityA.position.x -= separationX;
        entityA.position.y -= separationY;
      }
      
      if (!entityB.isStatic) {
        entityB.position.x += separationX;
        entityB.position.y += separationY;
      }
      
      // Calculate relative velocity
      const relativeVelocityX = entityB.velocity.x - entityA.velocity.x;
      const relativeVelocityY = entityB.velocity.y - entityA.velocity.y;
      
      // Calculate relative velocity along collision normal
      const velocityAlongNormal = relativeVelocityX * normal.x + relativeVelocityY * normal.y;
      
      // Don't resolve if velocities are separating
      if (velocityAlongNormal > 0) continue;
      
      // Calculate restitution
      const restitution = Math.min(entityA.restitution, entityB.restitution);
      
      // Calculate impulse scalar
      let impulseScalar = -(1 + restitution) * velocityAlongNormal;
      
      if (!entityA.isStatic && !entityB.isStatic) {
        impulseScalar /= 1 / entityA.mass + 1 / entityB.mass;
      } else if (entityA.isStatic) {
        impulseScalar /= 1 / entityB.mass;
      } else {
        impulseScalar /= 1 / entityA.mass;
      }
      
      // Apply impulse
      const impulseX = impulseScalar * normal.x;
      const impulseY = impulseScalar * normal.y;
      
      if (!entityA.isStatic) {
        entityA.velocity.x -= impulseX / entityA.mass;
        entityA.velocity.y -= impulseY / entityA.mass;
      }
      
      if (!entityB.isStatic) {
        entityB.velocity.x += impulseX / entityB.mass;
        entityB.velocity.y += impulseY / entityB.mass;
      }
    }
  }

  /**
   * Apply world boundaries
   */
  static applyWorldBounds(entities: PhysicsEntity[], bounds: { x: number; y: number; width: number; height: number }): void {
    for (const entity of entities) {
      if (entity.isStatic) continue;
      
      // Left boundary
      if (entity.position.x - entity.radius < bounds.x) {
        entity.position.x = bounds.x + entity.radius;
        entity.velocity.x = Math.abs(entity.velocity.x) * entity.restitution;
      }
      
      // Right boundary
      if (entity.position.x + entity.radius > bounds.x + bounds.width) {
        entity.position.x = bounds.x + bounds.width - entity.radius;
        entity.velocity.x = -Math.abs(entity.velocity.x) * entity.restitution;
      }
      
      // Top boundary
      if (entity.position.y - entity.radius < bounds.y) {
        entity.position.y = bounds.y + entity.radius;
        entity.velocity.y = Math.abs(entity.velocity.y) * entity.restitution;
      }
      
      // Bottom boundary
      if (entity.position.y + entity.radius > bounds.y + bounds.height) {
        entity.position.y = bounds.y + bounds.height - entity.radius;
        entity.velocity.y = -Math.abs(entity.velocity.y) * entity.restitution;
      }
    }
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
 * Handle physics task
 */
async function handleTask(message: WorkerMessage): Promise<void> {
  const task = message.data as PhysicsTask;
  const startTime = performance.now();
  
  try {
    // Convert task data to physics entities
    const entities: PhysicsEntity[] = task.data.entities.map((entityData: any) => ({
      id: entityData.id,
      position: { ...entityData.position },
      velocity: { ...entityData.velocity },
      acceleration: { ...entityData.acceleration || { x: 0, y: 0 } },
      mass: entityData.physicsBody?.mass || 1,
      radius: entityData.physicsBody?.radius || 16,
      friction: entityData.physicsBody?.friction || 0.5,
      restitution: entityData.physicsBody?.restitution || 0.8,
      isStatic: entityData.physicsBody?.isStatic || false
    }));
    
    // Physics update pipeline
    const collisions = PhysicsCalculator.detectCollisions(entities);
    PhysicsCalculator.resolveCollisions(collisions);
    
    for (const entity of entities) {
      PhysicsCalculator.integrate(entity, task.data.deltaTime, task.data.substeps);
    }
    
    PhysicsCalculator.applyWorldBounds(entities, task.data.worldBounds);
    
    // Convert back to task data format
    const updatedEntities = entities.map((entity: PhysicsEntity) => ({
      id: entity.id,
      position: { ...entity.position },
      velocity: { ...entity.velocity },
      acceleration: { ...entity.acceleration }
    }));
    
    const executionTime = performance.now() - startTime;
    
    const result: WorkerTaskResult = {
      taskId: task.id,
      success: true,
      data: {
        entities: updatedEntities,
        collisions: collisions.length,
        performanceMetrics: {
          entityCount: entities.length,
          collisionCount: collisions.length,
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
      capabilities: ['physics-calculation', 'collision-detection', 'force-integration']
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
  console.error('Physics worker: parentPort is not available');
}

/**
 * Particle Worker Thread
 * 
 * Handles particle calculations in a separate thread for parallel processing.
 * Supports particle physics, forces, constraints, and rendering preparation.
 */

import { parentPort, workerData } from "node:worker_threads";
import type { WorkerMessage, ParticleTask, WorkerTaskResult } from "../shared/types/multithreading";

// Particle constants
const MAX_PARTICLES_PER_WORKER = 10000;
const GRAVITY = { x: 0, y: 9.81 * 100 }; // pixels per second squared
const DRAG_COEFFICIENT = 0.01;
const TIME_STEP = 1 / 60; // 60 FPS

interface Particle {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  isActive: boolean;
}

interface Force {
  type: 'gravity' | 'wind' | 'point' | 'linear';
  strength: number;
  direction?: { x: number; y: number };
  position?: { x: number; y: number };
  radius?: number;
}

interface Constraint {
  type: 'distance' | 'spring';
  particleA: number;
  particleB: number;
  restLength: number;
  stiffness?: number;
  damping?: number;
}

/**
 * Particle calculation functions
 */
class ParticleCalculator {
  /**
   * Update particle positions and properties
   */
  static updateParticles(
    particles: Particle[], 
    deltaTime: number, 
    forces: Force[], 
    constraints: Constraint[]
  ): void {
    // Apply forces to particles
    for (const particle of particles) {
      if (!particle.isActive) continue;
      
      // Reset acceleration
      particle.acceleration.x = 0;
      particle.acceleration.y = 0;
      
      // Apply gravity
      particle.acceleration.x += GRAVITY.x;
      particle.acceleration.y += GRAVITY.y;
      
      // Apply custom forces
      for (const force of forces) {
        this.applyForce(particle, force);
      }
      
      // Apply drag
      const speed = Math.sqrt(particle.velocity.x ** 2 + particle.velocity.y ** 2);
      if (speed > 0) {
        const dragX = -DRAG_COEFFICIENT * particle.velocity.x * speed;
        const dragY = -DRAG_COEFFICIENT * particle.velocity.y * speed;
        particle.acceleration.x += dragX / particle.mass;
        particle.acceleration.y += dragY / particle.mass;
      }
      
      // Update velocity
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      
      // Update life
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        particle.isActive = false;
      }
    }
    
    // Apply constraints
    for (let i = 0; i < 3; i++) { // Multiple iterations for stability
      this.applyConstraints(particles, constraints);
    }
  }

  /**
   * Apply a force to a particle
   */
  private static applyForce(particle: Particle, force: Force): void {
    switch (force.type) {
      case 'gravity':
        particle.acceleration.x += force.direction?.x || 0;
        particle.acceleration.y += force.direction?.y || GRAVITY.y;
        break;
        
      case 'wind':
        particle.acceleration.x += (force.direction?.x || 1) * force.strength;
        particle.acceleration.y += (force.direction?.y || 0) * force.strength;
        break;
        
      case 'point':
        if (force.position && force.radius) {
          const dx = force.position.x - particle.position.x;
          const dy = force.position.y - particle.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < force.radius && distance > 0) {
            const strength = force.strength / (distance * distance);
            particle.acceleration.x += (dx / distance) * strength;
            particle.acceleration.y += (dy / distance) * strength;
          }
        }
        break;
        
      case 'linear':
        if (force.direction) {
          particle.acceleration.x += force.direction.x * force.strength;
          particle.acceleration.y += force.direction.y * force.strength;
        }
        break;
    }
  }

  /**
   * Apply constraints between particles
   */
  private static applyConstraints(particles: Particle[], constraints: Constraint[]): void {
    const particleMap = new Map<number, Particle>();
    for (const particle of particles) {
      particleMap.set(particle.id, particle);
    }
    
    for (const constraint of constraints) {
      const particleA = particleMap.get(constraint.particleA);
      const particleB = particleMap.get(constraint.particleB);
      
      if (!particleA || !particleB || !particleA.isActive || !particleB.isActive) continue;
      
      const dx = particleB.position.x - particleA.position.x;
      const dy = particleB.position.y - particleA.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) continue;
      
      switch (constraint.type) {
        case 'distance':
          if (distance !== constraint.restLength) {
            const correction = (constraint.restLength - distance) / distance;
            const halfCorrection = correction * 0.5;
            
            particleA.position.x -= dx * halfCorrection;
            particleA.position.y -= dy * halfCorrection;
            particleB.position.x += dx * halfCorrection;
            particleB.position.y += dy * halfCorrection;
          }
          break;
          
        case 'spring':
          const stiffness = constraint.stiffness || 0.5;
          const damping = constraint.damping || 0.1;
          const displacement = distance - constraint.restLength;
          const springForce = displacement * stiffness;
          
          const fx = (dx / distance) * springForce;
          const fy = (dy / distance) * springForce;
          
          particleA.acceleration.x += fx / particleA.mass;
          particleA.acceleration.y += fy / particleA.mass;
          particleB.acceleration.x -= fx / particleB.mass;
          particleB.acceleration.y -= fy / particleB.mass;
          break;
      }
    }
  }

  /**
   * Prepare render data for particles
   */
  static prepareRenderData(particles: Particle[]): any[] {
    return particles
      .filter(particle => particle.isActive)
      .map(particle => ({
        id: particle.id,
        x: particle.position.x,
        y: particle.position.y,
        radius: particle.radius,
        color: particle.color,
        alpha: Math.max(0, particle.life / particle.maxLife)
      }));
  }

  /**
   * Optimize particle list (remove dead particles, sort by type)
   */
  static optimizeParticles(particles: Particle[]): void {
    // Remove dead particles
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < particles.length; readIndex++) {
      if (particles[readIndex].isActive) {
        if (writeIndex !== readIndex) {
          particles[writeIndex] = particles[readIndex];
        }
        writeIndex++;
      }
    }
    
    // Trim array
    particles.length = writeIndex;
    
    // Sort by color for potential batching
    particles.sort((a, b) => a.color.localeCompare(b.color));
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
 * Handle particle task
 */
async function handleTask(message: WorkerMessage): Promise<void> {
  const task = message.data as ParticleTask;
  const startTime = performance.now();
  
  try {
    // Convert task data to particles
    const particles: Particle[] = task.data.particles.map((particleData: any) => ({
      id: particleData.id,
      position: { ...particleData.position },
      velocity: { ...particleData.velocity },
      acceleration: { ...particleData.acceleration || { x: 0, y: 0 } },
      mass: particleData.mass || 1,
      radius: particleData.radius || 2,
      color: particleData.color || '#ffffff',
      life: particleData.life || 1,
      maxLife: particleData.maxLife || 1,
      isActive: particleData.isActive !== false
    }));
    
    // Particle update pipeline
    ParticleCalculator.updateParticles(
      particles, 
      task.data.deltaTime, 
      task.data.forces || [], 
      task.data.constraints || []
    );
    
    ParticleCalculator.optimizeParticles(particles);
    
    const renderData = ParticleCalculator.prepareRenderData(particles);
    
    const executionTime = performance.now() - startTime;
    
    const result: WorkerTaskResult = {
      taskId: task.id,
      success: true,
      data: {
        particles: particles.map(p => ({
          id: p.id,
          position: { ...p.position },
          velocity: { ...p.velocity },
          life: p.life,
          isActive: p.isActive
        })),
        renderData,
        performanceMetrics: {
          particleCount: particles.length,
          activeCount: particles.filter(p => p.isActive).length,
          executionTime,
          memoryUsage: particles.length * 64 // Rough estimate
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
      capabilities: ['particle-update', 'force-application', 'constraint-resolution'],
      maxParticles: MAX_PARTICLES_PER_WORKER
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
  console.error('Particle worker: parentPort is not available');
}

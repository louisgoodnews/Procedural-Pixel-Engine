/**
 * Procedural Pixel Engine - Core Engine Module
 * 
 * This module provides the core engine functionality including:
 * - Entity Component System (ECS)
 * - World management
 * - Component definitions
 * - System execution
 * - Resource management
 */

// Core ECS classes
export { World, System } from './World';
export type { WorldSnapshot, SerializedEntityRecord } from './World';

// Core types and interfaces
export type { 
  EngineComponents,
  CameraResource,
  ViewportResource,
  ActiveParticle
} from './types';

// Input handling
export { InputState } from './InputState';

// Snapshot service for save/load functionality
export { SnapshotService } from './SnapshotService';

// Re-export Entity type from shared types
export type { Entity as SharedEntity } from '../shared/types';

// Entity class for convenience
export class EngineEntity {
  public readonly id: number;
  public readonly components = new Map<string, any>();

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Add a component to this entity
   */
  addComponent<T>(type: string, component: T): void {
    this.components.set(type, component);
  }

  /**
   * Get a component from this entity
   */
  getComponent<T>(type: string): T | undefined {
    return this.components.get(type);
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(type: string): boolean {
    return this.components.delete(type);
  }

  /**
   * Check if entity has a component
   */
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all component types
   */
  getComponentTypes(): string[] {
    return Array.from(this.components.keys());
  }
}

// Core engine class that ties everything together
export class Engine {
  private world: World<any, any>;
  private isRunning = false;
  private lastTime = 0;
  private targetFPS = 60;
  private frameTime = 1000 / this.targetFPS;

  constructor() {
    // Initialize with default component types
    this.world = new World();
  }

  /**
   * Start the engine main loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Engine is already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the engine main loop
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Execute update systems
    this.world.update(deltaTime);

    // Execute render systems
    this.world.render(deltaTime);

    // Schedule next frame
    setTimeout(() => {
      requestAnimationFrame(() => this.gameLoop());
    }, Math.max(0, this.frameTime - (performance.now() - currentTime)));
  }

  /**
   * Get the world instance
   */
  getWorld(): World<any, any> {
    return this.world;
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameTime = 1000 / fps;
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    return this.targetFPS;
  }

  /**
   * Check if engine is running
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Destroy the engine and clean up resources
   */
  destroy(): void {
    this.stop();
    this.world.destroy();
  }
}

// Component base class
export abstract class Component {
  public abstract readonly type: string;
  public abstract readonly data: any;
}

// System base class
export abstract class BaseSystem {
  public abstract readonly name: string;
  
  abstract initialize(world: World<any, any>): void;
  abstract execute(world: World<any, any>, deltaTime: number): void;
}

// Query class for entity filtering
export class Query {
  private components: string[] = [];
  private excludeComponents: string[] = [];

  /**
   * Query for entities with specific components
   */
  with(...components: string[]): Query {
    this.components.push(...components);
    return this;
  }

  /**
   * Query for entities without specific components
   */
  without(...components: string[]): Query {
    this.excludeComponents.push(...components);
    return this;
  }

  /**
   * Execute query against world
   */
  execute(world: World<any, any>): EngineEntity[] {
    const entities = world.getEntities();
    
    return entities.filter(entity => {
      // Check required components
      for (const component of this.components) {
        if (!entity.hasComponent(component)) {
          return false;
        }
      }

      // Check excluded components
      for (const component of this.excludeComponents) {
        if (entity.hasComponent(component)) {
          return false;
        }
      }

      return true;
    });
  }
}

// Resource management
export abstract class Resource {
  public abstract readonly type: string;
  public abstract readonly data: any;
}

// Utility functions
export function createEntity(id?: number): EngineEntity {
  const entityId = id ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  return new EngineEntity(entityId);
}

export function createQuery(): Query {
  return new Query();
}

export function createEngine(): Engine {
  return new Engine();
}

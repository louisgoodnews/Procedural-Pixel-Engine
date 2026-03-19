import type { Entity } from "../shared/types";

type ComponentRecord = object;
type ResourceRecord = object;
type EntityId = Entity["id"];
type ComponentKey<TComponents extends ComponentRecord> = Extract<keyof TComponents, string>;
type ResourceKey<TResources extends ResourceRecord> = Extract<keyof TResources, string>;

interface EntityRecord<TComponents extends ComponentRecord> {
  entity: Entity;
  components: Partial<TComponents>;
}

export interface System<TComponents extends ComponentRecord, TResources extends ResourceRecord> {
  initialize?(world: World<TComponents, TResources>): void;
  execute(world: World<TComponents, TResources>, deltaTime: number): void;
}

export interface SerializedEntityRecord<TComponents extends ComponentRecord> {
  components: Partial<TComponents>;
  id: EntityId;
}

export interface WorldSnapshot<
  TComponents extends ComponentRecord,
  TResources extends ResourceRecord = Record<string, never>,
> {
  createdAt: string;
  entities: Array<SerializedEntityRecord<TComponents>>;
  nextEntityId: number;
  resources: Partial<TResources>;
}

export class World<
  TComponents extends ComponentRecord,
  TResources extends ResourceRecord = Record<string, never>,
> {
  private readonly entities = new Map<EntityId, EntityRecord<TComponents>>();
  private readonly updateSystems: Array<System<TComponents, TResources>> = [];
  private readonly renderSystems: Array<System<TComponents, TResources>> = [];
  private readonly resources = new Map<
    ResourceKey<TResources>,
    TResources[ResourceKey<TResources>]
  >();
  private readonly queryCache = new Map<string, Entity[]>();
  private lastSystemBenchmarks: Array<{
    durationMs: number;
    phase: "render" | "update";
    systemName: string;
  }> = [];
  private nextEntityId = 1;
  private started = false;

  createEntity(): Entity {
    const entity: Entity = { id: this.nextEntityId++ };
    this.entities.set(entity.id, {
      entity,
      components: {},
    });
    this.invalidateQueryCache();
    return entity;
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity.id);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  addComponent<TKey extends ComponentKey<TComponents>>(
    entity: Entity,
    key: TKey,
    component: TComponents[TKey],
  ): TComponents[TKey] {
    const record = this.entities.get(entity.id);
    if (!record) {
      throw new Error(`Entity ${entity.id} does not exist.`);
    }

    record.components[key] = component;
    this.invalidateQueryCache();
    return component;
  }

  addComponents(entity: Entity, components: Partial<TComponents>): void {
    const record = this.entities.get(entity.id);
    if (!record) {
      throw new Error(`Entity ${entity.id} does not exist.`);
    }

    Object.assign(record.components, components);
    this.invalidateQueryCache();
  }

  getComponent<TKey extends ComponentKey<TComponents>>(
    entity: Entity,
    key: TKey,
  ): TComponents[TKey] | undefined {
    return this.entities.get(entity.id)?.components[key] as TComponents[TKey] | undefined;
  }

  removeComponent<TKey extends ComponentKey<TComponents>>(entity: Entity, key: TKey): boolean {
    const record = this.entities.get(entity.id);
    if (!record || !(key in record.components)) {
      return false;
    }

    delete record.components[key];
    this.invalidateQueryCache();
    return true;
  }

  destroyEntity(entity: Entity): boolean {
    const deleted = this.entities.delete(entity.id);
    if (deleted) {
      this.invalidateQueryCache();
    }
    return deleted;
  }

  getEntitiesWith<TKey extends ComponentKey<TComponents>>(...keys: TKey[]): readonly Entity[] {
    const cacheKey = keys.slice().sort().join("|");
    const cached = this.queryCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const matches: Entity[] = [];

    for (const record of this.entities.values()) {
      const hasAllComponents = keys.every((key) => record.components[key] !== undefined);

      if (hasAllComponents) {
        matches.push(record.entity);
      }
    }

    this.queryCache.set(cacheKey, matches);
    return matches;
  }

  getEntities(): Entity[] {
    return Array.from(this.entities.values()).map(record => record.entity);
  }

  addSystem(
    system: System<TComponents, TResources>,
    phase: "startup" | "update" | "render" = "update",
  ): void {
    if (phase === "startup") {
      system.initialize?.(this);
      return;
    }

    if (phase === "render") {
      this.renderSystems.push(system);
      return;
    }

    this.updateSystems.push(system);
  }

  start(): void {
    if (this.started) {
      return;
    }

    for (const system of this.updateSystems) {
      system.initialize?.(this);
    }

    for (const system of this.renderSystems) {
      system.initialize?.(this);
    }

    this.started = true;
  }

  setResource<TKey extends ResourceKey<TResources>>(
    key: TKey,
    value: TResources[TKey],
  ): TResources[TKey] {
    this.resources.set(key, value);
    return value;
  }

  getResource<TKey extends ResourceKey<TResources>>(key: TKey): TResources[TKey] | undefined {
    return this.resources.get(key) as TResources[TKey] | undefined;
  }

  update(deltaTime: number): void {
    this.start();
    this.lastSystemBenchmarks = this.runSystems(this.updateSystems, "update", deltaTime);
  }

  render(deltaTime: number): void {
    this.start();
    this.lastSystemBenchmarks = [
      ...this.lastSystemBenchmarks.filter((entry) => entry.phase === "update"),
      ...this.runSystems(this.renderSystems, "render", deltaTime),
    ];
  }

  getSystemBenchmarks(): ReadonlyArray<{
    durationMs: number;
    phase: "render" | "update";
    systemName: string;
  }> {
    return this.lastSystemBenchmarks;
  }

  createSnapshot<TKey extends ResourceKey<TResources>>(
    resourceKeys: readonly TKey[] = [],
  ): WorldSnapshot<TComponents, Pick<TResources, TKey>> {
    const resources = Object.fromEntries(
      resourceKeys.map((key) => [key, this.cloneSerializable(this.resources.get(key))]),
    ) as Pick<TResources, TKey>;

    return {
      createdAt: new Date().toISOString(),
      entities: Array.from(this.entities.values()).map((record) => ({
        components: this.cloneSerializable(record.components),
        id: record.entity.id,
      })),
      nextEntityId: this.nextEntityId,
      resources,
    };
  }

  restoreSnapshot<TKey extends ResourceKey<TResources>>(
    snapshot: WorldSnapshot<TComponents, Pick<TResources, TKey>>,
  ): void {
    this.entities.clear();

    for (const record of snapshot.entities) {
      this.entities.set(record.id, {
        entity: { id: record.id },
        components: this.cloneSerializable(record.components),
      });
    }

    this.nextEntityId = snapshot.nextEntityId;

    for (const [key, value] of Object.entries(snapshot.resources) as Array<
      [TKey, TResources[TKey]]
    >) {
      this.resources.set(key, this.cloneSerializable(value));
    }

    this.invalidateQueryCache();
  }

  private invalidateQueryCache(): void {
    this.queryCache.clear();
  }

  private runSystems(
    systems: Array<System<TComponents, TResources>>,
    phase: "render" | "update",
    deltaTime: number,
  ): Array<{ durationMs: number; phase: "render" | "update"; systemName: string }> {
    return systems.map((system) => {
      const startedAt = performance.now();
      system.execute(this, deltaTime);
      return {
        durationMs: performance.now() - startedAt,
        phase,
        systemName: system.constructor.name || "AnonymousSystem",
      };
    });
  }

  private cloneSerializable<TValue>(value: TValue): TValue {
    if (value === undefined || value === null) {
      return value;
    }

    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  destroy(): void {
    this.entities.clear();
    this.updateSystems.length = 0;
    this.renderSystems.length = 0;
    this.resources.clear();
    this.queryCache.clear();
    this.lastSystemBenchmarks.length = 0;
    this.started = false;
  }
}

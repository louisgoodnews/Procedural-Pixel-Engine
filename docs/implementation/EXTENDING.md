# Extending The Engine

## Add A Component

1. Add the component shape to [types.ts](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/src/game/types.ts#L1) or [types.ts](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/src/engine/types.ts#L1), depending on whether it is game-specific or engine-level.
2. Attach it to entities with `world.addComponent()` or `world.addComponents()`.
3. Query it from systems with `world.getEntitiesWith(...)`.

## Add A System

1. Create a new system file under `src/engine/systems/` for engine behavior or `src/game/systems/` for game behavior.
2. Implement the `System<TComponents, TResources>` interface from [World.ts](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/src/engine/World.ts#L1).
3. Register it in renderer bootstrap.

## Add An Entity

1. Add or load the required blueprint.
2. Spawn the entity in [scene.ts](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/src/game/scene.ts#L1).
3. Add the components needed by the systems that should affect it.

## Rule Of Thumb

- Engine code should stay generic.
- Game code should decide what exists in the scene.
- Shared types should stay minimal and stable.

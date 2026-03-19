# ECS Conventions

## Components

- Components are plain data objects with no behavior.
- Component names should describe data, not actions.
- Optional fields should be avoided unless they are required by the domain.

## Systems

- Systems own behavior and side effects.
- `initialize()` is for one-time setup that depends on world resources.
- `execute()` should stay allocation-light and deterministic.
- Update systems should mutate state. Render systems should read state and draw output.

## Resources

- Shared runtime services belong in typed resources, not global variables.
- Renderer resources should be registered during bootstrap.
- New resources should be added to the engine resource interface before use.

## Queries

- Use `getEntitiesWith()` for component-based iteration.
- Group common component assignment with `addComponents()` during entity creation.
- Prefer broad, stable query shapes over ad hoc branching inside hot loops.

## Entity Lifecycle

- Entities are created through `createEntity()`.
- Components may be added or removed over time.
- Entity deletion should happen through `destroyEntity()` only.

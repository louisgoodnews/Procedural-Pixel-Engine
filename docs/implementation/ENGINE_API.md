# Engine Runtime API

Schema version: `1`

This document describes the stable automation-facing runtime surface exposed through
`window.api.engine`.

## Permissions

Use `getSessionPermissions()` or `getApiManifest()` to inspect capability boundaries.

- `editor`: project, asset-management, exports
- `filesystem`: blueprints, logic-assets, scenes, asset-bundles
- `runtime`: entities, headless-simulation, logic-graphs, snapshots

## Supported methods

- `createHeadlessSession({ entities?, viewport? })`
- `disposeHeadlessSession(sessionId)`
- `listAssets()`
- `listEntities(sessionId)`
- `spawnEntity(sessionId, request)`
- `destroyEntity(sessionId, entityId)`
- `modifyComponent(sessionId, patch)`
- `setLogicGraph(sessionId, patch)`
- `snapshotWorld(sessionId)`
- `listSnapshots(sessionId)`
- `restoreSnapshot(sessionId, snapshotIndex)`
- `stepHeadlessSession(sessionId, { frames, inputsByStep?, stepMs })`
- `runHeadlessSimulation(request)`
- `getSessionEventLog(sessionId)`
- `getSessionSyncState(sessionId)`
- `getSessionPermissions()`
- `getApiManifest()`

## Session model

Each headless session is isolated and returns a `sessionId`.

The sync payload returned by `getSessionSyncState(sessionId)` is shaped like:

```ts
{
  sessionId: string;
  frame: number;
  entities: EngineEntitySnapshot[];
  snapshots: Array<{ index: number; capturedAtFrame: number }>;
  events: EngineRuntimeEvent[];
}
```

## Runtime events

`getSessionEventLog(sessionId)` returns append-only observable events for automation and replay:

- `session-created`
- `session-disposed`
- `entity-spawned`
- `entity-destroyed`
- `component-modified`
- `logic-graph-set`
- `snapshot-created`
- `snapshot-restored`
- `step-completed`

Every event contains:

```ts
{
  sessionId: string;
  sequence: number;
  frame: number;
  eventType: string;
  payload: Record<string, unknown>;
}
```

## Physics-ready entity payloads

`spawnEntity()` and `EngineEntitySnapshot` support optional physics fields:

```ts
{
  collider?: {
    shape: "rect" | "circle";
    layer: string;
    mask: string[];
    width?: number;
    height?: number;
    radius?: number;
    isTrigger?: boolean;
    offsetX?: number;
    offsetY?: number;
  };
  physicsBody?: {
    bodyType: "dynamic" | "kinematic" | "static";
    gravityScale?: number;
    friction?: number;
    restitution?: number;
    constraintToViewport?: boolean;
  };
}
```

## Stability notes

- Session events are deterministic for a given input stream and step size.
- `stepHeadlessSession()` is the preferred API for training, replay, and future networking.
- Renderer internals are intentionally excluded from this contract.

# Blueprint Authoring

## Goal

Blueprints define procedural pixel art without external image files. They live in `assets/blueprints/` and use the schema documented in [BLUEPRINTS.md](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/BLUEPRINTS.md).

## Example Blueprint

```json
{
  "name": "signpost",
  "schemaVersion": 1,
  "revision": 1,
  "updatedAt": "2026-03-15T00:00:00.000Z",
  "zone": "starter-plains",
  "matrix": [
    ["", "W", "W", ""],
    ["", "W", "W", ""],
    ["", "", "W", ""],
    ["", "", "W", ""]
  ],
  "colorMap": {
    "W": "#8b5e3c"
  },
  "pixelSize": 10
}
```

## Authoring Tips

- Keep `matrix` rectangular. Every row should have the same width.
- Use short color tokens like `S`, `H`, `W`, or `L` for readability.
- Group blueprints by `zone` so content loading can evolve cleanly later.
- Start with a low `pixelSize` and scale up in the engine.

## Procedural Helpers

The helpers in [proceduralSprites.ts](/home/louisgoodnews/Programmierung/Javascript/Procedural Pixel Engine/src/shared/proceduralSprites.ts#L1) can be used to generate or transform sprite matrices:

```ts
import { createMatrix, stampMatrix, mirrorHorizontally } from "../src/shared/proceduralSprites";

const base = createMatrix(4, 4);
const eye = [["E"]];
const face = stampMatrix(base, eye, 1, 1);
const mirrored = mergeMatrices(face, mirrorHorizontally(face));
```

## Recommended Workflow

1. Create a new JSON file in `assets/blueprints/`.
2. Keep `revision` at `1` for new content.
3. Launch the app and watch the HUD for skipped-blueprint warnings.
4. If the blueprint loads successfully, wire it into the game scene.

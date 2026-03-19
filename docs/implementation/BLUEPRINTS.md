# Blueprint Format

## Schema

Blueprint files live in `assets/blueprints/*.json`.

Required fields:

- `name`: unique blueprint identifier
- `schemaVersion`: currently `1`
- `revision`: positive integer incremented on each successful save
- `updatedAt`: ISO timestamp for the latest save
- `zone`: logical content grouping such as `starter-plains`
- `matrix`: rectangular 2D string matrix of color keys
- `colorMap`: record of color keys to CSS color values
- `pixelSize`: positive number for draw scale

## Load Behavior

- valid blueprints are loaded into the runtime catalog
- malformed blueprints are skipped and returned as load issues
- default blueprints are seeded at startup if missing

## Save Behavior

- names are normalized to lowercase file-safe identifiers
- `schemaVersion` is enforced as `1`
- `revision` increments on each save
- `updatedAt` is replaced with the current timestamp

## Caching

The main-process repository caches parsed blueprints by filename and serialized content.
If the file contents are unchanged, the cached blueprint is reused instead of reparsed.

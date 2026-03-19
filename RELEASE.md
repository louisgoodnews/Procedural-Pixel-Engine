# Packaging And Release Workflow

## Current State

The project supports local development and renderer builds. Desktop packaging is documented here as the next contributor-facing workflow, but automated installers are not configured yet.

## Recommended Release Flow

1. Run `bun run check`
2. Run `bun run test`
3. Run `bun run lint`
4. Run `bun run perf:ecs`
5. Run `bun run build`
6. Launch Electron against the built renderer for a manual smoke test

## Future Packaging Step

Recommended next packaging addition:

- add `electron-builder` or `electron-forge`
- create per-platform output targets
- add versioned release artifacts
- document signing/notarization separately once packaging is automated

## Manual Release Checklist

- confirm blueprint files are valid JSON
- confirm debug HUD shows loaded blueprints with no skipped files
- confirm keyboard input, camera follow, and render ordering still work
- tag the release only after automated checks and manual smoke test pass

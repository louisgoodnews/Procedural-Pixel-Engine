import type { World } from "../engine/World";
import type { EngineResources } from "../engine/types";
import type { BlueprintCatalog, PixelBlueprint } from "../shared/types";
import type { GameComponents } from "./types";

function findBlueprint(
  catalog: BlueprintCatalog,
  name: string,
): PixelBlueprint | undefined {
  return catalog.blueprints.find((entry) => entry.name === name);
}

export function createGameScene(
  world: World<GameComponents, EngineResources>,
  catalog: BlueprintCatalog,
  fallbacks: {
    player?: PixelBlueprint;
    villager?: PixelBlueprint;
    shrine?: PixelBlueprint;
  },
): void {
  const playerBlueprint = findBlueprint(catalog, "player") ?? fallbacks.player;
  const villagerBlueprint = findBlueprint(catalog, "villager") ?? fallbacks.villager;
  const shrineBlueprint = findBlueprint(catalog, "shrine") ?? fallbacks.shrine;

  // Create player entity only if blueprint is available
  if (playerBlueprint) {
    const player = world.createEntity();
    world.addComponents(player, {
      blueprintRef: { name: playerBlueprint.name },
      pixelArt: playerBlueprint,
      playerController: { speed: 140 },
      position: { x: 96, y: 96 },
      renderLayer: { order: 20 },
      velocity: { x: 0, y: 0 },
    });
  }

  // Create villager entity only if blueprint is available
  if (villagerBlueprint) {
    const villager = world.createEntity();
    world.addComponents(villager, {
      blueprintRef: { name: villagerBlueprint.name },
      dialogueAnchor: { label: "Caretaker" },
      pixelArt: villagerBlueprint,
      position: { x: 180, y: 112 },
      renderLayer: { order: 15 },
      velocity: { x: 0, y: 0 },
    });
  }

  // Create shrine entity only if blueprint is available
  if (shrineBlueprint) {
    const shrine = world.createEntity();
    world.addComponents(shrine, {
      blueprintRef: { name: shrineBlueprint.name },
      pixelArt: shrineBlueprint,
      position: { x: 224, y: 80 },
      renderLayer: { order: 10 },
      velocity: { x: 0, y: 0 },
    });

    // Create additional shrine entities if blueprint is available
    const shrineA = world.createEntity();
    world.addComponents(shrineA, {
      blueprintRef: { name: shrineBlueprint.name },
      dialogueAnchor: { label: "North Shrine" },
      pixelArt: shrineBlueprint,
      position: { x: 260, y: 160 },
      renderLayer: { order: 5 },
      velocity: { x: 0, y: 0 },
    });

    const shrineB = world.createEntity();
    world.addComponents(shrineB, {
      blueprintRef: { name: shrineBlueprint.name },
      dialogueAnchor: { label: "East Shrine" },
      pixelArt: shrineBlueprint,
      position: { x: 420, y: 260 },
      renderLayer: { order: 5 },
      velocity: { x: 0, y: 0 },
    });
  }
}

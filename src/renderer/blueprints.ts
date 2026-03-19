import type { BlueprintCatalog } from "../shared/types";

export async function listBlueprintFiles(): Promise<string[]> {
  return window.api.listBlueprints();
}

export async function loadBlueprintCatalog(): Promise<BlueprintCatalog> {
  const catalog = await window.api.loadBlueprintCatalog();

  for (const issue of catalog.issues) {
    console.warn(`Blueprint issue in ${issue.fileName}: ${issue.message}`);
  }

  // Return catalog as-is without hardcoded dependencies
  // The engine should work with any available blueprints or none at all
  return catalog;
}

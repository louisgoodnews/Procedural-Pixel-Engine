import type { WorldScene } from "../shared/types";

export async function listSceneFiles(): Promise<string[]> {
  return window.api.listScenes();
}

export async function loadWorldScene(name: string): Promise<WorldScene> {
  return window.api.loadScene(name);
}

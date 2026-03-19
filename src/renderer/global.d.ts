import type { IGameAPI } from "../shared/api";

declare global {
  interface Window {
    api: IGameAPI;
  }
}

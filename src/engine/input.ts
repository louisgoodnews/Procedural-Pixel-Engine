import type { InputAction } from "../shared/types";

export type InputBindings = Record<InputAction, string[]>;

export const defaultInputBindings: InputBindings = {
  move_left: ["ArrowLeft", "KeyA"],
  move_right: ["ArrowRight", "KeyD"],
  move_up: ["ArrowUp", "KeyW"],
  move_down: ["ArrowDown", "KeyS"],
  confirm: ["Enter", "Space"],
  cancel: ["Escape", "Backspace"],
};

import type { InputAction } from "../shared/types";
import type { InputBindings } from "./input";

export class InputState {
  private readonly pressedKeys = new Set<string>();
  private readonly bindings: InputBindings;
  private onKeyDown?: (event: KeyboardEvent) => void;
  private onKeyUp?: (event: KeyboardEvent) => void;

  constructor(bindings: InputBindings) {
    this.bindings = bindings;
  }

  attach(target: Window = window): void {
    this.onKeyDown = (event) => {
      this.pressedKeys.add(event.code);
    };

    this.onKeyUp = (event) => {
      this.pressedKeys.delete(event.code);
    };

    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
  }

  isPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  isActionPressed(action: InputAction): boolean {
    return this.bindings[action].some((code) => this.pressedKeys.has(code));
  }

  getAxis(negative: InputAction, positive: InputAction): number {
    const positiveValue = this.isActionPressed(positive) ? 1 : 0;
    const negativeValue = this.isActionPressed(negative) ? 1 : 0;
    return positiveValue - negativeValue;
  }
}

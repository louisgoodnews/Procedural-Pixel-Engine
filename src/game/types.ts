import type { EngineComponents } from "../engine/types";

export interface PlayerControllerComponent {
  speed: number;
}

export interface DialogueAnchorComponent {
  label: string;
}

export interface BlueprintReferenceComponent {
  name: string;
  preview?: boolean;
}

export interface GameComponents extends EngineComponents {
  blueprintRef: BlueprintReferenceComponent;
  dialogueAnchor: DialogueAnchorComponent;
  playerController: PlayerControllerComponent;
}

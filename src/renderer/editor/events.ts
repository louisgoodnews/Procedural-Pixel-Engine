import type { PixelBlueprint } from "../../shared/types";

const blueprintEditorBus = new EventTarget();

interface StressTestRequest {
  actorCount: number;
  propCount: number;
}

interface RuntimeTraceUpdate {
  snapshotOffsetMs: number;
  tracedNodesByAsset: Record<string, string[]>;
}

export function emitBlueprintPreviewUpdated(blueprint: PixelBlueprint): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<PixelBlueprint>("blueprint-preview-updated", {
      detail: blueprint,
    }),
  );
}

export function onBlueprintPreviewUpdated(
  listener: (blueprint: PixelBlueprint) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PixelBlueprint>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("blueprint-preview-updated", handler);
  return () => {
    blueprintEditorBus.removeEventListener("blueprint-preview-updated", handler);
  };
}

export function emitBlueprintRequested(blueprint: PixelBlueprint): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<PixelBlueprint>("blueprint-requested", {
      detail: blueprint,
    }),
  );
}

export function onBlueprintRequested(listener: (blueprint: PixelBlueprint) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PixelBlueprint>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("blueprint-requested", handler);
  return () => {
    blueprintEditorBus.removeEventListener("blueprint-requested", handler);
  };
}

export function emitBlueprintPersisted(blueprint: PixelBlueprint): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<PixelBlueprint>("blueprint-persisted", {
      detail: blueprint,
    }),
  );
}

export function onBlueprintPersisted(listener: (blueprint: PixelBlueprint) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PixelBlueprint>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("blueprint-persisted", handler);
  return () => {
    blueprintEditorBus.removeEventListener("blueprint-persisted", handler);
  };
}

export function emitBlueprintSelected(blueprint: PixelBlueprint): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<PixelBlueprint>("blueprint-selected", {
      detail: blueprint,
    }),
  );
}

export function onBlueprintSelected(listener: (blueprint: PixelBlueprint) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PixelBlueprint>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("blueprint-selected", handler);
  return () => {
    blueprintEditorBus.removeEventListener("blueprint-selected", handler);
  };
}

export function emitStressTestRequested(request: StressTestRequest): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<StressTestRequest>("stress-test-requested", {
      detail: request,
    }),
  );
}

export function onStressTestRequested(listener: (request: StressTestRequest) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<StressTestRequest>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("stress-test-requested", handler);
  return () => {
    blueprintEditorBus.removeEventListener("stress-test-requested", handler);
  };
}

export function emitRuntimeTraceUpdated(update: RuntimeTraceUpdate): void {
  blueprintEditorBus.dispatchEvent(
    new CustomEvent<RuntimeTraceUpdate>("runtime-trace-updated", {
      detail: update,
    }),
  );
}

export function onRuntimeTraceUpdated(listener: (update: RuntimeTraceUpdate) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<RuntimeTraceUpdate>;
    listener(customEvent.detail);
  };

  blueprintEditorBus.addEventListener("runtime-trace-updated", handler);
  return () => {
    blueprintEditorBus.removeEventListener("runtime-trace-updated", handler);
  };
}

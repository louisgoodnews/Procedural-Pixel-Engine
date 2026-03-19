import type { WorldSnapshot } from "./World";
import type { World } from "./World";

export interface SnapshotServiceOptions {
  captureIntervalMs?: number;
  historyWindowMs?: number;
}

export interface SnapshotEntry<
  TComponents extends object,
  TResources extends object = Record<string, never>,
> {
  buffer: Uint8Array;
  capturedAtMs: number;
}

export class SnapshotService<
  TComponents extends object,
  TResources extends object = Record<string, never>,
> {
  private readonly captureIntervalMs: number;
  private readonly decoder = new TextDecoder();
  private readonly encoder = new TextEncoder();
  private readonly historyWindowMs: number;
  private readonly snapshots: Array<SnapshotEntry<TComponents, TResources>> = [];
  private lastCaptureAtMs = Number.NEGATIVE_INFINITY;

  constructor(options: SnapshotServiceOptions = {}) {
    this.captureIntervalMs = options.captureIntervalMs ?? 100;
    this.historyWindowMs = options.historyWindowMs ?? 10_000;
  }

  capture(world: World<TComponents, TResources>, nowMs: number): void {
    this.captureWithResources(world, nowMs, []);
  }

  captureWithResources<TKey extends Extract<keyof TResources, string>>(
    world: World<TComponents, TResources>,
    nowMs: number,
    resourceKeys: readonly TKey[],
  ): void {
    if (nowMs - this.lastCaptureAtMs < this.captureIntervalMs) {
      return;
    }

    const snapshot = world.createSnapshot(resourceKeys);
    const buffer = this.encoder.encode(JSON.stringify(snapshot));
    this.snapshots.push({
      buffer,
      capturedAtMs: nowMs,
    });
    this.lastCaptureAtMs = nowMs;
    this.trim(nowMs);
  }

  getHistory(): ReadonlyArray<SnapshotEntry<TComponents, TResources>> {
    return this.snapshots;
  }

  getLatest(): SnapshotEntry<TComponents, TResources> | null {
    return this.snapshots.at(-1) ?? null;
  }

  getLatestSnapshot(): WorldSnapshot<TComponents, Partial<TResources>> | null {
    const latest = this.getLatest();
    if (!latest) {
      return null;
    }

    return JSON.parse(this.decoder.decode(latest.buffer)) as WorldSnapshot<
      TComponents,
      Partial<TResources>
    >;
  }

  restoreOffset(
    world: World<TComponents, TResources>,
    millisecondsAgo: number,
    nowMs: number,
  ): boolean {
    const target = nowMs - Math.max(0, millisecondsAgo);
    const entry = [...this.snapshots]
      .reverse()
      .find((candidate) => candidate.capturedAtMs <= target);
    if (!entry) {
      return false;
    }

    const snapshot = this.decoder.decode(entry.buffer);
    world.restoreSnapshot(
      JSON.parse(snapshot) as ReturnType<World<TComponents, TResources>["createSnapshot"]>,
    );
    return true;
  }

  private trim(nowMs: number): void {
    while (
      this.snapshots.length > 0 &&
      nowMs - this.snapshots[0].capturedAtMs > this.historyWindowMs
    ) {
      this.snapshots.shift();
    }
  }
}

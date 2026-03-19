import type {
  AudioAsset,
  AudioComponent,
  AudioEmitter,
  AudioEvent,
  AudioInstance,
  AudioListener,
  AudioRuntime,
  AudioTriggerCondition,
  AudioZone,
  MusicState,
  ReactiveAudioSettings,
} from "../../shared/types/audio";
import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";

export class AudioSystem implements System<EngineComponents, EngineResources> {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private runtime: AudioRuntime = {
    currentZone: null,
    activeMusic: null,
    activeAmbient: null,
    activeSfx: new Map(),
    volume: {
      master: 1,
      music: 0.8,
      sfx: 1,
      ambient: 0.6,
    },
    zones: new Map(),
    assets: new Map(),
    states: new Map(),
  };

  private reactiveSettings: ReactiveAudioSettings = {
    reactivity: {
      enabled: true,
      intensity: 0.5,
      responseTime: 0.1,
    },
    filters: {
      dynamicFilter: false,
      filterType: "lowpass",
      baseFrequency: 1000,
      frequencyRange: 800,
    },
    spatial: {
      enabled: true,
      maxDistance: 500,
      rollOff: "logarithmic",
      doppler: false,
    },
  };

  private eventLog: AudioEvent[] = [];
  private lastZoneCheck = 0;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();

      // Connect gain nodes
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes
      this.updateGainNodes();
    } catch (error) {
      console.warn("Audio system initialization failed:", error);
    }
  }

  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    if (!this.audioContext) return;

    // Update audio runtime resource
    this.updateAudioRuntimeResource(world);

    // Process zone-based audio
    this.processAudioZones(world, deltaTime);

    // Process entity-based audio
    this.processEntityAudio(world, deltaTime);

    // Clean up finished instances
    this.cleanupFinishedInstances();

    // Update reactive audio
    if (this.reactiveSettings.reactivity.enabled) {
      this.updateReactiveAudio(world);
    }

    // Process event queue
    this.processEventQueue(world);
  }

  private processAudioZones(
    world: World<EngineComponents, EngineResources>,
    deltaTime: number,
  ): void {
    const camera = world.getResource("camera");
    if (!camera) return;

    // Check for zone transitions
    const currentZone = this.getCurrentZone(camera.x, camera.y);

    if (currentZone !== this.runtime.currentZone) {
      this.handleZoneTransition(this.runtime.currentZone, currentZone);
      this.runtime.currentZone = currentZone;
    }
  }

  private processEntityAudio(
    world: World<EngineComponents, EngineResources>,
    deltaTime: number,
  ): void {
    const entities = world.getEntitiesWith("audioComponent", "position");

    for (const entity of entities) {
      const audioComp = world.getComponent(entity, "audioComponent");
      const position = world.getComponent(entity, "position");

      if (!audioComp || !position) continue;

      // Process emitters
      for (const emitter of audioComp.emitters) {
        this.processEmitter(emitter, position, world);
      }

      // Process listeners
      for (const listener of audioComp.listeners) {
        this.processListener(listener, position, world);
      }
    }
  }

  private processEmitter(
    emitter: AudioEmitter,
    emitterPosition: { x: number; y: number },
    world: World<EngineComponents, EngineResources>,
  ): void {
    const asset = this.runtime.assets.get(emitter.assetId);
    if (!asset) return;

    // Check trigger conditions
    const shouldPlay = this.evaluateTriggerConditions(
      emitter.triggerConditions,
      emitterPosition,
      world,
    );

    if (shouldPlay && !this.isPlaying(emitter.id)) {
      this.playEmitter(emitter, emitterPosition);
    }
  }

  private processListener(
    listener: AudioListener,
    listenerPosition: { x: number; y: number },
    world: World<EngineComponents, EngineResources>,
  ): void {
    // Update spatial audio based on listener position
    if (this.reactiveSettings.spatial.enabled) {
      this.updateSpatialAudio(listenerPosition);
    }
  }

  private evaluateTriggerConditions(
    conditions: AudioTriggerCondition[],
    position: { x: number; y: number },
    world: World<EngineComponents, EngineResources>,
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.some((condition) => {
      switch (condition.type) {
        case "always":
          return true;
        case "proximity":
          // Check if any listener is within range
          return this.isListenerInRange(position, condition.parameters.distance || 100, world);
        case "event":
          // Check if event has been triggered
          return this.hasRecentEvent(condition.parameters.eventName || "");
        case "state":
          // Check world state
          return this.checkWorldState(
            condition.parameters.stateKey || "",
            condition.parameters.stateValue,
            world,
          );
        default:
          return false;
      }
    });
  }

  private playEmitter(emitter: AudioEmitter, position: { x: number; y: number }): void {
    const asset = this.runtime.assets.get(emitter.assetId);
    if (!asset || !this.audioContext) return;

    // Create audio instance
    const instance: AudioInstance = {
      id: `instance-${Date.now()}-${Math.random()}`,
      assetId: emitter.assetId,
      startTime: this.audioContext.currentTime,
      duration: asset.duration,
      volume: emitter.volume,
      pitch: emitter.pitch,
      pan: 0,
      loop: emitter.loop,
      paused: false,
      finished: false,
    };

    // Load and play audio
    this.loadAndPlayAudio(asset, instance, position);
    this.runtime.activeSfx.set(instance.id, instance);

    // Log event
    this.logEvent({
      type: "sfx_play",
      timestamp: Date.now(),
      assetId: emitter.assetId,
      parameters: { position, volume: emitter.volume },
    });
  }

  private async loadAndPlayAudio(
    asset: AudioAsset,
    instance: AudioInstance,
    position: { x: number; y: number },
  ): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Fetch audio data
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = instance.loop;

      // Create gain node for this instance
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = instance.volume * this.runtime.volume.sfx;

      // Create panner for spatial audio
      const pannerNode = this.audioContext.createStereoPanner();
      if (this.reactiveSettings.spatial.enabled) {
        const pan = this.calculatePan(position);
        pannerNode.pan.value = pan;
      }

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.sfxGain!);

      // Apply pitch
      source.playbackRate.value = instance.pitch;

      // Schedule playback
      source.start(0, 0);

      // Handle end
      source.onended = () => {
        instance.finished = true;
      };
    } catch (error) {
      console.error(`Failed to load audio asset ${asset.id}:`, error);
      instance.finished = true;
    }
  }

  private getCurrentZone(x: number, y: number): string | null {
    for (const [zoneId, zone] of this.runtime.zones) {
      if (this.isPointInZone(x, y, zone)) {
        return zoneId;
      }
    }
    return null;
  }

  private isPointInZone(x: number, y: number, zone: AudioZone): boolean {
    switch (zone.shape) {
      case "circle":
        const dx = x - zone.bounds.x;
        const dy = y - zone.bounds.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (zone.bounds.radius || 0);
      case "rectangle":
        return (
          x >= zone.bounds.x &&
          x <= zone.bounds.x + (zone.bounds.width || 0) &&
          y >= zone.bounds.y &&
          y <= zone.bounds.y + (zone.bounds.height || 0)
        );
      case "polygon":
        // Simple point-in-polygon test
        return this.isPointInPolygon(x, y, zone.bounds.points || []);
      default:
        return false;
    }
  }

  private isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private handleZoneTransition(fromZone: string | null, toZone: string | null): void {
    // Handle exit triggers
    if (fromZone) {
      const zone = this.runtime.zones.get(fromZone);
      if (zone?.exitTriggers) {
        this.executeTriggers(zone.exitTriggers);
      }
    }

    // Handle enter triggers
    if (toZone) {
      const zone = this.runtime.zones.get(toZone);
      if (zone?.enterTriggers) {
        this.executeTriggers(zone.enterTriggers);
      }
      if (zone) {
        this.applyZoneAudioSettings(zone);
      }
    }

    // Log transition
    this.logEvent({
      type: fromZone ? "zone_exit" : "zone_enter",
      timestamp: Date.now(),
      zoneId: toZone || fromZone || undefined,
      parameters: { fromZone, toZone },
    });
  }

  private applyZoneAudioSettings(zone: AudioZone): void {
    if (!this.audioContext) return;

    const settings = zone.audioSettings;

    // Handle music transition
    if (settings.musicTrack && settings.musicTrack !== this.runtime.activeMusic) {
      this.transitionMusic(settings.musicTrack, settings.volume, settings.fadeTime);
    }

    // Handle ambient transition
    if (settings.ambientTrack && settings.ambientTrack !== this.runtime.activeAmbient) {
      this.transitionAmbient(settings.ambientTrack, settings.volume, settings.fadeTime);
    }

    // Apply zone-specific effects
    if (settings.filter) {
      this.applyFilter(settings.filter);
    }
  }

  private transitionMusic(trackId: string, volume: number, fadeTime: number): void {
    // Implementation for music transition
    this.runtime.activeMusic = trackId;
    this.logEvent({
      type: "music_change",
      timestamp: Date.now(),
      assetId: trackId,
      parameters: { volume, fadeTime },
    });
  }

  private transitionAmbient(trackId: string, volume: number, fadeTime: number): void {
    // Implementation for ambient transition
    this.runtime.activeAmbient = trackId;
  }

  private applyFilter(filter: AudioZone["audioSettings"]["filter"]): void {
    if (!filter || !this.audioContext) return;

    // Create and apply filter
    const filterNode = this.audioContext.createBiquadFilter();
    filterNode.type = filter.type;
    filterNode.frequency.value = filter.frequency;
    filterNode.Q.value = filter.resonance;

    // Connect filter to appropriate gain nodes
    // This would need more complex routing in a real implementation
  }

  private executeTriggers(triggers: any[]): void {
    // Execute audio triggers
    for (const trigger of triggers) {
      // Implementation depends on trigger type
      console.log("Executing audio trigger:", trigger);
    }
  }

  private updateReactiveAudio(world: World<EngineComponents, EngineResources>): void {
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (!runtimeMetrics) return;

    // Adjust audio based on game state
    const intensity = this.calculateReactiveIntensity(world);

    // Apply dynamic filters
    if (this.reactiveSettings.filters.dynamicFilter) {
      this.updateDynamicFilter(intensity);
    }

    // Adjust spatial audio
    if (this.reactiveSettings.spatial.enabled) {
      this.updateSpatialReactivity(intensity);
    }
  }

  private calculateReactiveIntensity(world: World<EngineComponents, EngineResources>): number {
    // Calculate intensity based on game state
    // This could consider FPS, entity count, player health, etc.
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (!runtimeMetrics) return 0.5;

    // Simple example: intensity based on FPS
    const fpsIntensity = Math.max(0, Math.min(1, (60 - runtimeMetrics.currentFps) / 30));

    return fpsIntensity * this.reactiveSettings.reactivity.intensity;
  }

  private updateDynamicFilter(intensity: number): void {
    if (!this.audioContext) return;

    // Update filter frequency based on intensity
    const settings = this.reactiveSettings.filters;
    const frequency = settings.baseFrequency + intensity * settings.frequencyRange;

    // Apply to active filters
    // Implementation would need to track active filter nodes
  }

  private updateSpatialReactivity(intensity: number): void {
    // Update spatial audio parameters based on intensity
    // This could affect distance models, doppler effects, etc.
  }

  private cleanupFinishedInstances(): void {
    for (const [instanceId, instance] of this.runtime.activeSfx) {
      if (instance.finished) {
        this.runtime.activeSfx.delete(instanceId);
      }
    }
  }

  private processEventQueue(world: World<EngineComponents, EngineResources>): void {
    // Process any queued audio events
    // This would handle events from other systems
  }

  private updateAudioRuntimeResource(world: World<EngineComponents, EngineResources>): void {
    world.setResource("audioRuntime", this.runtime);
  }

  // Utility methods
  private updateGainNodes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.runtime.volume.master;
    if (this.musicGain) this.musicGain.gain.value = this.runtime.volume.music;
    if (this.sfxGain) this.sfxGain.gain.value = this.runtime.volume.sfx;
    if (this.ambientGain) this.ambientGain.gain.value = this.runtime.volume.ambient;
  }

  private isPlaying(emitterId: string): boolean {
    for (const instance of this.runtime.activeSfx.values()) {
      if (instance.assetId === emitterId && !instance.finished && !instance.paused) {
        return true;
      }
    }
    return false;
  }

  private isListenerInRange(
    position: { x: number; y: number },
    range: number,
    world: World<EngineComponents, EngineResources>,
  ): boolean {
    const entities = world.getEntitiesWith("audioComponent", "position");

    for (const entity of entities) {
      const audioComp = world.getComponent(entity, "audioComponent");
      const entityPosition = world.getComponent(entity, "position");

      if (!audioComp || !entityPosition) continue;

      for (const listener of audioComp.listeners) {
        if (!listener.active) continue;

        const dx = position.x - entityPosition.x;
        const dy = position.y - entityPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range) {
          return true;
        }
      }
    }
    return false;
  }

  private hasRecentEvent(eventName: string): boolean {
    const cutoffTime = Date.now() - 1000; // Last 1 second
    return this.eventLog.some(
      (event) => event.timestamp > cutoffTime && event.parameters.eventName === eventName,
    );
  }

  private checkWorldState(
    stateKey: string,
    expectedValue: any,
    world: World<EngineComponents, EngineResources>,
  ): boolean {
    // Check world state - this would need to be implemented based on specific game state
    return false;
  }

  private calculatePan(position: { x: number; y: number }): number {
    const camera = { x: 320, y: 240 }; // Default camera center
    const dx = position.x - camera.x;
    const maxDistance = this.reactiveSettings.spatial.maxDistance;

    return Math.max(-1, Math.min(1, dx / maxDistance));
  }

  private updateSpatialAudio(listenerPosition: { x: number; y: number }): void {
    // Update spatial audio based on listener position
    // This would affect all active audio instances
  }

  private logEvent(event: AudioEvent): void {
    this.eventLog.push(event);

    // Keep only recent events (last 10 seconds)
    const cutoffTime = Date.now() - 10000;
    this.eventLog = this.eventLog.filter((e) => e.timestamp > cutoffTime);
  }

  // Public API
  public registerAsset(asset: AudioAsset): void {
    this.runtime.assets.set(asset.id, asset);
  }

  public registerZone(zone: AudioZone): void {
    this.runtime.zones.set(zone.id, zone);
  }

  public registerMusicState(state: MusicState): void {
    this.runtime.states.set(state.id, state);
  }

  public setVolume(category: keyof AudioRuntime["volume"], value: number): void {
    this.runtime.volume[category] = Math.max(0, Math.min(1, value));
    this.updateGainNodes();
  }

  public playSfx(assetId: string, position?: { x: number; y: number }): void {
    const asset = this.runtime.assets.get(assetId);
    if (!asset) return;

    const emitter: AudioEmitter = {
      id: `manual-${Date.now()}`,
      position: position || { x: 0, y: 0 },
      radius: 100,
      assetId,
      volume: 1,
      pitch: 1,
      loop: false,
      autoPlay: true,
      triggerConditions: [{ type: "always", parameters: {} }],
    };

    this.playEmitter(emitter, emitter.position);
  }

  public stopAllSfx(): void {
    for (const instance of this.runtime.activeSfx.values()) {
      instance.finished = true;
    }
  }

  public getRuntime(): AudioRuntime {
    return this.runtime;
  }

  public getEventLog(): AudioEvent[] {
    return [...this.eventLog];
  }
}

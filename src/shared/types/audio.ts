export interface AudioAsset {
  id: string;
  name: string;
  type: "music" | "sfx" | "ambient";
  format: "mp3" | "wav" | "ogg";
  url: string;
  duration: number; // in seconds
  size: number; // in bytes
  loop: boolean;
  volume: number; // 0-1
  fadeIn: number; // fade in time in seconds
  fadeOut: number; // fade out time in seconds
  metadata: {
    artist?: string;
    title?: string;
    genre?: string;
    mood?: string;
  };
}

export interface AudioZone {
  id: string;
  name: string;
  shape: "circle" | "rectangle" | "polygon";
  bounds: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: { x: number; y: number }[];
  };
  audioSettings: {
    musicTrack?: string; // AudioAsset ID
    ambientTrack?: string; // AudioAsset ID
    volume: number; // 0-1
    fadeTime: number; // transition time in seconds
    reverb?: number; // 0-1
    filter?: {
      type: "lowpass" | "highpass" | "bandpass";
      frequency: number;
      resonance: number;
    };
  };
  enterTriggers?: AudioTrigger[];
  exitTriggers?: AudioTrigger[];
}

export interface AudioTrigger {
  id: string;
  type: "play_sfx" | "stop_music" | "change_volume" | "crossfade";
  targetAsset?: string; // AudioAsset ID
  delay: number; // delay in seconds
  parameters: {
    volume?: number;
    pitch?: number;
    pan?: number; // -1 to 1
    fadeTime?: number;
  };
}

export interface MusicState {
  id: string;
  name: string;
  tracks: {
    main?: string; // AudioAsset ID
    layer1?: string; // AudioAsset ID
    layer2?: string; // AudioAsset ID
  };
  transitions: {
    enter: MusicTransition;
    exit: MusicTransition;
    layerTransitions?: Record<string, MusicTransition>;
  };
}

export interface MusicTransition {
  type: "cut" | "fade" | "crossfade" | "beat_match";
  duration: number; // in seconds
  offset?: number; // beat offset for beat_match
  curve?: "linear" | "ease_in" | "ease_out" | "ease_in_out";
}

export interface AudioRuntime {
  currentZone: string | null;
  activeMusic: string | null;
  activeAmbient: string | null;
  activeSfx: Map<string, AudioInstance>;
  volume: {
    master: number;
    music: number;
    sfx: number;
    ambient: number;
  };
  zones: Map<string, AudioZone>;
  assets: Map<string, AudioAsset>;
  states: Map<string, MusicState>;
}

export interface AudioInstance {
  id: string;
  assetId: string;
  startTime: number;
  duration: number;
  volume: number;
  pitch: number;
  pan: number;
  loop: boolean;
  paused: boolean;
  finished: boolean;
}

export interface ReactiveAudioSettings {
  reactivity: {
    enabled: boolean;
    intensity: number; // 0-1, how much audio reacts to game state
    responseTime: number; // how quickly audio responds to changes
  };
  filters: {
    dynamicFilter: boolean;
    filterType: "lowpass" | "highpass" | "bandpass";
    baseFrequency: number;
    frequencyRange: number; // how much frequency can vary
  };
  spatial: {
    enabled: boolean;
    maxDistance: number;
    rollOff: "linear" | "logarithmic";
    doppler: boolean;
  };
}

export interface AudioComponent {
  zoneId?: string;
  emitters: AudioEmitter[];
  listeners: AudioListener[];
}

export interface AudioEmitter {
  id: string;
  position: { x: number; y: number };
  radius: number;
  assetId: string;
  volume: number;
  pitch: number;
  loop: boolean;
  autoPlay: boolean;
  triggerConditions: AudioTriggerCondition[];
}

export interface AudioListener {
  id: string;
  position: { x: number; y: number };
  radius: number;
  active: boolean;
}

export interface AudioTriggerCondition {
  type: "always" | "proximity" | "event" | "state";
  parameters: {
    distance?: number;
    eventName?: string;
    stateKey?: string;
    stateValue?: any;
  };
}

export interface AudioEvent {
  type: "zone_enter" | "zone_exit" | "sfx_play" | "music_change" | "volume_change";
  timestamp: number;
  zoneId?: string;
  assetId?: string;
  parameters: Record<string, any>;
}

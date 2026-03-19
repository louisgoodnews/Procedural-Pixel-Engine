/**
 * Voice Chat and Communication System
 * Provides comprehensive voice chat and communication features
 */

import { createEngineError, validators } from '../utils/ErrorHandling';

export interface VoiceChannel {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'mixed';
  visibility: 'public' | 'private' | 'hidden';
  maxParticipants: number;
  currentParticipants: number;
  participants: VoiceParticipant[];
  settings: VoiceChannelSettings;
  quality: VoiceQuality;
  created: Date;
  lastActivity: Date;
}

export interface VoiceParticipant {
  id: string;
  userId: string;
  name: string;
  connectionId: string;
  speaking: boolean;
  muted: boolean;
  deafened: boolean;
  volume: number; // 0-100
  quality: AudioQuality;
  position: AudioPosition;
  permissions: VoicePermissions;
  joined: Date;
  lastSpoke: Date;
}

export interface VoiceChannelSettings {
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: number; // 1=mono, 2=stereo
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  encryption: boolean;
  compression: boolean;
  spatialAudio: boolean;
  voiceActivityDetection: boolean;
  pushToTalk: boolean;
  maxSpeakingTime: number; // seconds
}

export interface VoiceQuality {
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  bandwidth: number; // kbps
  signalToNoise: number; // dB
  overall: number; // 0-100
}

export interface AudioQuality {
  codec: string;
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface AudioPosition {
  x: number;
  y: number;
  z: number;
  radius: number;
  direction: number; // degrees
  distance: number; // meters
}

export interface VoicePermissions {
  canSpeak: boolean;
  canMute: boolean;
  canDeafen: boolean;
  canMove: boolean;
  canInvite: boolean;
  canKick: boolean;
  canBan: boolean;
  canChangeSettings: boolean;
  isAdmin: boolean;
}

export interface VoiceServer {
  id: string;
  region: string;
  address: string;
  port: number;
  capacity: number;
  currentLoad: number;
  codecs: string[];
  features: ServerFeature[];
  performance: ServerPerformance;
  status: 'online' | 'offline' | 'maintenance';
}

export interface ServerFeature {
  name: string;
  enabled: boolean;
  description: string;
}

export interface ServerPerformance {
  cpu: number; // percentage
  memory: number; // percentage
  bandwidth: number; // Mbps
  latency: number; // ms
  uptime: number; // seconds
}

export interface AudioCodec {
  name: string;
  type: 'lossy' | 'lossless';
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: number;
  complexity: number; // 1-10
  latency: number; // ms
  quality: number; // 0-100
  features: CodecFeature[];
}

export interface CodecFeature {
  name: string;
  supported: boolean;
  description: string;
}

export interface VoiceMessage {
  id: string;
  channelId: string;
  senderId: string;
  type: 'audio' | 'text' | 'system';
  content: any;
  duration: number; // seconds
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  encrypted: boolean;
  compressed: boolean;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  codec?: string;
  quality?: AudioQuality;
  position?: AudioPosition;
  reactions: MessageReaction[];
  edited: boolean;
  editedAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface CommunicationSettings {
  input: InputSettings;
  output: OutputSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
}

export interface InputSettings {
  device: string;
  volume: number; // 0-100
  boost: number; // dB
  gate: number; // dB
  compressor: boolean;
  equalizer: EqualizerSettings;
  pushToTalk: boolean;
  pushToTalkKey: string;
  voiceActivation: boolean;
  activationThreshold: number; // dB
}

export interface OutputSettings {
  device: string;
  volume: number; // 0-100
  balance: number; // -100 to 100
  spatialAudio: boolean;
  surroundSound: boolean;
  bassBoost: number; // 0-100
  trebleBoost: number; // 0-100
  equalizer: EqualizerSettings;
}

export interface EqualizerSettings {
  enabled: boolean;
  bands: EqualizerBand[];
  preset: string;
}

export interface EqualizerBand {
  frequency: number; // Hz
  gain: number; // dB
  q: number; // quality factor
}

export interface PrivacySettings {
  recording: boolean;
  analytics: boolean;
  dataCollection: boolean;
  shareStats: boolean;
  anonymousUsage: boolean;
  gdprCompliant: boolean;
}

export interface AccessibilitySettings {
  subtitles: boolean;
  visualIndicators: boolean;
  colorBlindMode: boolean;
  highContrast: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
  volumeNormalization: boolean;
}

export interface NotificationSettings {
  sounds: boolean;
  visual: boolean;
  vibrations: boolean;
  mentions: boolean;
  directMessages: boolean;
  systemMessages: boolean;
  customFilters: NotificationFilter[];
}

export interface NotificationFilter {
  type: string;
  enabled: boolean;
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'regex';
  value: string;
}

export interface VoiceAnalytics {
  totalCalls: number;
  totalDuration: number; // seconds
  averageCallDuration: number; // seconds
  peakConcurrentUsers: number;
  totalMessages: number;
  averageLatency: number; // ms
  packetLossRate: number; // percentage
  codecUsage: Record<string, number>;
  qualityDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

export interface VoiceEvent {
  type: 'channel_created' | 'channel_deleted' | 'participant_joined' | 'participant_left' | 'speaking_started' | 'speaking_stopped' | 'message_sent' | 'error' | 'quality_update';
  channelId?: string;
  participantId?: string;
  timestamp: Date;
  data?: any;
}

export class VoiceChatSystem {
  private channels = new Map<string, VoiceChannel>();
  private servers = new Map<string, VoiceServer>();
  private codecs = new Map<string, AudioCodec>();
  private messages = new Map<string, VoiceMessage[]>();
  private analytics = new Map<string, VoiceAnalytics>();
  private eventListeners = new Map<string, Set<(event: VoiceEvent) => void>>();
  private audioProcessors = new Map<string, AudioProcessor>();

  constructor() {
    this.initializeCodecs();
    this.initializeAudioProcessors();
  }

  /**
   * Create voice channel
   */
  createChannel(
    name: string,
    type: VoiceChannel['type'],
    visibility: VoiceChannel['visibility'],
    maxParticipants: number,
    settings: Partial<VoiceChannelSettings> = {}
  ): VoiceChannel {
    const channelId = this.generateId();
    const channel: VoiceChannel = {
      id: channelId,
      name,
      type,
      visibility,
      maxParticipants,
      currentParticipants: 0,
      participants: [],
      settings: {
        bitrate: 64,
        sampleRate: 48000,
        channels: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        encryption: true,
        compression: true,
        spatialAudio: false,
        voiceActivityDetection: true,
        pushToTalk: false,
        maxSpeakingTime: 300,
        ...settings
      },
      quality: {
        latency: 50,
        packetLoss: 0.5,
        jitter: 2,
        bandwidth: 64,
        signalToNoise: 30,
        overall: 85
      },
      created: new Date(),
      lastActivity: new Date()
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);

    this.emitEvent({
      type: 'channel_created',
      channelId,
      timestamp: new Date(),
      data: { name, type, visibility, maxParticipants }
    });

    return channel;
  }

  /**
   * Join voice channel
   */
  async joinChannel(
    channelId: string,
    userId: string,
    userName: string,
    connectionId: string,
    permissions: Partial<VoicePermissions> = {}
  ): Promise<VoiceParticipant> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw createEngineError(
        `Channel '${channelId}' not found`,
        'CHANNEL_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (channel.currentParticipants >= channel.maxParticipants) {
      throw createEngineError(
        `Channel '${channelId}' is full`,
        'CHANNEL_FULL',
        'system',
        'medium'
      );
    }

    const participant: VoiceParticipant = {
      id: this.generateId(),
      userId,
      name: userName,
      connectionId,
      speaking: false,
      muted: false,
      deafened: false,
      volume: 100,
      quality: {
        codec: 'opus',
        bitrate: channel.settings.bitrate,
        sampleRate: channel.settings.sampleRate,
        channels: channel.settings.channels,
        quality: 'medium'
      },
      position: {
        x: 0,
        y: 0,
        z: 0,
        radius: 10,
        direction: 0,
        distance: 0
      },
      permissions: {
        canSpeak: true,
        canMute: false,
        canDeafen: false,
        canMove: false,
        canInvite: false,
        canKick: false,
        canBan: false,
        canChangeSettings: false,
        isAdmin: false,
        ...permissions
      },
      joined: new Date(),
      lastSpoke: new Date()
    };

    channel.participants.push(participant);
    channel.currentParticipants++;
    channel.lastActivity = new Date();

    this.emitEvent({
      type: 'participant_joined',
      channelId,
      participantId: participant.id,
      timestamp: new Date(),
      data: { userId, userName }
    });

    return participant;
  }

  /**
   * Leave voice channel
   */
  async leaveChannel(channelId: string, participantId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const participantIndex = channel.participants.findIndex(p => p.id === participantId);
    if (participantIndex !== -1) {
      channel.participants.splice(participantIndex, 1);
      channel.currentParticipants--;
      channel.lastActivity = new Date();
    }

    this.emitEvent({
      type: 'participant_left',
      channelId,
      participantId,
      timestamp: new Date()
    });
  }

  /**
   * Start speaking
   */
  async startSpeaking(channelId: string, participantId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const participant = channel.participants.find(p => p.id === participantId);
    if (!participant || !participant.permissions.canSpeak || participant.muted) return;

    participant.speaking = true;
    participant.lastSpoke = new Date();
    channel.lastActivity = new Date();

    this.emitEvent({
      type: 'speaking_started',
      channelId,
      participantId,
      timestamp: new Date()
    });
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(channelId: string, participantId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const participant = channel.participants.find(p => p.id === participantId);
    if (!participant) return;

    participant.speaking = false;
    channel.lastActivity = new Date();

    this.emitEvent({
      type: 'speaking_stopped',
      channelId,
      participantId,
      timestamp: new Date()
    });
  }

  /**
   * Send voice message
   */
  async sendMessage(
    channelId: string,
    senderId: string,
    type: VoiceMessage['type'],
    content: any,
    options: {
      priority?: VoiceMessage['priority'];
      encrypted?: boolean;
      compressed?: boolean;
    } = {}
  ): Promise<VoiceMessage> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw createEngineError(
        `Channel '${channelId}' not found`,
        'CHANNEL_NOT_FOUND',
        'system',
        'high'
      );
    }

    const messageId = this.generateId();
    const message: VoiceMessage = {
      id: messageId,
      channelId,
      senderId,
      type,
      content,
      duration: type === 'audio' ? this.calculateAudioDuration(content) : 0,
      timestamp: new Date(),
      priority: options.priority || 'normal',
      encrypted: options.encrypted ?? channel.settings.encryption,
      compressed: options.compressed ?? channel.settings.compression,
      metadata: {
        reactions: [],
        edited: false,
        deleted: false
      }
    };

    const messages = this.messages.get(channelId) || [];
    messages.push(message);
    this.messages.set(channelId, messages);

    this.emitEvent({
      type: 'message_sent',
      channelId,
      timestamp: new Date(),
      data: { messageId, type, priority: message.priority }
    });

    return message;
  }

  /**
   * Update participant position
   */
  async updateParticipantPosition(
    channelId: string,
    participantId: string,
    position: Partial<AudioPosition>
  ): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const participant = channel.participants.find(p => p.id === participantId);
    if (!participant) return;

    participant.position = {
      ...participant.position,
      ...position
    };

    // Update spatial audio if enabled
    if (channel.settings.spatialAudio) {
      await this.updateSpatialAudio(channelId, participantId, participant.position);
    }
  }

  /**
   * Mute participant
   */
  async muteParticipant(channelId: string, participantId: string, muted: boolean): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const participant = channel.participants.find(p => p.id === participantId);
    if (!participant) return;

    participant.muted = muted;
    if (muted) {
      participant.speaking = false;
    }

    this.emitEvent({
      type: 'participant_left',
      channelId,
      participantId,
      timestamp: new Date(),
      data: { action: 'muted', muted }
    });
  }

  /**
   * Update channel quality
   */
  updateChannelQuality(channelId: string, quality: Partial<VoiceQuality>): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.quality = {
      ...channel.quality,
      ...quality
    };

    this.emitEvent({
      type: 'quality_update',
      channelId,
      timestamp: new Date(),
      data: { quality }
    });
  }

  /**
   * Get voice channel
   */
  getChannel(channelId: string): VoiceChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get all channels
   */
  getAllChannels(filter?: {
    type?: VoiceChannel['type'];
    visibility?: VoiceChannel['visibility'];
  }): VoiceChannel[] {
    let channels = Array.from(this.channels.values());

    if (filter) {
      if (filter.type) channels = channels.filter(c => c.type === filter.type);
      if (filter.visibility) channels = channels.filter(c => c.visibility === filter.visibility);
    }

    return channels.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get channel messages
   */
  getChannelMessages(channelId: string, limit?: number): VoiceMessage[] {
    const messages = this.messages.get(channelId) || [];
    const sorted = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Register voice server
   */
  registerServer(server: VoiceServer): void {
    validators.notNull(server);
    validators.notEmpty(server.id);

    this.servers.set(server.id, server);
  }

  /**
   * Get best server
   */
  getBestServer(region?: string): VoiceServer | undefined {
    const availableServers = Array.from(this.servers.values())
      .filter(server => server.status === 'online' && server.currentLoad < server.capacity);

    if (region) {
      const regionalServers = availableServers.filter(server => server.region === region);
      if (regionalServers.length > 0) {
        return regionalServers.reduce((best, server) => 
          server.currentLoad < best.currentLoad ? server : best
        );
      }
    }

    return availableServers.length > 0 
      ? availableServers.reduce((best, server) => server.currentLoad < best.currentLoad ? server : best)
      : undefined;
  }

  /**
   * Get voice analytics
   */
  getAnalytics(channelId?: string): VoiceAnalytics {
    if (channelId) {
      return this.calculateChannelAnalytics(channelId);
    }

    return this.calculateGlobalAnalytics();
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: VoiceEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Private methods

  private initializeCodecs(): void {
    // Opus codec
    this.codecs.set('opus', {
      name: 'Opus',
      type: 'lossy',
      bitrate: 64,
      sampleRate: 48000,
      channels: 2,
      complexity: 5,
      latency: 25,
      quality: 90,
      features: [
        { name: 'low_latency', supported: true, description: 'Very low encoding latency' },
        { name: 'high_quality', supported: true, description: 'Excellent audio quality' },
        { name: 'variable_bitrate', supported: true, description: 'Adaptive bitrate' },
        { name: 'noise_suppression', supported: true, description: 'Built-in noise suppression' }
      ]
    });

    // AAC codec
    this.codecs.set('aac', {
      name: 'AAC',
      type: 'lossy',
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      complexity: 7,
      latency: 50,
      quality: 85,
      features: [
        { name: 'efficient', supported: true, description: 'Good compression efficiency' },
        { name: 'wide_adoption', supported: true, description: 'Broadly supported' },
        { name: 'stereo', supported: true, description: 'Full stereo support' }
      ]
    });

    // PCM codec (uncompressed)
    this.codecs.set('pcm', {
      name: 'PCM',
      type: 'lossless',
      bitrate: 1411, // 44.1kHz * 16-bit * 2 channels / 1000
      sampleRate: 44100,
      channels: 2,
      complexity: 1,
      latency: 10,
      quality: 100,
      features: [
        { name: 'lossless', supported: true, description: 'No quality loss' },
        { name: 'low_latency', supported: true, description: 'Minimal processing delay' },
        { name: 'simple', supported: true, description: 'Simple encoding/decoding' }
      ]
    });
  }

  private initializeAudioProcessors(): void {
    // Echo cancellation processor
    this.audioProcessors.set('echo_cancellation', {
      name: 'Echo Cancellation',
      type: 'filter',
      enabled: true,
      parameters: {
        delay: 100, // ms
        attenuation: 20 // dB
      }
    });

    // Noise suppression processor
    this.audioProcessors.set('noise_suppression', {
      name: 'Noise Suppression',
      type: 'filter',
      enabled: true,
      parameters: {
        threshold: -30, // dB
        reduction: 20 // dB
      }
    });

    // Auto gain control processor
    this.audioProcessors.set('auto_gain_control', {
      name: 'Auto Gain Control',
      type: 'processor',
      enabled: true,
      parameters: {
        targetLevel: -20, // dB
        maxGain: 30 // dB
      }
    });
  }

  private calculateAudioDuration(audioData: any): number {
    // Mock calculation - would analyze actual audio data
    return 5; // 5 seconds
  }

  private async updateSpatialAudio(channelId: string, participantId: string, position: AudioPosition): Promise<void> {
    // In a real implementation, would update spatial audio processing
    console.log(`Updating spatial audio for participant ${participantId} in channel ${channelId}`);
  }

  private calculateChannelAnalytics(channelId: string): VoiceAnalytics {
    const channel = this.channels.get(channelId);
    const messages = this.messages.get(channelId) || [];

    if (!channel) {
      return {
        totalCalls: 0,
        totalDuration: 0,
        averageCallDuration: 0,
        peakConcurrentUsers: 0,
        totalMessages: 0,
        averageLatency: 0,
        packetLossRate: 0,
        codecUsage: {},
        qualityDistribution: {},
        geographicDistribution: {}
      };
    }

    const audioMessages = messages.filter(m => m.type === 'audio');
    const totalDuration = audioMessages.reduce((sum, m) => sum + m.duration, 0);
    const averageLatency = channel.quality.latency;
    const packetLossRate = channel.quality.packetLoss;

    return {
      totalCalls: channel.participants.length,
      totalDuration,
      averageCallDuration: audioMessages.length > 0 ? totalDuration / audioMessages.length : 0,
      peakConcurrentUsers: channel.currentParticipants,
      totalMessages: messages.length,
      averageLatency,
      packetLossRate,
      codecUsage: this.calculateCodecUsage(messages),
      qualityDistribution: this.calculateQualityDistribution(channel),
      geographicDistribution: {} // Would be calculated from participant locations
    };
  }

  private calculateGlobalAnalytics(): VoiceAnalytics {
    const allChannels = Array.from(this.channels.values());
    const allMessages = Array.from(this.messages.values()).flat();

    const totalCalls = allChannels.reduce((sum, channel) => sum + channel.participants.length, 0);
    const totalDuration = allMessages
      .filter(m => m.type === 'audio')
      .reduce((sum, m) => sum + m.duration, 0);
    const peakConcurrentUsers = Math.max(...allChannels.map(c => c.currentParticipants));
    const averageLatency = allChannels.length > 0 
      ? allChannels.reduce((sum, c) => sum + c.quality.latency, 0) / allChannels.length 
      : 0;
    const packetLossRate = allChannels.length > 0
      ? allChannels.reduce((sum, c) => sum + c.quality.packetLoss, 0) / allChannels.length
      : 0;

    return {
      totalCalls,
      totalDuration,
      averageCallDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
      peakConcurrentUsers,
      totalMessages: allMessages.length,
      averageLatency,
      packetLossRate,
      codecUsage: this.calculateCodecUsage(allMessages),
      qualityDistribution: {},
      geographicDistribution: {}
    };
  }

  private calculateCodecUsage(messages: VoiceMessage[]): Record<string, number> {
    const usage: Record<string, number> = {};
    
    for (const message of messages) {
      if (message.type === 'audio' && message.metadata.codec) {
        usage[message.metadata.codec] = (usage[message.metadata.codec] || 0) + 1;
      }
    }

    return usage;
  }

  private calculateQualityDistribution(channel: VoiceChannel): Record<string, number> {
    const overall = channel.quality.overall;
    
    if (overall >= 90) return { excellent: 1 };
    if (overall >= 75) return { good: 1 };
    if (overall >= 60) return { fair: 1 };
    return { poor: 1 };
  }

  private emitEvent(event: VoiceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

interface AudioProcessor {
  name: string;
  type: 'filter' | 'processor' | 'encoder' | 'decoder';
  enabled: boolean;
  parameters: Record<string, any>;
}

// Factory function
export function createVoiceChatSystem(): VoiceChatSystem {
  return new VoiceChatSystem();
}

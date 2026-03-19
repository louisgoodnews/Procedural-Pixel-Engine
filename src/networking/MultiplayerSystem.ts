/**
 * Real-time Multiplayer System
 * Provides comprehensive real-time multiplayer support with synchronization
 */

import { createEngineError, validators } from '../utils/ErrorHandling';
import { NetworkConnection, NetworkMessage, AdvancedNetworkingSystem } from './AdvancedNetworking';

export interface GameSession {
  id: string;
  name: string;
  type: 'competitive' | 'cooperative' | 'sandbox' | 'tutorial';
  mode: 'deathmatch' | 'capture_the_flag' | 'king_of_the_hill' | 'survival' | 'custom';
  maxPlayers: number;
  currentPlayers: number;
  state: 'waiting' | 'starting' | 'in_progress' | 'paused' | 'ending' | 'finished';
  settings: GameSettings;
  players: Player[];
  host: string;
  server: GameServer;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  metadata: SessionMetadata;
}

export interface GameSettings {
  map: string;
  gameMode: string;
  timeLimit?: number; // seconds
  scoreLimit?: number;
  respawnTime: number; // seconds
  friendlyFire: boolean;
  autoBalance: boolean;
  spectators: boolean;
  private: boolean;
  password?: string;
  customSettings: Record<string, any>;
}

export interface Player {
  id: string;
  name: string;
  connectionId: string;
  team?: string;
  role: 'player' | 'spectator' | 'moderator' | 'host';
  state: 'connecting' | 'connected' | 'ready' | 'playing' | 'disconnected';
  joined: Date;
  lastSeen: Date;
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  ping: number;
  position: PlayerPosition;
  stats: PlayerStats;
  inventory: PlayerInventory;
  permissions: PlayerPermissions;
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  velocity: { x: number; y: number; z: number };
  timestamp: number;
}

export interface PlayerStats {
  accuracy: number;
  damageDealt: number;
  damageTaken: number;
  healing: number;
  objectives: number;
  playtime: number; // seconds
  streak: number;
  bestStreak: number;
}

export interface PlayerInventory {
  items: InventoryItem[];
  capacity: number;
  weight: number;
}

export interface InventoryItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  quality: 'common' | 'rare' | 'epic' | 'legendary';
  properties: Record<string, any>;
}

export interface PlayerPermissions {
  canKick: boolean;
  canBan: boolean;
  canMute: boolean;
  canChangeSettings: boolean;
  canStartGame: boolean;
  canPauseGame: boolean;
}

export interface GameServer {
  id: string;
  name: string;
  address: string;
  port: number;
  region: string;
  capacity: number;
  currentLoad: number;
  performance: ServerPerformance;
  status: 'online' | 'offline' | 'maintenance' | 'full';
  features: ServerFeature[];
  configuration: ServerConfiguration;
}

export interface ServerPerformance {
  cpu: number; // percentage
  memory: number; // percentage
  bandwidth: number; // Mbps
  latency: number; // ms
  tickRate: number; // Hz
  uptime: number; // seconds
}

export interface ServerFeature {
  name: string;
  enabled: boolean;
  description: string;
}

export interface ServerConfiguration {
  maxSessions: number;
  maxPlayersPerSession: number;
  tickRate: number;
  updateRate: number;
  compression: boolean;
  encryption: boolean;
  region: string;
  priority: 'low' | 'normal' | 'high';
}

export interface SessionMetadata {
  version: string;
  map: string;
  gameMode: string;
  rules: string[];
  mods: string[];
  checksum: string;
  replay: boolean;
  recording: boolean;
}

export interface GameState {
  id: string;
  sessionId: string;
  tick: number;
  timestamp: number;
  entities: EntityState[];
  events: GameEvent[];
  scores: ScoreState[];
  objectives: ObjectiveState[];
  environment: EnvironmentState;
}

export interface EntityState {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  properties: Record<string, any>;
  lastUpdate: number;
}

export interface GameEvent {
  id: string;
  type: 'spawn' | 'death' | 'damage' | 'heal' | 'pickup' | 'objective' | 'custom';
  timestamp: number;
  source: string;
  target?: string;
  data: Record<string, any>;
}

export interface ScoreState {
  playerId: string;
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  team?: string;
}

export interface ObjectiveState {
  id: string;
  type: string;
  status: 'active' | 'completed' | 'failed';
  progress: number;
  owner?: string;
  properties: Record<string, any>;
}

export interface EnvironmentState {
  time: number;
  weather: string;
  lighting: {
    ambient: number;
    directional: number;
    color: string;
  };
  effects: EnvironmentEffect[];
}

export interface EnvironmentEffect {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  radius: number;
  intensity: number;
  properties: Record<string, any>;
}

export interface SynchronizationStrategy {
  type: 'authoritative' | 'peer_to_peer' | 'hybrid';
  updateRate: number; // Hz
  reliability: 'reliable' | 'unreliable' | 'mixed';
  compression: boolean;
  deltaCompression: boolean;
  interpolation: boolean;
  extrapolation: boolean;
  prediction: boolean;
}

export interface NetworkOptimization {
  bandwidth: BandwidthOptimization;
  latency: LatencyOptimization;
  reliability: ReliabilityOptimization;
  security: SecurityOptimization;
}

export interface BandwidthOptimization {
  compression: boolean;
  deltaCompression: boolean;
  prioritization: boolean;
  batching: boolean;
  culling: boolean;
  levelOfDetail: boolean;
}

export interface LatencyOptimization {
  clientPrediction: boolean;
  serverReconciliation: boolean;
  interpolation: boolean;
  extrapolation: boolean;
  lagCompensation: boolean;
  tickRate: number;
}

export interface ReliabilityOptimization {
  guaranteedDelivery: boolean;
  ordering: boolean;
  duplicateDetection: boolean;
  errorCorrection: boolean;
  acknowledgments: boolean;
  retransmission: boolean;
}

export interface SecurityOptimization {
  encryption: boolean;
  authentication: boolean;
  antiCheat: boolean;
  rateLimiting: boolean;
  validation: boolean;
  obfuscation: boolean;
}

export interface MultiplayerEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'game_ended' | 'score_updated' | 'state_updated' | 'error';
  sessionId: string;
  timestamp: Date;
  data?: any;
}

export class MultiplayerSystem {
  private sessions = new Map<string, GameSession>();
  private servers = new Map<string, GameServer>();
  private players = new Map<string, Player>();
  private gameStates = new Map<string, GameState[]>();
  private synchronization = new Map<string, SynchronizationStrategy>();
  private optimization = new Map<string, NetworkOptimization>();
  private eventListeners = new Map<string, Set<(event: MultiplayerEvent) => void>>();
  private networking: AdvancedNetworkingSystem;

  constructor(networking: AdvancedNetworkingSystem) {
    this.networking = networking;
    this.initializeDefaultStrategies();
    this.initializeDefaultOptimizations();
  }

  /**
   * Create game session
   */
  async createSession(
    name: string,
    type: GameSession['type'],
    mode: GameSession['mode'],
    settings: GameSettings,
    hostId: string,
    serverId?: string
  ): Promise<GameSession> {
    const sessionId = this.generateId();
    const server = serverId ? this.servers.get(serverId) : await this.selectBestServer();
    
    if (!server) {
      throw createEngineError(
        'No available server for session',
        'NO_SERVER_AVAILABLE',
        'system',
        'high'
      );
    }

    const session: GameSession = {
      id: sessionId,
      name,
      type,
      mode,
      maxPlayers: settings.maxPlayers || 16,
      currentPlayers: 0,
      state: 'waiting',
      settings,
      players: [],
      host: hostId,
      server,
      createdAt: new Date(),
      metadata: {
        version: '1.0.0',
        map: settings.map,
        gameMode: mode,
        rules: [],
        mods: [],
        checksum: this.calculateChecksum(settings),
        replay: true,
        recording: true
      }
    };

    this.sessions.set(sessionId, session);
    this.gameStates.set(sessionId, []);
    
    // Initialize synchronization strategy
    this.synchronization.set(sessionId, this.getDefaultStrategy(type));
    this.optimization.set(sessionId, this.getDefaultOptimization(type));

    this.emitEvent({
      type: 'player_joined',
      sessionId,
      timestamp: new Date(),
      data: { playerId: hostId, host: true }
    });

    return session;
  }

  /**
   * Join game session
   */
  async joinSession(
    sessionId: string,
    playerId: string,
    playerName: string,
    connectionId: string,
    password?: string
  ): Promise<Player> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw createEngineError(
        `Session '${sessionId}' not found`,
        'SESSION_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (session.state !== 'waiting' && session.state !== 'in_progress') {
      throw createEngineError(
        `Session '${sessionId}' is not joinable`,
        'SESSION_NOT_JOINABLE',
        'system',
        'medium'
      );
    }

    if (session.currentPlayers >= session.maxPlayers) {
      throw createEngineError(
        `Session '${sessionId}' is full`,
        'SESSION_FULL',
        'system',
        'medium'
      );
    }

    if (session.settings.private && session.settings.password !== password) {
      throw createEngineError(
        'Invalid password for private session',
        'INVALID_PASSWORD',
        'system',
        'medium'
      );
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      connectionId,
      role: session.host === playerId ? 'host' : 'player',
      state: 'connecting',
      joined: new Date(),
      lastSeen: new Date(),
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      ping: 0,
      position: { x: 0, y: 0, z: 0, rotation: 0, velocity: { x: 0, y: 0, z: 0 }, timestamp: Date.now() },
      stats: {
        accuracy: 0,
        damageDealt: 0,
        damageTaken: 0,
        healing: 0,
        objectives: 0,
        playtime: 0,
        streak: 0,
        bestStreak: 0
      },
      inventory: { items: [], capacity: 20, weight: 0 },
      permissions: this.getDefaultPermissions(playerId === session.host)
    };

    session.players.push(player);
    session.currentPlayers++;
    this.players.set(playerId, player);

    // Update player state
    player.state = 'connected';

    this.emitEvent({
      type: 'player_joined',
      sessionId,
      timestamp: new Date(),
      data: { playerId, playerName }
    });

    return player;
  }

  /**
   * Leave game session
   */
  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    const player = this.players.get(playerId);

    if (!session || !player) return;

    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      session.players.splice(playerIndex, 1);
      session.currentPlayers--;
    }

    this.players.delete(playerId);

    // Handle host migration
    if (session.host === playerId && session.players.length > 0) {
      session.host = session.players[0].id;
      session.players[0].role = 'host';
      session.players[0].permissions = this.getDefaultPermissions(true);
    }

    // End session if no players
    if (session.players.length === 0) {
      session.state = 'finished';
      session.endedAt = new Date();
    }

    this.emitEvent({
      type: 'player_left',
      sessionId,
      timestamp: new Date(),
      data: { playerId }
    });
  }

  /**
   * Start game session
   */
  async startSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw createEngineError(
        `Session '${sessionId}' not found`,
        'SESSION_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (session.state !== 'waiting') {
      throw createEngineError(
        `Session '${sessionId}' is not in waiting state`,
        'SESSION_NOT_WAITING',
        'system',
        'medium'
      );
    }

    if (session.currentPlayers < 2 && session.type !== 'sandbox') {
      throw createEngineError(
        `Session '${sessionId}' needs more players`,
        'INSUFFICIENT_PLAYERS',
        'system',
        'medium'
      );
    }

    session.state = 'starting';
    session.startedAt = new Date();

    // Initialize game state
    const initialGameState: GameState = {
      id: this.generateId(),
      sessionId,
      tick: 0,
      timestamp: Date.now(),
      entities: [],
      events: [],
      scores: session.players.map(p => ({
        playerId: p.id,
        score: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        team: p.team
      })),
      objectives: [],
      environment: {
        time: 0,
        weather: 'clear',
        lighting: { ambient: 0.5, directional: 1.0, color: '#ffffff' },
        effects: []
      }
    };

    const states = this.gameStates.get(sessionId) || [];
    states.push(initialGameState);
    this.gameStates.set(sessionId, states);

    // Update all players to playing state
    for (const player of session.players) {
      player.state = 'playing';
      player.stats.playtime = 0;
    }

    session.state = 'in_progress';

    this.emitEvent({
      type: 'game_started',
      sessionId,
      timestamp: new Date(),
      data: { startTime: session.startedAt }
    });
  }

  /**
   * Update game state
   */
  async updateGameState(sessionId: string, updates: Partial<GameState>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'in_progress') return;

    const states = this.gameStates.get(sessionId) || [];
    const lastState = states[states.length - 1];
    
    const newGameState: GameState = {
      id: this.generateId(),
      sessionId,
      tick: (lastState?.tick || 0) + 1,
      timestamp: Date.now(),
      entities: updates.entities || lastState?.entities || [],
      events: updates.events || [],
      scores: updates.scores || lastState?.scores || [],
      objectives: updates.objectives || lastState?.objectives || [],
      environment: { ...lastState?.environment, ...updates.environment }
    };

    states.push(newGameState);
    
    // Keep only last 100 states
    if (states.length > 100) {
      states.splice(0, states.length - 100);
    }
    
    this.gameStates.set(sessionId, states);

    // Apply synchronization strategy
    await this.synchronizeState(sessionId, newGameState);

    this.emitEvent({
      type: 'state_updated',
      sessionId,
      timestamp: new Date(),
      data: { tick: newGameState.tick }
    });
  }

  /**
   * Update player position
   */
  async updatePlayerPosition(
    sessionId: string,
    playerId: string,
    position: Partial<PlayerPosition>
  ): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) return;

    player.position = {
      ...player.position,
      ...position,
      timestamp: Date.now()
    };

    // Broadcast position update to other players
    const session = this.sessions.get(sessionId);
    if (session) {
      await this.broadcastPositionUpdate(sessionId, playerId, player.position);
    }
  }

  /**
   * Update player score
   */
  async updatePlayerScore(
    sessionId: string,
    playerId: string,
    score: number,
    kills?: number,
    deaths?: number,
    assists?: number
  ): Promise<void> {
    const player = this.players.get(playerId);
    const session = this.sessions.get(sessionId);
    
    if (!player || !session) return;

    player.score = score;
    if (kills !== undefined) player.kills = kills;
    if (deaths !== undefined) player.deaths = deaths;
    if (assists !== undefined) player.assists = assists;

    // Update scores in game state
    const states = this.gameStates.get(sessionId) || [];
    const currentState = states[states.length - 1];
    
    if (currentState) {
      const scoreEntry = currentState.scores.find(s => s.playerId === playerId);
      if (scoreEntry) {
        scoreEntry.score = score;
        if (kills !== undefined) scoreEntry.kills = kills;
        if (deaths !== undefined) scoreEntry.deaths = deaths;
        if (assists !== undefined) scoreEntry.assists = assists;
      }
    }

    this.emitEvent({
      type: 'score_updated',
      sessionId,
      timestamp: new Date(),
      data: { playerId, score, kills, deaths, assists }
    });
  }

  /**
   * Get game session
   */
  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(filter?: {
    type?: GameSession['type'];
    mode?: GameSession['mode'];
    state?: GameSession['state'];
  }): GameSession[] {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      if (filter.type) sessions = sessions.filter(s => s.type === filter.type);
      if (filter.mode) sessions = sessions.filter(s => s.mode === filter.mode);
      if (filter.state) sessions = sessions.filter(s => s.state === filter.state);
    }

    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get player
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get game state
   */
  getGameState(sessionId: string, tick?: number): GameState | undefined {
    const states = this.gameStates.get(sessionId) || [];
    
    if (tick !== undefined) {
      return states.find(s => s.tick === tick);
    }
    
    return states[states.length - 1];
  }

  /**
   * Register game server
   */
  registerServer(server: GameServer): void {
    validators.notNull(server);
    validators.notEmpty(server.name);

    this.servers.set(server.id, server);
  }

  /**
   * Get best server
   */
  async selectBestServer(): Promise<GameServer | undefined> {
    const availableServers = Array.from(this.servers.values())
      .filter(server => server.status === 'online' && server.currentLoad < server.capacity);

    if (availableServers.length === 0) return undefined;

    // Select server with lowest load
    return availableServers.reduce((best, server) => 
      server.currentLoad < best.currentLoad ? server : best
    );
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: MultiplayerEvent) => void
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

  private initializeDefaultStrategies(): void {
    // Competitive strategy - authoritative with high reliability
    this.synchronization.set('competitive', {
      type: 'authoritative',
      updateRate: 60,
      reliability: 'reliable',
      compression: true,
      deltaCompression: true,
      interpolation: true,
      extrapolation: false,
      prediction: true
    });

    // Cooperative strategy - balanced approach
    this.synchronization.set('cooperative', {
      type: 'authoritative',
      updateRate: 30,
      reliability: 'mixed',
      compression: true,
      deltaCompression: true,
      interpolation: true,
      extrapolation: true,
      prediction: true
    });

    // Sandbox strategy - relaxed requirements
    this.synchronization.set('sandbox', {
      type: 'peer_to_peer',
      updateRate: 20,
      reliability: 'unreliable',
      compression: false,
      deltaCompression: false,
      interpolation: true,
      extrapolation: true,
      prediction: true
    });
  }

  private initializeDefaultOptimizations(): void {
    // Competitive optimization - prioritize reliability
    this.optimization.set('competitive', {
      bandwidth: {
        compression: true,
        deltaCompression: true,
        prioritization: true,
        batching: true,
        culling: true,
        levelOfDetail: true
      },
      latency: {
        clientPrediction: true,
        serverReconciliation: true,
        interpolation: true,
        extrapolation: false,
        lagCompensation: true,
        tickRate: 60
      },
      reliability: {
        guaranteedDelivery: true,
        ordering: true,
        duplicateDetection: true,
        errorCorrection: false,
        acknowledgments: true,
        retransmission: true
      },
      security: {
        encryption: true,
        authentication: true,
        antiCheat: true,
        rateLimiting: true,
        validation: true,
        obfuscation: false
      }
    });

    // Cooperative optimization - balanced
    this.optimization.set('cooperative', {
      bandwidth: {
        compression: true,
        deltaCompression: true,
        prioritization: true,
        batching: true,
        culling: false,
        levelOfDetail: false
      },
      latency: {
        clientPrediction: true,
        serverReconciliation: true,
        interpolation: true,
        extrapolation: true,
        lagCompensation: false,
        tickRate: 30
      },
      reliability: {
        guaranteedDelivery: false,
        ordering: true,
        duplicateDetection: true,
        errorCorrection: false,
        acknowledgments: true,
        retransmission: false
      },
      security: {
        encryption: false,
        authentication: true,
        antiCheat: false,
        rateLimiting: true,
        validation: true,
        obfuscation: false
      }
    });

    // Sandbox optimization - prioritize performance
    this.optimization.set('sandbox', {
      bandwidth: {
        compression: false,
        deltaCompression: false,
        prioritization: false,
        batching: false,
        culling: false,
        levelOfDetail: false
      },
      latency: {
        clientPrediction: true,
        serverReconciliation: false,
        interpolation: true,
        extrapolation: true,
        lagCompensation: false,
        tickRate: 20
      },
      reliability: {
        guaranteedDelivery: false,
        ordering: false,
        duplicateDetection: false,
        errorCorrection: false,
        acknowledgments: false,
        retransmission: false
      },
      security: {
        encryption: false,
        authentication: false,
        antiCheat: false,
        rateLimiting: false,
        validation: false,
        obfuscation: false
      }
    });
  }

  private getDefaultStrategy(type: GameSession['type']): SynchronizationStrategy {
    return this.synchronization.get(type) || this.synchronization.get('cooperative')!;
  }

  private getDefaultOptimization(type: GameSession['type']): NetworkOptimization {
    return this.optimization.get(type) || this.optimization.get('cooperative')!;
  }

  private getDefaultPermissions(isHost: boolean): PlayerPermissions {
    return {
      canKick: isHost,
      canBan: isHost,
      canMute: isHost,
      canChangeSettings: isHost,
      canStartGame: isHost,
      canPauseGame: isHost
    };
  }

  private calculateChecksum(settings: GameSettings): string {
    // Simple checksum calculation
    const data = JSON.stringify(settings);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async synchronizeState(sessionId: string, gameState: GameState): Promise<void> {
    const strategy = this.synchronization.get(sessionId);
    const optimization = this.optimization.get(sessionId);
    
    if (!strategy || !optimization) return;

    // In a real implementation, would apply synchronization strategy
    console.log(`Synchronizing state for session ${sessionId} using ${strategy.type} strategy`);
  }

  private async broadcastPositionUpdate(sessionId: string, playerId: string, position: PlayerPosition): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Broadcast to all other players
    for (const player of session.players) {
      if (player.id !== playerId && player.connectionId) {
        try {
          await this.networking.sendMessage(player.connectionId, 'position_update', {
            playerId,
            position
          });
        } catch (error) {
          console.error(`Failed to send position update to player ${player.id}:`, error);
        }
      }
    }
  }

  private emitEvent(event: MultiplayerEvent): void {
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

// Factory function
export function createMultiplayerSystem(networking: AdvancedNetworkingSystem): MultiplayerSystem {
  return new MultiplayerSystem(networking);
}

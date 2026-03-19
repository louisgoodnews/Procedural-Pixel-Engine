/**
 * Matchmaking and Lobby System
 * Provides comprehensive matchmaking and lobby management
 */

import { createEngineError, validators } from '../utils/ErrorHandling';
import { GameSession, Player, GameSettings } from './MultiplayerSystem';

export interface MatchmakingProfile {
  id: string;
  playerId: string;
  skillLevel: number; // 0-100
  preferences: MatchmakingPreferences;
  stats: PlayerStats;
  behavior: BehaviorMetrics;
  reputation: ReputationMetrics;
  region: string;
  language: string[];
  platform: string;
  lastActive: Date;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface MatchmakingPreferences {
  gameTypes: string[];
  gameModes: string[];
  mapPreferences: string[];
  maxLatency: number; // ms
  skillRange: number; // +/- skill level
  teamSize: number;
  private: boolean;
  crossPlatform: boolean;
  voiceChat: boolean;
  competitive: boolean;
  customFilters: Record<string, any>;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  kda: number; // kill/death/assist ratio
  accuracy: number;
  scorePerGame: number;
  playtime: number; // hours
  recentPerformance: number[]; // last 10 games
  favoriteGameMode: string;
  averageGameDuration: number; // minutes
}

export interface BehaviorMetrics {
  sportsmanship: number; // 0-100
  teamwork: number; // 0-100
  communication: number; // 0-100
  reliability: number; // 0-100
  reports: number;
  commendations: number;
  abandonRate: number; // percentage
  afkRate: number; // percentage
  toxicityScore: number; // 0-100 (lower is better)
}

export interface ReputationMetrics {
  overall: number; // 0-100
  trustFactor: number; // 0-100
  priority: number; // matchmaking priority
  penalties: Penalty[];
  rewards: Reward[];
  verification: VerificationStatus;
}

export interface Penalty {
  type: 'abandon' | 'afk' | 'toxicity' | 'cheating' | 'custom';
  severity: 'warning' | 'temporary' | 'permanent';
  reason: string;
  issued: Date;
  expires?: Date;
  active: boolean;
}

export interface Reward {
  type: 'sportsmanship' | 'teamwork' | 'leadership' | 'achievement' | 'custom';
  description: string;
  issued: Date;
  points: number;
}

export interface VerificationStatus {
  email: boolean;
  phone: boolean;
  identity: boolean;
  age: boolean;
  premium: boolean;
  level: number;
}

export interface MatchmakingRequest {
  id: string;
  profileId: string;
  gameType: string;
  gameMode: string;
  teamSize: number;
  priority: 'low' | 'normal' | 'high' | 'premium';
  filters: MatchmakingFilters;
  constraints: MatchmakingConstraints;
  createdAt: Date;
  estimatedWait: number; // seconds
  status: 'searching' | 'found' | 'accepted' | 'declined' | 'expired' | 'cancelled';
}

export interface MatchmakingFilters {
  skillRange?: { min: number; max: number };
  latencyRange?: { min: number; max: number };
  region?: string[];
  language?: string[];
  platform?: string[];
  excludePlayers?: string[];
  includePlayers?: string[];
  customFilters?: Record<string, any>;
}

export interface MatchmakingConstraints {
  maxWaitTime: number; // seconds
  maxLatency: number; // ms
  skillBalance: boolean;
  regionLock: boolean;
  teamBalance: boolean;
  newPlayerProtection: boolean;
  partySize: number;
}

export interface Match {
  id: string;
  gameType: string;
  gameMode: string;
  teams: Team[];
  players: Player[];
  server: MatchServer;
  quality: MatchQuality;
  createdAt: Date;
  estimatedStart: Date;
  status: 'forming' | 'ready' | 'starting' | 'in_progress' | 'finished' | 'cancelled';
}

export interface Team {
  id: string;
  name: string;
  players: string[]; // player IDs
  averageSkill: number;
  averageLatency: number;
  composition: TeamComposition;
  strategy: TeamStrategy;
}

export interface TeamComposition {
  roles: Record<string, number>; // role -> count
  balance: number; // 0-100
  synergy: number; // 0-100
  diversity: number; // 0-100
}

export interface TeamStrategy {
  type: 'balanced' | 'aggressive' | 'defensive' | 'support' | 'custom';
  confidence: number; // 0-100
  reasoning: string;
}

export interface MatchServer {
  id: string;
  region: string;
  address: string;
  port: number;
  capacity: number;
  currentLoad: number;
  performance: ServerPerformance;
  priority: number;
}

export interface ServerPerformance {
  cpu: number; // percentage
  memory: number; // percentage
  bandwidth: number; // Mbps
  latency: number; // ms
  tickRate: number; // Hz
  reliability: number; // 0-100
}

export interface MatchQuality {
  overall: number; // 0-100
  skillBalance: number; // 0-100
  latencyBalance: number; // 0-100
  teamBalance: number; // 0-100
  regionCompatibility: number; // 0-100
  behaviorCompatibility: number; // 0-100
  factors: QualityFactor[];
}

export interface QualityFactor {
  name: string;
  weight: number;
  score: number;
  impact: string;
}

export interface Lobby {
  id: string;
  name: string;
  type: 'public' | 'private' | 'tournament' | 'custom';
  gameType: string;
  gameMode: string;
  maxPlayers: number;
  currentPlayers: number;
  host: string;
  players: LobbyPlayer[];
  settings: LobbySettings;
  state: 'waiting' | 'starting' | 'in_progress' | 'finished' | 'disbanded';
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  role: 'host' | 'member' | 'spectator';
  ready: boolean;
  joined: Date;
  permissions: LobbyPermissions;
  stats: PlayerStats;
}

export interface LobbyPermissions {
  canInvite: boolean;
  canKick: boolean;
  canChangeSettings: boolean;
  canStart: boolean;
  canBan: boolean;
}

export interface LobbySettings {
  private: boolean;
  password?: string;
  maxPlayers: number;
  map: string;
  gameMode: string;
  timeLimit?: number;
  scoreLimit?: number;
  friendlyFire: boolean;
  spectators: boolean;
  voiceChat: boolean;
  customSettings: Record<string, any>;
}

export interface MatchmakingEvent {
  type: 'search_started' | 'search_completed' | 'match_found' | 'match_accepted' | 'match_declined' | 'lobby_created' | 'lobby_updated' | 'error';
  requestId?: string;
  matchId?: string;
  lobbyId?: string;
  playerId?: string;
  timestamp: Date;
  data?: any;
}

export class MatchmakingSystem {
  private profiles = new Map<string, MatchmakingProfile>();
  private requests = new Map<string, MatchmakingRequest>();
  private matches = new Map<string, Match>();
  private lobbies = new Map<string, Lobby>();
  private servers = new Map<string, MatchServer>();
  private eventListeners = new Map<string, Set<(event: MatchmakingEvent) => void>>();
  private algorithms = new Map<string, MatchmakingAlgorithm>();
  private queues = new Map<string, MatchmakingQueue>();

  constructor() {
    this.initializeAlgorithms();
    this.initializeQueues();
  }

  /**
   * Create matchmaking profile
   */
  createProfile(
    playerId: string,
    skillLevel: number,
    preferences: MatchmakingPreferences,
    region: string,
    language: string[] = ['en'],
    platform: string = 'pc'
  ): MatchmakingProfile {
    const profile: MatchmakingProfile = {
      id: this.generateId(),
      playerId,
      skillLevel,
      preferences,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        kda: 1.0,
        accuracy: 0.5,
        scorePerGame: 0,
        playtime: 0,
        recentPerformance: [],
        favoriteGameMode: '',
        averageGameDuration: 15
      },
      behavior: {
        sportsmanship: 75,
        teamwork: 75,
        communication: 75,
        reliability: 75,
        reports: 0,
        commendations: 0,
        abandonRate: 0.05,
        afkRate: 0.02,
        toxicityScore: 25
      },
      reputation: {
        overall: 75,
        trustFactor: 75,
        priority: 50,
        penalties: [],
        rewards: [],
        verification: {
          email: false,
          phone: false,
          identity: false,
          age: false,
          premium: false,
          level: 1
        }
      },
      region,
      language,
      platform,
      lastActive: new Date(),
      status: 'online'
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Start matchmaking
   */
  async startMatchmaking(
    profileId: string,
    gameType: string,
    gameMode: string,
    teamSize: number,
    filters: MatchmakingFilters = {},
    constraints: MatchmakingConstraints = {
      maxWaitTime: 300,
      maxLatency: 150,
      skillBalance: true,
      regionLock: false,
      teamBalance: true,
      newPlayerProtection: true,
      partySize: 1
    }
  ): Promise<MatchmakingRequest> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw createEngineError(
        `Profile '${profileId}' not found`,
        'PROFILE_NOT_FOUND',
        'system',
        'high'
      );
    }

    const requestId = this.generateId();
    const request: MatchmakingRequest = {
      id: requestId,
      profileId,
      gameType,
      gameMode,
      teamSize,
      priority: this.calculatePriority(profile),
      filters,
      constraints,
      createdAt: new Date(),
      estimatedWait: this.estimateWaitTime(profile, gameType, gameMode),
      status: 'searching'
    };

    this.requests.set(requestId, request);

    // Add to appropriate queue
    const queueKey = this.getQueueKey(gameType, gameMode, teamSize);
    const queue = this.queues.get(queueKey);
    if (queue) {
      queue.addRequest(request);
    }

    this.emitEvent({
      type: 'search_started',
      requestId,
      playerId: profile.playerId,
      timestamp: new Date(),
      data: { estimatedWait: request.estimatedWait }
    });

    // Start matchmaking process
    this.processMatchmaking(requestId);

    return request;
  }

  /**
   * Cancel matchmaking
   */
  async cancelMatchmaking(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw createEngineError(
        `Request '${requestId}' not found`,
        'REQUEST_NOT_FOUND',
        'system',
        'medium'
      );
    }

    request.status = 'cancelled';

    // Remove from queue
    const queueKey = this.getQueueKey(request.gameType, request.gameMode, request.teamSize);
    const queue = this.queues.get(queueKey);
    if (queue) {
      queue.removeRequest(requestId);
    }

    this.emitEvent({
      type: 'search_completed',
      requestId,
      playerId: this.profiles.get(request.profileId)?.playerId,
      timestamp: new Date(),
      data: { cancelled: true }
    });
  }

  /**
   * Accept match
   */
  async acceptMatch(matchId: string, playerId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw createEngineError(
        `Match '${matchId}' not found`,
        'MATCH_NOT_FOUND',
        'system',
        'high'
      );
    }

    const player = match.players.find(p => p.id === playerId);
    if (!player) {
      throw createEngineError(
        `Player '${playerId}' not in match '${matchId}'`,
        'PLAYER_NOT_IN_MATCH',
        'system',
        'medium'
      );
    }

    // Mark player as ready
    // In a real implementation, would update player readiness

    this.emitEvent({
      type: 'match_accepted',
      matchId,
      playerId,
      timestamp: new Date()
    });
  }

  /**
   * Decline match
   */
  async declineMatch(matchId: string, playerId: string): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw createEngineError(
        `Match '${matchId}' not found`,
        'MATCH_NOT_FOUND',
        'system',
        'high'
      );
    }

    const playerIndex = match.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      match.players.splice(playerIndex, 1);
    }

    // If not enough players, cancel match
    if (match.players.length < match.teams.reduce((sum, team) => sum + team.players.length, 0)) {
      match.status = 'cancelled';
    }

    this.emitEvent({
      type: 'match_declined',
      matchId,
      playerId,
      timestamp: new Date()
    });
  }

  /**
   * Create lobby
   */
  createLobby(
    name: string,
    type: Lobby['type'],
    gameType: string,
    gameMode: string,
    maxPlayers: number,
    hostId: string,
    settings: Partial<LobbySettings> = {}
  ): Lobby {
    const lobbyId = this.generateId();
    const lobby: Lobby = {
      id: lobbyId,
      name,
      type,
      gameType,
      gameMode,
      maxPlayers,
      currentPlayers: 1,
      host: hostId,
      players: [{
        id: hostId,
        name: 'Host',
        role: 'host',
        ready: false,
        joined: new Date(),
        permissions: {
          canInvite: true,
          canKick: true,
          canChangeSettings: true,
          canStart: true,
          canBan: true
        },
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          kda: 1.0,
          accuracy: 0.5,
          scorePerGame: 0,
          playtime: 0,
          recentPerformance: [],
          favoriteGameMode: '',
          averageGameDuration: 15
        }
      }],
      settings: {
        private: false,
        maxPlayers,
        map: 'default',
        gameMode,
        friendlyFire: false,
        spectators: true,
        voiceChat: true,
        customSettings: {},
        ...settings
      },
      state: 'waiting',
      createdAt: new Date()
    };

    this.lobbies.set(lobbyId, lobby);

    this.emitEvent({
      type: 'lobby_created',
      lobbyId,
      playerId: hostId,
      timestamp: new Date(),
      data: { name, type, gameType, gameMode }
    });

    return lobby;
  }

  /**
   * Join lobby
   */
  async joinLobby(
    lobbyId: string,
    playerId: string,
    playerName: string,
    password?: string
  ): Promise<LobbyPlayer> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      throw createEngineError(
        `Lobby '${lobbyId}' not found`,
        'LOBBY_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (lobby.state !== 'waiting') {
      throw createEngineError(
        `Lobby '${lobbyId}' is not joinable`,
        'LOBBY_NOT_JOINABLE',
        'system',
        'medium'
      );
    }

    if (lobby.currentPlayers >= lobby.maxPlayers) {
      throw createEngineError(
        `Lobby '${lobbyId}' is full`,
        'LOBBY_FULL',
        'system',
        'medium'
      );
    }

    if (lobby.settings.private && lobby.settings.password !== password) {
      throw createEngineError(
        'Invalid password for private lobby',
        'INVALID_PASSWORD',
        'system',
        'medium'
      );
    }

    const player: LobbyPlayer = {
      id: playerId,
      name: playerName,
      role: 'member',
      ready: false,
      joined: new Date(),
      permissions: {
        canInvite: false,
        canKick: false,
        canChangeSettings: false,
        canStart: false,
        canBan: false
      },
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        kda: 1.0,
        accuracy: 0.5,
        scorePerGame: 0,
        playtime: 0,
        recentPerformance: [],
        favoriteGameMode: '',
        averageGameDuration: 15
      }
    };

    lobby.players.push(player);
    lobby.currentPlayers++;

    this.emitEvent({
      type: 'lobby_updated',
      lobbyId,
      playerId,
      timestamp: new Date(),
      data: { action: 'joined', playerName }
    });

    return player;
  }

  /**
   * Leave lobby
   */
  async leaveLobby(lobbyId: string, playerId: string): Promise<void> {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      lobby.players.splice(playerIndex, 1);
      lobby.currentPlayers--;
    }

    // Transfer host if original host left
    if (lobby.host === playerId && lobby.players.length > 0) {
      lobby.host = lobby.players[0].id;
      lobby.players[0].role = 'host';
      lobby.players[0].permissions = {
        canInvite: true,
        canKick: true,
        canChangeSettings: true,
        canStart: true,
        canBan: true
      };
    }

    // Disband lobby if no players
    if (lobby.players.length === 0) {
      lobby.state = 'disbanded';
    }

    this.emitEvent({
      type: 'lobby_updated',
      lobbyId,
      playerId,
      timestamp: new Date(),
      data: { action: 'left' }
    });
  }

  /**
   * Get matchmaking profile
   */
  getProfile(profileId: string): MatchmakingProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get matchmaking request
   */
  getRequest(requestId: string): MatchmakingRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get match
   */
  getMatch(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Get lobby
   */
  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies.get(lobbyId);
  }

  /**
   * Get available lobbies
   */
  getAvailableLobbies(filter?: {
    gameType?: string;
    gameMode?: string;
    region?: string;
    private?: boolean;
    hasPassword?: boolean;
  }): Lobby[] {
    let lobbies = Array.from(this.lobbies.values())
      .filter(lobby => lobby.state === 'waiting');

    if (filter) {
      if (filter.gameType) lobbies = lobbies.filter(l => l.gameType === filter.gameType);
      if (filter.gameMode) lobbies = lobbies.filter(l => l.gameMode === filter.gameMode);
      if (filter.private !== undefined) lobbies = lobbies.filter(l => l.settings.private === filter.private);
      if (filter.hasPassword !== undefined) {
        lobbies = lobbies.filter(l => !!l.settings.password === filter.hasPassword);
      }
    }

    return lobbies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Register matchmaking server
   */
  registerServer(server: MatchServer): void {
    validators.notNull(server);
    validators.notEmpty(server.id);

    this.servers.set(server.id, server);
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: MatchmakingEvent) => void
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

  private initializeAlgorithms(): void {
    // Skill-based matchmaking
    this.algorithms.set('skill_based', {
      name: 'Skill Based',
      description: 'Matches players based on skill level',
      weight: 0.4,
      factors: ['skill', 'winRate', 'recentPerformance']
    });

    // Latency-based matchmaking
    this.algorithms.set('latency_based', {
      name: 'Latency Based',
      description: 'Matches players based on network latency',
      weight: 0.3,
      factors: ['latency', 'region', 'connection']
    });

    // Behavior-based matchmaking
    this.algorithms.set('behavior_based', {
      name: 'Behavior Based',
      description: 'Matches players based on behavior and reputation',
      weight: 0.2,
      factors: ['sportsmanship', 'teamwork', 'reliability']
    });

    // Balanced matchmaking
    this.algorithms.set('balanced', {
      name: 'Balanced',
      description: 'Balanced approach considering all factors',
      weight: 0.1,
      factors: ['skill', 'latency', 'behavior', 'preferences']
    });
  }

  private initializeQueues(): void {
    // Initialize common game queues
    const commonQueues = [
      { gameType: 'fps', gameMode: 'deathmatch', teamSize: 1 },
      { gameType: 'fps', gameMode: 'team_deathmatch', teamSize: 4 },
      { gameType: 'fps', gameMode: 'capture_the_flag', teamSize: 8 },
      { gameType: 'moba', gameMode: 'classic', teamSize: 5 },
      { gameType: 'moba', gameMode: 'aram', teamSize: 5 },
      { gameType: 'battle_royale', gameMode: 'solo', teamSize: 1 },
      { gameType: 'battle_royale', gameMode: 'squads', teamSize: 4 },
      { gameType: 'battle_royale', gameMode: 'teams', teamSize: 8 }
    ];

    for (const queue of commonQueues) {
      const key = this.getQueueKey(queue.gameType, queue.gameMode, queue.teamSize);
      this.queues.set(key, new MatchmakingQueue(key, queue));
    }
  }

  private calculatePriority(profile: MatchmakingProfile): 'low' | 'normal' | 'high' | 'premium' {
    if (profile.reputation.verification.premium) return 'premium';
    if (profile.reputation.priority > 75) return 'high';
    if (profile.reputation.priority > 25) return 'normal';
    return 'low';
  }

  private estimateWaitTime(profile: MatchmakingProfile, gameType: string, gameMode: string): number {
    // Simple estimation based on player skill and popularity
    const baseWait = 30; // seconds
    const skillModifier = Math.abs(profile.skillLevel - 50) / 50; // 0-1
    const popularityModifier = gameType === 'fps' ? 0.5 : 1.0;
    
    return Math.round(baseWait * (1 + skillModifier) * popularityModifier);
  }

  private getQueueKey(gameType: string, gameMode: string, teamSize: number): string {
    return `${gameType}_${gameMode}_${teamSize}`;
  }

  private async processMatchmaking(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;

    const queueKey = this.getQueueKey(request.gameType, request.gameMode, request.teamSize);
    const queue = this.queues.get(queueKey);
    
    if (!queue) return;

    // Try to find match
    const match = await this.findMatch(request);
    if (match) {
      request.status = 'found';
      this.matches.set(match.id, match);

      this.emitEvent({
        type: 'match_found',
        requestId,
        matchId: match.id,
        playerId: this.profiles.get(request.profileId)?.playerId,
        timestamp: new Date(),
        data: { match }
      });
    } else {
      // Continue searching
      setTimeout(() => this.processMatchmaking(requestId), 5000);
    }
  }

  private async findMatch(request: MatchmakingRequest): Promise<Match | undefined> {
    const profile = this.profiles.get(request.profileId);
    if (!profile) return undefined;

    // Find compatible requests
    const queueKey = this.getQueueKey(request.gameType, request.gameMode, request.teamSize);
    const queue = this.queues.get(queueKey);
    if (!queue) return undefined;

    const compatibleRequests = queue.findCompatibleRequests(request, profile);
    
    if (compatibleRequests.length >= request.teamSize - 1) {
      // Create match with found players
      return this.createMatch(request, compatibleRequests.slice(0, request.teamSize - 1));
    }

    return undefined;
  }

  private createMatch(request: MatchmakingRequest, otherRequests: MatchmakingRequest[]): Match {
    const matchId = this.generateId();
    const allRequests = [request, ...otherRequests];
    const players = allRequests.map(req => this.profiles.get(req.profileId)!);

    // Create balanced teams
    const teams = this.createBalancedTeams(players, request.teamSize);

    // Find best server
    const server = this.findBestServer(players);

    const match: Match = {
      id: matchId,
      gameType: request.gameType,
      gameMode: request.gameMode,
      teams,
      players,
      server,
      quality: this.calculateMatchQuality(teams, players, server),
      createdAt: new Date(),
      estimatedStart: new Date(Date.now() + 30000), // 30 seconds from now
      status: 'forming'
    };

    // Update all requests
    for (const req of allRequests) {
      req.status = 'found';
    }

    return match;
  }

  private createBalancedTeams(players: MatchmakingProfile[], teamSize: number): Team[] {
    // Simple team balancing - in reality would use more sophisticated algorithms
    const teams: Team[] = [];
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i += teamSize) {
      const teamPlayers = shuffled.slice(i, i + teamSize);
      const team: Team = {
        id: this.generateId(),
        name: `Team ${Math.floor(i / teamSize) + 1}`,
        players: teamPlayers.map(p => p.playerId),
        averageSkill: teamPlayers.reduce((sum, p) => sum + p.skillLevel, 0) / teamPlayers.length,
        averageLatency: 50, // Mock value
        composition: {
          roles: {},
          balance: 75,
          synergy: 75,
          diversity: 75
        },
        strategy: {
          type: 'balanced',
          confidence: 75,
          reasoning: 'Balanced team composition'
        }
      };
      teams.push(team);
    }

    return teams;
  }

  private findBestServer(players: MatchmakingProfile[]): MatchServer {
    // Find server with best average latency for all players
    const availableServers = Array.from(this.servers.values())
      .filter(server => server.status === 'online' && server.currentLoad < server.capacity);

    if (availableServers.length === 0) {
      // Create default server
      const defaultServer: MatchServer = {
        id: 'default',
        region: 'us-east',
        address: 'localhost',
        port: 7777,
        capacity: 100,
        currentLoad: 0,
        performance: {
          cpu: 50,
          memory: 50,
          bandwidth: 100,
          latency: 50,
          tickRate: 60,
          reliability: 95
        },
        priority: 50
      };
      return defaultServer;
    }

    return availableServers[0]; // Simple selection - would use better algorithm
  }

  private calculateMatchQuality(teams: Team[], players: MatchmakingProfile[], server: MatchServer): MatchQuality {
    const skillBalance = this.calculateSkillBalance(teams);
    const latencyBalance = this.calculateLatencyBalance(players);
    const teamBalance = this.calculateTeamBalance(teams);
    const regionCompatibility = this.calculateRegionCompatibility(players);
    const behaviorCompatibility = this.calculateBehaviorCompatibility(players);

    const overall = (skillBalance * 0.3 + latencyBalance * 0.25 + teamBalance * 0.2 + 
                     regionCompatibility * 0.15 + behaviorCompatibility * 0.1);

    return {
      overall,
      skillBalance,
      latencyBalance,
      teamBalance,
      regionCompatibility,
      behaviorCompatibility,
      factors: [
        { name: 'skill_balance', weight: 0.3, score: skillBalance, impact: 'High' },
        { name: 'latency_balance', weight: 0.25, score: latencyBalance, impact: 'Medium' },
        { name: 'team_balance', weight: 0.2, score: teamBalance, impact: 'Medium' },
        { name: 'region_compatibility', weight: 0.15, score: regionCompatibility, impact: 'Low' },
        { name: 'behavior_compatibility', weight: 0.1, score: behaviorCompatibility, impact: 'Low' }
      ]
    };
  }

  private calculateSkillBalance(teams: Team[]): number {
    const skillLevels = teams.map(team => team.averageSkill);
    const avgSkill = skillLevels.reduce((sum, skill) => sum + skill, 0) / skillLevels.length;
    const variance = skillLevels.reduce((sum, skill) => sum + Math.pow(skill - avgSkill, 2), 0) / skillLevels.length;
    
    // Lower variance = better balance
    return Math.max(0, 100 - variance);
  }

  private calculateLatencyBalance(players: MatchmakingProfile[]): number {
    // Mock calculation - would use actual latency data
    return 85;
  }

  private calculateTeamBalance(teams: Team[]): number {
    // Mock calculation - would use actual team composition analysis
    return 80;
  }

  private calculateRegionCompatibility(players: MatchmakingProfile[]): number {
    const regions = players.map(p => p.region);
    const uniqueRegions = new Set(regions);
    
    // More players in same region = better compatibility
    return 100 - (uniqueRegions.size - 1) * 20;
  }

  private calculateBehaviorCompatibility(players: MatchmakingProfile[]): number {
    const avgSportsmanship = players.reduce((sum, p) => sum + p.behavior.sportsmanship, 0) / players.length;
    const avgTeamwork = players.reduce((sum, p) => sum + p.behavior.teamwork, 0) / players.length;
    
    return (avgSportsmanship + avgTeamwork) / 2;
  }

  private emitEvent(event: MatchmakingEvent): void {
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

interface MatchmakingAlgorithm {
  name: string;
  description: string;
  weight: number;
  factors: string[];
}

class MatchmakingQueue {
  private requests: MatchmakingRequest[] = [];
  private key: string;
  private config: any;

  constructor(key: string, config: any) {
    this.key = key;
    this.config = config;
  }

  addRequest(request: MatchmakingRequest): void {
    this.requests.push(request);
    this.sortByPriority();
  }

  removeRequest(requestId: string): void {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      this.requests.splice(index, 1);
    }
  }

  findCompatibleRequests(request: MatchmakingRequest, profile: MatchmakingProfile): MatchmakingRequest[] {
    return this.requests.filter(req => 
      req.id !== request.id &&
      this.isCompatible(request, req, profile)
    );
  }

  private sortByPriority(): void {
    const priorityOrder = { 'premium': 0, 'high': 1, 'normal': 2, 'low': 3 };
    this.requests.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private isCompatible(request1: MatchmakingRequest, request2: MatchmakingRequest, profile: MatchmakingProfile): boolean {
    // Simple compatibility check
    return true; // In reality would check filters, constraints, etc.
  }
}

// Factory function
export function createMatchmakingSystem(): MatchmakingSystem {
  return new MatchmakingSystem();
}

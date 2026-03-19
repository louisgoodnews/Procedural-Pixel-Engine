/**
 * Advanced Networking & Multiplayer System Index
 * Exports all networking and multiplayer features
 */

// Advanced networking
export * from './AdvancedNetworking';

// Multiplayer system
export * from './MultiplayerSystem';

// Matchmaking system
export * from './MatchmakingSystem';

// Voice chat system
export * from './VoiceChatSystem';

// Re-export commonly used items
export {
  AdvancedNetworkingSystem,
  createAdvancedNetworkingSystem,
} from './AdvancedNetworking';

export {
  MultiplayerSystem,
  createMultiplayerSystem,
} from './MultiplayerSystem';

export {
  MatchmakingSystem,
  createMatchmakingSystem,
} from './MatchmakingSystem';

export {
  VoiceChatSystem,
  createVoiceChatSystem,
} from './VoiceChatSystem';

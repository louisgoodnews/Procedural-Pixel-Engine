/**
 * Social Features & Community System
 * Provides comprehensive social features for building community and enhancing multiplayer experience
 */

// Friend system types
export enum FriendStatus {
  NONE = 'none',
  PENDING = 'pending',
  FRIEND = 'friend',
  BLOCKED = 'blocked',
  MUTED = 'muted'
}

export enum FriendRequestStatus {
  SENT = 'sent',
  RECEIVED = 'received',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled'
}

export interface FriendSystem {
  friends: Friend[];
  requests: FriendRequest[];
  blocked: BlockedUser[];
  settings: FriendSettings;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  addedDate: Date;
  lastInteraction: Date;
  mutualFriends: string[];
  favorite: boolean;
  notes: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message: string;
  sentDate: Date;
  respondedDate?: Date;
}

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  reason: string;
  blockedDate: Date;
  expires?: Date;
}

export interface FriendSettings {
  allowRequests: boolean;
  autoAccept: boolean;
  showOnlineStatus: boolean;
  showActivity: boolean;
  friendSuggestions: boolean;
  mutualFriends: boolean;
  maxFriends: number;
  privacy: FriendPrivacy;
}

export interface FriendPrivacy {
  profileVisibility: 'public' | 'friends' | 'private';
  friendListVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  allowSearch: boolean;
  allowRecommendations: boolean;
}

// Chat system types
export enum ChatChannelType {
  GLOBAL = 'global',
  TRADE = 'trade',
  GUILD = 'guild',
  PARTY = 'party',
  PRIVATE = 'private',
  SYSTEM = 'system'
}

export enum ChatMessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  SYSTEM = 'system',
  COMMAND = 'command'
}

export interface ChatSystem {
  channels: ChatChannel[];
  messages: ChatMessage[];
  settings: ChatSettings;
  moderation: ChatModeration;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChatChannelType;
  members: string[];
  admins: string[];
  description: string;
  isPublic: boolean;
  isTemporary: boolean;
  createdAt: Date;
  lastActivity: Date;
  messageLimit: number;
  permissions: ChannelPermissions;
}

export interface ChannelPermissions {
  canRead: string[];
  canWrite: string[];
  canModerate: string[];
  canManage: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  type: ChatMessageType;
  content: string;
  attachments: MessageAttachment[];
  timestamp: Date;
  edited?: Date;
  deleted?: Date;
  reactions: MessageReaction[];
  replies: string[];
  mentions: string[];
  isSystem: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatSettings {
  enableSound: boolean;
  enableNotifications: boolean;
  enableTimestamps: boolean;
  enableEmojis: boolean;
  enableGifs: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableVideos: boolean;
  enableFiles: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  maxHistory: number;
}

export interface ChatModeration {
  filters: ChatFilter[];
  autoModeration: boolean;
  bannedWords: string[];
  spamDetection: boolean;
  linkValidation: boolean;
  imageModeration: boolean;
  reportSystem: boolean;
}

export interface ChatFilter {
  id: string;
  name: string;
  pattern: string;
  action: 'warn' | 'delete' | 'block' | 'replace';
  replacement?: string;
  enabled: boolean;
}

// Leaderboard system types
export enum LeaderboardType {
  GLOBAL = 'global',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  GUILD = 'guild',
  FRIENDS = 'friends',
  REGION = 'region'
}

export enum LeaderboardSortOrder {
  ASCENDING = 'ascending',
  DESCENDING = 'descending'
}

export interface LeaderboardSystem {
  leaderboards: Leaderboard[];
  entries: LeaderboardEntry[];
  settings: LeaderboardSettings;
  rewards: LeaderboardReward[];
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: LeaderboardType;
  category: string;
  metric: string;
  sortOrder: LeaderboardSortOrder;
  maxEntries: number;
  resetSchedule: ResetSchedule;
  isActive: boolean;
  createdDate: Date;
  lastReset: Date;
  nextReset: Date;
}

export interface ResetSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  timezone: string;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface LeaderboardEntry {
  id: string;
  leaderboardId: string;
  userId: string;
  rank: number;
  score: number;
  previousRank?: number;
  data: LeaderboardData;
  achievedDate: Date;
  lastUpdated: Date;
}

export interface LeaderboardData {
  username: string;
  avatar: string;
  level: number;
  guild?: string;
  region?: string;
  additionalStats: { [key: string]: any };
}

export interface LeaderboardSettings {
  showRank: boolean;
  showScore: boolean;
  showUsername: boolean;
  showAvatar: boolean;
  showGuild: boolean;
  showRegion: boolean;
  refreshInterval: number;
  cacheDuration: number;
  maxCachedEntries: number;
}

export interface LeaderboardReward {
  id: string;
  leaderboardId: string;
  rank: number | 'range';
  rewards: RewardItem[];
  distributed: boolean;
  distributedDate?: Date;
}

export interface RewardItem {
  type: 'currency' | 'item' | 'title' | 'badge' | 'experience';
  id: string;
  name: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Achievement system types
export enum AchievementType {
  PROGRESSION = 'progression',
  COMPLETION = 'completion',
  COLLECTION = 'collection',
  CHALLENGE = 'challenge',
  SOCIAL = 'social',
  TIME_BASED = 'time_based',
  SECRET = 'secret'
}

export enum AchievementDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme'
}

export enum AchievementStatus {
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  HIDDEN = 'hidden'
}

export interface AchievementSystem {
  achievements: Achievement[];
  userProgress: UserAchievement[];
  categories: AchievementCategory[];
  rewards: AchievementReward[];
  notifications: AchievementNotification[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  difficulty: AchievementDifficulty;
  category: string;
  points: number;
  isHidden: boolean;
  prerequisites: string[];
  criteria: AchievementCriteria[];
  rewards: AchievementReward[];
  statistics: AchievementStatistics;
  createdDate: Date;
}

export interface AchievementCriteria {
  id: string;
  type: 'count' | 'progress' | 'condition' | 'collection';
  target: number;
  current: number;
  description: string;
  parameters?: { [key: string]: any };
}

export interface AchievementStatistics {
  unlockedCount: number;
  totalPoints: number;
  completionRate: number;
  averageTime: number;
  difficulty: AchievementDifficulty;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  status: AchievementStatus;
  progress: AchievementProgress[];
  unlockedDate?: Date;
  completionDate?: Date;
  shareCount: number;
  isFavorite: boolean;
}

export interface AchievementProgress {
  criteriaId: string;
  current: number;
  target: number;
  completed: boolean;
  completedDate?: Date;
}

export interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isHidden: boolean;
  achievementCount: number;
}

export interface AchievementReward {
  type: 'points' | 'title' | 'badge' | 'item' | 'currency' | 'experience';
  id: string;
  name: string;
  description: string;
  quantity: number;
  icon?: string;
}

export interface AchievementNotification {
  id: string;
  userId: string;
  achievementId: string;
  type: 'unlocked' | 'progress' | 'milestone';
  message: string;
  isRead: boolean;
  createdDate: Date;
  expiresDate?: Date;
}

// Player profile types
export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

export enum ProfileStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
  INVISIBLE = 'invisible'
}

export interface PlayerProfile {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  banner: string;
  bio: string;
  location: string;
  website: string;
  socialLinks: SocialLink[];
  status: ProfileStatus;
  visibility: ProfileVisibility;
  statistics: ProfileStatistics;
  achievements: ProfileAchievement[];
  preferences: ProfilePreferences;
  customization: ProfileCustomization;
  createdDate: Date;
  lastUpdated: Date;
}

export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface ProfileStatistics {
  level: number;
  experience: number;
  playTime: number;
  sessions: number;
  achievements: number;
  friends: number;
  guilds: number;
  favoriteGames: string[];
  recentActivity: ProfileActivity[];
}

export interface ProfileActivity {
  type: string;
  description: string;
  timestamp: Date;
  data: any;
}

export interface ProfileAchievement {
  achievementId: string;
  unlockedDate: Date;
  isPublic: boolean;
  showcase: boolean;
}

export interface ProfilePreferences {
  showOnlineStatus: boolean;
  showPlayTime: boolean;
  showAchievements: boolean;
  showFriends: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  allowInvitations: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  friendRequests: boolean;
  messages: boolean;
  invitations: boolean;
  achievements: boolean;
  updates: boolean;
  email: boolean;
  push: boolean;
}

export interface ProfileCustomization {
  theme: ProfileTheme;
  layout: ProfileLayout;
  widgets: ProfileWidget[];
  badges: ProfileBadge[];
  titles: ProfileTitle[];
}

export interface ProfileTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface ProfileLayout {
  sections: ProfileSection[];
  order: string[];
  columns: number;
}

export interface ProfileSection {
  id: string;
  type: 'about' | 'statistics' | 'achievements' | 'activity' | 'custom';
  title: string;
  visible: boolean;
  order: number;
}

export interface ProfileWidget {
  id: string;
  type: 'statistic' | 'achievement' | 'activity' | 'custom';
  title: string;
  data: any;
  position: { x: number, y: number };
  size: { width: number, height: number };
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedDate: Date;
  isEquipped: boolean;
}

export interface ProfileTitle {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  earnedDate: Date;
  isActive: boolean;
}

// Social sharing types
export enum ShareType {
  SCREENSHOT = 'screenshot',
  VIDEO = 'video',
  ACHIEVEMENT = 'achievement',
  STATISTICS = 'statistics',
  PROFILE = 'profile',
  CUSTOM = 'custom'
}

export enum SharePlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  DISCORD = 'discord',
  REDDIT = 'reddit',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin'
}

export interface SocialSharing {
  shares: SocialShare[];
  templates: ShareTemplate[];
  settings: ShareSettings;
  analytics: ShareAnalytics;
}

export interface SocialShare {
  id: string;
  userId: string;
  type: ShareType;
  platform: SharePlatform;
  content: ShareContent;
  url: string;
  visibility: ShareVisibility;
  tags: string[];
  createdDate: Date;
  expiresDate?: Date;
  statistics: ShareStatistics;
}

export interface ShareContent {
  title: string;
  description: string;
  media: ShareMedia[];
  metadata: ShareMetadata;
}

export interface ShareMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
}

export interface ShareMetadata {
  game: string;
  platform: string;
  achievement?: string;
  statistics?: { [key: string]: any };
  customData?: { [key: string]: any };
}

export interface ShareVisibility {
  public: boolean;
  friends: boolean;
  guild: boolean;
  followers: boolean;
}

export interface ShareStatistics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagement: number;
}

export interface ShareTemplate {
  id: string;
  name: string;
  type: ShareType;
  platforms: SharePlatform[];
  template: string;
  variables: ShareVariable[];
  isActive: boolean;
}

export interface ShareVariable {
  name: string;
  type: 'text' | 'image' | 'video' | 'statistic';
  required: boolean;
  defaultValue?: string;
}

export interface ShareSettings {
  autoShare: boolean;
  defaultVisibility: ShareVisibility;
  watermark: boolean;
  branding: boolean;
  analytics: boolean;
  approval: boolean;
}

export interface ShareAnalytics {
  sharesByPlatform: { [platform: string]: number };
  sharesByType: { [type: string]: number };
  engagementMetrics: EngagementMetric[];
  trends: ShareTrend[];
}

export interface EngagementMetric {
  platform: string;
  type: string;
  value: number;
  date: Date;
}

export interface ShareTrend {
  date: Date;
  shares: number;
  engagement: number;
  growth: number;
}

// Community event system types
export enum EventType {
  TOURNAMENT = 'tournament',
  COMPETITION = 'competition',
  CHALLENGE = 'challenge',
  GUILD_EVENT = 'guild_event',
  COMMUNITY_EVENT = 'community_event',
  SEASONAL_EVENT = 'seasonal_event',
  SPECIAL_EVENT = 'special_event'
}

export enum EventStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export interface CommunityEventSystem {
  events: CommunityEvent[];
  participants: EventParticipant[];
  registrations: EventRegistration[];
  rewards: EventReward[];
  calendar: EventCalendar;
}

export interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  registrationStart: Date;
  registrationEnd: Date;
  maxParticipants?: number;
  minParticipants?: number;
  requirements: EventRequirement[];
  rules: EventRule[];
  rewards: EventReward[];
  schedule: EventSchedule[];
  location: EventLocation;
  organizers: string[];
  tags: string[];
  banner: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface EventRequirement {
  type: 'level' | 'achievement' | 'guild' | 'item' | 'custom';
  value: any;
  description: string;
  optional: boolean;
}

export interface EventRule {
  id: string;
  name: string;
  description: string;
  type: 'restriction' | 'behavior' | 'scoring';
  conditions: EventCondition[];
  actions: EventAction[];
}

export interface EventCondition {
  type: string;
  operator: string;
  value: any;
}

export interface EventAction {
  type: string;
  parameters: any;
}

export interface EventSchedule {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  description: string;
  activities: EventActivity[];
}

export interface EventActivity {
  name: string;
  type: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  requirements?: EventRequirement[];
}

export interface EventLocation {
  type: 'in_game' | 'real_world' | 'virtual' | 'hybrid';
  name: string;
  address?: string;
  coordinates?: { lat: number, lng: number };
  capacity?: number;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: 'registered' | 'confirmed' | 'attended' | 'withdrawn' | 'disqualified';
  registrationDate: Date;
  teamId?: string;
  role?: string;
  statistics: ParticipantStatistics;
}

export interface ParticipantStatistics {
  score: number;
  rank: number;
  achievements: string[];
  activities: string[];
  timeSpent: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlist';
  registrationDate: Date;
  responseDate?: Date;
  teamId?: string;
  notes?: string;
}

export interface EventReward {
  id: string;
  eventId: string;
  type: 'participation' | 'placement' | 'achievement' | 'special';
  criteria: EventRewardCriteria;
  rewards: RewardItem[];
  distributed: boolean;
  distributedDate?: Date;
}

export interface EventRewardCriteria {
  placement?: { min: number, max: number };
  score?: { min: number, max: number };
  achievements?: string[];
  participation?: boolean;
}

export interface EventCalendar {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  filters: CalendarFilter[];
}

export interface CalendarEvent {
  id: string;
  eventId: string;
  date: Date;
  duration: number;
  allDay: boolean;
  reminder: boolean;
  reminderTime?: number;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  filter: string;
}

export interface CalendarFilter {
  type: 'type' | 'status' | 'location' | 'organizer';
  value: string;
  enabled: boolean;
}

// Player statistics and tracking types
export enum StatisticType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  TIMER = 'timer',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RANKING = 'ranking'
}

export enum StatisticCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  ECONOMY = 'economy',
  ACHIEVEMENT = 'achievement',
  CUSTOM = 'custom'
}

export interface PlayerStatistics {
  id: string;
  userId: string;
  statistics: Statistic[];
  history: StatisticHistory[];
  rankings: StatisticRanking[];
  comparisons: StatisticComparison[];
  achievements: StatisticAchievement[];
  goals: StatisticGoal[];
}

export interface Statistic {
  id: string;
  name: string;
  description: string;
  type: StatisticType;
  category: StatisticCategory;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  lastUpdated: Date;
  isPublic: boolean;
  isFavorite: boolean;
  unit?: string;
  precision?: number;
}

export interface StatisticHistory {
  statisticId: string;
  timestamp: Date;
  value: number;
  event?: string;
  metadata?: any;
}

export interface StatisticRanking {
  statisticId: string;
  rank: number;
  totalPlayers: number;
  percentile: number;
  rankType: 'global' | 'region' | 'guild' | 'friends';
  lastUpdated: Date;
}

export interface StatisticComparison {
  userId: string;
  statisticId: string;
  comparisonType: 'friend' | 'guild' | 'global' | 'average';
  values: ComparisonValue[];
  trends: ComparisonTrend[];
}

export interface ComparisonValue {
  userId: string;
  username: string;
  value: number;
  rank: number;
  difference: number;
  percentage: number;
}

export interface ComparisonTrend {
  period: string;
  userValue: number;
  averageValue: number;
  rankValue: number;
}

export interface StatisticAchievement {
  statisticId: string;
  achievementId: string;
  threshold: number;
  unlocked: boolean;
  unlockedDate?: Date;
}

export interface StatisticGoal {
  id: string;
  statisticId: string;
  target: number;
  current: number;
  deadline?: Date;
  isCompleted: boolean;
  createdDate: Date;
  completedDate?: Date;
}

// Guild or clan system types
export enum GuildRole {
  LEADER = 'leader',
  OFFICER = 'officer',
  MEMBER = 'member',
  RECRUIT = 'recruit',
  INITIATE = 'initiate'
}

export enum GuildType {
  CASUAL = 'casual',
  HARDCORE = 'hardcore',
  COMPETITIVE = 'competitive',
  SOCIAL = 'social',
  ROLEPLAYING = 'roleplaying',
  COMMUNITY = 'community'
}

export enum GuildStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RECRUITING = 'recruiting',
  CLOSED = 'closed',
  DISBANDED = 'disbanded'
}

export interface GuildSystem {
  guilds: Guild[];
  members: GuildMember[];
  applications: GuildApplication[];
  activities: GuildActivity[];
  settings: GuildSettings;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  type: GuildType;
  status: GuildStatus;
  leaderId: string;
  officerIds: string[];
  memberIds: string[];
  level: number;
  experience: number;
  rank: number;
  banner: string;
  emblem: string;
  colors: GuildColors;
  requirements: GuildRequirement[];
  rules: GuildRule[];
  roles: GuildRole[];
  permissions: GuildPermission[];
  treasury: GuildTreasury;
  stronghold: GuildStronghold;
  statistics: GuildStatistics;
  createdDate: Date;
  lastActivity: Date;
}

export interface GuildColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface GuildRequirement {
  type: 'level' | 'achievement' | 'class' | 'custom';
  value: any;
  description: string;
}

export interface GuildRule {
  id: string;
  title: string;
  description: string;
  order: number;
  enforced: boolean;
}

export interface GuildRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  canInvite: boolean;
  canKick: boolean;
  canPromote: boolean;
  canManageTreasury: boolean;
  canManageStronghold: boolean;
  sortOrder: number;
}

export interface GuildPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface GuildTreasury {
  balance: number;
  currency: string;
  transactions: GuildTransaction[];
  logs: GuildLog[];
}

export interface GuildTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase';
  amount: number;
  userId: string;
  description: string;
  timestamp: Date;
}

export interface GuildLog {
  id: string;
  type: string;
  userId: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface GuildStronghold {
  level: number;
  name: string;
  type: string;
  rooms: StrongholdRoom[];
  decorations: StrongholdDecoration[];
  upgrades: StrongholdUpgrade[];
}

export interface StrongholdRoom {
  id: string;
  name: string;
  type: string;
  level: number;
  capacity: number;
  functions: string[];
}

export interface StrongholdDecoration {
  id: string;
  name: string;
  type: string;
  location: string;
  unlocked: boolean;
}

export interface StrongholdUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  unlockedDate?: Date;
}

export interface GuildStatistics {
  members: number;
  averageLevel: number;
  totalExperience: number;
  achievements: number;
  playTime: number;
  activity: GuildActivity[];
}

export interface GuildActivity {
  type: string;
  description: string;
  timestamp: Date;
  participants: string[];
  data: any;
}

export interface GuildMember {
  id: string;
  guildId: string;
  userId: string;
  role: GuildRole;
  rank: string;
  joinedDate: Date;
  lastActive: Date;
  contributions: GuildContribution[];
  permissions: string[];
  notes: string;
  isOnline: boolean;
}

export interface GuildContribution {
  type: 'experience' | 'currency' | 'items' | 'activities';
  amount: number;
  description: string;
  timestamp: Date;
}

export interface GuildApplication {
  id: string;
  guildId: string;
  userId: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  submittedDate: Date;
  reviewedDate?: Date;
  reviewedBy?: string;
  response?: string;
}

export interface GuildSettings {
  privacy: GuildPrivacy;
  recruitment: GuildRecruitment;
  communication: GuildCommunication;
  management: GuildManagement;
}

export interface GuildPrivacy {
  memberListVisible: boolean;
  statisticsVisible: boolean;
  activityVisible: boolean;
  applicationsVisible: boolean;
  allowSearch: boolean;
}

export interface GuildRecruitment {
  isOpen: boolean;
  autoAccept: boolean;
  requirements: GuildRequirement[];
  message: string;
  channels: string[];
}

export interface GuildCommunication {
  chatChannels: string[];
  announcementChannels: string[];
  voiceChannels: string[];
  allowInvites: boolean;
  allowMessages: boolean;
}

export interface GuildManagement {
  leaderCanTransfer: boolean;
  officerCanInvite: boolean;
  officerCanKick: boolean;
  votingEnabled: boolean;
  votingThreshold: number;
  inactivityPeriod: number;
}

// Social media integration types
export enum SocialMediaPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  DISCORD = 'discord',
  REDDIT = 'reddit',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin',
  TWITCH = 'twitch',
  STEAM = 'steam'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending'
}

export interface SocialMediaIntegration {
  platforms: ConnectedPlatform[];
  settings: IntegrationSettings;
  posts: SocialPost[];
  analytics: SocialAnalytics;
  automation: SocialAutomation;
}

export interface ConnectedPlatform {
  id: string;
  platform: SocialMediaPlatform;
  userId: string;
  username: string;
  status: IntegrationStatus;
  permissions: PlatformPermission[];
  connectedDate: Date;
  lastSync: Date;
  profileUrl: string;
  followerCount: number;
  error?: string;
}

export interface PlatformPermission {
  scope: string;
  granted: boolean;
  description: string;
}

export interface IntegrationSettings {
  autoPost: boolean;
  crossPost: boolean;
  includeScreenshots: boolean;
  includeAchievements: boolean;
  includeStatistics: boolean;
  defaultPlatforms: SocialMediaPlatform[];
  postingSchedule: PostingSchedule;
  contentFilters: ContentFilter[];
}

export interface PostingSchedule {
  enabled: boolean;
  timezone: string;
  times: string[];
  days: number[];
}

export interface ContentFilter {
  type: 'achievement' | 'statistic' | 'screenshot' | 'video';
  enabled: boolean;
  criteria: FilterCriteria[];
}

export interface FilterCriteria {
  field: string;
  operator: string;
  value: any;
}

export interface SocialPost {
  id: string;
  platform: SocialMediaPlatform;
  type: 'achievement' | 'statistic' | 'screenshot' | 'video' | 'custom';
  content: SocialContent;
  postId?: string;
  status: 'draft' | 'posted' | 'failed' | 'deleted';
  scheduledDate?: Date;
  postedDate?: Date;
  analytics: PostAnalytics;
}

export interface SocialContent {
  title: string;
  text: string;
  media: SocialMedia[];
  hashtags: string[];
  mentions: string[];
  links: string[];
}

export interface SocialMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
}

export interface PostAnalytics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagement: number;
  reach: number;
  impressions: number;
}

export interface SocialAnalytics {
  overview: AnalyticsOverview;
  performance: PerformanceMetrics;
  trends: AnalyticsTrend[];
  demographics: DemographicsData[];
}

export interface AnalyticsOverview {
  totalPosts: number;
  totalEngagement: number;
  averageEngagement: number;
  bestPerformingPlatform: SocialMediaPlatform;
  growthRate: number;
}

export interface PerformanceMetrics {
  byPlatform: { [platform: string]: PlatformMetrics };
  byType: { [type: string]: TypeMetrics };
  byTime: { [timeframe: string]: TimeMetrics };
}

export interface PlatformMetrics {
  posts: number;
  engagement: number;
  reach: number;
  followers: number;
  growth: number;
}

export interface TypeMetrics {
  posts: number;
  engagement: number;
  reach: number;
}

export interface TimeMetrics {
  posts: number;
  engagement: number;
  reach: number;
}

export interface AnalyticsTrend {
  date: Date;
  posts: number;
  engagement: number;
  reach: number;
  growth: number;
}

export interface DemographicsData {
  age: AgeDemographics;
  gender: GenderDemographics;
  location: LocationDemographics;
  interests: InterestDemographics;
}

export interface AgeDemographics {
  range: string;
  percentage: number;
}

export interface GenderDemographics {
  gender: string;
  percentage: number;
}

export interface LocationDemographics {
  country: string;
  percentage: number;
}

export interface InterestDemographics {
  interest: string;
  percentage: number;
}

export interface SocialAutomation {
  rules: AutomationRule[];
  templates: PostTemplate[];
  schedules: AutomationSchedule[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationTrigger {
  type: 'achievement' | 'statistic' | 'milestone' | 'schedule';
  criteria: any;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
}

export interface AutomationAction {
  type: 'post' | 'share' | 'notify' | 'custom';
  parameters: any;
}

export interface PostTemplate {
  id: string;
  name: string;
  platform: SocialMediaPlatform;
  type: 'achievement' | 'statistic' | 'custom';
  template: string;
  variables: TemplateVariable[];
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'image' | 'statistic' | 'date';
  required: boolean;
  defaultValue?: string;
}

export interface AutomationSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  template: string;
  platforms: SocialMediaPlatform[];
  enabled: boolean;
}

// Main social features system
export class SocialFeaturesSystem {
  private friendSystem: FriendSystem;
  private chatSystem: ChatSystem;
  private leaderboardSystem: LeaderboardSystem;
  private achievementSystem: AchievementSystem;
  private profiles: Map<string, PlayerProfile>;
  private socialSharing: SocialSharing;
  private communityEvents: CommunityEventSystem;
  private playerStatistics: Map<string, PlayerStatistics>;
  private guildSystem: GuildSystem;
  private socialMediaIntegration: SocialMediaIntegration;

  constructor() {
    this.friendSystem = this.createDefaultFriendSystem();
    this.chatSystem = this.createDefaultChatSystem();
    this.leaderboardSystem = this.createDefaultLeaderboardSystem();
    this.achievementSystem = this.createDefaultAchievementSystem();
    this.profiles = new Map();
    this.socialSharing = this.createDefaultSocialSharing();
    this.communityEvents = this.createDefaultCommunityEvents();
    this.playerStatistics = new Map();
    this.guildSystem = this.createDefaultGuildSystem();
    this.socialMediaIntegration = this.createDefaultSocialMediaIntegration();
  }

  /**
   * Initialize social features system
   */
  async initialize(): Promise<void> {
    try {
      // Initialize all subsystems
      await this.initializeFriendSystem();
      await this.initializeChatSystem();
      await this.initializeLeaderboardSystem();
      await this.initializeAchievementSystem();
      await this.initializeProfiles();
      await this.initializeSocialSharing();
      await this.initializeCommunityEvents();
      await this.initializePlayerStatistics();
      await this.initializeGuildSystem();
      await this.initializeSocialMediaIntegration();
      
      console.log('Social Features system initialized');
    } catch (error) {
      console.error('Failed to initialize social features system:', error);
      throw error;
    }
  }

  /**
   * Get friend system
   */
  getFriendSystem(): FriendSystem {
    return { ...this.friendSystem };
  }

  /**
   * Get chat system
   */
  getChatSystem(): ChatSystem {
    return { ...this.chatSystem };
  }

  /**
   * Get leaderboard system
   */
  getLeaderboardSystem(): LeaderboardSystem {
    return { ...this.leaderboardSystem };
  }

  /**
   * Get achievement system
   */
  getAchievementSystem(): AchievementSystem {
    return { ...this.achievementSystem };
  }

  /**
   * Get player profile
   */
  getPlayerProfile(userId: string): PlayerProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Get social sharing
   */
  getSocialSharing(): SocialSharing {
    return { ...this.socialSharing };
  }

  /**
   * Get community events
   */
  getCommunityEvents(): CommunityEventSystem {
    return { ...this.communityEvents };
  }

  /**
   * Get player statistics
   */
  getPlayerStatistics(userId: string): PlayerStatistics | undefined {
    return this.playerStatistics.get(userId);
  }

  /**
   * Get guild system
   */
  getGuildSystem(): GuildSystem {
    return { ...this.guildSystem };
  }

  /**
   * Get social media integration
   */
  getSocialMediaIntegration(): SocialMediaIntegration {
    return { ...this.socialMediaIntegration };
  }

  /**
   * Update friend system
   */
  updateFriendSystem(config: Partial<FriendSystem>): void {
    this.friendSystem = { ...this.friendSystem, ...config };
  }

  /**
   * Update chat system
   */
  updateChatSystem(config: Partial<ChatSystem>): void {
    this.chatSystem = { ...this.chatSystem, ...config };
  }

  /**
   * Update leaderboard system
   */
  updateLeaderboardSystem(config: Partial<LeaderboardSystem>): void {
    this.leaderboardSystem = { ...this.leaderboardSystem, ...config };
  }

  /**
   * Update achievement system
   */
  updateAchievementSystem(config: Partial<AchievementSystem>): void {
    this.achievementSystem = { ...this.achievementSystem, ...config };
  }

  /**
   * Update player profile
   */
  updatePlayerProfile(userId: string, profile: Partial<PlayerProfile>): void {
    const existing = this.profiles.get(userId);
    if (existing) {
      this.profiles.set(userId, { ...existing, ...profile, lastUpdated: new Date() });
    } else {
      this.profiles.set(userId, {
        id: userId,
        userId,
        username: '',
        avatar: '',
        banner: '',
        bio: '',
        location: '',
        website: '',
        socialLinks: [],
        status: ProfileStatus.ONLINE,
        visibility: ProfileVisibility.PUBLIC,
        statistics: {
          level: 1,
          experience: 0,
          playTime: 0,
          sessions: 0,
          achievements: 0,
          friends: 0,
          guilds: 0,
          favoriteGames: [],
          recentActivity: []
        },
        achievements: [],
        preferences: {
          showOnlineStatus: true,
          showPlayTime: true,
          showAchievements: true,
          showFriends: true,
          allowFriendRequests: true,
          allowMessages: true,
          allowInvitations: true,
          notificationSettings: {
            friendRequests: true,
            messages: true,
            invitations: true,
            achievements: true,
            updates: false,
            email: false,
            push: true
          }
        },
        customization: {
          theme: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            backgroundColor: '#ffffff',
            textColor: '#212529',
            accentColor: '#28a745'
          },
          layout: {
            sections: [],
            order: [],
            columns: 2
          },
          widgets: [],
          badges: [],
          titles: []
        },
        createdDate: new Date(),
        lastUpdated: new Date(),
        ...profile
      });
    }
  }

  /**
   * Update social sharing
   */
  updateSocialSharing(config: Partial<SocialSharing>): void {
    this.socialSharing = { ...this.socialSharing, ...config };
  }

  /**
   * Update community events
   */
  updateCommunityEvents(config: Partial<CommunityEventSystem>): void {
    this.communityEvents = { ...this.communityEvents, ...config };
  }

  /**
   * Update player statistics
   */
  updatePlayerStatistics(userId: string, stats: Partial<PlayerStatistics>): void {
    const existing = this.playerStatistics.get(userId);
    if (existing) {
      this.playerStatistics.set(userId, { ...existing, ...stats });
    } else {
      this.playerStatistics.set(userId, {
        id: userId,
        userId,
        statistics: [],
        history: [],
        rankings: [],
        comparisons: [],
        achievements: [],
        goals: [],
        ...stats
      });
    }
  }

  /**
   * Update guild system
   */
  updateGuildSystem(config: Partial<GuildSystem>): void {
    this.guildSystem = { ...this.guildSystem, ...config };
  }

  /**
   * Update social media integration
   */
  updateSocialMediaIntegration(config: Partial<SocialMediaIntegration>): void {
    this.socialMediaIntegration = { ...this.socialMediaIntegration, ...config };
  }

  /**
   * Initialize friend system
   */
  private async initializeFriendSystem(): Promise<void> {
    // Initialize friend system features
    console.log('Friend system initialized');
  }

  /**
   * Initialize chat system
   */
  private async initializeChatSystem(): Promise<void> {
    // Initialize chat system features
    console.log('Chat system initialized');
  }

  /**
   * Initialize leaderboard system
   */
  private async initializeLeaderboardSystem(): Promise<void> {
    // Initialize leaderboard system features
    console.log('Leaderboard system initialized');
  }

  /**
   * Initialize achievement system
   */
  private async initializeAchievementSystem(): Promise<void> {
    // Initialize achievement system features
    console.log('Achievement system initialized');
  }

  /**
   * Initialize profiles
   */
  private async initializeProfiles(): Promise<void> {
    // Initialize player profiles
    console.log('Player profiles initialized');
  }

  /**
   * Initialize social sharing
   */
  private async initializeSocialSharing(): Promise<void> {
    // Initialize social sharing features
    console.log('Social sharing initialized');
  }

  /**
   * Initialize community events
   */
  private async initializeCommunityEvents(): Promise<void> {
    // Initialize community events
    console.log('Community events initialized');
  }

  /**
   * Initialize player statistics
   */
  private async initializePlayerStatistics(): Promise<void> {
    // Initialize player statistics
    console.log('Player statistics initialized');
  }

  /**
   * Initialize guild system
   */
  private async initializeGuildSystem(): Promise<void> {
    // Initialize guild system
    console.log('Guild system initialized');
  }

  /**
   * Initialize social media integration
   */
  private async initializeSocialMediaIntegration(): Promise<void> {
    // Initialize social media integration
    console.log('Social media integration initialized');
  }

  /**
   * Create default friend system
   */
  private createDefaultFriendSystem(): FriendSystem {
    return {
      friends: [],
      requests: [],
      blocked: [],
      settings: {
        allowRequests: true,
        autoAccept: false,
        showOnlineStatus: true,
        showActivity: true,
        friendSuggestions: true,
        mutualFriends: true,
        maxFriends: 1000,
        privacy: {
          profileVisibility: 'public',
          friendListVisibility: 'friends',
          activityVisibility: 'friends',
          allowSearch: true,
          allowRecommendations: true
        }
      }
    };
  }

  /**
   * Create default chat system
   */
  private createDefaultChatSystem(): ChatSystem {
    return {
      channels: [],
      messages: [],
      settings: {
        enableSound: true,
        enableNotifications: true,
        enableTimestamps: true,
        enableEmojis: true,
        enableGifs: false,
        enableLinks: true,
        enableImages: true,
        enableVideos: false,
        enableFiles: false,
        fontSize: 'medium',
        theme: 'auto',
        autoSave: true,
        maxHistory: 1000
      },
      moderation: {
        filters: [],
        autoModeration: true,
        bannedWords: [],
        spamDetection: true,
        linkValidation: true,
        imageModeration: false,
        reportSystem: true
      }
    };
  }

  /**
   * Create default leaderboard system
   */
  private createDefaultLeaderboardSystem(): LeaderboardSystem {
    return {
      leaderboards: [],
      entries: [],
      settings: {
        showRank: true,
        showScore: true,
        showUsername: true,
        showAvatar: true,
        showGuild: true,
        showRegion: false,
        refreshInterval: 60,
        cacheDuration: 300,
        maxCachedEntries: 100
      },
      rewards: []
    };
  }

  /**
   * Create default achievement system
   */
  private createDefaultAchievementSystem(): AchievementSystem {
    return {
      achievements: [],
      userProgress: [],
      categories: [],
      rewards: [],
      notifications: []
    };
  }

  /**
   * Create default social sharing
   */
  private createDefaultSocialSharing(): SocialSharing {
    return {
      shares: [],
      templates: [],
      settings: {
        autoShare: false,
        defaultVisibility: {
          public: false,
          friends: true,
          guild: true,
          followers: false
        },
        watermark: true,
        branding: true,
        analytics: true,
        approval: false
      },
      analytics: {
        sharesByPlatform: {},
        sharesByType: {},
        engagementMetrics: [],
        trends: []
      }
    };
  }

  /**
   * Create default community events
   */
  private createDefaultCommunityEvents(): CommunityEventSystem {
    return {
      events: [],
      participants: [],
      registrations: [],
      rewards: [],
      calendar: {
        events: [],
        categories: [],
        filters: []
      }
    };
  }

  /**
   * Create default guild system
   */
  private createDefaultGuildSystem(): GuildSystem {
    return {
      guilds: [],
      members: [],
      applications: [],
      activities: [],
      settings: {
        privacy: {
          memberListVisible: true,
          statisticsVisible: true,
          activityVisible: true,
          applicationsVisible: true,
          allowSearch: true
        },
        recruitment: {
          isOpen: true,
          autoAccept: false,
          requirements: [],
          message: '',
          channels: []
        },
        communication: {
          chatChannels: [],
          announcementChannels: [],
          voiceChannels: [],
          allowInvites: true,
          allowMessages: true
        },
        management: {
          leaderCanTransfer: true,
          officerCanInvite: true,
          officerCanKick: false,
          votingEnabled: false,
          votingThreshold: 0.5,
          inactivityPeriod: 30
        }
      }
    };
  }

  /**
   * Create default social media integration
   */
  private createDefaultSocialMediaIntegration(): SocialMediaIntegration {
    return {
      platforms: [],
      settings: {
        autoPost: false,
        crossPost: false,
        includeScreenshots: true,
        includeAchievements: true,
        includeStatistics: true,
        defaultPlatforms: [],
        postingSchedule: {
          enabled: false,
          timezone: 'UTC',
          times: [],
          days: []
        },
        contentFilters: []
      },
      posts: [],
      analytics: {
        overview: {
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagement: 0,
          bestPerformingPlatform: SocialMediaPlatform.TWITTER,
          growthRate: 0
        },
        performance: {
          byPlatform: {},
          byType: {},
          byTime: {}
        },
        trends: [],
        demographics: []
      },
      automation: {
        rules: [],
        templates: [],
        schedules: []
      }
    };
  }
}

// Factory function
export function createSocialFeaturesSystem(): SocialFeaturesSystem {
  return new SocialFeaturesSystem();
}

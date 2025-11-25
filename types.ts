
export enum UserTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export interface RivalRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  status: 'pending' | 'accepted';
  createdAt: string;
}

export type Gender = 'male' | 'female';
export type TargetGender = 'men' | 'women' | 'both';

export interface UserStats {
  username?: string;
  bodyCount: number;
  weeklyScore: number;
  matches: number;
  avgPartnerAge: number;
  preferredType: string;
  streakDays: number;
  aiCredits: number;
  coins: number;
  inviteCode: string;
  invitesAvailable: number;
  rank?: number;
  heat?: number;
  tier?: UserTier;
  isOnline?: boolean;
  notificationCount?: number;
  unreadConversationsCount?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  birthDate?: string; // YYYY-MM-DD
  gender?: Gender;
  targetGender?: TargetGender;
  radarRadius?: number; // in km
  notifyProximity?: boolean;
  notifyLikes?: boolean;
  bio: string;
  avatarUrl: string;
  stats: UserStats;
  tier: UserTier;
  isOnline: boolean;
  distanceKm: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  score: number;
  trend: 'up' | 'down' | 'same';
}

export interface JournalEntry {
  id: string;
  name: string;
  date: string;
  rating: number; // 1-5
  partnerAge?: number;
  partnerAgeAtMatch?: number; // Age at time of match - immutable
  tags: string[]; // e.g. "Bydlí sama", "Wild"
  notes: string;
  avatarUrl?: string; // Optional for UI
  linkedProfileId?: string; // ID of the real Notch user if linked
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'proximity' | 'system' | 'match' | 'rival' | 'message';
  content: string;
  is_read?: boolean;
  created_at: string;
  read_at?: string | null;
  related_user_id?: string;
  metadata?: any;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export enum AppView {
  DISCOVERY = 'discovery',
  LEADERBOARD = 'leaderboard',
  JOURNAL = 'journal',
  GALLERY = 'gallery',
  ANALYTICS = 'analytics',
  PROFILE = 'profile',
  USER_PROFILE = 'user_profile',
  CHAT = 'chat',
  GHOST_LIST = 'GHOST_LIST'
}

export interface Hotspot {
  id: string;
  name: string;
  distance: number;
  count: number;
  label: string;
  latitude: number;
  longitude: number;
}

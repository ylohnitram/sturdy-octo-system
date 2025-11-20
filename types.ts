
export enum UserTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export type Gender = 'male' | 'female';
export type TargetGender = 'men' | 'women' | 'both';

export interface UserStats {
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
  tags: string[]; // e.g. "Bydlí sama", "Wild"
  notes: string;
  avatarUrl?: string; // Optional for UI
  linkedProfileId?: string; // ID of the real Notch user if linked
}

export interface Notification {
    id: string;
    userId: string;
    type: 'like' | 'proximity' | 'system';
    content: string;
    isRead: boolean;
    createdAt: string;
}

export interface Like {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: string;
}

export enum AppView {
  DISCOVERY = 'DISCOVERY',
  LEADERBOARD = 'LEADERBOARD',
  JOURNAL = 'JOURNAL',
  ANALYTICS = 'ANALYTICS',
  PROFILE = 'PROFILE',
}

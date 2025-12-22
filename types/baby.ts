export type ActivityType = 'sleep' | 'feeding' | 'diaper' | 'playtime';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number;
  duration?: number;
  notes?: string;
  feedingType?: 'breast' | 'bottle' | 'solid';
  feedingAmount?: number;
  diaperType?: 'wet' | 'dirty' | 'both';
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ActiveTimer {
  type: 'sleep' | 'playtime';
  startTime: number;
}

export interface StreamSession {
  id: string;
  streamKey: string;
  createdAt: number;
  isActive: boolean;
}

export interface DayStats {
  date: string;
  sleepTotal: number;
  feedingCount: number;
  diaperCount: number;
  playtimeTotal: number;
}

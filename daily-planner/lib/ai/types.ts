// lib/ai/types.ts
import type { DailyEntry, Summary } from '../database';

export type SummaryType = 'weekly' | 'monthly' | 'yearly';

export interface SummaryRequest {
  type: SummaryType;
  entries?: DailyEntry[];
  summaries?: Summary[];
  startDate: string; // YYYY-MM-DD (local)
  endDate: string;   // YYYY-MM-DD (local)
}

export interface SummaryResponse {
  content: string;
  insights: {
    key_themes: string[];
    productivity_trend: number;
    mood_trend: number;
    energy_trend: number;
    top_accomplishments: string[];
    main_learnings: string[];
  };
}

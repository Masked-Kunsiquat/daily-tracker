// lib/ai/types.ts
import type { DailyEntry, Summary } from '../database';

/**
 * Supported summary granularities.
 */
export type SummaryType = 'weekly' | 'monthly' | 'yearly';

/**
 * Structured input for generating a summary.
 *
 * Contract:
 * - `weekly`  → provide `entries` (non-empty)
 * - `monthly` → provide `summaries` (weekly summaries; non-empty)
 * - `yearly`  → provide `summaries` (monthly summaries; non-empty)
 * - Dates are **local ISO** strings (`YYYY-MM-DD`) and must be valid.
 */
export interface SummaryRequest {
  /** Summary granularity to generate. */
  type: SummaryType;
  /** Source daily entries (required for `weekly`). */
  entries?: DailyEntry[];
  /** Source child summaries (required for `monthly` and `yearly`). */
  summaries?: Summary[];
  /** Start of the summarized period in local ISO (YYYY-MM-DD). */
  startDate: string; // YYYY-MM-DD (local)
  /** End of the summarized period in local ISO (YYYY-MM-DD). */
  endDate: string;   // YYYY-MM-DD (local)
}

/**
 * Normalized output returned by summarizers/LLM.
 *
 * Notes:
 * - `content` is Markdown intended for in-app rendering.
 * - Trend values typically map to a 1–5 scale (float allowed for averages).
 */
export interface SummaryResponse {
  /** Human-readable summary in Markdown. */
  content: string;
  /** Structured insights extracted from the source material. */
  insights: {
    /** High-level recurring topics/themes (max ~5 recommended). */
    key_themes: string[];
    /** Average/aggregate productivity (e.g., 1–5). */
    productivity_trend: number;
    /** Average/aggregate mood (e.g., 1–5). */
    mood_trend: number;
    /** Average/aggregate energy (e.g., 1–5). */
    energy_trend: number;
    /** Notable accomplishments during the period. */
    top_accomplishments: string[];
    /** Primary learnings/takeaways during the period. */
    main_learnings: string[];
  };
}

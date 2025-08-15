// daily-planner/lib/summaries/weekly.ts
import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

/**
 * Generate a weekly summary for the week that starts at `weekStartDate` (local).
 *
 * Assumptions:
 * - `weekStartDate` is a local ISO date (YYYY-MM-DD) that represents **Monday**.
 *
 * Behavior:
 * - Fetches the week's entries; returns `null` if there are none.
 * - Computes the local week end as `weekStart + 6 days` (Sunday).
 * - Calls the AI service to produce content + insights.
 * - Persists the weekly summary and returns the saved {@link Summary}.
 *
 * @param weekStartDate - Local ISO date (YYYY-MM-DD) for the Monday of the target week.
 * @returns The saved weekly {@link Summary}, or `null` if no entries exist for the week.
 */
export async function generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
  // Canonicalize once
  const canonicalDate = formatDateISO(parseLocalISODate(weekStartDate));

  const entries = await databaseService.getEntriesForWeeklySummary(canonicalDate);
  if (entries.length === 0) {
    console.log('No entries found for week starting:', canonicalDate);
    return null;
  }

  const start = parseLocalISODate(canonicalDate);
  const weekEndLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const weekEndISO = formatDateISO(weekEndLocal);

  const summaryResponse = await aiService.generateSummary({
    type: 'weekly',
    entries,
    startDate: canonicalDate,
    endDate: weekEndISO,
  });

  const summary: Summary = {
    type: 'weekly',
    start_date: canonicalDate,
    end_date: weekEndISO,
    content: summaryResponse.content,
    insights: summaryResponse.insights,
  };

  const summaryId = await databaseService.saveSummary(summary);
  summary.id = summaryId;
  return summary;
}

/**
 * Generate any **missing** recent weekly summaries.
 *
 * Strategy:
 * - Looks back across the last **4** completed weeks.
 * - For each of those weeks, derives the local Monday (start-of-week).
 * - Skips weeks that already have a saved weekly summary.
 * - Only generates weeks that have at least **3 entries** (quality threshold).
 *
 * Notes:
 * - Uses a "pivot" of one week ago so we don't generate the current partial week.
 */
export async function generatePendingWeeklySummaries(): Promise<void> {
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgoLocal = new Date(
    todayLocal.getFullYear(),
    todayLocal.getMonth(),
    todayLocal.getDate() - 7,
  );

  const existingSummaries = await databaseService.getSummaries('weekly');
  // Canonicalize existing start dates to ensure consistent comparisons
  const existingStarts = new Set(
    existingSummaries.map((s) => formatDateISO(parseLocalISODate(s.start_date))),
  );

  for (let i = 0; i < 4; i++) {
    // Step back i weeks from the last completed week
    const pivot = new Date(
      oneWeekAgoLocal.getFullYear(),
      oneWeekAgoLocal.getMonth(),
      oneWeekAgoLocal.getDate() - i * 7,
    );

    // Compute Monday for that week (0=Sun, 1=Mon, ...)
    const dow = pivot.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(pivot.getFullYear(), pivot.getMonth(), pivot.getDate() + mondayOffset);
    const mondayISO = formatDateISO(monday); // canonical

    if (!existingStarts.has(mondayISO)) {
      const entries = await databaseService.getEntriesForWeeklySummary(mondayISO);
      if (entries.length >= 3) {
        await generateWeeklySummary(mondayISO);
      }
    }
  }
}

/**
 * Normalize any date to the canonical weekly **start** used by generators.
 *
 * Current policy:
 * - We already require callers to pass a Monday (local); thus this canonicalizes format only.
 *
 * @param date - Local ISO date (YYYY-MM-DD), expected to be a Monday.
 * @returns Canonicalized local ISO date (YYYY-MM-DD).
 */
export function normalizeWeeklyForceDate(date: string): string {
  return formatDateISO(parseLocalISODate(date));
}

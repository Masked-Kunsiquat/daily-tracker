// daily-planner/lib/summaries/monthly.ts
import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

/**
 * Generate a monthly summary covering the month that starts at `monthStartDate`.
 *
 * Preconditions:
 * - `monthStartDate` must be a local ISO date (YYYY-MM-DD) representing the **first day** of a month.
 * - There must be at least one weekly summary in that month; otherwise returns `null`.
 *
 * Behavior:
 * - Computes the month end (last day of the same month, local time).
 * - Calls the AI service with all weekly summaries for the month to produce content + insights.
 * - Persists the monthly summary and returns the saved {@link Summary}.
 *
 * @param monthStartDate - First day of the target month in local ISO format (YYYY-MM-DD).
 * @returns The saved monthly {@link Summary}, or `null` if no weekly summaries exist.
 */
export async function generateMonthlySummary(monthStartDate: string): Promise<Summary | null> {
  const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartDate);
  if (weeklySummaries.length === 0) {
    console.log('No weekly summaries found for month starting:', monthStartDate);
    return null;
  }

  const start = parseLocalISODate(monthStartDate);
  const monthEndLocal = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const monthEndISO = formatDateISO(monthEndLocal);

  const summaryResponse = await aiService.generateSummary({
    type: 'monthly',
    summaries: weeklySummaries,
    startDate: monthStartDate,
    endDate: monthEndISO,
  });

  const summary: Summary = {
    type: 'monthly',
    start_date: monthStartDate,
    end_date: monthEndISO,
    content: summaryResponse.content,
    insights: summaryResponse.insights,
  };

  const summaryId = await databaseService.saveSummary(summary);
  summary.id = summaryId;
  return summary;
}

/**
 * Generate any missing **recent** monthly summaries.
 *
 * Behavior:
 * - Looks back up to the previous 3 months from "now".
 * - Skips months that already have a monthly summary (by matching `start_date`).
 * - Only generates a month if it has at least **2 weekly summaries** (simple quality threshold).
 * - Persists newly generated monthly summaries; ignores months that don't qualify.
 *
 * @returns Resolves when all eligible months have been processed.
 */
export async function generatePendingMonthlySummaries(): Promise<void> {
  const now = new Date();
  const existingSummaries = await databaseService.getSummaries('monthly');
  const existingStarts = new Set(existingSummaries.map((s) => s.start_date));

  for (let i = 1; i <= 3; i++) {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStartISO = formatDateISO(firstOfMonth);

    if (!existingStarts.has(monthStartISO)) {
      const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartISO);
      if (weeklySummaries.length >= 2) {
        await generateMonthlySummary(monthStartISO);
      }
    }
  }
}

/**
 * Normalize any local ISO date within a month to that month's **first day** (local).
 *
 * Useful for:
 * - Keying summaries by canonical month start date.
 * - Guarding against inputs like "2025-08-14" when the generator expects "2025-08-01".
 *
 * @param date - Local ISO date (YYYY-MM-DD) anywhere within the month.
 * @returns Local ISO date for the first day of that month (YYYY-MM-DD).
 */
export function normalizeMonthlyForceDate(date: string): string {
  const d = parseLocalISODate(date);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return formatDateISO(first);
}

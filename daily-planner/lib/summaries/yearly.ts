// daily-planner/lib/summaries/yearly.ts
import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { formatDateISO } from '@/utils/dateHelpers';

/**
 * Generate a yearly summary for the given `year`.
 *
 * Behavior:
 * - Determines the local start/end of the year (`YYYY-01-01` .. `YYYY-12-31`).
 * - Collects all **monthly** summaries fully contained within that window.
 * - If none are found, returns `null` (nothing to summarize).
 * - Otherwise, asks the AI service to aggregate the monthly summaries into a
 *   single yearly narrative + insights, persists it, and returns the saved record.
 *
 * Notes:
 * - Date math is done in local time. `formatDateISO` produces local-ISO dates.
 *
 * @param year - Four-digit year (e.g., 2025).
 * @returns The saved yearly {@link Summary} or `null` when no monthly summaries exist.
 */
export async function generateYearlySummary(year: number): Promise<Summary | null> {
  const yearStartDate = `${year}-01-01`;
  const yearEndLocal = new Date(year, 12, 0); // Dec 31 (local)
  const yearEndDate = formatDateISO(yearEndLocal);

  const monthlySummaries = await databaseService.getSummaries('monthly');
  const yearMonthlySummaries = monthlySummaries.filter(
    (s) => s.start_date >= yearStartDate && s.end_date <= yearEndDate,
  );

  if (yearMonthlySummaries.length === 0) {
    console.log('No monthly summaries found for year:', year);
    return null;
  }

  const summaryResponse = await aiService.generateSummary({
    type: 'yearly',
    summaries: yearMonthlySummaries,
    startDate: yearStartDate,
    endDate: yearEndDate,
  });

  const summary: Summary = {
    type: 'yearly',
    start_date: yearStartDate,
    end_date: yearEndDate,
    content: summaryResponse.content,
    insights: summaryResponse.insights,
  };

  const summaryId = await databaseService.saveSummary(summary);
  summary.id = summaryId;
  return summary;
}

/**
 * Generate any **missing** yearly summaries for recent past years.
 *
 * Strategy:
 * - Consider the two most recent *completed/ongoing* years: `currentYear - 2` and `currentYear - 1`.
 * - Skip years that already have a yearly summary (by `start_date`).
 * - Only generate if there are at least **6 monthly summaries** for that year
 *   (quality threshold to avoid thin yearlies).
 *
 * @returns Resolves when the check/generation process completes.
 */
export async function generatePendingYearlySummaries(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const existingYearlies = await databaseService.getSummaries('yearly');
  const existingYearStarts = new Set(existingYearlies.map((s) => s.start_date));
  const monthlySummaries = await databaseService.getSummaries('monthly');

  for (let year = currentYear - 2; year < currentYear; year++) {
    const yearStart = `${year}-01-01`;
    if (existingYearStarts.has(yearStart)) continue;

    const yearEnd = formatDateISO(new Date(year, 12, 0));
    const yearMonthlySummaries = monthlySummaries.filter(
      (s) => s.start_date >= yearStart && s.end_date <= yearEnd,
    );

    if (yearMonthlySummaries.length >= 6) {
      await generateYearlySummary(year);
    }
  }
}

/**
 * Normalize a local-ISO date string to a **year number**.
 * Accepts only "YYYY" or "YYYY-MM-DD".
 * Throws on invalid/malformed input to prevent ambiguous years or NaN.
 *
 * @param date - Local ISO date string.
 * @returns Four-digit year as a number.
 * @throws Error when input is not "YYYY" or "YYYY-MM-DD".
 */
export function normalizeYearlyForceDate(date: string): number {
  if (typeof date !== 'string') {
    throw new Error(
      `normalizeYearlyForceDate: expected a string, received ${typeof date}`
    );
  }

  // Strict: allow "YYYY" or "YYYY-MM-DD" only (reject "YYYY-MM")
  const pattern = /^(?:\d{4}|\d{4}-\d{2}-\d{2})$/;

  if (!pattern.test(date)) {
    throw new Error(
      `normalizeYearlyForceDate: invalid input "${date}". Expected "YYYY" or "YYYY-MM-DD".`
    );
  }

  return Number(date.slice(0, 4));
}


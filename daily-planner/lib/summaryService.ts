import { databaseService, Summary } from './database';
import {
  generateWeeklySummary,
  generatePendingWeeklySummaries,
  normalizeWeeklyForceDate,
} from './summaries/weekly';
import {
  generateMonthlySummary,
  generatePendingMonthlySummaries,
  normalizeMonthlyForceDate,
} from './summaries/monthly';
import {
  generateYearlySummary,
  generatePendingYearlySummaries,
  normalizeYearlyForceDate,
} from './summaries/yearly';
import { formatDateISO } from '@/utils/dateHelpers';

/**
 * SummaryService
 *
 * Thin facade around summary generation/retrieval helpers.
 * - Exposes typed methods for weekly/monthly/yearly summaries
 * - Coordinates "pending" backfills
 * - Provides date helpers to compute canonical start dates
 */
export class SummaryService {
  // Public API (unchanged)

  /**
   * Generate a weekly summary for a given **week start** date (expected Monday, local ISO).
   * @param weekStartDate - Local ISO date (YYYY-MM-DD) for the Monday of the target week.
   * @returns The saved weekly {@link Summary} or `null` if no entries exist.
   */
  async generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
    return generateWeeklySummary(weekStartDate);
  }

  /**
   * Generate a monthly summary for a given **first-of-month** date (local ISO).
   * @param monthStartDate - Local ISO date (YYYY-MM-DD) for the first day of the month.
   * @returns The saved monthly {@link Summary} or `null` if no weekly summaries exist.
   */
  async generateMonthlySummary(monthStartDate: string): Promise<Summary | null> {
    return generateMonthlySummary(monthStartDate);
  }

  /**
   * Generate a yearly summary for a given year.
   * @param year - Four-digit year (e.g., 2025).
   * @returns The saved yearly {@link Summary} or `null` if no monthly summaries exist.
   */
  async generateYearlySummary(year: number): Promise<Summary | null> {
    return generateYearlySummary(year);
  }

  /**
   * Check for and generate any missing **recent** weekly, monthly, and yearly summaries.
   * - Weekly: last 4 completed weeks (needs ≥3 entries)
   * - Monthly: last 3 months (needs ≥2 weekly summaries)
   * - Yearly: last 2 years (needs ≥6 monthly summaries)
   */
  async checkAndGeneratePendingSummaries(): Promise<void> {
    await generatePendingWeeklySummaries();
    await generatePendingMonthlySummaries();
    await generatePendingYearlySummaries();
  }

  /**
   * Compute the local-ISO start-of-week (Monday) for a given date.
   * @param date - JS Date (local time).
   * @returns Local ISO date (YYYY-MM-DD) representing that week's Monday.
   */
  async getWeekStartDate(date: Date): Promise<string> {
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = base.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + mondayOffset);
    return formatDateISO(monday);
  }

  /**
   * Compute the local-ISO first day of the month for a given date.
   * @param date - JS Date (local time).
   * @returns Local ISO date (YYYY-MM-DD) for the first day of that month.
   */
  async getMonthStartDate(date: Date): Promise<string> {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return formatDateISO(firstOfMonth);
  }

  /**
   * Fetch all summaries of a given type.
   * @param type - 'weekly' | 'monthly' | 'yearly'
   * @returns Array of {@link Summary} records (possibly empty).
   */
  async getSummaries(type: 'weekly' | 'monthly' | 'yearly'): Promise<Summary[]> {
    return databaseService.getSummaries(type);
  }

  /**
   * Get counts of available summaries by type.
   * @returns Object with `weekly`, `monthly`, and `yearly` counts. Returns zeros on error.
   */
  async getSummaryStats(): Promise<{ weekly: number; monthly: number; yearly: number }> {
    try {
      const [weeklyCount, monthlyCount, yearlyCount] = await Promise.all([
        databaseService.getSummaryCount('weekly'),
        databaseService.getSummaryCount('monthly'),
        databaseService.getSummaryCount('yearly'),
      ]);
      return { weekly: weeklyCount, monthly: monthlyCount, yearly: yearlyCount };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return { weekly: 0, monthly: 0, yearly: 0 };
    }
  }

  /**
   * Force-generate a summary for a given type using a date string.
   *
   * Normalization rules:
   * - `weekly`: expects Monday; `normalizeWeeklyForceDate` is currently a pass-through.
   * - `monthly`: coerces any date within the month to the month's first day.
   * - `yearly`: extracts the year number; invalid inputs yield `NaN` (will fail generation).
   *
   * @param type - Summary type to generate.
   * @param date - Local ISO date (YYYY-MM-DD). Interpretation depends on `type`.
   * @returns The saved {@link Summary} or `null` if generation preconditions aren’t met.
   */
  async forceSummaryGeneration(
    type: 'weekly' | 'monthly' | 'yearly',
    date: string,
  ): Promise<Summary | null> {
    switch (type) {
      case 'weekly':
        return this.generateWeeklySummary(normalizeWeeklyForceDate(date));
      case 'monthly':
        return this.generateMonthlySummary(normalizeMonthlyForceDate(date));
      case 'yearly': {
        const year = normalizeYearlyForceDate(date);
        return this.generateYearlySummary(year);
      }
      default:
        throw new Error(`Invalid summary type: ${type}`);
    }
  }
}

/** Singleton instance for app-wide use. */
export const summaryService = new SummaryService();

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

export class SummaryService {
  // Public API (unchanged)
  async generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
    return generateWeeklySummary(weekStartDate);
  }

  async generateMonthlySummary(monthStartDate: string): Promise<Summary | null> {
    return generateMonthlySummary(monthStartDate);
  }

  async generateYearlySummary(year: number): Promise<Summary | null> {
    return generateYearlySummary(year);
  }

  async checkAndGeneratePendingSummaries(): Promise<void> {
    await generatePendingWeeklySummaries();
    await generatePendingMonthlySummaries();
    await generatePendingYearlySummaries();
  }

  async getWeekStartDate(date: Date): Promise<string> {
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = base.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + mondayOffset);
    return formatDateISO(monday);
  }

  async getMonthStartDate(date: Date): Promise<string> {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return formatDateISO(firstOfMonth);
  }

  async getSummaries(type: 'weekly' | 'monthly' | 'yearly'): Promise<Summary[]> {
    return databaseService.getSummaries(type);
  }

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

export const summaryService = new SummaryService();

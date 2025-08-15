// daily-planner/lib/summaryService.ts
import { databaseService, Summary } from './database';
import { aiService } from './aiService';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

export class SummaryService {
  async generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
    try {
      // Get daily entries for the week
      const entries = await databaseService.getEntriesForWeeklySummary(weekStartDate);

      if (entries.length === 0) {
        console.log('No entries found for week starting:', weekStartDate);
        return null;
      }

      // Local-safe end of week (Mon + 6 days)
      const start = parseLocalISODate(weekStartDate);
      const weekEndLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      const weekEndISO = formatDateISO(weekEndLocal);

      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'weekly',
        entries,
        startDate: weekStartDate,
        endDate: weekEndISO,
      });

      // Create summary object
      const summary: Summary = {
        type: 'weekly',
        start_date: weekStartDate,
        end_date: weekEndISO,
        content: summaryResponse.content,
        insights: summaryResponse.insights,
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      throw error;
    }
  }

  async generateMonthlySummary(monthStartDate: string): Promise<Summary | null> {
    try {
      // Get weekly summaries for the month
      const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartDate);

      if (weeklySummaries.length === 0) {
        console.log('No weekly summaries found for month starting:', monthStartDate);
        return null;
      }

      // Local-safe end of month
      const start = parseLocalISODate(monthStartDate);
      const monthEndLocal = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const monthEndISO = formatDateISO(monthEndLocal);

      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'monthly',
        summaries: weeklySummaries,
        startDate: monthStartDate,
        endDate: monthEndISO,
      });

      // Create summary object
      const summary: Summary = {
        type: 'monthly',
        start_date: monthStartDate,
        end_date: monthEndISO,
        content: summaryResponse.content,
        insights: summaryResponse.insights,
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      throw error;
    }
  }

  async generateYearlySummary(year: number): Promise<Summary | null> {
    try {
      const yearStartDate = `${year}-01-01`;
      const yearEndLocal = new Date(year, 12, 0); // Dec 31 (local)
      const yearEndDate = formatDateISO(yearEndLocal);

      // Get monthly summaries for the year (string compare is fine for YYYY-MM-DD)
      const monthlySummaries = await databaseService.getSummaries('monthly');
      const yearMonthlySummaries = monthlySummaries.filter(
        (summary) =>
          summary.start_date >= yearStartDate && summary.end_date <= yearEndDate,
      );

      if (yearMonthlySummaries.length === 0) {
        console.log('No monthly summaries found for year:', year);
        return null;
      }

      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'yearly',
        summaries: yearMonthlySummaries,
        startDate: yearStartDate,
        endDate: yearEndDate,
      });

      // Create summary object
      const summary: Summary = {
        type: 'yearly',
        start_date: yearStartDate,
        end_date: yearEndDate,
        content: summaryResponse.content,
        insights: summaryResponse.insights,
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating yearly summary:', error);
      throw error;
    }
  }

  async checkAndGeneratePendingSummaries(): Promise<void> {
    try {
      await this.generatePendingWeeklySummaries();
      await this.generatePendingMonthlySummaries();
      await this.generatePendingYearlySummaries();
    } catch (error) {
      console.error('Error checking pending summaries:', error);
    }
  }

  private async generatePendingWeeklySummaries(): Promise<void> {
    const now = new Date();
    // Work from local midnight to avoid drift
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgoLocal = new Date(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate() - 7,
    );

    // Pull existing once
    const existingSummaries = await databaseService.getSummaries('weekly');
    const existingStarts = new Set(existingSummaries.map((s) => s.start_date));

    // Find Mondays in the last 4 weeks that don't have summaries
    for (let i = 0; i < 4; i++) {
      const pivot = new Date(
        oneWeekAgoLocal.getFullYear(),
        oneWeekAgoLocal.getMonth(),
        oneWeekAgoLocal.getDate() - i * 7,
      );

      const dow = pivot.getDay(); // 0=Sun, 1=Mon, ...
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(pivot.getFullYear(), pivot.getMonth(), pivot.getDate() + mondayOffset);
      const mondayISO = formatDateISO(monday);

      if (!existingStarts.has(mondayISO)) {
        const entries = await databaseService.getEntriesForWeeklySummary(mondayISO);
        if (entries.length >= 3) {
          await this.generateWeeklySummary(mondayISO);
        }
      }
    }
  }

  private async generatePendingMonthlySummaries(): Promise<void> {
    const now = new Date();

    // Pull existing once
    const existingSummaries = await databaseService.getSummaries('monthly');
    const existingStarts = new Set(existingSummaries.map((s) => s.start_date));

    // Check the last 3 months
    for (let i = 1; i <= 3; i++) {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStartISO = formatDateISO(firstOfMonth);

      if (!existingStarts.has(monthStartISO)) {
        const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartISO);
        if (weeklySummaries.length >= 2) {
          await this.generateMonthlySummary(monthStartISO);
        }
      }
    }
  }

  private async generatePendingYearlySummaries(): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Pull existing once
    const existingYearlies = await databaseService.getSummaries('yearly');
    const existingYearStarts = new Set(existingYearlies.map((s) => s.start_date));

    const monthlySummaries = await databaseService.getSummaries('monthly');

    // Check the last 2 completed years
    for (let year = currentYear - 2; year < currentYear; year++) {
      const yearStart = `${year}-01-01`;

      if (!existingYearStarts.has(yearStart)) {
        const yearEnd = formatDateISO(new Date(year, 12, 0));

        const yearMonthlySummaries = monthlySummaries.filter(
          (summary) =>
            summary.start_date >= yearStart && summary.end_date <= yearEnd,
        );

        if (yearMonthlySummaries.length >= 6) {
          await this.generateYearlySummary(year);
        }
      }
    }
  }

  async getWeekStartDate(date: Date): Promise<string> {
    // Compute Monday from local midnight
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = base.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + mondayOffset);
    return formatDateISO(monday);
  }

  async getMonthStartDate(date: Date): Promise<string> {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return formatDateISO(firstOfMonth);
  }

  // New method to fetch summaries by type
  async getSummaries(type: 'weekly' | 'monthly' | 'yearly'): Promise<Summary[]> {
    return databaseService.getSummaries(type);
  }

  async getSummaryStats(): Promise<{
    weekly: number;
    monthly: number;
    yearly: number;
  }> {
    try {
      const [weeklyCount, monthlyCount, yearlyCount] = await Promise.all([
        databaseService.getSummaryCount('weekly'),
        databaseService.getSummaryCount('monthly'),
        databaseService.getSummaryCount('yearly'),
      ]);

      return {
        weekly: weeklyCount,
        monthly: monthlyCount,
        yearly: yearlyCount,
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return { weekly: 0, monthly: 0, yearly: 0 };
    }
  }

  async forceSummaryGeneration(
    type: 'weekly' | 'monthly' | 'yearly',
    date: string,
  ): Promise<Summary | null> {
    try {
      switch (type) {
        case 'weekly':
          // Expecting Monday (YYYY-MM-DD). Pass through unchanged.
          return await this.generateWeeklySummary(date);
        case 'monthly': {
          // Normalize to first day of that month (local)
          const d = parseLocalISODate(date);
          const first = new Date(d.getFullYear(), d.getMonth(), 1);
          return await this.generateMonthlySummary(formatDateISO(first));
        }
        case 'yearly': {
          const year = parseInt(date.split('-')[0], 10);
          return await this.generateYearlySummary(year);
        }
        default:
          throw new Error(`Invalid summary type: ${type}`);
      }
    } catch (error) {
      console.error(`Error force generating ${type} summary:`, error);
      throw error;
    }
  }
}

export const summaryService = new SummaryService();

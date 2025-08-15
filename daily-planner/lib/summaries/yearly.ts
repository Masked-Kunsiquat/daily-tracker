import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { formatDateISO } from '@/utils/dateHelpers';

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

// Extract the year part safely (default to NaN if invalid)
export function normalizeYearlyForceDate(date: string): number {
  return parseInt(date.split('-')[0], 10);
}

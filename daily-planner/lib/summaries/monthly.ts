import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

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

// Normalize any date within the month to first-of-month (local)
export function normalizeMonthlyForceDate(date: string): string {
  const d = parseLocalISODate(date);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return formatDateISO(first);
}

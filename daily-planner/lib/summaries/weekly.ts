import { databaseService, Summary } from '../database';
import { aiService } from '../aiService';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

export async function generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
  const entries = await databaseService.getEntriesForWeeklySummary(weekStartDate);
  if (entries.length === 0) {
    console.log('No entries found for week starting:', weekStartDate);
    return null;
  }

  const start = parseLocalISODate(weekStartDate);
  const weekEndLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const weekEndISO = formatDateISO(weekEndLocal);

  const summaryResponse = await aiService.generateSummary({
    type: 'weekly',
    entries,
    startDate: weekStartDate,
    endDate: weekEndISO,
  });

  const summary: Summary = {
    type: 'weekly',
    start_date: weekStartDate,
    end_date: weekEndISO,
    content: summaryResponse.content,
    insights: summaryResponse.insights,
  };

  const summaryId = await databaseService.saveSummary(summary);
  summary.id = summaryId;
  return summary;
}

export async function generatePendingWeeklySummaries(): Promise<void> {
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgoLocal = new Date(
    todayLocal.getFullYear(),
    todayLocal.getMonth(),
    todayLocal.getDate() - 7,
  );

  const existingSummaries = await databaseService.getSummaries('weekly');
  const existingStarts = new Set(existingSummaries.map((s) => s.start_date));

  for (let i = 0; i < 4; i++) {
    const pivot = new Date(
      oneWeekAgoLocal.getFullYear(),
      oneWeekAgoLocal.getMonth(),
      oneWeekAgoLocal.getDate() - i * 7,
    );
    const dow = pivot.getDay(); // 0=Sun,1=Mon,...
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(pivot.getFullYear(), pivot.getMonth(), pivot.getDate() + mondayOffset);
    const mondayISO = formatDateISO(monday);

    if (!existingStarts.has(mondayISO)) {
      const entries = await databaseService.getEntriesForWeeklySummary(mondayISO);
      if (entries.length >= 3) {
        await generateWeeklySummary(mondayISO);
      }
    }
  }
}

// Pass-through for force-generation (expects Monday)
export function normalizeWeeklyForceDate(date: string): string {
  return date;
}

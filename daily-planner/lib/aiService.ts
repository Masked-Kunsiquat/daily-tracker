// lib/aiService.ts
import type { SummaryRequest, SummaryResponse } from './ai/types';
import { ruleBasedWeekly, ruleBasedMonthly, ruleBasedYearly } from './ai/summarizers';
import { parseLocalISODate } from '@/utils/dateHelpers';

class AIService {
  private baseURL = 'http://localhost:3000/api'; // placeholder for local LLM endpoint

  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    this.validateSummaryRequest(request);

    if (request.type === 'weekly' && request.entries) {
      return ruleBasedWeekly(request.entries, request.startDate, request.endDate);
    }
    if (request.type === 'monthly' && request.summaries) {
      return ruleBasedMonthly(request.summaries, request.startDate, request.endDate);
    }
    if (request.type === 'yearly' && request.summaries) {
      return ruleBasedYearly(request.summaries, request.startDate, request.endDate);
    }
    throw new Error(`Invalid summary request for type: ${request.type}`);
  }

  private validateSummaryRequest(req: SummaryRequest): void {
    const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!req.startDate || !req.endDate || !isDateOnly(req.startDate) || !isDateOnly(req.endDate)) {
      throw new Error(`${req.type} summary requires startDate/endDate in YYYY-MM-DD format`);
    }
    // Local-safe parse (ensures not NaN)
    const s = parseLocalISODate(req.startDate);
    const e = parseLocalISODate(req.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      throw new Error(`${req.type} summary requires valid startDate/endDate`);
    }

    if (req.type === 'weekly' && (!req.entries || req.entries.length === 0)) {
      throw new Error('weekly summary requires entries as a non-empty array');
    }
    if ((req.type === 'monthly' || req.type === 'yearly') && (!req.summaries || req.summaries.length === 0)) {
      throw new Error(`${req.type} summary requires summaries as a non-empty array`);
    }
  }

  // Future: real LLM call
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async callLocalLLM(prompt: string, data: unknown): Promise<string> {
    throw new Error('Local LLM integration not yet implemented');
  }
}

export const aiService = new AIService();

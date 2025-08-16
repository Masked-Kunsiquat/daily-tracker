// daily-planner/lib/ai/llm/promptBuilder.ts

export type { SummaryType } from './types';

export interface JournalEntry { id: string; dateISO: string; content: string }

export class PromptBuilder {
  /** Ensure structured JSON output to lower parsing errors */
  static addJSONInstructions(basePrompt: string): string {
    return (
      basePrompt +
      '\n\n' +
      'Return ONLY a single JSON object with this shape:\n' +
      '{"summary":"string","highlights":["string"],"themes":["string"],"action_items":["string"],"tone":"positive|neutral|negative"}\n' +
      'Do not add explanations, Markdown, or text outside the JSON.'
    );
  }

  static buildWeeklyPrompt(entries: JournalEntry[]): string {
    const header = 'You summarize personal journal entries for the past week. Be concise, factual, and avoid external info.';
    const formatted = entries
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map((e) => `- [${e.dateISO}] ${e.content}`)
      .join('\n');
    return PromptBuilder.addJSONInstructions(`${header}\n\nEntries:\n${formatted}`);
  }

  static buildMonthlyPrompt(weeklySummaries: string[]): string {
    const header = 'You are aggregating 4–5 weekly JSON summaries into a monthly recap. Merge, dedupe, and elevate themes.';
    const payload = weeklySummaries.map((w, i) => `W${i + 1}: ${w}`).join('\n');
    return PromptBuilder.addJSONInstructions(`${header}\n\nWeekly JSON summaries:\n${payload}`);
  }

  static buildYearlyPrompt(monthlySummaries: string[]): string {
    const header = 'You are aggregating 12 monthly JSON summaries into a yearly narrative. Provide big-picture insights and goals.';
    const payload = monthlySummaries.map((m, i) => `M${i + 1}: ${m}`).join('\n');
    return PromptBuilder.addJSONInstructions(`${header}\n\nMonthly JSON summaries:\n${payload}`);
  }
}

// lib/ai/prompts.ts
import type { DailyEntry, Summary } from '../database';

/**
 * Build the **weekly summary** system/user prompt.
 *
 * What it does:
 * - Gives clear instructions for an assistant to analyze a week's daily entries.
 * - Requests a structured JSON response with `content` (Markdown) and `insights`.
 * - Embeds the provided `entries` payload (pretty-printed) for the model to read.
 *
 * Output contract (requested from the model):
 * ```json
 * {
 *   "content": "Markdown formatted summary",
 *   "insights": {
 *     "key_themes": ["theme1", "theme2"],
 *     "productivity_trend": 0,
 *     "mood_trend": 0,
 *     "energy_trend": 0,
 *     "top_accomplishments": ["..."],
 *     "main_learnings": ["..."]
 *   }
 * }
 * ```
 *
 * @param entries - Array of {@link DailyEntry} objects for the target week.
 * @returns A single prompt string suitable for an LLM call.
 */
export function getWeeklySummaryPrompt(entries: DailyEntry[]): string {
  return `
You are an AI assistant that helps users reflect on their week through their daily journal entries.

Please analyze the following daily entries and create a thoughtful weekly summary that includes:
1. An overview of the week with key highlights
2. Analysis of productivity, mood, and energy patterns
3. Top accomplishments and learnings
4. Insights about gratitude and positive moments
5. Constructive reflection and suggestions for improvement

Daily Entries:
${JSON.stringify(entries, null, 2)}

Please respond in JSON format with the structure:
{
  "content": "Markdown formatted summary",
  "insights": {
    "key_themes": ["theme1", "theme2"],
    "productivity_trend": number,
    "mood_trend": number,
    "energy_trend": number,
    "top_accomplishments": ["accomplishment1"],
    "main_learnings": ["learning1"]
  }
}
`.trim();
}

/**
 * Build the **monthly summary** prompt (stub).
 *
 * Intention:
 * - Will instruct the model to synthesize a month from multiple weekly summaries.
 * - Keep this function as the single source for monthly prompt text.
 *
 * @param _summaries - Weekly {@link Summary} objects for the month.
 * @returns Placeholder string until the real prompt is authored.
 */
export function getMonthlySummaryPrompt(_summaries: Summary[]): string {
  throw new Error(
    'getMonthlySummaryPrompt: prompt is unimplemented. Replace this stub with the real monthly prompt.'
  );
}

/**
 * Build the **yearly summary** prompt (stub).
 *
 * Intention:
 * - Will instruct the model to synthesize a year from multiple monthly summaries.
 * - Keep this function as the single source for yearly prompt text.
 *
 * @param _summaries - Monthly {@link Summary} objects for the year.
 * @returns Placeholder string until the real prompt is authored.
 */
export function getYearlySummaryPrompt(_summaries: Summary[]): string {
  throw new Error(
    'getYearlySummaryPrompt: prompt is unimplemented. Replace this stub with the real yearly prompt.'
  );
}

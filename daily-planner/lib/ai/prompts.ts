// lib/ai/prompts.ts
import type { DailyEntry, Summary } from '../database';

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

// Stubs for future LLM prompts (kept here so callers have a single place)
export function getMonthlySummaryPrompt(_summaries: Summary[]): string {
  return `Monthly prompt TBD`;
}
export function getYearlySummaryPrompt(_summaries: Summary[]): string {
  return `Yearly prompt TBD`;
}

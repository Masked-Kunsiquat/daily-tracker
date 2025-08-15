// lib/ai/summarizers.ts
import type { DailyEntry, Summary } from '../database';
import type { SummaryResponse } from './types';
import { formatDateRange, parseLocalISODate } from '@/utils/dateHelpers';

/**
 * Rule-based, deterministic summarizers for daily/weekly/monthly/yearly journal data.
 *
 * # Design
 * - Pure functions with no side effects.
 * - Inputs are **local** ISO dates (`YYYY-MM-DD`) and domain models (`DailyEntry`, `Summary`).
 * - Ratings are assumed to be on a 1–5 scale; empty collections collapse to `0` averages.
 * - Returns markdown `content` plus lightweight `insights` suitable for storage or display.
 *
 * @remarks
 * This module is intentionally simple and predictable; it’s a baseline when an LLM
 * is unavailable. All narrative text is generated from basic statistics and lists.
 */

// ---------- Public rule-based generators ----------

/**
 * Build a weekly summary directly from raw daily entries.
 *
 * @param entries - Daily entries that fall within the [startDate, endDate] week.
 * @param startDate - Local ISO date (`YYYY-MM-DD`) for the start of the week.
 * @param endDate - Local ISO date (`YYYY-MM-DD`) for the end of the week.
 * @returns SummaryResponse with markdown content and computed insights.
 *
 * @remarks
 * - If `entries` is empty, returns a labeled empty-response.
 * - Averages are simple arithmetic means of the per-entry ratings.
 * - Key themes are naive keyword frequencies from `daily_text`.
 */
export function ruleBasedWeekly(
  entries: DailyEntry[],
  startDate: string,
  endDate: string
): SummaryResponse {
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return emptyResponse(`Week of ${formatDateRange(startDate, endDate)}`);
  }

  const avgProductivity = average(entries.map(e => e.ratings.productivity));
  const avgMood        = average(entries.map(e => e.ratings.mood));
  const avgEnergy      = average(entries.map(e => e.ratings.energy));

  const allAccomplishments = entries.flatMap(e => e.accomplishments).filter(nonEmpty);
  const allLearnings       = entries.flatMap(e => e.things_learned).filter(nonEmpty);
  const allGrateful        = entries.flatMap(e => e.things_grateful).filter(nonEmpty);

  const keyThemes = extractKeyThemes(entries.map(e => e.daily_text));

  const content = weeklyContent(
    entries,
    startDate,
    endDate,
    avgProductivity,
    avgMood,
    avgEnergy,
    allAccomplishments,
    allLearnings,
    allGrateful
  );

  return {
    content,
    insights: {
      key_themes: keyThemes,
      productivity_trend: avgProductivity,
      mood_trend: avgMood,
      energy_trend: avgEnergy,
      top_accomplishments: allAccomplishments.slice(0, 5),
      main_learnings: allLearnings.slice(0, 5),
    }
  };
}

/**
 * Build a monthly summary from weekly Summary objects.
 *
 * @param weeklySummaries - The weekly summaries that fall within the month window.
 * @param startDate - Local ISO date (`YYYY-MM-DD`) within the month (usually the 1st).
 * @param endDate - Local ISO date (`YYYY-MM-DD`) at/near the end of the month.
 * @returns SummaryResponse with month-level markdown and insights.
 *
 * @remarks
 * - Averages are computed across the `insights` of supplied weekly summaries.
 * - Themes are consolidated across weeks, then top-N are selected.
 * - Empty input produces a labeled empty-response for the month.
 */
export function ruleBasedMonthly(
  weeklySummaries: Summary[],
  startDate: string,
  endDate: string
): SummaryResponse {
  if (weeklySummaries.length === 0) {
    return emptyResponse(`Month of ${formatMonthYear(startDate)}`);
  }

  const avgProductivity = average(weeklySummaries.map(s => s.insights.productivity_trend));
  const avgMood        = average(weeklySummaries.map(s => s.insights.mood_trend));
  const avgEnergy      = average(weeklySummaries.map(s => s.insights.energy_trend));

  const allThemes         = weeklySummaries.flatMap(s => s.insights.key_themes);
  const allAccomplishments= weeklySummaries.flatMap(s => s.insights.top_accomplishments);
  const allLearnings      = weeklySummaries.flatMap(s => s.insights.main_learnings);

  const keyThemes = consolidateThemes(allThemes).slice(0, 10);

  const content = monthlyContent(
    weeklySummaries,
    startDate,
    endDate,
    avgProductivity,
    avgMood,
    avgEnergy,
    keyThemes,
    allAccomplishments,
    allLearnings
  );

  return {
    content,
    insights: {
      key_themes: keyThemes,
      productivity_trend: avgProductivity,
      mood_trend: avgMood,
      energy_trend: avgEnergy,
      top_accomplishments: allAccomplishments.slice(0, 10),
      main_learnings: allLearnings.slice(0, 10),
    }
  };
}

/**
 * Build a yearly summary from monthly Summary objects.
 *
 * @param monthlySummaries - Monthly summaries for the target year.
 * @param startDate - Local ISO date (`YYYY-MM-DD`) within the year (usually Jan 01).
 * @param endDate - Local ISO date (`YYYY-MM-DD`) near year end (usually Dec 31).
 * @returns SummaryResponse with year-level markdown and insights.
 *
 * @remarks
 * - Aggregates trends from the `insights` of supplied monthly summaries.
 * - Themes are consolidated across months; top-N extracted.
 * - If empty, the returned label includes the parsed calendar year.
 */
export function ruleBasedYearly(
  monthlySummaries: Summary[],
  startDate: string,
  endDate: string
): SummaryResponse {
  if (monthlySummaries.length === 0) {
    const year = parseLocalISODate(startDate).getFullYear();
    return emptyResponse(`Year ${year}`);
  }

  const avgProductivity = average(monthlySummaries.map(s => s.insights.productivity_trend));
  const avgMood        = average(monthlySummaries.map(s => s.insights.mood_trend));
  const avgEnergy      = average(monthlySummaries.map(s => s.insights.energy_trend));

  const allThemes          = monthlySummaries.flatMap(s => s.insights.key_themes);
  const allAccomplishments = monthlySummaries.flatMap(s => s.insights.top_accomplishments);
  const allLearnings       = monthlySummaries.flatMap(s => s.insights.main_learnings);

  const keyThemes = consolidateThemes(allThemes).slice(0, 8);

  const content = yearlyContent(
    monthlySummaries,
    startDate,
    endDate,
    avgProductivity,
    avgMood,
    avgEnergy,
    keyThemes,
    allAccomplishments,
    allLearnings
  );

  return {
    content,
    insights: {
      key_themes: keyThemes,
      productivity_trend: avgProductivity,
      mood_trend: avgMood,
      energy_trend: avgEnergy,
      top_accomplishments: allAccomplishments.slice(0, 20),
      main_learnings: allLearnings.slice(0, 20),
    }
  };
}

// ---------- Content helpers (moved out of service) ----------

/**
 * Render a weekly markdown summary body.
 *
 * @param entries - Daily entries in the week.
 * @param startDate - Week start (local ISO).
 * @param endDate - Week end (local ISO).
 * @param avgProductivity - Mean productivity rating (0–5).
 * @param avgMood - Mean mood rating (0–5).
 * @param avgEnergy - Mean energy rating (0–5).
 * @param accomplishments - Concatenated list of accomplishment strings.
 * @param learnings - Concatenated list of learnings.
 * @param grateful - Concatenated list of gratitude items.
 * @returns Markdown string suitable for display.
 */
function weeklyContent(
  entries: DailyEntry[],
  startDate: string,
  endDate: string,
  avgProductivity: number,
  avgMood: number,
  avgEnergy: number,
  accomplishments: string[],
  learnings: string[],
  grateful: string[]
): string {
  const dateRange = formatDateRange(startDate, endDate);
  return `# Weekly Summary: ${dateRange}

## Overview
You logged ${entries.length} entries this week. Here's how your week went:

**Average Ratings:**
- Productivity: ${avgProductivity.toFixed(1)}/5 ⭐
- Mood: ${avgMood.toFixed(1)}/5 ⭐
- Energy: ${avgEnergy.toFixed(1)}/5 ⭐

## Key Accomplishments (${accomplishments.length})
${accomplishments.slice(0, 8).map(a => `• ${a}`).join('\n')}

## Main Learnings (${learnings.length})
${learnings.slice(0, 5).map(l => `• ${l}`).join('\n')}

## Gratitude Highlights (${grateful.length})
${grateful.slice(0, 5).map(g => `• ${g}`).join('\n')}

## Reflection
${weeklyReflection(avgProductivity, avgMood, avgEnergy, accomplishments.length)}`;
}

/**
 * Render a monthly markdown summary body from weekly summaries.
 *
 * @param weeklySummaries - Weekly summaries for the month.
 * @param startDate - Any local ISO date within the month.
 * @param _endDate - Unused; present for signature parity.
 * @param avgProductivity - Mean monthly productivity.
 * @param avgMood - Mean monthly mood.
 * @param avgEnergy - Mean monthly energy.
 * @param keyThemes - Consolidated month-level key themes (top-N).
 * @param accomplishments - Combined accomplishments across weeks.
 * @param learnings - Combined learnings across weeks.
 * @returns Markdown string for the monthly report.
 */
function monthlyContent(
  weeklySummaries: Summary[],
  startDate: string,
  _endDate: string,
  avgProductivity: number,
  avgMood: number,
  avgEnergy: number,
  keyThemes: string[],
  accomplishments: string[],
  learnings: string[]
): string {
  const monthYear = formatMonthYear(startDate);
  const weekCount = weeklySummaries.length;

  return `# Monthly Summary: ${monthYear}

## Overview
You completed ${weekCount} weeks of entries this month.

**Monthly Averages:**
- Productivity: ${avgProductivity.toFixed(1)}/5 ⭐
- Mood: ${avgMood.toFixed(1)}/5 ⭐
- Energy: ${avgEnergy.toFixed(1)}/5 ⭐

## Key Themes
${keyThemes.slice(0, 5).map(theme => `• ${theme}`).join('\n')}

## Top Accomplishments
${accomplishments.slice(0, 10).map(a => `• ${a}`).join('\n')}

## Major Learnings
${learnings.slice(0, 8).map(l => `• ${l}`).join('\n')}

## Monthly Reflection
${monthlyReflection(avgProductivity, avgMood, avgEnergy, weekCount)}`;
}

/**
 * Render a yearly markdown summary body from monthly summaries.
 *
 * @param monthlySummaries - Monthly summaries for the year.
 * @param startDate - Any local ISO date within the year.
 * @param _endDate - Unused; present for signature parity.
 * @param avgProductivity - Mean annual productivity.
 * @param avgMood - Mean annual mood.
 * @param avgEnergy - Mean annual energy.
 * @param keyThemes - Consolidated year-level key themes (top-N).
 * @param accomplishments - Combined accomplishments across months.
 * @param learnings - Combined learnings across months.
 * @returns Markdown string for the annual report.
 */
function yearlyContent(
  monthlySummaries: Summary[],
  startDate: string,
  _endDate: string,
  avgProductivity: number,
  avgMood: number,
  avgEnergy: number,
  keyThemes: string[],
  accomplishments: string[],
  learnings: string[]
): string {
  const year = parseLocalISODate(startDate).getFullYear();
  const monthCount = monthlySummaries.length;

  return `# Annual Summary: ${year}

## Year in Review
You completed ${monthCount} months of consistent journaling this year.

**Year-Long Averages:**
- Productivity: ${avgProductivity.toFixed(1)}/5 ⭐
- Mood: ${avgMood.toFixed(1)}/5 ⭐
- Energy: ${avgEnergy.toFixed(1)}/5 ⭐

## Overarching Themes
${keyThemes.slice(0, 8).map(theme => `• ${theme}`).join('\n')}

## Greatest Accomplishments
${accomplishments.slice(0, 15).map(a => `• ${a}`).join('\n')}

## Most Significant Learnings
${learnings.slice(0, 12).map(l => `• ${l}`).join('\n')}

## Annual Reflection
${yearlyReflection(avgProductivity, avgMood, avgEnergy, monthCount)}`;
}

// ---------- Small utilities (moved) ----------

/**
 * Compute the arithmetic mean of a list of numbers.
 *
 * @param nums - List of numbers (e.g., ratings).
 * @returns Average value or `0` when the list is empty.
 * @example
 * average([3, 5]) // 4
 */
function average(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

/**
 * Predicate: true if the string is non-empty after trimming.
 *
 * @param s - Input string.
 * @returns `true` when `s` contains non-whitespace characters.
 */
const nonEmpty = (s: string) => !!s && !!s.trim();

/**
 * Extract naive "key themes" from an array of free-text journal entries.
 *
 * @param dailyTexts - Raw daily text bodies.
 * @returns Top (<= 8) capitalized keywords by frequency, excluding common stopwords,
 *          punctuation, and tokens of length ≤ 3.
 *
 * @remarks
 * - This is a simple frequency counter; it ignores context and stemming.
 * - Case-insensitive; punctuation is stripped via `/[^\w\s]/g`.
 */
function extractKeyThemes(dailyTexts: string[]): string[] {
  const common = new Set(['the','and','or','but','in','on','at','to','for','of','with','by','a','an','is','was','were','been','have','has','had','will','would','could','should','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their']);
  const freq: Record<string, number> = {};
  for (const text of dailyTexts) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !common.has(w));
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 8)
    .map(([w]) => w[0].toUpperCase() + w.slice(1));
}

/**
 * Merge and rank themes by frequency.
 *
 * @param themes - Theme strings (already normalized/capitalized by caller).
 * @returns Themes sorted by descending frequency; full list (no slice).
 */
function consolidateThemes(themes: string[]): string[] {
  const freq: Record<string, number> = {};
  for (const t of themes) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .map(([t]) => t);
}

/**
 * Short narrative reflection for a week, based on averages and accomplishment count.
 *
 * @param productivity - Average productivity (0–5).
 * @param mood - Average mood (0–5).
 * @param _energy - Average energy (unused in current template).
 * @param accomplishmentCount - Number of accomplishments listed.
 * @returns A short guidance paragraph.
 */
function weeklyReflection(productivity: number, mood: number, _energy: number, accomplishmentCount: number): string {
  let r = '';
  r += (productivity >= 4) ? 'You had a highly productive week! ' :
       (productivity >= 3) ? 'Your productivity was solid this week. ' :
                             'Your productivity was lower this week - consider what might help you feel more accomplished. ';
  r += (mood >= 4) ? 'Your mood was consistently positive. ' :
       (mood >= 3) ? 'You maintained a generally stable mood. ' :
                     'You experienced some challenging emotional moments - remember to practice self-care. ';
  r += (accomplishmentCount >= 10) ? 'You achieved a lot this week - celebrate these wins!' :
       (accomplishmentCount >= 5)  ? 'You made steady progress on your goals.' :
                                     'Consider setting smaller, more achievable daily goals.';
  return r;
}

/**
 * Short narrative reflection for a month.
 *
 * @param productivity - Average productivity (0–5).
 * @param mood - Average mood (0–5).
 * @param _energy - Average energy (unused in current template).
 * @param weekCount - Number of weeks summarized.
 * @returns A short guidance paragraph.
 */
function monthlyReflection(productivity: number, mood: number, _energy: number, weekCount: number): string {
  let r = `Over ${weekCount} weeks of journaling, `;
  r += (productivity >= 4) ? "you've maintained excellent productivity levels. " :
       (productivity >= 3) ? "you've shown consistent productivity. " :
                             "you might benefit from reviewing your productivity strategies. ";
  r += (mood >= 4) ? 'Your emotional well-being has been strong this month.' :
       (mood >= 3) ? "You've maintained good emotional balance overall." :
                     'Consider focusing on activities that boost your mood.';
  return r;
}

/**
 * Short narrative reflection for a year.
 *
 * @param productivity - Average productivity (0–5).
 * @param _mood - Average mood (unused in current template).
 * @param _energy - Average energy (unused in current template).
 * @param monthCount - Number of months summarized.
 * @returns A short guidance paragraph.
 */
function yearlyReflection(productivity: number, _mood: number, _energy: number, monthCount: number): string {
  let r = `After ${monthCount} months of consistent reflection, `;
  r += (productivity >= 4) ? "you've achieved remarkable productivity throughout the year. " :
       (productivity >= 3) ? "you've maintained steady productivity over the long term. " :
                             'you have opportunities to enhance your productivity systems. ';
  r += 'This year of journaling represents significant personal growth and self-awareness. ';
  r += 'Use these insights to set meaningful goals for the year ahead.';
  return r;
}

/**
 * Build an empty SummaryResponse with a simple label.
 *
 * @param label - Human-friendly label describing the time period (e.g., "Week of ...").
 * @returns A SummaryResponse with zeroed trends and empty lists.
 */
function emptyResponse(label: string): SummaryResponse {
  return {
    content: `${label}: No data available.`,
    insights: {
      key_themes: [],
      productivity_trend: 0,
      mood_trend: 0,
      energy_trend: 0,
      top_accomplishments: [],
      main_learnings: [],
    },
  };
}

/**
 * Format a local ISO date into "Month YYYY" for display.
 *
 * @param startDate - Local ISO date within the target month.
 * @returns A string like "January 2025".
 */
function formatMonthYear(startDate: string): string {
  const d = parseLocalISODate(startDate);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

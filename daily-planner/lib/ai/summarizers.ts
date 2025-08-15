// lib/ai/summarizers.ts
import type { DailyEntry, Summary } from '../database';
import type { SummaryResponse } from './types';
import { formatDateRange, parseLocalISODate } from '@/utils/dateHelpers';

// ---------- Public rule-based generators ----------

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

function average(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}
const nonEmpty = (s: string) => !!s && !!s.trim();

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

function consolidateThemes(themes: string[]): string[] {
  const freq: Record<string, number> = {};
  for (const t of themes) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .map(([t]) => t);
}

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

function yearlyReflection(productivity: number, _mood: number, _energy: number, monthCount: number): string {
  let r = `After ${monthCount} months of consistent reflection, `;
  r += (productivity >= 4) ? "you've achieved remarkable productivity throughout the year. " :
       (productivity >= 3) ? "you've maintained steady productivity over the long term. " :
                             'you have opportunities to enhance your productivity systems. ';
  r += 'This year of journaling represents significant personal growth and self-awareness. ';
  r += 'Use these insights to set meaningful goals for the year ahead.';
  return r;
}

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

function formatMonthYear(startDate: string): string {
  const d = parseLocalISODate(startDate);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

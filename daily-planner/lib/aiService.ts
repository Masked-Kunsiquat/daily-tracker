// lib/aiService.ts
import { DailyEntry, Summary } from './database';
import { formatDateRange } from '../utils/dateRange';

interface SummaryRequest {
  type: 'weekly' | 'monthly' | 'yearly';
  entries?: DailyEntry[];
  summaries?: Summary[];
  startDate: string;
  endDate: string;
}

interface SummaryResponse {
  content: string;
  insights: {
    key_themes: string[];
    productivity_trend: number;
    mood_trend: number;
    energy_trend: number;
    top_accomplishments: string[];
    main_learnings: string[];
  };
}

class AIService {
  private baseURL: string = 'http://localhost:3000/api'; // Placeholder for local LLM endpoint

  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    // For now, we'll implement a simple rule-based summarization
    // This will be replaced with actual LLM integration
    return this.generateRuleBasedSummary(request);
  }

  private generateRuleBasedSummary(request: SummaryRequest): SummaryResponse {
    // Validate request fields based on summary type
    this.validateSummaryRequest(request);

    if (request.type === 'weekly' && request.entries) {
      return this.generateWeeklySummary(request.entries, request.startDate, request.endDate);
    } else if (request.type === 'monthly' && request.summaries) {
      return this.generateMonthlySummary(request.summaries, request.startDate, request.endDate);
    } else if (request.type === 'yearly' && request.summaries) {
      return this.generateYearlySummary(request.summaries, request.startDate, request.endDate);
    }

    throw new Error(`Invalid summary request for type: ${request.type}`);
  }

  private validateSummaryRequest(request: SummaryRequest): void {
    // Validate startDate and endDate for all types
    if (!request.startDate || !request.endDate) {
      throw new Error(`${request.type} summary requires valid startDate and endDate`);
    }

    // Validate that dates are parsable
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`${request.type} summary requires valid parsable startDate and endDate`);
    }

    // Type-specific validation
    if (request.type === 'weekly') {
      if (!request.entries || !Array.isArray(request.entries) || request.entries.length === 0) {
        throw new Error('weekly summary requires entries as a non-empty array');
      }
    } else if (request.type === 'monthly' || request.type === 'yearly') {
      if (!request.summaries || !Array.isArray(request.summaries) || request.summaries.length === 0) {
        throw new Error(`${request.type} summary requires summaries as a non-empty array`);
      }
    }
  }

  private generateWeeklySummary(entries: DailyEntry[], startDate: string, endDate: string): SummaryResponse {
    const totalEntries = entries.length;
    
    if (totalEntries === 0) {
      return {
        content: `Week of ${formatDateRange(startDate, endDate)}: No entries recorded this week.`,
        insights: {
          key_themes: [],
          productivity_trend: 0,
          mood_trend: 0,
          energy_trend: 0,
          top_accomplishments: [],
          main_learnings: [],
        }
      };
    }

    // Calculate averages
    const avgProductivity = this.calculateAverage(entries.map(e => e.ratings.productivity));
    const avgMood = this.calculateAverage(entries.map(e => e.ratings.mood));
    const avgEnergy = this.calculateAverage(entries.map(e => e.ratings.energy));

    // Collect all accomplishments and learnings
    const allAccomplishments = entries.flatMap(e => e.accomplishments).filter(a => a.trim());
    const allLearnings = entries.flatMap(e => e.things_learned).filter(l => l.trim());
    const allGrateful = entries.flatMap(e => e.things_grateful).filter(g => g.trim());

    // Extract key themes from daily text
    const keyThemes = this.extractKeyThemes(entries.map(e => e.daily_text));

    // Generate content
    const content = this.generateWeeklyContent(
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

  private generateMonthlySummary(weeklySummaries: Summary[], startDate: string, endDate: string): SummaryResponse {
    if (weeklySummaries.length === 0) {
      return {
        content: `Month of ${formatDateRange(startDate, endDate)}: No weekly summaries available.`,
        insights: {
          key_themes: [],
          productivity_trend: 0,
          mood_trend: 0,
          energy_trend: 0,
          top_accomplishments: [],
          main_learnings: [],
        }
      };
    }

    // Aggregate insights from weekly summaries
    const avgProductivity = this.calculateAverage(weeklySummaries.map(s => s.insights.productivity_trend));
    const avgMood = this.calculateAverage(weeklySummaries.map(s => s.insights.mood_trend));
    const avgEnergy = this.calculateAverage(weeklySummaries.map(s => s.insights.energy_trend));

    const allThemes = weeklySummaries.flatMap(s => s.insights.key_themes);
    const allAccomplishments = weeklySummaries.flatMap(s => s.insights.top_accomplishments);
    const allLearnings = weeklySummaries.flatMap(s => s.insights.main_learnings);

    // Consolidate themes and enforce 10-theme limit for monthly summaries
    const keyThemes = this.consolidateThemes(allThemes).slice(0, 10);

    const content = this.generateMonthlyContent(
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

  private generateYearlySummary(monthlySummaries: Summary[], startDate: string, endDate: string): SummaryResponse {
    if (monthlySummaries.length === 0) {
      return {
        content: `Year ${new Date(startDate).getFullYear()}: No monthly summaries available.`,
        insights: {
          key_themes: [],
          productivity_trend: 0,
          mood_trend: 0,
          energy_trend: 0,
          top_accomplishments: [],
          main_learnings: [],
        }
      };
    }

    // Aggregate insights from monthly summaries
    const avgProductivity = this.calculateAverage(monthlySummaries.map(s => s.insights.productivity_trend));
    const avgMood = this.calculateAverage(monthlySummaries.map(s => s.insights.mood_trend));
    const avgEnergy = this.calculateAverage(monthlySummaries.map(s => s.insights.energy_trend));

    const allThemes = monthlySummaries.flatMap(s => s.insights.key_themes);
    const allAccomplishments = monthlySummaries.flatMap(s => s.insights.top_accomplishments);
    const allLearnings = monthlySummaries.flatMap(s => s.insights.main_learnings);

    // Consolidate themes and enforce 8-theme limit for yearly summaries
    const keyThemes = this.consolidateThemes(allThemes).slice(0, 8);

    const content = this.generateYearlyContent(
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

  private generateWeeklyContent(
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
    const totalDays = entries.length;
    
    return `# Weekly Summary: ${dateRange}

## Overview
You logged ${totalDays} entries this week. Here's how your week went:

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
${this.generateWeeklyReflection(avgProductivity, avgMood, avgEnergy, accomplishments.length)}`;
  }

  private generateMonthlyContent(
    weeklySummaries: Summary[],
    startDate: string,
    endDate: string,
    avgProductivity: number,
    avgMood: number,
    avgEnergy: number,
    keyThemes: string[],
    accomplishments: string[],
    learnings: string[]
  ): string {
    const monthYear = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
${this.generateMonthlyReflection(avgProductivity, avgMood, avgEnergy, weekCount)}`;
  }

  private generateYearlyContent(
    monthlySummaries: Summary[],
    startDate: string,
    endDate: string,
    avgProductivity: number,
    avgMood: number,
    avgEnergy: number,
    keyThemes: string[],
    accomplishments: string[],
    learnings: string[]
  ): string {
    const year = new Date(startDate).getFullYear();
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
${this.generateYearlyReflection(avgProductivity, avgMood, avgEnergy, monthCount)}`;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private extractKeyThemes(dailyTexts: string[]): string[] {
    // Simple keyword extraction - this could be enhanced with NLP
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
    
    const wordFreq: { [key: string]: number } = {};
    
    dailyTexts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }

  private consolidateThemes(themes: string[]): string[] {
    const themeFreq: { [key: string]: number } = {};
    
    themes.forEach(theme => {
      themeFreq[theme] = (themeFreq[theme] || 0) + 1;
    });

    // Return consolidated themes without internal limit - caller will slice as needed
    return Object.entries(themeFreq)
      .sort(([,a], [,b]) => b - a)
      .map(([theme]) => theme);
  }

  private generateWeeklyReflection(productivity: number, mood: number, energy: number, accomplishmentCount: number): string {
    let reflection = "";
    
    if (productivity >= 4) {
      reflection += "You had a highly productive week! ";
    } else if (productivity >= 3) {
      reflection += "Your productivity was solid this week. ";
    } else {
      reflection += "Your productivity was lower this week - consider what might help you feel more accomplished. ";
    }

    if (mood >= 4) {
      reflection += "Your mood was consistently positive. ";
    } else if (mood >= 3) {
      reflection += "You maintained a generally stable mood. ";
    } else {
      reflection += "You experienced some challenging emotional moments - remember to practice self-care. ";
    }

    if (accomplishmentCount >= 10) {
      reflection += "You achieved a lot this week - celebrate these wins!";
    } else if (accomplishmentCount >= 5) {
      reflection += "You made steady progress on your goals.";
    } else {
      reflection += "Consider setting smaller, more achievable daily goals.";
    }

    return reflection;
  }

  private generateMonthlyReflection(productivity: number, mood: number, energy: number, weekCount: number): string {
    let reflection = `Over ${weekCount} weeks of journaling, `;
    
    if (productivity >= 4) {
      reflection += "you've maintained excellent productivity levels. ";
    } else if (productivity >= 3) {
      reflection += "you've shown consistent productivity. ";
    } else {
      reflection += "you might benefit from reviewing your productivity strategies. ";
    }

    if (mood >= 4) {
      reflection += "Your emotional well-being has been strong this month.";
    } else if (mood >= 3) {
      reflection += "You've maintained good emotional balance overall.";
    } else {
      reflection += "Consider focusing on activities that boost your mood.";
    }

    return reflection;
  }

  private generateYearlyReflection(productivity: number, mood: number, energy: number, monthCount: number): string {
    let reflection = `After ${monthCount} months of consistent reflection, `;
    
    if (productivity >= 4) {
      reflection += "you've achieved remarkable productivity throughout the year. ";
    } else if (productivity >= 3) {
      reflection += "you've maintained steady productivity over the long term. ";
    } else {
      reflection += "you have opportunities to enhance your productivity systems. ";
    }

    reflection += "This year of journaling represents significant personal growth and self-awareness. ";
    reflection += "Use these insights to set meaningful goals for the year ahead.";

    return reflection;
  }

  // Future: Integration with local LLM
  private async callLocalLLM(prompt: string, data: any): Promise<string> {
    // This will be implemented when integrating with a local LLM
    // For now, return a placeholder
    throw new Error('Local LLM integration not yet implemented');
  }

  // Prompt templates for future LLM integration
  private getWeeklySummaryPrompt(entries: DailyEntry[]): string {
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
`;
  }
}

export const aiService = new AIService();
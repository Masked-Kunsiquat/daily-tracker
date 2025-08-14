import { databaseService, Summary } from './database';
import { aiService } from './aiService';

export class SummaryService {
  
  async generateWeeklySummary(weekStartDate: string): Promise<Summary | null> {
    try {
      // Get daily entries for the week
      const entries = await databaseService.getEntriesForWeeklySummary(weekStartDate);
      
      if (entries.length === 0) {
        console.log('No entries found for week starting:', weekStartDate);
        return null;
      }

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      
      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'weekly',
        entries,
        startDate: weekStartDate,
        endDate: weekEndDate.toISOString().split('T')[0]
      });

      // Create summary object
      const summary: Summary = {
        type: 'weekly',
        start_date: weekStartDate,
        end_date: weekEndDate.toISOString().split('T')[0],
        content: summaryResponse.content,
        insights: summaryResponse.insights
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      throw error;
    }
  }

  async generateMonthlySummary(monthStartDate: string): Promise<Summary | null> {
    try {
      // Get weekly summaries for the month
      const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartDate);
      
      if (weeklySummaries.length === 0) {
        console.log('No weekly summaries found for month starting:', monthStartDate);
        return null;
      }

      const monthEndDate = new Date(monthStartDate);
      monthEndDate.setMonth(monthEndDate.getMonth() + 1);
      monthEndDate.setDate(0); // Last day of the month
      
      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'monthly',
        summaries: weeklySummaries,
        startDate: monthStartDate,
        endDate: monthEndDate.toISOString().split('T')[0]
      });

      // Create summary object
      const summary: Summary = {
        type: 'monthly',
        start_date: monthStartDate,
        end_date: monthEndDate.toISOString().split('T')[0],
        content: summaryResponse.content,
        insights: summaryResponse.insights
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      throw error;
    }
  }

  async generateYearlySummary(year: number): Promise<Summary | null> {
    try {
      const yearStartDate = `${year}-01-01`;
      const yearEndDate = `${year}-12-31`;
      
      // Get monthly summaries for the year
      const monthlySummaries = await databaseService.getSummaries('monthly');
      const yearMonthlySummaries = monthlySummaries.filter(summary => 
        summary.start_date >= yearStartDate && summary.end_date <= yearEndDate
      );
      
      if (yearMonthlySummaries.length === 0) {
        console.log('No monthly summaries found for year:', year);
        return null;
      }
      
      // Generate summary using AI service
      const summaryResponse = await aiService.generateSummary({
        type: 'yearly',
        summaries: yearMonthlySummaries,
        startDate: yearStartDate,
        endDate: yearEndDate
      });

      // Create summary object
      const summary: Summary = {
        type: 'yearly',
        start_date: yearStartDate,
        end_date: yearEndDate,
        content: summaryResponse.content,
        insights: summaryResponse.insights
      };

      // Save to database
      const summaryId = await databaseService.saveSummary(summary);
      summary.id = summaryId;

      return summary;
    } catch (error) {
      console.error('Error generating yearly summary:', error);
      throw error;
    }
  }

  async checkAndGeneratePendingSummaries(): Promise<void> {
    try {
      // Check for weekly summaries that need to be generated
      await this.generatePendingWeeklySummaries();
      
      // Check for monthly summaries that need to be generated
      await this.generatePendingMonthlySummaries();
      
      // Check for yearly summaries that need to be generated
      await this.generatePendingYearlySummaries();
    } catch (error) {
      console.error('Error checking pending summaries:', error);
    }
  }

  private async generatePendingWeeklySummaries(): Promise<void> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find Mondays in the past month that don't have summaries
    for (let i = 0; i < 4; i++) {
      const potentialMonday = new Date(oneWeekAgo);
      potentialMonday.setDate(potentialMonday.getDate() - (i * 7));
      
      // Get the Monday of that week
      const dayOfWeek = potentialMonday.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(potentialMonday);
      monday.setDate(monday.getDate() + mondayOffset);
      
      const mondayString = monday.toISOString().split('T')[0];
      
      // Check if we already have a summary for this week
      const existingSummaries = await databaseService.getSummaries('weekly');
      const hasExisting = existingSummaries.some(s => s.start_date === mondayString);
      
      if (!hasExisting) {
        const entries = await databaseService.getEntriesForWeeklySummary(mondayString);
        if (entries.length >= 3) { // Only generate if there are at least 3 entries
          await this.generateWeeklySummary(mondayString);
        }
      }
    }
  }

  private async generatePendingMonthlySummaries(): Promise<void> {
    const now = new Date();
    
    // Check the last 3 months
    for (let i = 1; i <= 3; i++) {
      const checkDate = new Date(now);
      checkDate.setMonth(checkDate.getMonth() - i);
      checkDate.setDate(1); // First day of the month
      
      const monthStartString = checkDate.toISOString().split('T')[0];
      
      // Check if we already have a summary for this month
      const existingSummaries = await databaseService.getSummaries('monthly');
      const hasExisting = existingSummaries.some(s => s.start_date === monthStartString);
      
      if (!hasExisting) {
        const weeklySummaries = await databaseService.getWeeklySummariesForMonth(monthStartString);
        if (weeklySummaries.length >= 2) { // Only generate if there are at least 2 weekly summaries
          await this.generateMonthlySummary(monthStartString);
        }
      }
    }
  }

  private async generatePendingYearlySummaries(): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    // Check the last 2 years (excluding current year)
    for (let year = currentYear - 2; year < currentYear; year++) {
      // Check if we already have a summary for this year
      const existingSummaries = await databaseService.getSummaries('yearly');
      const hasExisting = existingSummaries.some(s => 
        s.start_date === `${year}-01-01`
      );
      
      if (!hasExisting) {
        const monthlySummaries = await databaseService.getSummaries('monthly');
        const yearMonthlySummaries = monthlySummaries.filter(summary => 
          summary.start_date >= `${year}-01-01` && summary.end_date <= `${year}-12-31`
        );
        
        if (yearMonthlySummaries.length >= 6) { // Only generate if there are at least 6 monthly summaries
          await this.generateYearlySummary(year);
        }
      }
    }
  }

  async getWeekStartDate(date: Date): Promise<string> {
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(monday.getDate() + mondayOffset);
    return monday.toISOString().split('T')[0];
  }

  async getMonthStartDate(date: Date): Promise<string> {
    const monthStart = new Date(date);
    monthStart.setDate(1);
    return monthStart.toISOString().split('T')[0];
  }
  
  // New method to fetch summaries by type
  async getSummaries(type: 'weekly' | 'monthly' | 'yearly'): Promise<Summary[]> {
    return databaseService.getSummaries(type);
  }

  async getSummaryStats(): Promise<{
    weekly: number;
    monthly: number;
    yearly: number;
  }> {
    try {
      const [weeklyCount, monthlyCount, yearlyCount] = await Promise.all([
        databaseService.getSummaryCount('weekly'),
        databaseService.getSummaryCount('monthly'),
        databaseService.getSummaryCount('yearly')
      ]);

      return {
        weekly: weeklyCount,
        monthly: monthlyCount,
        yearly: yearlyCount
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return { weekly: 0, monthly: 0, yearly: 0 };
    }
  }

  async forceSummaryGeneration(type: 'weekly' | 'monthly' | 'yearly', date: string): Promise<Summary | null> {
    try {
      switch (type) {
        case 'weekly':
          return await this.generateWeeklySummary(date);
        case 'monthly':
          return await this.generateMonthlySummary(date);
        case 'yearly': {
          const year = parseInt(date.split('-')[0]);
          return await this.generateYearlySummary(year);
        }
        default:
          throw new Error(`Invalid summary type: ${type}`);
      }
    } catch (error) {
      console.error(`Error force generating ${type} summary:`, error);
      throw error;
    }
  }
}

export const summaryService = new SummaryService();
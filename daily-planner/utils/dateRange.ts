// utils/dateRange.ts

/**
 * Formats a date range for display, handling same month/year cases gracefully
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  
  if (startYear === endYear && startMonth === endMonth) {
    // Same month and year: "January 1 - 7, 2024" (with spaces around hyphen)
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${startYear}`;
  } else if (startYear === endYear) {
    // Same year, different months: "Jan 28 - Feb 3, 2024"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startYear}`;
  } else {
    // Different years: "Dec 28, 2023 - Jan 3, 2024"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
};
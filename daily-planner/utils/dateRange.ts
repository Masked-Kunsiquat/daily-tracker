// utils/dateRange.ts

/**
 * Parse "YYYY-MM-DD" as a local Date (no timezone surprises)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the local date
 */
const parseLocalISODate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate the parsed values
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
  }
  
  // Create date using local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
};

/**
 * Formats a date range for display, handling same month/year cases gracefully
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string, 
  endDate: string, 
  locale: string = 'en-US'
): string => {
  // Parse dates as local dates to avoid UTC timezone issues
  const start = parseLocalISODate(startDate);
  const end = parseLocalISODate(endDate);
  
  // Validate that start date is not after end date
  if (start > end) {
    console.warn(`Start date ${startDate} is after end date ${endDate}. Swapping dates.`);
    // Swap and recurse with corrected order
    return formatDateRange(endDate, startDate, locale);
  }
  
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  
  if (startYear === endYear && startMonth === endMonth) {
    // Same month and year: "January 1 - 7, 2024" (with spaces around hyphen)
    return `${start.toLocaleDateString(locale, { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${startYear}`;
  } else if (startYear === endYear) {
    // Same year, different months: "Jan 28 - Feb 3, 2024"
    return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}, ${startYear}`;
  } else {
    // Different years: "Dec 28, 2023 - Jan 3, 2024"
    return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
};
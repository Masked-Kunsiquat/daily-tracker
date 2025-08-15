// ============================================
// utils/dateHelpers.ts
// (Consolidated: strict parsing + range + friendly labels)
// ============================================

/**
 * Regex for strict local ISO dates: YYYY-MM-DD
 */
export const LOCAL_ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Format a Date object as a local YYYY-MM-DD string.
 * Uses the local timezone (no UTC shifts).
 */
export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse "YYYY-MM-DD" as a local Date (strict) and reject invalid/overflow dates.
 * Trims input, validates against LOCAL_ISO_DATE_RE,
 * constructs new Date(year, month-1, day) in local time,
 * and re-verifies components to prevent normalization (e.g., 2024-02-31).
 */
export function parseLocalISODate(dateString: string): Date {
  const trimmed = dateString.trim();
  const match = LOCAL_ISO_DATE_RE.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid date format: "${dateString}". Expected YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: "${dateString}".`);
  }

  return date;
}

/**
 * Validate a potential local ISO date string without throwing.
 */
export function isValidLocalISODate(value: string): boolean {
  try {
    parseLocalISODate(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience: current date (local) as YYYY-MM-DD.
 */
export const formatDateISO = (date: Date = new Date()): string => {
  return formatLocalDateISO(date);
};

/**
 * Human-readable full date (weekday, month, day, year).
 */
export const formatDateHuman = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Friendly label for an entry date relative to a provided "today" (local ISO).
 * - "Today" if matches today
 * - "Yesterday" if matches yesterday
 * - Otherwise: "MMM d" (e.g., "Aug 14")
 */
export const formatEntryDate = (
  dateStr: string,
  todayISO: string,
  locale: string = 'en-US'
): string => {
  if (dateStr === todayISO) return 'Today';

  const today = parseLocalISODate(todayISO);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = formatLocalDateISO(yesterday);

  if (dateStr === yesterdayISO) return 'Yesterday';

  const date = parseLocalISODate(dateStr);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Format a human-readable date range from two local ISO strings.
 * Rules:
 *  - Same month & year: "January 1 - 7, 2024"
 *  - Same year, different months: "Jan 28 - Feb 3, 2024"
 *  - Different years: "Dec 28, 2023 - Jan 3, 2024"
 * Inputs are swapped automatically if out of order.
 */
export const formatDateRange = (
  startDate: string,
  endDate: string,
  locale: string = 'en-US'
): string => {
  const start = parseLocalISODate(startDate);
  const end = parseLocalISODate(endDate);

  if (start > end) {
    // Swap order without recursion to avoid deep stacks on repeated inversions
    const s = end;
    const e = start;
    const sY = s.getFullYear();
    const eY = e.getFullYear();
    const sM = s.getMonth();
    const eM = e.getMonth();

    if (sY === eY && sM === eM) {
      const startPart = s.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
      return `${startPart} - ${e.getDate()}, ${sY}`;
    } else if (sY === eY) {
      const startPart = s.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      const endPart = e.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      return `${startPart} - ${endPart}, ${sY}`;
    } else {
      const startPart = s.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
      const endPart = e.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startPart} - ${endPart}`;
    }
  }

  const sY = start.getFullYear();
  const eY = end.getFullYear();
  const sM = start.getMonth();
  const eM = end.getMonth();

  if (sY === eY && sM === eM) {
    const startPart = start.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
    return `${startPart} - ${end.getDate()}, ${sY}`;
  } else if (sY === eY) {
    const startPart = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const endPart = end.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${startPart} - ${endPart}, ${sY}`;
  } else {
    const startPart = start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    const endPart = end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startPart} - ${endPart}`;
  }
};

// (Optional) default export to make migration easier if some files used default import.
export default {
  LOCAL_ISO_DATE_RE,
  formatLocalDateISO,
  parseLocalISODate,
  isValidLocalISODate,
  formatDateISO,
  formatDateHuman,
  formatEntryDate,
  formatDateRange,
};

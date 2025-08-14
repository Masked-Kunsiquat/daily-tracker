// ============================================
// utils/dateHelpers.ts
// ============================================

// Helper function to format a Date object as local YYYY-MM-DD string
const formatLocalDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse "YYYY-MM-DD" as a local Date (no timezone surprises)
const parseLocalISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};


export const formatDateISO = (date: Date = new Date()): string => {
  return formatLocalDateISO(date);
};

export const formatDateHuman = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatEntryDate = (dateStr: string, todayISO: string): string => {
  if (dateStr === todayISO) return 'Today';

  // Use consistent local date handling for yesterday calculation
const today = parseLocalISODate(todayISO);
const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayISO = formatLocalDateISO(yesterday);

if (dateStr === yesterdayISO) return 'Yesterday';

const date = parseLocalISODate(dateStr);
return new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
}).format(date);

};
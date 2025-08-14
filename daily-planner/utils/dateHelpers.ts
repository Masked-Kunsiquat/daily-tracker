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
  const today = new Date(todayISO + 'T00:00:00'); // Parse as local date
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = formatLocalDateISO(yesterday);
  
  if (dateStr === yesterdayISO) return 'Yesterday';

  const date = new Date(dateStr + 'T00:00:00'); // Parse as local date
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};
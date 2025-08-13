// ============================================
// utils/dateHelpers.ts
// ============================================
export const formatDateISO = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
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

  const today = new Date(todayISO);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];
  
  if (dateStr === yesterdayISO) return 'Yesterday';

  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

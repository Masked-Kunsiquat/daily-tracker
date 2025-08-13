// ============================================
// utils/textHelpers.ts
// ============================================
import { DailyEntry } from '../lib/database';

export const getEntryPreview = (entry: DailyEntry): string => {
  const text = entry.daily_text?.trim() ?? '';
  
  if (text.length > 0) {
    return text.length > 100 ? `${text.substring(0, 100)}...` : text;
  }
  
  const accomplishments = entry.accomplishments?.length ?? 0;
  const learned = entry.things_learned?.length ?? 0;
  const grateful = entry.things_grateful?.length ?? 0;
  const total = accomplishments + learned + grateful;
  
  return total > 0 ? `${total} items logged` : 'No content';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
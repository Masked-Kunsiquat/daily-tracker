// utils/textHelpers.ts
import { DailyEntry } from '../lib/database';

/**
 * Build a short, human-friendly preview for a {@link DailyEntry}.
 *
 * Logic:
 * - If `daily_text` has any non-whitespace content:
 *   - Return it as-is when ≤ 100 chars, otherwise truncate to 100 chars and append `…`.
 * - Otherwise, fall back to counts across lists:
 *   - Return "`<total> items logged`" if there are any items across
 *     `accomplishments`, `things_learned`, and `things_grateful`.
 *   - If no text and no items, return `"No content"`.
 *
 * Notes:
 * - Arrays are expected to be populated by the database layer (empty if none).
 *
 * @param entry - The daily entry to summarize.
 * @returns A short preview string.
 */
export const getEntryPreview = (entry: DailyEntry): string => {
  const text = entry.daily_text?.trim() ?? '';

  if (text.length > 0) {
    return text.length > 100 ? `${text.substring(0, 100)}...` : text;
  }

  // These arrays are now directly populated by the database service
  const accomplishments = entry.accomplishments?.length ?? 0;
  const learned = entry.things_learned?.length ?? 0;
  const grateful = entry.things_grateful?.length ?? 0;
  const total = accomplishments + learned + grateful;

  return total > 0 ? `${total} items logged` : 'No content';
};

/**
 * Truncate a string to a maximum length and append an ellipsis if needed.
 *
 * @param text - The input string.
 * @param maxLength - Maximum allowed length before truncation.
 * @returns The original string if its length ≤ `maxLength`; otherwise the first
 *          `maxLength` characters followed by `…`.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// utils/dateRange.ts
// Deprecated: use utils/dateHelpers instead.
// This shim re-exports to avoid breaking existing imports.

export {
  LOCAL_ISO_DATE_RE,
  formatLocalDateISO,
  parseLocalISODate,
  isValidLocalISODate,
  formatDateISO,
  formatDateHuman,
  formatEntryDate,
  formatDateRange,
  default as default
} from './dateHelpers';

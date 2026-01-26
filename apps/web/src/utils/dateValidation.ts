/**
 * Date Validation Utilities
 * Helper functions for date validation and formatting
 */

/**
 * Get maximum days in a given month
 */
export function getMaxDaysInMonth(month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1] || 31;
}

/**
 * Validate a day/month combination
 */
export function validateDate(day: string, month: string): boolean {
  const d = parseInt(day);
  const m = parseInt(month);
  if (isNaN(d) || isNaN(m)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > getMaxDaysInMonth(m)) return false;
  return true;
}

/**
 * Format day and month into MM-DD string
 */
export function formatDateString(day: string, month: string): string {
  if (!day || !month) return '';
  const d = day.padStart(2, '0');
  const m = month.padStart(2, '0');
  return `${m}-${d}`;
}

/**
 * Check if we have a valid date range
 */
export function hasValidDateRange(
  startDay: string,
  startMonth: string,
  endDay: string,
  endMonth: string
): boolean {
  return !!(
    startDay &&
    startMonth &&
    endDay &&
    endMonth &&
    validateDate(startDay, startMonth) &&
    validateDate(endDay, endMonth)
  );
}

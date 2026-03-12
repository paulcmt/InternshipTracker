/**
 * French date formatting utilities
 */

const FRENCH_LOCALE = "fr-FR";

/**
 * Format a date in French short format (e.g. "11/03/2025")
 */
export function formatDateFr(date: Date): string {
  return date.toLocaleDateString(FRENCH_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a date with time in French
 */
export function formatDateTimeFr(date: Date): string {
  return date.toLocaleDateString(FRENCH_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative date (e.g. "il y a 2 jours", "dans 3 jours")
 */
export function formatRelativeDateFr(date: Date, baseDate: Date = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} jours`;
  if (diffDays < -1 && diffDays >= -7) return `Il y a ${Math.abs(diffDays)} jours`;
  return formatDateFr(date);
}

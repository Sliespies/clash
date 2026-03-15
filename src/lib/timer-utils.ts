/**
 * Parse the elapsed seconds from Google Sheets column D.
 * Handles:
 * - Plain number in seconds (e.g. 1548)
 * - H:MM:SS or HH:MM:SS text (e.g. "0:25:48")
 * - Fractional day value (e.g. 0.0179166... = 1548/86400)
 */
export function parseElapsedSeconds(raw: string | undefined): number | null {
  if (!raw || raw.trim() === '') return null;

  const trimmed = raw.trim();

  // Try H:MM:SS or HH:MM:SS first (most reliable)
  const timeMatch = trimmed.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (timeMatch) {
    return Number(timeMatch[1]) * 3600 + Number(timeMatch[2]) * 60 + Number(timeMatch[3]);
  }

  // Try MM:SS format
  const mmssMatch = trimmed.match(/^(\d+):(\d{2})$/);
  if (mmssMatch) {
    return Number(mmssMatch[1]) * 60 + Number(mmssMatch[2]);
  }

  const num = Number(trimmed);
  if (isNaN(num) || num <= 0) return null;

  // If it's a fractional day value (Google Sheets internal format)
  // A value < 1 means less than 1 day, convert to seconds
  if (num < 1) {
    return Math.round(num * 86400);
  }

  // Plain number in seconds
  return num;
}

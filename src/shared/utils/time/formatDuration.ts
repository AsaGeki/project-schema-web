const SECONDS_IN_DAY = 86_400;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_MINUTE = 60;

/**
 * Formata uma duração em segundos como texto legível (`3d 4h 12m 5s`),
 * omitindo as unidades zeradas à esquerda.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  const parts: string[] = [];
  const days = Math.floor(seconds / SECONDS_IN_DAY);
  const hours = Math.floor((seconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
  const minutes = Math.floor((seconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
  const remaining = seconds % SECONDS_IN_MINUTE;

  if (days) parts.push(`${days}d`);
  if (hours || parts.length) parts.push(`${hours}h`);
  if (minutes || parts.length) parts.push(`${minutes}m`);
  parts.push(`${remaining}s`);

  return parts.join(' ');
}

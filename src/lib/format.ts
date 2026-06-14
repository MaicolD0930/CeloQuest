/** Format milliseconds as a compact duration (e.g. "45s", "2m 15s", "1h 5m"). */
export function formatDurationMs(ms: number) {
  if (ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;

  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  if (hours > 0) {
    if (min > 0) return `${hours}h ${min}m`;
    return `${hours}h`;
  }

  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

/** Live mm:ss timer for in-progress challenges. */
export function formatTimerLive(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/** Hours and minutes until a UTC end timestamp (season countdown). */
export function getSeasonRemaining(endDate: string | Date, now = Date.now()) {
  const endMs = new Date(endDate).getTime();
  const diff = endMs - now;
  if (diff <= 0) return { hours: 0, minutes: 0, ended: true as const };
  const totalMinutes = Math.floor(diff / 60_000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    ended: false as const,
  };
}

export function formatSeasonRemaining(endDate: string | Date, now = Date.now()) {
  const { hours, minutes, ended } = getSeasonRemaining(endDate, now);
  if (ended) return null;
  return `${hours}h ${minutes}m`;
}

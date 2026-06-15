/** In-memory throttle for expensive season sync (per server instance). */
const lastSeasonSyncByUser = new Map<string, number>();
const lastGlobalSeasonSync = { at: 0 };

export const SEASON_SYNC_TTL_MS = 3 * 60 * 1000;

export function markSeasonSynced(userId?: string) {
  const now = Date.now();
  lastGlobalSeasonSync.at = now;
  if (userId) lastSeasonSyncByUser.set(userId, now);
}

export function shouldSkipSeasonSync(userId?: string): boolean {
  const now = Date.now();
  if (userId) {
    const last = lastSeasonSyncByUser.get(userId) ?? 0;
    return now - last < SEASON_SYNC_TTL_MS;
  }
  return now - lastGlobalSeasonSync.at < SEASON_SYNC_TTL_MS;
}

export function invalidateSeasonSyncCache(userId?: string) {
  lastGlobalSeasonSync.at = 0;
  if (userId) lastSeasonSyncByUser.delete(userId);
}

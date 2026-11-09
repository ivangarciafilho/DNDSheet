/** The two methods `pinia-plugin-persistedstate` needs from a storage. */
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

/**
 * B5.8: the persistence plugin swallows write errors (it logs only with `debug`), so a full or blocked storage stops
 * saving silently. This wrapper reports each failure to `onFailure` at most once per `quietMs`, and keeps reads
 * working (a blocked storage reads as empty instead of throwing during app start).
 */
export function createGuardedStorage(
  backend: () => StorageLike | undefined,
  onFailure: (error: unknown, key: string) => void,
  quietMs = 30000,
  now: () => number = Date.now,
): StorageLike {
  let lastReport = -Infinity
  return {
    getItem(key) {
      try { return backend()?.getItem(key) ?? null } catch { return null }
    },
    setItem(key, value) {
      try {
        const storage = backend()
        if (!storage) throw new Error('storage unavailable')
        storage.setItem(key, value)
      } catch (error) {
        if (now() - lastReport >= quietMs) { lastReport = now(); onFailure(error, key) }
      }
    },
  }
}

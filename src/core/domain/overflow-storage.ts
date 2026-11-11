import { createGuardedStorage, type StorageLike } from './guarded-storage.ts'

export interface OverflowSnapshots {
  read(key: string): Promise<string | null>
  write(key: string, value: string): Promise<void>
}

/**
 * Keep ordinary saves synchronous. When localStorage rejects a write, put the
 * full serialized snapshot in IndexedDB. A committed overflow snapshot stays
 * authoritative on reload, including after later edits make it smaller.
 */
export async function createOverflowStorage(
  primary: () => StorageLike | undefined,
  overflow: OverflowSnapshots,
  keys: readonly string[],
  onFailure: (error: unknown, key: string) => void,
  quietMs = 30000,
  now: () => number = Date.now,
): Promise<StorageLike> {
  const eligible = new Set(keys)
  const committed = new Map<string, string>()
  const pending = new Map<string, string>()
  const writing = new Set<string>()
  let lastReport = -Infinity
  const report = (error: unknown, key: string) => {
    if (now() - lastReport < quietMs) return
    lastReport = now()
    onFailure(error, key)
  }
  const guarded = createGuardedStorage(primary, report, quietMs, now)

  await Promise.all(keys.map(async key => {
    try {
      const saved = await overflow.read(key)
      if (saved !== null) committed.set(key, saved)
    } catch {
      // Browsers with IndexedDB disabled can continue using localStorage.
    }
  }))

  const flush = async (key: string) => {
    if (writing.has(key)) return
    writing.add(key)
    try {
      for (let value = pending.get(key); value !== undefined; value = pending.get(key)) {
        pending.delete(key)
        try {
          await overflow.write(key, value)
          committed.set(key, value)
        } catch (error) {
          report(error, key)
        }
      }
    } finally {
      writing.delete(key)
    }
  }

  return {
    getItem(key) {
      return committed.get(key) ?? guarded.getItem(key)
    },
    setItem(key, value) {
      if (!eligible.has(key)) {
        guarded.setItem(key, value)
        return
      }
      if (!committed.has(key) && !writing.has(key)) {
        try {
          const storage = primary()
          if (!storage) throw new Error('storage unavailable')
          storage.setItem(key, value)
          return
        } catch {
          // The larger store may still accept the complete save.
        }
      }
      pending.set(key, value)
      void flush(key)
    },
  }
}

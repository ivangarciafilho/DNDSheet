import type { OverflowSnapshots } from '../domain/overflow-storage.ts'

const STORE = 'snapshots'
export const LARGE_SNAPSHOT_KEYS = ['app.monster', 'app.editor'] as const

function openSnapshots(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('DNDSheetAutosave', 1)
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    }
    const timeout = setTimeout(() => fail(new Error('Autosave storage timed out')), 4000)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => fail(request.error)
    request.onblocked = () => fail(new Error('Autosave storage is blocked'))
    request.onsuccess = () => {
      if (settled) {
        request.result.close()
        return
      }
      settled = true
      clearTimeout(timeout)
      resolve(request.result)
    }
  })
}

async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openSnapshots()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = operation(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error('Autosave transaction aborted'))
    })
  } finally {
    db.close()
  }
}

export const indexedDbSnapshots: OverflowSnapshots = {
  async read(key) {
    const value: unknown = await transact('readonly', store => store.get(key))
    return typeof value === 'string' ? value : null
  },
  async write(key, value) {
    await transact('readwrite', store => store.put(value, key))
  },
}

export async function clearOverflowSnapshot(key: string): Promise<void> {
  await transact('readwrite', store => store.delete(key))
}

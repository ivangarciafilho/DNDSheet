import { CR } from '../domain/cr-tables.ts'
import type { Monster } from '../domain/types.ts'
import {
  classifyStorageError,
  StorageFailureError,
  type MonsterSummary,
  type StoragePort,
} from '../ports/StoragePort.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

export class IndexedDbStorageAdapter implements StoragePort {
  private dbName: string
  private storeName = 'monsters'
  private version = 1

  constructor(dbName = 'DndSheetDB') {
    this.dbName = dbName
  }

  private assertIndexedDbAvailable(): void {
    const ok =
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    if (!ok) {
      throw new StorageFailureError('storage_blocked', 'IndexedDB is unavailable in this environment.')
    }
  }

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getMonster(id: string): Promise<Monster | null> {
    this.assertIndexedDbAvailable()

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly')
        const store = tx.objectStore(this.storeName)
        const req = store.get(id)

        req.onsuccess = () => {
          if (req.result) {
            resolve(migrateMonsterSchema(req.result))
          } else {
            resolve(null)
          }
        }
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async saveMonster(monster: Monster): Promise<void> {
    this.assertIndexedDbAvailable()

    const id = (monster as any).id || (monster as any).name || 'unnamed'
    const payload = {
      ...monster,
      id,
      updatedAt: Date.now(),
    }

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)
        const req = store.put(payload)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async listMonsters(): Promise<MonsterSummary[]> {
    this.assertIndexedDbAvailable()

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly')
        const store = tx.objectStore(this.storeName)
        const req = store.getAll()

        req.onsuccess = () => {
          const list = req.result || []
          const summaries: MonsterSummary[] = list.map((m: any) => {
            const crObj = CR[m.CR] || { cr: '0', numeric: 0 }
            return {
              id: m.id,
              name: m.nickname || m.name || 'Unnamed Monster',
              cr: crObj.cr,
              numericCr: crObj.numeric,
              type: m.type || 'unknown',
              size: m.size || 'Medium',
              alignment: m.alignment || 'unaligned',
              updatedAt: m.updatedAt || 0,
              format: m.format === '2024' ? '2024' : '2014',
            }
          })
          resolve(summaries.sort((a, b) => b.updatedAt - a.updatedAt))
        }
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async deleteMonster(id: string): Promise<void> {
    this.assertIndexedDbAvailable()

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)
        const req = store.delete(id)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async exportAll(): Promise<string> {
    this.assertIndexedDbAvailable()

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly')
        const store = tx.objectStore(this.storeName)
        const req = store.getAll()

        req.onsuccess = () => {
          const list = (req.result || []).map((item: any) => migrateMonsterSchema(item))
          resolve(JSON.stringify(list, null, 2))
        }
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async importAll(jsonString: string): Promise<number> {
    const parsed = JSON.parse(jsonString)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    let count = 0

    for (const item of list) {
      if (item && typeof item === 'object') {
        const migrated = migrateMonsterSchema(item)
        await this.saveMonster(migrated)
        count++
      }
    }

    return count
  }

  async clearAll(): Promise<void> {
    this.assertIndexedDbAvailable()

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)
        const req = store.clear()

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }
}

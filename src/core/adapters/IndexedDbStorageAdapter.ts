import { CR } from '../domain/cr-tables.ts'
import type { Monster } from '../domain/types.ts'
import type { MonsterSummary, StoragePort } from '../ports/StoragePort.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'
import { LocalStorageAdapter } from './LocalStorageAdapter.ts'

export class IndexedDbStorageAdapter implements StoragePort {
  private dbName: string
  private storeName = 'monsters'
  private version = 1
  private fallback: LocalStorageAdapter

  constructor(dbName = 'DndSheetDB') {
    this.dbName = dbName
    this.fallback = new LocalStorageAdapter()
  }

  private isIndexedDbAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    )
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
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.getMonster(id)
    }

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
    } catch {
      return this.fallback.getMonster(id)
    }
  }

  async saveMonster(monster: Monster): Promise<void> {
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.saveMonster(monster)
    }

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
    } catch {
      return this.fallback.saveMonster(monster)
    }
  }

  async listMonsters(): Promise<MonsterSummary[]> {
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.listMonsters()
    }

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
    } catch {
      return this.fallback.listMonsters()
    }
  }

  async deleteMonster(id: string): Promise<void> {
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.deleteMonster(id)
    }

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)
        const req = store.delete(id)

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {
      return this.fallback.deleteMonster(id)
    }
  }

  async exportAll(): Promise<string> {
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.exportAll()
    }

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
    } catch {
      return this.fallback.exportAll()
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
    if (!this.isIndexedDbAvailable()) {
      return this.fallback.clearAll()
    }

    try {
      const db = await this.openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite')
        const store = tx.objectStore(this.storeName)
        const req = store.clear()

        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {
      return this.fallback.clearAll()
    }
  }
}

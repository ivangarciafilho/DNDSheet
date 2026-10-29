import { CR } from '../domain/cr-tables.ts'
import type { Monster } from '../domain/types.ts'
import type { MonsterSummary, StoragePort } from '../ports/StoragePort.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  key(index: number): string | null
  length: number
}

export class MemoryStorageBackend implements StorageBackend {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }
}

export class LocalStorageAdapter implements StoragePort {
  private prefix: string
  private storage: StorageBackend

  constructor(prefix = 'dndsheet_monster_', storage?: StorageBackend) {
    this.prefix = prefix
    if (storage) {
      this.storage = storage
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage
    } else {
      this.storage = new MemoryStorageBackend()
    }
  }

  async getMonster(id: string): Promise<Monster | null> {
    const raw = this.storage.getItem(`${this.prefix}${id}`)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return migrateMonsterSchema(parsed)
    } catch {
      return null
    }
  }

  async saveMonster(monster: Monster): Promise<void> {
    const id = (monster as any).id || (monster as any).name || 'unnamed'
    const payload = {
      ...monster,
      id,
      updatedAt: Date.now(),
    }
    this.storage.setItem(`${this.prefix}${id}`, JSON.stringify(payload))
  }

  async listMonsters(): Promise<MonsterSummary[]> {
    const summaries: MonsterSummary[] = []
    const count = this.storage.length

    for (let i = 0; i < count; i++) {
      const k = this.storage.key(i)
      if (k && k.startsWith(this.prefix)) {
        const raw = this.storage.getItem(k)
        if (raw) {
          try {
            const m = JSON.parse(raw)
            const id = k.substring(this.prefix.length)
            const crObj = CR[m.CR] || { cr: '0', numeric: 0 }
            summaries.push({
              id,
              name: m.nickname || m.name || 'Unnamed Monster',
              cr: crObj.cr,
              numericCr: crObj.numeric,
              type: m.type || 'unknown',
              size: m.size || 'Medium',
              alignment: m.alignment || 'unaligned',
              updatedAt: m.updatedAt || 0,
              format: m.format === '2024' ? '2024' : '2014',
            })
          } catch {
            // ignore corrupted entry
          }
        }
      }
    }

    return summaries.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async deleteMonster(id: string): Promise<void> {
    this.storage.removeItem(`${this.prefix}${id}`)
  }

  async exportAll(): Promise<string> {
    const monsters: Monster[] = []
    const summaries = await this.listMonsters()
    for (const s of summaries) {
      const m = await this.getMonster(s.id)
      if (m) monsters.push(m)
    }
    return JSON.stringify(monsters, null, 2)
  }

  async importAll(jsonString: string): Promise<number> {
    const parsed = JSON.parse(jsonString)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    let importedCount = 0

    for (const item of list) {
      if (item && typeof item === 'object') {
        const migrated = migrateMonsterSchema(item)
        await this.saveMonster(migrated)
        importedCount++
      }
    }

    return importedCount
  }

  async clearAll(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i)
      if (k && k.startsWith(this.prefix)) {
        keysToRemove.push(k)
      }
    }
    for (const k of keysToRemove) {
      this.storage.removeItem(k)
    }
  }
}

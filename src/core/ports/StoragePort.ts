import type { Monster } from '../domain/types.ts'

export interface MonsterSummary {
  id: string
  name: string
  cr: string
  numericCr: number
  type: string
  size: string
  alignment: string
  updatedAt: number
  format: '2014' | '2024'
}

export interface StoragePort {
  getMonster(id: string): Promise<Monster | null>
  saveMonster(monster: Monster): Promise<void>
  listMonsters(): Promise<MonsterSummary[]>
  deleteMonster(id: string): Promise<void>
  exportAll(): Promise<string>
  importAll(jsonString: string): Promise<number>
  clearAll(): Promise<void>
}

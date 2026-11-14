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

export type StorageFailureCode =
  | 'quota_exceeded'
  | 'storage_blocked'
  | 'corrupted_entry'
  | 'io_error'

export type StorageBackendKind = 'indexeddb' | 'localstorage' | 'memory' | 'unavailable'

export class StorageFailureError extends Error {
  readonly code: StorageFailureCode
  readonly causeDetail?: unknown

  constructor(code: StorageFailureCode, message: string, causeDetail?: unknown) {
    super(message)
    this.name = 'StorageFailureError'
    this.code = code
    this.causeDetail = causeDetail
  }
}

export function classifyStorageError(
  error: unknown,
  fallbackCode: StorageFailureCode = 'io_error',
): StorageFailureError {
  if (error instanceof StorageFailureError) return error
  const name = (error as { name?: string })?.name || ''
  const msg = error instanceof Error ? error.message : String(error ?? 'Unknown storage error')
  if (
    /QuotaExceeded/i.test(name) ||
    /NS_ERROR_DOM_QUOTA_REACHED/i.test(name) ||
    /quota/i.test(msg)
  ) {
    return new StorageFailureError('quota_exceeded', msg, error)
  }
  if (
    /SecurityError|InvalidStateError/i.test(name) ||
    /blocked|denied|unavailable|disabled|access/i.test(msg)
  ) {
    return new StorageFailureError('storage_blocked', msg, error)
  }
  if (error instanceof SyntaxError || /JSON|corrupt|parse/i.test(msg)) {
    return new StorageFailureError('corrupted_entry', msg, error)
  }
  return new StorageFailureError(fallbackCode, msg, error)
}

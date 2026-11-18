export interface PayloadInspectionOk {
  ok: true
  record: Record<string, unknown>
  saveVersion: string
  warnings: string[]
}

export interface PayloadInspectionError {
  ok: false
  reason: 'not_object' | 'missing_version' | 'unknown_version'
  saveVersion?: string
}

export type PayloadInspection = PayloadInspectionOk | PayloadInspectionError

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Copies a plain record while stripping prototype-pollution keys at the import boundary. */
export function stripDangerousKeys(raw: unknown): Record<string, unknown> | null {
  if (!isPlainRecord(raw)) return null
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (DANGEROUS_KEYS.has(key)) continue
    out[key] = value
  }
  return out
}

/** Validates envelope shape and schema version before delegating to jsonschema / migration. */
export function inspectMonsterPayload(raw: unknown, knownVersions: readonly string[]): PayloadInspection {
  const clean = stripDangerousKeys(raw)
  if (!clean) return { ok: false, reason: 'not_object' }

  const rawVersion = clean.saveVersion
  if (rawVersion === undefined || rawVersion === null || rawVersion === '') {
    return { ok: false, reason: 'missing_version' }
  }

  const warnings: string[] = []
  if (typeof rawVersion === 'number') {
    warnings.push(`Coerced numeric saveVersion (${rawVersion}) to schema key "${String(rawVersion)}".`)
  }
  const saveVersion = String(rawVersion)
  if (!knownVersions.includes(saveVersion)) {
    return { ok: false, reason: 'unknown_version', saveVersion }
  }

  return { ok: true, record: clean, saveVersion, warnings }
}

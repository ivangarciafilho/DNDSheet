import { lookupNumericField } from './field-types.ts'
import type { NumericFieldDescriptor, NumericFieldGate } from './field-types.ts'
import { NumericFieldPathError, readNumericFieldPath, readOptionalNumericFieldPath } from './field-path.ts'

export interface NumericFieldInspection {
  readonly field: NumericFieldDescriptor
  readonly value: unknown
  readonly editable: boolean
  readonly inactiveGates: readonly string[]
  readonly blockedRepresentation?: string
}

/** Inspect a stored JSON creature. Derived getters and object writes are excluded. */
export function inspectNumericField(model: unknown, path: string): NumericFieldInspection {
  const field = lookupNumericField(path)
  if (!field) throw new Error(`Unsupported numeric field: ${path}`)
  const value = field.optional ? readOptionalNumericFieldPath(model, path) : readNumericFieldPath(model, path)
  const inactiveGates: string[] = []
  if (field.modePolicy === 'pending') inactiveGates.push('Mode ownership review required before binding adoption')
  const matchesGate = (gate: NumericFieldGate): boolean => {
    let actual: unknown
    try { actual = readOptionalNumericFieldPath(model, gate.path) }
    catch (error) {
      if (!(error instanceof NumericFieldPathError) || error.code !== 'missing') throw error
      actual = undefined
    }
    return (!Object.prototype.hasOwnProperty.call(gate, 'equals') || actual === gate.equals) &&
      (!Object.prototype.hasOwnProperty.call(gate, 'notEquals') || actual !== gate.notEquals) &&
      (!gate.oneOf || gate.oneOf.includes(actual as string | number | boolean | null | undefined)) &&
      (gate.present === undefined || gate.present === (actual !== undefined && actual !== null)) &&
      (!gate.anyOf || gate.anyOf.some(matchesGate))
  }
  for (const gate of field.editableWhen) {
    if (!matchesGate(gate)) inactiveGates.push(gate.path)
  }
  const scalarRepresentation = typeof value === 'number' || (value === undefined && field.optional) || (value === null && field.nullable)
  const blockedRepresentation = scalarRepresentation ? undefined : 'Symbolic or nonnumeric authorship requires explicit migration before numeric editing'
  return Object.freeze({ field, value, editable: inactiveGates.length === 0 && scalarRepresentation, inactiveGates: Object.freeze(inactiveGates), ...(blockedRepresentation ? { blockedRepresentation } : {}) })
}

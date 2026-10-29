import type { Monster } from '../domain/types.ts'
import { autoFixMonster } from './LintMonster.ts'
import { migrateMonsterSchema } from './MigrateMonsterSchema.ts'

export interface IngestResult {
  success: boolean
  monster?: Monster
  error?: string
  issuesFixed: number
}

export function extractJsonFromText(text: string): string {
  let cleaned = text.trim()

  // Match ```json ... ``` or ``` ... ```
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const fenceMatch = cleaned.match(fenceRegex)
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim()
  }

  // Find the outermost '{' and '}'
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1)
  }

  return cleaned
}

export function ingestAiStatblock(rawInput: string): IngestResult {
  try {
    const jsonCandidate = extractJsonFromText(rawInput)
    const parsed = JSON.parse(jsonCandidate)

    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        error: 'Parsed content is not a valid JSON object.',
        issuesFixed: 0,
      }
    }

    // 1. Upgrade schema through sequential migrator
    const migrated = migrateMonsterSchema(parsed)

    // 2. Auto-fix any broken multiattacks or dangling references
    const { fixedCount, monster: cleanMonster } = autoFixMonster(migrated)

    return {
      success: true,
      monster: cleanMonster,
      issuesFixed: fixedCount,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Failed to parse AI statblock JSON: ${message}`,
      issuesFixed: 0,
    }
  }
}

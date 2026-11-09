/**
 * DNDSheet - Number & Punctuation Grammar Domain Engine
 *
 * Provides pure utility functions for:
 * - Impeccable punctuation cleanup (removing orphan commas, `.,` or `;,` combinations, duplicate brackets)
 * - Headline Initiative phrasing with Title Case and comma-separated composable riders
 * - Formatted signed modifiers with tabular number alignment
 * - Hit dice and damage formula standard strings (e.g. `13d10 + 39`)
 */

/**
 * Removes double punctuation, orphan commas, and cleans trailing periods before commas.
 * Examples:
 * - "for this casting., 1 SP" -> "for this casting, 1 SP"
 * - "((1/Day)), Level 3:" -> "(1/Day), Level 3:"
 * - "14/+4 Initiative, " -> "14/+4 Initiative"
 */
export function cleanPunctuation(text: string): string {
  if (!text) return ''
  return text
    // Replace period followed by comma with single comma
    .replace(/\.,+/g, ',')
    // Replace semicolon followed by comma with single semicolon
    .replace(/;,+/g, ';')
    // Replace multiple consecutive semicolons with single semicolon
    .replace(/;{2,}/g, ';')
    // Replace multiple consecutive commas with single comma
    .replace(/,{2,}/g, ',')
    // Remove space before punctuation marks: "On Success : " -> "On Success: "
    .replace(/\s+([,:;.?!])/g, '$1')
    // Remove comma immediately preceding opening parenthesis: "AC: 14, (19..." -> "AC: 14 (19..."
    .replace(/,\s*\(/g, ' (')
    // Replace double nested parentheses wrapping the same token: "((1/Day))" -> "(1/Day)"
    .replace(/\(\s*\(([^()]+)\)\s*\)/g, '($1)')
    // Remove comma or semicolon right before closing parenthesis: "(10ft, )" -> "(10ft)"
    .replace(/[,;]\s*\)/g, ')')
    // Remove trailing comma or semicolon at end of string
    .replace(/[,;]\s*$/, '')
    // Normalize spaces around commas
    .replace(/\s*,\s*/g, ', ')
    .trim()
}

/**
 * Formats signed modifiers (+4, -2) with optional Unicode minus glyph (−).
 */
export function formatSignedModifier(num: number, useMinusGlyph = false): string {
  const n = Math.trunc(num)
  if (n >= 0) return `+${n}`
  const minus = useMinusGlyph ? '−' : '-'
  return `${minus}${Math.abs(n)}`
}

/**
 * Formats standard dice formula string: `13d10 + 39` or `1d8 - 2`.
 */
export function formatDiceFormula(count: number, dieSize: number | string, modifier = 0): string {
  const c = Math.max(1, Math.trunc(count))
  const d = String(dieSize).replace(/^d/i, '')
  if (!modifier) return `${c}d${d}`
  const sign = modifier > 0 ? '+' : '-'
  return `${c}d${d} ${sign} ${Math.abs(modifier)}`
}

/**
 * Formats a clean Initiative headline string:
 * `14/+4 Initiative, At Disadvantage, Gains 20 Temporary Hit Points`
 */
export function formatInitiativeHeadline(mod: number, notes: string[] = []): string {
  const score = 10 + mod
  const modSign = mod >= 0 ? '+' : ''
  const base = `${score}/${modSign}${mod} Initiative`
  
  const cleanedNotes = notes
    .map(n => n.trim())
    .filter(Boolean)
    .map(n => {
      // Capitalize first letter of each note if lowercase
      return n.charAt(0).toUpperCase() + n.slice(1)
    })

  if (cleanedNotes.length === 0) return base
  return cleanPunctuation(`${base}, ${cleanedNotes.join(', ')}`)
}

/**
 * Safe ordinal number formatting (1st, 2nd, 3rd, 4th...).
 */
export function formatOrdinal(value: number): string {
  const n = Math.abs(Math.trunc(value))
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

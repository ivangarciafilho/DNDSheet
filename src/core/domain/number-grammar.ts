/**
 * Domain engine: Canonical Number & Punctuation Grammar for 5e Monster Statblocks.
 * Handles modifier signs, dice formulas, composite punctuation cleanup,
 * and distance notation normalizations without mutating authored source models.
 */

/**
 * Standardize signed modifier string (e.g., +4, -2, 0).
 * Optionally uses Unicode minus glyph (−, U+2212) for typographic elegance.
 */
export function formatSignedModifier(num: number | null | undefined, useMinusGlyph = false): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return '+0'
  const intVal = Math.trunc(num)
  if (intVal > 0) return `+${intVal}`
  if (intVal < 0) return useMinusGlyph ? `−${Math.abs(intVal)}` : `${intVal}`
  return '+0'
}

/**
 * Clean composite and orphan punctuation artifacts from generated or user-authored strings.
 * Resolves:
 * - "., " -> ", " (preserving abbreviations like "ft., ")
 * - ";, " -> "; "
 * - Duplicate commas/semicolons
 * - Space preceding colons: "On Success : " -> "On Success: "
 * - Comma preceding opening parenthesis: "AC: 14, (" -> "AC: 14 ("
 * - Period preceding opening parenthesis: "AC: 14. (" -> "AC: 14 ("
 * - Double parentheses: "((1/Day))" -> "(1/Day)"
 * - Trailing punctuation before closing bracket: "(10ft, )" -> "(10ft)"
 */
export function cleanPunctuation(text: string): string {
  if (!text) return ''
  let s = text
    // Remove space before punctuation marks first: "On Success : " -> "On Success: ", "Turn. , " -> "Turn., "
    .replace(/\s+([,:;.])/g, '$1')
    // Replace composite punctuation collisions, preserving "ft.,"
    .replace(/(?<!\bft)\.\s*,/gi, ', ')
    .replace(/(?<!\bft)\.,/gi, ',')
    .replace(/;,/g, ';')
    .replace(/,\./g, '.')
    .replace(/;\./g, '.')
    // Replace consecutive duplicate commas/semicolons
    .replace(/,{2,}/g, ',')
    .replace(/;{2,}/g, ';')
    // Remove comma or period immediately before opening parenthesis (even across closing HTML tags like </strong> or </span>)
    .replace(/([,.])((?:\s*<\/[^>]+>)*\s*\()/g, '$2')
    // Collapse double parentheses: "((1/Day))" -> "(1/Day)"
    .replace(/\(\(\s*([^()]+)\s*\)\)/g, '($1)')
    // Clean trailing punctuation before closing bracket: "(10ft, )" -> "(10ft)"
    .replace(/[,;:]\s*\)/g, ')')
    // Collapse multiple spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  // Remove orphan trailing comma or semicolon
  s = s.replace(/[,;]+$/, '')
  return s
}

/**
 * Normalizes distance notation to standard 5e format (e.g. "10ft", "60ft", "0ft" -> "10 ft.", "60 ft.", "0 ft.")
 */
export function formatDistanceUnit(text: string): string {
  if (!text) return ''
  return text
    // Replace numbers directly attached to ft/feet (e.g. 10ft, 60ft, 0ft, 10 ft) with standard "N ft."
    .replace(/\b(\d+)\s*(?:ft\.?|feet)\b/gi, '$1 ft.')
    // Prevent double dot if already punctuated: "ft.." -> "ft."
    .replace(/\bft\.\.+/gi, 'ft.')
    // Prevent dot before comma or semicolon: "ft., " -> "ft., "
    .replace(/\bft\.\s*([,;])/gi, 'ft.$1')
}

/**
 * Formats distance in imperial feet with standard 5e metric conversion (e.g., 60 ft. -> 60 ft. (18 m))
 */
export function formatMetricDistance(feet: number): string {
  if (!Number.isFinite(feet) || feet < 0) return '0 ft.'
  const meters = Math.round(feet * 0.3)
  return `${feet} ft. (${meters} m)`
}

/**
 * Composite prose sanitizer combining distance unit hygiene and punctuation normalization.
 */
export function sanitizeProsePunctuation(text: string): string {
  if (!text) return ''
  return cleanPunctuation(formatDistanceUnit(text))
}

/**
 * Formats hit dice and modifier expressions into standard spaced formula (e.g., 13d10 + 39).
 */
export function formatDiceFormula(count: number, dieSize: number, modifier?: number): string {
  const safeCount = Math.max(0, Math.trunc(count || 0))
  const safeDie = Math.max(0, Math.trunc(dieSize || 0))
  if (safeCount === 0 || safeDie === 0) return '0'
  const base = `${safeCount}d${safeDie}`
  if (!modifier || !Number.isFinite(modifier) || Math.trunc(modifier) === 0) return base
  const intMod = Math.trunc(modifier)
  return intMod > 0 ? `${base} + ${intMod}` : `${base} - ${Math.abs(intMod)}`
}

/**
 * Formats Title Case initiative headline with capitalized composable riders.
 */
export function formatInitiativeHeadline(mod: number, riders: string[] = []): string {
  const modStr = formatSignedModifier(mod)
  const score = 10 + mod
  const cleanRiders = riders
    .map(r => r ? r.trim() : '')
    .filter(Boolean)
    .map(r => r.charAt(0).toUpperCase() + r.slice(1))

  const parts = [`${score}/${modStr} Initiative`]
  if (cleanRiders.length > 0) {
    parts.push(...cleanRiders)
  }
  return cleanPunctuation(parts.join(', '))
}

/**
 * Formats ordinal number string (1st, 2nd, 3rd, 4th, etc.) safely.
 */
export function formatOrdinal(n: number): string {
  const val = Math.abs(Math.trunc(n))
  const lastTwo = val % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${val}th`
  switch (val % 10) {
    case 1: return `${val}st`
    case 2: return `${val}nd`
    case 3: return `${val}rd`
    default: return `${val}th`
  }
}

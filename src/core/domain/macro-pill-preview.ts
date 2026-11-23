export interface MacroTokenPill {
  token: string
  valid: boolean
}

/**
 * Extracts distinct `{...}` macro tokens from editor text and classifies
 * each against unresolved token diagnostics without altering preview output.
 */
export function extractMacroTokenPills(
  source: string,
  unknownTokens: readonly string[],
): MacroTokenPill[] {
  const matches = source.match(/\{[^{}]+\}/g)
  if (!matches || matches.length === 0) return []
  const unresolvedSet = new Set(unknownTokens.map((t) => t.toLowerCase()))
  const seen = new Set<string>()
  const pills: MacroTokenPill[] = []
  for (const token of matches) {
    if (seen.has(token)) continue
    seen.add(token)
    pills.push({
      token,
      valid: !unresolvedSet.has(token.toLowerCase()),
    })
  }
  return pills
}

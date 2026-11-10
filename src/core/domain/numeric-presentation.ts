/** Formatting belongs to the resolved display, never to the formula grammar. */
export interface NumericPresentation { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean }
export function normalizeNumericPresentation(value: unknown): NumericPresentation {
  if (!value || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>, result: NumericPresentation = {}
  for (const key of ['bold', 'italic', 'underline', 'strike'] as const) if (source[key] === true) result[key] = true
  return result
}
export function formatNumericPresentation(text: string | number, value: unknown): string {
  let output = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const style = normalizeNumericPresentation(value)
  for (const [key, tag] of [['strike', 's'], ['underline', 'u'], ['italic', 'em'], ['bold', 'strong']] as const) if (style[key]) output = `<${tag}>${output}</${tag}>`
  return output
}
/** Only semantic scalar outputs with an active renderer adapter offer presentation controls. */
export function supportsNumericPresentation(path: string, model?: unknown): boolean {
  if (path === 'AC' && model && typeof model === 'object') {
    const config = (model as { acConfig?: Record<string, unknown> }).acConfig
    if (config && (config.enabled === true || ['baseMode','abilityBonus','defenseItem','temporary','conditional','conditionMode'].some(key => config[key] && config[key] !== (key === 'baseMode' ? 'flat' : 'none')))) return false
  }
  return /^(?:AC|HP\.(?:HD|type|modifier)|stats\.(?:STR|DEX|CON|INT|WIS|CHA)|saves\.(?:STR|DEX|CON|INT|WIS|CHA)\.overrideValue|paragonConfig\.poolCount|extendedHp\.(?:bloodiedOverride|damageThreshold|damageReduction|tempHp\.amount|regeneration\.amount))$/.test(path)
    || /^(?:actions|traits|reactions)\[id=[^\]]+\]\.(?:attackBonus|save\.overrideValue|targeting\.(?:count|range\.distance|area\.distance))$/.test(path)
    || /^attacks\[id=[^\]]+\]\.(?:modifier\.overrideValue|targets|range\.(?:reach|standard|long)|(?:damage|alternateDamage)\.(?:count|dice|modifier\.overrideValue)|additionalDamage\[id=[^\]]+\]\.(?:count|dice))$/.test(path)
    || /^speeds\[id=[^\]]+\]\.speed$/.test(path)
    || /^sensesList\[id=[^\]]+\]\.(?:range|observationMinutes)$/.test(path)
    || /^languagesList\[id=[^\]]+\]\.(?:telepathyRange|animalHandling\.dc|undeadConfig\.telepathicRange|deadConfig\.maxQuestions)$/.test(path)
}

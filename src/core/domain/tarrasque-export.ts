import { splitEntryLead } from './export-markup.ts'

const entities: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Tarrasque fields are plain strings. Strip actual renderer markup before decoding
 * entities so authored text such as &lt;table&gt; stays text rather than being discarded. */
export function tarrasqueText(input: string): string {
  return input
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/(?:td|th)\s*>\s*(?=<(?:td|th)\b)/gi, ' | ')
    .replace(/<br\b[^>]*>|<\/?(?:p|div|li)\b[^>]*>|<\/tr\s*>/gi, '\n')
    .replace(/<\/?[a-z][\w:-]*(?:\s[^>]*)?\s*\/?>/gi, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity: string) => {
      if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? whole
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1))
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : whole
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Shared prose supplies the printed lead; source metadata is passed explicitly,
 * never recovered by matching a printed title back to an array entry. */
export function tarrasqueEntry(prose: string, fallbackName = '', attackBonus = 0) {
  const phase = prose.match(/^\s*(<span class="dnd-pool-badge">[\s\S]*?<\/span>)\s*/)
  const { title, body } = splitEntryLead(phase ? prose.slice(phase[0].length) : prose)
  return {
    name: tarrasqueText(title || fallbackName),
    desc: tarrasqueText([phase?.[1], body].filter(Boolean).join(' ')),
    attack_bonus: attackBonus,
  }
}

/** Preserve Tarrasque's existing physical-attack dice contract independently of prose. */
export function tarrasqueDamageDice(attack: { damage: { count: number; dice: number }; additionalDamage: { count: number; dice: number }[] }): string {
  return [attack.damage, ...attack.additionalDamage].map((damage) => `${damage.count}d${damage.dice}`).join('+')
}

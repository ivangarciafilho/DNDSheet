import { v4 as uuidv4 } from 'uuid'
import {
  addParsedActionOrAttack,
  normalizeSize,
  parseCrTier,
  parseHpDice,
  parseSavingThrowsLine,
  parseSensesEntries,
  parseSpeedEntries,
  resolveSkillEntry,
  sanitizeImportText,
  splitCommaList,
  type ImportAbilityCategory,
} from './importer-utils.ts'
import { defaultCrAnnotation, defaultMonster } from './monster-defaults.ts'
import type { DndStat } from './types.ts'
import type { OfflineImportResult } from './foundry-import.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

export function looksLikeHomebreweryMarkdown(text: unknown): boolean {
  if (typeof text !== 'string') return false
  const t = text.trim()
  return (
    t.length > 0 &&
    !/^\{(?![{])/.test(t) &&
    !t.startsWith('[') &&
    (/\{\{monster/i.test(t) ||
      (/^(?:>\s*)*#{1,3}\s+/m.test(t) && /\*\*Armor Class\*\*|\*\*Hit Points\*\*/i.test(t)))
  )
}

function stripMdEmphasis(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
}

function cleanMdLine(line: string): string {
  return line
    .replace(/^\s*(?:>\s*)+/, '')
    .replace(/^-\s+(?=\*\*)/, '')
    .replace(/\r$/, '')
    .trim()
}

function stripKeyPrefix(line: string, key: string): string {
  return line
    .replace(new RegExp(`^\\*\\*${key}\\*\\*\\s*(?:::?\\s*)?`, 'i'), '')
    .replace(new RegExp(`^${key}\\s*[:\\s]+`, 'i'), '')
    .trim()
}

export function importHomebreweryMarkdown(markdown: unknown): OfflineImportResult {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return { ok: false, error: 'Homebrewery Markdown input is empty.' }
  }
  const warnings: string[] = []
  const cleaned = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\{\{monster[^\r\n]*$/gim, '')
    .replace(/^\s*\}\}\s*$/gm, '')
  if (/<script|<iframe|javascript:|on\w+=/i.test(markdown)) {
    warnings.push('Sanitized unsafe markup tokens from Homebrewery snippet.')
  }

  const monster = defaultMonster()
  const lines = cleaned.split('\n').map(cleanMdLine)
  let section: ImportAbilityCategory | 'lair' = 'trait'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line === ':' || line === '::' || line === '___' || line === '---') continue

    const heading = line.match(/^##\s+(.+)/)
    if (heading && monster.name === 'My New Monster') {
      monster.name = sanitizeImportText(heading[1])
      continue
    }

    const typeLine = line.match(/^\*(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([^,*]+)(?:,\s*([^*]+))?\*$/i)
    if (typeLine) {
      monster.size = normalizeSize(typeLine[1])
      monster.type = sanitizeImportText(typeLine[2])
      if (typeLine[3]) monster.alignment = sanitizeImportText(typeLine[3])
      continue
    }

    if (/^\*\*Armor Class\*\*/i.test(line)) {
      const rest = sanitizeImportText(stripKeyPrefix(line, 'Armor Class'))
      const m = rest.match(/^(\d+)(?:\s*\(([^)]+)\))?/)
      if (m) {
        monster.AC = parseInt(m[1], 10)
        if (m[2]) monster.ACType = m[2].trim()
      }
      continue
    }

    if (/^\*\*Hit Points\*\*/i.test(line)) {
      const rest = sanitizeImportText(stripKeyPrefix(line, 'Hit Points'))
      const m = rest.match(/^(\d+)(?:\s*\(([^)]+)\))?/)
      if (m) monster.HP = parseHpDice(m[2], parseInt(m[1], 10))
      continue
    }

    if (/^\*\*Speed\*\*/i.test(line)) {
      const rest = sanitizeImportText(stripKeyPrefix(line, 'Speed'))
      monster.speeds = parseSpeedEntries(rest.split(','))
      continue
    }

    const statCells = [...line.matchAll(/\|\s*(\d+)\s*\([+-]?\d+\)\s*/g)]
    if (statCells.length === 6) {
      const stats: DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
      stats.forEach((stat, idx) => {
        monster.stats[stat] = Math.max(1, Math.min(30, parseInt(statCells[idx][1], 10)))
      })
      continue
    }

    if (/^\*\*Saving Throws\*\*/i.test(line)) {
      parseSavingThrowsLine(monster, sanitizeImportText(stripKeyPrefix(line, 'Saving Throws')))
      continue
    }

    if (/^\*\*Skills\*\*/i.test(line)) {
      for (const part of splitCommaList(stripKeyPrefix(line, 'Skills'))) {
        const m = part.match(/^([A-Za-z\s]+)\s*([+-]\d+)$/)
        const sk = m ? resolveSkillEntry(m[1], parseInt(m[2], 10)) : resolveSkillEntry(part)
        if (sk) monster.skills.push(sk)
      }
      continue
    }

    if (/^\*\*Damage Vulnerabilities\*\*/i.test(line)) {
      monster.vulnerabilities = splitCommaList(stripKeyPrefix(line, 'Damage Vulnerabilities'))
      continue
    }
    if (/^\*\*Damage Resistances\*\*/i.test(line)) {
      monster.resistances = splitCommaList(stripKeyPrefix(line, 'Damage Resistances'))
      continue
    }
    if (/^\*\*Damage Immunities\*\*/i.test(line)) {
      monster.immunities = splitCommaList(stripKeyPrefix(line, 'Damage Immunities'))
      continue
    }
    if (/^\*\*Condition Immunities\*\*/i.test(line)) {
      monster.conditions = splitCommaList(stripKeyPrefix(line, 'Condition Immunities'))
      continue
    }
    if (/^\*\*Senses\*\*/i.test(line)) {
      parseSensesEntries(monster, splitCommaList(stripKeyPrefix(line, 'Senses')))
      continue
    }
    if (/^\*\*Languages\*\*/i.test(line)) {
      monster.languages = sanitizeImportText(stripKeyPrefix(line, 'Languages'))
      continue
    }
    if (/^\*\*Challenge\*\*/i.test(line)) {
      const crTier = parseCrTier(sanitizeImportText(stripKeyPrefix(line, 'Challenge')))
      monster.CR = crTier.index
      monster.proficiency = crTier.proficiency
      continue
    }

    const secMatch = line.match(/^###\s+(.+)/)
    if (secMatch) {
      const h = secMatch[1].trim().toLowerCase()
      if (h.includes('bonus')) section = 'bonus'
      else if (h.includes('reaction')) section = 'reaction'
      else if (h.includes('legendary')) section = 'legendary'
      else if (h.includes('mythic')) section = 'mythic'
      else if (h.includes('lair')) section = 'lair'
      else section = 'action'
      continue
    }

    const entry = line.match(/^\*\*\*([^*]+?)\.?\*\*\*\s*(.*)$/)
    if (entry) {
      const descParts = [entry[2].trim()]
      while (i + 1 < lines.length) {
        const peek = lines[i + 1]
        if (
          peek === '::' ||
          peek === '___' ||
          peek === '---' ||
          peek.startsWith('###') ||
          peek.startsWith('***') ||
          /^\*\*[A-Z]/.test(peek)
        ) {
          break
        }
        i++
        if (!peek || peek === ':') continue
        descParts.push(peek)
      }
      const fullDesc = stripMdEmphasis(sanitizeImportText(descParts.filter(Boolean).join(' ')))
      if (section === 'lair') {
        monster.lairActions.push({ id: uuidv4(), description: fullDesc, crAnnotation: defaultCrAnnotation() })
      } else {
        addParsedActionOrAttack(monster, entry[1], fullDesc, section)
      }
    }
  }

  return { ok: true, source: 'homebrewery', monster: migrateMonsterSchema(monster), warnings }
}

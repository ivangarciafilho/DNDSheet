import { characterVitals, characterVitalText } from '../domain/character-truth.ts'
import { CR } from '../domain/cr-tables.ts'
import { avgHP, renderBonus, renderModifier, statModifier } from '../domain/math-utils.ts'
import type { Monster, CharacterActor, DndStat } from '../domain/types.ts'
import { DND_SKILLS } from '../domain/types.ts'
import { formatLanguagesList } from '../domain/defense-and-traits-utils.ts'
import { buildCastingProjection } from '../domain/casting-projection.ts'
import { innateCastingContext, resolveCastingAbility } from '../domain/casting-ability.ts'
import { ordinalLabel } from '../domain/spell-plate.ts'
import { getSpellMetadata } from '../domain/spell-metadata.ts'
import { mechanicPlainText } from '../domain/mechanic-rich-text.ts'
import { computeSkillGroupLayout, mergeIdenticalEntries, normalizeSkillKey, passiveConfigKey, SKILL_ACTION_GROUPS, type SkillActionType, type SkillCheckInput, type SkillGroupRow } from '../domain/skill-action-groups.ts'
import { type SpellcastingPlacement } from '../domain/export-contract.ts'
import { hasCastingSources, castingLearningSummary } from './AutoSyncSpellcasting.ts'
import { resolveCharacterFields, resolveMonsterText } from './ResolveMonsterText.ts'
import type { DndSpell } from '../domain/types.ts'
export * from './export-markdown.ts'
import { markdownOf } from './export-markdown.ts'
export * from './export-html.ts'

export interface ExportRenderOptions {
  spellcastingPlacement?: SpellcastingPlacement
  embedGrammarCss?: boolean
  spells?: Record<string, DndSpell>
}

const ABILITY_FULL_NAMES: Record<string, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
}

const RATE_LABELS: Record<string, string> = {
  AT_WILL: 'At will',
  DAY: 'day',
  LONG_REST: 'Long Rest',
  SHORT_REST: 'Short Rest',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
}

const SKILL_DEF_BY_KEY = new Map<string, { name: string; stat: DndStat }>(
  DND_SKILLS.map((s) => [normalizeSkillKey(s.name), s]),
)
SKILL_DEF_BY_KEY.set('SLIGHT_OF_HAND', { name: 'Sleight of Hand', stat: 'DEX' })

function skillDisplayLabel(key: string, fallback?: string): string {
  const norm = normalizeSkillKey(key)
  return SKILL_DEF_BY_KEY.get(norm)?.name || fallback || key
}

function skillStatOf(key: string): DndStat {
  return SKILL_DEF_BY_KEY.get(normalizeSkillKey(key))?.stat || 'INT'
}

function escapeExportHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function collectCombatCheckRows(monster: Monster): SkillGroupRow[] {
  const aop = monster.actionOrientedPassives as Record<string, unknown> | undefined
  const monsterRecord = monster as unknown as Record<string, unknown>
  const editorPassives = monsterRecord.passives as Record<string, Record<string, unknown>> | undefined
  const passiveCfg = (key: string) => {
    const cfgKey = passiveConfigKey(key)
    return editorPassives?.[cfgKey] ?? editorPassives?.[cfgKey.toLowerCase()]
  }
  const sharedCondition = (key: string): string => {
    const cfgKey = passiveConfigKey(key)
    const condMap = aop?.conditions as Record<string, unknown> | undefined
    const raw = condMap?.[cfgKey] ?? condMap?.[cfgKey.toLowerCase()]
    return typeof raw === 'string' ? raw.trim() : ''
  }

  const inputs: SkillCheckInput[] = []
  const seen = new Set<string>()
  for (const sk of monster.skills || []) {
    const key = normalizeSkillKey(sk.key)
    if (!key || key === 'INITIATIVE' || seen.has(key)) continue
    seen.add(key)
    const cfg = passiveCfg(key)
    const stat = (sk.skill?.stat as DndStat) || skillStatOf(key)
    const bonus = sk.override
      ? sk.overrideValue
      : statModifier(monster.stats?.[stat] ?? 10) +
        (sk.expertise ? monster.proficiency * 2 : sk.proficient ? monster.proficiency : 0)
    const ppOverride = key === 'PERCEPTION' && monster.passivePerception?.override
      ? Number(monster.passivePerception.overrideValue)
      : null
    inputs.push({
      key,
      label: skillDisplayLabel(key, sk.skill?.label),
      stat,
      bonus,
      advantage: Boolean(sk.advantage || cfg?.advantage),
      disadvantage: Boolean(sk.disadvantage || cfg?.disadvantage),
      condition: sk.condition?.trim() || sk.conditional?.trim() || String(cfg?.condition || '').trim() || sharedCondition(key),
      bonusAction: typeof sk.bonusAction === 'boolean' ? sk.bonusAction : undefined,
      passiveOverride: cfg?.override && cfg.overrideValue != null ? Number(cfg.overrideValue) : ppOverride,
    })
  }

  for (const group of SKILL_ACTION_GROUPS) {
    for (const key of group.skills) {
      if (seen.has(key)) continue
      seen.add(key)
      const cfg = passiveCfg(key)
      const stat = skillStatOf(key)
      const ppOverride = key === 'PERCEPTION' && monster.passivePerception?.override
        ? Number(monster.passivePerception.overrideValue)
        : null
      inputs.push({
        key,
        label: skillDisplayLabel(key),
        stat,
        bonus: statModifier(monster.stats?.[stat] ?? 10),
        advantage: Boolean(cfg?.advantage),
        disadvantage: Boolean(cfg?.disadvantage),
        condition: String(cfg?.condition || '').trim() || sharedCondition(key),
        passiveOverride: cfg?.override && cfg.overrideValue != null ? Number(cfg.overrideValue) : ppOverride,
      })
    }
  }

  const groupType = (flag: unknown, editorType: unknown): SkillActionType =>
    flag || editorType === 'Bonus Action' ? 'Bonus Action' : 'Action'

  return computeSkillGroupLayout({
    stats: monster.stats,
    skills: inputs,
    groupActionTypes: {
      search: groupType(aop?.bonusActionSearch, editorPassives?.searchActionType),
      study: groupType(aop?.bonusActionStudy, editorPassives?.studyActionType),
      influence: groupType(aop?.bonusActionInfluence, editorPassives?.influenceActionType),
      hide: groupType(aop?.bonusActionHide, editorPassives?.hideActionType),
    },
  })
}

export function formatSkillGroupScores(row: SkillGroupRow): string {
  const groups = mergeIdenticalEntries(row.entries).map(({ entry, labels }) => {
    const modeTag = entry.advantage ? ' (Advantage)' : entry.disadvantage ? ' (Disadvantage)' : ''
    const condTag = entry.condition ? ` (${entry.condition})` : ''
    return {
      passive: entry.passive,
      bonus: entry.bonus,
      text: `${entry.passive}/${renderBonus(entry.bonus)}, ${labels.join(', ')}${modeTag}${condTag}`,
    }
  })
  if (row.base && row.baseSkillKeys?.length) {
    const labels = row.baseSkillKeys.map((k) => skillDisplayLabel(k))
    groups.push({
      passive: row.base.passive,
      bonus: row.base.bonus,
      text: `${row.base.passive}/${renderBonus(row.base.bonus)}, ${labels.join(', ')}`,
    })
  }
  return groups
    .sort((a, b) => a.passive - b.passive || a.bonus - b.bonus)
    .map((g) => `(${g.text})`)
    .join(', ')
}

export function hasAnySpellcastingContent(monster: Monster): boolean {
  const atWillHas = (monster.spellcasting?.atWill || []).some((g) => (g.spells?.length || 0) > 0)
  return Boolean(atWillHas || hasCastingSources(monster.spellcasting))
}

function buildExportClassPlate(
  monster: Monster,
  style: '2014' | '2024',
  spells?: Record<string, DndSpell>,
) {
  const sc = monster.spellcasting
  const ability = resolveCastingAbility(sc, monster.stats, monster.proficiency)
  const plate = buildCastingProjection(sc, {
    stats: monster.stats,
    proficiency: monster.proficiency,
    save: ability.save,
    attack: renderBonus(ability.attack),
    edition: style,
    spellLevel: (name) => spells?.[name]?.level ?? getSpellMetadata(name).level,
  })
  const summary = castingLearningSummary(sc, monster.stats, monster.proficiency)
  const casterLevel = summary.casterLevel || sc.level || 1
  const statFull = ABILITY_FULL_NAMES[sc.stat || 'INT'] || sc.stat || 'Intelligence'
  const monsterName = monster.nickname || monster.name || 'This creature'
  const details = [plate.resource, plate.prepared, plate.consolidatedSummary].filter(Boolean)
  const preambleText = sc.useCustomClassPreamble && sc.customClassPreamble?.trim()
    ? mechanicPlainText(sc.customClassPreamble)
    : `${monsterName} is a ${ordinalLabel(casterLevel).toLowerCase()}-level spellcaster. Its spellcasting ability is ${statFull} (spell save DC ${plate.save}, ${plate.attack} to hit with spell attacks).${details.length ? ' ' + details.join('. ') + '.' : ''}`
  const rows = sc.splitHighCadence
    ? [false, true].flatMap((restricted) =>
        plate.levels
          .map((row) => ({
            ...row,
            heading: restricted ? `Restricted ${row.heading}` : row.heading,
            spells: row.spells.filter((s) => Boolean(s.restricted) === restricted),
          }))
          .filter((row) => row.spells.length > 0),
      )
    : plate.levels
  return { plate, preambleText, rows }
}

export function renderSpellcastingMarkdown(
  monster: Monster,
  style: '2014' | '2024',
  spells?: Record<string, DndSpell>,
): string[] {
  const out: string[] = []
  const sc = monster.spellcasting
  const monsterName = monster.nickname || monster.name || 'This creature'
  const atWillGroups = (sc?.atWill || []).filter((g) => (g.spells?.length || 0) > 0)

  if (atWillGroups.length > 0) {
    const innateCtx = innateCastingContext(sc)
    const innateAbility = resolveCastingAbility(innateCtx, monster.stats, monster.proficiency)
    const statFull = ABILITY_FULL_NAMES[innateCtx.stat || 'INT'] || innateCtx.stat || 'Charisma'
    const label = style === '2014' ? 'Innate Spellcasting' : 'Spellcasting (Innate)'
    const notes = sc.atWillNotes?.trim() ? ` ${mechanicPlainText(sc.atWillNotes)}` : ''
    const preamble = sc.useCustomInnatePreamble && sc.customInnatePreamble?.trim()
      ? mechanicPlainText(sc.customInnatePreamble)
      : `${monsterName}'s ${style === '2014' ? 'innate ' : ''}spellcasting ability is ${statFull} (spell save DC ${innateAbility.save}, ${renderBonus(innateAbility.attack)} to hit with spell attacks).${notes} It can cast the following spells, requiring no material components:`
    out.push(`***${label}.*** ${preamble}`)
    for (const g of atWillGroups) {
      const rateLabel = g.rate === 'AT_WILL' ? 'At will' : `${g.count}/${RATE_LABELS[g.rate] || g.rate}`
      out.push(`**${rateLabel}:** *${g.spells.join(', ')}*`)
    }
    out.push('')
  }

  if (hasCastingSources(sc)) {
    const { plate, preambleText, rows } = buildExportClassPlate(monster, style, spells)
    if (rows.length > 0 || plate.resource || plate.metamagic) {
      out.push(`***Spellcasting.*** ${preambleText}`)
      if (plate.metamagic) {
        const optText = plate.metamagic.options.length > 0
          ? `: ${plate.metamagic.options.map((o) => `${o.name}${o.cost ? ` (${o.cost})` : ''}`).join(', ')}`
          : ''
        out.push(`**Sorcery Points** ${plate.metamagic.points} (regained on ${plate.metamagic.refresh})${optText}`)
      }
      for (const row of rows) {
        const spellList = row.spells
          .map((s) => `${s.lead}${s.name}${s.castingTime ? ` (${s.castingTime})` : ''}${s.actionLabel ? ` ${s.actionLabel}` : ''}`)
          .join(', ')
        out.push(`**${row.heading}** *${spellList}*`)
      }
      out.push('')
    }
  }

  return out
}

export function renderSpellcastingHtmlPlates(
  monster: Monster,
  style: '2014' | '2024',
  spells?: Record<string, DndSpell>,
): string {
  const blocks: string[] = []
  const sc = monster.spellcasting
  const atWillGroups = (sc?.atWill || []).filter((g) => (g.spells?.length || 0) > 0)

  if (atWillGroups.length > 0) {
    const innateCtx = innateCastingContext(sc)
    const innateAbility = resolveCastingAbility(innateCtx, monster.stats, monster.proficiency)
    const notes = sc.atWillNotes?.trim() ? `<div class="sb-body sb-striped">${escapeExportHtml(mechanicPlainText(sc.atWillNotes))}</div>` : ''
    const rowsHtml = atWillGroups.map((g, idx) => {
      const rateLabel = g.rate === 'AT_WILL' ? 'At will' : `${g.count}/${RATE_LABELS[g.rate] || g.rate}`
      const striped = idx % 2 === 1 ? ' sb-striped' : ''
      return `<div class="sb-row${striped}"><div class="sb-cell sb-head">${escapeExportHtml(rateLabel)}:</div><div class="sb-cell sb-grow"><em>${escapeExportHtml(g.spells.join(', '))}</em></div></div>`
    }).join('')
    blocks.push(
      '<div class="innate-spellcasting sb-plate">' +
      `<div class="sb-row"><div class="sb-cell sb-head">Innate Spellcasting <span class="sb-qual">(${escapeExportHtml(innateCtx.stat || 'INT')})</span></div>` +
      `<div class="sb-cell">Spell Save DC <span class="dnd-num">${innateAbility.save}</span></div>` +
      `<div class="sb-cell">Spell Attack <span class="dnd-num">${escapeExportHtml(renderBonus(innateAbility.attack))}</span></div></div>` +
      `${notes}${rowsHtml}</div>`,
    )
  }

  if (hasCastingSources(sc)) {
    const { plate, rows } = buildExportClassPlate(monster, style, spells)
    if (rows.length > 0 || plate.resource || plate.metamagic) {
      const resText = [plate.resource, plate.prepared].filter(Boolean).join('. ')
      const resourceRow = resText
        ? `<div class="sb-row sb-striped"><div class="sb-cell sb-grow">${escapeExportHtml(resText)}.</div></div>`
        : ''
      const metaRow = plate.metamagic
        ? `<div class="sb-row"><div class="sb-cell sb-grow"><span class="dnd-num">${plate.metamagic.points}</span> Sorcery Points, regained on <em>${escapeExportHtml(plate.metamagic.refresh)}</em>.${plate.metamagic.options.map((o) => ` <strong>${escapeExportHtml(o.cost)}</strong> ${escapeExportHtml(o.effect || o.name)}`).join('')}</div></div>`
        : ''
      const levelRows = rows.map((row, idx) => {
        const striped = idx % 2 === 1 ? ' sb-striped' : ''
        const spellList = row.spells
          .map((s) => `${escapeExportHtml(s.lead)}<em>${escapeExportHtml(s.name)}</em>${s.castingTime ? ` (${escapeExportHtml(s.castingTime)})` : ''}${s.actionLabel ? ` ${escapeExportHtml(s.actionLabel)}` : ''}`)
          .join(', ')
        return `<div class="sb-row${striped}"><div class="sb-cell sb-head">${escapeExportHtml(row.heading)}</div><div class="sb-cell sb-grow">${spellList}</div></div>`
      }).join('')
      blocks.push(
        '<div class="class-spellcasting sb-plate">' +
        `<div class="sb-row"><div class="sb-cell sb-head">${escapeExportHtml(plate.title)} <span class="sb-qual">(${escapeExportHtml(plate.stat)})</span></div>` +
        `<div class="sb-cell sb-grow">Spell Save DC <span class="dnd-num">${escapeExportHtml(plate.save)}</span> · Spell Attack <span class="dnd-num">${escapeExportHtml(plate.attack)}</span></div></div>` +
        `${resourceRow}${metaRow}${levelRows}</div>`,
      )
    }
  }

  return blocks.join('\n')
}

// Printed exports resolve authored formulas and macros field by field; JSON save formats stay raw.
export function exportToMarkdown(
  monster: Monster,
  style: '2014' | '2024' = '2014',
  options: ExportRenderOptions = {},
): string {
  return markdownOf(resolveMonsterText(monster), style, options)
}

export function exportToPlainText(
  monster: Monster,
  style: '2014' | '2024' = '2014',
  options: ExportRenderOptions = {},
): string {
  const md = exportToMarkdown(monster, style, options)
  return md
    .replace(/^___$/gm, '----------------------------------------')
    .replace(/^#### /gm, '')
    .replace(/^### /gm, '\n=== ')
    .replace(/^## /gm, '')
    .replace(/\*\*\*(.*?)\.\*\*\*/g, '$1.')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
}

export function exportToFoundryActor(monster: Monster): Record<string, unknown> {
  return foundryActorOf(resolveMonsterText(monster))
}

function foundryActorOf(monster: Monster): Record<string, unknown> {
  const crObj = CR[monster.CR] || { cr: '0', numeric: 0 }
  const hpVal = avgHP(monster.HP)

  const items = [
    ...(monster.attacks || []).map((atk) => ({
      name: atk.name,
      type: 'weapon',
      system: {
        damage: {
          parts: [[`${atk.damage.count}d${atk.damage.dice}+@mod`, atk.damage.type]],
        },
        range: { value: atk.range.standard, long: atk.range.long, units: 'ft' },
      },
    })),
    ...(monster.traits || []).map((t) => ({
      name: t.name,
      type: 'feat',
      system: {
        description: { value: t.description },
      },
    })),
  ]

  return {
    name: monster.nickname || monster.name,
    type: 'npc',
    img: monster.portrait?.url || 'icons/svg/mystery-man.svg',
    system: {
      abilities: {
        str: { value: monster.stats.STR, mod: statModifier(monster.stats.STR) },
        dex: { value: monster.stats.DEX, mod: statModifier(monster.stats.DEX) },
        con: { value: monster.stats.CON, mod: statModifier(monster.stats.CON) },
        int: { value: monster.stats.INT, mod: statModifier(monster.stats.INT) },
        wis: { value: monster.stats.WIS, mod: statModifier(monster.stats.WIS) },
        cha: { value: monster.stats.CHA, mod: statModifier(monster.stats.CHA) },
      },
      attributes: {
        ac: { value: monster.AC },
        hp: { value: hpVal, max: hpVal, formula: `${monster.HP.HD}d${monster.HP.type}+${monster.HP.modifier}` },
        movement: {
          walk: (monster.speeds || []).find((s) => !s.type || s.type === 'walk')?.speed || 30,
        },
      },
      details: {
        cr: crObj.numeric,
        alignment: monster.alignment,
        type: { value: monster.type },
        biography: { value: monster.inventory || '' },
      },
      traits: {
        size: monster.size.toLowerCase().substring(0, 3),
        dr: { value: monster.resistances || [] },
        di: { value: monster.immunities || [] },
        dv: { value: monster.vulnerabilities || [] },
        ci: { value: monster.conditions || [] },
        languages: {
          value: Array.isArray(monster.languagesList) && monster.languagesList.length > 0
            ? formatLanguagesList(monster.languagesList)
            : monster.languages || '',
        },
      },
    },
    items,
  }
}

export function exportToFoundryJson(monster: Monster): string {
  return JSON.stringify(exportToFoundryActor(monster), null, 2)
}

export function exportCharacterToMarkdown(char: CharacterActor): string {
  return characterMarkdownOf(resolveCharacterFields(char))
}

function characterMarkdownOf(char: CharacterActor): string {
  const lines: string[] = []
  lines.push('___')
  lines.push(`## ${char.name}`)
  lines.push(`*Level ${char.level} ${char.subclass ? char.subclass + ' ' : ''}${char.class} (${char.race}) • ${char.background} • ${char.alignment}*`)
  lines.push('___')
  const vitals = characterVitals(char)
  lines.push(`**Armor Class** ${characterVitalText(vitals.armorClass)}`)
  lines.push(`**Hit Points** ${char.hp.current} / ${char.hp.max}${char.hp.temp > 0 ? ` (+${char.hp.temp} temp)` : ''}`)
  lines.push(`**Speed** ${characterVitalText(vitals.speed, ' ft.')}`)
  lines.push(`**Proficiency Bonus** +${char.proficiency}`)
  lines.push('___')

  // Stats Table
  lines.push('|STR|DEX|CON|INT|WIS|CHA|')
  lines.push('|:---:|:---:|:---:|:---:|:---:|:---:|')
  lines.push(
    `|${char.stats.STR} (${renderModifier(char.stats.STR)})|${char.stats.DEX} (${renderModifier(
      char.stats.DEX
    )})|${char.stats.CON} (${renderModifier(char.stats.CON)})|${char.stats.INT} (${renderModifier(
      char.stats.INT
    )})|${char.stats.WIS} (${renderModifier(char.stats.WIS)})|${char.stats.CHA} (${renderModifier(
      char.stats.CHA
    )})|`
  )
  lines.push('___')
  lines.push(`**Hit Dice** ${char.hitDice.total - char.hitDice.spent} / ${char.hitDice.total}d${char.hitDice.die}`)
  lines.push(`**Passive Perception** ${10 + statModifier(char.stats.WIS)}`)

  if (char.savingThrows) {
    const saves = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as DndStat[])
      .filter((stat) => char.savingThrows?.[stat])
      .map((stat) => `${stat} ${renderModifier(statModifier(char.stats[stat]) + char.proficiency)}`)
    if (saves.length > 0) {
      lines.push(`**Saving Throws** ${saves.join(', ')}`)
    }
  }

  if (char.skills) {
    const skillList = Object.entries(char.skills)
      .filter(([, s]) => s.proficient)
      .map(([name, s]) => {
        const skillDef = DND_SKILLS.find((sk) => sk.name === name)
        const stat = skillDef ? skillDef.stat : 'STR'
        const bonus = statModifier(char.stats[stat]) + char.proficiency + (s.expertise ? char.proficiency : 0)
        return `${name} ${renderModifier(bonus)}`
      })
    if (skillList.length > 0) {
      lines.push(`**Skills** ${skillList.join(', ')}`)
    }
  }

  if (char.spellcasting && char.spellcasting.ability) {
    const ability = char.spellcasting.ability
    const saveDc = 8 + char.proficiency + statModifier(char.stats[ability])
    const attackBonus = renderModifier(char.proficiency + statModifier(char.stats[ability]))
    lines.push(`**Spellcasting** Ability: ${ability}, Spell Save DC: ${saveDc}, Spell Attack: ${attackBonus}`)
  }

  if (char.spells && char.spells.length > 0) {
    lines.push('### Prepared Spells')
    for (const sp of char.spells) {
      const lvlStr = sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`
      lines.push(`- **${sp.name}** (${lvlStr})${sp.prepared ? ' [Prepared]' : ''}${sp.notes ? ` — ${sp.notes}` : ''}`)
    }
  }

  if (char.features && char.features.length > 0) {
    lines.push('### Features & Traits')
    for (const f of char.features) {
      lines.push(`***${f.name} (${f.source}).*** ${f.description}`)
    }
  }

  if (char.inventory && char.inventory.length > 0) {
    lines.push('### Inventory & Equipment')
    for (const item of char.inventory) {
      lines.push(`- **${item.name}** (Qty: ${item.quantity}, Weight: ${item.weight * item.quantity} lb)`)
    }
  }

  return lines.join('\n')
}

export function exportCharacterToPlainText(char: CharacterActor): string {
  return characterPlainTextOf(resolveCharacterFields(char))
}

function characterPlainTextOf(char: CharacterActor): string {
  const lines: string[] = []
  lines.push(char.name.toUpperCase())
  lines.push(`Level ${char.level} ${char.subclass ? char.subclass + ' ' : ''}${char.class} (${char.race}) • ${char.background} • ${char.alignment}`)
  lines.push('----------------------------------------')
  const vitals = characterVitals(char)
  lines.push(`Armor Class: ${characterVitalText(vitals.armorClass)}`)
  lines.push(`Hit Points: ${char.hp.current} / ${char.hp.max}${char.hp.temp > 0 ? ` (+${char.hp.temp} temp)` : ''}`)
  lines.push(`Speed: ${characterVitalText(vitals.speed, ' ft.')}`)
  lines.push(`Proficiency Bonus: +${char.proficiency}`)
  lines.push('----------------------------------------')
  lines.push(
    `STR ${char.stats.STR} (${renderModifier(char.stats.STR)}) | DEX ${char.stats.DEX} (${renderModifier(
      char.stats.DEX
    )}) | CON ${char.stats.CON} (${renderModifier(char.stats.CON)}) | INT ${char.stats.INT} (${renderModifier(
      char.stats.INT
    )}) | WIS ${char.stats.WIS} (${renderModifier(char.stats.WIS)}) | CHA ${char.stats.CHA} (${renderModifier(
      char.stats.CHA
    )})`
  )
  lines.push('----------------------------------------')
  lines.push(`Hit Dice: ${char.hitDice.total - char.hitDice.spent} / ${char.hitDice.total}d${char.hitDice.die}`)
  lines.push(`Passive Perception: ${10 + statModifier(char.stats.WIS)}`)

  if (char.savingThrows) {
    const saves = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as DndStat[])
      .filter((stat) => char.savingThrows?.[stat])
      .map((stat) => `${stat} ${renderModifier(statModifier(char.stats[stat]) + char.proficiency)}`)
    if (saves.length > 0) {
      lines.push(`Saving Throws: ${saves.join(', ')}`)
    }
  }

  if (char.skills) {
    const skillList = Object.entries(char.skills)
      .filter(([, s]) => s.proficient)
      .map(([name, s]) => {
        const skillDef = DND_SKILLS.find((sk) => sk.name === name)
        const stat = skillDef ? skillDef.stat : 'STR'
        const bonus = statModifier(char.stats[stat]) + char.proficiency + (s.expertise ? char.proficiency : 0)
        return `${name} ${renderModifier(bonus)}`
      })
    if (skillList.length > 0) {
      lines.push(`Skills: ${skillList.join(', ')}`)
    }
  }

  if (char.spellcasting && char.spellcasting.ability) {
    const ability = char.spellcasting.ability
    const saveDc = 8 + char.proficiency + statModifier(char.stats[ability])
    const attackBonus = renderModifier(char.proficiency + statModifier(char.stats[ability]))
    lines.push(`Spellcasting: Ability ${ability} | Spell Save DC ${saveDc} | Spell Attack ${attackBonus}`)
  }

  if (char.spells && char.spells.length > 0) {
    lines.push('PREPARED SPELLS:')
    for (const sp of char.spells) {
      const lvlStr = sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`
      lines.push(`- ${sp.name} (${lvlStr})${sp.prepared ? ' [Prepared]' : ''}${sp.notes ? ` - ${sp.notes}` : ''}`)
    }
  }

  if (char.features && char.features.length > 0) {
    lines.push('FEATURES & TRAITS:')
    for (const f of char.features) {
      lines.push(`${f.name} (${f.source}): ${f.description}`)
    }
  }

  if (char.inventory && char.inventory.length > 0) {
    lines.push('INVENTORY:')
    for (const item of char.inventory) {
      lines.push(`- ${item.name} (x${item.quantity}) [${item.weight * item.quantity} lb]`)
    }
  }

  return lines.join('\n')
}

export function exportCharacterToJson(char: CharacterActor): string {
  return JSON.stringify(char, null, 2)
}

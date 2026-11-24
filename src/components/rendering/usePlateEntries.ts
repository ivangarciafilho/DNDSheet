import { formatReactionAvailability } from 'src/core/domain/entry-display'
import { formatNumericPresentation } from 'src/core/domain/numeric-presentation'
import { sanitizeProsePunctuation } from 'src/core/domain/number-grammar'
import { outcomesHtml } from 'src/core/domain/outcome-rendering'
import { structuredAttackBonus } from 'src/core/domain/structured-attack'
import { formatLimitedUses } from 'src/core/domain/cadence'
import { actionRecharge } from 'src/core/domain/action-usage'
import { useMonsterStore } from 'src/stores/monster-store'
import { Monster, MonsterAction } from '../models'
import { saveForAction } from './mathRendering'
import { boldNumbers, phaseLabel, plateHtml } from './plate'
import type { PlateCell, PlateRow } from './plate'
import { statblockUsageHelpKey } from './statblock-help'
import { formulaContextForMonster } from 'src/core/domain/formula-context'
import { abilityHeader, inferAbility, mechanicsPhrase, scopePhrase, text2024 } from 'src/core/domain/ability-grammar'
import type { Monster as DomainMonster } from 'src/core/domain/types'
import type { ReactionAvailabilitySet } from 'src/core/domain/types'
import type { PlateEntrySpec, MonsterContext, MonsterContextType } from './useProcessTokens'
import type { descriptionContainersHtml } from 'src/core/domain/description-containers'

// Modern Modular plate construction shared by every entry kind, split from useProcessTokens.
export interface CreatePlateEntryHelpersDeps {
  webProjection: boolean
  processMonsterTokens: (input: string, monster: ReturnType<typeof useMonsterStore> | Monster) => string
  processTokens: (input: string, context: MonsterContext, monster: ReturnType<typeof useMonsterStore>, contextType: MonsterContextType) => string
  formatDescriptionContainers: typeof descriptionContainersHtml
}

export function createPlateEntryHelpers({ webProjection, processMonsterTokens, processTokens, formatDescriptionContainers }: CreatePlateEntryHelpersDeps) {
  /**
   * Header cell = | Phase · Usage · Discipline · NAME (components) duration |
   * then | mechanics | scope | extra | data cells, then the body.
   */
  const buildPlateEntry = (
    monster: ReturnType<typeof useMonsterStore>,
    spec: PlateEntrySpec,
    body: string
  ): string => {
    const quals: string[] = []
    const phase = spec.phaseText?.trim() || phaseLabel(monster.paragonConfig?.phaseName, spec.stagePool)
    if (phase) quals.push(`<span class="sb-qual phase-cell" data-help="phase">${phase}</span>`)
    // Authored tags ("Recharges after {PB} rounds") resolve like any other mechanic text.
    const printedUsage = spec.usage?.includes('{') ? processMonsterTokens(spec.usage, monster) : spec.usage
    if (printedUsage?.trim()) {
      const helpKey = statblockUsageHelpKey(printedUsage)
      const helpAttrs = helpKey ? ` data-help="${helpKey}"` : ''
      quals.push(`<span class="sb-qual recharge-cell"${helpAttrs}>${printedUsage.trim()}</span>`)
    }
    if (spec.availability?.trim()) {
      quals.push(`<span class="sb-qual availability-cell" data-help="availability">${spec.availability.trim()}</span>`)
    }
    const classification = spec.discipline?.trim()
    const comps = Array.isArray(spec.components) && spec.components.length > 0
      ? spec.components.join(', ')
      : ''
    const spellMetaParts: string[] = []
    if (classification) {
      spellMetaParts.push(`<span class="sb-qual school-cell" data-help="spell-school-level">${classification}</span>`)
    }
    if (comps) {
      spellMetaParts.push(`<span class="sb-qual sb-comp component-cell dnd-spell-comp" data-help="spell-components">(${comps})</span>`)
    }
    const spellMetaSuffix = spellMetaParts.length > 0 ? `, ${spellMetaParts.join(' ')}` : ''
    const nameHtml = `${quals.join(' ')}${quals.length ? ' ' : ''}<span class="sb-name cell-main-text">${spec.name}${spellMetaSuffix}</span>`
    const headerCells: PlateCell[] = [
      { html: nameHtml, head: true, cls: 'action-composite-pill name-cell' }
    ]

    if (spec.scores?.trim()) {
      headerCells.push({
        html: `<span class="sb-scores scores-cell">${spec.scores.trim()}</span>`,
        cls: 'scores-cell'
      })
    }

    const duration = spec.duration?.trim() && !/^instantaneous$/i.test(spec.duration.trim())
      ? spec.duration.trim()
      : ''
    if (duration) {
      headerCells.push({
        html: `<span class="sb-qual duration-cell">${duration}</span>`,
        cls: 'duration-cell'
      })
    }

    const mechItems = (spec.mechanics ?? [])
      .filter((m) => m?.trim())
      .map((m) => m.replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA)\s+Save\s+(?!(?:DC\b))(<span[^>]*>\d+<\/span>|\d+)/i, '$1 Save DC $2'))
    const scopeItems = (spec.scope ?? []).filter((s) => s?.trim())
    const rows: PlateRow[] = [
      { cells: headerCells, cls: 'action-composite-header' }
    ]

    const isSpellLike = Boolean(classification || comps || duration)

    if (isSpellLike) {
      for (const m of mechItems) {
        headerCells.push({ html: m, cls: 'mech-cell' })
      }
      const row2Cells: PlateCell[] = []
      for (const s of scopeItems) {
        row2Cells.push({ html: s, cls: 'scope-cell target-cell', help: 'scope' })
      }
      for (const e of spec.extra ?? []) {
        if (e?.trim()) row2Cells.push({ html: e, cls: 'meta-cell' })
      }
      if (row2Cells.length > 0) {
        rows.push({ cells: row2Cells, cls: 'action-composite-details' })
      }
    } else {
      const row2Cells: PlateCell[] = []
      for (const s of scopeItems) {
        row2Cells.push({ html: s, cls: 'scope-cell target-cell', help: 'scope' })
      }
      for (const m of mechItems) {
        row2Cells.push({ html: m, cls: 'mech-cell' })
      }
      for (const e of spec.extra ?? []) {
        if (e?.trim()) row2Cells.push({ html: e, cls: 'meta-cell' })
      }

      if (row2Cells.length > 0) {
        if (!spec.scores && headerCells.length === 1) {
          // Simple/physical attacks like Slam: combine name and reach/targeting on Row 1
          rows[0].cells = [...headerCells, ...row2Cells]
        } else {
          rows.push({ cells: row2Cells, cls: 'action-composite-details' })
        }
      }
    }

    if (spec.streamline && rows.length === 1 && rows[0].cells.length === 1 && !classification && !comps && !duration && !spec.scores && body.trim()) {
      const plainBody = body.replace(/<[^>]+>/g, '').trim()
      const singleLineCls = plainBody.length <= 55 ? ' sb-single-line' : ''
      headerCells.push({
        html: boldNumbers(body),
        cls: 'sb-body sb-grow action-body-text'
      })
      return plateHtml({ rows, body: '', cls: `sb-trait-streamlined${singleLineCls}` })
    }

    // An entry whose only content is one text cell beside the name (mechanics or scope prose merged
    // into row 1, or a skill group's scores) must wrap under the name, not drop into its own column.
    const merged = rows[0].cells
    if (rows.length === 1 && !body.trim() && merged.length === 2 && merged[0].head && !classification && !comps && !duration) {
      const text = merged[1]
      const plainText = String(text.html ?? '').replace(/<[^>]+>/g, '').trim()
      if (plainText) {
        rows[0].cells = [merged[0], { ...text, cls: `sb-body sb-grow action-body-text ${text.cls ?? ''}`.trim() }]
        const singleLineCls = plainText.length <= 55 ? ' sb-single-line' : ''
        return plateHtml({ rows, body: '', cls: `sb-trait-streamlined${singleLineCls}` })
      }
    }

    return plateHtml({ rows, body })
  }

  const usageText = (context: { recharge?: string; rechargeMin?: number; rechargeMax?: number; limitedUse?: { count: number; rate: string; recharge?: string } }): string => {
    const recharge = actionRecharge(context)
    if (recharge) return /^recharge/i.test(recharge) ? recharge : `Recharge ${recharge}`
    if (context.limitedUse && context.limitedUse.count > 0 && context.limitedUse.rate) {
      return formatLimitedUses(context.limitedUse.count, context.limitedUse.rate)
    }
    return ''
  }

  // Structured (A6) abilities carry their mechanics in fields, not prose, so every template and
  // section must render them through the shared grammar or they collapse to a bare name.
  const structuredRenderContext = (context: MonsterAction, monster: ReturnType<typeof useMonsterStore>) => {
    const ability = inferAbility(context)
    const formulaContext = formulaContextForMonster(monster as unknown as DomainMonster)
    const attackBonus = structuredAttackBonus(context, monster as unknown as DomainMonster)
    const saveDc = context.stat && context.stat !== 'none'
      ? saveForAction(monster, context.stat, context.save)
      : undefined
    const collection = (['actions','traits','reactions'] as const).find(key => monster[key]?.some(entry => entry.id === context.id))
    const prefix = collection && context.id ? `${collection}[id=${encodeURIComponent(context.id)}]` : undefined
    const formatValue = webProjection && prefix ? (field: string, text: string) => {
      const presentation = monster.bindings?.[`${prefix}.${field}`]?.presentation
      return presentation ? formatNumericPresentation(text, presentation) : text
    } : undefined
    return { ability, renderContext: { attackBonus, saveDc, formulaContext, randomTables: monster.randomTables, formatValue, compactScope: webProjection } }
  }

  /** Modern Modular plate; `usage` is the recharge/uses chip, or the legendary cost. */
  const structuredActionPlate = (
    context: MonsterAction,
    monster: ReturnType<typeof useMonsterStore>,
    usage: string
  ): string => {
    const { ability, renderContext } = structuredRenderContext(context, monster)
    const mechanics = mechanicsPhrase(ability, renderContext).map(boldNumbers)
    const scopeText = scopePhrase(ability, renderContext)
    const scope = scopeText ? [boldNumbers(scopeText)] : []
    const effectsStr = outcomesHtml(ability, renderContext)
    const containersStr = formatDescriptionContainers(context.descriptionContainers, monster.randomTables)
    let desc = sanitizeProsePunctuation(processTokens(`${effectsStr}${containersStr ? containersStr + ' ' : ''}${context.description || ''}`, context, monster, 'action').trim())

    if (context.stat && context.stat !== 'none') {
      desc = desc.replace(/^<i>[^<]*Saving Throw:<\/i>\s*DC\s*\d+(?:,\s*[^.]+)?\.\s*/i, '')
    }
    if (ability.attackSource) {
      desc = desc.replace(/^<i>(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack(?: Roll)?:<\/i>\s*[+-]?\d+\s*to hit,\s*[^.]+\.\s*/i, '')
    }

    const { discipline, components, duration } = abilityHeader(context)
    const canStreamline = !discipline && !components?.length && !duration && scope.length === 0 && mechanics.length === 0 && !effectsStr.includes('action-outcomes-grid')
    return buildPlateEntry(
      monster,
      {
        stagePool: context.stagePool,
        name: context.name,
        usage,
        discipline,
        components,
        duration,
        mechanics,
        scope,
        streamline: canStreamline,
      },
      desc
    )
  }

  /** Classic WotC line: the bold-italic lead, then the 2024 rules text with italic clause labels. */
  const structuredActionLine = (
    context: MonsterAction,
    monster: ReturnType<typeof useMonsterStore>,
    lead: string
  ): string => {
    const { renderContext } = structuredRenderContext(context, monster)
    return processTokens(`${lead} ${text2024(context, renderContext, { markup: 'html', componentsInLead: true })}`, context, monster, 'action')
  }

  const entryBadge = (
    context: { stagePool?: string | number; availability?: ReactionAvailabilitySet } | undefined,
    monster: ReturnType<typeof useMonsterStore>
  ): string => {
    if (!context) return ''
    const { poolsLabel, conditionLabel } = formatReactionAvailability(context, monster.paragonConfig?.phaseName)
    const parts = [poolsLabel, conditionLabel].filter(Boolean)
    return parts.length > 0 ? `<span class="dnd-pool-badge">[${parts.join(' · ')}]</span> ` : ''
  }

  return { buildPlateEntry, usageText, structuredRenderContext, structuredActionPlate, structuredActionLine, entryBadge }
}

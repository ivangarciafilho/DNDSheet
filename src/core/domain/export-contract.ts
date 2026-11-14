import type { MonsterLintIssue } from '../usecases/LintMonster.ts'
import type { DndSpell, Monster } from './types.ts'
import { evaluateExportPolicy } from './check-session.ts'

export type ExportTargetId =
  | '5emm_json'
  | 'homebrewery_v3'
  | 'homebrewery_legacy'
  | 'latex'
  | 'improved_initiative'
  | 'tarrasque_io'
  | 'foundry_vtt'
  | 'plain_text'
  | 'html_snippet'
  | 'png'

export type SpellcastingPlacement = 'auto' | 'with_traits' | 'before_actions' | 'after_actions'

export const SPELLCASTING_PLACEMENT_OPTIONS: readonly { label: string; value: SpellcastingPlacement }[] = Object.freeze([
  { label: 'Default (Web: Traits, Text: Actions)', value: 'auto' },
  { label: 'With Traits (Web & Exports)', value: 'with_traits' },
  { label: 'Before Actions (Web & Exports)', value: 'before_actions' },
  { label: 'After Actions (Web & Exports)', value: 'after_actions' },
])

export function resolveSpellcastingPlacement(
  placement: SpellcastingPlacement | undefined,
  surface: 'web' | 'export'
): 'with_traits' | 'before_actions' | 'after_actions' {
  if (!placement || placement === 'auto') {
    return surface === 'web' ? 'with_traits' : 'after_actions'
  }
  return placement
}

export interface ExportCapability {
  id: ExportTargetId
  label: string
  extension: string
  mimeType: string
  lossless: boolean
  supports2024Grammar: boolean
  supportsSpellcastingPlacement: boolean
  supportsGrammarCss: boolean
  supportedFeatures: readonly string[]
  omissions: readonly string[]
}

export const EXPORT_CAPABILITIES: readonly ExportCapability[] = Object.freeze([
  {
    id: '5emm_json',
    label: 'Native 5emm JSON (.5emm.json)',
    extension: '5emm.json',
    mimeType: 'application/json',
    lossless: true,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: false,
    supportsGrammarCss: false,
    supportedFeatures: ['Canonical monster data', 'Bindings & formulas', 'Custom spells', 'Multiclass spellcasting', 'Random tables', 'Action outcomes'],
    omissions: [],
  },
  {
    id: 'homebrewery_v3',
    label: 'Homebrewery v3 Markdown (.md)',
    extension: 'md',
    mimeType: 'text/markdown',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: false,
    supportedFeatures: ['2024/2014 prose grammar', 'Class & innate spellcasting', 'Search/Study/Influence/Hide check rows', 'Random tables', 'Villain/Bloodied actions'],
    omissions: ['Live formula bindings are exported as resolved values'],
  },
  {
    id: 'homebrewery_legacy',
    label: 'Homebrewery Legacy Markdown (.md)',
    extension: 'md',
    mimeType: 'text/markdown',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: false,
    supportedFeatures: ['2024/2014 prose grammar', 'Class & innate spellcasting', 'Search/Study/Influence/Hide check rows'],
    omissions: ['Live formula bindings are exported as resolved values', 'Random table styling uses plain prose'],
  },
  {
    id: 'latex',
    label: 'LaTeX (rpgtex .tex)',
    extension: 'tex',
    mimeType: 'application/x-tex',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: false,
    supportedFeatures: ['2024/2014 prose grammar', 'Spellcasting & innate spells', 'Check rows', 'Lair & regional effects'],
    omissions: ['Live bindings', 'Web plate styling', 'Metamagic badge styling'],
  },
  {
    id: 'plain_text',
    label: 'Plain Text (.txt)',
    extension: 'txt',
    mimeType: 'text/plain',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: false,
    supportedFeatures: ['2024 text grammar', 'Class & innate spellcasting', 'Search/Study/Influence/Hide check rows', 'Extended boss tracks'],
    omissions: ['All typography, visual theme colors, and HTML plates'],
  },
  {
    id: 'html_snippet',
    label: 'HTML Snippet (.html)',
    extension: 'html',
    mimeType: 'text/html',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: true,
    supportedFeatures: ['2024 text grammar', 'Embedded .sb-plate/.sb-row/.sb-cell grammar CSS', 'Class & innate spellcasting', 'Search/Study/Influence/Hide check rows', 'Interactive dice tray'],
    omissions: ['Live formula binding editor UI'],
  },
  {
    id: 'improved_initiative',
    label: 'Improved Initiative JSON (.json)',
    extension: 'json',
    mimeType: 'application/json',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: false,
    supportsGrammarCss: false,
    supportedFeatures: ['VTT combatant schema', 'Check rows', 'Class spellcasting summary'],
    omissions: ['Live formula bindings', 'Metamagic point UI', 'Random tables', 'Villain/Bloodied/Anatomy custom sections'],
  },
  {
    id: 'tarrasque_io',
    label: 'Tarrasque.io JSON (.json)',
    extension: 'json',
    mimeType: 'application/json',
    lossless: false,
    supports2024Grammar: false,
    supportsSpellcastingPlacement: false,
    supportsGrammarCss: false,
    supportedFeatures: ['Basic stats', 'Core attacks/traits/actions/legendary'],
    omissions: ['2024 grammar enhancements', 'Live formula bindings', 'Random tables', 'Metamagic & multiclass pools', 'Villain/Bloodied/Anatomy custom tracks'],
  },
  {
    id: 'foundry_vtt',
    label: 'Foundry VTT Actor5e JSON (.json)',
    extension: 'json',
    mimeType: 'application/json',
    lossless: false,
    supports2024Grammar: false,
    supportsSpellcastingPlacement: false,
    supportsGrammarCss: false,
    supportedFeatures: ['Actor5e abilities/saves/skills', 'Weapons & feature items'],
    omissions: ['Live formula bindings', 'Visual plate layout', 'Random tables', 'Custom multiclass/metamagic metadata'],
  },
  {
    id: 'png',
    label: 'Statblock Image (.png)',
    extension: 'png',
    mimeType: 'image/png',
    lossless: false,
    supports2024Grammar: true,
    supportsSpellcastingPlacement: true,
    supportsGrammarCss: true,
    supportedFeatures: ['Exact WYSIWYG screenshot', 'All active plates and visual themes'],
    omissions: ['Non-selectable raster image (not structured text/JSON)'],
  },
])

export function getExportCapability(targetId: ExportTargetId): ExportCapability {
  return EXPORT_CAPABILITIES.find((c) => c.id === targetId) || EXPORT_CAPABILITIES[0]
}

export interface ExportOmission {
  feature: string
  reason: string
}

export function detectMonsterExportOmissions(
  monster: Monster,
  targetId: ExportTargetId
): ExportOmission[] {
  const cap = getExportCapability(targetId)
  if (cap.lossless) return []
  const omissions: ExportOmission[] = []

  const bindingCount = Object.keys(monster.bindings || {}).length
  if (bindingCount > 0) {
    omissions.push({
      feature: `Formula Bindings (${bindingCount})`,
      reason: `${cap.label} exports resolved numbers; dynamic formula expressions are only preserved in Native 5emm JSON.`,
    })
  }

  const isStructuredVtt = targetId === 'tarrasque_io' || targetId === 'foundry_vtt' || targetId === 'improved_initiative'
  if (isStructuredVtt && (monster.randomTables?.length || 0) > 0) {
    omissions.push({
      feature: `Random Tables (${monster.randomTables!.length})`,
      reason: `${cap.label} schema does not natively model structured random outcome tables.`,
    })
  }

  if (isStructuredVtt && ((monster.villainActions?.length || 0) > 0 || (monster.bloodiedActions?.length || 0) > 0)) {
    omissions.push({
      feature: 'Villain / Bloodied Actions',
      reason: `${cap.label} flattens or omits MCDM Villain and Bloodied tracks.`,
    })
  }

  if ((targetId === 'tarrasque_io' || targetId === 'foundry_vtt') && ((monster.spellcasting?.classes?.length || 0) > 0 || monster.spellcasting?.metamagic?.enabled)) {
    omissions.push({
      feature: 'Multiclass / Metamagic Pools',
      reason: `${cap.label} schema drops secondary caster sources and metamagic SP allocations.`,
    })
  }

  if (targetId === 'plain_text') {
    omissions.push({
      feature: 'Visual Plate & Grammar Styling',
      reason: 'Plain text strips fonts, HTML plates (.sb-plate), and outcome badge colors.',
    })
  }

  return omissions
}

export interface ExportResult {
  targetId: ExportTargetId
  capability: ExportCapability
  sourceDocumentId: string
  sourceRevision: number
  style: '2014' | '2024'
  spellcastingPlacement: SpellcastingPlacement
  content: string
  omissions: ExportOmission[]
  blockingLintErrors: MonsterLintIssue[]
}

export function buildExportResult(params: {
  monster: Monster
  spells?: Record<string, DndSpell>
  targetId: ExportTargetId
  sourceDocumentId: string
  sourceRevision: number
  style: '2014' | '2024'
  spellcastingPlacement?: SpellcastingPlacement
  content: string
}): ExportResult {
  const capability = getExportCapability(params.targetId)
  const policy = evaluateExportPolicy(params.monster, params.spells || {})
  return {
    targetId: params.targetId,
    capability,
    sourceDocumentId: params.sourceDocumentId,
    sourceRevision: params.sourceRevision,
    style: params.style,
    spellcastingPlacement: params.spellcastingPlacement || 'with_traits',
    content: params.content,
    omissions: detectMonsterExportOmissions(params.monster, params.targetId),
    blockingLintErrors: policy.blockingErrors,
  }
}

export const STATBLOCK_GRAMMAR_EXPORT_CSS = `
    .dnd-statblock {
      --sb-frame: #7a200d;
      --sb-body-bg: #fdf1dc;
      --sb-cell-bg: rgba(255, 255, 255, 0.56);
      --sb-cell-ink: #241914;
      --sb-head-bg: #7a200d;
      --sb-head-ink: #ffffff;
      --sb-rule: rgba(122, 32, 13, 0.25);
    }
    .sb-plate {
      display: block;
      margin: 8px 0;
      padding: 0;
      border: 2px solid var(--sb-frame, #7a200d);
      border-radius: 4px;
      overflow: hidden;
      background: var(--sb-body-bg, #fdf1dc);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .sb-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: stretch;
      border-bottom: 1px solid var(--sb-rule, rgba(0, 0, 0, 0.14));
    }
    .sb-row:last-child { border-bottom: 0; }
    .sb-row > .sb-cell:last-child { flex: 1 1 auto; }
    .sb-cell {
      display: flex;
      flex: 0 1 auto;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 0.35em;
      min-height: 24px;
      padding: 3px 8px;
      background: var(--sb-cell-bg, rgba(255, 255, 255, 0.56));
      color: var(--sb-cell-ink, #241914);
      border-left: 1px solid var(--sb-rule, rgba(0, 0, 0, 0.14));
      font-size: 0.92em;
      line-height: 1.3;
    }
    .sb-cell:first-child { border-left: 0; }
    .sb-cell.sb-grow { flex: 1 1 auto; }
    .sb-cell.sb-head {
      background: var(--sb-head-bg, #7a200d);
      color: var(--sb-head-ink, #ffffff);
      font-weight: 800;
    }
    .sb-qual {
      font-size: 0.78em;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.92;
    }
    .sb-body {
      padding: 4px 8px;
      font-size: 0.94em;
      line-height: 1.4;
    }
    .sb-striped { background: rgba(122, 32, 13, 0.05); }
    .dnd-num { font-weight: 800; font-variant-numeric: tabular-nums; }
    .dnd-outcome { font-style: italic; font-weight: 700; }
    .dnd-adv { color: #1b6b3a; font-weight: 700; }
    .dnd-disadv { color: #8c2323; font-weight: 700; }
`.trim()

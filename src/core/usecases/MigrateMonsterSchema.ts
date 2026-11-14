import { normalizeCastingSpellGrants } from '../domain/casting-source-selection.ts'
import { sanitizeReactionAvailability } from '../domain/entry-display.ts'
import { normalizeRandomTables } from '../domain/random-table.ts'
import { normalizeRollScaling } from '../domain/roll-scaling.ts'
import { characterProficiency } from '../domain/math-utils.ts'
import type { Monster, MonsterAction, MonsterReaction } from '../domain/types.ts'

export const CURRENT_MONSTER_VERSION = 11

export function migrateMonsterSchema(raw: any): Monster {
  const monster = JSON.parse(JSON.stringify(raw))

  if (!monster.saveVersion) {
    monster.saveVersion = 1
  }

  // v1 -> v2: expertise added to skills
  if (monster.saveVersion < 2) {
    for (const skill of monster.skills || []) {
      skill.expertise = false
    }
    monster.saveVersion = 2
  }

  // v2 -> v3: lair actions & regional effects
  if (monster.saveVersion < 3) {
    monster.lairActions = []
    monster.regionalEffects = []
    monster.regionalEffectDescription = ''
    monster.saveVersion = 3
  }

  // v3 -> v4: mythic actions
  if (monster.saveVersion < 4) {
    monster.mythicActions = {
      triggerName: '',
      triggerRecharge: 'Recharges after a Long or Short Rest',
      triggerDescription:
        'If {NAME} would be reduced to 0 hit points, its current hit point total instead resets to {monster.hp} hit points. Additionally, the {NAME} can now use the options in the "Mythic Actions" section for 1 hour. Award a party an additional [x]XP ([x] XP total) for defeating the {NAME} after this trait activates.',
      preamble:
        "If {NAME}'s mythic trait is active, it can use the options below as legendary actions.",
      actions: [],
    }
    monster.saveVersion = 4
  }

  // v4 -> v5: app v1 -> v2 overhaul
  if (monster.saveVersion < 5) {
    monster.useArticleInToken = false
    monster.proficiencyOverride = false
    monster.hpModifierOverride = false
    monster.hpDieTypeOverride = false

    const newSkills = []
    for (const skill of monster.skills || []) {
      const stat = skill.skill?.stat || skill.stat || 'WIS'
      const label = skill.skill?.label || skill.skill?.key || skill.key || ''
      const key = (skill.skill?.key || skill.key || '').toUpperCase()
      newSkills.push({
        ...skill,
        skill: {
          stat,
          label,
        },
        key,
      })
    }
    monster.skills = newSkills

    for (const trait of monster.traits || []) {
      trait.customPreamble = false
      if (trait.limitedUse?.rate === 'long or short rest') {
        trait.limitedUse.rate = 'LONG_OR_SHORT'
      } else if (trait.limitedUse?.rate) {
        trait.limitedUse.rate = trait.limitedUse.rate.toUpperCase().replace(' ', '_')
      }
      if (trait.crAnnotation) {
        trait.crAnnotation.automatic = false
      }
    }

    if (monster.spellcasting?.atWill) {
      for (const spells of monster.spellcasting.atWill) {
        if (spells.rate === 'long or short rest') {
          spells.rate = 'LONG_OR_SHORT'
        } else if (spells.rate) {
          spells.rate = spells.rate.toUpperCase().replace(' ', '_')
        }
      }
    }

    if (monster.spellcasting) {
      monster.spellcasting.useCustomClassPreamble = false
      monster.spellcasting.customClassPreamble = ''
      monster.spellcasting.useCustomInnatePreamble = false
      monster.spellcasting.customInnatePreamble = ''
    }

    for (const attack of monster.attacks || []) {
      attack.useCustomRenderer = false
      attack.customRenderer = ''
      if (attack.kind) attack.kind = attack.kind.toUpperCase()
      if (attack.distance) attack.distance = attack.distance.toUpperCase()
    }

    for (const action of monster.actions || []) {
      action.customPreamble = false
      if (action.limitedUse?.rate === 'long or short rest') {
        action.limitedUse.rate = 'LONG_OR_SHORT'
      } else if (action.limitedUse?.rate) {
        action.limitedUse.rate = action.limitedUse.rate.toUpperCase().replace(' ', '_')
      }
      if (action.crAnnotation) {
        action.crAnnotation.automatic = false
      }
    }

    monster.multiattackOptions = {
      useCustomRenderer: false,
      customMultiattackRenderer: '',
      postscript: '',
    }

    if (monster.legendaryActions) {
      monster.legendaryActions.useCustomPreamble = false
      monster.legendaryActions.customPreamble = ''
    }

    monster.useCustomLairActionPreamble = false
    monster.lairActionPreamble = ''
    for (const la of monster.lairActions || []) {
      if (la.crAnnotation) {
        la.crAnnotation.automatic = false
      }
    }

    monster.autoEstimateDefenseCr = true
    monster.saveVersion = 5
  }

  // v5 -> v6: bonus action, trait sort, visual cr override
  if (monster.saveVersion < 6) {
    for (const a of monster.actions || []) {
      a.bonusAction = false
    }
    monster.alphaTraits = false
    monster.useCrDisplayOverride = false
    monster.crOverride = ''
    monster.saveVersion = 6
  }

  // v6 -> v7: senses notes
  if (monster.saveVersion < 7) {
    monster.sensesNotes = ''
    monster.saveVersion = 7
  }

  // v7 -> v8: inventory
  if (monster.saveVersion < 8) {
    monster.inventory = ''
    monster.saveVersion = 8
  }

  // v8 -> v9: 2024 monster format updates
  if (monster.saveVersion < 9) {
    monster.actions = (monster.actions || []).map((a: MonsterAction) => ({
      ...a,
      stat: a.stat ?? 'none',
      save: a.save ?? {
        override: false,
        overrideValue: 0,
      },
      effects: a.effects ?? [],
      range: a.range ?? '',
    }))

    monster.reactions = (monster.reactions || []).map((r: MonsterReaction) => ({
      ...r,
      limitedUse: r.limitedUse ?? {
        count: 1,
        rate: 'DAY',
      },
      trigger: r.trigger ?? '',
    }))

    monster.format = '2014'
    monster.saveVersion = 9
  }

  // v9 -> v10: lairCr and nickname
  if (monster.saveVersion < 10) {
    monster.lairCr = -1
    monster.lairCrNote = 'in lair'
    monster.nickname = ''
    monster.saveVersion = 10
  }

  // v10 -> v11: conditional skills field
  if (monster.saveVersion < 11) {
    monster.saveVersion = 11
  }

  // Normalize spellcasting structure
  const sc = monster.spellcasting || {}
  const normalizedPrimarySubclass =
    typeof sc.subclass === 'string' && sc.subclass.trim()
      ? sc.subclass.trim()
      : Array.isArray(sc.classes) && typeof sc.classes[0]?.subclass === 'string' && sc.classes[0].subclass.trim()
        ? sc.classes[0].subclass.trim()
        : undefined
  const normalizedSecondarySubclass =
    typeof sc.multiclass?.secondarySubclass === 'string' && sc.multiclass.secondarySubclass.trim()
      ? sc.multiclass.secondarySubclass.trim()
      : undefined
  monster.spellcasting = {
    ...sc,
    ...(sc.spellGrants === undefined ? {} : { spellGrants: normalizeCastingSpellGrants(sc.spellGrants) }),
    ...(Array.isArray(sc.classes)
      ? {
          classes: sc.classes.map((source: typeof sc, idx: number) => {
            const sub =
              typeof source?.subclass === 'string' && source.subclass.trim()
                ? source.subclass.trim()
                : idx === 0
                  ? normalizedPrimarySubclass
                  : undefined
            return {
              ...source,
              ...(sub ? { subclass: sub } : {}),
              ...(source.spellGrants === undefined ? {} : { spellGrants: normalizeCastingSpellGrants(source.spellGrants) }),
            }
          }),
        }
      : {}),
    stat: sc.stat || 'INT',
    save: {
      override: sc.save?.override ?? false,
      overrideValue: sc.save?.overrideValue ?? 0,
    },
    modifier: {
      override: sc.modifier?.override ?? false,
      overrideValue: sc.modifier?.overrideValue ?? 0,
    },
    attack: {
      override: sc.attack?.override ?? false,
      overrideValue: sc.attack?.overrideValue ?? 0,
    },
    class: sc.class,
    ...(normalizedPrimarySubclass ? { subclass: normalizedPrimarySubclass } : {}),
    level: sc.level ?? 1,
    slots: Array.isArray(sc.slots) ? sc.slots : [0, 0, 0, 0, 0, 0, 0, 0, 0],
    atWill: Array.isArray(sc.atWill) ? sc.atWill : [],
    standard: Array.isArray(sc.standard) ? sc.standard : [],
    notes: sc.notes || '',
    atWillNotes: sc.atWillNotes || '',
    useCustomClassPreamble: sc.useCustomClassPreamble ?? false,
    customClassPreamble: sc.customClassPreamble || '',
    useCustomInnatePreamble: sc.useCustomInnatePreamble ?? false,
    customInnatePreamble: sc.customInnatePreamble || '',
    multiclass: sc.multiclass ? {
      enabled: !!sc.multiclass.enabled,
      secondaryClass: sc.multiclass.secondaryClass || 'Cleric',
      ...(normalizedSecondarySubclass ? { secondarySubclass: normalizedSecondarySubclass } : {}),
      secondaryLevel: sc.multiclass.secondaryLevel ?? 1,
      secondaryStat: sc.multiclass.secondaryStat || 'WIS',
      secondarySaveDc: sc.multiclass.secondarySaveDc,
      secondarySpellAttack: sc.multiclass.secondarySpellAttack,
    } : undefined,
  }

  // Preserve the legacy secondary source when the old enable flag is replaced by source count.
  if (sc.primarySourceEnabled !== false && sc.multiclass?.enabled && !(sc.classes || []).length) {
    monster.spellcasting.classes = [{ id: 'legacy-secondary-casting-source', className: sc.multiclass.secondaryClass || 'Cleric', level: sc.multiclass.secondaryLevel || 1, stat: sc.multiclass.secondaryStat || 'WIS', spells: [] }]
  }

  // Normalize attacks
  for (const attack of monster.attacks || []) {
    if (attack.save === null || attack.save === undefined) attack.save = 0
    if (!attack.modifier) {
      attack.modifier = { override: false, overrideValue: 0, stat: 'STR', proficient: true }
    }
    if (!attack.damage) {
      attack.damage = { dice: 6, count: 1, type: 'slashing', modifier: { override: false, overrideValue: 0, stat: 'STR' } }
    } else if (!attack.damage.modifier) {
      attack.damage.modifier = { override: false, overrideValue: 0, stat: 'STR' }
    }
    if (!attack.alternateDamage) {
      attack.alternateDamage = { active: false, dice: 6, count: 1, type: 'slashing', condition: '', modifier: { override: false, overrideValue: 0, stat: 'STR' } }
    } else if (!attack.alternateDamage.modifier) {
      attack.alternateDamage.modifier = { override: false, overrideValue: 0, stat: 'STR' }
    }
    if (!Array.isArray(attack.additionalDamage)) {
      attack.additionalDamage = []
    }
  }

  // Normalize annotations on traits and actions
  for (const trait of monster.traits || []) {
    if (!trait.crAnnotation) {
      trait.crAnnotation = { include: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
    } else {
      if (trait.crAnnotation.ehpMultiplier === undefined) trait.crAnnotation.ehpMultiplier = 1
      if (trait.crAnnotation.ehpModifier === undefined) trait.crAnnotation.ehpModifier = 0
      if (trait.crAnnotation.acModifier === undefined) trait.crAnnotation.acModifier = 0
    }
    if ((trait.limitedUse?.count as any) === '') trait.limitedUse.count = 0
  }

  for (const action of monster.actions || []) {
    if (!action.crAnnotation) {
      action.crAnnotation = { include: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
    } else {
      if (action.crAnnotation.ehpMultiplier === undefined) action.crAnnotation.ehpMultiplier = 1
      if (action.crAnnotation.ehpModifier === undefined) action.crAnnotation.ehpModifier = 0
      if (action.crAnnotation.acModifier === undefined) action.crAnnotation.acModifier = 0
    }
    if ((action.limitedUse?.count as any) === '') action.limitedUse.count = 0
  }

  // Normalize portrait
  if (!monster.portrait) {
    monster.portrait = { url: '', position: 'none' }
  }

  // Normalize extendedHp
  const defaultInvulnerability = {
    enabled: false,
    rule: 'none',
    customRule: '',
    firstXCount: 1,
    disruption: 'none',
    customDisruption: '',
    displayLocation: 'ac' as const,
  }
  if (!monster.extendedHp) {
    monster.extendedHp = {
      showBloodied: false,
      bloodiedSource: 'half_hp',
      bloodiedDice: '2d8',
      damageThresholdSource: 'flat',
      damageThresholdDice: '2d6',
      damageThresholdDisruption: 'none',
      damageReductionSource: 'flat',
      damageReductionDice: '1d6',
      damageReductionDisruption: 'none',
      invulnerability: { ...defaultInvulnerability },
      bloodiedOverride: null,
      damageThreshold: null,
      damageReduction: null,
      regeneration: {
        enabled: false,
        recoveryType: 'regen',
        valueSource: 'flat',
        amount: 10,
        timeframe: 'turn',
        frequency: 'turn_start',
        diceFormula: '',
        disruptedByTypes: ['acid', 'fire'],
        disruptedByNote: '',
        displayMode: 'minimalist',
      },
      deathPrevention: {
        enabled: false,
        name: 'Mortal',
        dcRule: 'CON save DC 5 + damage taken',
        returnHpSource: '1',
        returnHpValue: 1,
        returnHpDice: '2d8',
        requiresSave: false,
        saveStat: 'CON',
        saveDc: 15,
        hideHp: false,
        critHitsToKill: 3,
        exceptions: ['radiant', 'critical hit'],
        customNote: '',
        displayMode: 'minimalist',
      },
    }
  } else {
    if (!monster.extendedHp.invulnerability) {
      monster.extendedHp.invulnerability = { ...defaultInvulnerability }
    }
    if (!monster.extendedHp.regeneration) {
      monster.extendedHp.regeneration = {
        enabled: false,
        recoveryType: 'regen',
        valueSource: 'flat',
        amount: 10,
        timeframe: 'turn',
        frequency: 'turn_start',
        diceFormula: '',
        disruptedByTypes: ['acid', 'fire'],
        disruptedByNote: '',
        displayMode: 'minimalist',
      }
    }
    if (!monster.extendedHp.deathPrevention) {
      monster.extendedHp.deathPrevention = {
        enabled: false,
        name: 'Mortal',
        dcRule: 'CON save DC 5 + damage taken',
        returnHpSource: '1',
        returnHpValue: 1,
        returnHpDice: '2d8',
        requiresSave: false,
        saveStat: 'CON',
        saveDc: 15,
        hideHp: false,
        critHitsToKill: 3,
        exceptions: ['radiant', 'critical hit'],
        customNote: '',
        displayMode: 'minimalist',
      }
    }
  }

  // Normalize paragonConfig
  if (!monster.paragonConfig) {
    monster.paragonConfig = {
      enabled: false,
      poolCount: 1,
      poolHp: [],
      initiativeStep: 'Initiative 20 & 10',
      enrageNote: '',
      activePoolFilter: 'all',
      phaseName: 'Phase',
      bloodiedPerPhase: [],
      phaseConfigs: [],
    }
  } else {
    if (!Array.isArray(monster.paragonConfig.phaseConfigs)) {
      monster.paragonConfig.phaseConfigs = []
    }
    if (!Array.isArray(monster.paragonConfig.bloodiedPerPhase)) {
      monster.paragonConfig.bloodiedPerPhase = []
    }
  }

  // Normalize Smart Defense Lists
  if (!Array.isArray(monster.resistancesList)) {
    monster.resistancesList = (monster.resistances || []).map((r: string, idx: number) => ({
      id: 'res-' + idx + '-' + Date.now(),
      type: String(r),
      nonmagical: false,
      absorbs: false,
      advantage: false,
      disadvantage: false,
      note: '',
    }))
  }
  if (!Array.isArray(monster.immunitiesList)) {
    monster.immunitiesList = (monster.immunities || []).map((r: string, idx: number) => ({
      id: 'imm-' + idx + '-' + Date.now(),
      type: String(r),
      nonmagical: false,
      absorbs: false,
      advantage: false,
      disadvantage: false,
      note: '',
    }))
  }
  if (!Array.isArray(monster.vulnerabilitiesList)) {
    monster.vulnerabilitiesList = (monster.vulnerabilities || []).map((r: string, idx: number) => ({
      id: 'vuln-' + idx + '-' + Date.now(),
      type: String(r),
      nonmagical: false,
      absorbs: false,
      advantage: false,
      disadvantage: false,
      note: '',
    }))
  }
  if (!Array.isArray(monster.conditionsList)) {
    monster.conditionsList = (monster.conditions || []).map((r: string, idx: number) => ({
      id: 'cond-' + idx + '-' + Date.now(),
      type: String(r),
      nonmagical: false,
      absorbs: false,
      advantage: false,
      disadvantage: false,
      note: '',
    }))
  }

  // Normalize Languages List
  if (!Array.isArray(monster.languagesList)) {
    monster.languagesList = []
    if (typeof monster.languages === 'string' && monster.languages.trim() && monster.languages.trim() !== '—') {
      const rawItems = monster.languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      rawItems.forEach((lang: string, idx: number) => {
        const isTelepathy = lang.toLowerCase().includes('telepathy')
        let range = 120
        const matchRange = lang.match(/(\d+)\s*ft/i)
        if (matchRange) range = parseInt(matchRange[1], 10)
        const understandsOnly = lang.toLowerCase().includes('understands') && lang.toLowerCase().includes("can't speak")

        monster.languagesList.push({
          id: 'lang-legacy-' + idx,
          name: isTelepathy ? 'Telepathy' : lang.replace(/^understands\s+/i, '').replace(/\s+but\s+can't\s+speak(?:\s+it)?[.!]?$/i, '').trim(),
          understandsOnly,
          telepathy: isTelepathy,
          telepathyRange: range,
          note: '',
        })
      })
    }
  }

  // Normalize detailedDamageModifiers
  if (!Array.isArray(monster.detailedDamageModifiers)) {
    monster.detailedDamageModifiers = []
  }

  // Normalize sensesList
  if (!Array.isArray(monster.sensesList)) {
    monster.sensesList = []
  }

  // Normalize actionOrientedPassives
  if (!monster.actionOrientedPassives) {
    monster.actionOrientedPassives = {
      search: { perception: false, investigation: false, survival: false },
      study: { arcana: false, history: false, nature: false, religion: false },
      hide: { stealth: false, acrobatics: false, sleightOfHand: false },
      influence: { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false },
      conditions: {},
      bonusActionSearch: false,
      bonusActionStudy: false,
      bonusActionHide: false,
      bonusActionInfluence: false,
    }
  }

  // Normalize traits for recharge section & conditionals
  for (const trait of monster.traits || []) {
    if (trait.renderInRechargeSection === undefined) trait.renderInRechargeSection = false
    if (!trait.rechargeSection) trait.rechargeSection = ''
    if (trait.isConditional === undefined) trait.isConditional = false
    if (!trait.conditionalTrigger) trait.conditionalTrigger = ''
  }

  // A11.6: sanitize reaction availability sets & trigger placement while preserving legacy minimal records and stagePool.
  for (const reaction of monster.reactions || []) {
    if (reaction.triggerPlacement !== undefined && reaction.triggerPlacement !== 'start' && reaction.triggerPlacement !== 'end') {
      reaction.triggerPlacement = 'start'
    }
    if (reaction.availability !== undefined) {
      const normalizedAvailability = sanitizeReactionAvailability(reaction.availability)
      if (normalizedAvailability) {
        reaction.availability = normalizedAvailability
      } else {
        delete reaction.availability
      }
    }
  }

  // A11.9: optional field, normalised on every load so hand-edited or partial JSON cannot break the editor.
  monster.randomTables = normalizeRandomTables(monster.randomTables)

  // A11.2 / A11.3: guarantee stable identities for phaseConfigs, anatomyParts, and languagesList
  if (Array.isArray(monster.paragonConfig?.phaseConfigs)) {
    monster.paragonConfig.phaseConfigs.forEach((cfg: Record<string, unknown>, idx: number) => {
      if (!cfg || typeof cfg !== 'object') return
      if (!cfg.id || typeof cfg.id !== 'string') cfg.id = `phase-${idx + 1}`
      if (typeof cfg.initiativeBonus === 'string' && /^[+-]?\d+$/.test(cfg.initiativeBonus.trim())) {
        cfg.initiativeBonus = Number(cfg.initiativeBonus.trim())
      }
    })
  }
  if (Array.isArray(monster.anatomyParts)) {
    monster.anatomyParts.forEach((part: Record<string, unknown>, idx: number) => {
      if (part && typeof part === 'object' && (!part.id || typeof part.id !== 'string')) {
        part.id = `part-${idx + 1}`
      }
    })
  }
  if (Array.isArray(monster.languagesList)) {
    monster.languagesList.forEach((lang: Record<string, unknown>, idx: number) => {
      if (lang && typeof lang === 'object' && (!lang.id || typeof lang.id !== 'string')) {
        lang.id = `lang-${idx + 1}`
      }
    })
  }

  // A9.13: normalize rollScaling specs cleanly across traits, actions, attacks, and reactions
  for (const collection of [monster.traits, monster.actions, monster.attacks, monster.reactions]) {
    if (!Array.isArray(collection)) continue
    for (const entry of collection as Array<Record<string, unknown>>) {
      if (!entry || typeof entry !== 'object' || entry.rollScaling === undefined) continue
      const normalized = normalizeRollScaling(entry.rollScaling as never)
      if (normalized) entry.rollScaling = normalized
      else delete entry.rollScaling
    }
  }

  if (monster.proficiencyScale === 'character' && !monster.proficiencyOverride && monster.HP) {
    monster.proficiency = characterProficiency(monster.HP.HD)
  }
  return monster as Monster
}


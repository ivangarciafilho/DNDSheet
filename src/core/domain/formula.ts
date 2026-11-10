import type { NumericPresentation } from './numeric-presentation.ts'
import type { DndStat } from './types.ts'

/**
 * Numeric references and custom formulas.
 *
 * Any number on the editor can be bound to a reference (PB, CHA_MOD, HD,
 * SPELL_DC, ...) that follows the creature live, or to a custom formula such
 * as "8 + PB + CHA_MOD", "HD d HD_DIE", "max(1, CON_MOD)" or "2d6 + STR_MOD".
 * Formulas go through a small recursive-descent parser (no eval).
 *
 * Grammar
 *   expr  := term (('+' | '-') term)*
 *   term  := unary (('*' | '/') unary)*
 *   unary := ('+' | '-') unary | dice
 *   dice  := 'd' atom | atom ('d' atom)?
 *   atom  := number | REF | fn '(' expr (',' expr)* ')' | '(' expr ')'
 * Braces work as parentheses, so "{PB} + 2" is valid. "DC:STR" and "A:STR"
 * are accepted as aliases of DC_STR and ATK_STR.
 */

export type FormulaStyle = 'number' | 'bonus' | 'dice'

export type FormulaGroupId =
  | 'ability_mod'
  | 'ability_score'
  | 'attack'
  | 'challenge'
  | 'combat'
  | 'hit_points'
  | 'movement'
  | 'proficiency'
  | 'save_dc'
  | 'saving_throw'
  | 'spellcasting'

export interface FormulaGroup {
  id: FormulaGroupId
  label: string
  /** Font Awesome 6 icon name, as used by Quasar's fontawesome-v6 set. */
  icon: string
  /** Quasar color token. */
  color: string
  tip: string
}

export interface DiceTerm {
  die: number
  count: number
}

/** A rolled quantity: dice kept symbolic plus a flat part. */
export interface DiceValue {
  flat: number
  dice: DiceTerm[]
}

export interface FormulaContext {
  stats: Record<DndStat, number>
  proficiency: number
  hitDice: { count: number; die: number; bonus: number }
  hp: number
  ac: number
  cr: number
  casterLevel: number
  spellStat: DndStat
  spellSaveDc: number
  spellAttack: number
  saves: Record<DndStat, number>
  passivePerception: number
  speed: number
  initiative: number
  legendaryActions: number
}

export interface FormulaRef {
  /** Canonical token, upper snake case. */
  id: string
  /** Dropdown label. */
  label: string
  /** Compact label for chips and tight cells. */
  short: string
  group: FormulaGroupId
  /** How the value prints when the reference is used on its own. */
  style: FormulaStyle
  tip: string
  aliases?: readonly string[]
  resolve: (ctx: FormulaContext) => DiceValue
}

export const ABILITIES: readonly (readonly [DndStat, string])[] = [
  ['STR', 'Strength'],
  ['DEX', 'Dexterity'],
  ['CON', 'Constitution'],
  ['INT', 'Intelligence'],
  ['WIS', 'Wisdom'],
  ['CHA', 'Charisma'],
]

export function abilityModifier(score: number): number {
  return Math.floor((Number(score) - 10) / 2)
}

/** Damage dice of a cantrip at a caster level: 1 (1-4), 2 (5-10), 3 (11-16), 4 (17+). */
export function cantripDice(level: number): number {
  const l = Math.max(1, Math.floor(Number(level) || 1))
  return l >= 17 ? 4 : l >= 11 ? 3 : l >= 5 ? 2 : 1
}

const flatValue = (n: number): DiceValue => ({ flat: Number.isFinite(n) ? n : 0, dice: [] })
const diceValue = (count: number, die: number): DiceValue =>
  die <= 1 ? flatValue(Math.max(0, count) * Math.max(0, die)) : { flat: 0, dice: count > 0 ? [{ die, count }] : [] }

const GROUPS_UNSORTED: FormulaGroup[] = [
  { id: 'ability_mod', label: 'Ability Modifiers', icon: 'fa-solid fa-plus-minus', color: 'teal-6', tip: 'Modifier of each ability score: (score - 10) / 2, rounded down.' },
  { id: 'ability_score', label: 'Ability Scores', icon: 'fa-solid fa-dice-d20', color: 'teal-8', tip: 'The six ability scores (1-30).' },
  { id: 'combat', label: 'Armor & Initiative', icon: 'fa-solid fa-shield-halved', color: 'blue-grey-6', tip: 'Armor Class and Initiative as shown on the stat block.' },
  { id: 'attack', label: 'Attack Bonuses', icon: 'fa-solid fa-crosshairs', color: 'red-7', tip: 'Proficiency bonus + ability modifier, per ability.' },
  { id: 'challenge', label: 'Challenge & Legendary', icon: 'fa-solid fa-dragon', color: 'brown-6', tip: 'Challenge Rating and legendary action budget.' },
  { id: 'hit_points', label: 'Hit Points & Hit Dice', icon: 'fa-solid fa-heart-pulse', color: 'red-5', tip: 'Hit points, Bloodied threshold and Hit Dice (count, size, rolls).' },
  { id: 'movement', label: 'Movement & Senses', icon: 'fa-solid fa-person-running', color: 'green-7', tip: 'Walking speed and Passive Perception.' },
  { id: 'proficiency', label: 'Proficiency', icon: 'fa-solid fa-graduation-cap', color: 'amber-8', tip: 'Proficiency bonus, set by Challenge Rating.' },
  { id: 'save_dc', label: 'Save DCs', icon: 'fa-solid fa-bullseye', color: 'deep-orange-7', tip: '8 + proficiency bonus + ability modifier, per ability.' },
  { id: 'saving_throw', label: 'Saving Throws', icon: 'fa-solid fa-shield', color: 'indigo-5', tip: "The creature's own saving throw bonuses, proficiency and overrides included." },
  { id: 'spellcasting', label: 'Spellcasting', icon: 'fa-solid fa-hat-wizard', color: 'purple-6', tip: 'Spell save DC, spell attack, caster level and cantrip scaling.' },
]

export const FORMULA_GROUPS: readonly FormulaGroup[] = [...GROUPS_UNSORTED].sort((a, b) => a.label.localeCompare(b.label))

const REFS_UNSORTED: FormulaRef[] = [
  ...ABILITIES.map(([s, name]): FormulaRef => ({
    id: s,
    label: `${name} score`,
    short: s,
    group: 'ability_score',
    style: 'number',
    tip: `${name} ability score.`,
    resolve: (c) => flatValue(c.stats[s]),
  })),
  ...ABILITIES.map(([s, name]): FormulaRef => ({
    id: `${s}_MOD`,
    label: `${name} modifier`,
    short: `${s} mod`,
    group: 'ability_mod',
    style: 'bonus',
    aliases: [`${s}_BONUS`],
    tip: `(${name} - 10) / 2, rounded down.`,
    resolve: (c) => flatValue(abilityModifier(c.stats[s])),
  })),
  ...ABILITIES.map(([s, name]): FormulaRef => ({
    id: `ATK_${s}`,
    label: `Attack bonus (${name})`,
    short: `Atk ${s}`,
    group: 'attack',
    style: 'bonus',
    aliases: [`A:${s}`, `A_${s}`, `${s}_ATK`, `ATTACK_${s}`],
    tip: `Proficiency bonus + ${name} modifier.`,
    resolve: (c) => flatValue(c.proficiency + abilityModifier(c.stats[s])),
  })),
  ...ABILITIES.map(([s, name]): FormulaRef => ({
    id: `DC_${s}`,
    label: `Save DC (${name})`,
    short: `DC ${s}`,
    group: 'save_dc',
    style: 'number',
    aliases: [`DC:${s}`, `${s}_DC`],
    tip: `8 + proficiency bonus + ${name} modifier.`,
    resolve: (c) => flatValue(8 + c.proficiency + abilityModifier(c.stats[s])),
  })),
  ...ABILITIES.map(([s, name]): FormulaRef => ({
    id: `SAVE_${s}`,
    label: `${name} saving throw`,
    short: `${s} save`,
    group: 'saving_throw',
    style: 'bonus',
    aliases: [`${s}_SAVE`],
    tip: `${name} saving throw bonus as printed on the stat block.`,
    resolve: (c) => flatValue(c.saves[s]),
  })),
  {
    id: 'PB',
    label: 'Proficiency bonus',
    short: 'PB',
    group: 'proficiency',
    style: 'bonus',
    aliases: ['PROF', 'PROFICIENCY'],
    tip: 'Set by Challenge Rating: +2 at CR 0-4, up to +9 at CR 29-30.',
    resolve: (c) => flatValue(c.proficiency),
  },
  {
    id: 'HP',
    label: 'Hit points',
    short: 'HP',
    group: 'hit_points',
    style: 'number',
    aliases: ['AVG_HP', 'HIT_POINTS', 'MAX_HP'],
    tip: 'Average hit points: the Hit Dice average plus the hit point bonus.',
    resolve: (c) => flatValue(c.hp),
  },
  {
    id: 'BLOODIED',
    label: 'Bloodied threshold',
    short: 'Bloodied',
    group: 'hit_points',
    style: 'number',
    aliases: ['HALF_HP'],
    tip: 'Half the hit points, rounded down. The creature is Bloodied at or below it.',
    resolve: (c) => flatValue(Math.floor(c.hp / 2)),
  },
  {
    id: 'HD',
    label: 'Hit Dice count',
    short: 'HD',
    group: 'hit_points',
    style: 'number',
    aliases: ['HD_COUNT', 'HIT_DICE_COUNT'],
    tip: 'How many Hit Dice the creature has.',
    resolve: (c) => flatValue(c.hitDice.count),
  },
  {
    id: 'HD_DIE',
    label: 'Hit Die size',
    short: 'HD die',
    group: 'hit_points',
    style: 'number',
    aliases: ['HD_TYPE', 'HIT_DIE_SIZE'],
    tip: 'Faces on one Hit Die (8 for a d8). Usually set by size.',
    resolve: (c) => flatValue(c.hitDice.die),
  },
  {
    id: 'HP_BONUS',
    label: 'Hit point bonus',
    short: 'HP bonus',
    group: 'hit_points',
    style: 'bonus',
    aliases: ['HD_MOD', 'HP_MOD'],
    tip: 'Flat bonus added to the Hit Dice, usually Hit Dice x Constitution modifier.',
    resolve: (c) => flatValue(c.hitDice.bonus),
  },
  {
    id: 'HIT_DIE',
    label: 'Hit Die roll (one)',
    short: '1 Hit Die',
    group: 'hit_points',
    style: 'dice',
    aliases: ['HIT_DIE_ROLL', 'ONE_HIT_DIE'],
    tip: 'One Hit Die rolled: 1d(Hit Die size).',
    resolve: (c) => diceValue(1, c.hitDice.die),
  },
  {
    id: 'HIT_DICE',
    label: 'Hit Dice roll (all)',
    short: 'All Hit Dice',
    group: 'hit_points',
    style: 'dice',
    aliases: ['HIT_DICE_ROLL', 'ALL_HIT_DICE'],
    tip: 'Every Hit Die rolled: (Hit Dice count)d(Hit Die size).',
    resolve: (c) => diceValue(c.hitDice.count, c.hitDice.die),
  },
  {
    id: 'AC',
    label: 'Armor Class',
    short: 'AC',
    group: 'combat',
    style: 'number',
    aliases: ['ARMOR_CLASS'],
    tip: 'Armor Class as shown on the stat block.',
    resolve: (c) => flatValue(c.ac),
  },
  {
    id: 'INIT',
    label: 'Initiative bonus',
    short: 'Init',
    group: 'combat',
    style: 'bonus',
    aliases: ['INITIATIVE'],
    tip: 'Initiative modifier: Dexterity modifier plus any proficiency or bonus.',
    resolve: (c) => flatValue(c.initiative),
  },
  {
    id: 'PASSIVE_PERCEPTION',
    label: 'Passive Perception',
    short: 'Passive Per.',
    group: 'movement',
    style: 'number',
    aliases: ['PP', 'PASSIVE'],
    tip: '10 + Perception bonus; +5 with Advantage, -5 with Disadvantage.',
    resolve: (c) => flatValue(c.passivePerception),
  },
  {
    id: 'SPEED',
    label: 'Speed',
    short: 'Speed',
    group: 'movement',
    style: 'number',
    aliases: ['WALK', 'WALK_SPEED'],
    tip: 'Walking speed, in feet.',
    resolve: (c) => flatValue(c.speed),
  },
  {
    id: 'CR',
    label: 'Challenge Rating',
    short: 'CR',
    group: 'challenge',
    style: 'number',
    aliases: ['CHALLENGE'],
    tip: 'Challenge Rating as a number (1/2 counts as 0.5).',
    resolve: (c) => flatValue(c.cr),
  },
  {
    id: 'LEGENDARY',
    label: 'Legendary actions',
    short: 'Legendary',
    group: 'challenge',
    style: 'number',
    aliases: ['LEGENDARY_ACTIONS', 'LA'],
    tip: 'Legendary action uses per round.',
    resolve: (c) => flatValue(c.legendaryActions),
  },
  {
    id: 'CASTER_LEVEL',
    label: 'Caster level',
    short: 'Caster lvl',
    group: 'spellcasting',
    style: 'number',
    aliases: ['LEVEL', 'SPELLCASTER_LEVEL'],
    tip: 'Spellcaster level, used for spell slots and cantrip scaling.',
    resolve: (c) => flatValue(c.casterLevel),
  },
  {
    id: 'CANTRIP_DICE',
    label: 'Cantrip dice',
    short: 'Cantrip dice',
    group: 'spellcasting',
    style: 'number',
    aliases: ['CANTRIP_TIER', 'TIER'],
    tip: 'Damage dice a cantrip rolls: 1 at caster levels 1-4, 2 at 5-10, 3 at 11-16, 4 at 17+.',
    resolve: (c) => flatValue(cantripDice(c.casterLevel)),
  },
  {
    id: 'SPELL_ATK',
    label: 'Spell attack bonus',
    short: 'Spell atk',
    group: 'spellcasting',
    style: 'bonus',
    aliases: ['SPELL_ATTACK', 'SPELLATTACK'],
    tip: 'Proficiency bonus + spellcasting modifier, or its override.',
    resolve: (c) => flatValue(c.spellAttack),
  },
  {
    id: 'SPELL_DC',
    label: 'Spell save DC',
    short: 'Spell DC',
    group: 'spellcasting',
    style: 'number',
    aliases: ['SPELL_SAVE', 'SPELLSAVE', 'SPELL_SAVE_DC'],
    tip: '8 + proficiency bonus + spellcasting modifier, or its override.',
    resolve: (c) => flatValue(c.spellSaveDc),
  },
  {
    id: 'SPELL_MOD',
    label: 'Spellcasting modifier',
    short: 'Spell mod',
    group: 'spellcasting',
    style: 'bonus',
    aliases: ['SPELLCASTING_MOD', 'SPELL_ABILITY'],
    tip: 'Modifier of the spellcasting ability.',
    resolve: (c) => flatValue(abilityModifier(c.stats[c.spellStat])),
  },
]

const groupOrder = (id: FormulaGroupId) => FORMULA_GROUPS.findIndex((g) => g.id === id)

/** Every reference, grouped (groups A-Z) and alphabetical inside each group. */
export const FORMULA_REFS: readonly FormulaRef[] = [...REFS_UNSORTED].sort(
  (a, b) => groupOrder(a.group) - groupOrder(b.group) || a.label.localeCompare(b.label)
)

const REF_INDEX: Map<string, FormulaRef> = (() => {
  const index = new Map<string, FormulaRef>()
  for (const ref of FORMULA_REFS) {
    for (const key of [ref.id, ...(ref.aliases ?? [])]) {
      const k = key.toUpperCase()
      if (index.has(k)) throw new Error(`duplicate formula reference key ${k}`)
      index.set(k, ref)
    }
  }
  return index
})()

export function getFormulaRef(idOrAlias: string | null | undefined): FormulaRef | undefined {
  if (!idOrAlias) return undefined
  return REF_INDEX.get(String(idOrAlias).trim().toUpperCase())
}

export function formulaRefsByGroup(): { group: FormulaGroup; refs: FormulaRef[] }[] {
  return FORMULA_GROUPS.map((group) => ({ group, refs: FORMULA_REFS.filter((r) => r.group === group.id) })).filter(
    (g) => g.refs.length > 0
  )
}

/* ------------------------------------------------------------------ */
/* Dice arithmetic                                                     */
/* ------------------------------------------------------------------ */

export function hasDice(v: DiceValue): boolean {
  return v.dice.some((d) => d.count !== 0)
}

export function averageOf(v: DiceValue): number {
  return v.dice.reduce((sum, d) => sum + (d.count * (d.die + 1)) / 2, v.flat)
}

function mergeDice(a: DiceTerm[], b: DiceTerm[], sign: 1 | -1): DiceTerm[] {
  const out = a.map((d) => ({ ...d }))
  for (const d of b) {
    const hit = out.find((x) => x.die === d.die)
    if (hit) hit.count += sign * d.count
    else out.push({ die: d.die, count: sign * d.count })
  }
  return out.filter((d) => d.count !== 0)
}

const add = (a: DiceValue, b: DiceValue): DiceValue => ({ flat: a.flat + b.flat, dice: mergeDice(a.dice, b.dice, 1) })
const sub = (a: DiceValue, b: DiceValue): DiceValue => ({ flat: a.flat - b.flat, dice: mergeDice(a.dice, b.dice, -1) })
const scale = (a: DiceValue, k: number): DiceValue => ({
  flat: a.flat * k,
  dice: a.dice.map((d) => ({ die: d.die, count: d.count * k })).filter((d) => d.count !== 0),
})
const collapse = (a: DiceValue): DiceValue => flatValue(averageOf(a))

function multiply(a: DiceValue, b: DiceValue): DiceValue {
  const aDice = hasDice(a)
  const bDice = hasDice(b)
  if (!aDice && !bDice) return flatValue(a.flat * b.flat)
  if (aDice && !bDice && Number.isInteger(b.flat)) return scale(a, b.flat)
  if (bDice && !aDice && Number.isInteger(a.flat)) return scale(b, a.flat)
  return flatValue(averageOf(a) * averageOf(b))
}

/* ------------------------------------------------------------------ */
/* Tokenizer and parser                                                */
/* ------------------------------------------------------------------ */

export class FormulaError extends Error {
  at: number
  suggestions: string[]
  constructor(message: string, at: number, suggestions: string[] = []) {
    super(message)
    this.name = 'FormulaError'
    this.at = at
    this.suggestions = suggestions
  }
}

type Tok =
  | { k: 'num'; v: number; at: number }
  | { k: 'id'; v: string; at: number }
  | { k: 'op'; v: string; at: number }
  | { k: 'd'; at: number }
  | { k: 'end'; at: number }

const OP_ALIASES: Record<string, string> = {
  '×': '*',
  '÷': '/',
  '{': '(',
  '}': ')',
  '−': '-',
  '–': '-',
}

const isRefOrNumber = (word: string) => /^\d+$/.test(word) || getFormulaRef(word) != null

function pushWord(tokens: Tok[], word: string, at: number): void {
  if (/^\d+$/.test(word)) {
    tokens.push({ k: 'num', v: Number(word), at })
    return
  }
  if (/^d$/i.test(word)) {
    tokens.push({ k: 'd', at })
    return
  }
  const diceLiteral = /^d(\d+)$/i.exec(word)
  if (diceLiteral) {
    tokens.push({ k: 'd', at })
    tokens.push({ k: 'num', v: Number(diceLiteral[1]), at: at + 1 })
    return
  }
  if (getFormulaRef(word)) {
    tokens.push({ k: 'id', v: word, at })
    return
  }
  // "HDdHD_DIE", "PBd6": split on a lowercase 'd' between two known parts
  for (let j = 1; j < word.length - 1; j++) {
    if (word[j] !== 'd') continue
    const left = word.slice(0, j)
    const right = word.slice(j + 1)
    if (isRefOrNumber(left) && isRefOrNumber(right)) {
      pushWord(tokens, left, at)
      tokens.push({ k: 'd', at: at + j })
      pushWord(tokens, right, at + j + 1)
      return
    }
  }
  tokens.push({ k: 'id', v: word, at })
}

function tokenize(src: string): Tok[] {
  const tokens: Tok[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] ?? ''))) {
      const m = /^\d*\.?\d+|^\d+/.exec(src.slice(i))!
      // a number glued to letters ("2d6", "3HD") continues as a word
      const tail = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + m[0].length))
      if (tail && /^\d+$/.test(m[0])) {
        tokens.push({ k: 'num', v: Number(m[0]), at: i })
        pushWord(tokens, tail[0], i + m[0].length)
        i += m[0].length + tail[0].length
        continue
      }
      tokens.push({ k: 'num', v: Number(m[0]), at: i })
      i += m[0].length
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      let word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))![0]
      const start = i
      i += word.length
      // legacy "DC:STR" / "A:STR"
      if (/^(DC|A)$/i.test(word) && src[i] === ':') {
        const rest = /^[A-Za-z]+/.exec(src.slice(i + 1))
        if (rest) {
          word = `${word}:${rest[0]}`
          i += 1 + rest[0].length
        }
      }
      pushWord(tokens, word, start)
      continue
    }
    const op = OP_ALIASES[ch] ?? ch
    if ('+-*/(),'.includes(op)) {
      tokens.push({ k: 'op', v: op, at: i })
      i++
      continue
    }
    throw new FormulaError(`Unexpected "${ch}"`, i)
  }
  tokens.push({ k: 'end', at: src.length })
  return tokens
}

export type FormulaNode =
  | { t: 'num'; v: number }
  | { t: 'ref'; id: string }
  | { t: 'neg'; a: FormulaNode }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; a: FormulaNode; b: FormulaNode }
  | { t: 'dice'; count: FormulaNode; die: FormulaNode }
  | { t: 'call'; fn: string; args: FormulaNode[] }

const FUNCTIONS: Record<string, { min: number; max: number; tip: string }> = {
  abs: { min: 1, max: 1, tip: 'abs(x): absolute value' },
  avg: { min: 1, max: 1, tip: 'avg(x): average of a roll, as a number' },
  ceil: { min: 1, max: 1, tip: 'ceil(x): round up' },
  floor: { min: 1, max: 1, tip: 'floor(x): round down' },
  half: { min: 1, max: 1, tip: 'half(x): half, rounded down' },
  max: { min: 1, max: 8, tip: 'max(a, b, ...): the largest value' },
  min: { min: 1, max: 8, tip: 'min(a, b, ...): the smallest value' },
  mod: { min: 1, max: 1, tip: 'mod(score): ability modifier of a score' },
  round: { min: 1, max: 1, tip: 'round(x): nearest whole number' },
}

export const FORMULA_FUNCTIONS: readonly { name: string; tip: string }[] = Object.entries(FUNCTIONS).map(([name, f]) => ({
  name,
  tip: f.tip,
}))

function parseTokens(tokens: Tok[]): FormulaNode {
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]
  const isOp = (t: Tok, v: string) => t.k === 'op' && t.v === v
  const expect = (v: string) => {
    const t = next()
    if (!isOp(t, v)) throw new FormulaError(t.k === 'end' ? `Missing "${v}"` : `Expected "${v}"`, t.at)
  }

  function expr(): FormulaNode {
    let left = term()
    while (isOp(peek(), '+') || isOp(peek(), '-')) {
      const op = (next() as { v: string }).v as '+' | '-'
      left = { t: 'bin', op, a: left, b: term() }
    }
    return left
  }

  function term(): FormulaNode {
    let left = unary()
    while (isOp(peek(), '*') || isOp(peek(), '/')) {
      const op = (next() as { v: string }).v as '*' | '/'
      left = { t: 'bin', op, a: left, b: unary() }
    }
    return left
  }

  function unary(): FormulaNode {
    if (isOp(peek(), '-')) {
      next()
      return { t: 'neg', a: unary() }
    }
    if (isOp(peek(), '+')) {
      next()
      return unary()
    }
    return dice()
  }

  function dice(): FormulaNode {
    if (peek().k === 'd') {
      next()
      return { t: 'dice', count: { t: 'num', v: 1 }, die: atom() }
    }
    const base = atom()
    if (peek().k === 'd') {
      next()
      return { t: 'dice', count: base, die: atom() }
    }
    return base
  }

  function atom(): FormulaNode {
    const tok = next()
    if (tok.k === 'num') return { t: 'num', v: tok.v }
    if (tok.k === 'id') {
      const fnName = tok.v.toLowerCase()
      if (isOp(peek(), '(') && fnName in FUNCTIONS) {
        next()
        const args: FormulaNode[] = []
        if (!isOp(peek(), ')')) {
          args.push(expr())
          while (isOp(peek(), ',')) {
            next()
            args.push(expr())
          }
        }
        expect(')')
        const spec = FUNCTIONS[fnName]
        if (args.length < spec.min || args.length > spec.max) {
          throw new FormulaError(`${fnName}() takes ${spec.min === spec.max ? spec.min : `${spec.min}-${spec.max}`} value(s)`, tok.at)
        }
        return { t: 'call', fn: fnName, args }
      }
      const ref = getFormulaRef(tok.v)
      if (!ref) {
        const suggestions = suggestFormulaRefs(tok.v, 3).map((r) => r.id)
        const hint = suggestions.length ? ` Did you mean ${suggestions.join(', ')}?` : ''
        throw new FormulaError(`Unknown reference "${tok.v}".${hint}`, tok.at, suggestions)
      }
      return { t: 'ref', id: ref.id }
    }
    if (tok.k === 'op' && tok.v === '(') {
      const inner = expr()
      expect(')')
      return inner
    }
    if (tok.k === 'end') throw new FormulaError('Formula ends too early', tok.at)
    throw new FormulaError(`Unexpected "${tok.k === 'op' ? tok.v : 'd'}"`, tok.at)
  }

  const root = expr()
  const tail = peek()
  if (tail.k !== 'end') throw new FormulaError(`Unexpected "${tail.k === 'op' ? tail.v : tail.k === 'd' ? 'd' : String((tail as { v: unknown }).v)}"`, tail.at)
  return root
}

/**
 * Rewrites spellings the older free-text evaluator accepted
 * ("PROFICIENCY BONUS", "2X PB", "HIT DICE", "STR MOD", "STR SCORE")
 * into canonical references.
 */
export function normalizeLegacyFormula(src: string): string {
  return String(src ?? '')
    .replace(/\bPROFICIENCY\s+BONUS\b/gi, 'PB')
    .replace(/\b2\s*X\s*PB\b/gi, '(2 * PB)')
    .replace(/\bHIT\s+DICE\b/gi, 'HD')
    .replace(/\b(STR|DEX|CON|INT|WIS|CHA)\s+MOD\b/gi, '$1_MOD')
    .replace(/\b(STR|DEX|CON|INT|WIS|CHA)\s+SCORE\b/gi, '$1')
}

export function parseFormula(src: string): { ok: true; ast: FormulaNode } | { ok: false; error: string; at: number; suggestions: string[] } {
  try {
    const text = String(src ?? '')
    if (!text.trim()) return { ok: false, error: 'Empty formula', at: 0, suggestions: [] }
    return { ok: true, ast: parseTokens(tokenize(text)) }
  } catch (err) {
    if (err instanceof FormulaError) return { ok: false, error: err.message, at: err.at, suggestions: err.suggestions }
    throw err
  }
}

/* ------------------------------------------------------------------ */
/* Evaluation, formatting and traces                                   */
/* ------------------------------------------------------------------ */

function evaluateNode(node: FormulaNode, ctx: FormulaContext): DiceValue {
  switch (node.t) {
    case 'num':
      return flatValue(node.v)
    case 'ref':
      return getFormulaRef(node.id)!.resolve(ctx)
    case 'neg':
      return scale(evaluateNode(node.a, ctx), -1)
    case 'bin': {
      const a = evaluateNode(node.a, ctx)
      const b = evaluateNode(node.b, ctx)
      if (node.op === '+') return add(a, b)
      if (node.op === '-') return sub(a, b)
      if (node.op === '*') return multiply(a, b)
      const divisor = averageOf(b)
      if (divisor === 0) throw new FormulaError('Division by zero', 0)
      return flatValue(averageOf(a) / divisor)
    }
    case 'dice': {
      const count = Math.floor(averageOf(evaluateNode(node.count, ctx)))
      const die = Math.floor(averageOf(evaluateNode(node.die, ctx)))
      if (die < 1) throw new FormulaError('A die needs at least 1 face', 0)
      if (count < 0) throw new FormulaError('Dice count cannot be negative', 0)
      return diceValue(count, die)
    }
    case 'call': {
      const args = node.args.map((a) => evaluateNode(a, ctx))
      const nums = args.map(averageOf)
      switch (node.fn) {
        case 'abs':
          return flatValue(Math.abs(nums[0]))
        case 'avg':
          return collapse(args[0])
        case 'ceil':
          return flatValue(Math.ceil(nums[0]))
        case 'floor':
          return flatValue(Math.floor(nums[0]))
        case 'half':
          return flatValue(Math.floor(nums[0] / 2))
        case 'max':
          return flatValue(Math.max(...nums))
        case 'min':
          return flatValue(Math.min(...nums))
        case 'mod':
          return flatValue(abilityModifier(nums[0]))
        case 'round':
          return flatValue(Math.round(nums[0]))
      }
      throw new FormulaError(`Unknown function ${node.fn}()`, 0)
    }
  }
}

export function renderBonusText(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

const CR_FRACTIONS: Record<string, string> = { '0.125': '1/8', '0.25': '1/4', '0.5': '1/2' }

export function formatDice(dice: DiceTerm[]): string {
  return dice
    .filter((d) => d.count !== 0)
    .map((d, i) => {
      const term = `${Math.abs(d.count)}d${d.die}`
      if (i === 0) return d.count < 0 ? `-${term}` : term
      return d.count < 0 ? `- ${term}` : `+ ${term}`
    })
    .join(' ')
}

/** Prints a value: "16", "+5", or "11 (2d6 + 4)". */
export function formatDiceValue(v: DiceValue, style: FormulaStyle): string {
  const flat = Math.floor(v.flat)
  if (!hasDice(v)) {
    const n = Math.floor(v.flat)
    return style === 'bonus' ? renderBonusText(n) : String(n)
  }
  const diceText = formatDice(v.dice)
  if (style === 'bonus') return flat === 0 ? `+${diceText}` : `${renderBonusText(flat)} + ${diceText}`
  const avg = Math.floor(averageOf({ flat, dice: v.dice }))
  const flatText = flat > 0 ? ` + ${flat}` : flat < 0 ? ` - ${Math.abs(flat)}` : ''
  return `${avg} (${diceText}${flatText})`
}

const PRECEDENCE: Record<FormulaNode['t'], number> = { bin: 1, neg: 3, dice: 4, num: 5, ref: 5, call: 5 }
const binPrecedence = (op: string) => (op === '+' || op === '-' ? 1 : 2)

function explainNode(node: FormulaNode, ctx: FormulaContext): string {
  const wrap = (child: FormulaNode, parentPrec: number, rightSide = false, parentOp = '') => {
    const childPrec = child.t === 'bin' ? binPrecedence(child.op) : PRECEDENCE[child.t]
    const text = explainNode(child, ctx)
    const needs = childPrec < parentPrec || (rightSide && childPrec === parentPrec && (parentOp === '-' || parentOp === '/'))
    return needs ? `(${text})` : text
  }
  switch (node.t) {
    case 'num':
      return String(node.v)
    case 'ref': {
      const ref = getFormulaRef(node.id)!
      const v = ref.resolve(ctx)
      const shown = hasDice(v) ? formatDice(v.dice) : ref.style === 'bonus' ? renderBonusText(Math.floor(v.flat)) : String(v.flat)
      return `${ref.id}[${shown}]`
    }
    case 'neg':
      return `-${wrap(node.a, 3)}`
    case 'bin': {
      const p = binPrecedence(node.op)
      return `${wrap(node.a, p)} ${node.op} ${wrap(node.b, p, true, node.op)}`
    }
    case 'dice':
      return `${wrap(node.count, 5)}d${wrap(node.die, 5)}`
    case 'call':
      return `${node.fn}(${node.args.map((a) => explainNode(a, ctx)).join(', ')})`
  }
}

function collectRefs(node: FormulaNode, out: Set<string>): Set<string> {
  if (node.t === 'ref') out.add(node.id)
  else if (node.t === 'neg') collectRefs(node.a, out)
  else if (node.t === 'bin') {
    collectRefs(node.a, out)
    collectRefs(node.b, out)
  } else if (node.t === 'dice') {
    collectRefs(node.count, out)
    collectRefs(node.die, out)
  } else if (node.t === 'call') node.args.forEach((a) => collectRefs(a, out))
  return out
}

export interface FormulaSuccess {
  ok: true
  /** Average rounded down. */
  value: number
  dice: DiceTerm[]
  /** Flat part, rounded down. */
  flat: number
  style: FormulaStyle
  text: string
  /** Substituted form for tooltips: "8 + PB[+3] + CHA_MOD[+5] = 16". */
  trace: string
  refs: string[]
}

export interface FormulaFailure {
  ok: false
  error: string
  at: number
  suggestions: string[]
}

export type FormulaResult = FormulaSuccess | FormulaFailure

export function evaluateFormula(src: string, ctx: FormulaContext, opts: { style?: FormulaStyle; integerScalar?: boolean } = {}): FormulaResult {
  const parsed = parseFormula(src)
  if (!parsed.ok) return parsed
  try {
    const v = evaluateNode(parsed.ast, ctx)
    if (opts.integerScalar && (hasDice(v) || !Number.isSafeInteger(v.flat))) {
      return { ok: false, error: hasDice(v) ? 'Dice terms cannot be assigned to an integer field' : 'Formula must resolve to a safe integer; use floor or ceil explicitly', at: 0, suggestions: [] }
    }
    const single = parsed.ast.t === 'ref' ? getFormulaRef(parsed.ast.id)! : undefined
    const style: FormulaStyle =
      opts.style ?? (/^\s*\+/.test(src) ? 'bonus' : single ? single.style : hasDice(v) ? 'dice' : 'number')
    let text = formatDiceValue(v, style)
    if (single?.id === 'CR' && !opts.style) text = CR_FRACTIONS[String(v.flat)] ?? text
    const flat = Math.floor(v.flat)
    return {
      ok: true,
      value: Math.floor(averageOf({ flat, dice: v.dice })),
      dice: v.dice,
      flat,
      style,
      text,
      trace: `${explainNode(parsed.ast, ctx)} = ${text}`,
      refs: [...collectRefs(parsed.ast, new Set<string>())],
    }
  } catch (err) {
    if (err instanceof FormulaError) return { ok: false, error: err.message, at: err.at, suggestions: err.suggestions }
    throw err
  }
}

/* ------------------------------------------------------------------ */
/* Bindings: what an editor number field stores                        */
/* ------------------------------------------------------------------ */

export type NumericBinding = ({ mode: 'literal'; value: number } | { mode: 'ref'; ref: string } | { mode: 'formula'; expr: string }) & { presentation?: NumericPresentation }

/** Legacy fields hold plain numbers; new fields hold bindings. Both resolve here. */
export type NumericInput = NumericBinding | number | string | null | undefined

export function isNumericBinding(x: unknown): x is NumericBinding {
  if (!x || typeof x !== 'object') return false
  const b = x as Record<string, unknown>
  return (b.mode === 'literal' && typeof b.value === 'number' && Number.isFinite(b.value)) || (b.mode === 'ref' && typeof b.ref === 'string') || (b.mode === 'formula' && typeof b.expr === 'string')
}

export function bindingSource(input: NumericInput): string {
  if (input == null) return ''
  if (typeof input === 'number') return Number.isFinite(input) ? String(input) : ''
  if (typeof input === 'string') return input
  if (!isNumericBinding(input)) return ''
  return input.mode === 'literal' ? String(input.value) : input.mode === 'ref' ? input.ref : input.expr
}

export function describeBinding(input: NumericInput): string {
  if (isNumericBinding(input) && input.mode === 'ref') return getFormulaRef(input.ref)?.label ?? input.ref
  return bindingSource(input)
}

export type NumericResult = (FormulaSuccess & { error?: undefined }) | (Omit<FormulaSuccess, 'ok'> & { ok: false; error: string; at: number; suggestions: string[] })

export function resolveNumeric(
  input: NumericInput,
  ctx: FormulaContext,
  opts: { style?: FormulaStyle; fallback?: number; integerScalar?: boolean } = {}
): NumericResult {
  const fallback = opts.fallback ?? 0
  const fallbackResult = (error: string, at = 0, suggestions: string[] = []): NumericResult => {
    const style = opts.style ?? 'number'
    const text = formatDiceValue(flatValue(fallback), style)
    return { ok: false, error, at, suggestions, value: fallback, dice: [], flat: fallback, style, text, trace: text, refs: [] }
  }
  if (isNumericBinding(input) && input.mode === 'literal') {
    const style = opts.style ?? 'number'
    const text = formatDiceValue(flatValue(input.value), style)
    return { ok: true, value: input.value, dice: [], flat: input.value, style, text, trace: text, refs: [] }
  }
  const src = bindingSource(input).replace(/^\s*DC\s+(?=[\d({A-Za-z])/i, '')
  if (!src.trim()) {
    if (input == null || input === '') {
      const style = opts.style ?? 'number'
      const text = formatDiceValue(flatValue(fallback), style)
      return { ok: true, value: fallback, dice: [], flat: fallback, style, text, trace: text, refs: [] }
    }
    return fallbackResult('Empty formula')
  }
  const result = evaluateFormula(src, ctx, { style: opts.style, integerScalar: opts.integerScalar })
  return result.ok ? result : fallbackResult(result.error, result.at, result.suggestions)
}

/* ------------------------------------------------------------------ */
/* Suggestions (intellisense)                                          */
/* ------------------------------------------------------------------ */

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

/** Ranks references for a typed fragment: exact, prefix, label words, substring, typos. */
export function suggestFormulaRefs(query: string, limit = 8): FormulaRef[] {
  const q = String(query ?? '').trim().replace(/^[{(]+/, '').toUpperCase()
  if (!q) return FORMULA_REFS.slice(0, limit)
  const scored: { ref: FormulaRef; score: number }[] = []
  for (const ref of FORMULA_REFS) {
    const keys = [ref.id, ...(ref.aliases ?? [])].map((k) => k.toUpperCase())
    const words = ref.label.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
    let score = 0
    if (ref.id === q) score = 100
    else if (keys.includes(q)) score = 95
    else if (ref.id.startsWith(q)) score = 80 - (ref.id.length - q.length) * 0.5
    else if (keys.some((k) => k.startsWith(q))) score = 70
    else if (words.some((w) => w.startsWith(q))) score = 60
    else if (ref.id.includes(q)) score = 40
    else if (ref.label.toUpperCase().includes(q)) score = 30
    else if (q.length >= 3 && keys.some((k) => editDistance(k, q) <= 2)) score = 20
    if (score > 0) scored.push({ ref, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || groupOrder(a.ref.group) - groupOrder(b.ref.group) || a.ref.label.localeCompare(b.ref.label))
    .slice(0, limit)
    .map((s) => s.ref)
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export interface FormulaMonsterLike {
  stats?: Partial<Record<DndStat, number>>
  proficiency?: number
  HP?: { HD?: number; type?: number; modifier?: number }
  AC?: number
  CR?: number
  spellcasting?: { level?: number; stat?: DndStat | string }
  legendaryActions?: { count?: number }
  speeds?: { type?: string; speed?: number }[]
  saves?: Partial<Record<DndStat, { proficient?: boolean; override?: boolean; overrideValue?: number } | undefined>>
}

/**
 * Normalizes a creature into the values references read. Pass store getters
 * (avg HP, computed AC, spell DC with overrides, ...) through `derived`.
 */
export function buildFormulaContext(m: FormulaMonsterLike | null | undefined, derived: Partial<FormulaContext> = {}): FormulaContext {
  const stats = {} as Record<DndStat, number>
  for (const [s] of ABILITIES) {
    const raw = Number(m?.stats?.[s])
    stats[s] = Number.isFinite(raw) ? raw : 10
  }
  const proficiency = Number.isFinite(Number(m?.proficiency)) ? Number(m?.proficiency) : 2
  const count = Math.max(0, Math.floor(Number(m?.HP?.HD ?? 1)) || 0)
  const die = Math.max(1, Math.floor(Number(m?.HP?.type ?? 8)) || 8)
  const bonus = Math.floor(Number(m?.HP?.modifier ?? 0)) || 0
  const spellStatRaw = String(m?.spellcasting?.stat ?? 'INT').toUpperCase()
  const spellStat = (ABILITIES.some(([s]) => s === spellStatRaw) ? spellStatRaw : 'INT') as DndStat
  const saves = {} as Record<DndStat, number>
  for (const [s] of ABILITIES) {
    const save = m?.saves?.[s]
    saves[s] = save?.override && Number.isFinite(Number(save.overrideValue))
      ? Number(save.overrideValue)
      : abilityModifier(stats[s]) + (save?.proficient ? proficiency : 0)
  }
  const walk = m?.speeds?.find((sp) => !sp.type || sp.type.toLowerCase() === 'walk') ?? m?.speeds?.[0]
  const base: FormulaContext = {
    stats,
    proficiency,
    hitDice: { count, die, bonus },
    hp: Math.floor((count * (die + 1)) / 2) + bonus,
    ac: Number.isFinite(Number(m?.AC)) ? Number(m?.AC) : 10,
    cr: Number.isFinite(Number(m?.CR)) ? Number(m?.CR) : 0,
    casterLevel: Math.max(0, Math.floor(Number(m?.spellcasting?.level ?? 0)) || 0),
    spellStat,
    spellSaveDc: 8 + proficiency + abilityModifier(stats[spellStat]),
    spellAttack: proficiency + abilityModifier(stats[spellStat]),
    saves,
    passivePerception: 10 + abilityModifier(stats.WIS),
    speed: Number.isFinite(Number(walk?.speed)) ? Number(walk?.speed) : 30,
    initiative: abilityModifier(stats.DEX),
    legendaryActions: Math.max(0, Math.floor(Number(m?.legendaryActions?.count ?? 0)) || 0),
  }
  const clean = Object.fromEntries(Object.entries(derived).filter(([, v]) => v !== undefined && v !== null)) as Partial<FormulaContext>
  return { ...base, ...clean }
}

/* ------------------------------------------------------------------ */
/* Macros inside rich text                                             */
/* ------------------------------------------------------------------ */

/**
 * Replaces every {formula} the older token handlers left untouched, e.g.
 * "{SPELL_DC}", "{HD d HD_DIE}", "{2d6 + 1d8 + STR_MOD}". Context tokens with
 * a dot ({action.name}) and anything that fails to parse stay as written.
 */
export function renderFormulaMacros(text: string, ctx: FormulaContext): string {
  if (!text || !text.includes('{')) return text
  return text.replace(/\{([^{}<>]+)\}/g, (match, inner: string) => {
    if (inner.includes('.')) return match
    const result = evaluateFormula(inner, ctx)
    return result.ok ? result.text : match
  })
}


/** Field paths are opaque graph identities here; the field registry owns address validation and access. */
export type BindingMap = Readonly<Record<string, NumericBinding>>
/** Supplies all authored source paths of a canonical reference, including derived/transitive sources. */
export type ReferenceSources = (referenceId: string, targetPath: string) => readonly string[]
export class BindingGraphError extends Error {
  readonly cycles: readonly string[][]
  constructor(message: string, cycles: readonly string[][] = []) { super(message); this.name = 'BindingGraphError'; this.cycles = cycles }
}

/** Analyze parsed references, never substring-match prose or execute formulas to discover dependencies. */
function bindingGraph(bindings: BindingMap, sources: ReferenceSources): Map<string, string[]> {
  const paths = Object.keys(bindings).sort()
  if (paths.length > 512) throw new BindingGraphError('At most 512 bound fields can be analyzed at once')
  const known = new Set(paths), graph = new Map<string, string[]>()
  let edgeCount = 0
  for (const path of paths) {
    const binding = bindings[path]
    if (!isNumericBinding(binding)) throw new BindingGraphError(`Invalid binding at ${path}`)
    const dependencies = new Set<string>()
    if (binding.mode !== 'literal') {
      if (binding.mode === 'ref' && !getFormulaRef(binding.ref)) throw new BindingGraphError(`Invalid reference binding at ${path}`)
      const parsed = parseFormula(bindingSource(binding))
      if (!parsed.ok) throw new BindingGraphError(`Invalid formula at ${path}: ${parsed.error}`)
      const pending = [parsed.ast]
      while (pending.length) {
        const node = pending.pop() as FormulaNode
        if (node.t === 'ref') {
          const reference = getFormulaRef(node.id)
          if (!reference) throw new BindingGraphError(`Unknown reference ${node.id} at ${path}`)
          const sourcePaths = sources(reference.id, path)
          if (!Array.isArray(sourcePaths) || sourcePaths.length > 512 || sourcePaths.some(source => typeof source !== 'string')) throw new BindingGraphError(`Invalid reference sources at ${path}`)
          for (const source of sourcePaths) if (known.has(source)) dependencies.add(source)
        } else if (node.t === 'neg') pending.push(node.a)
        else if (node.t === 'bin') pending.push(node.a, node.b)
        else if (node.t === 'dice') pending.push(node.count, node.die)
        else if (node.t === 'call') pending.push(...node.args)
      }
    }
    const edges = [...dependencies].sort()
    edgeCount += edges.length
    if (edgeCount > 16384) throw new BindingGraphError('Binding dependency graph is too dense')
    graph.set(path, edges)
  }
  return graph
}

/** Iterative Kosaraju: report cyclic components, not exponentially many individual cycle walks. */
function cyclicGroups(graph: Map<string, string[]>): string[][] {
  const visited = new Set<string>(), finished: string[] = []
  for (const root of graph.keys()) {
    const stack: { path: string; exit: boolean }[] = [{ path: root, exit: false }]
    while (stack.length) {
      const frame = stack.pop() as { path: string; exit: boolean }
      if (frame.exit) { finished.push(frame.path); continue }
      if (visited.has(frame.path)) continue
      visited.add(frame.path)
      stack.push({ path: frame.path, exit: true })
      for (const path of [...(graph.get(frame.path) || [])].reverse()) if (!visited.has(path)) stack.push({ path, exit: false })
    }
  }
  const reverse = new Map([...graph.keys()].map(path => [path, [] as string[]]))
  for (const [path, dependencies] of graph) for (const dependency of dependencies) reverse.get(dependency)?.push(path)
  visited.clear()
  const cycles: string[][] = []
  for (const root of finished.reverse()) {
    if (visited.has(root)) continue
    const stack = [root], component: string[] = []
    while (stack.length) {
      const path = stack.pop() as string
      if (visited.has(path)) continue
      visited.add(path); component.push(path)
      stack.push(...(reverse.get(path) || []))
    }
    component.sort()
    if (component.length > 1 || graph.get(root)?.includes(root)) cycles.push(component)
  }
  return cycles.sort((a, b) => a[0].localeCompare(b[0]))
}

/** Deterministic source-before-consumer order; invalid or cyclic input never returns a partial order. */
export function dependencyOrder(bindings: BindingMap, sources: ReferenceSources): string[] {
  const graph = bindingGraph(bindings, sources), cycles = cyclicGroups(graph)
  if (cycles.length) throw new BindingGraphError('Cyclic numeric bindings', cycles)
  const pending = new Map([...graph].map(([path, dependencies]) => [path, dependencies.length]))
  const consumers = new Map([...graph.keys()].map(path => [path, [] as string[]]))
  for (const [path, dependencies] of graph) for (const dependency of dependencies) consumers.get(dependency)?.push(path)
  const ready = [...pending].filter(([, count]) => count === 0).map(([path]) => path).sort(), order: string[] = []
  while (ready.length) {
    const path = ready.shift() as string
    order.push(path)
    for (const consumer of consumers.get(path) || []) {
      const remaining = (pending.get(consumer) || 0) - 1
      pending.set(consumer, remaining)
      if (remaining === 0) { ready.push(consumer); ready.sort() }
    }
  }
  return order
}

/** Each result is a sorted strongly connected group, including a one-field self dependency. */
export function detectCycles(bindings: BindingMap, sources: ReferenceSources): string[][] {
  return cyclicGroups(bindingGraph(bindings, sources))
}

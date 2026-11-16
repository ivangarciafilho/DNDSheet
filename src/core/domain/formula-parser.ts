import { FormulaError, OP_ALIASES, abilityModifier, add, averageOf, collapse, diceValue, flatValue, getFormulaRef, hasDice, isRefOrNumber, multiply, scale, sub, suggestFormulaRefs } from './formula.ts'
import type { DiceTerm, DiceValue, FormulaContext, FormulaStyle, Tok } from './formula.ts'

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

export function evaluateNode(node: FormulaNode, ctx: FormulaContext): DiceValue {
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

export const CR_FRACTIONS: Record<string, string> = { '0.125': '1/8', '0.25': '1/4', '0.5': '1/2' }

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

export function explainNode(node: FormulaNode, ctx: FormulaContext): string {
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

export function collectRefs(node: FormulaNode, out: Set<string>): Set<string> {
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

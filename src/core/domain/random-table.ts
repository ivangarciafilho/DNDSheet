// A11.9 declarative random-outcome tables: stable ids, dice validation, coverage diagnostics, prose/table output.
export interface RandomTableRow { id: string; min: number; max: number; text: string }
export interface RandomTable { id: string; title?: string; dice: string; rows: RandomTableRow[]; fallback?: string }
export interface TableDiagnostic { kind: 'dice' | 'gap' | 'overlap' | 'empty' | 'range'; message: string; rowIds?: string[] }

const DICE = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/i;

/** Range of a dice expression such as `1d8`, `2d6+1`; null when invalid. */
export function diceRange(expr: string): { min: number; max: number } | null {
  const m = DICE.exec(expr);
  if (!m) return null;
  const n = Number(m[1] || 1), faces = Number(m[2]), mod = Number((m[3] || '0').replace(/\s/g, ''));
  if (n < 1 || n > 100 || faces < 2 || faces > 1000) return null;
  return { min: n + mod, max: n * faces + mod };
}

export function diagnoseTable(table: RandomTable): TableDiagnostic[] {
  const out: TableDiagnostic[] = [];
  const range = diceRange(table.dice);
  if (!range) out.push({ kind: 'dice', message: `“${table.dice}” is not a dice expression (use e.g. 1d8 or 2d6+1).` });
  if (!table.rows.length) { out.push({ kind: 'empty', message: 'The table has no rows.' }); return out; }
  for (const r of table.rows) if (r.min > r.max) out.push({ kind: 'range', message: `Row ${r.min}–${r.max} runs backwards.`, rowIds: [r.id] });
  const sorted = [...table.rows].sort((a, b) => a.min - b.min);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1], b = sorted[i];
    if (b.min <= a.max) out.push({ kind: 'overlap', message: `Rows ${a.min}–${a.max} and ${b.min}–${b.max} overlap.`, rowIds: [a.id, b.id] });
    else if (b.min > a.max + 1 && !table.fallback) out.push({ kind: 'gap', message: `No row covers ${a.max + 1}–${b.min - 1}.`, rowIds: [a.id, b.id] });
  }
  if (range && !table.fallback) {
    if (sorted[0].min > range.min) out.push({ kind: 'gap', message: `No row covers ${range.min}–${sorted[0].min - 1}.` });
    const last = sorted[sorted.length - 1];
    if (last.max < range.max) out.push({ kind: 'gap', message: `No row covers ${last.max + 1}–${range.max}.` });
  }
  return out;
}

/** Result for an explicit roll only; never rolls by itself. */
export function lookupRoll(table: RandomTable, roll: number): string | null {
  const row = table.rows.find((r) => roll >= r.min && roll <= r.max);
  return row ? row.text : table.fallback ?? null;
}

const span = (r: RandomTableRow) => (r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`);

export function tableToProse(table: RandomTable): string {
  const rows = [...table.rows].sort((a, b) => a.min - b.min).map((r) => `${span(r)}: ${r.text}`);
  if (table.fallback) rows.push(`otherwise: ${table.fallback}`);
  return `Roll ${table.dice}: ${rows.join('; ')}.`;
}

export function tableToMarkdown(table: RandomTable): string {
  const head = `| ${table.dice} | Result |\n|---|---|`;
  const rows = [...table.rows].sort((a, b) => a.min - b.min).map((r) => `| ${span(r)} | ${r.text.replace(/\|/g, '\\|')} |`);
  return [head, ...rows].join('\n');
}

/** Migrates legacy free-text "1-2: foo\n3: bar" into rows with stable ids. */
export function parseLegacyTable(id: string, dice: string, text: string): RandomTable {
  const rows: RandomTableRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*[:.)]\s*(.+)$/.exec(line);
    if (m) rows.push({ id: `${id}-r${rows.length + 1}`, min: Number(m[1]), max: Number(m[2] ?? m[1]), text: m[3].trim() });
  }
  return { id, dice, rows };
}

const finiteInt = (value: unknown, fallback: number) => {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}
const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** Coerces stored tables into a valid shape: arrays, string fields, integer ranges, unique ids. */
export function normalizeRandomTables(raw: unknown): RandomTable[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const uniq = (id: unknown, fallback: string) => {
    const base = text(id) || fallback
    let out = base
    let i = 2
    while (seen.has(out)) out = `${base}-${i++}`
    seen.add(out)
    return out
  }
  return raw.filter((t) => t && typeof t === 'object').map((t, ti) => {
    const table = t as Record<string, unknown>
    const id = uniq(table.id, `rt-${ti + 1}`)
    const rows = (Array.isArray(table.rows) ? table.rows : []).filter((r) => r && typeof r === 'object').map((r, ri) => {
      const row = r as Record<string, unknown>
      const min = finiteInt(row.min, 1)
      return { id: uniq(row.id, `${id}-r${ri + 1}`), min, max: finiteInt(row.max, min), text: text(row.text) }
    })
    const out: RandomTable = { id, title: text(table.title), dice: text(table.dice) || '1d6', rows }
    if (text(table.fallback)) out.fallback = text(table.fallback)
    return out
  })
}

/** The row an author most likely wants next: one past the highest end, clamped to the dice maximum. */
export function nextRandomTableRow(table: RandomTable, id: string): RandomTableRow {
  const ends = table.rows.map((r) => r.max).filter(Number.isFinite)
  const last = ends.length ? Math.max(...ends) : 0
  const top = diceRange(table.dice)?.max ?? last + 1
  const min = Math.min(last + 1, top)
  return { id, min, max: min, text: '' }
}

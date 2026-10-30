/**
 * Export boundary: turns renderer HTML into Markdown or LaTeX text. Authored emphasis and paragraph
 * breaks cross it; web-only chrome (plates, number pills, help hooks) never does.
 */
export type TextExportFormat = 'markdown' | 'latex'

const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity: string) => {
    if (entity[0] !== '#') return ENTITIES[entity.toLowerCase()] ?? whole
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1))
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : whole
  })
}

const LATEX_ESCAPES: Readonly<Record<string, string>> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '%': '\\%',
  '#': '\\#',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
  // Bare < and > print as other glyphs under LaTeX's default font encoding.
  '<': '\\textless{}',
  '>': '\\textgreater{}',
}

const escapeText = (text: string, format: TextExportFormat): string =>
  format === 'latex'
    ? text.replace(/[\\{}$&%#_~^<>]/g, (char) => LATEX_ESCAPES[char])
    : text.replace(/[\\`*_[\]<>]/g, (char) => `\\${char}`)

type Emphasis = 'bold' | 'italic' | 'underline'

const EMPHASIS: Readonly<Record<string, Emphasis>> = { b: 'bold', strong: 'bold', i: 'italic', em: 'italic', u: 'underline' }
const MARKDOWN_MARKS: Readonly<Record<Emphasis, string>> = { bold: '**', italic: '*', underline: '' }
const LATEX_COMMANDS: Readonly<Record<Emphasis, string>> = { bold: 'textbf', italic: 'emph', underline: 'underline' }
const BLOCK_TAGS = new Set(['br', 'div', 'p', 'li'])
const SEPARATED_TAGS = new Set(['span', 'td'])

/** `<b><i>Name.</i></b> body`: the lead every rendered entry starts with; misnested closings are tolerated. */
const ENTRY_LEAD = /^\s*<(b|strong)>\s*<(i|em)>([\s\S]*?)(?:<\/\2>\s*<\/\1>|<\/\1>\s*<\/\2>)\s*/i

/** The printed name of a rendered entry, without its closing period, and the body after it. */
export function splitEntryLead(html: string): { title: string; body: string } {
  const lead = html.match(ENTRY_LEAD)
  return lead ? { title: lead[3].replace(/\.\s*$/, ''), body: html.slice(lead[0].length) } : { title: '', body: html }
}

export function exportMarkup(input: string, format: TextExportFormat): string {
  const clean = input.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  if (format === 'latex') {
    const { title, body } = splitEntryLead(clean)
    if (title) {
      const rest = exportMarkup(body, format)
      return `\\DndMonsterAction{${exportMarkup(title, format)}}${rest ? ` ${rest}` : ''}`
    }
  }

  const open: { tag: string; close: string }[] = []
  let output = ''
  // Adjacent inline cells need a space between them, but never before punctuation that follows one.
  let gap = false
  for (const part of clean.split(/(<[^>]*>)/g)) {
    // A tag name starts with a letter, so text such as "HP < 10 and AC > 5" stays text.
    const tag = part.startsWith('<') ? part.match(/^<\s*(\/?)\s*([a-z][\w-]*)([^>]*)>/i) : null
    if (!tag) {
      const text = escapeText(part.startsWith('<') ? part : decodeEntities(part), format)
      if (!text) continue
      if (gap && !/\s$/.test(output) && !/^[\s,.;:!?)\]]/.test(text)) output += ' '
      output += text
      gap = false
      continue
    }
    const [, slash, rawName, attributes] = tag
    const name = rawName.toLowerCase()
    const emphasis = EMPHASIS[name]
    if (emphasis && slash) {
      const index = open.map((entry) => entry.tag).lastIndexOf(name)
      while (index >= 0 && open.length > index) output += open.pop()?.close ?? ''
    } else if (emphasis) {
      // Classed emphasis is presentation (number pills, plate cells); only authored tags carry meaning.
      const chrome = /\bclass\s*=/i.test(attributes)
      const mark = format === 'latex' ? `\\${LATEX_COMMANDS[emphasis]}{` : MARKDOWN_MARKS[emphasis]
      output += chrome ? '' : mark
      open.push({ tag: name, close: chrome ? '' : format === 'latex' ? '}' : MARKDOWN_MARKS[emphasis] })
    } else if (BLOCK_TAGS.has(name)) {
      if (output && !output.endsWith('\n')) output += '\n'
      gap = false
    } else if (slash && SEPARATED_TAGS.has(name)) {
      gap = true
    }
  }
  while (open.length) output += open.pop()?.close ?? ''

  return output
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

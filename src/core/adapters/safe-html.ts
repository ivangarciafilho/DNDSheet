import type { Directive } from 'vue'

// Allow-list sanitizer for every HTML string rendered with v-safe-html (the app's only v-html path).
// Built from the tag/attribute inventory of real stat-block output plus the formatting and table tags the
// renderers emit. Parsing happens in an inert <template>, so nothing executes while sanitizing.
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'link', 'meta', 'base', 'form', 'textarea', 'select', 'button', 'input'])
const TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'sub', 'sup', 'code', 'br', 'p', 'ul', 'ol', 'li', 'div', 'span', 'small',
  'h2', 'h3', 'h4', 'table', 'caption', 'thead', 'tbody', 'tr', 'th', 'td', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon'])
const GLOBAL_ATTRS = new Set(['class', 'style', 'title', 'role', 'tabindex', 'scope', 'colspan', 'rowspan', 'lang', 'dir'])
const SVG_ATTRS = new Set(['viewbox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height', 'xmlns',
  'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'opacity', 'fill-rule', 'clip-rule', 'aria-hidden', 'focusable'])
const UNSAFE_STYLE = /url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:/i

function clean(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) { child.remove(); continue }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as Element
    const tag = el.tagName.toLowerCase()
    if (DROP_WITH_CONTENT.has(tag)) { el.remove(); continue }
    if (!TAGS.has(tag)) { clean(el); el.replaceWith(...el.childNodes); continue }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const allowed = GLOBAL_ATTRS.has(name) || name.startsWith('data-') || name.startsWith('aria-') || SVG_ATTRS.has(name)
      if (!allowed || name.startsWith('on') || /^\s*javascript:/i.test(attr.value) || (name === 'style' && UNSAFE_STYLE.test(attr.value))) el.removeAttribute(attr.name)
    }
    clean(el)
  }
}

/** Returns `html` with only allow-listed tags and attributes. Text content is preserved. */
export function safeHtml(html: unknown): string {
  const source = html == null ? '' : String(html)
  if (!/[<&]/.test(source)) return source
  const template = document.createElement('template')
  template.innerHTML = source
  clean(template.content)
  return template.innerHTML
}

const apply = (el: HTMLElement, value: unknown) => { el.innerHTML = safeHtml(value) }

/** `v-safe-html="html"`: v-html through the allow-list sanitizer. */
export const vSafeHtml: Directive<HTMLElement, unknown> = {
  beforeMount: (el, binding) => apply(el, binding.value),
  updated: (el, binding) => { if (binding.value !== binding.oldValue) apply(el, binding.value) },
}

/**
 * Export file names come from author text (monster or character names). Windows, macOS and Linux disagree on
 * what a file name may contain, so names are reduced to the intersection every platform accepts.
 */
const FORBIDDEN = /[<>:"/\\|?*\u0000-\u001f]/g
const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i

/** `Ogre: Elder/Chief?` + `.5emm.json` → `Ogre- Elder-Chief.5emm.json`; empty names fall back. */
export function safeFileName(name: string | undefined | null, suffix: string, fallback = 'statblock'): string {
  let base = String(name ?? '').replace(FORBIDDEN, '-').replace(/\s+/g, ' ').replace(/-{2,}/g, '-').trim()
  base = base.replace(/[. -]+$/, '').replace(/^[. -]+/, '')
  if (!base || RESERVED.test(base)) base = base ? `${base}_` : fallback
  // Leave room for the suffix inside the common 255-character limit.
  const room = Math.max(1, 200 - suffix.length)
  return `${base.slice(0, room).trimEnd()}${suffix}`
}

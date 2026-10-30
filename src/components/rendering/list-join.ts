/** Prose list: "a", "a and b", "a, b, and c". `sep` joins every item but the last. */
export function listJoin(list: readonly string[], sep: string): string {
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(sep)}, and ${list[list.length - 1]}`
}

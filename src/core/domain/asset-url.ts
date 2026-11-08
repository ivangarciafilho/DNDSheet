/**
 * Saved layer URLs use root-relative paths ("/homebrew/masks/a.png"); under a sub-path deployment
 * (GitHub Pages "/DNDSheet/") they must be resolved against the app base at render time, not rewritten in data.
 */
export function resolveAppAsset(url: string | undefined | null, base: string): string {
  const value = url ?? ''
  if (!value.startsWith('/') || value.startsWith('//')) return value
  const prefix = base.replace(/\/+$/, '')
  if (!prefix || value === prefix || value.startsWith(prefix + '/')) return value
  return prefix + value
}

/** Base path the app is served from; hash routing keeps location.pathname at the app root. */
export function currentAppBase(): string {
  return typeof window === 'undefined' ? '/' : new URL('./', window.location.href).pathname
}

export const appAsset = (url: string | undefined | null): string => resolveAppAsset(url, currentAppBase())

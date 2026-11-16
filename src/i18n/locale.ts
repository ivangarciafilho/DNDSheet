// C5: supported UI locales, the persisted choice, and nothing else. English is the source and the fallback;
// a pt-BR key that is missing falls back to English at runtime and is counted by the coverage test.
export const SUPPORTED_LOCALES = ['en-US', 'pt-BR'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const FALLBACK_LOCALE: AppLocale = 'en-US'
const STORAGE_KEY = 'app.locale'

const isAppLocale = (value: unknown): value is AppLocale => SUPPORTED_LOCALES.includes(value as AppLocale)

// Opt-in only: the help text is translated before the rest of the UI, so a browser locale must not
// switch a user into a half-translated interface they did not ask for.
export function storedLocale(): AppLocale {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY)
    return isAppLocale(value) ? value : FALLBACK_LOCALE
  } catch {
    return FALLBACK_LOCALE
  }
}

export function persistLocale(locale: AppLocale): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for the session only.
  }
}

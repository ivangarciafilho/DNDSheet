import { Quasar } from 'quasar'
import langEnUs from 'quasar/lang/en-US'
import langPtBr from 'quasar/lang/pt-BR'
import type { AppLocale } from './locale'

/** Synchronizes Quasar's built-in widget translations with the active app locale. */
export function syncQuasarLang(locale: AppLocale): void {
  Quasar.lang.set(locale === 'pt-BR' ? langPtBr : langEnUs)
}

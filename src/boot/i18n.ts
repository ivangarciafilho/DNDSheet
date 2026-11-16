import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'

import messages from 'src/i18n'
import { FALLBACK_LOCALE, storedLocale } from 'src/i18n/locale'

export default boot(({ app }) => {
  const i18n = createI18n({
    locale: storedLocale(),
    fallbackLocale: FALLBACK_LOCALE,
    // Untranslated pt-BR keys fall back to English by design (C5 is incremental); don't warn per key.
    fallbackWarn: false,
    missingWarn: false,
    messages,
  })

  // Set i18n instance on app
  app.use(i18n)
})

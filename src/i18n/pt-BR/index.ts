import { HELP_MESSAGES_PT_BR } from './help.ts'

// Brazilian Portuguese. Translated namespaces are listed here; every other key falls back to en-US
// (see src/i18n/locale.ts) and is reported by test/core/I18nCoverage.test.ts.
export default {
  locale: {
    label: 'Idioma',
    hint: 'A ajuda já está em português; os demais textos da interface ainda aparecem em inglês.',
  },
  help: HELP_MESSAGES_PT_BR,
}

export interface StructuredReleaseLocale {
  title: string
  subtitle: string
  bullets: readonly string[]
}

export interface StructuredReleaseMetadata {
  version: string
  latestBuild: string
  buildRange: readonly [number, number]
  locales: {
    'en-US': StructuredReleaseLocale
    'pt-BR': StructuredReleaseLocale
  }
}

export const LATEST_RELEASE_METADATA: StructuredReleaseMetadata = {
  version: '2.5.0',
  latestBuild: '272',
  buildRange: [250, 272],
  locales: {
    'en-US': {
      title: 'v2.5.0 (Builds 250–272)',
      subtitle: 'Statblock Overhaul, Rules Converter Dialog, Focused Help & Zero-Any Ratchet - 11/2026',
      bullets: [
        'Modular editor & domain decomposition (0 files over 900 lines), site-wide CatalogSelect, 100% v-help tooltip coverage (556+ controls), and non-focus-stealing FocusedHelpBar.',
        '100% Brazilian Portuguese (pt-BR) UI & help dictionary with dynamic Quasar locale sync, brace-parity tests, dark-mode WCAG contrast overhaul, AC rider composer with Natural Armor base, frameless portrait toggle, and BS-39 paired range support.',
        'Rules Edition Converter Dialog (2014 <-> 2024) with single-step atomic undo, macro token pills, CR breakdown clipboard copy, extracted Open5e pure parsers, payload coercion warnings, and quality ratchet at 0 explicit anys and <= 360 total CSS !important declarations.',
      ],
    },
    'pt-BR': {
      title: 'v2.5.0 (Builds 250–272)',
      subtitle: 'Revisão de Bloco, Conversor de Regras, Barra de Ajuda e Zero-Any - 11/2026',
      bullets: [
        'Decomposição modular de editor e domínio (0 arquivos acima de 900 linhas), CatalogSelect global, 100% de cobertura v-help e barra de ajuda contextual sem roubo de foco.',
        'Interface e dicionário de ajuda 100% em português brasileiro (pt-BR) com sincronização dinâmica Quasar, validação de placeholders, contraste WCAG em modo escuro, compositores de CA com armadura natural, retrato sem moldura e alcance pareado BS-39.',
        'Conversor de Edição de Regras (2014 <-> 2024) com desfazer atômico, pílulas de macro, cópia do detalhamento de ND, analisador Open5e puro, avisos de compatibilidade de arquivo e trava de qualidade em 0 any explícitos.',
      ],
    },
  },
}

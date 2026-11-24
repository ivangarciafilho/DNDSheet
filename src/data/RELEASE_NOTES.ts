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
  version: '2.7.0',
  latestBuild: '274',
  buildRange: [250, 274],
  locales: {
    'en-US': {
      title: 'v2.7.0 (Builds 250–274)',
      subtitle: 'Track F Horizon: Encounter Budget, 2024 Heroes, Offline Importers, Multi-Page Print & Light Studio - 11/2026',
      bullets: [
        'Build 274: one-card Armor Class and Hit Points compositors (regain-HP riders, Death Throes inside Mortality), ready-to-edit melee/ranged weapon and spell attack presets, suggestions that keep flowing while a formula is composed (181-entry library, browsable in the Database Studio), a stat-block-only preview and grouped, colour-coded dropdowns.',
        'Encounter XP Budget calculator (2014 & 2024 DMG rules), deterministic initiative sorting, active-turn-safe batch combatant additions, and encounter JSON/Markdown import/export in Combat HUD.',
        '2024 Revised 5e Hero Sheet support (Origin Feats & 8 Weapon Mastery properties isolated from monster CR calculation), 100.0% localized Combat/Hero/Offline UI (1,134/1,134 pt-BR keys), and 100% help coverage.',
        'Zero-network offline importers for Foundry VTT Actor5e JSON, Homebrewery v3/Legacy Markdown, and Improved Initiative bundles with prototype-pollution and XSS sanitization.',
        'Multi-page A4 print flow with non-printing break guides, WCAG AA Light Studio theme toggle, CSS priority-override burn-down (361 -> 310), and automated JS bundle budget enforcement.',
      ],
    },
    'pt-BR': {
      title: 'v2.7.0 (Builds 250–274)',
      subtitle: 'Trilha F Completa: Orçamento de Encontros, Heróis 2024, Importadores Offline, Impressão Multipágina e Estúdio Claro - 11/2026',
      bullets: [
        'Build 274: compositores de Classe de Armadura e Pontos de Vida em um só cartão (gatilhos ao recuperar PV, Estertores da Morte dentro de Mortalidade), ataques prontos corpo a corpo/à distância com arma ou magia, sugestões que continuam enquanto a fórmula é composta (biblioteca de 181 entradas, visível no Estúdio de Banco de Dados), pré-visualização só da ficha e listas agrupadas e coloridas.',
        'Calculadora de orçamento de XP (regras 2014 e 2024), ordenação determinística de iniciativa, adição em lote preservando o turno ativo e exportação/importação JSON/Markdown no Painel de Combate.',
        'Suporte ao modo Herói 2024 (Talentos de Origem e 8 propriedades de Maestria em Armas isolados do cálculo de ND), interface 100% localizada em pt-BR (1.134/1.134 chaves) e 100% de cobertura de ajuda.',
        'Importadores offline locais para JSON Foundry VTT Actor5e, Markdown Homebrewery v3/Legado e Improved Initiative com sanitização contra poluição de protótipo e XSS.',
        'Fluxo de impressão A4 multipágina com guias de quebra, alternância de Tema Claro WCAG AA do estúdio, redução de regras prioritárias de CSS (361 -> 310) e trava automática de tamanho de pacote JS.',
      ],
    },
  },
}

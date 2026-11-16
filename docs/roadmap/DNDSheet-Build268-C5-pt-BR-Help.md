# Build 268 — C5 round 1: pt-BR help, locale switch, coverage contract

Base `3deccf5` (Build 267).

## What shipped

| Piece | Detail |
|---|---|
| **Locale infrastructure** | `src/i18n/locale.ts` holds the supported locales (`en-US`, `pt-BR`), the fallback (`en-US`) and the persisted choice (`localStorage['app.locale']`, guarded). The boot reads the stored choice; untranslated keys fall back to English, and the per-key fallback warnings are silenced on purpose. |
| **Locale switch** | Stat block settings menu → **Idioma / Language** (English / Português). It applies instantly through vue-i18n's global `locale` and needs no reload. |
| **Editor help, 100 %** | `src/i18n/pt-BR/help.ts`: all 249 help texts. The type is derived from the English shape, so a missing or extra key fails the typecheck. |
| **Stat block help tips, 100 %** | `statblock-help.pt-BR.ts`: all 56 rendered-block tips (BS-33), typed `Record<StatblockHelpKey, string>`. `statblockHelpText(key, locale)` picks the active language, and `WebRenderer` passes the global locale. |
| **Coverage contract** | `test/core/I18nCoverage.test.ts` checks: no stale pt-BR keys; `{placeholders}` identical to English; `help.*` fully translated; no empty strings; overall coverage may only grow (floor 251 of 916 keys, 27.4 %). `StatblockHelpLocale.test.ts` checks key parity and the switch. |
| **Browser proof** | `test/locale-browser-smoke.mjs` (added to the shared browser suite, so it runs on SPA and Pages): open settings → click **Português** → locale `pt-BR`, stored `pt-BR`, help text in Portuguese, an untranslated label still English, 0 i18n warnings. |

## Translation choices (TTRPG accuracy)

- **Terms:** the Brazilian 5e edition's terminology — Classe de Armadura, Pontos de Vida, Dado de Vida, Teste de Resistência, Ação Bônus, Reação, Ações Lendárias, Nível de Desafio, Sangrando, Procurar/Estudar/Influenciar/Esconder, Disparada/Desengajar/Esquivar, Agarrado/Caído/Contido/Incapacitado/Invisível, Espaço de Magia, Truque, Pontos de Feitiçaria, Metamagia.
- **Distances:** given in metres as the Brazilian books do (5 ft. = 1,5 m; 10 ft. = 3 m; 30 ft. = 9 m; 60 ft. = 18 m).
- **Item weight:** stays in *libras*, because the app stores pounds.

## Decision

The switch is **opt-in**: no auto-detection from `navigator.language`. Most interface labels are still English (many are hard-coded in templates, not in i18n), so auto-switching would drop Portuguese-browser users into a half-translated UI they did not ask for. The in-menu hint says this plainly.

## Still open in C5 (groomed)

1. Move hard-coded template labels (`label="…"`, inline `v-help="'…'"`) into i18n keys. The Build 265 section components make this file by file.
2. Translate the remaining namespaces (`editor`, `monster`, `io`, `error`, catalog names…), raising `PT_BR_MIN_KEYS` each time.
3. Quasar's own component strings (`quasar/lang/pt-BR`) and a generated changelog (the C9 coupling).


**Gate:** 11/11, no retries; core 696/696 (+5); visual 104/104 identical (English stays the default).

# Build 224 - Random-Result Integration and Outcome Typography

Tag rc-2.4.3-build-224-random-result-integration-and-outcome-typography; source f547958; Pages e04a539; base 92adb83.

## Delivered
- randomTableId/random_table kind on ActionDescriptionRegion, ActionDescriptionContainer, AbilityOutcome (src/core/domain/types.ts, src/components/models.ts).
- random-table.ts: formatRandomTableAsHtml, diagnoseOutcomeRandomTables, resolveTableOutcome.
- description-containers.ts / outcome-rendering.ts / useProcessTokens.ts resolve linked tables into prose and HTML.
- Typography: no space before outcome colon; container distances normalized to `10 ft.`; 2024 ability grid header alignment and region landmark.
- H9: help entries random-tables, description-containers, outcome-layout, skill-actions.
- Tests: RandomOutcomeIntegration (7), AbilityGrammar (+2), StatblockHelp extended; 481 total.

## Limits
- A11.9 and H9 remain open (see backlog). `Attack +0` not applied: protected fuzz Step 50 asserts `Attack 0`.
- Fuzz Step 40 can flake after reload under heavy load (fixed 1200 ms pause); passed on rerun.

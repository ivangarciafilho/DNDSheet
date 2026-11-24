# Graph Report - dndsheet  (2026-11-24)

## Corpus Check
- 553 files · ~459,321 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .scss 11, .css 3, (none) 1)

## Summary
- 5772 nodes · 11606 edges · 253 communities (242 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 309 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ref_src
- ref_vue_i18n
- CalculateCr.ts
- ability-grammar.ts
- types.ts
- EmergencyMechanics.test.ts
- ref_vue
- useMonsterStore
- CatalogSelect.vue
- composer-chain.ts
- ExportStatblock.ts
- formula.ts
- LintMonster.ts
- creature-library.ts
- properties
- export-markdown.ts
- spell-plate.ts
- properties
- properties
- ClassCastingEditor.vue
- properties
- properties
- properties
- properties
- properties
- properties
- DndStat
- properties
- properties
- override
- override
- override
- override
- override
- properties
- override
- override
- MechanicTextEditor.vue
- properties
- CrAnnotationCard.vue
- properties
- properties
- AutoSyncSpellcasting.ts
- override
- properties
- useA4LayerStudioState.ts
- document-envelope.ts
- properties
- FormulaField.vue
- CreatureLibraryDialog.vue
- ref_node_child_process
- species-and-heuristics.ts
- type
- override
- override
- override
- ref_node_assert
- properties
- properties
- properties
- properties
- classifyStorageError
- type
- type
- type
- type
- type
- ref_node_fs
- casting-source-selection.ts
- properties
- publish.mjs
- MonsterAction
- basics-catalogs.ts
- LocalStorageAdapter
- enumerations.ts
- foundry-import.ts
- type
- field-types.ts
- ref_node_path
- ImportButton.vue
- speeds-traversal.ts
- Budgets.test.ts
- RoleHeaderEditor.vue
- defaultMonster
- encounter-budget.ts
- ref_node_test
- spellcasting-metrics.ts
- macro-catalog.ts
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- BuiltInMacroLibrary.vue
- WorkspacePresetsAndSections.test.ts
- monster-bindings.ts
- CastingSourceSpellRows.vue
- properties
- ActionAssociations.vue
- outcome-graph.ts
- export-contract.ts
- export-markup.ts
- useBasicsContext.ts
- trait-composer.ts
- spellcasting
- spellcasting
- visual-diff.mjs
- CalculateCr.test.ts
- action-composer.ts
- Character2024.test.ts
- useActionsEditorState.ts
- BindingsAndScaling.test.ts
- usePlateEntries.ts
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- SpellcastingEditor.vue
- casting-projection.ts
- useSkillsEditorState.ts
- resolveMonsterBindings
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- CastingLearningContributionEditor.vue
- CombatTracker.ts
- en-US/index.ts
- DndAttack
- IndexedDbAutosave.ts
- spellcasting
- attack-composer.ts
- EntryDisplaySettings.vue
- importer-utils.ts
- spellcasting
- DefensesSection.vue
- AcRidersEditor.vue
- multiattack-composer.ts
- BindingDependencies.test.ts
- HistoryLedger
- CR.ts
- HomebreweryImport.test.ts
- RandomTablesEditor.vue
- RulesConversionDialog.vue
- parseTokens
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- inventory.mjs
- FocusedHelpBar.vue
- CastingFeatureGrantsEditor.vue
- action-templates.ts
- reference-sources.ts
- initiative-composer.ts
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- retirement-render-parity.mjs
- setFeedback
- number-grammar.ts
- SCHEMA.ts
- package.json
- LanguageEntryList.vue
- ParagonSection.vue
- statblock-help.ts
- safe-html.ts
- a4-pagination.ts
- sync-release.mjs
- properties
- properties
- properties
- properties
- properties
- properties
- properties
- Character2024Section.vue
- TraitCadenceEditor.vue
- useFileLoader.ts
- standard
- standard
- standard
- standard
- standard
- standard
- standard
- standard
- standard
- standard
- standard
- spells-v1.json
- casting-source-list.ts
- closeDialog
- AttackPresets.test.ts
- properties
- properties
- SectionStrip.vue
- structured-attack.ts
- inspect-statblock.js
- DefenseScheduleFields.vue
- asset-url.ts
- items
- items
- spells-v2.json
- safeFileName
- ParagonPools.test.ts
- skill
- skill
- skill
- 5emm-v5.json
- skill
- 5emm-v6.json
- skill
- 5emm-v7.json
- skill
- skill
- skill
- QA helpers
- 5emm-v10.json
- 5emm-v11.json
- env.d.ts
- raw-loader.d.ts
- MOVEMENT.ts

## God Nodes (most connected - your core abstractions)
1. `Monster` - 94 edges
2. `DndStat` - 58 edges
3. `migrateMonsterSchema()` - 55 edges
4. `useMonsterStore` - 41 edges
5. `MonsterAction` - 40 edges
6. `defaultMonster()` - 39 edges
7. `statModifier()` - 38 edges
8. `markdownOf()` - 35 edges
9. `useTextRenderer()` - 32 edges
10. `useProcessTokens()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `render()`  [INFERRED]
  src/components/editor/MechanicTextEditor.vue → test/core/OutcomePresentationSafety.test.ts
- `setup()` --calls--> `value()`  [INFERRED]
  src/components/editor/composer/AttackComposer.vue → test/core/Formula.test.ts
- `setup()` --calls--> `library`  [INFERRED]
  src/components/editor/composer/MultiattackComposer.vue → test/core/MultiattackComposer.test.ts
- `fixture()` --calls--> `defaultMonster()`  [EXTRACTED]
  test/core/ActionAssociations.test.ts → src/core/domain/monster-defaults.ts
- `monster()` --calls--> `defaultMonster()`  [EXTRACTED]
  test/core/ResolveMonsterText.test.ts → src/core/domain/monster-defaults.ts

## Import Cycles
- 2-file cycle: `src/core/domain/ability-types.ts -> src/core/domain/types.ts -> src/core/domain/ability-types.ts`
- 2-file cycle: `src/core/domain/ac-and-defenses.ts -> src/core/domain/defense-and-traits-utils.ts -> src/core/domain/ac-and-defenses.ts`
- 2-file cycle: `src/core/usecases/ExportStatblock.ts -> src/core/usecases/export-html.ts -> src/core/usecases/ExportStatblock.ts`
- 2-file cycle: `src/core/usecases/ExportStatblock.ts -> src/core/usecases/export-markdown.ts -> src/core/usecases/ExportStatblock.ts`
- 2-file cycle: `src/core/domain/encounter-types.ts -> src/core/domain/types.ts -> src/core/domain/encounter-types.ts`
- 2-file cycle: `src/core/domain/monster-defaults.ts -> src/core/domain/types.ts -> src/core/domain/monster-defaults.ts`
- 3-file cycle: `src/core/usecases/ExportStatblock.ts -> src/core/usecases/export-html.ts -> src/core/usecases/export-markdown.ts -> src/core/usecases/ExportStatblock.ts`

## Communities (253 total, 11 thin omitted)

### Community 0 - "ref_src"
Cohesion: 0.04
Nodes (32): SAMPLE_AI_STATBLOCK_ARCHMAGE, SAMPLE_AI_STATBLOCK_DRAGON, setup(), batchCount, budget, combatStore, difficultyColor, fileInput (+24 more)

### Community 1 - "ref_vue_i18n"
Cohesion: 0.10
Nodes (44): setup(), ADV_GLYPH, advHtml(), condHtml(), escapeHtml(), htmlToText(), numHtml(), listJoin() (+36 more)

### Community 2 - "CalculateCr.ts"
Cohesion: 0.07
Nodes (62): CR, CR_SELECT, CrTier, getCrByAc(), getCrByAttack(), getCrByDamage(), getCrByDc(), getCrByHp() (+54 more)

### Community 3 - "ability-grammar.ts"
Cohesion: 0.06
Nodes (60): abilityHeader(), abilityIdentity(), AbilityMarkup, AbilityProjection, AbilityRenderContext, agreeNoun(), areaPhrase(), ATTACK_SOURCES (+52 more)

### Community 4 - "types.ts"
Cohesion: 0.06
Nodes (55): setup(), RollScalingSpec, BASIC_RIDER_CADENCE_ENTRIES, BASIC_RIDER_CADENCES, BASIC_RIDER_TIMING_ENTRIES, BASIC_RIDER_TIMINGS, BasicRider, BasicRiderScope (+47 more)

### Community 5 - "EmergencyMechanics.test.ts"
Cohesion: 0.08
Nodes (50): buildCrBreakdownSummary(), CrBreakdownInput, CrBreakdownSummary, addRegionToContainer(), descriptionContainersHtml(), descriptionContainersText(), diagnoseDiceTable(), DiceTableDiagnostics (+42 more)

### Community 6 - "ref_vue"
Cohesion: 0.05
Nodes (21): setup(), setup(), Dynamics, setup(), useA4Composition(), DefenseRow, STATBLOCK_BODY, StatblockBodyView (+13 more)

### Community 7 - "useMonsterStore"
Cohesion: 0.08
Nodes (33): setup(), setup(), popFileDialog(), useHistoryShortcuts(), setup(), setup(), bindingRuntimeFor(), installMonsterBindings() (+25 more)

### Community 8 - "CatalogSelect.vue"
Cohesion: 0.06
Nodes (38): setup(), setup(), setup(), setup(), setup(), setup(), setup(), setup() (+30 more)

### Community 9 - "composer-chain.ts"
Cohesion: 0.10
Nodes (47): setup(), ABILITY_NAMES, abilityHeadOrder(), AbilityArea, ActionEffect, RangeSpec, ComposerEditor, ComposerRow (+39 more)

### Community 10 - "ExportStatblock.ts"
Cohesion: 0.09
Nodes (44): setup(), innateCastingContext(), resolveCastingAbility(), CharacterVitalProjection, characterVitals(), characterVitalText(), SpellcastingPlacement, renderBonus() (+36 more)

### Community 11 - "formula.ts"
Cohesion: 0.09
Nodes (45): ABILITIES, add(), averageOf(), collapse(), DiceTerm, diceValue(), evaluateFormula(), flatValue() (+37 more)

### Community 12 - "LintMonster.ts"
Cohesion: 0.08
Nodes (43): setup(), setup(), DndSpell, applyCheckSessionRepairs(), CheckSession, CheckStatus, createCheckSession(), ExportPolicyDecision (+35 more)

### Community 13 - "creature-library.ts"
Cohesion: 0.09
Nodes (29): AsyncKvStore, entriesCount(), MigrationReport, MonsterRepository, RepositoryIndexState, RestoreResult, SaveResult, BackupValidationResult (+21 more)

### Community 14 - "properties"
Cohesion: 0.04
Nodes (48): type, type, type, type, type, type, type, type (+40 more)

### Community 15 - "export-markdown.ts"
Cohesion: 0.11
Nodes (37): aliases, CadenceDefinition, cadenceDefinition(), cadenceOptions(), CADENCES, formatLimitedUses(), computeTraitTag(), DEATH_RULE_ALIASES (+29 more)

### Community 16 - "spell-plate.ts"
Cohesion: 0.11
Nodes (40): CADENCE_LABELS, CADENCE_OPTIONS, cadenceLabel(), CadenceOption, RESOURCE_REFRESH_OPTIONS, getMetamagicOption(), METAMAGIC_OPTIONS, metamagicCost() (+32 more)

### Community 17 - "properties"
Cohesion: 0.04
Nodes (46): type, type, type, type, type, type, type, type (+38 more)

### Community 18 - "properties"
Cohesion: 0.05
Nodes (46): items, type, items, type, type, type, type, type (+38 more)

### Community 19 - "ClassCastingEditor.vue"
Cohesion: 0.07
Nodes (43): addSource(), applyExpandedSpells(), autoValue(), castingClassOptions, castingStatOptions, changeClass(), combinedLevel, editor (+35 more)

### Community 20 - "properties"
Cohesion: 0.05
Nodes (44): type, type, type, items, type, type, items, type (+36 more)

### Community 21 - "properties"
Cohesion: 0.05
Nodes (44): type, type, type, items, type, type, items, type (+36 more)

### Community 22 - "properties"
Cohesion: 0.05
Nodes (44): type, type, type, items, type, type, items, type (+36 more)

### Community 23 - "properties"
Cohesion: 0.05
Nodes (44): type, type, type, items, type, type, items, type (+36 more)

### Community 24 - "properties"
Cohesion: 0.05
Nodes (44): items, type, items, type, type, type, type, type (+36 more)

### Community 25 - "properties"
Cohesion: 0.05
Nodes (44): items, type, items, type, type, type, type, type (+36 more)

### Community 26 - "DndStat"
Cohesion: 0.09
Nodes (41): cloneRoutingEntries(), COMBAT_ACTIVITY_SECTIONS, CombatActivityRoutingEntry, CombatActivityRoutingState, CombatActivitySection, CombatSkillGroupId, computeSkillGroupLayout(), createCombatActivityRoutingState() (+33 more)

### Community 27 - "properties"
Cohesion: 0.05
Nodes (43): type, type, type, type, type, type, type, type (+35 more)

### Community 28 - "properties"
Cohesion: 0.05
Nodes (43): type, type, type, type, type, type, type, type (+35 more)

### Community 29 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 30 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 31 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 32 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 33 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 34 - "properties"
Cohesion: 0.05
Nodes (42): items, type, items, type, type, type, type, type (+34 more)

### Community 35 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 36 - "override"
Cohesion: 0.08
Nodes (42): properties, type, properties, type, properties, type, properties, type (+34 more)

### Community 37 - "MechanicTextEditor.vue"
Cohesion: 0.07
Nodes (28): setup(), groups, add(), emit, nextListId(), optionId(), syncComboboxAria(), setup() (+20 more)

### Community 38 - "properties"
Cohesion: 0.05
Nodes (41): type, type, type, type, type, type, type, type (+33 more)

### Community 39 - "CrAnnotationCard.vue"
Cohesion: 0.07
Nodes (30): hpGroup, legacySplit, monster, props, rows, { autoUpdateCr }, index, initializeCr() (+22 more)

### Community 40 - "properties"
Cohesion: 0.05
Nodes (40): items, type, items, type, type, type, type, type (+32 more)

### Community 41 - "properties"
Cohesion: 0.05
Nodes (40): items, type, items, type, type, type, type, type (+32 more)

### Community 42 - "AutoSyncSpellcasting.ts"
Cohesion: 0.08
Nodes (36): subclassEntries(), getSpellMetadata(), getSpellTagString(), SpellMetadata, SRD_SPELL_METADATA, autoSyncSpellcasting(), CASTER_PROGRESSIONS, CasterProgressionDefinition (+28 more)

### Community 43 - "override"
Cohesion: 0.08
Nodes (39): properties, type, properties, type, properties, type, properties, type (+31 more)

### Community 44 - "properties"
Cohesion: 0.05
Nodes (39): type, type, type, type, type, type, type, type (+31 more)

### Community 45 - "useA4LayerStudioState.ts"
Cohesion: 0.08
Nodes (27): setup(), A4LayerStudioState, injectA4LayerStudioState(), KEY, provideA4LayerStudioState(), ADR-0003, useA4LayerStudioState(), setup() (+19 more)

### Community 46 - "document-envelope.ts"
Cohesion: 0.09
Nodes (27): MetamagicOption, RulesEdition, canonicalDocumentFingerprint(), createDocumentId(), createDocumentSessionTracker(), deriveDocumentProvenance(), DocumentEnvelope, DocumentRevisionRecordOptions (+19 more)

### Community 47 - "properties"
Cohesion: 0.06
Nodes (38): items, type, items, type, type, type, type, type (+30 more)

### Community 48 - "FormulaField.vue"
Cohesion: 0.07
Nodes (32): preview, applied(), cancel(), checkDraft(), closeRefSuggest(), commitDraft(), disabled, display (+24 more)

### Community 49 - "CreatureLibraryDialog.vue"
Cohesion: 0.05
Nodes (30): backendLabel, confirmPurgeId, editingOrganizeId, editingRenameId, feedbackIsError, feedbackMessage, filteredRows, folderDraft (+22 more)

### Community 50 - "ref_node_child_process"
Cohesion: 0.10
Nodes (20): chrome, profile, CHROME_PATH, runFuzz(), evalInPage(), sendCdp(), chromeProc, chrome (+12 more)

### Community 51 - "species-and-heuristics.ts"
Cohesion: 0.09
Nodes (31): AppliedGrantRecord, applyProposal(), calculatePointBuySpent(), cancelProposal(), createMulberry32(), deepCloneProposalMonster(), isPathBound(), MONSTER_ROLE_ARCHETYPES (+23 more)

### Community 52 - "type"
Cohesion: 0.06
Nodes (36): items, type, items, type, items, type, case, effect (+28 more)

### Community 53 - "override"
Cohesion: 0.09
Nodes (36): properties, type, properties, type, properties, type, properties, type (+28 more)

### Community 54 - "override"
Cohesion: 0.09
Nodes (36): properties, type, properties, type, properties, type, properties, type (+28 more)

### Community 55 - "override"
Cohesion: 0.09
Nodes (36): properties, type, properties, type, properties, type, properties, type (+28 more)

### Community 56 - "ref_node_assert"
Cohesion: 0.14
Nodes (7): seraph, PAPER_POINTS, ids, rows, themes, browserProbe(), freePort()

### Community 57 - "properties"
Cohesion: 0.06
Nodes (35): items, type, items, type, properties, type, type, type (+27 more)

### Community 58 - "properties"
Cohesion: 0.06
Nodes (35): items, type, items, type, properties, type, type, type (+27 more)

### Community 59 - "properties"
Cohesion: 0.06
Nodes (35): items, type, items, type, properties, type, type, type (+27 more)

### Community 60 - "properties"
Cohesion: 0.06
Nodes (35): type, type, type, type, type, type, type, type (+27 more)

### Community 61 - "classifyStorageError"
Cohesion: 0.12
Nodes (7): IndexedDbStorageAdapter, IndexedDbKvStore, selectRepositoryBackend(), classifyStorageError(), MonsterSummary, StorageFailureError, StoragePort

### Community 62 - "type"
Cohesion: 0.06
Nodes (34): items, type, items, type, type, items, type, items (+26 more)

### Community 63 - "type"
Cohesion: 0.06
Nodes (34): items, type, items, type, type, items, type, items (+26 more)

### Community 64 - "type"
Cohesion: 0.06
Nodes (34): items, type, items, type, type, items, type, items (+26 more)

### Community 65 - "type"
Cohesion: 0.06
Nodes (34): items, type, items, type, type, items, type, items (+26 more)

### Community 66 - "type"
Cohesion: 0.06
Nodes (34): items, type, items, type, type, items, type, items (+26 more)

### Community 67 - "ref_node_fs"
Cohesion: 0.06
Nodes (23): [, controls, tipped], FLOOR, report, row, walk(), RETIRED, walk(), dupes (+15 more)

### Community 68 - "casting-source-selection.ts"
Cohesion: 0.17
Nodes (28): granted(), CastingSpellOption, normalizeCastingSpellGrants(), replaceSourceLevelSpells(), sourceAssignedAtLevel(), sourceCapacityReference(), sourceEffectiveSpells(), sourceGrantedSpells() (+20 more)

### Community 69 - "properties"
Cohesion: 0.06
Nodes (33): items, type, items, type, properties, type, type, type (+25 more)

### Community 70 - "publish.mjs"
Cohesion: 0.07
Nodes (23): BUNDLE_BUDGETS, checkBundleBudgets(), args, bundle, env, index, index2, meta (+15 more)

### Community 71 - "MonsterAction"
Cohesion: 0.13
Nodes (25): UnifiedEntry, AbilityNumber, AdditionalAttackDamage, DndAtWillSpell, EffectClause, LairAction, LegendaryAction, MonsterAction (+17 more)

### Community 72 - "basics-catalogs.ts"
Cohesion: 0.11
Nodes (27): AC_BASE_ENTRIES, AC_DEFENSIVE_MECHANIC_ENTRIES, ALL_LANGUAGE_SORTED, BLOODIED_SOURCE_ENTRIES, BURST_TARGET_FILTER_ENTRIES, CR_ENTRIES, DEATH_EXCEPTION_ENTRIES, DEATH_PREVENTION_RULE_ENTRIES (+19 more)

### Community 73 - "LocalStorageAdapter"
Cohesion: 0.11
Nodes (6): LocalStorageAdapter, MemoryStorageBackend, StorageBackend, BackendKvStore, SelectBackendOptions, FailingQuotaBackend

### Community 74 - "enumerations.ts"
Cohesion: 0.09
Nodes (23): CANONICAL_CONDITIONS, CANONICAL_DAMAGE_TYPES, CANONICAL_ROLES, CANONICAL_SCHOOLS, CANONICAL_SENSES, CANONICAL_SKILLS, CANONICAL_TOOLS, CREATURE_TYPE_GROUPS (+15 more)

### Community 75 - "foundry-import.ts"
Cohesion: 0.20
Nodes (28): isPlainRecord(), extractTraitList(), FOUNDRY_SKILLS, importFoundryActor(), looksLikeFoundryActor(), OfflineImportFailure, OfflineImportResult, OfflineImportSuccess (+20 more)

### Community 76 - "type"
Cohesion: 0.06
Nodes (31): items, type, items, type, type, items, type, items (+23 more)

### Community 77 - "field-types.ts"
Cohesion: 0.10
Nodes (26): options, NumericFieldInspection, burstActive, deathActive, dice, eq(), fields, freezeGate() (+18 more)

### Community 78 - "ref_node_path"
Cohesion: 0.11
Nodes (19): BROWSER_SUITE, failed, inputFingerprint, MIME, OUT, results, summary, GATE_STEPS (+11 more)

### Community 79 - "ImportButton.vue"
Cohesion: 0.08
Nodes (21): count, importDialog, importInvalid, { importOpen5eMonster }, { importRawTextStatblock, loadFile }, loading, loadingData, monsterResults (+13 more)

### Community 80 - "speeds-traversal.ts"
Cohesion: 0.12
Nodes (23): composePermutableAcString(), formatAcAttackerSave(), formatPermutableAcClause(), PermutableAcAttackerSave, PermutableAcCondition, composeHpSurvivalString(), formatHpSurvivalRule(), HpSurvivalRule (+15 more)

### Community 81 - "Budgets.test.ts"
Cohesion: 0.11
Nodes (21): effectiveAllowCustom, filteredOptions, normalizedOptions, ALPHA_COLLATOR, asArray(), buildCatalogOptions(), BuildCatalogOptionsConfig, CatalogOption (+13 more)

### Community 82 - "RoleHeaderEditor.vue"
Cohesion: 0.10
Nodes (24): apply(), draft, error, fields, monster, numericDraftPending, numericDraftVersion, numericModel (+16 more)

### Community 83 - "defaultMonster"
Cohesion: 0.18
Nodes (23): ActionComposerRole, copyEntryBindings(), EntryBindingMap, entryBindingPrefix(), NumericBinding, defaultAction(), defaultCrAnnotation(), defaultMonster() (+15 more)

### Community 84 - "encounter-budget.ts"
Cohesion: 0.11
Nodes (25): BUDGETS_2024, buildEncounterMarkdown(), buildEncounterSummaryJson(), calculateEncounterBudget(), clampLevel(), CR_XP_MAP, crToXp(), deepSanitizeValue() (+17 more)

### Community 85 - "ref_node_test"
Cohesion: 0.15
Nodes (10): isMultitarget(), characterProficiency(), stabilizeOutcomeIds(), CURRENT_MONSTER_VERSION, migrateMonsterSchema(), ctx, createMinimalMonster(), createSampleMonster() (+2 more)

### Community 86 - "spellcasting-metrics.ts"
Cohesion: 0.09
Nodes (21): sourceCaption, ARTIFICER_SLOTS, CLASS_DEFAULT_STAT, FULL_CASTER_SLOTS, HALF_CASTER_2024_SLOTS, HALF_CASTER_SLOTS, SRD_2024_PREPARED_TABLES, THIRD_CASTER_SLOTS (+13 more)

### Community 87 - "macro-catalog.ts"
Cohesion: 0.10
Nodes (25): draftEl(), onDraftInput(), AREAS, catalogFor(), CatalogOptions, CHARACTER_GROUPS, CONDITIONS, CONTEXT (+17 more)

### Community 88 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 89 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 90 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 91 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 92 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 93 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 94 - "properties"
Cohesion: 0.07
Nodes (27): items, type, type, type, type, type, type, type (+19 more)

### Community 95 - "BuiltInMacroLibrary.vue"
Cohesion: 0.09
Nodes (19): activeKinds, copyEntry(), filtered, KINDS, $q, search, options(), emit (+11 more)

### Community 96 - "WorkspacePresetsAndSections.test.ts"
Cohesion: 0.12
Nodes (21): setup(), applyWorkspacePreset(), detectActiveWorkspacePreset(), getPrintPresetMarginBounds(), PrintPresetMarginBounds, resolveEffectivePresentationPreset(), WORKSPACE_PRESETS, WorkspacePresentationSlice (+13 more)

### Community 97 - "monster-bindings.ts"
Cohesion: 0.16
Nodes (17): inspectNumericField(), forbidden, NumericFieldPathError, NumericFieldSegment, ownValue(), parseNumericFieldPath(), readNumericFieldPath(), readOptionalNumericFieldPath() (+9 more)

### Community 98 - "CastingSourceSpellRows.vue"
Cohesion: 0.09
Nodes (21): actionOptions, assigned(), bonusMap, cadenceMap, emit, flags(), levelMap, levels (+13 more)

### Community 99 - "properties"
Cohesion: 0.09
Nodes (25): properties, type, properties, type, type, properties, type, properties (+17 more)

### Community 100 - "ActionAssociations.vue"
Cohesion: 0.12
Nodes (21): add(), apply(), catalogEntries, choices, emit, members, missing(), monster (+13 more)

### Community 101 - "outcome-graph.ts"
Cohesion: 0.26
Nodes (21): setup(), cloneAuthoredValue(), cloneOutcomeList(), commandTarget(), duplicateOutcomeById(), idOf(), KNOWN, moveOutcomeById() (+13 more)

### Community 102 - "export-contract.ts"
Cohesion: 0.13
Nodes (19): acTriggerEffectText(), composeAcAndDefenses(), formatRiderSchedule(), evaluateExportPolicy(), AcComposedResult, Build269ParityReport, buildExportResult(), detectMonsterExportOmissions() (+11 more)

### Community 103 - "export-markup.ts"
Cohesion: 0.13
Nodes (19): BLOCK_TAGS, creatureTypeLine(), decodeEntities(), Emphasis, EMPHASIS, ENTITIES, escapeLatexText(), escapeText() (+11 more)

### Community 104 - "useBasicsContext.ts"
Cohesion: 0.14
Nodes (15): {
  statKeys,
  updateStat,
  pointBuyInfo,
  roleArchetypes,
  applyStandardArray,
  applyAllStats,
  applyArchetype,
}, {
  monster,
  editorStore,
  selectedSpecies,
  portrait,
  portraitFile,
  openLayerStudio,
  onSpeciesSelected,
  onPortraitFileSelected,
}, {
  monster,
  availableLanguageEntries,
  showManualLangEdit,
  syncLanguagesToString,
  onLanguageSelected,
}, AC_SECONDARY_MODES, BASICS_CONTEXT_KEY, BasicsContext, createBasicsContext(), provideBasicsContext() (+7 more)

### Community 105 - "trait-composer.ts"
Cohesion: 0.20
Nodes (18): phaseOptions, phaseOptions, actionRecharge(), ActionUsageDraft, actionUsageDraft(), actionUsagePatch(), UsageAction, validateActionUsage() (+10 more)

### Community 106 - "spellcasting"
Cohesion: 0.09
Nodes (23): items, type, items, type, properties, type, actions, spellcasting (+15 more)

### Community 107 - "spellcasting"
Cohesion: 0.09
Nodes (23): items, type, items, type, properties, type, actions, spellcasting (+15 more)

### Community 108 - "visual-diff.mjs"
Cohesion: 0.10
Nodes (16): entries, EXCLUDE, files, lines, [staged, rcDir, jsonSource], walk(), [baseUrl, candUrl, outDir, portArg = '9261'], capture() (+8 more)

### Community 109 - "CalculateCr.test.ts"
Cohesion: 0.09
Nodes (17): __dirname, __filename, projectRoot, templatesDir, __dirname, __filename, projectRoot, spells (+9 more)

### Community 110 - "action-composer.ts"
Cohesion: 0.10
Nodes (20): actionChain, AREA_SHAPES, COMPONENT_TAGS, COMPOSER_ROW_ORDER, DAMAGE_TYPES, DISCIPLINES, DURATIONS, lairChain (+12 more)

### Community 111 - "Character2024.test.ts"
Cohesion: 0.17
Nodes (18): CharacterOriginFeat, CharacterProvenance, CharacterRuleset, characterRuleset(), CharacterWeaponMastery, normalizeCharacter2024Fields(), ORIGIN_FEAT_SUGGESTIONS, VALID_MASTERIES (+10 more)

### Community 112 - "useActionsEditorState.ts"
Cohesion: 0.13
Nodes (12): setup(), ActionsEditorState, injectActionsEditorState(), KEY, provideActionsEditorState(), ADR-0003, useActionsEditorState(), setup() (+4 more)

### Community 113 - "BindingsAndScaling.test.ts"
Cohesion: 0.21
Nodes (18): setup(), AttackRollMode, RollScalingSource, RollScalingTier, FULL_DAMAGE_TRIGGERS, structuredOutcomeDamage(), FormulaContext, hasRollScaling() (+10 more)

### Community 114 - "usePlateEntries.ts"
Cohesion: 0.21
Nodes (18): boldNumbers(), helpKey(), phaseLabel(), plainTextLength(), plateBodyHtml(), PlateCell, plateCellHtml(), plateHtml() (+10 more)

### Community 115 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 116 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 117 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 118 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 119 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 120 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 121 - "properties"
Cohesion: 0.10
Nodes (21): items, type, type, properties, type, properties, type, type (+13 more)

### Community 122 - "SpellcastingEditor.vue"
Cohesion: 0.12
Nodes (12): setup(), metadata, props, isActive(), monster, quasar, showFilterPanel, toggleCadence() (+4 more)

### Community 123 - "casting-projection.ts"
Cohesion: 0.20
Nodes (15): combined, buildCastingProjection(), CastingProjectionOptions, isRestrictedSpell(), preparationLabel(), preparedSpellCount(), RESTRICTED_SPELL_CADENCES, castingResourceSummary() (+7 more)

### Community 124 - "useSkillsEditorState.ts"
Cohesion: 0.17
Nodes (15): setup(), setup(), setup(), injectSkillsEditorState(), KEY, provideSkillsEditorState(), SKILL_ICONS, SKILL_SCOPE_META (+7 more)

### Community 125 - "resolveMonsterBindings"
Cohesion: 0.18
Nodes (15): canFormat, presentation, abilityModifier(), buildFormulaContext(), formulaContextForMonster(), overrideOf(), clearMonsterBinding(), clone() (+7 more)

### Community 126 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 127 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 128 - "properties"
Cohesion: 0.10
Nodes (20): items, type, type, type, type, type, atWill, atWillNotes (+12 more)

### Community 129 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 130 - "properties"
Cohesion: 0.10
Nodes (20): items, type, type, type, type, type, atWill, atWillNotes (+12 more)

### Community 131 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 132 - "properties"
Cohesion: 0.10
Nodes (20): items, type, type, type, type, type, atWill, atWillNotes (+12 more)

### Community 133 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 134 - "properties"
Cohesion: 0.10
Nodes (20): items, type, type, type, type, type, atWill, atWillNotes (+12 more)

### Community 135 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 136 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 137 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 138 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 139 - "properties"
Cohesion: 0.12
Nodes (20): properties, type, type, properties, type, type, properties, type (+12 more)

### Community 140 - "CastingLearningContributionEditor.vue"
Cohesion: 0.16
Nodes (17): emit, multiplier, patch(), props, setMultiplier(), targets, toggle(), categories (+9 more)

### Community 141 - "CombatTracker.ts"
Cohesion: 0.25
Nodes (17): addCombatantPreserveTurn(), advanceTurn(), applyDamage(), applyHealing(), baseCombatantName(), batchAddCombatantsPreserveTurn(), CombatantSourceMeta, createCombatantFromCharacter() (+9 more)

### Community 142 - "en-US/index.ts"
Cohesion: 0.15
Nodes (10): HELP_MESSAGES, HelpMessages, STUDIO_MESSAGES, HELP_MESSAGES_PT_BR, Translated, STUDIO_MESSAGES_PT_BR, enKeys, leaves() (+2 more)

### Community 143 - "DndAttack"
Cohesion: 0.16
Nodes (11): DndAttack, ActionTemplate, AttackTemplate, ReactionTemplate, RemoveId, TemplateMetadata, TraitTemplate, DEFAULT_TEMPLATE_ICON (+3 more)

### Community 144 - "IndexedDbAutosave.ts"
Cohesion: 0.17
Nodes (9): clearOverflowSnapshot(), indexedDbSnapshots, LARGE_SNAPSHOT_KEYS, openSnapshots(), transact(), createGuardedStorage(), StorageLike, createOverflowStorage() (+1 more)

### Community 145 - "spellcasting"
Cohesion: 0.13
Nodes (17): items, type, type, properties, type, actions, count, spellcasting (+9 more)

### Community 146 - "attack-composer.ts"
Cohesion: 0.32
Nodes (13): setup(), ComposerCellSpec, attackExtraPrefix(), AttackField, attackFields(), attackNumericFieldPath(), attackPatch(), attackValue() (+5 more)

### Community 147 - "EntryDisplaySettings.vue"
Cohesion: 0.13
Nodes (15): action, { autoUpdateCr }, availablePools, entry, index, initializeCr(), monster, phaseRoot (+7 more)

### Community 148 - "importer-utils.ts"
Cohesion: 0.20
Nodes (14): addParsedActionOrAttack(), SKILL_TABLE, STAT_LIST, defaultAttack(), ParsedOpen5eActionHeader, ParsedOpen5eAdditionalDamage, ParsedOpen5eAttackDamage, ParsedOpen5eAttackHeader (+6 more)

### Community 149 - "spellcasting"
Cohesion: 0.15
Nodes (15): items, type, properties, type, actions, spellcasting, items, type (+7 more)

### Community 150 - "DefensesSection.vue"
Cohesion: 0.14
Nodes (13): AC_ABILITY_BONUS_ENTRIES, AC_CONDITIONAL_ENTRIES, AC_DEFENSE_ITEM_ENTRIES, AC_TEMPORARY_ENTRIES, ATTACK_TYPE_ENTRIES, FULL_ABILITY_NAME_ENTRIES, LIGHT_LEVEL_ENTRIES, ON_SAVE_FAILURE_ENTRIES (+5 more)

### Community 151 - "AcRidersEditor.vue"
Cohesion: 0.21
Nodes (12): addRider(), custom, emit, HIT_EFFECTS, MISS_EFFECTS, monster, patch(), removeRider() (+4 more)

### Community 152 - "multiattack-composer.ts"
Cohesion: 0.24
Nodes (10): setup(), Multiattack, countMultiattackReferences(), MultiattackReference, multiattackReferencePatch(), multiattackReferences(), ReferenceEdit, ReferenceKind (+2 more)

### Community 153 - "BindingDependencies.test.ts"
Cohesion: 0.28
Nodes (10): bindingGraph(), BindingGraphError, bindingSource(), cyclicGroups(), dependencyOrder(), describeBinding(), detectCycles(), isNumericBinding() (+2 more)

### Community 155 - "CR.ts"
Cohesion: 0.23
Nodes (11): CR, CR_SELECT, getCrByAc(), getCrByAttack(), getCrByDamage(), getCrByDc(), getCrByHp(), getCrByNumber() (+3 more)

### Community 156 - "HomebreweryImport.test.ts"
Cohesion: 0.17
Nodes (8): looksLikeHomebreweryMarkdown(), foundryGolden, schemaV11, hbLegacyGolden, hbV3Golden, schemaV11, iiGolden, schemaV11

### Community 157 - "RandomTablesEditor.vue"
Cohesion: 0.17
Nodes (7): history, importId, importOpen, importTable, importText, monster, tables

### Community 158 - "RulesConversionDialog.vue"
Cohesion: 0.18
Nodes (10): applyConversion(), editorStore, emit, monsterStore, props, $q, report, { t } (+2 more)

### Community 159 - "parseTokens"
Cohesion: 0.27
Nodes (11): editDistance(), FormulaError, groupOrder(), parseTokens(), atom(), dice(), expr(), term() (+3 more)

### Community 160 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 161 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 162 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 163 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 164 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 165 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 166 - "properties"
Cohesion: 0.17
Nodes (12): properties, type, acModifier, automatic, crAnnotation, ehpModifier, ehpMultiplier, include (+4 more)

### Community 167 - "inventory.mjs"
Cohesion: 0.17
Nodes (9): CONTROLS, files, numbers, out, perFile, tippedTotal, total, unclassified (+1 more)

### Community 168 - "FocusedHelpBar.vue"
Cohesion: 0.22
Nodes (5): activeLabel, activeText, resolveControlLabel(), syncFromEvent(), routes

### Community 169 - "CastingFeatureGrantsEditor.vue"
Cohesion: 0.18
Nodes (9): allSpellEntries, kind, kinds, minLevel, origin, origins, props, spell (+1 more)

### Community 170 - "action-templates.ts"
Cohesion: 0.24
Nodes (5): ACTION_TEMPLATES, ActionTemplate, applyActionTemplate(), cloneTemplateValue(), TEMPLATE_OWNED_FIELDS

### Community 171 - "reference-sources.ts"
Cohesion: 0.27
Nodes (6): abilities, referenceSourcesForMonster(), validOverride(), FORMULA_REFS, MACRO_CATALOG, openMacroAt()

### Community 172 - "initiative-composer.ts"
Cohesion: 0.25
Nodes (9): ComposableInitiativeRider, formatInitiativeRider(), formatInitiativeRiders(), INITIATIVE_ACTION_TYPE_OPTIONS, INITIATIVE_ADV_MODE_OPTIONS, InitiativeActionType, InitiativeAdvantageMode, STANDARD_CREATURE_TYPE_OPTIONS (+1 more)

### Community 173 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 174 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 175 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 176 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 177 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 178 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 179 - "properties"
Cohesion: 0.18
Nodes (11): properties, type, type, preamble, triggerDescription, triggerName, triggerRecharge, mythicActions (+3 more)

### Community 180 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 181 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 182 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 183 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 184 - "properties"
Cohesion: 0.18
Nodes (11): type, type, blindsight, darkvision, senses, tremorsense, truesight, properties (+3 more)

### Community 185 - "properties"
Cohesion: 0.18
Nodes (11): type, type, properties, type, type, type, custom, damage (+3 more)

### Community 186 - "retirement-render-parity.mjs"
Cohesion: 0.22
Nodes (10): [beforeUrl, afterUrl], CHROME_PORTS, edge, fixtures, migrated(), plates, problems, project() (+2 more)

### Community 187 - "setFeedback"
Cohesion: 0.20
Nodes (10): duplicateRow(), handleCreate(), handleExportBackup(), onImportFileChange(), purgeRow(), saveOrganize(), saveRename(), setFeedback() (+2 more)

### Community 188 - "number-grammar.ts"
Cohesion: 0.47
Nodes (8): cleanPunctuation(), formatDiceFormula(), formatDistanceUnit(), formatInitiativeHeadline(), formatMetricDistance(), formatOrdinal(), formatSignedModifier(), sanitizeProsePunctuation()

### Community 189 - "SCHEMA.ts"
Cohesion: 0.20
Nodes (7): required, $schema, type, $schema, type, SCHEMA, SPELL_SCHEMA

### Community 190 - "package.json"
Cohesion: 0.28
Nodes (8): typescript, vue-tsc, dependencies, typescript@6.0.3, vue-tsc@3.3.14, name, private, version

### Community 191 - "LanguageEntryList.vue"
Cohesion: 0.22
Nodes (8): CONCENTRATION_ENTRIES, CONCENTRATION_FILTER_ENTRIES, CONCENTRATION_MODE_ENTRIES, CREATURE_TARGET_ENTRIES, LANGUAGE_REQUIREMENT_ENTRIES, MENTAL_SAVE_STAT_ENTRIES, SAVE_AWARENESS_ENTRIES, {
  monster,
  syncLanguagesToString,
  removeLanguage,
  getAnimalHandling,
  getAnimalsConfig,
  getPlantsConfig,
  getUndeadConfig,
  getDeadConfig,
}

### Community 192 - "ParagonSection.vue"
Cohesion: 0.22
Nodes (8): INITIATIVE_ACTION_TYPE_ENTRIES, INITIATIVE_ADV_MODE_ENTRIES, INITIATIVE_ROLL_EFFECT_ENTRIES, INITIATIVE_TRIGGER_ENTRIES, PLURAL_CREATURE_TYPE_ENTRIES, SECONDARY_STAT_ENTRIES, STAT_MODE_ENTRIES, {
  initiativeConfig,
  initiativeRollMode,
  initiativePreview,
  newRiderAdvMode,
  newRiderCreatureTypes,
  newRiderRollEffect,
  newRiderActionType,
  newRiderSpellName,
  newRiderHpAmount,
  newRiderMoveDistance,
  newRiderCustomText,
  addInitiativeRider,
  removeInitiativeRider,
  formatInitiativeRider,
  paragonConfig,
  paragonPhaseRows,
  materializeParagonRows,
  updateParagonPoolHp,
}

### Community 193 - "statblock-help.ts"
Cohesion: 0.47
Nodes (5): STATBLOCK_HELP_PT_BR, STATBLOCK_HELP, StatblockHelpKey, statblockHelpText(), statblockUsageHelpKey()

### Community 194 - "safe-html.ts"
Cohesion: 0.28
Nodes (8): apply(), clean(), DROP_WITH_CONTENT, GLOBAL_ATTRS, safeHtml(), SVG_ATTRS, TAGS, vSafeHtml

### Community 195 - "a4-pagination.ts"
Cohesion: 0.25
Nodes (7): A4_LANDSCAPE_MM, A4_MAX_PAGES, A4_OVERFLOW_TOLERANCE_PX, A4_PORTRAIT_MM, A4PaginationMetrics, calculateA4Pagination(), MM_TO_PX_96DPI

### Community 196 - "sync-release.mjs"
Cohesion: 0.28
Nodes (6): LATEST_RELEASE_METADATA, StructuredReleaseLocale, StructuredReleaseMetadata, buildJson, checks, pkgJson

### Community 197 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 198 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 199 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 200 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 201 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 202 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 203 - "properties"
Cohesion: 0.22
Nodes (9): type, properties, type, type, customMultiattackRenderer, multiattackOptions, postscript, useCustomRenderer (+1 more)

### Community 204 - "Character2024Section.vue"
Cohesion: 0.25
Nodes (6): actor, charStore, masteryEntries, originFeatEntries, ruleset, setup()

### Community 205 - "TraitCadenceEditor.vue"
Cohesion: 0.32
Nodes (7): emit, props, rateGroups, rateOptions, timingOptions, update(), updateUses()

### Community 206 - "useFileLoader.ts"
Cohesion: 0.46
Nodes (6): EditorState, nativeMonsterFile(), readSheetPresentation(), readSheetSpells(), sheetPresentation(), useFileLoader()

### Community 207 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 208 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 209 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 210 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 211 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 212 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 213 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 214 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 215 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 216 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 217 - "standard"
Cohesion: 0.25
Nodes (8): long, range, reach, standard, properties, type, items, type

### Community 218 - "spells-v1.json"
Cohesion: 0.25
Nodes (7): items, type, items, type, class, $schema, type

### Community 219 - "casting-source-list.ts"
Cohesion: 0.33
Nodes (6): removeSource(), copy(), mapping, removeCastingSource(), SourceBindingRemap, sourceKeys

### Community 220 - "closeDialog"
Cohesion: 0.29
Nodes (7): closeDialog(), emit, onDialogKeydown(), onDialogToggle(), onListKeydown(), openCreature(), selectIndex()

### Community 221 - "AttackPresets.test.ts"
Cohesion: 0.43
Nodes (5): ATTACK_PRESETS, AttackPreset, attackPresetAction(), hit(), Preset

### Community 222 - "properties"
Cohesion: 0.29
Nodes (7): properties, key, skill, stat, properties, type, type

### Community 223 - "properties"
Cohesion: 0.29
Nodes (7): properties, key, skill, stat, properties, type, type

### Community 225 - "structured-attack.ts"
Cohesion: 0.73
Nodes (5): finite(), modifier(), structuredAttackBonus(), weaponAttackAbility(), weaponAttackStat()

### Community 226 - "inspect-statblock.js"
Cohesion: 0.40
Nodes (5): evalInPage(), page, proc, send(), ws

### Community 227 - "DefenseScheduleFields.vue"
Cohesion: 0.40
Nodes (3): monster, props, schedule

### Community 228 - "asset-url.ts"
Cohesion: 0.70
Nodes (3): appAsset(), currentAppBase(), resolveAppAsset()

### Community 229 - "items"
Cohesion: 0.40
Nodes (5): items, type, case, effect, effects

### Community 230 - "items"
Cohesion: 0.40
Nodes (5): items, type, case, effect, effects

### Community 231 - "spells-v2.json"
Cohesion: 0.40
Nodes (4): properties, patternProperties, $schema, type

### Community 234 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 235 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 236 - "skill"
Cohesion: 0.50
Nodes (4): key, skill, properties, type

### Community 237 - "5emm-v5.json"
Cohesion: 0.50
Nodes (3): required, $schema, type

### Community 238 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 239 - "5emm-v6.json"
Cohesion: 0.50
Nodes (3): required, $schema, type

### Community 240 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 241 - "5emm-v7.json"
Cohesion: 0.50
Nodes (3): required, $schema, type

### Community 242 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 243 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 244 - "skill"
Cohesion: 0.50
Nodes (4): label, skill, properties, type

### Community 245 - "QA helpers"
Cohesion: 0.50
Nodes (3): Matrix and fit, QA helpers, Step replay

## Knowledge Gaps
- **4 isolated node(s):** `ADR-0003`, `ADR-0003`, `ADR-0003`, `ADR-0003`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2241 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `properties` connect `properties` to `properties`, `type`, `properties`, `properties`, `properties`, `5emm-v11.json`, `properties`, `override`, `properties`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `ADR-0003`, `ADR-0003`, `ADR-0003` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_src` be split into smaller, more focused modules?**
  _Cohesion score 0.044427989633469084 - nodes in this community are weakly interconnected._
- **Why does `properties` connect `properties` to `type`, `override`, `properties`, `properties`, `properties`, `5emm-v7.json`, `properties`, `properties`, `properties`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `ref_vue_i18n` be split into smaller, more focused modules?**
  _Cohesion score 0.09979879275653923 - nodes in this community are weakly interconnected._
- **Why does `properties` connect `properties` to `type`, `override`, `properties`, `properties`, `properties`, `properties`, `properties`, `SCHEMA.ts`, `properties`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `CalculateCr.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06628621597892889 - nodes in this community are weakly interconnected._
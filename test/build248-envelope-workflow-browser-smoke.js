import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send, delay }) => {
  const result = await evaluate(`(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const until = async (fn, label, timeoutMs = 6000, onTimeout = null) => {
      const steps = Math.ceil(timeoutMs / 40);
      for (let i = 0; i < steps; i++) {
        const value = fn();
        if (value) return value;
        await wait(40);
      }
      const extra = onTimeout ? ' | ' + String(onTimeout()) : '';
      throw new Error('Timed out waiting for: ' + label + extra);
    };
    const assert = (cond, msg) => {
      if (!cond) throw new Error(msg);
    };
    const visible = (el) => el && el.getClientRects().length > 0;
    const findToolbarBtn = (predicate) =>
      [...document.querySelectorAll('header .q-btn, .cr-footer .q-btn')].find((btn) =>
        visible(btn) && predicate(btn)
      );
    const hasIcon = (btn, name) =>
      btn.textContent.includes(name) || Boolean(btn.querySelector('.' + name));

    const root = await until(() => document.querySelector('#q-app')?.__vue_app__, 'Vue app mount');
    const pinia = root.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster');
    const editor = pinia._s.get('editor');
    const history = pinia._s.get('history');
    const combat = pinia._s.get('combat');
    const session = pinia._s.get('monsterSession');

    // Clean baseline
    editor.activeMode = 'monster';
    editor.style = '2024';
    editor.visualTemplate = 'modern';
    editor.visualTheme = 'wotc';
    editor.spellcastingPlacement = 'auto';
    monster.$reset();
    combat.resetEncounter();
    await wait(100);

    // (a) Document Envelope, presentation isolation, file load distinct ID, and Undo/Redo sync
    const initialDocId = session.documentId;
    const initialRev = session.contentRevision;
    assert(Boolean(initialDocId && initialDocId.length > 0), 'documentId must be non-empty');
    assert(
      session.storeCopyInventory.map((x) => x.storeId).join(',') === 'monster,history,combat,templates,editor',
      'storeCopyInventory must enumerate all 5 stores'
    );

    const rulesetBtn = await until(
      () => findToolbarBtn((b) => /D&D 20(14|24)/.test(b.textContent)),
      'ruleset toggle button'
    );
    rulesetBtn.click();
    await wait(120);
    assert(editor.style === '2014', 'Ruleset button toggled to 2014');
    assert(
      session.contentRevision === initialRev,
      'Presentation toggle must NOT bump contentRevision (' + initialRev + ' -> ' + session.contentRevision + ')'
    );
    rulesetBtn.click();
    await wait(120);
    assert(editor.style === '2024', 'Ruleset button toggled back to 2024');
    assert(session.contentRevision === initialRev, 'Returning to 2024 must NOT bump contentRevision');

    history.pushSnapshot('Rename baseline');
    monster.name = 'Build 248 Envelope Witness';
    await wait(120);
    const revAfterEdit = session.contentRevision;
    assert(revAfterEdit > initialRev, 'Content edit must monotonically bump contentRevision');

    const undoBtn = await until(() => findToolbarBtn((b) => hasIcon(b, 'undo')), 'undo button');
    undoBtn.click();
    await until(() => monster.name === 'My New Monster', 'undo reverted monster name');
    const revAfterUndo = session.contentRevision;
    assert(revAfterUndo !== revAfterEdit, 'Undo must sync MonsterSessionStore contentRevision');

    const redoBtn = await until(() => findToolbarBtn((b) => hasIcon(b, 'redo')), 'redo button');
    redoBtn.click();
    await until(() => monster.name === 'Build 248 Envelope Witness', 'redo restored monster name');

    const distinctIdAfterLoad = session.ensureDistinctDocumentId(true);
    assert(distinctIdAfterLoad && distinctIdAfterLoad !== initialDocId, 'File load distinct ID assignment must allocate new documentId');

    // (b) Combat Tracker immutable snapshot isolation & turn preservation
    monster.AC = 15;
    monster.HP.HD = 4;
    monster.HP.type = 8;
    await wait(100);
    const revBeforeCombat = session.contentRevision;

    const combatBtn = await until(
      () => findToolbarBtn((b) => hasIcon(b, 'mdi-sword-cross')),
      'Combat HUD toggle'
    );
    combatBtn.click();
    const drawer = await until(() => document.querySelector('.q-drawer .combatant-card, .q-drawer button'), 'Combat drawer open');
    const addMonsterBtn = await until(
      () => [...document.querySelectorAll('.q-drawer .q-btn')].find((b) => b.textContent.includes('Add Current Monster')),
      'Add Current Monster button'
    );
    addMonsterBtn.click();
    await wait(80);
    addMonsterBtn.click();
    await until(() => document.querySelectorAll('.q-drawer .combatant-card').length === 2, 'Two duplicate combatants added');

    // Capture original snapshot badges then mutate live monster
    const badgesBefore = [...document.querySelectorAll('.q-drawer [data-combat-snapshot-badge]')].map((b) => b.textContent.trim());
    assert(badgesBefore.length === 2 && badgesBefore.every((t) => t.includes('AC 15')), 'Initial snapshot badges should show AC 15: ' + JSON.stringify(badgesBefore));
    monster.AC = 21;
    monster.name = 'Mutated Live Monster';
    await wait(120);
    const badgesAfterMutation = [...document.querySelectorAll('.q-drawer [data-combat-snapshot-badge]')].map((b) => b.textContent.trim());
    assert(
      badgesAfterMutation.every((t) => t.includes('AC 15') && t.includes('rev #' + revBeforeCombat)),
      'Live sheet edits must not alter existing combatant snapshots: ' + JSON.stringify(badgesAfterMutation)
    );

    const combatantIdsBeforeTurn = combat.sortedCombatants.map((c) => c.id);
    combat.setInitiative(combatantIdsBeforeTurn[0], 18);
    combat.setInitiative(combatantIdsBeforeTurn[1], 12);
    await wait(80);
    const activeBeforeNext = combat.sortedCombatants[combat.activeTurnIndex]?.id;
    const nextTurnBtn = [...document.querySelectorAll('.q-drawer .q-btn')].find((b) => b.textContent.includes('Next'));
    assert(Boolean(nextTurnBtn), 'Next turn button must exist');
    nextTurnBtn.click();
    await wait(80);
    const activeTurnId = combat.sortedCombatants[combat.activeTurnIndex]?.id;
    assert(Boolean(activeTurnId) && activeTurnId !== activeBeforeNext, 'Next button advanced active turn to the other combatant');
    const otherCombatantId = combat.sortedCombatants.find((c) => c.id !== activeTurnId)?.id;
    assert(Boolean(otherCombatantId), 'Other combatant id found');

    // Reorder initiatives sharply (force activeTurnId down then up) & remove non-active combatant; activeTurnId must remain focused
    combat.setInitiative(activeTurnId, 5);
    combat.setInitiative(otherCombatantId, 25);
    await wait(80);
    assert(
      combat.sortedCombatants[combat.activeTurnIndex]?.id === activeTurnId &&
        combat.sortedCombatants[1]?.id === activeTurnId,
      'Active turn must follow combatant across initiative reorder (to index 1)'
    );
    const nonActiveCard = [...document.querySelectorAll('.q-drawer .combatant-card')].find((c) => !c.classList.contains('active-turn'));
    assert(Boolean(nonActiveCard), 'Non-active combatant card present');
    const removeBtn = [...nonActiveCard.querySelectorAll('.q-btn')].find((b) => hasIcon(b, 'close'));
    removeBtn.click();
    await until(() => document.querySelectorAll('.q-drawer .combatant-card').length === 1, 'Removed non-active combatant');
    assert(
      combat.sortedCombatants[combat.activeTurnIndex]?.id === activeTurnId,
      'Active turn must stay preserved when another combatant is removed'
    );
    // Close drawer
    combatBtn.click();
    await wait(120);

    // (c) Track A Lint Detection, Locate focus, Stale guard, Repair Preview, Single-Undo Repair
    monster.multiattacks = [{ id: 'ma-orphan', attacks: ['nonexistent-atk'], actions: [] }];
    monster.actions = [
      {
        id: 'act-lint-1',
        name: 'Chaos Pulse',
        description: 'Deals {{UNKNOWN_BUILD248_MACRO}} damage.',
        recharge: '',
        legendaryOnly: false,
        limitedUse: { count: 0, rate: 'at_will' },
        stat: 'none',
        save: { override: false, overrideValue: 0 },
        range: '',
        effects: [],
        customPreamble: false,
        bonusAction: false,
        crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpModifier: 0, ehpMultiplier: 1, acModifier: 0, automatic: true, include: true },
        outcomes: [
          {
            id: 'out-1',
            trigger: 'hit',
            effects: [],
            containers: [
              { id: 'c-dangling', kind: 'random_table', randomTableId: 'missing-table-248', text: 'Fallback effect.' },
            ],
          },
        ],
      },
    ];
    await wait(120);

    const lintBtn = await until(
      () => findToolbarBtn((b) => hasIcon(b, 'mdi-shield-alert') || hasIcon(b, 'mdi-shield-check')),
      'Linter button'
    );
    lintBtn.click();
    const lintDialog = await until(() => document.querySelector('[data-lint-dialog]'), 'MonsterLintDialog open');
    await until(() => lintDialog.querySelector('[data-lint-code="MULTIATTACK_ORPHAN_ATTACK"]'), 'MULTIATTACK_ORPHAN_ATTACK rendered');
    assert(Boolean(lintDialog.querySelector('[data-lint-code="UNKNOWN_MACRO"]')), 'UNKNOWN_MACRO detected');
    assert(Boolean(lintDialog.querySelector('[data-lint-code="DANGLING_RANDOM_TABLE_REF"]')), 'DANGLING_RANDOM_TABLE_REF detected');

    // Test Locate focus & section reveal
    const locateBtn = lintDialog.querySelector('[data-lint-code="MULTIATTACK_ORPHAN_ATTACK"] [data-lint-locate]');
    assert(Boolean(locateBtn), 'Locate button present');
    locateBtn.click();
    const locatedPanel = await until(() => document.querySelector('[data-lint-located]'), 'Section marked data-lint-located');
    assert(
      locatedPanel.getAttribute('data-editor-section') === 'actions',
      'Locate should target Actions & Traits Studio section'
    );

    // Reopen lint dialog, open repair diff preview, & verify stale banner on mutation while previewing repair
    lintBtn.click();
    await until(() => document.querySelector('[data-lint-dialog]'), 'Lint dialog reopened');
    const previewToggle = await until(
      () => document.querySelector('[data-lint-dialog] [data-lint-preview-toggle]'),
      'Repair preview toggle present'
    );
    previewToggle.click();
    const repairPreview = await until(
      () => document.querySelector('[data-lint-dialog] [data-lint-repair-preview]'),
      'Repair preview visible'
    );
    assert(repairPreview.textContent.includes('Single') || repairPreview.textContent.includes('single'), 'Repair preview confirms single undo step');

    monster.HP.HD = 6;
    await until(
      () => document.querySelector('[data-lint-dialog] [data-check-banner="stale"]') &&
        document.querySelector('[data-lint-dialog] [data-check-status]')?.textContent.trim() === 'stale',
      'Stale banner shown when monster changes while lint repair preview is open'
    );
    document.querySelector('[data-lint-dialog] [data-lint-recheck]').click();
    await until(
      () => !document.querySelector('[data-lint-dialog] [data-check-banner="stale"]') &&
        document.querySelector('[data-lint-dialog] [data-check-status]')?.textContent.trim() !== 'stale',
      'Re-check clears stale state'
    );

    document.querySelector('[data-lint-dialog] [data-lint-apply-repair]').click();
    await until(() => document.querySelector('[data-lint-dialog] [data-check-banner="repaired"]'), 'Repaired banner shown');
    assert(monster.multiattacks.length === 0, 'Orphan multiattack cleaned by repair');

    // Close lint dialog and test single-undo restore
    [...document.querySelectorAll('[data-lint-dialog] .q-btn')].find((b) => hasIcon(b, 'close')).click();
    await wait(120);
    undoBtn.click();
    await until(() => monster.multiattacks.length === 1, 'Single Undo restores pre-repair multiattack in one step');

    // Clear UNKNOWN_MACRO so rest of test works with clean vs explicit blocking states
    monster.actions[0].description = 'Deals force damage.';
    await wait(80);

    // (d) Source-First AutoTune Dialog (bound path detection, partial selection, single-undo apply)
    monster.CR = 3;
    monster.proficiency = 2;
    monster.stats.DEX = 14;
    monster.AC = 14;
    monster.bindings = { AC: { mode: 'formula', expr: '12 + DEX_MOD' } };
    await wait(100);

    const tuneBtn = await until(() => findToolbarBtn((b) => hasIcon(b, 'mdi-tune')), 'AutoTune button');
    tuneBtn.click();
    const tuneDialog = await until(() => document.querySelector('[data-autotune-dialog]'), 'AutoTuneDialog open');
    const crSelect = tuneDialog.querySelector('.q-select');
    crSelect.querySelector('.q-field__control').click();
    const cr8Opt = await until(
      () => [...document.querySelectorAll('.q-menu .q-item')].find((el) => visible(el) && el.textContent.includes('CR 8 ')),
      'CR 8 option'
    );
    cr8Opt.click();
    await until(() => tuneDialog.querySelector('[data-autotune-cr-delta]')?.textContent.includes('→'), 'AutoTune CR delta updated');
    assert(
      tuneDialog.textContent.includes('Bound: AC') &&
        tuneDialog.textContent.includes('stats.DEX') &&
        tuneDialog.textContent.includes('Source-First'),
      'Source-first AutoTune must surface formula binding dependencies for bound AC, got: ' + tuneDialog.textContent
    );

    const recCheckboxes = [...tuneDialog.querySelectorAll('[data-autotune-rec] .q-checkbox')];
    assert(recCheckboxes.length >= 2, 'Expected at least 2 actionable AutoTune recommendations');
    const initialCrIdx = monster.CR;
    // Uncheck the first actionable recommendation to verify partial selection
    recCheckboxes[0].click();
    await wait(80);
    tuneDialog.querySelector('[data-autotune-apply]').click();
    await until(() => !document.querySelector('[data-autotune-dialog]'), 'AutoTune dialog closed after apply');
    assert(monster.CR > initialCrIdx, 'AutoTune updated target CR');

    undoBtn.click();
    await until(() => monster.CR === initialCrIdx, 'Single Undo rolled back AutoTune batch in one step');

    // (e) Spellcasting 2024 SRD 5.2.1 capacity label & per-source sorceryPoints
    monster.stats.INT = 18;
    monster.spellcasting = {
      ...monster.spellcasting,
      class: 'Wizard',
      level: 9,
      stat: 'INT',
      rulesEdition: '2024',
      sorceryPoints: 5,
      standard: ['Fire Bolt', 'Magic Missile', 'Fireball'],
      slots: [4, 3, 3, 3, 1, 0, 0, 0, 0],
      metamagic: { enabled: true, sorceryPoints: 0, refreshRate: 'long_rest', options: ['Quickened Spell'] },
      classes: [],
    };
    const spellExp = await until(
      () => document.querySelector('[data-editor-section="spellcasting"]'),
      'Spellcasting expansion panel'
    );
    if (!spellExp.classList.contains('q-expansion-item--expanded')) {
      spellExp.querySelector('.q-item').click();
      await wait(120);
    }
    const primaryCap = await until(
      () => document.querySelector('[data-primary-capacity]'),
      'Primary capacity reference line'
    );
    assert(
      primaryCap.textContent.includes('SRD 5.2.1 (2024) capacity:') && primaryCap.textContent.includes('14 prepared'),
      '2024 Wizard level 9 must display SRD 5.2.1 (2024) capacity with 14 prepared, got: ' + primaryCap.textContent
    );
    const spEl = document.querySelector('[data-source-sorcery-points]');
    const spField = spEl?.tagName === 'INPUT' ? spEl : spEl?.querySelector('input');
    assert(Boolean(spField) && spField.value === '5', 'Per-source sorcery points input must reflect authored 5 SP');
    await until(
      () => document.querySelector('#render')?.textContent.includes('Sorcery Points') &&
        document.querySelector('#render')?.textContent.includes('5'),
      'Rendered sheet displays source sorceryPoints total'
    );

    // (f) DownloadButton Export Preview, D-02 Spellcasting Placement, Omissions Banner & B2.5 Gate
    // Blocking lint error still active (multiattacks has orphan ma-orphan)
    const getPreviewText = () =>
      (previewDlg.querySelector('[data-export-preview-text] textarea') ||
        previewDlg.querySelector('[data-export-preview-text]'))?.value || '';
    const selectOption = async (el, labelText) => {
      await until(
        () => ![...document.querySelectorAll('.q-menu[role="listbox"]')].some((m) => visible(m)),
        'Previous QSelect listbox closed before opening ' + labelText
      );
      const ctrl =
        el?.closest('.q-field')?.querySelector('.q-field__control') ||
        el?.querySelector('.q-field__control') ||
        el;
      ctrl?.click();
      const opt = await until(
        () =>
          [...document.querySelectorAll('.q-menu[role="listbox"] .q-item')].find(
            (item) => visible(item) && item.textContent.includes(labelText)
          ),
        'QSelect option: ' + labelText
      );
      opt.click();
      await until(
        () => el?.closest('.q-field')?.textContent?.includes(labelText) ||
          ![...document.querySelectorAll('.q-menu[role="listbox"]')].some((m) => visible(m)),
        'QSelect settled on: ' + labelText
      );
      await wait(160);
    };

    const dlBtn = await until(() => findToolbarBtn((b) => hasIcon(b, 'download')), 'Download menu button');
    dlBtn.click();
    const previewMenuItem = await until(
      () => document.querySelector('[data-export-preview-open]'),
      'Export Preview & Capabilities menu item'
    );
    previewMenuItem.click();
    const previewDlg = await until(() => document.querySelector('[data-export-preview-dialog]'), 'Export Preview dialog open');
    assert(Boolean(previewDlg.querySelector('[data-export-blocking-banner]')), 'Blocking lint banner must show in Export Preview');
    assert(
      previewDlg.querySelector('[data-export-preview-download]').disabled === true &&
        previewDlg.querySelector('[data-export-preview-copy]').disabled === true,
      'Copy and Download buttons must be disabled when blocking lint errors exist'
    );
    previewDlg.querySelector('[data-export-override-checkbox]').click();
    await until(
      () => previewDlg.querySelector('[data-export-preview-download]').disabled === false,
      'Blocking override unlocks Download button'
    );

    // Switch target to HTML Snippet and inspect .sb-plate + grammar CSS
    const targetSelect = previewDlg.querySelector('[data-export-target-select]');
    await selectOption(targetSelect, 'HTML Snippet');
    await until(
      () => getPreviewText().includes('class-spellcasting sb-plate') &&
        getPreviewText().includes('border: 2px solid var(--sb-frame'),
      'HTML Snippet preview renders sb-plate and embedded grammar CSS',
      6000,
      () => JSON.stringify({
        target: targetSelect?.closest('.q-field')?.textContent?.trim(),
        len: getPreviewText().length,
        hasPlate: getPreviewText().includes('class-spellcasting sb-plate'),
        hasCss: getPreviewText().includes('border: 2px solid var(--sb-frame'),
        head: getPreviewText().slice(0, 300),
      })
    );

    // Switch target to Plain Text and verify omissions banner + D-02 placement ordering
    await selectOption(targetSelect, 'Plain Text');
    await until(() => previewDlg.querySelector('[data-export-omissions-banner]'), 'Omissions banner appears for Plain Text');
    await wait(120);

    const placementSelect = previewDlg.querySelector('[data-export-spell-placement]');
    await selectOption(placementSelect, 'Before Actions');
    await until(() => {
      const txtVal = getPreviewText();
      return txtVal.indexOf('Spellcasting.') > -1 && txtVal.indexOf('Spellcasting.') < txtVal.indexOf('=== Actions');
    }, 'Plain text export places Spellcasting before === Actions when set to Before Actions', 6000, () => JSON.stringify({
      placement: editor.spellcastingPlacement,
      target: targetSelect?.closest('.q-field')?.textContent?.trim(),
      spIdx: getPreviewText().indexOf('Spellcasting.'),
      actIdx: getPreviewText().indexOf('=== Actions'),
      head: getPreviewText().slice(0, 400),
    }));

    // Verify live web renderer also reordered Spellcasting above Actions
    const webBeforeOk = await until(() => {
      const renderHtml = document.querySelector('#render')?.innerHTML || '';
      const spIdx = renderHtml.indexOf('class-spellcasting');
      const actIdx = renderHtml.indexOf('Chaos Pulse');
      return spIdx > -1 && actIdx > -1 && spIdx < actIdx;
    }, 'Live WebRenderer places class-spellcasting before Actions');

    await selectOption(placementSelect, 'After Actions');
    await until(() => {
      const txtVal = getPreviewText();
      return txtVal.indexOf('=== Actions') > -1 && txtVal.indexOf('Spellcasting.') > txtVal.indexOf('Chaos Pulse');
    }, 'Plain text export places Spellcasting after Actions when set to After Actions', 6000, () => JSON.stringify({
      placement: editor.spellcastingPlacement,
      spIdx: getPreviewText().indexOf('Spellcasting.'),
      actIdx: getPreviewText().indexOf('=== Actions'),
      pulseIdx: getPreviewText().indexOf('Chaos Pulse'),
    }));

    const webAfterOk = await until(() => {
      const renderHtml = document.querySelector('#render')?.innerHTML || '';
      const spIdx = renderHtml.indexOf('class-spellcasting');
      const actIdx = renderHtml.indexOf('Chaos Pulse');
      return spIdx > -1 && actIdx > -1 && spIdx > actIdx;
    }, 'Live WebRenderer places class-spellcasting after Actions');

    return {
      envelopeOk: true,
      combatSnapshotIsolation: true,
      combatTurnPreservation: true,
      lintLocateStaleSingleUndoRepair: true,
      autoTuneSourceFirstPartialSingleUndo: true,
      spellcasting2024CapacityAndSorceryPoints: true,
      exportPreviewBlockingOmissionsPlacement: webBeforeOk && webAfterOk,
    };
  })()`);

  assert.deepStrictEqual(result, {
    envelopeOk: true,
    combatSnapshotIsolation: true,
    combatTurnPreservation: true,
    lintLocateStaleSingleUndoRepair: true,
    autoTuneSourceFirstPartialSingleUndo: true,
    spellcasting2024CapacityAndSorceryPoints: true,
    exportPreviewBlockingOmissionsPlacement: true,
  });
  await delay(50);
  console.log('Build 248 envelope & workflow browser checks:', JSON.stringify(result));
}, { port: Number(process.env.DNDSHEET_BUILD248_CDP_PORT || 9362) });

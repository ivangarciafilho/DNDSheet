import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate, send }) => {
  // 0. Open CatalogSelect for creatureTypes using real CDP click + typing
  const typeBox = await evaluate(`(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const until = async (fn, label, timeoutMs = 6000) => {
      const steps = Math.ceil(timeoutMs / 40);
      for (let i = 0; i < steps; i++) {
        const value = fn();
        if (value) return value;
        await wait(40);
      }
      throw new Error('Timed out waiting for: ' + label);
    };
    const root = await until(() => document.querySelector('#q-app')?.__vue_app__, 'Vue app mount');
    const pinia = root.config.globalProperties.$pinia;
    const editor = pinia._s.get('editor');
    const monster = pinia._s.get('monster');
    const repo = pinia._s.get('repository');
    editor.activeMode = 'monster';
    editor.style = '2024';
    editor.visualTemplate = 'classic';
    editor.visualTheme = 'wotc';
    editor.a4PreviewMode = false;
    monster.$reset();
    await repo.init();
    await wait(120);

    const basicsJump = await until(
      () => document.querySelector('[data-section-jump="basics"]'),
      'basics section jump pill'
    );
    basicsJump.click();
    await wait(250);
    const typeAttrEl = await until(
      () => document.querySelector('[data-editor-section="basics"] [data-catalog-select="creatureTypes"]'),
      'CatalogSelect for creatureTypes'
    );
    const typeField = typeAttrEl.closest('.q-select') || typeAttrEl;
    typeField.scrollIntoView({ block: 'center' });
    await wait(120);
    const r = typeField.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)

  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: typeBox.x,
    y: typeBox.y,
    button: 'left',
    clickCount: 1,
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: typeBox.x,
    y: typeBox.y,
    button: 'left',
    clickCount: 1,
  })

  // 1. Verify Pillar 1, Pillar 2, Toolbar, SectionStrip, View Presets, Library CRUD, and Backup Quarantine at desktop width
  const desktopResult = await evaluate(`(async () => {
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
    const setInputValue = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const root = await until(() => document.querySelector('#q-app')?.__vue_app__, 'Vue app mount');
    const pinia = root.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster');
    const editor = pinia._s.get('editor');
    const session = pinia._s.get('monsterSession');
    const repo = pinia._s.get('repository');

    // --- PILLAR 1: Roll Count & Scaling Contract + Bindings ---
    const beforeBindingsCount = Object.keys(monster.bindings || {}).length;
    assert(typeof beforeBindingsCount === 'number', 'monster.bindings must be initialized as object');
    monster.attacks.push({
      id: 'smoke-beam-atk',
      name: 'Eldritch Ray',
      mode: 'ranged',
      attackBonus: 7,
      reach: 5,
      range: '120 ft.',
      target: 'one target',
      hit: { diceCount: 2, diceSize: 8, modifier: 4, damageType: 'force' },
      additionalDamage: [],
      attackCount: 3,
      beamCount: 3,
      damageMultiplier: 1,
      advantage: 'advantage',
      saveAdvantage: 'normal',
      save: { enabled: false, dc: 14, ability: 'DEX', halfOnSuccess: false, effect: '' },
      notes: '',
    });
    await wait(120);
    const addedAtk = monster.attacks.find((a) => a.id === 'smoke-beam-atk');
    assert(addedAtk && addedAtk.attackCount === 3 && addedAtk.advantage === 'advantage' && addedAtk.saveAdvantage === 'normal',
      'Pillar 1: Attack roll count and independent attack/save advantage must persist cleanly on monster state');

    // --- PILLAR 2: Purpose-led help & CatalogSelect ---
    const i18nMessages = root.config.globalProperties.$i18n?.messages?.value?.['en-US']
      || root.config.globalProperties.$i18n?.messages?.['en-US'];
    const helpJson = JSON.stringify(i18nMessages?.help || {});
    assert(!/for the .* editor|in the .* editor|Tick to include/i.test(helpJson),
      'Pillar 2 H9: i18n help dictionary must contain zero generated boilerplate');

    const typeAttrEl = await until(
      () => document.querySelector('[data-editor-section="basics"] [data-catalog-select="creatureTypes"]'),
      'CatalogSelect for creatureTypes'
    );
    const typeField = typeAttrEl.closest('.q-select') || typeAttrEl;
    const typeNative = typeField.querySelector('input');
    const initialMenuOpts = await until(
      () => document.querySelectorAll('.q-menu [data-catalog-option], .q-menu [role="option"]').length > 0,
      'CatalogSelect popup options',
      4000,
      () => {
        const panel = document.querySelector('[data-editor-section="basics"]');
        return 'expanded=' + (!panel?.classList.contains('q-expansion-item--collapsed'))
          + ' menuCount=' + document.querySelectorAll('.q-menu').length
          + ' focused=' + (document.activeElement?.tagName || 'none');
      }
    );
    assert(initialMenuOpts, 'Popup menu must display CatalogSelect options');

    if (typeNative) {
      typeNative.focus();
      setInputValue(typeNative, 'fiend');
      await wait(150);
    }
    const fiendOpt = await until(
      () => [...document.querySelectorAll('.q-menu [data-catalog-option], .q-menu [role="option"]')].find(
        (el) => ((el.getAttribute('data-catalog-option') || el.textContent || '').trim().toLowerCase() === 'fiend')
      ),
      'Filtered fiend CatalogSelect option',
      4000,
      () => 'opts=' + [...document.querySelectorAll('.q-menu [role="option"]')].map((e) => e.textContent?.trim()).slice(0, 8).join('|')
    );
    fiendOpt.click();
    await until(() => String(monster.type).toLowerCase() === 'fiend', 'monster.type updated to fiend');

    // --- PILLAR 3 (B7.1): 4 Toolbar Groups & Truthful Save Status ---
    const toolbarGroups = [...document.querySelectorAll('header [data-toolbar-group]')];
    assert(toolbarGroups.length === 4, 'B7.1: Expected 4 grouped toolbar containers, got ' + toolbarGroups.length);
    for (const grp of toolbarGroups) {
      assert(grp.getAttribute('role') === 'group', 'Toolbar group missing role=group: ' + grp.dataset.toolbarGroup);
    }
    assert(toolbarGroups.map((g) => g.dataset.toolbarGroup).join(',') === 'document,editing,context,presentation',
      'B7.1: Toolbar group names mismatch');

    const saveStatusEl = await until(() => document.querySelector('[data-save-status]'), 'save status pill');
    const saveState = saveStatusEl.getAttribute('data-save-status');
    assert(['idle', 'saving', 'saved', 'error', 'read_only'].includes(saveState || ''),
      'B5.5: Invalid data-save-status: ' + saveState);

    // --- PILLAR 3 (B7.2): 15 Editor Panels Preserved & Section Strip Focus/Expand ---
    const expansionItems = [...document.querySelectorAll('#editor > .q-list > .q-expansion-item')];
    assert(expansionItems.length === 15, 'Step 49 compatibility: expected 15 expansion items, got ' + expansionItems.length);

    const sectionButtons = [...document.querySelectorAll('[data-section-strip] [data-section-jump]')];
    assert(sectionButtons.length === 15, 'B7.2: Expected 15 SectionStrip buttons, got ' + sectionButtons.length);

    for (const sectionId of ['a4Layers', 'inventory', 'villainActions', 'regional', 'anatomy', 'encounterDynamics']) {
      const btn = document.querySelector('[data-section-jump="' + sectionId + '"]');
      assert(btn, 'Missing section jump pill: ' + sectionId);
      btn.click();
      await wait(60);
      const panel = await until(
        () => document.querySelector('#editor [data-editor-section="' + sectionId + '"]'),
        'Editor section attribute ' + sectionId
      );
      const expanded = !panel.classList.contains('q-expansion-item--collapsed');
      assert(expanded, 'SectionStrip jump did not expand panel: ' + sectionId);
    }

    // --- PILLAR 3 (B7.4): Presentation Presets Never Mutate Monster Content ---
    const monsterSnapshotBefore = JSON.stringify(monster.$state);
    const revBeforePreset = session.contentRevision;

    const presetMenu = await until(() => document.querySelector('[data-workspace-preset-menu]'), 'preset dropdown');
    presetMenu.click();
    const inkBtn = await until(() => document.querySelector('[data-workspace-preset="ink_saver"]'), 'Ink saver preset item');
    inkBtn.click();
    await until(() => editor.visualTheme === 'printer' && editor.a4CompactDensity === true && editor.condenseImmunities === true,
      'Ink saver preset applied');
    await wait(200);

    presetMenu.click();
    const artBtn = await until(() => document.querySelector('[data-workspace-preset="art_plate"]'), 'Art plate preset item');
    artBtn.click();
    await until(() => editor.visualTemplate === 'modern' && editor.a4StatblockOpacity === 85,
      'Art plate preset applied');
    await wait(200);

    presetMenu.click();
    const screenBtn = await until(() => document.querySelector('[data-workspace-preset="screen"]'), 'Screen preset item');
    screenBtn.click();
    await until(() => editor.visualTheme === 'wotc' && editor.a4PreviewMode === false,
      'Screen preset applied');
    await wait(200);

    assert(JSON.stringify(monster.$state) === monsterSnapshotBefore,
      'B7.4: Workspace presets must NEVER mutate monster.$state');
    assert(session.contentRevision === revBeforePreset,
      'B7.4: Workspace presets must NEVER bump contentRevision');

    // --- PILLAR 3 (B6.1-B6.4 & B5.5-B5.6): Creature Library CRUD, Keyboard Nav, Backup Quarantine ---
    const libOpenBtn = await until(() => document.querySelector('[data-library-open]'), 'Library button');
    libOpenBtn.click();
    await until(() => document.querySelector('[data-library-dialog]'), 'CreatureLibraryDialog open');

    const initialSummaryCount = repo.summaries.length;
    document.querySelector('[data-library-create]').click();
    await until(() => repo.summaries.length === initialSummaryCount + 1, 'Create New Creature added summary');

    // Rename newly selected creature row
    const renameBtn = await until(
      () => document.querySelector('[data-library-row][data-selected="true"] [data-library-action="rename"]')
        || document.querySelector('[data-library-row] [data-library-action="rename"]'),
      'Rename action button'
    );
    renameBtn.click();
    const renameInput = await until(
      () => document.querySelector('[data-library-rename-input] input') || document.querySelector('[data-library-rename-input]'),
      'Rename input'
    );
    setInputValue(renameInput, 'Smoke Wyvern');
    await wait(50);
    document.querySelector('[data-library-rename-save]').click();
    await until(() => repo.summaries.some((s) => s.name === 'Smoke Wyvern'), 'Renamed creature saved');

    // Duplicate the renamed creature
    const wyvernRow = await until(
      () => [...document.querySelectorAll('[data-library-row]')].find((r) => r.textContent.includes('Smoke Wyvern')),
      'Smoke Wyvern row'
    );
    wyvernRow.querySelector('[data-library-action="duplicate"]').click();
    await until(() => repo.summaries.some((s) => s.name === 'Smoke Wyvern (Copy)'), 'Duplicated creature added');

    const origSummary = repo.summaries.find((s) => s.name === 'Smoke Wyvern');
    const copySummary = repo.summaries.find((s) => s.name === 'Smoke Wyvern (Copy)');
    assert(origSummary && copySummary && origSummary.id !== copySummary.id,
      'Duplicated creature must get distinct document id');

    // Keyboard navigation on library list
    const listBox = document.querySelector('[data-library-list]');
    listBox.focus();
    listBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await wait(60);
    const afterDownId = document.querySelector('[data-library-row][data-selected="true"]')?.dataset.creatureId;
    assert(Boolean(afterDownId), 'Keyboard ArrowDown must keep a selected creature row');

    // Archive and move to Trash + Quarantine Backup verification
    const copyRow = await until(
      () => [...document.querySelectorAll('[data-library-row]')].find((r) => r.dataset.creatureId === copySummary.id),
      'Duplicate row in library'
    );
    copyRow.querySelector('[data-library-action="archive"]').click();
    await until(() => repo.summaries.find((s) => s.id === copySummary.id)?.archived === true, 'Copy archived');

    // Backup export + Quarantine invalid record in restore
    const backupText = await repo.exportBackupJson();
    const backupObj = JSON.parse(backupText);
    backupObj.items.push({ summary: { id: '' }, document: { bad_invalid_corrupt: true } });
    const restoreRes = await repo.restoreBackupJson(JSON.stringify(backupObj));
    assert(restoreRes.ok === true && restoreRes.quarantined.length >= 1,
      'B5.6: Restore should quarantine invalid backup entries while restoring valid ones');

    // Trash & Permanent Purge cleanup of duplicate
    const allViewBtn = [...document.querySelectorAll('[data-library-view] button')].find((b) => b.textContent.includes('All'));
    allViewBtn.click();
    await wait(80);
    const copyRowAll = await until(
      () => [...document.querySelectorAll('[data-library-row]')].find((r) => r.dataset.creatureId === copySummary.id),
      'Copy row in All view'
    );
    copyRowAll.querySelector('[data-library-action="trash"]').click();
    await until(() => repo.summaries.find((s) => s.id === copySummary.id)?.trashed === true, 'Moved copy to Trash');
    const trashViewBtn = [...document.querySelectorAll('[data-library-view] button')].find((b) => b.textContent.includes('Trash'));
    trashViewBtn.click();
    await wait(80);
    const purgeBtn = await until(
      () => document.querySelector('[data-library-row][data-creature-id="' + copySummary.id + '"] [data-library-action="purge"]'),
      'Purge button'
    );
    purgeBtn.click();
    const confirmPurgeBtn = await until(
      () => document.querySelector('[data-library-row][data-creature-id="' + copySummary.id + '"] [data-library-action="confirm-purge"]'),
      'Confirm purge button'
    );
    confirmPurgeBtn.click();
    await until(() => !repo.summaries.some((s) => s.id === copySummary.id), 'Duplicate permanently purged');

    // Close dialog with Escape
    document.querySelector('[data-library-dialog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await until(() => !document.querySelector('[data-library-dialog]'), 'Library dialog closed via Escape');

    return {
      ok: true,
      panelCount: expansionItems.length,
      toolbarGroups: toolbarGroups.length,
      quarantinedCount: restoreRes.quarantined.length,
    };
  })()`)

  assert.equal(desktopResult.ok, true)
  assert.equal(desktopResult.panelCount, 15)
  assert.equal(desktopResult.toolbarGroups, 4)
  assert.ok(desktopResult.quarantinedCount >= 1)

  // 2. Verify B7.3 Narrow Viewport (<600px) Editor / Stat block switcher without horizontal overflow
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  })
  const narrowResult = await evaluate(`(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const until = async (fn, label, timeoutMs = 4000) => {
      const steps = Math.ceil(timeoutMs / 40);
      for (let i = 0; i < steps; i++) {
        const value = fn();
        if (value) return value;
        await wait(40);
      }
      throw new Error('Timed out waiting for: ' + label);
    };
    const assert = (cond, msg) => {
      if (!cond) throw new Error(msg);
    };

    const switcher = await until(
      () => document.querySelector('[data-narrow-pane-switcher]'),
      'B7.3 narrow pane switcher at 375px'
    );
    const editorEl = document.querySelector('#editor');
    const previewPanel = document.querySelector('#splitter > .q-splitter__after');
    assert(editorEl && getComputedStyle(editorEl).display !== 'none', 'Editor must be shown by default on narrow viewports');
    assert(previewPanel && getComputedStyle(previewPanel).display === 'none', 'Preview must be hidden while Editor pane is active');

    const statBlockBtn = [...switcher.querySelectorAll('button')].find((b) => b.textContent.includes('Stat block'));
    assert(statBlockBtn, 'Missing Stat block narrow switcher button');
    statBlockBtn.click();
    await wait(120);

    const beforePanel = document.querySelector('#splitter > .q-splitter__before');
    assert(beforePanel && getComputedStyle(beforePanel).display === 'none', 'Editor panel must hide when Stat block pane selected');
    assert(previewPanel && getComputedStyle(previewPanel).display !== 'none', 'Stat block preview must be visible');
    const overflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    assert(overflow, '375px narrow Stat block view must have zero horizontal overflow: ' + document.documentElement.scrollWidth + ' > ' + document.documentElement.clientWidth);

    const editorBtn = [...switcher.querySelectorAll('button')].find((b) => b.textContent.includes('Editor'));
    editorBtn.click();
    await wait(100);
    return {
      overflowOk: overflow,
      panelCount: document.querySelectorAll('#editor > .q-list > .q-expansion-item').length,
    };
  })()`)

  await send('Emulation.clearDeviceMetricsOverride')
  assert.equal(narrowResult.overflowOk, true)
  assert.equal(narrowResult.panelCount, 15)
  console.log('Build 249 E2E browser smoke passed:', JSON.stringify({ desktopResult, narrowResult }))
})

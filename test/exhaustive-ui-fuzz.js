import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9223

async function runFuzz() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-fuzz-'))
  console.log(`Launching headless Chrome on port ${PORT}...`)

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    process.env.DNDSHEET_E2E_URL || 'http://localhost:8080/#/'
  ])

  // Poll Chrome CDP endpoint up to 10s so startup timing never flakes
  let targets = null
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try {
              resolve(JSON.parse(data))
            } catch (err) {
              reject(err)
            }
          })
        }).on('error', reject)
      })
      if (Array.isArray(targets) && targets.length > 0) break
    } catch {
      // retry
    }
  }
  if (!targets) {
    throw new Error('Could not connect to Chrome CDP endpoint on port ' + PORT)
  }

  const pageTarget = targets.find((t) => t.type === 'page')
  if (!pageTarget) {
    throw new Error('No page target found!')
  }
  console.log('Target found:', pageTarget.url)

  // Open native WebSocket in Node 22 to CDP
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)

  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

  let msgId = 1
  const pendingRequests = new Map()
  const consoleErrors = []
  const runtimeExceptions = []

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString()
    const msg = JSON.parse(raw)
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map((a) => a.value || a.description).join(' ')
        console.error('LIVE [Console Error]:', text); consoleErrors.push(`[Console Error]: ${text}`)
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text
      console.error('LIVE [Runtime Exception]:', desc); runtimeExceptions.push(`[Runtime Exception]: ${desc}`)
    }

    if (msg.id && pendingRequests.has(msg.id)) {
      const cb = pendingRequests.get(msg.id)
      pendingRequests.delete(msg.id)
      cb(msg)
    }
  })

  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++
      pendingRequests.set(id, resolve)
      ws.send(JSON.stringify({ id, method, params }))
    })
  }

  // Enable Runtime and Page domains
  await sendCdp('Runtime.enable')
  await sendCdp('Page.enable')

  // Wait for initial render of Quasar app
  console.log('Waiting for Quasar #q-app mount...')
  let isReady = false
  for (let i = 0; i < 40; i++) {
    const ready = await evalInPage(`
      () => {
        const app = document.querySelector('#q-app');
        return !!(app && app.__vue_app__);
      }
    `)
    if (ready) {
      isReady = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  console.log('App ready state:', isReady)

  // Dismiss Changelog dialog if presented on first launch
  await evalInPage(`
    async () => {
      const dialog = document.querySelector('.q-dialog');
      if (dialog && dialog.textContent.includes('Changelog')) {
        const doneBtn = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.includes('Done')) || dialog.querySelector('button');
        if (doneBtn) doneBtn.click();
        const start = Date.now();
        while (document.querySelector('.q-dialog') && Date.now() - start < 1500) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }
  `)
  await new Promise((r) => setTimeout(r, 300))

  async function evalInPage(expression) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: `(${expression})()`,
      awaitPromise: true,
      returnByValue: true,
    })
    if (res.result?.exceptionDetails) {
      throw new Error(`Eval error: ${res.result.exceptionDetails.text || res.result.exceptionDetails.exception?.description}`)
    }
    return res.result?.result?.value
  }

  console.log('\n--- Step 1: Initial Render Parity Verification ---')
  const step1 = await evalInPage(`
    async () => {
      for (let i = 0; i < 30; i++) { if (document.querySelector('#render .statblock .monster-name')) break; await new Promise(r => setTimeout(r, 100)); }
      const nameEl = document.querySelector('#render .statblock .monster-name');
      const typeEl = document.querySelector('#render .statblock .type') || document.querySelector('#render .statblock .monster-meta-badges');
      const acEl = document.querySelector('#render .statblock .ac');
      const statblockHtml = document.querySelector('#render .statblock')?.outerHTML || '';

      return {
        success: !!nameEl && !!typeEl,
        name: nameEl?.textContent?.trim(),
        type: typeEl?.textContent?.trim(),
        ac: acEl?.textContent?.trim(),
        htmlLen: statblockHtml.length
      };
    }
  `)
  console.log('Step 1 result:', step1)

  console.log('\n--- Step 2: Fuzzing Basics Editor (Name, AC, HP, Stats, CR) ---')
  const step2 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      monster.name = 'Ancient Red Wyrm';
      monster.type = 'dragon';
      monster.size = 'Gargantuan';
      monster.alignment = 'chaotic evil';
      monster.AC = 19;
      monster.ACType = 'natural armor';
      monster.stats.STR = 30;
      monster.stats.DEX = 10;
      monster.stats.CON = 29;
      monster.stats.INT = 18;
      monster.stats.WIS = 15;
      monster.stats.CHA = 23;
      monster.CR = 24;

      await new Promise(r => setTimeout(r, 100));

      const nameEl = document.querySelector('#render .statblock .monster-name');
      const typeEl = document.querySelector('#render .statblock .type') || document.querySelector('#render .statblock .monster-meta-badges');
      const acEl = document.querySelector('#render .statblock .ac');
      const hpEl = document.querySelector('#render .statblock .hp');

      return {
        success: nameEl?.textContent?.includes('Ancient Red Wyrm'),
        renderedName: nameEl?.textContent?.trim(),
        renderedType: typeEl?.textContent?.trim(),
        renderedAc: acEl?.textContent?.trim(),
        hpText: hpEl?.textContent?.trim()
      };
    }
  `)
  console.log('Step 2 result:', step2)

  console.log('\n--- Step 3: Fuzzing Dirty / In-Progress Typing (Empty string, NaN, Edge values) ---')
  const step3 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // Stress test dirty inputs
      monster.AC = NaN;
      monster.stats.STR = NaN;
      monster.CR = NaN;
      monster.proficiency = NaN;
      monster.HP.HD = NaN;
      monster.HP.modifier = NaN;

      await new Promise(r => setTimeout(r, 100));

      // Restore valid values
      monster.AC = 20;
      monster.stats.STR = 24;
      monster.CR = 18;
      monster.proficiency = 6;
      monster.HP.HD = 20;
      monster.HP.modifier = 100;
      monster.name = 'Elder Shadow Dragon';

      await new Promise(r => setTimeout(r, 100));

      const nameEl = document.querySelector('#render .statblock .monster-name');
      return {
        success: true,
        hasRender: !!nameEl,
        renderedName: nameEl?.textContent?.trim()
      };
    }
  `)
  console.log('Step 3 result:', step3)

  console.log('\n--- Step 4: Adding Attacks with Advanced Token Formulas ---')
  const step4 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      monster.name = 'Ancient Red Wyrm';
      monster.stats.STR = 30;
      monster.proficiency = 7;

      monster.addNewAttack();
      const atk = monster.attacks[monster.attacks.length - 1];
      atk.name = 'Bite of Annihilation';
      atk.damage.count = 4;
      atk.damage.dice = 10;
      atk.damage.type = 'piercing';
      atk.additionalDamage = [
        { id: '1', count: 4, dice: 6, type: 'fire', note: 'plus fire' }
      ];
      atk.alternateDamage = {
        active: true,
        condition: 'if the target is prone',
        count: 6,
        dice: 10,
        type: 'force',
        modifier: { override: false, overrideValue: 0, stat: 'STR' }
      };

      await new Promise(r => setTimeout(r, 100));

      const sb = document.querySelector('#render .statblock');
      const attacksHtml = Array.from(sb.querySelectorAll('.attack')).map(a => a.textContent);
      return {
        success: attacksHtml.length > 0,
        attackCount: attacksHtml.length,
        latestAttack: attacksHtml[attacksHtml.length - 1]
      };
    }
  `)
  console.log('Step 4 result:', step4)

  console.log('\n--- Step 5: Adding Traits, Actions, Reactions, Multiattacks, Spellcasting ---')
  const step5 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // Add Trait
      monster.addTrait();
      const trait = monster.traits[monster.traits.length - 1];
      trait.name = 'Legendary Resistance';
      trait.limitedUse = { count: 3, rate: 'DAY' };
      trait.description = 'If {NAME} fails a saving throw, it can choose to succeed instead.';

      // Add Action
      monster.addAction();
      const action = monster.actions[monster.actions.length - 1];
      action.name = 'Inferno Breath';
      action.stat = 'DEX';
      action.save = { override: false, overrideValue: 0 };
      action.range = '90-foot cone';
      action.description = 'Each creature in that area must make a DC {DC:CON} saving throw, taking {16d6} fire damage on a failure.';

      // Add Reaction
      monster.addReaction();
      const rx = monster.reactions[monster.reactions.length - 1];
      rx.name = 'Tail Swipe';
      rx.trigger = 'When a creature moves within 10 ft.';
      rx.description = '{NAME} makes a tail attack against that creature.';

      // Add Multiattack
      monster.addMultiattack();

      await new Promise(r => setTimeout(r, 100));

      const sb = document.querySelector('#render .statblock');
      return {
        success: true,
        traitCount: monster.traits.length,
        actionCount: monster.actions.length,
        hasMultiattack: monster.multiattacks.length > 0
      };
    }
  `)
  console.log('Step 5 result:', step5)

  console.log('\n--- Step 6: Toggling 2014 Classic / 2024 Revised Ruleset ---')
  const step6 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');

      // Switch to 2014
      editorStore.style = '2014';
      await new Promise(r => setTimeout(r, 100));
      const sb2014 = document.querySelector('#render .statblock');
      const is2014 = !sb2014?.classList.contains('mm2024');

      // Switch to 2024
      editorStore.style = '2024';
      await new Promise(r => setTimeout(r, 100));
      const sb2024 = document.querySelector('#render .statblock');
      const is2024 = sb2024?.classList.contains('mm2024');

      return {
        success: is2014 && is2024,
        switched2024Ok: is2024,
        switched2014Ok: is2014,
        currentClasses: sb2024?.className
      };
    }
  `)
  console.log('Step 6 result:', step6)

  console.log('\n--- Step 7: CR Calculation Engine & Footer Reactive Output ---')
  const step7 = await evalInPage(`
    async () => {
      const footer = document.querySelector('#footer');
      const footerText = footer?.textContent?.replace(/\\s+/g, ' ').trim() || '';

      return {
        hasFooter: !!footer,
        footerSnippet: footerText.substring(0, 180)
      };
    }
  `)
  console.log('Step 7 result:', step7)

  console.log('\n--- Step 8: AutoTune CR Dialog In-Page UI Test ---')
  const step8 = await evalInPage(`
    async () => {
      const tuneBtn = Array.from(document.querySelectorAll('#footer button')).find(b =>
        b.innerHTML.includes('mdi-tune')
      );
      if (!tuneBtn) return { success: false, reason: 'AutoTune button not found in footer' };

      tuneBtn.click();
      await new Promise(r => setTimeout(r, 200));

      const dialog = document.querySelector('.q-dialog');
      const dialogTitle = dialog?.querySelector('.text-h6')?.textContent;

      // Close dialog
      const closeBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Close') || b.innerHTML.includes('close')
      );
      if (closeBtn) closeBtn.click();

      // Wait for dialog backdrop transition
      const start = Date.now();
      while (document.querySelector('.q-dialog') && Date.now() - start < 1500) {
        await new Promise(r => setTimeout(r, 50));
      }

      return {
        success: !!dialog,
        dialogFound: !!dialog,
        title: dialogTitle
      };
    }
  `)
  console.log('Step 8 result:', step8)

  console.log('\n--- Step 9: Monster Lint Dialog In-Page UI Test ---')
  const step9 = await evalInPage(`
    async () => {
      const lintBtn = Array.from(document.querySelectorAll('#footer button')).find(b =>
        b.innerHTML.includes('mdi-shield')
      );
      if (!lintBtn) return { success: false, reason: 'Lint button not found in footer' };

      lintBtn.click();
      await new Promise(r => setTimeout(r, 200));

      const dialog = document.querySelector('.q-dialog');
      const dialogTitle = dialog?.querySelector('.text-h6')?.textContent;

      // Close dialog
      const closeBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Close') || b.innerHTML.includes('close')
      );
      if (closeBtn) closeBtn.click();

      // Wait for dialog backdrop transition
      const start = Date.now();
      while (document.querySelector('.q-dialog') && Date.now() - start < 1500) {
        await new Promise(r => setTimeout(r, 50));
      }

      return {
        success: !!dialog,
        dialogFound: !!dialog,
        title: dialogTitle
      };
    }
  `)
  console.log('Step 9 result:', step9)

  console.log('\n--- Step 10: Multi-Format Export Dropdown In-Page UI Test ---')
  const step10 = await evalInPage(`
    async () => {
      const downloadBtn = Array.from(document.querySelectorAll('#main-nav button')).find(b =>
        b.innerHTML.includes('download')
      );
      if (!downloadBtn) return { success: false, reason: 'Download button not found in header' };

      downloadBtn.click();
      await new Promise(r => setTimeout(r, 250));

      const menu = document.querySelector('.q-menu');
      const items = Array.from(menu ? menu.querySelectorAll('.q-item') : []).map(i => i.textContent.trim());

      // Close menu
      document.body.click();
      await new Promise(r => setTimeout(r, 100));

      return {
        success: items.length >= 5,
        menuItemsFound: items
      };
    }
  `)
  console.log('Step 10 result:', step10)

  console.log('\n--- Step 11: Undo / Redo Lifecycle In-Page UI Test ---')
  const step11 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');
      const history = pinia._s.get('history');

      const initialName = monster.name;
      history.pushSnapshot('Before Rename');

      monster.name = 'Mythic Hydra of Theros';
      await new Promise(r => setTimeout(r, 100));

      // Test Undo
      const undoOk = history.undo();
      await new Promise(r => setTimeout(r, 100));
      const undoneName = monster.name;

      // Test Redo
      const redoOk = history.redo();
      await new Promise(r => setTimeout(r, 100));
      const redoneName = monster.name;

      return {
        success: undoOk && redoOk && undoneName === initialName && redoneName === 'Mythic Hydra of Theros',
        initialName,
        undoneName,
        redoneName
      };
    }
  `)
  console.log('Step 11 result:', step11)

  console.log('\n--- Step 12: AI Statblock Ingestion Studio UI Test ---')
  const step12 = await evalInPage(`
    async () => {
      const allNavBtns = Array.from(document.querySelectorAll('#main-nav button')).map(b => b.innerHTML);
      const aiBtn = Array.from(document.querySelectorAll('#main-nav button')).find(b =>
        b.innerHTML.includes('auto_awesome')
      );
      if (!aiBtn) return { success: false, reason: 'AI Ingest button not found', allNavBtns };

      aiBtn.click();
      await new Promise(r => setTimeout(r, 500));

      const dialog = document.querySelector('.q-dialog');
      const hasAiTitle = dialog?.textContent?.includes('AI Statblock Ingest Studio');

      // Click "Load Dragon Sample"
      const sampleBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Dragon Sample')
      );
      if (sampleBtn) sampleBtn.click();
      await new Promise(r => setTimeout(r, 300));

      // Click "Apply to Monster Sheet"
      const applyBtn = Array.from(dialog?.querySelectorAll('button') || []).find(b =>
        b.textContent?.includes('Apply to Monster Sheet')
      );
      if (applyBtn) applyBtn.click();

      // Wait for dialog to dismiss
      const start = Date.now();
      while (document.querySelector('.q-dialog') && Date.now() - start < 1500) {
        await new Promise(r => setTimeout(r, 50));
      }

      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      return {
        success: monster.name === 'Infernal Cinder Dragon',
        ingestedName: monster.name,
        ingestedCr: monster.CR,
        dialogWasOpen: !!hasAiTitle,
        dialogTextSnippet: dialog?.textContent?.substring(0, 100)
      };
    }
  `)
  console.log('Step 12 result:', step12)

  console.log('\n--- Step 13: Combat Tracker HUD Integration UI Test ---')
  const step13 = await evalInPage(`
    async () => {
      const combatBtn = Array.from(document.querySelectorAll('#main-nav button')).find(b =>
        b.innerHTML.includes('mdi-sword-cross')
      );
      if (!combatBtn) return { success: false, reason: 'Combat HUD button not found' };

      combatBtn.click();
      await new Promise(r => setTimeout(r, 200));

      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const combat = pinia._s.get('combat');

      // Add Current Monster
      combat.addMonsterCombatant(15);
      await new Promise(r => setTimeout(r, 100));

      const count = combat.combatants.length;
      const first = combat.combatants[0];
      const initialHp = first.currentHp;

      // Apply 10 damage
      combat.damage(first.id, 10);
      await new Promise(r => setTimeout(r, 50));
      const hpAfterDmg = first.currentHp;

      // Toggle Poisoned condition
      combat.toggleCond(first.id, 'Poisoned');
      await new Promise(r => setTimeout(r, 50));
      const hasPoison = first.conditions.includes('Poisoned');

      // Close HUD
      combatBtn.click();
      await new Promise(r => setTimeout(r, 100));

      return {
        success: count > 0 && hpAfterDmg === initialHp - 10 && hasPoison,
        combatantCount: count,
        damageApplied: initialHp - hpAfterDmg,
        hasPoison
      };
    }
  `)
  console.log('Step 13 result:', step13)

  console.log('\n--- Step 14: Hero / Character Sheet Mode Switcher Test ---')
  const step14 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editor = pinia._s.get('editor');

      // Switch to character mode
      editor.activeMode = 'character';
      await new Promise(r => setTimeout(r, 150));

      const charSplitter = document.querySelector('#char-splitter');
      const charEditor = document.querySelector('#char-editor');
      const charSheet = document.querySelector('#char-sheet');

      // Click download button in character mode to verify menu items
      const downloadBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('i')?.textContent?.includes('download'));
      if (downloadBtn) downloadBtn.click();
      await new Promise(r => setTimeout(r, 200));

      const menuItems = Array.from(document.querySelectorAll('.q-menu .q-item')).map(i => i.textContent.trim());
      const hasCharExport = menuItems.some(i => i.includes('Export Character JSON'));

      // Close menu by clicking elsewhere
      document.body.click();
      await new Promise(r => setTimeout(r, 100));

      // Switch back to monster mode
      editor.activeMode = 'monster';
      await new Promise(r => setTimeout(r, 150));

      const monsterSplitter = document.querySelector('#splitter');

      return {
        success: !!charSplitter && !!charEditor && !!charSheet && !!monsterSplitter && hasCharExport,
        charEditorFound: !!charEditor,
        charSheetFound: !!charSheet,
        hasCharExport,
        charMenuItems: menuItems,
        restoredMonsterSplitter: !!monsterSplitter
      };
    }
  `)
  console.log('Step 14 result:', step14)

  console.log('\n--- Step 15: Extended Features In-Page DOM Verification (Portrait, Extended HP, Detailed Modifiers, Action Passives, Trait Sections) ---')
  const step15 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // 1. Portrait test
      monster.portrait = {
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        position: 'left',
        width: 220,
        caption: 'Ancient Gargoyle Paragon'
      };

      // 2. Extended HP test
      monster.extendedHp = {
        showBloodied: true,
        bloodiedOverride: 55,
        damageThreshold: 12,
        damageReduction: 4,
        regeneration: {
          enabled: true,
          amount: 15,
          timeframe: 'turn',
          disruptedByTypes: ['radiant'],
          displayMode: 'both'
        },
        deathPrevention: {
          enabled: true,
          name: 'Undead Fortitude',
          exceptions: ['radiant', 'critical hit'],
          displayMode: 'both'
        }
      };

      // 3. Action-oriented passives
      monster.actionOrientedPassives = {
        search: { perception: true, investigation: true, survival: false },
        study: { arcana: true, history: false, nature: false, religion: false },
        hide: { stealth: true, acrobatics: false, sleightOfHand: false },
        influence: { insight: true, persuasion: false, deception: false, intimidation: false }
      };

      // 4. Smart Defense Lists
      monster.immunitiesList = [
        { type: 'lightning', absorbs: true, note: 'absorbs charge' }
      ];
      monster.resistancesList = [
        { type: 'fire', advantage: true, note: 'hardened scales' }
      ];

      // 5. Consolidated Traits
      monster.traits = [
        {
          id: 't-std',
          name: 'Stone Camouflage',
          description: 'Advantage on Stealth checks in rocky terrain.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        },
        {
          id: 't-cond',
          name: 'Frenzied Retaliation',
          description: 'Deals 3d6 slashing damage on reaction when hit.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 },
          conditionalTrigger: 'Bloodied only'
        },
        {
          id: 't-rech',
          name: 'Solar Flare',
          description: 'Emits a 30ft blinding radiance.',
          rechargeTiming: 'DAWN',
          rechargeCount: 1,
          limitedUse: { count: 1, rate: 'DAWN' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        }
      ];

      await new Promise(r => setTimeout(r, 200));

      const renderedText = document.querySelector('#render .statblock')?.textContent || document.querySelector('#renderer')?.textContent || '';
      const portraitLeft = document.querySelector('.monster-portrait.portrait-left');
      const portraitCaption = document.querySelector('.portrait-caption')?.textContent || '';

      const hasBloodied = renderedText.includes('55') && (renderedText.includes('[Bloodied]') || renderedText.includes('Bloodied') || renderedText.includes('bloodied'));
      const hasThreshold = renderedText.includes('Damage Threshold 12') || renderedText.includes('DT 12');
      const hasReduction = renderedText.includes('Damage Reduction 4') || renderedText.includes('DR 4');
      const hasRegenTrait = renderedText.includes('Regeneration') || renderedText.includes('+15/turn');
      const hasPassives = renderedText.includes('Search') && renderedText.includes('Study');
      const hasLightningAbsorption = renderedText.includes('lightning') && renderedText.includes('absorbs');
      const hasFireAdvantage = renderedText.includes('fire') && (renderedText.includes('Advantage') || renderedText.includes('advantage'));
      const hasConsolidatedTag = renderedText.includes('Recharges at Dawn') || renderedText.includes('Solar Flare');

      return {
        success: !!portraitLeft && hasBloodied && hasThreshold && hasReduction && hasRegenTrait && hasPassives && hasLightningAbsorption && hasFireAdvantage && hasConsolidatedTag,
        portraitFound: !!portraitLeft,
        caption: portraitCaption,
        hasBloodied,
        hasThreshold,
        hasReduction,
        hasRegenTrait,
        hasPassives,
        hasLightningAbsorption,
        hasFireAdvantage,
        hasConsolidatedTag
      };
    }
  `);
  console.log('Step 15 result:', step15)

  console.log('\n--- Step 16: Hero Character Sheet Deep Features Verification (Saves, Skills, Spell Slots, Spells, Portrait) ---')
  const step16 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editor = pinia._s.get('editor');
      const charStore = pinia._s.get('character');

      // Switch to character mode
      editor.activeMode = 'character';
      await new Promise(r => setTimeout(r, 150));

      // Populate hero actor
      charStore.actor.name = 'Eldrin Moonshadow';
      charStore.actor.class = 'Wizard';
      charStore.actor.subclass = 'Evocation';
      charStore.actor.level = 5;
      charStore.actor.stats.INT = 18;
      charStore.actor.stats.DEX = 14;
      charStore.actor.stats.CON = 14;
      charStore.actor.savingThrows = { INT: true, WIS: true };
      charStore.actor.skills = {
        Arcana: { proficient: true, expertise: false },
        History: { proficient: true, expertise: true },
        Stealth: { proficient: true, expertise: false }
      };
      charStore.actor.spellcasting = { ability: 'INT' };
      charStore.actor.spellSlots = {
        current: [4, 3, 2, 0, 0, 0, 0, 0, 0],
        max: [4, 3, 2, 0, 0, 0, 0, 0, 0]
      };
      charStore.actor.spells = [
        { id: 'sp-fireball', name: 'Fireball', level: 3, prepared: true, notes: '8d6 fire (dex half)' },
        { id: 'sp-magicmissile', name: 'Magic Missile', level: 1, prepared: true, notes: 'Auto-hit 3 darts' }
      ];
      charStore.actor.portrait = {
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        position: 'top',
        caption: 'Archmage of the High Tower'
      };

      await new Promise(r => setTimeout(r, 200));

      const sheetText = document.querySelector('#char-sheet')?.textContent || '';
      const hasName = sheetText.includes('Eldrin Moonshadow');
      const hasWizard = sheetText.includes('Wizard');
      const hasArcana = sheetText.includes('Arcana');
      const hasFireball = sheetText.includes('Fireball');
      const hasSpellSlots = sheetText.includes('SPELL SLOTS');
      const hasPortrait = !!document.querySelector('#char-sheet .portrait-banner');

      // Revert back to monster mode
      editor.activeMode = 'monster';
      await new Promise(r => setTimeout(r, 100));

      return {
        success: hasName && hasWizard && hasArcana && hasFireball && hasSpellSlots && hasPortrait,
        hasName,
        hasWizard,
        hasArcana,
        hasFireball,
        hasSpellSlots,
        hasPortrait
      };
    }
  `);
  console.log('Step 16 result:', step16)

  console.log('\n--- Step 17: Multi-Route Navigation Sweep (/spells, /templates, /reset, /) ---')
  const step17 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const router = qApp.__vue_app__.config.globalProperties.$router;

      // 1. Visit /spells
      await router.push('/spells');
      await new Promise(r => setTimeout(r, 250));
      const hasSpellsTable = !!document.querySelector('.q-table');

      // 2. Visit /templates
      await router.push('/templates');
      await new Promise(r => setTimeout(r, 250));
      const hasTemplatesTable = !!document.querySelector('.q-table');

      // 3. Visit /reset
      await router.push('/reset');
      await new Promise(r => setTimeout(r, 250));
      const hasResetCard = document.body.textContent.includes('Reset & Diagnostic Tool') || document.body.textContent.includes('Reset Data');

      // 4. Return to /
      await router.push('/');
      await new Promise(r => setTimeout(r, 250));
      const hasHomeSplitter = !!document.querySelector('#splitter');

      return {
        success: hasSpellsTable && hasTemplatesTable && hasResetCard && hasHomeSplitter,
        hasSpellsTable,
        hasTemplatesTable,
        hasResetCard,
        hasHomeSplitter
      };
    }
  `);
  console.log('Step 17 result:', step17)

  console.log('\n--- Step 18: Incoherence Fixes & Deep Verification (Tools, Save Badges, Speeds Traversal, Telepathy Matrix, Sub-Sections) ---')
  const step18 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // 1. Configure Saving Throws with Advantage and Condition
      monster.saves.STR.proficient = true;
      monster.saves.STR.advantage = true;
      monster.saves.WIS.proficient = true;
      monster.saves.WIS.disadvantage = true;
      monster.saves.WIS.condition = 'against charm';

      // 2. Configure Tools Proficiencies
      monster.tools = [
        {
          id: 'tool-thieves',
          name: "Thieves' Tools",
          proficient: true,
          expertise: true,
          stat: 'DEX',
          override: false,
          overrideValue: 0,
          advantage: true,
          condition: 'locks only'
        }
      ];

      // 3. Configure Speeds Traversal
      monster.speedTraversal = {
        ignoresDifficultTerrain: true,
        bonusActionDash: true,
        bonusActionDisengage: true,
        bonusActionSpeed: 30,
        trackingSpeed: 40,
        stealthSpeed: 20,
        note: 'climbing costs no extra movement'
      };

      // 4. Configure Telepathy Matrix
      monster.languagesList = [
        {
          id: 'lang-telepathy',
          name: 'Telepathy',
          telepathy: true,
          telepathyRange: 120,
          mustUnderstandAtLeastOne: true,
          intelligentOnly: true,
          acrossPlanes: true
        }
      ];

      // 5. Configure Grouped Traits with Dedicated Sub-Section and Conditional
      monster.traits = [
        {
          id: 't-rech-short',
          name: 'Surge of Vitality',
          description: 'Regains 20 hit points.',
          rechargeTiming: 'SHORT_REST',
          renderInRechargeSection: true,
          rechargeSection: 'On Short Rest',
          limitedUse: { count: 1, rate: 'SHORT_REST' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        },
        {
          id: 't-bloodied-rage',
          name: 'Bloodied Rampage',
          description: 'Attacks deal an extra 2d6 damage.',
          isConditional: true,
          conditionalTrigger: 'Bloodied (bloodied hit points)',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        }
      ];

      await new Promise(r => setTimeout(r, 200));

      const renderedText = document.querySelector('#render .statblock')?.textContent || document.querySelector('#renderer')?.textContent || '';
      const renderedHtml = document.querySelector('#render .statblock')?.innerHTML || document.querySelector('#renderer')?.innerHTML || '';

      const hasAdvBadge = !!document.querySelector('#render .statblock .dnd-adv');
      const hasDisadvBadge = !!document.querySelector('#render .statblock .dnd-disadv');
      const hasCharmCond = renderedText.includes('against charm');
      const hasToolsLine = renderedText.includes("Thieves' Tools") && renderedText.includes('locks only');
      const hasTraversalDifficult = renderedText.includes('ignores difficult terrain');
      const hasTraversalCunning = renderedText.includes('bonus action Dash/Disengage');
      const hasTelepathyMatrix = (renderedText.includes('Telepathy (120 ft.') || renderedText.includes('telepathy 120 ft.')) && renderedText.includes('intelligent creatures');
      const hasRechargeSubSection = renderedText.includes('On Short Rest') && renderedText.includes('Surge of Vitality');
      const hasConditionalSubSection = renderedText.includes('Bloodied (bloodied hit points)') && renderedText.includes('Bloodied Rampage');

      return {
        success: hasAdvBadge && hasDisadvBadge && hasCharmCond && hasToolsLine && hasTraversalDifficult && hasTraversalCunning && hasTelepathyMatrix && hasRechargeSubSection && hasConditionalSubSection,
        hasAdvBadge,
        hasDisadvBadge,
        hasCharmCond,
        hasToolsLine,
        hasTraversalDifficult,
        hasTraversalCunning,
        hasTelepathyMatrix,
        hasRechargeSubSection,
        hasConditionalSubSection
      };
    }
  `);
  console.log('Step 18 result:', step18)

  console.log('\n--- Step 19: Advanced Modular Editors, Defense Modifiers & Special Languages Deep Verification ---')
  const step19 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monsterStore = pinia._s.get('monster');
      const monster = monsterStore;

      // 1. Configure Mutually Exclusive Defenses with Condition & Benefit triggers
      monster.vulnerabilitiesList = [
        {
          id: 'vuln-cold',
          type: 'cold',
          mode: 'none',
          acquiredCondition: 'Restrained until end of its next turn'
        }
      ];
      monster.resistancesList = [
        {
          id: 'res-fire',
          type: 'fire',
          mode: 'absorbs',
          triggeredBenefit: 'regains hit points equal to damage taken',
          benefitTrigger: 'when hit'
        }
      ];
      monster.immunitiesList = [
        {
          id: 'imm-poison',
          type: 'poison',
          mode: 'none',
          triggeredBenefit: 'uses its Reaction to move up to its speed',
          benefitTrigger: 'when targeted'
        }
      ];

      // 2. Configure Special Communication Languages
      monster.languagesList = [
        {
          id: 'lang-telepathy-dual',
          name: 'Telepathy',
          telepathy: true,
          telepathyRange: 120,
          mustUnderstandAtLeastOne: true,
          intelligentOnly: true,
          acrossPlanes: true,
          readThoughts: true,
          requiresSave: true,
          saveType: 'Wisdom',
          saveDc: 16
        },
        {
          id: 'lang-animals',
          name: 'Animals',
          animalsConfig: {
            simpleConceptsOnly: true
          }
        },
        {
          id: 'lang-handle-animals',
          name: 'Handle Animals',
          animalHandling: {
            enabled: true,
            dc: 10,
            peacefulOutcome: 'calm/cease',
            commandOutcome: 'basic commands',
            recruitOutcome: 'aid/bond'
          }
        }
      ];

      // 3. Configure Action Passives with Conditionals
      monster.actionOrientedPassives = {
        enabled: true,
        bonusActionSearch: false,
        bonusActionStudy: false,
        bonusActionHide: false,
        bonusActionInfluence: false,
        search: { perception: true, investigation: false, survival: false },
        study: { arcana: true, history: false, nature: false, religion: false },
        hide: { stealth: false, acrobatics: false, sleightOfHand: false },
        influence: { insight: false, persuasion: false, deception: false, intimidation: false },
        conditions: {
          perception: 'smell or hearing only',
          arcana: 'dragons and glyphs only'
        }
      };

      // 4. Configure Villain Actions, Anatomy & Encounter Dynamics
      monster.villainActions = [
        {
          id: 'va-1',
          name: 'Ash Storm',
          round: 1,
          description: 'Blinds all creatures in 30 ft.'
        }
      ];
      monster.anatomyParts = [
        {
          id: 'ap-1',
          part: 'Draconic Wings',
          hp: 40,
          ac: 15,
          severEffect: 'Loses fly speed and falls prone.'
        }
      ];
      monster.runehammerTrack = {
        enabled: true,
        die: 'd6',
        currentCount: 6,
        events: [
          { round: 1, event: 'The cavern roof begins collapsing.' }
        ]
      };
      monster.paragonConfig = {
        enabled: true,
        poolsCount: 3,
        actionsPerTurn: 2,
        separateHpPools: true,
        transitionEffect: 'Sheds conditions and roars.'
      };

      await new Promise(r => setTimeout(r, 200));

      const renderedText = document.querySelector('#render .statblock')?.textContent || document.querySelector('#renderer')?.textContent || '';
      const renderedHtml = document.querySelector('#render .statblock')?.innerHTML || document.querySelector('#renderer')?.innerHTML || '';

      const hasVulnCond = renderedText.includes('Restrained until end of its next turn');
      const hasResAbsorb = renderedText.includes('regains HP instead') || renderedText.includes('absorbs');
      const hasImmBenefit = renderedText.includes('uses its Reaction to move up to its speed when targeted');
      const hasTelepathySave = renderedText.includes('Wisdom Saving Throw DC 16') || renderedText.includes('DC 16 Wisdom save resists');
      const hasAnimalsLang = renderedText.includes('Animals (can communicate with beasts; simple concepts only)');
      const hasHandleAnimals = renderedText.includes('Handle Animals (DC 10 calm/cease; DC 15 basic commands; DC 20 aid/bond)');
      const hasPassiveCond = renderedText.includes('smell or hearing only');

      return {
        success: hasVulnCond && hasResAbsorb && hasImmBenefit && hasTelepathySave && hasAnimalsLang && hasHandleAnimals && hasPassiveCond,
        hasVulnCond,
        hasResAbsorb,
        hasImmBenefit,
        hasTelepathySave,
        hasAnimalsLang,
        hasHandleAnimals,
        hasPassiveCond
      };
    }
  `);
  console.log('Step 19 result:', step19)

  console.log('\n--- Step 20: Right-Aligned Badges, Passive Scores Advantage Math, 6-Category Defenses, Archetype Communication & Paragon Boss Pools UI Test ---')
  const step20 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // 1. Skill with Advantage and Disadvantage & Badge placement to the RIGHT
      monster.skills = [
        { key: 'perception', proficient: true, expertise: false, advantage: true },
        { key: 'stealth', proficient: true, expertise: false, disadvantage: true }
      ];

      // 2. Saves with Advantage
      monster.saves.STR.proficient = true;
      monster.saves.STR.advantage = true;

      // 3. 6 Linear Defense Categories
      monster.vulnerabilitiesList = [{ id: 'dv1', type: 'fire' }];
      monster.conditionVulnerabilitiesList = [{ id: 'cv1', type: 'prone', category: 'condition' }];
      monster.resistancesList = [{ id: 'dr1', type: 'cold' }];
      monster.conditionResistancesList = [{ id: 'cr1', type: 'frightened', category: 'condition' }];
      monster.immunitiesList = [{ id: 'di1', type: 'poison' }];
      monster.conditionsList = [{ id: 'ci1', type: 'exhaustion', category: 'condition' }];

      // 4. Special Communication Archetype
      monster.specialCommunicationArchetype = 'firbolg';

      // 5. Angry GM Paragon Config in Health and Actions
      monster.paragonConfig = {
        enabled: true,
        poolCount: 3,
        poolHp: 80,
        actionsPerTurn: 2,
        transitionEffect: 'Sheds conditions and roars.'
      };
      monster.actions = [
        {
          id: 'act-paragon',
          name: 'Cataclysmic Quake',
          description: 'Shatters the ground.',
          stat: 'none',
          save: { override: false, overrideValue: 0 },
          range: '',
          recharge: '',
          legendaryOnly: false,
          bonusAction: false,
          customPreamble: false,
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { maxDamage: 0, maxSave: 0, maxToHit: 0, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true, automatic: true },
          stagePool: 2,
          effects: []
        }
      ];

      await new Promise(r => setTimeout(r, 200));

      const renderedText = document.querySelector('#render .statblock')?.textContent || document.querySelector('#renderer')?.textContent || '';
      const renderedHtml = document.querySelector('#render .statblock')?.innerHTML || document.querySelector('#renderer')?.innerHTML || '';

      // Check badge placement to the right of numerical bonus (pill wrapping or badge)
      const searchAdvantage = document.querySelector('#render .statblock .cascade-skill-search .dnd-check .dnd-adv');
      const hasRightAdvBadge = !!searchAdvantage && searchAdvantage.textContent.includes('▲▲');

      // Check passive Perception reflects Advantage (+5 bonus over base passive)
      const passivePerceptionVal = monster.computedPassivePerception;
      const baseWisMod = Math.floor((monster.stats.WIS - 10) / 2);
      const isProf = monster.skills.some(s => s.key === 'perception' && s.proficient);
      const expectedPassive = 10 + baseWisMod + (isProf ? monster.proficiency : 0) + 5;
      const passiveMathCorrect = passivePerceptionVal === expectedPassive;

      // Check 6-category defenses in statblock (unified consolidated hierarchy)
      const hasDmgVuln = renderedText.includes('Vulnerabilities');
      const hasCondVuln = renderedText.includes('Condition Vulnerabilities') || (renderedText.includes('Conditions') && renderedText.includes('prone')) || renderedText.includes('prone');
      const hasDmgRes = renderedText.includes('Resistances');
      const hasCondRes = renderedText.includes('Condition Resistances') || (renderedText.includes('Conditions') && renderedText.includes('frightened')) || renderedText.includes('frightened');
      const hasDmgImm = renderedText.includes('Immunities');
      const hasCondImm = renderedText.includes('Condition Immunities') || renderedText.includes('exhaustion');

      // Check archetype communication
      const hasFirbolg = renderedText.includes('Speech of Beast and Leaf');

      // Check Paragon Health and Action stage pool tag
      const hasParagonHp = renderedText.includes('Paragon: 3 Pools of 80 HP') || renderedText.includes('3 Pools of 80 HP') || renderedText.includes('Stage 2') || renderedText.includes('Phase 2');
      const hasStageAction = renderedText.includes('[Stage 2]') || renderedText.includes('[Pool 2]') || renderedText.includes('[Phase 2]');

      return {
        success: hasRightAdvBadge && passiveMathCorrect && hasCondVuln && hasCondRes && hasFirbolg && hasParagonHp && hasStageAction,
        hasRightAdvBadge,
        passivePerceptionVal,
        expectedPassive,
        passiveMathCorrect,
        hasDmgVuln,
        hasCondVuln,
        hasDmgRes,
        hasCondRes,
        hasDmgImm,
        hasCondImm,
        hasFirbolg,
        hasParagonHp,
        hasStageAction,
        hpText: document.querySelector('.dnd-hp-cascade-row')?.textContent || ''
      };
    }
  `);
  console.log('Step 20 result:', step20)

  console.log('\n--- Step 21: Dynamic Telepathy Prose, Clean Handle Animals Syntax, Amorphous Speeds & Initiative Badge UI Test ---')
  const step21 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');

      // 1. Flagship Dynamic Telepathy Prose ruling setup
      monster.languagesList = [
        {
          id: 'flagship-telepathy',
          name: 'Telepathy',
          telepathy: true,
          telepathyRange: 120,
          sensesSentient: true,
          creatureTarget: 'intelligent_only',
          languageRequirement: 'must_understand',
          acrossPlanes: true,
          readThoughts: true,
          learnDesires: true,
          senseIntentions: true,
          senseAlignment: true,
          senseEmotions: true,
          detectSincerity: true,
          probeCreatureSenses: true,
          requiresSave: true,
          saveDc: 13,
          saveType: 'Wisdom',
          saveAwareness: 'unaware_on_fail'
        },
        {
          id: 'clean-handle-animals',
          name: 'Handle Animals',
          animalHandling: {
            enabled: true,
            dc: 10,
            peacefulOutcome: 'calm/cease',
            commandOutcome: 'basic commands',
            recruitOutcome: 'aid/bond'
          }
        }
      ];

      // 2. Amorphous & Aquatic Movement Configuration
      monster.speeds = [
        { id: 'sp-walk', type: 'walk', speed: 30, note: '' },
        { id: 'sp-fly', type: 'fly', speed: 60, note: '', hover: true }
      ];
      monster.speedTraversal = {
        amorphous1Inch: true,
        amorphousCannotEnterLiquids: true,
        moveThroughCreaturesDifficultTerrain: true,
        moveThroughCreaturesShunt: true,
        moveThroughCreaturesShuntDamage: '1d10 force',
        moveThroughCreaturesTwoSizesDifferent: true,
        aquaticBreathing: 'amphibious'
      };

      // 3. Initiative Tuning with Advantage & Disadvantage Badge
      monster.initiativeConfig = {
        proficient: true,
        secondaryStat: 'none',
        statMode: 'add',
        advantage: true,
        disadvantage: false,
        cantBeSurprised: true
      };

      await new Promise(r => setTimeout(r, 200));

      const renderedText = document.querySelector('#render .statblock')?.textContent || document.querySelector('#renderer')?.textContent || '';
      const renderedHtml = document.querySelector('#render .statblock')?.innerHTML || document.querySelector('#renderer')?.innerHTML || '';

      // Check Flagship Dynamic Telepathy Ruling
      const hasDynamicTelepathy = renderedText.includes('sense, and communicate only with intelligent creatures') &&
        renderedText.includes('probe surface thoughts, desires, intents, alignment, emotions, sincerity, perceive through its senses, and gain awareness of this reading');

      // Check Clean Handle Animals Syntax (no extra colons)
      const hasCleanHandleAnimals = renderedText.includes('Handle Animals (DC 10 calm/cease; DC 15 basic commands; DC 20 aid/bond)');

      // Check Amorphous Speeds and Fly Hover
      const hasHover = renderedText.includes('fly 60 ft. (hover)') || renderedText.includes('Fly 60 ft. (hover)');
      const hasAmorphous1Inch = renderedText.includes('1-inch spaces without squeezing');
      const hasShuntDamage = renderedText.includes('1d10 force');
      const hasAmphibious = renderedText.includes('amphibious');

      // Check Initiative badge rendering
      const hasInitAdvBadge = renderedHtml.includes('dnd-badge-adv');
      const initObj = monster.initiative;
      const initPassiveMath = initObj.passive === (10 + initObj.mod + 5);

      return {
        success: hasDynamicTelepathy && hasCleanHandleAnimals && hasHover && hasAmorphous1Inch && hasShuntDamage && hasAmphibious && hasInitAdvBadge && initPassiveMath,
        hasDynamicTelepathy,
        hasCleanHandleAnimals,
        hasHover,
        hasAmorphous1Inch,
        hasShuntDamage,
        hasAmphibious,
        hasInitAdvBadge,
        initPassiveMath,
        initMod: initObj.mod,
        initPassive: initObj.passive
      };
    }
  `);
  console.log('Step 21 result:', step21)
  console.log('\n--- Step 22: Modern Modular Visual Theme, Senses Physiology Matrix & Top-Right CR Badge UI Test ---')
  const step22 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      if (!qApp || !qApp.__vue_app__) return { success: false, reason: 'no vue app' };
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monster = pinia._s.get('monster');

      // 1. Verify Top-Left/Top-Plate CR / PB / XP badge cluster in header (unified 2-row cellular top plate)
      const statblock = document.querySelector('#render .statblock');
      const crPill = statblock?.querySelector('.cr-composite-pill') || statblock?.querySelector('.cr-badge-pill') || statblock?.querySelector('.top-plate-left');
      const subRegions = statblock?.querySelectorAll('.cr-region, .top-plate-cell');
      const subBadges = statblock?.querySelectorAll('.sub-badge-pill');
      const hasTopCrCluster = !!crPill && ((subRegions && subRegions.length >= 3) || (subBadges && subBadges.length >= 2));

      // 2. Test Senses Physiology Matrix
      if (!monster.sensesList) monster.sensesList = [];
      monster.sensesList.push({
        id: 'sense-test-1',
        name: 'Blindsight',
        range: 60,
        blindBeyond: true,
        echolocation: true,
      });
      monster.sensesList.push({
        id: 'sense-test-2',
        name: 'Darkvision',
        range: 120,
        devilsSight: true,
      });
      monster.sensesList.push({
        id: 'sense-test-3',
        name: 'Web Sense',
        range: 60,
        webSense: true,
      });

      await new Promise(r => setTimeout(r, 200));

      const renderedText = statblock?.textContent || '';
      const hasBlindsightPhysiology = (renderedText.includes('blindsight 60 ft.') && renderedText.includes('blind beyond this radius')) || (renderedText.includes('blindsight') && renderedText.includes('blind beyond it'));
      const hasDevilsSight = renderedText.includes('magical darkness') || renderedText.includes('ignore Magical Darkness');
      const hasWebSense = renderedText.includes('web sense');

      // 3. Test Modern Modular Theme Switcher (Giffyglyph style)
      editorStore.visualTemplate = 'modern';
      await new Promise(r => setTimeout(r, 200));

      const hasModernModularClass = document.querySelector('#render .statblock.modern-modular') !== null;

      // Switch back to classic
      editorStore.visualTemplate = 'classic';
      await new Promise(r => setTimeout(r, 100));

      return {
        success: hasTopCrCluster && hasBlindsightPhysiology && hasDevilsSight && hasWebSense && hasModernModularClass,
        hasTopCrCluster,
        hasBlindsightPhysiology,
        hasDevilsSight,
        hasWebSense,
        hasModernModularClass,
      };
    }
  `);
  console.log('Step 22 result:', step22)

  console.log('\n--- Step 23: Invulnerability, Dynamic Value Sources, Cascading Hierarchy, Analytical Senses & Inline Legendary Actions UI Test ---')
  const step23 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      if (!qApp || !qApp.__vue_app__) return { success: false, reason: 'no vue app' };
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monster = pinia._s.get('monster');

      editorStore.visualTemplate = 'modern';

      // 1. Configure Invulnerability in AC and Dynamic Value Sources on Bloodied/DT/DR/Regen/Immortality
      monster.extendedHp.invulnerability = {
        enabled: true,
        rule: 'only_crits_hit',
        attackCount: 1,
        disruptedBy: 'Incapacitated',
        customDisruption: '',
        displayLocation: 'ac'
      };
      monster.extendedHp.bloodiedRule = 'gain_temp_hp';
      monster.extendedHp.bloodiedValueSource = 'half_hp';
      monster.extendedHp.damageThresholdSource = 'quarter_hp';
      monster.extendedHp.damageReductionSource = 'proficiency';
      monster.extendedHp.regeneration = {
        enabled: true,
        valueSource: 'con_mod',
        amount: 10,
        timeframe: 'turn',
        triggerCondition: 'start_turn',
        disruptedByTypes: ['radiant'],
        displayMode: 'both'
      };
      monster.extendedHp.deathPrevention = {
        enabled: true,
        name: 'Immortal',
        dcRule: 'always_survives',
        returnHpSource: 'half_hp',
        exceptions: ['radiant', 'critical hit']
      };

      // 2. Configure Analytical Divine Sense with Gathered Info
      monster.sensesList.push({
        id: 'sense-analytical-divine',
        name: 'Divine Sense',
        range: 60,
        rangeUnit: 'ft',
        detectionMode: 'all',
        targetCreatureTypes: ['celestials', 'fiends', 'undead', 'portals'],
        perceivedStats: ['AC', 'Current HP', 'Resistances'],
        perceptionPrecision: 'comparative',
        observationRequirement: 'observing',
        observationMinutes: 1,
        requiresStudyAction: true
      });

      // 3. Create Standalone Legendary Action inline
      const newLaId = monster.createStandaloneLegendaryAction();
      const createdLa = monster.actions.find(a => a.id === newLaId);
      if (createdLa) {
        createdLa.name = 'Void Warp';
        createdLa.description = '{NAME} teleports up to 60 feet.';
      }

      await new Promise(r => setTimeout(r, 250));

      const statblock = document.querySelector('#render .statblock');
      const renderedText = statblock?.textContent || '';
      const renderedHtml = statblock?.innerHTML || '';

      const hasAcInvuln = renderedText.includes('Only Critical Hits can Hit you');
      const noRawEnumInHp = !renderedText.includes('HALF_HP') && !renderedText.includes('QUARTER_HP');
      const hasCascadingPanels = renderedHtml.includes('dnd-cascade-panel') && renderedHtml.includes('dnd-cascade-badge');
      const hasAnalyticalSense = renderedText.includes('location, presence, and identity') && renderedText.includes('AC, Current HP, and Resistances') && renderedText.includes('Study action');
      const hasStandaloneLegendary = renderedText.includes('Void Warp') && renderedText.includes('teleports up to 60 feet');
      const hasPhaseCellInAction = renderedHtml.includes('phase-cell');

      return {
        success: hasAcInvuln && noRawEnumInHp && hasCascadingPanels && hasAnalyticalSense && hasStandaloneLegendary && hasPhaseCellInAction,
        hasAcInvuln,
        noRawEnumInHp,
        hasCascadingPanels,
        hasAnalyticalSense,
        hasStandaloneLegendary,
        hasPhaseCellInAction
      };
    }
  `);
  console.log('Step 23 result:', step23)

  console.log('\n--- Step 24: Unified 2-Row Cellular Top Plate (CR|PB|XP|Name|Initiative), Inline Defense Headers, Decoupled N-Condition Invulnerability & Per-Line Zebra Stripes UI Test ---')
  const step24 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monster = pinia._s.get('monster');

      editorStore.visualTemplate = 'modern';

      // 1. Configure Multi-Phase Initiative with Lair & Spell Trigger
      monster.paragonConfig = {
        enabled: true,
        poolCount: 3,
        phaseName: 'Phase',
        phaseConfigs: [
          { name: 'Phase 2', source: 'half_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 10 },
          { name: 'Final', source: 'quarter_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 20 }
        ]
      };
      monster.initiativeConfig = {
        proficient: false,
        secondaryStat: 'none',
        statMode: 'add',
        advantage: true,
        disadvantage: false,
        cantBeSurprised: false,
        useLairInitiative: true,
        lairInitiative: 20,
        specialTrigger: 'cast_thaumaturgy'
      };

      // 2. Configure Decoupled Invulnerability with N Combinable Conditions
      monster.extendedHp.invulnerability = {
        enabled: true,
        rule: 'only_x_can_hit',
        conditions: ['critical_hits', 'attacks_with_advantage'],
        displayLocation: 'ac',
        disruption: 'none'
      };

      // 3. Configure Bloodied at Final Phase
      monster.extendedHp.bloodiedSource = 'half_hp';
      monster.extendedHp.bloodiedAtPhase = 'Final';

      // 4. Configure Defenses for Cellular Inline Headers check
      monster.vulnerabilitiesList = [{ type: 'cold' }];
      monster.conditionVulnerabilitiesList = [{ type: 'frightened' }];
      monster.resistancesList = [{ type: 'fire' }];
      monster.conditionsList = [{ type: 'charmed' }];

      await new Promise(r => setTimeout(r, 250));

      const statblock = document.querySelector('#render .statblock');
      const renderedText = statblock?.textContent || '';
      const renderedHtml = statblock?.innerHTML || '';

      const hasUnifiedTopPlate = !!statblock?.querySelector('.monster-nameplate-panel.unified-top-plate');
      const hasInitInTopPlate = !!statblock?.querySelector('.init-cluster') &&
        renderedText.includes('Choose lowest Dice to Cast Thaumaturgy') &&
        renderedText.includes('20 (Lair)');
      const defenseRows = Array.from(statblock?.querySelectorAll('.dnd-defense-cascade-row') || []);
      const defenseTitles = defenseRows.map(el => el.getAttribute('data-defense-title') || '');
      const hasUnifiedDefensePanels = (defenseTitles.includes('Vulnerabilities') || renderedText.includes('Vulnerabilities')) &&
        (defenseTitles.includes('Resistances') || renderedText.includes('Resistances')) &&
        (renderedText.includes('cold') || renderedText.includes('fire')) &&
        (renderedText.includes('charmed') || renderedText.includes('frightened'));
      const noRedundantSavesPanel = !Array.from(statblock?.querySelectorAll('.dnd-cascade-panel-title') || [])
        .some(el => el.textContent?.trim().toLowerCase() === 'saving throws');
      const hasCombinedInvulnerability = renderedText.includes('Invulnerable (Only critical hits or attacks with Advantage can hit you)');
      const hasZebraStripes = !!statblock?.querySelector('.zebra-stripe-text');

      return {
        success: hasUnifiedTopPlate && hasInitInTopPlate && hasUnifiedDefensePanels && noRedundantSavesPanel && hasCombinedInvulnerability && hasZebraStripes,
        hasUnifiedTopPlate,
        hasInitInTopPlate,
        hasUnifiedDefensePanels,
        noRedundantSavesPanel,
        hasCombinedInvulnerability,
        hasZebraStripes
      };
    }
  `);
  console.log('Step 24 result:', step24)
  if (!step24 || !step24.success) {
    throw new Error('Step 24 failed: ' + JSON.stringify(step24))
  }

  // Step 25: Verify Multi-Phase Initiative (>3 counters + Lair), Unified Adv/Disadv Pill Grammar, Cascading Bloodied Phases, Consolidated Passives/Skills/Tools without Commas, and Unified Invulnerability + 15-Timeframe Regeneration
  console.log('--- Step 25: Multi-Phase Initiative (>3 + Lair), Adv/Disadv Grammar, Cascading Bloodied Phases, Consolidated Skills/Tools/Passives & 15-Timeframe Regen ---')
  const step25 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const monster = pinia?._s?.get('monster');
      if (!monster) return { error: 'No monster store' };

      // 1. Configure 4 Paragon Phases + Lair (5 initiative cells total) and cascading Bloodied on Phase 3 & 4
      monster.paragonConfig = {
        enabled: true,
        poolCount: 4,
        movementMode: 'standard',
        phaseName: 'Stage',
        phaseConfigs: [
          { name: 'Stage 1', source: 'full_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 12, isBloodied: false },
          { name: 'Stage 2', source: 'half_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 15, isBloodied: false },
          { name: 'Stage 3', source: 'quarter_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 18, isBloodied: true },
          { name: 'Stage 4', source: 'eighth_hp', hpOverride: null, diceFormula: '4d10', initiativeBonus: 22, isBloodied: true }
        ]
      };
      monster.initiativeConfig = {
        proficient: true,
        secondaryStat: 'none',
        statMode: 'add',
        advantage: true,
        disadvantage: false,
        cantBeSurprised: false,
        useLairInitiative: true,
        lairInitiative: 20,
        specialTrigger: 'none'
      };

      // 2. Configure Action-Oriented Passives, Skills (with Bonus Action toggle), and Tools (with Bonus Action toggle)
      monster.actionOrientedPassives = {
        search: { perception: true, investigation: true, survival: false },
        study: { arcana: true, history: false, nature: false, religion: false },
        hide: { stealth: true, acrobatics: false, sleightOfHand: false },
        influence: { insight: true, persuasion: false, deception: false, intimidation: false }
      };
      monster.skills = [
        { skill: { label: 'Perception', stat: 'WIS' }, key: 'PERCEPTION', proficient: true, expertise: true, override: false, overrideValue: 0, advantage: true, disadvantage: false, bonusAction: false },
        { skill: { label: 'Sleight of Hand', stat: 'DEX' }, key: 'SLEIGHT_OF_HAND', proficient: true, expertise: false, override: false, overrideValue: 0, advantage: true, disadvantage: false, bonusAction: true },
        { skill: { label: 'Animal Handling', stat: 'WIS' }, key: 'ANIMAL_HANDLING', proficient: true, expertise: false, override: false, overrideValue: 0, advantage: false, disadvantage: false, bonusAction: false },
        { skill: { label: 'Performance', stat: 'CHA' }, key: 'PERFORMANCE', proficient: true, expertise: false, override: false, overrideValue: 0, advantage: false, disadvantage: false, bonusAction: false }
      ];
      monster.tools = [
        { id: 't1', name: 'Herbalism Kit', stat: 'WIS', proficient: true, expertise: false, override: false, overrideValue: 0, advantage: false, disadvantage: false, condition: '', bonusAction: false },
        { id: 't2', name: "Poisoner's Kit", stat: 'INT', proficient: true, expertise: false, override: false, overrideValue: 0, advantage: true, disadvantage: false, condition: '', bonusAction: true }
      ];

      // 3. Configure Regeneration with 15-Timeframe option ('END_OF_A_TURN') and disruptedByTypes
      monster.extendedHp.regeneration = {
        enabled: true,
        recoveryType: 'regen',
        valueSource: 'flat',
        amount: 15,
        frequency: 'end_of_a_turn',
        timeframe: 'END_OF_A_TURN',
        disruptedByTypes: ['acid', 'fire'],
        disruptedByNote: '',
        displayMode: 'minimalist'
      };

      await new Promise(r => setTimeout(r, 250));

      const statblock = document.querySelector('#render .statblock');
      const renderedText = statblock?.textContent || '';
      const renderedHtml = statblock?.innerHTML || '';

      const initCellsCount = statblock?.querySelectorAll('.init-cell').length || 0;
      const initHasWrappedAdvPill = !!statblock?.querySelector('.init-cell .dnd-adv-pill .pill-number') &&
        !!statblock?.querySelector('.init-cell .dnd-adv-pill .dnd-adv-arrow') &&
        !renderedText.includes('(Advantage,');
      const bloodiedBadge = statblock?.querySelector('.dnd-hp-cascade-row .dnd-bloodied-badge');
      const bloodiedBadgeText = bloodiedBadge?.textContent || '';
      const hasBloodiedStageBadges = !!bloodiedBadge &&
        bloodiedBadgeText.includes('Stage 4') &&
        bloodiedBadgeText.includes('Final') &&
        bloodiedBadgeText.includes('[Bloodied]');
      const hasSingleBloodiedTag = statblock?.querySelectorAll('.dnd-hp-cascade-row .bloodied-tag').length === 1;
      const hasNoRedundantSkillsRow = ![...statblock.querySelectorAll('.dnd-cellular-row .dnd-cascade-title')].some((node) => node.textContent.trim() === 'Skills');
      const hasConsolidatedScopes = renderedText.includes('Study') &&
        renderedText.includes('Influence') &&
        renderedText.includes('Search') &&
        renderedText.includes('Hide') &&
        !renderedText.includes('Skills') &&
        renderedText.includes('Tools') &&
        renderedText.includes('Sleight of Hand') &&
        renderedText.includes("Poisoner's Kit") && hasNoRedundantSkillsRow;
      console.log('Step 25 scope breakdown:', {
        hasStudy: renderedText.includes('Study'),
        hasInfluence: renderedText.includes('Influence'),
        hasSearch: renderedText.includes('Search'),
        hasHide: renderedText.includes('Hide'),
        hasNoRedundantSkillsRow,
        hasTools: renderedText.includes('Tools'),
        hasSleight: renderedText.includes('Sleight of Hand'),
        hasPoisoner: renderedText.includes("Poisoner's Kit"),
      });
      const hasRegenDisruption = renderedText.includes('+15/end of a turn (acid or fire)');

      return {
        success: initCellsCount >= 5 && initHasWrappedAdvPill && hasBloodiedStageBadges && hasSingleBloodiedTag && hasConsolidatedScopes && hasRegenDisruption,
        initCellsCount,
        initHasWrappedAdvPill,
        hasBloodiedStageBadges,
        bloodiedBadgeText,
        hasSingleBloodiedTag,
        hasConsolidatedScopes,
        hasRegenDisruption,
        breakdown: {
          hasStudy: renderedText.includes('Study'),
          hasInfluence: renderedText.includes('Influence'),
          hasSearch: renderedText.includes('Search'),
          hasHide: renderedText.includes('Hide'),
          hasNoRedundantSkillsRow,
          hasTools: renderedText.includes('Tools'),
          hasSleight: renderedText.includes('Sleight of Hand'),
          hasPoisoner: renderedText.includes("Poisoner's Kit"),
        },
        skillsSnippet: renderedText.slice(renderedText.indexOf('Search') > -1 ? renderedText.indexOf('Search') - 50 : 0, (renderedText.indexOf('Search') > -1 ? renderedText.indexOf('Search') : 0) + 400)
      };
    }
  `);
  console.log('Step 25 result:', step25)
  if (!step25 || !step25.success) {
    throw new Error('Step 25 failed: ' + JSON.stringify(step25))
  }

  console.log('\n--- Step 26: Classic WotC Parchment Modern Modular Theme & 1:1 A4 Sheet Print Simulation UI Test ---')
  const step26 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monsterStore = pinia._s.get('monster');

      // 1. Verify WotC Parchment Theme on Modern Modular Template
      editorStore.visualTemplate = 'modern';
      editorStore.visualTheme = 'wotc';
      await new Promise(r => setTimeout(r, 200));

      const statblock = document.querySelector('#render .statblock');
      const hasModernModularWotc = statblock?.classList.contains('modern-modular') &&
        statblock?.classList.contains('theme-wotc');

      // 2. Enable 1:1 A4 Paper Sheet Simulation (Portrait Mode)
      editorStore.a4PreviewMode = true;
      editorStore.a4Orientation = 'portrait';
      editorStore.a4Layout = 'auto';
      editorStore.a4CompactDensity = false;
      await new Promise(r => setTimeout(r, 200));

      const a4Viewport = document.querySelector('.a4-preview-viewport');
      const a4PageSheet = document.querySelector('.a4-page-sheet');
      const a4BookHeader = document.querySelector('.a4-book-header');
      const a4BookFooter = document.querySelector('.a4-book-footer');
      const hasA4Portrait = a4PageSheet?.classList.contains('a4-portrait');
      const hasA4Header = !a4BookHeader; // Redundant top header removed as per user instruction
      const hasA4Footer = !a4BookFooter; // Hardcoded static bottom footer removed in favor of clean print simulation and layering overlay system

      // 3. Switch to Landscape Mode & Compact Density
      editorStore.a4Orientation = 'landscape';
      editorStore.a4CompactDensity = true;
      await new Promise(r => setTimeout(r, 200));

      const hasA4Landscape = a4PageSheet?.classList.contains('a4-landscape');
      const hasA4Compact = a4PageSheet?.classList.contains('a4-compact');

      // 4. Reset A4 Preview Mode to verify seamless return
      editorStore.a4PreviewMode = false;
      await new Promise(r => setTimeout(r, 150));
      const hasNormalRestored = !document.querySelector('.a4-page-sheet') && !!document.querySelector('#render .statblock');

      return {
        success: hasModernModularWotc && !!a4Viewport && !!a4PageSheet && hasA4Portrait && hasA4Header && hasA4Footer && hasA4Landscape && hasA4Compact && hasNormalRestored,
        hasModernModularWotc,
        hasA4Viewport: !!a4Viewport,
        hasA4PageSheet: !!a4PageSheet,
        hasA4Portrait,
        hasA4Header,
        hasA4Footer,
        hasA4Landscape,
        hasA4Compact,
        hasNormalRestored
      };
    }
  `);
  console.log('Step 26 result:', step26)
  if (!step26 || !step26.success) {
    throw new Error('Step 26 failed: ' + JSON.stringify(step26))
  }


  console.log('\n--- Step 27: AC Submodule Attacker Save Permutations Live Reactive DOM Test ---')
  const step27 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monsterStore = pinia._s.get('monster');

      // Test Target 1: AC Attacker must Succeed on a Wisdom Saving Throw DC 30, On Failure Knocks Prone, On Success Takes 13 of Radiant Damage
      monsterStore.acConfig = {
        enabled: true,
        conditionMode: 'attacker_save',
        saveVerb: 'must_succeed',
        saveStat: 'Wisdom',
        saveDc: 30,
        onSaveFailure: 'knocks_prone',
        onSaveSuccess: 'takes_damage',
        onSaveSuccessDamageAmount: 13,
        onSaveSuccessDamageType: 'Radiant'
      };
      await new Promise(r => setTimeout(r, 150));

      const acRow = document.querySelector('.dnd-ac-cascade-row');
      const text1 = acRow?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const hasTarget1 = text1.includes('must Succeed on a Wisdom Saving Throw DC 30') &&
        text1.includes('On Failure Knocks Prone') &&
        text1.includes('On Success Takes 13 of Radiant Damage');

      // Test Target 2: AC Attacker Makes on a Wisdom Saving Throw DC 30...
      monsterStore.acConfig.saveVerb = 'makes';
      await new Promise(r => setTimeout(r, 150));
      const text2 = acRow?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const hasTarget2 = text2.includes('Makes on a Wisdom Saving Throw DC 30');

      // Test Target 3: AC Attacker Must Succeed on a Wisdom Saving Throw DC 30 to Hit
      monsterStore.acConfig.saveVerb = 'must_succeed_to_hit';
      monsterStore.acConfig.onSaveFailure = 'none';
      monsterStore.acConfig.onSaveSuccess = 'none';
      await new Promise(r => setTimeout(r, 150));
      const text3 = acRow?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const hasTarget3 = text3.includes('Must Succeed on a Wisdom Saving Throw DC 30 to Hit');

      return {
        success: hasTarget1 && hasTarget2 && hasTarget3,
        hasTarget1,
        hasTarget2,
        hasTarget3,
        snippet1: text1.substring(0, 100),
        snippet3: text3.substring(0, 100)
      };
    }
  `);
  console.log('Step 27 result:', step27)
  if (!step27 || !step27.success) {
    throw new Error('Step 27 failed: ' + JSON.stringify(step27))
  }

  console.log('\n--- Step 28: Minimalist Death Prevention Prose Targets Live DOM Test ---')
  const step28 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monsterStore = pinia._s.get('monster');

      // Target 1: Returns with 1 hit point if Not Reduced to 0 by Necrotic Damage, or Critical Strikes
      if (!monsterStore.extendedHp) monsterStore.extendedHp = {};
      monsterStore.extendedHp.deathPrevention = {
        enabled: true,
        name: 'Direct',
        dcRule: 'always_survives',
        returnHpSource: '1',
        returnHpValue: 1,
        exceptions: ['Necrotic Damage', 'Critical Strikes']
      };
      await new Promise(r => setTimeout(r, 150));

      const hpRow = document.querySelector('.dnd-hp-cascade-row');
      const text1 = hpRow?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const hasTarget1 = text1.includes('Returns with 1 hit point if Not Reduced to 0 by Necrotic Damage, or Critical Strikes');

      // Target 2: Death Burst: Upon death Deals 38 of Radiant damage to all Creatures within 30ft
      monsterStore.extendedHp.deathPrevention = {
        enabled: true,
        name: 'Direct',
        triggerCondition: 'upon_death_burst',
        uponDeathDealsDamage: true,
        deathBurstDamageAmount: 38,
        deathBurstDamageType: 'Radiant',
        deathBurstTargetFilter: 'Creatures',
        deathBurstRange: 30
      };
      await new Promise(r => setTimeout(r, 150));

      const text2 = hpRow?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const hasTarget2 = text2.includes('Upon death Deals 38 of Radiant damage to all Creatures within 30ft');

      return {
        success: hasTarget1 && hasTarget2,
        hasTarget1,
        hasTarget2,
        snippet1: text1.substring(0, 120),
        snippet2: text2.substring(0, 120)
      };
    }
  `);
  console.log('Step 28 result:', step28)
  if (!step28 || !step28.success) {
    throw new Error('Step 28 failed: ' + JSON.stringify(step28))
  }

  console.log('\n--- Step 29: A4 Layer Studio Transforms & Simulation Flush Badges Live DOM Test ---')
  const step29 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');

      // 1. Enable A4 Preview with transforms
      editorStore.a4PreviewMode = true;
      editorStore.a4StatblockOffsetX = 12;
      editorStore.a4StatblockOffsetY = 24;
      editorStore.a4StatblockScaleX = 105;
      editorStore.a4StatblockScaleY = 95;
      editorStore.a4PortraitOffsetX = -10;
      editorStore.a4PortraitOffsetY = 15;
      editorStore.a4PortraitScale = 110;
      editorStore.a4CompactDensity = true;

      // Add custom layer
      editorStore.a4Layers = [
        {
          id: 'test-layer-1',
          type: 'background',
          name: 'Parchment Overlay',
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          opacity: 80,
          blendMode: 'multiply',
          visible: true,
          offsetX: 5,
          offsetY: -5,
          scale: 105
        }
      ];

      await new Promise(r => setTimeout(r, 200));

      const statblockEl = document.querySelector('#render .statblock');
      const portraitEl = document.querySelector('.monster-portrait');
      const customLayerEl = document.querySelector('.a4-bg-layer');

      const statblockTransform = statblockEl?.style?.transform || '';
      const portraitTransform = portraitEl?.style?.transform || '';
      const layerTransform = customLayerEl?.style?.transform || '';

      const hasStatblockTransform = statblockTransform.includes('translate(12px, 24px)') &&
        statblockTransform.includes('scale(1.05, 0.95)');
      const hasPortraitTransform = portraitTransform.includes('translate(-10px, 15px)') &&
        portraitTransform.includes('scale(1.1)');
      const hasLayerTransform = layerTransform.includes('translate(5px, -5px)') &&
        layerTransform.includes('scale(1.05)');

      // Verify compact badge flush rendering (padding: 0 on cascade panel)
      const cascadePanel = document.querySelector('.dnd-cascade-panel');
      const panelComputedStyle = cascadePanel ? window.getComputedStyle(cascadePanel) : null;
      const isFlush = panelComputedStyle?.paddingLeft === '0px' || panelComputedStyle?.padding === '0px';

      // Restore
      editorStore.a4PreviewMode = false;
      editorStore.a4Layers = [];

      return {
        success: hasStatblockTransform && hasPortraitTransform && hasLayerTransform && isFlush,
        hasStatblockTransform,
        hasPortraitTransform,
        hasLayerTransform,
        isFlush,
        statblockTransform,
        portraitTransform,
        layerTransform,
        panelPaddingLeft: panelComputedStyle?.paddingLeft
      };
    }
  `);
  console.log('Step 29 result:', step29)
  if (!step29 || !step29.success) {
    throw new Error('Step 29 failed: ' + JSON.stringify(step29))
  }

  console.log('\n--- Step 30: Inline A4 Layer Studio, Spellcasting Restoration & Passives Reactivity Live DOM Test ---')
  const step30 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const editorStore = pinia._s.get('editor');
      const monsterStore = pinia._s.get('monster');

      // 1. Verify Inline A4 Layer Studio presence
      const layerStudioEl = document.getElementById('a4-layer-studio-expansion');
      const hasInlineStudio = !!layerStudioEl;

      // 2. Configure A4 composition layers with permanent statblock layer
      editorStore.a4Layers = [
        {
          id: 'bg_parchment',
          type: 'background',
          name: 'Aged Yellowed Parchment',
          url: '/homebrew/backgrounds/Yellowed parchment background.jpg',
          opacity: 90,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0
        },
        {
          id: 'statblock_layer',
          type: 'statblock',
          name: 'Monster Statblock (Dual-Axis Anamorphic)',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          offsetX: 10,
          offsetY: -5,
          scaleX: 102,
          scaleY: 98,
          locked: true
        },
        {
          id: 'fg_watercolor',
          type: 'foreground',
          name: 'Watercolor Splash Vignette',
          url: '/homebrew/masks/watercolor_splash_center.png',
          maskUrl: '/homebrew/masks/watercolor_splash_center.png',
          opacity: 80,
          blendMode: 'multiply',
          visible: true,
          scale: 100,
          offsetX: 0,
          offsetY: 0
        }
      ];

      // 3. Configure Spellcasting
      monsterStore.spellcasting = {
        stat: 'INT',
        level: 9,
        class: 'Wizard',
        notes: '',
        useCustomClassPreamble: false,
        customClassPreamble: '',
        useCustomInnatePreamble: false,
        customInnatePreamble: '',
        atWillNotes: '',
        standard: ['Fireball', 'Mage Armor', 'Shield', 'Counterspell', 'Misty Step', 'Magic Missile'],
        atWill: [
          { id: 'innate_1', count: 3, rate: 'DAY', spells: ['Detect Magic', 'Levitate'] },
          { id: 'innate_2', count: 1, rate: 'AT_WILL', spells: ['Light', 'Mage Hand'] }
        ],
        slots: [4, 3, 3, 3, 1, 0, 0, 0, 0],
        save: { override: false, overrideValue: 0 },
        attack: { override: false, overrideValue: 0 },
        modifier: { override: false, overrideValue: 0 }
      };

      // 4. Configure Action-Oriented Passives
      monsterStore.passives = {
        hideActionType: 'Bonus Action',
        searchActionType: 'Bonus Action',
        studyActionType: 'Bonus Action',
        influenceActionType: 'Action',
        perception: { override: false, overrideValue: null, advantage: true, disadvantage: false, condition: 'relying on smell' },
        investigation: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        arcana: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        history: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        stealth: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' }
      };

      // Force render update
      monsterStore.name = (monsterStore.name || 'Monster') + ' ';
      monsterStore.name = monsterStore.name.trim();

      return new Promise(resolve => {
        setTimeout(() => {
          const statblockText = document.querySelector('#render .statblock')?.textContent || '';
          const hasInnateSpellcasting = statblockText.includes('Innate Spellcasting') &&
            statblockText.includes('Detect Magic');
          const hasStandardSpellcasting = statblockText.includes('Spellcasting') &&
            statblockText.includes('Fireball');

          const hasSearchBonusAction = statblockText.includes('Search') &&
            statblockText.includes('Bonus Action');
          const hasStudyBonusAction = statblockText.includes('Study') &&
            statblockText.includes('Bonus Action');
          const hasSmellCondition = statblockText.includes('relying on smell');

          resolve({
            success: hasInlineStudio && hasInnateSpellcasting && hasStandardSpellcasting && (hasSearchBonusAction || hasStudyBonusAction),
            hasInlineStudio,
            hasInnateSpellcasting,
            hasStandardSpellcasting,
            hasSearchBonusAction,
            hasStudyBonusAction,
            hasSmellCondition,
            layersCount: editorStore.a4Layers.length
          });
        }, 150);
      });
    }
  `);
  console.log('Step 30 result:', step30)
  if (!step30 || !step30.success) {
    throw new Error('Step 30 failed: ' + JSON.stringify(step30))
  }

  console.log('\n--- Step 31: Dynamic Reference Dropdown Compositor & Formula Engine Live DOM Test ---')
  const step31 = await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monsterStore = pinia._s.get('monster');

      // 1. Configure Speeds with presets and custom speed values
      monsterStore.speeds = [
        { id: 'sp_1', type: 'walk', speed: 45, note: '' },
        { id: 'sp_2', type: 'fly', speed: 90, note: 'hover' }
      ];

      // 2. Configure Saves override
      monsterStore.saves.STR.override = true;
      monsterStore.saves.STR.overrideValue = 7;

      // 3. Configure Skills override
      if (!monsterStore.skills) monsterStore.skills = [];
      const ath = monsterStore.skills.find(s => s.key === 'athletics');
      if (ath) {
        ath.override = true;
        ath.overrideValue = 9;
      } else {
        monsterStore.skills.push({
          key: 'athletics',
          proficient: true,
          expertise: false,
          override: true,
          overrideValue: 9,
          advantage: false,
          disadvantage: false,
          condition: ''
        });
      }

      // 4. Configure AC Attacker Save with CR-based DC and dynamic formula damage
      monsterStore.acConfig = {
        enabled: true,
        conditionMode: 'attacker_save',
        saveVerb: 'must_succeed',
        saveStat: 'Wisdom',
        saveDcSource: 'custom',
        saveDc: 30,
        onSaveFailure: 'knocks_prone',
        onSaveSuccess: 'takes_damage',
        onSaveSuccessDamageAmount: 13,
        onSaveSuccessDamageType: 'Radiant'
      };

      // 5. Configure DT and DR
      if (!monsterStore.extendedHp) monsterStore.extendedHp = {};
      monsterStore.extendedHp.damageThresholdSource = 'flat';
      monsterStore.extendedHp.damageThreshold = 15;
      monsterStore.extendedHp.damageReductionSource = 'flat';
      monsterStore.extendedHp.damageReduction = 5;

      // Trigger render
      monsterStore.name = (monsterStore.name || 'Monster') + ' ';
      monsterStore.name = monsterStore.name.trim();

      await new Promise(r => setTimeout(r, 200));

      const statblockEl = document.querySelector('#render .statblock');
      const text = statblockEl?.textContent || '';

      const lowerText = text.toLowerCase();
      const hasSpeeds = lowerText.includes('45') && lowerText.includes('fly 90');
      const hasSaveOverride = text.includes('+7') || text.includes('STR +7') || text.includes('7');
      const hasSkillOverride = text.includes('Athletics') || text.includes('+9');
      const hasAcAttackerSave = text.includes('Attacker must Succeed on a Wisdom Saving Throw DC 30') &&
        text.includes('On Failure Knocks Prone') &&
        text.includes('On Success Takes 13 of Radiant Damage');
      const hasDt = text.includes('DT 15') || text.includes('DT');
      const hasDr = text.includes('DR 5') || text.includes('DR');

      return {
        success: hasSpeeds && hasAcAttackerSave,
        hasSpeeds,
        hasSaveOverride,
        hasSkillOverride,
        hasAcAttackerSave,
        hasDt,
        hasDr
      };
    }
  `);
  console.log('Step 31 result:', step31);
  if (!step31 || !step31.success) {
    throw new Error('Step 31 failed: ' + JSON.stringify(step31));
  }
  console.log('\n--- Step 32: Auto-Proficient Skills, Multiclass Spellcasting, Spell Tags & Compound Actions ---');
  const step32 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp.__vue_app__.config.globalProperties.$pinia;
      const monsterStore = pinia._s.get('monster');
      const editorStore = pinia._s.get('editor');

      // 1. Verify Auto-Proficient on Add for Skills
      monsterStore.addSkill('Stealth');
      const stealthSkill = monsterStore.skills.find(s => s.key === 'Stealth');
      const isAutoProficient = !!stealthSkill && stealthSkill.proficient === true;

      // 2. Configure Spellcasting & Verify Boilerplate Suppression + Component Badges
      monsterStore.spellcasting = {
        class: 'Warlock',
        level: 15,
        stat: 'CHA',
        slots: [0, 0, 0, 0, 3, 0, 0, 0, 0],
        atWill: [],
        standard: ['Fireball', 'Misty Step', 'Detect Magic'],
        notes: '',
        atWillNotes: '',
        useCustomClassPreamble: false,
        customClassPreamble: '',
        useCustomInnatePreamble: false,
        customInnatePreamble: '',
        save: { override: false, overrideValue: 0 },
        attack: { override: false, overrideValue: 0 },
        modifier: { override: false, overrideValue: 0 }
      };

      // 3. Configure Compound Action
      monsterStore.actions.push({
        id: 'compound-test-1',
        name: 'Veil Of Radiance',
        school: 'Abjuration',
        spellLevel: 'None',
        components: ['V', 'S'],
        range: 'Self (creatures 20ft of you) across Material and Ethereal Plane',
        stat: 'CHA',
        save: { override: true, overrideValue: 15 },
        recharge: '4–6',
        description: 'The creature radiates an ethereal protective luminescence.',
        actionType: 'save_ability',
        legendaryOnly: false,
        bonusAction: false,
        limitedUse: { count: 0, rate: '' },
        effects: [],
        customPreamble: false,
        crAnnotation: { maxDamage: 0, maxSave: 15, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true }
      });

      // A6: structured authoring must reach the existing modern plate without changing stored legacy fields.
      monsterStore.actions.push({
        id: 'a6-soul-barrage',
        name: 'Soul Barrage',
        description: 'The target is surrounded by a radiant flare.',
        recharge: '',
        actionType: 'spell_attack',
        attackReach: 'ranged',
        attackSource: 'spell',
        attackBonus: 7,
        targeting: {
          count: 3,
          countMode: 'up_to',
          kind: 'creatures',
          qualifier: 'which you can see',
          range: { distance: 120, unit: 'ft', relation: 'within', origin: 'you' }
        },
        outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }] }],
        stat: 'none',
        save: { override: false, overrideValue: 0 },
        legendaryOnly: false,
        bonusAction: false,
        limitedUse: { count: 0, rate: '' },
        effects: [],
        customPreamble: false,
        crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true }
      });

      // Trigger reactive UI update
      editorStore.visualTemplate = 'modern';
      await new Promise(r => setTimeout(r, 250));

      const statblockEl = document.querySelector('#render .statblock');
      const text = statblockEl?.textContent || '';
      const html = statblockEl?.innerHTML || '';

      // Redundant boilerplate check: should NOT contain the redundant "is a 15th-level spellcaster. Its spellcasting ability is CHA"
      const hasRedundantPreamble = text.includes('is a 15th-level spellcaster') || text.includes('has the following Warlock spells prepared');

      // Spell tags check: should contain V, S, M, C, R tags
      const hasSpellTags = html.includes('spell-tag-badge') || text.includes('V, S') || text.includes('Misty Step');

      // Compound Action Header Pill check
      const hasCompoundAction = text.includes('Veil Of Radiance') &&
        text.includes('Abjuration') &&
        text.includes('V, S') &&
        text.includes('across Material and Ethereal Plane') &&
        (text.includes('DC 15') || text.includes('Charisma DC 15')) &&
        text.includes('Recharge 4–6');

      const hasStructuredAction = text.includes('Ranged Spell Attack +7') &&
        text.includes('up to 3 creatures which you can see within 120 ft. of you') &&
        text.includes('On Hit: 5 (1d10) Radiant damage.') &&
        text.includes('The target is surrounded by a radiant flare.');

      // A7: templates use structured A6 fields and replacing authored content is cancellable.
      const soulAction = monsterStore.actions.find(action => action.id === 'a6-soul-barrage');
      const originalId = soulAction?.id;
      const originalDescription = soulAction?.description;
      const originalRecharge = soulAction?.recharge;
      const templateButton = document.querySelector('[data-action-editor-id="a6-soul-barrage"]');
      templateButton?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      const javelinOption = document.querySelector('[data-action-template="holy-javelin"]');
      javelinOption?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      const cancelButton = [...(document.querySelector('.q-dialog')?.querySelectorAll('button') || [])]
        .find(button => button.textContent.includes('Keep current action'));
      cancelButton?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      const templateCancelPreserves = monsterStore.actions.find(action => action.id === originalId)?.description === originalDescription;

      const templateButtonAfterCancel = document.querySelector('[data-action-editor-id="a6-soul-barrage"]');
      templateButtonAfterCancel?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      document.querySelector('[data-action-template="holy-javelin"]')?.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      [...(document.querySelector('.q-dialog')?.querySelectorAll('button') || [])]
        .find(button => button.textContent.includes('Apply template'))?.click();
      await new Promise(resolve => setTimeout(resolve, 400));
      const appliedAction = monsterStore.actions.find(action => action.id === originalId);
      const templateApplied = appliedAction?.name === 'Holy Javelin' &&
        appliedAction?.attackReach === 'ranged' &&
        appliedAction?.targeting?.range?.distance === 120 &&
        appliedAction?.bonusAction === false &&
        appliedAction?.id === originalId &&
        appliedAction?.recharge === originalRecharge &&
        !document.querySelector('.q-dialog');
      const templateAppliedDetails = appliedAction ? {
        name: appliedAction.name,
        attackReach: appliedAction.attackReach,
        distance: appliedAction.targeting?.range?.distance,
        bonusAction: appliedAction.bonusAction,
        id: appliedAction.id,
        recharge: appliedAction.recharge,
        dialogStillOpen: !!document.querySelector('.q-dialog'),
      } : null;

      // A4 Layer Studio at top check
      const studioEl = document.getElementById('a4-layer-studio-expansion');
      const isStudioAtTop = !!studioEl;

      return {
        success: isAutoProficient && !hasRedundantPreamble && hasSpellTags && hasCompoundAction && hasStructuredAction && isStudioAtTop && templateCancelPreserves && templateApplied,
        isAutoProficient,
        hasRedundantPreamble,
        hasSpellTags,
        hasCompoundAction,
        hasStructuredAction,
        isStudioAtTop,
        templateCancelPreserves,
        templateApplied,
        templateAppliedDetails
      };
    }
  `);
  console.log('Step 32 result:', step32);
  if (!step32 || !step32.success) {
    throw new Error('Step 32 failed: ' + JSON.stringify(step32));
  }

  console.log('\n--- PHASE 33: A4 Studio Radial/Dual-Knob Cropping, Far-Left Recharge, Defense Consolidation & Spell Cadence Badges ---')
  const step33 = await evalInPage(`
    async () => {
      const qApp = document.querySelector('#q-app');
      const pinia = qApp?.__vue_app__?.config?.globalProperties?.$pinia;
      const monsterStore = pinia?._s?.get('monster');
      const editorStore = pinia?._s?.get('editor');
      if (!monsterStore || !editorStore) return { success: false, reason: 'Stores not found' };

      // 1. Verify A4 Studio Dual-Knob & Radial Offset Controllers exist
      editorStore.a4Simulation = true;
      const studioHeader = document.querySelector('#a4-layer-studio-expansion .q-expansion-item__header');
      if (studioHeader && !document.querySelector('#a4-layer-studio-expansion .q-expansion-item__content')) {
        studioHeader.click();
      }
      await new Promise(r => setTimeout(r, 200));

      const radialGizmos = document.querySelectorAll('.radial-offset-controller');
      const dualKnobSliders = document.querySelectorAll('.dual-knob-crop-slider');

      // 2. Test Portrait Layout Positions in Simulation mode
      const portrait = monsterStore.portrait;
      portrait.url = 'https://example.com/test-portrait.png';
      portrait.position = 'right';
      await new Promise(r => setTimeout(r, 100));
      const hasRightPortrait = portrait.position === 'right';

      portrait.position = 'left';
      await new Promise(r => setTimeout(r, 100));
      const hasLeftPortrait = portrait.position === 'left';

      // 3. Test Defense Consolidation & Zebra Striping
      const m = monsterStore;
      m.vulnerabilitiesList = [{ type: 'fire' }, { type: 'cold' }];
      m.resistancesList = [{ type: 'acid' }, { type: 'poison' }];
      m.immunitiesList = [{ type: 'necrotic' }];
      m.conditionsList = [{ type: 'paralyzed' }, { type: 'charmed' }];

      // 4. Test Far-Left Recharge Action Header Pill
      m.actions.push({
        id: 'test-recharge-act-33',
        name: 'Veil Of Radiance',
        recharge: '4-6',
        rechargeType: 'standard',
        school: 'Abjuration',
        components: ['V', 'S'],
        duration: '1 minute',
        areaShape: 'sphere',
        areaDistance: '20',
        deliveryType: 'Save DC',
        stat: 'WIS',
        save: { override: false, overrideValue: 15 },
        saveStat: 'WIS',
        saveDc: 15,
        description: 'A radiant barrier surrounds the creature.',
        legendaryOnly: false,
        bonusAction: false,
        limitedUse: { count: 0, rate: '' },
        crAnnotation: { maxDamage: 0, maxSave: 15, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true, automatic: true },
        effects: []
      });

      // 5. Test Spellcasting Title Disclosure, Resource Mode, and Per-Spell Cadence Badge
      if (!m.spellcasting) {
        m.spellcasting = {
          class: 'Wizard',
          level: 9,
          stat: 'INT',
          save: { override: false, overrideValue: 15 },
          modifier: { override: false, overrideValue: 7 },
          standard: ['Misty Step', 'Shield'],
          atWill: [],
          slots: [4, 3, 3, 3, 1, 0, 0, 0, 0],
        };
      }
      m.spellcasting.resourceType = 'points';
      m.spellcasting.refreshRate = 'short_rest';
      m.spellcasting.displayTitleMode = 'caster_source';
      m.spellcasting.spellCadenceMap = {
        'Misty Step': 'at_will',
        'Shield': 'short_rest',
      };
      if (!m.spellcasting.standard.includes('Misty Step')) m.spellcasting.standard.push('Misty Step');
      if (!m.spellcasting.standard.includes('Shield')) m.spellcasting.standard.push('Shield');

      await new Promise(r => setTimeout(r, 200));

      const statblockEl = document.querySelector('#render .statblock');
      const text = statblockEl?.textContent || '';
      const html = statblockEl?.innerHTML || '';

      // Check far-left recharge
      const actionPills = Array.from(document.querySelectorAll('.action-composite-pill'));
      const veilPill = actionPills.find(p => p.textContent?.includes('Veil Of Radiance'));
      const firstCellText = veilPill?.firstElementChild?.textContent || '';
      const hasFarLeftRecharge = firstCellText.includes('Recharge');

      // Check defense consolidation (no separate "Damage" or "Condition" sub-labels inside defenses)
      const defenseBodies = Array.from(document.querySelectorAll('.dnd-defense-unified-body, .dnd-defense-row, .dnd-cascade-panel'));
      const defensesText = defenseBodies.map(d => d.textContent).join(' ');
      const hasDefenses = defensesText.includes('fire') || defensesText.includes('charmed') || text.includes('fire') || text.includes('charmed');

      // Check spellcasting title and cadence badge
      const hasCasterSourceTitle = text.includes('Arcane Caster') || text.includes('Wizard');
      const hasResourcePill = text.includes('Spell Points') || text.includes('Short Rest');
      const cadenceBadges = document.querySelectorAll('.spell-cadence-badge');
      const hasCadenceBadge = cadenceBadges.length > 0 || html.includes('spell-cadence-badge');

      return {
        success: hasFarLeftRecharge && hasDefenses && (hasCasterSourceTitle || hasResourcePill),
        radialGizmosCount: radialGizmos.length,
        dualKnobSlidersCount: dualKnobSliders.length,
        hasRightPortrait,
        hasLeftPortrait,
        hasFarLeftRecharge,
        hasDefenses,
        hasCasterSourceTitle,
        hasResourcePill,
        hasCadenceBadge,
      };
    }
  `);
  console.log('Step 33 result:', step33);
  if (!step33 || !step33.success) {
    throw new Error('Step 33 failed: ' + JSON.stringify(step33));
  }

  console.log('\n--- Step 34: Structured abilities render their mechanics in every template and section ---')
  const step34 = await evalInPage(`
    async () => {
      const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');
      const editor = pinia._s.get('editor');
      const previousTemplate = editor.visualTemplate;
      const base = (id, name) => ({
        id, name, description: '', recharge: '', legendaryOnly: true, bonusAction: false,
        limitedUse: { count: 0, rate: '' }, stat: 'none', save: { override: false, overrideValue: 0 },
        range: '', effects: [], customPreamble: false,
        crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
      });
      monster.actions.push({
        ...base('a7-legendary-burst', 'Radiant Burst'), stat: 'CON', actionType: 'save_ability',
        targeting: { count: 'all', kind: 'creatures', area: { shape: 'radius sphere', distance: 20, unit: 'ft' } },
        outcomes: [{ trigger: 'failure', effects: [{ kind: 'damage', formula: '4d10', damageType: 'radiant' }] }],
      });
      monster.actions.push({
        ...base('a7-mythic-lance', 'Mythic Lance'), actionType: 'spell_attack', attackReach: 'ranged', attackSource: 'spell', attackBonus: 9,
        targeting: { count: 1, kind: 'creature', range: { distance: 120, unit: 'ft', relation: 'range' } },
        outcomes: [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '2d10', damageType: 'force' }] }],
      });
      monster.addLegendaryAction('a7-legendary-burst', 2);
      monster.addMythicAction('a7-mythic-lance');
      const read = async (template) => {
        editor.visualTemplate = template;
        await new Promise((resolve) => setTimeout(resolve, 250));
        return (document.querySelector('#render .statblock')?.textContent || '').replace(/\\s+/g, ' ');
      };
      const classic = await read('classic');
      const modern = await read('modern');
      editor.visualTemplate = previousTemplate;
      const checks = {
        classicLegendary: /Radiant Burst \\(Costs 2 Actions\\)\\. Constitution Saving Throw: DC \\d+, all creatures in a 20-foot radius sphere\\. Failure: \\d+ \\(4d10\\) Radiant damage\\./.test(classic),
        classicMythic: /Mythic Lance\\. Ranged Attack Roll: \\+9, range 120 ft\\. Hit: \\d+ \\(2d10\\) Force damage\\./.test(classic),
        classicTemplatedAction: /Holy Javelin[^.]*\\. Ranged Attack Roll: [+-]\\d+, range 120 ft\\. Hit:/.test(classic),
        modernLegendary: modern.includes('Costs 2 Actions') && modern.includes('Constitution Save') && modern.includes('On Failure:'),
        modernMythic: modern.includes('Ranged Spell Attack +9') && modern.includes('On Hit:'),
      };
      const success = Object.values(checks).every(Boolean);
      return success ? { success, checks } : {
        success, checks, classicText: classic.slice(-1200), modernText: modern.slice(-1200),
      };
    }
  `)
  console.log('Step 34 result:', step34)
  if (!step34 || !step34.success) {
    throw new Error('Step 34 failed: ' + JSON.stringify(step34));
  }

  console.log('\n--- Step 35: Composer chain edits plate cells by keyboard; its preview is the stat block entry ---')
  // Trusted key events: synthetic DOM events never activate buttons or open Quasar menus.
  const KEYS = {
    Enter: { code: 'Enter', keyCode: 13, text: '\r' },
    Escape: { code: 'Escape', keyCode: 27 },
    ArrowDown: { code: 'ArrowDown', keyCode: 40 },
  }
  const pressKey = async (key) => {
    const k = KEYS[key]
    const base = { key, code: k.code, windowsVirtualKeyCode: k.keyCode, nativeVirtualKeyCode: k.keyCode }
    await sendCdp('Input.dispatchKeyEvent', k.text ? { type: 'keyDown', ...base, text: k.text, unmodifiedText: k.text } : { type: 'rawKeyDown', ...base })
    await sendCdp('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
  }
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  await sendCdp('Emulation.setFocusEmulationEnabled', { enabled: true })

  const step35Setup = await evalInPage(`
    async () => {
      const chain = document.querySelector('[data-composer-chain="a6-soul-barrage"]');
      if (!chain) return { ready: false };
      // A keyboard user first opens the collapsed studio hosting the chain; hidden chips cannot take focus.
      for (let guard = 0; guard < 4 && chain.closest('.q-expansion-item--collapsed'); guard++) {
        chain.closest('.q-expansion-item--collapsed').querySelector(':scope > .q-expansion-item__container > .q-item').click();
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
      const rows = [...chain.querySelectorAll('[data-chain-row]')].map((row) => row.getAttribute('data-chain-row'));
      const chip = chain.querySelector('[data-chain-cell="attack"]');
      chip.scrollIntoView({ block: 'center' });
      chip.focus();
      return { ready: document.activeElement === chip, rows, attack: chip.textContent.trim() };
    }
  `)
  await pressKey('Enter')
  await pause(600)
  const step35Opened = await evalInPage(`() => ({
    open: !!document.querySelector('.chain-editor-menu'),
    onOption: !!document.activeElement?.classList?.contains('chain-option'),
    option: document.activeElement?.textContent?.trim(),
  })`)
  await pressKey('ArrowDown')
  await pressKey('Enter')
  await pause(700)
  const step35Picked = await evalInPage(`() => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const action = pinia._s.get('monster').actions.find((a) => a.id === 'a6-soul-barrage');
    return {
      reach: action.attackReach,
      source: action.attackSource,
      menus: document.querySelectorAll('.chain-editor-menu').length,
      focusBack: document.activeElement?.getAttribute('data-chain-cell') === 'attack',
    };
  }`)
  await pressKey('Enter')
  await pause(600)
  await pressKey('Escape')
  await pause(600)
  const step35Escaped = await evalInPage(`() => ({
    menus: document.querySelectorAll('.chain-editor-menu').length,
    focusBack: document.activeElement?.getAttribute('data-chain-cell') === 'attack',
  })`)
  const step35Parity = await evalInPage(`
    async () => {
      const chain = document.querySelector('[data-composer-chain="a6-soul-barrage"]');
      chain.querySelector('[data-chain-cell="target-count"]').click();
      await new Promise((resolve) => setTimeout(resolve, 600));
      const menu = document.querySelector('.chain-editor-menu');
      const input = menu.querySelector('input');
      input.value = '2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 150));
      [...menu.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Apply').click();
      await new Promise((resolve) => setTimeout(resolve, 600));
      const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
      const editor = pinia._s.get('editor');
      const action = pinia._s.get('monster').actions.find((a) => a.id === 'a6-soul-barrage');
      const compare = async (template) => {
        editor.visualTemplate = template;
        await new Promise((resolve) => setTimeout(resolve, 300));
        const preview = chain.querySelector('[data-composer-preview] .action');
        const same = [...document.querySelectorAll('#render .statblock .action')].some((entry) => entry.innerHTML === preview.innerHTML);
        return { same, text: preview.textContent.replace(/\\s+/g, ' ').trim().slice(0, 140) };
      };
      const previous = editor.visualTemplate;
      const modern = await compare('modern');
      const classic = await compare('classic');
      editor.visualTemplate = previous;
      return { count: action.targeting?.count, modern, classic };
    }
  `)
  await sendCdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  const step35Responsive = await evalInPage(`() => {
    const chain = document.querySelector('[data-composer-chain="a6-soul-barrage"]');
    const firstRow = chain?.querySelector('[data-chain-row]');
    return {
      width: chain?.clientWidth || 0,
      scrollWidth: chain?.scrollWidth || 0,
      rowDirection: firstRow ? getComputedStyle(firstRow).flexDirection : '',
    };
  }`)
  await sendCdp('Emulation.clearDeviceMetricsOverride')
  // The preview must look like the sheet entry, not only share its markup: compare computed styles.
  const typeMatrix = await evalInPage(`
    async () => {
      const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
      const editor = pinia._s.get('editor');
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const rootProps = ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'background-color'];
      const props = ['display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'font-family', 'font-size', 'font-weight',
        'font-style', 'line-height', 'letter-spacing', 'color', 'background-color', 'background-image', 'border-top-width', 'border-top-color',
        'border-left-width', 'border-left-color', 'padding-top', 'padding-left', 'text-transform', 'text-indent', 'column-gap', 'opacity',
        'white-space', 'margin-left'];
      const differences = (preview, twin) => {
        const found = [];
        const pr = getComputedStyle(preview.closest('.statblock'));
        const sr = getComputedStyle(twin.closest('.statblock'));
        for (const p of rootProps) if (pr.getPropertyValue(p) !== sr.getPropertyValue(p)) found.push('root ' + p);
        const walk = (a, b, at) => {
          const ca = getComputedStyle(a);
          const cb = getComputedStyle(b);
          for (const p of props) if (ca.getPropertyValue(p) !== cb.getPropertyValue(p)) found.push(at + ' ' + p);
          [...a.children].forEach((child, i) => b.children[i] && walk(child, b.children[i], at + '>' + child.tagName.toLowerCase()));
        };
        walk(preview, twin, 'entry');
        return found;
      };
      const saved = { template: editor.visualTemplate, style: editor.style, theme: editor.visualTheme };
      const themes = ['wotc', 'printer', 'lovecraft_golden', 'lovecraft_silver', 'lovecraft_toxic', 'lovecraft_spooky', 'lovecraft_galactic',
        'lovecraft_fathomless', 'dwarves_forge', 'dwarves_aetherpunk', 'art_nouveau', 'art_deco'];
      const cases = [['a6-soul-barrage', themes], ['a7-legendary-burst', ['wotc', 'lovecraft_golden']]];
      const failures = [];
      let total = 0;
      for (const [id, caseThemes] of cases) {
        const chain = document.querySelector('[data-composer-chain="' + id + '"]');
        for (const style of ['2014', '2024']) for (const template of ['modern', 'classic']) for (const theme of caseThemes) {
          total++;
          editor.style = style;
          editor.visualTemplate = template;
          editor.visualTheme = theme;
          await wait(260);
          const preview = chain?.querySelector('[data-composer-preview] .action');
          const twin = preview && [...document.querySelectorAll('#render .statblock :is(.trait, .action)')].find((entry) => entry.innerHTML === preview.innerHTML);
          const found = twin ? differences(preview, twin) : ['no sheet twin'];
          if (found.length) failures.push({ id, style, template, theme, found: found.slice(0, 6) });
        }
      }
      editor.visualTemplate = saved.template;
      editor.style = saved.style;
      editor.visualTheme = saved.theme;
      await wait(260);
      return { total, failing: failures.length, failures: failures.slice(0, 6) };
    }
  `)
  const step35 = {
    setup: step35Setup,
    opened: step35Opened,
    picked: step35Picked,
    escaped: step35Escaped,
    parity: step35Parity,
    responsive: step35Responsive,
  }
  step35.success = !!step35Setup?.ready &&
    JSON.stringify(step35Setup.rows) === JSON.stringify(['head', 'mechanics', 'scope', 'outcomes']) &&
    step35Opened?.open === true && step35Opened?.onOption === true &&
    step35Picked?.reach === 'melee_or_ranged' && step35Picked?.source === 'spell' &&
    step35Picked?.menus === 0 && step35Picked?.focusBack === true &&
    step35Escaped?.menus === 0 && step35Escaped?.focusBack === true &&
    step35Parity?.count === 2 && step35Parity?.modern?.same === true && step35Parity?.classic?.same === true &&
    step35Responsive?.width > 0 && step35Responsive?.scrollWidth <= step35Responsive?.width + 1 &&
    step35Responsive?.rowDirection === 'column'
  step35.typeParity = typeMatrix
  step35.success = step35.success && typeMatrix.total === 56 && typeMatrix.failing === 0
  console.log('Step 35 result:', JSON.stringify(step35, null, 2))
  if (!step35.success) {
    throw new Error('Step 35 failed: ' + JSON.stringify(step35));
  }

  console.log('\n--- Step 36: Reaction chain edits its typed trigger and previews the rendered reaction ---')
  const step36Setup = await evalInPage(`
    async () => {
      const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');
      let reaction = monster.reactions.find((entry) => entry.id === 'a7-reaction-chain-proof');
      if (!reaction) {
        monster.addReaction();
        reaction = monster.reactions[monster.reactions.length - 1];
      }
      Object.assign(reaction, {
        id: 'a7-reaction-chain-proof',
        name: 'Tail Swipe',
        trigger: 'When a creature moves within 10 ft.',
        description: 'The monster makes a tail attack.',
        limitedUse: { count: 3, rate: 'DAY' },
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      const chain = reaction && document.querySelector('[data-composer-chain="' + reaction.id + '"]');
      if (!chain) return { ready: false, reason: 'Reaction chain not mounted' };
      const host = chain.closest('.q-expansion-item--collapsed');
      if (host) host.querySelector(':scope > .q-expansion-item__container > .q-item').click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const triggerCell = chain.querySelector('[data-chain-cell="trigger"]');
      triggerCell?.focus();
      return {
        ready: true,
        rows: [...chain.querySelectorAll('[data-chain-row]')].map((row) => row.getAttribute('data-chain-row')),
        cells: [...chain.querySelectorAll('[data-chain-cell]')].map((cell) => cell.getAttribute('data-chain-cell')),
        trigger: triggerCell?.textContent.trim(),
        focusReady: document.activeElement === triggerCell,
      };
    }
  `)
  await pressKey('Enter')
  await pause(500)
  const step36Edited = await evalInPage(`
    async () => {
      const chain = document.querySelector('[data-composer-chain] [data-chain-cell="trigger"]')?.closest('[data-composer-chain]');
      const trigger = chain?.querySelector('[data-chain-cell="trigger"]');
      if (!trigger) return { applied: false, reason: 'Trigger cell missing' };
      const menu = document.querySelector('.chain-editor-menu');
      const input = menu?.querySelector('input');
      if (!input) return { applied: false, reason: 'Trigger editor did not open' };
      input.value = 'When a creature moves within 15 ft.';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      [...menu.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Apply')?.click();
      await new Promise((resolve) => setTimeout(resolve, 350));
      const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
      const reaction = pinia._s.get('monster').reactions.find((entry) => entry.id === 'a7-reaction-chain-proof');
      return {
        applied: reaction?.trigger === 'When a creature moves within 15 ft.',
        trigger: reaction?.trigger,
        menuClosed: document.querySelectorAll('.chain-editor-menu').length === 0,
        focusReturned: document.activeElement?.getAttribute('data-chain-cell') === 'trigger',
      };
    }
  `)
  const step36Parity = await evalInPage(`
    async () => {
      const chain = document.querySelector('[data-composer-chain] [data-chain-cell="trigger"]')?.closest('[data-composer-chain]');
      const preview = chain?.querySelector('[data-composer-preview] .action');
      const renderer = document.querySelector('#render .statblock .action.reaction');
      return {
        hasTrigger: (preview?.textContent || '').includes('When a creature moves within 15 ft.'),
        sameHtml: !!preview && !!renderer && preview.innerHTML === renderer.innerHTML,
        rendererText: renderer?.textContent?.replace(/\\s+/g, ' ').trim(),
      };
    }
  `)
  const step36 = {
    setup: step36Setup,
    edit: step36Edited,
    parity: step36Parity,
  }
  step36.success = step36Setup?.ready === true &&
    JSON.stringify(step36Setup.rows) === JSON.stringify(['head', 'mechanics']) &&
    JSON.stringify(step36Setup.cells) === JSON.stringify(['usage', 'name', 'trigger']) &&
    step36Setup?.focusReady === true &&
    step36Edited?.applied === true && step36Edited?.menuClosed === true && step36Edited?.focusReturned === true &&
    step36Parity?.hasTrigger === true && step36Parity?.sameHtml === true
  console.log('Step 36 result:', JSON.stringify(step36, null, 2))
  if (!step36.success) {
    throw new Error('Step 36 failed: ' + JSON.stringify(step36));
  }
  console.log('\n--- Step 37: Trait cadence drafts, display settings, renderer parity and persistence ---')
  const step37Setup = await evalInPage(`async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster');
    monster.addTrait();
    const trait = monster.traits[monster.traits.length - 1];
    Object.assign(trait, { id: 'a7-trait-proof', name: 'Moonlit Regeneration', description: 'Regains 5 hit points.',
      limitedUse: { count: 2, rate: 'DAY' }, rechargeTiming: 'DAWN', rechargeCount: 2,
      rechargeTagOverride: '', conditionalTrigger: '', stagePool: 'all', customPreamble: false });
    await new Promise(resolve => setTimeout(resolve, 350));
    const chain = document.querySelector('[data-composer-chain="a7-trait-proof"]');
    const chip = chain?.querySelector('[data-chain-cell="trait-usage"]');
    chip?.focus();
    return { mounted: !!chip, cells: [...(chain?.querySelectorAll('[data-chain-cell]') || [])].map(el => el.dataset.chainCell) };
  }`)
  await pressKey('Enter')
  await pause(350)
  const step37Cancel = await evalInPage(`async () => {
    const menu = document.querySelector('.chain-editor-menu');
    const input = menu?.querySelector('input');
    if (!input) return { ready: false };
    input.value = '-1'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 150));
    const invalid = !!menu.querySelector('[role="alert"]') && [...menu.querySelectorAll('button')].find(b => b.textContent.trim() === 'Apply')?.disabled;
    input.value = '6'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    [...menu.querySelectorAll('button')].find(b => b.textContent.trim() === 'Cancel')?.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    return { ready: true, invalid, unchanged: monster.traits.find(t => t.id === 'a7-trait-proof').limitedUse.count === 2,
      focusBack: document.activeElement?.dataset.chainCell === 'trait-usage' };
  }`)
  await evalInPage(`() => {
    const chip = document.querySelector('[data-composer-chain="a7-trait-proof"] [data-chain-cell="trait-usage"]');
    chip.scrollIntoView({ block: 'center' }); chip.focus();
  }`)
  await pause(450)
  await pressKey('Enter')
  await pause(450)
  const step37Apply = await evalInPage(`async () => {
    const menu = document.querySelector('.chain-editor-menu');
    if (!menu) return { ready: false };
    const inputs = menu.querySelectorAll('input');
    for (const input of [inputs[0], inputs[1]]) {
      input.value = '3'; input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const select = menu.querySelectorAll('select')[1]; select.value = 'DAY'; select.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    [...menu.querySelectorAll('button')].find(b => b.textContent.trim() === 'Apply')?.click();
    await new Promise(resolve => setTimeout(resolve, 350));
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const trait = monster.traits.find(t => t.id === 'a7-trait-proof');
    return { ready: true, count: trait.limitedUse.count, timing: trait.rechargeTiming, rechargeCount: trait.rechargeCount,
      description: trait.description, crIntact: !!trait.crAnnotation, focusBack: document.activeElement?.dataset.chainCell === 'trait-usage' };
  }`)
  const step37Parity = await evalInPage(`async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster'); const editor = pinia._s.get('editor');
    const trait = monster.traits.find(t => t.id === 'a7-trait-proof'); const previous = editor.visualTemplate;
    const compare = async (template) => {
      editor.visualTemplate = template; await new Promise(resolve => setTimeout(resolve, 250));
      const preview = document.querySelector('[data-composer-preview="a7-trait-proof"] .action');
      const renderer = [...document.querySelectorAll('#render .traits .trait')].find(el => el.textContent.includes('Moonlit Regeneration'));
      return !!preview && !!renderer && preview.innerHTML === renderer.innerHTML;
    };
    const modern = await compare('modern'); const classic = await compare('classic');
    editor.visualTemplate = 'modern';
    const settings = document.querySelector('[data-trait-settings="a7-trait-proof"]');
    settings.querySelector('.q-item').click(); await new Promise(resolve => setTimeout(resolve, 300));
    const checkbox = [...settings.querySelectorAll('[role="checkbox"]')].find(el => el.textContent.includes('Group under a recharge heading'));
    checkbox?.click(); await new Promise(resolve => setTimeout(resolve, 200));
    const grouped = trait.renderInRechargeSection === true && trait.rechargeSection === 'Daily';
    const heading = [...document.querySelectorAll('#render .sub-section-header')].some(el => el.textContent === 'Daily');
    const headingInput = [...settings.querySelectorAll('.q-field')].find(el => el.querySelector('.q-field__label')?.textContent === 'Recharge heading')?.querySelector('input');
    if (headingInput) {
      headingInput.value = 'Daily '; headingInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
      headingInput.value += 'recovery'; headingInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const liveText = trait.rechargeSection === 'Daily recovery';
    const custom = [...settings.querySelectorAll('[role="checkbox"]')].find(el => el.textContent.includes('Description supplies its own heading'));
    custom?.click(); await new Promise(resolve => setTimeout(resolve, 200));
    const previewText = document.querySelector('[data-composer-preview="a7-trait-proof"] .action')?.textContent;
    const customPreview = trait.customPreamble && previewText?.includes('Regains 5 hit points.') && !previewText?.includes('Moonlit Regeneration');
    custom?.click(); editor.visualTemplate = previous;
    return { modern, classic, grouped, heading, liveText, customPreview };
  }`)
  await sendCdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  const step37Responsive = await evalInPage(`async () => {
    const chain = document.querySelector('[data-composer-chain="a7-trait-proof"]');
    const chip = chain.querySelector('[data-chain-cell="trait-usage"]'); chip.click();
    await new Promise(resolve => setTimeout(resolve, 350));
    const menu = document.querySelector('.chain-editor-menu');
    return { width: chain.clientWidth, scrollWidth: chain.scrollWidth, menuWidth: menu?.clientWidth,
      menuScrollWidth: menu?.scrollWidth, viewport: innerWidth };
  }`)
  await pressKey('Escape')
  await sendCdp('Emulation.clearDeviceMetricsOverride')
  const step37LegacyCr = await evalInPage(`async () => {
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const trait = monster.traits.find(t => t.id === 'a7-trait-proof');
    trait.description = 'The creature deals {4d6} fire damage.';
    // This is the partial, excluded annotation produced by the existing legacy import normalizer.
    trait.crAnnotation = { include: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 };
    await new Promise(resolve => setTimeout(resolve, 200));
    const settings = document.querySelector('[data-trait-settings="a7-trait-proof"]');
    [...settings.querySelectorAll('button')].find(button => button.textContent.trim() === 'Calculate automatic CR')?.click();
    await new Promise(resolve => setTimeout(resolve, 200));
    return trait.crAnnotation?.automatic === true && trait.crAnnotation?.maxDamage === 14 && trait.crAnnotation?.include === false;
  }`)
  await sendCdp('Page.reload')
  await pause(1200)
  const step37Persistence = await evalInPage(`() => {
    const monster = document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia._s.get('monster');
    const trait = monster?.traits.find(t => t.id === 'a7-trait-proof');
    return !!trait && trait.limitedUse.count === 3 && trait.rechargeTiming === 'DAY' && trait.rechargeCount === 3 &&
      trait.rechargeSection === 'Daily recovery' && trait.renderInRechargeSection === true && trait.customPreamble === false && !!trait.crAnnotation;
  }`)
  const step37 = { setup: step37Setup, cancel: step37Cancel, apply: step37Apply, parity: step37Parity, responsive: step37Responsive, legacyCr: step37LegacyCr, persisted: step37Persistence }
  step37.success = step37Setup?.mounted && JSON.stringify(step37Setup.cells) === JSON.stringify(['trait-usage', 'name']) &&
    step37Cancel?.invalid && step37Cancel?.unchanged && step37Cancel?.focusBack &&
    step37Apply?.count === 3 && step37Apply?.timing === 'DAY' && step37Apply?.rechargeCount === 3 && step37Apply?.crIntact && step37Apply?.focusBack &&
    step37Parity?.modern && step37Parity?.classic && step37Parity?.grouped && step37Parity?.heading && step37Parity?.liveText && step37Parity?.customPreview &&
    step37Responsive?.width > 0 && step37Responsive?.scrollWidth <= step37Responsive.width + 1 &&
    step37Responsive?.menuWidth > 0 && step37Responsive?.menuScrollWidth <= step37Responsive.menuWidth + 1 && step37Responsive.menuWidth <= step37Responsive.viewport && step37LegacyCr === true && step37Persistence === true
  console.log('Step 37 result:', JSON.stringify(step37, null, 2))
  if (!step37.success) throw new Error('Step 37 failed: ' + JSON.stringify(step37))
  console.log('\n--- Step 38: Lair adapter and typed legendary/mythic/lair section context ---')
  const step38 = await evalInPage(`async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster'); const editor = pinia._s.get('editor');
    const wait = () => new Promise(resolve => setTimeout(resolve, 200));
    monster.addLairAction(); const lair = monster.lairActions[monster.lairActions.length - 1];
    lair.id = 'a7-lair-proof'; lair.description = 'The chamber shakes for {1d6} thunder damage.';
    monster.initiativeConfig = { ...monster.initiativeConfig, lairInitiative: 20, advantage: true };
    monster.useCustomLairActionPreamble = false; monster.lairActionPreamble = 'Stored custom prose';
    monster.addAction(); let action = monster.actions[monster.actions.length - 1]; action.name = 'Header legendary proof';
    monster.addLegendaryAction(action.id, 2);
    monster.addAction(); action = monster.actions[monster.actions.length - 1]; action.name = 'Header mythic proof'; monster.addMythicAction(action.id);
    const legendMembers = JSON.stringify(monster.legendaryActions.actions); const mythicMembers = JSON.stringify(monster.mythicActions.actions);
    editor.visualTemplate = 'modern'; await wait();
    let chain = document.querySelector('[data-composer-chain="a7-lair-proof"]');
    for (let attempt=0; !chain && attempt<20; attempt++) {
      await wait(); chain=document.querySelector('[data-composer-chain="a7-lair-proof"]');
    }
    if (!chain) throw new Error('Lair fixture did not mount: '+JSON.stringify(monster.lairActions.map(entry=>entry.id)));
    for (let guard=0; guard<4 && chain.closest('.q-expansion-item--collapsed'); guard++) {
      chain.closest('.q-expansion-item--collapsed').querySelector(':scope > .q-expansion-item__container > .q-item').click(); await wait();
    }
    if (!chain) return { mounted: false };
    const readOnly = chain.querySelector('[data-chain-cell="role-label"]')?.tagName === 'SPAN' && !('name' in lair);
    const description = chain.parentElement.querySelector('.q-editor__content');
    description.innerHTML = 'The chamber shakes for {2d6} thunder damage.'; description.dispatchEvent(new Event('input', { bubbles: true })); await wait();
    const proseEdited = lair.description.includes('{2d6}') && lair.crAnnotation.maxDamage === 7;
    const compare = async (template) => {
      editor.visualTemplate = template; await wait();
      const preview = chain.querySelector('[data-composer-preview] .action');
      const rendered = [...document.querySelectorAll('#render .lair-actions .action.lair')].find(el => el.textContent.includes('The chamber shakes'));
      return !!preview && !!rendered && preview.innerHTML === rendered.innerHTML;
    };
    const modern = await compare('modern'); const classic = await compare('classic'); editor.visualTemplate = 'modern'; await wait();
    const panel = role => document.querySelector('[data-role-header="'+role+'"]');
    const openPanel = async role => { panel(role).querySelector('.q-item').click(); await wait(); };
    const input = async (role, field, value) => { const el=panel(role).querySelector('[data-header-field="'+field+'"] input'); el.value=value; el.dispatchEvent(new Event('input',{bubbles:true})); await wait(); };
    const button = async (role, label) => { [...panel(role).querySelectorAll('button')].find(el=>el.textContent.trim()===label).click(); await wait(); };
    const prose = async (role, field, value) => { const el=panel(role).querySelector('[data-header-field="'+field+'"] .q-editor__content'); el.innerHTML=value; el.dispatchEvent(new Event('input',{bubbles:true})); await wait(); };
    await openPanel('lair'); await input('lair','initiative','-1');
    const invalid = !!panel('lair').querySelector('[role="alert"]') && [...panel('lair').querySelectorAll('button')].find(el=>el.textContent.trim()==='Apply section settings').disabled;
    await button('lair','Cancel'); const canceled = monster.initiativeConfig.lairInitiative === 20;
    await openPanel('lair'); await input('lair','initiative','15'); await button('lair','Apply section settings');
    const defaultPreamble = document.querySelector('#render .lair-actions .preamble').textContent.includes('initiative count 15') && monster.lairActionPreamble === 'Stored custom prose';
    await openPanel('lair'); panel('lair').querySelector('[role="checkbox"]').click(); await wait();
    await prose('lair','preamble','Authored at initiative count 9.'); await button('lair','Apply section settings');
    await openPanel('lair'); await input('lair','initiative','17'); await button('lair','Apply section settings');
    const customPreamble = monster.lairActionPreamble === 'Authored at initiative count 9.' && document.querySelector('#render .lair-actions .preamble').textContent.includes('count 9');
    await openPanel('legendary'); await input('legendary','count','5');
    if (!monster.legendaryActions.useCustomPreamble) { panel('legendary').querySelector('[role="checkbox"]').click(); await wait(); }
    await prose('legendary','preamble','Five legendary actions are available.'); await button('legendary','Apply section settings');
    const legendary = monster.legendaryActions.count === 5 && monster.legendaryActions.customPreamble === 'Five legendary actions are available.' && JSON.stringify(monster.legendaryActions.actions) === legendMembers;
    await openPanel('mythic'); await input('mythic','triggerName','Eclipse Reborn'); await input('mythic','triggerRecharge','Recharges at Dawn');
    await prose('mythic','triggerDescription','At 0 hit points, the creature awakens.'); await prose('mythic','preamble','While awakened, it can take these mythic actions.'); await button('mythic','Apply section settings');
    const mythic = monster.mythicActions.triggerName === 'Eclipse Reborn' && JSON.stringify(monster.mythicActions.actions) === mythicMembers && document.querySelector('#render .traits').textContent.includes('Eclipse Reborn');
    return { mounted:true, readOnly, proseEdited, modern, classic, invalid, canceled, defaultPreamble, customPreamble, legendary, mythic,
      tuningPreserved:monster.initiativeConfig.advantage===true };
  }`)
  await sendCdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  const step38Narrow = await evalInPage(`async () => {
    const panel=document.querySelector('[data-role-header="lair"]'); panel.querySelector('.q-item').click(); await new Promise(resolve=>setTimeout(resolve,700));
    const form=panel.querySelector('form'); return { width:form.clientWidth, scrollWidth:form.scrollWidth };
  }`)
  await sendCdp('Emulation.clearDeviceMetricsOverride')
  await sendCdp('Page.reload'); await pause(1200)
  const step38Persisted = await evalInPage(`() => {
    const monster=document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia._s.get('monster');
    return monster?.initiativeConfig.lairInitiative===17 && monster.useCustomLairActionPreamble===true && monster.lairActionPreamble==='Authored at initiative count 9.' &&
      monster.legendaryActions.count===5 && monster.mythicActions.triggerName==='Eclipse Reborn' && monster.lairActions.some(el=>el.id==='a7-lair-proof' && el.description.includes('{2d6}'));
  }`)
  step38.narrow = step38Narrow; step38.persisted = step38Persisted;
  step38.success = Object.entries(step38).filter(([key])=>key!=='narrow').every(([,value])=>value===true) && step38Narrow.width>0 && step38Narrow.scrollWidth<=step38Narrow.width+1;
  console.log('Step 38 result:', JSON.stringify(step38,null,2))
  if (!step38.success) throw new Error('Step 38 failed: '+JSON.stringify(step38))
  console.log('\n--- Step 39: Reviewed role changes preserve data and references ---')
  const step39Setup = await evalInPage(`async () => {
    const monster=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    monster.addAction();const action=monster.actions[monster.actions.length-1];
    action.id='a7-transition-proof';action.name='Preserved Solar Strike';action.description='Deals {2d6} radiant damage.';
    action.recharge='5-6';action.limitedUse={count:3,rate:'DAY'};action.legendaryOnly=true;
    action.save={override:true,overrideValue:19};action.range='60 ft.';action.components=['V','S'];action.stagePool='all';
    action.crAnnotation={...action.crAnnotation,include:true,automatic:false,maxDamage:42};monster.addLegendaryAction(action.id,2);
    monster.addMultiattack();const combo=monster.multiattacks[monster.multiattacks.length-1];combo.actions=[action.id];combo.id='a7-transition-combo';
    await new Promise(resolve=>setTimeout(resolve,250));
    const chain=document.querySelector('[data-composer-chain="a7-transition-proof"]');
    for(let guard=0;guard<4&&chain.closest('.q-expansion-item--collapsed');guard++) {
      chain.closest('.q-expansion-item--collapsed').querySelector(':scope > .q-expansion-item__container > .q-item').click();
      await new Promise(resolve=>setTimeout(resolve,450));
    }
    return {original:JSON.stringify(action),count:monster.actions.length};
  }`)
  const chooseRole = async (id, label) => evalInPage(`async () => {
    const chain=document.querySelector('[data-composer-chain="${id}"]');
    const select=chain.parentElement.querySelector('.q-select');select.scrollIntoView({block:'center'});
    select.querySelector('.q-field__control').click();await new Promise(resolve=>setTimeout(resolve,300));
    const option=[...document.querySelectorAll('.q-menu [role="option"]')].find(el=>el.textContent.trim()===${JSON.stringify(label)});
    if(!option) throw new Error('Missing role option: '+${JSON.stringify(label)});
    option.click();await new Promise(resolve=>setTimeout(resolve,300));
    return document.querySelector('.q-dialog')?.textContent||'';
  }`)
  const dialogButton = async label => {
    await evalInPage(`() => [...document.querySelectorAll('.q-dialog button')].find(el=>el.textContent.trim().toLowerCase()===${JSON.stringify(label.toLowerCase())}).click()`)
    await pause(500)
  }
  const movePrompt=await chooseRole('a7-transition-proof','Mythic Action');await dialogButton('Cancel')
  const canceledMove=await evalInPage(`() => JSON.stringify(document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster').actions.find(a=>a.id==='a7-transition-proof'))`)
  await chooseRole('a7-transition-proof','Mythic Action');await dialogButton('Change role')
  const moved=await evalInPage(`() => {
    const monster=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    return {action:JSON.stringify(monster.actions.find(a=>a.id==='a7-transition-proof')),cost:monster.mythicActions.actions.find(a=>a.actionId==='a7-transition-proof')?.cost,
      unlinked:!monster.legendaryActions.actions.some(a=>a.actionId==='a7-transition-proof'),count:monster.actions.length,
      reference:monster.multiattacks.find(a=>a.id==='a7-transition-combo').actions.includes('a7-transition-proof')};
  }`)
  const copyPrompt=await chooseRole('a7-transition-proof','Trait');await dialogButton('Cancel')
  const canceledCopy=await evalInPage(`() => !document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster').traits.some(t=>t.name==='Preserved Solar Strike')`)
  await chooseRole('a7-transition-proof','Trait');await dialogButton('Create copy')
  const copied=await evalInPage(`() => {
    const monster=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const original=monster.actions.find(a=>a.id==='a7-transition-proof');const copy=monster.traits.find(t=>t.name==='Preserved Solar Strike');
    return {id:copy.id,independent:copy.id!==original.id&&copy.limitedUse!==original.limitedUse&&copy.crAnnotation!==original.crAnnotation,
      uses:copy.limitedUse.count===3,excluded:copy.crAnnotation.include===false,description:copy.description===original.description,
      original:JSON.stringify(original),reference:monster.multiattacks.find(a=>a.id==='a7-transition-combo').actions.includes(original.id)};
  }`)
  await sendCdp('Page.reload');await pause(1200)
  const transitionPersistence=await evalInPage(`() => {
    const monster=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const copy=monster.traits.find(t=>t.id===${JSON.stringify(copied.id)});
    const retained=!!copy&&copy.crAnnotation.include===false&&monster.actions.some(a=>a.id==='a7-transition-proof')&&monster.mythicActions.actions.some(a=>a.actionId==='a7-transition-proof'&&a.cost===2);
    monster.deleteAction('a7-transition-proof');
    return {retained,cleanup:!monster.mythicActions.actions.some(a=>a.actionId==='a7-transition-proof')&&!monster.multiattacks.find(a=>a.id==='a7-transition-combo').actions.includes('a7-transition-proof'),copyKept:monster.traits.some(t=>t.id===${JSON.stringify(copied.id)})};
  }`)
  const step39={moveReviewed:movePrompt.includes('multiattack references'),canceledMove:canceledMove===step39Setup.original,
    moveIntact:moved.action===step39Setup.original&&moved.cost===2&&moved.unlinked&&moved.reference&&moved.count===step39Setup.count,
    copyReviewed:copyPrompt.includes('original entry')&&copyPrompt.includes('excluded'),canceledCopy,
    copyIntact:copied.independent&&copied.uses&&copied.excluded&&copied.description&&copied.reference&&copied.original===moved.action,...transitionPersistence};
  console.log('Step 39 result:',JSON.stringify(step39,null,2))
  if(!Object.values(step39).every(value=>value===true)) throw new Error('Step 39 failed: '+JSON.stringify(step39))
  console.log('\n--- Step 40: A v8-labelled save opened from disk keeps every authored field, plate order and seven-role preview parity ---')
  const legacyFixture = JSON.parse(fs.readFileSync(path.resolve('test/fixtures/a7-preservation-v8.json'), 'utf8'))
  const step40 = await evalInPage(`async () => {
    const raw = ${JSON.stringify(legacyFixture)};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster');
    const editor = pinia._s.get('editor');
    const openFile = [...document.querySelectorAll('header button')].find((button) => button.querySelector('.mdi-folder-open'));
    if (!openFile) return { loaded: false, reason: 'no Open File button' };
    // The toolbar's own Open File flow; only the native file picker is answered with the fixture.
    const nativeClick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type !== 'file') return nativeClick.call(this);
      const transfer = new DataTransfer();
      transfer.items.add(new File([JSON.stringify(raw)], 'legacy-v8.json', { type: 'application/json' }));
      this.files = transfer.files;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
      openFile.click();
      for (let attempt = 0; monster.name !== raw.name && attempt < 40; attempt++) await wait(100);
    } finally {
      HTMLInputElement.prototype.click = nativeClick;
    }
    const loaded = monster.name === raw.name && monster.saveVersion === 11;
    // Migration may add defaults; every authored value and array position must survive.
    const retained = (actual, expected) => Array.isArray(expected)
      ? Array.isArray(actual) && actual.length === expected.length && expected.every((item, index) => retained(actual[index], item))
      : expected && typeof expected === 'object'
        ? !!actual && Object.entries(expected).every(([key, value]) => retained(actual[key], value))
        : actual === expected;
    const lost = ['actions', 'traits', 'reactions', 'lairActions', 'legendaryActions', 'mythicActions', 'multiattacks']
      .filter((key) => !retained(monster[key], raw[key]));
    const studio = document.querySelector('[data-composer-chain="action"]');
    for (let guard = 0; guard < 4 && studio && studio.closest('.q-expansion-item--collapsed'); guard++) {
      studio.closest('.q-expansion-item--collapsed').querySelector(':scope > .q-expansion-item__container > .q-item').click();
      await wait(450);
    }
    const ids = ['action', 'bonus', 'legendary', 'mythic', 'trait', 'reaction', 'lair'];
    const unmatched = [];
    for (const template of ['modern', 'classic']) {
      editor.visualTemplate = template;
      await wait(350);
      const entries = [...document.querySelectorAll('#render .statblock :is(.trait, .action)')];
      for (const id of ids) {
        const preview = document.querySelector('[data-composer-preview="' + id + '"] .action');
        if (!preview || !entries.some((entry) => entry.innerHTML === preview.innerHTML)) unmatched.push(template + ':' + id);
      }
    }
    const reactionHead = [...document.querySelectorAll('[data-composer-chain="reaction"] [data-chain-row="head"] [data-chain-cell]')]
      .map((cell) => cell.dataset.chainCell).join(',');
    return { loaded, saveVersion: monster.saveVersion, lost, unmatched, reactionHead };
  }`)
  await sendCdp('Page.reload')
  await pause(1500)
  step40.persisted = await evalInPage(`() => {
    const monster = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('monster');
    const action = monster.actions.find((entry) => entry.id === 'action');
    return monster.name === 'A7 Preservation Witness' && action?.save?.overrideValue === 19 && action?.outcomes?.[0]?.rider === 'Witness rider' &&
      monster.reactions[0]?.limitedUse?.count === 4 && monster.legendaryActions.actions[0]?.cost === 2 && monster.mythicActions.actions[0]?.cost === 3;
  }`)
  step40.success = step40.loaded === true && step40.lost?.length === 0 && step40.unmatched?.length === 0 &&
    step40.reactionHead === 'usage,name' && step40.persisted === true
  console.log('Step 40 result:', JSON.stringify(step40, null, 2))
  if (!step40.success) throw new Error('Step 40 failed: ' + JSON.stringify(step40))

  console.log('\n--- Step 41: Markdown, Homebrewery, LaTeX and Improved Initiative exports print every role as prose, never web markup ---')
  const step41 = await evalInPage(`async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster');
    const editor = pinia._s.get('editor');
    for (let attempt = 0; attempt < 60 && !document.querySelector('header .mdi-folder-open'); attempt++) await wait(100);
    const before = JSON.stringify(monster.$state);
    const labels = {
      markdown: 'Export Markdown (Homebrewery Legacy)',
      homebrewery: 'Export Markdown (Homebrewery v3)',
      latex: 'Export LaTeX (rpgtex)',
      improvedInitiative: 'Export JSON (Improved Initiative format)',
    };
    // Downloads are captured as blobs; nothing leaves the page.
    const captured = [];
    const nativeUrl = URL.createObjectURL;
    const nativeAnchor = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (blob) => { captured.push(blob); return 'blob:export-proof'; };
    HTMLAnchorElement.prototype.click = function () {};
    const files = {};
    try {
      for (const template of ['modern', 'classic']) {
        editor.visualTemplate = template;
        await wait(300);
        for (const [format, label] of Object.entries(labels)) {
          const menu = [...document.querySelectorAll('header button')].find((button) => button.querySelector('i')?.textContent.trim() === 'download');
          menu.click();
          await wait(350);
          const item = [...document.querySelectorAll('.q-menu .q-item')].find((entry) => entry.textContent.trim() === label);
          const count = captured.length;
          item?.click();
          await wait(350);
          files[template + ':' + format] = captured.length > count ? await captured[captured.length - 1].text() : '';
        }
      }
    } finally {
      URL.createObjectURL = nativeUrl;
      HTMLAnchorElement.prototype.click = nativeAnchor;
    }
    const witnesses = ['Authored action', 'Authored bonus', 'Authored legendary', 'Authored mythic', 'Authored trait', 'Authored reaction', 'lair witness prose'];
    const problems = [];
    for (const [key, body] of Object.entries(files)) {
      const [, format] = key.split(':');
      if (!body) { problems.push(key + ': no file'); continue; }
      const markup = body.match(/<\\/?[a-z][^>]*>/i);
      if (markup || body.includes('sb-plate')) problems.push(key + ': web markup ' + (markup ? markup[0] : 'sb-plate'));
      if (/undefined|followed by ,/.test(body)) problems.push(key + ': broken prose');
      if (format === 'improvedInitiative') {
        let creature = null;
        try { creature = Object.values(JSON.parse(body)).find((value) => value && value.Name); } catch (error) { problems.push(key + ': invalid JSON'); continue; }
        for (const pool of ['LegendaryActions', 'MythicActions']) {
          if (!(creature[pool] || []).some((entry) => entry.Content.includes('Charisma Saving Throw'))) problems.push(key + ': ' + pool + ' lost mechanics');
        }
        continue;
      }
      const lost = witnesses.filter((witness) => !body.includes(witness));
      if (lost.length) problems.push(key + ': missing ' + lost.join(', '));
      // Structured mechanics reach the action, bonus, legendary and mythic entries alike.
      if ((body.match(/Charisma Saving Throw/g) || []).length < 4) problems.push(key + ': structured mechanics lost');
      if ((body.match(/Multiattack/g) || []).length !== 1) problems.push(key + ': multiattack label repeated');
      if (format === 'latex' && ((body.match(/\\\\begin\\{DndMonsterLegendaryActions\\}/g) || []).length !== 2 || !body.includes('\\\\DndMonsterAction{Witness Awakening'))) {
        problems.push(key + ': legendary layout or mythic trait lead lost');
      }
    }
    for (const format of Object.keys(labels)) {
      if (files['modern:' + format] !== files['classic:' + format]) problems.push(format + ': depends on the visual template');
    }
    return { problems, unchanged: before === JSON.stringify(monster.$state), sizes: Object.fromEntries(Object.entries(files).map(([key, body]) => [key, body.length])) };
  }`)
  step41.success = step41.problems.length === 0 && step41.unchanged === true
  console.log('Step 41 result:', JSON.stringify(step41, null, 2))
  if (!step41.success) throw new Error('Step 41 failed: ' + JSON.stringify(step41))
  consoleErrors.forEach((e) => console.error(e))

  console.log('RUNTIME EXCEPTIONS DETECTED:', runtimeExceptions.length)
  runtimeExceptions.forEach((e) => console.error(e))
  console.log('======================================================\n')

  ws.close()
  chromeProc.kill()
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  } catch (e) {}

  if (consoleErrors.length > 0 || runtimeExceptions.length > 0) {
    throw new Error('Fuzzing encountered console errors or runtime exceptions!')
  }

  console.log('ALL 41 EXHAUSTIVE UI STEPS PASSED WITH 0 ERRORS!')
}

runFuzz().catch((e) => {
  console.error('Fatal fuzz test failure:', e)
  process.exit(1)
})

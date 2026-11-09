import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9228
const ARTIFACT_DIR = 'C:\\Users\\Administrador\\.gemini\\antigravity\\brain\\addb53e0-c313-4ac6-9aa8-46bc7e873a1d'

async function capture() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-capture-182-'))
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,3200',
    'http://localhost:8080/#/'
  ])

  let targets = null
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try { resolve(JSON.parse(data)) } catch (err) { reject(err) }
          })
        }).on('error', reject)
      })
      if (Array.isArray(targets) && targets.length > 0) break
    } catch {}
  }
  if (!targets) throw new Error('Could not connect to Chrome CDP endpoint on port ' + PORT)

  const pageTarget = targets.find((t) => t.type === 'page')
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

  let id = 1
  const pendingRequests = new Map()

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString()
    const msg = JSON.parse(raw)
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '))
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails)
    }
    if (msg.id && pendingRequests.has(msg.id)) {
      const cb = pendingRequests.get(msg.id)
      pendingRequests.delete(msg.id)
      cb(msg)
    }
  })

  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const key = id++
      pendingRequests.set(key, (msg) => resolve(msg.result))
      ws.send(JSON.stringify({ id: key, method, params }))
    })
  }

  await sendCdp('Runtime.enable')
  await sendCdp('Page.enable')

  async function evalInPage(expression) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: `(${expression})()`,
      awaitPromise: true,
      returnByValue: true
    })
    if (res.exceptionDetails) {
      console.error('EVAL ERROR:', res.exceptionDetails)
    }
    return res.result?.value !== undefined ? res.result.value : res.result
  }

  // Wait for Quasar and Statblock to mount
  for (let i = 0; i < 60; i++) {
    const ready = await evalInPage(`
      () => {
        const app = document.querySelector('#q-app');
        return !!(app && app.__vue_app__ && document.querySelector('#render .statblock'));
      }
    `)
    if (ready) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  // Dismiss Changelog dialog
  await evalInPage(`
    () => {
      const dialog = document.querySelector('.q-dialog');
      if (dialog && dialog.textContent.includes('Changelog')) {
        const doneBtn = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.includes('Done')) || dialog.querySelector('button');
        if (doneBtn) doneBtn.click();
      }
    }
  `)
  await new Promise((r) => setTimeout(r, 400))

  // Set up monster with exact fields from user's Ezra Meridian Aethelgard & Bob Warjack
  await evalInPage(`
    async () => {
      const app = document.querySelector('#q-app');
      const pinia = app.__vue_app__.config.globalProperties.$pinia;
      const monster = pinia._s.get('monster');
      const editorStore = pinia._s.get('editor');

      monster.name = 'Ezra Meridian Aethelgard';
      monster.type = 'Celestial';
      monster.size = 'Medium';
      monster.alignment = 'Lawful Good';
      monster.cr = '3';
      monster.proficiency = 2;
      monster.showXp = true;
      monster.compactNameplate = true;

      // AC with indented riders
      monster.ac = 10;
      monster.splitAcRiderRows = true;
      monster.extendedHp = monster.extendedHp || {};
      monster.extendedHp.acSubmodule = {
        enabled: true,
        attackerSave: {
          enabled: true,
          stat: 'WIS',
          dc: 15,
          failureEffect: 'Knocks Prone'
        }
      };

      // HP with indented riders
      monster.hp = {
        total: 112,
        bloodied: 56,
        formula: '15d8+45',
        type: 'd8',
        modifier: 45
      };
      monster.splitHpRiderRows = true;
      monster.extendedHp.regeneration = {
        enabled: true,
        amount: 10,
        recoveryType: 'temp_hp',
        conditionModifier: 'not_bloodied',
        displayMode: 'minimalist'
      };
      monster.extendedHp.deathPrevention = {
        enabled: true,
        mode: 'returns_1hp',
        proseMode: 'minimalist',
        damageType: 'necrotic'
      };

      // Defenses with dedicated row splits & authored order
      monster.splitVulnRows = true;
      monster.splitResRows = true;
      monster.splitImmRows = true;
      monster.autoSortDefenses = false;

      monster.vulnerabilitiesList = [{ type: 'necrotic', mode: 'none' }, { type: 'poison', mode: 'disadvantage' }];
      monster.resistancesList = [{ type: 'radiant', mode: 'none' }];
      monster.conditionsList = [{ type: 'frightened', mode: 'advantage' }, { type: 'charmed', mode: 'advantage' }];

      // Speed with indented locomotion riders
      monster.speeds = [{ id: 'sp-1', type: 'walk', speed: 30, note: '' }];
      monster.speedTraversal = {
        trackingSpeed: 30
      };
      monster.splitSpeedRiderRows = true;
      monster.speedRiders = [
        { id: 'sr-1', name: 'Dash', note: 'Can Dash as a Bonus Action' },
        { id: 'sr-2', name: 'Dodge', note: '5ft of you is Lightly Obscured until end of turn' },
        { id: 'sr-3', name: 'Disengage', note: 'Gain 10 of Temporary Hit Points' }
      ];

      monster.sensesList = [
        {
          id: 's-planes',
          name: 'Material and Ethereal Planes',
          range: 60,
          acrossPlanes: true,
          presences: ['celestials', 'fiends', 'undead']
        },
        {
          id: 's-dv',
          name: 'Darkvision',
          range: 60,
          ignoresMagicalDarkness: true
        }
      ];

      monster.languagesList = [
        { id: 'l1', name: 'Common' },
        { id: 'l2', name: 'Celestial' },
        {
          id: 'l3',
          name: 'Dead',
          asSpell: 'Speak with Dead',
          specialProse: 'up to 5 questions, corpse must have a mouth, dead within 10 days, answers may be brief or cryptic'
        }
      ];

      // Traits with Arcane Condenser and Cortex demonstrating floated head with inline wrapping body
      monster.traits = [
        {
          id: 'tr-condenser',
          name: 'Arcane Condenser',
          description: 'It has 10 charges, regained after 4 hours of Inactivity, and its Unconscious when its charges becomes 0 or lower, as well as after 4 hours of Combat.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { include: true, maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        },
        {
          id: 'tr-cortex',
          name: 'Cortex',
          description: 'Understands basic commands from its controller, and carries out Non-Telepathic commands, with no regard for its own safety, yet limited to those of a trained animal.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { include: true, maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        }
      ];

      // Actions demonstrating Slam (Row 1 scope/type, Row 2 outcomes) and Multiattack
      monster.actions = [
        {
          id: 'act-slam',
          name: 'Slam',
          actionType: 'weapon_attack',
          attackBonus: 4,
          range: '10 ft.',
          targetsText: '1 which you can see',
          description: 'Hit: 8 (1d8 + 4) Bludgeoning, If you have Temporary Hit Points, you can choose to take 4 (1d8) of Force, if you do, all other creatures 10ft of it also takes the damage it took this way.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { include: true, maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        },
        {
          id: 'act-multi',
          name: 'Multiattack',
          description: 'Make 2 Attacks.',
          limitedUse: { count: 0, rate: '' },
          crAnnotation: { include: false, maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0 }
        }
      ];

      monster.bonusActions = [
        {
          id: 'ba-exorcise',
          name: 'Exorcise',
          recharge: '6-12',
          spellLevel: 'Cantrip',
          spellSchool: 'Abjuration',
          components: ['V', 'S'],
          duration: '1 round',
          targetsText: 'Enemies 20 ft. of you across the Ethereal and Material Planes',
          attackBonus: 6,
          actionType: 'spell_attack',
          description: 'On Success : takes 13 (3d8) Radiant, otherwise, double and until End Of Turn, Suppresses its effects leaving one or more creatures Possessed or Charmed by it, brought into the Material Plane if on the Ethereal Plane to closest unoccupied space, without Immunity to being Grappled and Prone.'
        }
      ];

      monster.spellcasting = {
        standard: [
          'Prestidigitation (V, S)',
          'Mage Hand (V, S)',
          'Protection from Evil and Good (V, S, M, C)',
          'Hellish Rebuke (V, S)',
          'Invisibility (V, S, M, C)',
          'Hold Person (V, S, M, C)',
          'Remove Curse (V, S)',
          'Counterspell (S)',
          'Dispel Magic (V, S)'
        ],
        atWill: [],
        stat: 'CHA',
        save: 14,
        modifier: 6,
        slots: ['4', '3', '2']
      };

      editorStore.visualTemplate = 'modern';
      editorStore.visualTheme = 'wotc';
    }
  `)

  await new Promise((r) => setTimeout(r, 600))

  // Capture the statblock bounding box
  const clip = await evalInPage(`
    () => {
      const el = document.querySelector('#render .statblock') || document.querySelector('.statblock');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(rect.x) - 4),
        y: Math.max(0, Math.round(rect.y) - 4),
        width: Math.round(rect.width) + 8,
        height: Math.round(rect.height) + 8,
        scale: 1
      };
    }
  `)

  console.log('Target clip:', clip)

  let screenshotParams = { format: 'png' }
  if (clip && clip.width > 0 && clip.height > 0) {
    screenshotParams.clip = clip
  }

  const screenshot = await sendCdp('Page.captureScreenshot', screenshotParams)
  const data = screenshot.data
  const buffer = Buffer.from(data, 'base64')
  const outPath = path.join(ARTIFACT_DIR, 'candidate182-indented-vitals-and-overlays.png')
  fs.writeFileSync(outPath, buffer)
  console.log('Saved screenshot to:', outPath)

  ws.close()
  chromeProc.kill()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) {}
}

capture().catch((err) => {
  console.error('Capture failed:', err)
  process.exit(1)
})

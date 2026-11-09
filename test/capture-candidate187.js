import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9228
const ARTIFACT_DIR = 'C:\\Users\\Administrador\\.gemini\\antigravity\\brain\\addb53e0-c313-4ac6-9aa8-46bc7e873a1d'

async function capture() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-capture-187-'))
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,2800',
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
    if (msg.id && pendingRequests.has(msg.id)) {
      const cb = pendingRequests.get(msg.id)
      pendingRequests.delete(msg.id)
      cb(msg)
    }
  })

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++
      pendingRequests.set(reqId, (response) => {
        if (response.error) reject(new Error(response.error.message))
        else resolve(response.result)
      })
      ws.send(JSON.stringify({ id: reqId, method, params }))
    })
  }

  await sendCdp('Runtime.enable')
  await sendCdp('Page.enable')

  ws.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString()
    const msg = JSON.parse(raw)
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER LOG:', msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '))
    }
  })

  async function evalInPage(fnString) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: `(${fnString})()`,
      returnByValue: true,
      awaitPromise: true,
    })
    if (res.exceptionDetails) {
      console.error('CDP eval exception:', res.exceptionDetails)
    }
    return res.result?.value
  }

  // Wait for Quasar app mount
  for (let i = 0; i < 40; i++) {
    const status = await evalInPage(`
      () => {
        const app = document.querySelector('#q-app');
        return {
          href: window.location.href,
          title: document.title,
          hasApp: !!app,
          hasVue: !!(app && app.__vue_app__),
          hasStatblock: !!document.querySelector('#render .statblock'),
          dialog: document.querySelector('.q-dialog')?.textContent?.slice(0, 50)
        };
      }
    `)
    console.log('Mount attempt ' + i + ':', status);
    if (status && status.hasStatblock) break;
    await new Promise((r) => setTimeout(r, 500))
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

  await evalInPage(`
    async () => {
      try {
        const app = document.querySelector('#q-app');
        const pinia = app.__vue_app__.config.globalProperties.$pinia;
        const monster = pinia._s.get('monster');
        const editorStore = pinia._s.get('editor');

      editorStore.visualTemplate = 'modern';
      editorStore.a4PreviewMode = false;
      editorStore.statBlockColumns = 1;

      monster.name = 'Light Iosan Warjack (Bob)';
      monster.alignment = 'Unaligned';
      monster.size = 'Large';
      monster.type = 'Construct';
      monster.cr = '3';
      monster.proficiency = 2;
      monster.showXp = false;
      monster.compactNameplate = true;

      monster.initiativeConfig = {
        secondaryStat: 'DEX',
        statMode: 'override',
        advantage: 'disadvantage',
        riderNotes: ['Gains 20 Temporary Hit Points']
      };

      monster.AC = 14;
      monster.ACType = '19 if It Has Temporary Hit Points, On Miss Knocks Prone';
      
      monster.HP = { HD: 13, type: 10, modifier: 39 };
      monster.extendedHp = {
        showBloodied: true,
        bloodiedOverride: 55,
        damageThreshold: null,
        damageReduction: null,
        regeneration: {
          enabled: true,
          amount: 5,
          recoveryType: 'hp',
          conditionModifier: 'not_bloodied',
          disruptedBy: ''
        }
      };

      monster.stats = { STR: 6, DEX: 18, CON: 16, INT: 6, WIS: 6, CHA: 1 };
      monster.saves = {
        STR: { proficient: false, override: true, overrideValue: -2 },
        DEX: { proficient: true, override: true, overrideValue: 6 },
        CON: { proficient: false, override: true, overrideValue: 5 },
        INT: { proficient: false, override: true, overrideValue: -2 },
        WIS: { proficient: false, override: true, overrideValue: -2 },
        CHA: { proficient: false, override: true, overrideValue: -5 },
      };

      monster.speeds = [
        { id: 'sp1', type: 'walk', speed: 30, note: '' }
      ];
      monster.speedTraversal = {
        bonusActionDisengage: true,
        disengageNote: 'Gain 10 of Temporary Hit Points.'
      };

      monster.sensesList = [
        { id: 'sn1', name: 'Darkvision', range: 60 }
      ];

      monster.traits = [
        {
          id: 't1',
          name: 'Arcane Condenser',
          description: 'It has 10 charges, regained after 4 hours of Inactivity, and its Unconscious when its charges becomes 0 or lower, as well as after 4 hours of Combat.'
        },
        {
          id: 't2',
          name: 'Cortex',
          description: 'Understands basic commands from its controller, and carries out Non-Telepathic commands, with no regard for its own safety, yet limited to those of a trained animal.'
        },
        {
          id: 't3',
          name: 'Heavy Metal',
          description: 'Your Melee Weapon Attacks are Magical'
        }
      ];

      monster.spellcasting = {
        stat: 'CHA',
        level: 8,
        class: 'Warlock',
        resourceType: 'pact',
        notes: 'Pact Magic · 2 4th-level slots · regained on Short Rest',
        useCustomClassPreamble: false,
        customClassPreamble: '',
        useCustomInnatePreamble: false,
        customInnatePreamble: '',
        atWillNotes: '',
        standard: [
          'Protection from Evil and Good',
          'Hellish Rebuke',
          'Invisibility',
          'Hold Person',
          'Remove Curse',
          'Counterspell',
          'Dispel Magic'
        ],
        atWill: [
          { id: 'cantrips', count: 1, rate: 'AT_WILL', spells: ['Prestidigitation', 'Mage Hand'] }
        ],
        slots: [0, 0, 0, 2, 0, 0, 0, 0, 0],
        save: { override: true, overrideValue: 14 },
        attack: { override: true, overrideValue: 6 },
        modifier: { override: true, overrideValue: 6 },
        metamagic: {
          enabled: true,
          sorceryPoints: 4,
          refreshRate: 'Long Rest',
          options: ['Quickened Spell', 'Twinned Spell']
        }
      };

      monster.actions = [
        {
          id: 'a1',
          name: 'Astral Binding',
          description: 'Speed reduced by 10 ft., if 0 ft. at End Of Turn, its knocked Prone.',
          recharge: '4-12',
          school: 'Evocation',
          spellLevel: 'Cantrip',
          components: ['V', 'S'],
          duration: '',
          attackSource: 'spell',
          attackReach: 'ranged',
          attackBonus: 6,
          targeting: { count: 3, kind: 'enemies', range: { distance: 60, unit: 'ft' }, qualifier: 'you can see across the Material and Ethereal Planes' },
          outcomes: [
            {
              trigger: 'hit',
              effects: [{ formula: '1d8 + 4', damageType: '' }],
              rider: 'Speed reduced by 10 ft., if 0 ft. at End Of Turn, its knocked Prone.'
            }
          ]
        },
        {
          id: 'a2',
          name: 'Exorcise',
          description: 'takes 13 (3d8) Radiant, otherwise, double and until End Of Turn, Suppresses its effects.',
          recharge: '6-12',
          school: 'Abjuration',
          spellLevel: 'Cantrip',
          components: ['V', 'S'],
          duration: '1 round',
          bonusAction: true,
          save: { override: true, overrideValue: 14 },
          stat: 'CHA',
          targeting: { count: 1, kind: 'enemies', range: { distance: 20, unit: 'ft' }, qualifier: 'of you across the Ethereal and Material Planes' },
          outcomes: [
            {
              trigger: 'success',
              effects: [{ formula: '3d8', damageType: 'radiant' }],
              rider: 'takes 13 (3d8) Radiant, otherwise, double and until End Of Turn, Suppresses its effects.'
            }
          ]
        },
        {
          id: 'a3',
          name: 'Slam',
          description: 'Hit: 8 (1d8 + 4) Bludgeoning. If you have Temporary Hit Points, you can choose to take 4 (1d8) of Force, if you do, all creatures 10 ft. of it takes the same rolled number.',
          attackSource: 'weapon',
          attackReach: 'melee',
          attackBonus: 0,
          targeting: { count: 1, kind: 'targets', qualifier: 'which you can see' },
          outcomes: [
            {
              trigger: 'hit',
              effects: [{ formula: '1d8 + 4', damageType: 'bludgeoning' }],
              rider: 'If you have Temporary Hit Points, you can choose to take 4 (1d8) of Force.'
            }
          ]
        },
        {
          id: 'a4',
          name: 'Multiattack',
          description: 'Make 2 Attacks.'
        }
      ];

      await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error('SETUP ERROR IN PAGE:', err.stack || err);
      }
    }
  `)

  await new Promise((r) => setTimeout(r, 800))

  const clip = await evalInPage(`
    () => {
      const p1 = document.querySelectorAll('.q-splitter__panel')[1];
      console.log('Panel 1 HTML:', p1 ? p1.innerHTML.slice(0, 500) : 'NO PANEL 1');
      console.log('CLIP URL:', window.location.href);
      console.log('CLIP q-app children:', document.querySelector('#q-app')?.innerHTML?.slice(0, 300));
      console.log('char-splitter:', !!document.querySelector('#char-splitter'));
      console.log('char-sheet:', !!document.querySelector('#char-sheet'));
      console.log('renderer:', !!document.querySelector('#renderer'));
      console.log('render:', !!document.querySelector('#render'));
      console.log('#render innerHTML length:', document.querySelector('#render')?.innerHTML?.length);
      console.log('monster-name:', !!document.querySelector('.monster-name'));
      const el = document.querySelector('#render .statblock-wrapper') || document.querySelector('#render .statblock') || document.querySelector('.statblock') || document.querySelector('.a4-page-sheet');
      console.log('Found element:', el ? el.className : 'NONE');
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
  const buffer = Buffer.from(screenshot.data, 'base64')
  const outPath = path.join(ARTIFACT_DIR, 'candidate187-spell-components-a4-overflow.png')
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

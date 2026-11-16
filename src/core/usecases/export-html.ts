import type { Monster } from '../domain/types.ts'
import { STATBLOCK_GRAMMAR_EXPORT_CSS } from '../domain/export-contract.ts'
import { markdownOf } from './export-markdown.ts'
import { resolveMonsterText } from './ResolveMonsterText.ts'
import { renderSpellcastingHtmlPlates } from './ExportStatblock.ts'
import type { ExportRenderOptions } from './ExportStatblock.ts'

export function exportToHtml(
  monster: Monster,
  style: '2014' | '2024' = '2014',
  options: ExportRenderOptions = {},
): string {
  const resolvedMonster = resolveMonsterText(monster)
  const monsterName = resolvedMonster.nickname || resolvedMonster.name || 'Monster'
  const spellPlaceholder = '%%DNDSHEET_SPELLCASTING_PLATES%%'
  const md = markdownOf(resolvedMonster, style, options, spellPlaceholder)
  let body = md
    .replace(/^## (.*$)/gm, '<h2 class="statblock-name">$1</h2>')
    .replace(/^\*(.*)\*$/gm, '<div class="statblock-meta"><em>$1</em></div>')
    .replace(/^___$/gm, '<hr class="statblock-divider" />')
    .replace(/^### (.*$)/gm, '<h3 class="statblock-section">$1</h3>')
    .replace(/\*\*\*(.*?)\.\*\*\*/g, '<strong><em>$1.</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/<em>(Hit|Miss|Save Success|Save Failure|Success|Failure|First Failure|Second Failure|Trigger|Response):<\/em>/g, '<em class="dnd-outcome">$1:</em>')
    .replace(/\n\n/g, '<p></p>')
    .replace(spellPlaceholder, () => renderSpellcastingHtmlPlates(resolvedMonster, style, options.spells))

  // Enhance with interactive click-to-roll tags
  // 1. Attack bonuses: e.g. "+5 to hit"
  body = body.replace(/([+-]\d+)\s+to hit/g, '<button class="dnd-roll-btn" onclick="rollD20(\'Attack Roll\', $1)">$1 to hit</button>')
  // 2. Damage formulas: e.g. "(2d6 + 3)" or "(1d8)"
  body = body.replace(/\((\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\)/g, (match, count, dice, sign, mod) => {
    const m = sign === '-' ? -parseInt(mod || '0') : parseInt(mod || '0')
    return `(<button class="dnd-roll-btn" onclick="rollDice('Damage Roll', ${count}, ${dice}, ${m})">${count}d${dice}${sign ? ` ${sign} ${mod}` : ''}</button>)`
  })
  // 3. Recharge tags: e.g. "Recharge 5–6" or "Recharge 6"
  body = body.replace(/Recharge\s*(\d+)[–-]6/gi, (match, min) => {
    return `<button class="dnd-roll-btn recharge" onclick="rollRecharge('Recharge Check', ${min})">Recharge ${min}–6</button>`
  })
  body = body.replace(/Recharge\s*6\b/gi, '<button class="dnd-roll-btn recharge" onclick="rollRecharge(\'Recharge Check\', 6)">Recharge 6</button>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monsterName} - Interactive D&D 5e Statblock</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #1e1e1e;
      color: #333;
      font-family: Georgia, 'Times New Roman', serif;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .dnd-statblock-wrapper {
      max-width: 800px;
      width: 100%;
    }
    .dnd-statblock {
      background: #fdf1dc;
      padding: 24px;
      border: 1px solid #d3a362;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      border-radius: 4px;
      position: relative;
    }
    .dnd-statblock.revised {
      border-left: 6px solid #7a2021;
    }
    .dnd-statblock.classic {
      border-top: 5px solid #e69a28;
      border-bottom: 5px solid #e69a28;
    }
    .statblock-name {
      color: #7a2021;
      font-family: 'Cinzel', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: capitalize;
    }
    .statblock-meta {
      font-size: 14px;
      color: #555;
      font-style: italic;
      margin-bottom: 8px;
    }
    .statblock-divider {
      border: 0;
      height: 2px;
      background: linear-gradient(90deg, #9c2727 0%, #e69a28 50%, #9c2727 100%);
      margin: 10px 0;
    }
    .statblock-section {
      color: #7a2021;
      font-size: 18px;
      border-bottom: 1px solid #7a2021;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      text-align: center;
    }
    th {
      color: #7a2021;
      font-weight: bold;
      font-size: 13px;
      padding: 4px;
    }
    td {
      font-size: 14px;
      padding: 4px;
    }
    p {
      margin-bottom: 6px;
      font-size: 14px;
      line-height: 1.45;
    }
    strong {
      color: #222;
    }
    .dnd-roll-btn {
      background: rgba(122, 32, 33, 0.08);
      color: #7a2021;
      border: 1px solid rgba(122, 32, 33, 0.25);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: inherit;
      font-size: inherit;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
      vertical-align: middle;
      line-height: 1.2;
    }
    .dnd-roll-btn:hover {
      background: #7a2021;
      color: #fff;
      border-color: #7a2021;
      box-shadow: 0 2px 6px rgba(122, 32, 33, 0.4);
      transform: translateY(-1px);
    }
    .dnd-roll-btn.recharge {
      background: rgba(230, 154, 40, 0.15);
      color: #b36b00;
      border-color: rgba(230, 154, 40, 0.4);
    }
    .dnd-roll-btn.recharge:hover {
      background: #b36b00;
      color: #fff;
    }
    .roll-adv {
      color: #2e7d32;
      font-size: 14px;
      margin-right: 2px;
    }
    .roll-disadv {
      color: #c62828;
      font-size: 14px;
      margin-right: 2px;
    }
    /* Floating Dice Tray */
    #dice-tray {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-width: calc(100vw - 40px);
      background: #2a2a2a;
      border: 1px solid #e69a28;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      color: #e0e0e0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #dice-tray-header {
      background: #1e1e1e;
      padding: 10px 14px;
      font-weight: bold;
      font-size: 14px;
      color: #e69a28;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #444;
      cursor: pointer;
    }
    #dice-tray-controls button {
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 3px;
    }
    #dice-tray-controls button:hover {
      color: #fff;
      background: #444;
    }
    #dice-tray-log {
      max-height: 240px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dice-roll-card {
      background: #333;
      border-left: 3px solid #e69a28;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 13px;
      animation: fadeIn 0.2s ease-out;
    }
    .dice-roll-card.recharged {
      border-left-color: #4caf50;
    }
    .dice-roll-card.failed {
      border-left-color: #f44336;
    }
    .dice-roll-title {
      font-weight: bold;
      color: #fff;
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .dice-roll-time {
      font-size: 11px;
      color: #888;
    }
    .dice-roll-breakdown {
      color: #bbb;
      font-size: 12px;
    }
    .dice-roll-total {
      font-size: 16px;
      font-weight: bold;
      color: #e69a28;
      text-align: right;
      margin-top: 2px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }${options.embedGrammarCss === false ? '' : `\n${STATBLOCK_GRAMMAR_EXPORT_CSS}`}
  </style>
</head>
<body>
  <div class="dnd-statblock-wrapper">
    <div class="dnd-statblock ${style === '2024' ? 'revised' : 'classic'}">
${body}
    </div>
  </div>

  <!-- Floating Dice Tray -->
  <div id="dice-tray">
    <div id="dice-tray-header" onclick="toggleDiceTray()">
      <span>🎲 Roll Log & Dice Tray</span>
      <div id="dice-tray-controls" onclick="event.stopPropagation()">
        <button onclick="clearDiceLog()">Clear</button>
        <button id="toggle-tray-btn" onclick="toggleDiceTray()">_</button>
      </div>
    </div>
    <div id="dice-tray-log">
      <div class="dice-roll-card" style="border-left-color: #888;">
        <div class="dice-roll-title">
          <span>Click any bonus or damage formula to roll!</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    function logRoll(title, breakdown, total, statusClass) {
      const log = document.getElementById('dice-tray-log');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const card = document.createElement('div');
      card.className = 'dice-roll-card' + (statusClass ? ' ' + statusClass : '');
      card.innerHTML =
        '<div class="dice-roll-title">' +
          '<span>' + title + '</span>' +
          '<span class="dice-roll-time">' + timeStr + '</span>' +
        '</div>' +
        '<div class="dice-roll-breakdown">' + breakdown + '</div>' +
        (total !== undefined ? '<div class="dice-roll-total">' + total + '</div>' : '');
      log.appendChild(card);
      log.scrollTop = log.scrollHeight;
    }

    function rollD20(title, mod, advDis) {
      const m = parseInt(mod) || 0;
      const modStr = m >= 0 ? '+' + m : '' + m;
      if (advDis === 'adv') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        const kept = Math.max(r1, r2);
        const total = kept + m;
        logRoll(title + ' (Advantage)', '2d20 [' + r1 + ', ' + r2 + '] (kept ' + kept + ') ' + modStr, total);
      } else if (advDis === 'disadv') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        const kept = Math.min(r1, r2);
        const total = kept + m;
        logRoll(title + ' (Disadvantage)', '2d20 [' + r1 + ', ' + r2 + '] (kept ' + kept + ') ' + modStr, total);
      } else {
        const r = Math.floor(Math.random() * 20) + 1;
        const total = r + m;
        logRoll(title, '1d20 (' + r + ') ' + modStr, total);
      }
    }

    function rollDice(title, count, dice, mod, type) {
      const c = parseInt(count) || 1;
      const d = parseInt(dice) || 6;
      const m = parseInt(mod) || 0;
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < c; i++) {
        const r = Math.floor(Math.random() * d) + 1;
        rolls.push(r);
        sum += r;
      }
      const total = sum + m;
      const modStr = m !== 0 ? (m > 0 ? ' + ' + m : ' - ' + Math.abs(m)) : '';
      const typeStr = type ? ' ' + type : '';
      logRoll(title, c + 'd' + d + ' (' + rolls.join(', ') + ')' + modStr, total + typeStr);
    }

    function rollRecharge(title, minSuccess) {
      const min = parseInt(minSuccess) || 5;
      const r = Math.floor(Math.random() * 6) + 1;
      const success = r >= min;
      logRoll(
        title,
        '1d6 (' + r + ') vs ' + min + '+',
        success ? 'RECHARGED! ⚡' : 'FAILED',
        success ? 'recharged' : 'failed'
      );
    }

    function clearDiceLog() {
      document.getElementById('dice-tray-log').innerHTML = '';
    }

    let isTrayCollapsed = false;
    function toggleDiceTray() {
      const log = document.getElementById('dice-tray-log');
      const btn = document.getElementById('toggle-tray-btn');
      isTrayCollapsed = !isTrayCollapsed;
      log.style.display = isTrayCollapsed ? 'none' : 'flex';
      btn.textContent = isTrayCollapsed ? '▲' : '_';
    }
  </script>
</body>
</html>`
}

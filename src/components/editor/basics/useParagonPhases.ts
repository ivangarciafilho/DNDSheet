import type { useMonsterStore } from 'src/stores/monster-store'
import { computed } from 'vue'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { resolveDynamicNumericSource } from 'src/core/domain/defense-and-traits-utils'
import { ParagonPhaseConfig } from '../../models'

// Paragon phase rows and pool HP for the Basics editor, split from useBasicsContext.
export interface CreateParagonPhasesDeps {
  monster: ReturnType<typeof useMonsterStore>
  numericContext: () => { avgHp: number; proficiency: number; hd: number; hdType: number; stats: Record<string, number> }
}

export function createParagonPhases({ monster, numericContext }: CreateParagonPhasesDeps) {
  const defaultSourcesByIdx = ['half_hp', 'quarter_hp', 'eighth_hp']

  const ensureParagonPhaseConfigs = () => {
    const p = monster.paragonConfig
    if (!p) return []
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) {
      p.enabled = false
      return []
    }
    p.enabled = true
    const pName = p.phaseName?.trim() || 'Phase'
    if (!Array.isArray(p.phaseConfigs)) p.phaseConfigs = []
    while (p.phaseConfigs.length < count) {
      const idx = p.phaseConfigs.length
      p.phaseConfigs.push({
        id: `phase-${idx + 1}`,
        name: idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`,
        source: (defaultSourcesByIdx[idx] || 'flat') as ParagonPhaseConfig['source'],
        hpOverride: p.bloodiedPerPhase?.[idx] ?? null,
        diceFormula: '4d10',
        initiativeBonus: (idx + 1) * 10,
      })
    }
    if (p.phaseConfigs.length > count) {
      const dropped = p.phaseConfigs.splice(count)
      let nextBindings = monster.bindings
      for (const cfg of dropped) {
        if (cfg?.id) {
          nextBindings = withoutEntryBindings(nextBindings, entryBindingPrefix('paragonConfig.phaseConfigs', cfg.id))
        }
      }
      monster.bindings = nextBindings
    }
    p.phaseConfigs.forEach((cfg, idx) => {
      if (!cfg.id) cfg.id = `phase-${idx + 1}`
      const isAuto = !cfg.name || cfg.name === 'Final' || /^(Phase|Stage|Pool) \d+$/i.test(cfg.name)
      if (isAuto) cfg.name = idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`
    })
    return p.phaseConfigs
  }

  const isLastBloodiedPhase = (pIdx: number): boolean => {
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs) || !p.phaseConfigs[pIdx]?.isBloodied) return false
    for (let i = pIdx + 1; i < p.phaseConfigs.length; i++) {
      if (p.phaseConfigs[i]?.isBloodied) return false
    }
    return true
  }

  const paragonPhaseRows = computed<ParagonPhaseConfig[]>(() => {
    const p = monster.paragonConfig
    if (!p) return []
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) return []
    const stored = Array.isArray(p.phaseConfigs) ? p.phaseConfigs : []
    if (stored.length === count) return stored
    const pName = p.phaseName?.trim() || 'Phase'
    const rows = stored.slice(0, count).map((cfg) => ({ ...cfg }))
    while (rows.length < count) {
      const idx = rows.length
      rows.push({
        id: `phase-${idx + 1}`,
        name: '',
        source: (defaultSourcesByIdx[idx] || 'flat') as ParagonPhaseConfig['source'],
        hpOverride: p.bloodiedPerPhase?.[idx] ?? null,
        diceFormula: '4d10',
        initiativeBonus: (idx + 1) * 10,
      })
    }
    rows.forEach((cfg, idx) => {
      if (!cfg.id) cfg.id = `phase-${idx + 1}`
      const isAuto = !cfg.name || cfg.name === 'Final' || /^(Phase|Stage|Pool) \d+$/i.test(cfg.name)
      if (isAuto) cfg.name = idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`
    })
    return rows
  })

  const materializeParagonRows = () => {
    const p = monster.paragonConfig
    if (!p || Math.max(1, p.poolCount || 1) <= 1) return
    if (Array.isArray(p.phaseConfigs) && p.phaseConfigs.length === p.poolCount) return
    ensureParagonPhaseConfigs()
  }

  const resolvePhaseRowPreview = (cfg: ParagonPhaseConfig): string => {
    if (cfg.hpOverride != null && cfg.hpOverride > 0 && cfg.source === 'flat') {
      return `${cfg.hpOverride}`
    }
    return resolveDynamicNumericSource(cfg.source || 'half_hp', cfg.hpOverride ?? 10, cfg.diceFormula, numericContext())
  }

  const syncParagonPhaseRows = () => {
    materializeParagonRows()
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs)) return
    p.bloodiedPerPhase = p.phaseConfigs.map((cfg) => Number(resolvePhaseRowPreview(cfg)) || 10)
  }

  const onTogglePhaseBloodied = (pIdx: number, val: boolean) => {
    materializeParagonRows()
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs)) return
    if (val) {
      for (let i = pIdx; i < p.phaseConfigs.length; i++) p.phaseConfigs[i].isBloodied = true
    } else {
      for (let i = 0; i <= pIdx; i++) {
        if (p.phaseConfigs[i]) p.phaseConfigs[i].isBloodied = false
      }
    }
    syncParagonPhaseRows()
  }

  const updateParagonPoolHp = () => {
    const p = monster.paragonConfig
    if (!p) return
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) {
      p.enabled = false
      p.poolHp = []
      let nextBindings = monster.bindings
      for (const cfg of p.phaseConfigs || []) {
        if (cfg?.id) {
          nextBindings = withoutEntryBindings(nextBindings, entryBindingPrefix('paragonConfig.phaseConfigs', cfg.id))
        }
      }
      monster.bindings = nextBindings
      p.phaseConfigs = []
      p.bloodiedPerPhase = []
      return
    }
    p.enabled = true
    p.poolHp = Array(count).fill(Math.max(1, Math.floor(monster.avgHp / count)))
    ensureParagonPhaseConfigs()
    syncParagonPhaseRows()
  }

  return { defaultSourcesByIdx, ensureParagonPhaseConfigs, isLastBloodiedPhase, paragonPhaseRows, materializeParagonRows, resolvePhaseRowPreview, syncParagonPhaseRows, onTogglePhaseBloodied, updateParagonPoolHp }
}

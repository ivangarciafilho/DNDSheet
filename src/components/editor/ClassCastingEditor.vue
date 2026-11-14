<template>
  <div class="class-casting-editor-panel q-mt-sm">
          <!-- Metamagic Studio Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(236, 72, 153, 0.6);">
              <div class="row items-center justify-between q-mb-xs">
                <q-checkbox
:model-value="metamagicEnabled"
                  v-help="$t('help.casting.metamagicStudio')"
                  data-metamagic-toggle
                  label="Metamagic Studio (Sorcery Points &amp; Enhancements)"
                  dense
                  color="pink-5"
                  class="text-weight-bold text-caption text-pink-3"
                  @update:model-value="toggleMetamagic"
                />
                <span v-if="metamagicEnabled && monster.spellcasting.metamagic" class="text-caption text-pink-3">
                  Sorcery Points: <b>{{ monster.spellcasting.metamagic.sorceryPoints || 0 }}</b>
                </span>
              </div>

              <div v-if="metamagicEnabled && monster.spellcasting.metamagic" class="row q-col-gutter-xs items-center q-mt-xs">
                <div class="col-12 col-sm-3">
                  <formula-field v-help="'Points spent on metamagic and flexible casting.'" path="spellcasting.metamagic.sorceryPoints" label="Sorcery Points" />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    :model-value="cadenceKey(monster.spellcasting.metamagic.refreshRate, 'long_rest')"
                    v-help="'When sorcery points come back.'"
                    :options="cadenceOptions" emit-value map-options label="Points Refresh"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                    @update:model-value="value => monster.spellcasting.metamagic && (monster.spellcasting.metamagic.refreshRate = value)"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="monster.spellcasting.metamagic.options"
                    v-help="'Metamagic options the sorcerer knows; costs follow the selected rules edition.'"
                    :options="metamagicOptionsList"
                    multiple
                    emit-value
                    map-options
                    use-chips label="Active Metamagic Techniques"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
              </div>
            </div>
          </div>



    <div class="row items-center justify-between q-mb-sm">
      <span class="text-caption text-grey-3">{{ sources.length }} spellcasting {{ sources.length === 1 ? 'source' : 'sources' }}</span>
      <q-btn dense outline no-caps icon="add" color="purple-3" label="Add spellcasting source" data-add-casting-source @click="addSource" />
    </div>
    <p v-if="!sources.length" class="text-caption text-grey-4 q-pa-sm" data-casting-empty>No spellcasting sources. Add a class or custom casting system to begin.</p>
    <q-expansion-item v-for="entry in sources" :key="entry.id" :label="sourceTitle(entry)" :caption="sourceCaption(entry)" default-opened dense :data-source-panel="entry.id" :data-casting-source-fold="entry.id" class="q-mb-sm">
      <div class="q-pa-sm bg-grey-10 text-white" :data-casting-source="entry.id">
        <div class="row items-center q-col-gutter-xs q-mb-sm">
          <q-select v-help="'Edition rules governing automatic class and subclass spell grants.'" :model-value="entry.data.rulesEdition || '2014'" :options="['2014','2024']" dense outlined dark data-source-rules label="Subclass grant rules" class="col-5" @update:model-value="value => patch(entry, {rulesEdition:value})" />
          <q-checkbox v-help="'Automatically include subclass and feature-granted spells on the sheet.'" :model-value="entry.data.automaticGrants !== false" dense dark data-source-grants-toggle label="Automatically add granted spells" class="col" @update:model-value="value => patch(entry, {automaticGrants:value})" />
          <q-btn flat dense round icon="delete" color="negative" aria-label="Remove source" :data-remove-casting-source="entry.id" @click="removeSource(entry.id)" />
        </div>
        <casting-feature-grants-editor :model-value="entry.data.spellGrants || []" class="q-mb-sm" @update:model-value="value => patch(entry,{spellGrants:value})" />
        <div class="row items-center q-col-gutter-xs">
          <q-select v-help="'Base class or custom spellcasting tradition for this source.'" :model-value="selection(entry).className" :options="castingClassOptions" use-input new-value-mode="add-unique" emit-value map-options dense outlined dark label="Class" class="col-6" @update:model-value="value => changeClass(entry,value)" />
          <q-select v-help="'Subclass selection used for expanded spell lists and features.'" :model-value="entry.data.subclass" :options="subclasses(entry)" use-input new-value-mode="add-unique" clearable dense outlined dark label="Subclass" class="col-6" @filter="(value, update) => update(() => subclassQueries[entry.id]=value)" @update:model-value="value => updateProgression(entry,{subclass:value || ''})" />
          <formula-field v-help="'Caster level contributed by this spellcasting source.'" :path="prefix(entry)+'.level'" label="Level" class="col-6" @applied="recalculateSlots" />
          <q-select v-help="'Ability score used to calculate spell save DC and spell attack bonus.'" :model-value="entry.data.stat" :options="['INT','WIS','CHA','CON','STR','DEX']" dense outlined dark label="Casting stat" class="col-6" @update:model-value="value => patch(entry,{stat:value})" />
          <div v-for="field in overrides" :key="field.key" class="col-6">
            <formula-field v-if="entry.data[field.key]?.override" v-help="'Manual override formula for this casting statistic.'" :path="prefix(entry)+'.'+field.key+'.overrideValue'" :label="field.label">
              <template #append><q-btn flat dense round icon="lock" :aria-label="'Use automatic '+field.label" @click="toggleOverride(entry,field.key,false)" /></template>
            </formula-field>
            <q-input v-else v-help="'Automatically derived spellcasting statistic from level and ability modifier.'" :model-value="autoValue(entry,field.key)" :label="field.label" readonly dense outlined dark>
              <template #append><q-btn flat dense round icon="lock_open" :aria-label="'Set manual '+field.label" @click="toggleOverride(entry,field.key,true)" /></template>
            </q-input>
          </div>
        </div>
        <div class="q-mt-sm q-pa-xs rounded-borders text-caption" :class="sourceMetrics(entry).status === 'error' ? 'bg-red-10 text-white' : sourceMetrics(entry).status === 'unavailable' ? 'bg-amber-10 text-white' : 'bg-grey-9 text-cyan-2'" data-source-metrics :role="sourceMetrics(entry).status === 'error' ? 'alert' : undefined" :data-source-metrics-error="sourceMetrics(entry).status === 'error' ? '' : undefined" :data-source-metrics-unavailable="sourceMetrics(entry).status === 'unavailable' ? '' : undefined">
          {{ sourceMetricsSummary(entry) }}
        </div>
        <p class="text-caption text-cyan-3 q-my-xs" :data-primary-capacity="entry.primary ? '' : undefined">{{ sourceGuidance(entry) }}</p>
        <div v-if="sourceOverLimit(entry)" class="q-mb-xs q-pa-xs rounded-borders bg-orange-10 text-white text-caption" role="status" data-source-over-limit>
          {{ sourceOverLimit(entry) }}
        </div>
        <div v-if="sourceExpandedPlan(entry).found" class="q-mb-sm q-pa-xs rounded-borders bg-grey-9 text-white text-caption" data-subclass-expanded-plan>
          <div class="row items-center justify-between q-col-gutter-xs">
            <span class="col">
              <b>Subclass Expanded Spells ({{ sourceExpandedPlan(entry).key }}):</b>
              {{ sourceExpandedPlan(entry).alwaysPrepared ? 'Always prepared (excluded from selection budget)' : 'Expanded list' }} —
              {{ sourceExpandedPlan(entry).eligibleSpells.length ? sourceExpandedPlan(entry).eligibleSpells.map(s => s.spell).join(', ') : 'Unlocks at higher class level' }}
              <span v-if="sourceExpandedPlan(entry).missingSpells.length" class="text-amber-3"> ({{ sourceExpandedPlan(entry).missingSpells.length }} missing)</span>
            </span>
            <span class="col-auto row q-gutter-xs">
              <q-btn flat dense no-caps color="cyan-3" label="Apply expanded spells" data-apply-expanded-spells :disable="sourceExpandedPlan(entry).missingSpells.length === 0" @click="applyExpandedSpells(entry)" />
              <q-btn flat dense no-caps color="orange-3" label="Remove expanded spells" data-remove-expanded-spells :disable="!hasRemovableExpandedSpells(entry)" @click="removeExpandedSpells(entry)" />
            </span>
          </div>
        </div>
        <casting-learning-contribution-editor :model-value="entry.data.contribution" :source-count="sources.length" :highest-slot="sourceSpellCeiling(selection(entry),combinedLevel,sources.length)" :grant-level="grantLevel(entry)" @update:model-value="value => updateContribution(entry,value)">
        <div class="row items-center q-col-gutter-xs q-my-sm">
          <q-select v-help="'Resource model used by this casting source (slots, pact, focus, or points).'" :model-value="entry.data.resourceType" :options="resourceTypeOptions" emit-value map-options dense outlined dark label="Source resource" class="col-6" @update:model-value="value => patch(entry,{resourceType:value})" />
          <q-select v-help="'Rest or encounter cadence on which this source recovers expended casting uses.'" :model-value="cadenceKey(entry.data.refreshRate)" :options="cadenceOptions" emit-value map-options dense outlined dark label="Source recovery" class="col-6" @update:model-value="value => patch(entry,{refreshRate:value})" />
          <q-input v-if="['focus','points'].includes(entry.data.resourceType || '')" v-help="'Maximum focus or spell points granted by this custom casting source.'" :model-value="entry.data.resourceValue" type="number" min="0" dense outlined dark label="Authored resource maximum" class="col-12" @update:model-value="value => patch(entry,{resourceValue:Math.max(0,Number(value)||0)})" />
          <formula-field v-help="'Manual prepared spell limit override for this source.'" :path="prefix(entry)+'.preparedCountOverride'" label="Prepared spells count" data-source-prepared-count class="col-6">
            <template #after><q-btn flat dense icon="restart_alt" aria-label="Use automatic prepared spell count" @click="resetPrepared(entry)" /></template>
          </formula-field>
          <q-select v-help="'Cadence on which prepared spells can be swapped for this source.'" :model-value="cadenceKey(entry.data.preparedInterval, 'long_rest')" :options="cadenceOptions" emit-value map-options dense outlined dark label="Prepare spells every" data-source-prepared-cadence class="col-6" @update:model-value="value => patch(entry,{preparedInterval:value})" />
          <q-select v-help="'Override class spell list filtered when preparing spells for this source.'" :model-value="entry.data.preparedSpellList" :options="SrdCastingClassOptions.map(option => option.label)" clearable dense outlined dark label="Preparation spell list" class="col-6" @update:model-value="value => patch(entry,{preparedSpellList:value || undefined})" />
          <q-input v-help="'Sorcery points attributed specifically to this casting source.'" :model-value="entry.data.sorceryPoints ?? ''" type="number" min="0" clearable dense outlined dark label="Source sorcery points" data-source-sorcery-points class="col-6" @update:model-value="value => patch(entry,{sorceryPoints:value === '' || value === null ? undefined : Math.max(0,Number(value)||0)})" />
          <q-checkbox v-help="'Allow assigning spells higher than the current maximum slot ceiling.'" :model-value="selection(entry).bypassSlotFilter" dense dark label="Allow assigning spells above the slot ceiling" class="col-12" @update:model-value="value => patch(entry,{[entry.primary?'bypassSlotLevelFilter':'bypassSlotFilter']:value})" />
        </div>
        </casting-learning-contribution-editor>
        <casting-source-spell-rows :source="entry.data" :primary="entry.primary" :combined-level="combinedLevel" :source-count="sources.length" @patch="value => patch(entry,value)" />
      </div>
    </q-expansion-item>
    <q-expansion-item dense dense-toggle label="Spellcasting presentation">
      <div class="q-pa-sm">
        <mechanic-text-editor v-model="monster.spellcasting.notes" scope="spell" :label="$t('monster.spellcasting.notes')" dense outlined dark />
        <q-checkbox v-help="'Replace the automatic class spellcasting header prose with custom text.'" v-model="monster.spellcasting.useCustomClassPreamble" label="Custom spellcasting introduction" dense />
        <monster-text-editor v-if="monster.spellcasting.useCustomClassPreamble" :field="monster.spellcasting.customClassPreamble" i18n-label-key="editor.spellcasting.slot.preamble" token-category="spell" :show-reset="true" @update:model-value="value => monster.spellcasting.customClassPreamble=value" @reset="monster.spellcasting.customClassPreamble=$t('presets.classSpellcasting')" />
        <div class="row q-col-gutter-xs">
          <q-checkbox v-help="'Enable 2024 Wizard or feature-based cantrip swapping after rests.'" v-model="monster.spellcasting.cantripSwitch" label="Switch cantrips" dense class="col-4" />
          <formula-field v-if="monster.spellcasting.cantripSwitch" v-help="'Number of cantrips that can be swapped.'" path="spellcasting.cantripSwitchCount" label="Count" class="col-4" />
          <q-select v-if="monster.spellcasting.cantripSwitch" v-help="'Cadence at which cantrips may be swapped.'" :model-value="cadenceKey(monster.spellcasting.cantripSwitchInterval, 'short_rest')" :options="cadenceOptions" emit-value map-options label="Per" dense outlined dark class="col-4" @update:model-value="value => (monster.spellcasting.cantripSwitchInterval = value)" />
        </div>
      </div>
    </q-expansion-item>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useClasses } from 'src/data/CLASS'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useSpellsStore } from 'src/stores/spells-store'
import {
  CASTER_PROGRESSIONS,
  aggregateSpellcastingSources,
  computeSpellMetrics,
  getCatalogSubclassesForClass,
  getSpellSlotsForClass,
  inferCasterProgression,
  planSubclassExpandedSpells,
  resolveDefaultStatForClass,
  spellcastingRuleClass,
} from 'src/core/usecases/AutoSyncSpellcasting'
import {
  normalizeCastingSpellGrants,
  sourceSpellCeiling,
  sourceCapacityReference,
  sourceGrantLevel,
  sourceGrantedSpells,
} from 'src/core/domain/casting-source-selection'
import { removeCastingSource } from 'src/core/domain/casting-source-list'
import { CADENCE_OPTIONS, cadenceKey } from 'src/core/domain/catalogs/cadence'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import MonsterTextEditor from './MonsterTextEditor.vue'
import FormulaField from '../kit/FormulaField.vue'
import CastingSourceSpellRows from './CastingSourceSpellRows.vue'
import CastingLearningContributionEditor from './CastingLearningContributionEditor.vue'
import CastingFeatureGrantsEditor from './CastingFeatureGrantsEditor.vue'
import type { CastingContribution, ComputedSpellMetricsResult } from 'src/core/usecases/AutoSyncSpellcasting'

const monster=useMonsterStore(), editor=useEditorStore(), spells=useSpellsStore()
const { SrdCastingClassOptions }=useClasses()
const EXTRA_CASTING_CLASSES = [
  { value: 'Artificer', label: 'Artificer' },
  { value: 'Fighter', label: 'Fighter' },
  { value: 'Rogue', label: 'Rogue' },
]
const castingClassOptions = computed(() => {
  const existing = SrdCastingClassOptions.value.map((o) => ({ label: o.label, value: o.label }))
  const seen = new Set(existing.map((o) => o.label.toLowerCase()))
  return [...existing, ...EXTRA_CASTING_CLASSES.filter((o) => !seen.has(o.label.toLowerCase()))]
})
type Primary=typeof monster.spellcasting
type Extra=NonNullable<Primary['classes']>[number]
type Entry={id:string;primary:true;data:Primary}|{id:string;primary:false;data:Extra}
const sources=computed<Entry[]>(()=>[
 ...(monster.spellcasting.primarySourceEnabled!==false?[{id:'primary',primary:true as const,data:monster.spellcasting}]:[]),
 ...(monster.spellcasting.classes||[]).map(data=>({id:data.id,primary:false as const,data})),
])
const combined=computed(()=>sources.value.length ? aggregateSpellcastingSources(monster.spellcasting,monster.stats,monster.proficiency) : undefined)
const combinedLevel=computed(()=>combined.value?.combinedCasterLevel)
const subclassQueries=reactive<Record<string,string>>({})
const cadenceOptions=CADENCE_OPTIONS
const resourceTypeOptions=[{label:'Focus Points',value:'focus'},{label:'Pact Magic Slots',value:'pact'},{label:'Spell Points',value:'points'},{label:'Spell Slots',value:'slots'}]
const overrides=[{key:'save' as const,label:'Save DC'},{key:'attack' as const,label:'Spell attack'}]
const prefix=(entry:Entry)=>entry.primary?'spellcasting':'spellcasting.classes[id='+encodeURIComponent(entry.id)+']'
function selection(entry:Entry) {return {...entry.data,className:entry.primary?entry.data.class||'':entry.data.className,spells:entry.primary?entry.data.standard:entry.data.spells,bypassSlotFilter:entry.primary?entry.data.bypassSlotLevelFilter:entry.data.bypassSlotFilter}}
function sourceTitle(entry:Entry){const source=selection(entry);return [source.className||'Custom casting source',source.subclass].filter(Boolean).join(' / ')+' - Level '+source.level}
function sourceCaption(entry:Entry){const source=selection(entry);return (source.stat||'INT')+' - '+(source.spells?.length||0)+' assigned spells'}
function subclasses(entry:Entry){
  const query=(subclassQueries[entry.id]||'').toLowerCase()
  return getCatalogSubclassesForClass(selection(entry).className)
    .map((item) => item.subclass)
    .filter(value=>value.toLowerCase().includes(query))
}
function patch(entry:Entry,value:object){Object.assign(entry.data,value)}
function updateProgression(entry:Entry,value:object){patch(entry,value);recalculateSlots()}
function updateContribution(entry: Entry, value: CastingContribution) {
 const resource = (c?: CastingContribution) => c?.mode === 'custom' ? JSON.stringify([c.target, c.multiplier ?? (c.numerator / (c.denominator || 1)), c.focusPerLevel]) : 'rules'
 const changed = resource(entry.data.contribution) !== resource(value)
 patch(entry, {contribution:value})
 if (changed) recalculateSlots()
}
function changeClass(entry:Entry,value:string|undefined){
  const nextStat = resolveDefaultStatForClass(value)
  updateProgression(entry,{
    [entry.primary?'class':'className']:value||'',
    subclass:'',
    ...(nextStat ? {stat:nextStat} : {}),
  })
}
function sourceMetrics(entry:Entry): ComputedSpellMetricsResult {
  const source = selection(entry)
  return computeSpellMetrics({
    ability: source.stat,
    className: source.className,
    subclass: source.subclass,
    stats: monster.stats,
    proficiency: monster.proficiency,
    saveDcOverride: source.save?.override ? source.save.overrideValue : undefined,
    attackBonusOverride: source.attack?.override ? source.attack.overrideValue : undefined,
  })
}
function sourceMetricsSummary(entry: Entry): string {
  const source = selection(entry)
  const progKey = inferCasterProgression(source.className, source.subclass)
  const progLabel = CASTER_PROGRESSIONS[progKey]?.label || 'Custom'
  const metrics = sourceMetrics(entry)
  if (metrics.status === 'error') return `${progLabel} · Metrics error: ${metrics.reason}`
  if (metrics.status === 'unavailable') return `${progLabel} · Metrics unavailable: ${metrics.reason}`
  const sign = metrics.attackBonus >= 0 ? '+' : ''
  return `${progLabel} · DC ${metrics.saveDc} · ${sign}${metrics.attackBonus} Spell Attack · ${metrics.ability}`
}
function autoValue(entry:Entry,key:'save'|'attack'): number | string {
  const source = selection(entry)
  const metrics = computeSpellMetrics({
    ability: source.stat,
    className: source.className,
    subclass: source.subclass,
    stats: monster.stats,
    proficiency: monster.proficiency,
  })
  if (metrics.status !== 'ok') return '—'
  return key==='save' ? metrics.saveDc : metrics.attackBonus
}
function toggleOverride(entry:Entry,key:'save'|'attack',enabled:boolean){
  const auto = autoValue(entry, key)
  const fallback = typeof auto === 'number' ? auto : 10
  patch(entry,{[key]:{override:enabled,overrideValue:entry.data[key]?.overrideValue ?? fallback}})
}
function resetPrepared(entry:Entry){monster.clearBinding(prefix(entry)+'.preparedCountOverride');patch(entry,{preparedCountOverride:null})}
function grantLevel(entry:Entry){return sourceGrantLevel(selection(entry),combinedLevel.value,sources.value.length)}
const monsterSession = useMonsterSessionStore()

function sourceCapacityState(entry: Entry) {
  const source = selection(entry)
  const metrics = sourceMetrics(entry)
  if (metrics.status !== 'ok') return { source, metrics, capacity: undefined }
  const capacity = sourceCapacityReference(
    spells.allSpellOptions,
    source,
    metrics.abilityModifier,
    combinedLevel.value,
    sources.value.length,
    monsterSession.rulesPolicy.activeRuleset,
  )
  const preparedOverride = typeof entry.data.preparedCountOverride === 'number' && Number.isFinite(entry.data.preparedCountOverride)
    ? Math.max(0, Math.trunc(entry.data.preparedCountOverride))
    : undefined
  return {
    source,
    metrics,
    capacity,
    preparedBudget: capacity ? (preparedOverride ?? capacity.preparedSpells) : 0,
  }
}
function sourceGuidance(entry:Entry) {
 const state = sourceCapacityState(entry)
 if (state.metrics.status === 'error') {
   return `Counters suspended (${state.metrics.reason}). Fix casting ability or proficiency before relying on capacity limits.`
 }
 if (state.metrics.status === 'unavailable') {
   return `Counters unavailable (${state.metrics.reason}).`
 }
 const capacity = state.capacity
 if(!capacity) return 'Custom source. Set its resources and spell selections directly.'
 const unknownNote = capacity.unknownAssignments > 0 ? ` ${capacity.unknownAssignments} custom/unknown spells preserved.` : ''
 return `${capacity.capacityLabel}: `+capacity.selectedCantrips+' / '+capacity.cantripsKnown+' cantrips; '+capacity.selectedBudgetSpells+' / '+state.preparedBudget+' '+capacity.selectionModel+' spells. '+(capacity.grantedSpells.length?capacity.grantedSpells.length+' automatic grants. ':'')+'Highest eligible spell: level '+(sourceSpellCeiling(state.source,combinedLevel.value,sources.value.length)??0)+'.'+unknownNote
}
function sourceOverLimit(entry: Entry): string {
  const state = sourceCapacityState(entry)
  if (!state.capacity || state.metrics.status !== 'ok') return ''
  const parts: string[] = []
  if (state.capacity.selectedCantrips > state.capacity.cantripsKnown) {
    parts.push(`${state.capacity.selectedCantrips} / ${state.capacity.cantripsKnown} cantrips (+${state.capacity.selectedCantrips - state.capacity.cantripsKnown} over)`)
  }
  if (state.capacity.selectedBudgetSpells > state.preparedBudget) {
    parts.push(`${state.capacity.selectedBudgetSpells} / ${state.preparedBudget} ${state.capacity.selectionModel} spells (+${state.capacity.selectedBudgetSpells - state.preparedBudget} over)`)
  }
  return parts.length ? `Over limit: ${parts.join('; ')}.` : ''
}
function sourceExpandedPlan(entry: Entry) {
  const source = selection(entry)
  const existing = [...(source.spells || []), ...sourceGrantedSpells(source, combinedLevel.value, sources.value.length)]
  return planSubclassExpandedSpells({
    className: source.className,
    subclass: source.subclass,
    classLevel: Math.max(1, Number(source.level) || 1),
    existingSpellNames: existing,
  })
}
function applyExpandedSpells(entry: Entry) {
  const plan = sourceExpandedPlan(entry)
  if (!plan.found || !plan.missingSpells.length) return
  const nextGrants = normalizeCastingSpellGrants([
    ...(entry.data.spellGrants || []),
    ...plan.missingSpells.map(({ spell, unlockLevel }) => ({
      spell,
      minLevel: unlockLevel,
      origin: 'subclass' as const,
      kind: plan.alwaysPrepared ? ('prepared' as const) : ('known' as const),
    })),
  ])
  patch(entry, {
    spellGrants: nextGrants,
    ...(entry.data.automaticGrants === false ? { automaticGrants: true } : {}),
  })
}
function hasRemovableExpandedSpells(entry: Entry): boolean {
  const plan = sourceExpandedPlan(entry)
  if (!plan.found) return false
  const names = new Set(plan.eligibleSpells.map((s) => s.spell.toLowerCase()))
  return (entry.data.spellGrants || []).some((g) => g.origin === 'subclass' && names.has(g.spell.toLowerCase()))
}
function removeExpandedSpells(entry: Entry) {
  const plan = sourceExpandedPlan(entry)
  if (!plan.found) return
  const names = new Set(plan.eligibleSpells.map((s) => s.spell.toLowerCase()))
  patch(entry, {
    spellGrants: (entry.data.spellGrants || []).filter(
      (g) => !(g.origin === 'subclass' && names.has(g.spell.toLowerCase())),
    ),
  })
}
function recalculateSlots(){
 const sc=monster.spellcasting
 if(sc.primarySourceEnabled===false)return
 if(sources.value.length>1 || sc.contribution?.mode==='custom'){
  if(combined.value){
   const pact = sc.contribution?.mode === 'custom' ? sc.contribution.target === 'pact' : sc.resourceType === 'pact' || spellcastingRuleClass(sc.class || '',sc.subclass) === 'warlock'
   sc.slots = pact ? combined.value.warlockSlots || [] : combined.value.standardSlots
  }
 }else {
  const cls=spellcastingRuleClass(sc.class||'',sc.subclass)
  if(cls)sc.slots=getSpellSlotsForClass(cls,sc.level)
 }
}
function addSource(){
 const sc=monster.spellcasting,rulesEdition=editor.style==='2014'?'2014':'2024'
 if(sc.primarySourceEnabled===false){
  Object.assign(sc,{primarySourceEnabled:true,class:'Wizard',subclass:'',level:1,stat:'INT',rulesEdition,standard:[],slots:getSpellSlotsForClass('Wizard',1)})
 }else{
  sc.classes=[...(sc.classes||[]),{id:uuidv4(),className:'Sorcerer',level:3,stat:'CHA',rulesEdition}]
  recalculateSlots()
 }
}
function removeSource(id:string){
 const result=removeCastingSource(monster.spellcasting,id)
 monster.$patch(state=>{
  const bindings={...state.bindings}
  for(const remap of result.bindingRemaps)for(const [path,binding] of Object.entries(bindings)){
   if(path!==remap.from&&!path.startsWith(remap.from+'.'))continue
   delete bindings[path]
   if(remap.to)bindings[remap.to+path.slice(remap.from.length)]=binding
  }
  state.bindings=bindings
  state.spellcasting=result.source
 })
}
const metamagicEnabled=computed(()=>!!monster.spellcasting.metamagic?.enabled)
function toggleMetamagic(enabled:boolean){
 const previous=monster.spellcasting.metamagic
 monster.spellcasting.metamagic=previous?{...previous,enabled}:{enabled,sorceryPoints:Math.max(2,monster.spellcasting.level||3),refreshRate:'long_rest',options:['Quickened Spell','Subtle Spell']}
}
const metamagicOptionsList=computed(()=>monsterSession.rulesPolicy.metamagicOptions.map(({name,activeCost})=>({label:name+' ('+activeCost+(/^\d+$/.test(activeCost)?' SP':'')+')',value:name})))
</script>

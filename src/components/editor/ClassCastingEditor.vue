<template>
  <div class="class-casting-editor-panel q-mt-sm">
          <!-- Metamagic Studio Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(236, 72, 153, 0.6);">
              <div class="row items-center justify-between q-mb-xs">
                <q-checkbox
:model-value="metamagicEnabled"
                  v-help="'Tick to include metamagic studio (sorcery points &amp; enhancements) for the class casting editor.'"
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
                    v-model="monster.spellcasting.metamagic.refreshRate"
                    v-help="'When sorcery points come back.'"
                    :options="['Long Rest', 'Short Rest', 'Dawn', 'Dusk', 'Midnight']" label="Points Refresh"
                    dense
                    outlined
                    dark
                    hide-bottom-space
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
          <q-select :model-value="entry.data.rulesEdition || '2014'" :options="['2014','2024']" dense outlined dark data-source-rules label="Subclass grant rules" class="col-5" @update:model-value="value => patch(entry, {rulesEdition:value})" />
          <q-checkbox :model-value="entry.data.automaticGrants !== false" dense dark data-source-grants-toggle label="Automatically add granted spells" class="col" @update:model-value="value => patch(entry, {automaticGrants:value})" />
          <q-btn flat dense round icon="delete" color="negative" aria-label="Remove source" :data-remove-casting-source="entry.id" @click="removeSource(entry.id)" />
        </div>
        <casting-feature-grants-editor :model-value="entry.data.spellGrants || []" class="q-mb-sm" @update:model-value="value => patch(entry,{spellGrants:value})" />
        <div class="row items-center q-col-gutter-xs">
          <q-select :model-value="selection(entry).className" :options="SrdCastingClassOptions" use-input new-value-mode="add-unique" emit-value map-options dense outlined dark label="Class" class="col-6" @update:model-value="value => changeClass(entry,value)" />
          <q-select :model-value="entry.data.subclass" :options="subclasses(entry)" use-input new-value-mode="add-unique" clearable dense outlined dark label="Subclass" class="col-6" @filter="(value, update) => update(() => subclassQueries[entry.id]=value)" @update:model-value="value => updateProgression(entry,{subclass:value || ''})" />
          <formula-field :path="prefix(entry)+'.level'" label="Level" class="col-6" @applied="recalculateSlots" />
          <q-select :model-value="entry.data.stat" :options="['INT','WIS','CHA','CON','STR','DEX']" dense outlined dark label="Casting stat" class="col-6" @update:model-value="value => patch(entry,{stat:value})" />
          <div v-for="field in overrides" :key="field.key" class="col-6">
            <formula-field v-if="entry.data[field.key]?.override" :path="prefix(entry)+'.'+field.key+'.overrideValue'" :label="field.label">
              <template #append><q-btn flat dense round icon="lock" :aria-label="'Use automatic '+field.label" @click="toggleOverride(entry,field.key,false)" /></template>
            </formula-field>
            <q-input v-else :model-value="autoValue(entry,field.key)" :label="field.label" readonly dense outlined dark>
              <template #append><q-btn flat dense round icon="lock_open" :aria-label="'Set manual '+field.label" @click="toggleOverride(entry,field.key,true)" /></template>
            </q-input>
          </div>
        </div>
        <p class="text-caption text-cyan-3 q-my-sm" :data-primary-capacity="entry.primary ? '' : undefined">{{ sourceGuidance(entry) }}</p>
        <casting-learning-contribution-editor :model-value="entry.data.contribution" :source-count="sources.length" :highest-slot="sourceSpellCeiling(selection(entry),combinedLevel,sources.length)" :grant-level="grantLevel(entry)" @update:model-value="value => updateContribution(entry,value)">
        <div class="row items-center q-col-gutter-xs q-my-sm">
          <q-select :model-value="entry.data.resourceType" :options="resourceTypeOptions" emit-value map-options dense outlined dark label="Source resource" class="col-6" @update:model-value="value => patch(entry,{resourceType:value})" />
          <q-select :model-value="entry.data.refreshRate" :options="cadenceOptions" emit-value map-options dense outlined dark label="Source recovery" class="col-6" @update:model-value="value => patch(entry,{refreshRate:value})" />
          <q-input v-if="['focus','points'].includes(entry.data.resourceType || '')" :model-value="entry.data.resourceValue" type="number" min="0" dense outlined dark label="Authored resource maximum" class="col-12" @update:model-value="value => patch(entry,{resourceValue:Math.max(0,Number(value)||0)})" />
          <formula-field :path="prefix(entry)+'.preparedCountOverride'" label="Prepared spells count" data-source-prepared-count class="col-6">
            <template #after><q-btn flat dense icon="restart_alt" aria-label="Use automatic prepared spell count" @click="resetPrepared(entry)" /></template>
          </formula-field>
          <q-select :model-value="entry.data.preparedInterval || 'long_rest'" :options="cadenceOptions" emit-value map-options dense outlined dark label="Prepare spells every" data-source-prepared-cadence class="col-6" @update:model-value="value => patch(entry,{preparedInterval:value})" />
          <q-select :model-value="entry.data.preparedSpellList" :options="SrdCastingClassOptions.map(option => option.label)" clearable dense outlined dark label="Preparation spell list" class="col-6" @update:model-value="value => patch(entry,{preparedSpellList:value || undefined})" />
          <q-checkbox :model-value="selection(entry).bypassSlotFilter" dense dark label="Allow assigning spells above the slot ceiling" class="col-12" @update:model-value="value => patch(entry,{[entry.primary?'bypassSlotLevelFilter':'bypassSlotFilter']:value})" />
        </div>
        </casting-learning-contribution-editor>
        <casting-source-spell-rows :source="entry.data" :primary="entry.primary" :combined-level="combinedLevel" :source-count="sources.length" @patch="value => patch(entry,value)" />
      </div>
    </q-expansion-item>
    <q-expansion-item dense dense-toggle label="Spellcasting presentation">
      <div class="q-pa-sm">
        <q-input v-model="monster.spellcasting.notes" :label="$t('monster.spellcasting.notes')" dense outlined dark />
        <q-checkbox v-model="monster.spellcasting.useCustomClassPreamble" label="Custom spellcasting introduction" dense />
        <monster-text-editor v-if="monster.spellcasting.useCustomClassPreamble" :field="monster.spellcasting.customClassPreamble" i18n-label-key="editor.spellcasting.slot.preamble" token-category="spell" :show-reset="true" @update:model-value="value => monster.spellcasting.customClassPreamble=value" @reset="monster.spellcasting.customClassPreamble=$t('presets.classSpellcasting')" />
        <div class="row q-col-gutter-xs">
          <q-checkbox v-model="monster.spellcasting.cantripSwitch" label="Switch cantrips" dense class="col-4" />
          <formula-field v-if="monster.spellcasting.cantripSwitch" path="spellcasting.cantripSwitchCount" label="Count" class="col-4" />
          <q-select v-if="monster.spellcasting.cantripSwitch" v-model="monster.spellcasting.cantripSwitchInterval" :options="['Short Rest','Long Rest','Dawn','Dusk']" label="Per" dense outlined dark class="col-4" />
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
import { aggregateSpellcastingSources,getDefaultStatForClass,getSpellSlotsForClass,getSubclassesForClass,spellcastingRuleClass } from 'src/core/usecases/AutoSyncSpellcasting'
import { sourceSpellCeiling,sourceCapacityReference,sourceGrantLevel } from 'src/core/domain/casting-source-selection'
import { removeCastingSource } from 'src/core/domain/casting-source-list'
import { CADENCE_OPTIONS } from 'src/core/domain/catalogs/cadence'
import { METAMAGIC_OPTIONS,metamagicCost } from 'src/core/domain/catalogs/metamagic'
import { statModifier } from 'src/core/domain/math-utils'
import MonsterTextEditor from './MonsterTextEditor.vue'
import FormulaField from '../kit/FormulaField.vue'
import CastingSourceSpellRows from './CastingSourceSpellRows.vue'
import CastingLearningContributionEditor from './CastingLearningContributionEditor.vue'
import CastingFeatureGrantsEditor from './CastingFeatureGrantsEditor.vue'
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'

const monster=useMonsterStore(), editor=useEditorStore(), spells=useSpellsStore()
const { SrdCastingClassOptions }=useClasses()
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
function subclasses(entry:Entry){const query=(subclassQueries[entry.id]||'').toLowerCase();return getSubclassesForClass(selection(entry).className).filter(value=>value.toLowerCase().includes(query))}
function patch(entry:Entry,value:object){Object.assign(entry.data,value)}
function updateProgression(entry:Entry,value:object){patch(entry,value);recalculateSlots()}
function updateContribution(entry: Entry, value: CastingContribution) {
 const resource = (c?: CastingContribution) => c?.mode === 'custom' ? JSON.stringify([c.target, c.multiplier ?? (c.numerator / (c.denominator || 1)), c.focusPerLevel]) : 'rules'
 const changed = resource(entry.data.contribution) !== resource(value)
 patch(entry, {contribution:value})
 if (changed) recalculateSlots()
}
function changeClass(entry:Entry,value:string|undefined){updateProgression(entry,{[entry.primary?'class':'className']:value||'',subclass:'',stat:getDefaultStatForClass(value||'Wizard')})}
function autoValue(entry:Entry,key:'save'|'attack'){return key==='save'?monster.defaultSpellSave(entry.data.stat||'INT'):monster.defaultSpellAttackModifier(entry.data.stat||'INT')}
function toggleOverride(entry:Entry,key:'save'|'attack',enabled:boolean){patch(entry,{[key]:{override:enabled,overrideValue:entry.data[key]?.overrideValue??autoValue(entry,key)}})}
function resetPrepared(entry:Entry){monster.clearBinding(prefix(entry)+'.preparedCountOverride');patch(entry,{preparedCountOverride:null})}
function grantLevel(entry:Entry){return sourceGrantLevel(selection(entry),combinedLevel.value,sources.value.length)}
function sourceGuidance(entry:Entry) {
 const source=selection(entry)
 const capacity=sourceCapacityReference(spells.allSpellOptions,source,statModifier(monster.stats?.[source.stat||'INT']??10),combinedLevel.value,sources.value.length)
 if(!capacity)return 'Custom source. Set its resources and spell selections directly.'
 return 'Legacy base-class capacity: '+capacity.selectedCantrips+' / '+capacity.cantripsKnown+' cantrips; '+capacity.selectedBudgetSpells+' / '+capacity.preparedSpells+' '+capacity.selectionModel+' spells. '+(capacity.grantedSpells.length?capacity.grantedSpells.length+' automatic grants. ':'')+'Highest eligible spell: level '+(sourceSpellCeiling(source,combinedLevel.value,sources.value.length)??0)+'.'
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
 monster.spellcasting.metamagic=previous?{...previous,enabled}:{enabled,sorceryPoints:Math.max(2,monster.spellcasting.level||3),refreshRate:'Long Rest',options:['Quickened Spell','Subtle Spell']}
}
const metamagicOptionsList=computed(()=>METAMAGIC_OPTIONS.map(({name})=>{const cost=metamagicCost(name,editor.style==='2014'?'2014':'2024');return {label:name+' ('+cost+(/^\d+$/.test(cost)?' SP':'')+')',value:name}}))
</script>

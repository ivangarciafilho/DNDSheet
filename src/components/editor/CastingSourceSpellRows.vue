<template>
  <div class="casting-source-spells">
    <div class="text-caption text-grey-3 q-mb-sm">Choose spells from this sourceâ€™s class and subclass. Assigned spells remain visible if its level changes. A per-spell amount creates separate limited uses; leave it blank when the spell uses only its row's shared resource.</div>
    <q-expansion-item v-for="level in levels" :key="level" dense dense-toggle :disable="unavailable(level)" :data-source-level="level" :data-primary-level="primary ? level : undefined" class="bg-grey-9 q-mb-xs">
      <template #header>
        <div class="row items-center q-col-gutter-xs full-width">
          <q-input :model-value="amount(level)" type="number" min="0" dense outlined dark clearable :data-level-amount="level" label="Amount" :placeholder="map(levelMap)[level] === null ? 'Hidden' : 'Automatic'" class="col-3" @click.stop @update:model-value="value => setMap(levelMap, level, numberOrUndefined(value))"><template #append><q-btn flat dense size="xs" :icon="map(levelMap)[level] === null ? 'visibility_off' : 'visibility'" :aria-label="map(levelMap)[level] === null ? 'Use automatic amount' : 'Hide amount'" @click.stop="setMap(levelMap, level, map(levelMap)[level] === null ? undefined : null)" /></template></q-input>
          <q-select :model-value="recovery(level)" :options="cadenceOptions" emit-value map-options dense outlined dark :data-level-cadence="level" label="Cadence" class="col-4" @click.stop @update:model-value="value => setMap(cadenceMap, level, value)" />
          <span class="col text-subtitle2 text-amber-3">{{ level === 0 ? 'Cantrips' : 'Level ' + level }} <small class="text-grey-4">{{ assigned(level).length }} assigned{{ granted(level).length ? ' · ' + granted(level).length + ' granted' : '' }}</small></span>
          <q-checkbox :model-value="!!map(bonusMap)[level]" :data-level-bonus="level" dense dark label="Bonus Action" class="col-auto" @click.stop @update:model-value="value => setMap(bonusMap, level, value)" />
        </div>
      </template>
      <div class="q-pa-sm">
        <div v-if="granted(level).length" class="q-mb-sm text-caption text-cyan-3" :data-source-grants="level"><b>Always prepared or known:</b> <i>{{ granted(level).join(', ') }}</i><q-tooltip>Granted by a class, subclass or species feature. These spells do not use your selection budget and remain available without manual assignment.</q-tooltip></div>
        <q-select :model-value="assigned(level)" :options="options(level)" multiple emit-value map-options use-chips use-input input-debounce="0" dense outlined dark label="Assign spells" @filter="(value, update) => update(() => queries[level] = value.toLowerCase().trim())" @update:model-value="value => setSpells(level, value)">
          <template #option="scope"><casting-spell-option :option="scope.opt" :item-props="scope.itemProps" /></template>
        </q-select>
        <div v-for="spellId in assigned(level)" :key="spellId" class="row q-col-gutter-xs items-center q-mt-xs" :data-source-spell="spellId">
          <q-input :model-value="map(spellAmountMap)[spellId]" type="number" min="0" dense outlined dark clearable :data-spell-amount="spellId" label="Amount" :placeholder="map(spellAmountMap)[spellId] === null ? 'Hidden' : 'No own uses'" class="col-2" @click.stop @update:model-value="value => setMap(spellAmountMap, spellId, numberOrUndefined(value))"><template #append><q-btn flat dense size="xs" :icon="map(spellAmountMap)[spellId] === null ? 'visibility_off' : 'visibility'" :aria-label="map(spellAmountMap)[spellId] === null ? 'Clear spell amount' : 'Hide amount'" @click.stop="setMap(spellAmountMap, spellId, map(spellAmountMap)[spellId] === null ? undefined : null)" /></template></q-input>
          <q-select :model-value="map(spellCadenceMap)[spellId] || recovery(level)" :options="cadenceOptions" emit-value map-options dense outlined dark :data-spell-cadence="spellId" label="Spell recovery" class="col-3" @update:model-value="value => setMap(spellCadenceMap, spellId, value)" />
          <div class="col"><i>{{ spellId }}</i><div class="text-caption text-purple-3">{{ getSpellTagString(spellId) }}</div></div>
          <q-select :model-value="map(spellBonusMap)[spellId] ?? 'inherit'" :options="actionOptions" emit-value map-options dense outlined dark :data-spell-bonus="spellId" label="Bonus Action" class="col-3" @update:model-value="value => setMap(spellBonusMap, spellId, value === 'inherit' ? undefined : value)" />
          <q-input :model-value="map('spellCastingTimeMap')[spellId]" dense outlined dark clearable label="Extended casting time" :placeholder="getSpellMetadata(spellId).extendedCastingTime || 'e.g. 1 minute'" class="col-12" @update:model-value="value => setMap('spellCastingTimeMap', spellId, String(value ?? '').trim() || undefined)" />
          <q-btn flat round dense icon="close" color="negative" :aria-label="'Remove ' + spellId" @click="setSpells(level, assigned(level).filter(id => id !== spellId))" />
        </div>
        <p v-if="unavailable(level)" class="text-caption">Above this sourceâ€™s spell-learning level.</p>
      </div>
    </q-expansion-item>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useSpellsStore } from 'src/stores/spells-store'
import { sourceSpellOptions, sourceSpellCeiling, sourceAssignedAtLevel, replaceSourceLevelSpells, sourceGrantedSpells } from 'src/core/domain/casting-source-selection'
import { spellRowRecovery } from 'src/core/domain/spell-plate'
import { CADENCE_OPTIONS } from 'src/core/domain/catalogs/cadence'
import type { CastingContribution } from 'src/core/usecases/AutoSyncSpellcasting'
import { getSpellMetadata, getSpellTagString } from 'src/core/domain/spell-metadata'
import CastingSpellOption from './CastingSpellOption.vue'
interface RowSource {
 rulesEdition?:'2014'|'2024'; class?: string; className?: string; subclass?: string; level: number; resourceType?: string; refreshRate?: string; customRefreshRate?: string
 standard?: string[]; spells?: string[]; bypassSlotLevelFilter?: boolean; bypassSlotFilter?: boolean
 contribution?: CastingContribution
 automaticGrants?:boolean
 spellGrants?:{spell:string;minLevel:number;origin:'class'|'subclass'|'species'}[]
 levelAmountMap?: Record<string,number|null>; levelAmounts?:Record<string,number|null>; levelCadenceMap?:Record<string,string>; levelCadences?:Record<string,string>
 bonusActionLevelMap?:Record<string,boolean>;levelBonusAction?:Record<string,boolean>;spellAmountMap?:Record<string,number|null>;spellAmounts?:Record<string,number|null>
 spellCastingTimeMap?: Record<string,string>; spellCadenceMap?:Record<string,string>;spellBonusActionMap?:Record<string,boolean>;spellBonusAction?:Record<string,boolean>
}
const props=defineProps<{source:RowSource;primary?:boolean;combinedLevel?:number;sourceCount?:number}>()
const emit=defineEmits<{patch:[value:Partial<RowSource>]}>()
const store=useSpellsStore(),levels=Array.from({length:10},(_,i)=>i),cadenceOptions=CADENCE_OPTIONS,queries=reactive<Record<number,string>>({})
const actionOptions=[{label:'Inherit row',value:'inherit'},{label:'Action',value:false},{label:'Bonus Action',value:true}]
const selection=computed(()=>({className:props.source.className||props.source.class||'',subclass:props.source.subclass,level:props.source.level,rulesEdition:props.source.rulesEdition,contribution:props.source.contribution,automaticGrants:props.source.automaticGrants,spellGrants:props.source.spellGrants,bypassSlotFilter:props.source.bypassSlotFilter||props.source.bypassSlotLevelFilter}))
const levelMap=computed(()=>props.primary?'levelAmountMap':'levelAmounts'),cadenceMap=computed(()=>props.primary?'levelCadenceMap':'levelCadences'),bonusMap=computed(()=>props.primary?'bonusActionLevelMap':'levelBonusAction'),spellAmountMap=computed(()=>props.primary?'spellAmountMap':'spellAmounts'),spellBonusMap=computed(()=>props.primary?'spellBonusActionMap':'spellBonusAction'),spellCadenceMap='spellCadenceMap'
function map(name:string):Record<string,any> { return (props.source as unknown as Record<string,any>)[name] || {} }
function setMap(name:string,key:string|number,value:unknown) { const next={...map(name)};if(value===undefined||value==='')delete next[key];else next[key]=value;emit('patch',{[name]:next}) }
function numberOrUndefined(value:unknown) { return value===null||value===''||value===undefined?undefined:Math.max(0,Math.trunc(Number(value)||0)) }
function granted(level:number) {return sourceAssignedAtLevel(store.allSpellOptions,sourceGrantedSpells(selection.value,props.combinedLevel,props.sourceCount),level)}
function assigned(level:number) {return sourceAssignedAtLevel(store.allSpellOptions,props.primary?props.source.standard||[]:props.source.spells||[],level)}
function setSpells(level:number,values:string[]) {const field=props.primary?'standard':'spells';emit('patch',{[field]:replaceSourceLevelSpells(store.allSpellOptions,props.source[field]||[],level,values)})}
function amount(level:number) {return map(levelMap.value)[level]}
function recovery(level:number) {return spellRowRecovery(level,map(cadenceMap.value)[level],{...props.source,className:selection.value.className})}
function unavailable(level:number) {return !selection.value.bypassSlotFilter && level>(sourceSpellCeiling(selection.value,props.combinedLevel,props.sourceCount)??9) && assigned(level).length===0}
function options(level:number) {return sourceSpellOptions(store.allSpellOptions,selection.value,level,props.combinedLevel,props.sourceCount).filter(option=>!queries[level]||option.label.toLowerCase().includes(queries[level]))}
</script>

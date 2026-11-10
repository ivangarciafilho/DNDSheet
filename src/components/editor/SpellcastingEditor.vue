<template>
  <q-expansion-item expand-separator icon="auto_fix_high" :label="$t('editor.spellcasting.label')" :caption="sourceCaption">
    <div class="q-mx-sm q-my-xs">
      <class-casting-editor />
      <div class="row items-center justify-between q-mt-sm">
        <q-btn flat dense no-caps icon="filter_list" label="Spell availability filters" @click="showFilterPanel = !showFilterPanel" />
        <q-btn flat dense no-caps icon="library_add" :label="$t('editor.spellcasting.custom.create')" @click="addSpell" />
      </div>
      <div v-if="showFilterPanel || monster.spellcasting.splitHighCadence" class="q-pa-sm bg-grey-9 text-white">
        <q-toggle v-model="monster.spellcasting.splitHighCadence" dense label="Place restricted-cadence spells in a separate row" />
        <div class="row q-gutter-xs q-mt-xs"><q-checkbox v-for="cadence in restrictedCadences" :key="cadence" :model-value="isActive(cadence)" :label="cadence" dense @update:model-value="() => toggleCadence(cadence)" /></div>
      </div>
      <at-will-casting-editor />
    </div>
  </q-expansion-item>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useMonsterStore } from 'src/stores/monster-store'
import { allCastingSourceEntries } from 'src/core/usecases/AutoSyncSpellcasting'
import ClassCastingEditor from './ClassCastingEditor.vue'
import AtWillCastingEditor from './AtWillCastingEditor.vue'
import NewSpellDialog from '../spell/NewSpellDialog.vue'
const monster=useMonsterStore(),quasar=useQuasar(),showFilterPanel=ref(false)
const sourceCaption=computed(()=>{const sources=allCastingSourceEntries(monster.spellcasting);return sources.length ? (sources.length>1 ? 'Multiclass · ' : '')+sources.length+' spellcasting '+(sources.length===1?'source':'sources') : 'No class spellcasting sources'})
const restrictedCadences=['Dawn','Downtime','Dusk','Long Rest','Midday','Midnight','Monthly','Ritual','Short Rest','Weekly','Yearly']
function isActive(cadence:string) {return (monster.spellcasting.restrictedCadences || []).some(value=>value.toLowerCase()===cadence.toLowerCase())}
function toggleCadence(cadence:string) {const current=monster.spellcasting.restrictedCadences || [];monster.spellcasting.restrictedCadences=isActive(cadence)?current.filter(value=>value.toLowerCase()!==cadence.toLowerCase()):[...current,cadence.toLowerCase()]}
function addSpell() {quasar.dialog({component:NewSpellDialog})}
</script>

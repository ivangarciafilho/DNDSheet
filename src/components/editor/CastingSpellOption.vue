<template>
  <q-item v-bind="itemProps" dense>
    <q-item-section>
      <q-item-label><i>{{ option.label }}</i></q-item-label>
      <q-item-label caption class="text-grey-4">{{ option.classDisplay || option.class?.join(', ') || 'Custom source' }}</q-item-label>
      <q-item-label caption class="text-cyan-3">{{ metadata?.school || 'School not catalogued' }} <span class="text-purple-3">{{ metadata ? getSpellTagString(option.value) : 'Components not catalogued' }}</span></q-item-label>
      <q-tooltip class="dnd-tip" max-width="360px"><b>{{ option.label }}</b><br>{{ option.classDisplay || option.class?.join(', ') }}<br>{{ metadata?.school || 'School not catalogued' }} · Components: {{ metadata ? getSpellTagString(option.value) : 'Not catalogued' }}<br>Duration and casting time are not supplied by this catalogue. Check the spell reference before use.</q-tooltip>
    </q-item-section>
    <q-item-section side top><span class="text-caption text-purple-3">{{ option.level === 0 ? 'Cantrip' : 'Level ' + option.level }}</span></q-item-section>
  </q-item>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { SRD_SPELL_METADATA, getSpellTagString } from 'src/core/domain/spell-metadata'
import type { SpellOption } from 'src/stores/spells-store'
const props=defineProps<{option:SpellOption; itemProps: Record<string, unknown>}>()
const metadata=computed(()=>Object.entries(SRD_SPELL_METADATA).find(([name])=>name.toLowerCase()===props.option.value.toLowerCase())?.[1])
</script>

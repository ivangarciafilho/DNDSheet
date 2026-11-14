<template>
  <q-expansion-item dense icon="link" :label="`${title} memberships`" :data-associations="role" class="q-mb-sm">
    <div class="q-pa-sm">
      <p class="text-caption">Link an existing attack or action. Removing a membership keeps its source and other references. Adding the first legendary membership enables the default pool of 3 when the pool is zero.</p>
      <q-select :model-value="null" :options="options" option-value="id" option-label="label" emit-value dense outlined dark :label="`Add existing attack or action to ${role}`" :disable="choices.length === 0" @update:model-value="add">
        <template #option="scope">
          <q-item-label v-if="scope.opt.header" header class="text-grey-5">{{ scope.opt.label }}</q-item-label>
          <q-item v-else v-bind="scope.itemProps"><q-item-section><q-item-label>{{ scope.opt.label }}</q-item-label><q-item-label caption>{{ scope.opt.id }}</q-item-label></q-item-section></q-item>
        </template>
      </q-select>
      <p v-if="choices.length === 0" class="text-caption">No unlinked sources available. Create an attack or action first, or remove an existing membership.</p>
      <div v-for="(member, index) in members" :key="`${member.actionId}:${index}`" class="q-mt-sm q-pa-sm rounded-borders bg-grey-9" :data-association-id="member.actionId">
        <div class="row items-center q-gutter-sm">
          <div class="col"><div>{{ sourceName(member.actionId) }}</div><div class="text-caption text-grey-5">{{ member.actionId }} · Cost {{ member.cost }}</div></div>
          <q-input :model-value="member.cost" type="number" min="1" dense outlined dark label="Cost" class="col-12 col-sm-2" data-membership-cost @update:model-value="value => updateCost(index, member.actionId, value)" />
          <q-btn flat dense no-caps icon="link_off" label="Remove membership" :aria-label="`Remove ${title} membership for ${sourceName(member.actionId)}`" @click="remove(index, member.actionId)" />
        </div>
        <template v-if="missing(member.actionId)">
          <div class="text-warning text-caption" role="alert">Source is missing. Link an existing source to repair this membership and keep its cost, or remove the membership.</div>
          <q-select :model-value="null" :options="options" option-value="id" option-label="label" emit-value dense outlined dark label="Repair missing source" :disable="choices.length === 0" @update:model-value="(id: string | null) => repair(index, member.actionId, id)">
            <template #option="scope">
              <q-item-label v-if="scope.opt.header" header class="text-grey-5">{{ scope.opt.label }}</q-item-label>
              <q-item v-else v-bind="scope.itemProps"><q-item-section><q-item-label>{{ scope.opt.label }}</q-item-label><q-item-label caption>{{ scope.opt.id }}</q-item-label></q-item-section></q-item>
            </template>
          </q-select>
        </template>
      </div>
      <p v-if="members.length === 0" class="text-caption">No {{ role }} memberships.</p>
      <span role="status" class="text-caption">{{ status }}</span>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { associationChoices, associationPatch } from 'src/core/domain/action-associations'
import type { AssociationChange, AssociationRole } from 'src/core/domain/action-associations'

const props = defineProps<{ role: AssociationRole }>()
const emit = defineEmits<{ (event: 'changed', role: AssociationRole): void }>()
const monster = useMonsterStore()
const status = ref('')
const title = computed(() => props.role === 'legendary' ? 'Legendary' : 'Mythic')
const members = computed(() => props.role === 'legendary' ? monster.legendaryActions.actions : monster.mythicActions.actions)
const choices = computed(() => associationChoices(monster, props.role))
const options = computed(() => ['Actions', 'Attacks'].flatMap(group => {
  const entries = choices.value.filter(choice => choice.group === group).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id))
  return entries.length ? [{ id: `group-${group}`, label: group, header: true, disable: true }, ...entries] : []
}))
const missing = (id: string) => ![...monster.attacks, ...monster.actions].some(source => source.id === id)
const sourceName = (id: string) => monster.attacks.find(source => source.id === id)?.name || monster.actions.find(source => source.id === id)?.name || (missing(id) ? 'Missing source' : 'Unnamed source')
const apply = (change: AssociationChange, message: string) => {
  const patch = associationPatch(monster, props.role, change)
  if (!Object.keys(patch).length) { status.value = 'Membership changed. Review the current sources and try again.'; return }
  monster.$patch((state) => { Object.assign(state, patch) })
  status.value = message
  emit('changed', props.role)
}
const add = (id: string | null) => { if (id) apply({ kind: 'add', actionId: id }, 'Membership added. Source kept.') }
const remove = (index: number, actionId: string) => apply({ kind: 'remove', index, actionId }, 'Membership removed. Source kept.')
const updateCost = (index: number, actionId: string, value: string | number | null) => {
  const cost = value == null || String(value).trim() === '' ? NaN : Number(value)
  if (!Number.isSafeInteger(cost) || cost < 1) { status.value = 'Use a whole cost of at least 1. The saved cost is unchanged.'; return }
  apply({ kind: 'cost', index, actionId, cost }, 'Cost updated. Source kept.')
}
const repair = (index: number, actionId: string, id: string | null) => { if (id) apply({ kind: 'repair', index, actionId, replacementId: id }, 'Missing source repaired. Cost kept.') }
</script>

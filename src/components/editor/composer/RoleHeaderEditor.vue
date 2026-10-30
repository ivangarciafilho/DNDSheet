<template>
  <q-expansion-item v-model="open" dense icon="tune" :label="`${title} section settings`" :data-role-header="role" class="q-mb-sm" @before-show="resetDraft">
    <form class="q-pa-sm" @submit.prevent="apply">
      <p class="text-caption">These settings apply to the whole {{ role }} section. Entry membership and content are kept.</p>
      <div v-for="field in fields" :key="field.id" :data-header-field="field.id" class="q-mb-sm">
        <q-input v-if="field.kind === 'number'" v-model="draft[field.id]" type="number" min="0" :max="role === 'lair' ? 40 : 99" dense outlined dark :label="field.label" />
        <q-checkbox v-else-if="field.kind === 'toggle'" v-model="draft.custom" dark dense :label="field.label" />
        <q-input v-else-if="field.kind === 'text'" v-model="draft[field.id]" dense outlined dark :label="field.label" />
        <template v-else-if="field.kind === 'prose' && (role === 'mythic' || draft.custom)">
          <div class="text-caption q-mb-xs">{{ field.label }}</div>
          <monster-text-editor :field="draft[field.id]" :token-category="role === 'mythic' ? 'mythic' : role === 'legendary' ? 'legendary' : 'none'" @update:model-value="(value: string) => draft[field.id] = value" />
        </template>
      </div>
      <p v-if="role === 'lair'" class="text-caption">The default preamble follows the initiative count. Custom preamble text is kept exactly as authored.</p>
      <div v-if="error" role="alert" class="text-red-3 q-mb-sm">{{ error }}</div>
      <div class="row justify-end q-gutter-xs">
        <q-btn flat dense no-caps label="Cancel" @click="open = false" />
        <q-btn type="submit" dense no-caps color="amber-9" label="Apply section settings" :disable="!!error" />
      </div>
    </form>
    <span role="status" class="q-px-sm text-caption">{{ status }}</span>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { ROLE_HEADERS, roleHeaderDraft, roleHeaderPatch, validateRoleHeader } from 'src/core/domain/role-headers'
import type { HeaderRole } from 'src/core/domain/role-headers'
import MonsterTextEditor from '../MonsterTextEditor.vue'

const props = defineProps<{ role: HeaderRole }>()
const monster = useMonsterStore()
const open = ref(false)
const status = ref('')
const draft = ref(roleHeaderDraft(monster, props.role))
const title = computed(() => ({ legendary: 'Legendary', mythic: 'Mythic', lair: 'Lair' }[props.role]))
const fields = computed(() => ROLE_HEADERS[props.role])
const error = computed(() => validateRoleHeader(props.role, draft.value))
const resetDraft = () => { draft.value = roleHeaderDraft(monster, props.role); status.value = '' }
const apply = () => {
  if (error.value) return
  Object.assign(monster, roleHeaderPatch(monster, props.role, draft.value))
  status.value = 'Section settings applied'
  open.value = false
}
</script>

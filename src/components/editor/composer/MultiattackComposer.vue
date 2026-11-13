<template>
  <section ref="root" class="composer-chain" data-multiattack-composer aria-label="Multiattack composer">
    <h3 class="text-subtitle1 q-my-xs">Multiattack</h3>
    <p class="text-caption text-grey-4 q-mb-sm">Each option is an alternative. Add an entry more than once for repeated uses. Actions print before attacks; repeated entries are totaled by their first appearance.</p>
    <div v-if="monster.multiattacks.length === 0" class="q-pa-sm text-grey-4">No multiattack options yet. Add an option, then choose existing attacks or actions.</div>
    <section v-for="(group, index) in monster.multiattacks" :key="group.id" :data-multiattack-option="group.id" :aria-label="`Multiattack option ${index + 1}`" class="multiattack-option q-mb-sm q-pa-sm rounded-borders">
      <div class="row items-center justify-between q-gutter-xs">
        <div><strong>Option {{ index + 1 }}</strong><span class="text-caption q-ml-sm">Estimated damage: {{ monster.expectedMultiattackDamage(group.id) }}</span></div>
        <q-btn flat dense no-caps color="red-3" label="Delete option" :aria-label="`Delete multiattack option ${index + 1}`" @click="monster.deleteMultiattack(group.id)" />
      </div>
      <div v-for="kind in kinds" :key="kind" class="composer-chain__row">
        <span class="composer-chain__label">{{ kind === 'actions' ? 'Actions' : 'Attacks' }}</span>
        <div class="composer-chain__cells">
          <div v-for="reference in references(group, kind)" :key="`${reference.index}:${reference.id}`" class="multiattack-reference" :data-reference-kind="kind" :data-reference-index="reference.index" :data-reference-id="reference.id">
            <span :class="reference.missing ? 'text-amber-3' : 'text-white'" class="reference-name">
              <q-icon v-if="reference.missing" name="warning" aria-hidden="true" />{{ reference.name }}
            </span>
            <multiattack-reference-picker :label="`Replace ${kind === 'attacks' ? 'attack' : 'action'} reference ${reference.index + 1}`" :targets="library(kind)" @choose="(targetId: string) => edit(group.id, { kind, operation: 'replace', index: reference.index, expectedId: reference.id, targetId })" />
            <q-btn flat dense icon="arrow_back" :disable="reference.index === 0" :aria-label="`Move ${kind} reference ${reference.index + 1} earlier`" @click="edit(group.id, { kind, operation: 'up', index: reference.index, expectedId: reference.id })" />
            <q-btn flat dense icon="arrow_forward" :disable="reference.index === group[kind].length - 1" :aria-label="`Move ${kind} reference ${reference.index + 1} later`" @click="edit(group.id, { kind, operation: 'down', index: reference.index, expectedId: reference.id })" />
            <q-btn flat dense icon="close" :aria-label="`Remove ${kind} reference ${reference.index + 1}`" @click="remove(group.id, kind, reference.index, reference.id)" />
          </div>
          <multiattack-reference-picker :label="kind === 'attacks' ? 'Add attack reference' : 'Add action reference'" :targets="library(kind)" @choose="(targetId: string) => edit(group.id, { kind, operation: 'add', targetId })" />
          <span v-if="library(kind).length === 0" class="text-caption text-grey-4">Create an {{ kind === 'attacks' ? 'attack' : 'action' }} with Add Entry first.</span>
        </div>
      </div>
    </section>
    <q-btn flat dense no-caps icon="add" label="Add multiattack option" data-multiattack-add @click="monster.addMultiattack()" />
    <mechanic-text-editor scope="action" v-model="monster.multiattackOptions.postscript" dark outlined dense class="q-my-sm" label="Multiattack postscript" hint="Printed after the options. Shared by every option." data-multiattack-postscript />
    <q-toggle :model-value="monster.multiattackOptions.useCustomRenderer" dark label="Use custom multiattack text" @update:model-value="toggleCustom" />
    <div v-if="monster.multiattackOptions.useCustomRenderer" class="text-caption text-amber-3">Custom text controls the stat block. Your option references remain saved.</div>
    <monster-text-editor v-if="monster.multiattackOptions.useCustomRenderer" :field="monster.multiattackOptions.customMultiattackRenderer" i18n-label-key="editor.multiattack.label" :show-reset="true" @update:model-value="(value: string) => monster.multiattackOptions.customMultiattackRenderer = value" @reset="monster.multiattackOptions.customMultiattackRenderer = defaultCustomText" />

  </section>
</template>
<script lang="ts">
import { computed, defineComponent, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMonsterStore } from 'src/stores/monster-store'
import { multiattackReferences, multiattackReferencePatch } from 'src/core/domain/multiattack-composer'
import type { ReferenceEdit, ReferenceKind } from 'src/core/domain/multiattack-composer'
import type { Multiattack } from 'src/core/domain/types'
import MultiattackReferencePicker from './MultiattackReferencePicker.vue'
import MonsterTextEditor from '../MonsterTextEditor.vue'
export default defineComponent({
  name: 'MultiattackComposer', components: { MultiattackReferencePicker, MonsterTextEditor },
  setup() {
    const monster = useMonsterStore(), root = ref<HTMLElement>()
    const { t } = useI18n()
    const kinds: ReferenceKind[] = ['actions', 'attacks']
    const library = (kind: ReferenceKind) => kind === 'attacks' ? monster.attacks : monster.actions
    const references = (group: Multiattack, kind: ReferenceKind) => multiattackReferences(group, kind, library(kind))
    const edit = (id: string, change: ReferenceEdit) => {
      const current = monster.multiattacks.find(group => group.id === id)
      if (current) Object.assign(current, multiattackReferencePatch(current, change, library(change.kind)))
    }
    const remove = async (id: string, kind: ReferenceKind, index: number, expectedId: string) => {
      edit(id, { kind, operation: 'remove', index, expectedId })
      await nextTick()
      // Return keyboard focus to the surviving option instead of the removed button.
      const option = [...(root.value?.querySelectorAll<HTMLElement>('[data-multiattack-option]') ?? [])].find(el => el.dataset.multiattackOption === id)
      const label = kind === 'attacks' ? 'Add attack reference' : 'Add action reference'
      const add = option?.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]:not([disabled])`)
      ;(add ?? root.value?.querySelector<HTMLButtonElement>('[data-multiattack-add]'))?.focus()
    }
    const defaultCustomText = computed(() => `<b><i>${t('editor.multiattack.label')}.</i></b> {multiattack.all}. {multiattack.postscript}`)
    const toggleCustom = (value: boolean) => {
      monster.multiattackOptions.useCustomRenderer = value
      if (value && !monster.multiattackOptions.customMultiattackRenderer) monster.multiattackOptions.customMultiattackRenderer = defaultCustomText.value
    }
    return { monster, root, kinds, library, references, edit, remove, defaultCustomText, toggleCustom }
  },
})
</script>
<style scoped src="./composer-chain.css"></style>
<style scoped>
.multiattack-option { border: 1px solid rgba(255,255,255,.16); }
.multiattack-reference { display: flex; align-items: center; flex-wrap: wrap; max-width: 100%; border: 1px solid rgba(255,255,255,.18); border-radius: 4px; padding: 2px 4px; }
.reference-name { padding: 4px; overflow-wrap: anywhere; }
</style>

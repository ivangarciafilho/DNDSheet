<template>
  <q-page class="row items-start">
    <!-- Character Mode -->
    <q-splitter
      v-if="editorStore.activeMode === 'character'"
      id="char-splitter"
      v-model="splitterModel"
      reverse
      unit="px"
      style="height: calc(100vh - 177px); width: 100%"
    >
      <template #before>
        <div id="char-editor" class="q-pa-md" style="width: 100%">
          <character-editor />
        </div>
      </template>

      <template #after>
        <div class="q-pa-md">
          <character-sheet />
        </div>
      </template>
    </q-splitter>

    <!-- Monster Mode -->
    <q-splitter
      v-else
      id="splitter"
      v-model="splitterModel"
      reverse
      unit="px"
      style="height: calc(100vh - 177px); width: 100%"
    >
      <template #before>
        <div id="editor" class="q-pa-md" style="width: 100%">
          <database-studio class="q-mb-sm" />
          <q-list bordered separator class="rounded-borders">
            <a4-layer-studio />
            <basics-editor />
            <inventory-editor />
            <saves-editor />
            <speeds-editor />
            <skills-editor />
            <senses-editor />
            <resistances-editor />
            <spellcasting-editor />
            <actions-editor />
            <villain-actions-editor />
            <regional-effects-editor />
            <random-tables-editor />
            <anatomy-editor />
            <encounter-dynamics-editor />
          </q-list>
        </div>
      </template>

      <template #after>
        <div class="q-pa-md">
          <web-renderer id="renderer" />
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, ref, watch } from 'vue'
import BasicsEditor from 'src/components/editor/BasicsEditor.vue'
import A4LayerStudio from 'src/components/editor/A4LayerStudio.vue'
import WebRenderer from 'src/components/rendering/WebRenderer.vue'
import SavesEditor from 'src/components/editor/SavesEditor.vue'
import SpeedsEditor from 'src/components/editor/SpeedsEditor.vue'
import SkillsEditor from 'src/components/editor/SkillsEditor.vue'
import SensesEditor from 'src/components/editor/SensesEditor.vue'
import ResistancesEditor from 'src/components/editor/ResistancesEditor.vue'
import SpellcastingEditor from 'src/components/editor/SpellcastingEditor.vue'
import ActionsEditor from '../components/editor/ActionsEditor.vue'
import VillainActionsEditor from 'src/components/editor/VillainActionsEditor.vue'
import AnatomyEditor from 'src/components/editor/AnatomyEditor.vue'
import EncounterDynamicsEditor from 'src/components/editor/EncounterDynamicsEditor.vue'
import RegionalEffectsEditor from 'src/components/editor/RegionalEffectsEditor.vue'
import RandomTablesEditor from 'src/components/editor/RandomTablesEditor.vue'
import InventoryEditor from 'src/components/editor/InventoryEditor.vue'
import DatabaseStudio from 'src/components/editor/DatabaseStudio.vue'
import CharacterEditor from 'src/components/character/CharacterEditor.vue'
import CharacterSheet from 'src/components/character/CharacterSheet.vue'
import { useEditorStore } from 'src/stores/editor-store'

export default defineComponent({
  name: 'MonsterBuilder',
  components: {
    BasicsEditor,
    DatabaseStudio,
    A4LayerStudio,
    WebRenderer,
    SavesEditor,
    SpeedsEditor,
    SkillsEditor,
    SensesEditor,
    ResistancesEditor,
    SpellcastingEditor,
    ActionsEditor,
    VillainActionsEditor,
    AnatomyEditor,
    EncounterDynamicsEditor,
        RegionalEffectsEditor,
    InventoryEditor,
    RandomTablesEditor,
    CharacterEditor,
    CharacterSheet,
  },
  setup() {
    const monster = useMonsterStore()
    const editorStore = useEditorStore()
    const splitterModel = ref(editorStore.statBlockColumns === 1 ? 500 : 800)

    // automatically resize on column change
    watch(
      () => editorStore.statBlockColumns,
      (newCols, oldCols) => {
        if (newCols !== oldCols) {
          if (newCols === 1) {
            splitterModel.value = 500
          } else {
            splitterModel.value = 800
          }
        }
      }
    )

    return {
      splitterModel,
      monster,
      editorStore,
    }
  },
})
</script>

<style scoped>
/* A fixed pixel preview must not consume the editor's entire narrow viewport. */
@media screen and (max-width: 599px) {
  #splitter, #char-splitter {
    display: block;
    overflow: auto;
  }
  #splitter :deep(> .q-splitter__panel),
  #char-splitter :deep(> .q-splitter__panel) {
    width: 100% !important;
    height: auto;
    overflow: visible;
  }
  #splitter :deep(> .q-splitter__separator),
  #char-splitter :deep(> .q-splitter__separator) {
    display: none;
  }
}
</style>

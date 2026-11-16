<template>
  <div>
    <!-- 10. Languages Smart List -->
    <q-expansion-item
      v-help="'Configure spoken and understood languages, telepathy, and special communication rules.'"
      dense
      dense-toggle
      expand-separator
      default-opened
      class="q-mt-sm rounded-borders"
      style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      icon="translate"
      label="Languages"
      caption="Select official D&D languages, configure telepathy and understand-only options"
    >
      <div class="q-pa-sm">
        <!-- Racial / Class Communication Archetypes (Mutually Exclusive) -->
        <div
          class="q-pa-xs rounded-borders q-mb-sm"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07);"
        >
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-caption text-weight-bold text-grey-3">Universal / Archetype Communication:</span>
            <span class="text-caption text-grey-5">(Mutually Exclusive)</span>
          </div>
          <div class="editor-fit-wrap">
            <q-btn-toggle
              v-model="monster.specialCommunicationArchetype"
              v-help="'Apply an innate universal speech trait such as Firbolg Speech of Beast and Leaf or Monk Tongue of Sun and Moon.'"
              dense
              toggle-color="primary"
              color="dark"
              text-color="grey-4"
              size="sm"
              no-caps
              :options="[
                { label: 'Standard (None)', value: 'none' },
                { label: 'Firbolg: Beast & Leaf', value: 'firbolg' },
                { label: 'Monk: Sun & Moon', value: 'monk' },
              ]"
              @update:model-value="syncLanguagesToString"
            />
          </div>
        </div>

        <!-- Add Language via Dropdown (no add button) -->
        <div class="row q-col-gutter-xs items-center q-mb-sm">
          <catalog-select
            v-help="'Choose an official D&D language or type a custom language and press Enter to add it.'"
            :model-value="null"
            :entries="availableLanguageEntries"
            allow-custom
            label="Select or Type Language to Add"
            class="col-12"
            @update:model-value="onLanguageSelected"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </catalog-select>
        </div>

        <!-- Active Languages List -->
        <div v-if="monster.languagesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No languages configured. Select a language above or type custom.
        </div>

        <language-entry-list />

        <!-- Formatted String & Raw Override Option -->
        <div class="row items-center justify-between q-mt-xs">
          <div class="text-caption text-grey-5">
            Live Preview: <em>{{ monster.languages || '&mdash;' }}</em>
          </div>
          <q-btn
            v-help="$t('help.languages.plainFallback')"
            flat
            dense
            size="xs"
            color="grey-5"
            :label="showManualLangEdit ? 'Hide Manual Input' : 'Edit Raw Text'"
            @click="showManualLangEdit = !showManualLangEdit"
          />
        </div>

        <div v-if="showManualLangEdit" class="q-mt-xs">
          <q-input
            v-model="monster.languages"
            v-help="$t('help.languages.plainFallback')"
            label="Raw Languages String"
            outlined
            dense
          />
        </div>
      </div>
      <basic-riders-editor scope="languages" label="Language riders" />
    </q-expansion-item>
    <database-studio class="q-mt-sm" />
  </div>
</template>

<script setup lang="ts">
import LanguageEntryList from './lore/LanguageEntryList.vue'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import BasicRidersEditor from '../BasicRidersEditor.vue'
import DatabaseStudio from '../DatabaseStudio.vue'
import { useBasicsContext } from './useBasicsContext'

const {
  monster,
  availableLanguageEntries,
  showManualLangEdit,
  syncLanguagesToString,
  onLanguageSelected,
} = useBasicsContext()
</script>

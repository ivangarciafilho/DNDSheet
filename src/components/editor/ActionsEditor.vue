<template>
  <q-expansion-item
    expand-separator
    data-editor-section="actions"
    icon="mdi-movie-open"
    label="Actions &amp; Traits Studio"
    caption="Unified studio for attacks, multiattack, traits, actions, bonus actions, reactions, legendary, mythic &amp; lair actions"
    header-class="bg-brown-8 text-white text-weight-bold"
  >
    <q-card class="bg-grey-10 text-white q-pa-sm">
      <!-- Category Filter Bar & Quick Add Header -->
      <div class="row items-center justify-between q-mb-sm q-col-gutter-xs">
        <div class="col-12 col-md-9 row items-center q-gutter-xs flex-wrap">
          <q-btn
            v-for="cat in categoryTabs"
            :key="cat.value"
            dense
            size="sm"
            :color="selectedCategory === cat.value ? cat.activeColor : 'grey-9'"
            :text-color="selectedCategory === cat.value ? (cat.activeTextColor ?? 'white') : 'grey-4'"
            no-caps
            class="text-weight-bold"
            @click="selectedCategory = cat.value"
          >
            <span>{{ cat.label }}</span>
            <span
              class="q-ml-xs text-weight-bolder"
              :class="selectedCategory === cat.value ? (cat.activeTextColor ? 'text-grey-10' : 'text-grey-2') : 'text-grey-4'"
            >
              ({{ cat.count }})
            </span>
          </q-btn>
        </div>

        <div class="col-12 col-md-3 row justify-end">
          <q-btn-dropdown
            color="green-9"
            dense
            no-caps
            icon="add"
            label="Add Entry"
            class="full-width text-weight-bold"
          >
            <q-list class="bg-grey-9 text-white">
              <q-item v-close-popup clickable @click="addNewEntry('multiattack')"><q-item-section>Add Multiattack Option</q-item-section></q-item>
              <q-item v-close-popup clickable @click="addNewEntry('attack')"><q-item-section>Add Attack</q-item-section></q-item>
              <q-item v-close-popup clickable @click="addNewEntry('action')">
                <q-item-section avatar><q-icon name="mdi-sword" color="amber-5" /></q-item-section>
                <q-item-section>Add Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('bonus_action')">
                <q-item-section avatar><q-icon name="mdi-flash" color="orange-5" /></q-item-section>
                <q-item-section>Add Bonus Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('trait')">
                <q-item-section avatar><q-icon name="auto_awesome" color="cyan-4" /></q-item-section>
                <q-item-section>Add Trait</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('reaction')">
                <q-item-section avatar><q-icon name="mdi-account-reactivate" color="blue-4" /></q-item-section>
                <q-item-section>Add Reaction</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('legendary')">
                <q-item-section avatar><q-icon name="fa-solid fa-dragon" color="purple-4" /></q-item-section>
                <q-item-section>Add Legendary Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('mythic')">
                <q-item-section avatar><q-icon name="mdi-crown" color="deep-purple-3" /></q-item-section>
                <q-item-section>Add Mythic Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('lair')">
                <q-item-section avatar><q-icon name="home" color="teal-4" /></q-item-section>
                <q-item-section>Add Lair Action</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <q-checkbox v-if="selectedCategory === 'trait' || selectedCategory === 'all'" v-model="monster.alphaTraits" v-help="$t('help.actions.sortTraitsAlpha')" dark dense label="Sort traits alphabetically on the sheet" data-studio-trait-sort class="q-mb-sm" />

      <action-associations v-for="role in visibleAssociationRoles" :key="role" :role="role" />

      <role-header-editor v-for="role in visibleHeaderRoles" :key="role" :role="role" />

      <multiattack-composer v-if="selectedCategory === 'multiattack' || (selectedCategory === 'all' && monster.multiattacks.length > 0)" />

      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0 && selectedCategory !== 'multiattack' && (selectedCategory !== 'all' || monster.multiattacks.length === 0)" class="q-pa-md text-center text-grey-5">
        <q-icon name="info" size="32px" class="q-mb-xs" />
        <div>No entries in category: <b>{{ selectedCategory }}</b></div>
        <div class="text-caption">Click "+ Add Entry" above to create one.</div>
      </div>

      <!-- Bulk Fold / Expand Controls -->
      <div v-if="filteredEntries.length > 0" class="row items-center justify-between q-py-xs q-px-sm bg-grey-9 rounded-borders q-mb-xs">
        <div class="text-caption text-grey-4">
          <span>Showing <b>{{ filteredEntries.length }}</b> entries</span>
        </div>
        <div class="row items-center q-gutter-x-xs">
          <q-btn
v-help="$t('help.actions.collapseAll')"
            dense
            flat
            size="xs"
            icon="unfold_less"
            label="Collapse All"
            color="amber-4"
            no-caps
            @click="collapseAllEntries"
          />
          <q-btn
v-help="$t('help.actions.expandAll')"
            dense
            flat
            size="xs"
            icon="unfold_more"
            label="Expand All"
            color="amber-4"
            no-caps
            @click="expandAllEntries"
          />
        </div>
      </div>

      <!-- Grouped List of Actions & Traits by Category with Per-Category Fold / Unfold -->
      <action-entry-groups />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ActionEntryGroups from './actions/ActionEntryGroups.vue'
import MultiattackComposer from './composer/MultiattackComposer.vue'
import RoleHeaderEditor from './composer/RoleHeaderEditor.vue'
import ActionAssociations from './composer/ActionAssociations.vue'
import { useActionsEditorState, provideActionsEditorState } from './actions/useActionsEditorState'

export default defineComponent({
  name: 'ActionsEditor',
  components: { ActionEntryGroups, MultiattackComposer, RoleHeaderEditor, ActionAssociations },
  setup() {
    // The parent template still binds its own toolbar to the shared state.
    return provideActionsEditorState(useActionsEditorState())
  },
})
</script>

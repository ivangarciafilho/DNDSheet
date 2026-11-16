<template>
  <div v-if="groupedEntriesByCategory.length > 0" class="column q-gutter-y-sm">
    <div
      v-for="catGroup in groupedEntriesByCategory"
      :key="catGroup.role"
      class="category-fold-group rounded-borders overflow-hidden"
      style="border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(15, 23, 42, 0.45);"
    >
      <!-- Category Fold / Unfold Header Bar -->
      <div
        class="row items-center justify-between q-px-sm q-py-xs cursor-pointer bg-grey-9 text-white"
        style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);"
        @click="toggleCategoryCollapse(catGroup.role)"
      >
        <div class="row items-center q-gutter-x-xs">
          <q-btn
            flat
            round
            dense
            size="xs"
            :icon="isCategoryCollapsed(catGroup.role) ? 'chevron_right' : 'expand_more'"
            color="amber-4"
            @click.stop="toggleCategoryCollapse(catGroup.role)"
          >
            <q-tooltip>{{ isCategoryCollapsed(catGroup.role) ? 'Unfold Category Section' : 'Fold Category Section' }}</q-tooltip>
          </q-btn>
          <q-badge :color="getRoleBadgeColor(catGroup.role)" :text-color="getRoleBadgeTextColor(catGroup.role)" class="text-weight-bold text-caption">
            {{ catGroup.label }} ({{ catGroup.items.length }})
          </q-badge>
          <span v-if="isCategoryCollapsed(catGroup.role)" class="text-caption text-grey-5 q-ml-xs">
            — {{ catGroup.items.map((i) => i.name).join(', ') }}
          </span>
        </div>

        <div class="row items-center q-gutter-x-xs" @click.stop>
          <q-btn
v-help="$t('help.actions.foldCards')"
            dense
            flat
            size="xs"
            icon="unfold_less"
            label="Fold Cards"
            color="grey-4"
            no-caps
            @click="collapseCategoryItems(catGroup.role)"
          >
            <q-tooltip>Collapse all individual entry cards inside {{ catGroup.label }}</q-tooltip>
          </q-btn>
          <q-btn
v-help="$t('help.actions.unfoldCards')"
            dense
            flat
            size="xs"
            icon="unfold_more"
            label="Unfold Cards"
            color="grey-4"
            no-caps
            @click="expandCategoryItems(catGroup.role)"
          >
            <q-tooltip>Expand all individual entry cards inside {{ catGroup.label }}</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            size="xs"
            :icon="isCategoryCollapsed(catGroup.role) ? 'visibility' : 'visibility_off'"
            :label="isCategoryCollapsed(catGroup.role) ? 'Unfold Category' : 'Fold Category'"
            color="amber-3"
            no-caps
            @click="toggleCategoryCollapse(catGroup.role)"
          />
        </div>
      </div>

      <!-- Entries Inside Category (v-show keeps ComposerChain mounted in DOM) -->
      <div v-show="!isCategoryCollapsed(catGroup.role)" class="column q-gutter-y-xs q-pa-xs">
    <div
      v-for="item in catGroup.items"
      :key="item.id"
      class="rounded-borders bg-grey-9 text-white q-pa-xs shadow-1"
      style="border: 1px solid rgba(255, 255, 255, 0.12);"
    >
      <!-- Card identity and commands; composable role lives in the head row below. -->
      <div class="row q-col-gutter-xs items-center">
        <div class="col-auto">
          <q-btn
            flat
            round
            dense
            size="sm"
            :icon="isItemCollapsed(item.id) ? 'chevron_right' : 'expand_more'"
            :color="isItemCollapsed(item.id) ? 'grey-5' : 'amber-4'"
            @click.stop="toggleItemCollapse(item.id)"
          >
            <q-tooltip>{{ isItemCollapsed(item.id) ? 'Expand card' : 'Collapse card' }}</q-tooltip>
          </q-btn>
        </div>
        <div class="col text-weight-bold ellipsis cursor-pointer" :title="item.name" @click="toggleItemCollapse(item.id)">{{ item.name }}</div>

        <!-- Swap and Delete Actions -->
        <div class="col-12 col-md-auto row items-center justify-end q-gutter-x-xs">
          <!-- Reusable templates use the same structured fields read by the A6 renderer. -->
          <div v-if="item.rawAction" class="row items-center">
            <q-btn-dropdown
              :data-action-editor-id="item.id"
              dense
              flat
              size="sm"
              color="teal-3"
              icon="auto_fix_normal"
              label="Apply template"
              no-caps
            >
              <q-list dense class="bg-grey-9 text-white" style="min-width: 280px; max-width: min(92vw, 420px);">
                <template v-for="group in actionTemplateGroups" :key="group.name">
                  <q-item-label header class="text-amber-3">{{ group.name }}</q-item-label>
                  <q-item
                    v-for="template in group.templates"
                    :key="template.id"
                    v-close-popup
                    :data-action-template="template.id"
                    clickable
                    @click="confirmApplyActionTemplate(item, template)"
                  >
                    <q-item-section>
                      <q-item-label>{{ template.name }}</q-item-label>
                      <q-item-label caption>{{ template.summary }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-btn-dropdown>
            <q-tooltip>Apply a reusable structured action. Existing action content is shown for confirmation before replacement.</q-tooltip>
          </div>
          <q-btn v-if="item.rawAction" round flat dense icon="save" color="cyan-3" size="sm" @click="addTemplate(item.rawAction)">
            <q-tooltip>Save as Template</q-tooltip>
          </q-btn>
          <q-btn v-if="item.rawTrait" round flat dense icon="save" color="cyan-3" size="sm" @click="addTemplate(item.rawTrait, 'trait')">
            <q-tooltip>Save as Trait Template</q-tooltip>
          </q-btn>
          <q-btn v-if="item.rawReaction" round flat dense icon="save" color="cyan-3" size="sm" :data-save-reaction-template="item.id" @click="addTemplate(item.rawReaction, 'reaction')">
            <q-tooltip>Save as Reaction Template</q-tooltip>
          </q-btn>
          <swap-buttons :field="getStoreCollectionField(item.role)" :idx="getItemStoreIndex(item)" />
          <q-btn
            round
            flat
            dense
            icon="delete"
            color="negative"
            size="sm"
            @click="deleteUnifiedItem(item)"
          >
            <q-tooltip>Delete Entry</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Typed role adapters preserve each collection while using the same cell editor and renderer. -->
      <composer-chain
        v-show="!isItemCollapsed(item.id)"
        v-if="item.rawAction || item.rawReaction || item.rawTrait || item.role === 'lair'"
        :action-id="item.id"
        :role="chainRole(item)"
        :cost="item.cost || 1"
        @update:cost="(cost: number) => updateItemCost(item, cost)"
      >
        <template #head-prefix>
          <catalog-select
v-help="$t('help.actions.role')"
            data-composer-role
            :model-value="item.role"
            :entries="roleOptions"
            preserve-order
            :searchable="false"
            dark
            label="Role"
            style="min-width: 130px; max-width: 180px;"
            @update:model-value="(newRole: unknown) => changeItemRole(item, String(newRole || item.role))"
          />
        </template>
      </composer-chain>

      <attack-composer v-show="!isItemCollapsed(item.id)" v-if="item.rawAttack" :attack-id="item.id" />

      <entry-display-settings v-show="!isItemCollapsed(item.id)" v-if="item.rawAction || item.rawReaction || item.role === 'lair'" :entry-id="item.id" :field="item.role === 'lair' ? 'lairActions' : item.rawReaction ? 'reactions' : 'actions'" />

      <trait-display-settings v-show="!isItemCollapsed(item.id)" v-if="item.rawTrait" :trait-id="item.id" />

      <!-- Description Text Editor with Integrated Intellisense & Dropdowns -->
      <monster-text-editor
        v-show="!isItemCollapsed(item.id)"
        v-if="!item.rawAttack"
        :field="item.description"
        i18n-label-key="monster.trait.description"
        :token-category="item.role === 'trait' ? 'trait' : item.role === 'lair' ? 'none' : 'action'"
        @update:model-value="(val: string) => updateItemDescription(item, val)"
      />

      <!-- Description Containers (Multi-Description Blocks & Outcome Tables) -->
      <div v-show="!isItemCollapsed(item.id)" v-if="!item.rawAttack" data-description-containers class="q-mt-sm q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(255, 255, 255, 0.2);">
        <div class="row items-center justify-between q-px-xs q-py-xs flex-wrap q-gutter-xs">
          <span class="text-caption text-amber-3 text-weight-bold">
            Additional Description Containers &amp; Tables ({{ (item.descriptionContainers || []).length }})
          </span>
          <div class="row items-center q-gutter-x-xs">
            <q-btn
v-help="$t('help.actions.addTextBlock')"
              flat
              dense
              no-caps
              size="xs"
              color="cyan-3"
              icon="notes"
              type="button"
              data-add-description="text"
              label="+ Text Block"
              @click="addTextContainer(item)"
            />
            <q-btn
v-help="$t('help.actions.addDiceTable')"
              flat
              dense
              no-caps
              size="xs"
              color="amber-4"
              icon="casino"
              type="button"
              data-add-description="table"
              label="+ Dice Table"
              @click="addTableContainer(item)"
            />
          </div>
        </div>

        <div v-for="(container, cIdx) in (item.descriptionContainers || [])" :key="container.id || cIdx" class="q-pa-xs q-my-xs rounded-borders bg-grey-9">
          <div class="row q-col-gutter-xs items-center q-mb-xs">
            <div class="col-12 col-sm-4">
              <mechanic-text-editor
v-model="container.outcomeTarget"
                v-help="$t('help.actions.outcomeClause')"
                dense
                outlined
                dark
                label="Outcome Target / Clause"
                placeholder="e.g. On Hit, On Failure, or leave blank"
                @update:model-value="syncContainers(item)"
              />
            </div>
            <div class="col-auto">
              <q-btn-toggle
                v-help="'Switch this extra block between plain prose text and a rollable dice table.'"
                :model-value="container.kind"
                :options="[{ label: 'Text', value: 'text' }, { label: 'Table', value: 'table' }]"
                dense
                no-caps
                unelevated
                size="xs"
                toggle-color="amber-4"
                toggle-text-color="grey-10"
                color="grey-8"
                @update:model-value="(val: 'text' | 'table') => setContainerKind(item, cIdx, val)"
              />
            </div>
            <q-space />
            <div class="col-auto">
              <q-btn flat round dense size="xs" color="red-4" icon="close" @click="removeContainer(item, cIdx)" />
            </div>
          </div>

          <!-- Text block container -->
          <div v-if="container.kind === 'text'">
            <mechanic-text-editor
v-model="container.text"
              v-help="$t('help.actions.containerText')"
              type="textarea"
              rows="2"
              dense
              outlined
              dark
              label="Container Text / Rider"
              placeholder="Additional rules clause or rider..."
              @update:model-value="syncContainers(item)"
            />
          </div>

          <!-- Table container -->
          <div v-else-if="container.kind === 'table' && container.table" class="column q-gutter-y-xs q-pa-xs">
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <q-input
v-help="$t('help.actions.tableHeaders')"
                  :model-value="container.table.headers.join(', ')"
                  dense
                  outlined
                  dark
                  label="Headers (comma separated)"
                  @update:model-value="(val) => {
                    if (!container.table) return
                    container.table.headers = String(val ?? '').split(',').map((s) => s.trim())
                    syncContainers(item)
                  }"
                />
              </div>
              <div class="col-auto">
                <q-btn v-help="$t('help.actions.addRow')" flat dense no-caps size="xs" icon="add" type="button" data-add-description-row label="Add Row" @click="addTableRow(container, item)" />
              </div>
            </div>
            <div v-for="(row, rIdx) in container.table.rows" :key="rIdx" class="row q-col-gutter-xs items-center q-my-xs">
              <div v-for="(cell, cellIdx) in row" :key="cellIdx" class="col">
                <mechanic-text-editor
                  v-model="row[cellIdx]"
                  dense
                  outlined
                  dark
                  :label="container.table?.headers[cellIdx] || ('Col ' + (cellIdx + 1))"
                  @update:model-value="syncContainers(item)"
                />
              </div>
              <div class="col-auto">
                <q-btn flat round dense size="xs" color="red-4" icon="close" @click="removeTableRow(container, rIdx, item)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import MonsterTextEditor from '../MonsterTextEditor.vue'
import SwapButtons from '../widgets/SwapButtons.vue'
import AttackComposer from '../composer/AttackComposer.vue'
import ComposerChain from '../composer/ComposerChain.vue'
import TraitDisplaySettings from '../composer/TraitDisplaySettings.vue'
import EntryDisplaySettings from '../composer/EntryDisplaySettings.vue'
import CatalogSelect from '../../kit/CatalogSelect.vue'
import { injectActionsEditorState } from './useActionsEditorState'

export default defineComponent({
  name: 'ActionEntryGroups',
  components: { MechanicTextEditor, MonsterTextEditor, SwapButtons, AttackComposer, ComposerChain, TraitDisplaySettings, EntryDisplaySettings, CatalogSelect },
  setup() {
    return injectActionsEditorState()
  },
})
</script>

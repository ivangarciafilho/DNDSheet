<template>
  <q-expansion-item
    expand-separator
    icon="fa-solid fa-dragon"
    :label="$t('editor.legendary.label')"
    :caption="$t('editor.legendary.caption')"
  >
    <q-card>
      <q-card-section class="row">
        <q-input
          :model-value="monster.legendaryActions.count"
          type="number"
          min="0"
          :label="$t('editor.legendary.count')"
          class="col-3 q-pa-sm"
          @update:model-value="
            (value: string | number | null) =>
              (monster.legendaryActions.count = validateNumber(value, 0))
          "
        >
          <template #after>
            <q-btn
              push
              :icon="
                monster.legendaryActions.useCustomPreamble ? 'edit' : 'edit_off'
              "
              :color="
                monster.legendaryActions.useCustomPreamble ? 'warning' : 'dark'
              "
              size="md"
              @click="
                monster.legendaryActions.useCustomPreamble =
                  !monster.legendaryActions.useCustomPreamble
              "
            >
              <q-tooltip class="text-body2">{{
                monster.legendaryActions.useCustomPreamble
                  ? $t('editor.legendary.useCustomPreamble')
                  : $t('editor.legendary.useDefaultPreamble')
              }}</q-tooltip></q-btn
            >
          </template>
        </q-input>
        <div class="col-5 q-pa-sm flex items-center">
          <q-btn-dropdown
            :color="filteredActions.length === 0 ? 'dark' : 'positive'"
            :label="
              filteredActions.length === 0
                ? $t('editor.legendary.none')
                : $t('editor.legendary.add')
            "
            :disable="filteredActions.length === 0"
            class="full-width"
          >
            <q-list>
              <q-item
                v-for="a in filteredActions"
                :key="a.id"
                v-close-popup
                clickable
                @click="addLegendary(a.id)"
              >
                <q-item-section
                  ><q-item-label>{{ a.name }}</q-item-label></q-item-section
                >
                <q-item-section side top>
                  <q-badge
                    :color="a.typeInternal === 'attack' ? 'red-10' : 'amber-10'"
                    :label="a.type"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div class="col-4 q-pa-sm flex items-center">
          <q-btn
            push
            color="primary"
            icon="add"
            label="Create New Legendary Action"
            class="full-width"
            @click="createStandalone"
          />
        </div>
        <q-slide-transition>
          <div
            v-show="monster.legendaryActions.useCustomPreamble"
            class="col-12 q-mt-md"
          >
            <monster-text-editor
              :field="monster.legendaryActions.customPreamble"
              i18n-label-key="editor.legendary.preamble"
              :show-reset="true"
              token-category="legendary"
              @update:model-value="
                          (value: string) =>
                            (monster.legendaryActions.customPreamble =
                              value)
                        "
              @reset="
                monster.legendaryActions.customPreamble = $t(
                  'presets.legendaryActions'
                )
              "
            />
          </div>
        </q-slide-transition>
      </q-card-section>
      <q-card-section class="q-gutter-y-sm">
        <div
          v-for="la in monster.legendaryActions.actions"
          :key="la.actionId"
          class="q-pa-sm rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
        >
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-8">
              <q-input
                v-if="findActionObj(la.actionId)"
                :model-value="findActionObj(la.actionId)?.name ?? ''"
                dense
                outlined
                label="Legendary Action Name"
                @update:model-value="(val: string | number | null) => { const act = findActionObj(la.actionId); if (act) act.name = `${val ?? ''}`; }"
              />
              <q-input
                v-else-if="findAttackObj(la.actionId)"
                :model-value="findAttackObj(la.actionId)?.name ?? ''"
                dense
                outlined
                label="Linked Attack Name"
                @update:model-value="(val: string | number | null) => { const atk = findAttackObj(la.actionId); if (atk) atk.name = `${val ?? ''}`; }"
              >
                <template #append>
                  <q-badge color="red-10" label="Attack" />
                </template>
              </q-input>
              <div v-else class="text-subtitle1 text-weight-bold">
                {{ monster.legendaryActionName(la.actionId) }}
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                :model-value="la.cost"
                type="number"
                min="1"
                dense
                outlined
                :label="$t('editor.legendary.cost')"
                @update:model-value="
                  (value: string | number | null) => (la.cost = validateNumber(value, 1))
                "
              >
                <template #after>
                  <q-btn
                    push
                    dense
                    color="negative"
                    icon="delete"
                    @click="() => monster.deleteLegendaryAction(la.actionId)"
                  >
                    <q-tooltip class="text-body2">{{
                      $t('editor.delete')
                    }}</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
            </div>
            <div v-if="findActionObj(la.actionId)" class="col-12">
              <monster-text-editor
                :field="findActionObj(la.actionId)?.description ?? ''"
                i18n-label-key="monster.trait.description"
                token-category="action"
                @update:model-value="
                  (val: string) => {
                    const act = findActionObj(la.actionId)
                    if (act) act.description = val
                  }
                "
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, computed } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import { validateNumber } from './numberInput'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'LegendaryActionsEditor',
  components: { MonsterTextEditor },
  setup() {
    const monster = useMonsterStore()
    const { t } = useI18n()

    const addLegendary = (id: string) => {
      monster.addLegendaryAction(id)
    }

    const createStandalone = () => {
      monster.createStandaloneLegendaryAction()
    }

    const findActionObj = (actionId: string) => {
      return monster.actions.find((a) => a.id === actionId)
    }

    const findAttackObj = (actionId: string) => {
      return monster.attacks.find((a) => a.id === actionId)
    }

    const filteredActions = computed(() => {
      const actions = monster.attacksAndActions(t)

      const filtered = actions.filter(
        (a) =>
          monster.legendaryActions.actions.find((la) => la.actionId === a.id) ==
          null
      )

      return filtered
    })

    return {
      monster,
      filteredActions,
      addLegendary,
      createStandalone,
      findActionObj,
      findAttackObj,
      validateNumber: validateNumber,
    }
  },
})
</script>

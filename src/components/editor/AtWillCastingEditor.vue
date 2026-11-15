<template>
  <div class="innate-casting-editor-panel q-mt-sm">
    <q-card class="bg-grey-10 text-white rounded-borders" style="border: 1px solid rgba(255, 255, 255, 0.12);">
      <q-card-section>
        <div class="row">
          <mechanic-text-editor
            v-model="monster.spellcasting.atWillNotes"
            scope="spell"
            class="col-12 q-pa-sm q-mb-sm"
            bottom-slots
            :label="$t('monster.spellcasting.atWillNotes')"
          >
            <template #hint>{{ $t('editor.plainTextNote') }}</template>
            <template #after>
              <q-btn
                push
                :icon="
                  monster.spellcasting.useCustomInnatePreamble
                    ? 'edit'
                    : 'edit_off'
                "
                :color="
                  monster.spellcasting.useCustomInnatePreamble
                    ? 'warning'
                    : 'dark'
                "
                size="md"
                @click="
                  monster.spellcasting.useCustomInnatePreamble =
                    !monster.spellcasting.useCustomInnatePreamble
                "
              >
                <q-tooltip class="text-body2">{{
                  monster.spellcasting.useCustomInnatePreamble
                    ? $t('editor.spellcasting.slot.useCustomPreamble')
                    : $t('editor.spellcasting.slot.useDefaultPreamble')
                }}</q-tooltip></q-btn
              >
            </template>
          </mechanic-text-editor>
          <q-slide-transition>
            <div
              v-show="monster.spellcasting.useCustomInnatePreamble"
              class="col-12 q-mt-md"
            >
              <monster-text-editor
                :field="monster.spellcasting.customInnatePreamble"
                i18n-label-key="editor.spellcasting.innate.preamble"
                token-category="spell"
                :show-reset="true"
                @update:model-value="
                          (value: string) =>
                            (monster.spellcasting.customInnatePreamble =
                              value)
                        "
                @reset="
                  monster.spellcasting.customInnatePreamble = $t(
                    'presets.innateSpellcasting'
                  )
                "
              />
            </div>
          </q-slide-transition>
          <template
            v-for="innateList in monster.spellcasting.atWill"
            :key="innateList.id"
          >
            <formula-field
              v-help="'Number of innate casts allowed per recharge interval (ignored for At Will).'"
              :path="`spellcasting.atWill[id=${encodeURIComponent(innateList.id)}].count`"
              :label="$t('editor.spellcasting.innate.casts')"
              class="col-2 q-pa-sm"
            />
            <catalog-select
              v-help="'Recovery schedule for this group of innate spells.'"
              :model-value="innateList.rate ?? ''"
              :entries="rechargeEntries"
              preserve-order
              :outlined="false"
              :searchable="false"
              dark
              :label="$t('editor.spellcasting.innate.recharge')"
              class="col-3 q-pa-sm"
              @update:model-value="value => (innateList.rate = String(value || ''))"
            />
            <searchable-spell-select
              :model-value="innateList.spells"
              :label="$t('editor.spellcasting.innate.list')"
              class="col-7 q-pa-sm"
              @clear="innateList.spells = []"
              @update:model-value="(value: string[]) => innateList.spells = value"
            >
              <template #after>
                <q-btn
                  round
                  color="negative"
                  icon="delete"
                  @click="monster.deleteInnateSpellList(innateList.id)"
                >
                  <q-tooltip class="text-body2">{{
                    $t('editor.spellcasting.innate.delete')
                  }}</q-tooltip>
                </q-btn>
              </template>
            </searchable-spell-select>
          </template>

          <div class="col-12 q-py-md q-px-sm">
            <q-btn
              class="full-width"
              color="green-9"
              @click="monster.addInnateSpellList"
              >{{ $t('editor.spellcasting.innate.addNew') }}</q-btn
            >
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useClasses } from 'src/data/CLASS'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore, SpellOption } from 'src/stores/spells-store'
import { ref, computed } from 'vue'
import { spellArrayFilter } from '../filters'
import MonsterTextEditor from './MonsterTextEditor.vue'
import CatalogSelect from '../kit/CatalogSelect.vue'
import FormulaField from '../kit/FormulaField.vue'
import SearchableSpellSelect from './widgets/SearchableSpellSelect.vue'

export default defineComponent({
  name: 'AtWillCastingEditor',
  components: { CatalogSelect, MonsterTextEditor, SearchableSpellSelect, FormulaField },
  setup() {
    const showSlots = ref(false)
    const classFilter = ref(false)

    const monster = useMonsterStore()
    const spells = useSpellsStore()
    const { rechargeTimeOptions } = useRechargeTimes()
    const rechargeEntries = computed(() =>
      rechargeTimeOptions.value.map((o) => ({
        value: o.value,
        label: o.label,
        group: o.category,
        icon: o.icon,
        color: o.color,
      }))
    )
    const classes = useClasses()
    const baseSpells = computed<SpellOption[]>(() =>
      classFilter.value
        ? spells.allSpellOptions.filter((s) =>
            s.class.find(
              (c) =>
                c.toLowerCase() === monster.spellcasting.class?.toLowerCase()
            )
          )
        : spells.allSpellOptions
    )
    const spellOptions = ref<SpellOption[]>([])
    const spellFilter = spellArrayFilter(baseSpells, spellOptions)

    return {
      monster,
      rechargeEntries,
      rechargeTimeOptions,
      spellOptions,
      spellFilter,
      showSlots,
      classFilter,
      spellOptionsByLevel: spells.spellOptionsByLevel,
      ...classes,
    }
  },
})
</script>

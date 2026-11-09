<template>
  <div class="character-editor q-pa-sm">
    <!-- 1. Character Identity & Portrait -->
    <q-expansion-item
      group="char-group"
      icon="person"
      label="Character Identity & Portrait"
      default-opened
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-sm">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input v-help="'Enter character name for the character editor.'" v-model="actor.name" label="Character Name" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-help="'Enter class for the character editor.'" v-model="actor.class" label="Class" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-help="'Enter subclass for the character editor.'" v-model="actor.subclass" label="Subclass" dense outlined />
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-4 col-md-2">
              <q-input v-help="'Enter level for the character editor.'"
                v-model.number="actor.level"
                type="number"
                min="1"
                max="20"
                label="Level"
                dense
                outlined
              />
            </div>
            <div class="col-8 col-md-4">
              <q-input v-help="'Enter species / race for the character editor.'" v-model="actor.race" label="Species / Race" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-help="'Enter background for the character editor.'" v-model="actor.background" label="Background" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-help="'Enter alignment for the character editor.'" v-model="actor.alignment" label="Alignment" dense outlined />
            </div>
          </div>

          <!-- Portrait Configuration -->
          <div class="q-mt-md q-pa-sm rounded-borders" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">Hero Portrait & Avatar</div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-4">
                <q-select v-help="'Choose portrait position for the character editor.'"
                  v-model="portrait.position"
                  :options="portraitPositions"
                  emit-value
                  map-options
                  label="Portrait Position"
                  dense
                  outlined
                />
              </div>
              <div class="col-12 col-sm-8">
                <q-input v-help="'Enter image url or data uri for the character editor.'"
                  v-model="portrait.url"
                  label="Image URL or Data URI"
                  dense
                  outlined
                  clearable
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs items-center q-mt-xs">
              <div class="col-12 col-sm-8">
                <q-file
                  v-model="portraitFile"
                  label="Upload local image (100% offline)"
                  dense
                  outlined
                  accept="image/*"
                  @update:model-value="onPortraitFileSelected"
                >
                  <template #prepend>
                    <q-icon name="attach_file" />
                  </template>
                </q-file>
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-help="'Enter caption / title for the character editor.'"
                  v-model="portrait.caption"
                  label="Caption / Title"
                  dense
                  outlined
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item group="char-group" icon="shield" label="Armor Class & Speed" header-class="text-weight-bold text-teal-4" class="q-mb-sm rounded-borders border-subtle">
      <q-card><q-card-section>
        <div class="text-caption q-mb-sm">Class, species and equipment names are references. Enter totals from your character's rules or keep the labelled estimates.</div>
        <div class="editor-fit-grid">
          <div class="editor-fit-cell">
            <q-input :model-value="actor.combatVitals?.armorClass ?? null" @update:model-value="setVital('armorClass', $event)" label="Recorded Armor Class" type="number" min="0" clearable dense outlined />
            <q-input :model-value="actor.combatVitals?.armorClassSource ?? null" @update:model-value="setVital('armorClassSource', $event)" label="Armor Class source / notes" dense outlined class="q-mt-xs" />
            <div class="text-caption q-mt-xs" data-character-ac-provenance>{{ vitals.armorClass.value }} — {{ vitals.armorClass.label }}: {{ vitals.armorClass.provenance }}</div>
          </div>
          <div class="editor-fit-cell">
            <q-input :model-value="actor.combatVitals?.speed ?? null" @update:model-value="setVital('speed', $event)" label="Recorded Speed (ft.)" type="number" min="0" clearable dense outlined />
            <q-input :model-value="actor.combatVitals?.speedSource ?? null" @update:model-value="setVital('speedSource', $event)" label="Speed source / notes" dense outlined class="q-mt-xs" />
            <div class="text-caption q-mt-xs" data-character-speed-provenance>{{ vitals.speed.value }} ft. — {{ vitals.speed.label }}: {{ vitals.speed.provenance }}</div>
          </div>
        </div>
      </q-card-section></q-card>
    </q-expansion-item>

    <!-- 2. Ability Scores & Modifiers -->
    <q-expansion-item
      group="char-group"
      icon="fitness_center"
      label="Ability Scores & Modifiers"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div
              v-for="stat in abilityKeys"
              :key="stat"
              class="col-4 col-md-2 text-center"
            >
              <q-input
                v-model.number="actor.stats[stat]"
                type="number"
                min="1"
                max="30"
                :label="stat"
                dense
                outlined
                input-class="text-center text-weight-bold"
              >
                <template #append>
                  <span class="text-caption text-grey-4">
                    {{ formatMod(charStore.getModifier(stat)) }}
                  </span>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- 3. Saving Throws & Skills -->
    <q-expansion-item
      group="char-group"
      icon="verified"
      label="Saving Throws & Skills"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <!-- Saving Throws -->
          <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">Saving Throws (Proficiency Bonus: +{{ actor.proficiency }})</div>
          <div class="row q-col-gutter-xs q-mb-md">
            <div
              v-for="stat in abilityKeys"
              :key="`save-${stat}`"
              class="col-4 col-md-2"
            >
              <div
                class="row items-center justify-between q-pa-xs rounded-borders cursor-pointer"
                :style="actor.savingThrows && actor.savingThrows[stat] ? 'background: rgba(0, 150, 136, 0.2); border: 1px solid rgba(0, 150, 136, 0.4);' : 'background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);'"
                @click="charStore.toggleSavingThrow(stat)"
              >
                <q-checkbox
                  :model-value="!!(actor.savingThrows && actor.savingThrows[stat])"
                  dense
                  size="xs"
                  color="teal"
                  @update:model-value="charStore.toggleSavingThrow(stat)"
                />
                <span class="text-caption text-weight-bold">{{ stat }}</span>
                <span class="text-caption text-weight-bolder text-teal-3">
                  {{ formatMod(charStore.getSaveModifier(stat)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-caption text-weight-bold text-teal-3">Skills (18 Standard 5e Skills)</span>
            <q-input
              v-model="skillFilter"
              placeholder="Filter skills..."
              dense
              outlined
              style="max-width: 180px;"
              clearable
            >
              <template #prepend>
                <q-icon name="search" size="xs" />
              </template>
            </q-input>
          </div>

          <div class="row q-col-gutter-xs">
            <div
              v-for="skill in filteredSkills"
              :key="skill.name"
              class="col-12 col-md-6"
            >
              <div
                class="row items-center justify-between q-px-sm q-py-xs rounded-borders"
                style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
              >
                <div class="row items-center q-gutter-xs">
                  <q-checkbox
                    :model-value="!!(actor.skills && actor.skills[skill.name]?.proficient)"
                    dense
                    size="xs"
                    color="teal"
                    @update:model-value="charStore.toggleSkillProficiency(skill.name)"
                  >
                    <q-tooltip>Proficient (+{{ actor.proficiency }})</q-tooltip>
                  </q-checkbox>
                  <q-checkbox
                    :model-value="!!(actor.skills && actor.skills[skill.name]?.expertise)"
                    dense
                    size="xs"
                    color="amber"
                    @update:model-value="charStore.toggleSkillExpertise(skill.name)"
                  >
                    <q-tooltip>Expertise (+{{ actor.proficiency * 2 }})</q-tooltip>
                  </q-checkbox>
                  <span class="text-body2">{{ skill.name }}</span>
                  <span class="text-caption text-grey-5">({{ skill.stat }})</span>
                </div>
                <q-badge
                  :color="actor.skills && actor.skills[skill.name]?.expertise ? 'amber-9' : actor.skills && actor.skills[skill.name]?.proficient ? 'teal-9' : 'grey-8'"
                  class="text-weight-bold"
                >
                  {{ formatMod(charStore.getSkillModifier(skill.name, skill.stat)) }}
                </q-badge>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- 4. Hit Points & Vitals -->
    <q-expansion-item
      group="char-group"
      icon="favorite"
      label="Hit Points & Defenses"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input v-help="'Enter current hp for the character editor.'"
                v-model.number="actor.hp.current"
                type="number"
                label="Current HP"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input v-help="'Enter max hp for the character editor.'"
                v-model.number="actor.hp.max"
                type="number"
                label="Max HP"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input v-help="'Enter temp hp for the character editor.'"
                v-model.number="actor.hp.temp"
                type="number"
                label="Temp HP"
                dense
                outlined
              />
            </div>
          </div>
          <div class="row q-col-gutter-sm q-mt-xs">
            <div class="col-4">
              <q-input v-help="'Enter total hit dice for the character editor.'"
                v-model.number="actor.hitDice.total"
                type="number"
                label="Total Hit Dice"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input v-help="'Enter spent hit dice for the character editor.'"
                v-model.number="actor.hitDice.spent"
                type="number"
                label="Spent Hit Dice"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-select v-help="'Choose hit die type (d) for the character editor.'"
                v-model.number="actor.hitDice.die"
                :options="[6, 8, 10, 12].map((faces) => ({ label: `d${faces}`, value: faces }))"
                emit-value
                map-options
                label="Hit Die Type (d)"
                dense
                outlined
              />
            </div>
          </div>
          <!-- Death Saves -->
          <div class="row q-col-gutter-sm q-mt-xs items-center">
            <div class="col-6">
              <div class="q-pa-xs rounded-borders text-center" style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);">
                <span class="text-caption text-weight-bold text-positive">Death Save Successes: {{ actor.deathSaves.successes }} / 3</span>
                <div class="row justify-center q-gutter-xs q-mt-xs">
                  <q-btn
                    v-for="i in 3"
                    :key="`succ-${i}`"
                    round
                    size="xs"
                    :color="actor.deathSaves.successes >= i ? 'positive' : 'grey-8'"
                    icon="check"
                    @click="actor.deathSaves.successes = actor.deathSaves.successes === i ? i - 1 : i"
                  />
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="q-pa-xs rounded-borders text-center" style="background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3);">
                <span class="text-caption text-weight-bold text-negative">Death Save Failures: {{ actor.deathSaves.failures }} / 3</span>
                <div class="row justify-center q-gutter-xs q-mt-xs">
                  <q-btn
                    v-for="i in 3"
                    :key="`fail-${i}`"
                    round
                    size="xs"
                    :color="actor.deathSaves.failures >= i ? 'negative' : 'grey-8'"
                    icon="close"
                    @click="actor.deathSaves.failures = actor.deathSaves.failures === i ? i - 1 : i"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- 5. Spellcasting & Spell Slots -->
    <q-expansion-item
      group="char-group"
      icon="menu_book"
      label="Spellcasting & Spell Slots"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <!-- Spellcasting Ability & Calculated Metrics -->
          <div class="row q-col-gutter-sm items-center q-mb-md">
            <div class="col-12 col-sm-4">
              <q-select v-help="'Choose spellcasting ability for the character editor.'"
                v-model="spellcastingAbility"
                :options="castingAbilityOptions"
                emit-value
                map-options
                label="Spellcasting Ability"
                dense
                outlined
              />
            </div>
            <div class="col-6 col-sm-4 text-center">
              <div class="q-pa-xs rounded-borders" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);">
                <div class="text-caption text-grey-4">Spell Save DC</div>
                <div class="text-h6 text-weight-bold text-teal-3">{{ computedSpellSaveDc }}</div>
              </div>
            </div>
            <div class="col-6 col-sm-4 text-center">
              <div class="q-pa-xs rounded-borders" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);">
                <div class="text-caption text-grey-4">Spell Attack Bonus</div>
                <div class="text-h6 text-weight-bold text-teal-3">{{ formatMod(computedSpellAttackBonus) }}</div>
              </div>
            </div>
          </div>

          <!-- Spell Slots Matrix (Levels 1 to 9) -->
          <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">Spell Slots Matrix</div>
          <div class="row q-col-gutter-xs q-mb-md">
            <div
              v-for="lvl in 9"
              :key="`slot-lvl-${lvl}`"
              class="col-4 col-sm-3 col-md-4 text-center"
            >
              <div class="q-pa-xs rounded-borders" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                <div class="text-caption text-weight-bold text-grey-4">Lvl {{ lvl }}</div>
                <div class="row q-col-gutter-xs q-mt-xs">
                  <div class="col-6">
                    <q-input v-help="'Enter cur for the character editor.'"
                      v-model.number="actor.spellSlots.current[lvl - 1]"
                      type="number"
                      min="0"
                      label="Cur"
                      dense
                      outlined
                    />
                  </div>
                  <div class="col-6">
                    <q-input v-help="'Enter max for the character editor.'"
                      v-model.number="actor.spellSlots.max[lvl - 1]"
                      type="number"
                      min="0"
                      label="Max"
                      dense
                      outlined
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Spells List -->
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-caption text-weight-bold text-teal-3">Prepared & Known Spells</span>
            <q-btn v-help="'Add Spell in the character editor.'"
              size="sm"
              color="primary"
              icon="add"
              label="Add Spell"
              @click="charStore.addSpell()"
            />
          </div>

          <div v-if="!actor.spells || actor.spells.length === 0" class="text-caption text-grey-5 text-italic q-my-sm">
            No spells registered. Click "Add Spell" to track cantrips and leveled spells.
          </div>

          <div
            v-for="sp in actor.spells"
            :key="sp.id"
            class="q-pa-xs q-mb-xs rounded-borders"
            style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);"
          >
            <div class="row q-col-gutter-xs items-center">
              <div class="col-auto">
                <q-checkbox
                  v-model="sp.prepared"
                  dense
                  size="xs"
                  color="teal"
                >
                  <q-tooltip>Prepared Spell</q-tooltip>
                </q-checkbox>
              </div>
              <div class="col-5">
                <q-input v-help="'Enter spell name for the character editor.'" v-model="sp.name" label="Spell Name" dense outlined />
              </div>
              <div class="col-3">
                <q-select v-help="'Choose level for the character editor.'"
                  v-model.number="sp.level"
                  :options="spellLevelOptions"
                  emit-value
                  map-options
                  label="Level"
                  dense
                  outlined
                />
              </div>
              <div class="col-3">
                <q-input v-help="'Enter notes (e.g. conc, 1 action) for the character editor.'" v-model="sp.notes" label="Notes (e.g. Conc, 1 Action)" dense outlined />
              </div>
              <div class="col-auto text-right">
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  color="negative"
                  icon="delete"
                  @click="charStore.removeSpell(sp.id)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- 6. Features & Traits -->
    <q-expansion-item
      group="char-group"
      icon="auto_awesome"
      label="Features & Traits"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-y-sm">
          <div class="row justify-end">
            <q-btn v-help="'Add Feature in the character editor.'"
              size="sm"
              color="primary"
              icon="add"
              label="Add Feature"
              @click="charStore.addFeature()"
            />
          </div>
          <div
            v-for="feat in actor.features"
            :key="feat.id"
            class="q-pa-sm rounded-borders"
            style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
          >
            <div class="row q-col-gutter-xs items-center">
              <div class="col-6">
                <q-input v-help="'Enter feature name for the character editor.'" v-model="feat.name" label="Feature Name" dense outlined />
              </div>
              <div class="col-5">
                <q-input v-help="'Enter source for the character editor.'" v-model="feat.source" label="Source" dense outlined />
              </div>
              <div class="col-1 text-right">
                <q-btn
                  flat
                  round
                  dense
                  size="xs"
                  color="negative"
                  icon="delete"
                  @click="charStore.removeFeature(feat.id)"
                />
              </div>
            </div>
            <q-input v-help="'Enter description for the character editor.'"
              v-model="feat.description"
              type="textarea"
              rows="2"
              label="Description"
              dense
              outlined
              class="q-mt-xs"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- 7. Inventory & Equipment -->
    <q-expansion-item
      group="char-group"
      icon="backpack"
      label="Inventory & Equipment"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <div class="text-caption text-grey-4">
              Total Weight: <span class="text-weight-bold text-teal-3">{{ totalCarriedWeight }} lb</span> |
              Max Carry: <span class="text-weight-bold">{{ actor.stats.STR * 15 }} lb</span>
              <span v-if="totalCarriedWeight > actor.stats.STR * 5" class="text-warning q-ml-xs">(Encumbered)</span>
            </div>
            <q-btn v-help="'Add Item in the character editor.'"
              size="sm"
              color="primary"
              icon="add"
              label="Add Item"
              @click="charStore.addItem()"
            />
          </div>
          <div
            v-for="item in actor.inventory"
            :key="item.id"
            class="row q-col-gutter-xs items-center rounded-borders q-pa-xs"
            style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
          >
            <div class="col-5">
              <q-input v-help="'Enter item name for the character editor.'" v-model="item.name" label="Item Name" dense outlined />
            </div>
            <div class="col-2">
              <q-input v-help="'Enter qty for the character editor.'"
                v-model.number="item.quantity"
                type="number"
                label="Qty"
                dense
                outlined
              />
            </div>
            <div class="col-2">
              <q-input v-help="'Enter weight (lb) for the character editor.'"
                v-model.number="item.weight"
                type="number"
                label="Weight (lb)"
                dense
                outlined
              />
            </div>
            <div class="col-2">
              <q-checkbox v-help="'Tick to include eqp for the character editor.'" v-model="item.equipped" label="Eqp" dense size="xs" />
            </div>
            <div class="col-1 text-right">
              <q-btn
                flat
                round
                dense
                size="xs"
                color="negative"
                icon="delete"
                @click="charStore.removeItem(item.id)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script lang="ts">
import { characterVitals } from 'src/core/domain/character-truth'
import { computed, defineComponent, ref } from 'vue'
import { useCharacterStore } from 'src/stores/character-store'
import { DndStat, DND_SKILLS } from 'src/core/domain/types'

export default defineComponent({
  name: 'CharacterEditor',
  setup() {
    const charStore = useCharacterStore()
    const setVital = (field: 'armorClass' | 'speed' | 'armorClassSource' | 'speedSource', value: string | number | null) => {
      const next = { ...charStore.actor.combatVitals }
      if (field === 'armorClass' || field === 'speed') {
        const number = value === null || value === '' ? null : Number(value)
        next[field] = number !== null && Number.isFinite(number) && number >= 0 ? number : null
      } else next[field] = String(value ?? '')
      charStore.actor.combatVitals = next
    }
    const abilityKeys: DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
    const skillFilter = ref('')
    const portraitFile = ref<File | null>(null)

    // Ensure portrait initialized
    if (!charStore.actor.portrait) {
      charStore.actor.portrait = {
        url: '',
        position: 'none',
        caption: '',
      }
    }
    const portrait = charStore.actor.portrait

    const portraitPositions = [
      { label: 'None (Hidden)', value: 'none' },
      { label: 'Top of Sheet', value: 'top' },
      { label: 'Left Column', value: 'left' },
      { label: 'Right Column', value: 'right' },
    ]

    const onPortraitFileSelected = (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          portrait.url = e.target.result
          if (portrait.position === 'none') {
            portrait.position = 'top'
          }
        }
      }
      reader.readAsDataURL(file)
    }

    const castingAbilityOptions = [
      { label: 'Intelligence (INT)', value: 'INT' },
      { label: 'Wisdom (WIS)', value: 'WIS' },
      { label: 'Charisma (CHA)', value: 'CHA' },
    ]

    const spellLevelOptions = [
      { label: 'Cantrip', value: 0 },
      { label: '1st Level', value: 1 },
      { label: '2nd Level', value: 2 },
      { label: '3rd Level', value: 3 },
      { label: '4th Level', value: 4 },
      { label: '5th Level', value: 5 },
      { label: '6th Level', value: 6 },
      { label: '7th Level', value: 7 },
      { label: '8th Level', value: 8 },
      { label: '9th Level', value: 9 },
    ]

    const spellcastingAbility = computed({
      get: () => charStore.actor.spellcasting?.ability || 'INT',
      set: (val: DndStat) => {
        if (!charStore.actor.spellcasting) {
          charStore.actor.spellcasting = { ability: val }
        } else {
          charStore.actor.spellcasting.ability = val
        }
      },
    })

    const computedSpellSaveDc = computed(() => {
      const ability = spellcastingAbility.value
      return 8 + charStore.actor.proficiency + charStore.getModifier(ability)
    })

    const computedSpellAttackBonus = computed(() => {
      const ability = spellcastingAbility.value
      return charStore.actor.proficiency + charStore.getModifier(ability)
    })

    const formatMod = (mod: number): string => {
      return mod >= 0 ? `+${mod}` : `${mod}`
    }

    const filteredSkills = computed(() => {
      if (!skillFilter.value.trim()) return DND_SKILLS
      const q = skillFilter.value.toLowerCase().trim()
      return DND_SKILLS.filter(
        (s) => s.name.toLowerCase().includes(q) || s.stat.toLowerCase().includes(q)
      )
    })

    const totalCarriedWeight = computed(() => {
      return (charStore.actor.inventory || []).reduce(
        (sum, item) => sum + (item.quantity || 1) * (item.weight || 0),
        0
      )
    })

    return {
      setVital,
      vitals: computed(() => characterVitals(charStore.actor)),
      actor: computed(() => charStore.actor),
      charStore,
      abilityKeys,
      formatMod,
      skillFilter,
      filteredSkills,
      portrait,
      portraitFile,
      portraitPositions,
      onPortraitFileSelected,
      castingAbilityOptions,
      spellLevelOptions,
      spellcastingAbility,
      computedSpellSaveDc,
      computedSpellAttackBonus,
      totalCarriedWeight,
    }
  },
})
</script>

<style scoped>
.border-subtle {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}
</style>

<template>
  <div class="character-editor q-pa-sm">
    <!-- 1. Character Identity & Portrait -->
    <q-expansion-item
      group="char-group"
      icon="person"
      :label="$t('studio.character.identityHeading')"
      default-opened
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-sm">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input v-model="actor.name" v-help="$t('help.character.name')" :label="$t('studio.character.nameLabel')" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model="actor.class" v-help="$t('help.character.className')" :label="$t('studio.character.classLabel')" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model="actor.subclass" v-help="$t('help.character.subclass')" :label="$t('studio.character.subclassLabel')" dense outlined />
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-4 col-md-2">
              <q-input
v-model.number="actor.level"
                v-help="$t('help.character.level')"
                type="number"
                min="1"
                max="20"
                :label="$t('studio.character.levelLabel')"
                dense
                outlined
              />
            </div>
            <div class="col-8 col-md-4">
              <q-input v-model="actor.race" v-help="$t('help.character.species')" :label="$t('studio.character.speciesLabel')" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model="actor.background" v-help="$t('help.character.background')" :label="$t('studio.character.backgroundLabel')" dense outlined />
            </div>
            <div class="col-6 col-md-3">
              <q-input v-model="actor.alignment" v-help="$t('help.character.alignment')" :label="$t('studio.character.alignmentLabel')" dense outlined />
            </div>
          </div>

          <!-- Portrait Configuration -->
          <div class="q-mt-md q-pa-sm rounded-borders" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
            <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">{{ $t('studio.character.portraitHeading') }}</div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-4">
                <catalog-select
v-model="portrait.position"
                  v-help="$t('help.character.portraitPosition')"
                  :entries="portraitPositions"
                  preserve-order
                  :searchable="false"
                  :label="$t('studio.character.portraitPosition')"
                />
              </div>
              <div class="col-12 col-sm-8">
                <q-input
v-model="portrait.url"
                  v-help="$t('help.character.portraitUrl')"
                  :label="$t('studio.character.portraitUrl')"
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
                  :label="$t('studio.character.portraitUpload')"
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
                <q-input
v-model="portrait.caption"
                  v-help="$t('help.character.portraitCaption')"
                  :label="$t('studio.character.portraitCaption')"
                  dense
                  outlined
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <character2024-section />

    <q-expansion-item group="char-group" icon="shield" :label="$t('studio.character.acSpeedHeading')" header-class="text-weight-bold text-teal-4" class="q-mb-sm rounded-borders border-subtle">
      <q-card><q-card-section>
        <div class="text-caption q-mb-sm">{{ $t('studio.character.acSpeedNotice') }}</div>
        <div class="editor-fit-grid">
          <div class="editor-fit-cell">
            <q-input v-help="'Record the character’s static Armor Class override shown in the vitals block; leave blank to auto-derive.'" :model-value="actor.combatVitals?.armorClass ?? null" :label="$t('studio.character.recordedAc')" type="number" min="0" clearable dense outlined @update:model-value="setVital('armorClass', $event)" />
            <mechanic-text-editor scope="character" :model-value="actor.combatVitals?.armorClassSource ?? ''" :label="$t('studio.character.acSourceNotes')" dense outlined class="q-mt-xs" @update:model-value="(value: string) => setVital('armorClassSource', value)" />
            <div class="text-caption q-mt-xs" data-character-ac-provenance>{{ vitals.armorClass.value }} — {{ vitals.armorClass.label }}: {{ vitals.armorClass.provenance }}</div>
          </div>
          <div class="editor-fit-cell">
            <q-input v-help="'Record the character’s walking speed in feet for the vitals header; leave blank for baseline speed.'" :model-value="actor.combatVitals?.speed ?? null" :label="$t('studio.character.recordedSpeed')" type="number" min="0" clearable dense outlined @update:model-value="setVital('speed', $event)" />
            <mechanic-text-editor scope="character" :model-value="actor.combatVitals?.speedSource ?? ''" :label="$t('studio.character.speedSourceNotes')" dense outlined class="q-mt-xs" @update:model-value="(value: string) => setVital('speedSource', value)" />
            <div class="text-caption q-mt-xs" data-character-speed-provenance>{{ vitals.speed.value }} ft. — {{ vitals.speed.label }}: {{ vitals.speed.provenance }}</div>
          </div>
        </div>
      </q-card-section></q-card>
    </q-expansion-item>

    <!-- 2. Ability Scores & Modifiers -->
    <q-expansion-item
      group="char-group"
      icon="fitness_center"
      :label="$t('studio.character.abilitiesHeading')"
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
                v-help="'Base ability score (1–30) used to derive modifiers, saving throws, skills, and DC calculations.'"
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
      :label="$t('studio.character.savesSkillsHeading')"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <!-- Saving Throws -->
          <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">{{ $t('studio.character.savingThrowsLabel', [actor.proficiency]) }}</div>
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
                  v-help="'Grant saving throw proficiency in this ability to add Proficiency Bonus.'"
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
            <span class="text-caption text-weight-bold text-teal-3">{{ $t('studio.character.skillsHeading') }}</span>
            <q-input
              v-model="skillFilter"
              v-help="'Filter the 18 character skills by skill name or governing ability score.'"
              :placeholder="$t('studio.character.filterSkills')"
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
                  :color="actor.skills && actor.skills[skill.name]?.expertise ? 'amber-4' : actor.skills && actor.skills[skill.name]?.proficient ? 'teal-9' : 'grey-8'"
                  :text-color="actor.skills && actor.skills[skill.name]?.expertise ? 'grey-10' : 'white'"
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
      :label="$t('studio.character.hpDefensesHeading')"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input
v-model.number="actor.hp.current"
                v-help="$t('help.character.hpCurrent')"
                type="number"
                :label="$t('studio.character.hpCurrent')"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input
v-model.number="actor.hp.max"
                v-help="$t('help.character.hpMax')"
                type="number"
                :label="$t('studio.character.hpMax')"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input
v-model.number="actor.hp.temp"
                v-help="$t('help.character.hpTemp')"
                type="number"
                :label="$t('studio.character.hpTemp')"
                dense
                outlined
              />
            </div>
          </div>
          <div class="row q-col-gutter-sm q-mt-xs">
            <div class="col-4">
              <q-input
v-model.number="actor.hitDice.total"
                v-help="$t('help.character.hdTotal')"
                type="number"
                :label="$t('studio.character.hdTotal')"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <q-input
v-model.number="actor.hitDice.spent"
                v-help="$t('help.character.hdSpent')"
                type="number"
                :label="$t('studio.character.hdSpent')"
                dense
                outlined
              />
            </div>
            <div class="col-4">
              <catalog-select
v-help="$t('help.character.hdDie')"
                :model-value="String(actor.hitDice.die)"
                :entries="hitDieOptions"
                preserve-order
                :searchable="false"
                :label="$t('studio.character.hdDie')"
                @update:model-value="(val) => (actor.hitDice.die = Number(val ?? 8))"
              />
            </div>
          </div>
          <!-- Death Saves -->
          <div class="row q-col-gutter-sm q-mt-xs items-center">
            <div class="col-6">
              <div class="q-pa-xs rounded-borders text-center" style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);">
                <span class="text-caption text-weight-bold text-positive">{{ $t('studio.character.deathSaveSucc', [actor.deathSaves.successes]) }}</span>
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
                <span class="text-caption text-weight-bold text-negative">{{ $t('studio.character.deathSaveFail', [actor.deathSaves.failures]) }}</span>
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
      :label="$t('studio.character.spellcastingHeading')"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section>
          <!-- Spellcasting Ability & Calculated Metrics -->
          <div class="row q-col-gutter-sm items-center q-mb-md">
            <div class="col-12 col-sm-4">
              <catalog-select
v-model="spellcastingAbility"
                v-help="$t('help.character.castingAbility')"
                :entries="castingAbilityOptions"
                preserve-order
                :searchable="false"
                :label="$t('studio.character.castingAbility')"
              />
            </div>
            <div class="col-6 col-sm-4 text-center">
              <div class="q-pa-xs rounded-borders" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);">
                <div class="text-caption text-grey-4">{{ $t('studio.character.spellSaveDc') }}</div>
                <div class="text-h6 text-weight-bold text-teal-3">{{ computedSpellSaveDc }}</div>
              </div>
            </div>
            <div class="col-6 col-sm-4 text-center">
              <div class="q-pa-xs rounded-borders" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);">
                <div class="text-caption text-grey-4">{{ $t('studio.character.spellAttackBonus') }}</div>
                <div class="text-h6 text-weight-bold text-teal-3">{{ formatMod(computedSpellAttackBonus) }}</div>
              </div>
            </div>
          </div>

          <!-- Spell Slots Matrix (Levels 1 to 9) -->
          <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">{{ $t('studio.character.spellSlotsMatrix') }}</div>
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
                    <q-input
v-model.number="actor.spellSlots.current[lvl - 1]"
                      v-help="$t('help.character.slotCurrent')"
                      type="number"
                      min="0"
                      :label="$t('studio.character.curSlot')"
                      dense
                      outlined
                    />
                  </div>
                  <div class="col-6">
                    <q-input
v-model.number="actor.spellSlots.max[lvl - 1]"
                      v-help="$t('help.character.slotMax')"
                      type="number"
                      min="0"
                      :label="$t('studio.character.maxSlot')"
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
            <span class="text-caption text-weight-bold text-teal-3">{{ $t('studio.character.preparedKnownSpells') }}</span>
            <q-btn
v-help="$t('help.character.addSpell')"
              size="sm"
              color="primary"
              icon="add"
              :label="$t('studio.character.addSpell')"
              @click="charStore.addSpell()"
            />
          </div>

          <div v-if="!actor.spells || actor.spells.length === 0" class="text-caption text-grey-5 text-italic q-my-sm">
            {{ $t('studio.character.noSpells') }}
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
                <q-input v-model="sp.name" v-help="$t('help.character.spellName')" :label="$t('studio.character.spellName')" dense outlined />
              </div>
              <div class="col-3">
                <catalog-select
v-help="$t('help.character.spellLevel')"
                  :model-value="String(sp.level)"
                  :entries="spellLevelEntries"
                  preserve-order
                  :searchable="false"
                  :label="$t('studio.character.levelLabel')"
                  @update:model-value="(val) => (sp.level = Number(val ?? 0))"
                />
              </div>
              <div class="col-3">
                <mechanic-text-editor v-model="sp.notes" v-help="$t('help.character.spellNotes')" scope="character" :label="$t('studio.character.spellNotes')" dense outlined />
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
      :label="$t('studio.character.featuresHeading')"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-y-sm">
          <div class="row justify-end">
            <q-btn
v-help="$t('help.character.addFeature')"
              size="sm"
              color="primary"
              icon="add"
              :label="$t('studio.character.addFeature')"
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
                <q-input v-model="feat.name" v-help="$t('help.character.featureName')" :label="$t('studio.character.featureName')" dense outlined />
              </div>
              <div class="col-5">
                <q-input v-model="feat.source" v-help="$t('help.character.featureSource')" :label="$t('studio.character.featureSource')" dense outlined />
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
            <mechanic-text-editor
v-model="feat.description" v-help="$t('help.character.featureDescription')"
              scope="character"
              type="textarea"
              rows="2"
              :label="$t('studio.character.featureDescription')"
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
      :label="$t('studio.character.inventoryHeading')"
      header-class="text-weight-bold text-teal-4"
      class="q-mb-sm rounded-borders border-subtle"
    >
      <q-card>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <div class="text-caption text-grey-4">
              Total Weight: <span class="text-weight-bold text-teal-3">{{ totalCarriedWeight }} lb</span> |
              Max Carry: <span class="text-weight-bold">{{ actor.stats.STR * 15 }} lb</span>
              <span v-if="totalCarriedWeight > actor.stats.STR * 5" class="text-warning q-ml-xs">{{ $t('studio.character.encumbered') }}</span>
            </div>
            <q-btn
v-help="$t('help.character.addItem')"
              size="sm"
              color="primary"
              icon="add"
              :label="$t('studio.character.addItem')"
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
              <q-input v-model="item.name" v-help="$t('help.character.itemName')" :label="$t('studio.character.itemName')" dense outlined />
            </div>
            <div class="col-2">
              <q-input
v-model.number="item.quantity"
                v-help="$t('help.character.itemQty')"
                type="number"
                :label="$t('studio.character.itemQty')"
                dense
                outlined
              />
            </div>
            <div class="col-2">
              <q-input
v-model.number="item.weight"
                v-help="$t('help.character.itemWeight')"
                type="number"
                :label="$t('studio.character.itemWeight')"
                dense
                outlined
              />
            </div>
            <div class="col-2">
              <q-checkbox v-model="item.equipped" v-help="$t('help.character.itemEquipped')" :label="$t('studio.character.itemEquipped')" dense size="xs" />
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
import { useI18n } from 'vue-i18n'
import { useCharacterStore } from 'src/stores/character-store'
import { DndStat, DND_SKILLS } from 'src/core/domain/types'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import Character2024Section from './Character2024Section.vue'

export default defineComponent({
  name: 'CharacterEditor',
  components: { CatalogSelect, Character2024Section },
  setup() {
    const { t } = useI18n()
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

    const portraitPositions = computed(() => [
      { label: t('studio.character.portraitPosNone'), value: 'none' },
      { label: t('studio.character.portraitPosTop'), value: 'top' },
      { label: t('studio.character.portraitPosLeft'), value: 'left' },
      { label: t('studio.character.portraitPosRight'), value: 'right' },
    ])

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

    const hitDieOptions = [6, 8, 10, 12].map((faces) => ({ label: `d${faces}`, value: String(faces) }))
    const spellLevelEntries = spellLevelOptions.map((opt) => ({ label: opt.label, value: String(opt.value) }))

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
      hitDieOptions,
      spellLevelOptions,
      spellLevelEntries,
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

<template>
  <section v-if="attack" class="composer-chain" :data-attack-composer="attack.id" :aria-label="`${attack.name}: attack composer`">
    <div v-for="row in rows" :key="row.id" class="composer-chain__row">
      <span class="composer-chain__label">{{ row.label }}</span>
      <div class="composer-chain__cells" role="group" :aria-label="row.label">
        <chain-cell
v-for="spec in row.fields" :key="spec.id" :cell="cell(spec)" :spec="spec" :value="value(spec.id)"
          :allow-clear="!!spec.optional" number-hint="Enter a whole number. Apply saves this field; Cancel keeps its current value."
          :validate="(next: unknown) => validate(spec.id, next)" @commit="(next: unknown) => commit(spec.id, next)" @clear="commit(spec.id, '')" />
      </div>
    </div>
    <div v-for="(extra, index) in attack.additionalDamage" :key="extra.id" class="composer-chain__row">
      <span class="composer-chain__label">Extra {{ index + 1 }}</span>
      <div class="composer-chain__cells" role="group" :aria-label="`Extra damage ${index + 1}`">
        <chain-cell
v-for="spec in extraFields(extra.id)" :key="spec.id" :cell="cell(spec)" :spec="spec" :value="value(spec.id)"
          :allow-clear="!!spec.optional" number-hint="Enter a whole number; this field cannot be cleared." :validate="(next: unknown) => validate(spec.id, next)"
          @commit="(next: unknown) => commit(spec.id, next)" @clear="commit(spec.id, '')" />
        <q-btn flat dense no-caps color="red-3" label="Remove extra damage" :aria-label="`Remove extra damage ${index + 1}`" @click="monster.deleteAdditionalDamage(attack.id, extra.id)" />
      </div>
    </div>
    <div class="row q-gutter-sm q-my-sm">
      <q-btn flat dense no-caps icon="add" label="Add extra damage" @click="monster.addAdditionalDamage(attack.id)" />
      <q-btn flat dense no-caps icon="save" label="Save attack template" @click="saveTemplate" />
      <q-select v-if="phaseOptions.length > 1" v-model="attack.stagePool" :options="phaseOptions" emit-value map-options dense dark outlined label="Phase / pool" style="min-width: 160px" />
    </div>
    <div v-if="attack.useCustomRenderer" class="text-caption text-amber-3 q-mb-sm">Custom rendering is active. The preview uses your custom text; structured fields remain saved.</div>
    <monster-text-editor :field="attack.description" i18n-label-key="editor.attack.description" token-category="attack" @update:model-value="(text: string) => attack && (attack.description = text)" />
    <monster-text-editor
v-if="attack.useCustomRenderer" :field="attack.customRenderer" i18n-label-key="editor.attack.customRenderer" token-category="attack" :show-reset="true"
      @update:model-value="(text: string) => attack && (attack.customRenderer = text)" @reset="attack.customRenderer = t('presets.attack')" />
    <div class="composer-chain__row composer-preview" :data-attack-preview="attack.id">
      <span class="composer-chain__label">Preview</span>
      <div :class="previewClasses" aria-label="Live attack stat block preview">
        <!-- eslint-disable-next-line vue/no-v-html -- shared stat block renderer and sanitizer -->
        <div class="attack" v-html="previewHtml"></div>
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useProcessTokens } from 'src/components/rendering/useProcessTokens'
import { attackExtraPrefix, attackFields, attackPatch, attackValue, validateAttackField } from 'src/core/domain/attack-composer'
import type { AttackField } from 'src/core/domain/attack-composer'
import type { ChainCellView } from 'src/core/domain/composer-chain'
import ChainCell from './ChainCell.vue'
import MonsterTextEditor from '../MonsterTextEditor.vue'
import NewTemplateDialog from '../widgets/NewTemplateDialog.vue'

export default defineComponent({
  name: 'AttackComposer', components: { ChainCell, MonsterTextEditor },
  props: { attackId: { type: String, required: true } },
  setup(props) {
    const monster = useMonsterStore(), editor = useEditorStore(), templates = useTemplatesStore(), $q = useQuasar()
    const { t } = useI18n()
    const { processAttack, sanitizeWebString } = useProcessTokens()
    const attack = computed(() => monster.attacks.find(a => a.id === props.attackId))
    const fields = computed(() => attack.value ? attackFields(attack.value) : [])
    const value = (id: string) => attack.value ? attackValue(attack.value, id) : ''
    const validate = (id: string, next: unknown) => attack.value ? validateAttackField(attack.value, id, next) : 'Attack no longer exists.'
    const commit = (id: string, next: unknown) => { if (attack.value) Object.assign(attack.value, attackPatch(attack.value, id, next)) }
    const cell = (spec: AttackField): ChainCellView => ({ ...spec, state: value(spec.id) ? 'set' : 'empty', text: `${spec.label}: ${value(spec.id) || 'add'}`, legacy: false })
    const visible = (spec: AttackField) => {
      if (spec.id.startsWith('additional.')) return false
      if (spec.id.startsWith('alternateDamage.') && spec.id !== 'alternateDamage.active' && !attack.value?.alternateDamage.active) return false
      if (spec.id.endsWith('.overrideValue')) return value(spec.id.replace('.overrideValue', '.override')) === 'Yes'
      return true
    }
    const rows = computed(() => [ ['head', 'Identity'], ['mechanics', 'Roll'], ['scope', 'Targets'], ['outcomes', 'Damage'] ].map(([id, label]) => ({ id, label, fields: fields.value.filter(spec => spec.row === id && visible(spec)) })))
    const extraFields = (id: string) => fields.value.filter(spec => spec.id.startsWith(`${attackExtraPrefix(id)}.`))
    const phaseOptions = computed(() => [{ label: 'All phases', value: 'all' }, ...Array.from({ length: monster.paragonConfig?.enabled || monster.paragonConfig?.poolCount > 1 ? monster.paragonConfig.poolCount || 2 : 0 }, (_, index) => ({ label: `Phase / pool ${index + 1}`, value: String(index + 1) }))])
    const previewHtml = computed(() => attack.value ? sanitizeWebString(processAttack(attack.value, monster)) : '')
    const previewClasses = computed(() => ['statblock', editor.style === '2014' ? 'mm2014' : 'mm2024', { 'modern-modular': editor.visualTemplate === 'modern' }, `theme-${editor.visualTheme || 'wotc'}`])
    const saveTemplate = () => {
      const current = attack.value
      if (!current) return
      $q.dialog({ component: NewTemplateDialog, componentProps: { targetName: current.name } }).onOk(({ name, icon }: { name: string; icon: string }) => {
        const latest = attack.value
        if (latest) { templates.addCustomAttack(latest, name, icon); $q.notify({ message: t('editor.template.added', [name]), type: 'positive' }) }
      })
    }
    return { monster, attack, rows, cell, value, validate, commit, extraFields, phaseOptions, previewHtml, previewClasses, saveTemplate, t }
  },
})
</script>

<style scoped src="./composer-chain.css"></style>

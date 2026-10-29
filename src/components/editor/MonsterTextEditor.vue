<template>
  <div class="column full-width">
    <q-editor
      ref="editorRef"
      :model-value="$props.modelValue !== undefined ? $props.modelValue : $props.field"
      :toolbar="toolbarOptions"
      :definitions="toolbarDefinitions"
      class="full-width q-ma-xs"
      @update:model-value="(value) => throttledUpdate(value)"
    >
      <template #title>
        <div
          class="text-subtitle2"
          style="display: flex; align-items: center; height: 100%"
        >
          {{ displayTitle }}
        </div>
      </template>
      <template #saves>
        <q-btn-dropdown
          ref="saveTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          :label="$t('editor.statSave')"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in saveTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
              <q-item-section side class="text-caption text-amber-3">{{ resolveTokenPreview(token.token) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #attacks>
        <q-btn-dropdown
          ref="attackTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          :label="$t('editor.attackMod')"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in attackTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
              <q-item-section side class="text-caption text-cyan-3">{{ resolveTokenPreview(token.token) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #abilities>
        <q-btn-dropdown
          ref="abilityTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          label="Stats &amp; Mods"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in abilityTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
              <q-item-section side class="text-caption text-green-3">{{ resolveTokenPreview(token.token) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #formulas>
        <q-btn-dropdown
          ref="formulaTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          label="Dice &amp; Tiers"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in formulaTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
              <q-item-section side class="text-caption text-orange-3">{{ resolveTokenPreview(token.token) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #delivery>
        <q-btn-dropdown
          ref="deliveryTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          label="Delivery"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in deliveryTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #conditions>
        <q-btn-dropdown
          ref="conditionTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          label="Riders"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in conditionTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #monster-tokens>
        <q-btn-dropdown
          ref="monsterTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          :label="$t('editor.monsterToken')"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in monsterTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
              <q-item-section side class="text-caption text-purple-3">{{ resolveTokenPreview(token.token) }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template #context-tokens>
        <q-btn-dropdown
          v-if="contextTokens != null && contextTokenLabel"
          ref="contextTokenRef"
          dense
          no-caps
          no-wrap
          unelevated
          :label="$t(contextTokenLabel)"
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in contextTokens"
              :key="token.token"
              clickable
              @click="add(token.token)"
            >
              <q-item-section>{{ token.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
    </q-editor>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { QBtnDropdown } from 'quasar'
import { MonsterContextType } from '../rendering/useProcessTokens'
import { useTokens } from './useTokens'
import { useI18n } from 'vue-i18n'
import { useMonsterStore } from 'src/stores/monster-store'
import { useProcessTokens } from '../rendering/useProcessTokens'

export default defineComponent({
  name: 'MonsterTextEditor',
  props: {
    field: { required: false, type: String, default: '' },
    modelValue: { type: String, default: undefined },
    label: { type: String, default: '' },
    tokenCategory: {
      type: String as PropType<MonsterContextType>,
      default: 'none',
    },
    i18nLabelKey: { required: false, type: String, default: '' },
    showReset: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'reset'],
  setup(props, ctx) {
    const { t } = useI18n()
    const monster = useMonsterStore()
    const editorRef = ref<any>(null)
    const monsterTokenRef = ref<QBtnDropdown | null>(null)
    const attackTokenRef = ref<QBtnDropdown | null>(null)
    const saveTokenRef = ref<QBtnDropdown | null>(null)
    const contextTokenRef = ref<QBtnDropdown | null>(null)
    const abilityTokenRef = ref<QBtnDropdown | null>(null)
    const formulaTokenRef = ref<QBtnDropdown | null>(null)
    const deliveryTokenRef = ref<QBtnDropdown | null>(null)
    const conditionTokenRef = ref<QBtnDropdown | null>(null)

    const tokenSearch = ref('')
    const tokens = useTokens()
    const { processTokens: renderTokens } = useProcessTokens()

    const displayTitle = computed(() => {
      if (props.label) return props.label
      if (props.i18nLabelKey) {
        try {
          return t(props.i18nLabelKey)
        } catch {
          return props.i18nLabelKey
        }
      }
      return ''
    })

    const toolbarOptions = ref([
      ['title'],
      ['bold', 'italic', 'underline'],
      ['undo', 'redo'],
      ['saves', 'attacks', 'abilities', 'formulas', 'delivery', 'conditions', 'monster-tokens', 'context-tokens'],
    ])

    if (props.showReset) {
      toolbarOptions.value.push(['reset'])
    }

    const toolbarDefinitions = ref({
      reset: {
        tip: t('editor.resetTip'),
        icon: 'restart_alt',
        handler: () => ctx.emit('reset'),
      },
    })

    const throttledUpdate = (value: string) => {
      ctx.emit('update:modelValue', value)
    }

    const add = (token: string) => {
      const edit = editorRef.value as any

      monsterTokenRef.value?.hide()
      saveTokenRef.value?.hide()
      attackTokenRef.value?.hide()
      contextTokenRef.value?.hide()
      abilityTokenRef.value?.hide()
      formulaTokenRef.value?.hide()
      deliveryTokenRef.value?.hide()
      conditionTokenRef.value?.hide()

      if (edit && edit.caret) {
        edit.caret.restore()
        edit.runCmd('insertHTML', `${token}`)
        edit.focus()
      } else {
        const currentVal = props.modelValue !== undefined ? props.modelValue : props.field
        ctx.emit('update:modelValue', (currentVal || '') + token)
      }
    }

    // Live value of a token, rendered exactly as the stat block renders it (markup stripped)
    const resolveTokenPreview = (tokenStr: string): string => {
      try {
        const rendered = renderTokens(tokenStr, undefined, monster, 'none')
        return String(rendered ?? '').replace(/<[^>]*>/g, '').trim() || tokenStr
      } catch {
        return tokenStr
      }
    }

    const allIntellisenseTokens = computed(() => [
      { label: 'Monster Name', token: '{NAME}' },
      { label: 'STR Modifier', token: '{STR_MOD}' },
      { label: 'DEX Modifier', token: '{DEX_MOD}' },
      { label: 'CON Modifier', token: '{CON_MOD}' },
      { label: 'INT Modifier', token: '{INT_MOD}' },
      { label: 'WIS Modifier', token: '{WIS_MOD}' },
      { label: 'CHA Modifier', token: '{CHA_MOD}' },
      { label: 'Save DC (STR)', token: '{DC:STR}' },
      { label: 'Save DC (DEX)', token: '{DC:DEX}' },
      { label: 'Save DC (CON)', token: '{DC:CON}' },
      { label: 'Save DC (INT)', token: '{DC:INT}' },
      { label: 'Save DC (WIS)', token: '{DC:WIS}' },
      { label: 'Save DC (CHA)', token: '{DC:CHA}' },
      { label: 'Attack Mod (STR)', token: '{A:STR}' },
      { label: 'Attack Mod (DEX)', token: '{A:DEX}' },
      { label: 'Proficiency Bonus', token: '{PROF}' },
      { label: 'Cantrip Tier', token: '{CANTRIP_TIER}' },
      { label: 'Scaling Tier', token: '{TIER}' },
      { label: '1d10 + CHA Damage', token: '{1d10 + CHA_MOD}' },
      { label: '2d6 + STR Damage', token: '{2d6 + STR_MOD}' },
      { label: '1d8 + DEX Damage', token: '{1d8 + DEX_MOD}' },
      { label: '2d8 + CON Damage', token: '{2d8 + CON_MOD}' },
      { label: 'Armor Class', token: '{AC}' },
      { label: 'Hit Points', token: '{HP}' },
    ])

    const suggestedTokens = computed(() => {
      const q = tokenSearch.value.trim().toLowerCase().replace(/^\{/, '').replace(/\}$/, '')
      const list = allIntellisenseTokens.value.map((t) => ({
        ...t,
        preview: resolveTokenPreview(t.token),
      }))
      if (!q) {
        return list.slice(0, 7)
      }
      return list
        .filter((t) => t.token.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
        .slice(0, 10)
    })

    const contextTokens = computed(() => {
      if (props.tokenCategory === 'trait') {
        return tokens.traitTokens.value
      } else if (props.tokenCategory === 'spell') {
        return tokens.spellTokens.value
      } else if (props.tokenCategory === 'attack') {
        return tokens.attackDamageTokens.value
      } else if (props.tokenCategory === 'action') {
        return tokens.actionTokens.value
      } else if (props.tokenCategory === 'legendary') {
        return tokens.legendaryTokens.value
      }
      return null
    })

    const contextTokenLabel = computed(() => {
      if (props.tokenCategory === 'trait') {
        return 'editor.trait'
      } else if (props.tokenCategory === 'spell') {
        return 'editor.spellcasting.label'
      } else if (props.tokenCategory === 'attack') {
        return 'editor.attack.customRenderer'
      } else if (props.tokenCategory === 'action') {
        return 'editor.action.tokenLabel'
      } else if (props.tokenCategory === 'legendary') {
        return 'editor.legendary.label'
      }
      return ''
    })

    return {
      monsterTokenRef,
      attackTokenRef,
      saveTokenRef,
      contextTokenRef,
      abilityTokenRef,
      formulaTokenRef,
      deliveryTokenRef,
      conditionTokenRef,
      editorRef,
      tokenSearch,
      allIntellisenseTokens,
      suggestedTokens,
      resolveTokenPreview,
      add,
      ...tokens,
      contextTokens,
      contextTokenLabel,
      displayTitle,
      throttledUpdate,
      toolbarOptions,
      toolbarDefinitions,
    }
  },
})
</script>

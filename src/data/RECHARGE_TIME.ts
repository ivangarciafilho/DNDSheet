import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cadenceDefinition } from 'src/core/domain/cadence'
import enUsLocale from '../i18n/en-US/index'

export function useRechargeTimes() {
  const { t } = useI18n()
  const rechargeTimeOptions = computed(() => {
    return Object.keys(enUsLocale.recharge).map((k: string) => {
      const definition = cadenceDefinition(k)
      const meta = { category: definition?.category || 'Saved values', color: definition?.kind === 'event' ? 'amber-7' : 'cyan-6', icon: definition?.kind === 'rest' ? 'fa-solid fa-bed' : 'fa-solid fa-clock' }
      return {
        label: t(`recharge.${k}`),
        value: k,
        category: meta.category,
        color: meta.color,
        icon: meta.icon,
      }
    }).sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label))
  })

  return {
    rechargeTimeOptions,
    rechargeTimeKeys: Object.keys(enUsLocale.recharge),
  }
}

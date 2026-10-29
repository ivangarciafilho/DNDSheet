import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import enUsLocale from '../i18n/en-US/index'

const RECHARGE_META: Record<string, { category: string; color: string; icon: string }> = {
  START_OF_ITS_TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-play' },
  START_OF_A_TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-forward-step' },
  END_OF_ITS_TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-stop' },
  END_OF_A_TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-backward-step' },
  END_OF_CURRENT_TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-hourglass-end' },
  TURN: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-rotate-right' },
  ROUND: { category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-arrows-spin' },
  MINUTE: { category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-stopwatch' },
  HOUR: { category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-clock' },
  DAY: { category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-calendar-day' },
  DAWN: { category: 'Solar Cycle', color: 'amber-7', icon: 'fa-solid fa-sun' },
  DUSK: { category: 'Solar Cycle', color: 'deep-orange-6', icon: 'fa-solid fa-cloud-sun' },
  MIDDAY: { category: 'Solar Cycle', color: 'yellow-8', icon: 'fa-solid fa-certificate' },
  MIDNIGHT: { category: 'Solar Cycle', color: 'indigo-6', icon: 'fa-solid fa-moon' },
  SHORT_REST: { category: 'Rest & Recovery', color: 'green-6', icon: 'fa-solid fa-campground' },
  LONG_REST: { category: 'Rest & Recovery', color: 'green-7', icon: 'fa-solid fa-bed' },
  REST: { category: 'Rest & Recovery', color: 'green-6', icon: 'fa-solid fa-campground' },
  DOWNTIME: { category: 'Rest & Recovery', color: 'blue-grey-6', icon: 'fa-solid fa-house-chimney' },
}

export function useRechargeTimes() {
  const { t } = useI18n()
  const rechargeTimeOptions = computed(() => {
    return Object.keys(enUsLocale.recharge).map((k: string) => {
      const meta = RECHARGE_META[k] || { category: 'Interval', color: 'primary', icon: 'fa-solid fa-clock' }
      return {
        label: t(`recharge.${k}`),
        value: k,
        category: meta.category,
        color: meta.color,
        icon: meta.icon,
      }
    })
  })

  return {
    rechargeTimeOptions,
    rechargeTimeKeys: Object.keys(enUsLocale.recharge),
  }
}

import { boot } from 'quasar/wrappers'
import type { DirectiveBinding } from 'vue'

/**
 * v-help="'text'": a plain-language tip on any control (A13.3). It sets the native tooltip and an
 * accessible description, so it works on Quasar fields without a slot and costs nothing to render.
 */
const apply = (el: HTMLElement, binding: DirectiveBinding<string | undefined>) => {
  const text = (binding.value ?? '').trim()
  if (!text) {
    el.removeAttribute('title')
    el.removeAttribute('aria-description')
    delete el.dataset.helpText
    return
  }
  el.setAttribute('title', text)
  el.setAttribute('aria-description', text)
  el.dataset.helpText = text
}

export default boot(({ app }) => {
  app.directive('help', { mounted: apply, updated: apply })
})

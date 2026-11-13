import { boot } from 'quasar/wrappers'
import MechanicTextEditor from 'src/components/editor/MechanicTextEditor.vue'

/**
 * The standard text field: plain text by default, rich text on demand, formulas and macros from the
 * shared catalog. Registered globally so every editor uses the same field without its own import.
 */
export default boot(({ app }) => {
  app.component('MechanicTextEditor', MechanicTextEditor)
})

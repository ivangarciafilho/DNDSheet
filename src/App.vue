<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent, onMounted, provide } from 'vue'
import { useQuasar } from 'quasar'
import { useTextRenderer } from './components/rendering/useTextRenderer'
import { useMonsterStore } from './stores/monster-store'

export default defineComponent({
  name: 'App',
  setup() {
    const textRenderer = useTextRenderer()

    provide('textRenderer', textRenderer)

    // on load validation
    const monsterStore = useMonsterStore()
    monsterStore.validate()

    // Saved work lives in this browser for this address only (each port or domain has its own storage).
    const $q = useQuasar()
    const HINT_KEY = 'dndsheet.storageHintSeen'
    onMounted(() => {
      let seen = true
      try { seen = localStorage.getItem(HINT_KEY) === '1' } catch { /* storage blocked: skip the hint */ }
      if (seen) return
      $q.notify({
        message: `Your monsters are saved in this browser for ${window.location.host} only. To bring work from another address or device, export it there as JSON and use Import here.`,
        timeout: 0,
        multiLine: true,
        color: 'grey-9',
        icon: 'info',
        actions: [{ label: 'Got it', color: 'amber', handler: () => { try { localStorage.setItem(HINT_KEY, '1') } catch { /* ignore */ } } }],
      })
    })
  },
})
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: 12px;
  background-color: rgb(18, 18, 18);
}

::-webkit-scrollbar-track {
  margin-left: 2px;
}

::-webkit-scrollbar-thumb {
  background: #505050;
  border: solid 2px #202020;
  border-radius: 7px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b6b6b6;
}

.full-height::-webkit-scrollbar,
.v-dialog::-webkit-scrollbar {
  display: block;
}

.v-menu__content::-webkit-scrollbar {
  display: block;
}

a {
  // light blue
  color: #03a9f4;
  text-decoration: none;
}

a:hover {
  // light blue 3
  color: #81d4fa;
}

@media print {
  #main-nav,
  #editor,
  #footer {
    display: none;
  }

  #splitter {
    overflow: visible;
    height: unset !important;

    .q-splitter__panel.q-splitter__before {
      width: 0px !important;
    }
  }

  #renderer {
    max-width: 100% !important;
    flex: 0 0 100% !important;
    height: 100%;
    overflow: visible;
  }

  .v-main {
    padding: 0 !important;
  }
}
</style>

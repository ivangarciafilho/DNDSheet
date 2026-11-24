<template>
  <q-btn round flat icon="cloud_upload" @click="importDialog = true">
    <q-tooltip class="text-body2">{{ $t('import.tooltip') }}</q-tooltip>
  </q-btn>
  <q-dialog v-model="importDialog">
    <q-card class="q-dialog-plugin" style="width: 50vw">
      <q-card-section
        ><div class="text-h6">
          {{ $t('import.title') }}
        </div></q-card-section
      >
      <q-separator />
      <q-card-section class="q-pt-md">
        <div class="q-mb-md">
          <i18n-t keypath="import.help">
            <a href="https://open5e.com/" target="_blank">{{
              $t('import.open5eLink')
            }}</a>
          </i18n-t>
        </div>
        <!-- CatalogSelect exemption (A16.2): async paginated Open5e API selector with virtual-scroll paging and custom item avatars. -->
        <q-select
          v-model="selectedName"
          v-help="'Search Open5e SRD monsters by name to import stats, actions, and traits into the active sheet.'"
          filled
          use-input
          hide-selected
          fill-input
          emit-value
          :hint="status"
          :label="$t('import.label')"
          :options="options"
          :disable="loadingData"
          style="width: 100%"
          @filter="apiSearch"
          @virtual-scroll="appendOptions"
        >
          <template #after>
            <q-btn
              color="green-9"
              :disable="importInvalid || loadingData"
              :loading="loadingData"
              @click="loadData"
              >{{ $t('import.import') }}</q-btn
            >
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-avatar color="primary">{{ scope.opt.cr }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption
                  >{{ scope.opt.description }}<br />{{
                    scope.opt.source
                  }}</q-item-label
                >
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <div class="q-pt-md text-caption">
          {{ $t('import.additional') }}
        </div>
        <q-separator class="q-my-md" />
        <div data-offline-import-section>
          <div class="text-subtitle2 q-mb-xs">{{ $t('studio.offlineImport.heading') }}</div>
          <div class="text-caption q-mb-sm">{{ $t('studio.offlineImport.hint') }}</div>
          <q-input
            v-model="rawImportText"
            v-help="$t('studio.offlineImport.hint')"
            type="textarea"
            filled
            autogrow
            :input-style="{ maxHeight: '140px' }"
            :placeholder="$t('studio.offlineImport.pastePlaceholder')"
            data-offline-import-textarea
          />
          <div class="row q-gutter-sm q-mt-sm">
            <q-btn
              dense
              unelevated
              no-caps
              color="primary"
              icon="content_paste_go"
              :disable="!rawImportText.trim()"
              :label="$t('studio.offlineImport.importText')"
              data-offline-import-paste-btn
              @click="importOfflinePaste"
            />
            <q-btn
              dense
              outline
              no-caps
              color="secondary"
              icon="upload_file"
              :label="$t('studio.offlineImport.importFile')"
              data-offline-import-file-btn
              @click="offlineFileInput?.click()"
            />
            <input
              ref="offlineFileInput"
              type="file"
              accept=".json,.md,.markdown,.txt"
              style="display: none"
              @change="onOfflineFilePicked"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-close-popup
          flat
          :label="$t('editor.cancel')"
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QSelect, useQuasar } from 'quasar'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpen5eImport } from './importers/useOpen5eImport'
import { Open5eMonster, Open5eMonsterResponse } from './Open5eData'
import { useFileLoader } from './useFileLoader'

const { t } = useI18n()
const { importRawTextStatblock, loadFile } = useFileLoader()
const rawImportText = ref('')
const offlineFileInput = ref<HTMLInputElement | null>(null)

const API_ROOT = 'https://api.open5e.com/v1/monsters/'
const monsterResults = ref<Open5eMonster[]>([])
const selectedName = ref('')
const next = ref<string | null>(null)
const prev = ref<string | null>(null)
const count = ref<number>(0)
const loading = ref(false)
const loadingData = ref(false)

// might include extra data for rendering too
const options = computed(() =>
  monsterResults.value.map((m) => ({
    value: m.name,
    label: m.name,
    source: m.document__title,
    cr: m.challenge_rating,
    description: `${m.size} ${m.type}${
      m.subtype === '' ? '' : ` ${m.subtype}`
    }, ${m.alignment}`,
  }))
)

const importDialog = ref(false)
const importInvalid = computed(
  () => options.value.findIndex((m) => m.value === selectedName.value) === -1
)
const status = computed(() => {
  if (monsterResults.value.length === 0) {
    return t('import.results', 0)
  } else {
    return t('import.description', [
      monsterResults.value.length,
      t('import.results', count.value),
    ])
  }
})

const apiSearch = async (
  val: string,
  update: (callbackFn: () => void, afterFn?: (ref: QSelect) => void) => void,
  abort: () => void
) => {
  loading.value = true
  try {
    // construct the api query
    const apiQuery = `${API_ROOT}?search=${val.toLowerCase()}`
    const apiResults = await fetch(apiQuery)
    const apiData = (await apiResults.json()) as Open5eMonsterResponse

    next.value = apiData.next
    prev.value = apiData.previous
    count.value = apiData.count

    update(() => {
      monsterResults.value = apiData.results
    })
  } catch (e) {
    console.error(e)
    abort()

    update(() => (monsterResults.value = []))
  }

  loading.value = false
}

const appendOptions = async ({ to, ref }: { to: number; ref: QSelect }) => {
  const lastIndex = monsterResults.value.length - 1

  if (loading.value !== true && to === lastIndex && next.value) {
    loading.value = true

    // load the next page
    const apiQuery = next.value
    const apiResults = await fetch(apiQuery)
    const apiData = (await apiResults.json()) as Open5eMonsterResponse

    next.value = apiData.next
    prev.value = apiData.previous
    count.value = apiData.count
    monsterResults.value.push(...apiData.results)

    nextTick(() => {
      ref.refresh()
      loading.value = false
    })
  }
}

const { importOpen5eMonster } = useOpen5eImport()
const $q = useQuasar()
const loadData = async () => {
  loadingData.value = true

  setTimeout(() => {
    // find the monster first
    const selectedMonster = monsterResults.value.find(
      (m) => m.name === selectedName.value
    )

    if (selectedMonster) {
      const result = importOpen5eMonster(selectedMonster)

      if (result) {
        importDialog.value = false
      }
    } else {
      $q.notify({
        message: t('import.error.notFound'),
        type: 'negative',
      })
    }

    loadingData.value = false
  }, 100)
}

const importOfflinePaste = () => {
  if (importRawTextStatblock(rawImportText.value)) {
    rawImportText.value = ''
    importDialog.value = false
  }
}

const onOfflineFilePicked = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (file) {
    loadFile(file)
    importDialog.value = false
  }
  if (input) input.value = ''
}
</script>

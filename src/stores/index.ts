import { store } from 'quasar/wrappers';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { Notify } from 'quasar';
import messages from 'src/i18n';
import { createOverflowStorage } from 'src/core/domain/overflow-storage';
import { indexedDbSnapshots, LARGE_SNAPSHOT_KEYS } from 'src/core/adapters/IndexedDbAutosave';
import { installMonsterBindings } from './binding-runtime';

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store(async (/* { ssrContext } */) => {
  const pinia = createPinia();

  // You can add Pinia plugins here
  // B5.8: every store persists through a storage that tells the user when a save fails (quota, blocked storage).
  const saveFailed = (messages as Record<string, { io?: { saveFailed?: string } }>)['en-US']?.io?.saveFailed ?? 'Changes could not be saved in this browser.';
  pinia.use(createPersistedState({
    storage: await createOverflowStorage(
      () => (typeof window !== 'undefined' ? window.localStorage : undefined),
      indexedDbSnapshots,
      LARGE_SNAPSHOT_KEYS,
      (error, key) => {
        console.error('save failed', key, error);
        const message = key === 'app.editor'
          ? 'Your editor layout could not be saved. Keep this tab open to preserve your changes.'
          : saveFailed;
        Notify.create({ type: 'negative', message, timeout: 0, actions: [{ label: 'OK', color: 'white' }] });
      },
    ),
  }));
  pinia.use(installMonsterBindings);

  return pinia;
});

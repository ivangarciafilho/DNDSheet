import { store } from 'quasar/wrappers';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { Notify } from 'quasar';
import messages from 'src/i18n';
import { createGuardedStorage } from 'src/core/domain/guarded-storage';
import { installMonsterBindings } from './binding-runtime';

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store((/* { ssrContext } */) => {
  const pinia = createPinia();

  // You can add Pinia plugins here
  // B5.8: every store persists through a storage that tells the user when a save fails (quota, blocked storage).
  const saveFailed = (messages as Record<string, { io?: { saveFailed?: string } }>)['en-US']?.io?.saveFailed ?? 'Changes could not be saved in this browser.';
  pinia.use(createPersistedState({
    storage: createGuardedStorage(
      () => (typeof window !== 'undefined' ? window.localStorage : undefined),
      (error) => {
        console.error('save failed', error);
        Notify.create({ type: 'negative', message: saveFailed, timeout: 0, actions: [{ label: 'OK', color: 'white' }] });
      },
    ),
  }));
  pinia.use(installMonsterBindings);

  return pinia;
});

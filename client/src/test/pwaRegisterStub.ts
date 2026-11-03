// Stands in for the virtual module that vite-plugin-pwa creates at build time, so unit
// tests can render PwaPrompt. Tests drive it through `pwaState`.
export const pwaState = {
  needRefresh: false,
  offlineReady: false,
  setNeedRefresh: (_: boolean) => {},
  setOfflineReady: (_: boolean) => {},
  updateServiceWorker: (_?: boolean) => {},
};

export const useRegisterSW = () => ({
  needRefresh: [pwaState.needRefresh, (v: boolean) => pwaState.setNeedRefresh(v)] as const,
  offlineReady: [pwaState.offlineReady, (v: boolean) => pwaState.setOfflineReady(v)] as const,
  updateServiceWorker: (reload?: boolean) => pwaState.updateServiceWorker(reload),
});

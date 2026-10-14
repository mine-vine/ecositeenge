import { useSyncExternalStore } from 'react'

// Тёмная тема задаётся классом на <html> (см. useTheme). Подписываемся на его изменения,
// чтобы графики перекрашивались при переключении темы.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => obs.disconnect()
}

export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, () => document.documentElement.classList.contains('dark'))
}

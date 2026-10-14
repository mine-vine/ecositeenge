import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Series } from '../lib/data/types'
import { DatasetContext, type DatasetApi } from './datasetContext'

// Рабочий набор рядов: то, что пользователь загрузил или рассчитал. Хранится в localStorage
// этого браузера, чтобы не терять данные при перезагрузке страницы.

const STORAGE_KEY = 'econometr.dataset.v1'
const MAX_BYTES = 4_000_000

function load(): Series[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as Series[]) : []
  } catch {
    return []
  }
}

/** Сохраняет набор; false — не поместился в localStorage */
function save(series: Series[]): boolean {
  try {
    const raw = JSON.stringify(series)
    if (raw.length > MAX_BYTES) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    localStorage.setItem(STORAGE_KEY, raw)
    return true
  } catch {
    return false
  }
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>(load)
  const [persisted, setPersisted] = useState(true)
  const current = useRef(series)

  const update = useCallback((fn: (cur: Series[]) => Series[]) => {
    const next = fn(current.current)
    current.current = next
    setSeries(next)
    setPersisted(save(next))
  }, [])

  const add = useCallback(
    (items: Series[]) =>
      update((cur) => {
        const keys = new Set(items.map((s) => s.key))
        return [...cur.filter((s) => !keys.has(s.key)), ...items]
      }),
    [update],
  )
  const remove = useCallback((key: string) => update((cur) => cur.filter((s) => s.key !== key)), [update])
  const clear = useCallback(() => update(() => []), [update])

  const api = useMemo<DatasetApi>(
    () => ({ series, add, remove, clear, has: (key) => series.some((s) => s.key === key), persisted }),
    [series, add, remove, clear, persisted],
  )
  return <DatasetContext.Provider value={api}>{children}</DatasetContext.Provider>
}

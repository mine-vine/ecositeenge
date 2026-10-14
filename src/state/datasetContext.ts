import { createContext, useContext } from 'react'
import type { Series } from '../lib/data/types'

export interface DatasetApi {
  series: Series[]
  add: (items: Series[]) => void
  remove: (key: string) => void
  clear: () => void
  has: (key: string) => boolean
  /** false — набор слишком большой для localStorage и не сохранится после перезагрузки */
  persisted: boolean
}

export const DatasetContext = createContext<DatasetApi | null>(null)

export function useDataset(): DatasetApi {
  const ctx = useContext(DatasetContext)
  if (!ctx) throw new Error('useDataset вне DatasetProvider')
  return ctx
}

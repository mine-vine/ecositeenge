// Клиент FRED API через прокси (см. server/fredProxy.ts).
import type { Frequency, Point, Series } from './types'

const PROXY = (import.meta.env.VITE_FRED_PROXY as string | undefined) ?? '/api/fred'
const KEY_STORAGE = 'fred.apiKey'

export class FredError extends Error {
  /** true — проблема с ключом: стоит предложить ввести свой */
  needsKey: boolean
  constructor(message: string, needsKey = false) {
    super(message)
    this.needsKey = needsKey
  }
}

export function getUserKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setUserKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // без localStorage ключ просто не запомнится
  }
}

async function call<T>(method: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params)
  const key = getUserKey()
  if (key) qs.set('api_key', key)
  let res: Response
  try {
    res = await fetch(`${PROXY}/${method}?${qs}`)
  } catch {
    throw new FredError('Не удалось связаться с прокси FRED. Проверьте подключение к интернету.')
  }
  let body: unknown
  try {
    body = await res.json()
  } catch {
    // Статический хостинг без прокси отдаёт index.html вместо JSON
    throw new FredError('Прокси FRED не настроен на этом сервере. См. раздел «FRED» в README.')
  }
  const err = body as { error_code?: number; error_message?: string }
  if (!res.ok || err.error_message) {
    const msg = err.error_message ?? `ошибка ${res.status}`
    const needsKey = res.status === 401 || /api_key/i.test(msg)
    throw new FredError(needsKey ? 'Нужен действующий API-ключ FRED.' : `FRED: ${msg}`, needsKey)
  }
  return body as T
}

export interface FredSeriesInfo {
  id: string
  title: string
  frequency_short: string
  units: string
  units_short: string
  seasonal_adjustment_short: string
  observation_start: string
  observation_end: string
  last_updated: string
  popularity: number
  notes?: string
}

/** Популярные ряды для быстрого старта */
export const popularFred: { id: string; label: string }[] = [
  { id: 'GDPC1', label: 'Реальный ВВП США' },
  { id: 'CPIAUCSL', label: 'ИПЦ США' },
  { id: 'UNRATE', label: 'Безработица США' },
  { id: 'FEDFUNDS', label: 'Ставка ФРС' },
  { id: 'DGS10', label: 'Доходность UST 10 лет' },
  { id: 'PAYEMS', label: 'Занятость вне с/х' },
  { id: 'M2SL', label: 'Денежная масса M2' },
  { id: 'INDPRO', label: 'Промпроизводство США' },
]

export async function searchSeries(text: string): Promise<FredSeriesInfo[]> {
  const r = await call<{ seriess?: FredSeriesInfo[] }>('series/search', {
    search_text: text,
    limit: '40',
    order_by: 'popularity',
    sort_order: 'desc',
  })
  return r.seriess ?? []
}

export async function getSeriesInfo(id: string): Promise<FredSeriesInfo> {
  const r = await call<{ seriess?: FredSeriesInfo[] }>('series', { series_id: id })
  if (!r.seriess?.[0]) throw new FredError(`Ряд ${id} не найден.`)
  return r.seriess[0]
}

/** Частота FRED → наша. BW (раз в две недели) считаем недельной, SA — полугодовой. */
export function mapFrequency(f: string): Frequency {
  switch (f) {
    case 'A':
      return 'A'
    case 'SA':
      return 'S'
    case 'Q':
      return 'Q'
    case 'M':
      return 'M'
    case 'W':
    case 'BW':
      return 'W'
    default:
      return 'D'
  }
}

/** Наблюдения FRED: значение «.» означает пропуск */
export function parseObservations(obs: { date: string; value: string }[]): Point[] {
  return obs.map((o) => {
    const v = Number(o.value)
    return { date: o.date, value: o.value === '.' || !Number.isFinite(v) ? null : v }
  })
}

export async function fetchSeries(id: string, from?: string): Promise<Series> {
  const info = await getSeriesInfo(id)
  const params: Record<string, string> = { series_id: id }
  if (from) params.observation_start = from
  const r = await call<{ observations?: { date: string; value: string }[] }>('series/observations', params)
  const sa = info.seasonal_adjustment_short && info.seasonal_adjustment_short !== 'NSA' ? `, ${info.seasonal_adjustment_short}` : ''
  return {
    key: `fred:${info.id}`,
    source: 'fred',
    id: info.id,
    title: info.title,
    units: `${info.units_short || info.units}${sa}`,
    frequency: mapFrequency(info.frequency_short),
    points: parseObservations(r.observations ?? []),
    url: `https://fred.stlouisfed.org/series/${info.id}`,
    retrievedAt: new Date().toISOString(),
  }
}

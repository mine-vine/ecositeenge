// Клиент World Bank Indicators API v2 (https://api.worldbank.org/v2). Ключ не нужен, CORS разрешён.
import type { Frequency, Point, Series } from './types'

const BASE = 'https://api.worldbank.org/v2'

export interface WbCountry {
  /** ISO3, используется в запросах */
  id: string
  iso2: string
  name: string
  /** Регион или группа (агрегат) */
  region: string
  isAggregate: boolean
}

export interface WbIndicator {
  id: string
  name: string
  /** Русское название для избранных показателей */
  nameRu?: string
  note?: string
  sourceOrg?: string
}

/** Популярные показатели WDI с русскими названиями — показываются первыми */
export const popularIndicators: WbIndicator[] = [
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', nameRu: 'ВВП, текущие долл. США' },
  { id: 'NY.GDP.MKTP.KD', name: 'GDP (constant 2015 US$)', nameRu: 'ВВП в постоянных ценах 2015 г., долл. США' },
  { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP growth (annual %)', nameRu: 'Рост реального ВВП, % г/г' },
  { id: 'NY.GDP.PCAP.CD', name: 'GDP per capita (current US$)', nameRu: 'ВВП на душу населения, текущие долл. США' },
  { id: 'NY.GDP.PCAP.PP.KD', name: 'GDP per capita, PPP (constant international $)', nameRu: 'ВВП на душу населения по ППС, постоянные междунар. долл.' },
  { id: 'FP.CPI.TOTL.ZG', name: 'Inflation, consumer prices (annual %)', nameRu: 'Инфляция, потребительские цены, % г/г' },
  { id: 'FP.CPI.TOTL', name: 'Consumer price index (2010 = 100)', nameRu: 'Индекс потребительских цен (2010 = 100)' },
  { id: 'NY.GDP.DEFL.KD.ZG', name: 'Inflation, GDP deflator (annual %)', nameRu: 'Инфляция по дефлятору ВВП, % г/г' },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment, total (% of total labor force) (modeled ILO estimate)', nameRu: 'Безработица, % рабочей силы (оценка МОТ)' },
  { id: 'SP.POP.TOTL', name: 'Population, total', nameRu: 'Население, человек' },
  { id: 'NE.EXP.GNFS.ZS', name: 'Exports of goods and services (% of GDP)', nameRu: 'Экспорт товаров и услуг, % ВВП' },
  { id: 'NE.IMP.GNFS.ZS', name: 'Imports of goods and services (% of GDP)', nameRu: 'Импорт товаров и услуг, % ВВП' },
  { id: 'NE.GDI.TOTL.ZS', name: 'Gross capital formation (% of GDP)', nameRu: 'Валовое накопление капитала, % ВВП' },
  { id: 'BN.CAB.XOKA.GD.ZS', name: 'Current account balance (% of GDP)', nameRu: 'Сальдо текущего счёта, % ВВП' },
  { id: 'GC.DOD.TOTL.GD.ZS', name: 'Central government debt, total (% of GDP)', nameRu: 'Долг центрального правительства, % ВВП' },
  { id: 'GC.TAX.TOTL.GD.ZS', name: 'Tax revenue (% of GDP)', nameRu: 'Налоговые доходы, % ВВП' },
  { id: 'BX.KLT.DINV.WD.GD.ZS', name: 'Foreign direct investment, net inflows (% of GDP)', nameRu: 'Прямые иностранные инвестиции, чистый приток, % ВВП' },
  { id: 'PA.NUS.FCRF', name: 'Official exchange rate (LCU per US$, period average)', nameRu: 'Официальный курс, нац. валюта за долл. США (среднее)' },
  { id: 'FR.INR.RINR', name: 'Real interest rate (%)', nameRu: 'Реальная процентная ставка, %' },
  { id: 'NV.IND.TOTL.ZS', name: 'Industry (including construction), value added (% of GDP)', nameRu: 'Промышленность и строительство, % ВВП' },
  { id: 'SI.POV.GINI', name: 'Gini index', nameRu: 'Индекс Джини' },
  { id: 'SP.DYN.LE00.IN', name: 'Life expectancy at birth, total (years)', nameRu: 'Ожидаемая продолжительность жизни при рождении, лет' },
]

export class WbError extends Error {}

async function getJson(url: string): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new WbError('Не удалось связаться с World Bank API. Проверьте подключение к интернету.')
  }
  if (!res.ok) throw new WbError(`World Bank API ответил ошибкой ${res.status}.`)
  try {
    return await res.json()
  } catch {
    throw new WbError('World Bank API вернул некорректный ответ.')
  }
}

type WbPage<T> = [{ page: number; pages: number; total: number } | undefined, T[] | null]

/** Ответ API — массив [метаданные, строки] либо [{ message: [...] }] при ошибке */
function unwrap<T>(json: unknown): WbPage<T> {
  if (Array.isArray(json) && json.length === 1 && json[0] && typeof json[0] === 'object' && 'message' in json[0]) {
    const msg = (json[0] as { message: { value?: string }[] }).message?.[0]?.value
    throw new WbError(`World Bank API: ${msg ?? 'неизвестная ошибка'}`)
  }
  if (!Array.isArray(json) || json.length < 2) throw new WbError('World Bank API вернул неожиданный формат ответа.')
  return json as WbPage<T>
}

/** Загружает все страницы ответа */
async function getAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const out: T[] = []
  let page = 1
  let pages = 1
  do {
    const qs = new URLSearchParams({ format: 'json', per_page: '20000', ...params, page: String(page) })
    const [meta, rows] = unwrap<T>(await getJson(`${BASE}/${path}?${qs}`))
    if (rows) out.push(...rows)
    pages = meta?.pages ?? 1
    page++
  } while (page <= pages && page <= 20)
  return out
}

// ---------------- Страны ----------------

let regionNames: Intl.DisplayNames | null = null
/** Русское название страны по ISO2, если браузер его знает */
export function russianCountryName(iso2: string, fallback: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(['ru'], { type: 'region' })
    const name = regionNames.of(iso2)
    return name && name !== iso2 ? name : fallback
  } catch {
    return fallback
  }
}

interface RawCountry {
  id: string
  iso2Code: string
  name: string
  region: { id: string; value: string }
}

export function parseCountries(rows: RawCountry[]): WbCountry[] {
  return rows
    .map((c) => {
      const isAggregate = c.region?.id === 'NA' || c.region?.value === 'Aggregates'
      return {
        id: c.id,
        iso2: c.iso2Code,
        name: isAggregate ? c.name : russianCountryName(c.iso2Code, c.name),
        region: isAggregate ? 'Группы стран' : c.region.value.trim(),
        isAggregate,
      }
    })
    .sort((a, b) => Number(a.isAggregate) - Number(b.isAggregate) || a.name.localeCompare(b.name, 'ru'))
}

let countriesCache: Promise<WbCountry[]> | null = null
export function fetchCountries(): Promise<WbCountry[]> {
  countriesCache ??= getAll<RawCountry>('country', { per_page: '400' })
    .then(parseCountries)
    .catch((e) => {
      countriesCache = null
      throw e
    })
  return countriesCache
}

// ---------------- Показатели ----------------

interface RawIndicator {
  id: string
  name: string
  sourceNote?: string
  sourceOrganization?: string
}

let indicatorsCache: Promise<WbIndicator[]> | null = null
/** Полный список показателей World Development Indicators (источник 2), ~1500 шт. */
export function fetchIndicators(): Promise<WbIndicator[]> {
  indicatorsCache ??= getAll<RawIndicator>('indicator', { source: '2', per_page: '2000' })
    .then((rows) => {
      const popular = new Map(popularIndicators.map((p) => [p.id, p]))
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameRu: popular.get(r.id)?.nameRu,
        note: r.sourceNote,
        sourceOrg: r.sourceOrganization,
      }))
    })
    .catch((e) => {
      indicatorsCache = null
      throw e
    })
  return indicatorsCache
}

// ---------------- Данные ----------------

interface RawObservation {
  indicator: { id: string; value: string }
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
  unit?: string
}

/** «2020» → 2020-01-01, «2020Q3» → 2020-07-01, «2020M05» → 2020-05-01 */
export function parseWbDate(date: string): { date: string; freq: Frequency } {
  const q = /^(\d{4})Q([1-4])$/.exec(date)
  if (q) return { date: `${q[1]}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, '0')}-01`, freq: 'Q' }
  const m = /^(\d{4})M(\d{2})$/.exec(date)
  if (m) return { date: `${m[1]}-${m[2]}-01`, freq: 'M' }
  return { date: `${date.slice(0, 4)}-01-01`, freq: 'A' }
}

/** Разбирает строки ответа в ряды — по одному на страну */
export function parseObservations(rows: RawObservation[], indicatorName?: string): Series[] {
  const byCountry = new Map<string, RawObservation[]>()
  for (const r of rows) {
    const key = r.countryiso3code || r.country.id
    const list = byCountry.get(key)
    if (list) list.push(r)
    else byCountry.set(key, [r])
  }
  const now = new Date().toISOString()
  return [...byCountry.entries()].map(([iso3, obs]) => {
    let freq: Frequency = 'A'
    const points: Point[] = obs
      .map((o) => {
        const parsed = parseWbDate(o.date)
        freq = parsed.freq
        return { date: parsed.date, value: o.value === null || o.value === undefined ? null : Number(o.value) }
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1))
    const first = obs[0]
    const title = indicatorName ?? first.indicator.value
    return {
      key: `worldbank:${first.indicator.id}:${iso3}`,
      source: 'worldbank' as const,
      id: first.indicator.id,
      title,
      units: first.unit || unitsFromName(first.indicator.value),
      frequency: freq,
      points,
      country: russianCountryName(first.country.id, first.country.value),
      url: `https://data.worldbank.org/indicator/${first.indicator.id}?locations=${first.country.id}`,
      retrievedAt: now,
    }
  })
}

/** Единицы обычно указаны в скобках в конце названия: «GDP (current US$)» */
function unitsFromName(name: string): string {
  const m = /\(([^()]*)\)\s*$/.exec(name)
  return m ? m[1] : ''
}

export async function fetchIndicatorData(indicatorId: string, countries: string[], from?: number, to?: number, indicatorName?: string): Promise<Series[]> {
  if (countries.length === 0) return []
  const params: Record<string, string> = {}
  if (from || to) params.date = `${from ?? 1960}:${to ?? new Date().getFullYear()}`
  const rows = await getAll<RawObservation>(`country/${countries.map(encodeURIComponent).join(';')}/indicator/${encodeURIComponent(indicatorId)}`, params)
  const series = parseObservations(rows, indicatorName)
  if (series.every((s) => s.points.every((p) => p.value === null))) {
    throw new WbError('По выбранным странам и периоду данных нет.')
  }
  return series
}

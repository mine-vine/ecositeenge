import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalcShell, Notice, Panel, Segmented } from '../../components/calc'
import { ChartCard } from '../../components/charts/ChartCard'
import { CountryPicker } from '../../components/data/CountryPicker'
import { DatasetPanel } from '../../components/data/DatasetPanel'
import { IndicatorPicker } from '../../components/data/IndicatorPicker'
import { fetchSeries, FredError, getUserKey, popularFred, searchSeries, setUserKey, type FredSeriesInfo } from '../../lib/data/fred'
import { frequencyLabels, type Series } from '../../lib/data/types'
import { fetchIndicatorData, popularIndicators, type WbIndicator } from '../../lib/data/worldbank'
import { useDataset } from '../../state/datasetContext'
import { YearRange } from '../../components/data/YearRange'
import { useYearRange } from '../../hooks/useYearRange'

type SourceTab = 'worldbank' | 'fred'

export function DataSearchPage() {
  const [params, setParams] = useSearchParams()
  const tab: SourceTab = params.get('source') === 'fred' ? 'fred' : 'worldbank'
  const [loaded, setLoaded] = useState<{ series: Series[]; title: string; subtitle?: string } | null>(null)

  return (
    <CalcShell toolId="data-search">
      <Segmented
        label="Источник"
        value={tab}
        onChange={(v) => {
          setParams(v === 'fred' ? { source: 'fred' } : {}, { replace: true })
          setLoaded(null)
        }}
        options={[
          { value: 'worldbank', label: 'World Bank' },
          { value: 'fred', label: 'FRED (ФРБ Сент-Луиса)' },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">{tab === 'worldbank' ? <WorldBankForm onLoaded={setLoaded} /> : <FredForm onLoaded={setLoaded} />}</div>
        <div className="min-w-0 lg:col-span-3">
          {loaded ? (
            <LoadedResult {...loaded} />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Выберите показатель и загрузите данные — здесь появятся график и таблица.
            </div>
          )}
        </div>
      </div>
      <DatasetPanel />
    </CalcShell>
  )
}

function LoadedResult({ series, title, subtitle }: { series: Series[]; title: string; subtitle?: string }) {
  const { add, has } = useDataset()
  const allAdded = series.every((s) => has(s.key))
  return (
    <div className="space-y-3">
      <ChartCard series={series} title={title} subtitle={subtitle} />
      <button
        type="button"
        onClick={() => add(series)}
        disabled={allAdded}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
      >
        {allAdded ? 'Уже в наборе' : series.length > 1 ? `Добавить в набор (${series.length} ряда)` : 'Добавить в набор'}
      </button>
    </div>
  )
}

const primaryBtn =
  'w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50'

// ---------------- World Bank ----------------

function WorldBankForm({ onLoaded }: { onLoaded: (r: { series: Series[]; title: string; subtitle?: string }) => void }) {
  const [indicator, setIndicator] = useState<WbIndicator | null>(popularIndicators[0])
  const [countries, setCountries] = useState<string[]>(['RUS', 'USA', 'DEU', 'CHN'])
  const range = useYearRange(2000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!indicator || !range.valid) return
    setLoading(true)
    setError(null)
    try {
      const name = indicator.nameRu ?? indicator.name
      const series = await fetchIndicatorData(indicator.id, countries, range.from!, range.to!, name)
      onLoaded({ series, title: name, subtitle: `${indicator.id} · ${range.from}–${range.to}` })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel title="World Bank — World Development Indicators">
      <div className="space-y-4">
        <IndicatorPicker value={indicator} onChange={setIndicator} />
        <CountryPicker value={countries} onChange={setCountries} />
        <YearRange {...range} />
        <button type="button" onClick={load} disabled={loading || !indicator || countries.length === 0 || !range.valid} className={primaryBtn}>
          {loading ? 'Загрузка…' : 'Загрузить данные'}
        </button>
        {error && <Notice>{error}</Notice>}
      </div>
    </Panel>
  )
}

// ---------------- FRED ----------------

function FredForm({ onLoaded }: { onLoaded: (r: { series: Series[]; title: string; subtitle?: string }) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FredSeriesInfo[] | null>(null)
  const [from, setFrom] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<{ text: string; needsKey: boolean } | null>(null)
  const [key, setKey] = useState(getUserKey)
  const [showKey, setShowKey] = useState(false)

  const fail = (e: unknown) => {
    const needsKey = e instanceof FredError && e.needsKey
    setError({ text: e instanceof Error ? e.message : 'Ошибка FRED', needsKey })
    if (needsKey) setShowKey(true)
  }

  const search = async () => {
    if (!query.trim()) return
    setBusy('search')
    setError(null)
    try {
      setResults(await searchSeries(query.trim()))
    } catch (e) {
      fail(e)
    } finally {
      setBusy(null)
    }
  }

  const load = async (id: string) => {
    setBusy(id)
    setError(null)
    try {
      const s = await fetchSeries(id, /^\d{4}$/.test(from) ? `${from}-01-01` : undefined)
      onLoaded({ series: [s], title: s.title, subtitle: `${s.id} · ${s.units} · ${frequencyLabels[s.frequency]}` })
    } catch (e) {
      fail(e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Panel title="FRED — Federal Reserve Economic Data">
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            search()
          }}
        >
          <label htmlFor="fred-q" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Поиск ряда
          </label>
          <div className="flex gap-2">
            <input
              id="fred-q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: inflation euro area, CPIAUCSL"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <button type="submit" disabled={busy !== null || !query.trim()} className="rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
              Найти
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Каталог FRED на английском языке. Можно ввести код ряда.</p>
        </form>

        <div>
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Популярные ряды</span>
          <div className="flex flex-wrap gap-1.5">
            {popularFred.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => load(p.id)}
                disabled={busy !== null}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs hover:border-brand-500 disabled:opacity-50 dark:border-slate-700"
                title={p.id}
              >
                {busy === p.id ? 'Загрузка…' : p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="fred-from" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Начиная с года <span className="font-normal text-slate-500">(необязательно)</span>
          </label>
          <input
            id="fred-from"
            inputMode="numeric"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="вся история"
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        {error && <Notice>{error.text}</Notice>}

        {results && (
          <ul className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            {results.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</li>}
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => load(r.id)}
                  disabled={busy !== null}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className="block">{busy === r.id ? 'Загрузка…' : r.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {r.id} · {r.frequency_short} · {r.units_short} · {r.observation_start.slice(0, 4)}–{r.observation_end.slice(0, 4)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <button type="button" onClick={() => setShowKey((s) => !s)} className="text-xs font-medium text-brand-700 hover:underline dark:text-blue-300">
            {showKey ? 'Скрыть настройки ключа' : 'Свой API-ключ FRED'}
          </button>
          {showKey && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Если на сервере не настроен общий ключ, укажите свой — он бесплатный:{' '}
                <a href="https://fredaccount.stlouisfed.org/apikeys" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline dark:text-blue-300">
                  получить ключ
                </a>
                . Ключ хранится только в этом браузере и передаётся прокси вместе с запросом.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value.trim())}
                  placeholder="32 символа"
                  aria-label="API-ключ FRED"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUserKey(key)
                    setError(null)
                  }}
                  className="rounded-lg border border-slate-300 px-3 text-sm hover:border-brand-500 dark:border-slate-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

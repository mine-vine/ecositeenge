import { useState } from 'react'
import { CalcShell, Notice, Panel } from '../../components/calc'
import { ChartCard } from '../../components/charts/ChartCard'
import { darkChart, lightChart } from '../../components/charts/palette'
import { CountryPicker } from '../../components/data/CountryPicker'
import { DatasetPanel } from '../../components/data/DatasetPanel'
import { IndicatorPicker } from '../../components/data/IndicatorPicker'
import { YearRange } from '../../components/data/YearRange'
import { useIsDark } from '../../hooks/useIsDark'
import { useYearRange } from '../../hooks/useYearRange'
import type { Series } from '../../lib/data/types'
import { fetchIndicatorData, popularIndicators, type WbIndicator } from '../../lib/data/worldbank'
import { fmtCompact, fmtSmart } from '../../lib/format'
import { useDataset } from '../../state/datasetContext'

interface Loaded {
  series: Series[]
  indicator: WbIndicator
  from: number
  to: number
}

export function ComparePage() {
  const [indicator, setIndicator] = useState<WbIndicator | null>(popularIndicators.find((i) => i.id === 'NY.GDP.PCAP.PP.KD') ?? popularIndicators[0])
  const [countries, setCountries] = useState<string[]>(['RUS', 'DEU', 'POL', 'TUR', 'BRA'])
  const range = useYearRange(2005)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const { add, has } = useDataset()

  const load = async () => {
    if (!indicator || !range.valid) return
    setLoading(true)
    setError(null)
    try {
      const name = indicator.nameRu ?? indicator.name
      const series = await fetchIndicatorData(indicator.id, countries, range.from!, range.to!, name)
      // Порядок рядов — как в списке выбранных стран: цвет закреплён за страной
      series.sort((a, b) => countries.indexOf(a.key.split(':')[2]) - countries.indexOf(b.key.split(':')[2]))
      setLoaded({ series, indicator, from: range.from!, to: range.to! })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  const title = loaded ? (loaded.indicator.nameRu ?? loaded.indicator.name) : ''

  return (
    <CalcShell toolId="compare">
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Что сравниваем" className="min-w-0 lg:col-span-2">
          <div className="space-y-4">
            <IndicatorPicker value={indicator} onChange={setIndicator} />
            <CountryPicker value={countries} onChange={setCountries} />
            <YearRange {...range} />
            <button
              type="button"
              onClick={load}
              disabled={loading || !indicator || countries.length === 0 || !range.valid}
              className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Загрузка…' : 'Сравнить'}
            </button>
            {error && <Notice>{error}</Notice>}
          </div>
        </Panel>

        <div className="min-w-0 space-y-6 lg:col-span-3">
          {!loaded ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Выберите показатель, страны и период — получите таблицу, график динамики и рейтинг стран.
            </div>
          ) : (
            <>
              <ChartCard series={loaded.series} title={title} subtitle={`${loaded.indicator.id} · ${loaded.from}–${loaded.to}`} />
              <Ranking series={loaded.series} title={title} />
              <button
                type="button"
                onClick={() => add(loaded.series)}
                disabled={loaded.series.every((s) => has(s.key))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:border-brand-500 disabled:opacity-50 dark:border-slate-700"
              >
                {loaded.series.every((s) => has(s.key)) ? 'Все ряды уже в наборе' : 'Добавить ряды в набор'}
              </button>
            </>
          )}
        </div>
      </div>
      <DatasetPanel />
    </CalcShell>
  )
}

/** Рейтинг стран за выбранный год — горизонтальные столбцы, цвет страны как на графике динамики */
function Ranking({ series, title }: { series: Series[]; title: string }) {
  const theme = useIsDark() ? darkChart : lightChart
  const years = [...new Set(series.flatMap((s) => s.points.filter((p) => p.value !== null).map((p) => p.date.slice(0, 4))))].sort()
  // По умолчанию — последний год, за который есть данные хотя бы по половине стран
  const coverage = (y: string) => series.filter((s) => s.points.some((p) => p.date.startsWith(y) && p.value !== null)).length
  const defaultYear = [...years].reverse().find((y) => coverage(y) >= Math.ceil(series.length / 2)) ?? years.at(-1)
  const [picked, setPicked] = useState<string | null>(null)
  const year = picked && years.includes(picked) ? picked : defaultYear

  if (!year) return null
  const rows = series
    .map((s, i) => ({ label: s.country ?? s.title, color: theme.series[i % theme.series.length], value: s.points.find((p) => p.date.startsWith(year))?.value ?? null }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
  const values = rows.map((r) => r.value).filter((v): v is number => v !== null)
  const lo = Math.min(0, ...values)
  const hi = Math.max(0, ...values)
  const span = hi - lo || 1

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Рейтинг стран за {year} год</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </div>
        <select
          value={year}
          onChange={(e) => setPicked(e.target.value)}
          aria-label="Год"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(4.5rem,9rem)_minmax(0,1fr)] items-center gap-3 text-sm">
            <span className="truncate text-slate-700 dark:text-slate-300" title={r.label}>
              {r.label}
            </span>
            {r.value === null ? (
              <span className="text-xs text-slate-400">нет данных за {year}</span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative h-4 flex-1">
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${((Math.min(0, r.value) - lo) / span) * 100}%`,
                      width: `${Math.max((Math.abs(r.value) / span) * 100, 0.5)}%`,
                      background: r.color,
                      borderRadius: r.value >= 0 ? '0 4px 4px 0' : '4px 0 0 4px',
                    }}
                  />
                </div>
                <span className="min-w-14 shrink-0 text-right whitespace-nowrap text-slate-900 tabular-nums dark:text-slate-100" title={fmtSmart(r.value)}>
                  {fmtCompact(r.value)}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

import { useRef, useState } from 'react'
import { useIsDark } from '../../hooks/useIsDark'
import { composeSvg, copyPng, EXPORT_H, EXPORT_W, headerHeight, svgToPng, type ExportMeta } from '../../lib/chartExport'
import { downloadBlob, fileSlug, formatDate, shortLabels, sourceLine, toCSV, toWideTable, toXLSX } from '../../lib/data/table'
import type { Series } from '../../lib/data/types'
import { fmtSmart } from '../../lib/format'
import { DataTable } from '../calc'
import { darkChart, lightChart, MAX_SERIES } from './palette'
import { ChartLegend, SeriesChart, type ChartKind } from './SeriesChart'

const kinds: { value: ChartKind; label: string }[] = [
  { value: 'line', label: 'Линия' },
  { value: 'bar', label: 'Столбцы' },
  { value: 'area', label: 'Площадь' },
]

const TABLE_LIMIT = 1000

const btn =
  'rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-300'
const seg = (active: boolean) =>
  `rounded px-2.5 py-1 text-xs font-medium transition-colors ${
    active ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
  }`

export function ChartCard({ series, title, subtitle, defaultKind = 'line', height = 360 }: { series: Series[]; title: string; subtitle?: string; defaultKind?: ChartKind; height?: number }) {
  const dark = useIsDark()
  const theme = dark ? darkChart : lightChart
  const [kind, setKind] = useState<ChartKind>(defaultKind)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  if (series.length === 0) return null
  const shown = series.slice(0, MAX_SERIES)
  const labels = shortLabels(shown)
  const meta: ExportMeta = {
    title,
    subtitle,
    legend: labels.map((label, i) => ({ label, color: lightChart.series[i] })),
    source: sourceLine(series),
    colors: { surface: lightChart.surface, text: lightChart.text, secondary: lightChart.textSecondary, muted: lightChart.muted },
  }
  const exportChartH = EXPORT_H - headerHeight(meta) - 32

  const flash = (tone: 'ok' | 'err', text: string) => {
    setStatus({ tone, text })
    setTimeout(() => setStatus(null), 4000)
  }

  // Скрытый график для экспорта всегда отрисован в светлой теме и размере слайда 16:9,
  // поэтому SVG доступен синхронно — это важно для копирования в буфер (Safari)
  const svg = () => {
    const el = exportRef.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null
    if (!el) throw new Error('График ещё не готов')
    return composeSvg(el, meta)
  }
  const name = fileSlug(series)

  const run = async (action: 'png' | 'svg' | 'copy' | 'csv' | 'xlsx') => {
    try {
      if (action === 'svg') downloadBlob(new Blob([svg()], { type: 'image/svg+xml' }), `${name}.svg`)
      if (action === 'png') downloadBlob(await svgToPng(svg()), `${name}.png`)
      if (action === 'copy') {
        await copyPng(svgToPng(svg()))
        flash('ok', 'Изображение скопировано — вставьте его в PowerPoint или документ (Ctrl+V).')
      }
      if (action === 'csv') downloadBlob(new Blob([toCSV(series)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
      if (action === 'xlsx') downloadBlob(await toXLSX(series), `${name}.xlsx`)
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Не удалось выполнить экспорт.')
    }
  }

  const table = toWideTable(series)
  const freq = series[0].frequency
  const start = Math.max(0, table.dates.length - TABLE_LIMIT)
  const tableRows = table.dates.slice(start).map((d, i) => [formatDate(d, freq), ...table.columns.map((c) => fmtSmart(c.values[start + i]))])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="Вид">
            <button type="button" className={seg(view === 'chart')} aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
              График
            </button>
            <button type="button" className={seg(view === 'table')} aria-pressed={view === 'table'} onClick={() => setView('table')}>
              Таблица
            </button>
          </div>
          {view === 'chart' && (
            <div className="inline-flex rounded-md bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="Тип графика">
              {kinds.map((k) => (
                <button key={k.value} type="button" className={seg(kind === k.value)} aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>
                  {k.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {series.length > MAX_SERIES && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          На графике показаны первые {MAX_SERIES} рядов из {series.length} — больше не различить по цвету. В таблице и экспорте есть все ряды.
        </p>
      )}

      {view === 'chart' ? (
        <>
          <ChartLegend series={series} theme={theme} />
          <SeriesChart series={series} kind={kind} theme={theme} height={height} />
        </>
      ) : (
        <div className="max-h-[28rem] overflow-auto">
          {start > 0 && <p className="mb-2 text-xs text-slate-500">Показаны последние {TABLE_LIMIT} строк из {table.dates.length}; полностью — в CSV/XLSX.</p>}
          <DataTable columns={['Дата', ...table.columns.map((c) => c.header)]} rows={tableRows} caption={title} />
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{sourceLine(series)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <span className="mr-1 text-xs text-slate-500 dark:text-slate-400">Скачать:</span>
        <button type="button" className={btn} onClick={() => run('png')}>
          PNG
        </button>
        <button type="button" className={btn} onClick={() => run('svg')}>
          SVG
        </button>
        <button type="button" className={btn} onClick={() => run('csv')}>
          CSV
        </button>
        <button type="button" className={btn} onClick={() => run('xlsx')}>
          XLSX
        </button>
        <button type="button" className={btn} onClick={() => run('copy')}>
          Копировать изображение
        </button>
      </div>
      {status && (
        <p role="status" className={`mt-2 text-xs ${status.tone === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
          {status.text}
        </p>
      )}

      <div ref={exportRef} aria-hidden="true" style={{ position: 'fixed', left: -20000, top: 0, width: EXPORT_W - 16, pointerEvents: 'none' }}>
        <SeriesChart series={series} kind={kind} theme={lightChart} width={EXPORT_W - 16} height={exportChartH} />
      </div>
    </section>
  )
}

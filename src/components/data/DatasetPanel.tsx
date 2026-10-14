import { useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadBlob, fileSlug, seriesLabel, toCSV, toXLSX } from '../../lib/data/table'
import { frequencyLabels, sourceLabels } from '../../lib/data/types'
import { useDataset } from '../../state/datasetContext'
import { ChartCard } from '../charts/ChartCard'
import { MAX_SERIES } from '../charts/palette'
import { Icon } from '../Icon'

/** «Мой набор данных»: загруженные и рассчитанные ряды, общий график и экспорт */
export function DatasetPanel() {
  const { series, remove, clear, persisted } = useDataset()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const plotted = series.filter((s) => selected.has(s.key))
  const units = new Set(plotted.map((s) => s.units))

  const toggle = (key: string) =>
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else if (next.size < MAX_SERIES) next.add(key)
      return next
    })

  const exportAll = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = format === 'csv' ? new Blob([toCSV(series)], { type: 'text/csv;charset=utf-8' }) : await toXLSX(series)
      downloadBlob(blob, `${fileSlug(series)}.${format}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка экспорта')
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Мой набор данных</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ряды хранятся только в этом браузере. Отметьте ряды, чтобы построить их на одном графике, или{' '}
            <Link to="/tools/transform" className="text-brand-700 hover:underline dark:text-blue-300">
              преобразуйте их
            </Link>
            .
          </p>
        </div>
        {series.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportAll('csv')} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-brand-500 dark:border-slate-700">
              Весь набор в CSV
            </button>
            <button type="button" onClick={() => exportAll('xlsx')} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-brand-500 dark:border-slate-700">
              Весь набор в XLSX
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Удалить все ряды из набора?')) {
                  clear()
                  setSelected(new Set())
                }
              }}
              className="rounded-md px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              Очистить
            </button>
          </div>
        )}
      </div>
      {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
      {!persisted && (
        <p className="mb-2 text-sm text-amber-700 dark:text-amber-400">Набор слишком большой для хранения в браузере и пропадёт после перезагрузки. Экспортируйте его в файл.</p>
      )}

      {series.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Пока пусто. Загрузите показатель и нажмите «Добавить в набор».
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={selected.has(s.key)}
                onChange={() => toggle(s.key)}
                disabled={!selected.has(s.key) && selected.size >= MAX_SERIES}
                aria-label={`Показать на графике: ${seriesLabel(s)}`}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{seriesLabel(s)}</div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {sourceLabels[s.source]} · {s.id} · {frequencyLabels[s.frequency]} · {s.units || 'ед. не указаны'} · {s.points.length} набл.
                  {s.derivation && ` · ${s.derivation}`}
                </div>
              </div>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hidden shrink-0 text-xs text-brand-700 hover:underline sm:inline dark:text-blue-300">
                  Источник
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  remove(s.key)
                  setSelected((cur) => {
                    const next = new Set(cur)
                    next.delete(s.key)
                    return next
                  })
                }}
                aria-label={`Удалить ${seriesLabel(s)}`}
                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {plotted.length > 0 && (
        <div className="mt-4">
          {units.size > 1 && (
            <p className="mb-2 text-sm text-amber-700 dark:text-amber-400">
              У выбранных рядов разные единицы измерения — сравнивать уровни на одной оси некорректно. Приведите их к индексу (база = 100) на странице
              преобразований.
            </p>
          )}
          <ChartCard series={plotted} title={plotted.length === 1 ? seriesLabel(plotted[0]) : 'Выбранные ряды'} subtitle={units.size === 1 ? [...units][0] : undefined} />
        </div>
      )}
    </section>
  )
}

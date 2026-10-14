import { useEffect, useMemo, useState } from 'react'
import { fetchIndicators, popularIndicators, type WbIndicator } from '../../lib/data/worldbank'
import { matches } from '../../lib/search'

/** Поиск показателя World Development Indicators. Без запроса — популярные показатели. */
export function IndicatorPicker({ value, onChange }: { value: WbIndicator | null; onChange: (i: WbIndicator) => void }) {
  const [all, setAll] = useState<WbIndicator[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    fetchIndicators()
      .then((list) => alive && setAll(list))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return popularIndicators
    // Сначала избранные (есть русские названия), затем весь каталог WDI
    const popular = popularIndicators.filter((i) => matches(query, i.nameRu ?? '', i.name, i.id))
    const ids = new Set(popular.map((p) => p.id))
    const rest = (all ?? []).filter((i) => !ids.has(i.id) && matches(query, i.name, i.id))
    return [...popular, ...rest].slice(0, 50)
  }, [query, all])

  return (
    <div>
      <label htmlFor="wb-indicator" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Показатель
      </label>
      <input
        id="wb-indicator"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ВВП, инфляция, unemployment, NY.GDP…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
      />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {!query.trim()
          ? 'Популярные показатели. Поиск идёт по всему каталогу World Development Indicators (названия на английском).'
          : error
            ? `Полный каталог не загрузился (${error}) — поиск только по популярным.`
            : !all
              ? 'Загружаем полный каталог…'
              : `Найдено: ${results.length === 50 ? '50+' : results.length}`}
      </p>
      <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800" role="listbox" aria-label="Показатели">
        {results.map((i) => {
          const active = value?.id === i.id
          return (
            <li key={i.id} role="option" aria-selected={active}>
              <button
                type="button"
                onClick={() => onChange(i)}
                className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 dark:border-slate-800 ${
                  active ? 'bg-brand-50 dark:bg-blue-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="block">{i.nameRu ?? i.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {i.id}
                  {i.nameRu && ` · ${i.name}`}
                </span>
              </button>
            </li>
          )
        })}
        {results.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Ничего не найдено</li>}
      </ul>
    </div>
  )
}

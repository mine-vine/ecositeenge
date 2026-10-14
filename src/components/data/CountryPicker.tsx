import { useEffect, useMemo, useState } from 'react'
import { fetchCountries, type WbCountry } from '../../lib/data/worldbank'
import { matches } from '../../lib/search'
import { Icon } from '../Icon'

/** Выбор стран World Bank (поиск по русскому и английскому названию, ISO-коду) */
export function CountryPicker({ value, onChange, max = 8 }: { value: string[]; onChange: (ids: string[]) => void; max?: number }) {
  const [countries, setCountries] = useState<WbCountry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetchCountries()
      .then((c) => alive && setCountries(c))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  const byId = useMemo(() => new Map(countries?.map((c) => [c.id, c]) ?? []), [countries])
  const options = useMemo(
    () => (countries ?? []).filter((c) => !value.includes(c.id) && matches(query, c.name, c.id, c.iso2, c.region)).slice(0, 60),
    [countries, query, value],
  )
  const full = value.length >= max

  const add = (id: string) => {
    if (!full) onChange([...value, id])
    setQuery('')
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Страны <span className="font-normal text-slate-500">({value.length} из {max})</span>
      </span>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-2.5 text-sm dark:bg-slate-800">
              {byId.get(id)?.name ?? id}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                aria-label={`Убрать ${byId.get(id)?.name ?? id}`}
                className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">Список стран не загрузился: {error}</p>
      ) : (
        <div className="relative">
          <input
            type="search"
            value={query}
            disabled={full}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && options[0]) {
                e.preventDefault()
                add(options[0].id)
              }
            }}
            placeholder={full ? `Можно выбрать до ${max} стран` : countries ? 'Добавить страну: Россия, DEU, Euro area…' : 'Загрузка списка стран…'}
            aria-label="Добавить страну"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          {open && options.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {options.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(c.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>{c.name}</span>
                    <span className="shrink-0 text-xs text-slate-400">{c.isAggregate ? 'группа' : c.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

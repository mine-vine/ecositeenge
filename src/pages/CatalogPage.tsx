import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CatalogCard } from '../components/CatalogCard'
import { ChipGroup, PageHeader, SearchInput } from '../components/ui'
import {
  catalog,
  categoryLabels,
  fieldLabels,
  levelLabels,
  priceLabels,
  type Category,
  type Field,
  type Level,
  type Price,
} from '../data/catalog'
import { t } from '../i18n'
import { matches } from '../lib/search'

const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))

const categoryOptions = toOptions(categoryLabels)
const fieldOptions = toOptions(fieldLabels)
const priceOptions = toOptions(priceLabels)
const levelOptions = toOptions(levelLabels)

/** Читает значение фильтра из URL, отбрасывая неизвестные */
function param<T extends string>(params: URLSearchParams, key: string, labels: Record<T, string>): T | 'all' {
  const v = params.get(key)
  return v && v in labels ? (v as T) : 'all'
}

export function CatalogPage() {
  // Фильтры хранятся в URL — выборкой можно поделиться ссылкой
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = param<Category>(params, 'cat', categoryLabels)
  const field = param<Field>(params, 'field', fieldLabels)
  const price = param<Price>(params, 'price', priceLabels)
  const level = param<Level>(params, 'level', levelLabels)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(
    () =>
      catalog.filter(
        (item) =>
          (category === 'all' || item.category === category) &&
          (field === 'all' || item.fields.includes(field)) &&
          (price === 'all' || item.price === price) &&
          (level === 'all' || item.level === level) &&
          matches(query, item.name, item.summary, item.purpose),
      ),
    [query, category, field, price, level],
  )

  const hasFilters = params.toString() !== ''

  return (
    <>
      <PageHeader title={t.catalog.title} subtitle={t.catalog.subtitle} />

      <div className="mb-8 space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SearchInput value={query} onChange={(v) => update('q', v)} placeholder={t.catalog.search} />
        <ChipGroup label={t.catalog.category} options={categoryOptions} value={category} onChange={(v) => update('cat', v)} allLabel={t.catalog.all} />
        <ChipGroup label={t.catalog.field} options={fieldOptions} value={field} onChange={(v) => update('field', v)} allLabel={t.catalog.all} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ChipGroup label={t.catalog.price} options={priceOptions} value={price} onChange={(v) => update('price', v)} allLabel={t.catalog.all} />
          <ChipGroup label={t.catalog.level} options={levelOptions} value={level} onChange={(v) => update('level', v)} allLabel={t.catalog.all} />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">{t.catalog.found(filtered.length)}</span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="font-medium text-brand-700 hover:underline dark:text-blue-300"
            >
              {t.catalog.reset}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">{t.catalog.empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  )
}

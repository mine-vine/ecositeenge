import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CatalogCard, CatalogMeta } from '../components/CatalogCard'
import { Icon } from '../components/Icon'
import { Badge } from '../components/ui'
import { catalog, categoryLabels, fieldLabels } from '../data/catalog'
import { t } from '../i18n'
import { NotFoundPage } from './NotFoundPage'

export function CatalogItemPage() {
  const { id } = useParams()
  const item = catalog.find((i) => i.id === id)
  if (!item) return <NotFoundPage />

  const related = catalog.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 3)

  return (
    <article>
      <Link to="/catalog" className="text-sm font-medium text-brand-700 hover:underline dark:text-blue-300">
        {t.catalog.back}
      </Link>

      <header className="mt-4 mb-8 max-w-3xl">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{categoryLabels[item.category]}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{item.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CatalogMeta item={item} />
          <div className="flex flex-wrap gap-1.5">
            {item.fields.map((f) => (
              <Badge key={f}>{fieldLabels[f]}</Badge>
            ))}
          </div>
        </div>
        {item.priceNote && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{item.priceNote}</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title={t.catalog.whatIs}>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{item.summary}</p>
          </Section>
          <Section title={t.catalog.purpose}>
            <List items={item.purpose} />
          </Section>
          <Section title={t.catalog.howToStart}>
            <ol className="space-y-3">
              {item.start.map((s, i) => (
                <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-blue-950 dark:text-blue-300">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-3 font-medium text-white hover:bg-brand-600"
          >
            {t.catalog.website}
            <Icon name="external" className="h-4 w-4" />
          </a>
          <p className="mt-2 text-center text-xs break-all text-slate-500 dark:text-slate-400">{item.url}</p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">{t.catalog.related}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <CatalogCard key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li key={s} className="flex gap-2.5 text-slate-700 dark:text-slate-300">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ul>
  )
}

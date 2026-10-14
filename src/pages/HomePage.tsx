import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ToolCard } from '../components/ToolCard'
import { SearchInput } from '../components/ui'
import { workspaceSections, workspaceTools } from '../data/workspaceTools'
import { t } from '../i18n'
import { matches } from '../lib/search'

export function HomePage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => workspaceTools.filter((tool) => matches(query, tool.title, tool.description, tool.section, tool.keywords)),
    [query],
  )

  return (
    <>
      <section className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">{t.home.subtitle}</p>
        <div className="mt-6">
          <SearchInput value={query} onChange={setQuery} placeholder={t.home.searchPlaceholder} large />
        </div>
      </section>

      {filtered.length === 0 && <p className="text-slate-500 dark:text-slate-400">{t.home.nothingFound}</p>}

      <div className="space-y-10">
        {workspaceSections.map((section) => {
          const items = filtered.filter((tool) => tool.section === section)
          if (items.length === 0) return null
          return (
            <section key={section}>
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{section}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {!query && (
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Promo title={t.home.catalogTitle} text={t.home.catalogText} cta={t.home.catalogCta} to="/catalog" />
          <Promo title={t.home.startTitle} text={t.home.startText} cta={t.home.startCta} to="/start" />
        </section>
      )}
    </>
  )
}

function Promo({ title, text, cta, to }: { title: string; text: string; cta: string; to: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
      <Link
        to={to}
        className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand-700 hover:underline dark:text-blue-300"
      >
        {cta}
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  )
}

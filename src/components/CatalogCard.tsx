import { Link } from 'react-router-dom'
import { type CatalogItem, categoryLabels, levelLabels, priceLabels, type Level, type Price } from '../data/catalog'
import { Badge } from './ui'

const priceTone = (p: Price) => (p === 'free' ? 'green' : p === 'freemium' ? 'blue' : 'amber')
const levelTone = (l: Level) => (l === 'beginner' ? 'neutral' : l === 'intermediate' ? 'blue' : 'rose')

export function CatalogMeta({ item }: { item: CatalogItem }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={priceTone(item.price)}>{priceLabels[item.price]}</Badge>
      <Badge tone={levelTone(item.level)}>{levelLabels[item.level]}</Badge>
    </div>
  )
}

export function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      to={`/catalog/${item.id}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500"
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{categoryLabels[item.category]}</div>
      <h3 className="mt-1 font-semibold group-hover:text-brand-700 dark:group-hover:text-blue-300">{item.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.summary}</p>
      <div className="mt-4">
        <CatalogMeta item={item} />
      </div>
    </Link>
  )
}

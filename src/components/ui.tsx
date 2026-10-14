import type { ReactNode } from 'react'
import { Icon } from './Icon'

type BadgeTone = 'neutral' | 'green' | 'amber' | 'blue' | 'rose'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  blue: 'bg-brand-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  large = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  large?: boolean
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Icon
        name="search"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${large ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4'}`}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
          large ? 'py-3 pr-4 pl-12 text-base' : 'py-2 pr-3 pl-9 text-sm'
        }`}
      />
    </label>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-3 text-slate-600 dark:text-slate-400">{subtitle}</p>}
    </div>
  )
}

/** Группа переключаемых «чипов» для фильтров */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | 'all'
  onChange: (v: T | 'all') => void
  allLabel: string
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500'
    }`
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(value === 'all')} onClick={() => onChange('all')} aria-pressed={value === 'all'}>
          {allLabel}
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={chip(value === o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

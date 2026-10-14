import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { workspaceTools } from '../data/workspaceTools'
import { t } from '../i18n'
import { parseNum } from '../lib/format'
import { Icon } from './Icon'

/** Каркас страницы калькулятора: заголовок из реестра модулей, ввод слева, результаты справа */
export function CalcShell({ toolId, children }: { toolId: string; children: ReactNode }) {
  const tool = workspaceTools.find((w) => w.id === toolId)
  return (
    <div>
      <Link to="/" className="text-sm font-medium text-brand-700 hover:underline dark:text-blue-300">
        {t.toolPage.back}
      </Link>
      {tool && (
        <div className="mt-4 mb-8 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300">
            <Icon name={tool.icon} />
          </span>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{tool.section}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{tool.title}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{tool.description}</p>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

/** Двухколоночная раскладка: параметры | результаты */
export function CalcGrid({ inputs, results }: { inputs: ReactNode; results: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel className="min-w-0 lg:col-span-2" title={t.calc.inputs}>
        <div className="space-y-4">{inputs}</div>
      </Panel>
      <div className="min-w-0 space-y-6 lg:col-span-3">{results}</div>
    </div>
  )
}

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {title && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  )
}

const inputClass =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm tabular-nums text-slate-900 shadow-sm focus:ring-2 focus:outline-none dark:bg-slate-950 dark:text-slate-100'
const okBorder = 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700'
const errBorder = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700'

/** Поле для числа. Хранит строку, чтобы не мешать вводу «1,» или «-». */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  min,
  integer = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  hint?: string
  min?: number
  integer?: boolean
}) {
  const id = useId()
  const n = parseNum(value)
  const invalid = value.trim() !== '' && (!Number.isFinite(n) || (min !== undefined && n < min) || (integer && !Number.isInteger(n)))
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={`${inputClass} ${invalid ? errBorder : okBorder} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>
        )}
      </div>
      {invalid ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{integer ? t.calc.needInteger : t.calc.needNumber}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value)
          if (opt) onChange(opt.value)
        }}
        className={`${inputClass} ${okBorder}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Переключатель режимов (вкладки) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="mb-6 inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

type Tone = 'neutral' | 'good' | 'bad'
const toneClass: Record<Tone, string> = {
  neutral: 'text-slate-900 dark:text-white',
  good: 'text-emerald-700 dark:text-emerald-400',
  bad: 'text-rose-700 dark:text-rose-400',
}

export function Metric({ label, value, note, tone = 'neutral', primary = false }: { label: string; value: string; note?: string; tone?: Tone; primary?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 font-semibold tabular-nums ${primary ? 'text-2xl' : 'text-xl'} ${toneClass[tone]}`}>{value}</div>
      {note && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</div>}
    </div>
  )
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

/** Сообщение о некорректных данных вместо результатов */
export function Notice({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        tone === 'warn'
          ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
          : 'border-brand-100 bg-brand-50 text-slate-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-slate-200'
      }`}
    >
      {children}
    </div>
  )
}

/** Блок «Формула и как интерпретировать» — обязателен для каждого расчёта */
export function Explainer({ formulas, children }: { formulas: { label?: string; tex: ReactNode }[]; children: ReactNode }) {
  return (
    <Panel title={t.calc.explainer}>
      <div className="space-y-3">
        {formulas.map((f, i) => (
          <div key={i}>
            {f.label && <div className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{f.label}</div>}
            <div className="overflow-x-auto rounded-lg bg-slate-50 px-4 py-3 font-serif text-base whitespace-nowrap text-slate-900 dark:bg-slate-950 dark:text-slate-100">
              {f.tex}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
    </Panel>
  )
}

/** Простая таблица с числовыми колонками справа */
export function DataTable({ columns, rows, caption }: { columns: string[]; rows: (string | number)[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {columns.map((c, i) => (
              <th key={c} scope="col" className={`py-2 font-medium whitespace-nowrap ${i === 0 ? 'pr-4 text-left' : 'pl-4 text-right'}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
              {r.map((cell, ci) => (
                <td key={ci} className={`py-1.5 whitespace-nowrap ${ci === 0 ? 'pr-4 text-left text-slate-500 dark:text-slate-400' : 'pl-4 text-right'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

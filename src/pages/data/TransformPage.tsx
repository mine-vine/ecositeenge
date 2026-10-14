import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalcShell, Explainer, Notice, Panel, Segmented, SelectField } from '../../components/calc'
import { ChartCard } from '../../components/charts/ChartCard'
import { DatasetPanel } from '../../components/data/DatasetPanel'
import { seriesLabel } from '../../lib/data/table'
import { aggLabels, canResample, deflate, derive, diff, pctChange, rebase, resample, yearsOf, yoyLag, type AggMethod } from '../../lib/data/transforms'
import { frequencyLabels, type Frequency, type Series } from '../../lib/data/types'
import { useDataset } from '../../state/datasetContext'

type Op = 'growth' | 'diff' | 'index' | 'resample' | 'deflate'
const ops: { value: Op; label: string }[] = [
  { value: 'growth', label: 'Темп роста' },
  { value: 'index', label: 'Индекс (база = 100)' },
  { value: 'resample', label: 'Смена частоты' },
  { value: 'deflate', label: 'Номинал → реал' },
  { value: 'diff', label: 'Абсолютное изменение' },
]

const lagNames: Partial<Record<Frequency, string>> = { M: 'м/м', Q: 'к/к', S: 'п/п', A: 'г/г', W: 'н/н', D: 'д/д' }

export function TransformPage() {
  const { series, add, has } = useDataset()
  const [sourceKey, setSourceKey] = useState<string>('')
  const [op, setOp] = useState<Op>('growth')
  const [lagMode, setLagMode] = useState<'prev' | 'yoy'>('yoy')
  const [baseYear, setBaseYear] = useState<number | null>(null)
  const [target, setTarget] = useState<Frequency>('A')
  const [method, setMethod] = useState<AggMethod>('mean')
  const [deflatorKey, setDeflatorKey] = useState<string>('')

  const src = series.find((s) => s.key === sourceKey) ?? series[0]

  if (!src) {
    return (
      <CalcShell toolId="transform">
        <Notice tone="info">
          В наборе пока нет рядов. Загрузите показатели на странице{' '}
          <Link to="/tools/data-search" className="font-medium text-brand-700 underline dark:text-blue-300">
            «Поиск показателей»
          </Link>{' '}
          или{' '}
          <Link to="/tools/compare" className="font-medium text-brand-700 underline dark:text-blue-300">
            «Сравнение стран»
          </Link>{' '}
          и добавьте их в набор.
        </Notice>
      </CalcShell>
    )
  }

  const years = yearsOf(src.points)
  const deflators = series.filter((s) => s.key !== src.key && s.frequency === src.frequency)
  const deflator = deflators.find((s) => s.key === deflatorKey) ?? deflators[0]
  const targets = (['Q', 'A', 'M', 'S'] as Frequency[]).filter((f) => canResample(src.frequency, f))
  const tgt = targets.includes(target) ? target : targets[0]

  // Расчёт выбранного преобразования
  const result: { series: Series } | { error: string } = (() => {
    const label = seriesLabel(src)
    switch (op) {
      case 'growth':
      case 'diff': {
        const lag = lagMode === 'yoy' ? yoyLag(src.frequency) : 1
        if (lag === null) return { error: 'Для дневных и недельных рядов сравнение «год к году» недоступно — сначала смените частоту.' }
        const tag = lagMode === 'yoy' ? 'г/г' : (lagNames[src.frequency] ?? 'к пред. периоду')
        return op === 'growth'
          ? { series: derive(src, pctChange(src.points, lag), { derivation: `темп роста ${tag}, %`, units: '%', title: `${src.title} — темп роста ${tag}` }) }
          : { series: derive(src, diff(src.points, lag), { derivation: `изменение ${tag}`, title: `${src.title} — изменение ${tag}` }) }
      }
      case 'index': {
        const by = baseYear !== null && years.includes(baseYear) ? baseYear : years[0]
        const pts = by === undefined ? null : rebase(src.points, by)
        if (!pts) return { error: 'Нет данных для базового года или среднее за него равно нулю.' }
        return { series: derive(src, pts, { derivation: `индекс, ${by} = 100`, units: `${by} = 100`, title: `${src.title} — индекс (${by} = 100)` }) }
      }
      case 'resample': {
        if (!tgt) return { error: `Ряд уже имеет частоту «${frequencyLabels[src.frequency].toLowerCase()}» — понизить её нельзя.` }
        const pts = resample(src.points, src.frequency, tgt, method)
        if (pts.length === 0) return { error: 'Нет ни одного полного периода для агрегации.' }
        return {
          series: derive(src, pts, {
            derivation: `${frequencyLabels[tgt].toLowerCase()} частота, ${aggLabels[method].toLowerCase()}`,
            frequency: tgt,
            title: `${src.title} (${frequencyLabels[tgt].toLowerCase()}, ${aggLabels[method].toLowerCase()})`,
          }),
        }
      }
      case 'deflate': {
        if (!deflator) return { error: `В наборе нет другого ряда с частотой «${frequencyLabels[src.frequency].toLowerCase()}», чтобы использовать его как индекс цен. Загрузите ИПЦ или дефлятор, например FP.CPI.TOTL (World Bank) или CPIAUCSL (FRED).` }
        const common = yearsOf(deflator.points).filter((y) => years.includes(y))
        const by = baseYear !== null && common.includes(baseYear) ? baseYear : common.at(-1)
        const pts = by === undefined ? null : deflate(src.points, deflator.points, by)
        if (!pts || pts.every((p) => p.value === null)) return { error: 'Даты ряда и индекса цен не пересекаются.' }
        return {
          series: derive(src, pts, {
            derivation: `в ценах ${by} г. (дефлятор: ${deflator.id})`,
            units: [src.units, `в ценах ${by} г.`].filter(Boolean).join(', '),
            title: `${label} — в ценах ${by} г.`,
          }),
        }
      }
    }
  })()

  const yearOptions = (op === 'deflate' && deflator ? yearsOf(deflator.points).filter((y) => years.includes(y)) : years).map((y) => ({ value: y, label: String(y) }))

  const inputs = (
    <div className="space-y-4">
      <SelectField label="Исходный ряд" value={src.key} onChange={setSourceKey} options={series.map((s) => ({ value: s.key, label: seriesLabel(s) }))} />
      <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
        {frequencyLabels[src.frequency]} · {src.units || 'единицы не указаны'} · {years[0]}–{years.at(-1)}
      </p>

      {(op === 'growth' || op === 'diff') && (
        <SelectField
          label="С чем сравнивать"
          value={lagMode}
          onChange={setLagMode}
          options={[
            { value: 'yoy', label: 'Год к году (с тем же периодом прошлого года)' },
            { value: 'prev', label: 'С предыдущим периодом' },
          ]}
        />
      )}
      {op === 'resample' && tgt && (
        <>
          <SelectField label="Новая частота" value={tgt} onChange={setTarget} options={targets.map((f) => ({ value: f, label: frequencyLabels[f] }))} />
          <SelectField label="Способ агрегации" value={method} onChange={setMethod} options={(Object.keys(aggLabels) as AggMethod[]).map((m) => ({ value: m, label: aggLabels[m] }))} />
        </>
      )}
      {op === 'deflate' && deflator && (
        <SelectField
          label="Индекс цен (дефлятор)"
          value={deflator.key}
          onChange={setDeflatorKey}
          options={deflators.map((s) => ({ value: s.key, label: seriesLabel(s) }))}
        />
      )}
      {(op === 'index' || (op === 'deflate' && deflator)) && yearOptions.length > 0 && (
        <SelectField
          label="Базовый год"
          value={yearOptions.some((o) => o.value === baseYear) ? baseYear! : op === 'deflate' ? yearOptions.at(-1)!.value : yearOptions[0].value}
          onChange={setBaseYear}
          options={yearOptions}
        />
      )}
    </div>
  )

  return (
    <CalcShell toolId="transform">
      <Segmented label="Преобразование" value={op} onChange={setOp} options={ops} />
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Параметры" className="min-w-0 lg:col-span-2">
          {inputs}
        </Panel>
        <div className="min-w-0 space-y-3 lg:col-span-3">
          {'error' in result ? (
            <Notice>{result.error}</Notice>
          ) : (
            <>
              <ChartCard series={[result.series]} title={result.series.title} subtitle={result.series.units} />
              <button
                type="button"
                onClick={() => add([result.series])}
                disabled={has(result.series.key)}
                className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Добавить результат в набор
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-6">
        <OpExplainer op={op} />
      </div>
      <DatasetPanel />
    </CalcShell>
  )
}

function OpExplainer({ op }: { op: Op }) {
  const map: Record<Op, { formulas: { label?: string; tex: ReactNode }[]; text: ReactNode }> = {
    growth: {
      formulas: [{ label: 'Темп роста, %', tex: <>g<sub>t</sub> = (x<sub>t</sub> / x<sub>t−k</sub> − 1) · 100</> }],
      text: (
        <>
          <p>k = 1 — к предыдущему периоду; k = 12 (месяцы), 4 (кварталы), 1 (годы) — год к году.</p>
          <p>
            Сравнение «год к году» не требует сезонной корректировки: сезонность сокращается. Темп к предыдущему месяцу или кварталу по несезонно скорректированным
            данным в основном отражает сезонные колебания.
          </p>
        </>
      ),
    },
    diff: {
      formulas: [{ label: 'Абсолютное изменение', tex: <>Δx<sub>t</sub> = x<sub>t</sub> − x<sub>t−k</sub></> }],
      text: <p>Подходит для показателей, уже выраженных в процентах (безработица, ставки): изменение измеряется в процентных пунктах, а не в процентах.</p>,
    },
    index: {
      formulas: [{ label: 'Индекс', tex: <>I<sub>t</sub> = x<sub>t</sub> / x̄<sub>база</sub> · 100</> }],
      text: (
        <p>
          x̄<sub>база</sub> — среднее за базовый год. Индекс позволяет сравнивать динамику рядов с разными единицами и масштабом на одном графике: значение 120 означает рост на 20%
          относительно базового года.
        </p>
      ),
    },
    resample: {
      formulas: [{ label: 'Например, месяц → квартал', tex: <>x<sub>кв</sub> = среднее / сумма / последнее из x<sub>мес1</sub>, x<sub>мес2</sub>, x<sub>мес3</sub></> }],
      text: (
        <>
          <p>
            Среднее — для уровней и ставок (цены, курс, безработица). Сумма — для потоков (выручка, экспорт за месяц). Конец периода — для запасов (долг, денежная масса
            на дату).
          </p>
          <p>Неполные периоды (например, год, по которому есть только 7 месяцев) отбрасываются, чтобы не исказить результат.</p>
        </>
      ),
    },
    deflate: {
      formulas: [{ label: 'Реальное значение', tex: <>x<sup>реал</sup><sub>t</sub> = x<sup>ном</sup><sub>t</sub> / (P<sub>t</sub> / P<sub>база</sub>)</> }],
      text: (
        <>
          <p>P — индекс цен (ИПЦ, дефлятор ВВП). Результат показывает, сколько стоил бы показатель в ценах базового года, то есть изменение «в натуральном выражении».</p>
          <p>Ряд и индекс цен должны иметь одинаковую частоту. Для зарплат и потребительских расходов обычно используют ИПЦ, для ВВП — дефлятор ВВП.</p>
        </>
      ),
    },
  }
  const { formulas, text } = map[op]
  return <Explainer formulas={formulas}>{text}</Explainer>
}

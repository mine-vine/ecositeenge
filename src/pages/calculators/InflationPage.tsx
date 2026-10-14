import { useState } from 'react'
import { CalcGrid, CalcShell, DataTable, Explainer, Metric, MetricGrid, Notice, NumberField, Panel, Segmented } from '../../components/calc'
import { Icon } from '../../components/Icon'
import { t } from '../../i18n'
import { averageInflation, cumulativeInflation, purchasingPower } from '../../lib/finance'
import { fmtMoney, fmtNum, fmtPct, parseNum, readNum } from '../../lib/format'

type Mode = 'list' | 'constant'

export function InflationPage() {
  const [mode, setMode] = useState<Mode>('list')
  const [amount, setAmount] = useState('100 000')
  const [startYear, setStartYear] = useState('2021')
  const [rates, setRates] = useState(['4', '8', '12', '7,5'])
  const [constRate, setConstRate] = useState('6')
  const [constYears, setConstYears] = useState('10')

  const s = readNum(amount, { min: 0 })
  const y0 = readNum(startYear, { integer: true })

  // Ставки по годам в долях; в режиме «постоянная» — одна ставка, повторённая N раз
  const yearRates: number[] | null = (() => {
    if (mode === 'list') {
      const parsed = rates.map(parseNum)
      return parsed.length > 0 && parsed.every((x) => Number.isFinite(x) && x > -100) ? parsed.map((x) => x / 100) : null
    }
    const r = readNum(constRate)
    const n = readNum(constYears, { min: 1, integer: true })
    return r !== null && r > -100 && n !== null && n <= 200 ? Array(n).fill(r / 100) : null
  })()

  const ok = s !== null && yearRates !== null && (mode === 'constant' || y0 !== null)
  const firstYear = mode === 'list' ? (y0 ?? 1) : 1
  const yearLabel = (i: number) => (mode === 'list' ? String(firstYear + i) : `${i + 1}-й год`)

  const result = (() => {
    if (!ok) return null
    const cumulative = cumulativeInflation(yearRates)
    let index = 1
    const table = yearRates.map((r, i) => {
      index *= 1 + r
      return [yearLabel(i), fmtPct(r, 1), fmtNum(index * 100, 1), fmtPct(index - 1, 1), fmtMoney(s / index)]
    })
    return { cumulative, average: averageInflation(yearRates), power: purchasingPower(s, cumulative), table }
  })()

  const periodText = mode === 'list' ? `${firstYear}–${firstYear + rates.length - 1}` : `${yearRates?.length ?? ''} лет`

  const inputs = (
    <>
      <NumberField label="Сумма" value={amount} onChange={setAmount} suffix="₽" min={0} />
      <Segmented
        label="Способ задания инфляции"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'list', label: 'По годам' },
          { value: 'constant', label: 'Постоянная' },
        ]}
      />
      {mode === 'constant' ? (
        <>
          <NumberField label="Инфляция в год" value={constRate} onChange={setConstRate} suffix="%" />
          <NumberField label="Число лет" value={constYears} onChange={setConstYears} suffix="лет" min={1} integer />
        </>
      ) : (
        <>
          <NumberField label="Первый год" value={startYear} onChange={setStartYear} integer />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Инфляция за год, %</span>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Значения по умолчанию — пример. Фактическую инфляцию (ИПЦ, декабрь к декабрю) берите у Росстата или национальной статслужбы.
            </p>
            <ol className="space-y-2">
              {rates.map((r, i) => {
                const bad = !Number.isFinite(parseNum(r))
                return (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-right text-xs text-slate-500 tabular-nums dark:text-slate-400">{yearLabel(i)}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Инфляция за ${yearLabel(i)}`}
                      value={r}
                      onChange={(e) => setRates((rs) => rs.map((x, j) => (j === i ? e.target.value : x)))}
                      className={`w-full rounded-md border bg-white px-3 py-1.5 text-sm tabular-nums dark:bg-slate-950 ${
                        bad ? 'border-rose-400 dark:border-rose-700' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setRates((rs) => rs.filter((_, j) => j !== i))}
                      disabled={rates.length <= 1}
                      aria-label={`Удалить ${yearLabel(i)}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:invisible dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ol>
            <button
              type="button"
              onClick={() => setRates((rs) => [...rs, rs.at(-1) ?? '0'])}
              className="mt-3 w-full rounded-md border border-dashed border-slate-300 py-1.5 text-sm text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-blue-300"
            >
              + Добавить год
            </button>
          </div>
        </>
      )}
    </>
  )

  const results = !result ? (
    <Notice>{t.calc.fixInputs}</Notice>
  ) : (
    <>
      <Panel title={t.calc.results}>
        <MetricGrid>
          <Metric primary label={`Накопленная инфляция за ${periodText}`} value={fmtPct(result.cumulative, 1)} tone={result.cumulative > 0 ? 'bad' : 'good'} />
          <Metric primary label="Покупательная способность суммы" value={fmtMoney(result.power)} note="В ценах начала периода" />
          <Metric label="Чтобы сохранить покупательную способность, нужно" value={fmtMoney(s! * (1 + result.cumulative))} note="В ценах конца периода" />
          <Metric label="Средняя инфляция в год" value={fmtPct(result.average, 2)} note="Геометрическое среднее" />
        </MetricGrid>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Цены за период выросли на {fmtPct(result.cumulative, 1)}: на {fmtMoney(s!)} в конце периода можно купить столько же, сколько на {fmtMoney(result.power)} в начале.
          {result.cumulative > 0 && (
            <>
              {' '}Деньги, лежавшие без дохода, потеряли {fmtPct(1 - 1 / (1 + result.cumulative), 1)} покупательной способности — это меньше накопленной инфляции,
              потому что потеря считается от более высокого уровня цен.
            </>
          )}
        </p>
      </Panel>
      <Panel title="По годам">
        <DataTable
          caption="Накопленная инфляция по годам"
          columns={['Год', 'Инфляция', 'Индекс цен (начало = 100)', 'Накопленная', 'Покуп. способность']}
          rows={result.table}
        />
      </Panel>
    </>
  )

  return (
    <CalcShell toolId="inflation">
      <CalcGrid inputs={inputs} results={results} />
      <div className="mt-6">
        <Explainer
          formulas={[
            { label: 'Накопленная инфляция', tex: <>π<sub>накопл</sub> = (1 + π<sub>1</sub>) · (1 + π<sub>2</sub>) · … · (1 + π<sub>n</sub>) − 1</> },
            { label: 'Покупательная способность', tex: <>S<sub>реал</sub> = S / (1 + π<sub>накопл</sub>)</> },
            { label: 'Средняя инфляция', tex: <>π̄ = (1 + π<sub>накопл</sub>)<sup>1/n</sup> − 1</> },
          ]}
        >
          <p>
            Инфляцию за несколько лет нельзя складывать: годовые темпы перемножаются. Например, 10% и 10% дают 21%, а не 20%.
          </p>
          <p>
            <b>Покупательная способность</b> показывает, сколько стоит сумма в ценах начала периода. Для пересчёта номинальных показателей (зарплаты, выручки) в реальные
            делите их на индекс цен — это и есть дефлирование.
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Используйте инфляцию «декабрь к декабрю» для накопления по годам; среднегодовая инфляция («год к году») для этой цели даёт неточный результат.
          </p>
        </Explainer>
      </div>
    </CalcShell>
  )
}

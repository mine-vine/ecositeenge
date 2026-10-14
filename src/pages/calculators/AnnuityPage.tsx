import { useState } from 'react'
import { CalcGrid, CalcShell, DataTable, Explainer, Metric, MetricGrid, Notice, NumberField, Panel, Segmented, SelectField } from '../../components/calc'
import { t } from '../../i18n'
import { amortizationSchedule, effectiveAnnualRate, pmt } from '../../lib/finance'
import { fmtMoney, fmtPct, readNum } from '../../lib/format'

const frequencies = [
  { value: 12, label: 'Ежемесячно' },
  { value: 4, label: 'Ежеквартально' },
  { value: 1, label: 'Ежегодно' },
]

type View = 'year' | 'period'

export function AnnuityPage() {
  const [principal, setPrincipal] = useState('3 000 000')
  const [rate, setRate] = useState('16')
  const [years, setYears] = useState('10')
  const [perYear, setPerYear] = useState(12)
  const [view, setView] = useState<View>('year')

  const p = readNum(principal, { min: 0 })
  const r = readNum(rate, { min: 0 })
  const y = readNum(years, { min: 0 })
  const n = y === null ? null : Math.round(y * perYear)

  const result = (() => {
    if (p === null || r === null || n === null || n < 1 || n > 1200) return null
    const i = r / 100 / perYear
    const payment = pmt(i, n, p)
    const schedule = amortizationSchedule(i, n, p)
    const total = payment * n
    return { i, payment, schedule, total, overpay: total - p }
  })()

  const inputs = (
    <>
      <NumberField label="Сумма кредита" value={principal} onChange={setPrincipal} suffix="₽" min={0} />
      <NumberField label="Годовая ставка" value={rate} onChange={setRate} suffix="%" min={0} hint="Номинальная годовая ставка из договора" />
      <NumberField label="Срок" value={years} onChange={setYears} suffix="лет" min={0} hint="Можно дробное значение, например 2,5" />
      <SelectField label="Периодичность платежей" value={perYear} onChange={setPerYear} options={frequencies} />
    </>
  )

  const results = !result ? (
    <Notice>{t.calc.fixInputs} Срок должен давать от 1 до 1200 платежей.</Notice>
  ) : (
    <>
      <Panel title={t.calc.results}>
        <MetricGrid>
          <Metric primary label="Платёж (PMT)" value={fmtMoney(result.payment)} note={`${result.schedule.length} платежей, ставка за период ${fmtPct(result.i, 3)}`} />
          <Metric primary label="Переплата (проценты)" value={fmtMoney(result.overpay)} tone="bad" note={p ? `${fmtPct(result.overpay / p, 1)} от суммы кредита` : undefined} />
          <Metric label="Всего выплат" value={fmtMoney(result.total)} />
          <Metric label="Эффективная годовая ставка" value={fmtPct(effectiveAnnualRate(r! / 100, perYear))} note="С учётом начисления процентов внутри года" />
        </MetricGrid>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Каждый платёж одинаков, но его структура меняется: в первом платеже на проценты приходится {fmtMoney(result.schedule[0].interest)}{' '}
          ({fmtPct(result.schedule[0].interest / result.payment, 0)}), в последнем — {fmtMoney(result.schedule.at(-1)!.interest)}. Поэтому досрочное погашение
          в начале срока экономит больше всего процентов.
        </p>
      </Panel>

      <Panel title="График погашения">
        <Segmented
          label="Вид графика"
          value={view}
          onChange={setView}
          options={[
            { value: 'year', label: 'По годам' },
            { value: 'period', label: 'По платежам' },
          ]}
        />
        <div className={view === 'period' ? 'max-h-[28rem] overflow-y-auto' : ''}>
          <DataTable
            caption="График погашения кредита"
            columns={[view === 'year' ? 'Год' : '№', 'Платежи', 'Проценты', 'Основной долг', 'Остаток']}
            rows={(view === 'year' ? byYear(result.schedule, perYear) : result.schedule).map((row) => [
              row.period,
              fmtMoney(row.payment),
              fmtMoney(row.interest),
              fmtMoney(row.principal),
              fmtMoney(row.balance),
            ])}
          />
        </div>
      </Panel>
    </>
  )

  return (
    <CalcShell toolId="annuity">
      <CalcGrid inputs={inputs} results={results} />
      <div className="mt-6">
        <Explainer
          formulas={[
            { label: 'Аннуитетный платёж', tex: <>PMT = P · i / (1 − (1 + i)<sup>−n</sup>),   i = r / m,   n = m · T</> },
            { label: 'Проценты в периоде k', tex: <>I<sub>k</sub> = остаток<sub>k−1</sub> · i,   погашение долга = PMT − I<sub>k</sub></> },
          ]}
        >
          <p>
            P — сумма кредита, r — годовая ставка, m — число платежей в год, T — срок в годах. Аннуитет — равные платежи, при которых долг гасится ровно к концу срока.
          </p>
          <p>
            <b>Переплата</b> — сумма всех процентов. Она растёт со ставкой и сроком: удлинение срока снижает платёж, но увеличивает переплату.
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Excel: <code>=ПЛТ(r/12; T*12; -P)</code> (PMT). Реальный график банка может отличаться на копейки из-за округления платежей и учёта фактического числа дней.
          </p>
        </Explainer>
      </div>
    </CalcShell>
  )
}

/** Агрегирует помесячный график по годам */
function byYear(rows: ReturnType<typeof amortizationSchedule>, perYear: number) {
  const years: { period: number; payment: number; interest: number; principal: number; balance: number }[] = []
  for (const row of rows) {
    const year = Math.ceil(row.period / perYear)
    const last = years.at(-1)
    if (last && last.period === year) {
      last.payment += row.payment
      last.interest += row.interest
      last.principal += row.principal
      last.balance = row.balance
    } else {
      years.push({ ...row, period: year })
    }
  }
  return years
}

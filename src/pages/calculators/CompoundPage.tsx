import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalcGrid, CalcShell, DataTable, Explainer, Metric, MetricGrid, Notice, NumberField, Panel, Segmented, SelectField } from '../../components/calc'
import { t } from '../../i18n'
import { cagr, effectiveAnnualRate, growthSchedule, presentValue } from '../../lib/finance'
import { fmtMoney, fmtNum, fmtPct, readNum } from '../../lib/format'

type Mode = 'fv' | 'pv' | 'cagr'
const modes: { value: Mode; label: string }[] = [
  { value: 'fv', label: 'Будущая стоимость' },
  { value: 'pv', label: 'Дисконтирование' },
  { value: 'cagr', label: 'CAGR' },
]

const compounding = [
  { value: 1, label: 'Раз в год' },
  { value: 4, label: 'Ежеквартально' },
  { value: 12, label: 'Ежемесячно' },
  { value: 365, label: 'Ежедневно' },
]

export function CompoundPage() {
  // Режим хранится в URL, чтобы на него можно было сослаться: /tools/compound?mode=pv
  const [params, setParams] = useSearchParams()
  const raw = params.get('mode')
  const mode: Mode = raw === 'pv' || raw === 'cagr' ? raw : 'fv'
  const setMode = (m: Mode) => setParams(m === 'fv' ? {} : { mode: m }, { replace: true })

  return (
    <CalcShell toolId="compound">
      <Segmented label="Режим расчёта" value={mode} onChange={setMode} options={modes} />
      {mode === 'fv' && <FutureValue />}
      {mode === 'pv' && <Discounting />}
      {mode === 'cagr' && <Cagr />}
    </CalcShell>
  )
}

function FutureValue() {
  const [initial, setInitial] = useState('100 000')
  const [rate, setRate] = useState('10')
  const [years, setYears] = useState('10')
  const [m, setM] = useState(12)
  const [contribution, setContribution] = useState('0')

  const pv = readNum(initial, { min: 0 })
  const r = readNum(rate)
  const y = readNum(years, { min: 1, integer: true })
  const c = readNum(contribution, { min: 0 })

  const ok = pv !== null && r !== null && y !== null && y <= 100 && c !== null && r > -100
  const rows = ok ? growthSchedule(pv, r / 100, y, m, c) : []
  const last = rows.at(-1)

  return (
    <>
      <CalcGrid
        inputs={
          <>
            <NumberField label="Начальная сумма" value={initial} onChange={setInitial} suffix="₽" min={0} />
            <NumberField label="Годовая ставка (номинальная)" value={rate} onChange={setRate} suffix="%" />
            <NumberField label="Срок" value={years} onChange={setYears} suffix="лет" min={1} integer hint="Целое число лет, до 100" />
            <SelectField label="Капитализация процентов" value={m} onChange={setM} options={compounding} />
            <NumberField label="Пополнение в конце каждого года" value={contribution} onChange={setContribution} suffix="₽" min={0} />
          </>
        }
        results={
          !ok || !last ? (
            <Notice>{t.calc.fixInputs}</Notice>
          ) : (
            <>
              <Panel title={t.calc.results}>
                <MetricGrid>
                  <Metric primary label="Итоговая сумма (FV)" value={fmtMoney(last.balance)} />
                  <Metric primary label="Начисленные проценты" value={fmtMoney(last.interest)} tone={last.interest >= 0 ? 'good' : 'bad'} />
                  <Metric label="Вложено всего" value={fmtMoney(last.contributions)} />
                  <Metric label="Эффективная годовая ставка" value={fmtPct(effectiveAnnualRate(r! / 100, m), 3)} note="Реальный годовой прирост с учётом капитализации" />
                </MetricGrid>
                <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  За {y} лет вложенные {fmtMoney(last.contributions)} превратятся в {fmtMoney(last.balance)}
                  {last.contributions > 0 && <> — рост в {fmtNum(last.balance / last.contributions, 2)} раза</>}. Доля процентов в итоговой сумме —{' '}
                  {fmtPct(last.balance ? last.interest / last.balance : NaN, 0)}. Это номинальные деньги; чтобы оценить реальный рост, сравните ставку с инфляцией.
                </p>
              </Panel>
              <Panel title="Рост по годам">
                <DataTable
                  caption="Рост вклада по годам"
                  columns={['Год', 'Вложено', 'Проценты', 'Баланс']}
                  rows={rows.map((row) => [row.year, fmtMoney(row.contributions), fmtMoney(row.interest), fmtMoney(row.balance)])}
                />
              </Panel>
            </>
          )
        }
      />
      <div className="mt-6">
        <Explainer
          formulas={[
            { label: 'Будущая стоимость', tex: <>FV = PV · (1 + r / m)<sup>m·T</sup></> },
            { label: 'Эффективная годовая ставка', tex: <>EAR = (1 + r / m)<sup>m</sup> − 1</> },
          ]}
        >
          <p>PV — начальная сумма, r — номинальная годовая ставка, m — число капитализаций в год, T — срок в годах.</p>
          <p>
            Сложный процент — проценты начисляются и на ранее начисленные проценты. Чем чаще капитализация, тем выше эффективная ставка, но эффект невелик:
            12% с ежемесячной капитализацией дают 12,68% годовых.
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Excel: <code>=БС(r/m; m*T; 0; -PV)</code> (FV). Правило 72: деньги удваиваются примерно за 72 / (ставка в %) лет.
          </p>
        </Explainer>
      </div>
    </>
  )
}

function Discounting() {
  const [future, setFuture] = useState('1 000 000')
  const [rate, setRate] = useState('12')
  const [years, setYears] = useState('5')
  const [m, setM] = useState(1)

  const fv = readNum(future)
  const r = readNum(rate)
  const y = readNum(years, { min: 0 })
  const ok = fv !== null && r !== null && y !== null && r > -100

  const pv = ok ? presentValue(fv, r / 100, y, m) : NaN
  const df = ok ? presentValue(1, r / 100, y, m) : NaN

  return (
    <>
      <CalcGrid
        inputs={
          <>
            <NumberField label="Будущая сумма (FV)" value={future} onChange={setFuture} suffix="₽" />
            <NumberField label="Ставка дисконтирования, годовых" value={rate} onChange={setRate} suffix="%" hint="Требуемая доходность, ставка альтернативного вложения" />
            <NumberField label="Через сколько лет" value={years} onChange={setYears} suffix="лет" min={0} />
            <SelectField label="Капитализация" value={m} onChange={setM} options={compounding} />
          </>
        }
        results={
          !ok ? (
            <Notice>{t.calc.fixInputs}</Notice>
          ) : (
            <Panel title={t.calc.results}>
              <MetricGrid>
                <Metric primary label="Приведённая стоимость (PV)" value={fmtMoney(pv)} />
                <Metric primary label="Коэффициент дисконтирования" value={fmtNum(df, 4)} note="Сколько стоит сегодня 1 ₽, полученный через T лет" />
                <Metric label="Дисконт" value={fmtMoney(fv! - pv)} note={`${fmtPct(1 - df, 1)} от будущей суммы`} />
              </MetricGrid>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {fmtMoney(fv!)} через {fmtNum(y!, y! % 1 ? 1 : 0)} лет равноценны {fmtMoney(pv)} сегодня, если сегодняшние деньги можно разместить под {fmtPct(r! / 100)}{' '}
                годовых. Платить за это будущее поступление больше {fmtMoney(pv)} невыгодно.
              </p>
            </Panel>
          )
        }
      />
      <div className="mt-6">
        <Explainer formulas={[{ label: 'Приведённая стоимость', tex: <>PV = FV / (1 + r / m)<sup>m·T</sup></> }]}>
          <p>
            Дисконтирование — обратная операция к начислению сложного процента: она переводит будущие деньги в сегодняшние. Чем выше ставка и дальше срок, тем
            меньше будущий рубль стоит сегодня.
          </p>
          <p>Ставку выбирают по доходности альтернативы с сопоставимым риском: безрисковая ставка (ОФЗ), стоимость капитала компании (WACC) и т. п.</p>
          <p className="text-slate-500 dark:text-slate-400">
            Excel: <code>=ПС(r/m; m*T; 0; -FV)</code> (PV).
          </p>
        </Explainer>
      </div>
    </>
  )
}

function Cagr() {
  const [start, setStart] = useState('100')
  const [end, setEnd] = useState('180')
  const [years, setYears] = useState('5')

  const s = readNum(start)
  const e = readNum(end)
  const y = readNum(years)
  const value = s !== null && e !== null && y !== null ? cagr(s, e, y) : NaN
  const ok = Number.isFinite(value)

  return (
    <>
      <CalcGrid
        inputs={
          <>
            <NumberField label="Начальное значение" value={start} onChange={setStart} hint="Выручка, ВВП, стоимость портфеля…" />
            <NumberField label="Конечное значение" value={end} onChange={setEnd} />
            <NumberField label="Число лет между ними" value={years} onChange={setYears} suffix="лет" hint="Например, с 2019 по 2024 — 5 лет" />
          </>
        }
        results={
          !ok ? (
            <Notice>{t.calc.fixInputs} Начальное значение должно быть больше нуля, конечное — неотрицательным, срок — больше нуля.</Notice>
          ) : (
            <Panel title={t.calc.results}>
              <MetricGrid>
                <Metric primary label="CAGR — среднегодовой темп роста" value={fmtPct(value)} tone={value > 0 ? 'good' : value < 0 ? 'bad' : 'neutral'} />
                <Metric primary label="Рост за весь период" value={fmtPct(e! / s! - 1, 1)} note={`В ${fmtNum(e! / s!, 2)} раза`} />
              </MetricGrid>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Показатель {value >= 0 ? 'рос' : 'снижался'} в среднем на {fmtPct(Math.abs(value))} в год. Это сглаженный темп: фактический рост по годам мог
                сильно колебаться, но при постоянном темпе {fmtPct(value)} из {fmtNum(s!, 2)} за {fmtNum(y!, y! % 1 ? 1 : 0)} лет получилось бы ровно {fmtNum(e!, 2)}.
              </p>
            </Panel>
          )
        }
      />
      <div className="mt-6">
        <Explainer formulas={[{ label: 'Среднегодовой темп роста', tex: <>CAGR = (V<sub>конец</sub> / V<sub>начало</sub>)<sup>1/T</sup> − 1</> }]}>
          <p>
            CAGR — постоянный годовой темп, который привёл бы от начального значения к конечному. В отличие от среднего арифметического годовых темпов он
            учитывает эффект сложного процента: +50% и −50% дают среднее 0%, а CAGR — около −13,4%.
          </p>
          <p>Используйте CAGR для сравнения роста компаний, рынков или стран за периоды разной длины. Для реального роста сначала дефлируйте значения.</p>
          <p className="text-slate-500 dark:text-slate-400">
            Excel: <code>=(Конец/Начало)^(1/T)-1</code> или <code>=ЭКВ.СТАВКА(T; Начало; Конец)</code> (RRI).
          </p>
        </Explainer>
      </div>
    </>
  )
}

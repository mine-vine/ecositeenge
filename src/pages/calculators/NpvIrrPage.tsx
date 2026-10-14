import { useState } from 'react'
import { CalcGrid, CalcShell, DataTable, Explainer, Metric, MetricGrid, Notice, NumberField, Panel, SelectField } from '../../components/calc'
import { Icon } from '../../components/Icon'
import { t } from '../../i18n'
import { irr, npv, paybackPeriod, profitabilityIndex, signChanges } from '../../lib/finance'
import { fmtMoney, fmtNum, fmtPct, parseNum, readNum } from '../../lib/format'

type Unit = 'year' | 'quarter' | 'month'
const units: { value: Unit; label: string; short: string }[] = [
  { value: 'year', label: 'Год', short: 'лет' },
  { value: 'quarter', label: 'Квартал', short: 'кварталов' },
  { value: 'month', label: 'Месяц', short: 'месяцев' },
]

const DEFAULT_FLOWS = ['-1 000 000', '250 000', '300 000', '350 000', '400 000', '300 000']

/** Разбор вставки из Excel: числа через перевод строки, табуляцию или точку с запятой */
function parsePasted(text: string): string[] {
  return text
    .split(/[\n\t;]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '' && Number.isFinite(parseNum(s)))
}

export function NpvIrrPage() {
  const [rate, setRate] = useState('12')
  const [unit, setUnit] = useState<Unit>('year')
  const [flows, setFlows] = useState<string[]>(DEFAULT_FLOWS)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const unitInfo = units.find((u) => u.value === unit)!
  const r = readNum(rate, { min: -99.99 })
  const cf = flows.map((f) => parseNum(f))
  const valid = r !== null && cf.length >= 2 && cf.every(Number.isFinite)

  const result = (() => {
    if (!valid || r === null) return null
    const rr = r / 100
    let cumulative = 0
    const table = cf.map((c, i) => {
      const df = 1 / (1 + rr) ** i
      cumulative += c * df
      return [i, fmtMoney(c), fmtNum(df, 4), fmtMoney(c * df), fmtMoney(cumulative)]
    })
    return {
      npv: npv(rr, cf),
      irr: irr(cf),
      pi: profitabilityIndex(rr, cf),
      payback: paybackPeriod(cf),
      dpayback: paybackPeriod(cf, rr),
      multipleIrr: signChanges(cf) > 1,
      table,
    }
  })()

  const setFlow = (i: number, v: string) => setFlows((fs) => fs.map((f, j) => (j === i ? v : f)))

  const applyPaste = () => {
    const parsed = parsePasted(pasteText)
    if (parsed.length >= 2) {
      setFlows(parsed)
      setPasteOpen(false)
      setPasteText('')
    }
  }

  const inputs = (
    <>
      <NumberField label="Ставка дисконтирования за период" value={rate} onChange={setRate} suffix="%" hint="Требуемая доходность или WACC" />
      <SelectField label="Длина периода" value={unit} onChange={setUnit} options={units} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Денежные потоки</span>
          <button type="button" onClick={() => setPasteOpen((o) => !o)} className="text-xs font-medium text-brand-700 hover:underline dark:text-blue-300">
            Вставить из Excel
          </button>
        </div>
        {pasteOpen && (
          <div className="mb-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              placeholder={'Скопируйте столбец или строку чисел из таблицы\n-1000\n300\n400'}
              className="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={applyPaste}
              disabled={parsePasted(pasteText).length < 2}
              className="mt-2 rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
            >
              Заменить потоки ({parsePasted(pasteText).length})
            </button>
          </div>
        )}
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Период 0 — первоначальные вложения (со знаком минус), далее — потоки на конец каждого периода.</p>
        <ol className="space-y-2">
          {flows.map((f, i) => {
            const bad = f.trim() === '' || !Number.isFinite(parseNum(f))
            return (
              <li key={i} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-right text-xs text-slate-500 tabular-nums dark:text-slate-400">{i}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Поток периода ${i}`}
                  value={f}
                  onChange={(e) => setFlow(i, e.target.value)}
                  className={`w-full rounded-md border bg-white px-3 py-1.5 text-sm tabular-nums dark:bg-slate-950 ${
                    bad ? 'border-rose-400 dark:border-rose-700' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setFlows((fs) => fs.filter((_, j) => j !== i))}
                  disabled={flows.length <= 2}
                  aria-label={`Удалить период ${i}`}
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
          onClick={() => setFlows((fs) => [...fs, fs.at(-1) ?? '0'])}
          className="mt-3 w-full rounded-md border border-dashed border-slate-300 py-1.5 text-sm text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-blue-300"
        >
          + Добавить период
        </button>
      </div>
    </>
  )

  const results = !result ? (
    <Notice>{t.calc.fixInputs} Нужно минимум два потока и ставка больше −100%.</Notice>
  ) : (
    <>
      <Panel title={t.calc.results}>
        <MetricGrid>
          <Metric primary label="NPV — чистая приведённая стоимость" value={fmtMoney(result.npv)} tone={result.npv > 0 ? 'good' : result.npv < 0 ? 'bad' : 'neutral'} />
          <Metric
            primary
            label={`IRR — внутренняя норма доходности (за ${unitInfo.label.toLowerCase()})`}
            value={result.irr === null ? 'не существует' : fmtPct(result.irr)}
            note={result.irr === null ? 'Потоки не меняют знак' : undefined}
          />
          <Metric label="PI — индекс доходности" value={result.pi === null ? '—' : fmtNum(result.pi, 2)} note={result.pi === null ? 'Нужны вложения в периоде 0' : 'PV поступлений на 1 вложенный рубль'} />
          <Metric
            label="Срок окупаемости: простой / дисконтированный"
            value={`${result.payback === null ? '—' : fmtNum(result.payback, 2)} / ${result.dpayback === null ? '—' : fmtNum(result.dpayback, 2)}`}
            note={`В периодах (${unitInfo.short}). «—» — не окупается на горизонте расчёта`}
          />
        </MetricGrid>
        {result.multipleIrr && (
          <div className="mt-4">
            <Notice>
              Знак потоков меняется больше одного раза — IRR может быть не единственной. Показан наименьший корень; ориентируйтесь в первую очередь на NPV.
            </Notice>
          </div>
        )}
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{interpret(result.npv, result.irr, r! / 100)}</p>
      </Panel>

      <Panel title="Расчёт по периодам">
        <DataTable columns={['Период', 'Поток', 'Коэф. дисконт.', 'PV потока', 'Накопленный PV']} rows={result.table} caption="Дисконтирование денежных потоков" />
      </Panel>
    </>
  )

  return (
    <CalcShell toolId="npv-irr">
      <CalcGrid inputs={inputs} results={results} />
      <div className="mt-6">
        <Explainer
          formulas={[
            { label: 'NPV', tex: <>NPV = Σ<sub>t=0…n</sub> CF<sub>t</sub> / (1 + r)<sup>t</sup></> },
            { label: 'IRR — ставка, при которой', tex: <>Σ<sub>t=0…n</sub> CF<sub>t</sub> / (1 + IRR)<sup>t</sup> = 0</> },
            { label: 'Индекс доходности', tex: <>PI = Σ<sub>t=1…n</sub> CF<sub>t</sub> / (1 + r)<sup>t</sup> ÷ |CF<sub>0</sub>|</> },
          ]}
        >
          <p>
            <b>NPV &gt; 0</b> — проект зарабатывает больше требуемой доходности r и увеличивает стоимость для инвестора. <b>NPV &lt; 0</b> — при такой ставке
            вложения выгоднее направить в альтернативу с доходностью r.
          </p>
          <p>
            <b>IRR</b> сравнивают со ставкой дисконтирования: IRR &gt; r эквивалентно NPV &gt; 0 для «обычных» проектов (сначала вложения, потом поступления).
            При сравнении проектов разного масштаба решающим остаётся NPV.
          </p>
          <p>
            <b>Срок окупаемости</b> — момент, когда накопленный поток выходит в плюс; дисконтированный учитывает стоимость денег во времени и всегда не короче простого.
            Внутри периода поступления считаются равномерными.
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Excel: функция ЧПС (NPV) дисконтирует уже первый поток, поэтому эквивалент здесь — <code>=ЧПС(r; CF1:CFn) + CF0</code>; IRR — <code>=ВСД(CF0:CFn)</code>.
          </p>
        </Explainer>
      </div>
    </CalcShell>
  )
}

function interpret(npvValue: number, irrValue: number | null, r: number): string {
  const irrPart = irrValue === null ? '' : ` IRR (${fmtPct(irrValue)}) ${irrValue > r ? 'выше' : irrValue < r ? 'ниже' : 'равна'} ставки дисконтирования (${fmtPct(r)}).`
  if (npvValue > 0) return `Проект выгоден: с учётом стоимости денег во времени он приносит на ${fmtMoney(npvValue)} больше, чем альтернатива с доходностью ${fmtPct(r)}.${irrPart}`
  if (npvValue < 0) return `При ставке ${fmtPct(r)} проект не окупает требуемую доходность: недостача в сегодняшних деньгах — ${fmtMoney(-npvValue)}.${irrPart}`
  return `Проект ровно окупает требуемую доходность ${fmtPct(r)}.${irrPart}`
}

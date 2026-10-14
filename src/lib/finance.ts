// Финансовые расчёты. Ставки везде — в долях (0.1 = 10%).
// Соглашение по денежным потокам: cashFlows[0] — поток в момент t = 0 (не дисконтируется),
// cashFlows[t] — поток в конце периода t.

/** Чистая приведённая стоимость: NPV = Σ CFₜ / (1 + r)ᵗ, t = 0…n */
export function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((sum, cf, t) => sum + cf / (1 + rate) ** t, 0)
}

/** Число смен знака в ряду потоков (нули пропускаются). Больше одной — IRR может быть не единственной. */
export function signChanges(cashFlows: number[]): number {
  const signs = cashFlows.filter((cf) => cf !== 0).map(Math.sign)
  let changes = 0
  for (let i = 1; i < signs.length; i++) if (signs[i] !== signs[i - 1]) changes++
  return changes
}

/**
 * Внутренняя норма доходности — ставка, при которой NPV = 0.
 * Ищем отрезок со сменой знака NPV на сетке ставок, затем уточняем бисекцией.
 * Возвращает наименьший найденный корень больше −100% или null, если его нет.
 */
export function irr(cashFlows: number[]): number | null {
  if (signChanges(cashFlows) === 0) return null
  const f = (r: number) => npv(r, cashFlows)

  // Сетка плотнее около нуля, где обычно находится ответ
  const grid: number[] = []
  for (let r = -0.99; r < 1; r += 0.01) grid.push(r)
  for (let r = 1; r <= 100; r *= 1.1) grid.push(r)

  for (let i = 1; i < grid.length; i++) {
    let lo = grid[i - 1]
    let hi = grid[i]
    let flo = f(lo)
    const fhi = f(hi)
    if (flo === 0) return lo
    if (Math.sign(flo) === Math.sign(fhi)) continue
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2
      const fmid = f(mid)
      if (Math.abs(hi - lo) < 1e-12 || fmid === 0) return mid
      if (Math.sign(fmid) === Math.sign(flo)) {
        lo = mid
        flo = fmid
      } else {
        hi = mid
      }
    }
    return (lo + hi) / 2
  }
  return null
}

/**
 * Срок окупаемости в периодах (с дробной частью по линейной интерполяции внутри периода).
 * discountRate = null — простой срок; число — дисконтированный срок.
 * null, если проект не окупается на горизонте потоков.
 */
export function paybackPeriod(cashFlows: number[], discountRate: number | null = null): number | null {
  if (cashFlows.length === 0) return null
  const pv = (t: number) => (discountRate === null ? cashFlows[t] : cashFlows[t] / (1 + discountRate) ** t)
  let cumulative = pv(0)
  if (cumulative >= 0) return 0
  for (let t = 1; t < cashFlows.length; t++) {
    const prev = cumulative
    const cf = pv(t)
    cumulative += cf
    // prev < 0 и cumulative ≥ 0 ⇒ cf > 0, деление безопасно
    if (cumulative >= 0) return t - 1 + -prev / cf
  }
  return null
}

/** Индекс доходности: PV потоков периодов 1…n / |CF₀|. null, если CF₀ не является вложением. */
export function profitabilityIndex(rate: number, cashFlows: number[]): number | null {
  const invest = cashFlows[0]
  if (invest === undefined || invest >= 0) return null
  return (npv(rate, cashFlows) - invest) / -invest
}

/**
 * Аннуитетный платёж (положительное число), аналог −PMT в Excel.
 * PMT = P · i / (1 − (1 + i)⁻ⁿ), где i — ставка за период, n — число периодов.
 */
export function pmt(ratePerPeriod: number, periods: number, principal: number): number {
  if (periods <= 0) return NaN
  if (ratePerPeriod === 0) return principal / periods
  return (principal * ratePerPeriod) / (1 - (1 + ratePerPeriod) ** -periods)
}

export interface AmortizationRow {
  period: number
  payment: number
  interest: number
  principal: number
  balance: number
}

/** График погашения аннуитетного кредита */
export function amortizationSchedule(ratePerPeriod: number, periods: number, principal: number): AmortizationRow[] {
  const payment = pmt(ratePerPeriod, periods, principal)
  const rows: AmortizationRow[] = []
  let balance = principal
  for (let period = 1; period <= periods; period++) {
    const interest = balance * ratePerPeriod
    // В последнем периоде гасим остаток целиком, чтобы убрать накопленную ошибку округления
    const principalPart = period === periods ? balance : payment - interest
    balance -= principalPart
    rows.push({ period, payment: interest + principalPart, interest, principal: principalPart, balance: Math.abs(balance) < 1e-9 ? 0 : balance })
  }
  return rows
}

/** Эффективная годовая ставка при капитализации m раз в год: (1 + r/m)ᵐ − 1 */
export function effectiveAnnualRate(nominalRate: number, compoundsPerYear: number): number {
  return (1 + nominalRate / compoundsPerYear) ** compoundsPerYear - 1
}

/** Будущая стоимость: FV = PV · (1 + r/m)^(m·t) */
export function futureValue(presentValue: number, rate: number, years: number, compoundsPerYear = 1): number {
  return presentValue * (1 + rate / compoundsPerYear) ** (compoundsPerYear * years)
}

/** Приведённая стоимость (дисконтирование): PV = FV / (1 + r/m)^(m·t) */
export function presentValue(futureVal: number, rate: number, years: number, compoundsPerYear = 1): number {
  return futureVal / (1 + rate / compoundsPerYear) ** (compoundsPerYear * years)
}

export interface GrowthRow {
  year: number
  contributions: number
  interest: number
  balance: number
}

/**
 * Рост вклада по годам: начальная сумма, капитализация m раз в год,
 * пополнение в конце каждого года.
 */
export function growthSchedule(
  initial: number,
  rate: number,
  years: number,
  compoundsPerYear = 1,
  annualContribution = 0,
): GrowthRow[] {
  const growth = (1 + rate / compoundsPerYear) ** compoundsPerYear
  const rows: GrowthRow[] = []
  let balance = initial
  let contributions = initial
  for (let year = 1; year <= years; year++) {
    balance = balance * growth + annualContribution
    contributions += annualContribution
    rows.push({ year, contributions, interest: balance - contributions, balance })
  }
  return rows
}

/** Среднегодовой темп роста: CAGR = (конец / начало)^(1/лет) − 1 */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue < 0 || years <= 0) return NaN
  return (endValue / startValue) ** (1 / years) - 1
}

/** Накопленная инфляция по ставкам за периоды: Π(1 + πₜ) − 1 */
export function cumulativeInflation(rates: number[]): number {
  return rates.reduce((acc, r) => acc * (1 + r), 1) - 1
}

/** Средний темп инфляции за период (геометрическое среднее) */
export function averageInflation(rates: number[]): number {
  if (rates.length === 0) return NaN
  return (1 + cumulativeInflation(rates)) ** (1 / rates.length) - 1
}

/** Покупательная способность суммы после накопленной инфляции: S / (1 + π_накопл) */
export function purchasingPower(amount: number, cumulative: number): number {
  return amount / (1 + cumulative)
}

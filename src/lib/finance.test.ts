import { describe, expect, it } from 'vitest'
import {
  amortizationSchedule,
  averageInflation,
  cagr,
  cumulativeInflation,
  effectiveAnnualRate,
  futureValue,
  growthSchedule,
  irr,
  npv,
  paybackPeriod,
  pmt,
  presentValue,
  profitabilityIndex,
  purchasingPower,
  signChanges,
} from './finance'

describe('npv', () => {
  it('дисконтирует с t = 0', () => {
    // Excel: =NPV(10%;300;400;500)-1000 = -21.04
    expect(npv(0.1, [-1000, 300, 400, 500])).toBeCloseTo(-21.04, 2)
  })
  it('при нулевой ставке равна сумме потоков', () => {
    expect(npv(0, [-100, 30, 80])).toBe(10)
  })
})

describe('irr', () => {
  it('простой случай', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 9)
  })
  it('совпадает с Excel IRR', () => {
    // Excel: =IRR({-1000;300;400;500}) = 8.896%
    expect(irr([-1000, 300, 400, 500])!).toBeCloseTo(0.08896, 5)
  })
  it('NPV при IRR равна нулю', () => {
    const cf = [-5000, 1200, 1500, 1800, 2000, 900]
    expect(npv(irr(cf)!, cf)).toBeCloseTo(0, 6)
  })
  it('отрицательная IRR', () => {
    expect(irr([-100, 50, 40])!).toBeLessThan(0)
    expect(npv(irr([-100, 50, 40])!, [-100, 50, 40])).toBeCloseTo(0, 6)
  })
  it('нет смены знака — нет IRR', () => {
    expect(irr([100, 50])).toBeNull()
    expect(irr([-100, -50])).toBeNull()
  })
  it('считает смены знака', () => {
    expect(signChanges([-100, 230, -132])).toBe(2)
    expect(signChanges([-100, 0, 50, 50])).toBe(1)
  })
})

describe('paybackPeriod', () => {
  it('простой срок с интерполяцией', () => {
    // -1000 → -700 → -300 → +200: окупается в 3-м году, 300/500 = 0.6
    expect(paybackPeriod([-1000, 300, 400, 500])).toBeCloseTo(2.6, 10)
  })
  it('дисконтированный срок больше простого', () => {
    const cf = [-1000, 400, 400, 400, 400]
    expect(paybackPeriod(cf, 0.1)!).toBeGreaterThan(paybackPeriod(cf)!)
  })
  it('не окупается', () => {
    expect(paybackPeriod([-1000, 300, 400, 500], 0.1)).toBeNull()
  })
})

describe('profitabilityIndex', () => {
  it('PI = 1 + NPV / I', () => {
    const cf = [-1000, 300, 400, 500]
    expect(profitabilityIndex(0.1, cf)).toBeCloseTo(1 + npv(0.1, cf) / 1000, 10)
  })
  it('нет вложений — нет индекса', () => {
    expect(profitabilityIndex(0.1, [100, 200])).toBeNull()
  })
})

describe('pmt и график погашения', () => {
  it('совпадает с Excel PMT', () => {
    // Excel: =-PMT(1%;12;10000) = 888.49
    expect(pmt(0.01, 12, 10000)).toBeCloseTo(888.49, 2)
  })
  it('нулевая ставка', () => {
    expect(pmt(0, 10, 1000)).toBe(100)
  })
  it('график гасит долг полностью', () => {
    const rows = amortizationSchedule(0.01, 12, 10000)
    expect(rows).toHaveLength(12)
    expect(rows.at(-1)!.balance).toBe(0)
    const principalSum = rows.reduce((s, r) => s + r.principal, 0)
    expect(principalSum).toBeCloseTo(10000, 8)
    expect(rows[0].interest).toBeCloseTo(100, 10)
  })
})

describe('сложный процент', () => {
  it('FV и PV взаимно обратны', () => {
    const fv = futureValue(1000, 0.08, 5, 12)
    expect(fv).toBeCloseTo(1489.85, 2)
    expect(presentValue(fv, 0.08, 5, 12)).toBeCloseTo(1000, 8)
  })
  it('эффективная ставка', () => {
    expect(effectiveAnnualRate(0.12, 12)).toBeCloseTo(0.126825, 6)
  })
  it('рост с пополнениями', () => {
    const rows = growthSchedule(1000, 0.1, 2, 1, 100)
    // 1000 → 1100 + 100 = 1200 → 1320 + 100 = 1420
    expect(rows.at(-1)!.balance).toBeCloseTo(1420, 10)
    expect(rows.at(-1)!.contributions).toBe(1200)
    expect(rows.at(-1)!.interest).toBeCloseTo(220, 10)
  })
  it('CAGR', () => {
    expect(cagr(100, 200, 5)).toBeCloseTo(0.148698, 6)
    expect(cagr(0, 200, 5)).toBeNaN()
  })
})

describe('инфляция', () => {
  it('накопленная и средняя', () => {
    const rates = [0.1, 0.05]
    expect(cumulativeInflation(rates)).toBeCloseTo(0.155, 10)
    expect(averageInflation(rates)).toBeCloseTo(Math.sqrt(1.155) - 1, 10)
  })
  it('покупательная способность', () => {
    expect(purchasingPower(1155, 0.155)).toBeCloseTo(1000, 10)
  })
})

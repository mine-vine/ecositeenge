import { describe, expect, it } from 'vitest'
import { canResample, deflate, diff, pctChange, rebase, resample, yearsOf } from './transforms'
import type { Point } from './types'

const pts = (pairs: [string, number | null][]): Point[] => pairs.map(([date, value]) => ({ date, value }))

describe('pctChange и diff', () => {
  const s = pts([
    ['2020-01-01', 100],
    ['2021-01-01', 110],
    ['2022-01-01', null],
    ['2023-01-01', 121],
  ])
  it('темп роста к предыдущему периоду', () => {
    const r = pctChange(s)
    expect(r[0].value).toBeNull()
    expect(r[1].value).toBeCloseTo(10, 10)
    expect(r[2].value).toBeNull()
    expect(r[3].value).toBeNull() // предыдущее — пропуск
  })
  it('лаг 2', () => {
    expect(pctChange(s, 2)[3].value).toBeCloseTo(10, 10)
  })
  it('разность', () => {
    expect(diff(s)[1].value).toBe(10)
  })
})

describe('rebase', () => {
  it('база — среднее за год', () => {
    const s = pts([
      ['2020-01-01', 90],
      ['2020-07-01', 110],
      ['2021-01-01', 150],
    ])
    const r = rebase(s, 2020)!
    ;[90, 110, 150].forEach((v, i) => expect(r[i].value).toBeCloseTo(v, 10))
  })
  it('нет данных за базовый год', () => {
    expect(rebase(pts([['2020-01-01', 1]]), 1999)).toBeNull()
  })
})

describe('resample', () => {
  const monthly = Array.from({ length: 14 }, (_, i) => ({
    date: `${2020 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    value: i + 1,
  }))
  it('месяц → квартал, среднее', () => {
    const q = resample(monthly, 'M', 'Q', 'mean')
    expect(q[0]).toEqual({ date: '2020-01-01', value: 2 })
    expect(q[3]).toEqual({ date: '2020-10-01', value: 11 })
    expect(q).toHaveLength(4) // 2021 К1 неполный (2 месяца) — отброшен
  })
  it('месяц → год, сумма и конец периода', () => {
    expect(resample(monthly, 'M', 'A', 'sum')).toEqual([{ date: '2020-01-01', value: 78 }])
    expect(resample(monthly, 'M', 'A', 'last')).toEqual([{ date: '2020-01-01', value: 12 }])
  })
  it('повышение частоты запрещено', () => {
    expect(canResample('A', 'Q')).toBe(false)
    expect(() => resample(monthly, 'A', 'M', 'mean')).toThrow()
  })
  it('дневные данные — без проверки полноты', () => {
    const d = pts([
      ['2024-01-02', 1],
      ['2024-01-03', 3],
      ['2024-02-01', 5],
    ])
    expect(resample(d, 'D', 'M', 'mean')).toEqual([
      { date: '2024-01-01', value: 2 },
      { date: '2024-02-01', value: 5 },
    ])
  })
})

describe('deflate', () => {
  it('номинал в ценах базового года', () => {
    const nominal = pts([
      ['2020-01-01', 1000],
      ['2021-01-01', 1100],
    ])
    const cpi = pts([
      ['2020-01-01', 200],
      ['2021-01-01', 220],
    ])
    const real = deflate(nominal, cpi, 2020)!
    expect(real[0].value).toBeCloseTo(1000, 10)
    expect(real[1].value).toBeCloseTo(1000, 10)
  })
  it('несовпадающие даты дают пропуски', () => {
    const real = deflate(pts([['2019-01-01', 1]]), pts([['2020-01-01', 100]]), 2020)!
    expect(real[0].value).toBeNull()
  })
})

it('yearsOf', () => {
  expect(yearsOf(pts([['2021-05-01', 1], ['2020-01-01', 2], ['2022-01-01', null]]))).toEqual([2020, 2021])
})

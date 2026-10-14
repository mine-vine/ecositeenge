import { describe, expect, it } from 'vitest'
import { formatDate, shortLabels, toCSV, toWideTable, toXLSX } from './table'
import type { Series } from './types'

const mk = (key: string, country: string | undefined, points: [string, number | null][]): Series => ({
  key,
  source: 'worldbank',
  id: 'X',
  title: 'GDP, "current"',
  units: 'US$',
  frequency: 'A',
  country,
  points: points.map(([date, value]) => ({ date, value })),
  retrievedAt: '2026-01-01T00:00:00Z',
})

describe('таблица', () => {
  const a = mk('a', 'Германия', [['2020-01-01', 1], ['2021-01-01', 2]])
  const b = mk('b', 'Франция', [['2021-01-01', 3], ['2022-01-01', null]])

  it('объединяет ряды по датам', () => {
    const t = toWideTable([a, b])
    expect(t.dates).toEqual(['2020-01-01', '2021-01-01', '2022-01-01'])
    expect(t.columns[0].values).toEqual([1, 2, null])
    expect(t.columns[1].values).toEqual([null, 3, null])
  })
  it('короткие подписи для одного показателя', () => {
    expect(shortLabels([a, b])).toEqual(['Германия', 'Франция'])
    expect(shortLabels([a])).toEqual(['Германия — GDP, "current"'])
  })
  it('CSV с BOM, экранированием и пустыми пропусками', () => {
    const csv = toCSV([a])
    expect(csv.startsWith('﻿date,"Германия — GDP, ""current"""\r\n')).toBe(true)
    expect(csv).toContain('2020-01-01,1\r\n')
    expect(toCSV([a, b])).toContain('2022-01-01,,\r\n')
  })
  it('XLSX собирается', async () => {
    const blob = await toXLSX([a, b])
    expect(blob.size).toBeGreaterThan(1000)
  })
  it('подписи дат', () => {
    expect(formatDate('2020-07-01', 'Q')).toBe('2020 К3')
    expect(formatDate('2020-03-01', 'M')).toBe('мар 2020')
    expect(formatDate('2020-03-15', 'D')).toBe('15.03.2020')
  })
})

describe('подпись источника', () => {
  it('производный ряд сохраняет исходный источник', async () => {
    const { derive } = await import('./transforms')
    const { sourceLine } = await import('./table')
    const base = mk('a', 'Германия', [['2020-01-01', 1]])
    const d = derive(base, base.points, { derivation: 'x' })
    expect(d.origin).toBe('worldbank')
    expect(sourceLine([d])).toMatch(/^Источник: World Bank \(с преобразованием\)/)
    expect(derive(d, d.points, { derivation: 'y' }).origin).toBe('worldbank')
  })
})

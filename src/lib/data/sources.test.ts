// Проверка разбора ответов API на образцах в документированном формате
import { describe, expect, it } from 'vitest'
import { mapFrequency, parseObservations as parseFred } from './fred'
import { parseCountries, parseObservations as parseWb, parseWbDate } from './worldbank'

describe('World Bank', () => {
  it('даты разной частоты', () => {
    expect(parseWbDate('2020')).toEqual({ date: '2020-01-01', freq: 'A' })
    expect(parseWbDate('2020Q3')).toEqual({ date: '2020-07-01', freq: 'Q' })
    expect(parseWbDate('2020M05')).toEqual({ date: '2020-05-01', freq: 'M' })
  })

  it('строки ответа → ряды по странам, по возрастанию дат', () => {
    const row = (iso2: string, iso3: string, name: string, date: string, value: number | null) => ({
      indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
      country: { id: iso2, value: name },
      countryiso3code: iso3,
      date,
      value,
      unit: '',
    })
    const series = parseWb([
      row('US', 'USA', 'United States', '2021', 2.3e13),
      row('US', 'USA', 'United States', '2020', 2.1e13),
      row('DE', 'DEU', 'Germany', '2021', null),
      row('DE', 'DEU', 'Germany', '2020', 3.9e12),
    ])
    expect(series).toHaveLength(2)
    const us = series.find((s) => s.key === 'worldbank:NY.GDP.MKTP.CD:USA')!
    expect(us.points.map((p) => p.date)).toEqual(['2020-01-01', '2021-01-01'])
    expect(us.units).toBe('current US$')
    expect(us.frequency).toBe('A')
    expect(us.country).toBe('Соединенные Штаты')
    expect(series[1].points[1].value).toBeNull()
  })

  it('агрегаты отделены от стран и идут после них', () => {
    const list = parseCountries([
      { id: 'WLD', iso2Code: '1W', name: 'World', region: { id: 'NA', value: 'Aggregates' } },
      { id: 'DEU', iso2Code: 'DE', name: 'Germany', region: { id: 'ECS', value: 'Europe & Central Asia' } },
    ])
    expect(list[0]).toMatchObject({ id: 'DEU', name: 'Германия', isAggregate: false })
    expect(list[1]).toMatchObject({ id: 'WLD', name: 'World', isAggregate: true })
  })
})

describe('FRED', () => {
  it('точка означает пропуск', () => {
    expect(parseFred([{ date: '2020-01-01', value: '1.5' }, { date: '2020-02-01', value: '.' }])).toEqual([
      { date: '2020-01-01', value: 1.5 },
      { date: '2020-02-01', value: null },
    ])
  })
  it('частоты', () => {
    expect(mapFrequency('M')).toBe('M')
    expect(mapFrequency('BW')).toBe('W')
    expect(mapFrequency('SA')).toBe('S')
    expect(mapFrequency('D')).toBe('D')
  })
})

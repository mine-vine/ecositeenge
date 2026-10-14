import { describe, expect, it } from 'vitest'
import { fmtPct, parseNum } from './format'

describe('parseNum', () => {
  it('понимает запятую и пробелы', () => {
    expect(parseNum('1 234,5')).toBe(1234.5)
    expect(parseNum('1 000')).toBe(1000)
    expect(parseNum('−200')).toBe(-200)
  })
  it('пустое и мусор → NaN', () => {
    expect(parseNum('')).toBeNaN()
    expect(parseNum('abc')).toBeNaN()
  })
})

describe('fmtPct', () => {
  it('форматирует долю', () => {
    expect(fmtPct(0.0812)).toBe('8,12%')
  })
})

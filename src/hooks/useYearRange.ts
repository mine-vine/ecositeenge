import { useState } from 'react'
import { readNum } from '../lib/format'

export interface YearRangeState {
  fromText: string
  toText: string
  setFrom: (v: string) => void
  setTo: (v: string) => void
  from: number | null
  to: number | null
  valid: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

/** Период «с — по» в годах */
export function useYearRange(defaultFrom: number, defaultTo = CURRENT_YEAR): YearRangeState {
  const [fromText, setFrom] = useState(String(defaultFrom))
  const [toText, setTo] = useState(String(defaultTo))
  const from = readNum(fromText, { integer: true, min: 1900 })
  const to = readNum(toText, { integer: true, min: 1900 })
  return { fromText, toText, setFrom, setTo, from, to, valid: from !== null && to !== null && from <= to }
}

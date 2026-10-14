import type { YearRangeState } from '../../hooks/useYearRange'
import { NumberField } from '../calc'

export function YearRange({ fromText, toText, setFrom, setTo, from, to, valid }: YearRangeState) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="С года" value={fromText} onChange={setFrom} integer min={1900} />
        <NumberField label="По год" value={toText} onChange={setTo} integer min={1900} />
      </div>
      {!valid && from !== null && to !== null && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Начальный год позже конечного</p>}
    </div>
  )
}

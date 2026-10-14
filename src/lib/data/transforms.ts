import { periodsPerYear, type Frequency, type Point, type Series } from './types'

const year = (date: string) => Number(date.slice(0, 4))
const month = (date: string) => Number(date.slice(5, 7))
const pad = (n: number) => String(n).padStart(2, '0')

/** Процентное изменение к значению lag периодов назад: (xₜ / xₜ₋ₗ − 1) · 100 */
export function pctChange(points: Point[], lag = 1): Point[] {
  return points.map((p, i) => {
    const prev = points[i - lag]?.value
    const value = p.value === null || prev == null || prev === 0 ? null : (p.value / prev - 1) * 100
    return { date: p.date, value }
  })
}

/** Абсолютное изменение: xₜ − xₜ₋ₗ */
export function diff(points: Point[], lag = 1): Point[] {
  return points.map((p, i) => {
    const prev = points[i - lag]?.value
    return { date: p.date, value: p.value === null || prev == null ? null : p.value - prev }
  })
}

/** Индекс с базой = 100: среднее значение за базовый год принимается за 100 */
export function rebase(points: Point[], baseYear: number): Point[] | null {
  const base = points.filter((p) => year(p.date) === baseYear && p.value !== null).map((p) => p.value!)
  if (base.length === 0) return null
  const mean = base.reduce((a, b) => a + b, 0) / base.length
  if (mean === 0) return null
  return points.map((p) => ({ date: p.date, value: p.value === null ? null : (p.value / mean) * 100 }))
}

export type AggMethod = 'mean' | 'sum' | 'last'

export const aggLabels: Record<AggMethod, string> = {
  mean: 'Среднее за период',
  sum: 'Сумма за период',
  last: 'Значение на конец периода',
}

/** Начало периода целевой частоты, в который попадает дата */
function periodStart(date: string, target: Frequency): string {
  const y = year(date)
  const m = month(date)
  switch (target) {
    case 'A':
      return `${y}-01-01`
    case 'S':
      return `${y}-${m <= 6 ? '01' : '07'}-01`
    case 'Q':
      return `${y}-${pad(Math.floor((m - 1) / 3) * 3 + 1)}-01`
    case 'M':
      return `${y}-${pad(m)}-01`
    default:
      return date
  }
}

/** Можно ли понизить частоту from → to */
export function canResample(from: Frequency, to: Frequency): boolean {
  return periodsPerYear[to] < periodsPerYear[from] && ['M', 'Q', 'S', 'A'].includes(to)
}

/**
 * Понижение частоты (месяц → квартал → год).
 * Для месячных/квартальных рядов неполные периоды отбрасываются, чтобы, например,
 * сумма за год из 7 месяцев не выглядела как падение.
 */
export function resample(points: Point[], from: Frequency, to: Frequency, method: AggMethod): Point[] {
  if (!canResample(from, to)) throw new Error(`Нельзя преобразовать частоту ${from} → ${to}`)
  const groups = new Map<string, number[]>()
  for (const p of points) {
    if (p.value === null) continue
    const key = periodStart(p.date, to)
    const g = groups.get(key)
    if (g) g.push(p.value)
    else groups.set(key, [p.value])
  }
  // Для дневных и недельных рядов число наблюдений в периоде непостоянно — не проверяем полноту
  const expected = from === 'D' || from === 'W' ? null : periodsPerYear[from] / periodsPerYear[to]
  const out: Point[] = []
  for (const [date, values] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (expected !== null && values.length < expected) continue
    const value =
      method === 'sum' ? values.reduce((a, b) => a + b, 0) : method === 'last' ? values[values.length - 1] : values.reduce((a, b) => a + b, 0) / values.length
    out.push({ date, value })
  }
  return out
}

/**
 * Дефлирование: реальное значение = номинал / (индекс цен / 100),
 * где индекс цен приведён к базе 100 в базовом году. Даты сопоставляются точно.
 */
export function deflate(nominal: Point[], deflator: Point[], baseYear: number): Point[] | null {
  const index = rebase(deflator, baseYear)
  if (!index) return null
  const byDate = new Map(index.map((p) => [p.date, p.value]))
  return nominal.map((p) => {
    const idx = byDate.get(p.date)
    return { date: p.date, value: p.value === null || idx == null || idx === 0 ? null : p.value / (idx / 100) }
  })
}

/** Годы, за которые в ряду есть данные */
export function yearsOf(points: Point[]): number[] {
  return [...new Set(points.filter((p) => p.value !== null).map((p) => year(p.date)))].sort((a, b) => a - b)
}

/** Лаг для сравнения «год к году» */
export function yoyLag(freq: Frequency): number | null {
  return freq === 'D' || freq === 'W' ? null : periodsPerYear[freq]
}

/** Новый производный ряд на основе исходного */
export function derive(base: Series, points: Point[], patch: Partial<Series> & { derivation: string }): Series {
  return {
    ...base,
    source: 'derived',
    origin: base.source === 'derived' ? base.origin : base.source,
    // Ключ детерминирован: повторное добавление того же преобразования заменит ряд, а не создаст копию
    key: `derived:${base.key}:${patch.derivation}`,
    points,
    ...patch,
  }
}

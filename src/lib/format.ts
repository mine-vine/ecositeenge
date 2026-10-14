const numberFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
const intFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

/** 1234567.891 → «1 234 567,89» */
export function fmtMoney(x: number): string {
  return Number.isFinite(x) ? numberFmt.format(x) : '—'
}

/** Число с заданной точностью */
export function fmtNum(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '—'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(x)
}

export function fmtInt(x: number): string {
  return Number.isFinite(x) ? intFmt.format(x) : '—'
}

/** Доля → проценты: 0.0812 → «8,12%» */
export function fmtPct(x: number, digits = 2): string {
  return Number.isFinite(x) ? `${fmtNum(x * 100, digits)}%` : '—'
}

/**
 * Разбор числа из пользовательского ввода: допускаются пробелы-разделители
 * разрядов и запятая как десятичный разделитель. Пустая строка → NaN.
 */
export function parseNum(s: string): number {
  const cleaned = s.replace(/[\s ]/g, '').replace(',', '.').replace('−', '-')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN
  return Number(cleaned)
}

/** Число из поля ввода или null, если ввод пуст или не проходит ограничения */
export function readNum(s: string, opts: { min?: number; integer?: boolean } = {}): number | null {
  const n = parseNum(s)
  if (!Number.isFinite(n)) return null
  if (opts.min !== undefined && n < opts.min) return null
  if (opts.integer && !Number.isInteger(n)) return null
  return n
}

const compactFmt = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

/** Компактная запись для осей: 1,2 млн, 3,4 трлн */
export function fmtCompact(x: number): string {
  if (!Number.isFinite(x)) return '—'
  return Math.abs(x) < 10000 ? fmtSmart(x) : compactFmt.format(x)
}

/** Число с точностью по величине: 0,0123 / 1,23 / 123,4 / 12 345 */
export function fmtSmart(x: number | null): string {
  if (x === null || !Number.isFinite(x)) return '—'
  const a = Math.abs(x)
  const digits = a === 0 ? 0 : a < 1 ? 4 : a < 100 ? 2 : a < 10000 ? 1 : 0
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(x)
}

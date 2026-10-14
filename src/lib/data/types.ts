/** Частота ряда: дневная, недельная, месячная, квартальная, полугодовая, годовая */
export type Frequency = 'D' | 'W' | 'M' | 'Q' | 'S' | 'A'

export const frequencyLabels: Record<Frequency, string> = {
  D: 'Дневная',
  W: 'Недельная',
  M: 'Месячная',
  Q: 'Квартальная',
  S: 'Полугодовая',
  A: 'Годовая',
}

/** Число периодов в году (для дневных — торговые дни, приблизительно) */
export const periodsPerYear: Record<Frequency, number> = { D: 260, W: 52, M: 12, Q: 4, S: 2, A: 1 }

export type Source = 'worldbank' | 'fred' | 'derived'

export const sourceLabels: Record<Source, string> = {
  worldbank: 'World Bank',
  fred: 'FRED',
  derived: 'Расчёт',
}

/** Наблюдение: дата начала периода в формате YYYY-MM-DD, null — пропуск */
export interface Point {
  date: string
  value: number | null
}

export interface Series {
  /** Уникальный ключ в рабочем наборе */
  key: string
  source: Source
  /** Код ряда в источнике (например, CPIAUCSL или NY.GDP.MKTP.CD) */
  id: string
  title: string
  units: string
  frequency: Frequency
  points: Point[]
  /** Страна (для World Bank) */
  country?: string
  /** Ссылка на страницу ряда у источника */
  url?: string
  /** Как получен производный ряд */
  derivation?: string
  /** Исходный источник производного ряда */
  origin?: Source
  /** Когда загружено (ISO) */
  retrievedAt: string
}

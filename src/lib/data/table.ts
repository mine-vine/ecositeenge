import { frequencyLabels, sourceLabels, type Frequency, type Series, type Source } from './types'

/** Широкая таблица: одна строка на дату, по столбцу на ряд */
export interface WideTable {
  dates: string[]
  columns: { key: string; header: string; values: (number | null)[] }[]
}

/** Подпись ряда для легенды и заголовка столбца */
export function seriesLabel(s: Series): string {
  return s.country ? `${s.country} — ${s.title}` : s.title
}

/** Короткая подпись: если у всех рядов один показатель, достаточно страны */
export function shortLabels(series: Series[]): string[] {
  const sameIndicator = series.length > 1 && series.every((s) => s.country && s.id === series[0].id && s.title === series[0].title)
  return series.map((s) => (sameIndicator ? s.country! : seriesLabel(s)))
}

export function toWideTable(series: Series[]): WideTable {
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort()
  const labels = shortLabels(series)
  return {
    dates,
    columns: series.map((s, i) => {
      const byDate = new Map(s.points.map((p) => [p.date, p.value]))
      return { key: s.key, header: labels[i], values: dates.map((d) => byDate.get(d) ?? null) }
    }),
  }
}

/** Подпись даты с учётом частоты: 2020 / 2020 К3 / мар 2020 / 15.03.2020 */
export function formatDate(date: string, freq: Frequency): string {
  const y = date.slice(0, 4)
  const m = Number(date.slice(5, 7))
  switch (freq) {
    case 'A':
      return y
    case 'S':
      return `${y} П${m <= 6 ? 1 : 2}`
    case 'Q':
      return `${y} К${Math.floor((m - 1) / 3) + 1}`
    case 'M':
      return `${['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][m - 1]} ${y}`
    default:
      return `${date.slice(8, 10)}.${date.slice(5, 7)}.${y}`
  }
}

/** Самая «редкая» частота среди рядов — по ней подписываем общую ось */
export function coarsestFrequency(series: Series[]): Frequency {
  const order: Frequency[] = ['A', 'S', 'Q', 'M', 'W', 'D']
  return order.find((f) => series.some((s) => s.frequency === f)) ?? 'D'
}

function csvCell(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/**
 * CSV в «машинном» формате: разделитель — запятая, десятичная точка, даты ISO.
 * Читается pandas/R без настроек; BOM нужен, чтобы Excel распознал UTF-8.
 */
export function toCSV(series: Series[]): string {
  const t = toWideTable(series)
  const lines = [['date', ...t.columns.map((c) => c.header)].map(csvCell).join(',')]
  t.dates.forEach((d, i) => {
    lines.push([d, ...t.columns.map((c) => (c.values[i] === null ? '' : String(c.values[i])))].join(','))
  })
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** Метаданные рядов — для листа «Источники» и подписи к графику */
export function metadataRows(series: Series[]): string[][] {
  return [
    ['Ряд', 'Код', 'Источник', 'Страна', 'Единицы', 'Частота', 'Преобразование', 'Ссылка', 'Загружено'],
    ...series.map((s) => [
      s.title,
      s.id,
      sourceLabels[s.source],
      s.country ?? '',
      s.units,
      frequencyLabels[s.frequency],
      s.derivation ?? '',
      s.url ?? '',
      s.retrievedAt.slice(0, 10),
    ]),
  ]
}

/** XLSX: лист «Данные» (даты — настоящие даты Excel) и лист «Источники». ExcelJS грузится лениво. */
export async function toXLSX(series: Series[]): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Эконометр'
  const t = toWideTable(series)

  const data = wb.addWorksheet('Данные', { views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }] })
  data.addRow(['Дата', ...t.columns.map((c) => c.header)])
  t.dates.forEach((d, i) => {
    const [y, m, day] = d.split('-').map(Number)
    data.addRow([new Date(Date.UTC(y, m - 1, day)), ...t.columns.map((c) => c.values[i])])
  })
  data.getRow(1).font = { bold: true }
  data.getColumn(1).numFmt = 'yyyy-mm-dd'
  data.getColumn(1).width = 12
  t.columns.forEach((_, i) => (data.getColumn(i + 2).width = 18))

  const meta = wb.addWorksheet('Источники')
  metadataRows(series).forEach((r) => meta.addRow(r))
  meta.getRow(1).font = { bold: true }
  meta.columns.forEach((c) => (c.width = 22))

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Безопасное имя файла из названия */
export function fileSlug(series: Series[]): string {
  const base = series.length === 1 ? series[0].id : `econometr-${series.length}-series`
  return `${base.replace(/[^\w.-]+/g, '_')}-${new Date().toISOString().slice(0, 10)}`
}

/** Подпись источников под графиком */
export function sourceLine(series: Series[]): string {
  const origins = series.map((s) => (s.source === 'derived' ? s.origin : s.source)).filter((s): s is Exclude<Source, 'derived'> => !!s && s !== 'derived')
  const sources = [...new Set(origins.map((s) => sourceLabels[s]))]
  const derived = series.some((s) => s.source === 'derived') ? ' (с преобразованием)' : ''
  const date = series.map((s) => s.retrievedAt.slice(0, 10)).sort().at(-1)
  return `Источник: ${sources.join(', ') || 'расчёт'}${derived}${date ? `; данные загружены ${date}` : ''}. Подготовлено в «Эконометре».`
}

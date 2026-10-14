// Категориальная палитра: фиксированный порядок цветов, проверенный на различимость
// при нарушениях цветового зрения (валидатор dataviz) на фонах #ffffff и #0f172a.
// Цвет закреплён за рядом по его позиции в наборе — не по рангу значения.

export interface ChartTheme {
  series: string[]
  surface: string
  text: string
  textSecondary: string
  muted: string
  grid: string
  axis: string
}

export const lightChart: ChartTheme = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  muted: '#64748b',
  grid: '#e2e8f0',
  axis: '#cbd5e1',
}

export const darkChart: ChartTheme = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  surface: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  muted: '#94a3b8',
  grid: '#1e293b',
  axis: '#334155',
}

/** Больше рядов на одном графике не различить по цвету */
export const MAX_SERIES = 8

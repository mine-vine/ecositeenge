// Экспорт графика «для отчёта»: заголовок, легенда и источник встраиваются в само изображение.

export const EXPORT_W = 960
export const EXPORT_H = 540 // 16:9 — размер слайда PowerPoint

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Грубая оценка ширины текста — для переноса легенды и обрезки длинных строк */
const textWidth = (s: string, size: number) => s.length * size * 0.56

function clip(s: string, size: number, max: number): string {
  if (textWidth(s, size) <= max) return s
  const n = Math.max(1, Math.floor(max / (size * 0.56)) - 1)
  return s.slice(0, n) + '…'
}

export interface ExportMeta {
  title: string
  subtitle?: string
  legend: { label: string; color: string }[]
  source: string
  colors: { surface: string; text: string; secondary: string; muted: string }
}

/** Высота шапки (заголовок + подзаголовок + легенда) — чтобы заранее выделить место под график */
export function headerHeight(meta: Pick<ExportMeta, 'subtitle' | 'legend'>): number {
  return 24 + 24 + (meta.subtitle ? 20 : 0) + legendRows(meta.legend).length * 22 + 12
}

function legendRows(legend: ExportMeta['legend']) {
  if (legend.length < 2) return []
  const rows: { label: string; color: string; x: number }[][] = [[]]
  let x = 24
  for (const item of legend) {
    const label = clip(item.label, 13, 400)
    const w = 22 + textWidth(label, 13) + 20
    if (x + w > EXPORT_W - 24 && rows.at(-1)!.length > 0) {
      rows.push([])
      x = 24
    }
    rows.at(-1)!.push({ label, color: item.color, x })
    x += w
  }
  return rows
}

/** Собирает итоговый SVG: шапка + SVG графика из Recharts + подпись источника */
export function composeSvg(chart: SVGSVGElement, meta: ExportMeta): string {
  const { colors } = meta
  const parts: string[] = []
  let y = 24 + 18
  parts.push(`<text x="24" y="${y}" font-size="18" font-weight="600" fill="${colors.text}">${esc(clip(meta.title, 18, EXPORT_W - 48))}</text>`)
  if (meta.subtitle) {
    y += 22
    parts.push(`<text x="24" y="${y}" font-size="13" fill="${colors.secondary}">${esc(clip(meta.subtitle, 13, EXPORT_W - 48))}</text>`)
  }
  y += 8
  for (const row of legendRows(meta.legend)) {
    y += 22
    for (const item of row) {
      parts.push(`<rect x="${item.x}" y="${y - 6}" width="16" height="3" rx="1.5" fill="${item.color}"/>`)
      parts.push(`<text x="${item.x + 22}" y="${y}" font-size="13" fill="${colors.secondary}">${esc(item.label)}</text>`)
    }
  }
  const top = headerHeight(meta)
  const w = Number(chart.getAttribute('width')) || EXPORT_W - 16
  const h = Number(chart.getAttribute('height')) || EXPORT_H - top - 32
  const inner = new XMLSerializer().serializeToString(chart).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_W}" height="${EXPORT_H}" viewBox="0 0 ${EXPORT_W} ${EXPORT_H}" font-family="${esc(FONT)}">`,
    `<rect width="100%" height="100%" fill="${colors.surface}"/>`,
    ...parts,
    `<svg x="8" y="${top}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible">${inner}</svg>`,
    `<text x="24" y="${EXPORT_H - 14}" font-size="11" fill="${colors.muted}">${esc(clip(meta.source, 11, EXPORT_W - 48))}</text>`,
    `</svg>`,
  ].join('')
}

/** SVG → PNG (в 2× разрешении для чёткости на слайдах) */
export function svgToPng(svg: string, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = EXPORT_W * scale
      canvas.height = EXPORT_H * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas недоступен'))
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось создать PNG'))), 'image/png')
    }
    img.onerror = () => reject(new Error('Не удалось отрисовать SVG'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

/** Копирует PNG в буфер обмена — вставляется в PowerPoint, Word, Google Slides */
export async function copyPng(png: Promise<Blob>): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Браузер не поддерживает копирование изображений. Скачайте PNG.')
  }
  // Передаём Promise — так копирование работает и в Safari
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
}

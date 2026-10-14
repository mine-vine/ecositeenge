import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { coarsestFrequency, formatDate, shortLabels, toWideTable } from '../../lib/data/table'
import type { Series } from '../../lib/data/types'
import { fmtCompact, fmtSmart } from '../../lib/format'
import { MAX_SERIES, type ChartTheme } from './palette'

export type ChartKind = 'line' | 'bar' | 'area'

interface Props {
  series: Series[]
  kind: ChartKind
  theme: ChartTheme
  height: number
  /** Фиксированная ширина — для экспорта; без неё график тянется на всю ширину */
  width?: number
}

/** Строки для Recharts: { date, s0, s1, … } */
function toRows(series: Series[]) {
  const t = toWideTable(series)
  return t.dates.map((date, i) => {
    const row: Record<string, string | number | null> = { date }
    t.columns.forEach((c, j) => (row[`s${j}`] = c.values[i]))
    return row
  })
}

export function SeriesChart({ series, kind, theme, height, width }: Props) {
  const shown = series.slice(0, MAX_SERIES)
  const rows = toRows(shown)
  const labels = shortLabels(shown)
  const freq = coarsestFrequency(shown)
  const color = (i: number) => theme.series[i % theme.series.length]

  const common = {
    data: rows,
    margin: { top: 8, right: 16, bottom: 0, left: 0 },
  }
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
      <XAxis
        dataKey="date"
        tickFormatter={(d: string) => formatDate(d, freq)}
        stroke={theme.axis}
        tick={{ fill: theme.muted, fontSize: 12 }}
        tickLine={false}
        minTickGap={28}
      />
      <YAxis tickFormatter={fmtCompact} tick={{ fill: theme.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
      <Tooltip
        isAnimationActive={false}
        cursor={kind === 'bar' ? { fill: theme.grid, opacity: 0.5 } : { stroke: theme.axis, strokeWidth: 1 }}
        content={({ active, payload, label }) => {
          if (!active || !payload?.length) return null
          return (
            <div
              className="rounded-lg border px-3 py-2 text-xs shadow-md"
              style={{ background: theme.surface, borderColor: theme.grid, color: theme.text }}
            >
              <div className="mb-1 font-medium">{formatDate(String(label), freq)}</div>
              {payload.map((p) => {
                const i = Number(String(p.dataKey).slice(1))
                return (
                  <div key={String(p.dataKey)} className="flex items-center gap-2 py-0.5">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color(i) }} />
                    <span className="max-w-56 truncate" style={{ color: theme.textSecondary }}>
                      {labels[i]}
                    </span>
                    <span className="ml-auto pl-3 font-medium tabular-nums">{fmtSmart(typeof p.value === 'number' ? p.value : null)}</span>
                  </div>
                )
              })}
            </div>
          )
        }}
      />
    </>
  )

  const chart =
    kind === 'bar' ? (
      <BarChart {...common} width={width} height={width ? height : undefined} barGap={2} barCategoryGap="20%">
        {axes}
        {shown.map((_, i) => (
          <Bar key={i} dataKey={`s${i}`} fill={color(i)} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        ))}
      </BarChart>
    ) : kind === 'area' ? (
      <AreaChart {...common} width={width} height={width ? height : undefined}>
        {axes}
        {shown.map((_, i) => (
          <Area
            key={i}
            type="linear"
            dataKey={`s${i}`}
            stroke={color(i)}
            strokeWidth={2}
            fill={color(i)}
            fillOpacity={0.1}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    ) : (
      <LineChart {...common} width={width} height={width ? height : undefined}>
        {axes}
        {shown.map((_, i) => (
          <Line
            key={i}
            type="linear"
            dataKey={`s${i}`}
            stroke={color(i)}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={rows.length <= 2 ? { r: 4, fill: color(i), stroke: theme.surface, strokeWidth: 2 } : false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    )

  if (width) return chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      {chart}
    </ResponsiveContainer>
  )
}

/** Легенда: цветная метка рядом с текстом; сам текст — обычного цвета */
export function ChartLegend({ series, theme }: { series: Series[]; theme: ChartTheme }) {
  const shown = series.slice(0, MAX_SERIES)
  if (shown.length < 2) return null
  const labels = shortLabels(shown)
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-700 dark:text-slate-300">
      {labels.map((label, i) => (
        <li key={shown[i].key} className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: theme.series[i], height: 3 }} />
          {label}
        </li>
      ))}
    </ul>
  )
}

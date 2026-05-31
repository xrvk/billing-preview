import { useDeferredValue, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { UserUsage } from '../../pipeline/aggregators/userUsageAggregator'
import { computeUlbImpact } from '../../utils/ulbImpact'
import { formatUsd } from '../../utils/format'
import { td, tdNum, th, thNum } from './tableStyles'

export type UniversalUlbControlProps = {
  /** Per-user historical usage from the uploaded report; drives the impact preview. */
  users: UserUsage[]
  /** Current universal ULB value as a USD string (managed by the parent so the simulation can read it too). Empty string = unset. */
  value: string
  onChange: (value: string) => void
}

/** Discrete log-scaled stops for the slider. Index 0 ('Not configured') keeps the page inert until the admin engages. */
const STOPS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Not configured', value: '' },
  { label: '$25', value: '25' },
  { label: '$50', value: '50' },
  { label: '$100', value: '100' },
  { label: '$200', value: '200' },
  { label: '$500', value: '500' },
  { label: '$1,000', value: '1000' },
  { label: '$2,000', value: '2000' },
  { label: '$5,000', value: '5000' },
]

const DEFAULT_VISIBLE_ROW_COUNT = 20

function findStopIndexForValue(value: string): number {
  if (value.trim() === '') return 0
  const match = STOPS.findIndex((stop) => stop.value === value.trim())
  return match >= 0 ? match : -1
}

function sanitizeManualUsdInput(value: string): string {
  const normalized = value.replace(/[^0-9.]/g, '')
  const [wholePart = '', ...rest] = normalized.split('.')
  if (rest.length === 0) return wholePart
  return `${wholePart}.${rest.join('').slice(0, 2)}`
}

export function UniversalUlbControl({ users, value, onChange }: UniversalUlbControlProps) {
  const [showAll, setShowAll] = useState(false)
  const deferredValue = useDeferredValue(value)

  const parsedUlb = useMemo(() => {
    const trimmed = deferredValue.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }, [deferredValue])

  const impact = useMemo(() => computeUlbImpact(users, parsedUlb), [users, parsedUlb])

  const sliderIndex = findStopIndexForValue(value)
  const usingSlider = sliderIndex >= 0
  const isEngaged = value.trim() !== ''
  const visibleRows = showAll ? impact.affectedUsers : impact.affectedUsers.slice(0, DEFAULT_VISIBLE_ROW_COUNT)
  const hiddenRowCount = impact.affectedUsers.length - visibleRows.length

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextIndex = Number(event.target.value)
    const stop = STOPS[nextIndex]
    if (stop) onChange(stop.value)
  }

  return (
    <section
      aria-label="Universal user-level budget"
      className="bg-bg-default border border-border-default rounded-md px-5 py-5 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-sm font-semibold text-fg-default">Universal user-level budget</h3>
        <p className="m-0 text-[13px] text-fg-muted">
          Caps each user&rsquo;s cumulative AIC gross cost for the billing period. Drag the slider to preview which users in the uploaded report would have been affected.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="range"
            min={0}
            max={STOPS.length - 1}
            step={1}
            value={usingSlider ? sliderIndex : STOPS.length - 1}
            onChange={handleSliderChange}
            list="universal-ulb-stops"
            aria-label="Universal user-level budget"
            className="flex-1 accent-fg-accent"
          />
          <datalist id="universal-ulb-stops">
            {STOPS.map((stop, index) => (
              <option key={stop.label} value={index} label={stop.label} />
            ))}
          </datalist>

          <div className="flex items-center gap-2">
            <label className="flex items-center rounded-md border border-border-default bg-bg-default focus-within:border-fg-accent focus-within:shadow-[0_0_0_3px_rgba(9,105,218,0.3)] w-[140px]">
              <span className="pl-3 text-sm font-medium text-fg-muted" aria-hidden>$</span>
              <input
                type="text"
                inputMode="decimal"
                className="w-full border-0 bg-transparent px-2 py-2 text-sm text-fg-default outline-none tabular-nums"
                value={isEngaged ? value : ''}
                onChange={(event) => onChange(sanitizeManualUsdInput(event.target.value))}
                placeholder="No cap"
                aria-label="Universal user-level budget (USD)"
              />
            </label>
            {isEngaged && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[12px] text-fg-muted hover:text-fg-default underline-offset-2 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-fg-muted tabular-nums">
          {STOPS.map((stop) => (
            <span key={stop.label} className="flex-1 text-center first:text-left last:text-right">
              {stop.label === 'Not configured' ? 'Unset' : stop.label}
            </span>
          ))}
        </div>
      </div>

      {!isEngaged ? (
        <p className="m-0 text-[13px] text-fg-muted bg-bg-muted/40 border border-border-muted rounded-md px-3 py-2">
          Drag the slider or enter a value to preview which users would have been affected.
        </p>
      ) : impact.affectedUsers.length === 0 ? (
        <p className="m-0 text-[13px] text-fg-muted bg-bg-muted/40 border border-border-muted rounded-md px-3 py-2">
          No users in this report exceeded a cap of {formatUsd(parsedUlb ?? 0)}.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-[13px] font-semibold text-fg-default">
              {impact.affectedUsers.length.toLocaleString()} user{impact.affectedUsers.length === 1 ? '' : 's'} would have been capped
            </strong>
            <span className="text-[13px] text-fg-muted tabular-nums">
              Total cut: <strong className="text-fg-default">{formatUsd(impact.totalCutAmount)}</strong>
            </span>
          </div>

          <div className="bg-bg-default border border-border-default rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={th}>User</th>
                    <th className={thNum}>Current AIC gross</th>
                    <th className={thNum}>Cap</th>
                    <th className={thNum}>Cut</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.username}>
                      <td className={td}>{row.username}</td>
                      <td className={tdNum}>{formatUsd(row.currentAicGrossAmount)}</td>
                      <td className={tdNum}>{formatUsd(row.cap)}</td>
                      <td className={`${tdNum} font-semibold text-fg-default`}>−{formatUsd(row.cut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hiddenRowCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="self-start text-[13px] text-fg-accent hover:underline cursor-pointer"
            >
              Show all {impact.affectedUsers.length.toLocaleString()} affected users
            </button>
          )}
          {showAll && impact.affectedUsers.length > DEFAULT_VISIBLE_ROW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="self-start text-[13px] text-fg-muted hover:underline cursor-pointer"
            >
              Show fewer
            </button>
          )}
        </div>
      )}
    </section>
  )
}

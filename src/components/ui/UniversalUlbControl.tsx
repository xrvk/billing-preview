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

/**
 * Slider scale derives from the actual user spend distribution in the uploaded
 * report. We pick a "nice" tick step sized to roughly peak/TARGET_TICK_COUNT,
 * then round the peak up to the next multiple of that step so the rightmost
 * label sits just above the observed peak rather than overshooting into empty
 * space. The numeric input still accepts arbitrary values; if an admin types
 * something above the visual max the slider clamps to its max without
 * mutating the underlying value.
 */
const NICE_TICK_STEPS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000] as const
const NICE_SLIDER_STEPS = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const
const FALLBACK_MAX_USD = 100
const TARGET_TICK_COUNT = 5
const MAX_SLIDER_INCREMENTS = 1000

function computeSliderConfig(users: UserUsage[]): { maxUsd: number; stepUsd: number; ticks: number[] } {
  const peakSpend = users.reduce((max, user) => {
    const amount = user.totals.aicGrossAmount
    return Number.isFinite(amount) && amount > max ? amount : max
  }, 0)
  const target = peakSpend > 0 ? peakSpend : FALLBACK_MAX_USD
  const tickTarget = target / TARGET_TICK_COUNT
  const tickStep = NICE_TICK_STEPS.find((candidate) => candidate >= tickTarget)
    ?? Math.ceil(tickTarget / NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1]) * NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1]
  const maxUsd = Math.max(tickStep, Math.ceil(target / tickStep) * tickStep)
  const stepUsd = NICE_SLIDER_STEPS.find((candidate) => maxUsd / candidate <= MAX_SLIDER_INCREMENTS)
    ?? NICE_SLIDER_STEPS[NICE_SLIDER_STEPS.length - 1]
  const tickCount = Math.round(maxUsd / tickStep)
  const ticks: number[] = []
  for (let i = 1; i <= tickCount; i += 1) {
    ticks.push(tickStep * i)
  }
  return { maxUsd, stepUsd, ticks }
}

function formatTickLabel(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}m`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
  }
  return `$${value}`
}

const DEFAULT_VISIBLE_ROW_COUNT = 20

function sanitizeManualUsdInput(value: string): string {
  const normalized = value.replace(/[^0-9.]/g, '')
  const [wholePart = '', ...rest] = normalized.split('.')
  if (rest.length === 0) return wholePart
  return `${wholePart}.${rest.join('').slice(0, 2)}`
}

function formatSuggestedOverride(value: number): string {
  return value.toFixed(2)
}

export function UniversalUlbControl({ users, value, onChange }: UniversalUlbControlProps) {
  const [showAll, setShowAll] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const deferredValue = useDeferredValue(value)

  const parsedUlb = useMemo(() => {
    const trimmed = deferredValue.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }, [deferredValue])

  const impact = useMemo(() => computeUlbImpact(users, parsedUlb), [users, parsedUlb])
  const sliderConfig = useMemo(() => computeSliderConfig(users), [users])

  const isEngaged = value.trim() !== ''
  const sliderDisplayValue = useMemo(() => {
    if (!isEngaged) return 0
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return 0
    return Math.min(parsed, sliderConfig.maxUsd)
  }, [value, isEngaged, sliderConfig.maxUsd])
  const visibleRows = showAll ? impact.affectedUsers : impact.affectedUsers.slice(0, DEFAULT_VISIBLE_ROW_COUNT)
  const hiddenRowCount = impact.affectedUsers.length - visibleRows.length

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const dollars = Number(event.target.value)
    if (!Number.isFinite(dollars) || dollars < 0) return
    onChange(dollars.toString())
  }

  const handleCopyJson = async () => {
    if (impact.affectedUsers.length === 0) return
    // Field names match the GitHub Billing API per-user user-level budget request body
    // (POST /enterprises/{enterprise}/settings/billing/budgets): `user` is the GitHub
    // username and `budget_amount` is the dollar cap. The admin can spread each row
    // into the full request body, adding budget_scope, budget_product_sku, etc.
    const payload = impact.affectedUsers.map((row) => ({
      user: row.username,
      budget_amount: Number(formatSuggestedOverride(row.currentAicGrossAmount)),
    }))
    const json = JSON.stringify(payload, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  return (
    <section
      aria-label="Universal user-level budget"
      className="bg-bg-default border border-border-default rounded-md px-5 py-5 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-sm font-semibold text-fg-default">Universal user-level budget</h3>
        <p className="m-0 text-[13px] text-fg-muted">
          Caps each user&rsquo;s total AI credit spend for the billing period. Drag the slider to preview which users would exceed the limit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            type="range"
            min={0}
            max={sliderConfig.maxUsd}
            step={sliderConfig.stepUsd}
            value={sliderDisplayValue}
            onChange={handleSliderChange}
            aria-label="Universal user-level budget"
            className="w-full accent-fg-accent cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-fg-muted tabular-nums">
            <span>$0</span>
            {sliderConfig.ticks.map((tick) => (
              <span key={tick}>{formatTickLabel(tick)}</span>
            ))}
          </div>
        </div>

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

      {!isEngaged ? (
        <p className="m-0 text-[13px] text-fg-muted bg-bg-muted/40 border border-border-muted rounded-md px-3 py-2">
          Drag the slider or enter a value to preview which users would have exceeded the cap.
        </p>
      ) : impact.affectedUsers.length === 0 ? (
        <p className="m-0 text-[13px] text-fg-muted bg-bg-muted/40 border border-border-muted rounded-md px-3 py-2">
          No users in this report exceeded a cap of {formatUsd(parsedUlb ?? 0)}.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-[13px] font-semibold text-fg-default">
              {impact.affectedUsers.length.toLocaleString()} user{impact.affectedUsers.length === 1 ? '' : 's'} would exceed this cap
            </strong>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-[12px] px-3 py-1.5 rounded-md border border-border-default bg-bg-default hover:bg-bg-muted text-fg-default cursor-pointer"
              aria-label="Copy affected users with suggested individual ULB amounts as JSON"
            >
              {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy as JSON'}
            </button>
          </div>

          <p className="m-0 text-[13px] text-fg-muted">
            Set a per-user user-level budget for each user to allow their observed usage. The JSON snippet pairs each <code className="text-[12px] bg-bg-muted px-1 py-0.5 rounded">user</code> with a <code className="text-[12px] bg-bg-muted px-1 py-0.5 rounded">budget_amount</code> matching their observed AIC gross cost, using the field names from the Billing API per-user budget request body.
          </p>

          <div className="bg-bg-default border border-border-default rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className={th}>User</th>
                    <th className={thNum}>Observed AIC gross</th>
                    <th className={thNum}>Suggested budget_amount</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.username}>
                      <td className={td}>{row.username}</td>
                      <td className={tdNum}>{formatUsd(row.currentAicGrossAmount)}</td>
                      <td className={`${tdNum} font-semibold text-fg-default`}>{formatUsd(row.currentAicGrossAmount)}</td>
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

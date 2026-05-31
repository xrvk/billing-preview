import { formatUsd } from '../../utils/format'

export type EnterpriseBudgetNeededCardProps = {
  /** Total AIC gross cost observed in the report, in USD. */
  consumedAicGrossAmount: number
  /** Portion of the consumed AICs that was covered by the included credits pool, in USD. */
  includedCreditsUsedAmount: number
  /** Additional usage in USD that was not covered by included credits — i.e. the figure the enterprise budget would need to cover. */
  additionalUsageAmount: number
  /** When the uploaded report covers less than the billing period(s) it spans, supply the day counts so the card can disclose the gap. */
  partialPeriodCoverage?: {
    reportDays: number
    billingPeriodDays: number
  } | null
}

/**
 * Neutral, observational card. Shows the additional-usage figure from the
 * uploaded report and labels it as the enterprise budget needed to cover that
 * report. There is intentionally no buffer, projection, rounding, or
 * "recommended" framing — admins must size headroom themselves.
 */
export function EnterpriseBudgetNeededCard({
  consumedAicGrossAmount,
  includedCreditsUsedAmount,
  additionalUsageAmount,
  partialPeriodCoverage = null,
}: EnterpriseBudgetNeededCardProps) {
  const isPartialPeriod = partialPeriodCoverage !== null
    && partialPeriodCoverage.billingPeriodDays > 0
    && partialPeriodCoverage.reportDays / partialPeriodCoverage.billingPeriodDays < 0.9

  return (
    <section
      aria-label="Enterprise budget needed to cover this report"
      className="bg-bg-default border border-border-default rounded-md px-5 py-5 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-sm font-semibold text-fg-default">Enterprise budget needed to cover this report</h3>
        <p className="m-0 text-[13px] text-fg-muted">
          Observed from your uploaded usage. Add headroom for growth at your discretion.
        </p>
      </div>

      <div className="text-4xl font-bold leading-[1.1] text-fg-default tabular-nums">
        {formatUsd(additionalUsageAmount)}
      </div>

      <div className="pt-3 border-t border-border-default flex flex-col gap-[6px]">
        <div className="flex justify-between items-center text-[13px] text-fg-default tabular-nums">
          <span>Consumed AICs (gross)</span>
          <span>{formatUsd(consumedAicGrossAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-[13px] text-fg-muted tabular-nums">
          <span>Included credits used</span>
          <span>−{formatUsd(includedCreditsUsedAmount)}</span>
        </div>
        <div className="pt-[6px] border-t border-dotted border-border-muted flex justify-between items-center text-[13px] text-fg-default tabular-nums font-semibold">
          <span>Additional usage</span>
          <span>{formatUsd(additionalUsageAmount)}</span>
        </div>
      </div>

      {isPartialPeriod && partialPeriodCoverage && (
        <p
          className="m-0 text-[12px] text-fg-muted bg-bg-muted/40 border border-border-muted rounded-md px-3 py-2"
          role="note"
        >
          This report covers {partialPeriodCoverage.reportDays.toLocaleString()} of {partialPeriodCoverage.billingPeriodDays.toLocaleString()} days
          in the billing period it spans. The figure above reflects only the days in the report.
        </p>
      )}
    </section>
  )
}

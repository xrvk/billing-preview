import { useMemo } from 'react'
import { BillingTotalsCards, EnterpriseBudgetNeededCard, UniversalUlbControl } from '../components/ui'
import type { BudgetField, BudgetValues } from '../utils/costManagementBudgets'
import type { DailyUsageData } from '../pipeline/aggregators/dailyUsageAggregator'
import type { UserUsage } from '../pipeline/aggregators/userUsageAggregator'
import type { IndividualPlanUpgradeRecommendation } from '../utils/individualPlanUpgrade'

type CostManagementViewProps = {
  budgetValues: BudgetValues
  isIndividualReport: boolean
  reportUsers: UserUsage[]
  currentPruBill: number
  currentPruGrossAmount: number
  currentPruDiscountAmount: number
  currentPruQuantity: number
  currentAicBill: number
  currentAicGrossAmount: number
  currentAicDiscountAmount: number
  currentAicQuantity: number
  licenseAmount?: number
  licenseSeatCounts?: {
    business: number
    enterprise: number
  }
  upgradeRecommendation?: IndividualPlanUpgradeRecommendation | null
  includePromotional?: boolean
  dailyUsageData: DailyUsageData[]
  onBudgetValueChange: (field: BudgetField, value: string) => void
  hasPruUsage?: boolean
}

const INDIVIDUAL_BUDGET_FIELDS: Array<{ field: BudgetField; label: string; description: string }> = [
  {
    field: 'account',
    label: 'Additional usage budget',
    description: 'Controls additional usage spend only for the current billing period.\nDoes not impact included credits.',
  },
]

function sanitizeUsdInput(value: string): string {
  const normalized = value.replace(/[^0-9.]/g, '')
  const [wholePart = '', ...rest] = normalized.split('.')
  const decimalPart = rest.join('').slice(0, 2)

  if (normalized.startsWith('.')) {
    return decimalPart ? `0.${decimalPart}` : '0.'
  }

  if (rest.length === 0) {
    return wholePart
  }

  return `${wholePart}.${decimalPart}`
}

// Simulation helpers removed along with the apply-simulation UI.

/**
 * Derives a partial-period disclosure from the daily usage data, comparing the
 * span of days covered by the report against the total days in the calendar
 * month(s) the report touches.
 */
function computePartialPeriodCoverage(dailyUsageData: DailyUsageData[]): { reportDays: number; billingPeriodDays: number } | null {
  if (dailyUsageData.length === 0) return null

  const sortedDates = dailyUsageData.map((day) => day.date).sort()
  const firstDate = new Date(`${sortedDates[0]}T00:00:00`)
  const lastDate = new Date(`${sortedDates[sortedDates.length - 1]}T00:00:00`)
  const reportDays = Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000) + 1
  const periodStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
  const periodEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0)
  const billingPeriodDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86_400_000) + 1

  return { reportDays, billingPeriodDays }
}

export function CostManagementView({
  budgetValues,
  isIndividualReport,
  reportUsers,
  currentPruBill,
  currentPruGrossAmount,
  currentPruDiscountAmount,
  currentPruQuantity,
  currentAicBill,
  currentAicGrossAmount,
  currentAicDiscountAmount,
  currentAicQuantity,
  licenseAmount,
  licenseSeatCounts,
  upgradeRecommendation = null,
  includePromotional = true,
  dailyUsageData,
  onBudgetValueChange,
  hasPruUsage = true,
}: CostManagementViewProps) {
  const partialPeriodCoverage = useMemo(() => computePartialPeriodCoverage(dailyUsageData), [dailyUsageData])

  return (
    <section className="flex flex-col gap-6" aria-label="Cost management">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-lg text-fg-default">Cost management</h2>
        <p className="m-0 text-[13px] text-fg-muted">
          {isIndividualReport
            ? 'Set a USD budget and preview how it would affect the uploaded report.'
            : 'See what enterprise budget the uploaded report would require, then explore how a universal user-level budget would have affected your users.'}
        </p>
      </div>

      <BillingTotalsCards
        pruNetAmount={currentPruBill}
        pruGrossAmount={currentPruGrossAmount}
        pruDiscountAmount={currentPruDiscountAmount}
        pruQuantity={currentPruQuantity}
        aicNetAmount={currentAicBill}
        aicGrossAmount={currentAicGrossAmount}
        aicDiscountAmount={currentAicDiscountAmount}
        aicQuantity={currentAicQuantity}
        hasPruUsage={hasPruUsage}
        licenseAmount={licenseAmount}
        licenseSeatCounts={licenseSeatCounts}
        showExistingDiscountDisclaimer={!isIndividualReport}
        showPromotionalDataDisclaimer={isIndividualReport}
        includePromotional={includePromotional}
        upgradeRecommendation={upgradeRecommendation}
      />

      {isIndividualReport ? (
        <div className="grid grid-cols-1 gap-4">
          {INDIVIDUAL_BUDGET_FIELDS.map(({ field, label, description }) => (
            <label key={field} className="bg-bg-default border border-border-default rounded-md px-5 py-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-fg-default">{label}</span>
                <span className="text-[13px] text-fg-muted leading-normal whitespace-pre-line">{description}</span>
              </div>

              <div className="flex items-center rounded-md border border-border-default bg-bg-default focus-within:border-fg-accent focus-within:shadow-[0_0_0_3px_rgba(9,105,218,0.3)]">
                <span className="pl-3 text-sm font-medium text-fg-muted" aria-hidden>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full border-0 bg-transparent px-2 py-2.5 text-sm text-fg-default outline-none"
                  value={budgetValues[field]}
                  onChange={(event) => onBudgetValueChange(field, sanitizeUsdInput(event.target.value))}
                  placeholder="0.00"
                  aria-label={label}
                />
              </div>
            </label>
          ))}
        </div>
      ) : (
        <>
          <EnterpriseBudgetNeededCard
            consumedAicGrossAmount={currentAicGrossAmount}
            includedCreditsUsedAmount={currentAicDiscountAmount}
            additionalUsageAmount={currentAicBill}
            partialPeriodCoverage={partialPeriodCoverage}
          />

          <UniversalUlbControl
            users={reportUsers}
            value={budgetValues.user}
            onChange={(next) => onBudgetValueChange('user', next)}
          />
        </>
      )}

    </section>
  )
}

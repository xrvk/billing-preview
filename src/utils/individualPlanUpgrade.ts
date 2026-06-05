import {
  getIndividualPlanTier,
  PRO_MONTHLY_AIC_INCLUDED_CREDITS,
  PRO_PLUS_MONTHLY_AIC_INCLUDED_CREDITS,
} from '../pipeline/aicIncludedCredits'
import { AIC_UNIT_PRICE_USD } from './billingConstants'

export const PRO_LICENSE_MONTHLY_COST = 10
export const PRO_PLUS_LICENSE_MONTHLY_COST = 39
export const MAX_LICENSE_MONTHLY_COST = 100
export const MAX_PROMOTIONAL_MONTHLY_AIC_INCLUDED_CREDITS = 20000

type RecommendableIndividualPlan = {
  tier: 'pro-student' | 'pro-plus' | 'max'
  label: string
  monthlyLicenseCostUsd: number
  monthlyIncludedAic: number
}

const RECOMMENDABLE_INDIVIDUAL_PLANS: RecommendableIndividualPlan[] = [
  {
    tier: 'pro-student',
    label: 'Pro',
    monthlyLicenseCostUsd: PRO_LICENSE_MONTHLY_COST,
    monthlyIncludedAic: PRO_MONTHLY_AIC_INCLUDED_CREDITS,
  },
  {
    tier: 'pro-plus',
    label: 'Pro+',
    monthlyLicenseCostUsd: PRO_PLUS_LICENSE_MONTHLY_COST,
    monthlyIncludedAic: PRO_PLUS_MONTHLY_AIC_INCLUDED_CREDITS,
  },
  {
    tier: 'max',
    label: 'Max',
    monthlyLicenseCostUsd: MAX_LICENSE_MONTHLY_COST,
    monthlyIncludedAic: MAX_PROMOTIONAL_MONTHLY_AIC_INCLUDED_CREDITS,
  },
]

export type IndividualPlanUpgradeRecommendation = {
  currentPlanLabel: string
  nextPlanTier: RecommendableIndividualPlan['tier']
  nextPlanLabel: string
  currentAdditionalUsageAic: number
  currentAdditionalUsageCostUsd: number
  extraIncludedAic: number
  additionalUsageBillReductionUsd: number
  licenseCostIncreaseUsd: number
  netSavingsUsd: number
  upgradedTotalBillUsd: number
}

export function getIndividualLicenseMonthlyCost(totalMonthlyQuota: number): number | undefined {
  const planTier = getIndividualPlanTier(totalMonthlyQuota, 'individual')
  if (planTier === 'pro-plus') return PRO_PLUS_LICENSE_MONTHLY_COST
  if (planTier === 'pro-student') return PRO_LICENSE_MONTHLY_COST
  return undefined
}

export function calculateIndividualPlanUpgradeRecommendation({
  totalMonthlyQuota,
  currentMonthlyAicAdditionalUsageBillsUsd,
  excludePromotionalCredits = false,
}: {
  totalMonthlyQuota: number
  currentMonthlyAicAdditionalUsageBillsUsd: number[]
  excludePromotionalCredits?: boolean
}): IndividualPlanUpgradeRecommendation | null {
  const planTier = getIndividualPlanTier(totalMonthlyQuota, 'individual')
  if (!planTier || currentMonthlyAicAdditionalUsageBillsUsd.length === 0) {
    return null
  }

  const currentAicAdditionalUsageBillUsd = currentMonthlyAicAdditionalUsageBillsUsd.reduce((sum, amount) => sum + amount, 0)
  if (currentAicAdditionalUsageBillUsd <= 0) {
    return null
  }

  const currentPlanIndex = RECOMMENDABLE_INDIVIDUAL_PLANS.findIndex((plan) => plan.tier === planTier)
  const currentPlan = RECOMMENDABLE_INDIVIDUAL_PLANS[currentPlanIndex]
  if (!currentPlan) {
    return null
  }

  // When promotional amounts are excluded, treat every plan (current and
  // targets) as offering zero included AI credits, so the upgrade comparison
  // reflects the worst-case bill rather than the promotional-period math.
  const effectiveCurrentIncludedAic = excludePromotionalCredits ? 0 : currentPlan.monthlyIncludedAic

  const currentAdditionalUsageAic = currentAicAdditionalUsageBillUsd / AIC_UNIT_PRICE_USD
  const recommendation = RECOMMENDABLE_INDIVIDUAL_PLANS
    .slice(currentPlanIndex + 1)
    .map((targetPlan) => {
      const effectiveTargetIncludedAic = excludePromotionalCredits ? 0 : targetPlan.monthlyIncludedAic
      const extraIncludedAic = effectiveTargetIncludedAic - effectiveCurrentIncludedAic
      const monthlyAdditionalUsageBillReductionLimitUsd = extraIncludedAic * AIC_UNIT_PRICE_USD
      const additionalUsageBillReductionUsd = currentMonthlyAicAdditionalUsageBillsUsd.reduce(
        (sum, amount) => sum + Math.min(amount, monthlyAdditionalUsageBillReductionLimitUsd),
        0,
      )
      const licenseCostIncreaseUsd = currentMonthlyAicAdditionalUsageBillsUsd.length * (
        targetPlan.monthlyLicenseCostUsd - currentPlan.monthlyLicenseCostUsd
      )
      const netSavingsUsd = additionalUsageBillReductionUsd - licenseCostIncreaseUsd
      const upgradedTotalBillUsd = (
        currentAicAdditionalUsageBillUsd
        + (currentMonthlyAicAdditionalUsageBillsUsd.length * targetPlan.monthlyLicenseCostUsd)
        - additionalUsageBillReductionUsd
      )

      return {
        currentPlanLabel: currentPlan.label,
        nextPlanTier: targetPlan.tier,
        nextPlanLabel: targetPlan.label,
        currentAdditionalUsageAic,
        currentAdditionalUsageCostUsd: currentAicAdditionalUsageBillUsd,
        extraIncludedAic,
        additionalUsageBillReductionUsd,
        licenseCostIncreaseUsd,
        netSavingsUsd,
        upgradedTotalBillUsd,
      }
    })
    .filter((candidate) => candidate.netSavingsUsd > 0)
    .sort((a, b) => b.netSavingsUsd - a.netSavingsUsd)[0]

  if (!recommendation) {
    return null
  }

  return recommendation
}

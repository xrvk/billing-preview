import type { UserUsage } from '../pipeline/aggregators/userUsageAggregator'

export type BudgetField = 'user' | 'account' | 'productCloudAgent' | 'productSpark' | 'productCopilot'

export type BudgetValues = Record<BudgetField, string>

export const EMPTY_BUDGET_VALUES: BudgetValues = {
  user: '',
  account: '',
  productCloudAgent: '',
  productSpark: '',
  productCopilot: '',
}

/**
 * Initial values for the cost-management budget inputs.
 *
 * We deliberately do not prepopulate the universal user-level budget from
 * historical data — there is no defensible "right" starting value, and seeding
 * one would nudge admins toward a number that looks blessed by the product.
 * The slider in the universal ULB control starts at "Not configured" / blank
 * for the same reason. The `users` argument is accepted for symmetry with
 * future per-user defaulting (e.g. seeding individual ULB overrides) without
 * forcing every call site to change again.
 */
export function getDefaultBudgetValues(users: UserUsage[]): BudgetValues {
  void users
  return { ...EMPTY_BUDGET_VALUES }
}

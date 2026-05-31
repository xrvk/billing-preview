import { describe, expect, it } from 'vitest'
import type { UserUsage } from '../pipeline/aggregators/userUsageAggregator'
import type { UserSpendSegmentId } from './userSpendSegments'
import { EMPTY_BUDGET_VALUES, getDefaultBudgetValues } from './costManagementBudgets'

function createUser(username: string, spendSegment: UserSpendSegmentId, aicGrossAmount: number): UserUsage {
  return {
    username,
    spendSegment,
    totalMonthlyQuota: 1000,
    organizations: ['example-org'],
    costCenters: ['Cost Center A'],
    daily: {},
    products: {},
    totals: {
      requests: 0,
      grossAmount: 0,
      discountAmount: 0,
      netAmount: 0,
      aicQuantity: aicGrossAmount * 100,
      aicGrossAmount,
      aicNetAmount: aicGrossAmount / 2,
      distinctModels: 1,
    },
  }
}

describe('cost management budget helpers', () => {
  it('returns blank defaults so the universal ULB starts unset', () => {
    expect(getDefaultBudgetValues([
      createUser('mona', 'typical', 22.05),
      createUser('octocat', 'typical', 16.16),
      createUser('hubot', 'heavy', 101.2),
      createUser('test-user', 'power', 774.63),
    ])).toEqual(EMPTY_BUDGET_VALUES)
  })

  it('returns blank defaults for an empty user list', () => {
    expect(getDefaultBudgetValues([])).toEqual(EMPTY_BUDGET_VALUES)
  })
})

import { describe, expect, it } from 'vitest'
import type { UserUsage } from '../pipeline/aggregators/userUsageAggregator'
import { computeUlbImpact } from './ulbImpact'

function makeUser(username: string, aicGrossAmount: number): UserUsage {
  return {
    username,
    spendSegment: 'typical',
    totalMonthlyQuota: 0,
    organizations: [],
    costCenters: [],
    daily: {},
    products: {},
    totals: {
      requests: 0,
      grossAmount: 0,
      discountAmount: 0,
      netAmount: 0,
      aicQuantity: 0,
      aicGrossAmount,
      aicNetAmount: 0,
      distinctModels: 0,
    },
  }
}

describe('computeUlbImpact', () => {
  it('returns empty impact when the ULB is null', () => {
    const users = [makeUser('mona', 100), makeUser('hubot', 50)]

    expect(computeUlbImpact(users, null)).toEqual({
      affectedUsers: [],
      totalCutAmount: 0,
      totalAffectedUserCount: 0,
    })
  })

  it('returns empty impact when the ULB is non-finite or negative', () => {
    const users = [makeUser('mona', 100)]

    expect(computeUlbImpact(users, Number.NaN)).toEqual({
      affectedUsers: [],
      totalCutAmount: 0,
      totalAffectedUserCount: 0,
    })
    expect(computeUlbImpact(users, Number.POSITIVE_INFINITY)).toEqual({
      affectedUsers: [],
      totalCutAmount: 0,
      totalAffectedUserCount: 0,
    })
    expect(computeUlbImpact(users, -1)).toEqual({
      affectedUsers: [],
      totalCutAmount: 0,
      totalAffectedUserCount: 0,
    })
  })

  it('returns only users whose cumulative AIC gross cost exceeds the cap', () => {
    const users = [
      makeUser('mona', 200),
      makeUser('hubot', 50),
      makeUser('octocat', 100),
    ]

    const impact = computeUlbImpact(users, 75)

    expect(impact.affectedUsers).toEqual([
      { username: 'mona', currentAicGrossAmount: 200, cap: 75, cut: 125 },
      { username: 'octocat', currentAicGrossAmount: 100, cap: 75, cut: 25 },
    ])
    expect(impact.totalAffectedUserCount).toBe(2)
    expect(impact.totalCutAmount).toBe(150)
  })

  it('treats a ULB of exactly 0 as a valid cap that affects every user with positive spend', () => {
    const users = [
      makeUser('mona', 5),
      makeUser('hubot', 0),
      makeUser('octocat', 1),
    ]

    const impact = computeUlbImpact(users, 0)

    expect(impact.affectedUsers).toEqual([
      { username: 'mona', currentAicGrossAmount: 5, cap: 0, cut: 5 },
      { username: 'octocat', currentAicGrossAmount: 1, cap: 0, cut: 1 },
    ])
  })

  it('does not include users whose spend is exactly at the cap', () => {
    const users = [
      makeUser('mona', 100),
      makeUser('hubot', 100.01),
    ]

    const impact = computeUlbImpact(users, 100)

    expect(impact.affectedUsers).toEqual([
      { username: 'hubot', currentAicGrossAmount: 100.01, cap: 100, cut: 100.01 - 100 },
    ])
  })

  it('uses username as a stable tiebreaker when multiple users share the same cut', () => {
    const users = [
      makeUser('hubot', 150),
      makeUser('mona', 150),
      makeUser('octocat', 150),
    ]

    const impact = computeUlbImpact(users, 100)

    expect(impact.affectedUsers.map((row) => row.username)).toEqual(['hubot', 'mona', 'octocat'])
  })
})

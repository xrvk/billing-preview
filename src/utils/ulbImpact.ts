import type { UserUsage } from '../pipeline/aggregators/userUsageAggregator'

export type UlbImpactRow = {
  username: string
  currentAicGrossAmount: number
  cap: number
  cut: number
}

export type UlbImpact = {
  affectedUsers: UlbImpactRow[]
  totalCutAmount: number
  totalAffectedUserCount: number
}

const EMPTY_IMPACT: UlbImpact = {
  affectedUsers: [],
  totalCutAmount: 0,
  totalAffectedUserCount: 0,
}

/**
 * Returns the users whose cumulative AIC gross cost in the uploaded report would
 * have exceeded the given universal user-level budget, with the cut amount for
 * each one. Pure derivation; no UI concerns.
 *
 * Conventions:
 * - `ulbUsd === null` or non-finite → empty impact ("ULB not configured").
 * - `ulbUsd >= 0` → affected = users whose cumulative AIC gross cost > ulbUsd.
 *   A value of exactly 0 is a valid cap; in that case any user with positive
 *   spend is affected.
 *
 * Rows are sorted by cut amount descending, with username as a stable tiebreaker.
 */
export function computeUlbImpact(users: UserUsage[], ulbUsd: number | null): UlbImpact {
  if (ulbUsd === null || !Number.isFinite(ulbUsd) || ulbUsd < 0) {
    return EMPTY_IMPACT
  }

  const affected: UlbImpactRow[] = []
  for (const user of users) {
    const current = user.totals.aicGrossAmount
    if (current > ulbUsd) {
      affected.push({
        username: user.username,
        currentAicGrossAmount: current,
        cap: ulbUsd,
        cut: current - ulbUsd,
      })
    }
  }

  affected.sort((a, b) => {
    if (b.cut !== a.cut) return b.cut - a.cut
    return a.username.localeCompare(b.username)
  })

  return {
    affectedUsers: affected,
    totalCutAmount: affected.reduce((sum, row) => sum + row.cut, 0),
    totalAffectedUserCount: affected.length,
  }
}

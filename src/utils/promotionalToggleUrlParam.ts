// URL query parameter that controls whether promotional amounts (per-seat
// included AI credits for Business/Enterprise plans, flex allotment for
// individual plans) are applied during the simulation.
//
// Recognized values for the `promo` key:
//   - `promo=0`  Exclude promotional amounts from the simulation
//   - `promo=1`  Include promotional amounts (the default)
//   - missing / empty / any other value  No opinion (fall back to localStorage
//     or the default)
//
// The param is intentionally short and human readable so it's easy to share
// from a browser URL.

export const PROMOTIONAL_URL_PARAM = 'promo'

export type PromotionalUrlParamValue = boolean | undefined

export function readPromotionalUrlParam(search: string): PromotionalUrlParamValue {
  const params = new URLSearchParams(search)
  const raw = params.get(PROMOTIONAL_URL_PARAM)
  if (raw === null) return undefined
  const trimmed = raw.trim()
  if (trimmed === '0') return false
  if (trimmed === '1') return true
  return undefined
}

// Writes the current include-promotional state to the URL. Uses
// `history.replaceState` so navigation history isn't polluted. Guarded for
// non-browser environments so tests pass.
export function writePromotionalUrlParam(includePromotional: boolean): void {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return

  const url = new URL(window.location.href)
  const desired = includePromotional ? '1' : '0'
  if (url.searchParams.get(PROMOTIONAL_URL_PARAM) === desired) return

  url.searchParams.set(PROMOTIONAL_URL_PARAM, desired)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export function clearPromotionalUrlParam(): void {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return

  const url = new URL(window.location.href)
  if (!url.searchParams.has(PROMOTIONAL_URL_PARAM)) return

  url.searchParams.delete(PROMOTIONAL_URL_PARAM)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

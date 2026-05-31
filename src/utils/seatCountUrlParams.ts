// URL query parameters that let technical users prefill or skip the
// "Review licensed seat counts" confirmation screen.
//
// Recognized keys (both optional, but both required together to skip):
//   - cb=N    Copilot Business seat count, non-negative integer
//   - ce=N    Copilot Enterprise seat count, non-negative integer
//
// Safety model: providing both counts auto-applies and bypasses the screen,
// but only when each value is >= the historical minimum derived from the
// uploaded CSV. Anything less (only one count, invalid value, empty value,
// or a count below the historical minimum) prefills the existing inputs and
// still shows the screen so the standard validation error surfaces.
//
// To prevent stale URLs from silently misapplying to a different upload,
// callers should call `clearSeatCountUrlParams` after considering the params
// so the values are emptied (the keys stay so technical users can still see
// which knobs exist).

export const SEAT_COUNT_URL_PARAM_BUSINESS = 'cb'
export const SEAT_COUNT_URL_PARAM_ENTERPRISE = 'ce'

const NON_NEGATIVE_INTEGER = /^\d+$/

export type SeatCountUrlParams = {
  business?: number
  enterprise?: number
}

function parseNonNegativeInteger(raw: string | null): number | undefined {
  if (raw === null) return undefined
  const trimmed = raw.trim()
  if (!NON_NEGATIVE_INTEGER.test(trimmed)) return undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return undefined
  return parsed
}

export function readSeatCountUrlParams(search: string): SeatCountUrlParams {
  const params = new URLSearchParams(search)
  return {
    business: parseNonNegativeInteger(params.get(SEAT_COUNT_URL_PARAM_BUSINESS)),
    enterprise: parseNonNegativeInteger(params.get(SEAT_COUNT_URL_PARAM_ENTERPRISE)),
  }
}

// Resets the recognized seat-count keys to empty values (e.g. `?cb=&ce=`)
// rather than removing them. This keeps the params visible in the URL — so
// technical users can see which knobs exist and refill them — while making
// the next upload behave as if no values were supplied. Empty values parse
// as `undefined` via `readSeatCountUrlParams`, so they neither prefill nor
// trigger auto-skip. Preserves path, hash, and any unrelated query params.
// Safe to call when the keys aren't present (adds them as empty). Guarded
// for non-browser environments so tests pass.
export function clearSeatCountUrlParams(): void {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return

  const url = new URL(window.location.href)
  let changed = false
  for (const key of [SEAT_COUNT_URL_PARAM_BUSINESS, SEAT_COUNT_URL_PARAM_ENTERPRISE]) {
    if (url.searchParams.get(key) !== '') {
      url.searchParams.set(key, '')
      changed = true
    }
  }
  if (!changed) return

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

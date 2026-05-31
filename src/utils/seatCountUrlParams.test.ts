import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSeatCountUrlParams, readSeatCountUrlParams } from './seatCountUrlParams'

describe('readSeatCountUrlParams', () => {
  it('returns undefined counts when params are absent', () => {
    expect(readSeatCountUrlParams('')).toEqual({ business: undefined, enterprise: undefined })
    expect(readSeatCountUrlParams('?foo=bar')).toEqual({ business: undefined, enterprise: undefined })
  })

  it('parses valid non-negative integer seat counts', () => {
    expect(readSeatCountUrlParams('?cb=100&ce=250')).toEqual({
      business: 100,
      enterprise: 250,
    })
    expect(readSeatCountUrlParams('?cb=0&ce=0')).toEqual({
      business: 0,
      enterprise: 0,
    })
  })

  it('rejects non-integer, negative, decimal, exponential, and malformed values', () => {
    expect(readSeatCountUrlParams('?cb=-1').business).toBeUndefined()
    expect(readSeatCountUrlParams('?cb=10.5').business).toBeUndefined()
    expect(readSeatCountUrlParams('?cb=1e3').business).toBeUndefined()
    expect(readSeatCountUrlParams('?cb=abc').business).toBeUndefined()
    expect(readSeatCountUrlParams('?cb=').business).toBeUndefined()
    expect(readSeatCountUrlParams('?ce=%2B5').enterprise).toBeUndefined()
  })

  it('tolerates surrounding whitespace in integer values', () => {
    expect(readSeatCountUrlParams('?cb=%20%2042%20').business).toBe(42)
  })

  it('parses each side independently', () => {
    expect(readSeatCountUrlParams('?cb=10')).toEqual({ business: 10, enterprise: undefined })
    expect(readSeatCountUrlParams('?ce=20')).toEqual({ business: undefined, enterprise: 20 })
  })

  it('treats empty values the same as missing (so cleared params do not prefill or skip)', () => {
    expect(readSeatCountUrlParams('?cb=&ce=')).toEqual({ business: undefined, enterprise: undefined })
    expect(readSeatCountUrlParams('?cb=&ce=50')).toEqual({ business: undefined, enterprise: 50 })
  })
})

describe('clearSeatCountUrlParams', () => {
  // Minimal window stub so this suite runs under the default node environment
  // without pulling in jsdom. We only need location.href reading and a
  // replaceState that mutates href as a real browser would.
  function createFakeWindow(href: string) {
    const state = { current: href }
    return {
      get location() {
        return { get href() { return state.current } }
      },
      history: {
        state: null,
        replaceState: vi.fn((_state: unknown, _title: string, url: string) => {
          state.current = new URL(url, state.current).toString()
        }),
      },
    }
  }

  let fakeWindow: ReturnType<typeof createFakeWindow>

  beforeEach(() => {
    fakeWindow = createFakeWindow('https://example.test/some/path?cb=10&ce=20&other=keep#frag')
    vi.stubGlobal('window', fakeWindow)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('blanks the recognized seat-count values and preserves other params', () => {
    clearSeatCountUrlParams()

    const url = new URL(fakeWindow.location.href)
    expect(url.pathname).toBe('/some/path')
    expect(url.hash).toBe('#frag')
    expect(url.searchParams.get('other')).toBe('keep')
    expect(url.searchParams.get('cb')).toBe('')
    expect(url.searchParams.get('ce')).toBe('')
  })

  it('is a no-op when recognized keys are already blank', () => {
    fakeWindow = createFakeWindow('https://example.test/path?cb=&ce=&other=keep')
    vi.stubGlobal('window', fakeWindow)
    clearSeatCountUrlParams()
    expect(fakeWindow.history.replaceState).not.toHaveBeenCalled()
  })

  it('adds the keys as blank when they are absent so the knobs stay visible', () => {
    fakeWindow = createFakeWindow('https://example.test/path?other=keep')
    vi.stubGlobal('window', fakeWindow)
    clearSeatCountUrlParams()
    const url = new URL(fakeWindow.location.href)
    expect(url.searchParams.get('cb')).toBe('')
    expect(url.searchParams.get('ce')).toBe('')
    expect(url.searchParams.get('other')).toBe('keep')
  })

  it('does nothing when window is unavailable', () => {
    vi.stubGlobal('window', undefined)
    expect(() => clearSeatCountUrlParams()).not.toThrow()
  })
})

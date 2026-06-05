import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPromotionalUrlParam,
  readPromotionalUrlParam,
  writePromotionalUrlParam,
} from './promotionalToggleUrlParam'

describe('readPromotionalUrlParam', () => {
  it('returns undefined when the param is absent', () => {
    expect(readPromotionalUrlParam('')).toBeUndefined()
    expect(readPromotionalUrlParam('?foo=bar')).toBeUndefined()
  })

  it('parses promo=0 as false (exclude)', () => {
    expect(readPromotionalUrlParam('?promo=0')).toBe(false)
  })

  it('parses promo=1 as true (include)', () => {
    expect(readPromotionalUrlParam('?promo=1')).toBe(true)
  })

  it('returns undefined for empty or unrecognized values', () => {
    expect(readPromotionalUrlParam('?promo=')).toBeUndefined()
    expect(readPromotionalUrlParam('?promo=true')).toBeUndefined()
    expect(readPromotionalUrlParam('?promo=yes')).toBeUndefined()
    expect(readPromotionalUrlParam('?promo=2')).toBeUndefined()
  })

  it('tolerates surrounding whitespace', () => {
    expect(readPromotionalUrlParam('?promo=%200%20')).toBe(false)
    expect(readPromotionalUrlParam('?promo=%201%20')).toBe(true)
  })
})

// Minimal window stub so these suites run under the default node environment
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

describe('writePromotionalUrlParam', () => {
  let fakeWindow: ReturnType<typeof createFakeWindow>

  beforeEach(() => {
    fakeWindow = createFakeWindow('https://example.test/some/path?other=keep#frag')
    vi.stubGlobal('window', fakeWindow)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('writes promo=1 when including promotional amounts', () => {
    writePromotionalUrlParam(true)
    const url = new URL(fakeWindow.location.href)
    expect(url.searchParams.get('promo')).toBe('1')
  })

  it('writes promo=0 when excluding promotional amounts', () => {
    writePromotionalUrlParam(false)
    const url = new URL(fakeWindow.location.href)
    expect(url.searchParams.get('promo')).toBe('0')
  })

  it('preserves unrelated query params, path, and hash', () => {
    writePromotionalUrlParam(false)
    const url = new URL(fakeWindow.location.href)
    expect(url.pathname).toBe('/some/path')
    expect(url.hash).toBe('#frag')
    expect(url.searchParams.get('other')).toBe('keep')
    expect(url.searchParams.get('promo')).toBe('0')
  })

  it('does not call replaceState when the value already matches', () => {
    fakeWindow = createFakeWindow('https://example.test/path?promo=0')
    vi.stubGlobal('window', fakeWindow)
    writePromotionalUrlParam(false)
    expect(fakeWindow.history.replaceState).not.toHaveBeenCalled()
  })
})

describe('clearPromotionalUrlParam', () => {
  let fakeWindow: ReturnType<typeof createFakeWindow>

  beforeEach(() => {
    fakeWindow = createFakeWindow('https://example.test/path?promo=0&other=keep')
    vi.stubGlobal('window', fakeWindow)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('removes the promo param while keeping unrelated ones', () => {
    clearPromotionalUrlParam()
    const url = new URL(fakeWindow.location.href)
    expect(url.searchParams.has('promo')).toBe(false)
    expect(url.searchParams.get('other')).toBe('keep')
  })

  it('is a no-op when the param is already absent', () => {
    fakeWindow = createFakeWindow('https://example.test/path?other=keep')
    vi.stubGlobal('window', fakeWindow)
    clearPromotionalUrlParam()
    expect(fakeWindow.history.replaceState).not.toHaveBeenCalled()
  })
})

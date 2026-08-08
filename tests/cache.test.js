import { describe, it, expect } from 'vitest'
import { cacheKey, cacheGet, cacheSet, cacheSize } from '../lib/cache'

describe('cacheKey', () => {
  it('produces a deterministic 64-char hex key from the same inputs', () => {
    const a = cacheKey('config=abc', 'template=xyz')
    const b = cacheKey('config=abc', 'template=xyz')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different keys for different inputs', () => {
    const a = cacheKey('config=abc', 'template=xyz')
    const b = cacheKey('config=abc', 'template=xyz2')
    expect(a).not.toBe(b)
  })

  it('handles null/undefined parts gracefully', () => {
    const a = cacheKey('abc', null, undefined)
    const b = cacheKey('abc')
    expect(a).toBe(b)
  })
})

describe('cacheSet / cacheGet', () => {
  it('stores and retrieves a value', () => {
    const key = cacheKey('store-test')
    cacheSet(key, { foo: 'bar' })
    const got = cacheGet(key)
    expect(got).toEqual({ foo: 'bar' })
    // clean up
    cacheGet(key) // re-read to track effect
  })

  it('returns null for a missing key', () => {
    expect(cacheGet(cacheKey('nonexistent'))).toBeNull()
  })

  it('returns null for an expired entry', () => {
    const key = cacheKey('expired-test')
    cacheSet(key, { data: 'volatile' }, -1) // already expired
    expect(cacheGet(key)).toBeNull()
  })

  it('tracks cache size changes', () => {
    const before = cacheSize()
    cacheSet(cacheKey('size-a'), { x: 1 })
    cacheSet(cacheKey('size-b'), { y: 2 })
    expect(cacheSize()).toBe(before + 2)
  })
})
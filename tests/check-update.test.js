import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetchTextCapped = vi.fn()

vi.mock('../lib/safeFetch', () => ({
  fetchTextCapped: mockFetchTextCapped,
}))

// Mock package.json
vi.mock('../package.json', () => ({
  default: { version: '1.2.0' },
}))

const CACHE_TTL_MS = 60 * 60 * 1000

describe('check-update API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
    // Advance timers before each test so cache always starts cold
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports no update when latest matches current', async () => {
    mockFetchTextCapped.mockResolvedValue(JSON.stringify({ version: '1.2.0' }))

    const handler = (await import('../pages/api/check-update')).default
    const json = vi.fn()
    const status = vi.fn(() => ({ json, setHeader: vi.fn() }))
    const req = { method: 'GET' }
    const res = { status, setHeader: vi.fn(), json }

    await handler(req, res)

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ current: '1.2.0', latest: '1.2.0', hasUpdate: false })
    )
  })

  it('reports update when remote version is newer', async () => {
    mockFetchTextCapped.mockResolvedValue(JSON.stringify({ version: '2.0.0' }))

    const handler = (await import('../pages/api/check-update')).default
    const json = vi.fn()
    const status = vi.fn(() => ({ json, setHeader: vi.fn() }))
    const req = { method: 'GET' }
    const res = { status, setHeader: vi.fn(), json }

    await handler(req, res)

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ current: '1.2.0', latest: '2.0.0', hasUpdate: true })
    )
  })

  it('serves from cache on repeated calls within TTL', async () => {
    mockFetchTextCapped.mockResolvedValue(JSON.stringify({ version: '2.0.0' }))

    const handler = (await import('../pages/api/check-update')).default
    const json = vi.fn()
    const status = vi.fn(() => ({ json, setHeader: vi.fn() }))
    const req = { method: 'GET' }
    const res = { status, setHeader: vi.fn(), json }

    // First call
    await handler(req, res)
    expect(mockFetchTextCapped).toHaveBeenCalledTimes(1)

    // Second call within the same tick should hit the in-memory cache
    await handler(req, res)
    expect(mockFetchTextCapped).toHaveBeenCalledTimes(1) // still 1 — not 2
  })

  it('returns 405 for non-GET requests', async () => {
    const handler = (await import('../pages/api/check-update')).default
    const json = vi.fn()
    const setHeader = vi.fn()
    const status = vi.fn(() => ({ json, setHeader }))
    const req = { method: 'POST' }
    const res = { status, setHeader }

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(405)
  })

  it('gracefully handles fetch failures', async () => {
    mockFetchTextCapped.mockRejectedValue(new Error('Network failure'))

    const handler = (await import('../pages/api/check-update')).default
    const json = vi.fn()
    const status = vi.fn(() => ({ json, setHeader: vi.fn() }))
    const req = { method: 'GET' }
    const res = { status, setHeader: vi.fn(), json }

    await handler(req, res)

    // Should report no update rather than crashing
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ current: '1.2.0', latest: '1.2.0', hasUpdate: false })
    )
  })
})
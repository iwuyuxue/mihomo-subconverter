import { describe, it, expect, afterEach } from 'vitest'
import { validateTemplateUrl, fetchTextCapped } from '../lib/safeFetch'

afterEach(() => { delete process.env.TEMPLATE_ALLOWED_HOSTS })

describe('validateTemplateUrl', () => {
  it('accepts public http(s) URLs', () => {
    expect(validateTemplateUrl('https://raw.githubusercontent.com/a/b/c.ini'))
      .toBe('https://raw.githubusercontent.com/a/b/c.ini')
    expect(validateTemplateUrl('  http://example.com/x.ini ')).toBe('http://example.com/x.ini')
  })

  it('rejects non-http schemes and garbage', () => {
    expect(validateTemplateUrl('file:///etc/passwd')).toBeNull()
    expect(validateTemplateUrl('ftp://example.com/x')).toBeNull()
    expect(validateTemplateUrl('not a url')).toBeNull()
    expect(validateTemplateUrl('')).toBeNull()
    expect(validateTemplateUrl(undefined)).toBeNull()
  })

  it('rejects localhost and private / metadata IPs', () => {
    for (const bad of [
      'http://localhost:3000/x',
      'http://foo.local/x',
      'http://127.0.0.1/x',
      'http://10.0.0.1/x',
      'http://172.16.0.1/x',
      'http://192.168.1.1/x',
      'http://169.254.169.254/latest/meta-data/',
      'http://0.0.0.0/x',
      'http://[::1]/x',
      'http://[fe80::1]/x',
    ]) {
      expect(validateTemplateUrl(bad), bad).toBeNull()
    }
  })

  it('enforces TEMPLATE_ALLOWED_HOSTS when set (suffix match)', () => {
    process.env.TEMPLATE_ALLOWED_HOSTS = 'githubusercontent.com, example.org'
    expect(validateTemplateUrl('https://raw.githubusercontent.com/a.ini')).not.toBeNull()
    expect(validateTemplateUrl('https://example.org/a.ini')).not.toBeNull()
    expect(validateTemplateUrl('https://sub.example.org/a.ini')).not.toBeNull()
    expect(validateTemplateUrl('https://evil.com/a.ini')).toBeNull()
    // must be a dot-boundary suffix, not a substring
    expect(validateTemplateUrl('https://notexample.org/a.ini')).toBeNull()
  })
})

describe('fetchTextCapped', () => {
  it('throws on responses exceeding maxBytes via Content-Length', async () => {
    const originalFetch = global.fetch
    global.fetch = async () => ({
      ok: true,
      headers: { get: () => '500' },
      body: {
        getReader: () => {
          let returned = false
          return {
            read: async () => {
              if (returned) return { done: true, value: undefined }
              returned = true
              return { done: false, value: Buffer.from('x'.repeat(500)) }
            },
            cancel: async () => {},
          }
        },
      },
    })
    await expect(
      fetchTextCapped('http://example.com/big', { maxBytes: 100, timeoutMs: 5000 })
    ).rejects.toThrow(/too large/i)
    global.fetch = originalFetch
  })

  it('throws on responses exceeding maxBytes via streaming', async () => {
    const originalFetch = global.fetch
    let readCount = 0
    global.fetch = async () => ({
      ok: true,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => {
            if (readCount >= 3) return { done: true, value: undefined }
            readCount++
            return { done: false, value: Buffer.from('x'.repeat(60)) }
          },
          cancel: async () => {},
        }),
      },
    })
    await expect(
      fetchTextCapped('http://example.com/streaming', { maxBytes: 100, timeoutMs: 5000 })
    ).rejects.toThrow(/too large/i)
    global.fetch = originalFetch
  })

  it('resolves successfully for small responses', async () => {
    const originalFetch = global.fetch
    global.fetch = async () => ({
      ok: true,
      headers: { get: () => '50' },
      body: {
        getReader: () => {
          let returned = false
          return {
            read: async () => {
              if (returned) return { done: true, value: undefined }
              returned = true
              return { done: false, value: Buffer.from('hello world') }
            },
            cancel: async () => {},
          }
        },
      },
    })
    const body = await fetchTextCapped('http://example.com/small', { maxBytes: 200, timeoutMs: 5000 })
    expect(body.length).toBeGreaterThan(0)
    expect(body).toBe('hello world')
    global.fetch = originalFetch
  })
})

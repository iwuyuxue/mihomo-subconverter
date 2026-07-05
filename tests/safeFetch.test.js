import { describe, it, expect, afterEach } from 'vitest'
import { validateTemplateUrl } from '../lib/safeFetch'

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

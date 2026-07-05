/**
 * Hardened fetching for user-supplied template URLs.
 *
 * - http / https only
 * - Rejects obvious internal targets (localhost, private / link-local / metadata IPs)
 * - Optional host allowlist via TEMPLATE_ALLOWED_HOSTS
 *   (comma-separated; suffix match, e.g. "githubusercontent.com" also allows
 *   raw.githubusercontent.com)
 * - Caps response size so a huge body cannot exhaust function memory
 */

const MAX_BYTES_DEFAULT = 1024 * 1024 // 1 MB — plenty for any INI template

function isPrivateIp(host) {
  // IPv4
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const a = parseInt(m[1])
    const b = parseInt(m[2])
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true // link-local incl. cloud metadata
    if (a >= 224) return true               // multicast / reserved
    return false
  }
  // IPv6 (WHATWG URL keeps brackets in hostname)
  const h = host.replace(/^\[|\]$/g, '').toLowerCase()
  if (!h.includes(':')) return false
  if (h === '::' || h === '::1') return true
  if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true
  if (h.startsWith('::ffff:')) return isPrivateIp(h.slice(7))
  return false
}

/**
 * Validate a user-supplied template URL.
 * @returns {string|null} normalized URL, or null if not allowed
 */
export function validateTemplateUrl(raw) {
  if (!raw) return null
  let u
  try { u = new URL(String(raw).trim()) } catch { return null }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || isPrivateIp(host)) return null

  const allow = (process.env.TEMPLATE_ALLOWED_HOSTS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (allow.length > 0 && !allow.some(a => host === a || host.endsWith('.' + a))) {
    return null
  }

  return u.toString()
}

/**
 * Fetch a text resource with a timeout and a hard size cap.
 * Content-Length may be absent or lying, so the body is streamed and counted.
 */
export async function fetchTextCapped(url, { timeoutMs = 10_000, maxBytes = MAX_BYTES_DEFAULT } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mihomo-subconverter/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const declared = parseInt(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`Response too large (${declared} bytes, limit ${maxBytes})`)
  }

  const reader = res.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > maxBytes) {
      reader.cancel().catch(() => {})
      throw new Error(`Response too large (over ${maxBytes} bytes)`)
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

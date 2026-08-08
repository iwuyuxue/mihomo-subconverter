/**
 * GET /api/check-update
 *
 * Compares the locally deployed version (from package.json) against the
 * latest version on the GitHub main branch. Results are cached in memory
 * for 1 hour to avoid hammering the GitHub CDN.
 *
 * Response:
 *   { current: string, latest: string, hasUpdate: boolean, url: string }
 */

import pkg from '../../package.json'
import { fetchTextCapped } from '../../lib/safeFetch'
import { CACHE_TTL_MS } from '../../lib/constants'

const REPO_URL    = 'https://github.com/ififi2017/mihomo-subconverter'
const RAW_PKG_URL = 'https://raw.githubusercontent.com/ififi2017/mihomo-subconverter/main/package.json'

let _cache = null  // { data, expiresAt }

/** Simple semver compare: returns true if b > a */
function isNewer(a, b) {
  const parse = v => String(v).replace(/^v/, '').split('.').map(n => parseInt(n) || 0)
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)
  if (bMaj !== aMaj) return bMaj > aMaj
  if (bMin !== aMin) return bMin > aMin
  return bPat > aPat
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Serve from cache if still fresh
  if (_cache && Date.now() < _cache.expiresAt) {
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(_cache.data)
  }

  const current = pkg.version

  let latest = current
  try {
    const body = await fetchTextCapped(RAW_PKG_URL, { timeoutMs: 5_000, maxBytes: 10_000 })
    const ghPkg = JSON.parse(body)
    if (ghPkg?.version) latest = ghPkg.version
  } catch {
    // Network failure — report no update rather than throwing
  }

  const data = { current, latest, hasUpdate: isNewer(current, latest), url: REPO_URL }
  _cache = { data, expiresAt: Date.now() + CACHE_TTL_MS }

  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(200).json(data)
}

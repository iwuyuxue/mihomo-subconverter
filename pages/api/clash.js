import { parseProxyLinks } from '../../lib/parser'
import { generateClashConfigFromIni } from '../../lib/generator'
import { parseIni } from '../../lib/iniParser'
import { validateTemplateUrl, fetchTextCapped } from '../../lib/safeFetch'
import { checkAccessToken } from '../../lib/auth'
import { cacheKey, cacheGet, cacheSet } from '../../lib/cache'
import { DEFAULT_TEMPLATE_URL } from '../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).send('Method Not Allowed')
  }

  if (!checkAccessToken(req)) {
    return res.status(401).send('Unauthorized: missing or invalid `token` parameter')
  }

  // Note: req.query values are already URL-decoded by Next.js.
  // Decoding again would corrupt values containing literal '%' characters.
  // POST accepts a JSON body with the same field names.
  const { config, template, customRules, groups } = req.method === 'POST'
    ? (typeof req.body === 'object' ? req.body : {})
    : req.query

  if (!config) {
    return res.status(400).send('Missing required parameter: config')
  }

  try {
    // ── Parse proxy links ────────────────────────────────────────────────
    const proxies = parseProxyLinks(config)

    if (proxies.length === 0) {
      return res
        .status(400)
        .send('No valid proxy links found. Supported: hysteria2://, anytls://, vless://, trojan://, vmess://, ss://, tuic://')
    }

    // ── Resolve INI template URL ─────────────────────────────────────────
    let templateUrl = DEFAULT_TEMPLATE_URL
    if (template) {
      const validated = validateTemplateUrl(template)
      if (!validated) {
        return res
          .status(400)
          .send('Invalid template URL: only public http(s) URLs are allowed' +
            (process.env.TEMPLATE_ALLOWED_HOSTS ? ' (host not in allowlist)' : ''))
      }
      templateUrl = validated
    }

    // ── Parse selected groups ─────────────────────────────────────────────
    let selectedGroups = null   // null = include all
    if (groups) {
      try {
        const parsed = JSON.parse(groups)
        if (Array.isArray(parsed)) selectedGroups = new Set(parsed.map(String))
      } catch {
        // malformed — include all
      }
    }

    // ── Try cache lookup ───────────────────────────────────────────────────
    const ckey = cacheKey(config, template, customRules, groups)
    const cached = cacheGet(ckey)
    if (cached) {
      res.setHeader('Content-Type', 'application/x-yaml; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=clash.yaml')
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).send(cached.yaml)
    }

    // ── Fetch INI template with stale fallback ─────────────────────────────
    let iniText
    try {
      iniText = await fetchTextCapped(templateUrl)
    } catch (e) {
      // If the template fetch fails, serve stale cached data if available
      const stale = cacheGet(ckey)
      if (stale) {
        res.setHeader('Content-Type', 'application/x-yaml; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename=clash.yaml')
        res.setHeader('Warning', '299 mihomo-subconverter "stale config — template fetch failed"')
        return res.status(200).send(stale.yaml)
      }
      return res
        .status(502)
        .send(
          `Failed to fetch rule template from ${templateUrl}: ${e.message}\n` +
          `Please check the URL or try again later.`
        )
    }

    // ── Parse INI ────────────────────────────────────────────────────────
    const parsedIni = parseIni(iniText)

    if (parsedIni.proxyGroups.length === 0 && parsedIni.rulesets.length === 0) {
      return res
        .status(422)
        .send('Rule template appears to be empty or in an unsupported format.')
    }

    // ── Parse custom rules ────────────────────────────────────────────────
    let customRulesList = []
    if (customRules) {
      let parsed = null
      try { parsed = JSON.parse(customRules) } catch { }
      const arr = Array.isArray(parsed) ? parsed : String(customRules).split('\n')
      customRulesList = arr
        .map(r => String(r).replace(/[\r\n]+/g, ' ').trim())
        .filter(Boolean)
    }

    // ── Generate YAML ─────────────────────────────────────────────────────
    const yaml = generateClashConfigFromIni(proxies, parsedIni, customRulesList, templateUrl, selectedGroups)

    // Store in cache for subsequent requests
    cacheSet(ckey, { yaml })

    res.setHeader('Content-Type', 'application/x-yaml; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=clash.yaml')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(yaml)
  } catch (err) {
    console.error('Generation error:', err)
    return res.status(500).send('Error generating config: ' + err.message)
  }
}
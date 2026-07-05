import { parseProxyLinks } from '../../lib/parser'
import { generateClashConfigFromIni } from '../../lib/generator'
import { parseIni } from '../../lib/iniParser'
import { validateTemplateUrl, fetchTextCapped } from '../../lib/safeFetch'
import { checkAccessToken } from '../../lib/auth'

// Default template — MetaCubeX Full (hosted in the project's own rules repo).
// Users can override this via the `template` query parameter.
const DEFAULT_TEMPLATE_URL =
  'https://raw.githubusercontent.com/ififi2017/clash_rules/master/config/MetaCubeX_Full.ini'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method Not Allowed')
  }

  if (!checkAccessToken(req)) {
    return res.status(401).send('Unauthorized: missing or invalid `token` parameter')
  }

  // Note: req.query values are already URL-decoded by Next.js.
  // Decoding again would corrupt values containing literal '%' characters.
  const { config, template, customRules, groups } = req.query

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

    // ── Fetch INI template ───────────────────────────────────────────────
    let iniText
    try {
      iniText = await fetchTextCapped(templateUrl)
    } catch (e) {
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

    // ── Parse selected groups ─────────────────────────────────────────────
    let selectedGroups = null   // null = include all
    if (groups) {
      try {
        const parsed = JSON.parse(groups)
        if (Array.isArray(parsed)) selectedGroups = new Set(parsed.map(String))
      } catch {
        // malformed → include all
      }
    }

    // ── Generate YAML ─────────────────────────────────────────────────────
    const yaml = generateClashConfigFromIni(proxies, parsedIni, customRulesList, templateUrl, selectedGroups)

    res.setHeader('Content-Type', 'application/x-yaml; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=clash.yaml')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(yaml)
  } catch (err) {
    console.error('Generation error:', err)
    return res.status(500).send('Error generating config: ' + err.message)
  }
}

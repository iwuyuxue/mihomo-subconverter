/**
 * Shared constants for mihomo-subconverter.
 *
 * Keeping them in one place means the default template URL, supported protocol
 * list, and other configuration values never get out of sync across files.
 */

export const DEFAULT_TEMPLATE_URL =
  // 'https://raw.githubusercontent.com/ififi2017/clash_rules/master/config/MetaCubeX_Full.ini'
  'https://bmbq31r4bnybqrg2i91q.880887.xyz:2096'
export const DEFAULT_TEMPLATE_URL_original = 'https://raw.githubusercontent.com/ififi2017/clash_rules/master/config/MetaCubeX_Full.ini'

export const LS_KEY_PROXY_LINKS = 'mihomo_proxy_links'
export const LS_KEY_TEMPLATE_URL = 'mihomo_template_url'
export const LS_KEY_ACCESS_TOKEN = 'mihomo_access_token'
export const LS_KEY_LOCALE = 'mihomo_locale'
export const LS_KEY_THEME = 'mihomo_theme'

export const UPDATE_DISMISSED_KEY = 'update_dismissed'

export const PROXY_PREFIXES = [
  'hysteria2://', 'hy2://', 'anytls://', 'vless://',
  'trojan://', 'vmess://', 'ss://', 'tuic://',
]

export const PROTOCOL_MAP = {
  'hysteria2://': 'hy2',
  'hy2://': 'hy2',
  'anytls://': 'anytls',
  'vless://': 'vless',
  'trojan://': 'trojan',
  'vmess://': 'vmess',
  'ss://': 'ss',
  'tuic://': 'tuic',
}

export const YAML_SECTIONS_FOR_JUMP = ['proxies', 'proxy-groups', 'rule-providers', 'rules']

export const DEFAULT_DNS_NAMESERVER = [
  'https://120.53.53.53/dns-query',
  'https://223.5.5.5/dns-query',
]

export const DEFAULT_DNS_PROXY_SERVER_NAMESERVER = [
  'https://120.53.53.53/dns-query',
  'https://223.5.5.5/dns-query',
]

export const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour for update check
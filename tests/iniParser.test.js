import { describe, it, expect } from 'vitest'
import { parseIni } from '../lib/iniParser'

const SAMPLE = `
; comment line
# another comment
[custom]
ruleset=🎯 全球直连,https://example.com/rules/direct.list
ruleset=🎯 全球直连,[]GEOIP,CN
ruleset=🐟 漏网之鱼,[]FINAL
ruleset=NoUrlNoInline,not-a-url
custom_proxy_group=🚀 节点选择\`select\`[]♻️ 自动选择\`[]DIRECT\`.*
custom_proxy_group=♻️ 自动选择\`url-test\`.*\`http://www.gstatic.com/generate_204\`300,,50
custom_proxy_group=HK\`url-test\`(HK|香港)\`http://www.gstatic.com/generate_204\`180,,30
custom_proxy_group=Broken\`\`
custom_proxy_group=Relay\`relay\`a\`b
`

describe('parseIni', () => {
  const { rulesets, proxyGroups } = parseIni(SAMPLE)

  it('parses URL rulesets', () => {
    expect(rulesets[0]).toEqual({ group: '🎯 全球直连', url: 'https://example.com/rules/direct.list' })
  })

  it('parses inline rulesets and FINAL', () => {
    expect(rulesets[1]).toEqual({ group: '🎯 全球直连', inline: 'GEOIP,CN' })
    expect(rulesets[2]).toEqual({ group: '🐟 漏网之鱼', inline: 'FINAL' })
  })

  it('rejects ruleset sources that are neither URLs nor inline rules', () => {
    expect(rulesets).toHaveLength(3)
  })

  it('parses select groups, keeping []refs and regex filters apart', () => {
    const sel = proxyGroups.find(g => g.name === '🚀 节点选择')
    expect(sel.type).toBe('select')
    expect(sel.proxies).toEqual(['♻️ 自动选择', 'DIRECT', { filter: '.*' }])
  })

  it('parses url-test groups with interval/tolerance', () => {
    const auto = proxyGroups.find(g => g.name === 'HK')
    expect(auto).toMatchObject({
      type: 'url-test', filter: '(HK|香港)',
      url: 'http://www.gstatic.com/generate_204',
      interval: 180, tolerance: 30,
    })
  })

  it('ignores malformed and unsupported group types', () => {
    expect(proxyGroups.find(g => g.name === 'Broken')).toBeUndefined()
    expect(proxyGroups.find(g => g.name === 'Relay')).toBeUndefined()
  })
})

import { useMemo } from 'react'
import { Card, CardHeader, secBtnCls } from './UI'
import { YAML_SECTIONS_FOR_JUMP } from '../lib/constants'

/* ── Lightweight YAML syntax highlighting for the preview pane ────── */
const YAML_SECTIONS = YAML_SECTIONS_FOR_JUMP

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightYamlValue(raw) {
  const v = raw.trim()
  if (!v) return escapeHtml(raw)
  const pad = raw.slice(0, raw.length - raw.trimStart().length)
  let color = null
  if (v.startsWith("'") || v.startsWith('"'))            color = '#a5d6ff'
  else if (/^(true|false)$/.test(v))                     color = '#ff7b72'
  else if (/^-?[\d.]+$/.test(v))                         color = '#ffa657'
  else if (/^https?:\/\//.test(v))                       color = '#a5d6ff'
  return color ? `${pad}<span style="color:${color}">${escapeHtml(v)}</span>` : escapeHtml(raw)
}

function highlightYamlLine(line) {
  if (/^\s*#/.test(line)) return `<span style="color:#8b949e">${escapeHtml(line)}</span>`

  const section = line.match(/^([\w-]+):\s*$/)
  if (section && YAML_SECTIONS.includes(section[1])) {
    return `<span id="yaml-sec-${section[1]}" style="color:#79c0ff;font-weight:600">${escapeHtml(line)}</span>`
  }

  const kv = line.match(/^(\s*(?:- )?)([\w-]+)(:)(.*)$/)
  if (kv) {
    const [, lead, key, colon, rest] = kv
    return `${escapeHtml(lead)}<span style="color:#79c0ff">${escapeHtml(key)}</span>${colon}${highlightYamlValue(rest)}`
  }

  const li = line.match(/^(\s*- )(.*)$/)
  if (li) return `${li[1]}${highlightYamlValue(li[2])}`

  return escapeHtml(line)
}

export default function ResultPanel({
  subUrl, yamlPreview, activeTab, onTabChange,
  copied, onCopy, onDownload,
  showQr, qrDataUrl, qrError, onToggleQr,
  yamlPreRef, resultRef, t,
}) {
  const highlightedYaml = useMemo(
    () => yamlPreview?.split('\n').map(highlightYamlLine).join('\n'),
    [yamlPreview],
  )

  const jumpToYamlSection = (sec) => {
    const pre = yamlPreRef?.current
    const el  = pre?.querySelector(`#yaml-sec-${sec}`)
    if (pre && el) pre.scrollTop = Math.max(0, el.offsetTop - 8)
  }

  if (!subUrl && !yamlPreview) return null

  return (
    <div ref={resultRef} style={{ scrollMarginTop: 64 }}>
    <Card className="animate-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-emerald-500"
            style={{ boxShadow: '0 0 0 3px rgba(34,197,94,.2)' }}/>
          <span className="text-[13.5px] font-medium text-gray-900 dark:text-white">
            {t('result.title')}
          </span>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 border border-gray-200
          dark:border-gray-700 rounded-lg p-[3px] gap-[3px]">
          {[['url', t('result.tabUrl')], ['yaml', t('result.tabYaml')]].map(([key, label]) => (
            <button key={key} onClick={() => onTabChange(key)}
              className={`px-3 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </CardHeader>

      {activeTab === 'url' && subUrl && (
        <div className="p-[18px] flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              {t('result.urlDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950
                border border-gray-200 dark:border-gray-700 rounded-[9px] px-3 py-2 overflow-hidden">
                <div className="text-[12px] font-mono text-gray-600 dark:text-gray-300
                  break-all max-h-[76px] overflow-y-auto
                  sm:break-normal sm:max-h-none sm:overflow-hidden sm:whitespace-nowrap sm:text-ellipsis">
                  {subUrl}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onCopy(subUrl, 'url')}
                  className={`${secBtnCls} whitespace-nowrap ${
                    copied === 'url'
                      ? '!bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400 !border-emerald-500/30'
                      : ''
                  }`}>
                  {copied === 'url' ? (
                    <><svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>{t('result.copied')}</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>{t('result.copy')}</>
                  )}
                </button>
                <button
                  onClick={onToggleQr}
                  className={`${secBtnCls} whitespace-nowrap ${
                    showQr ? '!border-blue-500 !text-blue-600 dark:!text-blue-400' : ''
                  }`}>
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3h5v5H3V3zm2 2v1h1V5H5zM3 12h5v5H3v-5zm2 2v1h1v-1H5zM12 3h5v5h-5V3zm2 2v1h1V5h-1zM12 12h2v2h-2v-2zM15 12h2v2h-2v-2zM12 15h2v2h-2v-2zM15 15h2v2h-2v-2z"/>
                  </svg>
                  {t('result.qr')}
                </button>
              </div>
            </div>
            {showQr && (
              qrError ? (
                <p className="mt-3 text-[11.5px] text-amber-600/90 dark:text-amber-500/90">
                  {t('result.qrTooLong')}
                </p>
              ) : qrDataUrl && (
                <div className="mt-3 flex flex-col items-center gap-2 animate-in">
                  <img src={qrDataUrl} alt="Subscription QR code" width={220} height={220}
                    className="rounded-[10px] border border-gray-200 dark:border-gray-700 bg-white p-2"/>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {t('result.qrHint')}
                  </p>
                </div>
              )
            )}
            <p className="mt-2 text-[11px] text-amber-600/90 dark:text-amber-500/90 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {t('result.urlSecurityNote')}
            </p>
            {subUrl.length > 8000 && (
              <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-500/90">
                {t('result.urlTooLong', { count: subUrl.length })}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'yaml' && yamlPreview && (
        <div className="p-[18px]">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-[10px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('result.yamlLines', { count: yamlPreview.split('\n').length })}
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              {YAML_SECTIONS.map(sec => (
                <button key={sec} onClick={() => jumpToYamlSection(sec)}
                  className="px-2 py-[2px] rounded-md text-[10.5px] font-mono
                    bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    text-gray-500 dark:text-gray-400
                    hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400
                    transition-colors">
                  {sec}
                </button>
              ))}
            </div>
            <div className="flex gap-[6px]">
              <button onClick={() => onCopy(yamlPreview, 'yaml')}
                className={secBtnCls}>
                {copied === 'yaml' ? `✓ ${t('result.copied')}` : t('result.copy')}
              </button>
              <button onClick={onDownload}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-lg
                  text-xs font-medium text-white transition-colors"
                style={{
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  boxShadow: 'var(--shadow-btn)',
                }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                {t('result.download')}
              </button>
            </div>
          </div>
          <pre ref={yamlPreRef}
            className="rounded-[10px] p-[14px] text-[12px] font-mono
            overflow-auto max-h-[300px] leading-[1.7]"
            style={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,.06)',
              color: '#8fbcbb',
              position: 'relative',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedYaml }}
          />
        </div>
      )}
    </Card>
    </div>
  )
}
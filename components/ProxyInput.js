import { Card, CardHeader, StepBadge, inputCls } from './UI'
import { PROXY_PREFIXES } from '../lib/constants'
import { useState, useMemo } from 'react'

/* ── Protocol badge colors [bg, text, border] ─────────────────────── */
const PROTO_COLORS = {
  hy2: ['rgba(139,92,246,.12)', '#7c3aed', 'rgba(139,92,246,.25)'],
  anytls: ['rgba(6,182,212,.12)', '#0e7490', 'rgba(6,182,212,.25)'],
  vless: ['rgba(37,99,235,.12)', '#1d4ed8', 'rgba(37,99,235,.25)'],
  trojan: ['rgba(244,63,94,.12)', '#be123c', 'rgba(244,63,94,.25)'],
  vmess: ['rgba(245,158,11,.12)', '#b45309', 'rgba(245,158,11,.25)'],
  ss: ['rgba(16,185,129,.12)', '#047857', 'rgba(16,185,129,.25)'],
  tuic: ['rgba(236,72,153,.12)', '#9d174d', 'rgba(236,72,153,.25)'],
}
const PROTO_LABELS = {
  hy2: 'Hysteria2', anytls: 'AnyTLS', vless: 'VLESS',
  trojan: 'Trojan', vmess: 'VMess', ss: 'Shadowsocks', tuic: 'TUIC',
}

function ProtoBadge({ proto, count }) {
  const [bg, color, border] = PROTO_COLORS[proto] || ['rgba(100,100,100,.1)', '#6b7280', 'rgba(100,100,100,.2)']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 7px', borderRadius: 9999,
      fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap',
      background: bg, color, border: `1px solid ${border}`, letterSpacing: .01,
    }}>
      {PROTO_LABELS[proto] ?? proto}<span style={{ opacity: .55, marginLeft: 1 }}>×{count}</span>
    </span>
  )
}

function analyzeProxies(proxyLinks) {
  if (!proxyLinks) return { total: 0, breakdown: [], invalid: 0 }

  const MAP = {
    'hysteria2://': 'hy2', 'hy2://': 'hy2', 'anytls://': 'anytls',
    'vless://': 'vless', 'trojan://': 'trojan', 'vmess://': 'vmess',
    'ss://': 'ss', 'tuic://': 'tuic',
  }

  let text = proxyLinks.trim()

  // 1. 全局解码：如果输入的是整包 Base64 订阅，先尝试整体解码一次
  if (!Object.keys(MAP).some(pfx => text.includes(pfx))) {
    const decoded = safeBase64Decode(text)
    if (decoded && Object.keys(MAP).some(pfx => decoded.includes(pfx))) {
      text = decoded
    }
  }

  const counts = {}
  let invalid = 0

  // 2. 按行拆分解析
  for (let line of text.split('\n')) {
    let l = line.trim()
    if (!l || l.startsWith('#')) continue

    // 尝试直接匹配协议
    let proto = Object.entries(MAP).find(([pfx]) => l.startsWith(pfx))?.[1]

    // 3. 单行补救解码：如果单行直接匹配失败，尝试对该行单独解码一次
    if (!proto) {
      const decodedLine = safeBase64Decode(l).trim()
      if (decodedLine && decodedLine !== l) {
        proto = Object.entries(MAP).find(([pfx]) => decodedLine.startsWith(pfx))?.[1]
      }
    }

    if (proto) {
      counts[proto] = (counts[proto] || 0) + 1
    } else {
      invalid++
    }
  }

  return {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    breakdown: Object.entries(counts),
    invalid,
  }
}

//兼容 URL-Safe 与中文 Unicode 的 Base64 安全解码函数
function safeBase64Decode(str) {
  if (!str) return ''
  try {
    let base64 = str.trim().replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) base64 += '='.repeat(4 - pad)

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf-8')
    }
    return decodeURIComponent(escape(atob(base64)))
  } catch {
    return ''
  }
}
export default function ProxyInput({ value, onChange, extractedFrom, t }) {
  // 1. 保留你原有的节点解析逻辑
  const { total, breakdown, invalid } = analyzeProxies(value)

  // 2. 新增：Base64 状态控制
  const [showDecoded, setShowDecoded] = useState(false)

  // 3. 计算解码文本
  const decodedText = useMemo(() => safeBase64Decode(value), [value])

  // 4. 判断是否为合法 Base64 字符串
  const isBase64 = useMemo(() => {
    if (!value || value.trim().length < 8) return false
    const trimmed = value.trim()
    // 若已包含明文协议前缀，则不视作纯 Base64
    if (/^(hysteria2|hy2|anytls|vless|trojan|vmess|ss|tuic):\/\//i.test(trimmed)) return false
    // 成功解码出新文本，且没有不可打印控制字符
    return Boolean(decodedText && decodedText !== trimmed && !/[\x00-\x08\x0E-\x1F]/.test(decodedText))
  }, [value, decodedText])

  // 当用户在未展示解码时输入，重置状态
  const handleTextareaChange = (e) => {
    if (showDecoded) setShowDecoded(false)
    onChange(e.target.value)
  }

  // 实际显示在文本框中的内容
  const displayValue = isBase64 && showDecoded ? decodedText : value

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-[9px] shrink-0">
          <StepBadge n="1" />
          <span className="text-[13.5px] font-medium text-gray-900 dark:text-white whitespace-nowrap">
            {t('step1.title')}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-[7px] min-w-0">
          {/* 仅在识别为 Base64 时才显示的切换按钮 */}
          {isBase64 && (
            <button
              type="button"
              onClick={() => setShowDecoded(!showDecoded)}
              className="inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full whitespace-nowrap
                text-[11px] font-medium transition-colors cursor-pointer
                bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20
                border border-blue-500/20"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {showDecoded ? (t('step1.showOriginal') || '显示原文') : (t('step1.decodeBase64') || 'Base64 解码')}
            </button>
          )}

          {extractedFrom && (
            <span className="inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full whitespace-nowrap
              text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
              border border-emerald-500/20">
              <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('step1.extractedBadge')}
            </span>
          )}
          {invalid > 0 && (
            <span className="inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full whitespace-nowrap
              text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400
              border border-amber-500/20">
              <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('step1.invalidLines', { count: invalid })}
            </span>
          )}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-[5px]">
              <span className="text-[11.5px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {t('step1.nodeCount', { count: total })}
              </span>
              <span className="text-gray-300 dark:text-gray-700 text-sm">·</span>
              <div className="flex flex-wrap justify-end gap-[3px]">
                {breakdown.map(([p, c]) => <ProtoBadge key={p} proto={p} count={c} />)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <div className="p-[18px]">
        <textarea
          value={displayValue}
          onChange={handleTextareaChange}
          placeholder={t('step1.placeholder')}
          rows={8}
          className={inputCls}
          spellCheck={false}
          readOnly={isBase64 && showDecoded}
        />
        <p className="mt-2 text-[11.5px] text-gray-400 dark:text-gray-500 flex flex-wrap gap-[3px] items-center">
          <span>{t('step1.supported')}</span>
          {[
            ['hy2', 'Hysteria2'], ['anytls', 'AnyTLS'], ['vless', 'VLESS'],
            ['trojan', 'Trojan'], ['vmess', 'VMess'], ['ss', 'Shadowsocks'], ['tuic', 'TUIC'],
          ].map(([k, label], i, arr) => (
            <span key={k}>
              <code className="text-blue-500 dark:text-blue-400 font-mono text-[11px]">{label}</code>
              {i < arr.length - 1 && <span className="text-gray-200 dark:text-gray-700 ml-[3px]">·</span>}
            </span>
          ))}
        </p>
      </div>
    </Card>
  )
}
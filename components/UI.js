/* ── Shared UI primitives used across multiple components ────────── */

export function StepBadge({ n }) {
  return (
    <span className="w-[22px] h-[22px] rounded-full bg-blue-600 text-white
      flex items-center justify-center text-[11px] font-bold shrink-0"
      style={{ boxShadow: 'var(--shadow-badge)' }}>
      {n}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <section
      className={`bg-white dark:bg-gray-900 rounded-[14px]
        border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </section>
  )
}

export function CardHeader({ children }) {
  return (
    <div className="px-[18px] py-[13px] border-b border-gray-100 dark:border-gray-800
      flex items-center justify-between gap-3">
      {children}
    </div>
  )
}

export const secBtnCls = 'flex items-center gap-1.5 px-3 py-[6px] rounded-lg text-xs font-medium ' +
  'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 ' +
  'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 ' +
  'transition-colors cursor-pointer'

export const inputCls = 'w-full bg-gray-50 dark:bg-gray-950 ' +
  'border border-gray-200 dark:border-gray-700 rounded-[9px] ' +
  'px-[13px] py-[9px] text-[12.5px] font-mono ' +
  'text-gray-800 dark:text-gray-200 ' +
  'placeholder-gray-300 dark:placeholder-gray-600 ' +
  'focus:outline-none focus:border-blue-500 ' +
  'transition-colors resize-y leading-relaxed'
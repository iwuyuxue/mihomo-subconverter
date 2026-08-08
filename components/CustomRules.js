import { Card, CardHeader, StepBadge, inputCls } from './UI'

export default function CustomRules({ value, onChange, t }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-[9px]">
          <StepBadge n="3"/>
          <span className="text-[13.5px] font-medium text-gray-900 dark:text-white">
            {t('step3.title')}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal ml-[6px]">
              {t('step3.optional')}
            </span>
          </span>
        </div>
      </CardHeader>
      <div className="p-[18px]">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t('step3.placeholder')}
          rows={5}
          className={inputCls}
          spellCheck={false}
        />
      </div>
    </Card>
  )
}

/* ── Usage hints panel (shown beside Custom Rules) ────────────────── */
export function GuidePanel({ t }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-[9px]">
          <span className="w-[22px] h-[22px] rounded-full bg-gray-200 dark:bg-gray-700
            flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"
              className="text-gray-500 dark:text-gray-400">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
          </span>
          <span className="text-[13.5px] font-medium text-gray-900 dark:text-white">
            {t('guide.title')}
          </span>
        </div>
      </CardHeader>
      <div className="p-[18px]">
        <ul className="space-y-3">
          {[
            <path key="0" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
            <path key="1" fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>,
            <path key="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>,
          ].map((icon, i) => (
            <li key={i} className="flex items-start gap-[10px]">
              <span className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/30
                flex items-center justify-center shrink-0 mt-px">
                <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"
                  className="text-blue-500 dark:text-blue-400">
                  {icon}
                </svg>
              </span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {t(`guide.items.${i}`)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
            {t('guide.footnote').split('{metacubex}').map((part, i) =>
              i === 0 ? part : (
                <span key={i}>
                  <a href="https://github.com/MetaCubeX/meta-rules-dat" target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:underline">MetaCubeX</a>
                  {part}
                </span>
              )
            )}
          </p>
        </div>
      </div>
    </Card>
  )
}
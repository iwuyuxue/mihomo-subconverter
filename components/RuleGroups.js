import { Card, CardHeader, StepBadge } from './UI'
import { DEFAULT_TEMPLATE_URL } from '../lib/constants'

export default function RuleGroups({
  templateUrl, onTemplateChange,
  groupsLoading, groupsError, ruleGroups, selectedGroups,
  onToggleGroup, onSelectAll, onClear, onFetchGroups, t,
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-[9px]">
          <StepBadge n="2"/>
          <span className="text-[13.5px] font-medium text-gray-900 dark:text-white">
            {t('step2.title')}
          </span>
        </div>
        {!groupsLoading && ruleGroups.length > 0 && selectedGroups && (
          <div className="flex gap-2">
            <button onClick={onSelectAll}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
              {t('step2.selectAll')}
            </button>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <button onClick={onClear}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
              {t('step2.clear')}
            </button>
          </div>
        )}
      </CardHeader>

      {/* Template URL sub-row */}
      <div className="px-[18px] pt-3 pb-3 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex flex-col gap-[6px]">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('step2.templateLabel')}
            <span className="ml-1 font-normal opacity-60">{t('step2.templateOptional')}</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={templateUrl}
              onChange={e => onTemplateChange(e.target.value)}
              placeholder={t('step2.templatePlaceholder')}
              className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950
                border border-gray-200 dark:border-gray-700 rounded-[9px]
                px-[11px] py-[7px] text-[12px] font-mono
                text-gray-700 dark:text-gray-200
                placeholder-gray-300 dark:placeholder-gray-600
                focus:outline-none focus:border-blue-500
                transition-colors"
              spellCheck={false}
            />
            {!templateUrl && (
              <span className="text-[11px] text-gray-300 dark:text-gray-600 shrink-0 italic hidden sm:block">
                {t('step2.templateDefault')}
              </span>
            )}
          </div>
        </div>
        <p className="mt-[7px] text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed flex flex-wrap items-baseline gap-x-1">
          <span>{t('step2.templateDescription')}</span>
          <a href="https://sub-web.pages.dev/" target="_blank" rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 hover:underline">
            {t('step2.templateDescriptionSubweb')}
          </a>
          <span>{t('step2.templateDescriptionSuffix')}</span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <a href={DEFAULT_TEMPLATE_URL}
            target="_blank" rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 hover:underline">
            {t('step2.templateViewExample')}
            <svg width="9" height="9" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginLeft: 2, marginBottom: 1 }}>
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
            </svg>
          </a>
        </p>
      </div>

      {/* Groups */}
      <div className="p-[18px]">
        {groupsLoading ? (
          <div className="flex items-center gap-2 justify-center py-5
            text-sm text-gray-400 dark:text-gray-500">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
              <path fill="currentColor" opacity=".8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {t('step2.loading')}
          </div>
        ) : groupsError ? (
          <div className="flex items-center gap-3 py-3 text-sm text-red-500 dark:text-red-400">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span className="flex-1">{t('step2.loadError')}: {groupsError}</span>
            <button onClick={() => onFetchGroups(templateUrl)}
              className="text-xs underline underline-offset-2 hover:no-underline">
              {t('step2.retry')}
            </button>
          </div>
        ) : ruleGroups.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ruleGroups.map(group => {
              const checked = selectedGroups?.has(group) ?? true
              return (
                <label key={group}
                  className={`flex items-center gap-[10px] px-3 py-[10px] rounded-[10px]
                    border cursor-pointer transition-all ${
                    checked
                      ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-400 dark:border-blue-500/50'
                      : 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  <input type="checkbox" checked={checked} onChange={() => onToggleGroup(group)}
                    className="mt-px accent-blue-500 shrink-0"/>
                  <span className={`text-[13px] truncate ${
                    checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>{group}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
import React from 'react';

/**
 * Base Shimmer Box matching Nagulan Salon UI Theme (Gold & Charcoal)
 */
export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div
      style={style}
      className={`relative overflow-hidden rounded-lg bg-gray-200/80 dark:bg-charcoal-800/80 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-gold-500/10 before:to-transparent ${className}`}
    />
  );
};

/**
 * Skeleton Line of Text
 */
export const SkeletonText = ({
  lines = 1,
  className = '',
  widths = ['100%'],
  height = 'h-4',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`${height} ${widths[idx % widths.length] || 'w-full'}`}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton StatCard (matches Dashboard, Present Day, and Expenses StatCards)
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-gray-200/70 dark:border-charcoal-800 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32 rounded-lg" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-3 w-14 rounded-md" />
      </div>
    </div>
  );
};

/**
 * Skeleton Table Row
 */
export const SkeletonTableRow = ({ cols = 6, className = '' }) => {
  return (
    <tr className={`border-b border-gray-100 dark:border-charcoal-800/80 ${className}`}>
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="py-3 px-3 sm:px-4">
          <Skeleton
            className={`h-4 rounded-md ${
              idx === 0
                ? 'w-16'
                : idx === 1
                ? 'w-28'
                : idx === cols - 1
                ? 'w-12 ml-auto'
                : 'w-20'
            }`}
          />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton Table with Header & Rows
 */
export const SkeletonTable = ({
  rows = 5,
  cols = 6,
  headers = [],
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-charcoal-950/70 border-b border-gray-200 dark:border-charcoal-800">
              {headers.length > 0
                ? headers.map((h, i) => (
                    <th key={i} className="py-3 px-3 sm:px-4 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                      {h}
                    </th>
                  ))
                : Array.from({ length: cols }).map((_, i) => (
                    <th key={i} className="py-3 px-3 sm:px-4">
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800/80">
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols || headers.length} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Skeleton Chart Placeholder (for Dashboard & Present Day live pacing charts)
 */
export const SkeletonChart = ({
  title = '',
  height = 'h-64',
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-gray-200/80 dark:border-charcoal-800 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          {title ? (
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
          ) : (
            <Skeleton className="h-4 w-36 rounded-md" />
          )}
          <Skeleton className="h-2.5 w-24 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>

      {/* Visual Chart Bars Mockup */}
      <div className={`w-full ${height} flex items-end justify-between gap-2 pt-6 pb-2 px-3 border-b border-gray-100 dark:border-charcoal-800/80`}>
        {[45, 65, 30, 80, 55, 90, 70, 85, 60, 95, 75, 50].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <Skeleton
              className="w-full max-w-[20px] rounded-t-md transition-all"
              style={{ height: `${h}%` }}
            />
            <Skeleton className="h-2 w-3 rounded-xs" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Grid (for Service & Product POS Catalog Cards)
 */
export const SkeletonGrid = ({ items = 8, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-xl border border-gray-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 space-y-2.5 shadow-xs"
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-16 rounded-md" />
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-charcoal-800/80">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonChart,
  SkeletonGrid,
};

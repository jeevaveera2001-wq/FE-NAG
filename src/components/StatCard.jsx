import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  comparisonLabel = 'vs previous period',
  accentColor = 'gold',
  prefix = '',
}) => {
  return (
    <div className="bg-white dark:bg-charcoal-900 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-charcoal-800 shadow-sm hover:border-gold-500/50 transition-all group relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-xl md:text-2xl font-bold font-sans text-gray-900 dark:text-white mt-1.5 flex items-baseline gap-1">
            {prefix && <span className="text-sm font-normal text-gray-500">{prefix}</span>}
            <span>{value}</span>
          </h3>
          {subtitle && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-700 flex items-center justify-center text-charcoal-800 dark:text-gold-400 group-hover:scale-105 transition-transform shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800/80 flex items-center gap-1.5 text-xs">
          {trendPositive ? (
            <span className="flex items-center text-green-600 dark:text-green-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          ) : (
            <span className="flex items-center text-red-500 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          <span className="text-gray-400 text-[10px]">{comparisonLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

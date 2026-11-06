import React from 'react';

/**
 * Nagulan UI Themed Spinner Loader
 * Supports sizes: xs, sm, md, lg, xl
 * Variants: gold (luxury accent), dual (gold + charcoal ring), white, black
 */
export const SpinnerLoader = ({
  size = 'md',
  variant = 'gold',
  label = '',
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-9 h-9 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const variantMap = {
    gold: 'border-gold-500/20 border-t-gold-500 dark:border-gold-500/30 dark:border-t-gold-400',
    dual: 'border-charcoal-200 dark:border-charcoal-800 border-t-gold-500 border-r-gold-500',
    white: 'border-white/30 border-t-white',
    black: 'border-black/20 border-t-black dark:border-white/20 dark:border-t-white',
  };

  const spinnerClasses = `${sizeMap[size] || sizeMap.md} ${variantMap[variant] || variantMap.gold} rounded-full animate-spin transition-all`;

  if (!label) {
    return <div className={`inline-block shrink-0 ${spinnerClasses} ${className}`} role="status" aria-label="Loading" />;
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div className={spinnerClasses} role="status" aria-label="Loading" />
      {label && (
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase font-sans animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default SpinnerLoader;

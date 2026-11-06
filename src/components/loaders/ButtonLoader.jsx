import React from 'react';

/**
 * Compact Button Spinner
 * Matches button text color or luxury gold accent
 */
export const ButtonSpinner = ({ size = 'sm', color = 'current', className = '' }) => {
  const sizeMap = {
    xs: 'w-3 h-3 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
  };

  const colorMap = {
    current: 'border-current border-t-transparent',
    gold: 'border-gold-500/30 border-t-gold-500',
    white: 'border-white/30 border-t-white',
    black: 'border-black/30 border-t-black',
  };

  return (
    <span
      className={`inline-block shrink-0 rounded-full animate-spin ${sizeMap[size] || sizeMap.sm} ${colorMap[color] || colorMap.current} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Nagulan Themed Loading Button
 * Drop-in replacement for <button> with loading states, spinner, icons, and luxury styling.
 */
export const LoadingButton = ({
  loading = false,
  loadingText = '',
  disabled = false,
  children,
  icon: Icon = null,
  variant = 'primary', // 'primary' | 'gold' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-black text-white hover:bg-charcoal-800 dark:bg-gold-500 dark:text-black dark:hover:bg-gold-400 border border-transparent shadow-xs',
    gold:
      'bg-gold-500 text-black hover:bg-gold-400 dark:bg-gold-500 dark:text-black dark:hover:bg-gold-400 shadow-sm font-bold',
    secondary:
      'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-charcoal-800 dark:text-gray-200 dark:hover:bg-charcoal-700 border border-gray-200 dark:border-charcoal-700',
    danger:
      'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 shadow-xs',
    outline:
      'bg-transparent border border-gray-300 dark:border-charcoal-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-charcoal-800',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 border-none',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-3.5 py-2 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-5 py-3 text-sm sm:text-base rounded-xl gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={loading}
      className={`relative inline-flex items-center justify-center font-bold tracking-wide transition-all active:scale-[0.98] select-none ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.primary} ${
        isDisabled ? 'opacity-65 cursor-not-allowed active:scale-100' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <ButtonSpinner size={size === 'lg' ? 'md' : 'sm'} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default {
  ButtonSpinner,
  LoadingButton,
};

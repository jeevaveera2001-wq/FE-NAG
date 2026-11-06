import React from 'react';

/**
 * Pulsing Dots Loader
 * Three staggered bouncing and pulsing gold dots.
 * Sizes: sm, md, lg
 */
export const PulsingDots = ({
  size = 'md',
  color = 'gold',
  label = '',
  className = '',
}) => {
  const dotSizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  const colorMap = {
    gold: 'bg-gold-500 shadow-[0_0_8px_rgba(212,175,55,0.6)]',
    white: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]',
    black: 'bg-black dark:bg-white',
    emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  };

  const dotClass = `${dotSizeMap[size] || dotSizeMap.md} ${colorMap[color] || colorMap.gold} rounded-full`;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '0ms', animationDuration: '900ms' }}
      />
      <span
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '180ms', animationDuration: '900ms' }}
      />
      <span
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '360ms', animationDuration: '900ms' }}
      />
      {label && (
        <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Pulsing Radar Beacon
 * Live status radar beacon with inner solid dot and expanding ripple ring.
 * Perfect for live data feeds, online attendants, active chairs.
 */
export const PulsingBeacon = ({
  color = 'gold', // 'gold' | 'emerald' | 'amber' | 'blue'
  size = 'md',
  label = '',
  className = '',
}) => {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  const ringSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  const colorConfig = {
    gold: {
      dot: 'bg-gold-500',
      ring: 'bg-gold-400',
    },
    emerald: {
      dot: 'bg-emerald-500',
      ring: 'bg-emerald-400',
    },
    amber: {
      dot: 'bg-amber-500',
      ring: 'bg-amber-400',
    },
    blue: {
      dot: 'bg-blue-500',
      ring: 'bg-blue-400',
    },
  };

  const cfg = colorConfig[color] || colorConfig.gold;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`relative flex items-center justify-center ${ringSize}`}>
        <span className={`absolute ${ringSize} rounded-full ${cfg.ring} opacity-75 animate-ping`} />
        <span className={`relative rounded-full ${dotSize} ${cfg.dot} shadow-xs`} />
      </div>
      {label && (
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Pulsing Wave / Pulse Card Container
 */
export const PulsingWave = ({ children, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

export default {
  PulsingDots,
  PulsingBeacon,
  PulsingWave,
};

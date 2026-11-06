import React, { useState, useEffect } from 'react';

/**
 * Top Progress Bar Loader
 * Fixed to the very top of the viewport (z-[99999]).
 * Listens to global axios request events or can be activated via active prop.
 * Matches Nagulan luxury gold theme with glowing shadow.
 */
export const TopProgressBar = ({ active = false }) => {
  const [loading, setLoading] = useState(active);

  useEffect(() => {
    setLoading(active);
  }, [active]);

  useEffect(() => {
    let reqCount = 0;

    const handleStart = () => {
      reqCount++;
      setLoading(true);
    };

    const handleEnd = () => {
      reqCount = Math.max(0, reqCount - 1);
      if (reqCount === 0) {
        // Small delay so users notice the completion smoothly
        setTimeout(() => setLoading(false), 250);
      }
    };

    window.addEventListener('salon:request-start', handleStart);
    window.addEventListener('salon:request-end', handleEnd);

    return () => {
      window.removeEventListener('salon:request-start', handleStart);
      window.removeEventListener('salon:request-end', handleEnd);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[99999] overflow-hidden bg-transparent pointer-events-none">
      <div className="absolute inset-0 bg-gold-500/20" />
      <div
        className="absolute top-0 bottom-0 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 shadow-[0_0_12px_#D4AF37] animate-indeterminate rounded-r-full"
      />
    </div>
  );
};

/**
 * Linear Progress Bar Component
 * Supports determinate (value: 0-100) or indeterminate mode.
 */
export const LinearProgressBar = ({
  value = null, // null for indeterminate, 0-100 for determinate
  height = 'h-1.5',
  showLabel = false,
  className = '',
}) => {
  const isIndeterminate = value === null || value === undefined;

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {showLabel && !isIndeterminate && (
        <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          <span>Progress</span>
          <span className="font-mono text-gold-600 dark:text-gold-400">{Math.round(value)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-gray-200 dark:bg-charcoal-800 rounded-full overflow-hidden relative`}>
        {isIndeterminate ? (
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 shadow-[0_0_8px_#D4AF37] animate-indeterminate rounded-full" />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 shadow-[0_0_8px_#D4AF37] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default {
  TopProgressBar,
  LinearProgressBar,
};

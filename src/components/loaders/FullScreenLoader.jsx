import React from 'react';

/**
 * Nagulan Luxury Full-Screen Loader
 * Used for initial authentication boot, terminal initialization, or heavy operations.
 * Features dual gold orbiting rings, brand emblem, and luxury typography.
 */
export const FullScreenLoader = ({
  message = 'Initializing Nagulan Salon POS...',
  subtext = 'Securing session & loading terminal data',
  blur = true,
}) => {
  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/90 dark:bg-charcoal-950/95 transition-all duration-300 ${
        blur ? 'backdrop-blur-md' : ''
      }`}
      role="alert"
      aria-busy="true"
      aria-label="Loading application"
    >
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Luxury Gold Orbit & Brand Monogram */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          {/* Outer Orbiting Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500/40 animate-spin" style={{ animationDuration: '10s' }} />
          
          {/* Middle Rotating Smooth Glow Ring */}
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-gold-500 border-r-gold-400 animate-spin" style={{ animationDuration: '1.4s' }} />

          {/* Inner Counter-Rotating Accent Ring */}
          <div className="absolute inset-4 rounded-full border border-gold-400/30 border-b-gold-500 animate-spin" style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />

          {/* Center Monogram Emblem */}
          <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-charcoal-900 to-black dark:from-charcoal-800 dark:to-charcoal-950 border border-gold-500/60 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center">
            <span className="font-serif font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 select-none">
              N
            </span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h2 className="font-serif font-black text-lg sm:text-xl tracking-[0.2em] uppercase text-gray-900 dark:text-white">
            NAGULAN
          </h2>
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
            Unisex Salon & Spa
          </p>
        </div>

        {/* Dynamic Status Indicator */}
        <div className="space-y-2 w-full pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-700 dark:text-gold-300">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping" />
            <span className="tracking-wide">{message}</span>
          </div>
          {subtext && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;

import React, { useState, useRef, useEffect } from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { SpinnerLoader } from './SpinnerLoader';

/**
 * Nagulan Pull-to-Refresh Container Loader
 * Wraps scrollable content (e.g. Sales table, Dashboard, Present Day overview).
 * Responds to touch pull gestures on mobile or mouse drag.
 */
export const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 70, // pull threshold in pixels
  className = '',
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef(null);

  const isAtTop = () => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop === 0;
  };

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    if (isAtTop()) {
      startY.current = e.touches ? e.touches[0].clientY : e.clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    currentY.current = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && isAtTop()) {
      // Damping curve for smooth elastic resistance
      const dampedDistance = Math.min(diff * 0.45, threshold * 1.5);
      setPullDistance(dampedDistance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullDistance >= threshold && onRefresh && !isRefreshing) {
      try {
        setIsRefreshing(true);
        setPullDistance(threshold * 0.85); // hold in place while refreshing
        await onRefresh();
      } catch (err) {
        console.error('Pull to refresh failed:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const isThresholdReached = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full overflow-y-auto transition-transform ${className}`}
    >
      {/* Animated Pull Indicator Banner */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-200 pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-charcoal-900 border border-gold-500/30 shadow-md text-xs font-semibold text-gray-800 dark:text-gray-200">
          {isRefreshing ? (
            <>
              <SpinnerLoader size="sm" variant="gold" />
              <span className="text-gold-600 dark:text-gold-400 font-bold uppercase tracking-wider text-[11px]">
                Refreshing Data...
              </span>
            </>
          ) : (
            <>
              <ArrowDown
                className={`w-3.5 h-3.5 text-gold-500 transition-transform duration-200 ${
                  isThresholdReached ? 'rotate-180 text-gold-600' : ''
                }`}
              />
              <span className="text-[11px] text-gray-600 dark:text-gray-300">
                {isThresholdReached ? 'Release to refresh' : 'Pull down to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Page Content */}
      {children}
    </div>
  );
};

export default PullToRefresh;

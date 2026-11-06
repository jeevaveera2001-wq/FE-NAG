import React, { useEffect, useRef } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { SpinnerLoader } from './SpinnerLoader';
import { PulsingDots } from './PulsingLoader';

/**
 * Nagulan Infinite Scroll Loader Component
 * Renders at the bottom of paginated tables (e.g. Sales History, Activity Logs, Expenses).
 * Automatically fires onLoadMore when user scrolls near the bottom.
 */
export const InfiniteScrollLoader = ({
  hasMore = false,
  loading = false,
  onLoadMore,
  endMessage = 'All records loaded',
  totalCount = 0,
  currentCount = 0,
  showButtonFallback = true,
  className = '',
}) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // trigger 200px before reaching absolute bottom
        threshold: 0.1,
      }
    );

    const currentTarget = sentinelRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className={`w-full py-4 flex flex-col items-center justify-center gap-2 ${className}`}>
      {/* Sentinel trigger element */}
      <div ref={sentinelRef} className="h-1 w-full pointer-events-none" />

      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-charcoal-900/80 border border-gold-500/30 shadow-xs">
          <SpinnerLoader size="sm" variant="gold" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
            Loading more records...
          </span>
          <PulsingDots size="sm" color="gold" />
        </div>
      )}

      {!loading && hasMore && showButtonFallback && (
        <button
          type="button"
          onClick={onLoadMore}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-charcoal-700 hover:border-gold-500/60 bg-white dark:bg-charcoal-900 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-950/20 shadow-xs transition-all cursor-pointer"
        >
          <span>Load More</span>
          <ChevronDown className="w-3.5 h-3.5 text-gold-500" />
          {totalCount > 0 && currentCount > 0 && (
            <span className="text-[10px] text-gray-400 font-normal">
              ({currentCount} of {totalCount})
            </span>
          )}
        </button>
      )}

      {!loading && !hasMore && currentCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-gold-500/70" />
          <span>{endMessage}</span>
          {totalCount > 0 && <span>({totalCount} items)</span>}
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollLoader;

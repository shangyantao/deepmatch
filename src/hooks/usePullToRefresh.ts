'use client';

import { useEffect, useRef } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const refreshing = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = async (e: TouchEvent) => {
      if (window.scrollY === 0 && !refreshing.current) {
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 100) {
          refreshing.current = true;
          await onRefresh();
          refreshing.current = false;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onRefresh]);
}
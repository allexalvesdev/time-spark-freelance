
import { useEffect, useRef, useState, useCallback } from 'react';
import { Timer } from '@/types/timer';

export function useRealTimeCounter(activeTimer: Timer | null) {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Remove clearInterval from dependencies to prevent circular dependency
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If no timer or timer is paused, set the exact elapsed seconds and stop
    if (!activeTimer) {
      setRealTimeSeconds(0);
      return;
    }

    if (activeTimer.isPaused) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      return;
    }

    // Timer is active and not paused - start real-time counting
    setRealTimeSeconds(activeTimer.elapsedSeconds);
    lastUpdateRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastUpdateRef.current) / 1000);
      
      if (deltaSeconds >= 1) {
        setRealTimeSeconds(prev => prev + deltaSeconds);
        lastUpdateRef.current = now;
      }
    }, 100);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer?.id, activeTimer?.isPaused, activeTimer?.elapsedSeconds]);

  return realTimeSeconds;
}

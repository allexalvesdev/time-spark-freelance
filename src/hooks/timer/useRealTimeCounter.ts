
import { useState, useEffect } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);

  // Set initial real-time seconds when activeTimer changes
  useEffect(() => {
    if (activeTimer) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
    } else {
      setRealTimeSeconds(0);
    }
  }, [activeTimer?.id, activeTimer?.elapsedSeconds]);

  // Real-time counter for active timers - ONLY runs when NOT paused
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      // If paused or no timer, stop the interval completely
      return;
    }

    const interval = setInterval(() => {
      setRealTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isPaused, activeTimer?.id]);

  return {
    realTimeSeconds,
    setRealTimeSeconds
  };
};

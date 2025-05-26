
import { useState, useEffect, useRef } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Clear any existing interval
  const clearCurrentInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Interval cleared');
    }
  };

  // Set initial real-time seconds when activeTimer changes
  useEffect(() => {
    if (activeTimer) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      isPausedRef.current = activeTimer.isPaused;
    } else {
      setRealTimeSeconds(0);
      isPausedRef.current = false;
      clearCurrentInterval();
    }
  }, [activeTimer?.id, activeTimer?.elapsedSeconds]);

  // Handle pause state changes immediately
  useEffect(() => {
    if (activeTimer) {
      const wasPaused = isPausedRef.current;
      const isNowPaused = activeTimer.isPaused;
      
      if (!wasPaused && isNowPaused) {
        // Just paused - immediately stop interval and freeze display
        console.log('Timer paused - clearing interval immediately');
        clearCurrentInterval();
        setRealTimeSeconds(activeTimer.elapsedSeconds);
      } else if (wasPaused && !isNowPaused) {
        // Just resumed - start new interval
        console.log('Timer resumed - starting new interval');
        clearCurrentInterval(); // Clear any existing interval first
      }
      
      isPausedRef.current = isNowPaused;
    }
  }, [activeTimer?.isPaused]);

  // Real-time counter for active timers - ONLY runs when NOT paused
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      // If paused or no timer, stop the interval completely
      clearCurrentInterval();
      return;
    }

    // Start new interval only if not paused
    console.log('Starting new timer interval');
    intervalRef.current = setInterval(() => {
      // Double-check pause state before updating
      if (!isPausedRef.current) {
        setRealTimeSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearCurrentInterval();
  }, [activeTimer?.isPaused, activeTimer?.id]);

  // Listen for immediate pause events
  useEffect(() => {
    const handleImmediatePause = (event: CustomEvent) => {
      const { taskId, elapsedSeconds } = event.detail;
      if (activeTimer && taskId === activeTimer.taskId) {
        console.log('Immediate pause event received', { elapsedSeconds });
        clearCurrentInterval();
        setRealTimeSeconds(elapsedSeconds);
        isPausedRef.current = true;
      }
    };

    const handleImmediateResume = (event: CustomEvent) => {
      const { taskId } = event.detail;
      if (activeTimer && taskId === activeTimer.taskId) {
        console.log('Immediate resume event received');
        isPausedRef.current = false;
      }
    };

    window.addEventListener('timer-paused', handleImmediatePause as EventListener);
    window.addEventListener('timer-resumed', handleImmediateResume as EventListener);

    return () => {
      window.removeEventListener('timer-paused', handleImmediatePause as EventListener);
      window.removeEventListener('timer-resumed', handleImmediateResume as EventListener);
    };
  }, [activeTimer?.taskId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearCurrentInterval();
  }, []);

  return {
    realTimeSeconds,
    setRealTimeSeconds
  };
};

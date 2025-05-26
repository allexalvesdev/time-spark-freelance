
import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing interval
  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set initial state when activeTimer changes
  useEffect(() => {
    if (activeTimer) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      
      if (activeTimer.isPaused) {
        clearCurrentInterval();
      }
    } else {
      setRealTimeSeconds(0);
      clearCurrentInterval();
    }
  }, [activeTimer?.id, activeTimer?.elapsedSeconds, activeTimer?.isPaused, clearCurrentInterval]);

  // IMMEDIATE local state management for pause/resume events
  useEffect(() => {
    const handleImmediatePause = (event: CustomEvent) => {
      const { taskId, elapsedSeconds } = event.detail;
      
      if (activeTimer && taskId === activeTimer.taskId) {
        setRealTimeSeconds(elapsedSeconds);
        clearCurrentInterval();
      }
    };

    const handleImmediateResume = (event: CustomEvent) => {
      const { taskId } = event.detail;
      
      if (activeTimer && taskId === activeTimer.taskId) {
        // Timer will be handled by main interval logic
      }
    };

    const handleTimerStopped = (event: CustomEvent) => {
      const { taskId } = event.detail;
      
      if (activeTimer && taskId === activeTimer.taskId) {
        clearCurrentInterval();
        setRealTimeSeconds(0);
      }
    };

    window.addEventListener('timer-paused', handleImmediatePause as EventListener);
    window.addEventListener('timer-resumed', handleImmediateResume as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);

    return () => {
      window.removeEventListener('timer-paused', handleImmediatePause as EventListener);
      window.removeEventListener('timer-resumed', handleImmediateResume as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [activeTimer?.taskId, clearCurrentInterval]);

  // Main interval management
  useEffect(() => {
    clearCurrentInterval();

    if (activeTimer && !activeTimer.isPaused) {
      intervalRef.current = setInterval(() => {
        setRealTimeSeconds(prev => prev + 1);
      }, 1000);
    }

    return clearCurrentInterval;
  }, [activeTimer?.id, activeTimer?.isPaused, clearCurrentInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    realTimeSeconds,
    setRealTimeSeconds
  };
};


import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseInstantTimerOptions {
  taskId: string;
}

export const useInstantTimer = ({ taskId }: UseInstantTimerOptions) => {
  const { activeTimer } = useDatabaseTimer();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Check if this task is the active one
  const isActiveTask = activeTimer?.taskId === taskId;
  const isTimerRunning = isActiveTask && activeTimer !== null;
  const isTimerPaused = isActiveTask && activeTimer?.isPaused === true;
  
  // Clear interval helper
  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Sync with database timer when it changes
  useEffect(() => {
    if (isActiveTask && activeTimer) {
      setDisplaySeconds(activeTimer.elapsedSeconds);
      
      if (!activeTimer.isPaused) {
        startTimeRef.current = Date.now() - (activeTimer.elapsedSeconds * 1000);
      }
    } else {
      setDisplaySeconds(0);
      clearCurrentInterval();
    }
  }, [activeTimer?.taskId, activeTimer?.elapsedSeconds, activeTimer?.isPaused, isActiveTask, clearCurrentInterval]);

  // Handle immediate timer events for INSTANT UI updates
  useEffect(() => {
    const handleTimerStarted = (event: CustomEvent) => {
      const { taskId: eventTaskId } = event.detail;
      if (eventTaskId === taskId) {
        setDisplaySeconds(0);
        startTimeRef.current = Date.now();
      }
    };

    const handleTimerPaused = (event: CustomEvent) => {
      const { taskId: eventTaskId, elapsedSeconds } = event.detail;
      if (eventTaskId === taskId) {
        setDisplaySeconds(elapsedSeconds);
        clearCurrentInterval();
      }
    };

    const handleTimerResumed = (event: CustomEvent) => {
      const { taskId: eventTaskId, elapsedSeconds } = event.detail;
      if (eventTaskId === taskId) {
        setDisplaySeconds(elapsedSeconds);
        startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      }
    };

    const handleTimerStopped = (event: CustomEvent) => {
      const { taskId: eventTaskId } = event.detail;
      if (eventTaskId === taskId) {
        setDisplaySeconds(0);
        clearCurrentInterval();
      }
    };

    window.addEventListener('timer-started', handleTimerStarted as EventListener);
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);

    return () => {
      window.removeEventListener('timer-started', handleTimerStarted as EventListener);
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [taskId, clearCurrentInterval]);

  // Local timer interval - runs independently for smooth UI
  useEffect(() => {
    clearCurrentInterval();

    if (isTimerRunning && !isTimerPaused && isActiveTask) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setDisplaySeconds(elapsed);
        }
      }, 1000);
    }

    return clearCurrentInterval;
  }, [isTimerRunning, isTimerPaused, isActiveTask, clearCurrentInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    displaySeconds,
    isTimerRunning,
    isTimerPaused
  };
};

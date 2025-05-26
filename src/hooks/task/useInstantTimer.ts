
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseInstantTimerOptions {
  taskId: string;
  initialElapsedTime?: number;
}

export const useInstantTimer = ({ taskId, initialElapsedTime = 0 }: UseInstantTimerOptions) => {
  const { activeTimer } = useDatabaseTimer();
  const [localSeconds, setLocalSeconds] = useState(initialElapsedTime);
  const [localPaused, setLocalPaused] = useState(false);
  const [localRunning, setLocalRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Check if this task is the active one
  const isActiveTask = activeTimer?.taskId === taskId;
  
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
      console.log('[InstantTimer] Syncing with database timer:', {
        taskId: taskId.slice(0, 8),
        dbElapsed: activeTimer.elapsedSeconds,
        dbPaused: activeTimer.isPaused
      });
      
      setLocalSeconds(activeTimer.elapsedSeconds);
      setLocalPaused(activeTimer.isPaused);
      setLocalRunning(true);
      
      if (!activeTimer.isPaused) {
        startTimeRef.current = Date.now() - (activeTimer.elapsedSeconds * 1000);
      }
    } else if (!isActiveTask) {
      // Not active anymore, use stored elapsed time
      setLocalRunning(false);
      setLocalPaused(false);
      clearCurrentInterval();
    }
  }, [activeTimer?.taskId, activeTimer?.elapsedSeconds, activeTimer?.isPaused, isActiveTask, taskId, clearCurrentInterval]);

  // Handle immediate timer events for INSTANT UI updates
  useEffect(() => {
    const handleTimerStarted = (event: CustomEvent) => {
      const { taskId: eventTaskId } = event.detail;
      if (eventTaskId === taskId) {
        console.log('[InstantTimer] 🚀 INSTANT START for task:', taskId.slice(0, 8));
        setLocalRunning(true);
        setLocalPaused(false);
        setLocalSeconds(0);
        startTimeRef.current = Date.now();
      }
    };

    const handleTimerPaused = (event: CustomEvent) => {
      const { taskId: eventTaskId, elapsedSeconds } = event.detail;
      if (eventTaskId === taskId) {
        console.log('[InstantTimer] ⏸️ INSTANT PAUSE for task:', taskId.slice(0, 8), 'at:', elapsedSeconds);
        setLocalPaused(true);
        setLocalSeconds(elapsedSeconds);
        clearCurrentInterval();
      }
    };

    const handleTimerResumed = (event: CustomEvent) => {
      const { taskId: eventTaskId, elapsedSeconds } = event.detail;
      if (eventTaskId === taskId) {
        console.log('[InstantTimer] ▶️ INSTANT RESUME for task:', taskId.slice(0, 8), 'from:', elapsedSeconds);
        setLocalPaused(false);
        setLocalSeconds(elapsedSeconds);
        startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      }
    };

    const handleTimerStopped = (event: CustomEvent) => {
      const { taskId: eventTaskId } = event.detail;
      if (eventTaskId === taskId) {
        console.log('[InstantTimer] 🛑 INSTANT STOP for task:', taskId.slice(0, 8));
        setLocalRunning(false);
        setLocalPaused(false);
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

    if (localRunning && !localPaused && isActiveTask) {
      console.log('[InstantTimer] ⚡ Starting local interval for task:', taskId.slice(0, 8));
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setLocalSeconds(elapsed);
        }
      }, 1000);
    }

    return clearCurrentInterval;
  }, [localRunning, localPaused, isActiveTask, taskId, clearCurrentInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    displaySeconds: localSeconds,
    isTimerRunning: localRunning && isActiveTask,
    isTimerPaused: localPaused && isActiveTask
  };
};

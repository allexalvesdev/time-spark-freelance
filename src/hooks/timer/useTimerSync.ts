
import { useEffect } from 'react';
import { getSafeInteger } from '@/utils/timer/safeInteger';

interface UseTimerSyncOptions {
  persistKey?: string;
  isActiveTask: boolean;
  isRunning: boolean;
  isPaused: boolean;
  globalActiveTaskId?: string | null;
  setIsPaused: (paused: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setElapsedTime: (elapsed: number) => void;
  setPausedTime: (paused: number) => void;
  startTimeRef: React.MutableRefObject<number | null>;
  pausedAtRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to synchronize timer state with global state and localStorage
 */
export const useTimerSync = ({
  persistKey,
  isActiveTask,
  isRunning,
  isPaused,
  globalActiveTaskId,
  setIsPaused,
  setIsRunning,
  setElapsedTime,
  setPausedTime,
  startTimeRef,
  pausedAtRef
}: UseTimerSyncOptions) => {
  // Handle the active task global timer synchronization
  useEffect(() => {
    if (!persistKey) return;
    
    // If this is the active task's timer and we have a global active timer state
    if (isActiveTask && globalActiveTaskId) {
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
      const globalPausedAt = localStorage.getItem('timerPausedAt');
      const globalPausedTime = localStorage.getItem('timerPausedTime');
      
      if (globalIsPaused && !isPaused) {
        // Global timer is paused but local timer is not
        setIsPaused(true);
        pausedAtRef.current = globalPausedAt ? parseInt(globalPausedAt, 10) : Date.now();
        setPausedTime(getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0));
      }
      else if (globalStartTimeStr && !isRunning) {
        // Global timer is running but local timer is not
        const globalStartTime = parseInt(globalStartTimeStr, 10);
        const pausedTimeValue = getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        const currentElapsed = getSafeInteger(Math.floor((Date.now() - globalStartTime) / 1000) - pausedTimeValue);
        
        startTimeRef.current = globalStartTime;
        setElapsedTime(currentElapsed);
        setIsPaused(globalIsPaused);
        setIsRunning(true);
        
        if (globalIsPaused && globalPausedAt) {
          pausedAtRef.current = parseInt(globalPausedAt, 10);
        }
      }
    }
  }, [persistKey, isActiveTask, globalActiveTaskId, isRunning, isPaused, setIsPaused, setIsRunning, setElapsedTime, setPausedTime, startTimeRef, pausedAtRef]);

  return null;
};

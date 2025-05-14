
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
  // Listen for global pause/resume events
  useEffect(() => {
    const handleTimerPaused = (e: CustomEvent) => {
      if (persistKey?.includes(e.detail.taskId) && isRunning && !isPaused) {
        setIsPaused(true);
        pausedAtRef.current = e.detail.pausedAt || Date.now();
      }
    };
    
    const handleTimerResumed = (e: CustomEvent) => {
      if (persistKey?.includes(e.detail.taskId) && isRunning && isPaused) {
        setIsPaused(false);
        setPausedTime(e.detail.newPausedTime || 0);
        pausedAtRef.current = null;
      }
    };
    
    const handleTimerStopped = (e: CustomEvent) => {
      if (persistKey?.includes(e.detail.taskId) && isRunning) {
        setIsRunning(false);
        setIsPaused(false);
        setElapsedTime(e.detail.elapsedTime || 0);
      }
    };
    
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
    
    return () => {
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [persistKey, isRunning, isPaused, setIsPaused, setPausedTime, setIsRunning, setElapsedTime, pausedAtRef]);

  // Handle global storage changes using event listeners
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      if (!persistKey || !isActiveTask || !globalActiveTaskId) return;
      
      // For manual dispatched events (non-StorageEvent), just do the sync
      if (!(e instanceof StorageEvent)) {
        syncFromLocalStorage();
        return;
      }
      
      // Only handle changes to timer-related keys for StorageEvent
      const isTimerKey = e instanceof StorageEvent && e.key && (
        e.key.includes('timer') || 
        e.key.includes('activeTask') || 
        e.key.includes('activeTimeEntry')
      );

      if (!isTimerKey) return;
      
      syncFromLocalStorage();
    };
    
    // Function to sync from localStorage
    const syncFromLocalStorage = () => {
      // Re-read all relevant timer state from localStorage
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
      const globalPausedAt = localStorage.getItem('timerPausedAt');
      const globalPausedTime = localStorage.getItem('timerPausedTime');
      const taskStartTimeStr = localStorage.getItem(`timerStartTime-global-timer-${globalActiveTaskId}`);
      
      // Use task-specific or global timer values
      const startTimeStr = taskStartTimeStr || globalStartTimeStr;

      // Synchronize pause state across tabs
      if (globalIsPaused && !isPaused) {
        setIsPaused(true);
        pausedAtRef.current = globalPausedAt ? parseInt(globalPausedAt, 10) : Date.now();
        setPausedTime(getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0));
      } 
      else if (!globalIsPaused && isPaused) {
        setIsPaused(false);
        const pausedTimeValue = getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        setPausedTime(pausedTimeValue);
        pausedAtRef.current = null;
      }
      
      // Ensure the timer is running if it should be
      if (startTimeStr && !isRunning) {
        const startTime = parseInt(startTimeStr, 10);
        startTimeRef.current = startTime;
        
        // Calculate the correct elapsed time
        const pausedTimeValue = getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        const currentElapsed = getSafeInteger(Math.floor((Date.now() - startTime) / 1000) - pausedTimeValue);
        
        setElapsedTime(currentElapsed);
        setIsRunning(true);
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for manual event triggers (from within the same tab)
    window.addEventListener('storage-check', handleStorageChange);
    
    // Force a sync on mount
    syncFromLocalStorage();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-check', handleStorageChange);
    };
  }, [persistKey, isActiveTask, globalActiveTaskId, isRunning, isPaused, setIsPaused, setIsRunning, setElapsedTime, setPausedTime, startTimeRef, pausedAtRef]);

  // Handle the active task global timer synchronization
  useEffect(() => {
    if (!persistKey) return;
    
    // If this is the active task's timer and we have a global active timer state
    if (isActiveTask && globalActiveTaskId) {
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
      const globalPausedAt = localStorage.getItem('timerPausedAt');
      const globalPausedTime = localStorage.getItem('timerPausedTime');
      const taskStartTimeStr = localStorage.getItem(`timerStartTime-global-timer-${globalActiveTaskId}`);
      
      // Use task-specific values when available, fall back to global values
      const startTimeStr = taskStartTimeStr || globalStartTimeStr;
      
      if (globalIsPaused && !isPaused) {
        // Global timer is paused but local timer is not
        setIsPaused(true);
        pausedAtRef.current = globalPausedAt ? parseInt(globalPausedAt, 10) : Date.now();
        setPausedTime(getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0));
      }
      else if (!globalIsPaused && isPaused) {
        // Global timer is running but local timer is paused
        setIsPaused(false);
        const pausedTimeValue = getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        setPausedTime(pausedTimeValue);
        pausedAtRef.current = null;
      }
      else if (startTimeStr && !isRunning) {
        // Global timer is running but local timer is not
        const startTime = parseInt(startTimeStr, 10);
        const pausedTimeValue = getSafeInteger(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        const currentElapsed = getSafeInteger(Math.floor((Date.now() - startTime) / 1000) - pausedTimeValue);
        
        startTimeRef.current = startTime;
        setElapsedTime(currentElapsed);
        setIsPaused(globalIsPaused);
        setIsRunning(true);
        
        if (globalIsPaused && globalPausedAt) {
          pausedAtRef.current = parseInt(globalPausedAt, 10);
        }
      }
      
      // Dispara um evento personalizado para garantir que todos os timers se sincronizem
      const syncEvent = new CustomEvent('storage-check');
      window.dispatchEvent(syncEvent);
    }
  }, [persistKey, isActiveTask, globalActiveTaskId, isRunning, isPaused, setIsPaused, setIsRunning, setElapsedTime, setPausedTime, startTimeRef, pausedAtRef]);

  return null;
};

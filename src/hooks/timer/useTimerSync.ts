
import { useEffect, RefObject } from 'react';
import { getPersistedTimerState, persistTimerState } from '@/utils/timer/timerStorage';

export interface UseTimerSyncOptions {
  persistKey?: string;
  isActiveTask: boolean;
  isRunning: boolean;
  isPaused: boolean;
  globalActiveTaskId: string | null;
  setIsPaused: (paused: boolean) => void;
  setIsRunning: (running: boolean) => void;
  setElapsedTime: (time: number) => void;
  setPausedTime: (time: number) => void;
  startTimeRef: RefObject<number | null>;
  pausedAtRef: RefObject<number | null>;
}

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
  // Listen for force-timer-sync events (from header) to sync timer state
  useEffect(() => {
    const handleForceSync = () => {
      if (!persistKey) return;
      
      // Only react to force sync if this is the active task
      if (isActiveTask) {
        // Get the latest state from local storage
        const timerState = getPersistedTimerState(persistKey);
        
        if (timerState) {
          if (timerState.running && timerState.paused && timerState.pausedAt) {
            setIsRunning(true);
            setIsPaused(true);
            setPausedTime(timerState.pausedTime);
            setElapsedTime(timerState.elapsed);
            startTimeRef.current = timerState.startTime;
            pausedAtRef.current = timerState.pausedAt;
          } else if (timerState.running && !timerState.paused && timerState.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime) / 1000) - timerState.pausedTime;
            
            setElapsedTime(elapsed > 0 ? elapsed : 0);
            setPausedTime(timerState.pausedTime);
            setIsRunning(true);
            setIsPaused(false);
            
            startTimeRef.current = timerState.startTime;
            pausedAtRef.current = null;
          }
        }
      }
    };
    
    // Listen for force-timer-sync events (from header or elsewhere)
    window.addEventListener('force-timer-sync', handleForceSync);
    
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key === 'activeTaskId' && isActiveTask) {
        handleForceSync();
      }
    });
    
    // Listen for timer-stopped events
    window.addEventListener('timer-stopped', (event: Event) => {
      const stopEvent = event as CustomEvent;
      const { taskId } = stopEvent.detail || {};
      
      if (persistKey?.includes(taskId)) {
        setIsRunning(false);
        setIsPaused(false);
      }
    });
    
    return () => {
      window.removeEventListener('force-timer-sync', handleForceSync);
      window.removeEventListener('timer-stopped', handleForceSync as EventListener);
    };
  }, [persistKey, isActiveTask, isRunning, isPaused, setIsPaused, setIsRunning, 
      setElapsedTime, setPausedTime, startTimeRef, pausedAtRef, globalActiveTaskId]);
  
  // Explicit sync function could be exposed here if needed elsewhere
  const syncTimerState = () => {
    if (!persistKey) return;
    
    const timerState = getPersistedTimerState(persistKey);
    
    if (timerState) {
      // Implement sync logic similar to above
      if (timerState.running && timerState.paused) {
        // Sync paused state
      } else if (timerState.running && !timerState.paused) {
        // Sync running state
      } else {
        // Sync stopped state
      }
    }
  };
  
  // Additional effect to listen for storage-check events to validate state
  useEffect(() => {
    const handleStorageCheck = (event: Event) => {
      const storageEvent = event as CustomEvent;
      const { taskId } = storageEvent.detail || {};
      
      if (persistKey?.includes(taskId) && isRunning) {
        // Re-persist the current state to ensure it's fresh in storage
        persistTimerState(
          persistKey,
          isRunning,
          isPaused,
          // Use current refs for accurate values
          startTimeRef.current && !isPaused
            ? Math.floor((Date.now() - startTimeRef.current) / 1000)
            : 0,
          startTimeRef.current && pausedAtRef.current && isPaused
            ? Math.floor((pausedAtRef.current - startTimeRef.current) / 1000)
            : 0,
          startTimeRef.current,
          pausedAtRef.current
        );
      }
    };
    
    // Listen for timer consistency check events
    window.addEventListener('storage-check', handleStorageCheck);
    
    return () => {
      window.removeEventListener('storage-check', handleStorageCheck);
    };
  }, [persistKey, isRunning, isPaused, startTimeRef, pausedAtRef]);
  
  // Effect for prioritizing task-specific values
  useEffect(() => {
    // If this is the active task, make sure its values take priority
    if (isActiveTask && persistKey && globalActiveTaskId) {
      // Dispatch event to other components to sync
      window.dispatchEvent(new CustomEvent('force-timer-sync'));
    }
  }, [isActiveTask, persistKey, globalActiveTaskId]);
};

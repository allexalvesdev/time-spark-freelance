
import { useEffect, RefObject, MutableRefObject } from 'react';
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
  startTimeRef: MutableRefObject<number | null>;
  pausedAtRef: MutableRefObject<number | null>;
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
            // Fixed: use mutable ref assignment
            if (startTimeRef && 'current' in startTimeRef) {
              startTimeRef.current = timerState.startTime;
            }
            if (pausedAtRef && 'current' in pausedAtRef) {
              pausedAtRef.current = timerState.pausedAt;
            }
          } else if (timerState.running && !timerState.paused && timerState.startTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime) / 1000) - timerState.pausedTime;
            
            setElapsedTime(elapsed > 0 ? elapsed : 0);
            setPausedTime(timerState.pausedTime);
            setIsRunning(true);
            setIsPaused(false);
            
            // Fixed: use mutable ref assignment
            if (startTimeRef && 'current' in startTimeRef) {
              startTimeRef.current = timerState.startTime;
            }
            if (pausedAtRef && 'current' in pausedAtRef) {
              pausedAtRef.current = null;
            }
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
      try {
        // Safely handle the event as a CustomEvent
        const stopEvent = event as CustomEvent;
        const taskId = stopEvent?.detail?.taskId;
        
        // Only proceed if we have a valid taskId and it matches our persistKey
        if (taskId && persistKey?.includes(taskId)) {
          setIsRunning(false);
          setIsPaused(false);
        }
      } catch (error) {
        console.error("Error handling timer-stopped event:", error);
      }
    });
    
    return () => {
      window.removeEventListener('force-timer-sync', handleForceSync);
      window.removeEventListener('timer-stopped', handleForceSync as EventListener);
    };
  }, [persistKey, isActiveTask, isRunning, isPaused, setIsPaused, setIsRunning, 
      setElapsedTime, setPausedTime, startTimeRef, pausedAtRef, globalActiveTaskId]);
  
  // Additional effect to listen for storage-check events to validate state
  useEffect(() => {
    const handleStorageCheck = (event: Event) => {
      try {
        // Add defensive check for the event being a CustomEvent
        if (!(event instanceof CustomEvent) || !event.detail) {
          return;
        }
        
        const storageEvent = event as CustomEvent;
        const taskId = storageEvent.detail?.taskId;
        
        if (!taskId || !persistKey?.includes(taskId) || !isRunning) return;
        
        // Re-persist the current state to ensure it's fresh in storage
        persistTimerState(
          persistKey,
          isRunning,
          isPaused,
          // Use current refs for accurate values, with safe null handling
          (startTimeRef.current && !isPaused)
            ? Math.floor((Date.now() - startTimeRef.current) / 1000)
            : 0,
          (startTimeRef.current && pausedAtRef.current && isPaused)
            ? Math.floor((pausedAtRef.current - startTimeRef.current) / 1000)
            : 0,
          startTimeRef.current,
          pausedAtRef.current
        );
      } catch (error) {
        console.error("Error handling storage-check event:", error);
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

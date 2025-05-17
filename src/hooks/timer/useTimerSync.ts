
import { useEffect, RefObject, MutableRefObject, useRef } from 'react';
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
  // Use ref to track last sync time to prevent excessive syncs
  const lastSyncTime = useRef<number>(0);
  
  // Listen for force-timer-sync events (from header) to sync timer state
  useEffect(() => {
    const handleForceSync = () => {
      if (!persistKey) return;
      
      // Rate limit syncs to prevent excessive operations
      const now = Date.now();
      if (now - lastSyncTime.current < 1000) {
        return; // Skip if last sync was less than 1 second ago
      }
      lastSyncTime.current = now;
      
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
    
    // Listen for storage events from other tabs/windows with throttling
    const handleStorageEvent = (event: StorageEvent) => {
      // Only process if enough time has elapsed since last sync
      const now = Date.now();
      if (now - lastSyncTime.current < 2000) return; // 2 second throttle
      
      if (event.key === 'activeTaskId' && isActiveTask) {
        lastSyncTime.current = now;
        handleForceSync();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Listen for timer-stopped events with improved null safety
    const handleTimerStopped = (event: Event) => {
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
    };
    
    window.addEventListener('timer-stopped', handleTimerStopped);
    
    return () => {
      window.removeEventListener('force-timer-sync', handleForceSync);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('timer-stopped', handleTimerStopped);
    };
  }, [persistKey, isActiveTask, isRunning, isPaused, setIsPaused, setIsRunning, 
      setElapsedTime, setPausedTime, startTimeRef, pausedAtRef, globalActiveTaskId]);
  
  // Additional effect to listen for storage-check events to validate state, with throttling
  useEffect(() => {
    const lastCheckTime = useRef<number>(0);
    
    const handleStorageCheck = (event: Event) => {
      try {
        // Throttle checks to prevent excessive operations
        const now = Date.now();
        if (now - lastCheckTime.current < 3000) return; // 3 second throttle
        lastCheckTime.current = now;
        
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
            ? Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000)
            : 0,
          (startTimeRef.current && pausedAtRef.current && isPaused)
            ? Math.floor((pausedAtRef.current - (startTimeRef.current || 0)) / 1000)
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
  
  // Effect for prioritizing task-specific values with reduced frequency
  useEffect(() => {
    // Track the last time we forced a sync
    const lastForcedSyncTime = useRef<number>(0);
    
    // If this is the active task, make sure its values take priority, but limit frequency
    if (isActiveTask && persistKey && globalActiveTaskId) {
      const now = Date.now();
      if (now - lastForcedSyncTime.current > 2000) { // 2 second minimum between syncs
        lastForcedSyncTime.current = now;
        
        // Use setTimeout to prevent immediate dispatch
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('force-timer-sync'));
        }, 50);
      }
    }
  }, [isActiveTask, persistKey, globalActiveTaskId]);
};

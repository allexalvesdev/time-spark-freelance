
import { useEffect, useRef } from 'react';
import { persistTimerState, updateGlobalTimerState } from './timerState';
import { isLocalStorageAvailable } from './storageCore';

interface UseTimerIntervalProps {
  persistKey?: string;
  isRunning: boolean;
  elapsedTime: number;
  setElapsedTime: (time: number) => void;
  startTimeRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to handle timer interval for updating elapsed time
 */
export const useTimerInterval = ({
  persistKey,
  isRunning,
  elapsedTime,
  setElapsedTime,
  startTimeRef
}: UseTimerIntervalProps): void => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Function to update elapsed time on each tick
    const updateElapsedTime = () => {
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
        
        setElapsedTime(currentElapsed);
        
        // Sync state every 2 seconds to ensure persistence
        if (now - lastSyncTimeRef.current > 2000 && isLocalStorageAvailable() && persistKey) {
          persistTimerState(persistKey, true, currentElapsed, startTimeRef.current);
          lastSyncTimeRef.current = now;
          
          // Also update global state if this is a task timer
          if (persistKey.includes('global-timer-')) {
            const taskId = persistKey.replace('global-timer-', '');
            updateGlobalTimerState(persistKey, taskId, startTimeRef.current);
          }
        }
      }
    };
    
    // On mount or when isRunning changes, setup interval
    if (isRunning) {
      // If startTimeRef is not set but we're supposed to be running,
      // calculate it based on current elapsedTime
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - (elapsedTime * 1000);
        console.log(`[Timer:${persistKey}] Starting timer with startTimeRef:`, startTimeRef.current);
        
        if (persistKey && isLocalStorageAvailable()) {
          persistTimerState(persistKey, true, elapsedTime, startTimeRef.current);
          
          // If this is a task timer, also update global timer state
          if (persistKey.includes('global-timer-')) {
            const taskId = persistKey.replace('global-timer-', '');
            updateGlobalTimerState(persistKey, taskId, startTimeRef.current);
          }
        }
      }
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set new interval to update time every second
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } else {
      // Clear interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Save stopped state if we have a persistKey
      if (persistKey && isLocalStorageAvailable()) {
        persistTimerState(persistKey, false, elapsedTime, null);
      }
    }

    return () => {
      // Clean up interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, persistKey, elapsedTime, setElapsedTime, startTimeRef]);
  
  // Save state before unmounting
  useEffect(() => {
    return () => {
      // Save current time before unmounting if running
      if (isRunning && persistKey && isLocalStorageAvailable()) {
        persistTimerState(persistKey, isRunning, elapsedTime, startTimeRef.current);
      }
    };
  }, [isRunning, elapsedTime, persistKey, startTimeRef]);
};

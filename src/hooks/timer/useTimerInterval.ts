
import { useEffect, useRef } from 'react';
import { persistTimerState, isLocalStorageAvailable, updateGlobalTimerState } from './timerStorage';

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
    if (!persistKey) return;
    
    // Function to update elapsed time on each tick
    const updateElapsedTime = () => {
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
        
        setElapsedTime(currentElapsed);
        
        // Sync state every 2 seconds to ensure persistence
        if (now - lastSyncTimeRef.current > 2000 && isLocalStorageAvailable()) {
          persistTimerState(persistKey, true, currentElapsed, startTimeRef.current);
          lastSyncTimeRef.current = now;
        }
      }
    };

    if (isRunning) {
      // If just starting now, initialize start time
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        console.log(`[Timer:${persistKey}] Starting timer:`, { 
          startTime: startTimeRef.current, 
          elapsedTime 
        });
        
        if (isLocalStorageAvailable()) {
          persistTimerState(persistKey, true, elapsedTime, startTimeRef.current);
          
          // If this is a task timer, also update global timer state
          if (persistKey && persistKey.includes('global-timer-')) {
            const taskId = persistKey.replace('global-timer-', '');
            updateGlobalTimerState(persistKey, taskId, startTimeRef.current);
          }
        }
      }
      
      // Clear any existing interval to avoid duplications
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Update elapsed time every second
      intervalRef.current = setInterval(updateElapsedTime, 1000);
      console.log(`[Timer:${persistKey}] Timer started/continued`);
    } else {
      // Clear interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[Timer:${persistKey}] Timer stopped`);
      }
      
      // Save stopped state and elapsed time
      if (isLocalStorageAvailable()) {
        persistTimerState(persistKey, false, elapsedTime, null);
      }
    }

    return () => {
      // Cleanup interval when component unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[Timer:${persistKey}] Timer cleaned up (unmount)`);
      }
    };
  }, [isRunning, persistKey, elapsedTime, setElapsedTime, startTimeRef]);
  
  // Save state before unmounting
  useEffect(() => {
    return () => {
      // Save current time before unmounting if running
      if (isRunning && persistKey && isLocalStorageAvailable()) {
        persistTimerState(persistKey, isRunning, elapsedTime, startTimeRef.current);
        console.log(`[Timer:${persistKey}] Saving state before unmounting:`, {
          isRunning,
          elapsedTime,
          startTimeRef: startTimeRef.current
        });
      }
    };
  }, [isRunning, elapsedTime, persistKey, startTimeRef]);
};

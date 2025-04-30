
import { useEffect } from 'react';
import { loadTimerState, safeGetItem, isLocalStorageAvailable } from './timerStorage';

interface UseTimerSyncProps {
  persistKey?: string;
  isRunning: boolean;
  elapsedTime: number;
  setIsRunning: (isRunning: boolean) => void;
  setElapsedTime: (time: number) => void;
  startTimeRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to handle timer synchronization between tabs and storage
 */
export const useTimerSync = ({
  persistKey,
  isRunning,
  elapsedTime,
  setIsRunning,
  setElapsedTime,
  startTimeRef
}: UseTimerSyncProps): void => {
  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!persistKey) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.key.includes('timer') || !e.key.includes(persistKey)) return;
      
      console.log(`[Timer:${persistKey}] Storage change detected:`, { 
        key: e.key, 
        newValue: e.newValue 
      });
      
      const { isRunning: newIsRunning, elapsedTime: newElapsedTime, startTimeRef: newStartTimeRef } = 
        loadTimerState(persistKey);
      
      if (newIsRunning !== isRunning) {
        setIsRunning(newIsRunning);
      }
      
      if (newElapsedTime !== elapsedTime) {
        setElapsedTime(newElapsedTime);
      }
      
      if (newStartTimeRef !== startTimeRef.current) {
        startTimeRef.current = newStartTimeRef;
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Sync with active task timer
    if (persistKey.includes('global-timer-') && isLocalStorageAvailable()) {
      const taskId = persistKey.replace('global-timer-', '');
      const activeTaskId = safeGetItem('activeTaskId');
      const globalStartTimeStr = safeGetItem('timerStartTime');
      
      // If this is the active task's timer but we're not running
      if (taskId === activeTaskId && globalStartTimeStr && !isRunning) {
        try {
          const globalStartTime = parseInt(globalStartTimeStr, 10);
          const currentElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
          
          console.log(`[Timer:${persistKey}] Syncing with global timer:`, {
            globalStartTime,
            currentElapsed
          });
          
          startTimeRef.current = globalStartTime;
          setElapsedTime(currentElapsed);
          setIsRunning(true);
        } catch (parseError) {
          console.error(`[Timer:${persistKey}] Error parsing global start time:`, parseError);
        }
      }
      // If timer is running but this is not the active task
      else if (isRunning && taskId !== activeTaskId) {
        console.log(`[Timer:${persistKey}] Not active task but running - stopping`);
        setIsRunning(false);
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [persistKey, isRunning, elapsedTime, setIsRunning, setElapsedTime, startTimeRef]);
};


import { useEffect, useRef } from 'react';
import { loadTimerState } from './timerLoader';

interface UseTimerInitializationProps {
  persistKey?: string;
  autoStart: boolean;
  setIsRunning: (isRunning: boolean) => void;
  setElapsedTime: (time: number) => void;
  startTimeRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to handle timer initialization from storage
 */
export const useTimerInitialization = ({
  persistKey,
  autoStart,
  setIsRunning,
  setElapsedTime,
  startTimeRef
}: UseTimerInitializationProps): void => {
  const initialSetupDoneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!persistKey || initialSetupDoneRef.current) return;
    
    const { isRunning, elapsedTime, startTimeRef: loadedStartTimeRef, loaded } = 
      loadTimerState(persistKey);
    
    if (loaded) {
      console.log(`[Timer:${persistKey}] Loading saved state:`, {
        isRunning,
        elapsedTime,
        startTimeRef: loadedStartTimeRef
      });
      
      setIsRunning(isRunning);
      setElapsedTime(elapsedTime);
      startTimeRef.current = loadedStartTimeRef;
    } else if (autoStart) {
      console.log(`[Timer:${persistKey}] No saved state but autoStart is true - starting fresh`);
      setIsRunning(true);
    }
    
    // Specifically check for global timer state if this is a task timer
    if (persistKey?.includes('global-timer-')) {
      const taskId = persistKey.replace('global-timer-', '');
      const activeTaskId = localStorage.getItem('activeTaskId');
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      
      if (taskId === activeTaskId && globalStartTimeStr) {
        try {
          const globalStartTime = parseInt(globalStartTimeStr, 10);
          const currentElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
          
          console.log(`[Timer:${persistKey}] Syncing with global timer:`, {
            globalStartTime,
            currentElapsed,
            activeTaskId
          });
          
          startTimeRef.current = globalStartTime;
          setElapsedTime(currentElapsed);
          setIsRunning(true);
        } catch (error) {
          console.error(`[Timer:${persistKey}] Failed to sync with global timer:`, error);
        }
      }
    }
    
    initialSetupDoneRef.current = true;
  }, [persistKey, autoStart, setIsRunning, setElapsedTime, startTimeRef]);
};

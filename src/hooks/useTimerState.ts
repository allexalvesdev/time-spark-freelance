
import { useState, useRef } from 'react';
import { formatTime } from './timer/timerFormatters';
import { persistTimerState, clearTimerState, updateGlobalTimerState } from './timer/timerState';
import { useTimerInitialization } from './timer/useTimerInitialization';
import { useTimerSync } from './timer/useTimerSync';
import { useTimerInterval } from './timer/useTimerInterval';

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  persistKey?: string;
}

const useTimerState = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const startTimeRef = useRef<number | null>(null);
  
  // Initialize timer from storage if available
  useTimerInitialization({
    persistKey,
    autoStart,
    setIsRunning,
    setElapsedTime,
    startTimeRef
  });
  
  // Sync timer with other tabs and global state
  useTimerSync({
    persistKey,
    isRunning,
    elapsedTime,
    setIsRunning,
    setElapsedTime,
    startTimeRef
  });
  
  // Handle timer interval for updating elapsed time
  useTimerInterval({
    persistKey,
    isRunning,
    elapsedTime,
    setElapsedTime,
    startTimeRef
  });
  
  const start = () => {
    if (!isRunning) {
      console.log(`[Timer:${persistKey}] Manually starting timer`);
      
      // Set startTimeRef to consider already elapsed time
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      setIsRunning(true);
      
      // Persist immediately when starting
      if (persistKey) {
        persistTimerState(persistKey, true, elapsedTime, startTimeRef.current);
        
        // Extract taskId and update global timer state
        if (persistKey.includes('global-timer-')) {
          const taskId = persistKey.replace('global-timer-', '');
          updateGlobalTimerState(persistKey, taskId, startTimeRef.current);
        }
      }
    }
  };

  const stop = () => {
    if (isRunning) {
      console.log(`[Timer:${persistKey}] Manually stopping timer`);
      setIsRunning(false);
      
      // Save last elapsed time when stopping
      if (persistKey) {
        persistTimerState(persistKey, false, elapsedTime, null);
      }
      
      // Clear startTimeRef when stopping
      startTimeRef.current = null;
    }
  };

  const reset = () => {
    console.log(`[Timer:${persistKey}] Resetting timer`);
    setElapsedTime(0);
    startTimeRef.current = null;
    
    if (persistKey) {
      clearTimerState(persistKey);
    }
  };

  const getFormattedTime = () => {
    return formatTime(elapsedTime);
  };

  return {
    isRunning,
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimerState;

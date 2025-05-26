import { useState, useEffect, useRef } from 'react';
import { getSafeInteger } from '@/utils/timer/safeInteger';
import { getPersistedTimerState, persistTimerState, clearPersistedTimerState } from '@/utils/timer/timerStorage';
import { startTimerAction, pauseTimerAction, resumeTimerAction, stopTimerAction, formatTimerDisplay } from '@/utils/timer/timerActions';
import { useTimerSync } from './timer/useTimerSync';
import { calculateTimerElapsed } from '@/utils/timer/timeCalculator';

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  persistKey?: string;
}

const useTimerState = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const [pausedTime, setPausedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const initialSetupDoneRef = useRef<boolean>(false);
  
  // Global storage key for the active timer (shared across all components)
  const globalActiveTaskId = localStorage.getItem('activeTaskId');
  const isActiveTask = persistKey?.includes(globalActiveTaskId || '');

  // Use the timer sync hook to handle synchronization with global state
  useTimerSync({
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
  });
  
  // Load persisted data from localStorage when the component mounts
  useEffect(() => {
    if (!persistKey || initialSetupDoneRef.current) return;
    
    try {
      const timerState = getPersistedTimerState(persistKey);
      
      if (timerState) {
        console.log('Loading timer state:', timerState);
        
        // Use unified calculation for all scenarios
        if (timerState.running && timerState.startTime) {
          const calculation = calculateTimerElapsed(
            timerState.startTime,
            timerState.pausedTime || 0,
            timerState.paused || false,
            timerState.pausedAt || null
          );
          
          if (calculation.isValid) {
            setElapsedTime(calculation.elapsedTime);
            setPausedTime(timerState.pausedTime || 0);
            setIsRunning(true);
            setIsPaused(timerState.paused || false);
            startTimeRef.current = timerState.startTime;
            pausedAtRef.current = timerState.pausedAt || null;
            
            console.log('Timer state loaded successfully:', {
              elapsedTime: calculation.elapsedTime,
              pausedTime: timerState.pausedTime,
              isRunning: true,
              isPaused: timerState.paused
            });
          }
        } else {
          // Timer not running, just load saved elapsed time
          setElapsedTime(timerState.elapsed || 0);
          setPausedTime(timerState.pausedTime || 0);
          setIsRunning(false);
          setIsPaused(false);
          startTimeRef.current = null;
          pausedAtRef.current = null;
        }
      } else if (isActiveTask) {
        // If this is the active task but no timer state, check global timer state
        const globalStartTime = localStorage.getItem('timerStartTime');
        const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
        const globalPausedTime = localStorage.getItem('timerPausedTime');
        const globalPausedAt = localStorage.getItem('timerPausedAt');
        
        if (globalStartTime) {
          const calculation = calculateTimerElapsed(
            parseInt(globalStartTime, 10),
            globalPausedTime ? parseInt(globalPausedTime, 10) : 0,
            globalIsPaused,
            globalPausedAt ? parseInt(globalPausedAt, 10) : null
          );
          
          if (calculation.isValid) {
            setElapsedTime(calculation.elapsedTime);
            setPausedTime(calculation.debugInfo?.pausedTime || 0);
            setIsRunning(true);
            setIsPaused(globalIsPaused);
            startTimeRef.current = parseInt(globalStartTime, 10);
            pausedAtRef.current = globalPausedAt ? parseInt(globalPausedAt, 10) : null;
          }
        }
      }
      
      initialSetupDoneRef.current = true;
    } catch (e) {
      console.error('Error loading timer state:', e);
    }
  }, [persistKey, isActiveTask]);

  // Function to clear interval safely
  const clearIntervalSafely = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // This effect handles starting/stopping the interval
  useEffect(() => {
    // Function to update elapsed time on each tick
    const updateElapsedTime = () => {
      if (startTimeRef.current !== null && !isPaused) {
        // Use unified calculation
        const calculation = calculateTimerElapsed(
          startTimeRef.current,
          pausedTime,
          false, // Not paused during update
          null
        );
        
        if (calculation.isValid) {
          setElapsedTime(calculation.elapsedTime);
          
          // Sync state every 2 seconds to ensure persistence
          const now = Date.now();
          if (now - lastSyncTimeRef.current > 2000) {
            persistTimerState(
              persistKey,
              true,
              isPaused, 
              calculation.elapsedTime, 
              pausedTime, 
              startTimeRef.current, 
              pausedAtRef.current
            );
            lastSyncTimeRef.current = now;
          }
        }
      }
    };

    // If running and not paused
    if (isRunning && !isPaused) {
      // If just starting now, initialize start time
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - (elapsedTime + pausedTime) * 1000;
        persistTimerState(persistKey, true, false, elapsedTime, pausedTime, startTimeRef.current, null);
      }
      
      // Clear any existing interval to avoid duplications
      clearIntervalSafely();
      
      // Update elapsed time every second
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } 
    // If paused, keep running state but stop the interval
    else if (isRunning && isPaused) {
      // Clear interval when paused - this is crucial to stop the timer
      clearIntervalSafely();
      
      // Set the paused time reference if not set
      if (pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
      
      // Save paused state
      if (persistKey) {
        persistTimerState(
          persistKey,
          true, 
          true, 
          elapsedTime, 
          pausedTime, 
          startTimeRef.current, 
          pausedAtRef.current
        );
      }
    }
    // If stopped, clear interval
    else {
      // Clear interval when stopped
      clearIntervalSafely();
      
      // Save stopped state and elapsed time
      if (persistKey) {
        persistTimerState(persistKey, false, false, elapsedTime, pausedTime, null, null);
      }
    }

    return () => {
      // Cleanup interval when component unmounts
      clearIntervalSafely();
    };
  }, [isRunning, isPaused, persistKey, elapsedTime, pausedTime]);

  // Avoid potential memory leaks
  useEffect(() => {
    return () => {
      // Save current time before unmounting if running
      if (isRunning && persistKey) {
        persistTimerState(
          persistKey,
          isRunning, 
          isPaused, 
          elapsedTime, 
          pausedTime, 
          startTimeRef.current, 
          pausedAtRef.current
        );
      }
    };
  }, [isRunning, isPaused, elapsedTime, pausedTime, persistKey]);

  // Timer control methods
  const start = () => {
    startTimerAction({
      persistKey,
      isRunning,
      isPaused,
      elapsedTime,
      pausedTime,
      startTimeRef,
      pausedAtRef,
      setIsRunning,
      setIsPaused,
      setPausedTime,
      clearInterval: clearIntervalSafely,
      isActiveTask
    });
  };

  const pause = () => {
    pauseTimerAction({
      persistKey,
      isRunning,
      isPaused,
      elapsedTime,
      pausedTime,
      startTimeRef,
      pausedAtRef,
      setIsRunning,
      setIsPaused,
      setPausedTime,
      clearInterval: clearIntervalSafely,
      isActiveTask
    });
  };

  const resume = () => {
    resumeTimerAction({
      persistKey,
      isRunning,
      isPaused,
      elapsedTime,
      pausedTime,
      startTimeRef,
      pausedAtRef,
      setIsRunning,
      setIsPaused,
      setPausedTime,
      clearInterval: clearIntervalSafely,
      isActiveTask
    });
  };

  const stop = () => {
    stopTimerAction({
      persistKey,
      isRunning,
      isPaused,
      elapsedTime,
      pausedTime,
      startTimeRef,
      pausedAtRef,
      setIsRunning,
      setIsPaused,
      setPausedTime,
      clearInterval: clearIntervalSafely,
      isActiveTask
    });
  };

  const reset = () => {
    setElapsedTime(0);
    setPausedTime(0);
    startTimeRef.current = null;
    pausedAtRef.current = null;
    setIsPaused(false);
    
    if (persistKey) {
      clearPersistedTimerState(persistKey);
    }
  };

  const getFormattedTime = () => formatTimerDisplay(elapsedTime);

  return {
    isRunning,
    isPaused,
    elapsedTime,
    pausedTime,
    start,
    pause,
    resume,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimerState;

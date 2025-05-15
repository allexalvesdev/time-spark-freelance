import { useState, useEffect, useRef } from 'react';
import { getSafeInteger } from '@/utils/timer/safeInteger';
import { getPersistedTimerState, persistTimerState, clearPersistedTimerState } from '@/utils/timer/timerStorage';
import { startTimerAction, pauseTimerAction, resumeTimerAction, stopTimerAction, formatTimerDisplay } from '@/utils/timer/timerActions';
import { useTimerSync } from './timer/useTimerSync';

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
        // Handle paused state
        if (timerState.running && timerState.paused && timerState.pausedAt) {
          setIsRunning(true);
          setIsPaused(true);
          setPausedTime(timerState.pausedTime);
          setElapsedTime(timerState.elapsed);
          startTimeRef.current = timerState.startTime;
          pausedAtRef.current = timerState.pausedAt;
        }
        // If timer was running but not paused
        else if (timerState.running && !timerState.paused && timerState.startTime) {
          const startTimeMs = timerState.startTime;
          // Calculate time elapsed since timer started, accounting for paused time
          const currentElapsed = getSafeInteger(Math.floor((Date.now() - startTimeMs) / 1000) - timerState.pausedTime);
          
          setElapsedTime(currentElapsed);
          setPausedTime(timerState.pausedTime);
          setIsRunning(true);
          setIsPaused(false);
          startTimeRef.current = startTimeMs;
          pausedAtRef.current = null;
        } 
        // If timer was not running, just load the elapsed time
        else if (!timerState.running) {
          setElapsedTime(timerState.elapsed);
          setPausedTime(timerState.pausedTime);
          setIsRunning(false);
          setIsPaused(false);
          startTimeRef.current = null;
          pausedAtRef.current = null;
        }
      }
      
      initialSetupDoneRef.current = true;
    } catch (e) {
      // Silently handle errors
      console.error('Error loading timer state:', e);
    }
  }, [persistKey]);

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
      if (startTimeRef.current !== null) {
        if (isPaused) {
          // If paused, don't update elapsed time
          return;
        }
        
        const now = Date.now();
        // Calculate current elapsed time accounting for total paused time
        const currentElapsed = getSafeInteger(Math.floor((now - startTimeRef.current) / 1000) - pausedTime);
        
        setElapsedTime(currentElapsed);
        
        // Sync state every 2 seconds to ensure persistence
        if (now - lastSyncTimeRef.current > 2000) {
          persistTimerState(
            persistKey,
            true,
            isPaused, 
            currentElapsed, 
            pausedTime, 
            startTimeRef.current, 
            pausedAtRef.current
          );
          lastSyncTimeRef.current = now;
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

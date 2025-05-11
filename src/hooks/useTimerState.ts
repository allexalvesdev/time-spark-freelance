
import { useState, useEffect, useRef } from 'react';

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

  // PostgreSQL integer limit (max value: 2147483647)
  const PG_INTEGER_MAX = 2147483647;

  // Global storage key for the active timer (shared across all components)
  const globalActiveTaskId = localStorage.getItem('activeTaskId');
  const isActiveTask = persistKey?.includes(globalActiveTaskId || '');
  
  // Function to safely calculate time values within PostgreSQL integer limits
  const getSafeValue = (value: number): number => {
    return Math.min(value, PG_INTEGER_MAX);
  };

  // Function to save timer state in localStorage with a more robust approach
  const persistTimerState = (running: boolean, paused: boolean, elapsed: number, pausedTimeValue: number, startTime: number | null, pausedAt: number | null) => {
    if (!persistKey) return;
    
    try {
      // Store all timer state atomically to prevent partial updates
      const timerState = JSON.stringify({
        running,
        paused,
        elapsed: getSafeValue(elapsed),
        pausedTime: getSafeValue(pausedTimeValue),
        startTime,
        pausedAt,
        lastUpdate: Date.now()
      });
      
      localStorage.setItem(`timerState-${persistKey}`, timerState);
      
      // Also store individual values for backward compatibility
      localStorage.setItem(`timerIsRunning-${persistKey}`, running ? 'true' : 'false');
      localStorage.setItem(`timerIsPaused-${persistKey}`, paused ? 'true' : 'false');
      localStorage.setItem(`timerElapsedTime-${persistKey}`, getSafeValue(elapsed).toString());
      localStorage.setItem(`timerPausedTime-${persistKey}`, getSafeValue(pausedTimeValue).toString());
      
      if (running && startTime) {
        localStorage.setItem(`timerStartTime-${persistKey}`, startTime.toString());
      } else if (!running) {
        localStorage.removeItem(`timerStartTime-${persistKey}`);
      }
      
      if (paused && pausedAt) {
        localStorage.setItem(`timerPausedAt-${persistKey}`, pausedAt.toString());
      } else if (!paused) {
        localStorage.removeItem(`timerPausedAt-${persistKey}`);
      }
    } catch (e) {
      // Silently handle errors
    }
  };

  // Load persisted data from localStorage when the component mounts
  useEffect(() => {
    if (!persistKey || initialSetupDoneRef.current) return;
    
    try {
      // First try to load the full timer state object (more robust)
      const timerStateJSON = localStorage.getItem(`timerState-${persistKey}`);
      
      if (timerStateJSON) {
        const timerState = JSON.parse(timerStateJSON);
        
        // Handle paused state
        if (timerState.running && timerState.paused && timerState.pausedAt) {
          setIsRunning(true);
          setIsPaused(true);
          setPausedTime(getSafeValue(timerState.pausedTime || 0));
          setElapsedTime(getSafeValue(timerState.elapsed));
          startTimeRef.current = timerState.startTime;
          pausedAtRef.current = timerState.pausedAt;
        }
        // If timer was running but not paused
        else if (timerState.running && !timerState.paused && timerState.startTime) {
          const startTimeMs = timerState.startTime;
          // Calculate time elapsed since timer started, accounting for paused time
          const currentElapsed = getSafeValue(Math.floor((Date.now() - startTimeMs) / 1000) - (timerState.pausedTime || 0));
          
          setElapsedTime(currentElapsed);
          setPausedTime(getSafeValue(timerState.pausedTime || 0));
          setIsRunning(true);
          setIsPaused(false);
          startTimeRef.current = startTimeMs;
          pausedAtRef.current = null;
        } 
        // If timer was paused, just load the elapsed time
        else if (!timerState.running) {
          setElapsedTime(getSafeValue(timerState.elapsed));
          setPausedTime(getSafeValue(timerState.pausedTime || 0));
          setIsRunning(false);
          setIsPaused(false);
          startTimeRef.current = null;
          pausedAtRef.current = null;
        }
      }
      // Fall back to loading individual values
      else {
        const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
        const savedIsPaused = localStorage.getItem(`timerIsPaused-${persistKey}`);
        const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
        const savedPausedAt = localStorage.getItem(`timerPausedAt-${persistKey}`);
        const savedElapsedTime = localStorage.getItem(`timerElapsedTime-${persistKey}`);
        const savedPausedTime = localStorage.getItem(`timerPausedTime-${persistKey}`);
        
        // Handle paused state
        if (savedIsRunning === 'true' && savedIsPaused === 'true' && savedPausedAt) {
          setIsRunning(true);
          setIsPaused(true);
          setPausedTime(getSafeValue(parseInt(savedPausedTime || '0', 10)));
          setElapsedTime(getSafeValue(parseInt(savedElapsedTime || '0', 10)));
          startTimeRef.current = savedStartTime ? parseInt(savedStartTime, 10) : null;
          pausedAtRef.current = parseInt(savedPausedAt, 10);
        }
        // If timer was running when user left/reloaded the page
        else if (savedIsRunning === 'true' && savedStartTime) {
          const startTimeMs = parseInt(savedStartTime, 10);
          const pausedTimeValue = getSafeValue(parseInt(savedPausedTime || '0', 10));
          const currentElapsed = getSafeValue(Math.floor((Date.now() - startTimeMs) / 1000) - pausedTimeValue);
          
          setElapsedTime(currentElapsed);
          setPausedTime(pausedTimeValue);
          setIsRunning(true);
          setIsPaused(false);
          startTimeRef.current = startTimeMs;
          pausedAtRef.current = null;
        } 
        // If timer was stopped, just restore the elapsed time
        else if (savedElapsedTime && savedIsRunning === 'false') {
          const elapsed = getSafeValue(parseInt(savedElapsedTime, 10));
          const pausedTimeValue = getSafeValue(parseInt(savedPausedTime || '0', 10));
          
          setElapsedTime(elapsed);
          setPausedTime(pausedTimeValue);
          setIsRunning(false);
          setIsPaused(false);
          startTimeRef.current = null;
          pausedAtRef.current = null;
        }
      }
      
      initialSetupDoneRef.current = true;
    } catch (e) {
      // Silently handle errors
    }
  }, [persistKey]);

  // Handle the active task global timer synchronization
  useEffect(() => {
    if (!persistKey) return;
    
    // If this is the active task's timer and we have a global active timer state
    if (isActiveTask && globalActiveTaskId) {
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
      const globalPausedAt = localStorage.getItem('timerPausedAt');
      const globalPausedTime = localStorage.getItem('timerPausedTime');
      
      if (globalIsPaused && !isPaused) {
        // Global timer is paused but local timer is not
        setIsPaused(true);
        pausedAtRef.current = globalPausedAt ? parseInt(globalPausedAt, 10) : Date.now();
        setPausedTime(getSafeValue(globalPausedTime ? parseInt(globalPausedTime, 10) : 0));
      }
      else if (globalStartTimeStr && !isRunning) {
        // Global timer is running but local timer is not
        const globalStartTime = parseInt(globalStartTimeStr, 10);
        const pausedTimeValue = getSafeValue(globalPausedTime ? parseInt(globalPausedTime, 10) : 0);
        const currentElapsed = getSafeValue(Math.floor((Date.now() - globalStartTime) / 1000) - pausedTimeValue);
        
        startTimeRef.current = globalStartTime;
        setElapsedTime(currentElapsed);
        setIsPaused(globalIsPaused);
        setIsRunning(true);
        
        if (globalIsPaused && globalPausedAt) {
          pausedAtRef.current = parseInt(globalPausedAt, 10);
        }
      }
    }
  }, [persistKey, isActiveTask, globalActiveTaskId, isRunning, isPaused]);

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
        const currentElapsed = getSafeValue(Math.floor((now - startTimeRef.current) / 1000) - pausedTime);
        
        setElapsedTime(currentElapsed);
        
        // Sync state every 2 seconds to ensure persistence
        if (now - lastSyncTimeRef.current > 2000) {
          persistTimerState(
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
        persistTimerState(true, false, elapsedTime, pausedTime, startTimeRef.current, null);
      }
      
      // Clear any existing interval to avoid duplications
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Update elapsed time every second
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } 
    // If paused, keep running state but stop the interval
    else if (isRunning && isPaused) {
      // Clear interval when paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Set the paused time reference if not set
      if (pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
      
      // Save paused state
      if (persistKey) {
        persistTimerState(
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Save stopped state and elapsed time
      if (persistKey) {
        persistTimerState(false, false, elapsedTime, pausedTime, null, null);
      }
    }

    return () => {
      // Cleanup interval when component unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, persistKey, elapsedTime, pausedTime]);

  // Avoid potential memory leaks
  useEffect(() => {
    return () => {
      // Save current time before unmounting if running
      if (isRunning && persistKey) {
        persistTimerState(
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

  const start = () => {
    if (!isRunning) {
      // Set startTimeRef to consider already elapsed time
      startTimeRef.current = Date.now() - (elapsedTime + pausedTime) * 1000;
      setIsRunning(true);
      setIsPaused(false);
      
      // Clear pausedAt reference
      pausedAtRef.current = null;
      
      // Persist immediately when starting
      if (persistKey) {
        persistTimerState(true, false, elapsedTime, pausedTime, startTimeRef.current, null);
        
        // Also update global timer state if this is the active task
        if (isActiveTask) {
          localStorage.setItem('timerStartTime', startTimeRef.current.toString());
          localStorage.setItem('timerIsPaused', 'false');
          localStorage.removeItem('timerPausedAt');
        }
      }
    }
  };

  const pause = () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pausedAtRef.current = Date.now();
      
      if (persistKey) {
        persistTimerState(
          true, 
          true, 
          elapsedTime, 
          pausedTime, 
          startTimeRef.current, 
          pausedAtRef.current
        );
        
        if (isActiveTask) {
          localStorage.setItem('timerIsPaused', 'true');
          localStorage.setItem('timerPausedAt', pausedAtRef.current.toString());
        }
      }
    }
  };

  const resume = () => {
    if (isRunning && isPaused) {
      // Calculate additional paused time
      const additionalPausedTime = pausedAtRef.current 
        ? getSafeValue(Math.floor((Date.now() - pausedAtRef.current) / 1000))
        : 0;
      
      // Add the additional paused time to the total
      const newPausedTime = getSafeValue(pausedTime + additionalPausedTime);
      setPausedTime(newPausedTime);
      
      // Resume running
      setIsPaused(false);
      pausedAtRef.current = null;
      
      if (persistKey) {
        persistTimerState(
          true, 
          false, 
          elapsedTime, 
          newPausedTime, 
          startTimeRef.current, 
          null
        );
        
        if (isActiveTask) {
          localStorage.setItem('timerIsPaused', 'false');
          localStorage.setItem('timerPausedTime', newPausedTime.toString());
          localStorage.removeItem('timerPausedAt');
        }
      }
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(false);
      
      // Save last elapsed time when stopping
      if (persistKey) {
        persistTimerState(false, false, elapsedTime, pausedTime, null, null);
      }
      
      // Clear startTimeRef and pausedAtRef when stopping
      startTimeRef.current = null;
      pausedAtRef.current = null;
    }
  };

  const reset = () => {
    setElapsedTime(0);
    setPausedTime(0);
    startTimeRef.current = null;
    pausedAtRef.current = null;
    setIsPaused(false);
    
    if (persistKey) {
      localStorage.removeItem(`timerState-${persistKey}`);
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
      localStorage.removeItem(`timerIsPaused-${persistKey}`);
      localStorage.removeItem(`timerElapsedTime-${persistKey}`);
      localStorage.removeItem(`timerPausedTime-${persistKey}`);
      localStorage.removeItem(`timerPausedAt-${persistKey}`);
    }
  };

  const getFormattedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

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

import { useState, useEffect, useRef } from 'react';

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  persistKey?: string;
}

const useTimerState = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const initialSetupDoneRef = useRef<boolean>(false);

  // Function to save timer state in localStorage with a more robust approach
  const persistTimerState = (running: boolean, elapsed: number, startTime: number | null) => {
    if (!persistKey) return;
    
    try {
      // Store all timer state atomically to prevent partial updates
      const timerState = JSON.stringify({
        running,
        elapsed,
        startTime,
        lastUpdate: Date.now()
      });
      
      localStorage.setItem(`timerState-${persistKey}`, timerState);
      
      // Also store individual values for backward compatibility
      localStorage.setItem(`timerIsRunning-${persistKey}`, running ? 'true' : 'false');
      localStorage.setItem(`timerElapsedTime-${persistKey}`, elapsed.toString());
      
      if (running && startTime) {
        localStorage.setItem(`timerStartTime-${persistKey}`, startTime.toString());
      } else if (!running) {
        localStorage.removeItem(`timerStartTime-${persistKey}`);
      }
      
      console.log(`[Timer:${persistKey}] Estado salvo:`, { running, elapsed, startTime });
    } catch (e) {
      console.error('Error persisting timer state:', e);
    }
  };

  // Load persisted data from localStorage when the component mounts or when persistKey changes
  useEffect(() => {
    if (!persistKey || initialSetupDoneRef.current) return;
    
    try {
      console.log(`[Timer:${persistKey}] Initializing timer with persistKey`);
      
      // Check if this is the active task's timer
      const activeTaskId = localStorage.getItem('activeTaskId');
      const isActiveTask = persistKey.includes(activeTaskId || '');
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      
      // First try to load from the active task global state
      if (isActiveTask && activeTaskId && globalStartTimeStr) {
        const globalStartTime = parseInt(globalStartTimeStr, 10);
        const currentElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
        
        console.log(`[Timer:${persistKey}] Loading from global active timer state:`, { 
          globalStartTime, 
          currentElapsed 
        });
        
        startTimeRef.current = globalStartTime;
        setElapsedTime(currentElapsed);
        setIsRunning(true);
      }
      // Otherwise try to load from the specific timer state
      else {
        // First try to load the full timer state object (more robust)
        const timerStateJSON = localStorage.getItem(`timerState-${persistKey}`);
        
        if (timerStateJSON) {
          const timerState = JSON.parse(timerStateJSON);
          console.log(`[Timer:${persistKey}] Loading saved timer state:`, timerState);
          
          // If timer was running, calculate elapsed time since last update
          if (timerState.running && timerState.startTime) {
            const startTimeMs = timerState.startTime;
            // Calculate time elapsed since timer started
            const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
            
            console.log(`[Timer:${persistKey}] Restoring running timer:`, { 
              startTimeMs,
              currentElapsed
            });
            
            setElapsedTime(currentElapsed);
            setIsRunning(true);
            startTimeRef.current = startTimeMs;
          } 
          // If timer was paused, just load the elapsed time
          else if (!timerState.running) {
            setElapsedTime(timerState.elapsed);
            setIsRunning(false);
            startTimeRef.current = null;
          }
        }
        // Fall back to loading individual values
        else {
          const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
          const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
          const savedElapsedTime = localStorage.getItem(`timerElapsedTime-${persistKey}`);
          
          console.log(`[Timer:${persistKey}] Loading legacy timer state:`, { 
            savedIsRunning, 
            savedStartTime, 
            savedElapsedTime 
          });
          
          // If timer was running when user left/reloaded the page
          if (savedIsRunning === 'true' && savedStartTime) {
            const startTimeMs = parseInt(savedStartTime, 10);
            const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
            
            console.log(`[Timer:${persistKey}] Restoring legacy running timer:`, { 
              startTimeMs,
              currentElapsed
            });
            
            setElapsedTime(currentElapsed);
            setIsRunning(true);
            startTimeRef.current = startTimeMs;
          } 
          // If timer was paused, just restore the elapsed time
          else if (savedElapsedTime && savedIsRunning === 'false') {
            const elapsed = parseInt(savedElapsedTime, 10);
            
            console.log(`[Timer:${persistKey}] Restoring legacy paused timer:`, { elapsed });
            
            setElapsedTime(elapsed);
            setIsRunning(false);
            startTimeRef.current = null;
          }
        }
      }
      
      initialSetupDoneRef.current = true;
    } catch (e) {
      console.error('Error loading timer state:', e);
    }
  }, [persistKey, autoStart]);

  // Check for global timer updates (sync between components)
  useEffect(() => {
    if (!persistKey) return;
    
    // Only proceed if this is a valid task timer
    if (persistKey.includes('global-timer-')) {
      const taskId = persistKey.replace('global-timer-', '');
      const activeTaskId = localStorage.getItem('activeTaskId');
      const globalStartTimeStr = localStorage.getItem('timerStartTime');
      
      // If this is the active task's timer but we're not running
      if (taskId === activeTaskId && globalStartTimeStr && !isRunning) {
        const globalStartTime = parseInt(globalStartTimeStr, 10);
        const currentElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
        
        console.log(`[Timer:${persistKey}] Syncing with global timer:`, {
          globalStartTime,
          currentElapsed
        });
        
        startTimeRef.current = globalStartTime;
        setElapsedTime(currentElapsed);
        setIsRunning(true);
      }
      // If timer is running but this is not the active task
      else if (isRunning && taskId !== activeTaskId) {
        console.log(`[Timer:${persistKey}] Not active task but running - stopping`);
        setIsRunning(false);
        persistTimerState(false, elapsedTime, null);
      }
    }
  }, [persistKey, isRunning, elapsedTime]);

  // This effect handles starting/stopping the interval
  useEffect(() => {
    if (!persistKey) return;
    
    // Function to update elapsed time on each tick
    const updateElapsedTime = () => {
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
        
        setElapsedTime(currentElapsed);
        
        // Sync state every 2 seconds to ensure persistence
        if (now - lastSyncTimeRef.current > 2000) {
          persistTimerState(true, currentElapsed, startTimeRef.current);
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
        persistTimerState(true, elapsedTime, startTimeRef.current);
        
        // If this is a task timer, also update global timer state
        if (persistKey.includes('global-timer-')) {
          localStorage.setItem('timerStartTime', startTimeRef.current.toString());
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
      persistTimerState(false, elapsedTime, null);
    }

    return () => {
      // Cleanup interval when component unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[Timer:${persistKey}] Timer cleaned up (unmount)`);
      }
    };
  }, [isRunning, persistKey, elapsedTime]);

  // Avoid potential memory leaks
  useEffect(() => {
    return () => {
      // Save current time before unmounting if running
      if (isRunning && persistKey) {
        persistTimerState(isRunning, elapsedTime, startTimeRef.current);
        console.log(`[Timer:${persistKey}] Saving state before unmounting:`, {
          isRunning,
          elapsedTime,
          startTimeRef: startTimeRef.current
        });
      }
    };
  }, [isRunning, elapsedTime, persistKey]);

  const start = () => {
    if (!isRunning) {
      console.log(`[Timer:${persistKey}] Manually starting timer`);
      
      // Set startTimeRef to consider already elapsed time
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      setIsRunning(true);
      
      // Persist immediately when starting
      if (persistKey) {
        persistTimerState(true, elapsedTime, startTimeRef.current);
        
        // Also update global timer state if this is a task timer
        if (persistKey.includes('global-timer-')) {
          const taskId = persistKey.replace('global-timer-', '');
          localStorage.setItem('activeTaskId', taskId);
          localStorage.setItem('timerStartTime', startTimeRef.current.toString());
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
        persistTimerState(false, elapsedTime, null);
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
      localStorage.removeItem(`timerState-${persistKey}`);
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
      localStorage.removeItem(`timerElapsedTime-${persistKey}`);
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
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimerState;

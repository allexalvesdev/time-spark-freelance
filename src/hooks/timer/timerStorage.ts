/**
 * Utilities for persisting timer state to localStorage
 */

interface TimerState {
  running: boolean;
  elapsed: number;
  startTime: number | null;
  lastUpdate: number;
}

/**
 * Saves timer state to localStorage
 */
export const persistTimerState = (
  persistKey: string | undefined, 
  running: boolean, 
  elapsed: number, 
  startTime: number | null
): void => {
  if (!persistKey) return;
  
  try {
    // Store all timer state atomically to prevent partial updates
    const timerState: TimerState = {
      running,
      elapsed,
      startTime,
      lastUpdate: Date.now()
    };
    
    localStorage.setItem(`timerState-${persistKey}`, JSON.stringify(timerState));
    
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

/**
 * Loads timer state from localStorage
 * Returns true if state was successfully loaded
 */
export const loadTimerState = (persistKey: string | undefined): {
  isRunning: boolean;
  elapsedTime: number;
  startTimeRef: number | null;
  loaded: boolean;
} => {
  const defaultResult = {
    isRunning: false,
    elapsedTime: 0,
    startTimeRef: null,
    loaded: false
  };
  
  if (!persistKey) return defaultResult;
  
  try {
    console.log(`[Timer:${persistKey}] Initializing timer with persistKey`);
    
    // Check if this is the active task's timer
    const activeTaskId = localStorage.getItem('activeTaskId');
    const timerStartTimeStr = localStorage.getItem('timerStartTime');
    const isActiveTask = activeTaskId && persistKey.includes(activeTaskId);
    
    console.log(`[Timer:${persistKey}] Check if active task:`, { 
      isActiveTask, 
      activeTaskId, 
      timerStartTimeStr 
    });
    
    // First try to load from the active task global state
    if (isActiveTask && timerStartTimeStr) {
      const globalStartTime = parseInt(timerStartTimeStr, 10);
      const currentElapsed = Math.floor((Date.now() - globalStartTime) / 1000);
      
      console.log(`[Timer:${persistKey}] Loading from global active timer state:`, { 
        globalStartTime, 
        currentElapsed 
      });
      
      return {
        isRunning: true,
        elapsedTime: currentElapsed,
        startTimeRef: globalStartTime,
        loaded: true
      };
    }
    // Otherwise try to load from the specific timer state
    else {
      // First try to load the full timer state object (more robust)
      const timerStateJSON = localStorage.getItem(`timerState-${persistKey}`);
      
      if (timerStateJSON) {
        const timerState = JSON.parse(timerStateJSON) as TimerState;
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
          
          return {
            isRunning: true,
            elapsedTime: currentElapsed,
            startTimeRef: startTimeMs,
            loaded: true
          };
        } 
        // If timer was paused, just load the elapsed time
        else if (!timerState.running && timerState.elapsed) {
          return {
            isRunning: false,
            elapsedTime: timerState.elapsed,
            startTimeRef: null,
            loaded: true
          };
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
          
          return {
            isRunning: true,
            elapsedTime: currentElapsed,
            startTimeRef: startTimeMs,
            loaded: true
          };
        } 
        // If timer was paused, just restore the elapsed time
        else if (savedElapsedTime && savedIsRunning === 'false') {
          const elapsed = parseInt(savedElapsedTime, 10);
          
          console.log(`[Timer:${persistKey}] Restoring legacy paused timer:`, { elapsed });
          
          return {
            isRunning: false,
            elapsedTime: elapsed,
            startTimeRef: null,
            loaded: true
          };
        }
      }
    }
  } catch (e) {
    console.error('Error loading timer state:', e);
  }
  
  return defaultResult;
};

/**
 * Clear timer state from localStorage
 */
export const clearTimerState = (persistKey: string | undefined): void => {
  if (!persistKey) return;
  
  localStorage.removeItem(`timerState-${persistKey}`);
  localStorage.removeItem(`timerStartTime-${persistKey}`);
  localStorage.removeItem(`timerIsRunning-${persistKey}`);
  localStorage.removeItem(`timerElapsedTime-${persistKey}`);
};

/**
 * Updates global timer state for active task
 */
export const updateGlobalTimerState = (
  persistKey: string | undefined,
  taskId: string | undefined,
  startTime: number | null
): void => {
  if (!persistKey || !taskId || !startTime) return;
  
  if (persistKey.includes('global-timer-')) {
    localStorage.setItem('activeTaskId', taskId);
    localStorage.setItem('timerStartTime', startTime.toString());
  }
};

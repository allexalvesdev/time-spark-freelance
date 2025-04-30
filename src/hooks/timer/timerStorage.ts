/**
 * Utilities for persisting timer state to localStorage
 */

// In-memory fallback storage when localStorage isn't available
const memoryStorage: Record<string, string> = {};

interface TimerState {
  running: boolean;
  elapsed: number;
  startTime: number | null;
  lastUpdate: number;
}

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
};

/**
 * Safely get an item from localStorage with fallback to memory storage
 */
export const safeGetItem = (key: string): string | null => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    
    // Fall back to memory storage
    return memoryStorage[key] || null;
  } catch (e) {
    console.error(`Error retrieving ${key} from storage:`, e);
    // Fall back to memory storage on any error
    return memoryStorage[key] || null;
  }
};

/**
 * Safely set an item in localStorage with fallback to memory storage
 */
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
      return true;
    }
    
    // Fall back to memory storage
    memoryStorage[key] = value;
    return true;
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
    // Fall back to memory storage on any error
    memoryStorage[key] = value;
    return true;
  }
};

/**
 * Safely remove an item from storage with fallback to memory storage
 */
export const safeRemoveItem = (key: string): boolean => {
  try {
    // Try localStorage first
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
    
    // Also remove from memory storage
    delete memoryStorage[key];
    return true;
  } catch (e) {
    console.error(`Error removing ${key} from storage:`, e);
    // At least remove from memory storage on any error
    delete memoryStorage[key];
    return true;
  }
};

/**
 * Saves timer state to storage
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
    
    const stateStored = safeSetItem(`timerState-${persistKey}`, JSON.stringify(timerState));
    
    // Also store individual values for backward compatibility
    if (stateStored) {
      safeSetItem(`timerIsRunning-${persistKey}`, running ? 'true' : 'false');
      safeSetItem(`timerElapsedTime-${persistKey}`, elapsed.toString());
      
      if (running && startTime) {
        safeSetItem(`timerStartTime-${persistKey}`, startTime.toString());
      } else if (!running) {
        safeRemoveItem(`timerStartTime-${persistKey}`);
      }
      
      console.log(`[Timer:${persistKey}] Estado salvo:`, { running, elapsed, startTime });
    }
  } catch (e) {
    console.error('Error persisting timer state:', e);
  }
};

/**
 * Loads timer state from storage
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
  
  if (!persistKey || !isLocalStorageAvailable()) return defaultResult;
  
  try {
    console.log(`[Timer:${persistKey}] Initializing timer with persistKey`);
    
    // Check if this is the active task's timer
    const activeTaskId = safeGetItem('activeTaskId');
    const timerStartTimeStr = safeGetItem('timerStartTime');
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
      const timerStateJSON = safeGetItem(`timerState-${persistKey}`);
      
      if (timerStateJSON) {
        try {
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
          else if (!timerState.running && timerState.elapsed !== undefined) {
            return {
              isRunning: false,
              elapsedTime: timerState.elapsed,
              startTimeRef: null,
              loaded: true
            };
          }
        } catch (parseError) {
          console.error(`[Timer:${persistKey}] Error parsing timer state:`, parseError);
          // Continue to legacy loading if parsing fails
        }
      }
      // Fall back to loading individual values
      else {
        const savedIsRunning = safeGetItem(`timerIsRunning-${persistKey}`);
        const savedStartTime = safeGetItem(`timerStartTime-${persistKey}`);
        const savedElapsedTime = safeGetItem(`timerElapsedTime-${persistKey}`);
        
        console.log(`[Timer:${persistKey}] Loading legacy timer state:`, { 
          savedIsRunning, 
          savedStartTime, 
          savedElapsedTime 
        });
        
        // If timer was running when user left/reloaded the page
        if (savedIsRunning === 'true' && savedStartTime) {
          try {
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
          } catch (parseError) {
            console.error(`[Timer:${persistKey}] Error parsing start time:`, parseError);
          }
        } 
        // If timer was paused, just restore the elapsed time
        else if (savedElapsedTime && savedIsRunning === 'false') {
          try {
            const elapsed = parseInt(savedElapsedTime, 10);
            
            console.log(`[Timer:${persistKey}] Restoring legacy paused timer:`, { elapsed });
            
            return {
              isRunning: false,
              elapsedTime: elapsed,
              startTimeRef: null,
              loaded: true
            };
          } catch (parseError) {
            console.error(`[Timer:${persistKey}] Error parsing elapsed time:`, parseError);
          }
        }
      }
    }
  } catch (e) {
    console.error(`[Timer:${persistKey}] Error loading timer state:`, e);
  }
  
  return defaultResult;
};

/**
 * Clear timer state from storage
 */
export const clearTimerState = (persistKey: string | undefined): void => {
  if (!persistKey || !isLocalStorageAvailable()) return;
  
  safeRemoveItem(`timerState-${persistKey}`);
  safeRemoveItem(`timerStartTime-${persistKey}`);
  safeRemoveItem(`timerIsRunning-${persistKey}`);
  safeRemoveItem(`timerElapsedTime-${persistKey}`);
};

/**
 * Updates global timer state for active task
 */
export const updateGlobalTimerState = (
  persistKey: string | undefined,
  taskId: string | undefined,
  startTime: number | null
): void => {
  if (!persistKey || !taskId || !startTime || !isLocalStorageAvailable()) return;
  
  if (persistKey.includes('global-timer-')) {
    safeSetItem('activeTaskId', taskId);
    safeSetItem('timerStartTime', startTime.toString());
  }
};

/**
 * Get storage mode (localStorage or memory) currently in use
 */
export const getStorageMode = (): 'localStorage' | 'memory' => {
  return isLocalStorageAvailable() ? 'localStorage' : 'memory';
};

/**
 * Synchronize memory storage with localStorage (when possible)
 * Useful when localStorage becomes available again
 */
export const syncStorageFromMemory = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    Object.keys(memoryStorage).forEach(key => {
      localStorage.setItem(key, memoryStorage[key]);
    });
    return true;
  } catch (e) {
    console.error('Error syncing from memory to localStorage:', e);
    return false;
  }
};

/**
 * Attempt to sync memory from localStorage (when transitioning from localStorage to memory)
 */
export const syncMemoryFromStorage = (): boolean => {
  try {
    // Only do this if localStorage was available at some point
    if (localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('timer')) {
          memoryStorage[key] = localStorage.getItem(key) || '';
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error syncing from localStorage to memory:', e);
    return false;
  }
};

// Try to sync memory from localStorage on module load
syncMemoryFromStorage();

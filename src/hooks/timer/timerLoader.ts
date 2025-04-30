/**
 * Utilities for loading timer state from storage
 */

import { safeGetItem, isLocalStorageAvailable } from './storageCore';
import { TimerState } from './timerState';

/**
 * Loads timer state from storage
 * Returns timer state with a flag indicating if state was successfully loaded
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
      return loadSpecificTimerState(persistKey);
    }
  } catch (e) {
    console.error(`[Timer:${persistKey}] Error loading timer state:`, e);
  }
  
  return defaultResult;
};

/**
 * Load timer state for a specific timer key
 */
function loadSpecificTimerState(persistKey: string): {
  isRunning: boolean;
  elapsedTime: number;
  startTimeRef: number | null;
  loaded: boolean;
} {
  try {
    // First try to load the full timer state object (more robust)
    const timerStateJSON = safeGetItem(`timerState-${persistKey}`);
    
    if (timerStateJSON) {
      return tryParseTimerStateObject(persistKey, timerStateJSON);
    }
    // Fall back to loading individual values
    else {
      return loadLegacyTimerState(persistKey);
    }
  } catch (e) {
    console.error(`[Timer:${persistKey}] Error in loadSpecificTimerState:`, e);
  }
  
  return {
    isRunning: false,
    elapsedTime: 0,
    startTimeRef: null,
    loaded: false
  };
}

/**
 * Try to parse a timer state object from JSON
 */
function tryParseTimerStateObject(
  persistKey: string, 
  timerStateJSON: string
): {
  isRunning: boolean;
  elapsedTime: number;
  startTimeRef: number | null;
  loaded: boolean;
} {
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
  
  return {
    isRunning: false,
    elapsedTime: 0,
    startTimeRef: null,
    loaded: false
  };
}

/**
 * Load legacy timer state from individual storage items
 */
function loadLegacyTimerState(persistKey: string): {
  isRunning: boolean;
  elapsedTime: number;
  startTimeRef: number | null;
  loaded: boolean;
} {
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
  
  return {
    isRunning: false,
    elapsedTime: 0,
    startTimeRef: null,
    loaded: false
  };
}

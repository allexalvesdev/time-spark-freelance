/**
 * Utilities for loading timer state from storage
 */

import { loadSpecificTimerState } from './timerPersistence';
import { loadActiveTimerState } from './activeTimerLoader';

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
    
    // First try to load from the active task global state
    if (persistKey.includes('global-timer-')) {
      const taskId = persistKey.replace('global-timer-', '');
      const activeResult = loadActiveTimerState(persistKey, taskId);
      
      if (activeResult.loaded) {
        return activeResult;
      }
    }
    
    // Otherwise try to load from the specific timer state
    return loadSpecificTimerState(persistKey);
  } catch (e) {
    console.error(`[Timer:${persistKey}] Error loading timer state:`, e);
  }
  
  return defaultResult;
};

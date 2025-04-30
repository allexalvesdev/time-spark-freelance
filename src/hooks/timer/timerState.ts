
/**
 * Utilities for managing timer state in storage
 */

import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from './storageCore';

export interface TimerState {
  running: boolean;
  elapsed: number;
  startTime: number | null;
  lastUpdate: number;
}

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
 * Clear timer state from storage
 */
export const clearTimerState = (persistKey: string | undefined): void => {
  if (!persistKey) return;
  
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
  if (!persistKey || !taskId || !startTime) return;
  
  if (persistKey.includes('global-timer-')) {
    safeSetItem('activeTaskId', taskId);
    safeSetItem('timerStartTime', startTime.toString());
  }
};

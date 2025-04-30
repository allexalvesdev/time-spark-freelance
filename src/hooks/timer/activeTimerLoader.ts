
/**
 * Utilities for loading active timer state
 */

import { safeGetItem } from './storageCore';

/**
 * Loads active timer state for a given task ID
 */
export function loadActiveTimerState(persistKey: string, taskId: string): {
  isRunning: boolean;
  elapsedTime: number;
  startTimeRef: number | null;
  loaded: boolean;
} {
  try {
    // Check if this is the active task's timer
    const activeTaskId = safeGetItem('activeTaskId');
    const timerStartTimeStr = safeGetItem('timerStartTime');
    const isActiveTask = activeTaskId && persistKey.includes(activeTaskId);
    
    console.log(`[Timer:${persistKey}] Check if active task:`, { 
      isActiveTask, 
      activeTaskId, 
      timerStartTimeStr 
    });
    
    // Only handle active task state here
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
  } catch (e) {
    console.error(`[Timer:${persistKey}] Error loading active timer state:`, e);
  }
  
  return {
    isRunning: false,
    elapsedTime: 0,
    startTimeRef: null,
    loaded: false
  };
}

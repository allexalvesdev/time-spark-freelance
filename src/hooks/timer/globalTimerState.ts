
/**
 * Utilities for managing global timer state across the application
 */

import { safeSetItem } from './storageCore';

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


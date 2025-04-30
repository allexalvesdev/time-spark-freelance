
/**
 * Timer storage module - Re-exports all timer storage functionality
 */

// Export all storage core functions
export {
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  syncStorageFromMemory,
  syncMemoryFromStorage
} from './storageCore';

// Export timer state functions
export {
  persistTimerState,
  clearTimerState,
  updateGlobalTimerState,
  type TimerState
} from './timerState';

// Export timer loader functions
export {
  loadTimerState
} from './timerLoader';

/**
 * Get storage mode (localStorage or memory) currently in use
 */
export const getStorageMode = (): 'localStorage' | 'memory' => {
  return isLocalStorageAvailable() ? 'localStorage' : 'memory';
};

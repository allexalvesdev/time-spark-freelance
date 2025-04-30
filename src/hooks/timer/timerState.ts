
/**
 * Utilities for managing timer state in storage
 * This file acts as a facade for all the timer state related functions
 */

// Re-export types
export type { TimerState } from './timerTypes';

// Re-export persistence utilities
export {
  persistTimerState,
  clearTimerState
} from './timerPersistenceUtils';

// Re-export global timer state management
export {
  updateGlobalTimerState
} from './globalTimerState';


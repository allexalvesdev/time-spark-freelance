
import { getSafeInteger } from './safeInteger';

export interface TimerCalculationResult {
  elapsedTime: number;
  isValid: boolean;
  debugInfo?: {
    startTime: number;
    currentTime: number;
    pausedTime: number;
    isPaused: boolean;
    pausedAt: number | null;
  };
}

/**
 * Unified timer calculation function - single source of truth for all timer displays
 * @param startTime The original start time in milliseconds
 * @param pausedTime Total paused time in seconds
 * @param isPaused Whether the timer is currently paused
 * @param pausedAt When the current pause started (if paused)
 * @returns Calculated elapsed time and validation info
 */
export const calculateTimerElapsed = (
  startTime: number | null,
  pausedTime: number = 0,
  isPaused: boolean = false,
  pausedAt: number | null = null
): TimerCalculationResult => {
  console.log('calculateTimerElapsed called with:', { startTime, pausedTime, isPaused, pausedAt });
  
  if (!startTime || startTime <= 0) {
    console.log('Invalid start time, returning 0');
    return { elapsedTime: 0, isValid: false };
  }

  const currentTime = Date.now();
  const safePausedTime = getSafeInteger(pausedTime);
  
  // Calculate raw elapsed time since start
  let rawElapsed = Math.floor((currentTime - startTime) / 1000);
  
  // Subtract total paused time
  let elapsed = rawElapsed - safePausedTime;
  
  // If currently paused, subtract additional time since pause started
  if (isPaused && pausedAt && pausedAt > 0) {
    const additionalPausedTime = Math.floor((currentTime - pausedAt) / 1000);
    elapsed -= additionalPausedTime;
  }
  
  // Ensure non-negative result
  elapsed = Math.max(0, getSafeInteger(elapsed));
  
  const debugInfo = {
    startTime,
    currentTime,
    pausedTime: safePausedTime,
    isPaused,
    pausedAt
  };
  
  console.log('Timer calculation result:', { elapsed, debugInfo });
  
  return {
    elapsedTime: elapsed,
    isValid: true,
    debugInfo
  };
};

/**
 * Get the current elapsed time for an active timer from localStorage
 * @param taskId The task ID
 * @returns Current elapsed time or 0 if not found
 */
export const getCurrentElapsedFromStorage = (taskId: string): number => {
  try {
    const persistKey = `global-timer-${taskId}`;
    const timerStateJSON = localStorage.getItem(`timerState-${persistKey}`);
    
    if (timerStateJSON) {
      const timerState = JSON.parse(timerStateJSON);
      if (timerState.running && timerState.startTime) {
        const result = calculateTimerElapsed(
          timerState.startTime,
          timerState.pausedTime || 0,
          timerState.paused || false,
          timerState.pausedAt || null
        );
        return result.elapsedTime;
      }
      return timerState.elapsed || 0;
    }
    
    // Fallback to global timer state
    const globalStartTime = localStorage.getItem('timerStartTime');
    const globalPausedTime = localStorage.getItem('timerPausedTime');
    const globalIsPaused = localStorage.getItem('timerIsPaused') === 'true';
    const globalPausedAt = localStorage.getItem('timerPausedAt');
    
    if (globalStartTime) {
      const result = calculateTimerElapsed(
        parseInt(globalStartTime, 10),
        globalPausedTime ? parseInt(globalPausedTime, 10) : 0,
        globalIsPaused,
        globalPausedAt ? parseInt(globalPausedAt, 10) : null
      );
      return result.elapsedTime;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting elapsed time from storage:', error);
    return 0;
  }
};

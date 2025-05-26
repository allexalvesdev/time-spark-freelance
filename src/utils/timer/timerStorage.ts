
/**
 * Utility functions for timer state persistence in localStorage
 */

import { getSafeInteger } from './safeInteger';

export interface TimerState {
  running: boolean;
  paused: boolean;
  elapsed: number;
  pausedTime: number;
  startTime: number | null;
  pausedAt: number | null;
  lastUpdate: number;
}

/**
 * Retrieves timer state from localStorage
 * @param persistKey The key to use for localStorage
 * @returns The timer state or null if not found
 */
export const getPersistedTimerState = (persistKey?: string): TimerState | null => {
  if (!persistKey) return null;
  
  try {
    // Try to load the full timer state object (more robust)
    const timerStateJSON = localStorage.getItem(`timerState-${persistKey}`);
    
    if (timerStateJSON) {
      return JSON.parse(timerStateJSON);
    }
    
    // Fall back to loading individual values
    const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
    const savedIsPaused = localStorage.getItem(`timerIsPaused-${persistKey}`);
    const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
    const savedPausedAt = localStorage.getItem(`timerPausedAt-${persistKey}`);
    const savedElapsedTime = localStorage.getItem(`timerElapsedTime-${persistKey}`);
    const savedPausedTime = localStorage.getItem(`timerPausedTime-${persistKey}`);
    
    if (!savedIsRunning) return null;
    
    return {
      running: savedIsRunning === 'true',
      paused: savedIsPaused === 'true',
      elapsed: savedElapsedTime ? getSafeInteger(parseInt(savedElapsedTime, 10)) : 0,
      pausedTime: savedPausedTime ? getSafeInteger(parseInt(savedPausedTime, 10)) : 0,
      startTime: savedStartTime ? parseInt(savedStartTime, 10) : null,
      pausedAt: savedPausedAt ? parseInt(savedPausedAt, 10) : null,
      lastUpdate: Date.now()
    };
  } catch (e) {
    // Silently handle errors
    console.error('Error loading timer state:', e);
    return null;
  }
};

/**
 * Persists timer state to localStorage
 * @param persistKey The key to use for localStorage
 * @param state The timer state to persist
 */
export const persistTimerState = (
  persistKey: string | undefined,
  running: boolean,
  paused: boolean,
  elapsed: number,
  pausedTime: number,
  startTime: number | null,
  pausedAt: number | null
): void => {
  if (!persistKey) return;
  
  try {
    // Store all timer state atomically to prevent partial updates
    const timerState = JSON.stringify({
      running,
      paused,
      elapsed: getSafeInteger(elapsed),
      pausedTime: getSafeInteger(pausedTime),
      startTime,
      pausedAt,
      lastUpdate: Date.now()
    });
    
    localStorage.setItem(`timerState-${persistKey}`, timerState);
    
    // Also store individual values for backward compatibility
    localStorage.setItem(`timerIsRunning-${persistKey}`, running ? 'true' : 'false');
    localStorage.setItem(`timerIsPaused-${persistKey}`, paused ? 'true' : 'false');
    localStorage.setItem(`timerElapsedTime-${persistKey}`, getSafeInteger(elapsed).toString());
    localStorage.setItem(`timerPausedTime-${persistKey}`, getSafeInteger(pausedTime).toString());
    
    if (running && startTime) {
      localStorage.setItem(`timerStartTime-${persistKey}`, startTime.toString());
    } else if (!running) {
      localStorage.removeItem(`timerStartTime-${persistKey}`);
    }
    
    if (paused && pausedAt) {
      localStorage.setItem(`timerPausedAt-${persistKey}`, pausedAt.toString());
    } else if (!paused) {
      localStorage.removeItem(`timerPausedAt-${persistKey}`);
    }
  } catch (e) {
    // Silently handle errors
    console.error('Error persisting timer state:', e);
  }
};

/**
 * Clears all timer state from localStorage
 * @param persistKey The key to use for localStorage
 */
export const clearPersistedTimerState = (persistKey?: string): void => {
  if (!persistKey) return;
  
  try {
    localStorage.removeItem(`timerState-${persistKey}`);
    localStorage.removeItem(`timerStartTime-${persistKey}`);
    localStorage.removeItem(`timerIsRunning-${persistKey}`);
    localStorage.removeItem(`timerIsPaused-${persistKey}`);
    localStorage.removeItem(`timerElapsedTime-${persistKey}`);
    localStorage.removeItem(`timerPausedTime-${persistKey}`);
    localStorage.removeItem(`timerPausedAt-${persistKey}`);
  } catch (e) {
    // Silently handle errors
    console.error('Error clearing timer state:', e);
  }
};

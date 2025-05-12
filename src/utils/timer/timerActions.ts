
import { getSafeInteger } from './safeInteger';
import { persistTimerState } from './timerStorage';

export interface TimerActionOptions {
  persistKey?: string;
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  pausedTime: number;
  startTimeRef: React.MutableRefObject<number | null>;
  pausedAtRef: React.MutableRefObject<number | null>;
  setIsRunning: (running: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setPausedTime: (time: number) => void;
  clearInterval: () => void;
  isActiveTask: boolean;
}

/**
 * Starts the timer
 */
export const startTimerAction = (options: TimerActionOptions): void => {
  const {
    persistKey,
    isRunning,
    elapsedTime,
    pausedTime,
    startTimeRef,
    pausedAtRef,
    setIsRunning,
    setIsPaused,
    isActiveTask
  } = options;
  
  if (!isRunning) {
    // Set startTimeRef to consider already elapsed time
    startTimeRef.current = Date.now() - (elapsedTime + pausedTime) * 1000;
    setIsRunning(true);
    setIsPaused(false);
    
    // Clear pausedAt reference
    pausedAtRef.current = null;
    
    // Persist immediately when starting
    if (persistKey) {
      persistTimerState(persistKey, true, false, elapsedTime, pausedTime, startTimeRef.current, null);
      
      // Also update global timer state if this is the active task
      if (isActiveTask) {
        localStorage.setItem('timerStartTime', startTimeRef.current.toString());
        localStorage.setItem('timerIsPaused', 'false');
        localStorage.removeItem('timerPausedAt');
      }
    }
  }
};

/**
 * Pauses the timer
 */
export const pauseTimerAction = (options: TimerActionOptions): void => {
  const {
    persistKey,
    isRunning,
    isPaused,
    elapsedTime,
    pausedTime,
    startTimeRef,
    pausedAtRef,
    setIsPaused,
    clearInterval,
    isActiveTask
  } = options;
  
  if (isRunning && !isPaused) {
    // Set pause state first to ensure UI immediately reflects change
    setIsPaused(true);
    pausedAtRef.current = Date.now();
    
    // Clear interval when paused - this is crucial to stop the timer
    clearInterval();
    
    // Force a custom event to notify other components about the change
    const pauseEvent = new CustomEvent('timer-paused', {
      detail: { taskId: persistKey?.split('-').pop(), pausedAt: pausedAtRef.current }
    });
    window.dispatchEvent(pauseEvent);
    
    if (persistKey) {
      persistTimerState(
        persistKey, 
        true, 
        true, 
        elapsedTime, 
        pausedTime, 
        startTimeRef.current, 
        pausedAtRef.current
      );
      
      if (isActiveTask) {
        localStorage.setItem('timerIsPaused', 'true');
        localStorage.setItem('timerPausedAt', pausedAtRef.current.toString());
      }
    }
  }
};

/**
 * Resumes the timer
 */
export const resumeTimerAction = (options: TimerActionOptions): void => {
  const {
    persistKey,
    isRunning,
    isPaused,
    elapsedTime,
    pausedTime,
    startTimeRef,
    pausedAtRef,
    setIsPaused,
    setPausedTime,
    isActiveTask
  } = options;
  
  if (isRunning && isPaused) {
    // Calculate additional paused time
    const additionalPausedTime = pausedAtRef.current 
      ? getSafeInteger(Math.floor((Date.now() - pausedAtRef.current) / 1000))
      : 0;
    
    // Add the additional paused time to the total
    const newPausedTime = getSafeInteger(pausedTime + additionalPausedTime);
    setPausedTime(newPausedTime);
    
    // Resume running
    setIsPaused(false);
    pausedAtRef.current = null;
    
    // Force a custom event to notify other components about the change
    const resumeEvent = new CustomEvent('timer-resumed', {
      detail: { taskId: persistKey?.split('-').pop(), newPausedTime }
    });
    window.dispatchEvent(resumeEvent);
    
    if (persistKey) {
      persistTimerState(
        persistKey, 
        true, 
        false, 
        elapsedTime, 
        newPausedTime, 
        startTimeRef.current, 
        null
      );
      
      if (isActiveTask) {
        localStorage.setItem('timerIsPaused', 'false');
        localStorage.setItem('timerPausedTime', newPausedTime.toString());
        localStorage.removeItem('timerPausedAt');
      }
    }
  }
};

/**
 * Stops the timer
 */
export const stopTimerAction = (options: TimerActionOptions): void => {
  const {
    persistKey,
    isRunning,
    isPaused,
    elapsedTime,
    pausedTime,
    pausedAtRef,
    setIsRunning,
    setIsPaused,
    clearInterval
  } = options;
  
  if (isRunning) {
    // Calculate final elapsed time if currently paused
    let finalElapsedTime = elapsedTime;
    let finalPausedTime = pausedTime;
    
    if (isPaused && pausedAtRef.current) {
      // Add any additional paused time since last pause
      const additionalPausedTime = getSafeInteger(Math.floor((Date.now() - pausedAtRef.current) / 1000));
      finalPausedTime = getSafeInteger(pausedTime + additionalPausedTime);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    
    // Clear interval when stopped
    clearInterval();
    
    // Save last elapsed time when stopping
    if (persistKey) {
      persistTimerState(persistKey, false, false, finalElapsedTime, finalPausedTime, null, null);
    }
    
    // Force a custom event to notify other components about the change
    const stopEvent = new CustomEvent('timer-stopped', {
      detail: { taskId: persistKey?.split('-').pop(), elapsedTime: finalElapsedTime, pausedTime: finalPausedTime }
    });
    window.dispatchEvent(stopEvent);
  }
};

/**
 * Formats the elapsed time
 * @param elapsedTime Time in seconds
 * @returns Formatted time string (HH:MM:SS)
 */
export const formatTimerDisplay = (elapsedTime: number): string => {
  if (elapsedTime < 0) elapsedTime = 0;
  
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

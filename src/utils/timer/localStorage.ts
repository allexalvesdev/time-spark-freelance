
/**
 * Clears all timer-related localStorage entries for a specific task
 * @param taskId The ID of the task
 */
export const clearTimerStorage = (taskId: string): void => {
  // Clear all timer-related localStorage entries
  localStorage.removeItem('activeTimeEntryId');
  localStorage.removeItem('activeTaskId');
  localStorage.removeItem('timerStartTime');
  localStorage.removeItem('timerIsPaused');
  localStorage.removeItem('timerPausedTime');
  localStorage.removeItem('timerPausedAt');
  
  // Clear task-specific timer values
  localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
  localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
  localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
  localStorage.removeItem(`timerIsPaused-global-timer-${taskId}`);
  localStorage.removeItem(`timerPausedTime-global-timer-${taskId}`);
  localStorage.removeItem(`timerPausedAt-global-timer-${taskId}`);
};

/**
 * Updates localStorage with current pause state
 * @param taskId The ID of the task
 * @param isPaused Whether the timer is paused
 * @param pausedTime Total paused time in seconds
 */
export const updatePauseStateStorage = (taskId: string, isPaused: boolean, pausedTime: number): void => {
  localStorage.setItem('timerIsPaused', isPaused ? 'true' : 'false');
  
  if (isPaused) {
    const pausedAt = new Date().getTime();
    localStorage.setItem('timerPausedAt', pausedAt.toString());
    localStorage.setItem(`timerPausedAt-global-timer-${taskId}`, pausedAt.toString());
    localStorage.setItem(`timerIsPaused-global-timer-${taskId}`, 'true');
  } else {
    localStorage.removeItem('timerPausedAt');
    localStorage.removeItem(`timerPausedAt-global-timer-${taskId}`);
    localStorage.setItem(`timerIsPaused-global-timer-${taskId}`, 'false');
    localStorage.setItem(`timerPausedTime-global-timer-${taskId}`, pausedTime.toString());
  }
};


/**
 * Clears all timer-related localStorage entries for a specific task
 * @param taskId The ID of the task
 */
export const clearTimerStorage = (taskId: string): void => {
  console.log('[LocalStorage] 🧹 Clearing all timer storage for task:', taskId?.slice(0, 8));
  
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
  
  // Clear any old timer state entries that might be causing conflicts
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('timerState-') || key.includes('calculateTimerElapsed')) {
      localStorage.removeItem(key);
      console.log('[LocalStorage] 🗑️ Removed old timer key:', key);
    }
  });
  
  console.log('[LocalStorage] ✅ All timer storage cleared for task:', taskId?.slice(0, 8));
};

/**
 * Updates localStorage with current pause state
 * @param taskId The ID of the task
 * @param isPaused Whether the timer is paused
 * @param pausedTime Total paused time in seconds
 */
export const updatePauseStateStorage = (taskId: string, isPaused: boolean, pausedTime: number): void => {
  console.log('[LocalStorage] 💾 Updating pause state:', { taskId: taskId?.slice(0, 8), isPaused, pausedTime });
  
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

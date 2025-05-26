
/**
 * Clears all timer-related localStorage entries for a specific task
 * @param taskId The ID of the task
 */
export const clearTimerStorage = (taskId: string): void => {
  console.log('[LocalStorage] 🧹 Clearing all timer storage for task:', taskId?.slice(0, 8));
  
  // Clear all timer-related localStorage entries
  const keysToRemove = [
    'activeTimeEntryId',
    'activeTaskId', 
    'timerStartTime',
    'timerIsPaused',
    'timerPausedTime',
    'timerPausedAt'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear task-specific timer values
  const taskSpecificKeys = [
    `timerIsRunning-global-timer-${taskId}`,
    `timerStartTime-global-timer-${taskId}`,
    `timerElapsedTime-global-timer-${taskId}`,
    `timerIsPaused-global-timer-${taskId}`,
    `timerPausedTime-global-timer-${taskId}`,
    `timerPausedAt-global-timer-${taskId}`
  ];
  
  taskSpecificKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear any old timer state entries that might be causing conflicts
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
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

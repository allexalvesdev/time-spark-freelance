
/**
 * Formats the elapsed time
 * @param elapsedTime Time in seconds
 * @returns Formatted time string (HH:MM:SS)
 */
export const formatTimerDisplay = (elapsedTime: number): string => {
  const safeElapsedTime = typeof elapsedTime === 'number' && elapsedTime >= 0 ? elapsedTime : 0;
  
  const hours = Math.floor(safeElapsedTime / 3600);
  const minutes = Math.floor((safeElapsedTime % 3600) / 60);
  const seconds = safeElapsedTime % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};


import { getSafeInteger } from './safeInteger';

/**
 * Calculates the duration of a timer
 * @param startTime The start time in milliseconds
 * @param endTime The end time in milliseconds
 * @param pausedTime The total paused time in seconds
 * @returns The duration in seconds
 */
export const calculateDuration = (startTime: Date, endTime: Date, pausedTime: number = 0): number => {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationSecs = Math.floor(durationMs / 1000);
  return getSafeInteger(durationSecs - pausedTime);
};

/**
 * Calculates additional paused time since pause started
 * @param pausedAtTimestamp The timestamp when the pause started
 * @returns The additional paused time in seconds
 */
export const calculateAdditionalPausedTime = (pausedAtTimestamp: number): number => {
  const now = new Date().getTime();
  return getSafeInteger(Math.floor((now - pausedAtTimestamp) / 1000));
};

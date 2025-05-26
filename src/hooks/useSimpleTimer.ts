
import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDuration } from '@/utils/dateUtils';

interface UseSimpleTimerProps {
  initialElapsedSeconds?: number;
  isActive?: boolean;
  onTick?: (elapsedSeconds: number) => void;
}

export const useSimpleTimer = ({ 
  initialElapsedSeconds = 0, 
  isActive = false,
  onTick 
}: UseSimpleTimerProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now() - (initialElapsedSeconds * 1000));

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback((fromElapsed: number = 0) => {
    clearTimer();
    startTimeRef.current = Date.now() - (fromElapsed * 1000);
    setElapsedSeconds(fromElapsed);
    
    intervalRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(currentElapsed);
      onTick?.(currentElapsed);
    }, 1000);
  }, [clearTimer, onTick]);

  const stopTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const resetTimer = useCallback((newElapsed: number = 0) => {
    setElapsedSeconds(newElapsed);
    if (isActive) {
      startTimer(newElapsed);
    }
  }, [isActive, startTimer]);

  useEffect(() => {
    if (isActive) {
      startTimer(initialElapsedSeconds);
    } else {
      stopTimer();
    }

    return () => clearTimer();
  }, [isActive, initialElapsedSeconds, startTimer, stopTimer, clearTimer]);

  const formattedTime = formatDuration(elapsedSeconds);

  return {
    elapsedSeconds,
    formattedTime,
    resetTimer
  };
};

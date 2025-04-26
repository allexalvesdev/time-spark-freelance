
import { useState, useEffect, useRef } from 'react';

interface UseTimerOptions {
  autoStart?: boolean;
  initialTime?: number;
  persistKey?: string;
}

const useTimerState = (options: UseTimerOptions = {}) => {
  const { autoStart = false, initialTime = 0, persistKey } = options;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (persistKey) {
      const savedStartTime = localStorage.getItem(`timerStartTime-${persistKey}`);
      const savedIsRunning = localStorage.getItem(`timerIsRunning-${persistKey}`);
      
      if (savedStartTime && savedIsRunning === 'true') {
        const startTimeMs = parseInt(savedStartTime, 10);
        const currentElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
        setElapsedTime(currentElapsed);
        setIsRunning(true);
        startTimeRef.current = startTimeMs;
      }
    }
  }, [persistKey]);

  useEffect(() => {
    if (isRunning) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        
        if (persistKey) {
          localStorage.setItem(`timerStartTime-${persistKey}`, startTimeRef.current.toString());
          localStorage.setItem(`timerIsRunning-${persistKey}`, 'true');
        }
      }
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(currentElapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (!isRunning && persistKey) {
        localStorage.setItem(`timerIsRunning-${persistKey}`, 'false');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, persistKey]);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setElapsedTime(0);
    startTimeRef.current = null;
    
    if (persistKey) {
      localStorage.removeItem(`timerStartTime-${persistKey}`);
      localStorage.removeItem(`timerIsRunning-${persistKey}`);
    }
  };

  const getFormattedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return {
    isRunning,
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime,
  };
};

export default useTimerState;

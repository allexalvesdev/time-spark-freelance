
import { useState, useEffect, useRef } from 'react';

interface UseTimerProps {
  initialTime?: number;
  autoStart?: boolean;
}

const useTimer = ({ initialTime = 0, autoStart = false }: UseTimerProps = {}) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now() - elapsedTime * 1000;
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const reset = () => {
    stop();
    setElapsedTime(0);
  };

  const getFormattedTime = (): string => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = Math.floor(elapsedTime % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    isRunning,
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime
  };
};

export default useTimer;

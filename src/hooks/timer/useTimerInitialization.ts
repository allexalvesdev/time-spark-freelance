
import { useEffect, useRef } from 'react';
import { loadTimerState } from './timerStorage';

interface UseTimerInitializationProps {
  persistKey?: string;
  autoStart: boolean;
  setIsRunning: (isRunning: boolean) => void;
  setElapsedTime: (time: number) => void;
  startTimeRef: React.MutableRefObject<number | null>;
}

/**
 * Hook to handle timer initialization from storage
 */
export const useTimerInitialization = ({
  persistKey,
  autoStart,
  setIsRunning,
  setElapsedTime,
  startTimeRef
}: UseTimerInitializationProps): void => {
  const initialSetupDoneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!persistKey || initialSetupDoneRef.current) return;
    
    const { isRunning, elapsedTime, startTimeRef: loadedStartTimeRef, loaded } = 
      loadTimerState(persistKey);
    
    if (loaded) {
      setIsRunning(isRunning);
      setElapsedTime(elapsedTime);
      startTimeRef.current = loadedStartTimeRef;
    } else if (autoStart) {
      console.log(`[Timer:${persistKey}] No saved state but autoStart is true - starting fresh`);
      setIsRunning(true);
    }
    
    initialSetupDoneRef.current = true;
  }, [persistKey, autoStart, setIsRunning, setElapsedTime, startTimeRef]);
};

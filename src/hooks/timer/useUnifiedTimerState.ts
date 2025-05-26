
import { useState, useEffect } from 'react';
import { useDatabaseTimer } from '@/hooks/useDatabaseTimer';

interface UseUnifiedTimerStateOptions {
  taskId?: string;
}

export const useUnifiedTimerState = ({ taskId }: UseUnifiedTimerStateOptions = {}) => {
  const { activeTimer, realTimeSeconds } = useDatabaseTimer();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  
  // Check if this is for the active timer
  const isActiveTimer = !taskId || (activeTimer?.taskId === taskId);
  const isTimerRunning = activeTimer !== null && isActiveTimer;
  const isTimerPaused = isTimerRunning && activeTimer?.isPaused;
  
  // Unified state calculation - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    if (isTimerRunning && activeTimer) {
      if (activeTimer.isPaused) {
        // When paused, show the exact elapsed seconds and NEVER update
        console.log('Unified timer - Setting paused display:', activeTimer.elapsedSeconds);
        setDisplaySeconds(activeTimer.elapsedSeconds);
      } else {
        // When running, show real-time seconds that update every second
        console.log('Unified timer - Setting real-time display:', realTimeSeconds);
        setDisplaySeconds(realTimeSeconds);
      }
    } else {
      setDisplaySeconds(0);
    }
  }, [isTimerRunning, realTimeSeconds, activeTimer?.elapsedSeconds, activeTimer?.isPaused]);

  // Listen for immediate timer events for perfect synchronization
  useEffect(() => {
    const handleTimerEvent = (event: CustomEvent) => {
      const { taskId: eventTaskId, elapsedSeconds, isPaused } = event.detail;
      
      // Only respond if this is for our task or we're the global timer
      if (!taskId || taskId === eventTaskId) {
        console.log('Unified timer - Timer event:', event.type, { elapsedSeconds, isPaused });
        
        if (event.type === 'timer-paused' && elapsedSeconds !== undefined) {
          // Immediately freeze at exact elapsed time
          setDisplaySeconds(elapsedSeconds);
        } else if (event.type === 'timer-resumed' && elapsedSeconds !== undefined) {
          // Resume from the exact elapsed time
          setDisplaySeconds(elapsedSeconds);
        } else if (event.type === 'timer-stopped') {
          // Reset display
          setDisplaySeconds(0);
        }
      }
    };

    const events = ['timer-paused', 'timer-resumed', 'timer-stopped'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleTimerEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTimerEvent as EventListener);
      });
    };
  }, [taskId]);

  return {
    displaySeconds,
    setDisplaySeconds,
    isTimerRunning,
    isTimerPaused,
    activeTimer
  };
};

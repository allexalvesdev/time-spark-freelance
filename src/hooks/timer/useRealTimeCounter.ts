
import { useState, useEffect, useRef } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Clear any existing interval
  const clearCurrentInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[RealTimeCounter] Interval cleared');
    }
  };

  // Set initial real-time seconds when activeTimer changes
  useEffect(() => {
    console.log('[RealTimeCounter] ActiveTimer changed:', {
      hasTimer: !!activeTimer,
      taskId: activeTimer?.taskId,
      elapsedSeconds: activeTimer?.elapsedSeconds,
      isPaused: activeTimer?.isPaused
    });

    if (activeTimer) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      isPausedRef.current = activeTimer.isPaused;
    } else {
      setRealTimeSeconds(0);
      isPausedRef.current = false;
      clearCurrentInterval();
    }
  }, [activeTimer?.id, activeTimer?.elapsedSeconds]);

  // Handle pause state changes immediately
  useEffect(() => {
    if (activeTimer) {
      const wasPaused = isPausedRef.current;
      const isNowPaused = activeTimer.isPaused;
      
      console.log('[RealTimeCounter] Pause state check:', {
        wasPaused,
        isNowPaused,
        taskId: activeTimer.taskId
      });
      
      if (!wasPaused && isNowPaused) {
        // Just paused - IMMEDIATELY stop interval and freeze display
        console.log('[RealTimeCounter] PAUSING - clearing interval immediately');
        clearCurrentInterval();
        setRealTimeSeconds(activeTimer.elapsedSeconds);
        isPausedRef.current = true;
      } else if (wasPaused && !isNowPaused) {
        // Just resumed - prepare for new interval (will be started in next effect)
        console.log('[RealTimeCounter] RESUMING - preparing for new interval');
        clearCurrentInterval(); // Clear any existing interval first
        isPausedRef.current = false;
      }
    }
  }, [activeTimer?.isPaused, activeTimer?.taskId]);

  // Real-time counter for active timers - ONLY runs when NOT paused
  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      // If paused or no timer, ensure interval is stopped
      clearCurrentInterval();
      console.log('[RealTimeCounter] Timer paused or inactive - interval cleared');
      return;
    }

    // Only start interval if not paused
    console.log('[RealTimeCounter] Starting new timer interval for task:', activeTimer.taskId);
    intervalRef.current = setInterval(() => {
      // Double-check pause state before updating
      if (!isPausedRef.current) {
        setRealTimeSeconds(prev => {
          const newValue = prev + 1;
          console.log('[RealTimeCounter] Tick:', newValue);
          return newValue;
        });
      } else {
        console.log('[RealTimeCounter] Tick skipped - timer is paused');
      }
    }, 1000);

    return () => clearCurrentInterval();
  }, [activeTimer?.isPaused, activeTimer?.id]);

  // Listen for immediate pause/resume events
  useEffect(() => {
    const handleImmediatePause = (event: CustomEvent) => {
      const { taskId, elapsedSeconds } = event.detail;
      console.log('[RealTimeCounter] Immediate pause event:', { taskId, elapsedSeconds });
      
      if (activeTimer && taskId === activeTimer.taskId) {
        clearCurrentInterval();
        setRealTimeSeconds(elapsedSeconds);
        isPausedRef.current = true;
      }
    };

    const handleImmediateResume = (event: CustomEvent) => {
      const { taskId } = event.detail;
      console.log('[RealTimeCounter] Immediate resume event:', { taskId });
      
      if (activeTimer && taskId === activeTimer.taskId) {
        isPausedRef.current = false;
      }
    };

    window.addEventListener('timer-paused', handleImmediatePause as EventListener);
    window.addEventListener('timer-resumed', handleImmediateResume as EventListener);

    return () => {
      window.removeEventListener('timer-paused', handleImmediatePause as EventListener);
      window.removeEventListener('timer-resumed', handleImmediateResume as EventListener);
    };
  }, [activeTimer?.taskId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[RealTimeCounter] Component unmounting - clearing interval');
      clearCurrentInterval();
    };
  }, []);

  return {
    realTimeSeconds,
    setRealTimeSeconds
  };
};

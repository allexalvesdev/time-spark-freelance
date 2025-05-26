
import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // LOCAL STATE for immediate pause/resume control
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [isLocallyRunning, setIsLocallyRunning] = useState(false);

  // Clear any existing interval
  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[RealTimeCounter] ✅ Interval cleared - TIMER STOPPED');
    }
  }, []);

  // Set initial state when activeTimer changes
  useEffect(() => {
    if (activeTimer) {
      setRealTimeSeconds(activeTimer.elapsedSeconds);
      setIsLocallyPaused(activeTimer.isPaused);
      setIsLocallyRunning(true);
      
      if (activeTimer.isPaused) {
        console.log('[RealTimeCounter] ⏸️ Timer is paused - FREEZING display at:', activeTimer.elapsedSeconds);
        clearCurrentInterval();
      }
    } else {
      setRealTimeSeconds(0);
      setIsLocallyPaused(false);
      setIsLocallyRunning(false);
      clearCurrentInterval();
    }
  }, [activeTimer?.id, activeTimer?.elapsedSeconds, activeTimer?.isPaused, clearCurrentInterval]);

  // IMMEDIATE local state management for pause/resume events
  useEffect(() => {
    const handleImmediatePause = (event: CustomEvent) => {
      const { taskId, elapsedSeconds } = event.detail;
      console.log('[RealTimeCounter] 🔴 IMMEDIATE PAUSE EVENT:', { 
        taskId: taskId?.slice(0, 8), 
        elapsedSeconds,
        'STOPPING_INTERVAL_NOW': true
      });
      
      if (activeTimer && taskId === activeTimer.taskId) {
        setIsLocallyPaused(true);
        setRealTimeSeconds(elapsedSeconds);
        clearCurrentInterval();
        console.log('[RealTimeCounter] ✅ Timer FROZEN INSTANTLY at:', elapsedSeconds);
      }
    };

    const handleImmediateResume = (event: CustomEvent) => {
      const { taskId } = event.detail;
      console.log('[RealTimeCounter] 🟢 IMMEDIATE RESUME EVENT:', { 
        taskId: taskId?.slice(0, 8),
        'RESUMING_INTERVAL_NOW': true
      });
      
      if (activeTimer && taskId === activeTimer.taskId) {
        setIsLocallyPaused(false);
        console.log('[RealTimeCounter] ✅ Timer RESUMED INSTANTLY');
      }
    };

    const handleTimerStopped = (event: CustomEvent) => {
      const { taskId } = event.detail;
      console.log('[RealTimeCounter] 🛑 TIMER STOPPED EVENT:', { 
        taskId: taskId?.slice(0, 8),
        'CLEARING_ALL_STATE': true
      });
      
      if (activeTimer && taskId === activeTimer.taskId) {
        setIsLocallyRunning(false);
        setIsLocallyPaused(false);
        clearCurrentInterval();
      }
    };

    window.addEventListener('timer-paused', handleImmediatePause as EventListener);
    window.addEventListener('timer-resumed', handleImmediateResume as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);

    return () => {
      window.removeEventListener('timer-paused', handleImmediatePause as EventListener);
      window.removeEventListener('timer-resumed', handleImmediateResume as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [activeTimer?.taskId, clearCurrentInterval]);

  // Main interval management - controlled by LOCAL STATE, not database state
  useEffect(() => {
    clearCurrentInterval();

    if (isLocallyRunning && !isLocallyPaused && activeTimer) {
      console.log('[RealTimeCounter] 🚀 Starting interval for task:', activeTimer.taskId?.slice(0, 8));
      
      intervalRef.current = setInterval(() => {
        setRealTimeSeconds(prev => {
          const newValue = prev + 1;
          return newValue;
        });
      }, 1000);

      console.log('[RealTimeCounter] ✅ Interval started - Timer running');
    }

    return clearCurrentInterval;
  }, [isLocallyRunning, isLocallyPaused, activeTimer?.id, clearCurrentInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[RealTimeCounter] 🧹 Component unmounting - clearing interval');
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    realTimeSeconds,
    setRealTimeSeconds,
    isLocallyPaused,
    isLocallyRunning
  };
};

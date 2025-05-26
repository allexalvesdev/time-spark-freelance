
import { useState, useEffect, useRef } from 'react';
import { ActiveTimer } from '@/services/databaseTimerService';

export const useRealTimeCounter = (activeTimer: ActiveTimer | null) => {
  const [realTimeSeconds, setRealTimeSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // LOCAL STATE for immediate pause/resume control - this is the key fix
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [isLocallyRunning, setIsLocallyRunning] = useState(false);

  // Clear any existing interval
  const clearCurrentInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[RealTimeCounter] ✅ Interval cleared - TIMER STOPPED');
    }
  };

  // Set initial state when activeTimer changes
  useEffect(() => {
    console.log('[RealTimeCounter] 🔄 ActiveTimer changed:', {
      hasTimer: !!activeTimer,
      taskId: activeTimer?.taskId?.slice(0, 8),
      elapsedSeconds: activeTimer?.elapsedSeconds,
      isPaused: activeTimer?.isPaused,
      'DATABASE_TIMER_ONLY': true
    });

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
  }, [activeTimer?.id, activeTimer?.elapsedSeconds, activeTimer?.isPaused]);

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
        // IMMEDIATE local state change - this is crucial for instant pause
        setIsLocallyPaused(true);
        setRealTimeSeconds(elapsedSeconds);
        clearCurrentInterval(); // Stop interval INSTANTLY
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
        // IMMEDIATE local state change for instant resume
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
  }, [activeTimer?.taskId]);

  // Main interval management - controlled by LOCAL STATE, not database state
  useEffect(() => {
    // Clear any existing interval first
    clearCurrentInterval();

    // Only start interval if locally running and NOT locally paused
    if (isLocallyRunning && !isLocallyPaused && activeTimer) {
      console.log('[RealTimeCounter] 🚀 Starting interval for task:', activeTimer.taskId?.slice(0, 8));
      
      intervalRef.current = setInterval(() => {
        // Triple-check local state before each tick to prevent runaway timers
        if (!isLocallyPaused) {
          setRealTimeSeconds(prev => {
            const newValue = prev + 1;
            console.log('[RealTimeCounter] ⏱️ Tick:', newValue, 'paused:', isLocallyPaused);
            return newValue;
          });
        } else {
          console.log('[RealTimeCounter] 🚫 Tick BLOCKED - locally paused');
          clearCurrentInterval(); // Extra safety - clear interval if somehow still running while paused
        }
      }, 1000);

      console.log('[RealTimeCounter] ✅ Interval started - Timer running');
    } else {
      console.log('[RealTimeCounter] ⏹️ NOT starting interval:', {
        isLocallyRunning,
        isLocallyPaused,
        hasTimer: !!activeTimer,
        reason: !isLocallyRunning ? 'not running' : isLocallyPaused ? 'PAUSED' : 'no timer'
      });
    }

    return () => clearCurrentInterval();
  }, [isLocallyRunning, isLocallyPaused, activeTimer?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[RealTimeCounter] 🧹 Component unmounting - clearing interval');
      clearCurrentInterval();
    };
  }, []);

  return {
    realTimeSeconds,
    setRealTimeSeconds,
    isLocallyPaused,
    isLocallyRunning
  };
};

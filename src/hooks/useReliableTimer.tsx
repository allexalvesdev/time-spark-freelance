
import { useState, useEffect, useRef, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { activeTimerService } from '@/services/activeTimerService';
import { formatDuration } from '@/utils/dateUtils';

interface UseReliableTimerOptions {
  taskId?: string;
  initialTimeEntry?: TimeEntry | null;
  onTimerStopped?: (duration: number) => void;
  autoStart?: boolean;
}

/**
 * A reliable timer hook that synchronizes with the server
 */
export function useReliableTimer({
  taskId,
  initialTimeEntry,
  onTimerStopped,
  autoStart = true
}: UseReliableTimerOptions = {}) {
  const [timeEntry, setTimeEntry] = useState<TimeEntry | null>(initialTimeEntry || null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const serverTimeDiffRef = useRef<number>(0); // Difference between server and client time
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to format the elapsed time
  const getFormattedTime = () => {
    return formatDuration(elapsedSeconds);
  };
  
  // Sync the timer with the server
  const syncWithServer = useCallback(async () => {
    try {
      const response = await activeTimerService.getActiveTimer();
      if (!response) return;
      
      const { timeEntry: activeTimeEntry, serverTime } = response;
      
      // Update the server time difference
      serverTimeDiffRef.current = serverTime - Date.now();
      
      // If we're tracking a specific task and it doesn't match, reset
      if (taskId && activeTimeEntry && activeTimeEntry.taskId !== taskId) {
        setTimeEntry(null);
        setIsRunning(false);
        setIsPaused(false);
        setElapsedSeconds(0);
        stopTimerInterval();
        return;
      }
      
      // Update based on server state
      if (activeTimeEntry) {
        setTimeEntry(activeTimeEntry);
        setIsRunning(activeTimeEntry.isRunning);
        setIsPaused(activeTimeEntry.isPaused || false);
        
        const correctedServerTime = Date.now() + serverTimeDiffRef.current;
        const calculatedElapsedTime = activeTimerService.calculateElapsedTime(
          activeTimeEntry,
          correctedServerTime
        );
        
        setElapsedSeconds(calculatedElapsedTime);
        
        // Ensure interval is running or stopped based on timer state
        if (activeTimeEntry.isRunning && !activeTimeEntry.isPaused && autoStart && !timerIntervalRef.current) {
          startTimerInterval();
        } else if ((!activeTimeEntry.isRunning || activeTimeEntry.isPaused) && timerIntervalRef.current) {
          stopTimerInterval();
        }
      } else {
        // No active timer, reset everything
        setTimeEntry(null);
        setIsRunning(false);
        setIsPaused(false);
        setElapsedSeconds(0);
        stopTimerInterval();
      }
    } catch (error) {
      console.error("Error syncing timer with server:", error);
    }
  }, [taskId, autoStart]);
  
  // Initialize timer from server
  const initializeTimer = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncWithServer();
    } catch (error) {
      console.error("Error initializing timer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [syncWithServer]);
  
  // Start a timer on the server
  const startTimer = async (projectId: string, userId: string) => {
    if (!taskId) {
      console.error("Cannot start timer without taskId");
      return;
    }
    
    try {
      const newEntry = await activeTimerService.startTimer(taskId, projectId, userId);
      if (newEntry) {
        setTimeEntry(newEntry);
        setIsRunning(true);
        setIsPaused(false);
        setElapsedSeconds(0);
        if (autoStart) {
          startTimerInterval();
        }
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };
  
  // Pause the active timer
  const pauseTimer = async () => {
    try {
      const pausedEntry = await activeTimerService.pauseTimer();
      if (pausedEntry) {
        setTimeEntry(pausedEntry);
        setIsPaused(true);
        stopTimerInterval();
      }
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };
  
  // Resume the paused timer
  const resumeTimer = async () => {
    try {
      const resumedEntry = await activeTimerService.resumeTimer();
      if (resumedEntry) {
        setTimeEntry(resumedEntry);
        setIsPaused(false);
        if (autoStart) {
          startTimerInterval();
        }
      }
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };
  
  // Stop the active timer
  const stopTimer = async (completeTask: boolean = true) => {
    try {
      const stoppedEntry = await activeTimerService.stopActiveTimer(completeTask);
      if (stoppedEntry) {
        setTimeEntry(null);
        setIsRunning(false);
        setIsPaused(false);
        stopTimerInterval();
        
        if (onTimerStopped) {
          onTimerStopped(stoppedEntry.duration || 0);
        }
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };
  
  // Start the timer interval
  const startTimerInterval = () => {
    // Clear any existing intervals first
    stopTimerInterval();
    
    // Start the timer interval to update the elapsed time every second
    timerIntervalRef.current = setInterval(() => {
      if (!timeEntry) return;
      
      // Use server-corrected time for calculations
      const correctedServerTime = Date.now() + serverTimeDiffRef.current;
      
      setElapsedSeconds(prev => {
        // Only increment if the timer is running and not paused
        if (timeEntry.isRunning && !timeEntry.isPaused) {
          return prev + 1;
        }
        return prev;
      });
      
      // Sync with server every 30 seconds to ensure accuracy
      if (syncTimeoutRef.current === null) {
        syncTimeoutRef.current = setTimeout(() => {
          syncWithServer();
          syncTimeoutRef.current = null;
        }, 30000); // 30 seconds
      }
    }, 1000);
  };
  
  // Stop the timer interval
  const stopTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  };
  
  // Event listeners for timer events
  useEffect(() => {
    const handleTimerStarted = (e: CustomEvent) => {
      const { timeEntry: newTimeEntry } = e.detail;
      
      // If we're tracking a specific task and it doesn't match, ignore
      if (taskId && newTimeEntry.taskId !== taskId) {
        return;
      }
      
      setTimeEntry(newTimeEntry);
      setIsRunning(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      if (autoStart) {
        startTimerInterval();
      }
    };
    
    const handleTimerPaused = (e: CustomEvent) => {
      const { timeEntry: pausedTimeEntry } = e.detail;
      
      // If we're tracking a specific task and it doesn't match, ignore
      if (taskId && pausedTimeEntry.taskId !== taskId) {
        return;
      }
      
      setTimeEntry(pausedTimeEntry);
      setIsPaused(true);
      stopTimerInterval();
    };
    
    const handleTimerResumed = (e: CustomEvent) => {
      const { timeEntry: resumedTimeEntry } = e.detail;
      
      // If we're tracking a specific task and it doesn't match, ignore
      if (taskId && resumedTimeEntry.taskId !== taskId) {
        return;
      }
      
      setTimeEntry(resumedTimeEntry);
      setIsPaused(false);
      if (autoStart) {
        startTimerInterval();
      }
    };
    
    const handleTimerStopped = (e: CustomEvent) => {
      const { timeEntry: stoppedTimeEntry } = e.detail;
      
      // If we're tracking a specific task and it doesn't match, ignore
      if (taskId && stoppedTimeEntry.taskId !== taskId) {
        return;
      }
      
      setTimeEntry(null);
      setIsRunning(false);
      setIsPaused(false);
      stopTimerInterval();
      
      if (onTimerStopped && stoppedTimeEntry) {
        onTimerStopped(stoppedTimeEntry.duration || 0);
      }
    };
    
    // Add event listeners
    window.addEventListener('timer-started', handleTimerStarted as EventListener);
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
    
    // Initialize the timer
    initializeTimer();
    
    // Add page visibility change listener to sync when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      window.removeEventListener('timer-started', handleTimerStarted as EventListener);
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTimerInterval();
    };
  }, [taskId, onTimerStopped, syncWithServer, initializeTimer, autoStart]);
  
  return {
    timeEntry,
    isRunning,
    isPaused,
    elapsedSeconds,
    isLoading,
    getFormattedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    syncWithServer
  };
}

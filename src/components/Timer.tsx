
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import { Button } from '@/components/ui/button';
import { Play, Square, Pause } from 'lucide-react';
import { formatDuration, calculateEarnings } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimerProps {
  taskId: string;
  projectId: string;
  hourlyRate: number;
}

const Timer: React.FC<TimerProps> = ({ taskId, projectId, hourlyRate }) => {
  const { state, startTimer, pauseTimer, resumeTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const isActive = activeTimeEntry?.taskId === taskId;
  const isPaused = activeTimeEntry?.isPaused && isActive;
  
  // Use a global timer key for better persistence across tabs
  const timerKey = `global-timer-${taskId}`;
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isRunning, 
    isPaused: localIsPaused,
    elapsedTime, 
    start, 
    stop, 
    pause,
    resume,
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: isActive, // Start automatically if this is the active task
    persistKey: timerKey
  });

  // Force sync when component mounts
  useEffect(() => {
    if (isActive) {
      const syncState = () => {
        if (isPaused && !localIsPaused) {
          pause();
        } else if (!isPaused && localIsPaused) {
          resume();
        }
      };
      
      // Initial sync
      syncState();
      
      // Set up sync interval
      const syncInterval = setInterval(syncState, 1000);
      return () => clearInterval(syncInterval);
    }
  }, [isActive, isPaused, localIsPaused, pause, resume]);
  
  // Listen for timer events
  useEffect(() => {
    const handleTimerPaused = (e: CustomEvent) => {
      if (e.detail.taskId === taskId && isRunning && !localIsPaused) {
        pause();
      }
    };
    
    const handleTimerResumed = (e: CustomEvent) => {
      if (e.detail.taskId === taskId && isRunning && localIsPaused) {
        resume();
      }
    };
    
    const handleTimerStopped = (e: CustomEvent) => {
      if (e.detail.taskId === taskId && isRunning) {
        stop();
        reset();
      }
    };
    
    window.addEventListener('timer-paused', handleTimerPaused as EventListener);
    window.addEventListener('timer-resumed', handleTimerResumed as EventListener);
    window.addEventListener('timer-stopped', handleTimerStopped as EventListener);
    
    return () => {
      window.removeEventListener('timer-paused', handleTimerPaused as EventListener);
      window.removeEventListener('timer-resumed', handleTimerResumed as EventListener);
      window.removeEventListener('timer-stopped', handleTimerStopped as EventListener);
    };
  }, [taskId, isRunning, localIsPaused, pause, resume, stop, reset]);
  
  // This effect handles syncing between local timer state and global state
  useEffect(() => {
    // If time entry is active in global context but not in local state
    if (isActive && !isRunning) {
      start();
    } 
    // If time entry is no longer active in global context but still running locally
    else if (!isActive && isRunning) {
      stop();
      reset();
    }
    
    // Sync pause state with some debounce to avoid flickering
    if (isActive && isPaused !== localIsPaused) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        if (isPaused && !localIsPaused) {
          pause();
        } else if (!isPaused && localIsPaused) {
          resume();
        }
      }, 100);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isActive, isRunning, isPaused, localIsPaused, taskId, start, stop, pause, resume, reset]);
  
  // Handler to start the global and local timer
  const handleStartTimer = async () => {
    try {
      await startTimer(taskId, projectId);
      start();
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };
  
  // Handler to pause the global and local timer
  const handlePauseTimer = async () => {
    try {
      await pauseTimer();
      pause();
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };
  
  // Handler to resume the global and local timer
  const handleResumeTimer = async () => {
    try {
      await resumeTimer();
      resume();
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };
  
  // Handler to stop the global and local timer
  const handleStopTimer = async () => {
    try {
      // Pass true to complete the task automatically
      await stopTimer(true);
      stop();
      reset();
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };
  
  // Calculate earnings based on recorded time and hourly rate
  const currentEarnings = calculateEarnings(elapsedTime, hourlyRate);
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-center mb-4 md:mb-6">
        <div className="text-2xl md:text-3xl font-mono font-semibold mb-2" data-testid={`timer-${taskId}`}>
          <span className={isPaused ? "opacity-60" : ""}>{getFormattedTime()}</span>
          {isPaused && <span className="text-sm font-normal text-yellow-500 ml-2">(Pausado)</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(currentEarnings)}
        </div>
      </div>
      
      <div className="flex justify-center gap-3">
        {isRunning ? (
          <>
            {isPaused ? (
              <Button 
                className="timer-button timer-button-resume h-12 w-12 md:h-14 md:w-14 rounded-full bg-green-500 hover:bg-green-600"
                onClick={handleResumeTimer}
              >
                <Play size={isMobile ? 20 : 24} />
              </Button>
            ) : (
              <Button 
                className="timer-button timer-button-pause h-12 w-12 md:h-14 md:w-14 rounded-full bg-yellow-500 hover:bg-yellow-600"
                onClick={handlePauseTimer}
              >
                <Pause size={isMobile ? 20 : 24} />
              </Button>
            )}
            <Button 
              className="timer-button timer-button-stop h-12 w-12 md:h-14 md:w-14 rounded-full"
              onClick={handleStopTimer}
              variant="destructive"
            >
              <Square size={isMobile ? 20 : 24} />
            </Button>
          </>
        ) : (
          <Button 
            className="timer-button timer-button-start h-12 w-12 md:h-14 md:w-14 rounded-full"
            onClick={handleStartTimer}
          >
            <Play size={isMobile ? 20 : 24} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Timer;

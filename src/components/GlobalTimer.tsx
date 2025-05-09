
import React, { useState, useEffect } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { formatDuration } from '@/utils/dateUtils';

interface GlobalTimerProps {
  taskId: string;
}

export const GlobalTimer: React.FC<GlobalTimerProps> = ({ taskId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const { state } = useAppContext();

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const storedIsRunning = localStorage.getItem(`timerIsRunning-global-timer-${taskId}`);
    const storedStartTime = localStorage.getItem(`timerStartTime-global-timer-${taskId}`);
    const storedElapsedTime = localStorage.getItem(`timerElapsedTime-global-timer-${taskId}`);
    
    if (storedIsRunning === 'true' && storedStartTime) {
      setIsRunning(true);
      setStartTime(Number(storedStartTime));
      setElapsedTime(storedElapsedTime ? Number(storedElapsedTime) : 0);
    }
  }, [taskId]);
  
  // Update elapsed time while timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const currentElapsedTime = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);
  
  // Start the timer
  const handleStart = () => {
    // Check if there's already another task timer running
    const activeTimeEntryLocal = localStorage.getItem('activeTimeEntryId');
    if (activeTimeEntryLocal) {
      // We already have an active time entry in the app, can't run global timer
      return;
    }
    
    setIsRunning(true);
    const now = Date.now();
    setStartTime(now);
    setElapsedTime(0);
    
    // Store timer state in localStorage
    localStorage.setItem(`timerIsRunning-global-timer-${taskId}`, 'true');
    localStorage.setItem(`timerStartTime-global-timer-${taskId}`, now.toString());
    localStorage.setItem(`timerElapsedTime-global-timer-${taskId}`, '0');
  };
  
  // Stop the timer
  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    
    // Get the task to update its elapsed time
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      // The elapsed time will be added to the task's total elapsed time
      const updatedElapsedTime = (task.elapsedTime || 0) + elapsedTime;
      
      // We should update the task with the new elapsed time here,
      // but it's handled by the parent component
    }
    
    // Remove timer state from localStorage
    localStorage.removeItem(`timerIsRunning-global-timer-${taskId}`);
    localStorage.removeItem(`timerStartTime-global-timer-${taskId}`);
    localStorage.removeItem(`timerElapsedTime-global-timer-${taskId}`);
  };
  
  // Determine if this global timer should be disabled
  // (i.e., if there's an active time entry or this task is in an active time entry)
  const isDisabled = !!state.activeTimeEntry;
  
  return (
    <div>
      {isRunning ? (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleStop}
          title="Parar cronômetro"
        >
          <PauseCircle className="h-5 w-5 text-destructive" />
        </Button>
      ) : (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleStart}
          title="Iniciar cronômetro"
          disabled={isDisabled}
        >
          <PlayCircle className="h-5 w-5 text-primary" />
        </Button>
      )}
      {isRunning && (
        <span className="text-xs font-mono ml-1">{formatDuration(elapsedTime)}</span>
      )}
    </div>
  );
};

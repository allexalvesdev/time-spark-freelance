
import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { getCurrentElapsedFromStorage } from '@/utils/timer/timeCalculator';
import { formatDuration } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Square, Pause, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ActiveTimerDisplay: React.FC = () => {
  const { state, getActiveTaskName, pauseTimer, resumeTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const isPaused = activeTimeEntry?.isPaused;
  const taskId = activeTimeEntry?.taskId || '';
  
  // Get current time using unified calculation
  const currentElapsed = taskId ? getCurrentElapsedFromStorage(taskId) : 0;
  const formattedTime = formatDuration(currentElapsed);

  // Auto-refresh timer display every second when active
  useEffect(() => {
    if (!activeTimeEntry || !taskId) return;
    
    const interval = setInterval(() => {
      // Force re-render by triggering a storage event
      window.dispatchEvent(new Event('storage-check'));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTimeEntry, taskId]);

  if (!activeTimeEntry || !taskId) return null;
  
  const taskName = getActiveTaskName();
  const isCompact = isMobile;
  
  console.log('ActiveTimerDisplay render:', {
    taskId,
    isPaused,
    currentElapsed,
    formattedTime,
    taskName
  });
  
  const handlePauseTimer = () => {
    pauseTimer();
    toast({
      title: "Timer pausado",
      description: `Timer para "${taskName}" foi pausado.`,
    });
  };
  
  const handleResumeTimer = () => {
    resumeTimer();
    toast({
      title: "Timer retomado",
      description: `Timer para "${taskName}" foi retomado.`,
    });
  };

  const handleStopTimer = () => {
    stopTimer(true); // Auto-complete task on stop
    toast({
      title: "Timer parado",
      description: `Timer para "${taskName}" foi parado e a tarefa foi marcada como concluída.`,
    });
  };
  
  if (isCompact) {
    return (
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex flex-col">
          <div className={`text-sm font-mono font-medium ${isPaused ? 'text-yellow-500' : ''}`}>
            {formattedTime}
            {isPaused && <span className="text-xs ml-1">(Pausado)</span>}
          </div>
          {taskName && (
            <div className="text-xs opacity-70 truncate max-w-[100px]">
              {taskName}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          {isPaused ? (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleResumeTimer}
              className="h-7 px-2 text-xs shrink-0 bg-green-500 hover:bg-green-600 text-white"
            >
              <Play className="h-3 w-3 mr-1" />
              Retomar
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handlePauseTimer}
              className="h-7 px-2 text-xs shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pausar
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleStopTimer}
            className="h-7 px-2 text-xs shrink-0"
          >
            <Square className="h-3 w-3 mr-1" />
            Parar
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between py-1 px-3 w-full gap-3">
      <div className="flex flex-col items-center">
        <div className={`text-base font-mono font-bold ${isPaused ? 'text-yellow-500' : ''}`}>
          {formattedTime}
          {isPaused && <span className="text-sm ml-2">(Pausado)</span>}
        </div>
        {taskName && (
          <div className="text-sm opacity-90 truncate max-w-[130px]">
            {taskName}
          </div>
        )}
      </div>
      
      <div className="flex gap-2 shrink-0">
        {isPaused ? (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleResumeTimer}
            className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
          >
            <Play className="h-4 w-4 mr-1" />
            Retomar
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handlePauseTimer}
            className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Pause className="h-4 w-4 mr-1" />
            Pausar
          </Button>
        )}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleStopTimer}
          className="shrink-0"
        >
          <Square className="h-4 w-4 mr-1" />
          Parar
        </Button>
      </div>
    </div>
  );
};

export default ActiveTimerDisplay;

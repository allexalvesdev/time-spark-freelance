
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Square, Pause, Play } from 'lucide-react';

const ActiveTimerDisplay: React.FC = () => {
  const { state, getActiveTaskName, pauseTimer, resumeTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const isPaused = activeTimeEntry?.isPaused;
  
  const { getFormattedTime } = useTimerState({
    persistKey: activeTimeEntry ? `global-timer-${activeTimeEntry.taskId}` : undefined,
    autoStart: true
  });

  if (!activeTimeEntry) return null;
  
  const taskName = getActiveTaskName();
  const isCompact = isMobile;
  
  const handlePauseTimer = () => {
    pauseTimer();
  };
  
  const handleResumeTimer = () => {
    resumeTimer();
  };

  const handleStopTimer = () => {
    stopTimer(true); // Auto-complete task on stop
  };
  
  if (isCompact) {
    return (
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex flex-col">
          <div className={`text-sm font-mono font-medium ${isPaused ? 'text-yellow-500' : ''}`}>
            {getFormattedTime()}
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
    <div className="flex items-center justify-between bg-background rounded-lg shadow-sm p-2 w-full gap-2">
      <div className="flex flex-col">
        <div className={`text-base font-mono font-bold ${isPaused ? 'text-yellow-500' : ''}`}>
          {getFormattedTime()}
          {isPaused && <span className="text-sm ml-2">(Pausado)</span>}
        </div>
        {taskName && (
          <div className="text-sm opacity-90 truncate max-w-[120px]">
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


import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Square } from 'lucide-react';

const ActiveTimerDisplay: React.FC = () => {
  const { state, getActiveTaskName, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const { getFormattedTime } = useTimerState({
    persistKey: activeTimeEntry ? `global-timer-${activeTimeEntry.taskId}` : undefined,
    autoStart: true
  });

  if (!activeTimeEntry) return null;
  
  const taskName = getActiveTaskName();

  const handleStopTimer = () => {
    stopTimer(true); // Auto-complete task on stop
  };
  
  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex flex-col">
        <div className="text-base font-mono font-bold">{getFormattedTime()}</div>
        {taskName && (
          <div className="text-sm opacity-90 truncate max-w-[200px]">
            {taskName}
          </div>
        )}
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleStopTimer}
        className="shrink-0"
      >
        <Square className="h-4 w-4 mr-2" />
        Parar
      </Button>
    </div>
  );
};

export default ActiveTimerDisplay;

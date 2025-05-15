
import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Square, Pause, Play } from 'lucide-react';
import { useReliableTimer } from '@/hooks/useReliableTimer';
import { useToast } from '@/hooks/use-toast';

const ActiveTimerDisplay: React.FC = () => {
  const { state, getActiveTaskName } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const taskId = activeTimeEntry?.taskId || '';
  
  // Use the reliable timer with autoStart: false to prevent resetting on refresh
  const {
    isRunning,
    isPaused,
    getFormattedTime,
    pauseTimer,
    resumeTimer,
    stopTimer,
    syncWithServer
  } = useReliableTimer({
    taskId,
    autoStart: false, // Important: don't automatically start counting on mount
    onTimerStopped: (duration) => {
      toast({
        title: "Timer parado",
        description: `Tempo registrado: ${duration} segundos.`,
      });
    }
  });
  
  // Force sync on mount and whenever activeTimeEntry changes
  useEffect(() => {
    // When the component mounts or activeTimeEntry changes, force a sync
    syncWithServer();
    
    // Listen for force-timer-sync events
    const handleForceSync = () => {
      syncWithServer();
    };
    
    window.addEventListener('force-timer-sync', handleForceSync);
    
    return () => {
      window.removeEventListener('force-timer-sync', handleForceSync);
    };
  }, [activeTimeEntry, syncWithServer]);
  
  // Check for desynchronization between context and timer hook
  useEffect(() => {
    if ((isRunning !== !!activeTimeEntry) && activeTimeEntry) {
      // The states are out of sync - force a sync
      syncWithServer();
    }
  }, [isRunning, activeTimeEntry, syncWithServer]);
  
  if (!activeTimeEntry || !taskId) return null;
  
  const taskName = getActiveTaskName();
  const isCompact = isMobile;
  
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
    <div className="flex items-center justify-between py-1 px-3 w-full gap-3">
      <div className="flex flex-col items-center">
        <div className={`text-base font-mono font-bold ${isPaused ? 'text-yellow-500' : ''}`}>
          {getFormattedTime()}
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

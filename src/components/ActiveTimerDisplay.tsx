import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
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
  
  // Use persistKey com o ID da tarefa atual para garantir que o timer continue após refresh
  const { getFormattedTime, isRunning } = useTimerState({
    persistKey: taskId ? `global-timer-${taskId}` : undefined,
    autoStart: false // Não iniciamos automaticamente, deixamos o sistema de sincronização fazer isso
  });

  // Efeito para detectar problemas de sincronização
  useEffect(() => {
    if (activeTimeEntry && !isRunning) {
      // Se temos uma entrada ativa mas o timer não está rodando, sincronize novamente
      const timerState = localStorage.getItem(`timerIsRunning-global-timer-${taskId}`);
      if (timerState === 'true' && taskId) {
        console.log('Detectada dessincronização do timer após refresh, corrigindo...');
        
        // Forçamos a renderização do timer sem alterá-lo
        window.dispatchEvent(new Event('storage'));
      }
    }
  }, [activeTimeEntry, isRunning, taskId]);

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

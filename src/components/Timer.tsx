
import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimerState from '@/hooks/useTimerState';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { formatDuration, calculateEarnings } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimerProps {
  taskId: string;
  projectId: string;
  hourlyRate: number;
}

const Timer: React.FC<TimerProps> = ({ taskId, projectId, hourlyRate }) => {
  const { state, startTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  const isMobile = useIsMobile();
  
  const isActive = activeTimeEntry?.taskId === taskId;
  
  // Criamos um identificador consistente para este timer
  const timerKey = `task-${taskId}`;
  
  const { 
    isRunning, 
    elapsedTime, 
    start, 
    stop, 
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: false,
    persistKey: timerKey
  });
  
  // Este efeito lida com a sincronização entre o estado do timer local e o estado global
  useEffect(() => {
    console.log(`[Timer:${taskId}] Sync effect - isActive: ${isActive}, isRunning: ${isRunning}`);
    
    // Se a entrada de tempo está ativa no contexto global mas não no estado local
    if (isActive && !isRunning) {
      console.log(`[Timer:${taskId}] Global active but local stopped - starting local timer`);
      start();
    } 
    // Se a entrada de tempo não está mais ativa no contexto global mas ainda está rodando localmente
    else if (!isActive && isRunning) {
      console.log(`[Timer:${taskId}] Global inactive but local running - stopping local timer`);
      stop();
      // Mantemos o tempo decorrido (não resetamos)
    }
  }, [isActive, isRunning, taskId, start, stop]);
  
  // Handler para iniciar o timer global e local
  const handleStartTimer = async () => {
    try {
      console.log(`[Timer:${taskId}] Starting timer for task`);
      await startTimer(taskId, projectId);
      start();
    } catch (error) {
      console.error(`[Timer:${taskId}] Error starting timer:`, error);
    }
  };
  
  // Handler para parar o timer global e local
  const handleStopTimer = async () => {
    try {
      console.log(`[Timer:${taskId}] Stopping timer for task`);
      await stopTimer();
      stop();
      // Não resetamos aqui para manter o último tempo registrado visível
    } catch (error) {
      console.error(`[Timer:${taskId}] Error stopping timer:`, error);
    }
  };
  
  // Calculamos ganhos com base no tempo registrado e na taxa horária
  const currentEarnings = calculateEarnings(elapsedTime, hourlyRate);
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-center mb-4 md:mb-6">
        <div className="text-2xl md:text-3xl font-mono font-semibold mb-2" data-testid={`timer-${taskId}`}>
          {getFormattedTime()}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(currentEarnings)}
        </div>
      </div>
      
      <div className="flex justify-center">
        {isRunning ? (
          <Button 
            className="timer-button timer-button-stop h-12 w-12 md:h-14 md:w-14 rounded-full"
            onClick={handleStopTimer}
          >
            <Square size={isMobile ? 20 : 24} />
          </Button>
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

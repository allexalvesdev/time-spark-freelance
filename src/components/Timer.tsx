
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
  
  const { 
    isRunning, 
    elapsedTime, 
    start, 
    stop, 
    reset,
    getFormattedTime 
  } = useTimerState({
    autoStart: false,
    persistKey: `task-${taskId}` // Use task ID como chave de persistência
  });
  
  // Sincroniza o estado do timer do componente com o estado global do aplicativo
  useEffect(() => {
    // Se a entrada de tempo está ativa no contexto global mas não no estado local
    if (isActive && !isRunning) {
      start();
    } 
    // Se a entrada de tempo não está mais ativa no contexto global mas ainda está rodando localmente
    else if (!isActive && isRunning) {
      stop();
      // Não resetamos aqui para preservar o tempo decorrido mesmo quando mudamos de página
    }
  }, [isActive, isRunning, start, stop]);
  
  const handleStartTimer = async () => {
    try {
      await startTimer(taskId, projectId);
      start();
    } catch (error) {
      console.error("Erro ao iniciar timer:", error);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      await stopTimer();
      stop();
      // Não resetamos aqui para manter o último tempo registrado visível
    } catch (error) {
      console.error("Erro ao parar timer:", error);
    }
  };
  
  // Calculamos ganhos com base no tempo registrado e na taxa horária
  const currentEarnings = calculateEarnings(elapsedTime, hourlyRate);
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-center mb-4 md:mb-6">
        <div className="text-2xl md:text-3xl font-mono font-semibold mb-2">
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


import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import useTimer from '@/hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { formatDuration, calculateEarnings } from '@/utils/dateUtils';

interface TimerProps {
  taskId: string;
  projectId: string;
  hourlyRate: number;
}

const Timer: React.FC<TimerProps> = ({ taskId, projectId, hourlyRate }) => {
  const { state, startTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  
  const isActive = activeTimeEntry?.taskId === taskId;
  
  const { 
    isRunning, 
    elapsedTime, 
    start, 
    stop, 
    reset,
    getFormattedTime 
  } = useTimer({
    autoStart: false,
    persistKey: `task-${taskId}` // Use task ID as persistence key
  });
  
  useEffect(() => {
    if (isActive && !isRunning) {
      start();
    } else if (!isActive && isRunning) {
      stop();
      reset();
    }
  }, [isActive, isRunning, start, stop, reset]);
  
  const handleStartTimer = async () => {
    await startTimer(taskId, projectId);
    start();
  };
  
  const handleStopTimer = async () => {
    await stopTimer();
    stop();
  };
  
  // Calcular ganhos com base no tempo registrado e na taxa horária
  const currentEarnings = calculateEarnings(elapsedTime, hourlyRate);
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-semibold mb-2">
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
            className="timer-button timer-button-stop h-14 w-14"
            onClick={handleStopTimer}
          >
            <Square size={24} />
          </Button>
        ) : (
          <Button 
            className="timer-button timer-button-start h-14 w-14"
            onClick={handleStartTimer}
          >
            <Play size={24} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Timer;

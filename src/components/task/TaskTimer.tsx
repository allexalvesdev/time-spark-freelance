
import React from 'react';
import { formatDuration } from '@/utils/dateUtils';

interface TaskTimerProps {
  elapsedTime: number;
  isRunning: boolean;
  currentEarnings: number;
  formattedTime: string;
}

const TaskTimer: React.FC<TaskTimerProps> = ({
  elapsedTime,
  isRunning,
  currentEarnings,
  formattedTime,
}) => {
  // Sempre exibimos a seção do timer se estiver rodando ou se houver tempo registrado
  if (elapsedTime === 0 && !isRunning) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Tempo: </span>
        <span className="font-medium">
          {isRunning ? formattedTime : formatDuration(elapsedTime)}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Ganhos: </span>
        <span className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(currentEarnings)}
        </span>
      </div>
    </div>
  );
};

export default TaskTimer;

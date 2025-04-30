
import React from 'react';
import { formatDuration } from '@/utils/dateUtils';
import useTimerState from '@/hooks/useTimerState';
import StorageModeIndicator from '../StorageModeIndicator';

interface TaskTimerProps {
  elapsedTime: number;
  isRunning: boolean;
  currentEarnings: number;
  formattedTime: string;
  taskId?: string;
}

const TaskTimer: React.FC<TaskTimerProps> = ({
  elapsedTime,
  isRunning,
  currentEarnings,
  formattedTime,
  taskId
}) => {
  // Use the global timer if we have a taskId
  const globalTimerKey = taskId ? `global-timer-${taskId}` : undefined;
  
  const { getFormattedTime } = useTimerState({
    initialTime: elapsedTime,
    autoStart: isRunning,
    persistKey: globalTimerKey
  });
  
  // Always display the timer section if running or if there's time recorded
  if (elapsedTime === 0 && !isRunning) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Tempo: </span>
        <span className="font-medium">
          {isRunning && taskId ? getFormattedTime() : formatDuration(elapsedTime)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Ganhos: </span>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(currentEarnings)}
          </span>
        </div>
        <StorageModeIndicator />
      </div>
    </div>
  );
};

export default TaskTimer;

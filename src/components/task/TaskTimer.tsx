
import React from 'react';
import { formatDuration } from '@/utils/dateUtils';
import useTimerState from '@/hooks/useTimerState';

interface TaskTimerProps {
  elapsedTime: number;
  isRunning: boolean;
  isPaused?: boolean; 
  currentEarnings: number;
  formattedTime: string;
  taskId?: string;
}

const TaskTimer: React.FC<TaskTimerProps> = ({
  elapsedTime,
  isRunning,
  isPaused = false,
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

  // Add null checks for safer rendering
  const safeElapsedTime = typeof elapsedTime === 'number' ? elapsedTime : 0;
  const safeCurrentEarnings = typeof currentEarnings === 'number' ? currentEarnings : 0;
  const safeTaskId = taskId || '';

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Tempo: </span>
        <span className={`font-medium ${isPaused ? 'text-yellow-500' : ''}`}>
          {isRunning && safeTaskId ? getFormattedTime() : formatDuration(safeElapsedTime)}
          {isPaused && <span className="ml-1">(Pausado)</span>}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Ganhos: </span>
        <span className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(safeCurrentEarnings)}
        </span>
      </div>
    </div>
  );
};

export default TaskTimer;

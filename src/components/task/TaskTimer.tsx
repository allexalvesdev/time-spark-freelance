
import React from 'react';

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
  // Only show timer section if running or if there's time recorded
  if (elapsedTime === 0 && !isRunning) return null;

  console.log('[TaskTimer] 📊 Rendering timer:', {
    taskId: taskId?.slice(0, 8),
    elapsedTime,
    isRunning,
    isPaused,
    formattedTime
  });

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Tempo: </span>
        <span className={`font-medium ${isPaused ? 'text-yellow-500' : ''}`}>
          {formattedTime}
          {isPaused && <span className="ml-1">(Pausado)</span>}
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

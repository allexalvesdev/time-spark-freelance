
import React, { useEffect } from 'react';
import { formatDuration } from '@/utils/dateUtils';
import { useReliableTimer } from '@/hooks/useReliableTimer';

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
  // Ensure we have valid inputs
  const safeElapsedTime = elapsedTime || 0;
  const safeTaskId = taskId || '';
  const safeCurrentEarnings = currentEarnings || 0;
  
  // Use the reliable timer if we have a taskId
  const { getFormattedTime, syncWithServer } = useReliableTimer({
    taskId: safeTaskId || undefined,
    initialTimeEntry: (isRunning && safeTaskId) ? {
      id: '',
      taskId: safeTaskId,
      projectId: '',
      userId: '',
      startTime: new Date(Date.now() - safeElapsedTime * 1000),
      isRunning: true,
      isPaused: !!isPaused
    } : null
  });
  
  // Force sync when component mounts to ensure accurate time
  useEffect(() => {
    if (safeTaskId && isRunning) {
      syncWithServer();
    }
  }, [safeTaskId, isRunning, syncWithServer]);
  
  // Always display the timer section if running or if there's time recorded
  if (safeElapsedTime === 0 && !isRunning) return null;

  // Safely format the time display
  const displayTime = isRunning && safeTaskId ? 
    getFormattedTime() : 
    formatDuration(safeElapsedTime);

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Tempo: </span>
        <span className={`font-medium ${isPaused ? 'text-yellow-500' : ''}`}>
          {displayTime}
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

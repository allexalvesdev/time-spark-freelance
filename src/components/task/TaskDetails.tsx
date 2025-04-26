
import React from 'react';
import { Task } from '@/types';
import { Clock, Calendar } from 'lucide-react';
import { formatDuration, formatTime } from '@/utils/dateUtils';

interface TaskDetailsProps {
  task: Task;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task }) => {
  // Função para formatar tempo estimado em formato HH:MM:SS em vez de mostrar o total em segundos
  const formatEstimatedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };
  
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" />
        <div className="text-sm">
          <span className="text-muted-foreground">Estimado: </span>
          <span>{formatEstimatedTime(task.estimatedTime)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted-foreground" />
        <div className="text-sm">
          <span className="text-muted-foreground">Agendado: </span>
          <span>{formatTime(task.scheduledStartTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;

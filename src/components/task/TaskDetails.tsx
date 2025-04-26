
import React from 'react';
import { Task } from '@/types';
import { Clock, Calendar } from 'lucide-react';
import { formatDuration, formatTime } from '@/utils/dateUtils';

interface TaskDetailsProps {
  task: Task;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" />
        <div className="text-sm">
          <span className="text-muted-foreground">Estimado: </span>
          <span>{formatDuration(task.estimatedTime * 60)}</span>
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

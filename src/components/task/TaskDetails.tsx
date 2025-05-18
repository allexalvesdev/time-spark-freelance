
import React from 'react';
import { Task, Tag } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskDetailsProps {
  task: Task;
  tags?: Tag[];
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, tags = [] }) => {
  const formatDateTime = (date: Date | undefined) => {
    if (!date) {
      return "Não definido";
    }
    
    // Ensure we have a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid before formatting
    if (isNaN(dateObj.getTime())) {
      return "Formato inválido";
    }
    
    try {
      return format(dateObj, "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Erro no formato";
    }
  };
  
  const formatTime = (minutes: number | undefined) => {
    if (minutes === undefined || minutes === null || isNaN(minutes)) {
      return "0min";
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-2 mb-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Início Programado: </span>
          <span>{formatDateTime(task?.scheduledStartTime)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tempo Estimado: </span>
          <span>{formatTime(task?.estimatedTime)}</span>
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskDetails;


import React from 'react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="font-medium mb-1">{task.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description || "Sem descrição"}
        </p>
      </div>
      <Badge variant={task.completed ? "secondary" : "outline"}>
        {task.completed ? "Concluída" : "Em andamento"}
      </Badge>
    </div>
  );
};

export default TaskHeader;

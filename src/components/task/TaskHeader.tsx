
import React from 'react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';

interface TaskHeaderProps {
  task: Task;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const { state } = useAppContext();
  
  // Find the assignee if there is one
  const assignee = task.assigneeId 
    ? state.teamMembers.find(member => member.id === task.assigneeId)
    : null;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Baixa':
        return "bg-blue-100 text-blue-800";
      case 'Média':
        return "bg-green-100 text-green-800";
      case 'Alta':
        return "bg-orange-100 text-orange-800";
      case 'Urgente':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <h3 className="font-medium">{task.name}</h3>
          <Badge variant="outline" className={`${getPriorityColor(task.priority || 'Média')} border-0`}>
            {task.priority || 'Média'}
          </Badge>
          
          {/* Display assignee if there is one */}
          {assignee && (
            <Badge variant="secondary" className="ml-1">
              Responsável: {assignee.name}
            </Badge>
          )}
        </div>
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

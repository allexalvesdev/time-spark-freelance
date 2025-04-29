
import React, { useEffect, useState } from 'react';
import { Task, Tag } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Alert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';

interface TaskHeaderProps {
  task: Task;
}

const priorityConfig: Record<string, { icon: React.ReactNode, color: string, bgColor: string }> = {
  Low: {
    icon: <Alert className="h-3.5 w-3.5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
  Medium: {
    icon: <Alert className="h-3.5 w-3.5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
  },
  High: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20"
  },
  Urgent: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/20"
  }
};

const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const { getTaskTags } = useAppContext();
  const [tags, setTags] = useState<Tag[]>([]);
  
  useEffect(() => {
    const loadTags = async () => {
      try {
        const taskTags = await getTaskTags(task.id);
        setTags(taskTags);
      } catch (error) {
        console.error("Error loading task tags:", error);
      }
    };
    
    loadTags();
  }, [task.id, getTaskTags]);
  
  const priorityData = priorityConfig[task.priority] || priorityConfig.Medium;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium">{task.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description || "Sem descrição"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge 
            variant={task.completed ? "secondary" : "outline"}
            className="whitespace-nowrap"
          >
            {task.completed ? "Concluída" : "Em andamento"}
          </Badge>
          <Badge className={cn("flex items-center gap-1.5", priorityData.bgColor, priorityData.color)}>
            {priorityData.icon}
            <span>{task.priority}</span>
          </Badge>
        </div>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map(tag => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskHeader;

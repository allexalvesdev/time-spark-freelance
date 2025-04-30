
import React from 'react';
import { ClipboardList, Clock, FileText } from 'lucide-react';
import { Project, Task } from '@/types';
import { formatDuration, formatCurrency } from '@/utils/dateUtils';

interface ProjectStatsProps {
  project: Project;
  tasks: Task[];
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ project, tasks }) => {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTime = tasks.reduce((total, task) => {
    return total + (task.elapsedTime || 0);
  }, 0);
  
  const earnings = (totalTime / 3600) * project.hourlyRate;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList size={20} className="text-timespark-primary" />
          <h3 className="font-medium">Tarefas</h3>
        </div>
        <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
        <p className="text-sm text-muted-foreground">tarefas concluídas</p>
      </div>
      
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={20} className="text-timespark-primary" />
          <h3 className="font-medium">Tempo Total</h3>
        </div>
        <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
        <p className="text-sm text-muted-foreground">horas registradas</p>
      </div>
      
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-timespark-primary" />
          <h3 className="font-medium">Ganhos</h3>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(earnings)}</p>
        <p className="text-sm text-muted-foreground">valor total</p>
      </div>
    </div>
  );
};

export default ProjectStats;

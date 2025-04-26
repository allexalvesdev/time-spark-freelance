
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Project, Task } from '@/types';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, tasks }) => {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  // Calcular tempo total em segundos
  const totalTimeSpent = tasks.reduce((total, task) => {
    return total + (task.elapsedTime || 0);
  }, 0);
  
  // Calcular ganhos totais
  const totalEarnings = (totalTimeSpent / 3600) * project.hourlyRate;

  return (
    <div className="project-card">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(project.hourlyRate)}/hora
            </p>
          </div>
          <Badge variant={completedTasks === totalTasks && totalTasks > 0 ? "secondary" : "default"}>
            {completedTasks}/{totalTasks} tarefas
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Tempo total</span>
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-timespark-primary" />
              <span className="font-medium">{formatDuration(totalTimeSpent)}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Ganhos</span>
            <span className="font-medium">{formatCurrency(totalEarnings)}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-timespark-primary rounded-full h-2" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-timespark-primary" />
            <span className="text-sm">
              {completionPercentage}% concluído
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/projeto/${project.id}`} className="flex items-center gap-1">
              <span>Detalhes</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

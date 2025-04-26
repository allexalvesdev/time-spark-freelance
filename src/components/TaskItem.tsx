
import React from 'react';
import { formatDuration, formatTime, formatDate, calculateEarnings } from '@/utils/dateUtils';
import { Task, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { Play, Square, Clock, Calendar } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  const { state, startTimer, stopTimer } = useAppContext();
  const { activeTimeEntry } = state;
  
  const isTimerRunning = activeTimeEntry?.taskId === task.id;
  
  const handleStartTimer = () => {
    startTimer(task.id, project.id);
  };
  
  const handleStopTimer = () => {
    stopTimer();
  };
  
  // Calcular ganhos com base no tempo registrado
  const earnings = task.elapsedTime 
    ? calculateEarnings(task.elapsedTime, project.hourlyRate)
    : 0;
  
  return (
    <div className={`task-item ${isTimerRunning ? 'border-timespark-accent' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium mb-1">{task.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description || "Sem descrição"}
          </p>
        </div>
        <Badge variant={task.completed ? "success" : "outline"}>
          {task.completed ? "Concluída" : "Em andamento"}
        </Badge>
      </div>
      
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
      
      {task.elapsedTime ? (
        <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Tempo gasto: </span>
            <span className="font-medium">{formatDuration(task.elapsedTime)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Ganhos: </span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(earnings)}
            </span>
          </div>
        </div>
      ) : null}
      
      <div className="flex justify-end">
        {!task.completed && (
          isTimerRunning ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleStopTimer}
              className="flex items-center gap-2"
            >
              <Square size={16} />
              <span>Parar</span>
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleStartTimer}
              className="flex items-center gap-2 bg-timespark-accent hover:bg-timespark-accent/90"
            >
              <Play size={16} />
              <span>Iniciar</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default TaskItem;

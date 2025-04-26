
import React, { useState } from 'react';
import { formatDuration, formatTime, calculateEarnings } from '@/utils/dateUtils';
import { Task, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { Play, Square, Clock, Calendar, Edit, Trash2, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditTaskModal from './EditTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import useTimer from '@/hooks/useTimer';

interface TaskItemProps {
  task: Task;
  project: Project;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project }) => {
  const { state, startTimer, stopTimer, deleteTask } = useAppContext();
  const { activeTimeEntry } = state;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const isTimerRunning = activeTimeEntry?.taskId === task.id;
  
  const { 
    isRunning, 
    elapsedTime,
    start,
    stop,
    reset,
    getFormattedTime 
  } = useTimer({
    autoStart: false
  });
  
  React.useEffect(() => {
    if (isTimerRunning && !isRunning) {
      start();
    } else if (!isTimerRunning && isRunning) {
      stop();
      reset();
    }
  }, [isTimerRunning, isRunning, start, stop, reset]);
  
  const handleStartTimer = () => {
    startTimer(task.id, project.id);
    start();
  };
  
  const handleStopTimer = () => {
    stopTimer();
    stop();
  };
  
  const handleDeleteTask = () => {
    if (isTimerRunning) {
      stopTimer();
    }
    deleteTask(task.id);
  };
  
  // Calcular ganhos com base no tempo registrado ou tempo em execução
  const currentEarnings = calculateEarnings(
    isTimerRunning ? elapsedTime : (task.elapsedTime || 0), 
    project.hourlyRate
  );
  
  return (
    <div className="task-item rounded-lg border p-4 bg-card">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium mb-1">{task.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description || "Sem descrição"}
          </p>
        </div>
        <Badge variant="outline">
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
      
      {(task.elapsedTime || isTimerRunning) && (
        <div className="flex items-center justify-between p-2 bg-muted rounded mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Tempo: </span>
            <span className="font-medium">
              {isTimerRunning ? getFormattedTime() : formatDuration(task.elapsedTime || 0)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Ganhos: </span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(currentEarnings)}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
          >
            <Edit size={16} className="mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 size={16} className="mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os dados da tarefa serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex gap-2">
          {!task.completed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleteModal(true)}
              >
                <Check size={16} className="mr-2" />
                Finalizar
              </Button>
              
              {isTimerRunning ? (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleStopTimer}
                >
                  <Square size={16} className="mr-2" />
                  Parar
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleStartTimer}
                  className="bg-timespark-accent hover:bg-timespark-accent/90"
                >
                  <Play size={16} className="mr-2" />
                  Iniciar
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      <EditTaskModal 
        task={task}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      
      <CompleteTaskModal 
        task={task}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
      />
    </div>
  );
};

export default TaskItem;

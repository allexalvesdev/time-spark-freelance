
import React from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check, Play, Square } from 'lucide-react';
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

interface TaskActionsProps {
  task: Task;
  isTimerRunning: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  isTimerRunning,
  onEdit,
  onDelete,
  onComplete,
  onStartTimer,
  onStopTimer,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
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
              <AlertDialogAction onClick={onDelete}>
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
              onClick={onComplete}
            >
              <Check size={16} className="mr-2" />
              Finalizar
            </Button>
            
            {isTimerRunning ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onStopTimer}
              >
                <Square size={16} className="mr-2" />
                Parar
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={onStartTimer}
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
  );
};

export default TaskActions;

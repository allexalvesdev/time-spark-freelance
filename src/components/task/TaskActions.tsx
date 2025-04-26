
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col md:flex-row ${isMobile ? 'gap-3' : 'justify-between items-center'}`}>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          onClick={onEdit}
        >
          <Edit size={16} />
          {!isMobile && <span className="ml-2">Editar</span>}
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size={isMobile ? "icon" : "sm"}>
              <Trash2 size={16} />
              {!isMobile && <span className="ml-2">Excluir</span>}
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
      
      <div className="flex flex-wrap gap-2">
        {!task.completed && (
          <>
            <Button
              variant="outline"
              size={isMobile ? "icon" : "sm"}
              onClick={onComplete}
            >
              <Check size={16} />
              {!isMobile && <span className="ml-2">Finalizar</span>}
            </Button>
            
            {isTimerRunning ? (
              <Button 
                variant="destructive" 
                size={isMobile ? "icon" : "sm"} 
                onClick={onStopTimer}
              >
                <Square size={16} />
                {!isMobile && <span className="ml-2">Parar</span>}
              </Button>
            ) : (
              <Button 
                variant="default" 
                size={isMobile ? "icon" : "sm"} 
                onClick={onStartTimer}
                className="bg-timespark-accent hover:bg-timespark-accent/90"
              >
                <Play size={16} />
                {!isMobile && <span className="ml-2">Iniciar</span>}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskActions;


import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Timer from '@/components/Timer';
import { Project, Task } from '@/types';

interface TimerTabProps {
  project: Project;
  tasks: Task[];
  onShowNewTaskForm: () => void;
}

const TimerTab: React.FC<TimerTabProps> = ({ project, tasks, onShowNewTaskForm }) => {
  const uncompletedTasks = tasks.filter(task => !task.completed);
  
  return (
    <>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Clock size={48} className="text-muted-foreground" />
          <h2 className="text-xl font-medium">Nenhuma tarefa para cronometrar</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Adicione tarefas para começar a cronometrar seu tempo.
          </p>
          <Button onClick={onShowNewTaskForm}>
            Adicionar Tarefa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uncompletedTasks.map((task) => (
            <div key={task.id} className="bg-card rounded-lg border overflow-hidden">
              <div className="p-4 bg-muted">
                <h3 className="font-medium truncate">{task.name}</h3>
              </div>
              <div className="p-4">
                <Timer 
                  taskId={task.id} 
                  projectId={project.id} 
                  hourlyRate={project.hourlyRate} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default TimerTab;

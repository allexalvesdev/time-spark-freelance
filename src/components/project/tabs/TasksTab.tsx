
import React, { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewTaskForm from '@/components/NewTaskForm';
import TaskItem from '@/components/TaskItem';
import { Project, Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface TasksTabProps {
  project: Project;
  tasks: Task[];
}

const TasksTab: React.FC<TasksTabProps> = ({ project, tasks }) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-lg font-medium">Lista de Tarefas</h2>
        <Button 
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="flex items-center gap-2"
          size={isMobile ? "sm" : "default"}
        >
          <Plus size={16} />
          <span>{isMobile ? 'Nova' : 'Nova Tarefa'}</span>
        </Button>
      </div>
      
      {showNewTaskForm && (
        <div className="bg-card rounded-lg border p-4 md:p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Adicionar Nova Tarefa</h3>
          <NewTaskForm 
            projectId={project.id} 
            onSuccess={() => setShowNewTaskForm(false)} 
          />
        </div>
      )}
      
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <ClipboardList size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhuma tarefa</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Adicione tarefas para começar a gerenciar seu tempo e 
            calcular seus ganhos.
          </p>
          <Button onClick={() => setShowNewTaskForm(true)}>
            Adicionar Tarefa
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              project={project} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksTab;

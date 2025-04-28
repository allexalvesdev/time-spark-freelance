
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import TaskItem from '@/components/TaskItem';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';

const Tasks: React.FC = () => {
  const { state } = useAppContext();
  const { tasks = [], projects = [] } = state;
  
  const [filter, setFilter] = useState<string>('all');
  
  // Ensure tasks is always an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  const filteredTasks = tasksArray.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return task.projectId === filter;
  });
  
  // Obter projeto pelo ID
  const getProject = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas tarefas em um só lugar
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <div className="w-full md:w-64">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar tarefas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tarefas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="divider" disabled>
                — Por projeto —
              </SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <ClipboardList size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhuma tarefa encontrada</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Não há tarefas para o filtro selecionado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects
            .filter(project => filteredTasks.some(task => task.projectId === project.id))
            .map(project => (
              <Card key={project.id} className="p-6">
                <h2 className="text-lg font-medium mb-4">{project.name}</h2>
                <div className="space-y-4">
                  {filteredTasks
                    .filter(task => task.projectId === project.id)
                    .map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        project={project} 
                      />
                    ))
                  }
                </div>
              </Card>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default Tasks;

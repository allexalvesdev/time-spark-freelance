
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import TaskItem from '@/components/TaskItem';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Tasks: React.FC = () => {
  const { state } = useAppContext();
  const { tasks = [], projects = [], tags = [] } = state;
  
  const [filter, setFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskTagsMap, setTaskTagsMap] = useState<Record<string, string[]>>({});
  
  // Ensure tasks is always an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  // Carregar mapeamento de tarefas para tags
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        const tagsByTask: Record<string, string[]> = {};
        const promises = tasksArray.map(async (task) => {
          const { getTaskTags } = useAppContext();
          const taskTagIds = await getTaskTags(task.id);
          tagsByTask[task.id] = taskTagIds;
        });
        
        await Promise.all(promises);
        setTaskTagsMap(tagsByTask);
      } catch (error) {
        console.error('Failed to load task tags:', error);
      }
    };
    
    loadTaskTags();
  }, [tasksArray]);
  
  const filteredTasks = tasksArray.filter(task => {
    // Filtro por projeto
    if (filter !== 'all' && filter !== 'completed' && filter !== 'pending' && task.projectId !== filter) {
      return false;
    }
    
    // Filtro por status
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'pending' && task.completed) return false;
    
    // Filtro por prioridade
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    
    // Filtro por tag
    if (tagFilter !== 'all') {
      const taskTags = taskTagsMap[task.id] || [];
      if (!taskTags.includes(tagFilter)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Obter projeto pelo ID
  const getProject = (projectId: string) => {
    return projects.find(p => p.id === projectId) || projects[0];
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="divider" disabled>
                  — Projetos —
                </SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {tags.length > 0 && (
            <div>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tags</SelectItem>
                  {tags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <ClipboardList size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhuma tarefa encontrada</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Não há tarefas para os filtros selecionados.
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

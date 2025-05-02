
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import TaskItem from '@/components/TaskItem';
import { ClipboardList, X } from 'lucide-react';
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
import TaskImportExport from '@/components/task/TaskImportExport';
import { useAuth } from '@/contexts/AuthContext';

const Tasks: React.FC = () => {
  const { state, getTaskTags } = useAppContext();
  const { tasks = [], projects = [], tags = [] } = state;
  const { user } = useAuth();
  
  const [filter, setFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskTagsMap, setTaskTagsMap] = useState<Record<string, string[]>>({});
  
  // Ensure tasks is always an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  // Handle tasks imported
  const handleTasksImported = (newTasks: any[]) => {
    // Refresh the page or update the tasks list
    window.location.reload();
  };
  
  // Carregar mapeamento de tarefas para tags
  useEffect(() => {
    const loadTaskTags = async () => {
      try {
        const tagsByTask: Record<string, string[]> = {};
        
        for (const task of tasksArray) {
          const taskTagIds = await getTaskTags(task.id);
          tagsByTask[task.id] = taskTagIds;
        }
        
        setTaskTagsMap(tagsByTask);
      } catch (error) {
        console.error('Failed to load task tags:', error);
      }
    };
    
    loadTaskTags();
  }, [tasksArray, getTaskTags]);
  
  const handleTagSelect = (tagId: string) => {
    setSelectedTagIds(prev => {
      // If tag is already selected, remove it
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      }
      // Otherwise add it
      return [...prev, tagId];
    });
  };
  
  const clearTagFilters = () => {
    setSelectedTagIds([]);
  };
  
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
    
    // Filtro por tag (verifica se a tarefa possui pelo menos uma das tags selecionadas)
    if (selectedTagIds.length > 0) {
      const taskTags = taskTagsMap[task.id] || [];
      // Verifica se existe pelo menos uma tag em comum entre as tags da tarefa e as tags selecionadas
      if (!selectedTagIds.some(selectedTag => taskTags.includes(selectedTag))) {
        return false;
      }
    }
    
    return true;
  });
  
  // Obter projeto pelo ID
  const getProject = (projectId: string) => {
    return projects.find(p => p.id === projectId) || projects[0];
  };
  
  // Get the first project ID or empty string if no projects
  const defaultProjectId = projects.length > 0 ? projects[0].id : '';
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas tarefas em um só lugar
        </p>
      </div>
      
      <div className="mb-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3">Importar/Exportar</h3>
          <TaskImportExport 
            projectId={defaultProjectId}
            tasks={tasksArray}
            userId={user?.id || ''}
            onTasksImported={handleTasksImported}
          />
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
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
        </div>
      </div>
      
      {/* Tag filter section */}
      {tags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Filtrar por tags</h3>
              {selectedTagIds.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs" 
                  onClick={clearTagFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTagIds.includes(tag.id) ? '' : 'hover:bg-secondary'}`}
                  onClick={() => handleTagSelect(tag.id)}
                >
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && (
                    <X size={14} className="ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
      
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

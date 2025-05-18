
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import ProjectCard from '@/components/ProjectCard';

const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  
  // Ensure projects and tasks are always arrays and valid data
  const projectsArray = useMemo(() => {
    if (!state.projects || !Array.isArray(state.projects)) {
      return [];
    }
    // Filter out invalid projects
    return state.projects.filter(project => project && project.id);
  }, [state.projects]);
  
  const tasksArray = useMemo(() => {
    if (!state.tasks || !Array.isArray(state.tasks)) {
      return [];
    }
    
    // Filter out invalid tasks and deduplicate by ID
    const uniqueTasks = new Map();
    state.tasks.forEach(task => {
      if (task && task.id) {
        // Only add the task if it's valid and not already in the map
        uniqueTasks.set(task.id, task);
      }
    });
    
    return Array.from(uniqueTasks.values());
  }, [state.tasks]);
  
  // Group tasks by project ID for efficient rendering
  const tasksByProject = useMemo(() => {
    const groupedTasks = new Map();
    
    tasksArray.forEach(task => {
      if (task && task.projectId) {
        if (!groupedTasks.has(task.projectId)) {
          groupedTasks.set(task.projectId, []);
        }
        groupedTasks.get(task.projectId).push(task);
      }
    });
    
    return groupedTasks;
  }, [tasksArray]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos e tempo de trabalho
          </p>
        </div>
        <Button asChild>
          <Link to="/novo-projeto" className="flex items-center gap-2">
            <Plus size={16} />
            <span>Novo Projeto</span>
          </Link>
        </Button>
      </div>
      
      {projectsArray.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <ClipboardList size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhum projeto criado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Crie seu primeiro projeto para começar a rastrear seu tempo e 
            calcular seus ganhos.
          </p>
          <Button asChild>
            <Link to="/novo-projeto" className="flex items-center gap-2">
              <Plus size={16} />
              <span>Criar Projeto</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsArray.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              tasks={tasksByProject.get(project.id) || []} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;


import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import ProjectCard from '@/components/ProjectCard';

const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  const { projects, tasks } = state;
  
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
      
      {projects.length === 0 ? (
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
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              tasks={tasks.filter(task => task.projectId === project.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

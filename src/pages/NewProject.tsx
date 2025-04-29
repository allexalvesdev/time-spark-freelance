
import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import NewProjectForm from '@/components/NewProjectForm';

const NewProject: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Projeto</h1>
          <p className="text-muted-foreground">Crie um novo projeto para começar a gerenciar suas tarefas</p>
        </div>
      </div>
      
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-primary">
          <div className="bg-primary/10 p-2 rounded-full">
            <FileText size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-medium">Informações do Projeto</h2>
        </div>
        
        <NewProjectForm />
      </div>
    </div>
  );
};

export default NewProject;

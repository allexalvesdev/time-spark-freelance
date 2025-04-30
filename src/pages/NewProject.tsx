
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import NewProjectForm from '@/components/NewProjectForm';

const NewProject: React.FC = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo Projeto</h1>
      </div>
      
      <div className="max-w-xl">
        <NewProjectForm />
      </div>
    </div>
  );
};

export default NewProject;

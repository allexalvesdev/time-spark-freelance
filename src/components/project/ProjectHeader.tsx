
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project } from '@/types';
import { formatCurrency } from '@/utils/dateUtils';

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link to="/">
          <ArrowLeft size={20} />
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">
          {formatCurrency(project.hourlyRate)}/hora
        </p>
      </div>
    </div>
  );
};

export default ProjectHeader;

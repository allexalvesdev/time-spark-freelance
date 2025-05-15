
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Project } from '@/types';
import { projectService } from '@/services';
import { useToast } from '@/hooks/use-toast';

interface ProjectsContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createProject: (projectData: Omit<Project, "id" | "createdAt" | "userId">) => Promise<Project>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode; userId: string }> = ({ 
  children, 
  userId 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const newProject = await projectService.createProject({ 
        ...projectData, 
        userId 
      });
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      return newProject;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o projeto. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      await projectService.updateProject(project);
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      setCurrentProject(prev => prev?.id === project.id ? project : prev);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o projeto. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setCurrentProject(prev => prev?.id === projectId ? null : prev);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o projeto. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createProject = async (projectData: Omit<Project, "id" | "createdAt" | "userId">): Promise<Project> => {
    try {
      const newProject = await projectService.createProject({
        ...projectData,
        userId: userId || '',
      });
      
      setProjects(prev => Array.isArray(prev) ? [newProject, ...prev] : [newProject]);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <ProjectsContext.Provider value={{
      projects,
      setProjects,
      currentProject,
      setCurrentProject,
      addProject,
      updateProject,
      deleteProject,
      createProject
    }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsContext = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
};

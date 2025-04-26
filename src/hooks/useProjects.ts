import { useState } from 'react';
import { Project } from '@/types';
import { projectService } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useProjects = (userId: string) => {
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
    } catch (error: any) {
      console.error('Error adding project:', error);
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
      console.error('Error updating project:', error);
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
      console.error('Error deleting project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o projeto. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    projects,
    setProjects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
  };
};

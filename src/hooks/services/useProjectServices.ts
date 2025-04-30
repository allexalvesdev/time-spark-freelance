
import { useCallback } from 'react';
import { Project } from '@/types';
import { useToast } from '@/hooks/use-toast';

type ProjectServicesProps = {
  addStoredProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateStoredProject: (project: Project) => Promise<void>;
  deleteStoredProject: (projectId: string) => Promise<void>;
};

export const useProjectServices = ({
  addStoredProject,
  updateStoredProject,
  deleteStoredProject,
}: ProjectServicesProps) => {
  
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>) => {
    try {
      await addStoredProject(projectData);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }, [addStoredProject]);
  
  const updateProject = useCallback(async (project: Project) => {
    try {
      await updateStoredProject(project);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [updateStoredProject]);
  
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteStoredProject(projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [deleteStoredProject]);
  
  return {
    addProject,
    updateProject,
    deleteProject,
  };
};

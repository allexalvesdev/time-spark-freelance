
import { useCallback } from 'react';
import { Project, Task } from '@/types';

type ProjectTaskServicesProps = {
  setStoredCurrentProject: (project: Project | null) => void;
  setStoredCurrentTask: (task: Task | null) => void;
};

/**
 * Hook for project and task selection services
 */
export const useProjectTaskServices = ({
  setStoredCurrentProject,
  setStoredCurrentTask,
}: ProjectTaskServicesProps) => {
  
  const setCurrentProject = useCallback((project: Project | null) => {
    setStoredCurrentProject(project);
  }, [setStoredCurrentProject]);
  
  const setCurrentTask = useCallback((task: Task | null) => {
    setStoredCurrentTask(task);
  }, [setStoredCurrentTask]);
  
  return {
    setCurrentProject,
    setCurrentTask,
  };
};

import { useCallback } from 'react';
import { Project, Task, TimeEntry, Tag } from '@/types';
import { AppState } from '@/types/app';
import { useProjectServices } from './services/useProjectServices';
import { useTaskServices } from './services/useTaskServices';
import { useTimeServices } from './services/useTimeServices';
import { useTagServices } from './services/useTagServices';
import { useProjectTaskServices } from './services/useProjectTaskServices';

type AppServicesProps = {
  state: AppState;
  user: { id: string } | null;
  addStoredProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateStoredProject: (project: Project) => Promise<void>;
  deleteStoredProject: (projectId: string) => Promise<void>;
  addStoredTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => Promise<Task>;
  updateStoredTask: (task: Task) => Promise<void>;
  completeStoredTask: (taskId: string) => Promise<void>;
  deleteStoredTask: (taskId: string) => Promise<void>;
  startStoredTimeEntry: (taskId: string, projectId: string) => Promise<TimeEntry>;
  stopStoredTimeEntry: (completeTaskFlag: boolean) => Promise<TimeEntry | null>;
  setStoredCurrentProject: (project: Project | null) => void;
  setStoredCurrentTask: (task: Task | null) => void;
  addStoredTag: (name: string) => Promise<Tag>;
  loadTags: () => Promise<Tag[]>;
  getTaskTags: (taskId: string) => Promise<Tag[]>;
  addStoredTaskTag: (taskId: string, tagId: string) => Promise<void>;
  removeStoredTaskTag: (taskId: string, tagId: string) => Promise<void>;
};

/**
 * Primary hook for app services
 * Composes all domain-specific service hooks
 */
export const useAppServices = ({ 
  state,
  user,
  addStoredProject,
  updateStoredProject,
  deleteStoredProject,
  addStoredTask,
  updateStoredTask,
  completeStoredTask,
  deleteStoredTask,
  startStoredTimeEntry,
  stopStoredTimeEntry,
  setStoredCurrentProject,
  setStoredCurrentTask,
  addStoredTag,
  loadTags,
  getTaskTags,
  addStoredTaskTag,
  removeStoredTaskTag
}: AppServicesProps) => {
  
  // Initialize service hooks
  const projectServices = useProjectServices({
    addStoredProject,
    updateStoredProject,
    deleteStoredProject,
  });
  
  const taskServices = useTaskServices({
    addStoredTask,
    updateStoredTask,
    completeStoredTask,
    deleteStoredTask,
    tasks: state.tasks,
  });
  
  const timeServices = useTimeServices({
    startStoredTimeEntry,
    stopStoredTimeEntry,
    tasks: state.tasks,
  });
  
  const tagServices = useTagServices({
    user,
    addStoredTag,
    loadTags,
    getTaskTags,
    addStoredTaskTag,
    removeStoredTaskTag,
  });
  
  const projectTaskServices = useProjectTaskServices({
    setStoredCurrentProject,
    setStoredCurrentTask,
  });
  
  // Fix the types for these functions
  const startTimer = useCallback(async (taskId: string, projectId: string): Promise<void> => {
    try {
      await startStoredTimeEntry(taskId, projectId);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startStoredTimeEntry]);

  const stopTimer = useCallback(async (completeTaskFlag: boolean = false): Promise<void> => {
    try {
      const stoppedEntry = await stopStoredTimeEntry(completeTaskFlag);
      return;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopStoredTimeEntry]);

  // Wrapper method for active task name
  const getActiveTaskName = useCallback((): string | null => {
    return timeServices.getActiveTaskName(state.activeTimeEntry);
  }, [timeServices, state.activeTimeEntry]);
  
  return {
    // Project services
    addProject: projectServices.addProject,
    updateProject: projectServices.updateProject,
    deleteProject: projectServices.deleteProject,
    
    // Task services
    addTask: taskServices.addTask,
    updateTask: taskServices.updateTask,
    completeTask: taskServices.completeTask,
    deleteTask: taskServices.deleteTask,
    
    // Time services
    startTimer,
    stopTimer,
    getActiveTaskName,
    
    // Project/Task selection
    setCurrentProject: projectTaskServices.setCurrentProject,
    setCurrentTask: projectTaskServices.setCurrentTask,
    
    // Tag services
    addTag: tagServices.addTag,
    getTags: tagServices.getTags,
    addTaskTag: tagServices.addTaskTag,
    removeTaskTag: tagServices.removeTaskTag,
    getTaskTags: tagServices.getTaskTags,
  };
};

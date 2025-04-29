
import { useCallback } from 'react';
import { Project, Task, TimeEntry, Tag, AppState, TaskPriority } from '@/types';
import { tagService } from '@/services';

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
  
  // Project operations
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
  
  // Task operations
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => {
    try {
      return await addStoredTask(taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [addStoredTask]);
  
  const updateTask = useCallback(async (task: Task) => {
    try {
      await updateStoredTask(task);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [updateStoredTask]);
  
  const completeTask = useCallback(async (taskId: string) => {
    try {
      await completeStoredTask(taskId);
      
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        const event = new CustomEvent('task-completed', {
          detail: { taskId: task.id, updatedTask: task },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }, [completeStoredTask, state.tasks]);
  
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteStoredTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [deleteStoredTask]);
  
  // Time tracking operations
  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    try {
      await startStoredTimeEntry(taskId, projectId);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startStoredTimeEntry]);
  
  const stopTimer = useCallback(async (completeTaskFlag: boolean = false) => {
    try {
      const stoppedEntry = await stopStoredTimeEntry(completeTaskFlag);
      
      if (completeTaskFlag && stoppedEntry) {
        await completeStoredTask(stoppedEntry.taskId);
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopStoredTimeEntry, completeStoredTask]);
  
  const getActiveTaskName = useCallback((): string | null => {
    if (!state.activeTimeEntry) return null;
    const task = state.tasks.find(task => task.id === state.activeTimeEntry?.taskId);
    return task ? task.name : null;
  }, [state.activeTimeEntry, state.tasks]);
  
  // Project and task selection
  const setCurrentProject = useCallback((project: Project | null) => {
    setStoredCurrentProject(project);
  }, [setStoredCurrentProject]);
  
  const setCurrentTask = useCallback((task: Task | null) => {
    setStoredCurrentTask(task);
  }, [setStoredCurrentTask]);
  
  // Tag operations
  const addTag = useCallback(async (name: string) => {
    const userId = user?.id;
    if (!userId) return { id: '', name, userId: '' };

    try {
      const newTag = await tagService.createTag(name, userId);
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }, [user]);

  const getTags = useCallback(async () => {
    try {
      const { tags } = await tagService.loadTags();
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }, []);

  const addTaskTag = useCallback(async (taskId: string, tagId: string) => {
    try {
      await addStoredTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error adding task tag:', error);
      throw error;
    }
  }, [addStoredTaskTag]);

  const removeTaskTag = useCallback(async (taskId: string, tagId: string) => {
    try {
      await removeStoredTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error removing task tag:', error);
      throw error;
    }
  }, [removeStoredTaskTag]);
  
  return {
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    startTimer,
    stopTimer,
    setCurrentProject,
    setCurrentTask,
    getActiveTaskName,
    addTag,
    getTags,
    addTaskTag,
    removeTaskTag,
    getTaskTags
  };
};

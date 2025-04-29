import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { projectService, taskService, timeEntryService, tagService } from '@/services';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, ReportData, Tag, TaskPriority } from '@/types';
import { useAuth } from './AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useToast } from '@/hooks/use-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || '';
  
  const {
    projects: storedProjects,
    setProjects: setStoredProjects,
    currentProject: storedCurrentProject,
    setCurrentProject: setStoredCurrentProject,
    addProject: addStoredProject,
    updateProject: updateStoredProject,
    deleteProject: deleteStoredProject,
  } = useProjects(userId);
  
  const {
    tasks: storedTasks,
    setTasks: setStoredTasks,
    currentTask: storedCurrentTask,
    setCurrentTask: setStoredCurrentTask,
    addTask: addStoredTask,
    updateTask: updateStoredTask,
    completeTask: completeStoredTask,
    deleteTask: deleteStoredTask,
  } = useTasks(userId);
  
  const {
    timeEntries: storedTimeEntries,
    setTimeEntries: setStoredTimeEntries,
    activeTimeEntry: storedActiveTimeEntry,
    setActiveTimeEntry: setStoredActiveTimeEntry,
    startTimeEntry: startStoredTimeEntry,
    stopTimeEntry: stopStoredTimeEntry,
  } = useTimeEntries(userId);
  
  const [state, setState] = useState<AppState>({
    projects: storedProjects,
    tasks: storedTasks,
    timeEntries: storedTimeEntries,
    activeTimeEntry: storedActiveTimeEntry,
    currentProject: storedCurrentProject,
    currentTask: storedCurrentTask,
    tags: [],
  });
  
  useEffect(() => {
    setState(prevState => ({ ...prevState, projects: storedProjects }));
  }, [storedProjects]);
  
  useEffect(() => {
    setState(prevState => ({ ...prevState, tasks: storedTasks }));
  }, [storedTasks]);
  
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      timeEntries: storedTimeEntries,
      activeTimeEntry: storedActiveTimeEntry,
    }));
  }, [storedTimeEntries, storedActiveTimeEntry]);
  
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      try {
        const projects = await projectService.loadProjects();
        setStoredProjects(projects);
        
        const { tasks } = await taskService.loadTasks();
        setStoredTasks(tasks);
        
        const { timeEntries, activeTimeEntry } = await timeEntryService.loadTimeEntries();
        setStoredTimeEntries(timeEntries);
        setStoredActiveTimeEntry(activeTimeEntry);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar os dados. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    };
    
    loadInitialData();
  }, [user, setStoredProjects, setStoredTasks, setStoredTimeEntries, setStoredActiveTimeEntry, toast]);
  
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'userId'>) => {
    try {
      await addStoredProject(projectData);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };
  
  const updateProject = async (project: Project) => {
    try {
      await updateStoredProject(project);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };
  
  const deleteProject = async (projectId: string) => {
    try {
      await deleteStoredProject(projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };
  
  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'priority' | 'tags'>) => {
    try {
      await addStoredTask(taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };
  
  const updateTask = async (task: Task) => {
    try {
      await updateStoredTask(task);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };
  
  const completeTask = async (taskId: string) => {
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
  };
  
  const deleteTask = async (taskId: string) => {
    try {
      await deleteStoredTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };
  
  const startTimer = async (taskId: string, projectId: string) => {
    try {
      await startStoredTimeEntry(taskId, projectId);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  };
  
  const stopTimer = async (completeTaskFlag: boolean = false) => {
    try {
      const stoppedEntry = await stopStoredTimeEntry(completeTaskFlag);
      
      if (completeTaskFlag && stoppedEntry) {
        await completeTask(stoppedEntry.taskId);
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  };
  
  const setCurrentProject = (project: Project | null) => {
    setStoredCurrentProject(project);
  };
  
  const setCurrentTask = (task: Task | null) => {
    setStoredCurrentTask(task);
  };
  
  const generateReport = (projectId: string): ReportData | null => {
    const project = state.projects.find((p) => p.id === projectId);
    const tasks = state.tasks.filter((task) => task.projectId === projectId);
    
    if (!project) {
      console.error(`Project with ID ${projectId} not found`);
      return null;
    }
    
    const reportTasks = tasks.map(task => {
      const timeSpent = task.elapsedTime || 0;
      const earnings = (timeSpent / 3600) * project.hourlyRate;
      return {
        id: task.id,
        name: task.name,
        timeSpent,
        earnings,
      };
    });
    
    const totalTime = reportTasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const totalEarnings = reportTasks.reduce((sum, task) => sum + task.earnings, 0);
    
    return {
      projectId: project.id,
      projectName: project.name,
      hourlyRate: project.hourlyRate,
      tasks: reportTasks,
      totalTime,
      totalEarnings,
    };
  };
  
  const getActiveTaskName = (): string | null => {
    if (!state.activeTimeEntry) return null;
    const task = state.tasks.find(task => task.id === state.activeTimeEntry?.taskId);
    return task ? task.name : null;
  };
  
  const addTag = async (name: string) => {
    const userId = user?.id;
    if (!userId) return { id: '', name, userId: '' };

    try {
      const newTag = await tagService.createTag(name, userId);
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  };

  const getTags = async () => {
    try {
      const { tags } = await tagService.loadTags();
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  };

  const getTaskTags = async (taskId: string) => {
    try {
      const tags = await tagService.getTaskTags(taskId);
      return tags;
    } catch (error) {
      console.error('Error getting task tags:', error);
      return [];
    }
  };

  const addTaskTag = async (taskId: string, tagId: string) => {
    try {
      await tagService.addTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error adding task tag:', error);
      throw error;
    }
  };

  const removeTaskTag = async (taskId: string, tagId: string) => {
    try {
      await tagService.removeTaskTag(taskId, tagId);
    } catch (error) {
      console.error('Error removing task tag:', error);
      throw error;
    }
  };
  
  const value: AppContextType = {
    state,
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
    generateReport,
    getActiveTaskName,
    addTag,
    getTags,
    addTaskTag,
    removeTaskTag,
    getTaskTags,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

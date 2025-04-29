
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';
import { AppState, AppContextType } from '@/types/app';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useTags } from '@/hooks/useTags';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { useAppServices } from '@/hooks/useAppServices';
import { useInitialDataLoader } from '@/hooks/useInitialDataLoader';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id || '';
  
  // Core hooks for state management
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

  const {
    tags,
    setTags,
    addTag: addStoredTag,
    loadTags,
    getTaskTags: getStoredTaskTags,
    addTaskTag: addStoredTaskTag,
    removeTaskTag: removeStoredTaskTag,
  } = useTags(userId);
  
  // Combined state
  const [state, setState] = useState<AppState>({
    projects: storedProjects,
    tasks: storedTasks,
    timeEntries: storedTimeEntries,
    activeTimeEntry: storedActiveTimeEntry,
    currentProject: storedCurrentProject,
    currentTask: storedCurrentTask,
    tags: tags,
  });
  
  // Sync state from individual hooks
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
    setState(prevState => ({ ...prevState, tags }));
  }, [tags]);
  
  // Initialize data
  const { loadInitialData } = useInitialDataLoader({
    user,
    setStoredProjects,
    setStoredTasks,
    setStoredTimeEntries, 
    setStoredActiveTimeEntry,
    toast,
    setTags
  });

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Service functions
  const { 
    addProject, 
    updateProject, 
    deleteProject,
    addTask, 
    updateTask, 
    completeTask,
    deleteTask,
    startTimer,
    stopTimer,
    getActiveTaskName,
    addTag,
    getTags,
    addTaskTag,
    removeTaskTag,
    getTaskTags 
  } = useAppServices({
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
    getTaskTags: getStoredTaskTags,
    addStoredTaskTag,
    removeStoredTaskTag
  });
  
  // Report generation
  const { generateReport: generateReportRaw } = useReportGenerator();

  const generateReport = (projectId: string) =>
    generateReportRaw(projectId, state.projects, state.tasks);
  
  // Prepare context value
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
    setCurrentProject: setStoredCurrentProject,
    setCurrentTask: setStoredCurrentTask,
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

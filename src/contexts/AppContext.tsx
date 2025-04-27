import React, { createContext, useContext, useEffect } from 'react';
import { Project, Task, TimeEntry, ReportData } from '@/types';
import { AppState, AppContextType } from '@/types/app';
import { useAuth } from './AuthContext';
import { projectService, taskService, timeEntryService } from '@/services';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerManagement } from '@/hooks/useTimerManagement';
import { useToast } from '@/hooks/use-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateReport } = useReportGenerator();

  const {
    projects,
    setProjects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects(user?.id || '');

  const {
    tasks,
    setTasks,
    currentTask,
    setCurrentTask,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
  } = useTasks(user?.id || '');

  const {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer,
    stopTimer,
  } = useTimerManagement(user?.id || '');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const [projectsData, tasksData, timeEntriesData] = await Promise.all([
        projectService.loadProjects(),
        taskService.loadTasks(),
        timeEntryService.loadTimeEntries()
      ]);

      const activeEntry = timeEntriesData.find(entry => entry.isRunning) || null;

      setProjects(projectsData);
      setTasks(tasksData);
      setTimeEntries(timeEntriesData);
      setActiveTimeEntry(activeEntry);
      setCurrentProject(null);
      setCurrentTask(null);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const state: AppState = {
    projects: projects ?? [],
    tasks: tasks ?? [],
    timeEntries: timeEntries ?? [],
    activeTimeEntry,
    currentProject,
    currentTask,
  };

  const contextValue: AppContextType = {
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
    generateReport: (projectId: string) => generateReport(projectId, projects, tasks),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};

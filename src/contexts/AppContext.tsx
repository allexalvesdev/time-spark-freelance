import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Task, TimeEntry, ReportData } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/services/databaseService';
import { useReportGenerator } from '@/hooks/useReportGenerator';

interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
}

interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
}

const initialState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateReport } = useReportGenerator();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const [projects, tasks, timeEntries] = await Promise.all([
        databaseService.loadProjects(),
        databaseService.loadTasks(),
        databaseService.loadTimeEntries()
      ]);

      const activeEntry = timeEntries.find(entry => entry.isRunning) || null;

      setState({
        projects,
        tasks,
        timeEntries,
        activeTimeEntry: activeEntry,
        currentProject: null,
        currentTask: null,
      });
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await databaseService.createProject({ ...projectData, userId: user?.id || '' });
      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects],
        currentProject: newProject,
      }));
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
      await databaseService.updateProject(project);
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === project.id ? project : p),
        currentProject: prev.currentProject?.id === project.id ? project : prev.currentProject,
      }));
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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        tasks: prev.tasks.filter(t => t.projectId !== projectId),
        timeEntries: prev.timeEntries.filter(e => e.projectId !== projectId),
        currentProject: prev.currentProject?.id === projectId ? null : prev.currentProject,
        currentTask: prev.currentTask?.projectId === projectId ? null : prev.currentTask,
      }));

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

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime'>) => {
    try {
      const newTask = await databaseService.createTask({ ...taskData, userId: user?.id || '' });
      setState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        currentTask: newTask,
      }));
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      await databaseService.updateTask(task);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === task.id ? task : t),
        currentTask: prev.currentTask?.id === task.id ? task : prev.currentTask,
      }));
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        completed: true,
        actualEndTime: new Date(),
        elapsedTime: task.actualStartTime 
          ? calculateElapsedTime(task.actualStartTime, new Date())
          : 0
      };

      await updateTask(updatedTask);

    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        timeEntries: prev.timeEntries.filter(e => e.taskId !== taskId),
        currentTask: prev.currentTask?.id === taskId ? null : prev.currentTask,
      }));

    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const startTimer = async (taskId: string, projectId: string) => {
    try {
      if (state.activeTimeEntry) {
        await stopTimer();
      }

      const newTimeEntry = await databaseService.createTimeEntry({
        taskId,
        projectId,
        userId: user?.id || '',
        startTime: new Date(),
        isRunning: true,
      });

      const task = state.tasks.find(t => t.id === taskId);
      if (task && !task.actualStartTime) {
        await updateTask({
          ...task,
          actualStartTime: new Date(),
          completed: false,
        });
      }

      setState(prev => ({
        ...prev,
        timeEntries: [newTimeEntry, ...prev.timeEntries],
        activeTimeEntry: newTimeEntry,
      }));
    } catch (error: any) {
      console.error('Error starting timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const stopTimer = async () => {
    try {
      if (!state.activeTimeEntry) return;

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - state.activeTimeEntry.startTime.getTime()) / 1000);

      const updatedTimeEntry: TimeEntry = {
        ...state.activeTimeEntry,
        endTime,
        duration,
        isRunning: false,
      };

      await databaseService.updateTimeEntry(updatedTimeEntry);

      setState(prev => ({
        ...prev,
        timeEntries: prev.timeEntries.map(entry => {
          if (entry.id === prev.activeTimeEntry?.id) {
            return updatedTimeEntry;
          }
          return entry;
        }),
        activeTimeEntry: null,
      }));
    } catch (error: any) {
      console.error('Error stopping timer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível parar o cronômetro. Tente novamente.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const setCurrentProject = (project: Project | null) => {
    setState(prev => ({
      ...prev,
      currentProject: project,
      currentTask: project === null ? null : prev.currentTask,
    }));
  };

  const setCurrentTask = (task: Task | null) => {
    setState(prev => ({
      ...prev,
      currentTask: task,
    }));
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
    generateReport: (projectId: string) => generateReport(projectId, state.projects, state.tasks),
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

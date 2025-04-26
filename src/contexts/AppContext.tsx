
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Task, TimeEntry, ReportData } from '../types';
import { calculateElapsedTime, calculateEarnings } from '../utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  // Load initial data
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Load tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Load time entries
      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (timeEntriesError) throw timeEntriesError;

      // Find active time entry
      const activeEntry = timeEntries?.find(entry => entry.is_running) || null;

      setState({
        projects: projects || [],
        tasks: tasks || [],
        timeEntries: timeEntries || [],
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
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        projects: [data, ...prev.projects],
        currentProject: data,
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
      const { error } = await supabase
        .from('projects')
        .update(project)
        .eq('id', project.id);

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          ...taskData, 
          user_id: user?.id,
          completed: false 
        }])
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        tasks: [data, ...prev.tasks],
        currentTask: data,
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
      const { error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', task.id);

      if (error) throw error;

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

      const timeEntry = {
        task_id: taskId,
        project_id: projectId,
        user_id: user?.id,
        start_time: new Date(),
        is_running: true
      };

      const { data, error } = await supabase
        .from('time_entries')
        .insert([timeEntry])
        .select()
        .single();

      if (error) throw error;

      // Update task with actual start time
      const task = state.tasks.find(t => t.id === taskId);
      if (task && !task.actualStartTime) {
        await updateTask({
          ...task,
          actualStartTime: new Date(),
          completed: false
        });
      }

      setState(prev => ({
        ...prev,
        timeEntries: [data, ...prev.timeEntries],
        activeTimeEntry: data,
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
      const duration = calculateElapsedTime(state.activeTimeEntry.startTime, endTime);

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime,
          duration,
          is_running: false
        })
        .eq('id', state.activeTimeEntry.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        timeEntries: prev.timeEntries.map(entry => {
          if (entry.id === prev.activeTimeEntry?.id) {
            return {
              ...entry,
              endTime,
              duration,
              isRunning: false
            };
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

  const generateReport = (projectId: string): ReportData | null => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const taskReports = projectTasks.map(task => {
      // Calcular tempo total gasto na tarefa
      let timeSpent = 0;
      
      if (task.completed && task.actualStartTime && task.actualEndTime) {
        timeSpent = calculateElapsedTime(task.actualStartTime, task.actualEndTime);
      } else if (task.elapsedTime) {
        timeSpent = task.elapsedTime;
      } else {
        // Somar tempo de todas as entradas de tempo para essa tarefa
        const taskEntries = state.timeEntries.filter(entry => entry.taskId === task.id);
        timeSpent = taskEntries.reduce((total, entry) => {
          if (entry.duration) {
            return total + entry.duration;
          } else if (entry.startTime && entry.endTime) {
            return total + calculateElapsedTime(entry.startTime, entry.endTime);
          }
          return total;
        }, 0);
      }
      
      // Calcular ganhos para essa tarefa
      const earnings = calculateEarnings(timeSpent, project.hourlyRate);
      
      return {
        id: task.id,
        name: task.name,
        timeSpent,
        earnings
      };
    });
    
    // Calcular totais
    const totalTime = taskReports.reduce((sum, task) => sum + task.timeSpent, 0);
    const totalEarnings = taskReports.reduce((sum, task) => sum + task.earnings, 0);
    
    return {
      projectId,
      projectName: project.name,
      hourlyRate: project.hourlyRate,
      tasks: taskReports,
      totalTime,
      totalEarnings
    };
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
    generateReport
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

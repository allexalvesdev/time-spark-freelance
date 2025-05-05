
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, ReportData, Tag } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerManagement } from '@/hooks/useTimerManagement';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { projectService, taskService, timeEntryService, tagService } from '@/services';
import { useTags } from '@/hooks/useTags';

// Defina o estado inicial
const initialState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
  tags: [],
};

// Crie o contexto
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  
  const userId = user?.id || '';
  
  // Use os hooks customizados
  const { 
    projects, 
    setProjects, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useProjects(userId);
  
  const { 
    tasks, 
    setTasks, 
    currentTask, 
    setCurrentTask, 
    addTask, 
    updateTask, 
    completeTask, 
    deleteTask 
  } = useTasks(userId);
  
  const { 
    timeEntries, 
    setTimeEntries, 
    activeTimeEntry, 
    setActiveTimeEntry, 
    startTimer, 
    stopTimer 
  } = useTimerManagement(userId, tasks);

  const {
    tags,
    setTags,
    addTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTaskTags
  } = useTags(userId);
  
  const { generateReport } = useReportGenerator();
  
  // Função para obter o nome da tarefa ativa
  const getActiveTaskName = () => {
    if (!activeTimeEntry) return null;
    const task = tasks.find(t => t.id === activeTimeEntry.taskId);
    return task ? task.name : null;
  };
  
  // Atualizar o estado centralizado quando os sub-estados mudarem
  useEffect(() => {
    setState({
      projects,
      tasks,
      timeEntries,
      activeTimeEntry,
      currentProject: state.currentProject,
      currentTask,
      tags,
    });
  }, [projects, tasks, timeEntries, activeTimeEntry, currentTask, tags]);
  
  // Listen for task-completed events to update global task list
  useEffect(() => {
    const handleTaskCompleted = (event: CustomEvent) => {
      const { taskId, updatedTask } = event.detail;
      
      // Update tasks state with the completed task
      setTasks(currentTasks => 
        currentTasks.map(t => t.id === taskId ? updatedTask : t)
      );
    };
    
    window.addEventListener('task-completed', handleTaskCompleted as EventListener);
    
    return () => {
      window.removeEventListener('task-completed', handleTaskCompleted as EventListener);
    };
  }, [setTasks]);
  
  // Carregar dados quando o usuário mudar
  useEffect(() => {
    if (!user) {
      // Resetar estado se não houver usuário
      setState(initialState);
      return;
    }
    
    const loadInitialData = async () => {
      try {
        // Carregar projetos
        const projectsData = await projectService.loadProjects();
        setProjects(projectsData || []);
        
        // Carregar tarefas
        const { tasks: tasksData } = await taskService.loadTasks();
        setTasks(tasksData);
        
        // Carregar registros de tempo
        const timeEntriesData = await timeEntryService.loadTimeEntries();
        
        setTimeEntries(timeEntriesData || []);
        setActiveTimeEntry(timeEntriesData.find((entry: TimeEntry) => entry.isRunning) || null);

        // Carregar tags
        const { tags: tagsData } = await tagService.loadTags(user.id);
        setTags(tagsData);
      } catch (error) {
        // Tratar erro de carregamento de dados
      }
    };
    
    loadInitialData();
  }, [user]);
  
  // Função para definir o projeto atual
  const setCurrentProject = (project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  };

  // Função de geração de relatório adaptada para usar o contexto
  const appGenerateReport = (projectId: string): ReportData | null => {
    return generateReport(projectId, projects, tasks);
  };
  
  // Agrupar valores e funções que serão expostas pelo contexto
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
    generateReport: appGenerateReport,
    getActiveTaskName,
    addTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTaskTags,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

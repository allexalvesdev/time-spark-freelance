
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, ReportData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerManagement } from '@/hooks/useTimerManagement';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { projectService, taskService, timeEntryService } from '@/services';
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
  } = useTimerManagement(userId);

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
  
  // Carregar dados quando o usuário mudar
  useEffect(() => {
    if (!user) {
      // Resetar estado se não houver usuário
      setState(initialState);
      return;
    }
    
    const loadInitialData = async () => {
      try {
        console.log('Loading initial data...');
        
        // Carregar projetos
        const { projects: projectsData } = await projectService.loadProjects();
        setProjects(projectsData);
        console.log('Projects loaded:', projectsData.length);
        
        // Carregar tarefas
        const { tasks: tasksData } = await taskService.loadTasks();
        setTasks(tasksData);
        console.log('Tasks loaded:', tasksData.length);
        
        // Carregar registros de tempo
        const { timeEntries: timeEntriesData, activeTimeEntry: activeEntry } = 
          await timeEntryService.loadTimeEntries();
        
        setTimeEntries(timeEntriesData);
        setActiveTimeEntry(activeEntry);
        console.log('Time entries loaded:', timeEntriesData.length);
        console.log('Active time entry:', activeEntry ? 'Yes' : 'No');

        // Carregar tags
        const { tags: tagsData } = await tagService.loadTags(user.id);
        setTags(tagsData);
        console.log('Tags loaded:', tagsData.length);
        
        console.log('Initial data loaded successfully');
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, [user]);
  
  // Função para definir o projeto atual
  const setCurrentProject = (project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
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
    generateReport,
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

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

// Define initial state
const initialState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
  tags: [],
};

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  
  const userId = user?.id || '';
  
  // Use custom hooks
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
    pauseTimer,
    resumeTimer,
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
  
  // Function to get active task name
  const getActiveTaskName = () => {
    if (!activeTimeEntry) return null;
    const task = tasks.find(t => t.id === activeTimeEntry.taskId);
    return task ? task.name : null;
  };
  
  // Update centralized state when sub-states change
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
  
  // Load data when user changes
  useEffect(() => {
    if (!user) {
      // Reset state if no user
      setState(initialState);
      return;
    }
    
    const loadInitialData = async () => {
      try {
        // Load projects
        const projectsData = await projectService.loadProjects();
        setProjects(projectsData || []);
        
        // Load tasks
        const { tasks: tasksData } = await taskService.loadTasks();
        setTasks(tasksData);
        
        // Load time entries
        const timeEntriesData = await timeEntryService.loadTimeEntries();
        
        setTimeEntries(timeEntriesData || []);
        setActiveTimeEntry(timeEntriesData.find((entry: TimeEntry) => entry.isRunning) || null);

        // Load tags
        const { tags: tagsData } = await tagService.loadTags(user.id);
        setTags(tagsData);
      } catch (error) {
        // Handle data loading error
        console.error("Error loading data:", error);
      }
    };
    
    loadInitialData();
  }, [user]);
  
  // Function to set current project
  const setCurrentProject = (project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  };

  // Report generation function adapted to use context
  const appGenerateReport = (projectId: string): ReportData | null => {
    return generateReport(projectId, projects, tasks);
  };
  
  // Group values and functions exposed by context
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
    pauseTimer,
    resumeTimer,
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


import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, Tag } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectsProvider, useProjectsContext } from '@/contexts/ProjectsContext';
import { TasksProvider, useTasksContext } from '@/contexts/TasksContext';
import { TimerProvider, useTimerContext } from '@/contexts/TimerContext';
import { TagsProvider, useTagsContext } from '@/contexts/TagsContext';
import { useToast } from '@/hooks/use-toast';
import { useReportGenerator } from '@/hooks/useReportGenerator';

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
  const { generateReport } = useReportGenerator();
  
  return (
    <ProjectsProvider userId={userId}>
      <TasksProvider userId={userId}>
        <TimerProvider userId={userId}>
          <TagsProvider userId={userId}>
            <AppContextProvider generateReport={generateReport}>
              {children}
            </AppContextProvider>
          </TagsProvider>
        </TimerProvider>
      </TasksProvider>
    </ProjectsProvider>
  );
};

interface AppContextProviderProps {
  children: ReactNode;
  generateReport: (projectId: string) => any;
}

const AppContextProvider: React.FC<AppContextProviderProps> = ({ 
  children, 
  generateReport 
}) => {
  const projects = useProjectsContext();
  const tasks = useTasksContext();
  const timer = useTimerContext();
  const tags = useTagsContext();
  
  // Centralized state that combines all context data
  const state: AppState = {
    projects: projects.projects,
    tasks: tasks.tasks,
    timeEntries: timer.timeEntries,
    activeTimeEntry: timer.activeTimeEntry,
    currentProject: projects.currentProject,
    currentTask: tasks.currentTask,
    tags: tags.tags,
  };

  // Report generation function adapted to use context
  const appGenerateReport = (projectId: string) => {
    return generateReport(projectId, projects.projects, tasks.tasks);
  };

  // Group values and functions exposed by context
  const contextValue: AppContextType = {
    state,
    addProject: projects.addProject,
    updateProject: projects.updateProject,
    deleteProject: projects.deleteProject,
    addTask: tasks.addTask,
    updateTask: tasks.updateTask,
    completeTask: tasks.completeTask,
    deleteTask: tasks.deleteTask,
    startTimer: timer.startTimer,
    pauseTimer: timer.pauseTimer,
    resumeTimer: timer.resumeTimer,
    stopTimer: timer.stopTimer,
    setCurrentProject: projects.setCurrentProject,
    setCurrentTask: tasks.setCurrentTask,
    generateReport: appGenerateReport,
    getActiveTaskName: timer.getActiveTaskName,
    addTag: tags.addTag,
    deleteTag: tags.deleteTag,
    addTagToTask: tags.addTagToTask,
    removeTagFromTask: tags.removeTagFromTask,
    getTaskTags: tags.getTaskTags,
    createProject: projects.createProject,
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


import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, Tag, ReportData } from '@/types';
import { projectService, taskService, timeEntryService, tagService } from '@/services';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { useTags } from '@/hooks/useTags';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const AppProvider: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id as string;

  const {
    projects,
    setProjects,
    currentProject,
    setCurrentProject: setCurrentProjectState,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects(userId);
  const {
    tasks,
    setTasks,
    currentTask,
    setCurrentTask: setCurrentTaskState,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
  } = useTasks(userId);
  const {
    timeEntries,
    setTimeEntries,
    activeTimeEntry,
    setActiveTimeEntry,
    startTimer: startTimerState,
    stopTimer: stopTimerState,
  } = useTimeEntries(userId);
  const { generateReport: generateReportBase, generateMultiProjectReport } = useReportGenerator();
  const { tags, setTags, addTag: addTagState, deleteTag: deleteTagState, addTagToTask: addTagToTaskState, removeTagFromTask: removeTagFromTaskState, getTaskTags: getTaskTagsState } = useTags(userId);

  const [state, setState] = useState<AppState>({
    projects: [],
    tasks: [],
    timeEntries: [],
    activeTimeEntry: null,
    currentProject: null,
    currentTask: null,
    tags: [],
  });

  // Carregar dados quando o componente for montado ou quando o usuário mudar
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        // Carregar projetos
        const loadedProjects = await projectService.loadProjects();
        setProjects(loadedProjects);
        
        // Carregar tarefas
        const { tasks: loadedTasks } = await taskService.loadTasks();
        setTasks(loadedTasks);
        
        // Carregar entradas de tempo
        const { timeEntries: loadedTimeEntries } = await timeEntryService.loadTimeEntries();
        setTimeEntries(loadedTimeEntries);
        
        // Verificar se há uma entrada de tempo ativa
        const activeEntry = loadedTimeEntries.find(entry => entry.isRunning);
        if (activeEntry) {
          setActiveTimeEntry(activeEntry);
        }
        
        // Carregar tags
        if (tagService.loadTags) {
          const loadedTags = await tagService.loadTags();
          setTags(loadedTags);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados. Tente novamente.",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, [userId, setProjects, setTasks, setTimeEntries, setTags, toast]);

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      projects: projects,
      tasks: tasks,
      timeEntries: timeEntries,
      activeTimeEntry: activeTimeEntry,
      currentProject: currentProject,
      currentTask: currentTask,
      tags: tags,
    }));
  }, [projects, tasks, timeEntries, activeTimeEntry, currentProject, currentTask, tags]);

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
  };

  const setCurrentTask = (task: Task | null) => {
    setCurrentTaskState(task);
  };

  const startTimer = async (taskId: string, projectId: string) => {
    await startTimerState(taskId, projectId);
  };

  const stopTimer = async (completeTask?: boolean) => {
    await stopTimerState(completeTask);
  };

  const getActiveTaskName = (): string | null => {
    if (state.activeTimeEntry) {
      const task = state.tasks.find(task => task.id === state.activeTimeEntry?.taskId);
      return task ? task.name : null;
    }
    return null;
  };

  const addTag = async (name: string): Promise<Tag> => {
    return await addTagState(name);
  };

  const deleteTag = async (tagId: string): Promise<void> => {
    await deleteTagState(tagId);
  };

  const addTagToTask = async (taskId: string, tagId: string): Promise<void> => {
    await addTagToTaskState(taskId, tagId);
  };

  const removeTagFromTask = async (taskId: string, tagId: string): Promise<void> => {
    await removeTagFromTaskState(taskId, tagId);
  };

  const getTaskTags = async (taskId: string): Promise<string[]> => {
    return await getTaskTagsState(taskId);
  };

  const generateReport = useCallback((projectIdOrIds: string | string[]) => {
    if (Array.isArray(projectIdOrIds)) {
      // Se for um array de IDs, gerar relatório de múltiplos projetos
      return generateMultiProjectReport(projectIdOrIds, state.projects, state.tasks);
    } else {
      // Se for um único ID, gerar relatório de único projeto
      return generateReportBase(projectIdOrIds, state.projects, state.tasks);
    }
  }, [state.projects, state.tasks, generateMultiProjectReport, generateReportBase]);

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// For backward compatibility
export const AppContextProvider = AppProvider;

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
};

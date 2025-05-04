import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService, timeEntryService, tagService, teamService, invitationService } from '@/services';
import { AppState, AppContextType } from '@/types/app';
import { Project, Task, TimeEntry, ReportData, Tag, Team, TeamMember, TeamInvitation } from '@/types';
import { calculateElapsedTime } from '@/utils/dateUtils';

interface AppProviderProps {
  children: React.ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultState: AppState = {
  projects: [],
  tasks: [],
  timeEntries: [],
  activeTimeEntry: null,
  currentProject: null,
  currentTask: null,
  tags: [],
  teams: [],
  teamMembers: [],
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Carregar projetos
      const loadedProjects = await projectService.loadProjects();
      setState(prev => ({
        ...prev,
        projects: loadedProjects || []
      }));
      
      console.log('Projetos carregados:', loadedProjects);
      
      // Carregar tarefas
      const loadedTasks = await taskService.loadTasks();
      setState(prev => ({
        ...prev,
        tasks: loadedTasks || []
      }));
      
      console.log('Tarefas carregadas:', loadedTasks);

      // Carregar time entries
      const loadedTimeEntries = await timeEntryService.loadTimeEntries();
      setState(prev => ({
        ...prev,
        timeEntries: loadedTimeEntries || []
      }));

      // Carregar active time entry
      const activeEntry = loadedTimeEntries.find(entry => entry.isRunning) || null;
      setState(prev => ({
        ...prev,
        activeTimeEntry: activeEntry
      }));

      // Carregar tags
      const loadedTags = await tagService.loadTags();
      setState(prev => ({
        ...prev,
        tags: loadedTags || []
      }));

      // Load teams and team members
      const { teams: loadedTeams, teamMembers: loadedTeamMembers } = await teamService.loadTeamsWithMembers(user.id);
      setState(prev => ({
        ...prev,
        teams: loadedTeams || [],
        teamMembers: loadedTeamMembers || [],
      }));
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'userId'>): Promise<void> => {
    if (!user) return;
    try {
      const newProject = await projectService.createProject({ ...project, userId: user.id });
      setState(prev => ({ ...prev, projects: [newProject, ...prev.projects] }));
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
    }
  };

  const updateProject = async (project: Project): Promise<void> => {
    try {
      await projectService.updateProject(project);
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => (p.id === project.id ? project : p)),
      }));
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      await projectService.deleteProject(projectId);
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        tasks: prev.tasks.filter(task => task.projectId !== projectId),
        timeEntries: prev.timeEntries.filter(te => te.projectId !== projectId),
      }));
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>): Promise<Task> => {
    if (!user) throw new Error('User not authenticated');
    try {
      const newTask = await taskService.createTask({ ...task, userId: user.id });
      setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      return newTask;
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  };

  const updateTask = async (task: Task): Promise<void> => {
    try {
      await taskService.updateTask(task);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === task.id ? task : t)),
      }));
      
      // Dispatch a custom event to notify components about the task completion
      const event = new CustomEvent('task-completed', {
        detail: {
          taskId: task.id,
          updatedTask: task,
        },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const completeTask = async (taskId: string): Promise<void> => {
    try {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = { ...task, completed: true };
      await taskService.updateTask(updatedTask);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? updatedTask : t)),
      }));
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await taskService.deleteTask(taskId);
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        timeEntries: prev.timeEntries.filter(te => te.taskId !== taskId),
      }));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const startTimer = async (taskId: string, projectId: string): Promise<void> => {
    if (!user) return;
    try {
      // Check if there's an active timer running and stop it
      if (state.activeTimeEntry) {
        await stopTimer();
      }

      const now = new Date();
      const newTimeEntry: Omit<TimeEntry, 'id' | 'duration'> = {
        taskId: taskId,
        projectId: projectId,
        startTime: now,
        isRunning: true,
        userId: user.id,
      };

      const createdTimeEntry = await timeEntryService.createTimeEntry(newTimeEntry);

      setState(prev => ({
        ...prev,
        activeTimeEntry: createdTimeEntry,
        timeEntries: [...prev.timeEntries, createdTimeEntry],
      }));
    } catch (error) {
      console.error('Erro ao iniciar o timer:', error);
    }
  };

  const stopTimer = async (completeTask: boolean = false): Promise<void> => {
    try {
      if (!state.activeTimeEntry) return;

      const endTime = new Date();
      const duration = calculateElapsedTime(state.activeTimeEntry.startTime, endTime);

      const updatedTimeEntry: TimeEntry = {
        ...state.activeTimeEntry,
        endTime: endTime,
        duration: duration,
        isRunning: false,
      };

      await timeEntryService.updateTimeEntry(updatedTimeEntry);

      setState(prev => ({
        ...prev,
        activeTimeEntry: null,
        timeEntries: prev.timeEntries.map(te => (te.id === updatedTimeEntry.id ? updatedTimeEntry : te)),
      }));

      if (completeTask) {
        await this.completeTask(state.activeTimeEntry.taskId);
      }
    } catch (error) {
      console.error('Erro ao parar o timer:', error);
    }
  };

  const setCurrentProject = (project: Project | null): void => {
    setState(prev => ({ ...prev, currentProject: project }));
  };

  const setCurrentTask = (task: Task | null): void => {
    setState(prev => ({ ...prev, currentTask: task }));
  };

  const generateReport = (projectId: string): ReportData | null => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return null;

    const tasks = state.tasks.filter(t => t.projectId === projectId);

    const reportTasks = tasks.map(task => {
      const timeEntry = state.timeEntries.find(te => te.taskId === task.id);
      const timeSpent = timeEntry ? timeEntry.duration || 0 : 0;
      const earnings = (timeSpent / 3600) * project.hourlyRate; // Convert seconds to hours

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        timeSpent: timeSpent,
        earnings: earnings,
        startTime: task.actualStartTime,
        endTime: task.actualEndTime,
      };
    });

    const totalTime = reportTasks.reduce((sum, task) => sum + task.timeSpent, 0);
    const totalEarnings = reportTasks.reduce((sum, task) => sum + task.earnings, 0);

    return {
      projectId: project.id,
      projectName: project.name,
      hourlyRate: project.hourlyRate,
      tasks: reportTasks,
      totalTime: totalTime,
      totalEarnings: totalEarnings,
    };
  };

  const getActiveTaskName = (): string | null => {
    if (!state.activeTimeEntry) return null;
    const task = state.tasks.find(task => task.id === state.activeTimeEntry?.taskId);
    return task ? task.name : null;
  };

  const addTag = async (name: string): Promise<Tag> => {
    if (!user) throw new Error('User not authenticated');
    try {
      const newTag: Omit<Tag, 'id'> = { name, userId: user.id };
      const createdTag = await tagService.createTag(newTag);
      setState(prev => ({ ...prev, tags: [...prev.tags, createdTag] }));
      return createdTag;
    } catch (error) {
      console.error('Erro ao adicionar tag:', error);
      throw error;
    }
  };

  const deleteTag = async (tagId: string): Promise<void> => {
    try {
      await tagService.deleteTag(tagId);
      setState(prev => ({ ...prev, tags: prev.tags.filter(tag => tag.id !== tagId) }));
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
    }
  };

  const addTagToTask = async (taskId: string, tagId: string): Promise<void> => {
    try {
      await taskService.addTagToTask(taskId, tagId);
    } catch (error) {
      console.error('Erro ao adicionar tag à tarefa:', error);
    }
  };

  const removeTagFromTask = async (taskId: string, tagId: string): Promise<void> => {
    try {
      await taskService.removeTagFromTask(taskId, tagId);
    } catch (error) {
      console.error('Erro ao remover tag da tarefa:', error);
    }
  };

  const getTaskTags = async (taskId: string): Promise<string[]> => {
    try {
      const tagIds = await taskService.getTaskTags(taskId);
      return tagIds;
    } catch (error) {
      console.error('Erro ao obter tags da tarefa:', error);
      return [];
    }
  };
  
  const createTeam = useCallback(async (team: Omit<Team, 'id' | 'ownerId' | 'createdAt'>): Promise<Team> => {
    if (!user) throw new Error('User not authenticated');
    try {
      const newTeam = await teamService.createTeam({ ...team, ownerId: user.id });
      setState(prev => ({ ...prev, teams: [newTeam, ...prev.teams] }));
      return newTeam;
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      throw error;
    }
  }, [user]);

  const updateTeam = useCallback(async (team: Team): Promise<void> => {
    try {
      await teamService.updateTeam(team);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => (t.id === team.id ? team : t)),
      }));
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
    }
  }, []);

  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    try {
      await teamService.deleteTeam(teamId);
      setState(prev => ({
        ...prev,
        teams: prev.teams.filter(t => t.id !== teamId),
        teamMembers: prev.teamMembers.filter(member => member.teamId !== teamId),
      }));
    } catch (error) {
      console.error('Erro ao excluir equipe:', error);
    }
  }, []);

  const addTeamMember = useCallback(async (member: Omit<TeamMember, 'id' | 'createdAt' | 'userId' | 'invitationStatus'>): Promise<TeamMember> => {
    try {
      const newMember = await teamService.addTeamMember(member);
      setState(prev => ({ ...prev, teamMembers: [newMember, ...prev.teamMembers] }));
      return newMember;
    } catch (error) {
      console.error('Erro ao adicionar membro à equipe:', error);
      throw error;
    }
  }, []);

  const updateTeamMember = useCallback(async (member: TeamMember): Promise<void> => {
    try {
      await teamService.updateTeamMember(member);
      setState(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.map(m => (m.id === member.id ? member : m)),
      }));
    } catch (error) {
      console.error('Erro ao atualizar membro da equipe:', error);
    }
  }, []);

  const deleteTeamMember = useCallback(async (memberId: string): Promise<void> => {
    try {
      await teamService.deleteTeamMember(memberId);
      setState(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter(member => member.id !== memberId),
      }));
    } catch (error) {
      console.error('Erro ao excluir membro da equipe:', error);
    }
  }, []);

  const getTeamMembers = useCallback((teamId: string): TeamMember[] => {
    return state.teamMembers.filter(member => member.teamId === teamId);
  }, [state.teamMembers]);

  const createAndSendInvitation = useCallback(async (teamId: string, email: string): Promise<TeamInvitation> => {
    try {
      const invitation = await invitationService.createInvitation(teamId, email);
      
      if (!invitation) {
        throw new Error('Failed to create invitation');
      }
      
      // Aqui você implementaria o envio real de email
      const inviteLink = `${window.location.origin}/convite?token=${invitation.token}`;
      console.log(`Convite criado: ${inviteLink}`);
      
      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }, []);

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
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTaskTags,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    getTeamMembers,
    createAndSendInvitation,
  };

  return (
    <AppContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

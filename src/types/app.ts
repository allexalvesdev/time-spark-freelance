
import { Project, Task, TimeEntry, ReportData, Tag, Team, TeamMember, TeamInvitation } from './index';

export interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
  tags: Tag[];
  teams: Team[];
  teamMembers: TeamMember[];
}

export interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<void>;
  stopTimer: (completeTask?: boolean) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
  getActiveTaskName: () => string | null;
  addTag: (name: string) => Promise<Tag>;
  deleteTag: (tagId: string) => Promise<void>;
  addTagToTask: (taskId: string, tagId: string) => Promise<void>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => Promise<string[]>;
  
  // Team management functions
  createTeam: (team: Omit<Team, 'id' | 'ownerId' | 'createdAt'>) => Promise<Team>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt' | 'userId' | 'invitationStatus'>) => Promise<TeamMember>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (memberId: string) => Promise<void>;
  getTeamMembers: (teamId: string) => TeamMember[];
  createAndSendInvitation: (teamId: string, email: string) => Promise<TeamInvitation>;
}

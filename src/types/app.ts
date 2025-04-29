
import { Project, Task, TimeEntry, ReportData, Tag, TaskPriority } from './index';

export interface AppState {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimeEntry: TimeEntry | null;
  currentProject: Project | null;
  currentTask: Task | null;
  tags: Tag[];
}

export interface AppContextType {
  state: AppState;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId' | 'tags'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  startTimer: (taskId: string, projectId: string) => Promise<void>;
  stopTimer: (completeTaskFlag?: boolean) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentTask: (task: Task | null) => void;
  generateReport: (projectId: string) => ReportData | null;
  getActiveTaskName: () => string | null;
  addTag: (name: string) => Promise<Tag>;
  getTags: () => Promise<Tag[]>;
  addTaskTag: (taskId: string, tagId: string) => Promise<void>;
  removeTaskTag: (taskId: string, tagId: string) => Promise<void>;
  getTaskTags: (taskId: string) => Promise<Tag[]>;
}

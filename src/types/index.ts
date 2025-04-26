
export interface Project {
  id: string;
  name: string;
  hourlyRate: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  estimatedTime: number; // em minutos
  scheduledStartTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  elapsedTime?: number; // em segundos
  completed: boolean;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // em segundos
  isRunning: boolean;
}

export interface ReportData {
  projectId: string;
  projectName: string;
  hourlyRate: number;
  tasks: {
    id: string;
    name: string;
    timeSpent: number; // em segundos
    earnings: number; // em reais
  }[];
  totalTime: number; // em segundos
  totalEarnings: number; // em reais
}

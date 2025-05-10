
export interface Project {
  id: string;
  name: string;
  hourlyRate: number;
  createdAt: Date;
  userId: string;
  teamId?: string; // Added to match database schema
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
  userId: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // em segundos
  isRunning: boolean;
  isPaused?: boolean;
  pausedTime?: number; // em segundos
  userId: string;
}

export interface ReportData {
  projectId: string;
  projectName: string;
  hourlyRate: number;
  tasks: {
    id: string;
    name: string;
    description: string;
    timeSpent: number; // em segundos
    earnings: number; // em reais
    startTime?: Date;
    endTime?: Date;
  }[];
  totalTime: number; // em segundos
  totalEarnings: number; // em reais
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
}

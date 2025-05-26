
export interface Timer {
  id: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  isPaused: boolean;
  pausedTime: number;
  elapsedSeconds: number;
}

export interface TimerState {
  displaySeconds: number;
  isPaused: boolean;
  isActive: boolean;
  timerId: string | null;
}


import React from 'react';

export interface TimerActionOptions {
  persistKey?: string;
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  pausedTime: number;
  startTimeRef: React.MutableRefObject<number | null>;
  pausedAtRef: React.MutableRefObject<number | null>;
  setIsRunning: (running: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setPausedTime: (time: number) => void;
  clearInterval: () => void;
  isActiveTask: boolean;
}

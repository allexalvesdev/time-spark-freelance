
/**
 * Core timer types and interfaces
 */

export interface TimerState {
  running: boolean;
  elapsed: number;
  startTime: number | null;
  lastUpdate: number;
}


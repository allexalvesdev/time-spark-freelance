
import { Timer } from '@/types/timer';

export const emitTimerUpdate = (timer: Timer | null) => {
  if (timer) {
    window.dispatchEvent(new CustomEvent('timer-updated', { 
      detail: timer 
    }));
  } else {
    window.dispatchEvent(new CustomEvent('timer-stopped', { 
      detail: null 
    }));
  }
};

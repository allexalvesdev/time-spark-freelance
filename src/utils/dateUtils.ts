
export const calculateElapsedTime = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};

export const calculateEarnings = (timeInSeconds: number, hourlyRate: number): number => {
  const hoursWorked = timeInSeconds / 3600;
  return hoursWorked * hourlyRate;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

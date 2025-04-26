
// Funções utilitárias para manipulação de datas e tempos

// Formata a duração em segundos para o formato HH:MM:SS
export const formatDuration = (durationInSeconds: number): string => {
  if (durationInSeconds === 0) return "00:00:00";
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

// Formata data para o formato DD/MM/YYYY
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

// Formata hora para o formato HH:MM
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// Calcula tempo decorrido entre duas datas em segundos
export const calculateElapsedTime = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};

// Calcula ganhos com base no tempo gasto e na taxa horária
export const calculateEarnings = (timeSpentInSeconds: number, hourlyRate: number): number => {
  const hoursSpent = timeSpentInSeconds / 3600;
  return hoursSpent * hourlyRate;
};

// Formata valor monetário para o formato R$ X.XXX,XX
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

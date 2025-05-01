export const calculateElapsedTime = (startTime: Date, endTime: Date): number => {
  console.log(`Calculating elapsed time from ${startTime} to ${endTime}`);
  const elapsedSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  console.log(`Elapsed seconds: ${elapsedSeconds}`);
  return elapsedSeconds;
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

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

export const formatDate = (date: Date, format?: string): string => {
  if (format === 'dd/MM/yyyy HH:mm') {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  if (format === 'dd-MM-yyyy HH:mm') {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
  
  if (format === 'yyyy-MM-dd HH:mm') {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const parseDate = (dateStr: string, format: 'dd/MM/yyyy HH:mm' | 'yyyy-MM-dd HH:mm' | 'dd-MM-yyyy HH:mm'): Date => {
  try {
    console.log(`Parsing date string: "${dateStr}" with format: "${format}"`);
    
    if (format === 'dd/MM/yyyy HH:mm') {
      const [datePart, timePart] = dateStr.split(' ');
      
      if (!datePart || !timePart) {
        throw new Error(`Invalid date format: ${dateStr}. Expected format: dd/MM/yyyy HH:mm`);
      }
      
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid date components in: ${dateStr}`);
      }
      
      const date = new Date(year, month - 1, day, hours, minutes);
      console.log(`Parsed date: ${date.toISOString()}`);
      return date;
    }
    
    if (format === 'dd-MM-yyyy HH:mm') {
      const [datePart, timePart] = dateStr.split(' ');
      
      if (!datePart || !timePart) {
        throw new Error(`Invalid date format: ${dateStr}. Expected format: dd-MM-yyyy HH:mm`);
      }
      
      const [day, month, year] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid date components in: ${dateStr}`);
      }
      
      const date = new Date(year, month - 1, day, hours, minutes);
      console.log(`Parsed date: ${date.toISOString()}`);
      return date;
    }
    
    if (format === 'yyyy-MM-dd HH:mm') {
      const [datePart, timePart] = dateStr.split(' ');
      
      if (!datePart || !timePart) {
        throw new Error(`Invalid date format: ${dateStr}. Expected format: yyyy-MM-dd HH:mm`);
      }
      
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid date components in: ${dateStr}`);
      }
      
      const date = new Date(year, month - 1, day, hours, minutes);
      console.log(`Parsed date: ${date.toISOString()}`);
      return date;
    }
    
    throw new Error(`Unsupported date format: ${format}`);
  } catch (error) {
    console.error(`Error parsing date '${dateStr}' with format '${format}':`, error);
    throw new Error(`Data inválida: ${dateStr}`);
  }
};

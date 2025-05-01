
import * as XLSX from 'xlsx';
import { Project, Task } from '@/types';
import { formatDate, parseDate } from './dateUtils';

// Define the template structure for Excel export
export interface TaskImportTemplate {
  'Nome do Projeto*': string;
  'Nome da Tarefa*': string;
  'Descrição': string;
  'Horas Estimadas': number;
  'Minutos Estimados': number;
  'Data e Hora de Início*': string;
  'Data e Hora de Fim': string;
  'Prioridade*': 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  'Tags': string; // Tags separadas por vírgula
}

// Create a template for users to download
export const generateTaskTemplate = (): Blob => {
  // Criar a estrutura de cabeçalho apenas
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Nome do Projeto* - precisa ser um projeto existente no sistema - Obrigatório', 'Nome da Tarefa* - Obrigatório', 'Descrição', 'Horas Estimadas', 'Minutos Estimados', 'Data e Hora de Início* - deve estar no formato dd-MM-yyyy HH:MM - Obrigatório', 'Data e Hora de Fim - deve estar no formato dd-MM-yyyy HH:MM', 'Prioridade* - deve ser uma das seguintes: Baixa, Média, Alta ou Urgente - Obrigatório', 'Tags - devem ser separadas por vírgula']
  ]);
  
  // Set column widths
  const columnWidths = [
    { wch: 35 }, // Nome do Projeto
    { wch: 25 }, // Nome da Tarefa
    { wch: 40 }, // Descrição
    { wch: 15 }, // Horas Estimadas
    { wch: 15 }, // Minutos Estimados
    { wch: 35 }, // Data e Hora de Início
    { wch: 35 }, // Data e Hora de Fim
    { wch: 40 }, // Prioridade
    { wch: 30 }  // Tags
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Create a workbook
  const workbook = XLSX.utils.book_new();
  
  // Create an instructions sheet
  const instructionsWs = XLSX.utils.aoa_to_sheet([
    ['Instruções para importação de tarefas'],
    [''],
    ['1. Os campos com * são obrigatórios'],
    ['2. O "Projeto*" precisa ser um projeto existente no sistema'],
    ['3. A "Data e Hora de Início*" deve estar no formato DD/MM/YYYY HH:MM'],
    ['4. A "Data e Hora de Fim" deve estar no formato DD/MM/YYYY HH:MM (opcional)'],
    ['5. A "Prioridade*" deve ser uma das seguintes: Baixa, Média, Alta ou Urgente'],
    ['6. As "Tags" devem ser separadas por vírgula']
  ]);
  
  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instruções');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
  
  // Fix: Change 'blob' to 'binary' and then convert to Blob object manually
  const binaryData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(binaryData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binaryData.length; i++) {
    view[i] = binaryData.charCodeAt(i) & 0xFF;
  }
  
  // Create and return Blob
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Parse the uploaded Excel file
export const parseTasksFromExcel = (file: File): Promise<{
  data: TaskImportTemplate[];
  errors: { row: number; message: string }[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Skip the first row (header)
        const jsonData: TaskImportTemplate[] = XLSX.utils.sheet_to_json(worksheet, { 
          range: 1 
        });
        
        // Validate data
        const errors: { row: number; message: string }[] = [];
        
        jsonData.forEach((row, index) => {
          // Validate required fields
          if (!row['Nome da Tarefa*']) {
            errors.push({ row: index + 2, message: 'Nome da tarefa é obrigatório' });
          }
          
          if (!row['Nome do Projeto*']) {
            errors.push({ row: index + 2, message: 'Nome do projeto é obrigatório' });
          }
          
          if (!row['Data e Hora de Início*']) {
            errors.push({ row: index + 2, message: 'Data e hora de início são obrigatórias' });
          } else {
            // Validate date format (DD/MM/YYYY HH:MM)
            const dateStr = row['Data e Hora de Início*'].toString();
            const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
            if (!dateRegex.test(dateStr)) {
              errors.push({ 
                row: index + 2, 
                message: 'Formato de data e hora inválido. Use DD/MM/YYYY HH:MM' 
              });
            }
          }
          
          // Validate end date format if provided
          if (row['Data e Hora de Fim']) {
            const dateStr = row['Data e Hora de Fim'].toString();
            const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
            if (!dateRegex.test(dateStr)) {
              errors.push({ 
                row: index + 2, 
                message: 'Formato de data e hora de fim inválido. Use DD/MM/YYYY HH:MM' 
              });
            }
          }
          
          if (!row['Prioridade*'] || !['Baixa', 'Média', 'Alta', 'Urgente'].includes(row['Prioridade*'])) {
            errors.push({ 
              row: index + 2, 
              message: 'Prioridade inválida. Use "Baixa", "Média", "Alta" ou "Urgente"' 
            });
          }
        });
        
        resolve({ data: jsonData, errors });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

// Map Excel data to task format
export const mapExcelDataToTasks = (
  data: TaskImportTemplate[], 
  projects: Project[], 
  userId: string
): { 
  tasks: Omit<Task, 'id' | 'userId'>[];
  errors: { row: number; message: string }[];
} => {
  const tasks: Omit<Task, 'id' | 'userId'>[] = [];
  const errors: { row: number; message: string }[] = [];
  
  data.forEach((row, index) => {
    try {
      // Find the project by name
      const project = projects.find(p => p.name.toLowerCase() === row['Nome do Projeto*'].toLowerCase());
      if (!project) {
        errors.push({ row: index + 2, message: `Projeto "${row['Nome do Projeto*']}" não encontrado` });
        return;
      }
      
      // Parse start date
      const startDateTime = row['Data e Hora de Início*'].toString();
      const scheduledStartTime = parseDate(startDateTime, 'dd/MM/yyyy HH:mm');
      
      // Calculate estimated time in minutes
      const hours = row['Horas Estimadas'] || 0;
      const minutes = row['Minutos Estimados'] || 0;
      const estimatedTime = (hours * 60) + minutes;
      
      // Check if end date is provided to mark task as completed
      const completed = !!row['Data e Hora de Fim'];
      let actualEndTime: Date | undefined;
      let actualStartTime: Date | undefined;
      let elapsedTime: number | undefined;
      
      if (completed && row['Data e Hora de Fim']) {
        // Parse end date
        const endDateTime = row['Data e Hora de Fim'].toString();
        actualEndTime = parseDate(endDateTime, 'dd/MM/yyyy HH:mm');
        actualStartTime = scheduledStartTime; // Use scheduled start time as actual start time
        
        // Calculate elapsed time in seconds
        elapsedTime = calculateElapsedTime(scheduledStartTime, actualEndTime);
      }
      
      // Create task object
      const task: Omit<Task, 'id' | 'userId'> = {
        name: row['Nome da Tarefa*'],
        description: row['Descrição'] || '',
        projectId: project.id,
        estimatedTime,
        scheduledStartTime,
        priority: row['Prioridade*'],
        completed,
        actualStartTime,
        actualEndTime,
        elapsedTime
      };
      
      tasks.push(task);
    } catch (error) {
      errors.push({ row: index + 2, message: `Erro ao processar linha: ${error}` });
    }
  });
  
  return { tasks, errors };
};

// Extract tags from Excel data
export const extractTagsFromExcel = (data: TaskImportTemplate[]): string[] => {
  const uniqueTags = new Set<string>();
  
  data.forEach(row => {
    if (row['Tags']) {
      const tags = row['Tags'].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      tags.forEach(tag => uniqueTags.add(tag));
    }
  });
  
  return Array.from(uniqueTags);
};

// Get tag mappings for each Excel row
export const getTagMappingsFromExcel = (data: TaskImportTemplate[]): { rowIndex: number; tags: string[] }[] => {
  return data.map((row, index) => {
    const tags = row['Tags'] 
      ? row['Tags'].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
      : [];
    return { rowIndex: index, tags };
  });
};

// Calculate elapsed time between two dates in seconds
const calculateElapsedTime = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};


import * as XLSX from 'xlsx';
import { Project, Task } from '@/types';
import { formatDate } from './dateUtils';

// Define the template structure for Excel export
export interface TaskImportTemplate {
  'Nome da Tarefa*': string;
  'Descrição': string;
  'Projeto*': string;
  'Horas Estimadas': number;
  'Minutos Estimados': number;
  'Data e Hora de Início*': string;
  'Prioridade*': 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  'Tags': string; // Tags separadas por vírgula
}

// Create a template for users to download
export const generateTaskTemplate = (): Blob => {
  const template: TaskImportTemplate[] = [{
    'Nome da Tarefa*': 'Exemplo: Criar wireframes',
    'Descrição': 'Exemplo: Desenvolvimento de wireframes para o novo layout',
    'Projeto*': 'Digite o nome exato do projeto',
    'Horas Estimadas': 2,
    'Minutos Estimados': 30,
    'Data e Hora de Início*': formatDate(new Date(), 'yyyy-MM-dd HH:mm'),
    'Prioridade*': 'Média',
    'Tags': 'design, wireframe, ux'
  }];

  const worksheet = XLSX.utils.json_to_sheet(template);
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Nome da Tarefa
    { wch: 40 }, // Descrição
    { wch: 20 }, // Projeto
    { wch: 15 }, // Horas Estimadas
    { wch: 15 }, // Minutos Estimados
    { wch: 20 }, // Data e Hora de Início
    { wch: 15 }, // Prioridade
    { wch: 30 }  // Tags
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Add a header with instructions
  XLSX.utils.sheet_add_aoa(worksheet, [
    ['Modelo para Importação de Tarefas'],
    ['Os campos com * são obrigatórios']
  ], { origin: 'A1' });
  
  // Shift the data down to make room for instructions
  worksheet['!ref'] = XLSX.utils.encode_range(
    { r: 3, c: 0 },
    { r: 4, c: 7 }
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'blob' });
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
        
        // Skip the first 3 rows (instructions)
        const jsonData: TaskImportTemplate[] = XLSX.utils.sheet_to_json(worksheet, { 
          range: 3 
        });
        
        // Validate data
        const errors: { row: number; message: string }[] = [];
        
        jsonData.forEach((row, index) => {
          // Validate required fields
          if (!row['Nome da Tarefa*']) {
            errors.push({ row: index + 4, message: 'Nome da tarefa é obrigatório' });
          }
          
          if (!row['Projeto*']) {
            errors.push({ row: index + 4, message: 'Nome do projeto é obrigatório' });
          }
          
          if (!row['Data e Hora de Início*']) {
            errors.push({ row: index + 4, message: 'Data e hora de início são obrigatórias' });
          } else {
            // Validate date format
            const dateStr = row['Data e Hora de Início*'].toString();
            const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
            if (!dateRegex.test(dateStr)) {
              errors.push({ 
                row: index + 4, 
                message: 'Formato de data e hora inválido. Use YYYY-MM-DD HH:MM' 
              });
            }
          }
          
          if (!row['Prioridade*'] || !['Baixa', 'Média', 'Alta', 'Urgente'].includes(row['Prioridade*'])) {
            errors.push({ 
              row: index + 4, 
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
  tasks: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>[];
  errors: { row: number; message: string }[];
} => {
  const tasks: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'>[] = [];
  const errors: { row: number; message: string }[] = [];
  
  data.forEach((row, index) => {
    try {
      // Find the project by name
      const project = projects.find(p => p.name.toLowerCase() === row['Projeto*'].toLowerCase());
      if (!project) {
        errors.push({ row: index + 4, message: `Projeto "${row['Projeto*']}" não encontrado` });
        return;
      }
      
      // Parse date
      const dateTime = row['Data e Hora de Início*'].toString();
      const scheduledStartTime = new Date(dateTime.replace(' ', 'T'));
      
      // Calculate estimated time in minutes
      const hours = row['Horas Estimadas'] || 0;
      const minutes = row['Minutos Estimados'] || 0;
      const estimatedTime = (hours * 60) + minutes;
      
      // Create task object
      const task: Omit<Task, 'id' | 'completed' | 'actualStartTime' | 'actualEndTime' | 'elapsedTime' | 'userId'> = {
        name: row['Nome da Tarefa*'],
        description: row['Descrição'] || '',
        projectId: project.id,
        estimatedTime,
        scheduledStartTime,
        priority: row['Prioridade*'],
      };
      
      tasks.push(task);
    } catch (error) {
      errors.push({ row: index + 4, message: `Erro ao processar linha: ${error}` });
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

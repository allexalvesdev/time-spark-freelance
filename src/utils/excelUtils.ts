
import * as XLSX from 'xlsx';
import { Project, Task } from '@/types';
import { formatDate, parseDate, calculateElapsedTime } from './dateUtils';

// Define the template structure for Excel export
export interface TaskImportTemplate {
  'Nome do Projeto*': string;
  'Nome da Tarefa*': string;
  'Descrição': string;
  'Horas Estimadas': number;
  'Minutos Estimados': number;
  'Data e Hora de Início*': string;
  'Data e Hora de Fim': string;
  'Prioridade*': string; // 'Baixa' | 'Média' | 'Alta' | 'Urgente'
  'Tags': string; // Tags separadas por vírgula
}

// Create a template for users to download
export const generateTaskTemplate = (): Blob => {
  // Cabeçalhos exatamente como solicitado pelo usuário
  const headers = [
    'Nome do Projeto* - precisa ser um projeto existente no sistema',
    'Nome da Tarefa*',
    'Descrição',
    'Horas Estimadas',
    'Minutos Estimados',
    'Data e Hora de Início* - deve estar no formato (01/01/0001 00:00)',
    'Data e Hora de Fim - deve estar no formato (01/01/0001 00:00)',
    'Prioridade* - deve ser uma das seguintes: Baixa, Média, Alta ou Urgente',
    'Tags - devem ser separadas por vírgula'
  ];
  
  // Create worksheet with only headers (sem dados de exemplo)
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  
  // Set column widths
  const columnWidths = [
    { wch: 40 }, // Nome do Projeto
    { wch: 25 }, // Nome da Tarefa
    { wch: 40 }, // Descrição
    { wch: 15 }, // Horas Estimadas
    { wch: 15 }, // Minutos Estimados
    { wch: 40 }, // Data e Hora de Início
    { wch: 40 }, // Data e Hora de Fim
    { wch: 45 }, // Prioridade
    { wch: 30 }  // Tags
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Create a workbook
  const workbook = XLSX.utils.book_new();
  
  // Add the model sheet
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
  
  // Write as binary string
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
        
        // Get the headers from the first row
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const headers: string[] = [];
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v) {
            // Get only the header name, removing any instructions
            const headerText = (cell.v || '').toString();
            const header = headerText.split(' - ')[0].trim();
            headers.push(header);
          } else {
            headers.push('');
          }
        }
        
        console.log('Excel headers:', headers);
        
        // Convert to JSON, starting at row 2 (index 1)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { 
          range: 1,
          header: headers,
          defval: '' // Set default value for empty cells
        });
        
        console.log('Parsed raw data:', rawData);
        
        // Map to our expected format and validate
        const jsonData: TaskImportTemplate[] = rawData.map((row: any) => ({
          'Nome do Projeto*': row['Nome do Projeto*'] || '',
          'Nome da Tarefa*': row['Nome da Tarefa*'] || '',
          'Descrição': row['Descrição'] || '',
          'Horas Estimadas': parseFloat(row['Horas Estimadas']) || 0,
          'Minutos Estimados': parseFloat(row['Minutos Estimados']) || 0,
          'Data e Hora de Início*': row['Data e Hora de Início*'] || '',
          'Data e Hora de Fim': row['Data e Hora de Fim'] || '',
          'Prioridade*': row['Prioridade*'] || '',
          'Tags': row['Tags'] || ''
        }));
        
        console.log('Mapped data:', jsonData);
        
        // Validate data
        const errors: { row: number; message: string }[] = [];
        
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 because we're skipping header row and 0-indexed array
          
          // Validate required fields
          if (!row['Nome da Tarefa*']) {
            errors.push({ row: rowNum, message: 'Nome da tarefa é obrigatório' });
          }
          
          if (!row['Nome do Projeto*']) {
            errors.push({ row: rowNum, message: 'Nome do projeto é obrigatório' });
          }

          // Validar o formato de data e hora de início - inclui tratamento para valores numéricos do Excel
          if (!row['Data e Hora de Início*']) {
            errors.push({ row: rowNum, message: 'Data e hora de início são obrigatórias' });
          } else {
            // Tratar valores de data que são números (formato interno do Excel)
            if (typeof row['Data e Hora de Início*'] === 'number') {
              // Converter número do Excel para data JavaScript
              try {
                const excelDate = XLSX.SSF.parse_date_code(row['Data e Hora de Início*']);
                const jsDate = new Date(
                  excelDate.y, 
                  excelDate.m - 1, 
                  excelDate.d, 
                  excelDate.H, 
                  excelDate.M, 
                  excelDate.S
                );
                // Formatar no padrão esperado
                const day = jsDate.getDate().toString().padStart(2, '0');
                const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
                const year = jsDate.getFullYear();
                const hours = jsDate.getHours().toString().padStart(2, '0');
                const minutes = jsDate.getMinutes().toString().padStart(2, '0');
                
                // Substituir o valor numérico pelo formato de string correto
                row['Data e Hora de Início*'] = `${day}/${month}/${year} ${hours}:${minutes}`;
              } catch (error) {
                errors.push({ 
                  row: rowNum, 
                  message: 'Erro ao converter data de início do formato Excel. Use DD/MM/YYYY HH:MM' 
                });
              }
            } else {
              // Validar formato de string normal
              const dateStr = row['Data e Hora de Início*'].toString();
              const slashDateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
              const dashDateRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
              
              if (!slashDateRegex.test(dateStr) && !dashDateRegex.test(dateStr)) {
                errors.push({ 
                  row: rowNum, 
                  message: 'Formato de data e hora inválido. Use DD/MM/YYYY HH:MM ou DD-MM-YYYY HH:MM' 
                });
              }
            }
          }
          
          // Validar o formato de data e hora de fim - inclui tratamento para valores numéricos do Excel
          if (row['Data e Hora de Fim']) {
            if (typeof row['Data e Hora de Fim'] === 'number') {
              // Converter número do Excel para data JavaScript
              try {
                const excelDate = XLSX.SSF.parse_date_code(row['Data e Hora de Fim']);
                const jsDate = new Date(
                  excelDate.y, 
                  excelDate.m - 1, 
                  excelDate.d, 
                  excelDate.H, 
                  excelDate.M, 
                  excelDate.S
                );
                // Formatar no padrão esperado
                const day = jsDate.getDate().toString().padStart(2, '0');
                const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
                const year = jsDate.getFullYear();
                const hours = jsDate.getHours().toString().padStart(2, '0');
                const minutes = jsDate.getMinutes().toString().padStart(2, '0');
                
                // Substituir o valor numérico pelo formato de string correto
                row['Data e Hora de Fim'] = `${day}/${month}/${year} ${hours}:${minutes}`;
              } catch (error) {
                errors.push({ 
                  row: rowNum, 
                  message: 'Erro ao converter data de fim do formato Excel. Use DD/MM/YYYY HH:MM' 
                });
              }
            } else {
              const dateStr = row['Data e Hora de Fim'].toString();
              const slashDateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
              const dashDateRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
              
              if (!slashDateRegex.test(dateStr) && !dashDateRegex.test(dateStr)) {
                errors.push({ 
                  row: rowNum, 
                  message: 'Formato de data e hora de fim inválido. Use DD/MM/YYYY HH:MM ou DD-MM-YYYY HH:MM' 
                });
              }
            }
          }
          
          if (!row['Prioridade*'] || !['Baixa', 'Média', 'Alta', 'Urgente'].includes(row['Prioridade*'])) {
            errors.push({ 
              row: rowNum, 
              message: 'Prioridade inválida. Use "Baixa", "Média", "Alta" ou "Urgente"' 
            });
          }
        });
        
        resolve({ data: jsonData, errors });
      } catch (error) {
        console.error('Error parsing Excel:', error);
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
  tasks: Omit<Task, 'id'>[];
  errors: { row: number; message: string }[];
} => {
  const tasks: Omit<Task, 'id'>[] = [];
  const errors: { row: number; message: string }[] = [];
  
  data.forEach((row, index) => {
    try {
      // Find the project by name
      const project = projects.find(p => p.name.toLowerCase() === row['Nome do Projeto*'].toLowerCase());
      if (!project) {
        errors.push({ row: index + 2, message: `Projeto "${row['Nome do Projeto*']}" não encontrado` });
        return;
      }
      
      // Parse start date, accepting both slash and dash formats, and Excel date numbers
      const startDateTime = row['Data e Hora de Início*'].toString();
      let scheduledStartTime: Date;
      
      if (startDateTime.includes('/')) {
        scheduledStartTime = parseDate(startDateTime, 'dd/MM/yyyy HH:mm');
      } else {
        scheduledStartTime = parseDate(startDateTime, 'dd-MM-yyyy HH:mm');
      }
      
      // Calculate estimated time in minutes
      const hours = row['Horas Estimadas'] || 0;
      const minutes = row['Minutos Estimados'] || 0;
      const estimatedTime = (hours * 60) + minutes;
      
      // Check if end date is provided to mark task as completed
      let completed = false;
      let actualEndTime: Date | undefined;
      let actualStartTime: Date | undefined;
      let elapsedTime: number | undefined;
      
      if (row['Data e Hora de Fim']) {
        completed = true;
        // Parse end date, accepting both slash and dash formats
        const endDateTime = row['Data e Hora de Fim'].toString();
        
        if (endDateTime.includes('/')) {
          actualEndTime = parseDate(endDateTime, 'dd/MM/yyyy HH:mm');
        } else {
          actualEndTime = parseDate(endDateTime, 'dd-MM-yyyy HH:mm');
        }
        
        actualStartTime = scheduledStartTime; // Use scheduled start time as actual start time
        
        // Calculate elapsed time in seconds
        if (actualEndTime && actualStartTime) {
          elapsedTime = calculateElapsedTime(actualStartTime, actualEndTime);
          console.log(`Calculated elapsed time for task '${row['Nome da Tarefa*']}': ${elapsedTime} seconds`);
        }
      }
      
      // Create task object
      const task: Omit<Task, 'id'> = {
        name: row['Nome da Tarefa*'],
        description: row['Descrição'] || '',
        projectId: project.id,
        userId,
        estimatedTime,
        scheduledStartTime,
        priority: row['Prioridade*'] as 'Baixa' | 'Média' | 'Alta' | 'Urgente',
        completed,
        actualStartTime,
        actualEndTime,
        elapsedTime
      };
      
      console.log("Created task from Excel:", task);
      tasks.push(task);
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
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

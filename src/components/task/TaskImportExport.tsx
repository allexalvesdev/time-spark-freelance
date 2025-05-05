import React, { useState } from 'react';
import { Trash, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Task, Tag } from '@/types';
import { read, utils, write } from 'xlsx';
import { taskService } from '@/services';
import { formatDate } from '@/utils/dateUtils';

interface TaskImportExportProps {
  projectId: string;
  tasks: Task[];
  userId: string;
  onTasksImported: (tasks: Task[]) => void;
  tags: Tag[];
}

const TaskImportExport: React.FC<TaskImportExportProps> = ({
  projectId,
  tasks,
  userId,
  onTasksImported,
  tags
}) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const exportTasks = () => {
    try {
      // Prepare data for export
      const exportData = tasks.map(task => ({
        'Nome da Tarefa': task.name,
        'Descrição': task.description || '',
        'Prioridade': task.priority,
        'Tempo Estimado (min)': task.estimatedTime,
        'Data Agendada': task.scheduledStartTime ? formatDate(task.scheduledStartTime) : '',
        'Concluída': task.completed ? 'Sim' : 'Não',
        'Tags': tags
          .filter(tag => true) // Placeholder for tag filtering
          .map(tag => tag.name)
          .join(', ')
      }));

      // Create workbook and worksheet
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Nome da Tarefa
        { wch: 50 }, // Descrição
        { wch: 15 }, // Prioridade
        { wch: 20 }, // Tempo Estimado
        { wch: 20 }, // Data Agendada
        { wch: 10 }, // Concluída
        { wch: 30 }, // Tags
      ];
      
      ws['!cols'] = colWidths;
      
      utils.book_append_sheet(wb, ws, "Tarefas");
      
      // Generate file and download
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tarefas_${formatDate(new Date())}.xlsx`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Exportação concluída',
        description: `${exportData.length} tarefas exportadas com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar tarefas:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar as tarefas.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error('Não foi possível ler o arquivo.');
          
          const workbook = read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of objects
          const jsonData = utils.sheet_to_json(worksheet);
          
          // Map to task objects
          const tasksToImport = jsonData.map((row: any) => {
            const scheduledDate = row['Data Agendada'] ? new Date(row['Data Agendada']) : undefined;
            
            return {
              name: row['Nome da Tarefa'] || 'Tarefa sem nome',
              description: row['Descrição'] || '',
              projectId,
              estimatedTime: parseInt(row['Tempo Estimado (min)']) || 0,
              scheduledStartTime: scheduledDate || new Date(),
              completed: row['Concluída'] === 'Sim',
              priority: row['Prioridade'] || 'Média',
              userId
            } as Omit<Task, 'id'>;
          });
          
          // Skip empty tasks
          const validTasks = tasksToImport.filter(task => task.name && task.name !== 'Tarefa sem nome');
          
          if (validTasks.length === 0) {
            toast({
              title: 'Atenção',
              description: 'Nenhuma tarefa válida encontrada no arquivo.',
              variant: 'default',
            });
            return;
          }
          
          // Import tasks via service
          const importedTasks = await taskService.bulkImportTasks(validTasks);
          
          toast({
            title: 'Importação concluída',
            description: `${importedTasks.length} tarefas importadas com sucesso.`,
          });
          
          onTasksImported(importedTasks);
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          toast({
            title: 'Erro na importação',
            description: 'Não foi possível processar o arquivo.',
            variant: 'destructive',
          });
        } finally {
          setImporting(false);
          
          // Reset file input
          e.target = null as any;
          const fileInput = document.getElementById('task-import-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro ao importar tarefas:', error);
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar as tarefas.',
        variant: 'destructive',
      });
      setImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="task-import-file" className="mb-2 block">
          Importar Tarefas do Excel
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="task-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={importing}
            className="flex-1"
          />
          <Button variant="outline" size="icon" disabled>
            <Upload size={16} />
          </Button>
        </div>
      </div>
      
      <div>
        <Label className="mb-2 block">
          Exportar Tarefas para Excel
        </Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportTasks}
            disabled={tasks.length === 0}
            className="flex-1"
          >
            <Download size={16} className="mr-2" />
            Exportar {tasks.length} tarefas
          </Button>
          <Button variant="outline" size="icon" disabled>
            <Trash size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskImportExport;

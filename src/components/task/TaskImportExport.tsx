
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, FileDown, Lock, Check } from 'lucide-react';
import { usePlan } from '@/contexts/PlanContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Task } from '@/types';
import { taskService } from '@/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface TaskImportExportProps {
  projectId: string;
  tasks: Task[];
  userId: string;
  onTasksImported: (tasks: Task[]) => void;
}

const isPremiumPlan = (plan: string) => {
  return plan === 'pro' || plan === 'enterprise';
};

const TaskImportExport: React.FC<TaskImportExportProps> = ({ projectId, tasks, userId, onTasksImported }) => {
  const { toast } = useToast();
  const { currentPlan } = usePlan();
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);
  
  const hasPremiumAccess = isPremiumPlan(currentPlan);

  const handleExport = () => {
    if (!hasPremiumAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // Format tasks for Excel
      const exportData = tasks.map(task => ({
        'Nome': task.name,
        'Descrição': task.description || '',
        'Prioridade': task.priority,
        'Tempo Estimado (min)': task.estimatedTime || 0,
        'Data Agendada': task.scheduledStartTime 
          ? format(task.scheduledStartTime, 'PPP', { locale: ptBR }) 
          : '',
        'Concluída': task.completed ? 'Sim' : 'Não',
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');
      
      // Generate file name with current date
      const fileName = `tarefas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      
      // Trigger download
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: 'Exportação concluída',
        description: 'Suas tarefas foram exportadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar as tarefas.',
        variant: 'destructive',
      });
    }
  };
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPremiumAccess) {
      setShowUpgradeDialog(true);
      event.target.value = '';
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse Excel data
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Map Excel data to task objects
        const importTasks = jsonData.map(row => {
          // Try to parse date (could be in different formats)
          let scheduledDate: Date | undefined;
          if (row['Data Agendada']) {
            try {
              scheduledDate = new Date(row['Data Agendada']);
              // Check if date is valid
              if (isNaN(scheduledDate.getTime())) {
                scheduledDate = undefined;
              }
            } catch (e) {
              scheduledDate = undefined;
            }
          }
          
          return {
            name: row['Nome'] || 'Tarefa Importada',
            description: row['Descrição'] || '',
            projectId: projectId,
            estimatedTime: row['Tempo Estimado (min)'] ? parseInt(row['Tempo Estimado (min)']) : 0,
            scheduledStartTime: scheduledDate || new Date(),
            completed: row['Concluída'] === 'Sim',
            priority: row['Prioridade'] || 'Média',
            userId: userId
          } as Omit<Task, 'id'>;
        });
        
        // Save imported tasks to database
        const savedTasks = await taskService.bulkImportTasks(importTasks);
        
        // Update parent component
        onTasksImported(savedTasks);
        
        toast({
          title: 'Importação concluída',
          description: `${savedTasks.length} tarefas foram importadas com sucesso.`,
        });
      };
      
      reader.onerror = () => {
        throw new Error('Erro na leitura do arquivo');
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar as tarefas.',
        variant: 'destructive',
      });
    }
    
    // Reset input field
    event.target.value = '';
  };
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex gap-1 items-center"
          onClick={handleExport}
        >
          {hasPremiumAccess ? (
            <FileDown className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span>Exportar</span>
        </Button>
        
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="flex gap-1 items-center"
            onClick={() => {
              if (!hasPremiumAccess) {
                setShowUpgradeDialog(true);
              } else {
                document.getElementById('file-upload')?.click();
              }
            }}
          >
            {hasPremiumAccess ? (
              <FileUp className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>Importar</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            disabled={!hasPremiumAccess}
          />
        </div>
      </div>
      
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recurso Premium</DialogTitle>
            <DialogDescription>
              A importação e exportação de tarefas são recursos disponíveis apenas para os planos Profissional e Enterprise.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Faça upgrade do seu plano para acessar recursos avançados como:
            </p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center text-sm gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Importação e exportação de tarefas</span>
              </li>
              <li className="flex items-center text-sm gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Relatórios avançados</span>
              </li>
              <li className="flex items-center text-sm gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Mais projetos</span>
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Depois
            </Button>
            <Button onClick={() => {
              setShowUpgradeDialog(false);
              window.location.href = '/configuracoes';
            }}>
              Ver planos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskImportExport;

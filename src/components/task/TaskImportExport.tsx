
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, FileDown, Lock, Check, AlertCircle, FileText } from 'lucide-react';
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
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateTaskTemplate, parseTasksFromExcel, mapExcelDataToTasks } from '@/utils/excelUtils';

interface TaskImportExportProps {
  projectId: string;
  tasks: Task[];
  userId: string;
  onTasksImported: (tasks: Task[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

const isPremiumPlan = (plan: string) => {
  return plan === 'pro' || plan === 'enterprise';
};

const TaskImportExport: React.FC<TaskImportExportProps> = ({ projectId, tasks, userId, onTasksImported }) => {
  const { toast } = useToast();
  const { currentPlan } = usePlan();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResultDialog, setShowImportResultDialog] = useState(false);
  
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
  
  const handleExportTemplate = () => {
    if (!hasPremiumAccess) {
      setShowUpgradeDialog(true);
      return;
    }
    
    try {
      // Generate template file using the utility
      const templateBlob = generateTaskTemplate();
      
      // Create URL for download
      const url = URL.createObjectURL(templateBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modelo_tarefas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Modelo exportado',
        description: 'O modelo de importação foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao exportar modelo:', error);
      toast({
        title: 'Erro na exportação do modelo',
        description: 'Não foi possível gerar o modelo de importação.',
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
      // Parse the uploaded Excel file
      const { data, errors: parseErrors } = await parseTasksFromExcel(file);
      
      // If there are parse errors, show them
      if (parseErrors.length > 0) {
        setImportResult({
          success: 0,
          failed: parseErrors.length,
          errors: parseErrors
        });
        setShowImportResultDialog(true);
        event.target.value = '';
        return;
      }
      
      // Map the Excel data to tasks and validate
      const { tasks: mappedTasks, errors: mappingErrors } = mapExcelDataToTasks(
        data, 
        state?.projects || [], 
        userId
      );
      
      // If there are mapping errors, show them
      if (mappingErrors.length > 0) {
        setImportResult({
          success: 0,
          failed: mappingErrors.length,
          errors: mappingErrors
        });
        setShowImportResultDialog(true);
        event.target.value = '';
        return;
      }
      
      // Save tasks if there are no errors
      if (mappedTasks.length > 0) {
        const savedTasks = await taskService.bulkImportTasks(mappedTasks);
        
        // Update parent component
        onTasksImported(savedTasks);
        
        // Show success result
        setImportResult({
          success: savedTasks.length,
          failed: 0,
          errors: []
        });
        setShowImportResultDialog(true);
      } else {
        // No tasks found in file
        setImportResult({
          success: 0,
          failed: 0,
          errors: [{ row: 0, message: 'Nenhuma tarefa encontrada no arquivo' }]
        });
        setShowImportResultDialog(true);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportResult({
        success: 0,
        failed: 1,
        errors: [{ row: 0, message: 'Erro ao processar o arquivo: formato inválido ou corrompido' }]
      });
      setShowImportResultDialog(true);
    }
    
    // Reset input field
    event.target.value = '';
  };
  
  // Group errors by row number for better display
  const groupedErrors = importResult?.errors.reduce<Record<number, string[]>>((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = [];
    }
    acc[error.row].push(error.message);
    return acc;
  }, {}) || {};
  
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
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
        
        <Button
          variant="outline"
          size="sm"
          className="flex gap-1 items-center"
          onClick={handleExportTemplate}
        >
          {hasPremiumAccess ? (
            <FileText className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span>Exportar Modelo</span>
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
      
      {/* Premium Feature Dialog */}
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
      
      {/* Import Results Dialog */}
      <AlertDialog open={showImportResultDialog} onOpenChange={setShowImportResultDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {importResult && importResult.failed === 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado da importação
            </AlertDialogTitle>
            <AlertDialogDescription>
              {importResult && (
                <div className="flex gap-4 mt-2">
                  <Badge variant={importResult.success > 0 ? "default" : "outline"} className="text-sm">
                    {importResult.success} tarefas importadas com sucesso
                  </Badge>
                  <Badge variant={importResult.failed > 0 ? "destructive" : "outline"} className="text-sm">
                    {importResult.failed} linhas com falhas
                  </Badge>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {importResult && importResult.errors.length > 0 && (
            <div className="py-4">
              <h4 className="text-sm font-medium mb-3">Detalhes dos erros encontrados:</h4>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Linha</TableHead>
                      <TableHead>Descrição do erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedErrors).map(([row, messages]) => (
                      <TableRow key={row}>
                        <TableCell className="font-medium">{row === "0" ? "-" : row}</TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {messages.map((message, index) => (
                              <li key={index}>{message}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <AlertDialogFooter className="mt-4">
            <Button onClick={() => setShowImportResultDialog(false)}>
              Fechar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskImportExport;

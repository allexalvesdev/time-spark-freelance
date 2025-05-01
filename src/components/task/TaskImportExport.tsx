import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import {
  generateTaskTemplate,
  parseTasksFromExcel,
  mapExcelDataToTasks,
  extractTagsFromExcel,
  getTagMappingsFromExcel,
  TaskImportTemplate,
} from '@/utils/excelUtils';
import { Badge } from "@/components/ui/badge";
import { Task } from '@/types';

const TaskImportExport: React.FC = () => {
  const { state, addTask, addTag, addTagToTask } = useAppContext();
  const { projects } = state;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importData, setImportData] = useState<TaskImportTemplate[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
  }>({ success: 0, failed: 0, errors: [] });
  
  // Handle template download
  const handleDownloadTemplate = () => {
    try {
      const blob = generateTaskTemplate();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modelo_importacao_tarefas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Modelo baixado',
        description: 'O modelo para importação foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o modelo.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      
      // Parse the Excel file
      const { data, errors } = await parseTasksFromExcel(file);
      
      if (errors.length > 0) {
        setResults({
          success: 0,
          failed: data.length,
          errors,
        });
        setShowResultDialog(true);
        setIsImporting(false);
        return;
      }
      
      // Validate mappings
      const { tasks, errors: mappingErrors } = mapExcelDataToTasks(data, projects, 'userId');
      
      if (mappingErrors.length > 0) {
        setResults({
          success: 0,
          failed: data.length,
          errors: mappingErrors,
        });
        setShowResultDialog(true);
        setIsImporting(false);
        return;
      }
      
      setImportData(data);
      await processImport(data, tasks);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao importar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Process the import
  const processImport = async (
    excelData: TaskImportTemplate[], 
    taskData: Omit<Task, 'id' | 'userId'>[]
  ) => {
    try {
      setProgress(0);
      let successCount = 0;
      let failedCount = 0;
      const errors: { row: number; message: string }[] = [];
      
      // Extract and create tags first
      const allTags = extractTagsFromExcel(excelData);
      const tagMappings = getTagMappingsFromExcel(excelData);
      
      // Create new tags if needed
      const tagMap = new Map<string, string>(); // name -> id
      
      for (const tagName of allTags) {
        try {
          // Check if tag already exists
          const existingTag = state.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
          
          if (existingTag) {
            tagMap.set(tagName.toLowerCase(), existingTag.id);
          } else {
            // Create new tag
            const newTag = await addTag(tagName);
            tagMap.set(tagName.toLowerCase(), newTag.id);
          }
        } catch (error) {
          console.error(`Error creating tag "${tagName}":`, error);
        }
      }
      
      // Now create tasks and associate tags
      for (let i = 0; i < taskData.length; i++) {
        try {
          // Create task
          const task = taskData[i];
          const newTask = await addTask(task);
          
          // Associate tags
          const rowTags = tagMappings[i].tags;
          for (const tagName of rowTags) {
            const tagId = tagMap.get(tagName.toLowerCase());
            if (tagId && newTask) {
              await addTagToTask(newTask.id, tagId);
            }
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error importing row ${i + 2}:`, error);
          errors.push({ row: i + 2, message: `Erro ao criar tarefa: ${error}` });
          failedCount++;
        }
        
        // Update progress
        setProgress(Math.floor(((i + 1) / taskData.length) * 100));
      }
      
      // Show results
      setResults({
        success: successCount,
        failed: failedCount,
        errors,
      });
      
      setShowResultDialog(true);
      
      // Show toast with summary
      if (successCount > 0 && failedCount === 0) {
        toast({
          title: 'Importação concluída',
          description: `${successCount} tarefas foram importadas com sucesso.`,
        });
      } else if (successCount > 0 && failedCount > 0) {
        toast({
          title: 'Importação parcial',
          description: `${successCount} tarefas importadas, ${failedCount} falhas.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Falha na importação',
          description: 'Nenhuma tarefa foi importada.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import processing error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar a importação.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Baixar modelo
        </Button>
        
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isImporting}
          />
          <Button 
            variant="default"
            className="flex items-center gap-2 w-full sm:w-auto"
            disabled={isImporting}
          >
            <Upload size={16} />
            {isImporting ? 'Importando...' : 'Importar tarefas'}
          </Button>
        </div>
      </div>
      
      {isImporting && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Importando tarefas...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultado da Importação</DialogTitle>
            <DialogDescription>
              Resumo do processamento da importação de tarefas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-4 text-center">
                <div className="flex justify-center items-center mb-2 text-green-500">
                  <Check size={20} />
                </div>
                <p className="text-sm font-medium">Sucesso</p>
                <p className="text-2xl font-bold">{results.success}</p>
              </div>
              
              <div className="border rounded-md p-4 text-center">
                <div className="flex justify-center items-center mb-2 text-red-500">
                  <X size={20} />
                </div>
                <p className="text-sm font-medium">Falhas</p>
                <p className="text-2xl font-bold">{results.failed}</p>
              </div>
            </div>
            
            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erros encontrados</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">Linha {error.row}:</span> {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskImportExport;

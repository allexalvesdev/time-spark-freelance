import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { BarChart2, FileText, Download, Check, X } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF, ConsolidatedReportPDF } from '@/components/ReportPDF';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDuration } from '@/utils/dateUtils';
import { ReportData } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';

const Reports: React.FC = () => {
  const { state } = useAppContext();
  const { projects, tasks } = state;
  const { toast } = useToast();
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData[] | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [open, setOpen] = useState(false);
  
  // Importar o hook customizado useReportGenerator
  const { generateReport, generateMultipleProjectsReport } = useReportGenerator();
  
  const handleGenerateReport = () => {
    if (selectedProjectIds.length === 0) {
      toast({
        title: "Nenhum projeto selecionado",
        description: "Por favor, selecione pelo menos um projeto para gerar o relatório.",
        variant: "destructive"
      });
      return;
    }

    const result = generateMultipleProjectsReport(selectedProjectIds, projects, tasks);
    
    if (result) {
      setReportData(result.reports);
      setTotalTime(result.totalTime);
      setTotalEarnings(result.totalEarnings);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: `Relatório para ${result.reports.length} projeto(s) foi gerado.`,
      });
    } else {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório para os projetos selecionados.",
        variant: "destructive"
      });
    }
  };
  
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectIds(prev => {
      // Se já está na lista, remover
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      }
      // Senão, adicionar
      return [...prev, projectId];
    });
  };
  
  const removeProject = (projectId: string) => {
    setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere relatórios detalhados de seus projetos
        </p>
      </div>
      
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Gerar Relatório</h2>
        
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-64">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedProjectIds.length > 0 
                      ? `${selectedProjectIds.length} projeto(s) selecionado(s)` 
                      : "Selecionar projetos"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full sm:w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Buscar projeto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {projects && projects.map(project => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => handleSelectProject(project.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProjectIds.includes(project.id) 
                                  ? "opacity-100" 
                                  : "opacity-0"
                              )}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button 
              onClick={handleGenerateReport}
              disabled={selectedProjectIds.length === 0}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              <span>Gerar Relatório</span>
            </Button>
          </div>
          
          {selectedProjectIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedProjectIds.map(id => {
                const project = projects.find(p => p.id === id);
                if (!project) return null;
                
                return (
                  <Badge 
                    key={id} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {project.name}
                    <button 
                      onClick={() => removeProject(id)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </Card>
      
      {!reportData ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <BarChart2 size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhum relatório gerado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Selecione um ou mais projetos e clique em "Gerar Relatório" para ver um resumo detalhado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumo consolidado */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resumo Consolidado</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de projetos</p>
                <p className="text-2xl font-bold">{reportData.length}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tempo total</p>
                <p className="text-2xl font-bold font-mono">
                  {formatDuration(totalTime)}
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ganhos totais</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nome do Projeto</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                  <TableHead className="text-right">Tempo Total</TableHead>
                  <TableHead className="text-right">Ganhos Totais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((report) => (
                  <TableRow key={report.projectId}>
                    <TableCell className="font-medium">{report.projectName}</TableCell>
                    <TableCell className="text-right">{report.tasks.length}</TableCell>
                    <TableCell className="text-right font-mono">{formatDuration(report.totalTime)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totalEarnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <TableRow>
                  <TableCell className="font-bold">Total Geral</TableCell>
                  <TableCell className="text-right font-bold">
                    {reportData.reduce((sum, report) => sum + report.tasks.length, 0)}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {formatDuration(totalTime)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalEarnings)}
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>

            {/* Botão para exportar PDF do relatório consolidado */}
            <div className="mt-6 flex justify-end">
              <PDFDownloadLink
                document={
                  <ConsolidatedReportPDF 
                    reports={reportData} 
                    totalTime={totalTime} 
                    totalEarnings={totalEarnings} 
                  />
                }
                fileName={`relatorio-consolidado.pdf`}
                className="inline-block"
              >
                {({ loading }) => (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    disabled={loading}
                  >
                    <Download size={16} />
                    <span>{loading ? "Gerando PDF..." : "Exportar PDF"}</span>
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </Card>

          {/* Detalhes por projeto */}
          <Accordion type="single" collapsible className="space-y-4">
            {reportData.map((report) => (
              <AccordionItem 
                key={report.projectId} 
                value={report.projectId}
                className="border rounded-lg p-2"
              >
                <AccordionTrigger className="px-4">
                  <div className="flex flex-1 justify-between items-center">
                    <span className="font-semibold">{report.projectName}</span>
                    <div className="flex items-center gap-4 mr-4">
                      <span className="text-sm text-muted-foreground">
                        {report.tasks.length} tarefas
                      </span>
                      <span className="text-sm font-mono">
                        {formatDuration(report.totalTime)}
                      </span>
                      <span className="text-sm">
                        {formatCurrency(report.totalEarnings)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border-b py-2 px-4 text-left">Nome da Tarefa</th>
                          <th className="border-b py-2 px-4 text-right">Tempo Gasto</th>
                          <th className="border-b py-2 px-4 text-right">Ganhos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tasks.map((task) => (
                          <tr key={task.id}>
                            <td className="border-b py-3 px-4">{task.name}</td>
                            <td className="border-b py-3 px-4 text-right font-mono">
                              {formatDuration(task.timeSpent)}
                            </td>
                            <td className="border-b py-3 px-4 text-right">
                              {formatCurrency(task.earnings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <PDFDownloadLink
                      document={<ReportPDF data={report} />}
                      fileName={`relatorio-${report.projectName}.pdf`}
                      className="inline-block"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2" 
                          disabled={loading}
                        >
                          <Download size={16} />
                          <span>{loading ? "Gerando..." : "PDF"}</span>
                        </Button>
                      )}
                    </PDFDownloadLink>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default Reports;

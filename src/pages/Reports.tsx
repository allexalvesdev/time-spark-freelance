
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { BarChart2, FileText, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from '@/components/ReportPDF';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDuration } from '@/utils/dateUtils';
import { ReportData, Project } from '@/types';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports: React.FC = () => {
  const { state, generateReport } = useAppContext();
  const { projects } = state;
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Manipular seleção/desseleção de projetos
  const handleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  // Selecionar todos os projetos
  const handleSelectAll = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(project => project.id));
    }
  };
  
  // Gerar relatório para múltiplos projetos
  const handleGenerateReport = () => {
    if (selectedProjectIds.length > 0) {
      // Gerar relatório usando o hook useReportGenerator
      const report = generateReport(selectedProjectIds);
      setReportData(report);
    }
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
        <p className="text-muted-foreground mb-4">
          Selecione um ou mais projetos para gerar um relatório consolidado.
        </p>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Checkbox 
              id="select-all" 
              checked={selectedProjectIds.length === projects.length && projects.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="ml-2 font-medium">
              {selectedProjectIds.length === projects.length && projects.length > 0 
                ? "Desmarcar todos" 
                : "Selecionar todos"}
            </label>
          </div>
        </div>
        
        <div className="border rounded-md mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome do Projeto</TableHead>
                <TableHead>Taxa Horária</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Nenhum projeto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Checkbox 
                        id={`project-${project.id}`}
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={() => handleProjectSelection(project.id)}
                      />
                    </TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{formatCurrency(project.hourlyRate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <Button 
          onClick={handleGenerateReport}
          disabled={selectedProjectIds.length === 0}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          <span>Gerar Relatório</span>
        </Button>
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
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {reportData.projects.length === 1 
                    ? `Relatório: ${reportData.projects[0].projectName}`
                    : `Relatório Consolidado (${reportData.projects.length} projetos)`}
                </h2>
                <p className="text-muted-foreground">
                  {reportData.projects.length === 1 
                    ? `Taxa horária: ${formatCurrency(reportData.projects[0].hourlyRate)}`
                    : `${reportData.projects.length} projetos selecionados`}
                </p>
              </div>
              <PDFDownloadLink
                document={<ReportPDF data={reportData} />}
                fileName={`relatorio-${reportData.projects.length === 1 ? reportData.projects[0].projectName : 'multiprojetos'}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" className="flex items-center gap-2" disabled={loading}>
                    <Download size={16} />
                    <span>{loading ? "Gerando PDF..." : "Exportar PDF"}</span>
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de projetos</p>
                <p className="text-2xl font-bold">{reportData.projects.length}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tempo total</p>
                <p className="text-2xl font-bold font-mono">
                  {formatDuration(reportData.totalTime)}
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ganhos totais</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.totalEarnings)}
                </p>
              </div>
            </div>
            
            {reportData.projects.map((projectReport, index) => (
              <div key={projectReport.projectId} className="mb-8">
                <h3 className="text-lg font-medium mb-4">
                  {projectReport.projectName} 
                  <span className="ml-2 text-muted-foreground text-sm">
                    ({formatDuration(projectReport.totalTime)} | {formatCurrency(projectReport.totalEarnings)})
                  </span>
                </h3>
                
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
                      {projectReport.tasks.map((task) => (
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
                    <tfoot>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Total do Projeto</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {formatDuration(projectReport.totalTime)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(projectReport.totalEarnings)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {index < reportData.projects.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
            
            {reportData.projects.length > 1 && (
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Resumo Geral</h4>
                <div className="flex flex-col md:flex-row justify-between">
                  <p>Total de projetos: <span className="font-medium">{reportData.projects.length}</span></p>
                  <p>Tempo total: <span className="font-medium font-mono">{formatDuration(reportData.totalTime)}</span></p>
                  <p>Ganhos totais: <span className="font-medium">{formatCurrency(reportData.totalEarnings)}</span></p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;

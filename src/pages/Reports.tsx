
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
import { ReportData } from '@/types';

const Reports: React.FC = () => {
  const { state, generateReport } = useAppContext();
  const { projects, tasks } = state;  
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const handleGenerateReport = () => {
    if (selectedProjectId) {
      const report = generateReport(selectedProjectId, projects, tasks);
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
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleGenerateReport}
            disabled={!selectedProjectId}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            <span>Gerar Relatório</span>
          </Button>
        </div>
      </Card>
      
      {!reportData ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <BarChart2 size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium">Nenhum relatório gerado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Selecione um projeto e clique em "Gerar Relatório" para ver um resumo detalhado.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">{reportData.projectName}</h2>
                <p className="text-muted-foreground">
                  Taxa horária: {formatCurrency(reportData.hourlyRate)}
                </p>
              </div>
              <PDFDownloadLink
                document={<ReportPDF data={reportData} />}
                fileName={`relatorio-${reportData.projectName}.pdf`}
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
                <p className="text-sm text-muted-foreground mb-1">Total de tarefas</p>
                <p className="text-2xl font-bold">{reportData.tasks.length}</p>
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
            
            <h3 className="text-lg font-medium mb-4">Detalhes por Tarefa</h3>
            
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
                  {reportData.tasks.map((task) => (
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
                    <td className="py-3 px-4 font-semibold">Total</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatDuration(reportData.totalTime)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(reportData.totalEarnings)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;

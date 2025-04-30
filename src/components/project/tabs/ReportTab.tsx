
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Project, ReportData } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, formatDuration } from '@/utils/dateUtils';

interface ReportTabProps {
  project: Project;
  reportData: ReportData | null;
  onGenerateReport: () => void;
}

const ReportTab: React.FC<ReportTabProps> = ({ project, reportData, onGenerateReport }) => {
  const isMobile = useIsMobile();
  
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h2 className="text-lg font-medium">Relatório do Projeto</h2>
        <Button 
          onClick={onGenerateReport}
          className="flex items-center gap-2"
          size={isMobile ? "sm" : "default"}
        >
          <FileText size={16} />
          <span>Gerar Relatório</span>
        </Button>
      </div>
      
      {!reportData ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <FileText size={48} className="text-muted-foreground" />
          <h2 className="text-xl font-medium">Nenhum relatório gerado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Clique em "Gerar Relatório" para ver um resumo detalhado do projeto.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="p-4 md:p-6">
            <h3 className="text-xl font-semibold mb-2">{reportData.projectName}</h3>
            <p className="text-muted-foreground mb-6">
              Taxa horária: {formatCurrency(reportData.hourlyRate)}
            </p>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-4">Tarefas</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b py-2 px-4 text-left">Nome</th>
                        <th className="border-b py-2 px-4 text-right">Tempo</th>
                        <th className="border-b py-2 px-4 text-right">Valor</th>
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
              
              <Separator />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-medium">Resumo</h4>
                  <p className="text-sm text-muted-foreground">
                    Total de tarefas: {reportData.tasks.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total ganho</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(reportData.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTab;

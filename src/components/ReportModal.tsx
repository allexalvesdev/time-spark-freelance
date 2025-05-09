
import React from "react";
import { Project, ReportData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDuration, formatCurrency } from "@/utils/dateUtils";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReportPDF } from "./ReportPDF";
import { FileText, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData;
  project: Project;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  report,
  project,
}) => {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Relatório: {project.name}</span>
            <PDFDownloadLink
              document={<ReportPDF data={report} />}
              fileName={`relatorio-${project.name}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Gerando PDF..." : "Exportar PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Tempo Total</p>
            <p className="text-xl font-bold font-mono">{formatDuration(report.totalTime)}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Ganhos</p>
            <p className="text-xl font-bold">{formatCurrency(report.totalEarnings)}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Taxa Horária</p>
            <p className="text-xl font-bold">{formatCurrency(project.hourlyRate)}</p>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {report.projects.map((projectReport, index) => (
            <div key={projectReport.projectId} className="mb-4">
              <h3 className="text-lg font-medium mb-2">{projectReport.projectName}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectReport.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{formatDuration(task.timeSpent)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(task.earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {index < report.projects.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;

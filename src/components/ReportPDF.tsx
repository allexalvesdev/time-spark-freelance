
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666'
  },
  projectName: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    minHeight: 30,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0'
  },
  tableCell: {
    padding: 8,
    fontSize: 10
  },
  nameCell: {
    width: '25%',
    padding: 8,
    fontSize: 10
  },
  timeCell: {
    width: '15%',
    padding: 8,
    fontSize: 10
  },
  dateCell: {
    width: '20%',
    padding: 8,
    fontSize: 10
  },
  valueCell: {
    width: '15%',
    padding: 8,
    fontSize: 10
  },
  descriptionCell: {
    width: '25%',
    padding: 8,
    fontSize: 10
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  description: {
    fontSize: 10,
    color: '#555',
    marginTop: 2
  },
  taskSection: {
    marginVertical: 5
  },
  projectDivider: {
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'dashed'
  },
  consolidatedSummary: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderStyle: 'solid'
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  }
});

interface SingleReportPDFProps {
  data: ReportData;
}

interface ConsolidatedReportPDFProps {
  reports: ReportData[];
  totalTime: number;
  totalEarnings: number;
}

const formatTimeForPDF = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDateForPDF = (date: Date | undefined): string => {
  if (!date) return "Não definido";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

// Componente para um projeto individual
const SingleProjectReport = ({ data }: SingleReportPDFProps) => (
  <>
    <Text style={styles.projectName}>{data.projectName}</Text>

    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={styles.nameCell}>Tarefa</Text>
        <Text style={styles.dateCell}>Início</Text>
        <Text style={styles.dateCell}>Fim</Text>
        <Text style={styles.timeCell}>Tempo Total</Text>
        <Text style={styles.valueCell}>Valor</Text>
      </View>
      {data.tasks.map((task) => (
        <View key={task.id} style={styles.tableRow}>
          <View style={styles.nameCell}>
            <Text>{task.name}</Text>
            <Text style={styles.description}>{task.description || "Sem descrição"}</Text>
          </View>
          <Text style={styles.dateCell}>{formatDateForPDF(task.startTime)}</Text>
          <Text style={styles.dateCell}>{formatDateForPDF(task.endTime)}</Text>
          <Text style={styles.timeCell}>{formatTimeForPDF(task.timeSpent)}</Text>
          <Text style={styles.valueCell}>R$ {task.earnings.toFixed(2)}</Text>
        </View>
      ))}
    </View>

    <View style={styles.summary}>
      <Text>Projeto: {data.projectName}</Text>
      <Text>Total de Tarefas: {data.tasks.length}</Text>
      <Text>Tempo Total: {formatTimeForPDF(data.totalTime)}</Text>
      <Text>Ganhos Totais: R$ {data.totalEarnings.toFixed(2)}</Text>
    </View>
  </>
);

// Componente para o relatório de um único projeto
export const ReportPDF = ({ data }: SingleReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Projeto</Text>
      <SingleProjectReport data={data} />
    </Page>
  </Document>
);

// Novo componente para o relatório consolidado de múltiplos projetos
export const ConsolidatedReportPDF = ({ reports, totalTime, totalEarnings }: ConsolidatedReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório Consolidado</Text>
      <Text style={styles.subtitle}>Total de {reports.length} projetos</Text>
      
      {/* Resumo geral no topo */}
      <View style={styles.consolidatedSummary}>
        <Text style={styles.summaryTitle}>Resumo Geral</Text>
        <Text>Total de Projetos: {reports.length}</Text>
        <Text>Total de Tarefas: {reports.reduce((sum, report) => sum + report.tasks.length, 0)}</Text>
        <Text>Tempo Total: {formatTimeForPDF(totalTime)}</Text>
        <Text>Ganhos Totais: R$ {totalEarnings.toFixed(2)}</Text>
      </View>
      
      {/* Detalhes de cada projeto */}
      {reports.map((report, index) => (
        <View key={report.projectId}>
          {index > 0 && <View style={styles.projectDivider} />}
          <SingleProjectReport data={report} />
        </View>
      ))}
    </Page>
  </Document>
);

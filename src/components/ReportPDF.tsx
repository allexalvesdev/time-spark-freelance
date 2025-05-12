
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
    marginBottom: 10,
    color: '#333333'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#555555'
  },
  projectName: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#444444',
    borderBottom: '1px solid #dddddd',
    paddingBottom: 5
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
    fontSize: 10,
    textAlign: 'right'
  },
  dateCell: {
    width: '20%',
    padding: 8,
    fontSize: 10
  },
  valueCell: {
    width: '15%',
    padding: 8,
    fontSize: 10,
    textAlign: 'right'
  },
  descriptionCell: {
    width: '25%',
    padding: 8,
    fontSize: 10
  },
  summary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  summaryLabel: {
    fontSize: 10,
    color: '#555',
    fontWeight: 'bold'
  },
  summaryValue: {
    fontSize: 10,
    textAlign: 'right'
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
    marginTop: 20,
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderStyle: 'solid'
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333'
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#555555'
  },
  summaryItemValue: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#777777',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    borderTopStyle: 'solid'
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

const formatCurrencyForPDF = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
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
            {task.description && <Text style={styles.description}>{task.description}</Text>}
          </View>
          <Text style={styles.dateCell}>{formatDateForPDF(task.startTime)}</Text>
          <Text style={styles.dateCell}>{formatDateForPDF(task.endTime)}</Text>
          <Text style={styles.timeCell}>{formatTimeForPDF(task.timeSpent)}</Text>
          <Text style={styles.valueCell}>{formatCurrencyForPDF(task.earnings)}</Text>
        </View>
      ))}
    </View>

    <View style={styles.summary}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Projeto:</Text>
        <Text style={styles.summaryValue}>{data.projectName}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total de Tarefas:</Text>
        <Text style={styles.summaryValue}>{data.tasks.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tempo Total:</Text>
        <Text style={styles.summaryValue}>{formatTimeForPDF(data.totalTime)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Ganhos Totais:</Text>
        <Text style={styles.summaryValue}>{formatCurrencyForPDF(data.totalEarnings)}</Text>
      </View>
    </View>
  </>
);

// Componente para o relatório de um único projeto
export const ReportPDF = ({ data }: SingleReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Projeto</Text>
      <Text style={styles.subtitle}>{data.projectName}</Text>
      <SingleProjectReport data={data} />
      
      <View style={styles.footer}>
        <Text>Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</Text>
      </View>
    </Page>
  </Document>
);

// Componente para o relatório consolidado de múltiplos projetos
export const ConsolidatedReportPDF = ({ reports, totalTime, totalEarnings }: ConsolidatedReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório Consolidado</Text>
      <Text style={styles.subtitle}>Total de {reports.length} projetos</Text>
      
      {/* Resumo geral no topo */}
      <View style={styles.consolidatedSummary}>
        <Text style={styles.summaryTitle}>Resumo Geral</Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>Total de Projetos:</Text>
          <Text style={styles.summaryItemValue}>{reports.length}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>Total de Tarefas:</Text>
          <Text style={styles.summaryItemValue}>
            {reports.reduce((sum, report) => sum + report.tasks.length, 0)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>Tempo Total:</Text>
          <Text style={styles.summaryItemValue}>{formatTimeForPDF(totalTime)}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemLabel}>Ganhos Totais:</Text>
          <Text style={styles.summaryItemValue}>{formatCurrencyForPDF(totalEarnings)}</Text>
        </View>
      </View>
      
      {/* Detalhes de cada projeto */}
      {reports.map((report, index) => (
        <View key={report.projectId}>
          {index > 0 && <View style={styles.projectDivider} />}
          <SingleProjectReport data={report} />
        </View>
      ))}
      
      <View style={styles.footer}>
        <Text>Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</Text>
      </View>
    </Page>
  </Document>
);

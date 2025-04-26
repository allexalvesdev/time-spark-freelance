
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 10
  },
  projectName: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#666'
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
    flex: 1,
    padding: 8
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9'
  }
});

interface ReportPDFProps {
  data: ReportData;
}

const formatTimeForPDF = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ReportPDF = ({ data }: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Projeto</Text>
      <Text style={styles.projectName}>{data.projectName}</Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Tarefa</Text>
          <Text style={styles.tableCell}>Tempo</Text>
          <Text style={styles.tableCell}>Valor</Text>
        </View>
        {data.tasks.map((task) => (
          <View key={task.id} style={styles.tableRow}>
            <Text style={styles.tableCell}>{task.name}</Text>
            <Text style={styles.tableCell}>{formatTimeForPDF(task.timeSpent)}</Text>
            <Text style={styles.tableCell}>R$ {task.earnings.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <Text>Projeto: {data.projectName}</Text>
        <Text>Total de Tarefas: {data.tasks.length}</Text>
        <Text>Tempo Total: {formatTimeForPDF(data.totalTime)}</Text>
        <Text>Ganhos Totais: R$ {data.totalEarnings.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

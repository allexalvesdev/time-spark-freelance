
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportData } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 20
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

export const ReportPDF = ({ data }: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{data.projectName}</Text>
      <Text style={styles.subtitle}>Relatório de Projeto</Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Tarefa</Text>
          <Text style={styles.tableCell}>Tempo</Text>
          <Text style={styles.tableCell}>Valor</Text>
        </View>
        {data.tasks.map((task) => (
          <View key={task.id} style={styles.tableRow}>
            <Text style={styles.tableCell}>{task.name}</Text>
            <Text style={styles.tableCell}>{task.timeSpent} segundos</Text>
            <Text style={styles.tableCell}>R$ {task.earnings.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <Text>Total de Tarefas: {data.tasks.length}</Text>
        <Text>Tempo Total: {data.totalTime} segundos</Text>
        <Text>Ganhos Totais: R$ {data.totalEarnings.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);


import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportData, ProjectReportData } from "@/types";
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
  projectName: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
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
  projectSummary: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  totalSummary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    fontWeight: 'bold'
  },
  description: {
    fontSize: 10,
    color: '#555',
    marginTop: 2
  },
  taskSection: {
    marginVertical: 5
  },
  projectSeparator: {
    marginVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderTopStyle: 'dashed'
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

const formatDateForPDF = (date: Date | undefined): string => {
  if (!date) return "Não definido";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

const ProjectReport = ({ project }: { project: ProjectReportData }) => (
  <View>
    <Text style={styles.projectName}>{project.projectName}</Text>

    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={styles.nameCell}>Tarefa</Text>
        <Text style={styles.dateCell}>Início</Text>
        <Text style={styles.dateCell}>Fim</Text>
        <Text style={styles.timeCell}>Tempo Total</Text>
        <Text style={styles.valueCell}>Valor</Text>
      </View>
      {project.tasks.map((task) => (
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

    <View style={styles.projectSummary}>
      <Text>Projeto: {project.projectName}</Text>
      <Text>Total de Tarefas: {project.tasks.length}</Text>
      <Text>Tempo Total: {formatTimeForPDF(project.totalTime)}</Text>
      <Text>Ganhos Totais: R$ {project.totalEarnings.toFixed(2)}</Text>
    </View>
  </View>
);

export const ReportPDF = ({ data }: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Projetos</Text>
      <Text style={styles.subtitle}>
        {data.projects.length === 1 
          ? "Detalhes de 1 projeto" 
          : `Detalhes de ${data.projects.length} projetos`}
      </Text>

      {data.projects.map((project, index) => (
        <View key={project.projectId}>
          <ProjectReport project={project} />
          {index < data.projects.length - 1 && <View style={styles.projectSeparator} />}
        </View>
      ))}

      <View style={styles.totalSummary}>
        <Text>Resumo Geral:</Text>
        <Text>Total de Projetos: {data.projects.length}</Text>
        <Text>Total de Tarefas: {data.projects.reduce((sum, project) => sum + project.tasks.length, 0)}</Text>
        <Text>Tempo Total: {formatTimeForPDF(data.totalTime)}</Text>
        <Text>Ganhos Totais: R$ {data.totalEarnings.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

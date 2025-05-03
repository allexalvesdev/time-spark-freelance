
import React from 'react';
import { TeamMember } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';

interface MemberListProps {
  teamId: string;
  onEditMember: (member: TeamMember) => void;
  onDeleteMember: (memberId: string) => void;
}

const MemberList: React.FC<MemberListProps> = ({
  teamId,
  onEditMember,
  onDeleteMember,
}) => {
  const { state } = useAppContext();
  const members = state.teamMembers.filter(m => m.teamId === teamId);

  if (members.length === 0) {
    return (
      <div className="text-center p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-medium">Nenhum membro encontrado</h3>
        <p className="text-muted-foreground mt-2">
          Adicione membros à sua equipe para começar a delegar tarefas.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Função</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>{member.userEmail}</TableCell>
            <TableCell>
              <span className="capitalize">{member.role}</span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditMember(member)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onDeleteMember(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MemberList;

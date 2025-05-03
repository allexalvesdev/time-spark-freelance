
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { usePlan } from '@/contexts/PlanContext';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TeamList from '@/components/team/TeamList';
import MemberList from '@/components/team/MemberList';
import TeamDialog from '@/components/team/TeamDialog';
import MemberDialog from '@/components/team/MemberDialog';
import { Team, TeamMember } from '@/types';

const Teams: React.FC = () => {
  const { state, deleteTeam, deleteTeamMember } = useAppContext();
  const { currentPlan } = usePlan();
  const navigate = useNavigate();

  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>(undefined);
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>(undefined);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

  // Verificar se o usuário tem plano Enterprise
  const isEnterpriseUser = currentPlan === 'enterprise';

  if (!isEnterpriseUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Users size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-medium">Funcionalidade Exclusiva</h2>
        <p className="text-muted-foreground text-center max-w-md">
          A gestão de equipes está disponível apenas para o plano Enterprise.
          Faça upgrade do seu plano para acessar este recurso.
        </p>
        <Button 
          variant="outline"
          onClick={() => navigate('/configuracoes')}
        >
          Ver Planos
        </Button>
      </div>
    );
  }

  const handleOpenTeamDialog = (team?: Team) => {
    setSelectedTeam(team);
    setIsTeamDialogOpen(true);
  };

  const handleOpenMemberDialog = (member?: TeamMember) => {
    setSelectedMember(member);
    setIsMemberDialogOpen(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    setSelectedTeam(state.teams.find(team => team.id === teamId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMember = (memberId: string) => {
    setSelectedMember(state.teamMembers.find(member => member.id === memberId));
    setIsDeleteMemberDialogOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (selectedTeam) {
      await deleteTeam(selectedTeam.id);
      setViewingTeamId(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const confirmDeleteMember = async () => {
    if (selectedMember) {
      await deleteTeamMember(selectedMember.id);
    }
    setIsDeleteMemberDialogOpen(false);
  };

  const viewTeamMembers = (teamId: string) => {
    setViewingTeamId(teamId);
    setSelectedTeam(state.teams.find(team => team.id === teamId));
  };

  const backToTeamsList = () => {
    setViewingTeamId(null);
    setSelectedTeam(undefined);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {viewingTeamId 
              ? `Membros da Equipe: ${selectedTeam?.name}`
              : 'Equipes'}
          </h1>
          <p className="text-muted-foreground">
            {viewingTeamId
              ? 'Gerencie os membros da sua equipe'
              : 'Gerencie suas equipes e seus membros'}
          </p>
        </div>
        
        {viewingTeamId ? (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={backToTeamsList}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Button>
            
            <Button 
              onClick={() => handleOpenMemberDialog()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Novo Membro</span>
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleOpenTeamDialog()}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Nova Equipe</span>
          </Button>
        )}
      </div>
      
      {viewingTeamId ? (
        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
            <CardDescription>
              Gerencie os membros da sua equipe e suas funções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberList 
              teamId={viewingTeamId}
              onEditMember={handleOpenMemberDialog}
              onDeleteMember={handleDeleteMember}
            />
          </CardContent>
        </Card>
      ) : (
        <TeamList
          onEditTeam={handleOpenTeamDialog}
          onDeleteTeam={handleDeleteTeam}
          onViewMembers={viewTeamMembers}
        />
      )}
      
      {/* Diálogos */}
      <TeamDialog 
        isOpen={isTeamDialogOpen} 
        onClose={() => setIsTeamDialogOpen(false)} 
        team={selectedTeam}
      />
      
      {viewingTeamId && (
        <MemberDialog
          isOpen={isMemberDialogOpen}
          onClose={() => setIsMemberDialogOpen(false)}
          teamId={viewingTeamId}
          member={selectedMember}
        />
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a equipe "{selectedTeam?.name}"?
              Todos os membros associados também serão removidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isDeleteMemberDialogOpen} onOpenChange={setIsDeleteMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{selectedMember?.name}" da equipe?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teams;

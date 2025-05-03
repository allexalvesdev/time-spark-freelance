
import React from 'react';
import { Team } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';

interface TeamListProps {
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onViewMembers: (teamId: string) => void;
}

const TeamList: React.FC<TeamListProps> = ({ onEditTeam, onDeleteTeam, onViewMembers }) => {
  const { state } = useAppContext();
  const { teams } = state;

  if (teams.length === 0) {
    return (
      <div className="text-center p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-medium">Nenhuma equipe encontrada</h3>
        <p className="text-muted-foreground mt-2">
          Crie sua primeira equipe para começar a gerenciar seu time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <Card key={team.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>
              {team.description || 'Sem descrição'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {state.teamMembers.filter(m => m.teamId === team.id).length} membros
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewMembers(team.id)}
            >
              Ver Membros
            </Button>
            <div className="space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEditTeam(team)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive" 
                onClick={() => onDeleteTeam(team.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default TeamList;

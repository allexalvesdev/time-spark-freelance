
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ListTodo, 
  Calendar, 
  Settings,
  Users
} from 'lucide-react';
import { usePlan } from '@/contexts/PlanContext';

const MobileNavigation: React.FC = () => {
  const { currentPlan } = usePlan();
  
  // Verificar se o usuário tem plano Enterprise
  const isEnterpriseUser = currentPlan === 'enterprise';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-10 md:hidden">
      <div className="flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-3 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <HomeIcon size={20} />
          <span className="text-xs mt-1">Início</span>
        </NavLink>
        
        <NavLink
          to="/tarefas"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-3 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <ListTodo size={20} />
          <span className="text-xs mt-1">Tarefas</span>
        </NavLink>
        
        <NavLink
          to="/agenda"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-3 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <Calendar size={20} />
          <span className="text-xs mt-1">Agenda</span>
        </NavLink>
        
        {/* Mostrar opção de Equipes apenas para usuários Enterprise */}
        {isEnterpriseUser && (
          <NavLink
            to="/equipes"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center py-3 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <Users size={20} />
            <span className="text-xs mt-1">Equipes</span>
          </NavLink>
        )}
        
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-3 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Config</span>
        </NavLink>
      </div>
    </div>
  );
};

export default MobileNavigation;

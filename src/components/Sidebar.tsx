
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  HomeIcon, 
  Settings, 
  ListTodo, 
  BarChart3, 
  PlusSquare,
  Users 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarHeader,
  Sidebar as SidebarComponent
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { currentPlan } = usePlan();
  
  // Verificar se o usuário tem plano Enterprise
  const isEnterpriseUser = currentPlan === 'enterprise';
  
  return (
    <SidebarComponent className="h-full w-64 border-r border-border bg-background hidden md:block">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-archivo-black">
          Focusly<span className="text-primary">.</span>
        </h2>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <HomeIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Novo Projeto">
              <NavLink 
                to="/novo-projeto" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <PlusSquare className="h-5 w-5" />
                <span>Novo Projeto</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Agenda">
              <NavLink 
                to="/agenda" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <Calendar className="h-5 w-5" />
                <span>Agenda</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Tarefas">
              <NavLink 
                to="/tarefas" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <ListTodo className="h-5 w-5" />
                <span>Tarefas</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Relatórios">
              <NavLink 
                to="/relatorios" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <BarChart3 className="h-5 w-5" />
                <span>Relatórios</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Mostrar opção de Equipes apenas para usuários Enterprise */}
          {isEnterpriseUser && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Equipes">
                <NavLink 
                  to="/equipes" 
                  className={({isActive}) => 
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }
                >
                  <Users className="h-5 w-5" />
                  <span>Equipes</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações">
              <NavLink 
                to="/configuracoes" 
                className={({isActive}) => 
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
        <ThemeToggle />
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          Sair
        </Button>
      </div>
    </SidebarComponent>
  );
}

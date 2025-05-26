
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';

import { AuthProvider } from '@/contexts/AuthContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { AppContextProvider } from '@/contexts/AppContext';

import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import NewProject from '@/pages/NewProject';
import ProjectDetails from '@/pages/ProjectDetails';
import Tasks from '@/pages/Tasks';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import Agenda from '@/pages/Agenda';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <PlanProvider>
                <AppContextProvider>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/index" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/*" element={
                      <Layout>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/novo-projeto" element={<NewProject />} />
                          <Route path="/projeto/:id" element={<ProjectDetails />} />
                          <Route path="/tarefas" element={<Tasks />} />
                          <Route path="/agenda" element={<Agenda />} />
                          <Route path="/relatorios" element={<Reports />} />
                          <Route path="/configuracoes" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    } />
                  </Routes>
                </AppContextProvider>
              </PlanProvider>
            </AuthProvider>
          </Router>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

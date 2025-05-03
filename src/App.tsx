
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import Layout from '@/components/Layout';
import SplashScreen from '@/components/SplashScreen';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Agenda from '@/pages/Agenda';
import Settings from '@/pages/Settings';
import Teams from '@/pages/Teams';
import Reports from '@/pages/Reports';
import NewProject from '@/pages/NewProject';
import ProjectDetails from '@/pages/ProjectDetails';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import AcceptInvitation from '@/pages/AcceptInvitation';
import './App.css';

function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <SplashScreen onFinished={() => setSplashFinished(true)} />;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="focusly-theme">
      <Router>
        <AuthProvider>
          <PlanProvider>
            <AppProvider>
              <SidebarProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/index" element={<Index />} />
                  <Route path="/convite" element={<AcceptInvitation />} />

                  {/* Rotas protegidas */}
                  <Route path="/dashboard" element={
                    <Layout>
                      <Dashboard />
                    </Layout>
                  } />
                  <Route path="/tarefas" element={
                    <Layout>
                      <Tasks />
                    </Layout>
                  } />
                  <Route path="/agenda" element={
                    <Layout>
                      <Agenda />
                    </Layout>
                  } />
                  <Route path="/configuracoes" element={
                    <Layout>
                      <Settings />
                    </Layout>
                  } />
                  <Route path="/equipes" element={
                    <Layout>
                      <Teams />
                    </Layout>
                  } />
                  <Route path="/relatorios" element={
                    <Layout>
                      <Reports />
                    </Layout>
                  } />
                  <Route path="/novo-projeto" element={
                    <Layout>
                      <NewProject />
                    </Layout>
                  } />
                  <Route path="/projeto/:id" element={
                    <Layout>
                      <ProjectDetails />
                    </Layout>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </SidebarProvider>
            </AppProvider>
          </PlanProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

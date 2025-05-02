
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NewProject from "@/pages/NewProject";
import ProjectDetails from "@/pages/ProjectDetails";
import Agenda from "@/pages/Agenda";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "@/pages/Landing";
import MobileNavigation from "@/components/MobileNavigation";
import Index from "./pages/Index";
import { usePlatform } from "@/hooks/use-platform";

// PrivateRoute component needs to be defined outside of the App component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

// RootPage component to handle the initial routing based on platform
const RootPage = () => {
  const { isNative } = usePlatform();
  const { user } = useAuth();
  
  // Para aplicativos nativos, sempre redirecionar para auth ou dashboard
  if (isNative) {
    return <Navigate to={user ? "/dashboard" : "/auth"} />;
  }
  
  // Para web, mostrar a página inicial
  return <Landing />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SidebarProvider>
          <AuthProvider>
            <PlanProvider>
              <AppProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<RootPage />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/novo-projeto"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <NewProject />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/projeto/:projectId"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <ProjectDetails />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/agenda"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <Agenda />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/tarefas"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <Tasks />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/relatorios"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <Reports />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/configuracoes"
                      element={
                        <PrivateRoute>
                          <Layout>
                            <Settings />
                          </Layout>
                        </PrivateRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <MobileNavigation />
                </TooltipProvider>
              </AppProvider>
            </PlanProvider>
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

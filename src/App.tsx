
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import NewProject from "@/pages/NewProject";
import ProjectDetails from "@/pages/ProjectDetails";
import Agenda from "@/pages/Agenda";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/novo-projeto" element={<NewProject />} />
              <Route path="/projeto/:projectId" element={<ProjectDetails />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/tarefas" element={<Tasks />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

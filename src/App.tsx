
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/Admin";
import AdminAppointments from "./pages/AdminAppointments";
import AdminStaff from "./pages/AdminStaff";
import AdminClients from "./pages/AdminClients";
import AdminProducts from "./pages/AdminProducts";
import AdminFinance from "./pages/AdminFinance";
import AdminMarketing from "./pages/AdminMarketing";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSupport from "./pages/AdminSupport";
import AdminSettings from "./pages/AdminSettings";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/agendamentos" element={<AdminAppointments />} />
            <Route path="/admin/profissionais" element={<AdminStaff />} />
            <Route path="/admin/clientes" element={<AdminClients />} />
            <Route path="/admin/produtos" element={<AdminProducts />} />
            <Route path="/admin/financeiro" element={<AdminFinance />} />
            <Route path="/admin/marketing" element={<AdminMarketing />} />
            <Route path="/admin/relatorios" element={<AdminAnalytics />} />
            <Route path="/admin/suporte" element={<AdminSupport />} />
            <Route path="/admin/configuracoes" element={<AdminSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;

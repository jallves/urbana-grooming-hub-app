
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
import Auth from "./pages/Auth";
import AdminRoute from "./components/auth/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/theme-provider";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Garantir que a rota de autenticação seja pública */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Rotas protegidas de admin */}
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/admin/agendamentos" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
              <Route path="/admin/profissionais" element={<AdminRoute><AdminStaff /></AdminRoute>} />
              <Route path="/admin/clientes" element={<AdminRoute><AdminClients /></AdminRoute>} />
              <Route path="/admin/produtos" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/financeiro" element={<AdminRoute><AdminFinance /></AdminRoute>} />
              <Route path="/admin/marketing" element={<AdminRoute><AdminMarketing /></AdminRoute>} />
              <Route path="/admin/relatorios" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/suporte" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/configuracoes" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

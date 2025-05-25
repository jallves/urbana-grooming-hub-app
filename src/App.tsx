
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from '@/contexts/AuthContext';

// Import all pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import RegisterAuth from './pages/RegisterAuth';
import NotFound from './pages/NotFound';
import AppointmentBooking from './pages/AppointmentBooking';

// Admin pages
import Admin from './pages/Admin';
import AdminAppointments from './pages/AdminAppointments';
import AdminStaff from './pages/AdminStaff';
import AdminBarbers from './pages/AdminBarbers';
import AdminClients from './pages/AdminClients';
import AdminProducts from './pages/AdminProducts';
import AdminFinance from './pages/AdminFinance';
import AdminMarketing from './pages/AdminMarketing';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSupport from './pages/AdminSupport';
import AdminSettings from './pages/AdminSettings';

// Barber pages
import BarberAuth from './pages/BarberAuth';
import BarberDashboard from './pages/BarberDashboard';
import BarberAdminDashboard from './pages/BarberAdminDashboard';
import BarberAppointments from './pages/BarberAppointments';
import BarberClients from './pages/BarberClients';
import BarberCommissions from './pages/BarberCommissions';
import BarberProfile from './pages/BarberProfile';
import BarberModules from './pages/BarberModules';
import BarberModuleAccess from './pages/BarberModuleAccess';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/agendar" element={<AppointmentBooking />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<RegisterAuth />} />
                <Route path="/register-auth" element={<RegisterAuth />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/agendamentos" element={<AdminAppointments />} />
                <Route path="/admin/profissionais" element={<AdminStaff />} />
                <Route path="/admin/barbeiros" element={<AdminBarbers />} />
                <Route path="/admin/clientes" element={<AdminClients />} />
                <Route path="/admin/produtos" element={<AdminProducts />} />
                <Route path="/admin/financeiro" element={<AdminFinance />} />
                <Route path="/admin/marketing" element={<AdminMarketing />} />
                <Route path="/admin/relatorios" element={<AdminAnalytics />} />
                <Route path="/admin/suporte" element={<AdminSupport />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                
                {/* Barber routes */}
                <Route path="/barbeiro/login" element={<BarberAuth />} />
                <Route path="/barbeiro" element={<BarberDashboard />} />
                <Route path="/barbeiro/dashboard" element={<BarberAdminDashboard />} />
                <Route path="/barbeiro/agendamentos" element={<BarberAppointments />} />
                <Route path="/barbeiro/clientes" element={<BarberClients />} />
                <Route path="/barbeiro/comissoes" element={<BarberCommissions />} />
                <Route path="/barbeiro/perfil" element={<BarberProfile />} />
                <Route path="/barbeiro/modulos" element={<BarberModules />} />
                <Route path="/barbeiro/acesso-modulos" element={<BarberModuleAccess />} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from '@/contexts/AuthContext';

// Lazy load pages for better performance
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const RegisterAuth = lazy(() => import('./pages/RegisterAuth'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AppointmentBooking = lazy(() => import('./pages/AppointmentBooking'));

// Admin pages
const Admin = lazy(() => import('./pages/Admin'));
const AdminAppointments = lazy(() => import('./pages/AdminAppointments'));
const AdminStaff = lazy(() => import('./pages/AdminStaff'));
const AdminBarbers = lazy(() => import('./pages/AdminBarbers'));
const AdminClients = lazy(() => import('./pages/AdminClients'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminFinance = lazy(() => import('./pages/AdminFinance'));
const AdminMarketing = lazy(() => import('./pages/AdminMarketing'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminSupport = lazy(() => import('./pages/AdminSupport'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

// Barber pages
const BarberAuth = lazy(() => import('./pages/BarberAuth'));
const BarberDashboard = lazy(() => import('./pages/BarberDashboard'));
const BarberAdminDashboard = lazy(() => import('./pages/BarberAdminDashboard'));
const BarberAppointments = lazy(() => import('./pages/BarberAppointments'));
const BarberClients = lazy(() => import('./pages/BarberClients'));
const BarberCommissions = lazy(() => import('./pages/BarberCommissions'));
const BarberProfile = lazy(() => import('./pages/BarberProfile'));
const BarberModules = lazy(() => import('./pages/BarberModules'));
const BarberModuleAccess = lazy(() => import('./pages/BarberModuleAccess'));

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="w-12 h-12 border-4 border-urbana-gold border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<LoadingSpinner />}>
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
              </Suspense>
            </div>
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import { PainelClienteAuthProvider } from './contexts/PainelClienteAuthContext';
import AdminRoute from './components/auth/AdminRoute';
import ClientRoute from './components/client/ClientRoute';
import PainelClienteRoute from './components/painel-cliente/PainelClienteRoute';
import BarberRoute from './components/auth/BarberRoute';
import PainelClienteLayout from './components/painel-cliente/PainelClienteLayout';
import Index from './pages/Index';
import AdminDashboard from './pages/Admin';
import AdminLogin from './pages/Auth';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import ClientDashboard from './pages/ClientDashboard';
import AdminAppointments from './pages/AdminAppointments';
import AdminClients from './pages/AdminClients';
import AdminStaff from './pages/AdminEmployees';
import AdminBarbers from './pages/AdminBarbers';
import AdminProducts from './pages/AdminProducts';
import AdminFinancial from './pages/AdminFinance';
import AdminMarketing from './pages/AdminMarketing';
import AdminBirthdays from './pages/AdminBirthdays';
import AdminSupport from './pages/AdminSupport';
import AdminSchedules from './pages/AdminBarberSchedules';
import AdminCashFlow from './pages/AdminCashFlow';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import PainelClienteLogin from './pages/PainelClienteLogin';
import PainelClienteRegister from './pages/PainelClienteRegister';
import PainelClienteDashboard from './pages/PainelClienteDashboard';
import PainelClienteAgendar from './pages/PainelClienteAgendar';
import PainelClienteAgendamentos from './pages/PainelClienteAgendamentos';
import PainelClientePerfil from './pages/PainelClientePerfil';
import BarberAuth from './pages/BarberAuth';
import BarberDashboard from './pages/BarberDashboard';
import BarberAppointments from './pages/BarberAppointments';
import BarberClients from './pages/BarberClients';
import BarberCommissions from './pages/BarberCommissions';
import BarberSchedule from './pages/BarberSchedule';
import BarberProfile from './pages/BarberProfile';
import BarberAdminDashboard from './pages/BarberAdminDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminClientAppointments from './pages/AdminClientAppointments';
import { SidebarProvider } from './components/ui/sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClientAuthProvider>
            <PainelClienteAuthProvider>
              <QueryClientProvider client={queryClient}>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/agendamentos" element={
                      <AdminRoute>
                        <AdminAppointments />
                      </AdminRoute>
                    } />
                    <Route path="/admin/clientes" element={
                      <AdminRoute>
                        <AdminClients />
                      </AdminRoute>
                    } />
                    <Route path="/admin/funcionarios" element={
                      <AdminRoute>
                        <AdminStaff />
                      </AdminRoute>
                    } />
                    <Route path="/admin/barbeiros" element={
                      <AdminRoute>
                        <AdminBarbers />
                      </AdminRoute>
                    } />
                    <Route path="/admin/produtos" element={
                      <AdminRoute>
                        <AdminProducts />
                      </AdminRoute>
                    } />
                    <Route path="/admin/financeiro" element={
                      <AdminRoute>
                        <AdminFinancial />
                      </AdminRoute>
                    } />
                    <Route path="/admin/marketing" element={
                      <AdminRoute>
                        <AdminMarketing />
                      </AdminRoute>
                    } />
                    <Route path="/admin/aniversarios" element={
                      <AdminRoute>
                        <AdminBirthdays />
                      </AdminRoute>
                    } />
                    <Route path="/admin/suporte" element={
                      <AdminRoute>
                        <AdminSupport />
                      </AdminRoute>
                    } />
                    <Route path="/admin/escalas" element={
                      <AdminRoute>
                        <AdminSchedules />
                      </AdminRoute>
                    } />
                    <Route path="/admin/fluxo-caixa" element={
                      <AdminRoute>
                        <AdminCashFlow />
                      </AdminRoute>
                    } />
                    <Route path="/admin/analytics" element={
                      <AdminRoute>
                        <AdminAnalytics />
                      </AdminRoute>
                    } />
                    <Route path="/admin/configuracoes" element={
                      <AdminRoute>
                        <AdminSettings />
                      </AdminRoute>
                    } />
                    
                    {/* Barber Routes */}
                    <Route path="/barbeiro/login" element={<BarberAuth />} />
                    <Route path="/barbeiro" element={
                      <BarberRoute allowBarber={true}>
                        <BarberDashboard />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/dashboard" element={
                      <BarberRoute allowBarber={true}>
                        <BarberDashboard />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/agendamentos" element={
                      <BarberRoute allowBarber={true}>
                        <BarberAppointments />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/clientes" element={
                      <BarberRoute allowBarber={true}>
                        <BarberClients />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/comissoes" element={
                      <BarberRoute allowBarber={true}>
                        <BarberCommissions />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/agenda" element={
                      <BarberRoute allowBarber={true}>
                        <BarberSchedule />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/perfil" element={
                      <BarberRoute allowBarber={true}>
                        <BarberProfile />
                      </BarberRoute>
                    } />
                    <Route path="/barbeiro/admin" element={
                      <BarberRoute>
                        <BarberAdminDashboard />
                      </BarberRoute>
                    } />
                    
                    {/* Client Routes */}
                    <Route path="/cliente/login" element={<ClientLogin />} />
                    <Route path="/cliente/register" element={<ClientRegister />} />
                    <Route path="/cliente/dashboard" element={
                      <ClientRoute>
                        <ClientDashboard />
                      </ClientRoute>
                    } />

                    {/* Painel Cliente Routes - Using nested routing */}
                    <Route path="/painel-cliente/login" element={<PainelClienteLogin />} />
                    <Route path="/painel-cliente/register" element={<PainelClienteRegister />} />
                    
                    {/* Nested routes for authenticated client panel */}
                    <Route path="/painel-cliente" element={
                      <PainelClienteRoute>
                        <PainelClienteLayout />
                      </PainelClienteRoute>
                    }>
                      <Route path="dashboard" element={<PainelClienteDashboard />} />
                      <Route path="agendar" element={<PainelClienteAgendar />} />
                      <Route path="agendamentos" element={<PainelClienteAgendamentos />} />
                      <Route path="perfil" element={<PainelClientePerfil />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>
                    
                    <Route path="/admin/agendamentos-clientes" element={
                      <AdminRoute>
                        <AdminClientAppointments />
                      </AdminRoute>
                    } />
                  </Routes>
                </div>
              </QueryClientProvider>
            </PainelClienteAuthProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminRoute from '@/components/auth/AdminRoute';
import BarberRoute from '@/components/auth/BarberRoute';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import RegisterAuth from '@/pages/RegisterAuth';
import ResetPassword from '@/pages/ResetPassword';
import Admin from '@/pages/Admin';
import BarberAuth from '@/pages/BarberAuth';
import BarberDashboard from '@/pages/BarberDashboard';
import NotFound from '@/pages/NotFound';

// Admin Pages
import AdminAppointments from '@/pages/AdminAppointments';
import AdminStaff from '@/pages/AdminStaff';
import AdminBarbers from '@/pages/AdminBarbers';
import AdminClients from '@/pages/AdminClients';
import AdminBirthdays from '@/pages/AdminBirthdays';
import AdminProducts from '@/pages/AdminProducts';
import AdminFinance from '@/pages/AdminFinance';
import AdminMarketing from '@/pages/AdminMarketing';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminSupport from '@/pages/AdminSupport';
import AdminSettings from '@/pages/AdminSettings';

// Barber Pages
import BarberAppointments from '@/pages/BarberAppointments';
import BarberCommissions from '@/pages/BarberCommissions';
import BarberClients from '@/pages/BarberClients';
import BarberProfile from '@/pages/BarberProfile';

import { ClientAuthProvider } from '@/contexts/ClientAuthContext';
import ClientRegister from '@/pages/ClientRegister';
import ClientLogin from '@/pages/ClientLogin';
import ClientDashboard from '@/pages/ClientDashboard';
import ClientNewBooking from '@/pages/ClientNewBooking';
import ClientEditAppointment from '@/pages/ClientEditAppointment';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientAuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Client Routes */}
                <Route path="/cliente/registro" element={<ClientRegister />} />
                <Route path="/cliente/login" element={<ClientLogin />} />
                <Route path="/cliente/dashboard" element={<ClientDashboard />} />
                <Route path="/cliente/novo-agendamento" element={<ClientNewBooking />} />
                <Route path="/cliente/agendamento/:id/editar" element={<ClientEditAppointment />} />
                
                {/* Admin Authentication Routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<RegisterAuth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } />
                
                <Route path="/admin/agendamentos" element={
                  <AdminRoute>
                    <AdminAppointments />
                  </AdminRoute>
                } />
                
                <Route path="/admin/profissionais" element={
                  <AdminRoute>
                    <AdminStaff />
                  </AdminRoute>
                } />
                
                <Route path="/admin/barbeiros" element={
                  <AdminRoute>
                    <AdminBarbers />
                  </AdminRoute>
                } />
                
                <Route path="/admin/clientes" element={
                  <AdminRoute>
                    <AdminClients />
                  </AdminRoute>
                } />
                
                <Route path="/admin/aniversariantes" element={
                  <AdminRoute>
                    <AdminBirthdays />
                  </AdminRoute>
                } />
                
                <Route path="/admin/produtos" element={
                  <AdminRoute>
                    <AdminProducts />
                  </AdminRoute>
                } />
                
                <Route path="/admin/financeiro" element={
                  <AdminRoute>
                    <AdminFinance />
                  </AdminRoute>
                } />
                
                <Route path="/admin/marketing" element={
                  <AdminRoute>
                    <AdminMarketing />
                  </AdminRoute>
                } />
                
                <Route path="/admin/relatorios" element={
                  <AdminRoute>
                    <AdminAnalytics />
                  </AdminRoute>
                } />
                
                <Route path="/admin/suporte" element={
                  <AdminRoute>
                    <AdminSupport />
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
                  <BarberRoute>
                    <BarberDashboard />
                  </BarberRoute>
                } />
                <Route path="/barbeiro/dashboard" element={
                  <BarberRoute>
                    <BarberDashboard />
                  </BarberRoute>
                } />
                <Route path="/barbeiro/agendamentos" element={
                  <BarberRoute>
                    <BarberAppointments />
                  </BarberRoute>
                } />
                <Route path="/barbeiro/clientes" element={
                  <BarberRoute>
                    <BarberClients />
                  </BarberRoute>
                } />
                <Route path="/barbeiro/comissoes" element={
                  <BarberRoute>
                    <BarberCommissions />
                  </BarberRoute>
                } />
                <Route path="/barbeiro/perfil" element={
                  <BarberRoute>
                    <BarberProfile />
                  </BarberRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeProvider>
          </QueryClientProvider>
        </ClientAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

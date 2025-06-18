
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClientAuthProvider } from '@/contexts/ClientAuthContext';
import { ThemeProvider } from '@/components/theme/theme-provider';

// Public pages
import Index from '@/pages/Index';
import AppointmentBooking from '@/pages/AppointmentBooking';
import NotFound from '@/pages/NotFound';

// Auth pages
import Auth from '@/pages/Auth';
import RegisterAuth from '@/pages/RegisterAuth';
import ResetPassword from '@/pages/ResetPassword';

// Admin pages
import AdminRoute from '@/components/auth/AdminRoute';
import Admin from '@/pages/Admin';
import AdminAppointments from '@/pages/AdminAppointments';
import AdminClients from '@/pages/AdminClients';
import AdminBarbers from '@/pages/AdminBarbers';
import AdminBirthdays from '@/pages/AdminBirthdays';
import AdminProducts from '@/pages/AdminProducts';
import AdminFinance from '@/pages/AdminFinance';
import AdminCashFlow from '@/pages/AdminCashFlow';
import AdminMarketing from '@/pages/AdminMarketing';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminSupport from '@/pages/AdminSupport';
import AdminSettings from '@/pages/AdminSettings';
import AdminBookingSettings from '@/pages/AdminBookingSettings';

// Barber pages
import BarberRoute from '@/components/auth/BarberRoute';
import BarberAuth from '@/pages/BarberAuth';
import BarberDashboard from '@/pages/BarberDashboard';
import BarberProfile from '@/pages/BarberProfile';
import BarberAppointments from '@/pages/BarberAppointments';
import BarberCommissions from '@/pages/BarberCommissions';
import BarberClients from '@/pages/BarberClients';
import BarberModules from '@/pages/BarberModules';
import BarberModuleAccess from '@/pages/BarberModuleAccess';
import BarberAdminDashboard from '@/pages/BarberAdminDashboard';
import BarberSchedule from '@/pages/BarberSchedule';

// Client pages
import ClientLogin from '@/pages/ClientLogin';
import ClientRegister from '@/pages/ClientRegister';
import ClientDashboard from '@/pages/ClientDashboard';
import ClientProfile from '@/pages/ClientProfile';
import ClientNewBooking from '@/pages/ClientNewBooking';
import ClientEditAppointment from '@/pages/ClientEditAppointment';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Router>
          <AuthProvider>
            <ClientAuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/agendamento" element={<AppointmentBooking />} />
                <Route path="/agendar" element={<AppointmentBooking />} />

                {/* Auth routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<RegisterAuth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/agendamentos"
                  element={
                    <AdminRoute>
                      <AdminAppointments />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/clientes"
                  element={
                    <AdminRoute>
                      <AdminClients />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/barbeiros"
                  element={
                    <AdminRoute>
                      <AdminBarbers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/aniversariantes"
                  element={
                    <AdminRoute>
                      <AdminBirthdays />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/produtos"
                  element={
                    <AdminRoute>
                      <AdminProducts />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/financeiro"
                  element={
                    <AdminRoute>
                      <AdminFinance />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/fluxo-caixa"
                  element={
                    <AdminRoute>
                      <AdminCashFlow />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/marketing"
                  element={
                    <AdminRoute>
                      <AdminMarketing />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/relatorios"
                  element={
                    <AdminRoute>
                      <AdminAnalytics />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/suporte"
                  element={
                    <AdminRoute>
                      <AdminSupport />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/configuracoes"
                  element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/configuracoes/agendamento"
                  element={
                    <AdminRoute>
                      <AdminBookingSettings />
                    </AdminRoute>
                  }
                />

                {/* Barber routes */}
                <Route path="/barbeiro/login" element={<BarberAuth />} />
                <Route
                  path="/barbeiro"
                  element={
                    <BarberRoute>
                      <BarberDashboard />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/dashboard"
                  element={
                    <BarberRoute>
                      <BarberDashboard />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/perfil"
                  element={
                    <BarberRoute>
                      <BarberProfile />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/agendamentos"
                  element={
                    <BarberRoute>
                      <BarberAppointments />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/agenda"
                  element={
                    <BarberRoute>
                      <BarberSchedule />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/comissoes"
                  element={
                    <BarberRoute>
                      <BarberCommissions />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/clientes"
                  element={
                    <BarberRoute>
                      <BarberClients />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/modulos"
                  element={
                    <BarberRoute>
                      <BarberModules />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/acesso"
                  element={
                    <BarberRoute>
                      <BarberModuleAccess />
                    </BarberRoute>
                  }
                />
                <Route
                  path="/barbeiro/admin"
                  element={
                    <BarberRoute>
                      <BarberAdminDashboard />
                    </BarberRoute>
                  }
                />

                {/* Client routes */}
                <Route path="/cliente/login" element={<ClientLogin />} />
                <Route path="/cliente/cadastro" element={<ClientRegister />} />
                <Route path="/cliente/dashboard" element={<ClientDashboard />} />
                <Route path="/cliente/perfil" element={<ClientProfile />} />
                <Route path="/cliente/novo-agendamento" element={<ClientNewBooking />} />
                <Route path="/cliente/agendamento/:id/editar" element={<ClientEditAppointment />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClientAuthProvider>
          </AuthProvider>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

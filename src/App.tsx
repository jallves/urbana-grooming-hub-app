
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RegisterAuth from "./pages/RegisterAuth";
import ResetPassword from "./pages/ResetPassword";
import BookingOnline from "./pages/BookingOnline";
import AdminRoute from "./components/auth/AdminRoute";
import BarberRoute from "./components/auth/BarberRoute";

// Admin Pages
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAppointments from "./pages/AdminAppointments";
import AdminClients from "./pages/AdminClients";
import AdminBarbers from "./pages/AdminBarbers";
import AdminProducts from "./pages/AdminProducts";
import AdminFinance from "./pages/AdminFinance";
import AdminSettings from "./pages/AdminSettings";
import AdminSupport from "./pages/AdminSupport";
import AdminMarketing from "./pages/AdminMarketing";
import AdminBirthdays from "./pages/AdminBirthdays";
import AdminCashFlow from "./pages/AdminCashFlow";
import AdminBookingSettings from "./pages/AdminBookingSettings";
import AdminBarberSchedules from "./pages/AdminBarberSchedules";
import AdminEmployees from "./pages/AdminEmployees";

// Barber Pages
import BarberAuth from "./pages/BarberAuth";
import BarberDashboard from "./pages/BarberDashboard";
import BarberAdminDashboard from "./pages/BarberAdminDashboard";
import BarberAppointments from "./pages/BarberAppointments";
import BarberProfile from "./pages/BarberProfile";
import BarberCommissions from "./pages/BarberCommissions";
import BarberClients from "./pages/BarberClients";
import BarberSchedule from "./pages/BarberSchedule";
import BarberModules from "./pages/BarberModules";
import BarberModuleAccess from "./pages/BarberModuleAccess";

// Client Pages
import ClientLogin from "./pages/ClientLogin";
import ClientRegister from "./pages/ClientRegister";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
import ClientEditAppointment from "./pages/ClientEditAppointment";
import ClientNewAppointment from "./pages/ClientNewAppointment";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ClientAuthProvider>
            <Router>
              <div className="min-h-screen bg-black">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cadastro" element={<RegisterAuth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/agendamento-online" element={<BookingOnline />} />

                  {/* Client Routes */}
                  <Route path="/cliente/login" element={<ClientLogin />} />
                  <Route path="/cliente/registro" element={<ClientRegister />} />
                  <Route path="/cliente/dashboard" element={<ClientDashboard />} />
                  <Route path="/cliente/perfil" element={<ClientProfile />} />
                  <Route path="/cliente/novo-agendamento" element={<ClientNewAppointment />} />
                  <Route path="/cliente/agendamento/:id/editar" element={<ClientEditAppointment />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/agendamentos" element={<AdminAppointments />} />
                  <Route path="/admin/clientes" element={<AdminClients />} />
                  <Route path="/admin/produtos" element={<AdminProducts />} />
                  <Route path="/admin/barbeiros" element={<AdminBarbers />} />
                  <Route path="/admin/funcionarios" element={<AdminEmployees />} />
                  <Route path="/admin/configuracoes" element={<AdminSettings />} />
                  <Route path="/admin/financeiro" element={<AdminFinance />} />
                  <Route path="/admin/marketing" element={<AdminMarketing />} />
                  <Route path="/admin/fluxo-caixa" element={<AdminCashFlow />} />
                  <Route path="/admin/aniversarios" element={<AdminBirthdays />} />
                  <Route path="/admin/suporte" element={<AdminSupport />} />
                  <Route path="/admin/escalas" element={<AdminBarberSchedules />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />

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
                  <Route path="/barbeiro/admin" element={
                    <BarberRoute allowBarber={true}>
                      <BarberAdminDashboard />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/agendamentos" element={
                    <BarberRoute allowBarber={true}>
                      <BarberAppointments />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/perfil" element={
                    <BarberRoute allowBarber={true}>
                      <BarberProfile />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/comissoes" element={
                    <BarberRoute allowBarber={true}>
                      <BarberCommissions />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/clientes" element={
                    <BarberRoute allowBarber={true} requiredModule="clients">
                      <BarberClients />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/agenda" element={
                    <BarberRoute allowBarber={true}>
                      <BarberSchedule />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/modulos" element={
                    <BarberRoute allowBarber={true}>
                      <BarberModules />
                    </BarberRoute>
                  } />
                  <Route path="/barbeiro/acesso-modulos" element={
                    <BarberRoute allowBarber={true}>
                      <BarberModuleAccess />
                    </BarberRoute>
                  } />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <Sonner />
              </div>
            </Router>
          </ClientAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

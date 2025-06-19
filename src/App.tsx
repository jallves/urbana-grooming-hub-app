
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RegisterAuth from "./pages/RegisterAuth";
import ResetPassword from "./pages/ResetPassword";
import AdminPage from "./pages/Admin";
import AdminAppointments from "./pages/AdminAppointments";
import AdminClients from "./pages/AdminClients";
import AdminProducts from "./pages/AdminProducts";
import AdminFinance from "./pages/AdminFinance";
import AdminCashFlow from "./pages/AdminCashFlow";
import AdminMarketing from "./pages/AdminMarketing";
import AdminSettings from "./pages/AdminSettings";
import AdminSupport from "./pages/AdminSupport";
import AdminBirthdays from "./pages/AdminBirthdays";
import AdminBarbers from "./pages/AdminBarbers";
import AdminBarberSchedules from "./pages/AdminBarberSchedules";
import BarberAuth from "./pages/BarberAuth";
import BarberDashboard from "./pages/BarberDashboard";
import BarberAppointments from "./pages/BarberAppointments";
import BarberProfile from "./pages/BarberProfile";
import BarberCommissions from "./pages/BarberCommissions";
import BarberClients from "./pages/BarberClients";
import BarberSchedule from "./pages/BarberSchedule";
import ClientLogin from "./pages/ClientLogin";
import ClientRegister from "./pages/ClientRegister";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
import ClientNewBooking from "./pages/ClientNewBooking";
import ClientEditAppointment from "./pages/ClientEditAppointment";
import AppointmentBooking from "./pages/AppointmentBooking";
import BookingOnline from "./pages/BookingOnline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ClientAuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<RegisterAuth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/agendamentos" element={<AdminAppointments />} />
                <Route path="/admin/clientes" element={<AdminClients />} />
                <Route path="/admin/aniversariantes" element={<AdminBirthdays />} />
                <Route path="/admin/barbeiros" element={<AdminBarbers />} />
                <Route path="/admin/barbeiros/horarios" element={<AdminBarberSchedules />} />
                <Route path="/admin/produtos" element={<AdminProducts />} />
                <Route path="/admin/financeiro" element={<AdminFinance />} />
                <Route path="/admin/fluxo-caixa" element={<AdminCashFlow />} />
                <Route path="/admin/marketing" element={<AdminMarketing />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/suporte" element={<AdminSupport />} />
                
                {/* Barber Routes */}
                <Route path="/barbeiro/login" element={<BarberAuth />} />
                <Route path="/barbeiro" element={<BarberDashboard />} />
                <Route path="/barbeiro/dashboard" element={<BarberDashboard />} />
                <Route path="/barbeiro/agendamentos" element={<BarberAppointments />} />
                <Route path="/barbeiro/agenda" element={<BarberSchedule />} />
                <Route path="/barbeiro/perfil" element={<BarberProfile />} />
                <Route path="/barbeiro/comissoes" element={<BarberCommissions />} />
                <Route path="/barbeiro/clientes" element={<BarberClients />} />
                
                {/* Client Routes */}
                <Route path="/cliente/login" element={<ClientLogin />} />
                <Route path="/cliente/registro" element={<ClientRegister />} />
                <Route path="/cliente/dashboard" element={<ClientDashboard />} />
                <Route path="/cliente/perfil" element={<ClientProfile />} />
                <Route path="/cliente/agendar" element={<ClientNewBooking />} />
                <Route path="/cliente/agendamento/:id/editar" element={<ClientEditAppointment />} />
                
                {/* Public Booking Routes */}
                <Route path="/agendar" element={<AppointmentBooking />} />
                <Route path="/agendamento-online" element={<BookingOnline />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClientAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

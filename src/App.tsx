
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ClientAuthProvider } from "./contexts/ClientAuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RegisterAuth from "./pages/RegisterAuth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/Admin";
import AdminAppointments from "./pages/AdminAppointments";
import AdminClients from "./pages/AdminClients";
import AdminStaff from "./pages/AdminStaff";
import AdminBarbers from "./pages/AdminBarbers";
import AdminProducts from "./pages/AdminProducts";
import AdminFinance from "./pages/AdminFinance";
import AdminMarketing from "./pages/AdminMarketing";
import AdminSettings from "./pages/AdminSettings";
import AdminSupport from "./pages/AdminSupport";
import AdminAnalytics from "./pages/AdminAnalytics";
import AppointmentBooking from "./pages/AppointmentBooking";
import BarberAuth from "./pages/BarberAuth";
import BarberDashboard from "./pages/BarberDashboard";
import BarberProfile from "./pages/BarberProfile";
import BarberAppointments from "./pages/BarberAppointments";
import BarberCommissions from "./pages/BarberCommissions";
import BarberClients from "./pages/BarberClients";
import BarberModules from "./pages/BarberModules";
import BarberModuleAccess from "./pages/BarberModuleAccess";
import BarberAdminDashboard from "./pages/BarberAdminDashboard";
import ClientAuth from "./pages/ClientAuth";
import ClientDashboard from "./pages/ClientDashboard";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/auth/AdminRoute";
import BarberRoute from "./components/auth/BarberRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/appointment" element={<AppointmentBooking />} />
              <Route path="/client-auth" element={<ClientAuth />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
              <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
              <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
              <Route path="/admin/barbers" element={<AdminRoute><AdminBarbers /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
              <Route path="/admin/marketing" element={<AdminRoute><AdminMarketing /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              
              {/* Barber Routes */}
              <Route path="/barber-auth" element={<BarberAuth />} />
              <Route path="/barber" element={<BarberRoute><BarberDashboard /></BarberRoute>} />
              <Route path="/barber/dashboard" element={<BarberRoute><BarberDashboard /></BarberRoute>} />
              <Route path="/barber/profile" element={<BarberRoute><BarberProfile /></BarberRoute>} />
              <Route path="/barber/appointments" element={<BarberRoute><BarberAppointments /></BarberRoute>} />
              <Route path="/barber/commissions" element={<BarberRoute><BarberCommissions /></BarberRoute>} />
              <Route path="/barber/clients" element={<BarberRoute><BarberClients /></BarberRoute>} />
              <Route path="/barber/modules" element={<BarberRoute><BarberModules /></BarberRoute>} />
              <Route path="/barber/module-access" element={<BarberRoute><BarberModuleAccess /></BarberRoute>} />
              <Route path="/barber/admin" element={<BarberRoute><BarberAdminDashboard /></BarberRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClientAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { BarberRoute } from '@/components/auth/BarberRoute';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import RegisterAuth from '@/pages/RegisterAuth';
import ResetPassword from '@/pages/ResetPassword';
import Admin from '@/pages/Admin';
import BarberAuth from '@/pages/BarberAuth';
import BarberDashboard from '@/pages/BarberDashboard';
import NotFound from '@/pages/NotFound';
import AppointmentBooking from '@/pages/AppointmentBooking';

import { ClientAuthProvider } from '@/contexts/ClientAuthContext';
import ClientRegister from '@/pages/ClientRegister';
import ClientLogin from '@/pages/ClientLogin';
import ClientDashboard from '@/pages/ClientDashboard';
import ClientNewBooking from '@/pages/ClientNewBooking';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientAuthProvider>
          <QueryClient client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/agendar" element={<AppointmentBooking />} />
                
                {/* Client Routes */}
                <Route path="/cliente/registro" element={<ClientRegister />} />
                <Route path="/cliente/login" element={<ClientLogin />} />
                <Route path="/cliente/dashboard" element={<ClientDashboard />} />
                <Route path="/cliente/novo-agendamento" element={<ClientNewBooking />} />
                
                {/* Admin Routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<RegisterAuth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="/admin" element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } />
                
                {/* Barber Routes */}
                <Route path="/barbeiro/login" element={<BarberAuth />} />
                <Route path="/barbeiro/dashboard" element={
                  <BarberRoute>
                    <BarberDashboard />
                  </BarberRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeProvider>
          </QueryClient>
        </ClientAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

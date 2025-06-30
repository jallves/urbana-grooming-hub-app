
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Index';
import Services from './pages/Index';
import Contact from './pages/Index';
import Booking from './pages/Index';
import Gallery from './pages/Index';
import AdminLogin from './pages/Auth';
import AdminDashboard from './pages/Admin';
import AdminServices from './pages/AdminProducts';
import AdminAppointments from './pages/AdminAppointments';
import AdminClients from './pages/AdminClients';
import AdminStaff from './pages/AdminBarbers';
import AdminCoupons from './pages/AdminMarketing';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import ClientDashboard from './pages/ClientDashboard';
import ClientProfile from './pages/ClientProfile';
import ClientEditAppointment from './pages/ClientEditAppointment';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import BarberLogin from './pages/BarberAuth';
import BarberDashboard from './pages/BarberDashboard';
import PublicBooking from './pages/BookingOnline';
import AdminRoute from './components/auth/AdminRoute';
import BarberRoute from './components/auth/BarberRoute';
import ClientAppointments from './pages/ClientAppointments';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ClientAuthProvider>
          <AuthProvider>
            <div className="min-h-screen bg-white">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/public-booking" element={<PublicBooking />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
                <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
                <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
                <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
                <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />

                {/* Barber Routes - Consistent with /barber/ */}
                <Route path="/barber/login" element={<BarberLogin />} />
                <Route path="/barber/dashboard" element={<BarberRoute allowBarber={true}><BarberDashboard /></BarberRoute>} />
                
                {/* Legacy barbeiro routes for backward compatibility */}
                <Route path="/barbeiro/login" element={<BarberLogin />} />
                <Route path="/barbeiro/dashboard" element={<BarberRoute allowBarber={true}><BarberDashboard /></BarberRoute>} />
                <Route path="/barbeiro" element={<BarberRoute allowBarber={true}><BarberDashboard /></BarberRoute>} />
                
                {/* Client Routes */}
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/register" element={<ClientRegister />} />
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/client/profile" element={<ClientProfile />} />
                <Route path="/client/appointments" element={<ClientAppointments />} />
                <Route path="/client/edit-appointment/:id" element={<ClientEditAppointment />} />
                
                {/* Default Route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </div>
          </AuthProvider>
        </ClientAuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

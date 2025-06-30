import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient } from 'react-query';
import Home from './pages/Home';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Booking from './pages/Booking';
import Gallery from './pages/Gallery';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminServices from './pages/AdminServices';
import AdminAppointments from './pages/AdminAppointments';
import AdminClients from './pages/AdminClients';
import AdminStaff from './pages/AdminStaff';
import AdminCoupons from './pages/AdminCoupons';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import ClientDashboard from './pages/ClientDashboard';
import ClientProfile from './pages/ClientProfile';
import ClientEditAppointment from './pages/ClientEditAppointment';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import BarberLogin from './pages/BarberLogin';
import BarberDashboard from './pages/BarberDashboard';
import PublicBooking from './pages/PublicBooking';
import AdminRoute from './components/auth/AdminRoute';
import BarberRoute from './components/auth/BarberRoute';
import ClientAppointments from '@/pages/ClientAppointments';

function App() {
  return (
    <Router>
      <ClientAuthProvider>
        <AuthProvider>
          <QueryClient>
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

                {/* Barber Routes */}
                <Route path="/barber/login" element={<BarberLogin />} />
                <Route path="/barber/dashboard" element={<BarberRoute><BarberDashboard /></BarberRoute>} />
                
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
          </QueryClient>
        </AuthProvider>
      </ClientAuthProvider>
    </Router>
  );
}

export default App;

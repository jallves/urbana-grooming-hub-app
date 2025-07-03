import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import { PainelClienteAuthProvider } from './contexts/PainelClienteAuthContext';
import AdminRoute from './components/AdminRoute';
import ClientRoute from './components/ClientRoute';
import PainelClienteRoute from './components/PainelClienteRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import ClientDashboard from './pages/ClientDashboard';
import AdminAppointments from './pages/AdminAppointments';
import AdminClients from './pages/AdminClients';
import AdminStaff from './pages/AdminStaff';
import AdminBarbers from './pages/AdminBarbers';
import AdminProducts from './pages/AdminProducts';
import AdminFinancial from './pages/AdminFinancial';
import AdminMarketing from './pages/AdminMarketing';
import AdminBirthdays from './pages/AdminBirthdays';
import AdminSupport from './pages/AdminSupport';
import AdminSchedules from './pages/AdminSchedules';
import AdminCashFlow from './pages/AdminCashFlow';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import PainelClienteLogin from './pages/PainelClienteLogin';
import PainelClienteRegister from './pages/PainelClienteRegister';
import PainelClienteDashboard from './pages/PainelClienteDashboard';
import PainelClienteAgendar from './pages/PainelClienteAgendar';
import { QueryClient } from '@tanstack/react-query';
import AdminClientAppointments from './pages/AdminClientAppointments';
import { SidebarProvider } from './components/ui/sidebar';

function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClientAuthProvider>
            <PainelClienteAuthProvider>
              <QueryClient>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Navigate to="/admin/login" />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
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
                    
                    {/* Client Routes */}
                    <Route path="/cliente/login" element={<ClientLogin />} />
                    <Route path="/cliente/register" element={<ClientRegister />} />
                    <Route path="/cliente/dashboard" element={
                      <ClientRoute>
                        <ClientDashboard />
                      </ClientRoute>
                    } />

                    {/* Painel Cliente Routes */}
                    <Route path="/painel-cliente/login" element={<PainelClienteLogin />} />
                    <Route path="/painel-cliente/register" element={<PainelClienteRegister />} />
                    <Route path="/painel-cliente/dashboard" element={
                      <PainelClienteRoute>
                        <PainelClienteDashboard />
                      </PainelClienteRoute>
                    } />
                    <Route path="/painel-cliente/agendar" element={
                      <PainelClienteRoute>
                        <PainelClienteAgendar />
                      </PainelClienteRoute>
                    } />
                    
                    <Route path="/admin/agendamentos-clientes" element={
                      <AdminRoute>
                        <AdminClientAppointments />
                      </AdminRoute>
                    } />
                  </Routes>
                </div>
              </QueryClient>
            </PainelClienteAuthProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;

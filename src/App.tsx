
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PainelClienteAuthProvider } from './contexts/PainelClienteAuthContext';
import { TotemAuthProvider } from './contexts/TotemAuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import AdminRoute from './components/auth/AdminRoute';
import TotemProtectedRoute from './components/totem/TotemProtectedRoute';
import PainelClienteRoute from './components/painel-cliente/PainelClienteRoute';
import BarberRoute from './components/auth/BarberRoute';
import PainelClienteLayout from './components/painel-cliente/PainelClienteLayout';
import Index from './pages/Index';
import PWAInstall from './pages/PWAInstall';
import AdminDashboard from './pages/Admin';
import AdminLogin from './pages/Auth';
import AdminAppointments from './pages/AdminAppointments';
import AdminClients from './pages/AdminClients';
import AdminStaff from './pages/AdminEmployees';
import AdminBarbers from './pages/AdminBarbers';
import AdminProducts from './pages/AdminProducts';
import AdminFinancial from './pages/AdminFinance';
import AdminERPFinancial from './pages/AdminERPFinancial';
import AdminSiteSettings from './pages/AdminSiteSettings';
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
import PainelClienteMeusAgendamentos from './pages/PainelClienteMeusAgendamentos';
import PainelClientePerfil from './pages/PainelClientePerfil';
import BarberAuth from './pages/BarberAuth';
import BarberDashboard from './pages/BarberDashboard';
import BarberAppointments from './pages/BarberAppointments';
import BarberClients from './pages/BarberClients';
import BarberCommissions from './pages/BarberCommissions';
import BarberSchedule from './pages/BarberSchedule';
import BarberProfile from './pages/BarberProfile';
import BarberAdminDashboard from './pages/BarberAdminDashboard';
import TotemLogin from './pages/Totem/TotemLogin';
import TotemWelcome from './pages/Totem/TotemWelcome';
import TotemHome from './pages/Totem/TotemHome';
import TotemSearch from './pages/Totem/TotemSearch';
import TotemCadastro from './pages/Totem/TotemCadastro';
import TotemServico from './pages/Totem/TotemServico';
import TotemBarbeiro from './pages/Totem/TotemBarbeiro';
import TotemDataHora from './pages/Totem/TotemDataHora';
import TotemCheckoutSearch from './pages/Totem/TotemCheckoutSearch';
import PendingCheckouts from './pages/Admin/PendingCheckouts';
import TotemAppointmentsList from './pages/Totem/TotemAppointmentsList';
import TotemConfirmation from './pages/Totem/TotemConfirmation';
import TotemCheckInSuccess from './pages/Totem/TotemCheckInSuccess';
import TotemCheckout from './pages/Totem/TotemCheckout';
import TotemPaymentPix from './pages/Totem/TotemPaymentPix';
import TotemPaymentCard from './pages/Totem/TotemPaymentCard';
import TotemPaymentSuccess from './pages/Totem/TotemPaymentSuccess';
import TotemWaiting from './pages/Totem/TotemWaiting';
import TotemRating from './pages/Totem/TotemRating';
import TotemNovoAgendamento from './pages/Totem/TotemNovoAgendamento';
import TotemAgendamentoSucesso from './pages/Totem/TotemAgendamentoSucesso';
import TotemProducts from './pages/Totem/TotemProducts';
import TotemProductCheckout from './pages/Totem/TotemProductCheckout';
import TotemProductCardType from './pages/Totem/TotemProductCardType';
import TotemProductPaymentPix from './pages/Totem/TotemProductPaymentPix';
import TotemProductPaymentCard from './pages/Totem/TotemProductPaymentCard';
import TotemProductPaymentSuccess from './pages/Totem/TotemProductPaymentSuccess';
import TotemProductSale from './pages/Totem/TotemProductSale';
import TotemError from './pages/Totem/TotemError';
import TotemPendingCheckouts from './pages/Totem/TotemPendingCheckouts';
import AdminProductsManagement from './pages/AdminProductsManagement';
import Install from './pages/Install';
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
          <PainelClienteAuthProvider>
            <TotemAuthProvider>
              <QueryClientProvider client={queryClient}>
                <RealtimeProvider>
                  <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/pwa-install" element={<PWAInstall />} />
                  
                  {/* Admin Routes */}
                  <Route path="/auth" element={<AdminLogin />} />
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
                  <Route path="/admin/erp-financeiro" element={
                    <AdminRoute>
                      <AdminERPFinancial />
                    </AdminRoute>
                  } />
                  <Route path="/admin/fluxo-caixa" element={
                    <AdminRoute>
                      <AdminCashFlow />
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
                  <Route path="/admin/erp-financeiro" element={
                    <AdminRoute>
                      <AdminERPFinancial />
                    </AdminRoute>
                  } />
                  <Route path="/admin/site" element={
                    <AdminRoute>
                      <AdminSiteSettings />
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
                  <Route path="/admin/agendamentos-clientes" element={
                    <AdminRoute>
                      <AdminClientAppointments />
                    </AdminRoute>
                  } />
                  <Route path="/admin/checkouts-pendentes" element={
                    <AdminRoute>
                      <PendingCheckouts />
                    </AdminRoute>
                  } />
                  <Route path="/admin/produtos-totem" element={
                    <AdminRoute>
                      <AdminProductsManagement />
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

                  {/* Painel Cliente Routes - Nested routing */}
                  <Route path="/painel-cliente/login" element={<PainelClienteLogin />} />
                  <Route path="/painel-cliente/register" element={<PainelClienteRegister />} />
                  
                  <Route path="/painel-cliente" element={
                    <PainelClienteRoute>
                      <PainelClienteLayout />
                    </PainelClienteRoute>
                  }>
                    <Route path="dashboard" element={<PainelClienteDashboard />} />
                    <Route path="agendar" element={<PainelClienteAgendar />} />
                    <Route path="agendamentos" element={<PainelClienteMeusAgendamentos />} />
                    <Route path="perfil" element={<PainelClientePerfil />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>

                  {/* Totem Routes */}
                  <Route path="/totem/login" element={<TotemLogin />} />
                  <Route path="/totem/welcome" element={<TotemWelcome />} />
                  <Route path="/totem" element={<TotemProtectedRoute><TotemHome /></TotemProtectedRoute>} />
                  <Route path="/totem/home" element={<TotemProtectedRoute><TotemHome /></TotemProtectedRoute>} />
                  <Route path="/totem/search" element={<TotemProtectedRoute><TotemSearch /></TotemProtectedRoute>} />
                  <Route path="/totem/cadastro" element={<TotemProtectedRoute><TotemCadastro /></TotemProtectedRoute>} />
                  <Route path="/totem/servico" element={<TotemProtectedRoute><TotemServico /></TotemProtectedRoute>} />
                  <Route path="/totem/barbeiro" element={<TotemProtectedRoute><TotemBarbeiro /></TotemProtectedRoute>} />
                  <Route path="/totem/data-hora" element={<TotemProtectedRoute><TotemDataHora /></TotemProtectedRoute>} />
                  <Route path="/totem/checkout-search" element={<TotemProtectedRoute><TotemCheckoutSearch /></TotemProtectedRoute>} />
                  <Route path="/totem/appointments-list" element={<TotemProtectedRoute><TotemAppointmentsList /></TotemProtectedRoute>} />
                  <Route path="/totem/confirmation" element={<TotemProtectedRoute><TotemConfirmation /></TotemProtectedRoute>} />
                  <Route path="/totem/check-in-success" element={<TotemProtectedRoute><TotemCheckInSuccess /></TotemProtectedRoute>} />
                  <Route path="/totem/checkout" element={<TotemProtectedRoute><TotemCheckout /></TotemProtectedRoute>} />
                  <Route path="/totem/payment-pix" element={<TotemProtectedRoute><TotemPaymentPix /></TotemProtectedRoute>} />
                  <Route path="/totem/payment-card" element={<TotemProtectedRoute><TotemPaymentCard /></TotemProtectedRoute>} />
                  <Route path="/totem/payment-success" element={<TotemProtectedRoute><TotemPaymentSuccess /></TotemProtectedRoute>} />
                  <Route path="/totem/waiting" element={<TotemProtectedRoute><TotemWaiting /></TotemProtectedRoute>} />
                  <Route path="/totem/rating" element={<TotemProtectedRoute><TotemRating /></TotemProtectedRoute>} />
                  <Route path="/totem/novo-agendamento" element={<TotemProtectedRoute><TotemNovoAgendamento /></TotemProtectedRoute>} />
                  <Route path="/totem/agendamento-sucesso" element={<TotemProtectedRoute><TotemAgendamentoSucesso /></TotemProtectedRoute>} />
                  <Route path="/totem/products" element={<TotemProtectedRoute><TotemProducts /></TotemProtectedRoute>} />
                  <Route path="/totem/product-checkout" element={<TotemProtectedRoute><TotemProductCheckout /></TotemProtectedRoute>} />
                  <Route path="/totem/product-card-type" element={<TotemProtectedRoute><TotemProductCardType /></TotemProtectedRoute>} />
                  <Route path="/totem/product-payment-pix" element={<TotemProtectedRoute><TotemProductPaymentPix /></TotemProtectedRoute>} />
                  <Route path="/totem/product-payment-card" element={<TotemProtectedRoute><TotemProductPaymentCard /></TotemProtectedRoute>} />
                  <Route path="/totem/product-payment-success" element={<TotemProtectedRoute><TotemProductPaymentSuccess /></TotemProtectedRoute>} />
                  <Route path="/totem/product-sale" element={<TotemProtectedRoute><TotemProductSale /></TotemProtectedRoute>} />
                  <Route path="/totem/pending-checkouts" element={<TotemProtectedRoute><TotemPendingCheckouts /></TotemProtectedRoute>} />
                  <Route path="/totem/error" element={<TotemProtectedRoute><TotemError /></TotemProtectedRoute>} />

                  {/* PWA Install Page */}
                  <Route path="/install" element={<Install />} />

                  {/* Catch all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </RealtimeProvider>
          </QueryClientProvider>
          </TotemAuthProvider>
          </PainelClienteAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;

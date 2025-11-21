
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PainelClienteAuthProvider } from './contexts/PainelClienteAuthContext';
import { TotemAuthProvider } from './contexts/TotemAuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import AdminRoute from './components/auth/AdminRoute';
import AdminRedirectGuard from './components/auth/AdminRedirectGuard';
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
import PainelClienteNovoAgendamento from './pages/PainelClienteNovoAgendamento';
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
import TotemProductBarberSelect from './pages/Totem/TotemProductBarberSelect';
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
import InstallContext from './pages/InstallContext';
import PWAInstallPromptContext from './components/PWAInstallPromptContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminClientAppointments from './pages/AdminClientAppointments';
import { SidebarProvider } from './components/ui/sidebar';
import ChangePassword from './pages/ChangePassword';

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
          <PermissionsProvider>
            <PainelClienteAuthProvider>
              <TotemAuthProvider>
                <QueryClientProvider client={queryClient}>
                  <RealtimeProvider>
                    <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={
                    <AdminRedirectGuard>
                      <Index />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/pwa-install" element={
                    <AdminRedirectGuard>
                      <PWAInstall />
                    </AdminRedirectGuard>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="/auth" element={<AdminLogin />} />
                  <Route path="/change-password" element={<ChangePassword />} />
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
                    <AdminRoute requiredModule="financeiro">
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
                    <AdminRoute requiredModule="configuracoes">
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
                  <Route path="/barbeiro/login" element={
                    <AdminRedirectGuard>
                      <BarberAuth />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberDashboard />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/dashboard" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberDashboard />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/agendamentos" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberAppointments />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/comissoes" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberCommissions />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/agenda" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberSchedule />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/perfil" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberProfile />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/barbeiro/admin" element={
                    <AdminRedirectGuard>
                      <BarberRoute>
                        <BarberAdminDashboard />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  } />

                  {/* Painel Cliente Routes - Nested routing */}
                  <Route path="/painel-cliente/login" element={
                    <AdminRedirectGuard>
                      <PainelClienteLogin />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/painel-cliente/register" element={
                    <AdminRedirectGuard>
                      <PainelClienteRegister />
                    </AdminRedirectGuard>
                  } />
                  
                  <Route path="/painel-cliente" element={
                    <AdminRedirectGuard>
                      <PainelClienteRoute>
                        <PainelClienteLayout />
                      </PainelClienteRoute>
                    </AdminRedirectGuard>
                  }>
                    <Route path="dashboard" element={<PainelClienteDashboard />} />
                    <Route path="agendar" element={<PainelClienteNovoAgendamento />} />
                    <Route path="agendamentos" element={<PainelClienteMeusAgendamentos />} />
                    <Route path="perfil" element={<PainelClientePerfil />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>

                  {/* Totem Routes */}
                  <Route path="/totem/login" element={
                    <AdminRedirectGuard>
                      <TotemLogin />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/welcome" element={
                    <AdminRedirectGuard>
                      <TotemWelcome />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemHome /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/home" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemHome /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/search" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemSearch /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/cadastro" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemCadastro /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/servico" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemServico /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/barbeiro" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemBarbeiro /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/data-hora" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemDataHora /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/checkout-search" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemCheckoutSearch /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/appointments-list" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemAppointmentsList /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/confirmation" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemConfirmation /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/check-in-success" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemCheckInSuccess /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/checkout" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemCheckout /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/payment-pix" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemPaymentPix /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/payment-card" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemPaymentCard /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/payment-success" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemPaymentSuccess /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/waiting" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemWaiting /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/rating" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemRating /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/novo-agendamento" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemNovoAgendamento /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/agendamento-sucesso" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemAgendamentoSucesso /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/products" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProducts /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-barber-select" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductBarberSelect /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-checkout" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductCheckout /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-card-type" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductCardType /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-payment-pix" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductPaymentPix /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-payment-card" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductPaymentCard /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-payment-success" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductPaymentSuccess /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/product-sale" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemProductSale /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/pending-checkouts" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemPendingCheckouts /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />
                  <Route path="/totem/error" element={
                    <AdminRedirectGuard>
                      <TotemProtectedRoute><TotemError /></TotemProtectedRoute>
                    </AdminRedirectGuard>
                  } />

                  {/* PWA Install Pages */}
                  <Route path="/install" element={
                    <AdminRedirectGuard>
                      <Install />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/install/:context" element={
                    <AdminRedirectGuard>
                      <InstallContext />
                    </AdminRedirectGuard>
                  } />

                  {/* Catch all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <PWAInstallPromptContext />
                  </div>
                  </RealtimeProvider>
                </QueryClientProvider>
              </TotemAuthProvider>
            </PainelClienteAuthProvider>
          </PermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;

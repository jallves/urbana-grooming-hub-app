
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PainelClienteAuthProvider } from './contexts/PainelClienteAuthContext';
import { TotemAuthProvider } from './contexts/TotemAuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { PWAUpdateManager } from './components/PWAUpdateManager';
import AdminRoute from './components/auth/AdminRoute';
import AdminRedirectGuard from './components/auth/AdminRedirectGuard';
import TotemProtectedRoute from './components/totem/TotemProtectedRoute';
import ClientRoute from './components/auth/ClientRoute';
import BarberRoute from './components/auth/BarberRoute';
import PainelClienteLayout from './components/painel-cliente/PainelClienteLayout';
import BarberLayout from './components/barber/BarberLayout';
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
import AdminCashFlow from './pages/AdminCashFlow';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import SessionsManagement from './pages/admin/SessionsManagement';
import PainelClienteLogin from './pages/PainelClienteLogin';
import PainelClienteRegister from './pages/PainelClienteRegister';
import PainelClienteEmailConfirmation from './pages/PainelClienteEmailConfirmation';
import PainelClienteEmailConfirmed from './pages/PainelClienteEmailConfirmed';
import PainelClienteDashboard from './pages/PainelClienteDashboard';
import PainelClienteNovoAgendamento from './pages/PainelClienteNovoAgendamento';
import PainelClienteAgendamentos from './pages/PainelClienteAgendamentos';
import PainelClienteMeusAgendamentos from './pages/PainelClienteMeusAgendamentos';
import PainelClientePerfil from './pages/PainelClientePerfil';
import ForgotPassword from './pages/ForgotPassword';
import BarberAuth from './pages/BarberAuth';
import BarberDashboard from './pages/BarberDashboard';
import BarberAppointments from './pages/BarberAppointments';
import BarberClients from './pages/BarberClients';
import BarberCommissions from './pages/BarberCommissions';
import BarberSchedule from './pages/BarberSchedule';
import BarberProfile from './pages/BarberProfile';
import BarberAdminDashboard from './pages/BarberAdminDashboard';
import BarberScheduleManagement from './pages/BarberScheduleManagement';
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
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import AdminClientAppointments from './pages/AdminClientAppointments';
import { SidebarProvider } from './components/ui/sidebar';
import { Toaster } from './components/ui/toaster';
import ChangePassword from './pages/ChangePassword';
import ForceSignOutUser from './pages/admin/ForceSignOutUser';
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000, // 30 minutos - dados frescos por mais tempo
      gcTime: 60 * 60 * 1000, // 60 minutos - mantém em cache por 1 hora
      refetchOnWindowFocus: false, // Não refaz requisição ao focar janela
      refetchOnMount: false, // Não refaz requisição ao montar se tiver cache
      refetchOnReconnect: true, // Refaz ao reconectar
      retry: 2, // Tenta 2 vezes em caso de erro
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Delay exponencial
    },
    mutations: {
      retry: 1, // Tenta 1 vez em caso de erro em mutations
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
          <Routes>
            {/* Rotas públicas SEM AuthProvider */}
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Todas as outras rotas COM AuthProvider */}
            <Route path="/*" element={
              <AuthProvider>
                <PWAUpdateManager />
                <PermissionsProvider>
                  <PainelClienteAuthProvider>
                    <TotemAuthProvider>
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
                  <Route path="/admin/configuracoes/sessoes" element={
                    <AdminRoute requiredModule="configuracoes">
                      <SessionsManagement />
                    </AdminRoute>
                  } />
                  <Route path="/admin/gerenciar-sessoes" element={
                    <AdminRoute requiredModule="configuracoes">
                      <ForceSignOutUser />
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
                  
                  {/* Barber Routes - Nested routing igual ao Painel Cliente */}
                  <Route path="/barbeiro/login" element={
                    <AdminRedirectGuard>
                      <BarberAuth />
                    </AdminRedirectGuard>
                  } />
                  
                  <Route path="/barbeiro" element={
                    <AdminRedirectGuard>
                      <BarberRoute allowBarber={true}>
                        <BarberLayout />
                      </BarberRoute>
                    </AdminRedirectGuard>
                  }>
                    <Route path="dashboard" element={<BarberDashboard />} />
                    <Route path="agendamentos" element={<BarberAppointments />} />
                    <Route path="comissoes" element={<BarberCommissions />} />
                    <Route path="horarios" element={<BarberScheduleManagement />} />
                    <Route path="agenda" element={<BarberSchedule />} />
                    <Route path="perfil" element={<BarberProfile />} />
                    <Route path="admin" element={<BarberAdminDashboard />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>

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
                  <Route path="/painel-cliente/confirmar-email" element={
                    <AdminRedirectGuard>
                      <PainelClienteEmailConfirmation />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/painel-cliente/email-confirmado" element={
                    <AdminRedirectGuard>
                      <PainelClienteEmailConfirmed />
                    </AdminRedirectGuard>
                  } />
                  <Route path="/painel-cliente/forgot-password" element={
                    <AdminRedirectGuard>
                      <ForgotPassword />
                    </AdminRedirectGuard>
                  } />
                  
                  <Route path="/painel-cliente" element={
                    <AdminRedirectGuard>
                      <ClientRoute>
                        <PainelClienteLayout />
                      </ClientRoute>
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
                <PWAUpdateManager />
                <Toaster />
                      </div>
                    </RealtimeProvider>
                  </TotemAuthProvider>
                </PainelClienteAuthProvider>
              </PermissionsProvider>
            </AuthProvider>
          } />
        </Routes>
          </QueryClientProvider>
        </BrowserRouter>
      </SidebarProvider>
    </ErrorBoundary>
  );
}

export default App;

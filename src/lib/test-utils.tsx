import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock do Supabase para testes
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
};

// Provider de teste que envolve todos os providers necessários
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Função customizada de render que inclui todos os providers
const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: TestProviders, ...options });

// Utilitários para mocking
export const createMockAppointment = (overrides = {}) => ({
  id: 'test-appointment-1',
  client_id: 'test-client-1',
  staff_id: 'test-barber-1',
  service_id: 'test-service-1',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:00:00Z',
  status: 'scheduled',
  notes: 'Test appointment',
  client: {
    id: 'test-client-1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '11999999999',
  },
  barber: {
    id: 'test-barber-1',
    name: 'Carlos Barbeiro',
    email: 'carlos@email.com',
    specialties: ['Corte', 'Barba'],
  },
  service: {
    id: 'test-service-1',
    name: 'Corte + Barba',
    price: 50,
    duration: 60,
  },
  ...overrides,
});

export const createMockCommission = (overrides = {}) => ({
  id: 'test-commission-1',
  barber_id: 'test-barber-1',
  appointment_id: 'test-appointment-1',
  amount: 25,
  commission_rate: 50,
  status: 'pending',
  created_at: '2024-01-15T10:00:00Z',
  staff: {
    id: 'test-barber-1',
    name: 'Carlos Barbeiro',
  },
  ...overrides,
});

// Re-exportar tudo do testing-library
export * from '@testing-library/react';
export * from '@testing-library/dom';
export { customRender as render, mockSupabase };

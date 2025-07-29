import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { createMockCommission } from '@/lib/test-utils';
import ComissoesTab from '../ComissoesTab';

// Mock do React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockUseQuery = require('@tanstack/react-query').useQuery;
const mockUseMutation = require('@tanstack/react-query').useMutation;

describe('ComissoesTab', () => {
  const mockFilters = {
    mes: 1,
    ano: 2024,
    tipo: 'todos',
    barbeiro: 'todos',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das queries
    mockUseQuery
      .mockReturnValueOnce({
        data: [
          createMockCommission(),
          createMockCommission({
            id: 'test-commission-2',
            status: 'paid',
            amount: 30,
          }),
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: {
          'Carlos Barbeiro': {
            total: 55,
            pago: 30,
            pendente: 25,
          },
        },
      });

    // Mock da mutation
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('should render commission stats correctly', () => {
    render(<ComissoesTab filters={mockFilters} />);

    expect(screen.getByText('Carlos Barbeiro')).toBeInTheDocument();
    expect(screen.getByText('R$ 55,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument();
  });

  it('should render commission list', () => {
    render(<ComissoesTab filters={mockFilters} />);

    expect(screen.getByText('Comissões Detalhadas')).toBeInTheDocument();
    expect(screen.getAllByText('Carlos Barbeiro')).toHaveLength(2); // Uma no card de stats, uma na lista
  });

  it('should handle commission payment', async () => {
    const mockMutate = jest.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<ComissoesTab filters={mockFilters} />);

    // Encontrar e clicar no botão de pagar
    const payButton = screen.getByText('Pagar');
    fireEvent.click(payButton);

    // Verificar se o modal abriu
    await waitFor(() => {
      expect(screen.getByText('Pagar Comissão')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<ComissoesTab filters={mockFilters} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show empty state when no commissions', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: {},
      });

    render(<ComissoesTab filters={mockFilters} />);

    expect(screen.getByText('Nenhuma comissão encontrada para o período selecionado.')).toBeInTheDocument();
  });
});


import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createMockAppointment } from '@/lib/test-utils';
import BarberAppointments from '../BarberAppointments';

// Mock do hook principal
jest.mock('@/hooks/barber/useBarberAppointmentsOptimized', () => ({
  useBarberAppointmentsOptimized: () => ({
    appointments: [
      createMockAppointment(),
      createMockAppointment({
        id: 'test-appointment-2',
        status: 'completed',
        start_time: '2024-01-15T14:00:00Z',
      }),
    ],
    loading: false,
    stats: {
      total: 2,
      completed: 1,
      upcoming: 1,
      revenue: 50,
    },
    updatingId: null,
    fetchAppointments: jest.fn(),
    handleCompleteAppointment: jest.fn(),
    handleCancelAppointment: jest.fn(),
    isEditModalOpen: false,
    selectedAppointmentId: '',
    selectedAppointmentDate: new Date(),
    handleEditAppointment: jest.fn(),
    closeEditModal: jest.fn(),
  }),
}));

// Mock dos componentes filhos
jest.mock('../appointments/AppointmentCard', () => {
  return function MockAppointmentCard({ appointment, onComplete, onCancel }: any) {
    return (
      <div data-testid={`appointment-${appointment.id}`}>
        <span>{appointment.client.name}</span>
        <span>{appointment.service.name}</span>
        <button onClick={() => onComplete(appointment.id)}>Concluir</button>
        <button onClick={() => onCancel(appointment.id)}>Cancelar</button>
      </div>
    );
  };
});

jest.mock('../appointments/EditAppointmentModal', () => {
  return function MockEditAppointmentModal({ isOpen, onClose }: any) {
    return isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Fechar</button>
      </div>
    ) : null;
  };
});

describe('BarberAppointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render appointments correctly', () => {
    render(<BarberAppointments />);

    expect(screen.getByTestId('appointment-test-appointment-1')).toBeInTheDocument();
    expect(screen.getByTestId('appointment-test-appointment-2')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Corte + Barba')).toBeInTheDocument();
  });

  it('should display correct stats', () => {
    render(<BarberAppointments />);

    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    expect(screen.getByText('Concluídos: 1')).toBeInTheDocument();
    expect(screen.getByText('Próximos: 1')).toBeInTheDocument();
    expect(screen.getByText('Receita: R$ 50')).toBeInTheDocument();
  });

  it('should handle appointment completion', async () => {
    const mockHandleComplete = jest.fn();
    
    render(<BarberAppointments />);
    
    const completeButton = screen.getAllByText('Concluir')[0];
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockHandleComplete).toHaveBeenCalledWith('test-appointment-1');
    });
  });

  it('should handle appointment cancellation', async () => {
    const mockHandleCancel = jest.fn();
    
    render(<BarberAppointments />);
    
    const cancelButton = screen.getAllByText('Cancelar')[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockHandleCancel).toHaveBeenCalledWith('test-appointment-1');
    });
  });

  it('should show loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/barber/useBarberAppointmentsOptimized', () => ({
      useBarberAppointmentsOptimized: () => ({
        loading: true,
        appointments: [],
        stats: { total: 0, completed: 0, upcoming: 0, revenue: 0 },
      }),
    }));

    render(<BarberAppointments />);
    
    expect(screen.getByTestId('appointment-skeleton')).toBeInTheDocument();
  });
});

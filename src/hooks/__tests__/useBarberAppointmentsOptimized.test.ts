
import { renderHook, act } from '@testing-library/react';
import { useBarberAppointmentsOptimized } from '../barber/useBarberAppointmentsOptimized';
import { createMockAppointment, mockSupabase } from '@/lib/test-utils';

// Mock dos hooks dependentes
jest.mock('../useAppointmentSync', () => ({
  useAppointmentSync: jest.fn(),
}));

jest.mock('../barber/useBarberData', () => ({
  useBarberData: () => ({
    barberData: { id: 'test-barber-1', name: 'Carlos' },
    isLoading: false,
  }),
}));

jest.mock('../barber/useBarberAppointmentFetch', () => ({
  useBarberAppointmentFetch: () => ({
    appointments: [createMockAppointment()],
    loading: false,
    fetchAppointments: jest.fn(),
    setAppointments: jest.fn(),
  }),
}));

jest.mock('../barber/useBarberAppointmentActions', () => ({
  useBarberAppointmentActions: () => ({
    handleCompleteAppointment: jest.fn().mockResolvedValue(true),
    handleCancelAppointment: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('../barber/useBarberAppointmentStats', () => ({
  useBarberAppointmentStats: () => ({
    total: 1,
    completed: 0,
    upcoming: 1,
    revenue: 0,
  }),
}));

jest.mock('../barber/useBarberAppointmentModal', () => ({
  useBarberAppointmentModal: () => ({
    isEditModalOpen: false,
    selectedAppointmentId: '',
    selectedAppointmentDate: new Date(),
    handleEditAppointment: jest.fn(),
    closeEditModal: jest.fn(),
  }),
}));

describe('useBarberAppointmentsOptimized', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all required properties and functions', () => {
    const { result } = renderHook(() => useBarberAppointmentsOptimized());

    expect(result.current).toHaveProperty('appointments');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('updatingId');
    expect(result.current).toHaveProperty('fetchAppointments');
    expect(result.current).toHaveProperty('handleCompleteAppointment');
    expect(result.current).toHaveProperty('handleCancelAppointment');
    expect(result.current).toHaveProperty('isEditModalOpen');
    expect(result.current).toHaveProperty('selectedAppointmentId');
    expect(result.current).toHaveProperty('selectedAppointmentDate');
    expect(result.current).toHaveProperty('handleEditAppointment');
    expect(result.current).toHaveProperty('closeEditModal');
  });

  it('should handle appointment completion with optimistic updates', async () => {
    const { result } = renderHook(() => useBarberAppointmentsOptimized());

    await act(async () => {
      await result.current.handleCompleteAppointment('test-appointment-1');
    });

    expect(result.current.updatingId).toBe(null);
  });

  it('should handle appointment cancellation with optimistic updates', async () => {
    const { result } = renderHook(() => useBarberAppointmentsOptimized());

    await act(async () => {
      await result.current.handleCancelAppointment('test-appointment-1');
    });

    expect(result.current.updatingId).toBe(null);
  });

  it('should provide correct stats for appointments', () => {
    const { result } = renderHook(() => useBarberAppointmentsOptimized());

    expect(result.current.stats).toEqual({
      total: 1,
      completed: 0,
      upcoming: 1,
      revenue: 0,
    });
  });
});
